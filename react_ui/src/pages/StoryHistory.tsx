import { useEffect, useState } from "react";
import { useUserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { GameService } from "../util/LocalServerService";
import { type FullStory } from "../types/response";
import { getUserFromLocalStorage } from "../util/LocalStorage";
import "../css/StoryHistory.css"

export function StoryHistory() {
    const { user, setUser } = useUserContext();
    const navigate = useNavigate();
    const [stories, setStories] = useState<FullStory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            const local_user = getUserFromLocalStorage();
            if (!local_user) navigate("/login");
            setUser(local_user);
        }

        const fetchStories = async () => {
            if (!user) return;
            try {
                const res = await GameService.getStoryHistory(user.id)
                if (res.error) {
                    setError(`SOMETHING WENT WRONG: ${res.error.message}`);
                } else if (res.data) {
                    setError(null);
                    setStories(res.data.stories)
                }
                return null;
            } catch {
                setError("Failed to connect to server.");
            } finally {
                setLoading(false);
            }
        };

        fetchStories();
    }, [user]);

    if (loading) {
        return <div className="story-history-container">Loading...</div>;
    }

    if (error) {
        return <div className="story-history-container">{error}</div>;
    }

    if (stories && stories.length === 0) {
        return <div className="story-history-container">You haven’t completed any stories yet.</div>;
    }

    return (
        <div className="story-history-container">
            <div className="story-history-box">
                <h1>Your Story History</h1>
                <hr />
                {stories && stories.map((story, idx) => (
                    <details key={idx}>
                        <summary>
                            {story.story_title} (Game Code: {story.game_code})
                        </summary>
                        <div>
                            <p>Created At: {story.written_at}</p>
                            <hr />
                            <h2>{story.story_title}</h2>
                            {story.story_pieces.map((piece, i) => (
                                <div className="story-piece" key={i}>
                                    <p><strong>{i + 1}.</strong> {piece.piece}</p>
                                    <p>Written by: <strong>{piece.written_by}</strong></p>
                                </div>
                            ))}
                        </div>
                    </details>
                ))}
            </div>
        </div>
    );

};
