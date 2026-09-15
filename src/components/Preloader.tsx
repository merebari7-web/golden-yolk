import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const EASE: [number, number, number, number] = [0.76, 0, 0.24, 1];

/* Egg outline split into two halves along a jagged crack. */
const EGG_TOP =
  "M50 4 C76 4 92 40 92 66 L78 58 L66 70 L54 56 L42 70 L30 56 L22 66 C8 40 24 4 50 4 Z";
const EGG_BOTTOM =
  "M92 66 C92 92 74 106 50 106 C26 106 8 92 8 66 L22 66 L30 56 L42 70 L54 56 L66 70 L78 58 Z";

export default function Preloader({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(0);
  const [cracking, setCracking] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    const start = performance.now();
    const dur = 1500;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(eased * 100));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else if (!done.current) {
        done.current = true;
        setCracking(true);
        setTimeout(onDone, 950);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-cream"
      exit={{ clipPath: "inset(0 0 100% 0)" }}
      transition={{ duration: 0.9, ease: EASE }}
    >
      {/* ambient glow behind the egg */}
      <motion.div
        className="absolute h-[46vmin] w-[46vmin] rounded-full bg-yolk/25 blur-3xl"
        animate={{ scale: cracking ? 1.5 : [1, 1.12, 1] }}
        transition={
          cracking ? { duration: 0.7, ease: "easeOut" } : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
        }
      />

      <div className="relative">
        <motion.svg
          width="min(24vmin, 190px)"
          viewBox="0 0 100 110"
          animate={cracking ? { scale: 1.06 } : { rotate: [-2.5, 2.5, -2.5] }}
          transition={
            cracking
              ? { type: "spring", stiffness: 260, damping: 14 }
              : { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
          }
          style={{ transformOrigin: "50% 80%" }}
        >
          {/* yolk revealed on crack */}
          <motion.circle
            cx="50"
            cy="68"
            r="19"
            fill="#F5A40B"
            initial={false}
            animate={{ scale: cracking ? 1 : 0, opacity: cracking ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.12 }}
            style={{ transformOrigin: "50px 68px" }}
          />
          <motion.circle
            cx="44"
            cy="62"
            r="5.5"
            fill="#FFD781"
            initial={false}
            animate={{ scale: cracking ? 1 : 0 }}
            transition={{ delay: 0.3 }}
            style={{ transformOrigin: "44px 62px" }}
          />
          {/* shell halves */}
          <motion.path
            d={EGG_TOP}
            fill="#F3E3C2"
            stroke="#211408"
            strokeWidth="2.5"
            initial={false}
            animate={cracking ? { x: -12, y: -16, rotate: -14, opacity: [1, 1, 0] } : {}}
            transition={{ duration: 0.65, ease: EASE, delay: 0.05 }}
            style={{ transformOrigin: "50px 60px" }}
          />
          <motion.path
            d={EGG_BOTTOM}
            fill="#F7EAD2"
            stroke="#211408"
            strokeWidth="2.5"
            initial={false}
            animate={cracking ? { x: 10, y: 12, rotate: 9, opacity: [1, 1, 0] } : {}}
            transition={{ duration: 0.65, ease: EASE, delay: 0.05 }}
            style={{ transformOrigin: "50px 78px" }}
          />
        </motion.svg>

        {/* brand */}
        <motion.p
          className="mt-6 text-center text-[11px] font-extrabold uppercase tracking-[0.5em] text-espresso/60"
          animate={{ opacity: cracking ? 0 : 1 }}
        >
          Golden Yolk Farm
        </motion.p>
      </div>

      {/* counter */}
      <motion.div
        className="absolute bottom-6 left-6 md:bottom-10 md:left-12"
        animate={{ opacity: cracking ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      >
        <p className="font-display text-[18vw] font-extrabold leading-none tracking-tight text-espresso [font-variant-numeric:tabular-nums] md:text-[9rem]">
          {count}
        </p>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.34em] text-espresso/50">
          Warming up the pan…
        </p>
      </motion.div>

      {/* progress hairline */}
      <div className="absolute bottom-0 left-0 h-[3px] w-full bg-espresso/10">
        <div className="h-full bg-flame transition-[width] duration-100 ease-out" style={{ width: `${count}%` }} />
      </div>
    </motion.div>
  );
}
