// src/api/GameService.ts
import axios, { type AxiosResponse, type AxiosError } from "axios";
import {
    type NextStoryAPIResponse,
    type CreateGameResponse,
    type JoinGameResponse,
    type GetPlayerIdResponse,
    type ApiError,
    type StoryHistoryResponse,
    type GameHistoryResponse
} from "../types/response";

// const BASE_URL = "http://localhost:8000";
// const BASE_URL = "http://100.111.94.20:8000";
const BASE_URL = "https://moth-large-yearly.ngrok-free.app"

export class GameService {
    /** Helper to handle errors consistently */
    private static handleError(error: unknown): { error: ApiError } {
        const err = error as AxiosError;
        return {
            error: {
                status: err.response?.status ?? 500,
                message:
                    (err.response?.data as any)?.message ||
                    err.message ||
                    "Unknown error",
            },
        };
    }

    /** GET next story for player in a game */
    static async getNextStory(
        gameId: string,
        playerId: string
    ): Promise<{ data?: NextStoryAPIResponse; error?: ApiError }> {
        const url = `${BASE_URL}/next-story/${gameId}/${playerId}`;
        try {
            const response: AxiosResponse<NextStoryAPIResponse> = await axios.get(url);
            return { data: response.data };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /** GET story history for player */
    static async getStoryHistory(
        playerId: string
    ): Promise<{ data?: StoryHistoryResponse; error?: ApiError }> {
        const url = `${BASE_URL}/get-story-history/${playerId}`;
        try {
            const response: AxiosResponse<StoryHistoryResponse> = await axios.get(url);
            console.log(response)
            return { data: response.data };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /** GET game history for player */
    static async getGameHistory(
        playerId: string
    ): Promise<{ data?: GameHistoryResponse; error?: ApiError }> {
        const url = `${BASE_URL}/get-game-history/${playerId}`;
        try {
            const response: AxiosResponse<GameHistoryResponse> = await axios.get(url);
            return { data: response.data };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /** POST new story piece */
    static async submitStoryPiece(
        gameId: string,
        playerId: string,
        storyId: string,
        storyPiece: string
    ): Promise<{ data?: any; error?: ApiError }> {
        const url = `${BASE_URL}/submit-story-piece`;
        try {
            const response = await axios.post(url, {
                game_id: gameId,
                player_id: playerId,
                story_id: storyId,
                story_piece: storyPiece,
            });
            return { data: response.data };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /** POST create a new game */
    static async createGame(
        playerId: string,
        length: number,
        title: string = "My Story"
    ): Promise<{ data?: CreateGameResponse; error?: ApiError }> {
        const url = `${BASE_URL}/create-game`;
        try {
            const response: AxiosResponse<CreateGameResponse> = await axios.post(url, {
                player_id: playerId,
                length,
                title,
            });
            return { data: response.data };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /** GET start an existing game */
    static async startGame(
        gameId: string
    ): Promise<{ data?: any; error?: ApiError }> {
        const url = `${BASE_URL}/start-game/${gameId}`;
        try {
            const response = await axios.get(url);
            return { data: response.data };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /** POST join a game by code */
    static async joinGame(
        playerId: string,
        gameCode: string,
        title: string
    ): Promise<{ data?: JoinGameResponse; error?: ApiError }> {
        const url = `${BASE_URL}/join-game`;
        try {
            const response: AxiosResponse<JoinGameResponse> = await axios.post(url, {
                player_id: playerId,
                game_code: gameCode,
                title,
            });
            return { data: response.data };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /** POST update a story title */
    static async updateStoryTitle(
        playerId: string,
        gameId: string,
        newTitle: string
    ): Promise<{ data?: any; error?: ApiError }> {
        const url = `${BASE_URL}/update-story-title`;
        try {
            const response = await axios.post(url, {
                player_id: playerId,
                game_id: gameId,
                new_title: newTitle,
            });
            return { data: response.data };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /** POST get or create a player ID */
    static async getPlayerId(
        name: string,
        email: string
    ): Promise<{ data?: GetPlayerIdResponse; error?: ApiError }> {
        const url = `${BASE_URL}/get-player-id`;
        try {
            const response: AxiosResponse<GetPlayerIdResponse> = await axios.post(url, {
                name,
                email,
            });
            return { data: response.data };
        } catch (error) {
            return this.handleError(error);
        }
    }
}
