
from abc import ABC
import structlog

from .api_comm.response_types import (
    PlayerAddedResponse,
    CreateGameResponse,
    JoinGameResponse,
    StartGameResponse
)
from .command.get_player_id_command import GetPlayerIDCommand
from .command.create_game_command import CreateGameCommand
from .command.join_game_command import JoinGameCommand
from .command.start_game_command import StartGameCommand
from .database_access.sql_model.sql_model_database_service import SQLModelDatabaseService


logger = structlog.get_logger()


class GameAPI(ABC):
    def __init__(self, database_service: SQLModelDatabaseService) -> None:
        self.database_service = database_service

    # @abstractmethod
    # def _notify_players_game_end(self, game_id: str) -> None:
    #     raise NotImplementedError()
    
    # @abstractmethod
    # def _notify_players_game_start(self, game_id: str) -> None:
    #     raise NotImplementedError()
    
    def _get_player_id(self, email: str, name: str) -> PlayerAddedResponse:
        player_id = GetPlayerIDCommand(self.database_service).execute(email, name)
        return PlayerAddedResponse(message="success", player_id=player_id, response_type='get_player_id')

    def _create_game(self, player_id: str, board_width: int, board_height: int) -> CreateGameResponse:
        new_game_id, game_code = CreateGameCommand(self.database_service).execute(board_width, board_height)
        _ = self._join_game(game_code, player_id)
        return CreateGameResponse(game_id=new_game_id, game_code=game_code, message="success", response_type="create_game")
    
    def _join_game(self, game_code: str, player_id: str) -> JoinGameResponse:
        game_id, already_in_game = JoinGameCommand(self.database_service).execute(game_code, player_id)
        return JoinGameResponse(game_id=game_id, game_code=game_code, message="success", already_joined=already_in_game, response_type="join_game")
    
    def _start_game(self, game_id: str) -> StartGameResponse:
        StartGameCommand(self.database_service).execute(game_id)
        return StartGameResponse(message="success", response_type="start_game")
    