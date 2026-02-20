from .command import Command
from ..database_access.sql_model.sql_model_database_service import SQLModelDatabaseService
from ..models.models import Game, GameState, GamePlayer, Player
from ..utils.datetime_helper import datetime_now
from .exceptions.exceptions import GameAlreadyStartedError, GameNotFoundError, GameCompleteError, NoGameStateError, PlayerNotFoundError
from .game_logic.board import Board

from sqlmodel import update, select, col, and_, desc
from sqlalchemy import func
from uuid import uuid4


class CompleteGameCommand(Command):

    def __init__(self, database_service: SQLModelDatabaseService) -> None:
        super().__init__()
        self.database_service = database_service

    def execute(self, game_id: str, player_id: str) -> tuple[bool, str | None]:
        game = self._validate_game(game_id)
        player = self._validate_player(player_id, game_id)
        game_state = self._get_current_game_state(game_id)
        game_complete, _ = self._check_game_end(game, player_id, game_state)
        if game_complete:
            self._update_game_to_complete(game_id)
            return True, player.name
        return False, None

    def _get_current_game_state(self, game_id: str) -> GameState:
        stmt = (
            select(GameState)
            .where(col(GameState.game_id) == game_id)
            .order_by(desc(GameState.created_at))
            .limit(1)
        )
        game_state = self.database_service.select(stmt)
        if len(game_state) == 0:
            raise NoGameStateError()
        return game_state[0]
    
    def _check_game_end(self, game: Game, player_id: str, game_state: GameState) -> tuple[bool, int | None]:
        player_turn_number, total_game_players = self._get_player_order_num(game.id, player_id)
        if game.turn_count <= total_game_players:
            return False, None
        board = Board.deserialize(game_state.state)
        if board.is_complete():
            return True, player_turn_number
        return False, None
        
    def _get_player_order_num(self, game_id: str, player_id: str) -> tuple[int, int]:
        ranked_subq = (
            select(
                GamePlayer.game_id,
                GamePlayer.player_id,
                (
                    func.row_number()
                    .over(
                        partition_by=GamePlayer.game_id,
                        order_by=GamePlayer.created_at
                    ) - 1
                ).label("player_index"),
                func.count()
                .over(
                    partition_by=GamePlayer.game_id
                )
                .label("total_players")
            )
            .subquery()
        )

        stmt = (
            select(
                ranked_subq.c.player_index,
                ranked_subq.c.total_players
            )
            .where(
                ranked_subq.c.game_id == game_id,
                ranked_subq.c.player_id == player_id
            )
        )

        result = self.database_service.select(stmt)
        if len(result) == 0:
            raise PlayerNotFoundError()
        return result[0]

    def _update_game_to_complete(self, game_id: str) -> None:
        stmt = update(Game).where(col(Game.id) == game_id).values({
            "complete": True,
            "modified_at": datetime_now()
        })
        self.database_service.execute(stmt)

    def _validate_player(self, player_id: str, game_id: str) -> Player:
        stmt = (
            select(Player)
            .select_from(GamePlayer)
            .join(Player, col(GamePlayer.player_id) == col(Player.id))
            .where(
                and_(
                    col(GamePlayer.player_id) == player_id,
                    col(GamePlayer.game_id) == game_id
                ) 
            )
        )
        players = self.database_service.select(stmt)
        if len(players) == 0:
            raise PlayerNotFoundError()
        return players[0]
    
    def _validate_game(self, game_id: str) -> Game:
        stmt = select(Game).where(
            and_(
                col(Game.id) == game_id
            ) 
        )
        games = self.database_service.select(stmt)
        if len(games) == 0:
            raise GameNotFoundError()
        if games[0].complete == True:
            raise GameCompleteError()
        return games[0]