# Air Hockey 3D

## Current State
New project, no existing code.

## Requested Changes (Diff)

### Add
- Full 3D air hockey game using React Three Fiber
- Game modes: Single Player (vs AI) and 2-Player (local)
- AI difficulty: Easy, Normal, Hard
- First to 10 goals wins the match
- 3D physics-based puck and paddle movement
- Score tracking and win detection
- Game menu with mode/difficulty selection
- Win screen with restart option

### Modify
- N/A

### Remove
- N/A

## Implementation Plan
1. Backend: simple score/leaderboard storage (optional, minimal)
2. Frontend: 3D scene with React Three Fiber
   - Air hockey table mesh with neon aesthetic
   - Player paddle (mouse/touch controlled)
   - AI paddle with difficulty-based behavior
   - 2nd player paddle (keyboard controlled in 2P mode)
   - Puck with physics (velocity, bouncing off walls and paddles)
   - Goal detection on both ends
   - HUD overlay: score, mode, difficulty
   - Main menu: mode picker, difficulty picker, start button
   - Win screen: winner announcement, play again
