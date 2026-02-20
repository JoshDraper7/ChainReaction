import { useState, useEffect } from "react";
import { useUserContext } from "../context/UserContext";
import { useGameContext } from "../context/GameContext";
import { LiveGameService } from "../util/LiveServerService";
import { useNavigate } from "react-router-dom";
import "../css/JoinGame.css";

export function JoinGame() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { user } = useUserContext();
  const { setGameId, setGameCode } = useGameContext();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    LiveGameService.on("success", (data) => {
      if (data.response_type === "join_game") {
        setError(null);
        setGameId(data.game_id);
        setGameCode(data.game_code);
        navigate("/play-game");
      } else {
        console.error(`Improper response type: ${data.response_type}`);
      }
    });

    LiveGameService.on("error", (err) => {
      setError(err.message);
    });
  }, []);

  const handleJoin = async () => {
    if (!user) return;
    if (!code) {
      setError("Please enter a game code.");
      return;
    }
    LiveGameService.joinGame(code, user.id);
  };

  return (
    <div className="join-game-container">
      <div className="join-game-card">
        <h1>Join a Game</h1>

        <div className="form-group">
          <label htmlFor="code">Game Code</label>
          <input
            id="code"
            type="text"
            placeholder="Enter game code..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>

        <button className="btn join-btn" onClick={handleJoin}>
          Join Game
        </button>

        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
}
