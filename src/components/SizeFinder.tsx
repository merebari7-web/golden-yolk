import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Egg, RotateCcw, Sparkles } from "lucide-react";
import { TIERS, fmt, type TierName } from "../lib/ai";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const QUESTIONS = [
  {
    id: "mission",
    title: "The mission?",
    options: [
      { label: "Daily breakfasts", weight: 1.5 },
      { label: "Baking & pastries", weight: 0 },
      { label: "Feeding crowds", weight: 3 },
    ],
  },
  {
    id: "crew",
    title: "The crew?",
    options: [
      { label: "Just me", weight: 0 },
      { label: "2 – 4 humans", weight: 1 },
      { label: "5+ or a business", weight: 2 },
    ],
  },
  {
    id: "vibe",
    title: "The vibe?",
    options: [
      { label: "Smart saver", weight: 0 },
      { label: "Balanced", weight: 1 },
      { label: "Treat me", weight: 2 },
    ],
  },
];

const RESULT_COPY: Record<TierName, string> = {
  Small: "Compact commandos. Maximum eggs per franc, custard-grade yolks — your whisk will thank you.",
  Medium: "The sweet spot. Generous enough for breakfast, gentle on the wallet — the nation's favourite for a reason.",
  Big: "Go big or go brunch. ~20% more egg per tray for 200 francs — the yolk-to-franc champion.",
};

export default function SizeFinder() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const answer = (weight: number) => {
    const next = score + weight;
    if (step < QUESTIONS.length - 1) {
      setScore(next);
      setStep(step + 1);
    } else {
      setScore(next);
      setDone(true);
    }
  };

  const reset = () => {
    setStep(0);
    setScore(0);
    setDone(false);
  };

  const result: TierName = score <= 3 ? "Small" : score <= 5.5 ? "Medium" : "Big";
  const confidence = Math.min(99, 82 + Math.round(Math.abs(score - 3) * 4));

  const askWhy = () => {
    const usecase = result === "Small" ? "baking" : result === "Big" ? "crowd" : "breakfast";
    window.dispatchEvent(new CustomEvent("ai-flow", { detail: `cmd:use:${usecase}` }));
  };

  return (
    <section className="relative z-10 flex min-h-[92svh] items-center justify-center px-5 py-24 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-12% 0px" }}
        transition={{ duration: 1.1, ease: EASE }}
        className="pointer-events-auto w-full max-w-2xl overflow-hidden rounded-[2.2rem] border border-espresso/12 bg-cream/75 shadow-[0_40px_110px_-40px_rgba(33,20,8,0.55)] backdrop-blur-2xl"
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-espresso/10 bg-white/40 px-6 py-4 md:px-8">
          <p className="flex items-center gap-2.5 text-[11px] font-extrabold uppercase tracking-[0.26em]">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-flame text-cream">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            AI size finder
          </p>
          <div className="flex items-center gap-1.5">
            {QUESTIONS.map((q, i) => (
              <span
                key={q.id}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  done || i < step ? "w-6 bg-flame" : i === step ? "w-6 bg-espresso" : "w-3 bg-espresso/20"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="relative min-h-[340px] px-5 py-6 md:min-h-[380px] md:px-10 md:py-10">
          <AnimatePresence mode="wait">
            {!done ? (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 60, filter: "blur(6px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -60, filter: "blur(6px)" }}
                transition={{ duration: 0.55, ease: EASE }}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-espresso/45">
                  Question {step + 1} of {QUESTIONS.length}
                </p>
                <h3 className="mt-3 font-display text-3xl font-extrabold tracking-tight min-[420px]:text-4xl md:text-5xl">
                  {QUESTIONS[step].title}
                </h3>
                <div className="mt-6 space-y-2.5 md:mt-8 md:space-y-3">
                  {QUESTIONS[step].options.map((o, i) => (
                    <motion.button
                      key={o.label}
                      type="button"
                      onClick={() => answer(o.weight)}
                      className="group flex w-full items-center justify-between rounded-2xl border border-espresso/12 bg-white/55 px-4 py-3.5 text-left text-[14px] font-bold transition-all hover:border-flame hover:bg-flame hover:text-cream md:px-5 md:py-4 md:text-[15px]"
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.07, duration: 0.5, ease: EASE }}
                      data-cursor="Pick"
                    >
                      {o.label}
                      <ArrowRight className="h-4 w-4 opacity-40 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
                    </motion.button>
                  ))}
                </div>
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="mt-6 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.16em] text-espresso/45 transition-colors hover:text-espresso"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.9, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.7, ease: EASE }}
                className="flex min-h-[340px] flex-col items-center justify-center text-center"
              >
                <motion.span
                  className="grid h-16 w-16 place-items-center rounded-full bg-flame/10 text-flame"
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 240, damping: 13 }}
                >
                  <Egg className="h-7 w-7" strokeWidth={2.2} />
                </motion.span>
                <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.24em] text-espresso/50">
                  Neural verdict · {confidence}% hatch certainty
                </p>
                <h3 className="mt-2 font-display text-4xl font-extrabold uppercase tracking-tight min-[420px]:text-5xl md:text-6xl">
                  Go <span className="font-serif2 lowercase italic font-normal text-flame">{result.toLowerCase()}.</span>
                </h3>
                <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-espresso/70">
                  {RESULT_COPY[result]}
                </p>
                <p className="mt-4 font-display text-2xl font-extrabold [font-variant-numeric:tabular-nums]">
                  ₦{fmt(TIERS[result].price)}{" "}
                  <span className="text-sm font-bold text-espresso/50">/ tray of 30</span>
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <a
                    href={`https://wa.me/2348036501450?text=Hello%20Golden%20Yolk!%20The%20AI%20Size%20Finder%20picked%20${result}%20for%20me%20(%E2%82%A6%20${fmt(TIERS[result].price)}).`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-espresso px-6 py-3 text-sm font-bold text-cream transition-colors hover:bg-flame"
                    data-cursor="Send"
                  >
                    Order the {result}
                  </a>
                  <button
                    type="button"
                    onClick={askWhy}
                    className="rounded-full border border-espresso/20 px-6 py-3 text-sm font-bold transition-colors hover:bg-espresso hover:text-cream"
                    data-cursor="Ask AI"
                  >
                    Ask Yolk AI why
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="grid h-11 w-11 place-items-center rounded-full border border-espresso/15 text-espresso/60 transition-colors hover:bg-espresso hover:text-cream"
                    aria-label="Retake quiz"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  );
}
