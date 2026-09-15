import { useEffect, useRef, useState, type ReactNode } from "react";
import Lenis from "lenis";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Clock3,
  Egg,
  Landmark,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  Sparkles,
  Sun,
  Truck,
  Volume2,
  VolumeX,
  Wheat,
} from "lucide-react";
import EggScene from "./components/EggScene";
import Preloader from "./components/Preloader";
import Cursor from "./components/Cursor";
import AiConcierge from "./components/AiConcierge";
import Testimonials from "./components/Testimonials";
import SizeFinder from "./components/SizeFinder";
import ScrollyVideo from "./components/ScrollyVideo";
import { scrollState, scrollTo, setLenis } from "./lib/scroll";
import { PAYMENT } from "./lib/payment";
import { isSoundEnabled, toggleSound } from "./lib/sound";
import { deliveryWindow, fmtDuration } from "./lib/time";
import type { TierName } from "./lib/ai";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ------------------------------------------------------------------ */
/* Motion primitives                                                    */
/* ------------------------------------------------------------------ */

interface MotionProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  play?: boolean;
}

function Reveal({ children, delay = 0, className = "", play }: MotionProps) {
  const controlled = play !== undefined;
  return (
    <span className={`block overflow-hidden ${className}`}>
      <motion.span
        className="block"
        initial={{ y: "115%", rotate: 3 }}
        animate={controlled ? (play ? { y: "0%", rotate: 0 } : { y: "115%", rotate: 3 }) : undefined}
        whileInView={!controlled ? { y: "0%", rotate: 0 } : undefined}
        viewport={!controlled ? { once: true, margin: "-8% 0px" } : undefined}
        transition={{ duration: 1.1, ease: EASE, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

function FadeUp({ children, delay = 0, className = "", play }: MotionProps) {
  const controlled = play !== undefined;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 44 }}
      animate={controlled ? (play ? { opacity: 1, y: 0 } : { opacity: 0, y: 44 }) : undefined}
      whileInView={!controlled ? { opacity: 1, y: 0 } : undefined}
      viewport={!controlled ? { once: true, margin: "-10% 0px" } : undefined}
      transition={{ duration: 1, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={`flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-espresso/70 ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-flame" />
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Crack meter HUD — egg fills as you scroll                            */
/* ------------------------------------------------------------------ */

const EGG_PATH =
  "M12 0.8 C18.5 0.8 22.8 8 22.8 14 C22.8 20.5 17.8 24.6 12 24.6 C6.2 24.6 1.2 20.5 1.2 14 C1.2 8 5.5 0.8 12 0.8 Z";

function CrackMeter() {
  const { scrollYProgress } = useScroll();
  const [v, setV] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", setV);
  return (
    <div className="pointer-events-none fixed bottom-6 left-6 z-40 hidden flex-col items-center gap-1.5 md:flex">
      <svg width="24" height="26" viewBox="0 0 24 26">
        <defs>
          <clipPath id="eggMeterClip">
            <path d={EGG_PATH} />
          </clipPath>
        </defs>
        <path d={EGG_PATH} fill="rgba(33,20,8,0.06)" stroke="rgba(33,20,8,0.3)" strokeWidth="1" />
        <g clipPath="url(#eggMeterClip)">
          <rect x="0" y={25 * (1 - v)} width="24" height={25 * v} fill="#F5A40B" />
          <circle cx="12" cy="16" r="5.5" fill="#E4590E" opacity={v > 0.92 ? 1 : 0} />
        </g>
      </svg>
      <p className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-espresso/50 [font-variant-numeric:tabular-nums]">
        {Math.round(v * 100)}%
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Live delivery countdown                                              */
/* ------------------------------------------------------------------ */

function DeliveryPill() {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const { mode, ms } = deliveryWindow();
  const urgent = mode === "today" && ms < 45 * 60 * 1000;

  return (
    <button
      type="button"
      onClick={() => scrollTo("#order")}
      title="Order by noon for today's 2 PM delivery run"
      className="pointer-events-auto hidden items-center gap-2 rounded-full border border-espresso/12 bg-white/50 px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-[0.12em] transition-colors hover:border-flame lg:flex"
      data-cursor="Order"
    >
      <span
        className={`h-1.5 w-1.5 animate-pulse rounded-full ${
          mode === "today" ? (urgent ? "bg-red-500" : "bg-green-600") : "bg-espresso/35"
        }`}
      />
      <span className="[font-variant-numeric:tabular-nums]">
        {mode === "today" ? `Today's run · ${fmtDuration(ms)}` : "Next run · tomorrow 2 PM"}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Sound toggle                                                         */
/* ------------------------------------------------------------------ */

function SoundToggle() {
  const [on, setOn] = useState<boolean>(() => isSoundEnabled());
  return (
    <button
      type="button"
      onClick={() => setOn(toggleSound())}
      title={on ? "Mute micro-sounds" : "Enable micro-sounds"}
      aria-label={on ? "Mute sound" : "Enable sound"}
      className="grid h-9 w-9 place-items-center rounded-full border border-espresso/12 bg-white/50 text-espresso/65 transition-colors hover:bg-espresso hover:text-cream"
      data-cursor={on ? "Mute" : "Sound"}
    >
      {on ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Navigation                                                           */
/* ------------------------------------------------------------------ */

function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="mx-3 mt-3 flex items-center justify-between rounded-full border border-espresso/10 bg-cream/70 px-4 py-2.5 shadow-[0_12px_44px_-18px_rgba(33,20,8,0.4)] backdrop-blur-xl md:mx-6 md:px-5">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            scrollTo("#top");
          }}
          className="flex items-center gap-2.5"
          data-cursor="Top"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-flame text-cream">
            <Egg className="h-4.5 w-4.5" strokeWidth={2.2} />
          </span>
          <span className="hidden text-sm font-extrabold uppercase tracking-[0.18em] min-[430px]:inline">
            Golden&nbsp;Yolk
          </span>
        </a>

        <nav className="hidden items-center gap-8 text-[13px] font-semibold uppercase tracking-[0.14em] lg:flex">
          {[
            ["The farm", "#farm"],
            ["Freshness", "#fresh"],
            ["Size finder", "#finder-wrap"],
            ["Prices", "#pricing"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              onClick={(e) => {
                e.preventDefault();
                scrollTo(href);
              }}
              className="hover-line text-espresso/70 hover:text-espresso"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <SoundToggle />
          <DeliveryPill />
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("open-ai"))}
            title="Ask Yolk AI (press A)"
            className="flex items-center gap-1.5 rounded-full border border-flame/40 bg-flame/10 px-3 py-2 text-[13px] font-bold text-flame transition-colors hover:bg-flame hover:text-cream sm:px-3.5"
            data-cursor="Chat"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden min-[430px]:inline">Ask AI</span>
          </button>
          <button
            type="button"
            onClick={() => scrollTo("#pricing")}
            className="group flex items-center gap-1.5 rounded-full bg-espresso px-3 py-2 text-xs font-semibold text-cream transition-colors hover:bg-flame sm:px-4 sm:text-[13px] md:px-5"
            data-cursor="Go"
          >
            Order<span className="hidden min-[430px]:inline">&nbsp;now</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-45" />
          </button>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                 */
/* ------------------------------------------------------------------ */

const HERO_CHIPS = [
  ["Small", "5,000"],
  ["Medium", "5,800"],
  ["Big", "6,000"],
];

function Hero({ ready }: { ready: boolean }) {
  return (
    <section id="top" className="relative h-[100svh] overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-[13vh] px-5 md:top-[16vh] md:px-12">
        <FadeUp play={ready}>
          <Eyebrow>Farm fresh · collected at 6 AM · tray of 30 · tap the egg</Eyebrow>
        </FadeUp>
      </div>

      <div className="grid h-full grid-cols-1 items-end px-5 pb-[6svh] md:grid-cols-[1.55fr_1fr] md:px-12 md:pb-[7svh]">
        <div>
          <h1 className="hero-h1 font-display text-[14.5vw] font-extrabold uppercase leading-[0.83] tracking-[-0.02em] min-[420px]:text-[15.5vw] md:text-[12vw]">
            <Reveal play={ready}>
              <span>Crack.</span>
            </Reveal>
            <Reveal play={ready} delay={0.09}>
              <span className="text-outline">Open.</span>
            </Reveal>
            <Reveal play={ready} delay={0.18}>
              <span className="font-serif2 lowercase italic font-normal tracking-normal text-flame">
                golden.
              </span>
            </Reveal>
          </h1>
        </div>

        <div className="mt-5 md:mt-0 md:justify-self-end md:pb-2">
          <FadeUp play={ready} delay={0.35}>
            <p className="max-w-[17rem] text-[13.5px] leading-snug text-espresso/75 md:max-w-xs md:text-[15px] md:leading-relaxed">
              Farm-fresh eggs collected at dawn and at your door before dark.
              Three sizes, one golden standard — and a yolk that stands up in
              the pan.
            </p>
          </FadeUp>

          <FadeUp play={ready} delay={0.45} className="mt-4 flex flex-wrap items-center gap-2.5 md:mt-6 md:gap-3">
            <button
              type="button"
              onClick={() => scrollTo("#pricing")}
              className="pointer-events-auto group flex items-center gap-2 rounded-full bg-espresso px-5 py-3 text-[13px] font-semibold text-cream transition-colors hover:bg-flame md:px-6 md:py-3.5 md:text-sm"
              data-cursor="Prices"
            >
              See the prices
              <ArrowDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
            </button>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("ai-flow", { detail: "cmd:planner" }))}
              className="pointer-events-auto flex items-center gap-2 rounded-full border border-espresso/25 px-5 py-3 text-[13px] font-semibold transition-colors hover:bg-espresso hover:text-cream md:px-6 md:py-3.5 md:text-sm"
              data-cursor="AI plan"
            >
              <Sparkles className="h-4 w-4 text-flame" />
              Plan my trays
            </button>
          </FadeUp>

          <FadeUp
            play={ready}
            delay={0.55}
            className="pointer-events-auto mt-4 inline-block cursor-pointer rounded-2xl border border-espresso/12 bg-white/45 backdrop-blur-md transition-transform duration-500 hover:-translate-y-1 md:mt-6"
          >
            <button
              type="button"
              onClick={() => scrollTo("#pricing")}
              className="block"
              data-cursor="Prices"
            >
              {/* mobile: 3-across compact strip */}
              <span className="flex md:hidden">
                {HERO_CHIPS.map(([size, price], i) => (
                  <span
                    key={size}
                    className={`flex-1 px-3.5 py-2.5 text-left ${
                      i < HERO_CHIPS.length - 1 ? "border-r border-espresso/10" : ""
                    }`}
                  >
                    <span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-espresso/55">
                      {size}
                    </span>
                    <span className="block text-[13px] font-extrabold [font-variant-numeric:tabular-nums]">
                      ₦{price}
                    </span>
                  </span>
                ))}
              </span>
              {/* desktop: stacked rows */}
              <span className="hidden md:block">
                {HERO_CHIPS.map(([size, price], i) => (
                  <span
                    key={size}
                    className={`flex w-56 items-center justify-between px-4 py-2.5 text-[13px] font-semibold ${
                      i < HERO_CHIPS.length - 1 ? "border-b border-espresso/10" : ""
                    }`}
                  >
                    <span className="uppercase tracking-[0.16em] text-espresso/60">{size}</span>
                    <span className="[font-variant-numeric:tabular-nums]">
                      ₦{price}
                      <span className="text-espresso/50"> /tray</span>
                    </span>
                  </span>
                ))}
              </span>
            </button>
          </FadeUp>
        </div>
      </div>

      <FadeUp
        play={ready}
        delay={0.7}
        className="absolute bottom-[9svh] left-1/2 hidden -translate-x-1/2 md:block"
      >
        <div className="flex flex-col items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-espresso/50">
            Scroll
          </span>
          <span className="h-10 w-px overflow-hidden bg-espresso/15">
            <span className="animate-scrollhint block h-full w-px bg-espresso" />
          </span>
        </div>
      </FadeUp>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Marquee strips                                                       */
/* ------------------------------------------------------------------ */

const STRIP_ITEMS = [
  "100% farm fresh",
  "Collected every dawn",
  "Tray of 30 eggs",
  "Small 5,000 · Medium 5,800 · Big 6,000",
  "Free delivery on 2+ trays",
  "Now with Yolk AI",
];

function StripContent() {
  return (
    <div className="flex shrink-0 items-center">
      {STRIP_ITEMS.map((item) => (
        <span key={item} className="flex items-center">
          <span className="whitespace-nowrap px-4 text-[11px] font-bold uppercase tracking-[0.22em] md:px-6 md:text-sm">
            {item}
          </span>
          <Egg className="h-4 w-4 shrink-0 opacity-70" />
        </span>
      ))}
    </div>
  );
}

function Marquee() {
  return (
    <div className="relative z-10 -my-3 overflow-hidden py-6">
      <div className="-rotate-[1.4deg] scale-[1.03] bg-flame py-4 text-cream shadow-[0_18px_50px_-20px_rgba(228,89,14,0.6)]">
        <div className="animate-marquee flex w-max">
          <StripContent />
          <StripContent />
        </div>
      </div>
      <div className="mt-2 rotate-[0.6deg] scale-[1.03] bg-espresso py-2.5 text-cream/70">
        <div className="animate-marquee-fast flex w-max [animation-direction:reverse]">
          <StripContent />
          <StripContent />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Farm section (with count-up stats)                                   */
/* ------------------------------------------------------------------ */

function Counter({ n, suffix = "" }: { n: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1500;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * n));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, n]);
  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}

const FARM_STATS = [
  { icon: Wheat, n: 100, suffix: "%", text: null, label: "Grain-fed hens", note: "No steroids, no shortcuts." },
  { icon: Sun, n: null, suffix: "", text: "06:00", label: "Collected daily", note: "Every dawn, by hand." },
  { icon: PackageCheck, n: 30, suffix: "", text: null, label: "Eggs per tray", note: "Checked, cleaned & crated." },
];

function Farm() {
  return (
    <section id="farm" className="relative md:h-[190svh]">
      <div className="flex items-center px-5 py-28 md:sticky md:top-0 md:h-screen md:px-12 md:py-0">
        <div className="grid w-full grid-cols-1 gap-10 md:grid-cols-2">
          <div className="max-w-xl rounded-3xl border border-espresso/10 bg-cream/55 p-6 backdrop-blur-md md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-0">
            <Reveal>
              <span>
                <Eyebrow>The farm</Eyebrow>
              </span>
            </Reveal>
            <h2 className="mt-5 font-display text-5xl font-extrabold uppercase leading-[0.9] tracking-tight md:text-7xl">
              <Reveal delay={0.08}>
                <span>Raised slow.</span>
              </Reveal>
              <Reveal delay={0.16}>
                <span className="font-serif2 lowercase italic font-normal text-flame">
                  Laid golden.
                </span>
              </Reveal>
            </h2>
            <FadeUp delay={0.28}>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-espresso/75">
                Our hens roam open pasture, snack on maize and greens, and
                answer to name — most of them, anyway. Happy birds lay better
                eggs. That is the whole secret.
              </p>
            </FadeUp>

            <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-4 md:mt-10">
              {FARM_STATS.map((s, i) => (
                <FadeUp key={s.label} delay={0.34 + i * 0.08}>
                  <div className="rounded-2xl border border-espresso/10 bg-white/40 p-2.5 backdrop-blur-sm sm:p-4">
                    <s.icon className="h-4 w-4 text-flame sm:h-4.5 sm:w-4.5" strokeWidth={2} />
                    <p className="mt-2 font-display text-lg font-extrabold tracking-tight [font-variant-numeric:tabular-nums] min-[420px]:text-2xl sm:mt-3 sm:text-3xl">
                      {s.n !== null ? <Counter n={s.n} suffix={s.suffix} /> : s.text}
                    </p>
                    <p className="mt-1 text-[8.5px] font-bold uppercase tracking-[0.14em] text-espresso/70 min-[420px]:text-[10px] sm:text-[11px]">
                      {s.label}
                    </p>
                    <p className="mt-1 hidden text-[12px] text-espresso/55 sm:block">{s.note}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
          {/* right column intentionally empty — the 3D egg lives here */}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Freshness / journey section                                          */
/* ------------------------------------------------------------------ */

function Freshness() {
  return (
    <section id="fresh" className="relative md:h-[190svh]">
      <div className="flex items-start justify-center px-5 pb-28 pt-16 md:sticky md:top-0 md:h-screen md:items-center md:px-12 md:pb-0 md:pt-0">
        <div className="mx-auto max-w-4xl rounded-3xl border border-espresso/10 bg-cream/50 p-5 text-center backdrop-blur-md min-[420px]:p-7 md:mt-[-18vh] md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-0">
          <Reveal>
            <span>
              <Eyebrow className="justify-center">Freshness, timed</Eyebrow>
            </span>
          </Reveal>
          <h2 className="mt-4 font-display font-extrabold uppercase leading-[0.85] tracking-tight">
            <Reveal delay={0.08}>
              <span className="block text-[22vw] md:text-[11rem]">Coop</span>
            </Reveal>
            <Reveal delay={0.16}>
              <span className="block text-[9vw] md:text-6xl">
                to kitchen in{" "}
                <span className="font-serif2 lowercase italic font-normal text-flame">
                  under a day
                </span>
              </span>
            </Reveal>
          </h2>
          <FadeUp delay={0.3}>
            <p className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-espresso/75">
              Eggs go from nest box to your doorstep in less than 24 hours.
              Anything older than 48 hours never gets sold — it goes to the
              bakery next door.
            </p>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Pricing                                                              */
/* ------------------------------------------------------------------ */

interface Tier {
  name: TierName;
  grams: string;
  price: string;
  blurb: string;
  popular?: boolean;
  features: string[];
}

const TIERS: Tier[] = [
  {
    name: "Small",
    grams: "45–52 g",
    price: "5,000",
    blurb: "Petite and mighty — the baker's favourite.",
    features: [
      "Tray of 30 small eggs",
      "Collected the same morning",
      "Free city delivery on 2+ trays",
    ],
  },
  {
    name: "Medium",
    grams: "52–62 g",
    price: "5,800",
    blurb: "The everyday hero of every breakfast table.",
    popular: true,
    features: [
      "Tray of 30 medium eggs",
      "Collected the same morning",
      "Free city delivery on 2+ trays",
      "Cracked egg? We replace it",
    ],
  },
  {
    name: "Big",
    grams: "62 g+",
    price: "6,000",
    blurb: "For the ones who like their mornings XL.",
    features: [
      "Tray of 30 big eggs",
      "Double-yolk chances included",
      "Free city delivery on 2+ trays",
      "Cracked egg? We replace it",
    ],
  },
];

function Pricing({ highlight }: { highlight: TierName | null }) {
  return (
    <section id="pricing" className="relative md:h-[300svh]">
      <div className="flex flex-col justify-between px-5 pb-10 pt-28 md:sticky md:top-0 md:h-screen md:px-12 md:pb-[5svh] md:pt-0">
        <div className="flex flex-wrap items-end justify-between gap-4 md:pt-[11svh]">
          <div>
            <Reveal>
              <span>
                <Eyebrow>The lineup</Eyebrow>
              </span>
            </Reveal>
            <h2 className="mt-4 font-display text-5xl font-extrabold uppercase leading-[0.88] tracking-tight md:text-7xl">
              <Reveal delay={0.08}>
                <span>Pick your</span>
              </Reveal>
              <Reveal delay={0.16}>
                <span className="font-serif2 lowercase italic font-normal text-flame">
                  size.
                </span>
              </Reveal>
            </h2>
          </div>
          <FadeUp delay={0.3} className="flex flex-col items-start gap-3 md:items-end">
            <p className="max-w-[220px] text-left text-[13px] leading-relaxed text-espresso/60 md:text-right">
              All trays hold 30 eggs. Prices in naira (₦), delivery included on 2+
              trays.
            </p>
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("ai-flow", { detail: "cmd:advise" }))
              }
              className="pointer-events-auto flex items-center gap-2 rounded-full border border-flame/40 bg-flame/10 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-flame transition-colors hover:bg-flame hover:text-cream"
              data-cursor="Decide"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Not sure? Yolk AI decides
            </button>
          </FadeUp>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:mt-[18svh] md:grid-cols-3 md:items-end">
          {TIERS.map((tier, i) => (
            <FadeUp
              key={tier.name}
              delay={0.15 + i * 0.12}
              className={tier.popular ? "md:-translate-y-7" : ""}
            >
              <div
                className={`pointer-events-auto relative overflow-hidden rounded-[1.8rem] border bg-cream/80 p-6 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 ${
                  tier.popular
                    ? "border-flame/50 shadow-[0_30px_80px_-30px_rgba(228,89,14,0.5)]"
                    : "border-espresso/12 shadow-[0_24px_70px_-36px_rgba(33,20,8,0.5)]"
                } ${
                  highlight === tier.name
                    ? "scale-[1.03] ring-2 ring-flame ring-offset-4 ring-offset-cream"
                    : ""
                }`}
              >
                {tier.popular && (
                  <span className="absolute right-5 top-5 rounded-full bg-flame px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-cream">
                    Most loved
                  </span>
                )}
                {highlight === tier.name && (
                  <motion.span
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`absolute ${tier.popular ? "right-5 top-12" : "right-5 top-5"} flex items-center gap-1.5 rounded-full bg-espresso px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-cream`}
                  >
                    <Sparkles className="h-3 w-3 text-yolk" />
                    AI pick
                  </motion.span>
                )}
                <p className="text-xs font-bold uppercase tracking-[0.26em] text-espresso/55">
                  {tier.name}
                </p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-flame">
                  {tier.grams} eggs
                </p>

                <div className="mt-5 flex items-end gap-2">
                  <span className="font-display text-6xl font-extrabold leading-none tracking-tight [font-variant-numeric:tabular-nums] md:text-[3.4rem] lg:text-[4.2rem]">
                    {tier.price}
                  </span>
                  <span className="pb-1.5 text-[12px] font-bold uppercase leading-tight tracking-[0.14em] text-espresso/55">
                    naira
                    <br />
                    /tray of 30
                  </span>
                </div>

                <p className="mt-4 text-[14px] leading-relaxed text-espresso/70">{tier.blurb}</p>

                <ul className="mt-5 space-y-2.5 border-t border-espresso/10 pt-5">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2.5 text-[13px] font-medium text-espresso/80"
                    >
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-espresso/8">
                        <Check className="h-3 w-3 text-flame" strokeWidth={3} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href={`https://wa.me/2348036501450?text=Hello%20Golden%20Yolk!%20I'd%20like%20to%20order%20a%20tray%20of%20${tier.name}%20eggs%20(%E2%82%A6%20${tier.price}).`}
                  target="_blank"
                  rel="noreferrer"
                  className={`group mt-6 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold transition-colors ${
                    tier.popular
                      ? "bg-flame text-cream hover:bg-espresso"
                      : "bg-espresso text-cream hover:bg-flame"
                  }`}
                  data-cursor="Order"
                >
                  Order {tier.name.toLowerCase()}
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" />
                </a>
                <p className="mt-3 text-center text-[10.5px] font-semibold uppercase tracking-[0.14em] text-espresso/45">
                  or pay by transfer — details on WhatsApp
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Payment card                                                         */
/* ------------------------------------------------------------------ */

function PaymentCard({ delay = 0 }: { delay?: number }) {
  return (
    <FadeUp delay={delay} className="pointer-events-auto mx-auto mt-7 w-full max-w-md">
      <div className="overflow-hidden rounded-3xl border border-espresso/12 bg-cream/75 shadow-[0_28px_80px_-36px_rgba(33,20,8,0.5)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-espresso/10 bg-white/50 px-5 py-3">
          <span className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-espresso/55">
            <Landmark className="h-3.5 w-3.5 text-flame" />
            Pay by transfer
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-espresso/40">
            any bank app
          </span>
        </div>

        <p className="px-5 py-4 text-[13px] leading-relaxed text-espresso/70">
          We share our account details privately on WhatsApp — nothing sensitive
          is published on this site. Tap below and we'll send them instantly,
          then drop your receipt in the same chat.
        </p>

        <a
          href={PAYMENT.waAccount}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 bg-espresso py-3.5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-cream transition-colors hover:bg-flame"
          data-cursor="Get details"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Get account details on WhatsApp
        </a>
      </div>
    </FadeUp>
  );
}

/* ------------------------------------------------------------------ */
/* Call to action                                                       */
/* ------------------------------------------------------------------ */

function Cta() {
  return (
    <section
      id="order"
      className="relative flex min-h-[110svh] items-center justify-center px-5 py-16 md:px-12"
    >
      <div className="pointer-events-none mt-[-4svh] text-center">
        <Reveal>
          <span>
            <Eyebrow className="justify-center">Last call, egg lovers</Eyebrow>
          </span>
        </Reveal>
        <h2 className="mt-4 font-display font-extrabold uppercase leading-[0.84] tracking-tight">
          <Reveal delay={0.08}>
            <span className="block text-[16vw] md:text-[10rem]">Hungry</span>
          </Reveal>
          <Reveal delay={0.16}>
            <span className="block font-serif2 text-[12.5vw] lowercase italic font-normal text-flame md:text-[8rem]">
              already?
            </span>
          </Reveal>
        </h2>
        <FadeUp delay={0.3}>
          <p className="mx-auto mt-6 max-w-sm text-[15px] leading-relaxed text-espresso/75">
            Call or WhatsApp before noon and your tray rides out on today's
            delivery run. Sunshine, scrambled.
          </p>
        </FadeUp>
        <FadeUp delay={0.4} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="tel:+2348036501450"
            className="pointer-events-auto group flex items-center gap-2.5 rounded-full bg-espresso px-7 py-4 text-sm font-bold text-cream transition-colors hover:bg-flame"
            data-cursor="Call"
          >
            <Phone className="h-4 w-4" />
            Call 0803 650 1450
          </a>
          <a
            href="https://wa.me/2348036501450?text=Hello%20Golden%20Yolk!%20I'd%20like%20to%20order%20some%20eggs."
            target="_blank"
            rel="noreferrer"
            className="pointer-events-auto group flex items-center gap-2.5 rounded-full border border-espresso/25 bg-white/40 px-7 py-4 text-sm font-bold backdrop-blur-md transition-colors hover:bg-espresso hover:text-cream"
            data-cursor="Chat"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp us
          </a>
        </FadeUp>
        <FadeUp
          delay={0.5}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2"
        >
          {[
            [Clock3, "Order by noon, delivered by dusk"],
            [Truck, "Free delivery on 2+ trays"],
            [Sparkles, "Ask Yolk AI anything"],
          ].map(([Icon, label]) => (
            <span
              key={label as string}
              className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-espresso/55"
            >
              {(() => {
                const I = Icon as typeof Clock3;
                return <I className="h-3.5 w-3.5 text-flame" />;
              })()}
              {label as string}
            </span>
          ))}
        </FadeUp>

        <PaymentCard delay={0.6} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                               */
/* ------------------------------------------------------------------ */

function Footer() {
  return (
    <footer className="relative z-10 border-t border-espresso/10 bg-cream/60 backdrop-blur-sm">
      <div className="overflow-hidden py-8">
        <div className="animate-marquee flex w-max">
          {[0, 1].map((n) => (
            <div key={n} className="flex shrink-0 items-center">
              {Array.from({ length: 4 }).map((_, i) => (
                <span
                  key={i}
                  className="text-outline whitespace-nowrap px-8 font-display text-[13vw] font-extrabold uppercase leading-none opacity-30 md:text-[7vw]"
                >
                  Golden Yolk
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-10 border-t border-espresso/10 px-5 py-12 md:grid-cols-4 md:px-12">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-flame text-cream">
              <Egg className="h-4.5 w-4.5" strokeWidth={2.2} />
            </span>
            <span className="text-sm font-extrabold uppercase tracking-[0.18em]">
              Golden Yolk
            </span>
          </div>
          <p className="mt-4 max-w-[240px] text-[13px] leading-relaxed text-espresso/60">
            One farm, a few hundred very happy hens, one suspiciously smart AI —
            and the freshest tray of eggs your kitchen has ever met.
          </p>
        </div>
        <div>
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-espresso/50">
            <MapPin className="h-3.5 w-3.5 text-flame" /> Visit
          </p>
          <p className="mt-3 text-[14px] leading-relaxed text-espresso/80">
            Golden Yolk Farm
            <br />
            Sunrise Valley, Kicukiro
            <br />
            Local pickup daily
          </p>
        </div>
        <div>
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-espresso/50">
            <Clock3 className="h-3.5 w-3.5 text-flame" /> Hours
          </p>
          <p className="mt-3 text-[14px] leading-relaxed text-espresso/80">
            Mon – Sat · 6 AM – 7 PM
            <br />
            Sunday · 7 AM – 1 PM
            <br />
            Delivery run · 2 PM
          </p>
        </div>
        <div>
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-espresso/50">
            <Phone className="h-3.5 w-3.5 text-flame" /> Contact
          </p>
          <p className="mt-3 text-[14px] leading-relaxed text-espresso/80">
            <a href="tel:+2348036501450" className="hover-line">
              +234 803 650 1450
            </a>
            <br />
            <a
              href="https://wa.me/2348036501450"
              target="_blank"
              rel="noreferrer"
              className="hover-line"
            >
              WhatsApp
            </a>
            <br />
            <span className="mt-2 block text-espresso/60">Payment transfers</span>
            <a
              href={PAYMENT.waAccount}
              target="_blank"
              rel="noreferrer"
              className="hover-line font-bold"
            >
              Bank transfer — details on WhatsApp
            </a>
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 border-t border-espresso/10 px-5 py-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-espresso/45 md:flex-row md:px-12">
        <span>© 2026 Golden Yolk Farm</span>
        <span className="flex items-center gap-2">
          <Egg className="h-3 w-3" />
          Cracked daily. Served fresh.
        </span>
        <span>Film · Pexels / Ricky Esquivel</span>
        <span>Small ₦5,000 · Medium ₦5,800 · Big ₦6,000</span>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* App                                                                  */
/* ------------------------------------------------------------------ */

export default function App() {
  /* returning visitors skip the intro */
  const [ready, setReady] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem("gy-seen") === "1";
    } catch {
      return false;
    }
  });
  const [highlight, setHighlight] = useState<TierName | null>(null);
  const highlightTimer = useRef<number>(0);

  const { scrollYProgress } = useScroll();
  const velTrack = useRef({ p: 0, t: 0 });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const now = performance.now();
    const s = velTrack.current;
    if (s.t > 0) {
      const inst = (v - s.p) / Math.max(0.001, (now - s.t) / 1000);
      const clamped = Math.max(-2.5, Math.min(2.5, inst));
      scrollState.velocity = scrollState.velocity * 0.86 + clamped * 0.14;
    }
    s.p = v;
    s.t = now;
    scrollState.progress = v;
  });

  /* press A to summon Yolk AI */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key.toLowerCase() === "a" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        window.dispatchEvent(new Event("open-ai"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* Lenis smooth scroll */
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09 });
    setLenis(lenis);
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  /* lock scroll during preload */
  useEffect(() => {
    document.documentElement.style.overflow = ready ? "" : "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [ready]);

  /* AI-driven tier highlighting */
  useEffect(() => {
    const onHighlight = (e: Event) => {
      const tier = (e as CustomEvent<TierName>).detail;
      setHighlight(tier);
      scrollTo("#pricing");
      window.clearTimeout(highlightTimer.current);
      highlightTimer.current = window.setTimeout(() => setHighlight(null), 4000);
    };
    window.addEventListener("highlight-tier", onHighlight);
    return () => window.removeEventListener("highlight-tier", onHighlight);
  }, []);

  return (
    <div className="relative min-h-screen text-espresso">
      {/* fixed 3D canvas */}
      <div className="fixed inset-0 z-0">
        <EggScene />
      </div>

      {/* film grain */}
      <div className="grain pointer-events-none fixed inset-0 z-[60] opacity-[0.05] mix-blend-multiply" />

      <Cursor />
      <CrackMeter />
      <Nav />

      <main className="pointer-events-none relative z-10">
        <Hero ready={ready} />
        <ScrollyVideo />
        <Marquee />
        <Farm />
        <Freshness />
        <Testimonials />
        <div id="finder-wrap">
          <SizeFinder />
        </div>
        <Pricing highlight={highlight} />
        <Cta />
        <Footer />
      </main>

      <AiConcierge />

      <AnimatePresence>
        {!ready && (
          <Preloader
            onDone={() => {
              try {
                sessionStorage.setItem("gy-seen", "1");
              } catch {
                /* private mode */
              }
              setReady(true);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
