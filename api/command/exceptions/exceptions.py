from http import HTTPStatus


class CommandError(Exception):
    message: str
    status_code: int

    def __init__(self, message: str | None = None):
        if message:
            self.message = message
        super().__init__(self.message)

    def __str__(self) -> str:
        return self.message


class PlayerAlreadyInGameError(CommandError):
    message = "Player already in game."
    status_code = HTTPStatus.CONFLICT  # 409


class GameNotFoundError(CommandError):
    message = "Game not found."
    status_code = HTTPStatus.NOT_FOUND  # 404


class GameAlreadyStartedError(CommandError):
    message = "Game has already started."
    status_code = HTTPStatus.CONFLICT  # 409


class PlayerNotFoundError(CommandError):
    message = "Player not found."
    status_code = HTTPStatus.NOT_FOUND  # 404


class GenerateCodeError(CommandError):
    message = "Failed to generate game code."
    status_code = HTTPStatus.INTERNAL_SERVER_ERROR  # 500


class GameCompleteError(CommandError):
    message = "Game is already complete."
    status_code = HTTPStatus.CONFLICT  # 409


class GameNotStartedError(CommandError):
    message = "Game has not started yet."
    status_code = HTTPStatus.BAD_REQUEST  # 400


class NoGameStateError(CommandError):
    message = "Game state not found."
    status_code = HTTPStatus.NOT_FOUND  # 404


class NoHeadPlayerError(CommandError):
    message = "No head player found."
    status_code = HTTPStatus.INTERNAL_SERVER_ERROR  # 500


class NotPlayersTurnError(CommandError):
    message = "It is not the player's turn."
    status_code = HTTPStatus.FORBIDDEN  # 403


class CellIncrementError(CommandError):
    message = "Unable to increment cell."
    status_code = HTTPStatus.BAD_REQUEST  # 400
