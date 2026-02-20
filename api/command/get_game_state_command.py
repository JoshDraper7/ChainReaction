from .command import Command
from ..database_access.sql_model.sql_model_database_service import SQLModelDatabaseService
from ..models.models import Game, GameState, GamePlayer
from .exceptions.exceptions import (
    GameCompleteError, 
    GameNotFoundError, 
    GameNotStartedError, 
    NoGameStateError, 
    PlayerNotFoundError, 
    NoHeadPlayerError
)

from sqlmodel import update, select, col, and_, insert, desc
from sqlalchemy import func


class GetGameStateCommand(Command):

    def __init__(self, database_service: SQLModelDatabaseService) -> None:
        super().__init__()
        self.database_service = database_service

    def execute(self, game_id: str, player_id: str) -> tuple[str, bool, int, int]:
        game = self._validate_game(game_id)
        self._validate_player(player_id, game_id)
        player_order_num, num_players = self._get_player_order_num(game_id, player_id)
        game_state = self._get_current_game_state(game_id)
        players_turn = (game.turn_count % num_players) == player_order_num
        return game_state.state, players_turn, player_order_num, num_players

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
    
    def _validate_player(self, player_id: str, game_id: str) -> None:
        stmt = select(GamePlayer).where(
            and_(
                col(GamePlayer.player_id) == player_id,
                col(GamePlayer.game_id) == game_id
            ) 
        )
        players = self.database_service.select(stmt)
        if len(players) == 0:
            raise PlayerNotFoundError()
    
    def _validate_game(self, game_id: str) -> Game:
        stmt = select(Game).where(
            and_(
                col(Game.id) == game_id
            ) 
        )
        games = self.database_service.select(stmt)
        if len(games) == 0:
            raise GameNotFoundError()
        if games[0].started == False:
            raise GameNotStartedError()
        return games[0]