export type ObstacleKind = "admin" | "hunter" | "technician" | "bomb" | "shark" | "duck";

export interface HitCircle {
  dx: number;
  dy: number;
  r: number;
}

export interface Obstacle {
  id: number;
  kind: ObstacleKind;
  x: number;
  y: number;
  baseY: number;
  phase: number;
}

export interface GameState {
  width: number;
  height: number;
  scale: number;
  time: number;
  distance: number;
  score: number;
  player: { x: number; y: number; vy: number };
  obstacles: Obstacle[];
  spawnTimer: number;
  nextId: number;
  over: boolean;
  killedBy: ObstacleKind | null;
}

export interface GameInput {
  /** -1 up, 1 down, 0 none */
  dir: -1 | 0 | 1;
  /** Pointer/touch position to swim towards, if any. */
  pointerY: number | null;
}

interface ObstacleDef {
  hit: HitCircle[];
  weight: number;
  /** Multiplier on the current water speed. */
  speedFactor: number;
  /** Vertical bobbing: amplitude (px) and frequency (rad/s). */
  bob: { amplitude: number; frequency: number };
  reason: string;
  impact: string;
}

// Hit circles are in the obstacle's own (unscaled) coordinates, centered on its origin, facing left.
export const OBSTACLE_DEFS: Record<ObstacleKind, ObstacleDef> = {
  admin: {
    hit: [{ dx: -22, dy: -4, r: 11 }, { dx: 4, dy: 0, r: 15 }, { dx: 30, dy: 0, r: 9 }],
    weight: 3,
    speedFactor: 1,
    bob: { amplitude: 12, frequency: 2 },
    reason: "An IT admin asked: \"Have you tried turning it off and on again?\"",
    impact: "REBOOT!",
  },
  hunter: {
    hit: [{ dx: -22, dy: -4, r: 11 }, { dx: 4, dy: 0, r: 15 }, { dx: 30, dy: 0, r: 8 }, { dx: -48, dy: -2, r: 6 }, { dx: -66, dy: -2, r: 5 }],
    weight: 2,
    speedFactor: 1.05,
    bob: { amplitude: 6, frequency: 1.4 },
    reason: "A seal hunter finally got his catch of the day.",
    impact: "GOTCHA!",
  },
  technician: {
    hit: [{ dx: -22, dy: -4, r: 12 }, { dx: 4, dy: 0, r: 16 }, { dx: 30, dy: 0, r: 8 }],
    weight: 3,
    speedFactor: 0.9,
    bob: { amplitude: 16, frequency: 2.6 },
    reason: "A service technician on his first day pressed the wrong button.",
    impact: "OOPS!",
  },
  bomb: {
    hit: [{ dx: 0, dy: 0, r: 17 }],
    weight: 2,
    speedFactor: 1,
    bob: { amplitude: 20, frequency: 1.8 },
    reason: "Nobody ordered a bomb. Nobody.",
    impact: "BOOM!",
  },
  shark: {
    hit: [{ dx: -34, dy: 0, r: 14 }, { dx: -8, dy: 0, r: 20 }, { dx: 22, dy: 0, r: 16 }, { dx: 46, dy: -2, r: 10 }],
    weight: 2,
    speedFactor: 1.3,
    bob: { amplitude: 10, frequency: 1.2 },
    reason: "Shark snack. Even heroes are on the menu.",
    impact: "CHOMP!",
  },
  duck: {
    hit: [{ dx: 0, dy: 0, r: 15 }, { dx: -14, dy: -10, r: 10 }],
    weight: 3,
    speedFactor: 0.8,
    bob: { amplitude: 24, frequency: 3 },
    reason: "Defeated by a rubber duck. Embarrassing.",
    impact: "SQUEAK!",
  },
};

export const PLAYER_HIT: HitCircle[] = [
  { dx: -10, dy: 0, r: 14 },
  { dx: 12, dy: 0, r: 14 },
  { dx: 30, dy: -2, r: 10 },
];

const START_GRACE_SECONDS = 1.2;
const MAX_FRAME_SECONDS = 0.05;

/** Water speed in px/s at 1x scale - keeps rising the longer the run lasts. */
export function worldSpeed(time: number): number {
  return Math.min(1100, 240 + 14 * time);
}

/** Average seconds between spawns - shrinks over time down to a floor. */
export function spawnInterval(time: number): number {
  return Math.max(0.32, 1.35 - 0.02 * time);
}

/** How many obstacles arrive together - more and more as the run goes on. */
export function spawnCount(time: number, rand: () => number): number {
  let count = 1;
  if (rand() < Math.min(0.65, Math.max(0, (time - 10) / 70))) count += 1;
  if (rand() < Math.min(0.4, Math.max(0, (time - 40) / 100))) count += 1;
  return count;
}

export function scaleFor(height: number): number {
  return Math.min(1.5, Math.max(0.75, height / 720));
}

export function createGame(width: number, height: number): GameState {
  const scale = scaleFor(height);
  return {
    width,
    height,
    scale,
    time: 0,
    distance: 0,
    score: 0,
    player: { x: Math.max(120, width * 0.2), y: height / 2, vy: 0 },
    obstacles: [],
    spawnTimer: 0,
    nextId: 1,
    over: false,
    killedBy: null,
  };
}

export function resizeGame(game: GameState, width: number, height: number): void {
  game.width = width;
  game.height = height;
  game.scale = scaleFor(height);
  game.player.x = Math.max(120, width * 0.2);
  game.player.y = clampY(game, game.player.y);
}

function clampY(game: GameState, y: number): number {
  const margin = 34 * game.scale;
  return Math.min(game.height - margin, Math.max(margin, y));
}

function pickKind(rand: () => number): ObstacleKind {
  const kinds = Object.keys(OBSTACLE_DEFS) as ObstacleKind[];
  const total = kinds.reduce((sum, k) => sum + OBSTACLE_DEFS[k].weight, 0);
  let roll = rand() * total;
  for (const kind of kinds) {
    roll -= OBSTACLE_DEFS[kind].weight;
    if (roll <= 0) return kind;
  }
  return kinds[0];
}

function spawn(game: GameState, rand: () => number): void {
  const count = spawnCount(game.time, rand);
  const margin = 60 * game.scale;
  const minGap = 170 * game.scale;
  const used: number[] = [];

  for (let i = 0; i < count; i++) {
    let y = margin + rand() * (game.height - 2 * margin);
    for (let attempt = 0; attempt < 6 && used.some((u) => Math.abs(u - y) < minGap); attempt++) {
      y = margin + rand() * (game.height - 2 * margin);
    }
    if (used.some((u) => Math.abs(u - y) < minGap)) continue; // no fair spot found - skip rather than wall the player in
    used.push(y);
    game.obstacles.push({
      id: game.nextId++,
      kind: pickKind(rand),
      x: game.width + 100 * game.scale,
      y,
      baseY: y,
      phase: rand() * Math.PI * 2,
    });
  }
}

export function playerCircles(game: GameState): { x: number; y: number; r: number }[] {
  return PLAYER_HIT.map((c) => ({
    x: game.player.x + c.dx * game.scale,
    y: game.player.y + c.dy * game.scale,
    r: c.r * game.scale,
  }));
}

export function obstacleCircles(game: GameState, obstacle: Obstacle): { x: number; y: number; r: number }[] {
  return OBSTACLE_DEFS[obstacle.kind].hit.map((c) => ({
    x: obstacle.x + c.dx * game.scale,
    y: obstacle.y + c.dy * game.scale,
    r: c.r * game.scale,
  }));
}

export function hitsPlayer(game: GameState, obstacle: Obstacle): boolean {
  const mine = playerCircles(game);
  return obstacleCircles(game, obstacle).some((o) =>
    mine.some((p) => Math.hypot(o.x - p.x, o.y - p.y) < o.r + p.r),
  );
}

export function stepGame(game: GameState, rawDt: number, input: GameInput, rand: () => number = Math.random): void {
  if (game.over) return;
  const dt = Math.min(rawDt, MAX_FRAME_SECONDS);
  game.time += dt;

  const speed = worldSpeed(game.time) * game.scale;
  game.distance += speed * dt;
  game.score += worldSpeed(game.time) * dt / 12;

  const maxVelocity = Math.min(820, 430 + game.time * 4) * game.scale;
  const target =
    input.pointerY !== null
      ? Math.max(-maxVelocity, Math.min(maxVelocity, (input.pointerY - game.player.y) * 8))
      : input.dir * maxVelocity;
  game.player.vy += (target - game.player.vy) * Math.min(1, 9 * dt);
  const nextY = game.player.y + game.player.vy * dt;
  game.player.y = clampY(game, nextY);
  if (game.player.y !== nextY) game.player.vy = 0;

  if (game.time > START_GRACE_SECONDS) {
    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0) {
      spawn(game, rand);
      game.spawnTimer = spawnInterval(game.time) * (0.7 + rand() * 0.6);
    }
  }

  for (const obstacle of game.obstacles) {
    const def = OBSTACLE_DEFS[obstacle.kind];
    obstacle.x -= speed * def.speedFactor * dt;
    obstacle.y = obstacle.baseY + Math.sin(game.time * def.bob.frequency + obstacle.phase) * def.bob.amplitude * game.scale;
  }
  game.obstacles = game.obstacles.filter((o) => o.x > -220 * game.scale);

  const hit = game.obstacles.find((o) => hitsPlayer(game, o));
  if (hit) {
    game.over = true;
    game.killedBy = hit.kind;
  }
}

const HIGH_SCORE_KEY = "sealman-high-score";

export function loadHighScore(): number {
  try {
    const value = Number(window.localStorage.getItem(HIGH_SCORE_KEY));
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}

export function saveHighScore(score: number): void {
  try {
    window.localStorage.setItem(HIGH_SCORE_KEY, String(Math.floor(score)));
  } catch {
    // Storage may be unavailable - the high score then simply isn't remembered.
  }
}
