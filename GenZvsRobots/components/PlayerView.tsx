"use client";

import { useState, useEffect, useCallback } from "react";
import type { RoomState, BlockType, ClientMessage, ServerMessage } from "@/lib/types";
import IsometricGrid from "./IsometricGrid";
import BlockPalette from "./BlockPalette";
import ChatPanel, { type ChatMessage } from "./ChatPanel";
import GameHeader from "./GameHeader";

interface PlayerViewProps {
  state: RoomState;
  playerId: string;
  send: (msg: ClientMessage) => void;
  onMessage: (listener: (msg: ServerMessage) => void) => () => void;
}

export default function PlayerView({
  state,
  playerId,
  send,
  onMessage,
}: PlayerViewProps) {
  const [selectedBlock, setSelectedBlock] = useState<BlockType>("wall");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [aiPlacedCells, setAiPlacedCells] = useState<Set<string>>(new Set());
  const [newCells, setNewCells] = useState<Set<string>>(new Set());

  const player = state.players[playerId];
  const teamId = player?.teamId;
  const team = teamId ? state.teams[teamId] : undefined;
  const role = player?.role;
  const phase = state.phase;

  const isPlaying = phase === "round1" || phase === "round2";
  const isRound2 = phase === "round2";
  const isBuilder = role === "builder";
  const isArchitect = role === "architect";

  // Clear messages and AI cells on phase change
  useEffect(() => {
    setMessages([]);
    setAiPlacedCells(new Set());
    setNewCells(new Set());
  }, [phase]);

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
    });

    return unsubscribe;
  }, [onMessage, teamId]);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (!isPlaying || !isBuilder) return;
      send({ type: "placeBlock", row, col, block: selectedBlock });
      // Optimistically mark cell as new for animation
      const key = `${row},${col}`;
      setNewCells((prev) => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });
      // Remove new cell highlight after animation
      setTimeout(() => {
        setNewCells((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }, 600);
    },
    [isPlaying, isBuilder, send, selectedBlock]
  );

  const handleSendChat = useCallback(
    (text: string) => {
      // Always send team chat message
      send({ type: "chat", text });

      // In Round 2, also fire off to AI endpoint (fire-and-forget)
      if (isRound2 && state.code) {
        fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            roomCode: state.code,
            teamId,
            playerId,
          }),
        }).catch(() => {
          // fire-and-forget, ignore errors
        });
      }
    },
    [send, isRound2, state.code, teamId, playerId]
  );

  const teamGrid = team?.grid ?? null;
  const targetGrid = state.currentTarget;
  const teamName = team?.name;

  const showChat = phase === "round1" || phase === "round2";

  return (
    <div
      className={[
        "flex flex-col h-screen overflow-hidden",
        isRound2 ? "bg-[#1a1510]" : "bg-[#f0ebe0]",
      ].join(" ")}
    >
      {/* Header */}
      <GameHeader
        phase={phase}
        teamName={teamName}
        role={role}
        timerEnd={state.timerEnd}
      />

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
              <IsometricGrid
                grid={targetGrid}
                readOnly={true}
                className="w-full h-full max-h-[45vh] md:max-h-full"
              />
            ) : teamGrid ? (
              <IsometricGrid
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
                className={`text-sm font-[family-name:var(--font-pixel)] text-[10px] ${
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
            />
          </div>
        )}
      </div>
    </div>
  );
}
