import { useUserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useGameContext } from "../context/GameContext";
import { LiveGameService, WebSocketDisconnectedError } from "../util/LiveServerService";

import "../css/PlayGame.css";

type Cell = {
    count: number;
    color: number | null;
    max_count: number;
};

type LocationCell = {
    row: number;
    col: number;
    cell: Cell
}


export interface GameStateResponse {
    game_state: string;
    players_turn: boolean;
    player_turn_number: number;
    num_players: number;
};

export interface IncrementCellResponse {
    intermittent_states: string[];
}

function getCellColor(colorValue: number | null, maxColor: number): string {
    if (colorValue === null) return "transparent";
    const hue = (colorValue / maxColor) * 360; // 0-360 hue
    // const hueStep = 360 / maxColor;
    // const hue = (colorValue * hueStep) % 360;
    return `hsl(${hue}, 70%, 50%)`;
}

export function PlayGame() {
    const navigate = useNavigate()

    const { gameId, gameCode } = useGameContext()
    const { user } = useUserContext();
    
    const [connectedError, setConnectedError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [boardState, setBoardState] = useState<Array<Array<Cell>> | null>(null);
    const [isTurn, setIsTurn] = useState<boolean>(false);
    const [playerTurnNumber, setPlayerTurnNumber] = useState<number | null>(null);
    const [numPlayers, setNumPlayers] = useState<number | null>(null);
    const [currClickedCell, setCurrClickedCell] = useState<LocationCell | null>(null);

    const [boardStateStrings, setBoardStateStrings] = useState<Array<string> | null>(null);
    

    useEffect(() => {
        if (!user) {
            navigate('/login')
            return 
        }
        if (!gameId) {
            navigate('/home')
            return
        }

        LiveGameService.on("success", (data) => {
            if (data.response_type === "get_game_state") {
                const gameState = data as GameStateResponse;
                console.log(`New game state ${data.game_state}`)
                const parsedBoard = JSON.parse(gameState.game_state) as Cell[][];
                setBoardState(parsedBoard)
                setIsTurn(gameState.players_turn)
                setPlayerTurnNumber(gameState.player_turn_number)
                setNumPlayers(gameState.num_players)
                setError(null) 
            }
            else if (data.response_type === "increment_cell") {
                const states = data as IncrementCellResponse;
                setBoardStateStrings(states.intermittent_states)
            }
            else {
                console.error(`Improper response type: ${data.response_type}`)
            }
        });

        LiveGameService.on("new_game_state", (data) => {
            const states = data as IncrementCellResponse;
            setBoardStateStrings(states.intermittent_states)
        });

        LiveGameService.on("game_started", (data) => {
            console.log(`Game started`)
            getGameState()
        });

        LiveGameService.on("error", (err) => {
            console.log(`got error ${err.message}`)
            setError(err.message)
        });

        LiveGameService.on("disconnect", (message) => {
            console.log(`Got websocket disconnect ${message}`)
            setConnectedError("Disconnected from game. Attempting to reconnect...")
        })

        LiveGameService.on("connected", (message) => {
            console.log(`Got websocket connect ${message}`)
            setConnectedError(null)
        })

        LiveGameService.on("disconnect_give_up", (message) => {
            console.log(`Got websocket disconnect give up ${message}`)
            setConnectedError(null)
            setError(`You are disconnected from the game. Copy the game code, refresh the page and rejoin the game.`)
        })


        getGameState()
    }, [])

    useEffect(() => {
    }, [boardState])

    useEffect(() => {
        if (!boardStateStrings) return;
        if (boardStateStrings.length === 0) {
            getGameState();
            return;
        }

        const parsedBoardStates = boardStateStrings.map((s) => JSON.parse(s));

        let idx = 0;
        const interval = setInterval(() => {
            setBoardState(parsedBoardStates[idx]);

            idx += 1;

            if (idx >= parsedBoardStates.length) {
                clearInterval(interval);
                getGameState();
            }
        }, 500);

        return () => clearInterval(interval);
    }, [boardStateStrings]);

    const getGameState = async () => {
        if (!user || !user.id || !gameId) return;
        try {
            LiveGameService.getGameState(gameId, user.id)
            console.log("Setting new board state...")
        } catch (err) {
            if (err instanceof WebSocketDisconnectedError) {
                setConnectedError("Cannot send. You are disconnected from the game. Attempting to reconnect...")
            } else {
                setError("Unknown error occurred on send. Please refresh the page and rejoin the game.")
                setBoardState(null)
            }
        }
    }

    const clickCell = (row: number, col: number, color: number, cell: Cell) => {
        
        if (!user || !user.id || !gameId || !boardState) return;
        if (!isTurn) {
            setError("It isn't your turn!");
            return;
        }
        if (cell.color !== null && cell.count > 0 && color !== cell.color) {
            setError("You can't place a dot there.");
            return;
        }
        console.log(`CLICKED`)
        const newBoard = boardState.map((r, _) =>
            r.map((cell, _) => {
                return cell;
            })
        );
        if (currClickedCell !== null) {
            newBoard[currClickedCell.row][currClickedCell.col].count--;
        }
        newBoard[row][col].count++;
        newBoard[row][col].color = color
        setBoardState(newBoard);
        setCurrClickedCell({
            row: row,
            col: col,
            cell: cell
        }) 
        console.log(`New Cell Clicked ${newBoard[row][col].count}`)
    }

    const clickSubmit = () => {
        if (!user || !user.id || !gameId || !isTurn || !boardState || !currClickedCell) return;
        try {
            LiveGameService.submitCellIncrement(gameId, user.id, currClickedCell.row, currClickedCell.col)
            setCurrClickedCell(null)
        } catch (err) {
            if (err instanceof WebSocketDisconnectedError) {
                setConnectedError("Cannot send. You are disconnected from the game. Attempting to reconnect...")
            } else {
                setError("Unknown error occurred on send. Please refresh the page and rejoin the game.")
                setBoardState(null)
            }
        }
    }

    return (
        <div className="playgame-container">
            <div className="playgame-card">
                {isTurn && <p>It's your turn!</p>}
                {connectedError && <p className="error-text">{connectedError}</p>}
                {error != null && <p className="error-text">{error}</p>}
                {!boardState && error === null && <p>Loading board...</p>}

                {boardState != null && numPlayers != null && playerTurnNumber != null && (
                    <div
                    className="board"
                    style={{
                        gridTemplateColumns: `repeat(${boardState[0].length}, 1fr)`
                    }}
                    >
                    {boardState.map((row, rowIndex) =>
                        row.map((cell, colIndex) => (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className="board-cell"
                                onClick={() => clickCell(rowIndex, colIndex, playerTurnNumber, cell)}
                            >
                            {/* Render `count` circles */}
                            {cell.count > 0 &&
                                Array.from({ length: cell.count }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="cell-circle"
                                        style={{
                                            backgroundColor: getCellColor(cell.color, numPlayers),
                                        }}
                                    />
                                ))}
                            </div>
                        ))
                    )}
                    </div>
                )}

                {currClickedCell && (
                    <div>
                        <p>{currClickedCell.row}</p>
                        <p>{currClickedCell.col}</p>
                        <p>{currClickedCell.cell.count}</p>
                        <button className="btn" onClick={() => clickSubmit()}>
                            Submit Placement
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

