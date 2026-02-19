
from abc import ABC, abstractmethod
import structlog

from .api_comm.response_types import (
    PlayerAddedResponse,
    CreateGameResponse,
    JoinGameResponse,
    StartGameResponse,
    GetGameStateResponse,
    IncrementCellResponse
)
from .command.get_player_id_command import GetPlayerIDCommand
from .command.create_game_command import CreateGameCommand
from .command.join_game_command import JoinGameCommand
from .command.start_game_command import StartGameCommand
from .command.get_game_state_command import GetGameStateCommand
from .command.increment_cell_command import IncrementCellCommand
from .database_access.sql_model.sql_model_database_service import SQLModelDatabaseService


logger = structlog.get_logger()


class GameAPI(ABC):
    def __init__(self, database_service: SQLModelDatabaseService) -> None:
        self.database_service = database_service

    def _notify_players_of_new_state(self, intermittent_states: list[str]) -> None:
        # Default implementation is empty
        pass

    def _notify_players_of_game_start(self) -> None:
        # Default implementation is empty
        pass
    
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
        self._notify_players_of_game_start()
        return StartGameResponse(message="success", response_type="start_game")
    
    def _get_game_state(self, game_id: str, player_id: str) -> GetGameStateResponse:
        game_state, players_turn, player_turn_number, num_players = GetGameStateCommand(self.database_service).execute(game_id, player_id)
        return GetGameStateResponse(
            game_state=game_state, 
            players_turn=players_turn,
            player_turn_number=player_turn_number,
            num_players=num_players, 
            message="success", 
            response_type="get_game_state"
        )
    
    def _increment_cell(self, game_id: str, player_id: str, row: int, col: int) -> IncrementCellResponse:
        intermittent_states = IncrementCellCommand(self.database_service).execute(game_id, player_id, row, col)
        self._notify_players_of_new_state(intermittent_states)
        return IncrementCellResponse(intermittent_states=intermittent_states, message="success", response_type="increment_cell")
    