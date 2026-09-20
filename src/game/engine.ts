import * as THREE from "three";
import {
  CELL,
  CRYSTAL_COUNT,
  cellCenter,
  facingYaw,
  generateMaze,
  openDir,
  worldToCell,
  type Maze,
} from "./maze";
import { resolveCircle, type Aabb } from "./collision";
import {
  attachInput,
  beginDragLook,
  consumeLook,
  detachInput,
  isDown,
  justPressedFactory,
  moveAxes,
  setInjectedKeys,
  sprintHeld,
} from "./input";
import {
  playFootstep,
  playLocked,
  playOpen,
  playPickup,
  playWin,
  resumeAudioIfNeeded,
  setMuted,
  startDrone,
  stopDrone,
  unlockAudio,
} from "./audio";
import { useGame } from "./store";
import { buildWorld, SHARED, type CrystalObj, type World } from "./world";
import { cellKey, drawMinimap } from "./minimap";

const STEP = 1 / 60;
const EYE = 1.58;
const RADIUS = 0.4;
const WALK = 4.55;
const SPRINT = 7.05;
const SENS = 0.00215;
const PITCH_LIM = Math.PI / 2 - 0.02;
const PARTICLE_N = 48;

export type GameApi = {
  start: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  dispose: () => void;
};

type Particle = {
  alive: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
};

export function createGame(canvas: HTMLCanvasElement, minimap: HTMLCanvasElement): GameApi {
  const qa = typeof location !== "undefined" && new URLSearchParams(location.search).has("qa");
  const reduceMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x08090b, 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x08090b);
  scene.fog = new THREE.FogExp2(0x0c0e12, 0.038);

  const camera = new THREE.PerspectiveCamera(76, 1, 0.08, 80);
  camera.rotation.order = "YXZ";
  scene.add(camera);

  const particleMesh = new THREE.InstancedMesh(
    SHARED.PARTICLE_GEO,
    new THREE.MeshLambertMaterial({
      color: 0x9fd4c8,
      emissive: 0x5aaea0,
      emissiveIntensity: 1.1,
    }),
    PARTICLE_N,
  );
  particleMesh.frustumCulled = false;
  scene.add(particleMesh);
  const particles: Particle[] = Array.from({ length: PARTICLE_N }, () => ({
    alive: false,
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    life: 0,
  }));
  const pDummy = new THREE.Object3D();

  let maze: Maze;
  let world: World;
  let revealed = new Set<string>();
  let px = 0;
  let pz = 0;
  let vx = 0;
  let vz = 0;
  let startYaw = 0;
  let yaw = 0;
  let pitch = 0;
  let fov = 76;
  let fovPunch = 0;
  let bob = 0;
  let distWalked = 0;
  let lastFoot = 0;
  let acc = 0;
  let runTime = 0;
  let lastHud = 0;
  let lastHintAt = 0;
  let exitOpen = false;
  let raf = 0;
  let lastTs = 0;
  let disposed = false;
  const nearby: Aabb[] = [];
  const justPressed = justPressedFactory();
  const fwd = new THREE.Vector3();
  const right = new THREE.Vector3();

  const resize = () => {
    const w = canvas.clientWidth || canvas.parentElement?.clientWidth || 1;
    const h = canvas.clientHeight || canvas.parentElement?.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  };

  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement || canvas);

  function revealAt(x: number, z: number) {
    const cell = worldToCell(x, z);
    if (!cell) return;
    revealed.add(cellKey(cell.x, cell.z));
    const walls = maze.cells[cell.z]![cell.x]!;
    if (!walls.n) revealed.add(cellKey(cell.x, cell.z - 1));
    if (!walls.s) revealed.add(cellKey(cell.x, cell.z + 1));
    if (!walls.e) revealed.add(cellKey(cell.x + 1, cell.z));
    if (!walls.w) revealed.add(cellKey(cell.x - 1, cell.z));
  }

  function spawnBurst(x: number, y: number, z: number) {
    let n = 12;
    for (const p of particles) {
      if (p.alive) continue;
      p.alive = true;
      p.x = x;
      p.y = y;
      p.z = z;
      const a = Math.random() * Math.PI * 2;
      const s = 1.2 + Math.random() * 1.8;
      p.vx = Math.cos(a) * s;
      p.vz = Math.sin(a) * s;
      p.vy = 1.6 + Math.random() * 2.2;
      p.life = 0.45 + Math.random() * 0.25;
      n--;
      if (n <= 0) break;
    }
  }

  function rebuild(seed?: number) {
    if (world) world.dispose();
    const s = seed ?? (Math.floor(Math.random() * 0x7fffffff) || 1);
    maze = generateMaze(s);
    world = buildWorld(scene, maze);
    revealed = new Set();
    const start = cellCenter(maze.start.x, maze.start.z);
    px = start.x;
    pz = start.z;
    vx = 0;
    vz = 0;
    const dir = openDir(maze.cells[maze.start.z]![maze.start.x]!, maze.start.x, maze.start.z);
    startYaw = facingYaw(dir);
    yaw = startYaw;
    // Nudge into the first corridor so the lantern sees space, not a wall.
    px += dir.x * 0.45;
    pz += dir.z * 0.45;
    pitch = 0;
    fov = 76;
    fovPunch = 0;
    bob = 0;
    distWalked = 0;
    lastFoot = 0;
    runTime = 0;
    acc = 0;
    exitOpen = false;
    for (const p of particles) p.alive = false;
    revealAt(px, pz);
    useGame.getState().setProgress(0, CRYSTAL_COUNT);
    useGame.getState().setTime(0);
    useGame.getState().setHint(null);
  }

  function basis() {
    // yaw 0 faces world −Z; +yaw CCW about +Y
    fwd.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    right.set(Math.cos(yaw), 0, -Math.sin(yaw));
  }

  function tryLock() {
    const el = canvas as HTMLCanvasElement & {
      requestPointerLock: (opts?: { unadjustedMovement?: boolean }) => void | Promise<void>;
    };
    try {
      const p = el.requestPointerLock({ unadjustedMovement: true });
      if (p && typeof (p as Promise<void>).catch === "function") {
        (p as Promise<void>).catch(() => {
          try {
            el.requestPointerLock();
          } catch {
            /* ignore */
          }
        });
      }
    } catch {
      try {
        el.requestPointerLock();
      } catch {
        /* ignore */
      }
    }
  }

  function exitLock() {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  function start() {
    unlockAudio();
    resumeAudioIfNeeded();
    startDrone();
    yaw = startYaw;
    pitch = 0;
    vx = 0;
    vz = 0;
    useGame.getState().setPhase("playing");
    tryLock();
    canvas.focus();
  }

  function pause() {
    if (useGame.getState().phase !== "playing") return;
    useGame.getState().setPhase("paused");
    exitLock();
  }

  function resume() {
    if (useGame.getState().phase !== "paused") return;
    unlockAudio();
    resumeAudioIfNeeded();
    useGame.getState().setPhase("playing");
    tryLock();
  }

  function restart() {
    stopDrone();
    exitLock();
    useGame.getState().resetRun();
    rebuild();
  }

  function collectCrystal(c: CrystalObj) {
    c.taken = true;
    c.mesh.visible = false;
    playPickup();
    spawnBurst(c.pos.x, c.pos.y, c.pos.z);
    fovPunch = 5;
    const left = world.crystals.filter((x) => !x.taken).length;
    const got = CRYSTAL_COUNT - left;
    useGame.getState().setProgress(got, CRYSTAL_COUNT);
    if (left === 0) {
      exitOpen = true;
      world.exitMat.emissive.setHex(0x3d8f82);
      world.exitMat.emissiveIntensity = 1.15;
      world.exitMat.opacity = 0.72;
      world.exitLight.intensity = 7;
      playOpen();
      useGame.getState().setHint("The gate is open");
    }
  }

  function physics(dt: number) {
    const phase = useGame.getState().phase;
    basis();

    if (phase === "title") {
      const t = performance.now() * 0.001;
      yaw = startYaw + Math.sin(t * 0.32) * 0.38;
      pitch = -0.08 + Math.sin(t * 0.21) * 0.05;
    }

    if (phase === "playing") {
      const look = consumeLook();
      yaw -= look.dx * SENS;
      pitch -= look.dy * SENS;
      if (pitch > PITCH_LIM) pitch = PITCH_LIM;
      if (pitch < -PITCH_LIM) pitch = -PITCH_LIM;

      const axes = moveAxes();
      const speed = sprintHeld() ? SPRINT : WALK;
      const wishX = right.x * axes.x + fwd.x * axes.y;
      const wishZ = right.z * axes.x + fwd.z * axes.y;
      const targetVx = wishX * speed;
      const targetVz = wishZ * speed;
      const k = axes.x !== 0 || axes.y !== 0 ? 14 : 9;
      const blend = 1 - Math.exp(-k * dt);
      vx += (targetVx - vx) * blend;
      vz += (targetVz - vz) * blend;

      let nx = px + vx * dt;
      let nz = pz + vz * dt;
      world.hash.query(nx, nz, RADIUS + 0.6, nearby);
      const resolved = resolveCircle(nx, nz, RADIUS, nearby);
      // If we were blocked on an axis, kill that velocity so walls feel solid.
      if (Math.abs(resolved.x - nx) > 1e-5) vx = 0;
      if (Math.abs(resolved.z - nz) > 1e-5) vz = 0;
      px = resolved.x;
      pz = resolved.z;

      const spd = Math.hypot(vx, vz);
      if (spd > 0.4) distWalked += spd * dt;
      bob = reduceMotion ? 0 : Math.sin(distWalked * 9.2) * Math.min(1, spd / WALK) * 0.038;

      if (spd > 1.2 && distWalked - lastFoot > (sprintHeld() ? 1.35 : 1.55)) {
        lastFoot = distWalked;
        playFootstep();
      }

      runTime += dt;
      revealAt(px, pz);

      for (const c of world.crystals) {
        if (c.taken) continue;
        const dx = px - c.pos.x;
        const dz = pz - c.pos.z;
        if (dx * dx + dz * dz < 0.85 * 0.85) collectCrystal(c);
      }

      const ex = world.exitPos.x - px;
      const ez = world.exitPos.z - pz;
      const nearExit = ex * ex + ez * ez < 1.15 * 1.15;
      if (nearExit) {
        if (exitOpen) {
          playWin();
          stopDrone();
          exitLock();
          useGame.getState().recordWin(runTime);
        } else if (runTime - lastHintAt > 1.6) {
          lastHintAt = runTime;
          playLocked();
          const left = world.crystals.filter((c) => !c.taken).length;
          useGame.getState().setHint(`${left} shard${left === 1 ? "" : "s"} still hidden`);
        }
      }
    }

    if (phase !== "paused") {
      for (const p of particles) {
        if (!p.alive) continue;
        p.life -= dt;
        p.vy -= 4.2 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        if (p.life <= 0 || p.y < 0.05) p.alive = false;
      }
    }
  }

  function render(now: number) {
    if (disposed) return;
    const dtRaw = lastTs ? (now - lastTs) / 1000 : STEP;
    lastTs = now;
    const dt = Math.min(dtRaw, 0.1);
    const phase = useGame.getState().phase;

    if (justPressed("Escape") && phase === "playing") pause();
    else if (justPressed("KeyP") && phase === "playing") pause();
    else if (justPressed("Escape") && phase === "paused") resume();
    else if (justPressed("KeyP") && phase === "paused") resume();
    if (justPressed("KeyM")) {
      const next = !useGame.getState().muted;
      useGame.getState().setMuted(next);
      setMuted(next);
    }
    if ((justPressed("Enter") || justPressed("Space")) && phase === "title") start();
    if (justPressed("KeyR") && (phase === "won" || phase === "paused")) restart();

    if (phase !== "paused") {
      acc += dt;
      while (acc >= STEP) {
        physics(STEP);
        acc -= STEP;
      }
    }

    basis();
    const eyeY = EYE + (phase === "playing" ? bob : 0);
    camera.position.set(px, eyeY, pz);
    camera.rotation.set(pitch, yaw, 0, "YXZ");
    fovPunch += (0 - fovPunch) * (1 - Math.exp(-6 * dt));
    const sprinting = phase === "playing" && sprintHeld() && Math.hypot(vx, vz) > 1;
    const targetFov = 76 + (sprinting ? 5 : 0) + fovPunch;
    fov += (targetFov - fov) * (1 - Math.exp(-8 * dt));
    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    world.lantern.position.set(px + fwd.x * 0.25, 1.35, pz + fwd.z * 0.25);

    if (phase !== "paused") {
      const t = now * 0.001;
      for (const c of world.crystals) {
        if (c.taken) continue;
        c.mesh.rotation.y = t * 0.9;
        c.mesh.position.y = 0.85 + Math.sin(t * 2.1 + c.gx) * 0.08;
      }
      const dustPos = world.dust.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < dustPos.count; i++) {
        let y = dustPos.getY(i) + dt * 0.07;
        if (y > 3.1) y = 0.25;
        dustPos.setY(i, y);
      }
      dustPos.needsUpdate = true;

      let pi = 0;
      for (const p of particles) {
        pDummy.position.set(p.x, p.y, p.z);
        const s = p.alive ? Math.max(0.2, p.life * 2.2) : 0;
        pDummy.scale.setScalar(s);
        pDummy.updateMatrix();
        particleMesh.setMatrixAt(pi, pDummy.matrix);
        pi++;
      }
      particleMesh.instanceMatrix.needsUpdate = true;
    }

    renderer.render(scene, camera);
    drawMinimap(minimap, maze, revealed, px, pz, yaw, world.crystals, exitOpen);

    if (now - lastHud > 80) {
      lastHud = now;
      if (phase === "playing") useGame.getState().setTime(runTime);
    }

    raf = requestAnimationFrame(render);
  }

  function onLockChange() {
    useGame.getState().setLocked(document.pointerLockElement === canvas);
  }

  function onCanvasPointerDown(e: PointerEvent) {
    const phase = useGame.getState().phase;
    if (phase === "title") return;
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (phase === "playing" && !document.pointerLockElement) {
      if (e.pointerType === "mouse") tryLock();
      else beginDragLook(e.clientX, e.clientY);
    }
  }

  function onVisibility() {
    if (document.hidden && useGame.getState().phase === "playing") pause();
    resumeAudioIfNeeded();
  }

  canvas.addEventListener("pointerdown", onCanvasPointerDown);
  document.addEventListener("pointerlockchange", onLockChange);
  document.addEventListener("visibilitychange", onVisibility);

  attachInput();
  rebuild();
  resize();
  lastTs = performance.now();
  raf = requestAnimationFrame(render);

  window.__controlsTest = {
    getYaw: () => yaw,
    getSpeed: () => Math.hypot(vx, vz),
    setKeys: (codes: string[]) => setInjectedKeys(codes),
    getPos: () => ({ x: px, z: pz }),
  };
  window.__lumenQa = qa
    ? {
        collectAll: () => {
          for (const c of world.crystals) if (!c.taken) collectCrystal(c);
        },
        teleportExit: () => {
          px = world.exitPos.x;
          pz = world.exitPos.z + 0.9;
        },
        getPos: () => ({ x: px, z: pz, yaw }),
      }
    : undefined;

  const dispose = () => {
    disposed = true;
    cancelAnimationFrame(raf);
    stopDrone();
    exitLock();
    detachInput();
    ro.disconnect();
    canvas.removeEventListener("pointerdown", onCanvasPointerDown);
    document.removeEventListener("pointerlockchange", onLockChange);
    document.removeEventListener("visibilitychange", onVisibility);
    world.dispose();
    particleMesh.material.dispose();
    renderer.dispose();
    if (window.__controlsTest) delete window.__controlsTest;
    if (window.__lumenQa) delete window.__lumenQa;
  };

  return { start, pause, resume, restart, dispose };
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      setKeys?: (codes: string[]) => void;
      getPos?: () => { x: number; z: number };
    };
    __lumenQa?: {
      collectAll: () => void;
      teleportExit: () => void;
      getPos: () => { x: number; z: number; yaw: number };
    };
  }
}
