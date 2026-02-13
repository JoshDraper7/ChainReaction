from typing import TypedDict

class ResponseData(TypedDict):
    message: str
    response_type: str

class StartGameResponse(ResponseData):
    pass

class ErrorResponse(ResponseData):
    error: str

class PlayerAddedResponse(ResponseData):
    player_id: str

class CreateGameResponse(ResponseData):
    game_id: str
    game_code: str

class JoinGameResponse(ResponseData):
    game_id: str
    game_code: str
    already_joined: bool

