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
      : "blueprint-telephone.camsteinberg.partykit.dev";
    const protocol = isLocal ? "ws" : "wss";

    const socket = new PartySocket({
      host,
      room: roomCode.toLowerCase(),
      protocol,
    });

    socket.addEventListener("open", () => setConnected(true));
    socket.addEventListener("close", () => setConnected(false));

    socket.addEventListener("message", (e) => {
      const msg: ServerMessage = JSON.parse(e.data);
      if (msg.type === "state") {
        setState(msg.state);
      }
      for (const listener of listenersRef.current) {
        listener(msg);
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
