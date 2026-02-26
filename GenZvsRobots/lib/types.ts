// === Block Types ===
export type BlockType = "wall" | "floor" | "roof" | "window" | "door" | "plant" | "table" | "metal" | "concrete" | "barrel" | "pipe" | "air" | "empty";

// === Grid ===
export type Cell = BlockType;
export type Grid = Cell[][][]; // 6x6xMAX_HEIGHT, grid[row][col][height]

// === Players ===
export type Role = "architect" | "builder";

export interface Player {
  id: string;
  name: string;
  teamId: string;
  role: Role;
  connected: boolean;
  reconnectToken?: string;
  designGrid: Grid | null;
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
  designGrid: Grid | null; // saved from design phase
  roundTarget: Grid | null; // the target this team must recreate
  aiActionLog: { row: number; col: number; block: BlockType; timestamp: number }[];
}

// === Game Phases ===
export type GamePhase =
  | "lobby"
  | "design"
  | "demo"
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
  nextTeamIndex: number;
}

// === WebSocket Messages ===
export type ClientMessage =
  | { type: "join"; name: string; isHost?: boolean; reconnectToken?: string }
  | { type: "placeBlock"; row: number; col: number; block: BlockType }
  | { type: "chat"; text: string }
  | { type: "hostAction"; action: HostAction; targetPlayerId?: string }
  | { type: "aiChat"; text: string }
  | { type: "setTeamName"; name: string }
  | { type: "leaveGame" };

export type HostAction =
  | "startRound"
  | "pause"
  | "resume"
  | "skipToReveal"
  | "nextReveal"
  | "prevReveal"
  | "endGame"
  | "startDemo"
  | "endDemo"
  | "startDesign"
  | "endDesign"
  | "kickPlayer";

export type ServerMessage =
  | { type: "state"; state: RoomState }
  | { type: "gridUpdate"; teamId: string; row: number; col: number; height: number; block: BlockType }
  | { type: "designGridUpdate"; playerId: string; row: number; col: number; height: number; block: BlockType }
  | { type: "chat"; teamId: string; senderId: string; senderName: string; text: string; isAI?: boolean }
  | { type: "aiBuilding"; teamId: string; actions: BuildAction[] }
  | { type: "timer"; timerEnd: number }
  | { type: "phaseChange"; phase: GamePhase }
  | { type: "error"; message: string }
  | { type: "playerJoined"; player: Player }
  | { type: "reconnected"; player: Player }
  | { type: "scores"; teams: { teamId: string; teamName: string; score: number; round: 1 | 2 }[] }
  | { type: "kicked"; message: string };

export interface BuildAction {
  row: number;
  col: number;
  block: BlockType;
  height?: number;
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
  height: number;
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
