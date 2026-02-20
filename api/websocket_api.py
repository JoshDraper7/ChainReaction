from .game_api import GameAPI
from .database_access.sql_model.sql_model_database_service import SQLModelDatabaseService

from typing import override, Optional, Any, TypedDict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Response
from functools import wraps
from pydantic import BaseModel
import json
import asyncio
import traceback

from .command.exceptions.exceptions import CommandError

def websocket_response_decorator(func): # type: ignore
    @wraps(func) # type: ignore
    async def wrapper(self: 'WebsocketGameAPI', websocket: WebSocket, data: dict): # type: ignore
        
        try:
            result = await func(self, websocket, data)  # type: ignore
            print(f"Data to return: {result}")
            print()
            await websocket.send_json({"status": "success", "data": result})
        except CommandError as e:
            await websocket.send_json({"status": "error", "code": e.status_code, "message": e.message, "error": str(e), "response_type": "error"})
        except Exception as e:
            traceback.print_exc()
            await websocket.send_json({"status": "error", "code": 500, "message": "Unexpected Error", "error": traceback.format_exc(), "response_type": "error"})
    return wrapper # type: ignore

class CreateGameRequest(BaseModel):
    player_id: str 
    board_width: int
    board_height: int

class GetPlayerIDRequest(BaseModel):
    name: str
    email: str

class JoinGameRequest(BaseModel):
    game_code: str
    player_id: str

class StartGameRequest(BaseModel):
    game_id: str

class GetGameStateRequest(BaseModel):
    game_id: str
    player_id: str

class IncrementCellRequest(BaseModel):
    game_id: str
    player_id: str
    row: int
    col: int

class WebsocketConnection(TypedDict, total=False):
    websocket: WebSocket
    player_game_id: tuple[str, str]


class WebsocketGameAPI(GameAPI):

    def __init__(self, database_service: SQLModelDatabaseService, router: APIRouter):
        super().__init__(database_service)
        self.router = router
        self.active_connections: dict[str, WebSocket] = {}
        self.router.add_api_websocket_route("/ws/game", self.websocket_endpoint)

    @websocket_response_decorator
    async def handle_action(self, websocket: WebSocket, data: dict[str, Any]) -> Any:
        action = data.get("action")
        payload = data.get("payload", {})

        if action == "create_game":
            request = CreateGameRequest(**payload)
            return super()._create_game(**request.model_dump())
        elif action == "join_game":
            request = JoinGameRequest(**payload)
            response = super()._join_game(request.game_code, request.player_id)
            return response
        elif action == "start_game":
            request = StartGameRequest(**payload)
            response = super()._start_game(request.game_id)
            return response
        elif action == "get_game_state":
            request = GetGameStateRequest(**payload)
            response = super()._get_game_state(request.game_id, request.player_id)
            return response
        elif action == "increment_cell":
            request = IncrementCellRequest(**payload)
            response = super()._increment_cell(**request.model_dump())
            return response
        else:
            raise ValueError(f"Unknown action: {action}")

    async def websocket_endpoint(self, websocket: WebSocket, player_id: str = Query(...)):
        if player_id not in self.active_connections:
            print("Accepting...")
            await websocket.accept()
            self.active_connections[player_id] = websocket
        else:
            await websocket.send_denial_response(response=Response(f"Player id {player_id} already has websocket connection."))
            return

        try:
            while True:
                data = await websocket.receive_text()
                data_json = json.loads(data)
                print()
                print(f"Got request: {data_json}")
                await self.handle_action(websocket, data_json)
        except WebSocketDisconnect:
            self.active_connections.pop(player_id)
            print("Client disconnected")
        except Exception as e:
            traceback.print_exc()
            await websocket.send_json({"status": "error", "message": traceback.format_exc()})

    def _notify_players_of_new_state(self, board_actions: list[dict]) -> None:
        for _, websocket in self.active_connections.items():
            asyncio.create_task(websocket.send_json({"status": "new_game_state", "data": {"board_actions": board_actions}}))

    def _notify_players_of_game_start(self):
        for player_id, websocket in self.active_connections.items():
            asyncio.create_task(websocket.send_json({"status": "game_started", "data": {"player_id": player_id}}))

    def _notify_players_of_game_complete(self, winner_name: str):
        for player_id, websocket in self.active_connections.items():
            asyncio.create_task(websocket.send_json({"status": "game_finished", "data": {"winner": winner_name, "player_id": player_id}}))
