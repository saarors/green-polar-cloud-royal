export type Aabb = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export class SpatialHash {
  private readonly cell: number;
  private readonly map = new Map<string, Aabb[]>();

  constructor(cellSize: number) {
    this.cell = cellSize;
  }

  clear() {
    this.map.clear();
  }

  insert(box: Aabb) {
    const x0 = Math.floor(box.minX / this.cell);
    const x1 = Math.floor(box.maxX / this.cell);
    const z0 = Math.floor(box.minZ / this.cell);
    const z1 = Math.floor(box.maxZ / this.cell);
    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) {
        const k = `${x},${z}`;
        let list = this.map.get(k);
        if (!list) {
          list = [];
          this.map.set(k, list);
        }
        list.push(box);
      }
    }
  }

  query(x: number, z: number, r: number, into: Aabb[]): Aabb[] {
    into.length = 0;
    const x0 = Math.floor((x - r) / this.cell);
    const x1 = Math.floor((x + r) / this.cell);
    const z0 = Math.floor((z - r) / this.cell);
    const z1 = Math.floor((z + r) / this.cell);
    for (let ix = x0; ix <= x1; ix++) {
      for (let iz = z0; iz <= z1; iz++) {
        const list = this.map.get(`${ix},${iz}`);
        if (!list) continue;
        for (const b of list) {
          if (!into.includes(b)) into.push(b);
        }
      }
    }
    return into;
  }
}

/** Push a circle on XZ out of AABBs. Repeat a few times so corners stay solid. */
export function resolveCircle(
  x: number,
  z: number,
  radius: number,
  boxes: Aabb[],
): { x: number; z: number } {
  for (let iter = 0; iter < 3; iter++) {
    let pushed = false;
    for (const b of boxes) {
      const cx = Math.max(b.minX, Math.min(x, b.maxX));
      const cz = Math.max(b.minZ, Math.min(z, b.maxZ));
      let dx = x - cx;
      let dz = z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 > radius * radius - 1e-8) continue;
      pushed = true;
      if (d2 < 1e-10) {
        const pL = x - b.minX;
        const pR = b.maxX - x;
        const pB = z - b.minZ;
        const pT = b.maxZ - z;
        const min = Math.min(pL, pR, pT, pB);
        if (min === pL) x = b.minX - radius;
        else if (min === pR) x = b.maxX + radius;
        else if (min === pB) z = b.minZ - radius;
        else z = b.maxZ + radius;
        continue;
      }
      const d = Math.sqrt(d2);
      const pen = radius - d;
      x += (dx / d) * pen;
      z += (dz / d) * pen;
    }
    if (!pushed) break;
  }
  return { x, z };
}
