- Modular board
- Any number of players 
- Backend/frontend
- state of the board 
- play on different phones
- Do it in React with FastAPI backend

- Game engine 
    - Game state 
        - Board (grid, 2d list)
        - Cells
            - Location (x, y)
            - Number of dots
            - Color of dots

- To store this
- Store each cell under a game 
- Store the entire game state in JSON
- use postgres sql (sql lite might work fine too)

- Get the logic working first (should produce json states)
    - Test this and make sure it works
- Add the database
- Add users
- Link to FastAPI
- Build frontend