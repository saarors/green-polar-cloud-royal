import * as THREE from "three";
import type { Aabb } from "./collision";
import { SpatialHash } from "./collision";
import { hash2 } from "./rng";
import {
  CELL,
  COLS,
  ROWS,
  WALL_H,
  WALL_T,
  cellCenter,
  wallX,
  wallZ,
  type Maze,
} from "./maze";

export type CrystalObj = {
  gx: number;
  gz: number;
  mesh: THREE.Object3D;
  taken: boolean;
  pos: THREE.Vector3;
};

export type World = {
  group: THREE.Group;
  aabbs: Aabb[];
  hash: SpatialHash;
  crystals: CrystalObj[];
  exitPos: THREE.Vector3;
  exitMat: THREE.MeshLambertMaterial;
  exitLight: THREE.PointLight;
  dust: THREE.Points;
  lantern: THREE.PointLight;
  dispose: () => void;
};

const WALL_GEO = new THREE.BoxGeometry(1, 1, 1);
const TILE_GEO = new THREE.BoxGeometry(1, 1, 1);
const OCT_GEO = new THREE.OctahedronGeometry(0.22, 0);
const RING_GEO = new THREE.TorusGeometry(0.36, 0.018, 4, 8);
const DUST_COUNT = 220;
const PARTICLE_GEO = new THREE.OctahedronGeometry(0.05, 0);

export const SHARED = { WALL_GEO, TILE_GEO, OCT_GEO, RING_GEO, PARTICLE_GEO };

function stoneColor(x: number, z: number, kind: "wall" | "floor" | "ceil") {
  const n = hash2(x * 13, z * 29);
  const n2 = hash2(z * 7, x * 17);
  const c = new THREE.Color();
  if (kind === "wall") {
    const moss = n2 > 0.72;
    const warm = n2 < 0.22;
    const h = moss ? 0.28 : warm ? 0.08 : 0.55;
    const s = moss ? 0.16 : warm ? 0.12 : 0.07;
    const l = 0.2 + n * 0.09;
    c.setHSL(h, s, l);
  } else if (kind === "floor") {
    c.setHSL(0.58, 0.05, 0.09 + n * 0.04);
  } else {
    c.setHSL(0.6, 0.04, 0.055 + n * 0.03);
  }
  return c;
}

export function buildWorld(scene: THREE.Scene, maze: Maze): World {
  const group = new THREE.Group();
  scene.add(group);

  const aabbs: Aabb[] = [];
  const hash = new SpatialHash(CELL);
  const wallMats: THREE.Matrix4[] = [];
  const wallCols: THREE.Color[] = [];
  const dummy = new THREE.Object3D();

  const pushWall = (cx: number, cz: number, sx: number, sz: number) => {
    dummy.position.set(cx, WALL_H / 2, cz);
    dummy.scale.set(sx, WALL_H, sz);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    wallMats.push(dummy.matrix.clone());
    wallCols.push(stoneColor(cx, cz, "wall"));
    const box: Aabb = {
      minX: cx - sx / 2,
      maxX: cx + sx / 2,
      minZ: cz - sz / 2,
      maxZ: cz + sz / 2,
    };
    aabbs.push(box);
    hash.insert(box);
  };

  for (let z = 0; z <= ROWS; z++) {
    for (let x = 0; x < COLS; x++) {
      if (!maze.hWalls[z]![x]) continue;
      pushWall(wallX(x) + CELL / 2, wallZ(z), CELL + WALL_T, WALL_T);
    }
  }
  for (let z = 0; z < ROWS; z++) {
    for (let x = 0; x <= COLS; x++) {
      if (!maze.vWalls[z]![x]) continue;
      pushWall(wallX(x), wallZ(z) + CELL / 2, WALL_T, CELL + WALL_T);
    }
  }

  const wallMesh = new THREE.InstancedMesh(
    WALL_GEO,
    new THREE.MeshLambertMaterial({ color: 0xffffff }),
    wallMats.length,
  );
  wallMesh.castShadow = false;
  wallMesh.receiveShadow = false;
  for (let i = 0; i < wallMats.length; i++) {
    wallMesh.setMatrixAt(i, wallMats[i]!);
    wallMesh.setColorAt(i, wallCols[i]!);
  }
  wallMesh.instanceMatrix.needsUpdate = true;
  if (wallMesh.instanceColor) wallMesh.instanceColor.needsUpdate = true;
  group.add(wallMesh);

  const floorMesh = new THREE.InstancedMesh(
    TILE_GEO,
    new THREE.MeshLambertMaterial({ color: 0xffffff }),
    COLS * ROWS,
  );
  const ceilMesh = new THREE.InstancedMesh(
    TILE_GEO,
    new THREE.MeshLambertMaterial({ color: 0xffffff }),
    COLS * ROWS,
  );
  const tile = CELL - 0.18;
  let i = 0;
  for (let z = 0; z < ROWS; z++) {
    for (let x = 0; x < COLS; x++) {
      const c = cellCenter(x, z);
      dummy.position.set(c.x, -0.06, c.z);
      dummy.scale.set(tile, 0.12, tile);
      dummy.updateMatrix();
      floorMesh.setMatrixAt(i, dummy.matrix);
      const fc = stoneColor(x, z, "floor");
      if (x === maze.start.x && z === maze.start.z) fc.offsetHSL(0, 0, 0.06);
      if (x === maze.exit.x && z === maze.exit.z) fc.offsetHSL(0.08, 0.1, 0.05);
      floorMesh.setColorAt(i, fc);

      const hole = hash2(x + 3, z + 11) > 0.88;
      dummy.position.set(c.x, WALL_H + 0.05, c.z);
      dummy.scale.set(tile, 0.1, tile);
      dummy.updateMatrix();
      ceilMesh.setMatrixAt(i, dummy.matrix);
      ceilMesh.setColorAt(i, stoneColor(x + 2, z, "ceil"));
      if (hole) {
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        ceilMesh.setMatrixAt(i, dummy.matrix);
      }
      i++;
    }
  }
  floorMesh.instanceMatrix.needsUpdate = true;
  ceilMesh.instanceMatrix.needsUpdate = true;
  if (floorMesh.instanceColor) floorMesh.instanceColor.needsUpdate = true;
  if (ceilMesh.instanceColor) ceilMesh.instanceColor.needsUpdate = true;
  group.add(floorMesh);
  group.add(ceilMesh);

  const crystalMat = new THREE.MeshLambertMaterial({
    color: 0x9fd4c8,
    emissive: 0x3d8f82,
    emissiveIntensity: 0.9,
  });
  const ringMat = new THREE.MeshLambertMaterial({
    color: 0x6aa89e,
    emissive: 0x1e4a44,
    emissiveIntensity: 0.4,
  });
  const crystals: CrystalObj[] = maze.crystals.map((g) => {
    const c = cellCenter(g.x, g.z);
    const holder = new THREE.Group();
    holder.position.set(c.x, 0.85, c.z);
    const mesh = new THREE.Mesh(OCT_GEO, crystalMat);
    const ring = new THREE.Mesh(RING_GEO, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.55;
    holder.add(mesh, ring);
    group.add(holder);
    return {
      gx: g.x,
      gz: g.z,
      mesh: holder,
      taken: false,
      pos: new THREE.Vector3(c.x, 0.85, c.z),
    };
  });

  const exitC = cellCenter(maze.exit.x, maze.exit.z);
  const exitGroup = new THREE.Group();
  exitGroup.position.set(exitC.x, 0, exitC.z);
  const pillarMat = new THREE.MeshLambertMaterial({ color: 0x2a3036 });
  const pGeo = new THREE.BoxGeometry(0.28, 2.4, 0.28);
  const p1 = new THREE.Mesh(pGeo, pillarMat);
  const p2 = new THREE.Mesh(pGeo, pillarMat);
  p1.position.set(-0.85, 1.2, 0);
  p2.position.set(0.85, 1.2, 0);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.22, 0.28), pillarMat);
  lintel.position.set(0, 2.32, 0);
  const exitMat = new THREE.MeshLambertMaterial({
    color: 0x7aa8a0,
    emissive: 0x0b2a26,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
  });
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 2.05), exitMat);
  portal.position.set(0, 1.15, 0);
  const exitLight = new THREE.PointLight(0x9fd4c8, 0, 8, 2);
  exitLight.position.set(0, 1.4, 0);
  exitGroup.add(p1, p2, lintel, portal, exitLight);
  group.add(exitGroup);

  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(DUST_COUNT * 3);
  const half = (COLS * CELL) / 2;
  for (let d = 0; d < DUST_COUNT; d++) {
    dustPos[d * 3] = (hash2(d, 1) - 0.5) * half * 2;
    dustPos[d * 3 + 1] = 0.3 + hash2(d, 2) * (WALL_H - 0.6);
    dustPos[d * 3 + 2] = (hash2(d, 3) - 0.5) * half * 2;
  }
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      color: 0xb7d4cc,
      size: 0.035,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    }),
  );
  group.add(dust);

  const lantern = new THREE.PointLight(0xf3efe6, 14, 13.5, 1.55);
  lantern.position.set(0, 1.4, 0);
  scene.add(lantern);

  const hemi = new THREE.HemisphereLight(0x8aa0a8, 0x1c1914, 0.35);
  const amb = new THREE.AmbientLight(0x1a2226, 0.22);
  const dir = new THREE.DirectionalLight(0xc5d4d8, 0.12);
  dir.position.set(6, 14, -4);
  group.add(hemi, amb, dir);

  const dispose = () => {
    scene.remove(group);
    scene.remove(lantern);
    wallMesh.geometry = WALL_GEO;
    wallMesh.material.dispose();
    floorMesh.material.dispose();
    ceilMesh.material.dispose();
    crystalMat.dispose();
    ringMat.dispose();
    pillarMat.dispose();
    exitMat.dispose();
    pGeo.dispose();
    lintel.geometry.dispose();
    portal.geometry.dispose();
    dustGeo.dispose();
    (dust.material as THREE.Material).dispose();
    lantern.dispose();
    exitLight.dispose();
  };

  return {
    group,
    aabbs,
    hash,
    crystals,
    exitPos: new THREE.Vector3(exitC.x, 0, exitC.z),
    exitMat,
    exitLight,
    dust,
    lantern,
    dispose,
  };
}
