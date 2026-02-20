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

export interface BoardAction {
    row: number;
    col: number;
    action: string
    color: number;
}

export interface IncrementCellResponse {
    board_actions: BoardAction[];
}

function getCellColor(colorValue: number | null, maxColor: number): string {
    if (colorValue === null) return "transparent";
    const hue = (colorValue / maxColor) * 360; // 0-360 hue
    // const hueStep = 360 / maxColor;
    // const hue = (colorValue * hueStep) % 360;
    return `hsl(${hue}, 70%, 50%)`;
}

const ANIMATION_DURATION = 350; // ms, match CSS transition

const getNeighbors = (row: number, col: number, board: Cell[][]): {row: number, col: number}[] => {
    const neighbors = [];
    if (row > 0) neighbors.push({ row: row - 1, col });
    if (row < board.length - 1) neighbors.push({ row: row + 1, col });
    if (col > 0) neighbors.push({ row, col: col - 1 });
    if (col < board[0].length - 1) neighbors.push({ row, col: col + 1 });
    return neighbors;
};

export function PlayGame() {
    const navigate = useNavigate()

    const { gameId, gameCode } = useGameContext()
    const { user } = useUserContext();
    
    const [connectedError, setConnectedError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [boardState, setBoardState] = useState<Array<Array<Cell>> | null>(null);
    const [isTurn, setIsTurn] = useState<boolean>(false);
    const [winningColor, setWinningColor] = useState<string | null>(null);
    const [playerTurnNumber, setPlayerTurnNumber] = useState<number | null>(null);
    const [numPlayers, setNumPlayers] = useState<number | null>(null);
    const [currClickedCell, setCurrClickedCell] = useState<LocationCell | null>(null);

    const [boardActions, setBoardActions] = useState<Array<BoardAction> | null>(null);

    const cellRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const circleRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const boardStateRef = useRef<Array<Array<Cell>> | null>(null);
    

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
                // console.log(`New game state ${data.game_state}`)
                const parsedBoard = JSON.parse(gameState.game_state) as Cell[][];
                setBoardState(parsedBoard)
                setIsTurn(gameState.players_turn)
                setPlayerTurnNumber(gameState.player_turn_number)
                setNumPlayers(gameState.num_players)
                setError(null) 
            }
            else if (data.response_type === "increment_cell") {
                // do nothing because it will be sent in new_game_state
            }
            else {
                console.error(`Improper response type: ${data.response_type}`)
            }
        });

        LiveGameService.on("new_game_state", (data) => {
            const response = data as IncrementCellResponse;
            console.log("NEW ACTIONS ------")
            for (const action of response.board_actions) {
                console.log(
                    `Action(row=${action.row}, col=${action.col}, action=${action.action})`
                );
            }
            setBoardActions(response.board_actions)
        });

        LiveGameService.on("game_started", (data) => {
            console.log(`Game started`)
            getGameState()
        });

        LiveGameService.on("game_finished", (data) => {
            console.log(`Game complete`)
            setWinningColor(data.winner)
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
        boardStateRef.current = boardState;
    }, [boardState])

    useEffect(() => {
        if (!boardActions || !boardState || boardStateRef.current === null) return;
        if (boardActions.length === 0) {
            getGameState();
            return;
        }

        const runAnimations = async () => {
            const action = boardActions[0]
            if (action.action === "increment") {
                setBoardState(prev => {
                    if (!prev) return null;
                    const next = structuredClone(prev);
                    next[action.row][action.col].count += 1;
                    next[action.row][action.col].color = action.color;
                    return next;
                });
            }
            if (action.action === "exploded") {
                await animateExplosion(action.row, action.col);
                setBoardState(prev => {
                    if (!prev) return null;
                    const next = structuredClone(prev);
                    next[action.row][action.col].count = 0;
                    next[action.row][action.col].color = null;
                    return next;
                });
                const neighbors = getNeighbors(action.row, action.col, boardStateRef.current);
                for (let i = 0; i < neighbors.length; i++) {
                    const neighbor = neighbors[i]
                    setBoardState(prev => {
                        if (!prev) return null;
                        const next = structuredClone(prev);
                        next[neighbor.row][neighbor.col].count += 1;
                        next[neighbor.row][neighbor.col].color = action.color;
                        return next;
                    });
                }
            }
            const new_actions = structuredClone(boardActions)
            new_actions.shift()
            setBoardActions(new_actions)
        };

        runAnimations();
    }, [boardActions]);

    const animateExplosion = (row: number, col: number): Promise<void> => {
        return new Promise(async (resolve) => {
            if (!boardStateRef.current) { resolve(); return; }

            const sourceCellEl = cellRefs.current.get(`${row}-${col}`);
            if (sourceCellEl) {
                sourceCellEl.style.backgroundColor = 'red';
            }

            const neighbors = getNeighbors(row, col, boardStateRef.current);
            const circleCount = Math.min(boardStateRef.current[row][col].count, neighbors.length);
            console.log(circleCount)
            const animations: Promise<void>[] = [];

            for (let i = 0; i < circleCount; i++) {
                const circleKey = `${row}-${col}-${i}`;
                const targetNeighbor = neighbors[i % neighbors.length];
                const targetKey = `${targetNeighbor.row}-${targetNeighbor.col}`;

                const circleEl = circleRefs.current.get(circleKey)
                const targetCellEl = cellRefs.current.get(targetKey);

                if (!circleEl || !targetCellEl) continue;

                const circleRect = circleEl.getBoundingClientRect();
                const targetRect = targetCellEl.getBoundingClientRect();

                // Calculate where the circle needs to travel
                const dx = (targetRect.left + targetRect.width / 2) - (circleRect.left + circleRect.width / 2);
                const dy = (targetRect.top + targetRect.height / 2) - (circleRect.top + circleRect.height / 2);

                // Pin the circle at its current position in the viewport
                circleEl.style.position = 'fixed';
                circleEl.style.left = `${circleRect.left}px`;
                circleEl.style.top = `${circleRect.top}px`;
                circleEl.style.width = `${circleRect.width}px`;
                circleEl.style.height = `${circleRect.height}px`;
                circleEl.style.zIndex = '999';
                circleEl.style.transition = 'none';
                circleEl.style.transform = 'translate(0, 0)';

                // Force reflow so the browser registers the starting position
                circleEl.getBoundingClientRect();

                const anim = new Promise<void>((res) => {
                    // Kick off the transition
                    circleEl.style.transition = `transform ${ANIMATION_DURATION}ms ease-in, opacity ${ANIMATION_DURATION}ms ease-in`;
                    circleEl.style.transform = `translate(${dx}px, ${dy}px)`;
                    circleEl.style.opacity = '0';

                    setTimeout(() => {
                        // Reset styles after animation
                        circleEl.style.position = '';
                        circleEl.style.left = '';
                        circleEl.style.top = '';
                        circleEl.style.width = '';
                        circleEl.style.height = '';
                        circleEl.style.zIndex = '';
                        circleEl.style.transition = '';
                        circleEl.style.transform = '';
                        circleEl.style.opacity = '';
                        res();
                    }, ANIMATION_DURATION);
                });

                animations.push(anim);
            }

            Promise.all(animations).then(() => {
                // reset exploded cell color
                if (sourceCellEl) {
                    sourceCellEl.style.backgroundColor = '';
                }
                resolve()
            });

            
        });
    };

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
        
        if (!user || !user.id || !gameId || !boardState || winningColor !== null) return;
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
            setBoardState(prev => {
                if (!prev) return null;
                const next = structuredClone(prev);
                next[currClickedCell.row][currClickedCell.col].count -= 1;
                return next;
            });
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
                {winningColor !== null && <p>{winningColor} wins!</p>}

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
                                ref={(el) => {
                                    if (el) cellRefs.current.set(`${rowIndex}-${colIndex}`, el);
                                }}
                                className="board-cell"
                                onClick={() => clickCell(rowIndex, colIndex, playerTurnNumber, cell)}
                            >
                            {/* Render `count` circles */}
                            {cell.count > 0 &&
                                Array.from({ length: cell.count }).map((_, i) => (
                                    <div
                                        key={`${rowIndex}-${colIndex}-${i}`}
                                        ref={(el) => {
                                            if (el) circleRefs.current.set(`${rowIndex}-${colIndex}-${i}`, el);
                                        }}
                                        className="cell-circle"
                                        style={{
                                            backgroundColor: getCellColor(cell.color, numPlayers)
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

