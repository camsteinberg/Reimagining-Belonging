import type * as Party from "partykit/server";
import type { ClientMessage, ServerMessage, RoomState, BuildAction, BlockType } from "../lib/types";
import {
  createRoomState,
  addPlayer,
  removePlayer,
  reconnectPlayer,
  startRound,
  endRound,
  advancePhase,
  placeBlock,
  calculateAllScores,
  startDemo,
  endDemo,
  startDesign,
  endDesign,
  resetToLobby,
  setTeamName,
  kickPlayer,
} from "./gameState";
import { GRID_SIZE } from "../lib/constants";

const VALID_BLOCK_TYPES = new Set<string>([
  "wall", "floor", "roof", "window", "door", "plant", "table",
  "metal", "concrete", "barrel", "pipe", "air", "empty",
]);

export default class GameRoom implements Party.Server {
  state: RoomState;
  hostId: string | null = null;
  timerInterval: ReturnType<typeof setInterval> | null = null;
  pausedRemainingMs: number | null = null;

  constructor(readonly room: Party.Room) {
    this.state = createRoomState();
    // Use the actual PartyKit room ID as the display code
    // (not the random one from createRoomState)
    this.state.code = this.room.id.toUpperCase();
  }

  // Send current state to newly connected client
  onConnect(conn: Party.Connection, _ctx: Party.ConnectionContext) {
    this.send(conn, { type: "state", state: this.state });
  }

  // Mark player disconnected and notify all clients
  onClose(conn: Party.Connection) {
    if (conn.id === this.hostId) {
      this.state.hostConnected = false;
      // Save remaining time before stopping so it can be restored on reconnect
      if (this.state.timerEnd) {
        this.pausedRemainingMs = Math.max(0, this.state.timerEnd - Date.now());
      }
      this.stopTimer();
      this.state.timerEnd = null;
    }
    removePlayer(this.state, conn.id);
    this.broadcastState();
  }

  onMessage(message: string, sender: Party.Connection) {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(message) as ClientMessage;
    } catch {
      return;
    }

    switch (msg.type) {
      case "join": {
        if (msg.isHost) {
          this.hostId = sender.id;
          this.state.hostConnected = true;
          // Restore timer if host reconnects while a round was paused due to disconnect
          if (this.pausedRemainingMs != null && this.pausedRemainingMs > 0) {
            this.state.timerEnd = Date.now() + this.pausedRemainingMs;
            this.pausedRemainingMs = null;
            this.startTimer();
          }
        } else if (msg.reconnectToken) {
          const reconnected = reconnectPlayer(this.state, sender.id, msg.reconnectToken);
          if (reconnected) {
            this.send(sender, { type: "reconnected", player: reconnected });
            this.broadcastState();
            break;
          }
          // Token didn't match — fall through to normal join
          const player = addPlayer(this.state, sender.id, msg.name);
          this.broadcast({ type: "playerJoined", player });
          this.send(sender, { type: "joined", playerId: sender.id, reconnectToken: player.reconnectToken } as unknown as ServerMessage);
        } else {
          const player = addPlayer(this.state, sender.id, msg.name);
          this.broadcast({ type: "playerJoined", player });
          this.send(sender, { type: "joined", playerId: sender.id, reconnectToken: player.reconnectToken } as unknown as ServerMessage);
        }
        this.broadcastState();
        break;
      }

      case "placeBlock": {
        const player = this.state.players[sender.id];
        if (!player) return;
        // Validate block type
        if (!VALID_BLOCK_TYPES.has(msg.block)) return;
        // Reject placement when the game is paused (timed phase but timer stopped)
        const timedPhases = ["round1", "round2", "design", "demo"];
        if (timedPhases.includes(this.state.phase) && this.state.timerEnd === null) return;
        // During demo or design, all players can place blocks; otherwise only builders
        // Exception: solo player on a team can always build
        if (this.state.phase !== "demo" && this.state.phase !== "design" && player.role !== "builder") {
          const team = this.state.teams[player.teamId];
          const connectedCount = team ? team.players.filter(pid => this.state.players[pid]?.connected).length : 0;
          if (connectedCount !== 1) return;
        }

        const { placed, height, secondHeight } = placeBlock(
          this.state,
          player.teamId,
          sender.id,
          msg.row,
          msg.col,
          msg.block
        );
        if (placed) {
          if (this.state.phase === "design") {
            // During design, broadcast per-player designGridUpdate
            this.broadcast({
              type: "designGridUpdate",
              playerId: sender.id,
              row: msg.row,
              col: msg.col,
              height,
              block: msg.block,
            });
            if (secondHeight !== undefined) {
              this.broadcast({
                type: "designGridUpdate",
                playerId: sender.id,
                row: msg.row,
                col: msg.col,
                height: secondHeight,
                block: msg.block,
              });
            }
          } else {
            const gridMsg: ServerMessage = {
              type: "gridUpdate",
              teamId: player.teamId,
              row: msg.row,
              col: msg.col,
              height,
              block: msg.block,
            };
            this.broadcastToTeam(player.teamId, gridMsg);
            // Also send to host so the projector view stays in sync
            if (this.hostId) {
              const hostConn = this.room.getConnection(this.hostId);
              if (hostConn) this.send(hostConn, gridMsg);
            }
            if (secondHeight !== undefined) {
              const gridMsg2: ServerMessage = {
                type: "gridUpdate",
                teamId: player.teamId,
                row: msg.row,
                col: msg.col,
                height: secondHeight,
                block: msg.block,
              };
              this.broadcastToTeam(player.teamId, gridMsg2);
              if (this.hostId) {
                const hostConn = this.room.getConnection(this.hostId);
                if (hostConn) this.send(hostConn, gridMsg2);
              }
            }
          }
        }
        break;
      }

      case "chat": {
        const chatPlayer = this.state.players[sender.id];
        if (!chatPlayer) return;

        const text = (msg.text || "").trim().slice(0, 500);
        if (!text) return;

        const chatMsg: ServerMessage = {
          type: "chat",
          teamId: chatPlayer.teamId,
          senderId: chatPlayer.id,
          senderName: chatPlayer.name,
          text,
        };

        // Send to all team members
        this.broadcastToTeam(chatPlayer.teamId, chatMsg);

        // Also route to host for the activity feed
        if (this.hostId) {
          const hostConn = this.room.getConnection(this.hostId);
          if (hostConn) {
            this.send(hostConn, chatMsg);
          }
        }
        break;
      }

      case "hostAction": {
        if (sender.id !== this.hostId) {
          this.send(sender, { type: "error", message: "Not authorized" });
          return;
        }
        if (msg.action === "kickPlayer" && msg.targetPlayerId) {
          const targetConn = this.room.getConnection(msg.targetPlayerId);
          if (targetConn) {
            this.send(targetConn, { type: "kicked", message: "You've been removed by the host" });
          }
          kickPlayer(this.state, msg.targetPlayerId);
          this.broadcastState();
        } else {
          this.handleHostAction(msg.action);
        }
        break;
      }

      case "aiChat": {
        // aiChat messages from players are handled by the Next.js API route,
        // which calls back into this room via HTTP POST. Nothing to do here.
        break;
      }

      case "setTeamName": {
        const namePlayer = this.state.players[sender.id];
        if (!namePlayer) return;
        if (this.state.phase !== "lobby") return;
        setTeamName(this.state, namePlayer.teamId, msg.name);
        this.broadcastState();
        break;
      }

      case "setTheme": {
        if (sender.id !== this.hostId) return;
        if (this.state.phase !== "lobby") return;
        this.state.theme = (msg.theme || "").trim().slice(0, 50) || null;
        this.broadcastState();
        break;
      }

      case "leaveGame": {
        const leavingPlayer = this.state.players[sender.id];
        if (!leavingPlayer) return;
        const leavingTeamId = leavingPlayer.teamId;
        const wasArchitect = leavingPlayer.role === "architect";
        // removePlayer marks disconnected but keeps in team.players for reconnect.
        // For explicit leave, also remove from team.players and delete from state.players.
        removePlayer(this.state, sender.id);
        const leavingTeam = this.state.teams[leavingTeamId];
        if (leavingTeam) {
          leavingTeam.players = leavingTeam.players.filter(pid => pid !== sender.id);
          if (leavingTeam.players.filter(pid => this.state.players[pid]?.connected).length === 0) {
            delete this.state.teams[leavingTeamId];
          } else if (wasArchitect) {
            // Reassign architect if the leaving player was the architect
            const hasArchitect = leavingTeam.players.some(pid =>
              this.state.players[pid]?.role === "architect" && this.state.players[pid]?.connected
            );
            if (!hasArchitect) {
              const next = leavingTeam.players.find(pid => this.state.players[pid]?.connected);
              if (next) this.state.players[next].role = "architect";
            }
          }
        }
        delete this.state.players[sender.id];
        this.broadcastState();
        break;
      }
    }
  }

  // CORS headers for cross-origin requests from the Next.js frontend
  corsHeaders(): Record<string, string> {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-party-secret",
    };
  }

  // HTTP handler — receives AI responses from the Next.js API route
  async onRequest(req: Party.Request): Promise<Response> {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: this.corsHeaders() });
    }

    if (req.method !== "POST") {
      return new Response("Not found", { status: 404, headers: this.corsHeaders() });
    }

    // Verify shared secret for HTTP API auth
    const secret = req.headers.get("x-party-secret");
    const expectedSecret = process.env.PARTY_SECRET || "dev-secret";
    if (secret !== expectedSecret) {
      return new Response("Unauthorized", { status: 401, headers: this.corsHeaders() });
    }

    let body: {
      type: string;
      teamId: string;
      text: string;
      actions: { row: number; col: number; block: string }[];
      role?: string;
    };

    try {
      body = await req.json() as typeof body;
    } catch {
      return new Response("Bad request", { status: 400, headers: this.corsHeaders() });
    }

    if (body.type !== "aiResponse") {
      return new Response("Not found", { status: 404, headers: this.corsHeaders() });
    }

    if (this.state.phase !== "round2") {
      return new Response("Round ended", { status: 409, headers: this.corsHeaders() });
    }

    const { teamId, text, actions, role } = body;

    // Architect's Scout must NOT place blocks — only describe/coach
    // Skip all block placement if the requesting player is an architect
    const validActions = role === "architect" ? [] : actions.filter(
      (a) =>
        VALID_BLOCK_TYPES.has(a.block) &&
        typeof a.row === "number" && a.row >= 0 && a.row < GRID_SIZE &&
        typeof a.col === "number" && a.col >= 0 && a.col < GRID_SIZE
    );
    for (const action of validActions) {
      placeBlock(
        this.state,
        teamId,
        "ai",
        action.row,
        action.col,
        action.block as BlockType
      );
    }

    // Log AI actions for the team
    const logTeam = this.state.teams[teamId];
    if (logTeam) {
      for (const action of validActions) {
        logTeam.aiActionLog.push({
          row: action.row,
          col: action.col,
          block: action.block as BlockType,
          timestamp: Date.now(),
        });
      }
      // Keep only last 10
      if (logTeam.aiActionLog.length > 10) {
        logTeam.aiActionLog = logTeam.aiActionLog.slice(-10);
      }
    }

    // Broadcast AI chat message to the team
    this.broadcastToTeam(teamId, {
      type: "chat",
      teamId,
      senderId: "scout",
      senderName: "Scout",
      text,
      isAI: true,
    });

    // Broadcast the build actions to the team so clients can animate AI placements
    if (validActions.length > 0) {
      this.broadcastToTeam(teamId, {
        type: "aiBuilding",
        teamId,
        actions: validActions as BuildAction[],
      });
    }

    // Sync full state after AI modifications
    this.broadcastState();

    return new Response("OK", { headers: this.corsHeaders() });
  }

  // --- Host action handler ---

  handleHostAction(action: string) {
    switch (action) {
      case "startRound": {
        this.pausedRemainingMs = null;
        const started = startRound(this.state);
        if (!started) {
          this.broadcastState();
          return;
        }
        this.startTimer();
        break;
      }
      case "pause": {
        if (this.state.timerEnd) {
          this.pausedRemainingMs = Math.max(0, this.state.timerEnd - Date.now());
        }
        this.stopTimer();
        this.state.timerEnd = null;
        break;
      }
      case "resume": {
        if (this.pausedRemainingMs != null && this.pausedRemainingMs > 0) {
          this.state.timerEnd = Date.now() + this.pausedRemainingMs;
          this.pausedRemainingMs = null;
          this.startTimer();
        } else if (this.pausedRemainingMs != null && this.pausedRemainingMs === 0) {
          // Timer expired during pause — trigger the appropriate phase end
          this.pausedRemainingMs = null;
          if (this.state.phase === "design") {
            endDesign(this.state);
          } else if (this.state.phase === "demo") {
            endDemo(this.state);
          } else if (this.state.phase === "round1" || this.state.phase === "round2") {
            calculateAllScores(this.state);
            endRound(this.state);
          }
        }
        break;
      }
      case "skipToReveal": {
        this.stopTimer();
        calculateAllScores(this.state);
        endRound(this.state);
        break;
      }
      case "nextReveal": {
        if (this.state.phase === "interstitial") {
          // Start round 2 directly — startRound handles the phase transition
          const started = startRound(this.state);
          if (started) {
            this.startTimer();
          }
        } else {
          advancePhase(this.state);
        }
        break;
      }
      case "prevReveal": {
        // No-op for now — the host can always skip forward
        break;
      }
      case "startDemo": {
        this.pausedRemainingMs = null;
        const demoStarted = startDemo(this.state);
        if (demoStarted) {
          this.startTimer();
        }
        break;
      }
      case "endDemo": {
        this.stopTimer();
        endDemo(this.state);
        break;
      }
      case "startDesign": {
        this.pausedRemainingMs = null;
        const designStarted = startDesign(this.state);
        if (designStarted) {
          this.startTimer();
        }
        break;
      }
      case "endDesign": {
        this.stopTimer();
        endDesign(this.state);
        // Returns to lobby — host manually starts round 1
        break;
      }
      case "endGame": {
        this.pausedRemainingMs = null;
        this.stopTimer();
        resetToLobby(this.state);
        break;
      }
    }
    this.broadcastState();
  }

  // --- Timer management ---

  startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      if (this.state.timerEnd && Date.now() >= this.state.timerEnd) {
        this.stopTimer();
        if (this.state.phase === "design") {
          endDesign(this.state);
          // Returns to lobby — host manually starts round 1
        } else if (this.state.phase === "demo") {
          endDemo(this.state);
        } else if (this.state.phase === "round1" || this.state.phase === "round2") {
          calculateAllScores(this.state);
          endRound(this.state);
        }
        this.broadcastState();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // --- Messaging helpers ---

  send(conn: Party.Connection, msg: ServerMessage) {
    conn.send(JSON.stringify(msg));
  }

  broadcast(msg: ServerMessage) {
    this.room.broadcast(JSON.stringify(msg));
  }

  broadcastState() {
    this.broadcast({ type: "state", state: this.state });
  }

  broadcastToTeam(teamId: string, msg: ServerMessage) {
    const team = this.state.teams[teamId];
    if (!team) return;
    const msgStr = JSON.stringify(msg);
    for (const playerId of team.players) {
      const conn = this.room.getConnection(playerId);
      if (conn) conn.send(msgStr);
    }
  }
}
