from abc import ABC, abstractmethod
from typing import ContextManager

class UnitOfWork(ContextManager["UnitOfWork"], ABC):
    """
    Defines the Unit of Work contract.
    """

    def __enter__(self) -> "UnitOfWork":
        return self

    def __exit__(self, exc_type, exc_value, traceback) -> None: # type: ignore
        self.rollback()

    @abstractmethod
    def commit(self) -> None:
        ...

    @abstractmethod
    def rollback(self) -> None:
        ...
