"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { RoomState, BlockType, ClientMessage, ServerMessage, Team, Player } from "@/lib/types";
import VoxelGrid from "./VoxelGrid";
import BlockPalette from "./BlockPalette";
import ChatPanel, { type ChatMessage } from "./ChatPanel";
import GameHeader from "./GameHeader";
import TutorialOverlay from "./TutorialOverlay";

interface PlayerViewProps {
  state: RoomState;
  playerId: string;
  send: (msg: ClientMessage) => void;
  onMessage: (listener: (msg: ServerMessage) => void) => () => void;
}

// --- Waiting state components ---

function WaitingReveal({ teamName, score }: { teamName?: string; score?: number | null }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 px-6 text-center">
      <span className="font-[family-name:var(--font-pixel)] text-[10px] tracking-[0.2em] uppercase text-[#8b5e3c]/60">
        Reveal Time
      </span>
      <p className="font-[family-name:var(--font-body)] text-lg text-[#2a2520]">
        Your host is revealing results!
        <br />
        Watch the big screen.
      </p>
      {teamName && (
        <span className="font-[family-name:var(--font-pixel)] text-[9px] tracking-wider text-[#8b5e3c]">
          {teamName}
        </span>
      )}
      {score != null && (
        <span className="font-[family-name:var(--font-pixel)] text-2xl text-[#b89f65]">
          {score}%
        </span>
      )}
    </div>
  );
}

function WaitingInterstitial({ currentRole }: { currentRole?: "architect" | "builder" }) {
  const newRole = currentRole === "architect" ? "Builder" : "Architect";
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 px-6 text-center bg-[#1a1510]">
      <span className="font-[family-name:var(--font-pixel)] text-[10px] tracking-[0.2em] uppercase text-[#6b8f71]">
        Get Ready
      </span>
      <p className="font-[family-name:var(--font-body)] text-lg text-[#e8e0d0]">
        Round 2 is coming &mdash; you&apos;ll have AI help this time!
      </p>
      <span className="font-[family-name:var(--font-pixel)] text-[9px] tracking-wider text-[#6b8f71]/80">
        Your new role: {newRole}
      </span>
    </div>
  );
}

function WaitingFinalReveal({ team }: { team?: Team }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 px-6 text-center bg-[#1a1510]">
      <span className="font-[family-name:var(--font-pixel)] text-[10px] tracking-[0.2em] uppercase text-[#6b8f71]">
        Final Results
      </span>
      <p className="font-[family-name:var(--font-body)] text-lg text-[#e8e0d0]">
        Final results on the big screen!
      </p>
      {team && team.round1Score != null && team.round2Score != null && (
        <div className="flex gap-6 mt-2">
          <div className="flex flex-col items-center gap-1">
            <span className="font-[family-name:var(--font-pixel)] text-[8px] tracking-wider uppercase text-[#8b5e3c]/70">
              Round 1
            </span>
            <span className="font-[family-name:var(--font-pixel)] text-xl text-[#b89f65]">
              {team.round1Score}%
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-[family-name:var(--font-pixel)] text-[8px] tracking-wider uppercase text-[#6b8f71]">
              Round 2
            </span>
            <span className="font-[family-name:var(--font-pixel)] text-xl text-[#6b8f71]">
              {team.round2Score}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function WaitingSummary() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-6 px-6 text-center bg-[#1a1510]">
      <span className="font-[family-name:var(--font-pixel)] text-[10px] tracking-[0.2em] uppercase text-[#6b8f71]">
        Thank You For Playing
      </span>
      <p className="font-[family-name:var(--font-serif)] text-base leading-relaxed text-[#e8e0d0]/80 max-w-sm italic">
        500 Acres is building AI-powered pipelines so Gen Z can construct real homes &mdash;
        using CNC-cut Skylark 250 blocks and the same kind of AI collaboration you just experienced.
      </p>
      <a
        href="https://500acres.org"
        target="_blank"
        rel="noopener noreferrer"
        className="font-[family-name:var(--font-pixel)] text-[10px] tracking-wider text-[#6b8f71] underline underline-offset-4"
      >
        500acres.org
      </a>
    </div>
  );
}

// --- Player Lobby View ---

function PlayerLobbyView({
  team,
  player,
  allPlayers,
  send,
}: {
  team: Team;
  player: Player;
  allPlayers: Record<string, Player>;
  send: (msg: ClientMessage) => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(team.name);

  const teammates = team.players
    .map(pid => allPlayers[pid])
    .filter(Boolean);

  const handleNameSubmit = () => {
    if (nameInput.trim()) {
      send({ type: "setTeamName", name: nameInput.trim() });
    }
    setEditingName(false);
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-6 px-6 text-center">
      {/* Team name (tap to edit) */}
      {editingName ? (
        <input
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onBlur={handleNameSubmit}
          onKeyDown={(e) => { if (e.key === "Enter") handleNameSubmit(); }}
          autoFocus
          maxLength={24}
          className="font-[family-name:var(--font-pixel)] text-2xl text-center bg-white/80 border-2 border-[#b89f65] rounded px-4 py-2 text-[#2a2520] outline-none focus:border-[#8b5e3c] w-64"
        />
      ) : (
        <button onClick={() => { setNameInput(team.name); setEditingName(true); }} className="group cursor-pointer">
          <h2 className="font-[family-name:var(--font-pixel)] text-2xl text-[#8b5e3c]">
            {team.name}
          </h2>
          <span className="font-[family-name:var(--font-pixel)] text-[8px] tracking-wider uppercase text-[#8b5e3c]/40 group-hover:text-[#8b5e3c]/70 transition-colors">
            Tap to rename
          </span>
        </button>
      )}

      {/* Teammates */}
      <div className="w-full max-w-xs">
        <p className="font-[family-name:var(--font-pixel)] text-[9px] tracking-wider uppercase text-[#2a2520]/40 mb-3">
          Your Team
        </p>
        <div className="flex flex-col gap-2">
          {teammates.map(p => (
            <div
              key={p.id}
              className="flex items-center justify-between px-4 py-2 rounded bg-[#8b5e3c]/10"
            >
              <span className="font-[family-name:var(--font-body)] text-sm text-[#2a2520]">
                {p.name}
                {p.id === player.id && (
                  <span className="ml-1 text-[#8b5e3c]/60 text-xs">(You)</span>
                )}
              </span>
              <span className="font-[family-name:var(--font-pixel)] text-[8px] tracking-wider uppercase text-[#b89f65]">
                {p.role === "architect" ? "Architect" : "Builder"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Waiting message */}
      <p className="font-[family-name:var(--font-pixel)] text-[9px] tracking-wider uppercase text-[#2a2520]/30 animate-pulse">
        Waiting for host to start...
      </p>
    </div>
  );
}

// --- Compact team info bar (visible during all active phases) ---

function TeamInfoBar({ team, player, allPlayers, isRound2 }: {
  team: Team;
  player: Player;
  allPlayers: Record<string, Player>;
  isRound2: boolean;
}) {
  const teammates = team.players
    .map(pid => allPlayers[pid])
    .filter(Boolean);

  return (
    <div className={`flex items-center justify-center gap-3 px-3 py-1.5 ${
      isRound2 ? "bg-[#2a2a20] border-b border-[#3d6b4f]/20" : "bg-[#e8e0d0] border-b border-[#8b5e3c]/10"
    }`}>
      <span className={`font-[family-name:var(--font-pixel)] text-[8px] tracking-wider uppercase ${
        isRound2 ? "text-[#6b8f71]" : "text-[#8b5e3c]"
      }`}>
        {team.name}
      </span>
      <span className={`text-[10px] ${isRound2 ? "text-[#e8e0d0]/30" : "text-[#2a2520]/20"}`}>|</span>
      {teammates.map((p, i) => (
        <span key={p.id} className={`font-[family-name:var(--font-body)] text-[10px] ${
          isRound2 ? "text-[#e8e0d0]/60" : "text-[#2a2520]/50"
        }`}>
          {p.name}{p.id === player.id ? " (You)" : ""}
          <span className={`ml-0.5 font-[family-name:var(--font-pixel)] text-[7px] uppercase ${
            isRound2
              ? (p.role === "architect" ? "text-[#b89f65]/60" : "text-[#6b8f71]/60")
              : (p.role === "architect" ? "text-[#b89f65]/70" : "text-[#8b5e3c]/50")
          }`}>
            {p.role === "architect" ? "A" : "B"}
          </span>
          {i < teammates.length - 1 ? <span className={isRound2 ? "text-[#e8e0d0]/20" : "text-[#2a2520]/15"}> · </span> : null}
        </span>
      ))}
    </div>
  );
}

// --- Main component ---

export default function PlayerView({
  state,
  playerId,
  send,
  onMessage,
}: PlayerViewProps) {
  const [selectedBlock, setSelectedBlock] = useState<BlockType>("wall");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [aiPlacedCells, setAiPlacedCells] = useState<Set<string>>(new Set());
  const [newCells, setNewCells] = useState<Map<string, number>>(new Map());
  const [aiThinking, setAiThinking] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const cellTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const player = state.players[playerId];
  const teamId = player?.teamId;
  const team = teamId ? state.teams[teamId] : undefined;
  const role = player?.role;
  const phase = state.phase;

  const isPlaying = phase === "round1" || phase === "round2";
  const isDemo = phase === "demo";
  const isRound2 = phase === "round2";
  const isBuilder = role === "builder";
  const isArchitect = role === "architect";

  // Clear messages and AI cells on phase change
  useEffect(() => {
    setMessages([]);
    setAiPlacedCells(new Set());
    setNewCells(new Map());
    setAiThinking(false);
  }, [phase]);

  // Show tutorial overlay when a round starts (once per session)
  useEffect(() => {
    if (isPlaying && !sessionStorage.getItem("tutorialSeen")) {
      setShowTutorial(true);
      sessionStorage.setItem("tutorialSeen", "true");
    }
  }, [isPlaying]);

  // Clean up cell timeouts on unmount
  useEffect(() => {
    return () => {
      for (const timer of cellTimeoutsRef.current.values()) {
        clearTimeout(timer);
      }
    };
  }, []);

  // Listen for chat and aiBuilding messages
  useEffect(() => {
    const unsubscribe = onMessage((msg) => {
      if (msg.type === "chat") {
        // Only show messages for our team
        if (msg.teamId !== teamId) return;
        setMessages((prev) => [
          ...prev,
          {
            id: `${msg.senderId}-${Date.now()}-${Math.random()}`,
            senderId: msg.senderId,
            senderName: msg.senderName,
            text: msg.text,
            isAI: msg.isAI,
            timestamp: Date.now(),
          },
        ]);
        // Clear AI thinking when an AI message arrives
        if (msg.isAI) {
          setAiThinking(false);
        }
      }

      if (msg.type === "aiBuilding") {
        if (msg.teamId !== teamId) return;
        setAiPlacedCells((prev) => {
          const next = new Set(prev);
          for (const action of msg.actions) {
            next.add(`${action.row},${action.col}`);
          }
          return next;
        });
      }

      if (msg.type === "gridUpdate" && msg.teamId === teamId) {
        const key = `${msg.row},${msg.col},${msg.height}`;
        const now = performance.now();
        setNewCells((prev) => {
          const next = new Map(prev);
          next.set(key, now);
          return next;
        });
        const existing = cellTimeoutsRef.current.get(key);
        if (existing) clearTimeout(existing);
        const timer = setTimeout(() => {
          cellTimeoutsRef.current.delete(key);
          setNewCells((prev) => {
            const next = new Map(prev);
            next.delete(key);
            return next;
          });
        }, 600);
        cellTimeoutsRef.current.set(key, timer);
      }
    });

    return unsubscribe;
  }, [onMessage, teamId]);

  const isDesign = phase === "design";

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      // Allow placement in demo or design (all players) or during play (builders only)
      if (isDemo || isDesign) {
        navigator.vibrate?.(10);
        send({ type: "placeBlock", row, col, block: selectedBlock });
        return;
      }
      if (!isPlaying || !isBuilder) return;
      navigator.vibrate?.(10);
      send({ type: "placeBlock", row, col, block: selectedBlock });
    },
    [isPlaying, isDemo, isDesign, isBuilder, send, selectedBlock]
  );

  const handleSendChat = useCallback(
    (text: string) => {
      // Always send team chat message
      send({ type: "chat", text });

      // In Round 2, also fire off to AI endpoint (fire-and-forget)
      if (isRound2 && state.code) {
        setAiThinking(true);
        fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            roomCode: state.code,
            teamId,
            playerId,
            targetGrid: team?.roundTarget ?? state.currentTarget,
          }),
        }).catch(() => {
          setAiThinking(false);
        });
      }
    },
    [send, isRound2, state.code, teamId, playerId]
  );

  const teamGrid = team?.grid ?? null;
  const targetGrid = team?.roundTarget ?? state.currentTarget;
  const teamName = team?.name;

  const showChat = phase === "round1" || phase === "round2";

  // --- Waiting states for non-active phases ---
  if (phase === "reveal1") {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-[#f0ebe0]">
        <GameHeader phase={phase} teamName={teamName} role={role} timerEnd={state.timerEnd} />
        {team && player && <TeamInfoBar team={team} player={player} allPlayers={state.players} isRound2={false} />}
        <WaitingReveal teamName={teamName} score={team?.round1Score} />
      </div>
    );
  }

  if (phase === "interstitial") {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-[#1a1510]">
        <GameHeader phase={phase} teamName={teamName} role={role} timerEnd={state.timerEnd} />
        {team && player && <TeamInfoBar team={team} player={player} allPlayers={state.players} isRound2={true} />}
        <WaitingInterstitial currentRole={role} />
      </div>
    );
  }

  if (phase === "finalReveal") {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-[#1a1510]">
        <GameHeader phase={phase} teamName={teamName} role={role} timerEnd={state.timerEnd} />
        {team && player && <TeamInfoBar team={team} player={player} allPlayers={state.players} isRound2={true} />}
        <WaitingFinalReveal team={team} />
      </div>
    );
  }

  if (phase === "summary") {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-[#1a1510]">
        <GameHeader phase={phase} teamName={teamName} role={role} timerEnd={state.timerEnd} />
        {team && player && <TeamInfoBar team={team} player={player} allPlayers={state.players} isRound2={true} />}
        <WaitingSummary />
      </div>
    );
  }

  // --- Lobby phase: show team info ---
  if (phase === "lobby") {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-[#f0ebe0]">
        <GameHeader phase={phase} teamName={teamName} role={role} timerEnd={state.timerEnd} />
        {team && player ? (
          <PlayerLobbyView team={team} player={player} allPlayers={state.players} send={send} />
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-[#2a2520]/40 font-[family-name:var(--font-pixel)] text-[10px]">
            Joining game...
          </div>
        )}
      </div>
    );
  }

  // --- Design phase: all players build their team's structure ---
  if (isDesign) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-[#f0ebe0]">
        <GameHeader phase={phase} teamName={teamName} role={role} timerEnd={state.timerEnd} />
        {team && player && <TeamInfoBar team={team} player={player} allPlayers={state.players} isRound2={false} />}
        <div className="flex flex-col flex-1 min-h-0 p-3 gap-2">
          <div className="font-[family-name:var(--font-pixel)] text-[8px] tracking-wider uppercase text-center py-1 px-2 rounded text-[#8b5e3c]/70 bg-[#8b5e3c]/10">
            Design your building! Another team will try to recreate it.
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            {teamGrid ? (
              <VoxelGrid
                grid={teamGrid}
                onCellClick={handleCellClick}
                selectedBlock={selectedBlock}
                readOnly={false}
                newCells={newCells}
                className="w-full h-full max-h-[45vh] md:max-h-full"
              />
            ) : (
              <div className="font-[family-name:var(--font-pixel)] text-[10px] text-[#2a2520]/40">
                Loading...
              </div>
            )}
          </div>
          <div className="shrink-0">
            <BlockPalette selected={selectedBlock} onSelect={setSelectedBlock} />
          </div>
        </div>
      </div>
    );
  }

  // --- Demo phase: all players build, no chat, no target ---
  if (isDemo) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-[#f0ebe0]">
        <GameHeader phase={phase} teamName={teamName} role={role} timerEnd={state.timerEnd} />
        {team && player && <TeamInfoBar team={team} player={player} allPlayers={state.players} isRound2={false} />}
        <div className="flex flex-col flex-1 min-h-0 p-3 gap-2">
          <div className="font-[family-name:var(--font-pixel)] text-[8px] tracking-wider uppercase text-center py-1 px-2 rounded text-[#8b5e3c]/70 bg-[#8b5e3c]/10">
            Practice Mode &mdash; Try placing blocks!
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            {teamGrid ? (
              <VoxelGrid
                grid={teamGrid}
                onCellClick={handleCellClick}
                selectedBlock={selectedBlock}
                readOnly={false}
                aiPlacedCells={aiPlacedCells}
                newCells={newCells}
                className="w-full h-full max-h-[45vh] md:max-h-full"
              />
            ) : (
              <div className="font-[family-name:var(--font-pixel)] text-[10px] text-[#2a2520]/40">
                Loading...
              </div>
            )}
          </div>
          <div className="shrink-0">
            <BlockPalette selected={selectedBlock} onSelect={setSelectedBlock} />
          </div>
        </div>
      </div>
    );
  }

  // --- Active round / lobby view ---
  return (
    <div
      className={[
        "flex flex-col h-screen overflow-hidden",
        isRound2 ? "bg-[#1a1510]" : "bg-[#f0ebe0]",
      ].join(" ")}
    >
      {/* Tutorial overlay */}
      {showTutorial && role && (
        <TutorialOverlay
          role={role}
          isRound2={isRound2}
          onDismiss={() => setShowTutorial(false)}
        />
      )}

      {/* Header */}
      <GameHeader
        phase={phase}
        teamName={teamName}
        role={role}
        timerEnd={state.timerEnd}
      />
      {team && player && <TeamInfoBar team={team} player={player} allPlayers={state.players} isRound2={isRound2} />}

      {/* Main content area */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
        {/* Grid + palette area */}
        <div className="flex flex-col flex-1 min-h-0 min-w-0 p-3 gap-2">
          {/* Grid label */}
          {isArchitect && targetGrid && (
            <div
              className={`font-[family-name:var(--font-pixel)] text-[8px] tracking-wider uppercase text-center py-1 px-2 rounded ${
                isRound2
                  ? "text-[#6b8f71]/70 bg-[#3d6b4f]/10"
                  : "text-[#8b5e3c]/70 bg-[#8b5e3c]/10"
              }`}
            >
              TARGET (only you can see this)
            </div>
          )}

          {isBuilder && isPlaying && (
            <div
              className={`font-[family-name:var(--font-pixel)] text-[8px] tracking-wider uppercase text-center py-1 px-2 rounded ${
                isRound2
                  ? "text-[#6b8f71]/70 bg-[#3d6b4f]/10"
                  : "text-[#8b5e3c]/70 bg-[#8b5e3c]/10"
              }`}
            >
              Your team&apos;s build
            </div>
          )}

          {/* Grid */}
          <div className="flex-1 min-h-0 flex items-center justify-center">
            {isArchitect && targetGrid ? (
              <VoxelGrid
                grid={targetGrid}
                readOnly={true}
                className="w-full h-full max-h-[45vh] md:max-h-full"
              />
            ) : teamGrid ? (
              <VoxelGrid
                grid={teamGrid}
                onCellClick={isBuilder && isPlaying ? handleCellClick : undefined}
                selectedBlock={selectedBlock}
                readOnly={!isBuilder || !isPlaying}
                aiPlacedCells={aiPlacedCells}
                newCells={newCells}
                className="w-full h-full max-h-[45vh] md:max-h-full"
              />
            ) : (
              <div
                className={`font-[family-name:var(--font-pixel)] text-[10px] ${
                  isRound2 ? "text-[#e8e0d0]/40" : "text-[#2a2520]/40"
                }`}
              >
                Waiting...
              </div>
            )}
          </div>

          {/* Block palette — only for builders during play */}
          {isBuilder && isPlaying && (
            <div className="shrink-0">
              <BlockPalette
                selected={selectedBlock}
                onSelect={setSelectedBlock}
              />
            </div>
          )}
        </div>

        {/* Chat panel */}
        {showChat && (
          <div className="shrink-0 h-48 md:h-auto md:w-80 p-3 pt-0 md:pt-3">
            <ChatPanel
              messages={messages}
              onSend={handleSendChat}
              isRound2={isRound2}
              disabled={!isPlaying}
              teamName={teamName}
              isAIThinking={aiThinking}
              role={role}
            />
          </div>
        )}
      </div>
    </div>
  );
}
