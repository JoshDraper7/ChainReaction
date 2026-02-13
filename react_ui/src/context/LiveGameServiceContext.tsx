import { createContext, useContext, useEffect, type ReactNode } from "react";
import { LiveGameService } from "../util/LiveServerService";
import { useUserContext } from "./UserContext";


const LiveGameServiceContext = createContext<LiveGameService>(LiveGameService);

export const useLiveGameServiceContext = (): LiveGameService => {
    const context = useContext(LiveGameServiceContext);
    if (!context) {
        throw new Error("useLiveGameServiceContext must be used within a LiveGameServiceProvider");
    }
    return context;
};

interface LiveGameServiceProviderProps {
    children: ReactNode;
}

export const LiveGameServiceProvider = ({ children }: LiveGameServiceProviderProps) => {
    const { user } = useUserContext()

    useEffect(() => {
        if (!user) return
        LiveGameService.connect(user.id);

        // Optionally disconnect when app unmounts
        return () => {
            LiveGameService.disconnect();
        };
    }, [user]);

    return (
        <LiveGameServiceContext.Provider value={LiveGameService}>
            {children}
        </LiveGameServiceContext.Provider>
    );
};
