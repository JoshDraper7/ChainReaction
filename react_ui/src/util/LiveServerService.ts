// src/api/LiveGameService.ts
export type WebSocketStatus = "disconnected" | "connecting" | "connected";

export class WebSocketDisconnectedError extends Error {
    constructor() {
        super("WebSocket is not connected");
        this.name = "WebSocketDisconnectedError";
    }
}

export class LiveGameService {
    private static socket: WebSocket | null = null;
    private static status: WebSocketStatus = "disconnected";
    private static listeners: Map<string, (data: any) => void> = new Map();

    private static reconnectAttempts = 0;
    private static maxReconnectAttempts = 10;
    private static reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    /** Connect to the backend WebSocket */
    static connect(player_id: string) {
        if (this.socket && this.status === "connected") return;

        this.status = "connecting";
        this.socket = new WebSocket(`ws://localhost:8000/ws/game?player_id=${player_id}`);
        // this.socket = new WebSocket(`wss://localhost:8000/ws/game?player_id=${player_id}`);
        // this.socket = new WebSocket(`wss://moth-large-yearly.ngrok-free.app/ws/game?player_id=${player_id}`);

        this.socket.onopen = () => {
            console.log("[WebSocket] Connected");
            this.status = "connected";
            this.reconnectAttempts = 0;

            // Clear any pending reconnect timers
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }
            this.emit("connected", "connected")
        };

        this.socket.onclose = (event) => {
            console.log("[WebSocket] Disconnected");
            console.log("Close code:", event.code);
            console.log("Reason:", event.reason);
            console.log("Was clean close:", event.wasClean);

            this.status = "disconnected";
            this.socket = null;

            console.warn("[WebSocket] Attempting to reconnect...");
            this.scheduleReconnect(player_id);
            this.emit("disconnect", "WebSocket disconnected")
        };

        this.socket.onerror = (err) => {
            console.error("[WebSocket] Error:", err);
        };

        this.socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                const { status, data } = message;
                if (status === "story_ready") {
                    this.emit("story_ready", data);
                } else if (status === "game_finished") {
                    this.emit("game_finished", data);
                } else if (status === "game_started") {
                    this.emit("game_started", data);
                } else if (status === "success") {
                    this.emit("success", data);
                } else if (status === "error") {
                    this.emit("error", message);
                }
            } catch (e) {
                console.error("Invalid WebSocket message:", event.data);
            }
        };
    }

    static scheduleReconnect(player_id: string) {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error("[WebSocket] Max reconnect attempts reached. Giving up.");
            this.emit("disconnect_give_up", "[WebSocket] Max reconnect attempts reached. Giving up.")
            return;
        }

        // Exponential backoff: 1s, 2s, 4s, 8s, etc. up to a cap of 30s
        const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
        this.reconnectAttempts++;
        console.log(`[WebSocket] Reconnecting in ${delay / 1000}s... (attempt ${this.reconnectAttempts})`);

        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

        this.reconnectTimer = setTimeout(() => {
            this.connect(player_id);
        }, delay);
    }

    /** Disconnect */
    static disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
            this.status = "disconnected";
        }
    }

    /** Send an action */
    private static send(action: string, payload: Record<string, any>) {
        if (!this.socket || this.status !== "connected") {
            console.error("Cannot send, WebSocket not connected.");
            throw new WebSocketDisconnectedError();
        }
        const message = JSON.stringify({ action, payload });
        this.socket.send(message);
    }

    /** Add event listener */
    static on(event: string, callback: (data: any) => void) {
        this.listeners.set(event, callback);
    }

    /** Remove event listener */
    static off(event: string) {
        this.listeners.delete(event);
    }

    /** Internal event trigger */
    private static emit(event: string, data: any) {
        const callback = this.listeners.get(event);
        if (callback) callback(data);
    }

    // === API METHODS === //

    static createGame(playerId: string, boardWidth: number, boardHeight: number) {
        this.send("create_game", { player_id: playerId, board_width: boardWidth, board_height: boardHeight });
    }

    static joinGame(gameCode: string, playerId: string) {
        this.send("join_game", { game_code: gameCode, player_id: playerId });
    }

    static startGame(gameId: string) {
        this.send("start_game", { game_id: gameId });
    }

    static nextStory(gameId: string, playerId: string) {
        this.send("next_story", { game_id: gameId, player_id: playerId });
    }

    static submitStoryPiece(gameId: string, playerId: string, storyId: string, storyPiece: string) {
        this.send("submit_story_piece", { game_id: gameId, player_id: playerId, story_id: storyId, story_piece: storyPiece });
    }

    static getPlayerId(name: string, email: string) {
        this.send("get_player_id", { name, email });
    }

    static updateStoryTitle(gameId: string, playerId: string, storyId: string, newTitle: string) {
        this.send("update_story_title", { game_id: gameId, player_id: playerId, story_id: storyId, new_title: newTitle });
    }

    static getStoryHistory(playerId: string) {
        this.send("get_story_history", { player_id: playerId });
    }

    static getGameHistory(playerId: string) {
        this.send("get_game_history", { player_id: playerId });
    }

    static removePlayer(gameId: string, playerId: string) {
        this.send("remove_player", { game_id: gameId, player_id: playerId });
    }
}
