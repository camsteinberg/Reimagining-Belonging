"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { usePartySocket } from "@/lib/usePartySocket";
import PlayerView from "@/components/PlayerView";

export default function PlayPage() {
  const params = useParams<{ code: string }>();
  const code = (params.code ?? "").toUpperCase();

  const [playerName, setPlayerName] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  // Retrieve name from sessionStorage on mount
  useEffect(() => {
    const name = sessionStorage.getItem("playerName") ?? "Player";
    setPlayerName(name);
  }, []);

  const { state, connected, send, onMessage, socket } = usePartySocket(
    code ? code.toLowerCase() : null
  );

  // Send join message every time we (re)connect and name is available.
  // On first join, reconnectToken will be absent — server creates a new player.
  // On reconnect, token will be present — server reconnects to the existing player.
  useEffect(() => {
    if (connected && playerName) {
      const token = sessionStorage.getItem("reconnectToken") || undefined;
      send({ type: "join", name: playerName, reconnectToken: token });
    }
  }, [connected, playerName, send]);

  // Handle "joined", "reconnected", and "kicked" server messages
  useEffect(() => {
    const unsubscribe = onMessage((msg) => {
      if (msg.type === "reconnected") {
        setPlayerId(msg.player.id);
      }
      // "joined" is sent by the server after addPlayer; the type is added
      // server-side by another agent and may not be in ServerMessage yet.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = msg as any;
      if (raw.type === "joined" && raw.playerId) {
        setPlayerId(raw.playerId);
      }
      if (msg.type === "kicked") {
        window.location.href = `/?kicked=${encodeURIComponent(msg.message)}`;
      }
    });
    return unsubscribe;
  }, [onMessage]);

  // Detect own playerId from socket connection ID
  useEffect(() => {
    if (!connected || playerId) return;
    const id = socket.current?.id;
    if (id && state?.players[id]) {
      setPlayerId(id);
    }
  }, [connected, state, playerId, socket]);

  // Loading / connecting states
  if (!connected) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-cream gap-4">
        <span className="font-[family-name:var(--font-pixel)] text-[10px] tracking-widest text-[#8b5e3c]/60 animate-pulse uppercase">
          Connecting...
        </span>
        <span className="font-[family-name:var(--font-pixel)] text-2xl tracking-[0.3em] text-charcoal">
          {code}
        </span>
      </main>
    );
  }

  if (!state) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-cream gap-4">
        <span className="font-[family-name:var(--font-pixel)] text-[10px] tracking-widest text-[#8b5e3c]/60 animate-pulse uppercase">
          Loading room...
        </span>
      </main>
    );
  }

  if (!playerId) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-cream gap-4">
        <span className="font-[family-name:var(--font-pixel)] text-[10px] tracking-widest text-[#8b5e3c]/60 animate-pulse uppercase">
          Joining game...
        </span>
      </main>
    );
  }

  return (
    <PlayerView
      state={state}
      playerId={playerId}
      send={send}
      onMessage={onMessage}
      connected={connected}
    />
  );
}
