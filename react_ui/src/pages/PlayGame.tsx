import { useUserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useGameContext } from "../context/GameContext";

import "../css/PlayGame.css";

export function PlayGame() {
    const navigate = useNavigate()

    const { gameId, gameCode } = useGameContext()
    const { user } = useUserContext();
    
    const [connectedError, setConnectedError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            navigate('/login')
            return 
        }
        if (!gameId) {
            navigate('/home')
            return
        }
    }, [])

    return (
        <div className="playgame-container">
            <div className="playgame-card">
                <p>Playing game...</p>
            </div>
        </div>
    )
}

