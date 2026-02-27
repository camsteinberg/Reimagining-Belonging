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
  DESIGN_DURATION_MS,
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
    nextTeamIndex: 0,
    theme: null,
  };
}

export function addPlayer(state: RoomState, id: string, name: string): Player {
  // Find a team with available space (strict 2-player teams)
  let teamId = Object.keys(state.teams).find(
    (tid) => state.teams[tid].players.length < MAX_TEAM_SIZE
  );

  if (!teamId) {
    const teamIndex = state.nextTeamIndex++;
    teamId = `team-${teamIndex}`;
    state.teams[teamId] = {
      id: teamId,
      name: TEAM_NAMES[teamIndex % TEAM_NAMES.length],
      players: [],
      grid: createEmptyGrid(),
      round1Grid: null,
      round1Target: null,
      round1Score: null,
      round2Score: null,
      designGrid: null,
      roundTarget: null,
      aiActionLog: [],
    };
  }

  // First player in a team becomes architect, all others are builders
  const team = state.teams[teamId];
  const role: Role = team.players.length === 0 ? "architect" : "builder";

  const reconnectToken = Math.random().toString(36).slice(2, 10);
  const player: Player = { id, name, teamId, role, connected: true, reconnectToken, designGrid: null };
  state.players[id] = player;
  team.players.push(id);

  return player;
}

export function removePlayer(state: RoomState, id: string): void {
  const player = state.players[id];
  if (!player) return;
  player.connected = false;

  // Do NOT remove from team.players — keep the entry so reconnection can find and remap it.
  // Do NOT demote the architect here — reconnectPlayer() handles duplicate-architect checks.
  // Demoting on disconnect causes permanent role swaps on brief WiFi drops.

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

  // Ensure no duplicate architects after reconnection
  if (team) {
    const connectedArchitects = team.players
      .map(pid => state.players[pid])
      .filter(p => p && p.connected && p.role === "architect");
    if (connectedArchitects.length > 1) {
      // Demote the reconnecting player — the promoted replacement keeps architect
      newPlayer.role = "builder";
    }
  }

  return newPlayer;
}

export function startRound(state: RoomState): boolean {
  const validStartPhases: GamePhase[] = ["lobby", "interstitial"];
  if (!validStartPhases.includes(state.phase)) return false;

  const playerCount = Object.values(state.players).filter((p) => p.connected).length;
  if (playerCount === 0) return false;

  const isRound2 = state.phase === "interstitial";
  state.round = isRound2 ? 2 : 1;
  state.phase = isRound2 ? "round2" : "round1";
  state.timerEnd = Date.now() + ROUND_DURATION_MS;

  for (const team of Object.values(state.teams)) {
    if (isRound2) {
      // Snapshot round 1 grid and target before resetting
      team.round1Grid = team.grid.map(row => row.map(col => [...col]));
      team.round1Target = team.roundTarget;
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

  // Set target = current architect's design (the architect describes THEIR creation)
  const hasDesigns = Object.values(state.players).some(p => p.designGrid != null);
  for (const team of Object.values(state.teams)) {
    if (hasDesigns) {
      const architect = team.players
        .map(pid => state.players[pid])
        .filter(p => p?.connected && p.role === "architect")[0];

      if (architect?.designGrid) {
        team.roundTarget = architect.designGrid;
      } else {
        // Fallback: no architect design available
        const { target } = pickRandomTarget(isRound2 ? 2 : 1);
        team.roundTarget = target;
      }
      state.currentTarget = null;
    } else {
      // No design phase happened — use prepopulated targets
      const { target } = pickRandomTarget(isRound2 ? 2 : 1);
      team.roundTarget = target;
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
    finalReveal: "summary",
  };
  const next = transitions[state.phase];
  if (next) state.phase = next;
}

export function startDemo(state: RoomState): boolean {
  if (state.phase !== "lobby") return false;
  state.phase = "demo";
  state.timerEnd = Date.now() + 60_000; // 60 seconds

  // Reset all grids for free-build
  for (const team of Object.values(state.teams)) {
    team.grid = createEmptyGrid();
  }
  return true;
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
  playerId: string,
  row: number,
  col: number,
  block: BlockType
): { placed: boolean; height: number; secondHeight?: number } {
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return { placed: false, height: -1 };
  const allowedPhases: GamePhase[] = ["round1", "round2", "demo", "design"];
  if (!allowedPhases.includes(state.phase)) return { placed: false, height: -1 };

  // Choose grid based on phase
  const grid = state.phase === "design"
    ? state.players[playerId]?.designGrid
    : state.teams[teamId]?.grid;
  if (!grid) return { placed: false, height: -1 };

  if (block === "empty") {
    // Erase topmost block — if it's a door sitting on another door, erase both
    const topH = getTopBlockHeight(grid, row, col);
    if (topH < 0) return { placed: false, height: -1 };
    if (grid[row][col][topH] === "door" && topH > 0 && grid[row][col][topH - 1] === "door") {
      grid[row][col][topH] = "empty";
      grid[row][col][topH - 1] = "empty";
      return { placed: true, height: topH, secondHeight: topH - 1 };
    }
    grid[row][col][topH] = "empty";
    return { placed: true, height: topH };
  } else if (block === "door") {
    // Doors auto-stack 2 blocks high
    const nextH = getStackHeight(grid, row, col);
    if (nextH >= MAX_HEIGHT) return { placed: false, height: -1 };
    grid[row][col][nextH] = "door";
    // Place second door block above if there's room
    if (nextH + 1 < MAX_HEIGHT) {
      grid[row][col][nextH + 1] = "door";
      return { placed: true, height: nextH, secondHeight: nextH + 1 };
    }
    return { placed: true, height: nextH };
  } else {
    // Place at next available height
    const nextH = getStackHeight(grid, row, col);
    if (nextH >= MAX_HEIGHT) return { placed: false, height: -1 };
    grid[row][col][nextH] = block;
    return { placed: true, height: nextH };
  }
}

export function calculateScore(build: Grid, target: Grid): number {
  let correct = 0;
  let total = 0;

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      for (let h = 0; h < MAX_HEIGHT; h++) {
        // Treat air as empty for scoring — it's invisible scaffolding
        const expected = target[r][c][h] === "air" ? "empty" : target[r][c][h];
        const actual = build[r][c][h] === "air" ? "empty" : build[r][c][h];

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
  for (const team of Object.values(state.teams)) {
    const target = team.roundTarget ?? state.currentTarget;
    if (!target) continue;

    if (state.round === 1) {
      team.round1Score = calculateScore(team.grid, target);
    } else {
      team.round2Score = calculateScore(team.grid, target);
    }
  }
}

export function startDesign(state: RoomState): boolean {
  if (state.phase !== "lobby") return false;

  state.phase = "design";
  state.timerEnd = Date.now() + DESIGN_DURATION_MS;

  // Give each player their own empty design grid
  for (const player of Object.values(state.players)) {
    player.designGrid = createEmptyGrid();
  }
  return true;
}

export function endDesign(state: RoomState): boolean {
  if (state.phase !== "design") return false;
  state.timerEnd = null;
  // Designs are already saved on each player's designGrid
  // DON'T cross-assign targets here — that happens in startRound()
  state.phase = "lobby";
  return true;
}

export function resetToLobby(state: RoomState): void {
  state.phase = "lobby";
  state.round = 1;
  state.currentTarget = null;
  state.timerEnd = null;
  state.nextTeamIndex = Object.keys(state.teams).length;
  state.theme = null;

  for (const team of Object.values(state.teams)) {
    team.grid = createEmptyGrid();
    team.designGrid = null;
    team.roundTarget = null;
    team.round1Grid = null;
    team.round1Target = null;
    team.round1Score = null;
    team.round2Score = null;
    team.aiActionLog = [];
  }

  // Remove disconnected players to prevent ghost team slots on "Play Again"
  for (const [pid, player] of Object.entries(state.players)) {
    if (!player.connected) {
      delete state.players[pid];
    } else {
      player.designGrid = null;
    }
  }

  // Clean disconnected players from team rosters and delete empty teams
  for (const [tid, team] of Object.entries(state.teams)) {
    team.players = team.players.filter(pid => state.players[pid]?.connected);
    if (team.players.length === 0) {
      delete state.teams[tid];
    }
  }

  // Reset roles (first connected player = architect)
  for (const team of Object.values(state.teams)) {
    const connected = team.players
      .map(pid => state.players[pid])
      .filter(p => p?.connected);
    for (let i = 0; i < connected.length; i++) {
      connected[i].role = i === 0 ? "architect" : "builder";
    }
  }
}

export function setTeamName(state: RoomState, teamId: string, name: string): void {
  const team = state.teams[teamId];
  if (!team) return;
  team.name = name.trim().slice(0, 24) || team.name;
}

export function kickPlayer(state: RoomState, playerId: string): boolean {
  const player = state.players[playerId];
  if (!player) return false;

  const team = state.teams[player.teamId];
  if (team) {
    team.players = team.players.filter(pid => pid !== playerId);
    if (team.players.length === 0) {
      delete state.teams[player.teamId];
    } else {
      const hasArchitect = team.players.some(pid =>
        state.players[pid]?.role === "architect" && state.players[pid]?.connected
      );
      if (!hasArchitect) {
        const next = team.players.find(pid => state.players[pid]?.connected);
        if (next) state.players[next].role = "architect";
      }
    }
  }

  delete state.players[playerId];
  return true;
}
