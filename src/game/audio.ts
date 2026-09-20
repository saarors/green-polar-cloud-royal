let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfx: GainNode | null = null;
let music: GainNode | null = null;
let droneOsc: OscillatorNode | null = null;
let droneGain: GainNode | null = null;
let muted = false;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  ctx = new AC({ latencyHint: "interactive" });
  master = ctx.createGain();
  sfx = ctx.createGain();
  music = ctx.createGain();
  sfx.gain.value = 0.7;
  music.gain.value = 0.22;
  master.gain.value = muted ? 0 : 1;
  sfx.connect(master);
  music.connect(master);
  master.connect(ctx.destination);
  return ctx;
}

export function unlockAudio() {
  const c = ensure();
  if (c.state === "suspended") void c.resume();
}

export function setMuted(next: boolean) {
  muted = next;
  if (!master || !ctx) return;
  master.gain.setTargetAtTime(next ? 0 : 1, ctx.currentTime, 0.03);
}

export function isMuted() {
  return muted;
}

function envGain(duration: number, peak: number, attack = 0.01) {
  const c = ensure();
  const g = c.createGain();
  const t = c.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  g.connect(sfx!);
  return { g, t, c };
}

export function playPickup() {
  const { t, c } = envGain(0.28, 0.18, 0.008);
  const o1 = c.createOscillator();
  o1.type = "triangle";
  o1.frequency.setValueAtTime(660, t);
  o1.frequency.exponentialRampToValueAtTime(990, t + 0.12);
  const g1 = c.createGain();
  g1.gain.value = 0.5;
  o1.connect(g1);
  g1.connect(sfx!);
  const o2 = c.createOscillator();
  o2.type = "sine";
  o2.frequency.setValueAtTime(990, t + 0.05);
  o2.frequency.exponentialRampToValueAtTime(1320, t + 0.2);
  o1.start(t);
  o1.stop(t + 0.22);
  o2.connect(g1);
  o2.start(t + 0.04);
  o2.stop(t + 0.28);
}

export function playOpen() {
  const c = ensure();
  const t = c.currentTime;
  const freqs = [392, 523, 659];
  freqs.forEach((f, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.02 + i * 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g);
    g.connect(sfx!);
    o.start(t + i * 0.06);
    o.stop(t + 0.55);
  });
}

export function playWin() {
  const c = ensure();
  const t = c.currentTime;
  const freqs = [523, 659, 784, 1046];
  freqs.forEach((f, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "triangle";
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.14, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    o.connect(g);
    g.connect(sfx!);
    o.start(t + i * 0.09);
    o.stop(t + 0.75);
  });
}

export function playLocked() {
  const c = ensure();
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "square";
  o.frequency.value = 90;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.08, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.connect(g);
  g.connect(sfx!);
  o.start(t);
  o.stop(t + 0.2);
}

export function playFootstep() {
  const c = ensure();
  const t = c.currentTime;
  const buffer = c.createBuffer(1, Math.floor(c.sampleRate * 0.05), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 420 + Math.random() * 180;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.09 + Math.random() * 0.03, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  src.connect(filter);
  filter.connect(g);
  g.connect(sfx!);
  src.start(t);
  src.stop(t + 0.08);
}

export function startDrone() {
  const c = ensure();
  if (droneOsc) return;
  droneOsc = c.createOscillator();
  droneGain = c.createGain();
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 240;
  droneOsc.type = "sawtooth";
  droneOsc.frequency.value = 55;
  droneGain.gain.setValueAtTime(0.0001, c.currentTime);
  droneGain.gain.exponentialRampToValueAtTime(0.04, c.currentTime + 1.2);
  droneOsc.connect(filter);
  filter.connect(droneGain);
  droneGain.connect(music!);
  droneOsc.start();
}

export function stopDrone() {
  if (!droneOsc || !droneGain || !ctx) return;
  const osc = droneOsc;
  const g = droneGain;
  g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.08);
  const c = ctx;
  window.setTimeout(() => {
    try {
      osc.stop();
      osc.disconnect();
      g.disconnect();
    } catch {
      /* already stopped */
    }
    if (droneOsc === osc) {
      droneOsc = null;
      droneGain = null;
    }
  }, 400);
  void c;
}

export function resumeAudioIfNeeded() {
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();
}
