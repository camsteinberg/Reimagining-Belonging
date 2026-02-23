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
} from "../lib/constants";
import { ROUND_1_TARGET, ROUND_2_TARGET } from "../lib/targets";

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

  const player: Player = { id, name, teamId, role, connected: true };
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

  delete state.players[id];
}

export function startRound(state: RoomState): void {
  const validStartPhases: GamePhase[] = ["lobby", "reveal1", "interstitial"];
  if (!validStartPhases.includes(state.phase)) return;

  const isRound2 = state.phase === "interstitial";
  state.round = isRound2 ? 2 : 1;
  state.phase = isRound2 ? "round2" : "round1";
  state.currentTarget = isRound2 ? ROUND_2_TARGET : ROUND_1_TARGET;
  state.timerEnd = Date.now() + ROUND_DURATION_MS;

  for (const team of Object.values(state.teams)) {
    if (isRound2) {
      // Snapshot round 1 grid before resetting
      team.round1Grid = team.grid.map((row) => [...row]);
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

export function placeBlock(
  state: RoomState,
  teamId: string,
  row: number,
  col: number,
  block: BlockType
): boolean {
  const team = state.teams[teamId];
  if (!team) return false;
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return false;
  if (state.phase !== "round1" && state.phase !== "round2") return false;

  team.grid[row][col] = block;
  return true;
}

export function calculateScore(build: Grid, target: Grid): number {
  let correct = 0;
  let total = 0;

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const expected = target[r][c];
      const actual = build[r][c];

      if (expected !== "empty") {
        total++;
        if (actual === expected) correct++;
      }

      // Penalize extra blocks placed where target is empty
      if (expected === "empty" && actual !== "empty") {
        total++;
        // correct stays the same — this cell is wrong
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
