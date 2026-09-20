export type InputState = {
  keys: Set<string>;
  injected: Set<string>;
  lookDx: number;
  lookDy: number;
  touchMoveX: number;
  touchMoveY: number;
  dragging: boolean;
};

export const input: InputState = {
  keys: new Set(),
  injected: new Set(),
  lookDx: 0,
  lookDy: 0,
  touchMoveX: 0,
  touchMoveY: 0,
  dragging: false,
};

const GAME_CODES = new Set([
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
  "KeyM",
]);

let attached = false;
let lastDragX = 0;
let lastDragY = 0;

function onKeyDown(e: KeyboardEvent) {
  if (e.repeat) {
    if (GAME_CODES.has(e.code)) e.preventDefault();
    return;
  }
  input.keys.add(e.code);
  if (GAME_CODES.has(e.code)) e.preventDefault();
}

function onKeyUp(e: KeyboardEvent) {
  input.keys.delete(e.code);
}

function onBlur() {
  input.keys.clear();
}

function onPointerMove(e: PointerEvent) {
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

export function beginDragLook(clientX: number, clientY: number) {
  if (document.pointerLockElement) return;
  input.dragging = true;
  lastDragX = clientX;
  lastDragY = clientY;
}

export function isDown(code: string) {
  return input.keys.has(code) || input.injected.has(code);
}

export function consumeLook() {
  const dx = input.lookDx;
  const dy = input.lookDy;
  input.lookDx = 0;
  input.lookDy = 0;
  return { dx, dy };
}

export function moveAxes() {
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
    const dz = 0.15;
    if (m >= dz) {
      const scale = ((m - dz) / (1 - dz)) / m;
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
  return { x, y };
}

export function sprintHeld() {
  if (isDown("ShiftLeft") || isDown("ShiftRight")) return true;
  const pads = navigator.getGamepads?.() ?? [];
  for (const pad of pads) {
    if (pad?.buttons[10]?.pressed || (pad?.buttons[7]?.value ?? 0) > 0.5) return true;
  }
  return false;
}

export function justPressedFactory() {
  const prev = new Set<string>();
  return (code: string) => {
    const down = isDown(code);
    const was = prev.has(code);
    if (down) prev.add(code);
    else prev.delete(code);
    return down && !was;
  };
}

export function attachInput() {
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

export function detachInput() {
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

export function setInjectedKeys(codes: string[]) {
  input.injected = new Set(codes);
}
