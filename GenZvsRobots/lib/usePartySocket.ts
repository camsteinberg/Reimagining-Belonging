"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import PartySocket from "partysocket";
import type { ClientMessage, ServerMessage, RoomState } from "./types";

export function usePartySocket(roomCode: string | null) {
  const [state, setState] = useState<RoomState | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<PartySocket | null>(null);
  const listenersRef = useRef<((msg: ServerMessage) => void)[]>([]);

  useEffect(() => {
    if (!roomCode) return;

    const isLocal =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");
    const host = isLocal
      ? "127.0.0.1:1999"
      : (process.env.NEXT_PUBLIC_PARTYKIT_HOST || "blueprint-telephone.camsteinberg.partykit.dev");
    const protocol = isLocal ? "ws" : "wss";

    const socket = new PartySocket({
      host,
      room: roomCode.toLowerCase(),
      protocol,
    });

    socket.addEventListener("open", () => setConnected(true));
    socket.addEventListener("close", () => setConnected(false));

    socket.addEventListener("message", (e) => {
      try {
        const msg: ServerMessage = JSON.parse(e.data);
        if (msg.type === "state") {
          setState(msg.state);
        } else if (msg.type === "reconnected") {
          // No local state update needed — a full state broadcast follows
        } else if (msg.type === "gridUpdate") {
          // Apply individual block placements to local state immediately
          setState((prev) => {
            if (!prev) return prev;
            const team = prev.teams[msg.teamId];
            if (!team) return prev;
            const stack = team.grid[msg.row]?.[msg.col];
            if (!Array.isArray(stack)) return prev;
            const newGrid = team.grid.map((row, r) =>
              r === msg.row
                ? row.map((col, c) =>
                    c === msg.col
                      ? Array.isArray(col)
                        ? col.map((cell, h) => (h === msg.height ? msg.block : cell))
                        : col
                      : col
                  )
                : row
            );
            return {
              ...prev,
              teams: {
                ...prev.teams,
                [msg.teamId]: { ...team, grid: newGrid },
              },
            };
          });
        }
        for (const listener of listenersRef.current) {
          listener(msg);
        }
      } catch {
        // Ignore malformed messages
      }
    });

    socketRef.current = socket;

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [roomCode]);

  const send = useCallback((msg: ClientMessage) => {
    socketRef.current?.send(JSON.stringify(msg));
  }, []);

  const onMessage = useCallback(
    (listener: (msg: ServerMessage) => void) => {
      listenersRef.current.push(listener);
      return () => {
        listenersRef.current = listenersRef.current.filter((l) => l !== listener);
      };
    },
    []
  );

  return { state, connected, send, onMessage, socket: socketRef };
}
