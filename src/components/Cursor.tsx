import { useEffect, useRef, useState } from "react";

/**
 * Custom cursor — a golden dot with a trailing ring.
 * Grows and shows a label over [data-cursor] elements.
 * Disabled entirely on touch devices.
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    const pos = { x: -100, y: -100 };
    const ringPos = { x: -100, y: -100 };
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      setVisible(true);
    };
    const onLeave = () => setVisible(false);
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);

    const onOver = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor], a, button");
      if (el) {
        setActive(true);
        setLabel(el.dataset.cursor ?? null);
      } else {
        setActive(false);
        setLabel(null);
      }
    };

    const loop = () => {
      ringPos.x += (pos.x - ringPos.x) * 0.18;
      ringPos.y += (pos.y - ringPos.y) * 0.18;
      if (dot.current) dot.current.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%,-50%)`;
      if (ring.current) ring.current.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px) translate(-50%,-50%)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.documentElement.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100] hidden [@media(hover:hover)_and_(pointer:fine)]:block"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s" }}
    >
      {/* trailing ring / label bubble */}
      <div ref={ring} className="absolute left-0 top-0 will-change-transform">
        <div
          className={`flex items-center justify-center rounded-full border transition-all duration-300 ease-out ${
            active
              ? "h-16 w-16 border-flame/70 bg-flame/90"
              : "h-9 w-9 border-espresso/35 bg-transparent"
          } ${pressed ? "scale-75" : "scale-100"}`}
        >
          {label && active && (
            <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-cream">
              {label}
            </span>
          )}
        </div>
      </div>
      {/* golden dot */}
      <div ref={dot} className="absolute left-0 top-0 will-change-transform">
        <div
          className={`rounded-full bg-flame transition-all duration-200 ${
            active ? "h-1.5 w-1.5 opacity-90" : "h-2.5 w-2.5"
          }`}
        />
      </div>
    </div>
  );
}
