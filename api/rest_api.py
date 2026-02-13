from typing import override, Optional
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from fastapi import status
from pydantic import BaseModel
from functools import wraps

from .database_access.sql_model.sql_model_database_service import SQLModelDatabaseService
from .game_api import GameAPI
from .api_comm.response_types import (
    ErrorResponse,
    ResponseData,
    PlayerAddedResponse
)


def success(content: ResponseData) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=content
    ) 
    
def not_success(response_code: int, content: ResponseData) -> JSONResponse:
    return JSONResponse(
        status_code=response_code,
        content=content
    )

def response_decorator(func): # type: ignore
    @wraps(func) # type: ignore
    def wrapper(self: "PollingGameAPI", *args, **kwargs) -> JSONResponse: # type: ignore
        try: 
            result = func(self, *args, **kwargs) # type: ignore
            return success(content=result) # type: ignore
        except Exception as e:
            raise e
            return not_success(
                response_code=500,
                content=ErrorResponse(message="Unexpected Error", error=str(e), response_type="error"),
            )
    return wrapper # type: ignore


class GetPlayerIDRequest(BaseModel):
    name: str
    email: str


class RestAPI(GameAPI):

    def __init__(self, database_service: SQLModelDatabaseService, router: APIRouter) -> None:
        super().__init__(database_service)
        self.router = router
        self.router.add_api_route("/get-player-id", self._get_player_id_endpoint, methods=["POST"])
    
    @response_decorator
    def _get_player_id_endpoint(self, create_player_submission: GetPlayerIDRequest) -> PlayerAddedResponse:
        return super()._get_player_id(**create_player_submission.model_dump())
