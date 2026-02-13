from abc import ABC, abstractmethod

from typing import Any

class DatabaseService(ABC):
    
    @abstractmethod
    def select(self, query: Any) -> Any:
        raise NotImplementedError()
    
    @abstractmethod
    def execute(self, query: Any) -> Any:
        raise NotImplementedError()
    
    @abstractmethod
    def execute_many(self, queries: list[Any]) -> list[Any]:
        raise NotImplementedError()