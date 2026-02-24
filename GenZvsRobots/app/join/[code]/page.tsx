"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import { useParams } from "next/navigation";

export default function JoinPage() {
  const params = useParams<{ code: string }>();
  const code = (params.code ?? "").toUpperCase();

  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name");
      return;
    }
    setError("");
    const token = Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem("playerName", trimmed);
    sessionStorage.setItem("roomCode", code);
    sessionStorage.setItem("reconnectToken", token);
    window.location.href = `/play/${code}`;
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{
        background:
          "linear-gradient(160deg, var(--color-cream) 0%, color-mix(in srgb, var(--color-sage) 10%, var(--color-warm-white)) 100%)",
      }}
    >
      <div
        className="w-full max-w-sm flex flex-col items-center gap-8 animate-fade-in-up"
      >
        {/* Room code display */}
        <div className="text-center flex flex-col items-center gap-2">
          <span className="font-[family-name:var(--font-pixel)] text-[9px] tracking-[0.25em] uppercase text-[#8b5e3c]/60">
            Joining Room
          </span>
          <div
            className="font-[family-name:var(--font-pixel)] text-4xl tracking-[0.4em] text-charcoal px-6 py-3 rounded-xl bg-[#8b5e3c]/10 border-2 border-[#8b5e3c]/20"
            aria-label={`Room code: ${code}`}
          >
            {code}
          </div>
        </div>

        {/* Name form */}
        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <label
              htmlFor="player-name"
              className="font-[family-name:var(--font-pixel)] text-[9px] tracking-widest uppercase text-[#2a2520]/60"
            >
              Your Name
            </label>
            <input
              id="player-name"
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => {
                setError("");
                setName(e.target.value.slice(0, 20));
              }}
              placeholder="e.g. Alex"
              maxLength={20}
              autoComplete="off"
              className={[
                "w-full py-3 px-4 rounded-xl border-2 outline-none",
                "font-[family-name:var(--font-body)] text-lg",
                "bg-[#f5f1ea] text-charcoal placeholder:text-[#2a2520]/30",
                "transition-colors",
                error
                  ? "border-[#c45d3e] focus:border-[#c45d3e]"
                  : "border-[#8b5e3c]/30 focus:border-[#3d6b4f]",
              ].join(" ")}
            />
            {error && (
              <p className="text-[#c45d3e] text-xs font-[family-name:var(--font-body)]" role="alert">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full min-h-[48px] py-4 rounded-xl bg-[#3d6b4f] text-[#f5f1ea] font-[family-name:var(--font-pixel)] text-sm tracking-wide shadow-md hover:bg-[#365f45] active:scale-[0.97] hover:scale-[1.03] transition-all focus-ring"
          >
            Let&apos;s Build
          </button>
        </form>

        {/* Back link */}
        <button
          type="button"
          onClick={() => history.back()}
          className="min-h-[44px] px-4 py-2 text-xs text-[#2a2520]/40 hover:text-[#2a2520]/70 transition-colors font-[family-name:var(--font-body)] focus-ring rounded"
        >
          Wrong room? Go back
        </button>
      </div>
    </main>
  );
}
