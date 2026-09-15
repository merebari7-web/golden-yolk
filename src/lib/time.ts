/** Live delivery-window awareness — powers the countdown pill + Yolk AI. */

export interface DeliveryWindow {
  mode: "today" | "tomorrow";
  /** ms until the next 2 PM delivery run. */
  ms: number;
}

/** Order cutoff is noon; the van leaves at 2 PM daily. */
export function deliveryWindow(now = new Date()): DeliveryWindow {
  const run = new Date(now);
  run.setHours(14, 0, 0, 0);
  if (now.getTime() < run.getTime() && now.getHours() < 12) {
    return { mode: "today", ms: run.getTime() - now.getTime() };
  }
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  next.setHours(14, 0, 0, 0);
  return { mode: "tomorrow", ms: next.getTime() - now.getTime() };
}

export function fmtDuration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m ${String(sec).padStart(2, "0")}s`;
}

export function greetingByHour(d = new Date()): string {
  const h = d.getHours();
  if (h < 5) return "Burning the midnight oil?";
  if (h < 12) return "Good morning!";
  if (h < 17) return "Good afternoon!";
  return "Good evening!";
}

export function countdownLine(): string {
  const { mode, ms } = deliveryWindow();
  return mode === "today"
    ? `Heads-up: today's 2 PM run leaves in ${fmtDuration(ms)}.`
    : "Today's noon cutoff has passed — but tomorrow's 2 PM run is wide open.";
}
