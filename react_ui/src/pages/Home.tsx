import { useUserContext } from "../context/UserContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserFromLocalStorage } from "../util/LocalStorage";
import "../css/Home.css"; // 👈 Add this line

export function Home() {
    const { user, setUser } = useUserContext();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            const local_user = getUserFromLocalStorage();
            if (!local_user) navigate("/login");
            setUser(local_user);
        }
    }, []);

    const switchPage = (page: string) => {
        navigate(`/${page}`);
    };

    return (
        <div className="home-container">
            <div className="home-card">
                <h1>Welcome to Telestories!</h1>
                <div className="button-group">
                    <button className="btn create-btn" onClick={() => switchPage("create-game")}>
                        Create Game
                    </button>
                    <button className="btn join-btn" onClick={() => switchPage("join-game")}>
                        Join Game
                    </button>
                </div>
                {user && <p className="user-info">Logged in as: {user.name}</p>}
            </div>
        </div>
    );
}
