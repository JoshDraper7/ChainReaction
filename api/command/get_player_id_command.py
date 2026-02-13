from .command import Command
from ..database_access.sql_model.sql_model_database_service import SQLModelDatabaseService
from ..models.models import Player
from ..utils.datetime_helper import datetime_now

from sqlmodel import insert, select, col
from uuid import uuid4


class GetPlayerIDCommand(Command):

    def __init__(self, database_service: SQLModelDatabaseService) -> None:
        super().__init__()
        self.database_service = database_service

    def execute(self, email: str, name: str) -> str:
        if self._is_new_email(email):
            return self._create_new_player(email, name)
        else:
            return self._get_player_id(email)
        
    def _get_player_id(self, email: str) -> str:
        stmt = select(col(Player.id)).where(
            col(Player.email) == email
        )
        return self.database_service.select(stmt)[0]

    def _create_new_player(self, email: str, name: str) -> str:
        id = str(uuid4())
        query = insert(Player).values(
            id=id, 
            name=name,
            email=email,
            created_at=datetime_now(),
            modified_at=datetime_now()
        )
        self.database_service.execute(query)
        return id
    
    def _is_new_email(self, email: str) -> bool:
        stmt = select(Player).where(
            col(Player.email) == email
        )
        players = self.database_service.select(stmt)
        return len(players) == 0