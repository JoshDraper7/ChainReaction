from .command import Command
from ..database_access.sql_model.sql_model_database_service import SQLModelDatabaseService
from ..models.models import Game, GameState
from ..utils.datetime_helper import datetime_now
from .exceptions.exceptions import GameAlreadyStartedError, GameNotFoundError, GameCompleteError
from .game_logic.board import Board

from sqlmodel import update, select, col, and_, insert
import random
import string


class StartGameCommand(Command):

    def __init__(self, database_service: SQLModelDatabaseService) -> None:
        super().__init__()
        self.database_service = database_service

    def execute(self, game_id: str) -> None:
        game = self._validate_game(game_id)
        board = self._build_board(game)
        self._save_init_board_state(board, game)
        self._update_game_to_started(game_id)

    def _build_board(self, game: Game) -> Board:
        return Board(game.board_width, game.board_height)
    
    def _save_init_board_state(self, board: Board, game: Game) -> None:
        board_state = board.serialize()
        stmt = insert(GameState).values({
            "game_id": game.id,
            "state": board_state,
            "created_at": datetime_now()
        })
        self.database_service.execute(stmt)

    def _update_game_to_started(self, game_id):
        stmt = update(Game).where(col(Game.id) == game_id).values({
            "started": True,
            "modified_at": datetime_now()
        })
        self.database_service.execute(stmt)
    
    def _validate_game(self, game_id: str) -> Game:
        stmt = select(Game).where(
            and_(
                col(Game.id) == game_id
            ) 
        )
        games = self.database_service.select(stmt)
        if len(games) == 0:
            raise GameNotFoundError()
        if games[0].started == True:
            raise GameAlreadyStartedError()
        if games[0].complete == True:
            raise GameCompleteError()
        return games[0]