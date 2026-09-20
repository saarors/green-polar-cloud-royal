import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { I as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as TorusGeometry, S as Scene, _ as PlaneGeometry, a as BufferGeometry, b as PointsMaterial, c as FogExp2, d as InstancedMesh, f as Mesh, g as PerspectiveCamera, h as OctahedronGeometry, i as BufferAttribute, l as Group, m as Object3D, n as AmbientLight, o as Color, p as MeshLambertMaterial, r as BoxGeometry, s as DirectionalLight, t as WebGLRenderer, u as HemisphereLight, v as PointLight, w as Vector3, x as SRGBColorSpace, y as Points } from "../_libs/three.mjs";
import { t as create } from "../_libs/zustand.mjs";
import { a as Gem, i as Pause, n as Timer, r as Play } from "../_libs/lucide-react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/GameApp-DIUEavwF.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function mulberry32(seed) {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = a + 1831565813 | 0;
		let t = Math.imul(a ^ a >>> 15, 1 | a);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
function hash2(x, z) {
	let n = Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263);
	n = (n ^ n >>> 13) >>> 0;
	n = Math.imul(n, 1274126177);
	return ((n ^ n >>> 16) >>> 0) / 4294967296;
}
var CELL = 4.5;
var WALL_T = .4;
var WALL_H = 3.28;
var DIRS = [
	{
		x: 0,
		z: -1,
		a: "n",
		b: "s"
	},
	{
		x: 1,
		z: 0,
		a: "e",
		b: "w"
	},
	{
		x: 0,
		z: 1,
		a: "s",
		b: "n"
	},
	{
		x: -1,
		z: 0,
		a: "w",
		b: "e"
	}
];
function cellCenter(gx, gz) {
	return {
		x: (gx - 5) * CELL,
		z: (gz - 5) * CELL
	};
}
function wallZ(line) {
	return cellCenter(0, 0).z - CELL / 2 + line * CELL;
}
function wallX(line) {
	return cellCenter(0, 0).x - CELL / 2 + line * CELL;
}
function worldToCell(x, z) {
	const ox = 5;
	const oz = 5;
	const gx = Math.round(x / CELL + ox);
	const gz = Math.round(z / CELL + oz);
	if (gx < 0 || gz < 0 || gx >= 11 || gz >= 11) return null;
	return {
		x: gx,
		z: gz
	};
}
function generateMaze(seed) {
	const rand = mulberry32(seed >>> 0 || 1);
	const cells = [];
	for (let z = 0; z < 11; z++) {
		cells[z] = [];
		for (let x = 0; x < 11; x++) cells[z][x] = {
			n: true,
			e: true,
			s: true,
			w: true
		};
	}
	const visited = Array.from({ length: 11 }, () => Array(11).fill(false));
	const stack = [{
		x: 0,
		z: 0
	}];
	visited[0][0] = true;
	while (stack.length) {
		const cur = stack[stack.length - 1];
		const options = [];
		for (const d of DIRS) {
			const nx = cur.x + d.x;
			const nz = cur.z + d.z;
			if (nx < 0 || nz < 0 || nx >= 11 || nz >= 11) continue;
			if (visited[nz][nx]) continue;
			options.push(d);
		}
		if (!options.length) {
			stack.pop();
			continue;
		}
		const d = options[Math.floor(rand() * options.length)];
		const nx = cur.x + d.x;
		const nz = cur.z + d.z;
		cells[cur.z][cur.x][d.a] = false;
		cells[nz][nx][d.b] = false;
		visited[nz][nx] = true;
		stack.push({
			x: nx,
			z: nz
		});
	}
	const knock = Math.floor(121 * .1);
	for (let i = 0; i < knock; i++) {
		const x = Math.floor(rand() * 11);
		const z = Math.floor(rand() * 11);
		const d = DIRS[Math.floor(rand() * 4)];
		const nx = x + d.x;
		const nz = z + d.z;
		if (nx < 0 || nz < 0 || nx >= 11 || nz >= 11) continue;
		cells[z][x][d.a] = false;
		cells[nz][nx][d.b] = false;
	}
	const dist = bfs(cells, {
		x: 0,
		z: 0
	});
	let exit = {
		x: 10,
		z: 10
	};
	let best = -1;
	for (let z = 0; z < 11; z++) for (let x = 0; x < 11; x++) {
		const d = dist[z][x];
		if (d > best) {
			best = d;
			exit = {
				x,
				z
			};
		}
	}
	const start = {
		x: 0,
		z: 0
	};
	const dead = [];
	const rest = [];
	for (let z = 0; z < 11; z++) for (let x = 0; x < 11; x++) {
		if (x === start.x && z === start.z || x === exit.x && z === exit.z) continue;
		const c = cells[z][x];
		if (Number(c.n) + Number(c.e) + Number(c.s) + Number(c.w) >= 3) dead.push({
			x,
			z
		});
		else rest.push({
			x,
			z
		});
	}
	shuffle(dead, rand);
	shuffle(rest, rand);
	const crystals = [...dead, ...rest].slice(0, 7);
	const { hWalls, vWalls } = flattenWalls(cells);
	return {
		cols: 11,
		rows: 11,
		cells,
		hWalls,
		vWalls,
		start,
		exit,
		crystals,
		seed
	};
}
function flattenWalls(cells) {
	const hWalls = Array.from({ length: 12 }, () => Array(11).fill(false));
	const vWalls = Array.from({ length: 11 }, () => Array(12).fill(false));
	for (let z = 0; z < 11; z++) for (let x = 0; x < 11; x++) {
		const c = cells[z][x];
		if (c.n) hWalls[z][x] = true;
		if (c.s) hWalls[z + 1][x] = true;
		if (c.w) vWalls[z][x] = true;
		if (c.e) vWalls[z][x + 1] = true;
	}
	return {
		hWalls,
		vWalls
	};
}
function bfs(cells, start) {
	const dist = Array.from({ length: 11 }, () => Array(11).fill(Infinity));
	dist[start.z][start.x] = 0;
	const q = [start];
	for (let i = 0; i < q.length; i++) {
		const cur = q[i];
		const d = dist[cur.z][cur.x];
		const c = cells[cur.z][cur.x];
		for (const dir of DIRS) {
			if (c[dir.a]) continue;
			const nx = cur.x + dir.x;
			const nz = cur.z + dir.z;
			if (nx < 0 || nz < 0 || nx >= 11 || nz >= 11) continue;
			if (dist[nz][nx] !== Infinity) continue;
			dist[nz][nx] = d + 1;
			q.push({
				x: nx,
				z: nz
			});
		}
	}
	return dist;
}
function shuffle(arr, rand) {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		const a = arr[i];
		arr[i] = arr[j];
		arr[j] = a;
	}
}
function openDir(c) {
	if (!c.n) return {
		x: 0,
		z: -1
	};
	if (!c.e) return {
		x: 1,
		z: 0
	};
	if (!c.s) return {
		x: 0,
		z: 1
	};
	return {
		x: -1,
		z: 0
	};
}
function facingYaw(dir) {
	return Math.atan2(-dir.x, -dir.z);
}
var SpatialHash = class {
	cell;
	map = /* @__PURE__ */ new Map();
	constructor(cellSize) {
		this.cell = cellSize;
	}
	clear() {
		this.map.clear();
	}
	insert(box) {
		const x0 = Math.floor(box.minX / this.cell);
		const x1 = Math.floor(box.maxX / this.cell);
		const z0 = Math.floor(box.minZ / this.cell);
		const z1 = Math.floor(box.maxZ / this.cell);
		for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
			const k = `${x},${z}`;
			let list = this.map.get(k);
			if (!list) {
				list = [];
				this.map.set(k, list);
			}
			list.push(box);
		}
	}
	query(x, z, r, into) {
		into.length = 0;
		const x0 = Math.floor((x - r) / this.cell);
		const x1 = Math.floor((x + r) / this.cell);
		const z0 = Math.floor((z - r) / this.cell);
		const z1 = Math.floor((z + r) / this.cell);
		for (let ix = x0; ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++) {
			const list = this.map.get(`${ix},${iz}`);
			if (!list) continue;
			for (const b of list) if (!into.includes(b)) into.push(b);
		}
		return into;
	}
};
/** Push a circle on XZ out of AABBs. Repeat a few times so corners stay solid. */
function resolveCircle(x, z, radius, boxes) {
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
			x += dx / d * pen;
			z += dz / d * pen;
		}
		if (!pushed) break;
	}
	return {
		x,
		z
	};
}
var input = {
	keys: /* @__PURE__ */ new Set(),
	injected: /* @__PURE__ */ new Set(),
	lookDx: 0,
	lookDy: 0,
	touchMoveX: 0,
	touchMoveY: 0,
	dragging: false
};
var GAME_CODES = /* @__PURE__ */ new Set([
	"KeyW",
	"KeyA",
	"KeyS",
	"KeyD",
	"ShiftLeft",
	"ShiftRight",
	"ArrowUp",
	"ArrowDown",
	"ArrowLeft",
	"ArrowRight",
	"Space",
	"KeyP",
	"Escape",
	"KeyR",
	"KeyM"
]);
var attached = false;
var lastDragX = 0;
var lastDragY = 0;
function onKeyDown(e) {
	if (e.repeat) {
		if (GAME_CODES.has(e.code)) e.preventDefault();
		return;
	}
	input.keys.add(e.code);
	if (GAME_CODES.has(e.code)) e.preventDefault();
}
function onKeyUp(e) {
	input.keys.delete(e.code);
}
function onBlur() {
	input.keys.clear();
}
function onPointerMove(e) {
	if (document.pointerLockElement) {
		input.lookDx += e.movementX;
		input.lookDy += e.movementY;
		return;
	}
	if (!input.dragging) return;
	input.lookDx += e.clientX - lastDragX;
	input.lookDy += e.clientY - lastDragY;
	lastDragX = e.clientX;
	lastDragY = e.clientY;
}
function onPointerUp() {
	input.dragging = false;
}
function beginDragLook(clientX, clientY) {
	if (document.pointerLockElement) return;
	input.dragging = true;
	lastDragX = clientX;
	lastDragY = clientY;
}
function isDown(code) {
	return input.keys.has(code) || input.injected.has(code);
}
function consumeLook() {
	const dx = input.lookDx;
	const dy = input.lookDy;
	input.lookDx = 0;
	input.lookDy = 0;
	return {
		dx,
		dy
	};
}
function moveAxes() {
	let x = input.touchMoveX;
	let y = input.touchMoveY;
	if (isDown("KeyD") || isDown("ArrowRight")) x += 1;
	if (isDown("KeyA") || isDown("ArrowLeft")) x -= 1;
	if (isDown("KeyW") || isDown("ArrowUp")) y += 1;
	if (isDown("KeyS") || isDown("ArrowDown")) y -= 1;
	const pads = navigator.getGamepads?.() ?? [];
	for (const pad of pads) {
		if (!pad || pad.mapping !== "standard") continue;
		const lx = pad.axes[0] ?? 0;
		const ly = pad.axes[1] ?? 0;
		const m = Math.hypot(lx, ly);
		const dz = .15;
		if (m >= dz) {
			const scale = (m - dz) / .85 / m;
			x += lx * scale;
			y += -ly * scale;
		}
		if (pad.buttons[12]?.pressed) y += 1;
		if (pad.buttons[13]?.pressed) y -= 1;
		if (pad.buttons[14]?.pressed) x -= 1;
		if (pad.buttons[15]?.pressed) x += 1;
	}
	const mag = Math.hypot(x, y);
	if (mag > 1) {
		x /= mag;
		y /= mag;
	}
	return {
		x,
		y
	};
}
function sprintHeld() {
	if (isDown("ShiftLeft") || isDown("ShiftRight")) return true;
	const pads = navigator.getGamepads?.() ?? [];
	for (const pad of pads) if (pad?.buttons[10]?.pressed || (pad?.buttons[7]?.value ?? 0) > .5) return true;
	return false;
}
function justPressedFactory() {
	const prev = /* @__PURE__ */ new Set();
	return (code) => {
		const down = isDown(code);
		const was = prev.has(code);
		if (down) prev.add(code);
		else prev.delete(code);
		return down && !was;
	};
}
function attachInput() {
	if (attached) return;
	attached = true;
	window.addEventListener("keydown", onKeyDown);
	window.addEventListener("keyup", onKeyUp);
	window.addEventListener("blur", onBlur);
	document.addEventListener("visibilitychange", onBlur);
	window.addEventListener("pointermove", onPointerMove);
	window.addEventListener("pointerup", onPointerUp);
	window.addEventListener("pointercancel", onPointerUp);
}
function detachInput() {
	if (!attached) return;
	attached = false;
	window.removeEventListener("keydown", onKeyDown);
	window.removeEventListener("keyup", onKeyUp);
	window.removeEventListener("blur", onBlur);
	document.removeEventListener("visibilitychange", onBlur);
	window.removeEventListener("pointermove", onPointerMove);
	window.removeEventListener("pointerup", onPointerUp);
	window.removeEventListener("pointercancel", onPointerUp);
	input.keys.clear();
	input.injected.clear();
	input.lookDx = 0;
	input.lookDy = 0;
	input.touchMoveX = 0;
	input.touchMoveY = 0;
	input.dragging = false;
}
function setInjectedKeys(codes) {
	input.injected = new Set(codes);
}
var ctx = null;
var master = null;
var sfx = null;
var music = null;
var droneOsc = null;
var droneGain = null;
var muted = false;
function ensure() {
	if (ctx) return ctx;
	ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "interactive" });
	master = ctx.createGain();
	sfx = ctx.createGain();
	music = ctx.createGain();
	sfx.gain.value = .7;
	music.gain.value = .22;
	master.gain.value = muted ? 0 : 1;
	sfx.connect(master);
	music.connect(master);
	master.connect(ctx.destination);
	return ctx;
}
function unlockAudio() {
	const c = ensure();
	if (c.state === "suspended") c.resume();
}
function setMuted(next) {
	muted = next;
	if (!master || !ctx) return;
	master.gain.setTargetAtTime(next ? 0 : 1, ctx.currentTime, .03);
}
function envGain(duration, peak, attack = .01) {
	const c = ensure();
	const g = c.createGain();
	const t = c.currentTime;
	g.gain.setValueAtTime(1e-4, t);
	g.gain.exponentialRampToValueAtTime(peak, t + attack);
	g.gain.exponentialRampToValueAtTime(1e-4, t + duration);
	g.connect(sfx);
	return {
		g,
		t,
		c
	};
}
function playPickup() {
	const { t, c } = envGain(.28, .18, .008);
	const o1 = c.createOscillator();
	o1.type = "triangle";
	o1.frequency.setValueAtTime(660, t);
	o1.frequency.exponentialRampToValueAtTime(990, t + .12);
	const g1 = c.createGain();
	g1.gain.value = .5;
	o1.connect(g1);
	g1.connect(sfx);
	const o2 = c.createOscillator();
	o2.type = "sine";
	o2.frequency.setValueAtTime(990, t + .05);
	o2.frequency.exponentialRampToValueAtTime(1320, t + .2);
	o1.start(t);
	o1.stop(t + .22);
	o2.connect(g1);
	o2.start(t + .04);
	o2.stop(t + .28);
}
function playOpen() {
	const c = ensure();
	const t = c.currentTime;
	[
		392,
		523,
		659
	].forEach((f, i) => {
		const o = c.createOscillator();
		const g = c.createGain();
		o.type = "sine";
		o.frequency.value = f;
		g.gain.setValueAtTime(1e-4, t);
		g.gain.exponentialRampToValueAtTime(.12, t + .02 + i * .05);
		g.gain.exponentialRampToValueAtTime(1e-4, t + .5);
		o.connect(g);
		g.connect(sfx);
		o.start(t + i * .06);
		o.stop(t + .55);
	});
}
function playWin() {
	const c = ensure();
	const t = c.currentTime;
	[
		523,
		659,
		784,
		1046
	].forEach((f, i) => {
		const o = c.createOscillator();
		const g = c.createGain();
		o.type = "triangle";
		o.frequency.value = f;
		g.gain.setValueAtTime(1e-4, t);
		g.gain.exponentialRampToValueAtTime(.14, t + .02);
		g.gain.exponentialRampToValueAtTime(1e-4, t + .7);
		o.connect(g);
		g.connect(sfx);
		o.start(t + i * .09);
		o.stop(t + .75);
	});
}
function playLocked() {
	const c = ensure();
	const t = c.currentTime;
	const o = c.createOscillator();
	const g = c.createGain();
	o.type = "square";
	o.frequency.value = 90;
	g.gain.setValueAtTime(1e-4, t);
	g.gain.exponentialRampToValueAtTime(.08, t + .01);
	g.gain.exponentialRampToValueAtTime(1e-4, t + .18);
	o.connect(g);
	g.connect(sfx);
	o.start(t);
	o.stop(t + .2);
}
function playFootstep() {
	const c = ensure();
	const t = c.currentTime;
	const buffer = c.createBuffer(1, Math.floor(c.sampleRate * .05), c.sampleRate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
	const src = c.createBufferSource();
	src.buffer = buffer;
	const filter = c.createBiquadFilter();
	filter.type = "lowpass";
	filter.frequency.value = 420 + Math.random() * 180;
	const g = c.createGain();
	g.gain.setValueAtTime(1e-4, t);
	g.gain.exponentialRampToValueAtTime(.09 + Math.random() * .03, t + .005);
	g.gain.exponentialRampToValueAtTime(1e-4, t + .07);
	src.connect(filter);
	filter.connect(g);
	g.connect(sfx);
	src.start(t);
	src.stop(t + .08);
}
function startDrone() {
	const c = ensure();
	if (droneOsc) return;
	droneOsc = c.createOscillator();
	droneGain = c.createGain();
	const filter = c.createBiquadFilter();
	filter.type = "lowpass";
	filter.frequency.value = 240;
	droneOsc.type = "sawtooth";
	droneOsc.frequency.value = 55;
	droneGain.gain.setValueAtTime(1e-4, c.currentTime);
	droneGain.gain.exponentialRampToValueAtTime(.04, c.currentTime + 1.2);
	droneOsc.connect(filter);
	filter.connect(droneGain);
	droneGain.connect(music);
	droneOsc.start();
}
function stopDrone() {
	if (!droneOsc || !droneGain || !ctx) return;
	const osc = droneOsc;
	const g = droneGain;
	g.gain.setTargetAtTime(1e-4, ctx.currentTime, .08);
	window.setTimeout(() => {
		try {
			osc.stop();
			osc.disconnect();
			g.disconnect();
		} catch {}
		if (droneOsc === osc) {
			droneOsc = null;
			droneGain = null;
		}
	}, 400);
}
function resumeAudioIfNeeded() {
	if (!ctx) return;
	if (ctx.state === "suspended") ctx.resume();
}
var BEST_KEY = "lumen-best-v1";
function loadBest() {
	try {
		const v = localStorage.getItem(BEST_KEY);
		if (!v) return null;
		const n = Number(v);
		return Number.isFinite(n) && n > 0 ? n : null;
	} catch {
		return null;
	}
}
function saveBest(t) {
	try {
		localStorage.setItem(BEST_KEY, String(t));
	} catch {}
}
var useGame = create((set, get) => ({
	phase: "title",
	time: 0,
	collected: 0,
	total: 7,
	bestTime: loadBest(),
	lastTime: 0,
	newBest: false,
	hint: null,
	muted: false,
	isTouch: false,
	locked: false,
	setPhase: (phase) => set({ phase }),
	setTime: (time) => set({ time }),
	setProgress: (collected, total) => set({
		collected,
		total
	}),
	setHint: (hint) => set({ hint }),
	setMuted: (muted) => set({ muted }),
	setTouch: (isTouch) => set({ isTouch }),
	setLocked: (locked) => set({ locked }),
	recordWin: (time) => {
		const best = get().bestTime;
		const newBest = best === null || time < best;
		if (newBest) saveBest(time);
		set({
			phase: "won",
			lastTime: time,
			bestTime: newBest ? time : best,
			newBest,
			hint: null
		});
	},
	resetRun: () => set({
		phase: "title",
		time: 0,
		collected: 0,
		hint: null,
		lastTime: 0,
		newBest: false,
		locked: false
	})
}));
function formatTime(seconds, precise = false) {
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	if (!precise) return `${m}:${s.toString().padStart(2, "0")}`;
	const t = Math.floor(seconds % 1 * 10);
	return `${m}:${s.toString().padStart(2, "0")}.${t}`;
}
var WALL_GEO = new BoxGeometry(1, 1, 1);
var TILE_GEO = new BoxGeometry(1, 1, 1);
var OCT_GEO = new OctahedronGeometry(.22, 0);
var RING_GEO = new TorusGeometry(.36, .018, 4, 8);
var DUST_COUNT = 220;
var SHARED = {
	WALL_GEO,
	TILE_GEO,
	OCT_GEO,
	RING_GEO,
	PARTICLE_GEO: new OctahedronGeometry(.05, 0)
};
function stoneColor(x, z, kind) {
	const n = hash2(x * 13, z * 29);
	const n2 = hash2(z * 7, x * 17);
	const c = new Color();
	if (kind === "wall") {
		const moss = n2 > .72;
		const warm = n2 < .22;
		const h = moss ? .28 : warm ? .08 : .55;
		const s = moss ? .16 : warm ? .12 : .07;
		const l = .2 + n * .09;
		c.setHSL(h, s, l);
	} else if (kind === "floor") c.setHSL(.58, .05, .09 + n * .04);
	else c.setHSL(.6, .04, .055 + n * .03);
	return c;
}
function buildWorld(scene, maze) {
	const group = new Group();
	scene.add(group);
	const aabbs = [];
	const hash = new SpatialHash(CELL);
	const wallMats = [];
	const wallCols = [];
	const dummy = new Object3D();
	const pushWall = (cx, cz, sx, sz) => {
		dummy.position.set(cx, WALL_H / 2, cz);
		dummy.scale.set(sx, WALL_H, sz);
		dummy.rotation.set(0, 0, 0);
		dummy.updateMatrix();
		wallMats.push(dummy.matrix.clone());
		wallCols.push(stoneColor(cx, cz, "wall"));
		const box = {
			minX: cx - sx / 2,
			maxX: cx + sx / 2,
			minZ: cz - sz / 2,
			maxZ: cz + sz / 2
		};
		aabbs.push(box);
		hash.insert(box);
	};
	for (let z = 0; z <= 11; z++) for (let x = 0; x < 11; x++) {
		if (!maze.hWalls[z][x]) continue;
		pushWall(wallX(x) + CELL / 2, wallZ(z), CELL + WALL_T, WALL_T);
	}
	for (let z = 0; z < 11; z++) for (let x = 0; x <= 11; x++) {
		if (!maze.vWalls[z][x]) continue;
		pushWall(wallX(x), wallZ(z) + CELL / 2, WALL_T, CELL + WALL_T);
	}
	const wallMesh = new InstancedMesh(WALL_GEO, new MeshLambertMaterial({ color: 16777215 }), wallMats.length);
	wallMesh.castShadow = false;
	wallMesh.receiveShadow = false;
	for (let i = 0; i < wallMats.length; i++) {
		wallMesh.setMatrixAt(i, wallMats[i]);
		wallMesh.setColorAt(i, wallCols[i]);
	}
	wallMesh.instanceMatrix.needsUpdate = true;
	if (wallMesh.instanceColor) wallMesh.instanceColor.needsUpdate = true;
	group.add(wallMesh);
	const floorMesh = new InstancedMesh(TILE_GEO, new MeshLambertMaterial({ color: 16777215 }), 121);
	const ceilMesh = new InstancedMesh(TILE_GEO, new MeshLambertMaterial({ color: 16777215 }), 121);
	const tile = CELL - .18;
	let i = 0;
	for (let z = 0; z < 11; z++) for (let x = 0; x < 11; x++) {
		const c = cellCenter(x, z);
		dummy.position.set(c.x, -.06, c.z);
		dummy.scale.set(tile, .12, tile);
		dummy.updateMatrix();
		floorMesh.setMatrixAt(i, dummy.matrix);
		const fc = stoneColor(x, z, "floor");
		if (x === maze.start.x && z === maze.start.z) fc.offsetHSL(0, 0, .06);
		if (x === maze.exit.x && z === maze.exit.z) fc.offsetHSL(.08, .1, .05);
		floorMesh.setColorAt(i, fc);
		const hole = hash2(x + 3, z + 11) > .88;
		dummy.position.set(c.x, WALL_H + .05, c.z);
		dummy.scale.set(tile, .1, tile);
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
	floorMesh.instanceMatrix.needsUpdate = true;
	ceilMesh.instanceMatrix.needsUpdate = true;
	if (floorMesh.instanceColor) floorMesh.instanceColor.needsUpdate = true;
	if (ceilMesh.instanceColor) ceilMesh.instanceColor.needsUpdate = true;
	group.add(floorMesh);
	group.add(ceilMesh);
	const crystalMat = new MeshLambertMaterial({
		color: 10474696,
		emissive: 4034434,
		emissiveIntensity: .9
	});
	const ringMat = new MeshLambertMaterial({
		color: 6989982,
		emissive: 1985092,
		emissiveIntensity: .4
	});
	const crystals = maze.crystals.map((g) => {
		const c = cellCenter(g.x, g.z);
		const holder = new Group();
		holder.position.set(c.x, .85, c.z);
		const mesh = new Mesh(OCT_GEO, crystalMat);
		const ring = new Mesh(RING_GEO, ringMat);
		ring.rotation.x = Math.PI / 2;
		ring.position.y = -.55;
		holder.add(mesh, ring);
		group.add(holder);
		return {
			gx: g.x,
			gz: g.z,
			mesh: holder,
			taken: false,
			pos: new Vector3(c.x, .85, c.z)
		};
	});
	const exitC = cellCenter(maze.exit.x, maze.exit.z);
	const exitGroup = new Group();
	exitGroup.position.set(exitC.x, 0, exitC.z);
	const pillarMat = new MeshLambertMaterial({ color: 2764854 });
	const pGeo = new BoxGeometry(.28, 2.4, .28);
	const p1 = new Mesh(pGeo, pillarMat);
	const p2 = new Mesh(pGeo, pillarMat);
	p1.position.set(-.85, 1.2, 0);
	p2.position.set(.85, 1.2, 0);
	const lintel = new Mesh(new BoxGeometry(2.1, .22, .28), pillarMat);
	lintel.position.set(0, 2.32, 0);
	const exitMat = new MeshLambertMaterial({
		color: 8038560,
		emissive: 731686,
		emissiveIntensity: .2,
		transparent: true,
		opacity: .35,
		side: 2
	});
	const portal = new Mesh(new PlaneGeometry(1.55, 2.05), exitMat);
	portal.position.set(0, 1.15, 0);
	const exitLight = new PointLight(10474696, 0, 8, 2);
	exitLight.position.set(0, 1.4, 0);
	exitGroup.add(p1, p2, lintel, portal, exitLight);
	group.add(exitGroup);
	const dustGeo = new BufferGeometry();
	const dustPos = /* @__PURE__ */ new Float32Array(660);
	const half = 11 * CELL / 2;
	for (let d = 0; d < DUST_COUNT; d++) {
		dustPos[d * 3] = (hash2(d, 1) - .5) * half * 2;
		dustPos[d * 3 + 1] = .3 + hash2(d, 2) * (WALL_H - .6);
		dustPos[d * 3 + 2] = (hash2(d, 3) - .5) * half * 2;
	}
	dustGeo.setAttribute("position", new BufferAttribute(dustPos, 3));
	const dust = new Points(dustGeo, new PointsMaterial({
		color: 12047564,
		size: .035,
		transparent: true,
		opacity: .22,
		depthWrite: false
	}));
	group.add(dust);
	const lantern = new PointLight(15986662, 14, 13.5, 1.55);
	lantern.position.set(0, 1.4, 0);
	scene.add(lantern);
	const hemi = new HemisphereLight(9085096, 1841428, .35);
	const amb = new AmbientLight(1712678, .22);
	const dir = new DirectionalLight(12965080, .12);
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
		dust.material.dispose();
		lantern.dispose();
		exitLight.dispose();
	};
	return {
		group,
		aabbs,
		hash,
		crystals,
		exitPos: new Vector3(exitC.x, 0, exitC.z),
		exitMat,
		exitLight,
		dust,
		lantern,
		dispose
	};
}
function cellKey(x, z) {
	return `${x},${z}`;
}
function drawMinimap(canvas, maze, revealed, playerX, playerZ, yaw, crystals, exitOpen) {
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
	const scale = w * .42 / (CELL * 3.2);
	ctx.translate(w / 2, h / 2);
	ctx.rotate(yaw);
	ctx.scale(scale, scale);
	ctx.translate(-playerX, -playerZ);
	for (let z = 0; z < 11; z++) for (let x = 0; x < 11; x++) {
		if (!revealed.has(cellKey(x, z))) continue;
		const c = cellCenter(x, z);
		ctx.fillStyle = "#1c2228";
		ctx.fillRect(c.x - CELL / 2, c.z - CELL / 2, CELL, CELL);
	}
	ctx.strokeStyle = "#8fa0a8";
	ctx.lineWidth = .18;
	ctx.lineCap = "square";
	ctx.beginPath();
	for (let z = 0; z < 11; z++) for (let x = 0; x < 11; x++) {
		if (!revealed.has(cellKey(x, z))) continue;
		const cell = maze.cells[z][x];
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
	ctx.stroke();
	for (const cr of crystals) {
		if (cr.taken) continue;
		if (!revealed.has(cellKey(cr.gx, cr.gz))) continue;
		ctx.fillStyle = "#9fd4c8";
		ctx.beginPath();
		ctx.arc(cr.pos.x, cr.pos.z, .28, 0, Math.PI * 2);
		ctx.fill();
	}
	if (revealed.has(cellKey(maze.exit.x, maze.exit.z))) {
		const e = cellCenter(maze.exit.x, maze.exit.z);
		ctx.fillStyle = exitOpen ? "#d7ece7" : "#6a7a80";
		ctx.fillRect(e.x - .35, e.z - .35, .7, .7);
	}
	ctx.restore();
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
var STEP = 1 / 60;
var EYE = 1.58;
var RADIUS$1 = .4;
var WALK = 4.55;
var SPRINT = 7.05;
var SENS = .00215;
var PITCH_LIM = Math.PI / 2 - .02;
var PARTICLE_N = 48;
function createGame(canvas, minimap) {
	const qa = typeof location !== "undefined" && new URLSearchParams(location.search).has("qa");
	const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	const renderer = new WebGLRenderer({
		canvas,
		antialias: true,
		alpha: false,
		powerPreference: "high-performance"
	});
	renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
	renderer.outputColorSpace = SRGBColorSpace;
	renderer.toneMapping = 4;
	renderer.toneMappingExposure = 1.05;
	renderer.setClearColor(526603, 1);
	const scene = new Scene();
	scene.background = new Color(526603);
	scene.fog = new FogExp2(790034, .055);
	const camera = new PerspectiveCamera(76, 1, .08, 80);
	camera.rotation.order = "YXZ";
	scene.add(camera);
	const particleMesh = new InstancedMesh(SHARED.PARTICLE_GEO, new MeshLambertMaterial({
		color: 10474696,
		emissive: 5942944,
		emissiveIntensity: 1.1
	}), PARTICLE_N);
	particleMesh.frustumCulled = false;
	scene.add(particleMesh);
	const particles = Array.from({ length: PARTICLE_N }, () => ({
		alive: false,
		x: 0,
		y: 0,
		z: 0,
		vx: 0,
		vy: 0,
		vz: 0,
		life: 0
	}));
	const pDummy = new Object3D();
	let maze;
	let world;
	let revealed = /* @__PURE__ */ new Set();
	let px = 0;
	let pz = 0;
	let vx = 0;
	let vz = 0;
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
	const nearby = [];
	const justPressed = justPressedFactory();
	const fwd = new Vector3();
	const right = new Vector3();
	const resize = () => {
		const w = canvas.clientWidth || canvas.parentElement?.clientWidth || 1;
		const h = canvas.clientHeight || canvas.parentElement?.clientHeight || 1;
		renderer.setSize(w, h, false);
		camera.aspect = w / Math.max(1, h);
		camera.updateProjectionMatrix();
	};
	const ro = new ResizeObserver(resize);
	ro.observe(canvas.parentElement || canvas);
	function revealAt(x, z) {
		const cell = worldToCell(x, z);
		if (!cell) return;
		revealed.add(cellKey(cell.x, cell.z));
		const walls = maze.cells[cell.z][cell.x];
		if (!walls.n) revealed.add(cellKey(cell.x, cell.z - 1));
		if (!walls.s) revealed.add(cellKey(cell.x, cell.z + 1));
		if (!walls.e) revealed.add(cellKey(cell.x + 1, cell.z));
		if (!walls.w) revealed.add(cellKey(cell.x - 1, cell.z));
	}
	function spawnBurst(x, y, z) {
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
			p.life = .45 + Math.random() * .25;
			n--;
			if (n <= 0) break;
		}
	}
	function rebuild(seed) {
		if (world) world.dispose();
		maze = generateMaze(seed ?? (Math.floor(Math.random() * 2147483647) || 1));
		world = buildWorld(scene, maze);
		revealed = /* @__PURE__ */ new Set();
		const start = cellCenter(maze.start.x, maze.start.z);
		px = start.x;
		pz = start.z;
		vx = 0;
		vz = 0;
		yaw = facingYaw(openDir(maze.cells[maze.start.z][maze.start.x]));
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
		useGame.getState().setProgress(0, 7);
		useGame.getState().setTime(0);
		useGame.getState().setHint(null);
	}
	function basis() {
		fwd.set(-Math.sin(yaw), 0, -Math.cos(yaw));
		right.set(Math.cos(yaw), 0, -Math.sin(yaw));
	}
	function tryLock() {
		const el = canvas;
		try {
			const p = el.requestPointerLock({ unadjustedMovement: true });
			if (p && typeof p.catch === "function") p.catch(() => {
				try {
					el.requestPointerLock();
				} catch {}
			});
		} catch {
			try {
				el.requestPointerLock();
			} catch {}
		}
	}
	function exitLock() {
		if (document.pointerLockElement) document.exitPointerLock();
	}
	function start() {
		unlockAudio();
		resumeAudioIfNeeded();
		startDrone();
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
	function collectCrystal(c) {
		c.taken = true;
		c.mesh.visible = false;
		playPickup();
		spawnBurst(c.pos.x, c.pos.y, c.pos.z);
		fovPunch = 5;
		const left = world.crystals.filter((x) => !x.taken).length;
		const got = 7 - left;
		useGame.getState().setProgress(got, 7);
		if (left === 0) {
			exitOpen = true;
			world.exitMat.emissive.setHex(4034434);
			world.exitMat.emissiveIntensity = 1.15;
			world.exitMat.opacity = .72;
			world.exitLight.intensity = 7;
			playOpen();
			useGame.getState().setHint("The gate is open");
		}
	}
	function physics(dt) {
		const phase = useGame.getState().phase;
		basis();
		if (phase === "title") {
			yaw += Math.sin(performance.now() * 25e-5) * 4e-4;
			pitch = -.06 + Math.sin(performance.now() * 17e-5) * .04;
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
			world.hash.query(nx, nz, 1, nearby);
			const resolved = resolveCircle(nx, nz, RADIUS$1, nearby);
			if (Math.abs(resolved.x - nx) > 1e-5) vx = 0;
			if (Math.abs(resolved.z - nz) > 1e-5) vz = 0;
			px = resolved.x;
			pz = resolved.z;
			const spd = Math.hypot(vx, vz);
			if (spd > .4) distWalked += spd * dt;
			bob = reduceMotion ? 0 : Math.sin(distWalked * 9.2) * Math.min(1, spd / WALK) * .038;
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
				if (dx * dx + dz * dz < .85 * .85) collectCrystal(c);
			}
			const ex = world.exitPos.x - px;
			const ez = world.exitPos.z - pz;
			if (ex * ex + ez * ez < 1.15 * 1.15) {
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
		if (phase !== "paused") for (const p of particles) {
			if (!p.alive) continue;
			p.life -= dt;
			p.vy -= 4.2 * dt;
			p.x += p.vx * dt;
			p.y += p.vy * dt;
			p.z += p.vz * dt;
			if (p.life <= 0 || p.y < .05) p.alive = false;
		}
	}
	function render(now) {
		if (disposed) return;
		const dtRaw = lastTs ? (now - lastTs) / 1e3 : STEP;
		lastTs = now;
		const dt = Math.min(dtRaw, .1);
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
		const targetFov = 76 + (phase === "playing" && sprintHeld() && Math.hypot(vx, vz) > 1 ? 5 : 0) + fovPunch;
		fov += (targetFov - fov) * (1 - Math.exp(-8 * dt));
		if (Math.abs(camera.fov - fov) > .05) {
			camera.fov = fov;
			camera.updateProjectionMatrix();
		}
		world.lantern.position.set(px + fwd.x * .25, 1.35, pz + fwd.z * .25);
		if (phase !== "paused") {
			const t = now * .001;
			for (const c of world.crystals) {
				if (c.taken) continue;
				c.mesh.rotation.y = t * .9;
				c.mesh.position.y = .85 + Math.sin(t * 2.1 + c.gx) * .08;
			}
			const dustPos = world.dust.geometry.getAttribute("position");
			for (let i = 0; i < dustPos.count; i++) {
				let y = dustPos.getY(i) + dt * .07;
				if (y > 3.1) y = .25;
				dustPos.setY(i, y);
			}
			dustPos.needsUpdate = true;
			let pi = 0;
			for (const p of particles) {
				pDummy.position.set(p.x, p.y, p.z);
				const s = p.alive ? Math.max(.2, p.life * 2.2) : 0;
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
	function onCanvasPointerDown(e) {
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
		setKeys: (codes) => setInjectedKeys(codes)
	};
	window.__lumenQa = qa ? {
		collectAll: () => {
			for (const c of world.crystals) if (!c.taken) collectCrystal(c);
		},
		teleportExit: () => {
			px = world.exitPos.x;
			pz = world.exitPos.z + .9;
		},
		getPos: () => ({
			x: px,
			z: pz,
			yaw
		})
	} : void 0;
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
	return {
		start,
		pause,
		resume,
		restart,
		dispose
	};
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap font-display text-[0.9375rem] font-medium tracking-wide transition-[opacity,transform,background-color,color,border-color] duration-[var(--motion-quick)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98] select-none", {
	variants: {
		variant: {
			primary: "bg-accent text-accent-fg hover:opacity-90 rounded-[var(--radius-md)]",
			secondary: "bg-surface text-fg border border-border hover:border-border-strong rounded-[var(--radius-md)]",
			ghost: "bg-transparent text-muted hover:text-fg rounded-[var(--radius-sm)]"
		},
		size: {
			default: "h-11 min-h-11 px-5",
			lg: "h-12 min-h-12 px-7",
			icon: "size-11 min-h-11 min-w-11 rounded-[var(--radius-md)]"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		ref,
		...props
	});
});
Button.displayName = "Button";
function Overlays({ onStart, onResume, onRestart }) {
	const phase = useGame((s) => s.phase);
	if (phase === "playing") return null;
	if (phase === "title") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Title, { onStart });
	if (phase === "paused") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Paused, {
		onResume,
		onRestart
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Victory, { onRestart });
}
function Title({ onStart }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overlay-scrim z-20",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "overlay-panel",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "overlay-kicker",
					children: "First person"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-3 font-display text-5xl font-medium tracking-[-0.04em] text-fg sm:text-6xl",
					children: "LUMEN"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-[22ch] text-pretty text-base leading-snug text-muted",
					children: "A low-poly labyrinth. Collect every shard. Walk the gate."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-6 space-y-1.5 font-mono text-xs tracking-wide text-subtle",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "WASD / stick — move" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Mouse / drag — look" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Shift — sprint" })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: "mt-8 w-full",
					size: "lg",
					onClick: onStart,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
						className: "size-4",
						strokeWidth: 2
					}), "Start"]
				})
			]
		})
	});
}
function Paused({ onResume, onRestart }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overlay-scrim z-20",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "overlay-panel",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "overlay-kicker",
					children: "Paused"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-3 font-display text-3xl font-medium tracking-[-0.03em]",
					children: "Hold still"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "The corridors wait. Esc or P to resume."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 flex flex-col gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "lg",
						onClick: onResume,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
							className: "size-4",
							strokeWidth: 2
						}), "Resume"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: onRestart,
						children: "New maze"
					})]
				})
			]
		})
	});
}
function Victory({ onRestart }) {
	const lastTime = useGame((s) => s.lastTime);
	const bestTime = useGame((s) => s.bestTime);
	const newBest = useGame((s) => s.newBest);
	const collected = useGame((s) => s.collected);
	const total = useGame((s) => s.total);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overlay-scrim z-20",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "overlay-panel",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "overlay-kicker",
					children: "Gate reached"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-3 font-display text-3xl font-medium tracking-[-0.03em] sm:text-4xl",
					children: "You walked out"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
					className: "mt-8 grid grid-cols-2 gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Time",
							value: formatTime(lastTime, true),
							accent: newBest
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Shards",
							value: `${collected} / ${total}`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Best",
							value: bestTime !== null ? formatTime(bestTime, true) : "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Record",
							value: newBest ? "New best" : "Kept"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-8 w-full",
					size: "lg",
					onClick: onRestart,
					children: "Again"
				})
			]
		})
	});
}
function Stat({ label, value, accent }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-[var(--radius-md)] border border-border bg-surface-2 px-3 py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "font-mono text-[0.625rem] uppercase tracking-[0.18em] text-subtle",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: `mt-1 font-mono text-lg tabular-nums ${accent ? "text-accent" : "text-fg"}`,
			children: value
		})]
	});
}
function PauseButton({ phase, onPause }) {
	if (phase !== "playing") return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		variant: "secondary",
		size: "icon",
		className: "pointer-events-auto",
		"aria-label": "Pause",
		onClick: onPause,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, {
			className: "size-4",
			strokeWidth: 2
		})
	});
}
function Hud({ minimapRef, onPause }) {
	const phase = useGame((s) => s.phase);
	const time = useGame((s) => s.time);
	const collected = useGame((s) => s.collected);
	const total = useGame((s) => s.total);
	const hint = useGame((s) => s.hint);
	const isTouch = useGame((s) => s.isTouch);
	const locked = useGame((s) => s.locked);
	const playing = phase === "playing";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-none absolute inset-0 z-10 p-4 pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `flex flex-wrap gap-2 ${playing ? "opacity-100" : "opacity-0"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "hud-chip",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Timer, {
							className: "size-3.5 text-accent",
							strokeWidth: 2
						}), formatTime(time)]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "hud-chip",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gem, {
								className: "size-3.5 text-accent",
								strokeWidth: 2
							}),
							collected,
							"/",
							total
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PauseButton, {
					phase,
					onPause
				})]
			}),
			playing && hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "pointer-events-none absolute left-1/2 top-20 w-[min(20rem,calc(100%-2rem))] -translate-x-1/2 text-center font-display text-sm text-accent",
				children: hint
			}) : null,
			playing && !isTouch && !locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "pointer-events-none absolute left-1/2 top-[58%] -translate-x-1/2 font-mono text-[0.6875rem] tracking-wide text-muted",
				children: "Click to look"
			}) : null,
			playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "crosshair" }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: `absolute right-4 ${playing ? "opacity-100" : "opacity-0"} ${isTouch ? "bottom-36" : "bottom-4"}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "minimap-frame",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
						ref: minimapRef,
						width: 148,
						height: 148,
						"aria-label": "Minimap"
					})
				})
			})
		]
	});
}
var RADIUS = 44;
function TouchControls() {
	const isTouch = useGame((s) => s.isTouch);
	const phase = useGame((s) => s.phase);
	const wellRef = (0, import_react.useRef)(null);
	const knobRef = (0, import_react.useRef)(null);
	const pointer = (0, import_react.useRef)(null);
	const setKnob = (x, y) => {
		if (!knobRef.current) return;
		knobRef.current.style.transform = `translate(${x}px, ${y}px)`;
	};
	const onDown = (0, import_react.useCallback)((e) => {
		if (pointer.current !== null) return;
		pointer.current = e.pointerId;
		wellRef.current?.setPointerCapture(e.pointerId);
		move(e);
	}, []);
	const move = (e) => {
		const well = wellRef.current;
		if (!well) return;
		const r = well.getBoundingClientRect();
		const cx = r.left + r.width / 2;
		const cy = r.top + r.height / 2;
		let dx = e.clientX - cx;
		let dy = e.clientY - cy;
		const mag = Math.hypot(dx, dy);
		if (mag > RADIUS) {
			dx = dx / mag * RADIUS;
			dy = dy / mag * RADIUS;
		}
		setKnob(dx, dy);
		input.touchMoveX = dx / RADIUS;
		input.touchMoveY = -dy / RADIUS;
	};
	const onMove = (0, import_react.useCallback)((e) => {
		if (pointer.current !== e.pointerId) return;
		move(e);
	}, []);
	const onUp = (0, import_react.useCallback)((e) => {
		if (pointer.current !== e.pointerId) return;
		pointer.current = null;
		input.touchMoveX = 0;
		input.touchMoveY = 0;
		setKnob(0, 0);
	}, []);
	if (!isTouch || phase !== "playing") return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-none absolute inset-0 z-20",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-[max(1.25rem,env(safe-area-inset-left))] pointer-events-auto",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: wellRef,
				className: "stick-well",
				onPointerDown: onDown,
				onPointerMove: onMove,
				onPointerUp: onUp,
				onPointerCancel: onUp,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					ref: knobRef,
					className: "stick-knob"
				})
			})
		})
	});
}
function GameApp() {
	const wrapRef = (0, import_react.useRef)(null);
	const canvasRef = (0, import_react.useRef)(null);
	const minimapRef = (0, import_react.useRef)(null);
	const apiRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const touch = "ontouchstart" in window || (navigator.maxTouchPoints ?? 0) > 0 || window.matchMedia("(pointer: coarse)").matches;
		useGame.getState().setTouch(touch);
	}, []);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		const minimap = minimapRef.current;
		if (!canvas || !minimap) return;
		const api = createGame(canvas, minimap);
		apiRef.current = api;
		return () => {
			api.dispose();
			apiRef.current = null;
		};
	}, []);
	const start = () => {
		unlockAudio();
		apiRef.current?.start();
	};
	const resume = () => apiRef.current?.resume();
	const restart = () => apiRef.current?.restart();
	const pause = () => apiRef.current?.pause();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		ref: wrapRef,
		className: "game-root relative",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: canvasRef,
				className: "game-canvas",
				tabIndex: 0,
				"aria-label": "Lumen maze"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hud, {
				minimapRef,
				onPause: pause
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchControls, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overlays, {
				onStart: start,
				onResume: resume,
				onRestart: restart
			})
		]
	});
}
//#endregion
export { GameApp as default };
