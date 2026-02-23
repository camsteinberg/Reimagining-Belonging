"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { generateRoomCode } from "@/lib/constants";
import TerrainBackground from "@/components/TerrainBackground";

export default function Home() {
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");

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

      <motion.div
        style={{ position: "relative", zIndex: 1 }}
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md flex flex-col items-center gap-8"
      >
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
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleHost}
          className="w-full py-4 rounded-xl bg-[#8b5e3c] text-[#f5f1ea] font-[family-name:var(--font-pixel)] text-sm tracking-wide shadow-md hover:bg-[#7a5234] transition-colors"
        >
          Host a Game
        </motion.button>

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
            <motion.button
              type="submit"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-6 py-3 rounded-xl bg-[#3d6b4f] text-[#f5f1ea] font-[family-name:var(--font-pixel)] text-[10px] shadow-md hover:bg-[#365f45] transition-colors"
            >
              Join
            </motion.button>
          </div>
          {joinError && (
            <p className="text-[#c45d3e] text-[8px] font-[family-name:var(--font-pixel)] self-start">
              {joinError}
            </p>
          )}
        </form>
      </motion.div>
    </main>
  );
}
