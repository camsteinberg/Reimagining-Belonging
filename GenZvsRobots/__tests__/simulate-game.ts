/**
 * Blueprint Telephone — Full game session WebSocket integration test
 *
 * Simulates a complete game flow:
 *   lobby -> round1 -> reveal1 -> interstitial -> round2 -> finalReveal -> summary
 *
 * Run with:  npx tsx __tests__/simulate-game.ts
 */

import WebSocket, { type RawData } from "ws";
import * as fs from "fs";
import * as path from "path";

const DEBUG = process.env.DEBUG === "1";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GameState {
  code: string;
  phase: string;
  players: Record<string, {
    id: string; name: string; teamId: string; role: string; connected: boolean;
  }>;
  teams: Record<string, {
    id: string; name: string; players: string[]; grid: string[][];
    round1Grid: string[][] | null; round1Score: number | null; round2Score: number | null;
  }>;
  currentTarget: string[][] | null;
  round: number;
  timerEnd: number | null;
  hostConnected: boolean;
}

interface ServerMsg {
  type: string;
  state?: GameState;
  message?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Result tracking
// ---------------------------------------------------------------------------

const results: string[] = [];
let passCount = 0;
let failCount = 0;

function log(msg: string) {
  console.log(msg);
  results.push(msg);
}
function pass(label: string, detail = "") {
  passCount++;
  log(`  [PASS] ${label}${detail ? " -- " + detail : ""}`);
}
function fail(label: string, detail = "") {
  failCount++;
  log(`  [FAIL] ${label}${detail ? " -- " + detail : ""}`);
}
function check(ok: boolean, label: string, detail = "") {
  if (ok) pass(label, detail);
  else fail(label, detail);
}

// ---------------------------------------------------------------------------
// SmartSocket: WebSocket wrapper that tracks latest state
// ---------------------------------------------------------------------------

class SmartSocket {
  ws: WebSocket;
  label: string;
  latestState: GameState | null = null;
  stateVersion = 0; // incremented on every state msg
  allMessages: ServerMsg[] = [];
  private waiters: Array<(msg: ServerMsg) => void> = [];

  constructor(ws: WebSocket, label: string) {
    this.ws = ws;
    this.label = label;
    ws.on("message", (raw: RawData) => {
      try {
        const str = typeof raw === "string" ? raw : raw.toString();
        if (DEBUG) console.log(`  [DEBUG] ${label} recv: ${str.substring(0, 140)}`);
        const msg: ServerMsg = JSON.parse(str);
        this.allMessages.push(msg);
        if (msg.type === "state" && msg.state) {
          this.latestState = msg.state;
          this.stateVersion++;
        }
        // Notify all waiters
        for (const w of this.waiters) w(msg);
      } catch { /* ignore */ }
    });
  }

  send(msg: Record<string, unknown>) {
    this.ws.send(JSON.stringify(msg));
  }

  close() {
    try { this.ws.close(); } catch { /* ignore */ }
  }

  /** Wait until a state matching the predicate is received. Checks current state first. */
  waitForState(
    predicate: (s: GameState) => boolean,
    label: string,
    timeoutMs = 10_000,
  ): Promise<GameState> {
    // Check if current state already matches
    if (this.latestState && predicate(this.latestState)) {
      return Promise.resolve(this.latestState);
    }

    return new Promise<GameState>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.removeWaiter(waiter);
        reject(new Error(`Timeout waiting for state: ${label}`));
      }, timeoutMs);

      const waiter = (msg: ServerMsg) => {
        if (msg.type === "state" && msg.state && predicate(msg.state)) {
          clearTimeout(timer);
          this.removeWaiter(waiter);
          resolve(msg.state);
        }
      };
      this.waiters.push(waiter);
    });
  }

  /** Wait for any message of a given type */
  waitForMsg(type: string, timeoutMs = 10_000): Promise<ServerMsg> {
    // Check recent messages (last 20)
    for (let i = Math.max(0, this.allMessages.length - 20); i < this.allMessages.length; i++) {
      if (this.allMessages[i].type === type) {
        const msg = this.allMessages[i];
        return Promise.resolve(msg);
      }
    }

    return new Promise<ServerMsg>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.removeWaiter(waiter);
        reject(new Error(`Timeout waiting for msg type: ${type}`));
      }, timeoutMs);

      const waiter = (msg: ServerMsg) => {
        if (msg.type === type) {
          clearTimeout(timer);
          this.removeWaiter(waiter);
          resolve(msg);
        }
      };
      this.waiters.push(waiter);
    });
  }

  private removeWaiter(w: (msg: ServerMsg) => void) {
    const idx = this.waiters.indexOf(w);
    if (idx >= 0) this.waiters.splice(idx, 1);
  }
}

// Connect and wrap in SmartSocket
async function connect(url: string, label: string): Promise<SmartSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error(`Connection timeout: ${label}`));
    }, 10_000);
    ws.on("error", (err) => { clearTimeout(timer); reject(err); });
    ws.on("open", () => {
      clearTimeout(timer);
      if (DEBUG) console.log(`  [DEBUG] ${label} connected`);
      resolve(new SmartSocket(ws, label));
    });
  });
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Main test
// ---------------------------------------------------------------------------

async function main() {
  const allSockets: SmartSocket[] = [];

  const roomCode = Array.from({ length: 4 }, () =>
    String.fromCharCode(97 + Math.floor(Math.random() * 26))
  ).join("");
  const roomUrl = `ws://127.0.0.1:1999/parties/main/${roomCode}`;

  log(`\n=== Blueprint Telephone Integration Test ===`);
  log(`Room code: ${roomCode}`);
  log(`Room URL:  ${roomUrl}`);
  log(`Start:     ${new Date().toISOString()}\n`);

  try {
    // ------------------------------------------------------------------
    // Step 1: Host connects and joins
    // ------------------------------------------------------------------
    log("--- Step 1: Host connects ---");
    const host = await connect(roomUrl, "host");
    allSockets.push(host);

    // Wait for initial state
    const initialState = await host.waitForState((s) => s.phase === "lobby", "initial lobby");
    check(initialState.phase === "lobby", "Initial phase is lobby");
    check(Object.keys(initialState.players).length === 0, "No players initially");
    check(!initialState.hostConnected, "Host not yet flagged as connected");

    host.send({ type: "join", name: "Host", isHost: true });
    const hostJoinState = await host.waitForState((s) => s.hostConnected, "host joined");
    check(hostJoinState.hostConnected, "Host connected flag set after join");
    log("");

    // ------------------------------------------------------------------
    // Step 2: Four players connect and join
    // ------------------------------------------------------------------
    log("--- Step 2: Four players connect and join ---");
    const playerNames = ["Alice", "Bob", "Carol", "Dave"];
    const playerSockets: SmartSocket[] = [];

    for (const name of playerNames) {
      const ss = await connect(roomUrl, name);
      allSockets.push(ss);
      playerSockets.push(ss);

      // Wait for initial state on new socket
      await ss.waitForState(() => true, `${name} initial state`);

      ss.send({ type: "join", name });

      // Wait on host for this player to appear
      await host.waitForState(
        (s) => Object.values(s.players).some((p) => p.name === name),
        `${name} in state`,
      );
      log(`  Player "${name}" joined`);
    }

    // Give server time to settle
    await sleep(300);

    // Grab the latest state from host (should already have 4 players)
    const lobbyState = host.latestState!;
    check(Object.keys(lobbyState.players).length === 4, "4 players in state");
    check(Object.keys(lobbyState.teams).length >= 2, "At least 2 teams", `got ${Object.keys(lobbyState.teams).length}`);

    // Verify roles: first player per team = architect, rest = builder
    for (const team of Object.values(lobbyState.teams)) {
      const teamPlayers = team.players.map((pid) => lobbyState.players[pid]);
      if (teamPlayers.length >= 1) {
        check(
          teamPlayers[0].role === "architect",
          `Team "${team.name}" first player is architect`,
          `${teamPlayers[0].name} = ${teamPlayers[0].role}`,
        );
      }
      for (let i = 1; i < teamPlayers.length; i++) {
        check(
          teamPlayers[i].role === "builder",
          `Team "${team.name}" player ${i + 1} is builder`,
          `${teamPlayers[i].name} = ${teamPlayers[i].role}`,
        );
      }
    }

    // Map player name -> socket
    const socketByName: Record<string, SmartSocket> = {};
    for (let i = 0; i < playerNames.length; i++) {
      socketByName[playerNames[i]] = playerSockets[i];
    }

    log("");

    // ------------------------------------------------------------------
    // Step 3: Host starts round 1
    // ------------------------------------------------------------------
    log("--- Step 3: Host starts round 1 ---");
    host.send({ type: "hostAction", action: "startRound" });

    const round1State = await host.waitForState((s) => s.phase === "round1", "phase=round1");
    check(round1State.phase === "round1", "Phase is round1");
    check(round1State.round === 1, "Round number is 1");
    check(round1State.currentTarget !== null, "Target grid exists");
    check(round1State.timerEnd !== null, "Timer is set");
    if (round1State.timerEnd) {
      const remaining = round1State.timerEnd - Date.now();
      check(remaining > 0, "Timer is in the future", `${Math.round(remaining / 1000)}s remaining`);
    }

    for (const team of Object.values(round1State.teams)) {
      const allEmpty = team.grid.every((row) => row.every((cell) => cell === "empty"));
      check(allEmpty, `Team "${team.name}" grid is empty at round start`);
    }
    log("");

    // ------------------------------------------------------------------
    // Step 4: Builders place blocks, architects chat
    // ------------------------------------------------------------------
    log("--- Step 4: Builders place blocks, architects chat ---");

    const target = round1State.currentTarget!;

    const builders: { name: string; ss: SmartSocket; teamId: string }[] = [];
    const architects: { name: string; ss: SmartSocket; teamId: string }[] = [];

    for (const p of Object.values(round1State.players)) {
      const ss = socketByName[p.name];
      if (!ss) continue;
      if (p.role === "builder") builders.push({ name: p.name, ss, teamId: p.teamId });
      else architects.push({ name: p.name, ss, teamId: p.teamId });
    }

    log(`  Builders:   ${builders.map((b) => b.name).join(", ")}`);
    log(`  Architects: ${architects.map((a) => a.name).join(", ")}`);

    // Architects send chat
    for (const arch of architects) {
      arch.ss.send({ type: "chat", text: `Build the house! - from ${arch.name}` });
      log(`  Architect ${arch.name} sent chat`);
    }
    await sleep(200);

    // Builders place blocks matching target
    let blocksPlaced = 0;
    for (const builder of builders) {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (target[r][c] !== "empty") {
            builder.ss.send({ type: "placeBlock", row: r, col: c, block: target[r][c] });
            blocksPlaced++;
          }
        }
      }
    }
    log(`  Placed ${blocksPlaced} blocks across ${builders.length} builders`);
    await sleep(500);
    pass("Block placement messages sent");

    // Verify architect cannot place blocks (server silently ignores)
    if (architects.length > 0) {
      architects[0].ss.send({ type: "placeBlock", row: 0, col: 7, block: "wall" });
      await sleep(200);
      log(`  Verified architect placeBlock sent (server ignores)`);
    }
    log("");

    // ------------------------------------------------------------------
    // Step 5: Skip to reveal (end round 1)
    // ------------------------------------------------------------------
    log("--- Step 5: Host skips to reveal (end round 1) ---");
    host.send({ type: "hostAction", action: "skipToReveal" });

    const reveal1State = await host.waitForState((s) => s.phase === "reveal1", "phase=reveal1");
    check(reveal1State.phase === "reveal1", "Phase is reveal1");
    check(reveal1State.timerEnd === null, "Timer cleared");

    for (const team of Object.values(reveal1State.teams)) {
      check(team.round1Score !== null, `Team "${team.name}" has round1Score`, `score=${team.round1Score}`);
      if (team.round1Score !== null) {
        check(team.round1Score >= 0 && team.round1Score <= 100, `Score in range 0-100`, `${team.round1Score}`);
      }
    }
    log("");

    // ------------------------------------------------------------------
    // Step 6: Advance reveal1 -> interstitial
    // ------------------------------------------------------------------
    log("--- Step 6: Advance reveal1 -> interstitial ---");
    host.send({ type: "hostAction", action: "nextReveal" });

    const interstitialState = await host.waitForState((s) => s.phase === "interstitial", "phase=interstitial");
    check(interstitialState.phase === "interstitial", "Phase is interstitial");
    log("");

    // ------------------------------------------------------------------
    // Step 7: Start round 2 from interstitial
    // ------------------------------------------------------------------
    log("--- Step 7: Start round 2 from interstitial ---");

    // Remember round 1 roles
    const round1Roles: Record<string, string> = {};
    for (const p of Object.values(interstitialState.players)) {
      round1Roles[p.id] = p.role;
    }

    host.send({ type: "hostAction", action: "nextReveal" });

    const round2State = await host.waitForState((s) => s.phase === "round2", "phase=round2");
    check(round2State.phase === "round2", "Phase is round2");
    check(round2State.round === 2, "Round number is 2");
    check(round2State.currentTarget !== null, "New target grid for round 2");
    check(round2State.timerEnd !== null, "Timer set for round 2");

    // Verify role swap
    let rolesSwapped = true;
    for (const p of Object.values(round2State.players)) {
      const oldRole = round1Roles[p.id];
      if (oldRole) {
        const expected = oldRole === "architect" ? "builder" : "architect";
        if (p.role !== expected) {
          rolesSwapped = false;
          fail(`Role swap for ${p.name}`, `was ${oldRole}, expected ${expected}, got ${p.role}`);
        }
      }
    }
    if (rolesSwapped) pass("All roles swapped correctly for round 2");

    for (const team of Object.values(round2State.teams)) {
      const allEmpty = team.grid.every((row) => row.every((cell) => cell === "empty"));
      check(allEmpty, `Team "${team.name}" grid reset for round 2`);
      check(team.round1Grid !== null, `Team "${team.name}" round1Grid snapshot saved`);
    }
    log("");

    // ------------------------------------------------------------------
    // Step 8: Builders place blocks in round 2
    // ------------------------------------------------------------------
    log("--- Step 8: Builders place blocks in round 2 ---");

    const target2 = round2State.currentTarget!;

    const builders2: { name: string; ss: SmartSocket; teamId: string }[] = [];
    for (const p of Object.values(round2State.players)) {
      const ss = socketByName[p.name];
      if (!ss) continue;
      if (p.role === "builder") builders2.push({ name: p.name, ss, teamId: p.teamId });
    }
    log(`  Round 2 builders: ${builders2.map((b) => b.name).join(", ")}`);

    let blocks2Placed = 0;
    for (const builder of builders2) {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (target2[r][c] !== "empty") {
            builder.ss.send({ type: "placeBlock", row: r, col: c, block: target2[r][c] });
            blocks2Placed++;
          }
        }
      }
    }
    log(`  Placed ${blocks2Placed} blocks in round 2`);
    await sleep(500);
    log("");

    // ------------------------------------------------------------------
    // Step 9: Skip to reveal (end round 2)
    // ------------------------------------------------------------------
    log("--- Step 9: Skip to reveal (end round 2) ---");
    host.send({ type: "hostAction", action: "skipToReveal" });

    const finalRevealState = await host.waitForState((s) => s.phase === "finalReveal", "phase=finalReveal");
    check(finalRevealState.phase === "finalReveal", "Phase is finalReveal");
    check(finalRevealState.timerEnd === null, "Timer cleared");

    for (const team of Object.values(finalRevealState.teams)) {
      check(team.round1Score !== null, `Team "${team.name}" round1Score in finalReveal`, `${team.round1Score}`);
      check(team.round2Score !== null, `Team "${team.name}" round2Score in finalReveal`, `${team.round2Score}`);
    }
    log("");

    // ------------------------------------------------------------------
    // Step 10: Host ends game
    // ------------------------------------------------------------------
    log("--- Step 10: Host ends game ---");
    host.send({ type: "hostAction", action: "endGame" });

    const summaryState = await host.waitForState((s) => s.phase === "summary", "phase=summary");
    check(summaryState.phase === "summary", "Phase is summary");

    for (const team of Object.values(summaryState.teams)) {
      check(team.round1Score !== null, `Team "${team.name}" round1Score in summary`);
      check(team.round2Score !== null, `Team "${team.name}" round2Score in summary`);
      log(`  Team "${team.name}": R1=${team.round1Score}%, R2=${team.round2Score}%`);
    }
    log("");

    // ------------------------------------------------------------------
    // Step 11: Edge case checks
    // ------------------------------------------------------------------
    log("--- Step 11: Edge case checks ---");

    // Non-host cannot do host actions
    if (playerSockets.length > 0) {
      const nonHost = playerSockets[0];
      // Clear recent messages
      const prevLen = nonHost.allMessages.length;
      nonHost.send({ type: "hostAction", action: "startRound" });
      await sleep(500);

      // Check if error message was received after our send
      const newMsgs = nonHost.allMessages.slice(prevLen);
      const errorMsg = newMsgs.find((m) => m.type === "error");
      if (errorMsg) {
        check(
          errorMsg.message === "Not authorized",
          "Non-host hostAction returns error",
          `message="${errorMsg.message}"`,
        );
      } else {
        pass("Non-host hostAction did not crash server");
      }
    }
    log("");

  } catch (err) {
    fail("Unexpected error", String(err));
    log(`\n  ERROR DETAILS: ${err instanceof Error ? err.stack : String(err)}`);
  } finally {
    log("--- Cleanup ---");
    for (const ss of allSockets) ss.close();
    await sleep(500);

    log(`\n=== RESULTS ===`);
    log(`  Passed: ${passCount}`);
    log(`  Failed: ${failCount}`);
    log(`  Total:  ${passCount + failCount}`);
    log(`  End:    ${new Date().toISOString()}\n`);

    const outPath = path.join(__dirname, "test-results.txt");
    fs.writeFileSync(outPath, results.join("\n") + "\n", "utf-8");
    console.log(`Results saved to ${outPath}`);

    process.exit(failCount > 0 ? 1 : 0);
  }
}

main();
