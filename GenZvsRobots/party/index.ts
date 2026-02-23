import type * as Party from "partykit/server";
import type { ClientMessage, ServerMessage, RoomState, BuildAction, BlockType } from "../lib/types";
import {
  createRoomState,
  addPlayer,
  removePlayer,
  startRound,
  endRound,
  advancePhase,
  placeBlock,
  calculateAllScores,
} from "./gameState";

export default class GameRoom implements Party.Server {
  state: RoomState;
  hostId: string | null = null;
  timerInterval: ReturnType<typeof setInterval> | null = null;

  constructor(readonly room: Party.Room) {
    this.state = createRoomState();
  }

  // Send current state to newly connected client
  onConnect(conn: Party.Connection, _ctx: Party.ConnectionContext) {
    this.send(conn, { type: "state", state: this.state });
  }

  // Mark player disconnected and notify all clients
  onClose(conn: Party.Connection) {
    if (conn.id === this.hostId) {
      this.state.hostConnected = false;
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
        } else {
          const player = addPlayer(this.state, sender.id, msg.name);
          this.broadcast({ type: "playerJoined", player });
        }
        this.broadcastState();
        break;
      }

      case "placeBlock": {
        const player = this.state.players[sender.id];
        if (!player || player.role !== "builder") return;

        const placed = placeBlock(
          this.state,
          player.teamId,
          msg.row,
          msg.col,
          msg.block
        );
        if (placed) {
          this.broadcast({
            type: "gridUpdate",
            teamId: player.teamId,
            row: msg.row,
            col: msg.col,
            block: msg.block,
          });
        }
        break;
      }

      case "chat": {
        const chatPlayer = this.state.players[sender.id];
        if (!chatPlayer) return;

        const chatMsg: ServerMessage = {
          type: "chat",
          teamId: chatPlayer.teamId,
          senderId: chatPlayer.id,
          senderName: chatPlayer.name,
          text: msg.text,
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
        this.handleHostAction(msg.action);
        break;
      }

      case "aiChat": {
        // aiChat messages from players are handled by the Next.js API route,
        // which calls back into this room via HTTP POST. Nothing to do here.
        break;
      }
    }
  }

  // CORS headers for cross-origin requests from the Next.js frontend
  corsHeaders(): Record<string, string> {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
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

    let body: {
      type: string;
      teamId: string;
      text: string;
      actions: { row: number; col: number; block: string }[];
    };

    try {
      body = await req.json() as typeof body;
    } catch {
      return new Response("Bad request", { status: 400, headers: this.corsHeaders() });
    }

    if (body.type !== "aiResponse") {
      return new Response("Not found", { status: 404, headers: this.corsHeaders() });
    }

    const { teamId, text, actions } = body;

    // Apply AI build actions to the team's grid
    for (const action of actions) {
      placeBlock(
        this.state,
        teamId,
        action.row,
        action.col,
        action.block as BlockType
      );
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
    if (actions.length > 0) {
      this.broadcastToTeam(teamId, {
        type: "aiBuilding",
        teamId,
        actions: actions as BuildAction[],
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
        startRound(this.state);
        this.startTimer();
        break;
      }
      case "pause": {
        this.stopTimer();
        break;
      }
      case "resume": {
        this.startTimer();
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
          startRound(this.state);
          this.startTimer();
        } else {
          advancePhase(this.state);
        }
        break;
      }
      case "prevReveal": {
        // No-op for now — the host can always skip forward
        break;
      }
      case "endGame": {
        this.stopTimer();
        this.state.phase = "summary";
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
        calculateAllScores(this.state);
        endRound(this.state);
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
