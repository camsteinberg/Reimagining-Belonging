// === Block Types ===
export type BlockType = "wall" | "floor" | "roof" | "window" | "door" | "empty";

// === Grid ===
export type Cell = BlockType;
export type Grid = Cell[][]; // 8x8, grid[row][col]

// === Players ===
export type Role = "architect" | "builder";

export interface Player {
  id: string;
  name: string;
  teamId: string;
  role: Role;
  connected: boolean;
}

// === Teams ===
export interface Team {
  id: string;
  name: string;
  players: string[]; // player IDs
  grid: Grid;
  round1Grid: Grid | null; // snapshot after round 1
  round1Score: number | null;
  round2Score: number | null;
}

// === Game Phases ===
export type GamePhase =
  | "lobby"
  | "round1"
  | "reveal1"
  | "interstitial"
  | "round2"
  | "finalReveal"
  | "summary";

// === Room State (server-side, synced to clients) ===
export interface RoomState {
  code: string;
  phase: GamePhase;
  players: Record<string, Player>;
  teams: Record<string, Team>;
  currentTarget: Grid | null;
  round: 1 | 2;
  timerEnd: number | null; // unix timestamp
  hostConnected: boolean;
}

// === WebSocket Messages ===
export type ClientMessage =
  | { type: "join"; name: string; isHost?: boolean }
  | { type: "placeBlock"; row: number; col: number; block: BlockType }
  | { type: "chat"; text: string }
  | { type: "hostAction"; action: HostAction }
  | { type: "aiChat"; text: string };

export type HostAction =
  | "startRound"
  | "pause"
  | "resume"
  | "skipToReveal"
  | "nextReveal"
  | "prevReveal"
  | "endGame";

export type ServerMessage =
  | { type: "state"; state: RoomState }
  | { type: "gridUpdate"; teamId: string; row: number; col: number; block: BlockType }
  | { type: "chat"; teamId: string; senderId: string; senderName: string; text: string; isAI?: boolean }
  | { type: "aiBuilding"; teamId: string; actions: BuildAction[] }
  | { type: "timer"; timerEnd: number }
  | { type: "phaseChange"; phase: GamePhase }
  | { type: "error"; message: string }
  | { type: "playerJoined"; player: Player }
  | { type: "scores"; teams: { teamId: string; teamName: string; score: number; round: 1 | 2 }[] };

export interface BuildAction {
  row: number;
  col: number;
  block: BlockType;
}

// === AI Response (parsed from Claude) ===
export interface AIResponse {
  text: string;
  actions: BuildAction[];
}

// === Scoring ===
export interface CellResult {
  row: number;
  col: number;
  expected: BlockType;
  actual: BlockType;
  correct: boolean;
}

export interface TeamScore {
  teamId: string;
  teamName: string;
  round1Score: number;
  round2Score: number;
  improvement: number;
  cellResults: CellResult[];
}
