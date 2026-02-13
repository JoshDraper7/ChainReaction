from .command import Command
from ..database_access.sql_model.sql_model_database_service import SQLModelDatabaseService
from ..models.models import Game
from ..utils.datetime_helper import datetime_now
from .exceptions.exceptions import GenerateCodeError

from sqlmodel import insert, select, col, and_
from uuid import uuid4
import random
import string

def generate_game_code(length: int = 8) -> str:
    all_chars = string.ascii_uppercase + string.digits
    confusing_chars = "0O1IL5S8B"
    safe_chars = ''.join(c for c in all_chars if c not in confusing_chars)
    code = "".join(random.choices(safe_chars, k=length))
    return code

class CreateGameCommand(Command):

    def __init__(self, database_service: SQLModelDatabaseService) -> None:
        super().__init__()
        self.database_service = database_service

    def execute(self, board_width: int, board_height: int) -> tuple[str, str]:
        id = str(uuid4())
        code = self._generate_unique_game_code()
        query = insert(Game).values(
            id=id, 
            code=code,
            board_width=board_width,
            board_height=board_height,
            created_at=datetime_now(),
            modified_at=datetime_now()
        )
        self.database_service.execute(query)
        return id, code

    def _generate_unique_game_code(self) -> str:
        generated_code = None
        for _ in range(0, 10):
            temp_code = generate_game_code().upper()
            stmt = select(col(Game.code)).select_from(Game).where(
                and_(
                    col(Game.code) == temp_code
                )
            )
            codes = self.database_service.select(stmt)
            if len(codes) == 0:
                generated_code = temp_code
                break
        if generated_code is None:
            raise GenerateCodeError("Could not generate unique code")
        return generated_code