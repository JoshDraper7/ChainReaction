from .command import Command
from ..database_access.sql_model.sql_model_database_service import SQLModelDatabaseService
from ..models.models import Game, GamePlayer, Player
from .exceptions.exceptions import PlayerAlreadyInGameError, GameNotFoundError, GameAlreadyStartedError, PlayerNotFoundError
from ..utils.datetime_helper import datetime_now

from typing import override
from sqlmodel import select, col, and_, update, insert

class NoPlayers(Exception):
    pass

class JoinGameCommand(Command):

    def __init__(self, database_service: SQLModelDatabaseService) -> None:
        super().__init__()
        self.database_service = database_service

    @override
    def execute(self, game_code: str, player_id: str) -> tuple[str, bool]:
        game= self._get_game(game_code)
        _ = self._get_player_id(player_id)
        try:
            self._validate_player_not_already_in_game(game.id, player_id)
            newest_game_player = self._get_newest_game_player(game.id)
            if game.started:
                raise GameAlreadyStartedError()
            self._update_add_player(game.id, player_id, newest_game_player)
        except NoPlayers:
            self._create_head_player(game.id, player_id)
        except PlayerAlreadyInGameError:
            return game.id, True
        return game.id, False

    def _create_head_player(self, game_id: str, player_id: str) -> None:
        stmt = insert(GamePlayer).values({
            "game_id": game_id, 
            "player_id": player_id, 
            "created_at": datetime_now(),
            "modified_at": datetime_now()
        })
        self.database_service.execute(stmt)

    def _update_add_player(self, game_id: str, to_add_player_id: str, newest_player: GamePlayer) -> None:
        insert_new = insert(GamePlayer).values({
            "game_id": game_id, 
            "player_id": to_add_player_id, 
            "created_at": datetime_now(),
            "modified_at": datetime_now()
        })
        self.database_service.execute_many([insert_new])

    def _get_newest_game_player(self, game_id: str) -> GamePlayer:
        stmt = (
            select(GamePlayer)
            .select_from(GamePlayer)
            .where(
                and_(
                    col(GamePlayer.game_id) == game_id
                )
            ) 
        )
        result = self.database_service.select(stmt)
        if len(result) == 0:
            raise NoPlayers()
        newest_game_player = sorted(result, key=lambda gp: gp.created_at, reverse=True)[0]
        return newest_game_player
    
    def _validate_player_not_already_in_game(self, game_id: str, player_id: str) -> None:
        stmt = select(GamePlayer).where(
            col(GamePlayer.player_id) == player_id,
        ).where(col(GamePlayer.game_id) == game_id)
        players = self.database_service.select(stmt)
        if len(players) > 0:
            raise PlayerAlreadyInGameError()
    
    def _get_player_id(self, player_id: str) -> str:
        stmt = select(col(Player.id)).where(
            col(Player.id) == player_id,
        )
        players = self.database_service.select(stmt)
        if len(players) == 0:
            raise PlayerNotFoundError()
        return players[0]

    def _get_game(self, game_code: str) -> Game:
        stmt = select(Game).where(
            and_(
                col(Game.code) == game_code
            ) 
        )
        games = self.database_service.select(stmt)
        if len(games) == 0:
            raise GameNotFoundError()
        return games[0]