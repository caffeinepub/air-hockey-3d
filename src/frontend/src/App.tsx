import { useState } from "react";
import { GameScene } from "./components/GameScene";
import { MainMenu } from "./components/MainMenu";

export type GameMode = "1p" | "2p";
export type Difficulty = "easy" | "normal" | "hard";
export type GamePhase = "menu" | "playing" | "won";

export interface GameConfig {
  mode: GameMode;
  difficulty: Difficulty;
}

export default function App() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [config, setConfig] = useState<GameConfig>({
    mode: "1p",
    difficulty: "normal",
  });

  const handleStart = (cfg: GameConfig) => {
    setConfig(cfg);
    setPhase("playing");
  };

  const handleBack = () => setPhase("menu");

  return (
    <div className="w-full h-screen bg-[#070A0F] overflow-hidden">
      {phase === "menu" && <MainMenu onStart={handleStart} />}
      {phase === "playing" && <GameScene config={config} onBack={handleBack} />}
    </div>
  );
}
