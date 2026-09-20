import { mulberry32 } from "./rng";

export const COLS = 11;
export const ROWS = 11;
export const CELL = 4.5;
export const WALL_T = 0.4;
export const WALL_H = 3.28;
export const CRYSTAL_COUNT = 7;

export type CellWalls = { n: boolean; e: boolean; s: boolean; w: boolean };
export type GridPos = { x: number; z: number };

export type Maze = {
  cols: number;
  rows: number;
  cells: CellWalls[][];
  hWalls: boolean[][];
  vWalls: boolean[][];
  start: GridPos;
  exit: GridPos;
  crystals: GridPos[];
  seed: number;
};

const DIRS: { x: number; z: number; a: keyof CellWalls; b: keyof CellWalls }[] = [
  { x: 0, z: -1, a: "n", b: "s" },
  { x: 1, z: 0, a: "e", b: "w" },
  { x: 0, z: 1, a: "s", b: "n" },
  { x: -1, z: 0, a: "w", b: "e" },
];

export function cellCenter(gx: number, gz: number) {
  const ox = (COLS - 1) / 2;
  const oz = (ROWS - 1) / 2;
  return { x: (gx - ox) * CELL, z: (gz - oz) * CELL };
}

export function wallZ(line: number) {
  return cellCenter(0, 0).z - CELL / 2 + line * CELL;
}

export function wallX(line: number) {
  return cellCenter(0, 0).x - CELL / 2 + line * CELL;
}

export function worldToCell(x: number, z: number): GridPos | null {
  const ox = (COLS - 1) / 2;
  const oz = (ROWS - 1) / 2;
  const gx = Math.round(x / CELL + ox);
  const gz = Math.round(z / CELL + oz);
  if (gx < 0 || gz < 0 || gx >= COLS || gz >= ROWS) return null;
  return { x: gx, z: gz };
}

export function generateMaze(seed: number): Maze {
  const rand = mulberry32(seed >>> 0 || 1);
  const cells: CellWalls[][] = [];
  for (let z = 0; z < ROWS; z++) {
    cells[z] = [];
    for (let x = 0; x < COLS; x++) {
      cells[z]![x] = { n: true, e: true, s: true, w: true };
    }
  }

  const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const stack: GridPos[] = [{ x: 0, z: 0 }];
  visited[0]![0] = true;

  while (stack.length) {
    const cur = stack[stack.length - 1]!;
    const options: (typeof DIRS)[number][] = [];
    for (const d of DIRS) {
      const nx = cur.x + d.x;
      const nz = cur.z + d.z;
      if (nx < 0 || nz < 0 || nx >= COLS || nz >= ROWS) continue;
      if (visited[nz]![nx]) continue;
      options.push(d);
    }
    if (!options.length) {
      stack.pop();
      continue;
    }
    const d = options[Math.floor(rand() * options.length)]!;
    const nx = cur.x + d.x;
    const nz = cur.z + d.z;
    cells[cur.z]![cur.x]![d.a] = false;
    cells[nz]![nx]![d.b] = false;
    visited[nz]![nx] = true;
    stack.push({ x: nx, z: nz });
  }

  const knock = Math.floor(COLS * ROWS * 0.1);
  for (let i = 0; i < knock; i++) {
    const x = Math.floor(rand() * COLS);
    const z = Math.floor(rand() * ROWS);
    const d = DIRS[Math.floor(rand() * 4)]!;
    const nx = x + d.x;
    const nz = z + d.z;
    if (nx < 0 || nz < 0 || nx >= COLS || nz >= ROWS) continue;
    cells[z]![x]![d.a] = false;
    cells[nz]![nx]![d.b] = false;
  }

  // Seal the outer border so the labyrinth never leaks into the void.
  for (let x = 0; x < COLS; x++) {
    cells[0]![x]!.n = true;
    cells[ROWS - 1]![x]!.s = true;
  }
  for (let z = 0; z < ROWS; z++) {
    cells[z]![0]!.w = true;
    cells[z]![COLS - 1]!.e = true;
  }

  const dist = bfs(cells, { x: 0, z: 0 });
  let exit: GridPos = { x: COLS - 1, z: ROWS - 1 };
  let best = -1;
  for (let z = 0; z < ROWS; z++) {
    for (let x = 0; x < COLS; x++) {
      const d = dist[z]![x]!;
      if (d > best) {
        best = d;
        exit = { x, z };
      }
    }
  }

  const start: GridPos = { x: 0, z: 0 };
  const dead: GridPos[] = [];
  const rest: GridPos[] = [];
  for (let z = 0; z < ROWS; z++) {
    for (let x = 0; x < COLS; x++) {
      if ((x === start.x && z === start.z) || (x === exit.x && z === exit.z)) continue;
      const c = cells[z]![x]!;
      const walls = Number(c.n) + Number(c.e) + Number(c.s) + Number(c.w);
      if (walls >= 3) dead.push({ x, z });
      else rest.push({ x, z });
    }
  }
  shuffle(dead, rand);
  shuffle(rest, rand);
  const crystals = [...dead, ...rest].slice(0, CRYSTAL_COUNT);

  const { hWalls, vWalls } = flattenWalls(cells);

  return { cols: COLS, rows: ROWS, cells, hWalls, vWalls, start, exit, crystals, seed };
}

function flattenWalls(cells: CellWalls[][]) {
  const hWalls = Array.from({ length: ROWS + 1 }, () => Array(COLS).fill(false));
  const vWalls = Array.from({ length: ROWS }, () => Array(COLS + 1).fill(false));
  for (let z = 0; z < ROWS; z++) {
    for (let x = 0; x < COLS; x++) {
      const c = cells[z]![x]!;
      if (c.n) hWalls[z]![x] = true;
      if (c.s) hWalls[z + 1]![x] = true;
      if (c.w) vWalls[z]![x] = true;
      if (c.e) vWalls[z]![x + 1] = true;
    }
  }
  return { hWalls, vWalls };
}

function bfs(cells: CellWalls[][], start: GridPos) {
  const dist = Array.from({ length: ROWS }, () => Array(COLS).fill(Infinity));
  dist[start.z]![start.x] = 0;
  const q: GridPos[] = [start];
  for (let i = 0; i < q.length; i++) {
    const cur = q[i]!;
    const d = dist[cur.z]![cur.x]!;
    const c = cells[cur.z]![cur.x]!;
    for (const dir of DIRS) {
      if (c[dir.a]) continue;
      const nx = cur.x + dir.x;
      const nz = cur.z + dir.z;
      if (nx < 0 || nz < 0 || nx >= COLS || nz >= ROWS) continue;
      if (dist[nz]![nx] !== Infinity) continue;
      dist[nz]![nx] = d + 1;
      q.push({ x: nx, z: nz });
    }
  }
  return dist;
}

function shuffle<T>(arr: T[], rand: () => number) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const a = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = a;
  }
}

export function wallCount(c: CellWalls) {
  return Number(c.n) + Number(c.e) + Number(c.s) + Number(c.w);
}

export function openDir(c: CellWalls, gx = 0, gz = 0): { x: number; z: number } {
  if (!c.n && gz > 0) return { x: 0, z: -1 };
  if (!c.e && gx < COLS - 1) return { x: 1, z: 0 };
  if (!c.s && gz < ROWS - 1) return { x: 0, z: 1 };
  if (!c.w && gx > 0) return { x: -1, z: 0 };
  if (!c.e) return { x: 1, z: 0 };
  if (!c.s) return { x: 0, z: 1 };
  if (!c.w) return { x: -1, z: 0 };
  return { x: 0, z: 1 };
}

export function facingYaw(dir: { x: number; z: number }) {
  // yaw 0 faces -Z; +yaw CCW toward -X
  return Math.atan2(-dir.x, -dir.z);
}
