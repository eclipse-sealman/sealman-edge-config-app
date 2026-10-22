import { describe, expect, it } from "vitest";
import {
  OBSTACLE_DEFS,
  createGame,
  hitsPlayer,
  spawnCount,
  spawnInterval,
  stepGame,
  worldSpeed,
} from "../sealmanGameEngine";

const idle = { dir: 0 as const, pointerY: null };

describe("difficulty", () => {
  it("lets the water flow faster over time, up to a cap", () => {
    expect(worldSpeed(10)).toBeGreaterThan(worldSpeed(0));
    expect(worldSpeed(30)).toBeGreaterThan(worldSpeed(10));
    expect(worldSpeed(10_000)).toBe(1100);
  });

  it("spawns obstacles more often over time, down to a floor", () => {
    expect(spawnInterval(30)).toBeLessThan(spawnInterval(0));
    expect(spawnInterval(10_000)).toBe(0.32);
  });

  it("sends more obstacles at once later in the run", () => {
    expect(spawnCount(0, () => 0)).toBe(1);
    expect(spawnCount(120, () => 0)).toBe(3);
    expect(spawnCount(120, () => 0.99)).toBe(1);
  });
});

describe("stepGame", () => {
  it("moves the player up and down but keeps him on screen", () => {
    const game = createGame(1000, 700);
    for (let i = 0; i < 200; i++) stepGame(game, 0.016, { dir: -1, pointerY: null }, () => 0.5);
    expect(game.player.y).toBeGreaterThanOrEqual(0);
    expect(game.player.y).toBeLessThan(100);
    for (let i = 0; i < 400; i++) stepGame(game, 0.016, { dir: 1, pointerY: null }, () => 0.5);
    expect(game.player.y).toBeLessThanOrEqual(700);
    expect(game.player.y).toBeGreaterThan(600);
  });

  it("brings obstacles in from the right and carries them to the left", () => {
    const game = createGame(1000, 700);
    game.time = 2;
    game.spawnTimer = 0;
    stepGame(game, 0.016, idle, () => 0.1);
    expect(game.obstacles.length).toBeGreaterThan(0);
    const startX = game.obstacles[0].x;
    expect(startX).toBeGreaterThan(game.width);
    stepGame(game, 0.016, idle, () => 0.1);
    expect(game.obstacles[0].x).toBeLessThan(startX);
  });

  it("ends the game when an obstacle hits the player", () => {
    const game = createGame(1000, 700);
    game.obstacles.push({ id: 1, kind: "shark", x: game.player.x, y: game.player.y, baseY: game.player.y, phase: 0 });
    stepGame(game, 0.016, idle, () => 0.5);
    expect(game.over).toBe(true);
    expect(game.killedBy).toBe("shark");
  });

  it("lets the player dodge an obstacle in another lane", () => {
    const game = createGame(1000, 700);
    const far = game.player.y + 250;
    const duck = { id: 1, kind: "duck" as const, x: game.player.x, y: far, baseY: far, phase: 0 };
    expect(hitsPlayer(game, duck)).toBe(false);
  });

  it("keeps the score rising while the player survives", () => {
    const game = createGame(1000, 700);
    stepGame(game, 0.016, idle, () => 0.5);
    const first = game.score;
    stepGame(game, 0.016, idle, () => 0.5);
    expect(game.score).toBeGreaterThan(first);
  });

  it("has every obstacle kind defined with hit circles and texts", () => {
    for (const def of Object.values(OBSTACLE_DEFS)) {
      expect(def.hit.length).toBeGreaterThan(0);
      expect(def.reason.length).toBeGreaterThan(0);
      expect(def.impact.length).toBeGreaterThan(0);
    }
  });
});
