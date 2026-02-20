from .sql_model_unit_of_work import SQLModelUnitOfWork
from ..base.database_service import DatabaseService

from typing import Any
from sqlmodel import create_engine, Session
from sqlmodel.sql.expression import Select, SelectOfScalar
from sqlalchemy.engine.result import Result
from sqlalchemy.sql import Executable

from typing import overload, TypeVar

T = TypeVar("T", bound=Any)

class SQLModelDatabaseService(DatabaseService):

    def __init__(self, url: str) -> None:
        self._engine = create_engine(url, echo=False)

    def _get_session(self) -> Session:
        return Session(self._engine, expire_on_commit=False)
    
    @overload
    def select(self, query: Select[T]) -> list[T]: ...
    @overload
    def select(self, query: SelectOfScalar[T]) -> list[T]: ...
    def select(self, query: Select[T] | SelectOfScalar[T]) -> list[T] | list[T]:
        session = self._get_session()
        with SQLModelUnitOfWork(session):
            result = list(session.exec(query).all())
        return result
    
    def execute(self, query: Executable) -> Result[Any]:
        session = self._get_session()
        with SQLModelUnitOfWork(session):
            result = session.execute(query) # type: ignore
        return result 
    
    def execute_many(self, queries: list[Executable]) -> list[Result[Any]]:
        session = self._get_session()
        results: list[Result[Any]] = []
        with SQLModelUnitOfWork(session):
            for query in queries:
                results.append(session.execute(query)) # type: ignore
        return results
    
