/** Micro sound design — fully synthesized WebAudio, zero audio assets.
 *  Only ever fires after a user gesture (browser autoplay rules). */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled: boolean | null = null;

export function isSoundEnabled(): boolean {
  if (enabled === null) {
    try {
      enabled = localStorage.getItem("gy-sound") !== "0";
    } catch {
      enabled = true;
    }
  }
  return enabled;
}

export function toggleSound(): boolean {
  const next = !isSoundEnabled();
  enabled = next;
  try {
    localStorage.setItem("gy-sound", next ? "1" : "0");
  } catch {
    /* private mode */
  }
  return next;
}

function ensure(): AudioContext | null {
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.45;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function noiseBurst(c: AudioContext, dur: number, freq: number, gain: number, when: number) {
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const n = c.createBufferSource();
  n.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = freq;
  const g = c.createGain();
  g.gain.value = gain;
  n.connect(f);
  f.connect(g);
  g.connect(master!);
  n.start(when);
}

/** Short ceramic pop — egg tap / yolk land. */
export function pop() {
  if (!isSoundEnabled()) return;
  const c = ensure();
  if (!c) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "triangle";
  o.frequency.setValueAtTime(480, t);
  o.frequency.exponentialRampToValueAtTime(110, t + 0.12);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.28, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  o.connect(g);
  g.connect(master!);
  o.start(t);
  o.stop(t + 0.18);
  noiseBurst(c, 0.05, 2600, 0.22, t);
}

/** Crash — shell shatter into shards. */
export function burst() {
  if (!isSoundEnabled()) return;
  const c = ensure();
  if (!c) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(160, t);
  o.frequency.exponentialRampToValueAtTime(46, t + 0.28);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.32, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
  o.connect(g);
  g.connect(master!);
  o.start(t);
  o.stop(t + 0.34);
  noiseBurst(c, 0.22, 1400, 0.3, t);
  noiseBurst(c, 0.1, 3200, 0.18, t + 0.03);
}
