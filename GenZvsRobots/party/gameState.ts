import type {
  RoomState,
  Player,
  Grid,
  GamePhase,
  BlockType,
  Role,
} from "../lib/types";
import {
  createEmptyGrid,
  generateRoomCode,
  TEAM_NAMES,
  MAX_TEAM_SIZE,
  GRID_SIZE,
  ROUND_DURATION_MS,
  MAX_HEIGHT,
  getStackHeight,
  getTopBlockHeight,
} from "../lib/constants";
import { pickRandomTarget } from "../lib/targets";

export function createRoomState(): RoomState {
  return {
    code: generateRoomCode(),
    phase: "lobby",
    players: {},
    teams: {},
    currentTarget: null,
    round: 1,
    timerEnd: null,
    hostConnected: false,
  };
}

export function addPlayer(state: RoomState, id: string, name: string): Player {
  // Find a team with available space
  let teamId = Object.keys(state.teams).find(
    (tid) => state.teams[tid].players.length < MAX_TEAM_SIZE
  );

  if (!teamId) {
    teamId = `team-${Object.keys(state.teams).length}`;
    const teamIndex = Object.keys(state.teams).length;
    state.teams[teamId] = {
      id: teamId,
      name: TEAM_NAMES[teamIndex % TEAM_NAMES.length],
      players: [],
      grid: createEmptyGrid(),
      round1Grid: null,
      round1Score: null,
      round2Score: null,
    };
  }

  // First player in a team becomes architect, all others are builders
  const team = state.teams[teamId];
  const role: Role = team.players.length === 0 ? "architect" : "builder";

  const reconnectToken = Math.random().toString(36).slice(2, 10);
  const player: Player = { id, name, teamId, role, connected: true, reconnectToken };
  state.players[id] = player;
  team.players.push(id);

  return player;
}

export function removePlayer(state: RoomState, id: string): void {
  const player = state.players[id];
  if (!player) return;
  player.connected = false;

  const team = state.teams[player.teamId];
  if (team) {
    team.players = team.players.filter(pid => pid !== id);

    if (player.role === "architect" && team.players.length > 0) {
      const nextArchitect = team.players.find(pid => state.players[pid]?.connected);
      if (nextArchitect) {
        state.players[nextArchitect].role = "architect";
      }
    }
  }

  // Keep player in state.players (marked disconnected) so reconnection can find them.
  // Only delete if they have no reconnect token (shouldn't happen, but defensive).
  if (!player.reconnectToken) {
    delete state.players[id];
  }
}

export function reconnectPlayer(
  state: RoomState,
  newId: string,
  reconnectToken: string
): Player | null {
  // Find a disconnected player matching this reconnect token
  const oldPlayer = Object.values(state.players).find(
    (p) => p.reconnectToken === reconnectToken && !p.connected
  );
  if (!oldPlayer) return null;

  // Transfer to new connection ID in the team's players array
  const team = state.teams[oldPlayer.teamId];
  if (team) {
    team.players = team.players.map((pid) =>
      pid === oldPlayer.id ? newId : pid
    );
  }

  // Move player record to new ID
  delete state.players[oldPlayer.id];
  const newPlayer: Player = { ...oldPlayer, id: newId, connected: true };
  state.players[newId] = newPlayer;

  return newPlayer;
}

export function startRound(state: RoomState): boolean {
  const validStartPhases: GamePhase[] = ["lobby", "reveal1", "interstitial"];
  if (!validStartPhases.includes(state.phase)) return false;

  const playerCount = Object.values(state.players).filter((p) => p.connected).length;
  if (playerCount === 0) return false;

  const isRound2 = state.phase === "interstitial";
  state.round = isRound2 ? 2 : 1;
  state.phase = isRound2 ? "round2" : "round1";
  const { target } = pickRandomTarget(isRound2 ? 2 : 1);
  state.currentTarget = target;
  state.timerEnd = Date.now() + ROUND_DURATION_MS;

  for (const team of Object.values(state.teams)) {
    if (isRound2) {
      // Snapshot round 1 grid before resetting
      team.round1Grid = team.grid.map(row => row.map(col => [...col]));
    }
    team.grid = createEmptyGrid();
  }

  // Swap all player roles for round 2
  if (isRound2) {
    for (const team of Object.values(state.teams)) {
      const connectedPlayers = team.players
        .map(pid => state.players[pid])
        .filter(p => p && p.connected);

      for (const p of connectedPlayers) {
        p.role = p.role === "architect" ? "builder" : "architect";
      }

      // Ensure exactly one architect per team
      const hasArchitect = connectedPlayers.some(p => p.role === "architect");
      if (!hasArchitect && connectedPlayers.length > 0) {
        connectedPlayers[0].role = "architect";
      }
    }
  }

  // Solo architect fix: if a team has exactly 1 connected player, force them to architect
  for (const team of Object.values(state.teams)) {
    const connectedPlayers = team.players
      .map((pid) => state.players[pid])
      .filter((p) => p && p.connected);

    if (connectedPlayers.length === 1) {
      connectedPlayers[0].role = "architect";
    }
  }

  return true;
}

export function endRound(state: RoomState): void {
  if (state.phase === "round1") {
    state.phase = "reveal1";
    state.timerEnd = null;
  } else if (state.phase === "round2") {
    state.phase = "finalReveal";
    state.timerEnd = null;
  }
}

export function advancePhase(state: RoomState): void {
  const transitions: Partial<Record<GamePhase, GamePhase>> = {
    reveal1: "interstitial",
    interstitial: "round2",
    finalReveal: "summary",
  };
  const next = transitions[state.phase];
  if (next) state.phase = next;
}

export function startDemo(state: RoomState): void {
  if (state.phase !== "lobby") return;
  state.phase = "demo";
  state.timerEnd = Date.now() + 60_000; // 60 seconds

  // Reset all grids for free-build
  for (const team of Object.values(state.teams)) {
    team.grid = createEmptyGrid();
  }
}

export function endDemo(state: RoomState): void {
  if (state.phase !== "demo") return;
  state.phase = "lobby";
  state.timerEnd = null;

  // Clear demo builds
  for (const team of Object.values(state.teams)) {
    team.grid = createEmptyGrid();
  }
}

export function placeBlock(
  state: RoomState,
  teamId: string,
  row: number,
  col: number,
  block: BlockType
): { placed: boolean; height: number } {
  const team = state.teams[teamId];
  if (!team) return { placed: false, height: -1 };
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return { placed: false, height: -1 };
  if (state.phase !== "round1" && state.phase !== "round2" && state.phase !== "demo") return { placed: false, height: -1 };

  if (block === "empty") {
    // Erase topmost block
    const topH = getTopBlockHeight(team.grid, row, col);
    if (topH < 0) return { placed: false, height: -1 };
    team.grid[row][col][topH] = "empty";
    return { placed: true, height: topH };
  } else {
    // Place at next available height
    const nextH = getStackHeight(team.grid, row, col);
    if (nextH >= MAX_HEIGHT) return { placed: false, height: -1 };
    team.grid[row][col][nextH] = block;
    return { placed: true, height: nextH };
  }
}

export function calculateScore(build: Grid, target: Grid): number {
  let correct = 0;
  let total = 0;

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      for (let h = 0; h < MAX_HEIGHT; h++) {
        const expected = target[r][c][h];
        const actual = build[r][c][h];

        if (expected !== "empty") {
          total++;
          if (actual === expected) correct++;
        }

        if (expected === "empty" && actual !== "empty") {
          total++;
        }
      }
    }
  }

  return total === 0 ? 0 : Math.round((correct / total) * 100);
}

export function calculateAllScores(state: RoomState): void {
  const target = state.currentTarget;
  if (!target) return;

  for (const team of Object.values(state.teams)) {
    if (state.round === 1) {
      team.round1Score = calculateScore(team.grid, target);
    } else {
      team.round2Score = calculateScore(team.grid, target);
    }
  }
}
