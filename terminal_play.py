from game_logic.board import Board  # adjust import if needed

COLOR_MAP = {
    1: "R",
    2: "B",
    3: "G",
    4: "Y"
}


def print_board(board: Board) -> None:
    print("\nCurrent Board:\n")

    # Column header
    header = "     " + " ".join(f"{c:3}" for c in range(board.width))
    print(header)

    for row in range(board.height):
        row_display = []
        for col in range(board.width):
            cell = board.board[row][col]
            count = cell.get_count()
            color = cell.get_color()

            if count == 0:
                row_display.append(" . ")
            else:
                color_char = COLOR_MAP.get(color, "?")
                row_display.append(f"{color_char}{count}")

        print(f"{row:3}  " + " ".join(f"{c:3}" for c in row_display))

    print()


def get_move(board: Board):
    try:
        row = int(input("Enter row: "))
        col = int(input("Enter column: "))
        color = int(input("Enter color (1=R, 2=B, 3=G, 4=Y): "))

        if row < 0 or row >= board.height:
            print("Invalid row.")
            return None

        if col < 0 or col >= board.width:
            print("Invalid column.")
            return None

        return row, col, color

    except ValueError:
        print("Invalid input.")
        return None


def main():
    board = Board(width=6, height=9)

    print("Terminal Dot Game")
    print("Coordinates are (row, column)")
    print("Rows go 0 to", board.height - 1)
    print("Columns go 0 to", board.width - 1)
    print()

    while True:
        print_board(board)

        move = get_move(board)
        if move is None:
            continue

        row, col, color = move

        success = board.inc_cell_count(row, col, color)

        if not success:
            print("Invalid move! You can only place on empty or your own color.\n")

        print("-" * 50)


if __name__ == "__main__":
    main()
