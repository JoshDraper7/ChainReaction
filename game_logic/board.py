from .cell import Cell

from collections import deque
import json


class Board:

    def __init__(self, width: int = 6, height: int = 9) -> None:
        self.width = width
        self.height = height 
        self.board: list[list[Cell]] = self._init_board()

    def _init_board(self) -> list[list[Cell]]:
        board = []

        for row in range(self.height):
            current_row = []
            for col in range(self.width):
                current_row.append(self._init_cell(row, col))
            board.append(current_row)

        return board

    def _init_cell(self, row: int, col: int) -> Cell:
        max_count = 3

        # Left or right edge
        if col == 0 or col == self.width - 1:
            max_count -= 1

        # Top or bottom edge
        if row == 0 or row == self.height - 1:
            max_count -= 1

        return Cell(max_count=max_count)

    def inc_cell_count(self, row: int, col: int, color: int) -> bool:
        cell = self.board[row][col]

        if cell.get_color() is None or cell.get_color() == color:
            cell.change_color(color)
            board_states: list[str] = []
            self._increment_cell(row, col, color, board_states)
            return True

        return False

    def _increment_cell(self, row: int, col: int, color: int, board_states: list[str]) -> None:
        queue = deque()
        queue.append((row, col))

        while queue:
            crow, ccol = queue.popleft()

            # ✅ Correct boundary check
            if crow < 0 or crow >= self.height:
                continue
            if ccol < 0 or ccol >= self.width:
                continue

            cell: Cell = self.board[crow][ccol]
            cell.change_color(color)
            exploded = cell.inc_count()

            board_states.append(self.serialize())

            if exploded:
                cell.change_color(None)

                # increment neighbors
                queue.append((crow + 1, ccol))
                queue.append((crow - 1, ccol))
                queue.append((crow, ccol + 1))
                queue.append((crow, ccol - 1))

    def serialize(self) -> str:
        board_json = [
            [cell.to_dict() for cell in row]
            for row in self.board
        ]
        return json.dumps(board_json)
