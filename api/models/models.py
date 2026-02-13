from typing import Any
from sqlmodel import SQLModel, Field, create_engine
from datetime import datetime
from uuid import uuid4
import os
from dotenv import load_dotenv

load_dotenv(override=True)


class Game(SQLModel, table=True):
    __tablename__ = 'GAME'

    id: str = Field(default=str(uuid4()), primary_key=True)
    code: str = Field(nullable=False)
    board_width: int = Field(nullable=False)
    board_height: int = Field(nullable=False)
    started: bool = Field(default=False, nullable=False)
    complete: bool = Field(default=False, nullable=False)
    turn_count: int = Field(default=0, nullable=False)
    created_at: datetime = Field(nullable=False)
    modified_at: datetime = Field(nullable=False)

class GameState(SQLModel, table=True):
    __tablename__ = "GAME_STATE"

    id: str = Field(default=str(uuid4()), primary_key=True)
    game_id: str = Field(nullable=False, foreign_key='GAME.id')
    state: str = Field(nullable=False)
    created_at: datetime = Field(nullable=False)

class GamePlayer(SQLModel, table=True):
    __tablename__ = 'GAME_PLAYER'

    game_id: str = Field(primary_key=True, foreign_key='GAME.id')
    player_id: str = Field(primary_key=True, foreign_key='PLAYER.id')
    next_player_id: str = Field(nullable=False, foreign_key='PLAYER.id')
    prev_player_id: str = Field(nullable=False, foreign_key=f'PLAYER.id')
    is_head: bool = Field(nullable=False, default=False)
    modified_at: datetime = Field(nullable=False)
    created_at: datetime = Field(nullable=False)

class Player(SQLModel, table=True):
    __tablename__ = 'PLAYER'

    id: str = Field(default=str(uuid4()), primary_key=True)
    name: str
    email: str = Field(unique=True, nullable=False)
    created_at: datetime = Field(nullable=False)
    modified_at: datetime = Field(nullable=False)

    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, Player):
            return False
        return self.id == other.id
    
    def __hash__(self) -> int:
        return hash(self.id)


if __name__ == "__main__":
    url = os.environ['DATABASE_URL']
    SQLModel.metadata.create_all(create_engine(url, echo=True))