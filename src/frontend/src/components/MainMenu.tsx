import { useState } from "react";
import type { Difficulty, GameConfig, GameMode } from "../App";

interface Props {
  onStart: (config: GameConfig) => void;
}

export function MainMenu({ onStart }: Props) {
  const [mode, setMode] = useState<GameMode>("1p");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");

  const difficultyColors: Record<Difficulty, string> = {
    easy: "#39E87B",
    normal: "#22D6FF",
    hard: "#FF3DDE",
  };

  return (
    <div
      className="w-full h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at center, #0A1020 0%, #070A0F 100%)",
        fontFamily: "'Orbitron', 'Inter', sans-serif",
      }}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#1A2A40 1px, transparent 1px), linear-gradient(90deg, #1A2A40 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: 0.3,
        }}
      />

      {/* Glow orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(34,214,255,0.08) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(255,61,222,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="relative z-10 mb-12 text-center">
        <h1
          className="text-6xl font-black uppercase tracking-widest mb-2"
          style={{
            color: "#EAF2FF",
            textShadow: "0 0 40px #22D6FF, 0 0 80px rgba(34,214,255,0.4)",
            letterSpacing: "0.15em",
          }}
        >
          AIR HOCKEY
        </h1>
        <p
          className="text-2xl font-bold uppercase tracking-[0.3em]"
          style={{ color: "#22D6FF", textShadow: "0 0 20px #22D6FF" }}
        >
          3D EDITION
        </p>
        <p
          className="mt-3 text-sm uppercase tracking-widest"
          style={{ color: "#93A6C2" }}
        >
          FIRST TO 10 WINS
        </p>
      </div>

      {/* Control Panel */}
      <div
        className="relative z-10 rounded-2xl p-8 w-full max-w-2xl"
        style={{
          background: "rgba(13,20,38,0.9)",
          border: "1px solid #1A2A40",
          boxShadow:
            "0 0 40px rgba(34,214,255,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Game Mode */}
        <div className="mb-8">
          <p
            className="text-xs uppercase tracking-widest mb-3 font-bold"
            style={{ color: "#93A6C2" }}
          >
            Game Mode
          </p>
          <div className="flex gap-3">
            {(["1p", "2p"] as GameMode[]).map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 py-3 rounded-xl font-bold uppercase tracking-wider text-sm transition-all"
                style={{
                  background:
                    mode === m ? "rgba(34,214,255,0.15)" : "transparent",
                  border: `2px solid ${mode === m ? "#22D6FF" : "#1A2A40"}`,
                  color: mode === m ? "#22D6FF" : "#93A6C2",
                  boxShadow:
                    mode === m ? "0 0 20px rgba(34,214,255,0.3)" : "none",
                }}
              >
                {m === "1p" ? "1 Player (vs AI)" : "2 Players (Local)"}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty (1P only) */}
        {mode === "1p" && (
          <div className="mb-8">
            <p
              className="text-xs uppercase tracking-widest mb-3 font-bold"
              style={{ color: "#93A6C2" }}
            >
              AI Difficulty
            </p>
            <div className="flex gap-3">
              {(["easy", "normal", "hard"] as Difficulty[]).map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className="flex-1 py-3 rounded-xl font-bold uppercase tracking-wider text-sm transition-all"
                  style={{
                    background:
                      difficulty === d
                        ? `${difficultyColors[d]}20`
                        : "transparent",
                    border: `2px solid ${difficulty === d ? difficultyColors[d] : "#1A2A40"}`,
                    color: difficulty === d ? difficultyColors[d] : "#93A6C2",
                    boxShadow:
                      difficulty === d
                        ? `0 0 20px ${difficultyColors[d]}50`
                        : "none",
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Start Button */}
        <button
          type="button"
          onClick={() => onStart({ mode, difficulty })}
          className="w-full py-5 rounded-xl font-black uppercase tracking-widest text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #B8FF3A, #22D6FF)",
            color: "#070A0F",
            boxShadow:
              "0 0 40px rgba(184,255,58,0.4), 0 0 80px rgba(34,214,255,0.2)",
            letterSpacing: "0.2em",
          }}
        >
          START GAME
        </button>
      </div>

      {/* Controls info */}
      <div
        className="relative z-10 mt-8 text-center"
        style={{ color: "#93A6C2" }}
      >
        <p className="text-xs uppercase tracking-widest mb-1">
          P1: Mouse to move paddle
          {mode === "2p" && " | P2: WASD keys"}
        </p>
        <p className="text-xs uppercase tracking-widest">
          ESC / Back button to return to menu
        </p>
      </div>
    </div>
  );
}
