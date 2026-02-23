"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { usePartySocket } from "@/lib/usePartySocket";
import HostView, { type ActivityItem } from "@/components/HostView";
import type { ServerMessage } from "@/lib/types";

export default function HostPage() {
  const params = useParams();
  const code = typeof params?.code === "string" ? params.code.toUpperCase() : null;

  const { state, connected, send, onMessage } = usePartySocket(
    code ? code.toLowerCase() : null
  );

  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const hasJoined = useRef(false);

  // Join as host once connected
  useEffect(() => {
    if (connected && !hasJoined.current) {
      hasJoined.current = true;
      send({ type: "join", name: "Host", isHost: true });
    }
  }, [connected, send]);

  // Listen for chat messages to build activity feed
  const handleMessage = useCallback(
    (msg: ServerMessage) => {
      if (msg.type === "chat") {
        const teamName = msg.teamId ? `Team ${msg.teamId}` : msg.senderName;
        setActivityFeed((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            teamName,
            text: msg.text,
            timestamp: Date.now(),
          },
        ]);
      }
    },
    []
  );

  useEffect(() => {
    return onMessage(handleMessage);
  }, [onMessage, handleMessage]);

  if (!state) {
    return (
      <div className="h-screen w-screen bg-charcoal flex flex-col items-center justify-center gap-4">
        <div className="font-[family-name:var(--font-pixel)] text-gold text-xl animate-pulse">
          {code ?? "..."}
        </div>
        <p className="font-[family-name:var(--font-pixel)] text-[9px] text-cream/40 uppercase tracking-widest">
          {connected ? "Loading room..." : "Connecting..."}
        </p>
      </div>
    );
  }

  return (
    <HostView
      state={state}
      send={send}
      connected={connected}
      activityFeed={activityFeed}
    />
  );
}
