from .cell import Cell

from collections import deque
import json
from typing import TypedDict, Literal

class BoardAction(TypedDict):
    row: int
    col: int
    action: Literal['increment', 'exploded']
    color: int

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

    def inc_cell_count(self, row: int, col: int, color: int) -> list[BoardAction] | None:
        cell = self.board[row][col]

        if cell.get_color() is None or cell.get_color() == color:
            cell.change_color(color)
            actions = self._increment_cell(row, col, color)
            return actions

        return None

    def _increment_cell(self, row: int, col: int, color: int) -> list[BoardAction]:
        queue = deque()
        queue.append((row, col))
        actions = []
        actions.append(BoardAction(row=row, col=col, action='increment', color=color))

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
            
            if exploded:
                actions.append(BoardAction(row=crow, col=ccol, action='exploded', color=color))
                queue.append((crow + 1, ccol))
                queue.append((crow - 1, ccol))
                queue.append((crow, ccol + 1))
                queue.append((crow, ccol - 1))

        return actions

    def _increment_cell_new(self, row: int, col: int, color: int, board_states: list[str]) -> None:
        queue = deque()

        result = self._inc_single_cell(row, col, color)
        if result is not None:
            queue.append(result)

        while queue:
            queue_list = list(queue)
            for crow, ccol in queue_list:
                _ = queue.popleft()
            
                if crow != self.height - 1:
                    result = self._inc_single_cell(crow + 1, ccol, color)
                    if result is not None:
                        queue.append(result)
                
                if crow != 0:
                    result = self._inc_single_cell(crow - 1, ccol, color)
                    if result is not None:
                        queue.append(result)

                if ccol != self.width - 1:
                    result = self._inc_single_cell(crow, ccol + 1, color)
                    if result is not None:
                        queue.append(result)
                
                if ccol != 0:
                    result = self._inc_single_cell(crow, ccol - 1, color)
                    if result is not None:
                        queue.append(result)
            
            board_states.append(self.serialize())   
            

    def _inc_single_cell(self, row: int, col: int, color: int) -> tuple[int, int] | None:
        cell: Cell = self.board[row][col]
        cell.change_color(color)
        exploded = cell.inc_count()
        if exploded:
            return row, col
        return None

    def serialize(self) -> str:
        board_json = [
            [cell.to_dict() for cell in row]
            for row in self.board
        ]
        return json.dumps(board_json)
    
    @classmethod
    def deserialize(cls, json_str: str) -> "Board":
        """
        Create a Board instance from a JSON string.
        """
        data = json.loads(json_str)
        if not data:
            raise ValueError("Empty board data")

        height = len(data)
        width = len(data[0]) if height > 0 else 0
        board_instance = cls(width=width, height=height)

        for row_idx, row_data in enumerate(data):
            for col_idx, cell_data in enumerate(row_data):
                # Reconstruct each cell
                board_instance.board[row_idx][col_idx] = Cell(
                    count=cell_data["count"],
                    color=cell_data.get("color"),
                    max_count=cell_data["max_count"]
                )

        return board_instance
    
    def is_complete(self) -> bool:
        colors = set()
        for row in self.board:
            for cell in row:
                if cell.color is not None:
                    colors.add(cell.color)
        return len(colors) < 2
