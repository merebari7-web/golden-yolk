import { useEffect, useRef, useState, type ReactNode } from "react";

const FRAME_COUNT = 110;
const pad = (n: number) => String(n).padStart(3, "0");
const src = (n: number) => `scroll-sequence/f-${pad(n)}.webp`;

/* ------------------------------------------------------------------ */
/* Scene acts — positioned text driven by scroll progress              */
/* ------------------------------------------------------------------ */

interface ActDef {
  range: [number, number];
  side: "left" | "right";
  scene: string;
  title: ReactNode;
}

const ACTS: ActDef[] = [
  {
    range: [0.02, 0.3],
    side: "left",
    scene: "Scene 01 — The drop",
    title: (
      <>
        Watch it
        <br />
        <span className="font-serif2 lowercase italic font-normal text-yolk">fall.</span>
      </>
    ),
  },
  {
    range: [0.38, 0.62],
    side: "right",
    scene: "Scene 02 — The pool",
    title: (
      <>
        Gold,
        <br />
        <span className="font-serif2 lowercase italic font-normal text-yolk">unbroken.</span>
      </>
    ),
  },
  {
    range: [0.74, 0.97],
    side: "left",
    scene: "Scene 03 — The glow",
    title: (
      <>
        Ready for
        <br />
        <span className="font-serif2 lowercase italic font-normal text-yolk">your pan.</span>
      </>
    ),
  },
];

/* ------------------------------------------------------------------ */
/* Cinematic scroll sequence                                           */
/* ------------------------------------------------------------------ */

export default function ScrollyVideo() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const actEls = useRef<(HTMLDivElement | null)[]>([]);
  const frames = useRef<HTMLImageElement[]>([]);
  const progress = useRef(0);
  const [ready, setReady] = useState(false);

  /* ------------------- preload frames (priority first) ------------------- */
  useEffect(() => {
    let cancelled = false;
    const imgs: HTMLImageElement[] = new Array(FRAME_COUNT);

    const loadOne = (i: number) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.decoding = "async";
        img.src = src(i + 1);
        img.onload = () => {
          if (!cancelled && i < 12) setReady(true);
          resolve();
        };
        img.onerror = () => resolve();
        imgs[i] = img;
      });

    (async () => {
      await Promise.all(Array.from({ length: 12 }, (_, i) => loadOne(i)));
      if (cancelled) return;
      const rest: Promise<void>[] = [];
      for (let i = 12; i < FRAME_COUNT; i++) rest.push(loadOne(i));
      await Promise.all(rest);
    })();

    frames.current = imgs;
    return () => {
      cancelled = true;
    };
  }, []);

  /* ------ single rAF loop: frame scrub, acts, bar, counter -------------- */
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { alpha: false })!;
    let raf = 0;
    let lastFrame = -1;
    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth * dpr;
      h = canvas.clientHeight * dpr;
      canvas.width = w;
      canvas.height = h;
      lastFrame = -1;
    };

    const tick = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.bottom < -vh * 0.5 || rect.top > vh * 1.5) return; // asleep offscreen

      const total = rect.height - vh;
      const p = Math.min(1, Math.max(0, -rect.top / Math.max(1, total)));
      progress.current += (p - progress.current) * 0.12; // buttery easing
      const pc = progress.current;

      /* -- frame draw -- */
      const idx = Math.min(FRAME_COUNT - 1, Math.max(0, Math.floor(pc * FRAME_COUNT)));
      if (idx !== lastFrame) {
        lastFrame = idx;
        const img = frames.current[idx];
        if (!img || !img.complete || !img.naturalWidth) {
          ctx.fillStyle = "#171009";
          ctx.fillRect(0, 0, w, h);
        } else {
          const portrait = h > w;
          /* landscape: cover · portrait: letterboxed contain (cinematic bars) */
          const scale = portrait
            ? Math.min(w / img.naturalWidth, h / img.naturalHeight) * 1.05
            : Math.max(w / img.naturalWidth, h / img.naturalHeight) * 1.02;
          const dw = img.naturalWidth * scale;
          const dh = img.naturalHeight * scale;
          const drift = portrait ? (pc - 0.5) * h * 0.045 : (pc - 0.5) * h * 0.02;
          ctx.fillStyle = "#171009";
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2 + drift, dw, dh);
        }
      }

      /* -- film-strip HUD -- */
      if (barRef.current) barRef.current.style.width = `${pc * 100}%`;
      if (counterRef.current) {
        counterRef.current.textContent = `${pad(
          Math.min(FRAME_COUNT, Math.max(1, Math.round(pc * FRAME_COUNT))),
        )} / ${FRAME_COUNT}`;
      }

      /* -- acts -- */
      for (let i = 0; i < ACTS.length; i++) {
        const el = actEls.current[i];
        if (!el) continue;
        const [a, b] = ACTS[i].range;
        const fade = 0.07;
        let o = 0;
        if (pc > a - fade && pc < b + fade) {
          o = pc < a ? (pc - (a - fade)) / fade : pc > b ? 1 - (pc - b) / fade : 1;
        }
        o = Math.max(0, Math.min(1, o));
        el.style.opacity = String(o);
        el.style.transform = `translateY(${(1 - o) * 26}px)`;
        el.style.visibility = o < 0.01 ? "hidden" : "visible";
      }
    };

    const loop = () => {
      tick();
      raf = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section ref={wrapRef} className="relative h-[280svh]" aria-label="Egg journey film">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-[#171009]">
        <canvas ref={canvasRef} className="h-full w-full" />

        {/* loading shimmer */}
        {!ready && (
          <div className="absolute inset-0 grid place-items-center bg-[#171009]">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-yolk/20 border-t-yolk" />
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cream/40">
                Developing film…
              </p>
            </div>
          </div>
        )}

        {/* cinematic vignette + grade */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(15,8,2,0.55) 100%), linear-gradient(180deg, rgba(15,8,2,0.55) 0%, transparent 22%, transparent 68%, rgba(15,8,2,0.7) 100%)",
          }}
        />

        {/* ---------- scene acts (style-driven from the rAF loop) ---------- */}
        {ACTS.map((act, i) => (
          <div
            key={act.scene}
            ref={(el) => {
              actEls.current[i] = el;
            }}
            className={`pointer-events-none absolute inset-0 flex items-end will-change-transform ${
              act.side === "right" ? "justify-end" : "justify-start"
            }`}
            style={{ opacity: 0, visibility: "hidden" }}
            aria-hidden="true"
          >
            <div
              className={`px-6 pb-[15svh] md:px-16 ${
                act.side === "right" ? "text-right" : "text-left"
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-yolk md:text-[11px]">
                {act.scene}
              </p>
              <h3 className="mt-3 font-display text-[12vw] font-extrabold uppercase leading-[0.9] tracking-tight text-cream min-[480px]:text-5xl md:text-8xl">
                {act.title}
              </h3>
            </div>
          </div>
        ))}

        {/* progress film-strip */}
        <div className="absolute inset-x-5 bottom-6 flex items-center gap-3 md:inset-x-16 md:bottom-8 md:gap-4">
          <span className="hidden text-[10px] font-bold uppercase tracking-[0.3em] text-cream/60 min-[480px]:inline">
            Golden Yolk Studios
          </span>
          <div className="relative h-px flex-1 bg-cream/20">
            <div
              ref={barRef}
              className="absolute left-0 top-1/2 h-[3px] w-0 -translate-y-1/2 bg-yolk"
            />
          </div>
          <span
            ref={counterRef}
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-cream/60 [font-variant-numeric:tabular-nums]"
          >
            001 / {FRAME_COUNT}
          </span>
        </div>
      </div>
    </section>
  );
}
