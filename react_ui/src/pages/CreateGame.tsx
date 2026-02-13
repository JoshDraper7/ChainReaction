import { LiveGameService } from "../util/LiveServerService";
import { useUserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useGameContext } from "../context/GameContext";
import { getUserFromLocalStorage } from "../util/LocalStorage";
import "../css/CreateGame.css"

export function CreateGame() {
  const navigate = useNavigate();
  const { user, setUser } = useUserContext();
  const { gameId, gameCode, setGameCode, setGameId } = useGameContext();

  const [boardWidth, setBoardWidth] = useState<number>(6);
  const [boardHeight, setBoardHeight] = useState<number>(9);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      const local_user = getUserFromLocalStorage();
      if (!local_user) navigate("/login");
      setUser(local_user);
    }

    LiveGameService.on("success", (data) => {
      if (data.response_type === "create_game") {
        setError(null);
        setGameCode(data.game_code);
        setGameId(data.game_id);
      } else if (data.response_type === "start_game") {
        navigate("/play-game");
      } else {
        console.log(`Improper return type: ${data}`);
      }
    });

    LiveGameService.on("error", (err) => {
      console.error("Server error:", err);
      setError(err.message);
    });
  }, []);

  const createNewGame = async () => {
    if (user == null) {
      navigate("/login");
      return;
    } else if (!boardWidth || !boardHeight) {
      setError("Please fill out all fields.");
      return;
    }

    LiveGameService.createGame(user.id, boardWidth, boardHeight);
  };

  const startGame = async () => {
    if (!gameId) return;
    LiveGameService.startGame(gameId);
  };

  return (
    <div className="create-game-container">
      <div className="create-game-card">
        <h1>Create a New Game</h1>
        {!gameCode ? (
          <>
            <div className="form-group">
              <label htmlFor="board-width">Board Width</label>
              <input
                id="board-width"
                type="number"
                min={4}
                max={20}
                value={boardWidth}
                onChange={(e) => setBoardWidth(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="board-height">Board Height</label>
              <input
                id="board-height"
                type="number"
                min={4}
                max={20}
                value={boardHeight}
                onChange={(e) => setBoardHeight(Number(e.target.value))}
              />
            </div>

            <button className="btn create-btn" onClick={createNewGame}>
              Create Game
            </button>
          </>
        ) : (
          <>
            <p className="game-code-text">
              Game created! Your code is: <strong>{gameCode}</strong>
            </p>
            <button className="btn start-btn" onClick={startGame}>
              Start Game
            </button>
          </>
        )}

        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
}
