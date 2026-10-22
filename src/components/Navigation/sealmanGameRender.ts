import { GameState, OBSTACLE_DEFS, Obstacle, ObstacleKind, worldSpeed } from "./sealmanGameEngine";

const COMIC_FONT = "'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', 'Trebuchet MS', sans-serif";
const OUTLINE = "#0f1f47";

function hash(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function mod(a: number, b: number): number {
  return ((a % b) + b) % b;
}

function outlinedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, fill = "#ffffff", align: CanvasTextAlign = "left") {
  ctx.font = `900 ${size}px ${COMIC_FONT}`;
  ctx.textAlign = align;
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(3, size / 5);
  ctx.strokeStyle = OUTLINE;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  outlinedText(ctx, text, x, y, 10, "#ffffff", "center");
}

function drawBackground(ctx: CanvasRenderingContext2D, g: GameState) {
  const { width: w, height: h, scale: s } = g;
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, "#1f9dff");
  gradient.addColorStop(0.35, "#0b57c4");
  gradient.addColorStop(1, "#0f1f47");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  // Surface waves rolling with the current.
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let x = 0; x <= w; x += 12) {
    ctx.lineTo(x, 16 * s + Math.sin((x + g.distance * 0.5) / (38 * s)) * 6 * s);
  }
  ctx.lineTo(w, 0);
  ctx.closePath();
  ctx.fill();

  // Flow streaks - parallax, always streaming from right to left.
  ctx.strokeStyle = "#ffffff";
  ctx.lineCap = "round";
  ctx.lineWidth = 2 * s;
  for (let i = 0; i < 44; i++) {
    const length = (40 + hash(i, 2) * 130) * s;
    const parallax = 0.35 + hash(i, 3) * 0.95;
    const span = w + 400;
    const x = mod(hash(i, 4) * span - g.distance * parallax, span) - 200;
    const y = hash(i, 1) * h;
    ctx.globalAlpha = 0.07 + hash(i, 5) * 0.14;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + length, y);
    ctx.stroke();
  }

  // Bubbles.
  ctx.lineWidth = 1.5 * s;
  for (let i = 0; i < 28; i++) {
    const r = (2 + hash(i, 6) * 6) * s;
    const span = w + 200;
    const x = mod(hash(i, 7) * span - g.distance * (0.6 + hash(i, 8)), span) - 100;
    const y = hash(i, 9) * h + Math.sin(g.time * 2 + i) * 8 * s;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function person(ctx: CanvasRenderingContext2D, t: number, shirt: string, pants: string) {
  const kick = Math.sin(t * 8) * 5;
  ctx.lineWidth = 2;
  ctx.strokeStyle = OUTLINE;
  ctx.fillStyle = pants;
  ctx.beginPath();
  ctx.roundRect(18, -7 + kick * 0.3, 26, 6, 3);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(18, 2 - kick * 0.3, 26, 6, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = shirt;
  ctx.beginPath();
  ctx.roundRect(-14, -9, 36, 18, 8);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(-30, -4 + kick * 0.2, 20, 6, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f4c7a1";
  ctx.beginPath();
  ctx.arc(-22, -6, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = OUTLINE;
  ctx.beginPath();
  ctx.arc(-26, -7, 1.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawAdmin(ctx: CanvasRenderingContext2D, t: number) {
  person(ctx, t, "#475569", "#1e293b");
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(-29, -7, 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-22, -7, 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(-22, -6, 11, Math.PI * 1.05, Math.PI * 1.95);
  ctx.stroke();
  ctx.fillStyle = "#e2e8f0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-4, 8, 20, 11, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#38bdf8";
  ctx.fillRect(-2, 10, 16, 6);
  label(ctx, "IT ADMIN", 0, 32);
}

function drawHunter(ctx: CanvasRenderingContext2D, t: number) {
  ctx.strokeStyle = "#92400e";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-62, -2 + Math.sin(t * 3) * 1.5);
  ctx.lineTo(36, -2);
  ctx.stroke();
  ctx.fillStyle = "#cbd5e1";
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-74, -2);
  ctx.lineTo(-58, -8);
  ctx.lineTo(-58, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  person(ctx, t, "#b45309", "#1f2937");
  ctx.fillStyle = "#f97316";
  ctx.beginPath();
  ctx.arc(-22, -8, 9.5, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#78350f";
  ctx.beginPath();
  ctx.arc(-24, -2, 7, 0.1, Math.PI - 0.1);
  ctx.fill();
  label(ctx, "SEAL HUNTER", 0, 32);
}

function drawTechnician(ctx: CanvasRenderingContext2D, t: number) {
  person(ctx, t, "#f97316", "#1f2937");
  ctx.fillStyle = "#facc15";
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-22, -8, 10, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(-34, -9, 24, 3);
  ctx.fillStyle = "#dc2626";
  ctx.beginPath();
  ctx.roundRect(4, 9, 16, 10, 2);
  ctx.fill();
  ctx.stroke();
  // nervous "?" bubble and sweat
  const bob = Math.sin(t * 5) * 2;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(-34, -30 + bob, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  outlinedText(ctx, "?", -34, -25 + bob, 14, OUTLINE, "center");
  ctx.fillStyle = "#7dd3fc";
  ctx.beginPath();
  ctx.arc(-14, -16, 2.4, 0, Math.PI * 2);
  ctx.fill();
  label(ctx, "1ST DAY", 0, 32);
}

function drawBomb(ctx: CanvasRenderingContext2D, t: number) {
  ctx.strokeStyle = "#92400e";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(6, -14);
  ctx.quadraticCurveTo(14, -26, 22, -22);
  ctx.stroke();
  ctx.fillStyle = "#111827";
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#374151";
  ctx.fillRect(-5, -20, 12, 7);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.arc(-6, -6, 4.5, 0, Math.PI * 2);
  ctx.fill();
  const flicker = 4 + Math.abs(Math.sin(t * 22)) * 4;
  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.arc(22, -22, flicker, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.arc(22, -22, flicker / 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawShark(ctx: CanvasRenderingContext2D, t: number) {
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2.5;
  const wag = Math.sin(t * 7) * 6;
  ctx.fillStyle = "#64748b";
  ctx.beginPath();
  ctx.moveTo(44, 0);
  ctx.lineTo(72, -22 + wag);
  ctx.lineTo(70, 22 + wag);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, 0, 52, 21, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-6, -18);
  ctx.lineTo(16, -46);
  ctx.lineTo(24, -16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#e2e8f0";
  ctx.beginPath();
  ctx.ellipse(-2, 8, 44, 10, 0, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = OUTLINE;
  ctx.beginPath();
  ctx.arc(-34, -6, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-50, 5);
  ctx.lineTo(-20, 10);
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 4; i++) {
    const x = -46 + i * 8;
    ctx.beginPath();
    ctx.moveTo(x, 6 + i * 1.2);
    ctx.lineTo(x + 4, 6 + i * 1.2);
    ctx.lineTo(x + 2, 12 + i * 1.2);
    ctx.closePath();
    ctx.fill();
  }
}

function drawDuck(ctx: CanvasRenderingContext2D, t: number) {
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2;
  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.ellipse(2, 2, 20, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-14, -10, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f97316";
  ctx.beginPath();
  ctx.moveTo(-23, -11);
  ctx.lineTo(-34, -8);
  ctx.lineTo(-23, -5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = OUTLINE;
  ctx.beginPath();
  ctx.arc(-16, -13, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#eab308";
  ctx.beginPath();
  ctx.ellipse(8, 3, 9, 6, -0.4 + Math.sin(t * 6) * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

const DRAWERS: Record<ObstacleKind, (ctx: CanvasRenderingContext2D, t: number) => void> = {
  admin: drawAdmin,
  hunter: drawHunter,
  technician: drawTechnician,
  bomb: drawBomb,
  shark: drawShark,
  duck: drawDuck,
};

function drawObstacle(ctx: CanvasRenderingContext2D, g: GameState, o: Obstacle) {
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.scale(g.scale, g.scale);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  DRAWERS[o.kind](ctx, g.time + o.phase);
  ctx.restore();
}

function drawSealman(ctx: CanvasRenderingContext2D, g: GameState) {
  const { x, y, vy } = g.player;
  const t = g.time;
  const tilt = Math.max(-0.5, Math.min(0.5, vy / (900 * g.scale)));
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(g.scale, g.scale);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = 2;
  ctx.strokeStyle = OUTLINE;

  const flap = Math.sin(t * 14) * 6;
  ctx.fillStyle = "#dc2626";
  ctx.beginPath();
  ctx.moveTo(-6, -10);
  ctx.quadraticCurveTo(-40, -22 + flap, -64, -6 + flap);
  ctx.lineTo(-60, 12 + flap);
  ctx.quadraticCurveTo(-36, 12, -6, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const kick = Math.sin(t * 12) * 5;
  ctx.fillStyle = "#0f1f47";
  ctx.beginPath();
  ctx.moveTo(-30, 0);
  ctx.lineTo(-46, -9 + kick);
  ctx.lineTo(-46, 9 + kick);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#0303b8";
  ctx.beginPath();
  ctx.ellipse(0, 0, 34, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.arc(-2, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  outlinedText(ctx, "S", -2, 5, 11, "#0303b8", "center");

  ctx.fillStyle = "#0f1f47";
  ctx.beginPath();
  ctx.arc(30, -3, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#475569";
  ctx.beginPath();
  ctx.ellipse(40, 2, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#020617";
  ctx.beginPath();
  ctx.arc(46, 0, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#dc2626";
  ctx.beginPath();
  ctx.roundRect(22, -11, 22, 8, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(35, -7, 3.6, 2.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#020617";
  ctx.beginPath();
  ctx.arc(36, -7, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(44, 3);
  ctx.lineTo(56, 0);
  ctx.moveTo(44, 5);
  ctx.lineTo(56, 8);
  ctx.stroke();

  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 2;
  ctx.fillStyle = "#0f1f47";
  ctx.save();
  ctx.translate(8, 12);
  ctx.rotate(0.4 + Math.sin(t * 10) * 0.35);
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}

function starPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, outer: number, inner: number, spikes: number) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI * i) / spikes - Math.PI / 2;
    const px = cx + radius * Math.cos(angle);
    const py = cy + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawHud(ctx: CanvasRenderingContext2D, g: GameState, best: number) {
  const s = g.scale;
  outlinedText(ctx, `SCORE ${Math.floor(g.score)}`, 24, 52 * s, 26 * s);
  outlinedText(ctx, `BEST ${Math.max(best, Math.floor(g.score))}`, 24, 82 * s, 16 * s, "#facc15");
  const multiplier = (worldSpeed(g.time) / worldSpeed(0)).toFixed(1);
  outlinedText(ctx, `CURRENT x${multiplier}`, g.width / 2, 40 * s, 16 * s, "#7dd3fc", "center");
  if (g.time < 4 && !g.over) {
    outlinedText(ctx, "SWIM AGAINST THE CURRENT  -  ARROW UP / DOWN", g.width / 2, g.height - 40 * s, 18 * s, "#ffffff", "center");
  }
}

export function drawGame(ctx: CanvasRenderingContext2D, g: GameState, best: number): void {
  drawBackground(ctx, g);
  for (const o of g.obstacles) drawObstacle(ctx, g, o);
  drawSealman(ctx, g);
  drawHud(ctx, g, best);

  if (g.over && g.killedBy) {
    const s = g.scale;
    const bx = g.player.x + 40 * s;
    const by = g.player.y - 30 * s;
    starPath(ctx, bx, by, 80 * s, 48 * s, 11);
    ctx.fillStyle = "#facc15";
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    outlinedText(ctx, OBSTACLE_DEFS[g.killedBy].impact, bx, by + 8 * s, 24 * s, "#dc2626", "center");
  }
}
