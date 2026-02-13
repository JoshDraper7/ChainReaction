from sqlmodel import Session

from ..base.unit_of_work import UnitOfWork

class SQLModelUnitOfWork(UnitOfWork):
    def __init__(self, session: Session) -> None:
        self.session = session

    def __enter__(self) -> "SQLModelUnitOfWork":
        return self

    def __exit__(self, exc_type, exc_value, traceback) -> None: # type: ignore
        if exc_type:
            self.rollback()
        else:
            try:
                self.commit()
            except Exception:
                self.rollback()
                raise
        self.session.close()

    def commit(self) -> None:
        if self.session:
            self.session.commit()

    def rollback(self) -> None:
        if self.session:
            self.session.rollback()
