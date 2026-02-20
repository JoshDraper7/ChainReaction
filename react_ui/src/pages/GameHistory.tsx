import { useEffect, useState } from "react";
import { useUserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { type FullGame } from "../types/response";
import { getUserFromLocalStorage } from "../util/LocalStorage";
import { GameService } from "../util/LocalServerService";
import "../css/GameHistory.css";

export function GameHistory() {
    const { user, setUser } = useUserContext();
    const navigate = useNavigate();
    const [games, setGames] = useState<FullGame[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            const local_user = getUserFromLocalStorage();
            if (!local_user) navigate("/login");
            setUser(local_user);
        }

        const fetchGames = async () => {
            console.log("here")
            if (!user) return;
            try {
                const res = await GameService.getGameHistory(user.id);
                if (res.error) {
                    setError(`SOMETHING WENT WRONG: ${res.error.message}`);
                } else if (res.data) {
                    setError(null);
                    console.log("Got games")
                    setGames(res.data.games);
                }
            } catch {
                setError("Failed to connect to server.");
            } finally {
                console.log("setting loading")
                setLoading(false);
            }
        };

        fetchGames()
    }, [user]);

    if (loading) {
        return (
            <div className="game-history-container">
                <div className="game-history-box">
                    <p className="loading">Loading game history...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="game-history-container">
                <div className="game-history-box">
                    <p className="error">{error}</p>
                </div>
            </div>
        );
    }

    if (games && games.length === 0) {
        return (
            <div className="game-history-container">
                <div className="game-history-box">
                    <p className="empty">You haven’t played any games yet.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="game-history-container">
            <div className="game-history-box">
                <h1>Game History</h1>
                <hr />

                {games.map((game, idx) => (
                    <details key={idx}>
                        <summary>
                            Game Code: {game.game_code} — {game.timestamp}
                        </summary>

                        <div>
                            <p>Length: {game.length} rounds</p>
                            <hr />

                            {game.stories &&
                                game.stories.map((story, sIdx) => (
                                    <details key={sIdx} className="story-block">
                                        <summary>
                                            {story.story_title} — by{" "}
                                            {story.owner_player_name || "Unknown"}
                                        </summary>

                                        <div>
                                            {story.story_pieces.map((piece, i) => (
                                                <div key={i} className="story-piece">
                                                    <p>
                                                        <strong>{i + 1}.</strong>{" "}
                                                        {piece.piece}
                                                    </p>
                                                    <p className="author">
                                                        Written by:{" "}
                                                        <strong>{piece.written_by}</strong>
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                ))}
                        </div>
                    </details>
                ))}
            </div>
        </div>
    );
}
