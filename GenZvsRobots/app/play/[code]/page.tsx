"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { usePartySocket } from "@/lib/usePartySocket";
import PlayerView from "@/components/PlayerView";

export default function PlayPage() {
  const params = useParams<{ code: string }>();
  const code = (params.code ?? "").toUpperCase();

  const [playerName, setPlayerName] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const joinSentRef = useRef(false);

  // Retrieve name from sessionStorage on mount
  useEffect(() => {
    const name = sessionStorage.getItem("playerName") ?? "Player";
    setPlayerName(name);
  }, []);

  const { state, connected, send, onMessage, socket } = usePartySocket(
    code ? code.toLowerCase() : null
  );

  // Send join message once connected and name is available
  useEffect(() => {
    if (connected && playerName && !joinSentRef.current) {
      joinSentRef.current = true;
      send({ type: "join", name: playerName });
    }
  }, [connected, playerName, send]);

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
    />
  );
}
