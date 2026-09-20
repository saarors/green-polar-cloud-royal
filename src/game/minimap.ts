import {
  CELL,
  COLS,
  ROWS,
  cellCenter,
  type Maze,
} from "./maze";
import type { CrystalObj } from "./world";

export function cellKey(x: number, z: number) {
  return `${x},${z}`;
}

export function drawMinimap(
  canvas: HTMLCanvasElement,
  maze: Maze,
  revealed: Set<string>,
  playerX: number,
  playerZ: number,
  yaw: number,
  crystals: CrystalObj[],
  exitOpen: boolean,
) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const css = canvas.clientWidth || 148;
  if (canvas.width !== Math.round(css * dpr) || canvas.height !== Math.round(css * dpr)) {
    canvas.width = Math.round(css * dpr);
    canvas.height = Math.round(css * dpr);
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);

  ctx.save();
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w / 2 - 2 * dpr, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = "#0c0d10";
  ctx.fillRect(0, 0, w, h);

  const scale = (w * 0.42) / (CELL * 3.2);
  ctx.translate(w / 2, h / 2);
  ctx.rotate(yaw);
  ctx.scale(scale, scale);
  ctx.translate(-playerX, -playerZ);

  for (let z = 0; z < ROWS; z++) {
    for (let x = 0; x < COLS; x++) {
      if (!revealed.has(cellKey(x, z))) continue;
      const c = cellCenter(x, z);
      ctx.fillStyle = "#1c2228";
      ctx.fillRect(c.x - CELL / 2, c.z - CELL / 2, CELL, CELL);
    }
  }

  ctx.strokeStyle = "#8fa0a8";
  ctx.lineWidth = 0.18;
  ctx.lineCap = "square";
  ctx.beginPath();
  for (let z = 0; z < ROWS; z++) {
    for (let x = 0; x < COLS; x++) {
      if (!revealed.has(cellKey(x, z))) continue;
      const cell = maze.cells[z]![x]!;
      const c = cellCenter(x, z);
      const x0 = c.x - CELL / 2;
      const z0 = c.z - CELL / 2;
      const x1 = c.x + CELL / 2;
      const z1 = c.z + CELL / 2;
      if (cell.n) {
        ctx.moveTo(x0, z0);
        ctx.lineTo(x1, z0);
      }
      if (cell.s) {
        ctx.moveTo(x0, z1);
        ctx.lineTo(x1, z1);
      }
      if (cell.w) {
        ctx.moveTo(x0, z0);
        ctx.lineTo(x0, z1);
      }
      if (cell.e) {
        ctx.moveTo(x1, z0);
        ctx.lineTo(x1, z1);
      }
    }
  }
  ctx.stroke();

  for (const cr of crystals) {
    if (cr.taken) continue;
    if (!revealed.has(cellKey(cr.gx, cr.gz))) continue;
    ctx.fillStyle = "#9fd4c8";
    ctx.beginPath();
    ctx.arc(cr.pos.x, cr.pos.z, 0.28, 0, Math.PI * 2);
    ctx.fill();
  }

  if (revealed.has(cellKey(maze.exit.x, maze.exit.z))) {
    const e = cellCenter(maze.exit.x, maze.exit.z);
    ctx.fillStyle = exitOpen ? "#d7ece7" : "#6a7a80";
    ctx.fillRect(e.x - 0.35, e.z - 0.35, 0.7, 0.7);
  }

  ctx.restore();

  // Player — always faces up (forward)
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.fillStyle = "#ecece8";
  ctx.beginPath();
  ctx.moveTo(0, -7 * dpr);
  ctx.lineTo(5 * dpr, 6 * dpr);
  ctx.lineTo(0, 3.5 * dpr);
  ctx.lineTo(-5 * dpr, 6 * dpr);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w / 2 - 1.5 * dpr, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(236,236,232,0.22)";
  ctx.lineWidth = 2 * dpr;
  ctx.stroke();
}
