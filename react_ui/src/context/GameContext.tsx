import { createContext, useContext, useState, type ReactNode } from "react";

interface GameContextType {
    gameId: string | null;
    gameCode: string | null;
    setGameId: (gameId: string) => void;
    setGameCode: (gameCode: string) => void;
}

const GameContext = createContext<GameContextType | null>(null);

export const useGameContext = (): GameContextType => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error("useUserContext must be used within a UserProvider");
    }
    return context;
};

interface GameProviderProps {
    children: ReactNode;
}

export const GameProvider = ({ children }: GameProviderProps) => {
    const [gameId, setGameId] = useState<string | null>(null);
    const [gameCode, setGameCode] = useState<string | null>(null);

    const value: GameContextType = {
        gameId,
        gameCode,
        setGameId,
        setGameCode
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
};
