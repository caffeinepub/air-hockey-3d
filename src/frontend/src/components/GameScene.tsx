import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { Difficulty, GameConfig } from "../App";

const TABLE_W = 14;
const TABLE_H = 8;
const GOAL_W = 3;
const PADDLE_R = 0.6;
const PUCK_R = 0.4;
const WALL_THICKNESS = 0.3;

interface Vec2 {
  x: number;
  z: number;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function getAISpeed(difficulty: Difficulty) {
  switch (difficulty) {
    case "easy":
      return 0.04;
    case "normal":
      return 0.08;
    case "hard":
      return 0.16;
  }
}

interface GameLogicProps {
  config: GameConfig;
  onScore: (scorer: "p1" | "p2") => void;
  playerTwoRef: React.MutableRefObject<Vec2>;
}

const WALLS_Z = [-TABLE_H / 2, TABLE_H / 2] as const;

function AirHockeyTable() {
  return (
    <group>
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[TABLE_W, 0.15, TABLE_H]} />
        <meshStandardMaterial color="#050D1A" roughness={0.2} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.05, 0.01, TABLE_H]} />
        <meshStandardMaterial
          color="#22D6FF"
          emissive="#22D6FF"
          emissiveIntensity={2}
        />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.3, 64]} />
        <meshStandardMaterial
          color="#22D6FF"
          emissive="#22D6FF"
          emissiveIntensity={2}
          side={THREE.DoubleSide}
        />
      </mesh>
      {WALLS_Z.map((z) => (
        <mesh key={`wall-tb-${z}`} position={[0, 0.1, z]}>
          <boxGeometry args={[TABLE_W, 0.3, WALL_THICKNESS]} />
          <meshStandardMaterial
            color="#0D1426"
            emissive="#2D7CFF"
            emissiveIntensity={0.5}
            metalness={0.8}
          />
        </mesh>
      ))}
      {/* Left wall segments */}
      <mesh
        position={[
          -TABLE_W / 2,
          0.1,
          -(TABLE_H / 2 + GOAL_W / 2) / 2 - GOAL_W / 4,
        ]}
      >
        <boxGeometry args={[WALL_THICKNESS, 0.3, (TABLE_H - GOAL_W) / 2]} />
        <meshStandardMaterial
          color="#0D1426"
          emissive="#FF3DDE"
          emissiveIntensity={0.5}
          metalness={0.8}
        />
      </mesh>
      <mesh
        position={[
          -TABLE_W / 2,
          0.1,
          (TABLE_H / 2 + GOAL_W / 2) / 2 + GOAL_W / 4,
        ]}
      >
        <boxGeometry args={[WALL_THICKNESS, 0.3, (TABLE_H - GOAL_W) / 2]} />
        <meshStandardMaterial
          color="#0D1426"
          emissive="#FF3DDE"
          emissiveIntensity={0.5}
          metalness={0.8}
        />
      </mesh>
      {/* Right wall segments */}
      <mesh
        position={[
          TABLE_W / 2,
          0.1,
          -(TABLE_H / 2 + GOAL_W / 2) / 2 - GOAL_W / 4,
        ]}
      >
        <boxGeometry args={[WALL_THICKNESS, 0.3, (TABLE_H - GOAL_W) / 2]} />
        <meshStandardMaterial
          color="#0D1426"
          emissive="#22D6FF"
          emissiveIntensity={0.5}
          metalness={0.8}
        />
      </mesh>
      <mesh
        position={[
          TABLE_W / 2,
          0.1,
          (TABLE_H / 2 + GOAL_W / 2) / 2 + GOAL_W / 4,
        ]}
      >
        <boxGeometry args={[WALL_THICKNESS, 0.3, (TABLE_H - GOAL_W) / 2]} />
        <meshStandardMaterial
          color="#0D1426"
          emissive="#22D6FF"
          emissiveIntensity={0.5}
          metalness={0.8}
        />
      </mesh>
      {/* Goal indicators */}
      <mesh
        position={[-TABLE_W / 2 - 0.3, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.6, GOAL_W]} />
        <meshStandardMaterial
          color="#FF3DDE"
          emissive="#FF3DDE"
          emissiveIntensity={0.3}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh
        position={[TABLE_W / 2 + 0.3, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.6, GOAL_W]} />
        <meshStandardMaterial
          color="#22D6FF"
          emissive="#22D6FF"
          emissiveIntensity={0.3}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function GameLogic({ config, onScore, playerTwoRef }: GameLogicProps) {
  const { camera, gl } = useThree();

  const puckPos = useRef<Vec2>({ x: 0, z: 0 });
  const puckVel = useRef<Vec2>({ x: 0.12, z: 0.08 });
  const p1Pos = useRef<Vec2>({ x: TABLE_W / 2 - 1.5, z: 0 });
  const p2Pos = useRef<Vec2>({ x: -TABLE_W / 2 + 1.5, z: 0 });
  const mousePos = useRef<Vec2>({ x: TABLE_W / 2 - 1.5, z: 0 });
  const scoredRef = useRef(false);

  const puckMeshRef = useRef<THREE.Group>(null);
  const p1MeshRef = useRef<THREE.Group>(null);
  const p2MeshRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const target = new THREE.Vector3();

    const onMouseMove = (e: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      raycaster.ray.intersectPlane(plane, target);
      mousePos.current = { x: target.x, z: target.z };
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const rect = gl.domElement.getBoundingClientRect();
      mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      raycaster.ray.intersectPlane(plane, target);
      mousePos.current = { x: target.x, z: target.z };
    };

    gl.domElement.addEventListener("mousemove", onMouseMove);
    gl.domElement.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      gl.domElement.removeEventListener("mousemove", onMouseMove);
      gl.domElement.removeEventListener("touchmove", onTouchMove);
    };
  }, [camera, gl]);

  const resetPuck = useCallback((towardPlayer: "p1" | "p2") => {
    puckPos.current = { x: 0, z: 0 };
    const speed = 0.1;
    puckVel.current = {
      x: towardPlayer === "p1" ? speed : -speed,
      z: (Math.random() - 0.5) * 0.06,
    };
    scoredRef.current = false;
  }, []);

  useFrame(() => {
    if (scoredRef.current) return;

    const aiSpeed = getAISpeed(config.difficulty);
    const halfW = TABLE_W / 2;
    const halfH = TABLE_H / 2 - WALL_THICKNESS / 2;

    // P1 paddle (mouse) - right side
    const targetX1 = clamp(mousePos.current.x, 0.5, halfW - PADDLE_R);
    const targetZ1 = clamp(
      mousePos.current.z,
      -halfH + PADDLE_R,
      halfH - PADDLE_R,
    );
    p1Pos.current.x += (targetX1 - p1Pos.current.x) * 0.25;
    p1Pos.current.z += (targetZ1 - p1Pos.current.z) * 0.25;

    // P2 paddle
    if (config.mode === "2p") {
      const t = playerTwoRef.current;
      p2Pos.current.x = clamp(
        p2Pos.current.x + t.x * 0.15,
        -halfW + PADDLE_R,
        -0.5,
      );
      p2Pos.current.z = clamp(
        p2Pos.current.z + t.z * 0.15,
        -halfH + PADDLE_R,
        halfH - PADDLE_R,
      );
    } else {
      const px = puckPos.current;
      const ap = p2Pos.current;
      const randomOffset =
        config.difficulty === "easy" ? (Math.random() - 0.5) * 0.5 : 0;
      ap.z += clamp(px.z + randomOffset - ap.z, -aiSpeed, aiSpeed);
      ap.z = clamp(ap.z, -halfH + PADDLE_R, halfH - PADDLE_R);
      const idealX =
        config.difficulty === "hard"
          ? clamp(px.x, -halfW + PADDLE_R, -0.5)
          : -TABLE_W / 2 + 2;
      ap.x += clamp(idealX - ap.x, -aiSpeed * 0.5, aiSpeed * 0.5);
      ap.x = clamp(ap.x, -halfW + PADDLE_R, -0.5);
    }

    // Puck speed cap
    const speed = Math.sqrt(puckVel.current.x ** 2 + puckVel.current.z ** 2);
    const maxSpeed = 0.25;
    if (speed > maxSpeed) {
      puckVel.current.x = (puckVel.current.x / speed) * maxSpeed;
      puckVel.current.z = (puckVel.current.z / speed) * maxSpeed;
    }

    puckPos.current.x += puckVel.current.x;
    puckPos.current.z += puckVel.current.z;

    // Wall bounces
    if (puckPos.current.z > halfH - PUCK_R) {
      puckPos.current.z = halfH - PUCK_R;
      puckVel.current.z *= -0.95;
    }
    if (puckPos.current.z < -halfH + PUCK_R) {
      puckPos.current.z = -halfH + PUCK_R;
      puckVel.current.z *= -0.95;
    }

    // Goal detection - right goal (P2/AI scores)
    if (puckPos.current.x > halfW + 0.5) {
      if (Math.abs(puckPos.current.z) < GOAL_W / 2) {
        scoredRef.current = true;
        onScore("p2");
        setTimeout(() => resetPuck("p1"), 1000);
      } else {
        puckPos.current.x = halfW - PUCK_R;
        puckVel.current.x *= -0.9;
      }
      return;
    }
    // Goal detection - left goal (P1 scores)
    if (puckPos.current.x < -halfW - 0.5) {
      if (Math.abs(puckPos.current.z) < GOAL_W / 2) {
        scoredRef.current = true;
        onScore("p1");
        setTimeout(() => resetPuck("p2"), 1000);
      } else {
        puckPos.current.x = -halfW + PUCK_R;
        puckVel.current.x *= -0.9;
      }
      return;
    }

    // Paddle collisions
    const checkPaddleCollision = (paddle: Vec2) => {
      const dx = puckPos.current.x - paddle.x;
      const dz = puckPos.current.z - paddle.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const minDist = PADDLE_R + PUCK_R;
      if (dist < minDist && dist > 0) {
        const nx = dx / dist;
        const nz = dz / dist;
        puckPos.current.x = paddle.x + nx * minDist;
        puckPos.current.z = paddle.z + nz * minDist;
        const dot = puckVel.current.x * nx + puckVel.current.z * nz;
        puckVel.current.x -= 2 * dot * nx;
        puckVel.current.z -= 2 * dot * nz;
        puckVel.current.x *= 1.05;
        puckVel.current.z *= 1.05;
      }
    };

    checkPaddleCollision(p1Pos.current);
    checkPaddleCollision(p2Pos.current);

    if (puckMeshRef.current) {
      puckMeshRef.current.position.set(
        puckPos.current.x,
        0.15,
        puckPos.current.z,
      );
    }
    if (p1MeshRef.current) {
      p1MeshRef.current.position.set(p1Pos.current.x, 0.15, p1Pos.current.z);
    }
    if (p2MeshRef.current) {
      p2MeshRef.current.position.set(p2Pos.current.x, 0.15, p2Pos.current.z);
    }
  });

  return (
    <>
      <group ref={p1MeshRef} position={[TABLE_W / 2 - 1.5, 0.15, 0]}>
        <mesh>
          <cylinderGeometry args={[PADDLE_R, PADDLE_R, 0.2, 32]} />
          <meshStandardMaterial
            color="#22D6FF"
            emissive="#22D6FF"
            emissiveIntensity={1.5}
            metalness={0.8}
            roughness={0.1}
          />
        </mesh>
        <pointLight color="#22D6FF" intensity={2} distance={3} />
      </group>
      <group ref={p2MeshRef} position={[-TABLE_W / 2 + 1.5, 0.15, 0]}>
        <mesh>
          <cylinderGeometry args={[PADDLE_R, PADDLE_R, 0.2, 32]} />
          <meshStandardMaterial
            color="#FF3DDE"
            emissive="#FF3DDE"
            emissiveIntensity={1.5}
            metalness={0.8}
            roughness={0.1}
          />
        </mesh>
        <pointLight color="#FF3DDE" intensity={2} distance={3} />
      </group>
      <group ref={puckMeshRef} position={[0, 0.15, 0]}>
        <mesh>
          <cylinderGeometry args={[PUCK_R, PUCK_R, 0.15, 32]} />
          <meshStandardMaterial
            color="#FF9A3A"
            emissive="#FF9A3A"
            emissiveIntensity={2}
            metalness={0.5}
          />
        </mesh>
        <pointLight color="#FF9A3A" intensity={3} distance={4} />
      </group>
    </>
  );
}

interface GameSceneProps {
  config: GameConfig;
  onBack: () => void;
}

export function GameScene({ config, onBack }: GameSceneProps) {
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [winner, setWinner] = useState<"p1" | "p2" | null>(null);
  const [gameKey, setGameKey] = useState(0);
  const playerTwoRef = useRef<Vec2>({ x: 0, z: 0 });
  const keysRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === "Escape") onBack();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [onBack]);

  useEffect(() => {
    let raf: number;
    const loop = () => {
      const k = keysRef.current;
      playerTwoRef.current.x = (k.d ? 1 : 0) - (k.a ? 1 : 0);
      playerTwoRef.current.z = (k.s ? 1 : 0) - (k.w ? 1 : 0);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleScore = useCallback((scorer: "p1" | "p2") => {
    setScores((prev) => {
      const next = { ...prev, [scorer]: prev[scorer] + 1 };
      if (next[scorer] >= 10) setWinner(scorer);
      return next;
    });
  }, []);

  const handleRestart = () => {
    setScores({ p1: 0, p2: 0 });
    setWinner(null);
    setGameKey((k) => k + 1);
  };

  const p1Label = "PLAYER 1";
  const p2Label = config.mode === "1p" ? "AI" : "PLAYER 2";
  const difficultyColors: Record<string, string> = {
    easy: "#39E87B",
    normal: "#22D6FF",
    hard: "#FF3DDE",
  };

  return (
    <div className="w-full h-screen relative" style={{ background: "#070A0F" }}>
      <Canvas
        key={gameKey}
        camera={{ position: [0, 14, 10], fov: 50 }}
        shadows
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[0, 10, 0]} intensity={2} color="#ffffff" />
        <pointLight position={[-6, 5, 0]} intensity={1} color="#FF3DDE" />
        <pointLight position={[6, 5, 0]} intensity={1} color="#22D6FF" />
        <AirHockeyTable />
        {!winner && (
          <GameLogic
            config={config}
            onScore={handleScore}
            playerTwoRef={playerTwoRef}
          />
        )}
        <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#030609" roughness={0.8} />
        </mesh>
      </Canvas>

      {/* HUD */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-3 pointer-events-none"
        style={{
          background: "rgba(7,10,15,0.85)",
          borderBottom: "1px solid #1A2A40",
          backdropFilter: "blur(10px)",
          fontFamily: "'Orbitron', 'Inter', sans-serif",
        }}
      >
        <div className="text-center">
          <p
            className="text-xs uppercase tracking-widest mb-1"
            style={{ color: "#FF3DDE" }}
          >
            {p2Label}
          </p>
          <p
            className="text-4xl font-black"
            style={{ color: "#FF3DDE", textShadow: "0 0 20px #FF3DDE" }}
          >
            {scores.p2}
          </p>
        </div>
        <div className="text-center">
          <p
            className="text-xs uppercase tracking-widest"
            style={{ color: "#93A6C2" }}
          >
            {config.mode === "1p" && (
              <span style={{ color: difficultyColors[config.difficulty] }}>
                {config.difficulty.toUpperCase()}
              </span>
            )}
            {config.mode === "2p" && (
              <span style={{ color: "#22D6FF" }}>2 PLAYER</span>
            )}
          </p>
          <p
            className="text-sm font-bold uppercase tracking-widest mt-1"
            style={{ color: "#EAF2FF" }}
          >
            FIRST TO 10
          </p>
        </div>
        <div className="text-center">
          <p
            className="text-xs uppercase tracking-widest mb-1"
            style={{ color: "#22D6FF" }}
          >
            {p1Label}
          </p>
          <p
            className="text-4xl font-black"
            style={{ color: "#22D6FF", textShadow: "0 0 20px #22D6FF" }}
          >
            {scores.p1}
          </p>
        </div>
      </div>

      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="absolute pointer-events-auto transition-all hover:scale-105"
        style={{
          top: "72px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(13,20,38,0.8)",
          border: "1px solid #1A2A40",
          color: "#93A6C2",
          padding: "4px 16px",
          borderRadius: "8px",
          fontSize: "10px",
          letterSpacing: "0.15em",
          fontFamily: "'Orbitron', 'Inter', sans-serif",
          fontWeight: "bold",
          textTransform: "uppercase",
        }}
      >
        ← MENU
      </button>

      {/* Win Screen */}
      {winner && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{
            background: "rgba(7,10,15,0.92)",
            backdropFilter: "blur(20px)",
            fontFamily: "'Orbitron', 'Inter', sans-serif",
          }}
        >
          <p
            className="text-lg uppercase tracking-widest mb-4"
            style={{ color: "#93A6C2" }}
          >
            Game Over
          </p>
          <h2
            className="text-7xl font-black uppercase mb-2"
            style={{
              color: winner === "p1" ? "#22D6FF" : "#FF3DDE",
              textShadow: `0 0 60px ${winner === "p1" ? "#22D6FF" : "#FF3DDE"}`,
            }}
          >
            {winner === "p1" ? p1Label : p2Label}
          </h2>
          <p
            className="text-2xl font-bold uppercase tracking-wider mb-8"
            style={{ color: "#EAF2FF" }}
          >
            WINS!
          </p>
          <p className="text-lg mb-10" style={{ color: "#93A6C2" }}>
            {scores.p1} — {scores.p2}
          </p>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleRestart}
              className="px-10 py-4 rounded-xl font-black uppercase tracking-widest transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #B8FF3A, #22D6FF)",
                color: "#070A0F",
                boxShadow: "0 0 40px rgba(184,255,58,0.4)",
                fontSize: "14px",
                letterSpacing: "0.2em",
              }}
            >
              Play Again
            </button>
            <button
              type="button"
              onClick={onBack}
              className="px-10 py-4 rounded-xl font-black uppercase tracking-widest transition-all hover:scale-105"
              style={{
                background: "transparent",
                border: "2px solid #1A2A40",
                color: "#93A6C2",
                fontSize: "14px",
                letterSpacing: "0.2em",
              }}
            >
              Main Menu
            </button>
          </div>
        </div>
      )}

      {config.mode === "2p" && !winner && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center pointer-events-none"
          style={{
            color: "#93A6C2",
            fontSize: "10px",
            letterSpacing: "0.1em",
            fontFamily: "'Orbitron', sans-serif",
          }}
        >
          P2: WASD &nbsp;|&nbsp; P1: MOUSE
        </div>
      )}
    </div>
  );
}
