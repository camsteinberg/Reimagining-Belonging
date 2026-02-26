"use client";

import { useState, useEffect, FormEvent } from "react";
import { generateRoomCode } from "@/lib/constants";
import TerrainBackground from "@/components/TerrainBackground";

export default function Home() {
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [kickedMessage, setKickedMessage] = useState("");

  // Check for kicked redirect (URL param or sessionStorage)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const kicked = params.get("kicked");
    if (kicked) {
      setKickedMessage(kicked);
      // Clean the URL
      window.history.replaceState({}, "", "/");
    }
  }, []);

  function handleHost() {
    const code = generateRoomCode();
    window.location.href = `/host/${code}`;
  }

  function handleJoin(e: FormEvent) {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 4) {
      setJoinError("Enter a 4-letter room code");
      return;
    }
    setJoinError("");
    window.location.href = `/join/${code}`;
  }

  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{
        background:
          "linear-gradient(160deg, var(--color-cream) 0%, color-mix(in srgb, var(--color-sage) 10%, var(--color-warm-white)) 100%)",
      }}
    >
      {/* Terrain SVG backdrop — sits behind content */}
      <TerrainBackground />

      <div
        style={{ position: "relative", zIndex: 1 }}
        className="w-full max-w-md flex flex-col items-center gap-8 animate-fade-in-up"
      >
        {/* Kicked message */}
        {kickedMessage && (
          <div className="w-full px-4 py-3 rounded-xl bg-[#c45d3e]/10 border border-[#c45d3e]/30 text-center">
            <p className="font-[family-name:var(--font-pixel)] text-[10px] text-[#c45d3e]">
              {kickedMessage}
            </p>
          </div>
        )}

        {/* Logo / title block */}
        <div className="text-center flex flex-col items-center gap-4">
          <span
            className="font-[family-name:var(--font-pixel)] text-[10px] tracking-[0.3em] uppercase text-[#8b5e3c]/70"
          >
            500 Acres
          </span>

          <h1
            className="font-[family-name:var(--font-pixel)] text-2xl sm:text-3xl leading-relaxed text-charcoal"
          >
            Blueprint<br />Telephone
          </h1>

          <p
            className="font-[family-name:var(--font-pixel)] text-[10px] text-[#2a2520]/70 leading-relaxed"
          >
            Can Gen Z build with robots?
          </p>

          <p className="font-[family-name:var(--font-pixel)] text-[8px] text-[#2a2520]/50 mt-1">
            A 500 Acres interactive experience
          </p>
        </div>

        {/* Divider */}
        <div className="w-full flex items-center gap-3">
          <div className="flex-1 h-px bg-[#8b5e3c]/20" />
          <span className="font-[family-name:var(--font-pixel)] text-[8px] text-[#8b5e3c]/40 tracking-widest">
            PLAY
          </span>
          <div className="flex-1 h-px bg-[#8b5e3c]/20" />
        </div>

        {/* Host button */}
        <button
          type="button"
          onClick={handleHost}
          className="w-full min-h-[48px] py-4 rounded-xl bg-[#8b5e3c] text-[#f5f1ea] font-[family-name:var(--font-pixel)] text-sm tracking-wide shadow-md hover:bg-[#7a5234] active:scale-[0.97] hover:scale-[1.03] transition-all focus-ring"
        >
          Host a Game
        </button>

        {/* Join form */}
        <form
          onSubmit={handleJoin}
          className="w-full flex flex-col items-center gap-3"
        >
          <label
            htmlFor="join-code"
            className="font-[family-name:var(--font-pixel)] text-[9px] tracking-widest uppercase text-[#2a2520]/60 self-start"
          >
            Room Code
          </label>
          <div className="w-full flex gap-2">
            <input
              id="join-code"
              type="text"
              value={joinCode}
              onChange={(e) => {
                setJoinError("");
                setJoinCode(e.target.value.toUpperCase().slice(0, 4));
              }}
              placeholder="ABCD"
              maxLength={4}
              autoComplete="off"
              spellCheck={false}
              className={[
                "flex-1 py-3 px-4 rounded-xl border-2 outline-none",
                "font-[family-name:var(--font-pixel)] text-xl tracking-widest text-center uppercase",
                "bg-[#f5f1ea] text-charcoal placeholder:text-[#2a2520]/30",
                "transition-colors",
                joinError
                  ? "border-[#c45d3e] focus:border-[#c45d3e]"
                  : "border-[#8b5e3c]/30 focus:border-[#3d6b4f]",
              ].join(" ")}
            />
            <button
              type="submit"
              className="px-6 min-h-[48px] py-3 rounded-xl bg-[#3d6b4f] text-[#f5f1ea] font-[family-name:var(--font-pixel)] text-[10px] shadow-md hover:bg-[#365f45] active:scale-[0.97] hover:scale-[1.03] transition-all focus-ring"
            >
              Join
            </button>
          </div>
          {joinError && (
            <p className="text-[#c45d3e] text-[8px] font-[family-name:var(--font-pixel)] self-start" role="alert">
              {joinError}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
