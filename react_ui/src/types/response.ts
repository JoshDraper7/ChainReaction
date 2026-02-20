export interface ApiError {
  status: number;
  message: string;
}

export interface StoryPiece {
  piece: string;
  written_by: string;
}

export interface NextStoryResponse {
  message: string;
  story_id: string;
  story_piece: string;
  game_length: number;
  story_length: number;
  story_title: string;
  story_piece_id: string;
}

export interface CreateGameResponse {
  message: string;
  game_id: string;
  game_code: string;
}

export interface JoinGameResponse {
  message: string;
  game_id: string;
  already_joined: boolean;
}

export interface GetPlayerIdResponse {
  message: string;
  player_id: string;
}

export interface GameFinishedResponse {
  message: string;
  story_id: string;
  story_title: string;
  story_pieces: [string, string][];  // same structure as list[list[str]] in Python
}

export type NextStoryAPIResponse = NextStoryResponse | GameFinishedResponse;

export interface FullStory {
  story_id: string;
  story_title: string;
  story_pieces: { [key: string]: string }[];
  written_at: string;
  game_id: string;
  game_code: string;
}

export interface StoryHistoryResponse {
  stories: FullStory[];
}

export interface FullStory {
  story_id: string;
  story_title: string;
  story_pieces: { [key: string]: string }[];
  written_at: string;
  game_id: string;
  game_code: string;
  owner_player_name: string
}

export interface FullGame {
  game_id: string;
  game_code: string;
  timestamp: string;
  length: number;
  stories: FullStory[];
}

export interface GameHistoryResponse {
  games: FullGame[];
}



