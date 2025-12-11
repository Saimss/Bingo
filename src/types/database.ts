export type GameStatus = 'waiting' | 'playing' | 'finished';

export type Game = {
  id: string;
  created_at: string;
  status: GameStatus;
  host_id: string;
  winner_id: string | null;
};

export type Player = {
  id: string;
  game_id: string;
  player_name: string;
  created_at: string;
  has_bingo: boolean;
};

export type Board = {
  id: string;
  player_id: string;
  board_data: number[][];
  marked_cells: number[];
};

export type CalledNumber = {
  id: string;
  game_id: string;
  number: number;
  called_at: string;
};
