import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  ChefHat,
  Clock3,
  Egg,
  Minus,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import {
  adviseSize,
  computePlan,
  fmt,
  generateRecipe,
  respond,
  HOME_CHIPS,
  TIERS,
  type BotCard,
  type BotReply,
  type Chip,
  type TierName,
} from "../lib/ai";
import { bumpVisit, saveMemory } from "../lib/memory";
import { countdownLine, greetingByHour } from "../lib/time";

interface Msg {
  id: number;
  from: "user" | "bot";
  text: string;
  card?: BotCard;
  chips?: Chip[];
  done: boolean;
  thinking?: boolean;
}

type Flow = null | "pl-people" | "pl-eggs" | "pl-days";

let idCounter = 1;
const nextId = () => idCounter++;

/* ------------------------------------------------------------------ */
/* Rich cards                                                            */
/* ------------------------------------------------------------------ */

function TiersCard() {
  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-espresso/12 bg-white/60">
      {(Object.keys(TIERS) as TierName[]).map((t, i) => (
        <div
          key={t}
          className={`flex items-center justify-between gap-2 px-3.5 py-2.5 ${
            i < 2 ? "border-b border-espresso/8" : ""
          }`}
        >
          <div>
            <p className="text-[13px] font-extrabold uppercase tracking-[0.14em]">{t}</p>
            <p className="text-[11px] text-espresso/55">{TIERS[t].grams} · tray of 30</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-extrabold [font-variant-numeric:tabular-nums]">
              {fmt(TIERS[t].price)}
            </span>
            <a
              href={`https://wa.me/2348036501450?text=Hello%20Golden%20Yolk!%20I'd%20like%20a%20tray%20of%20${t}%20eggs%20(%E2%82%A6%20${fmt(TIERS[t].price)}).`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-espresso px-3 py-1.5 text-[11px] font-bold text-cream transition-colors hover:bg-flame"
            >
              Order
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

function PlannerCard({ card }: { card: Extract<BotCard, { kind: "planner" }> }) {
  const rows: [string, string][] = [
    ["Mouths to feed", `${card.people}`],
    ["Timeframe", `${card.days} days`],
    ["Eggs needed", `${fmt(card.eggs)}`],
    ["Trays of 30", `${card.trays}× ${card.size}`],
  ];
  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-espresso/12 bg-white/60">
      <div className="flex items-center gap-2 border-b border-espresso/8 bg-yolk/15 px-3.5 py-2">
        <ChefHat className="h-3.5 w-3.5 text-flame" />
        <span className="text-[11px] font-extrabold uppercase tracking-[0.18em]">Yolk AI plan</span>
      </div>
      <div className="px-3.5 py-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between py-1 text-[12px]">
            <span className="text-espresso/55">{k}</span>
            <span className="font-bold [font-variant-numeric:tabular-nums]">{v}</span>
          </div>
        ))}
        <div className="mt-1.5 flex items-end justify-between border-t border-espresso/10 pt-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-espresso/60">
            Total
          </span>
          <span className="font-display text-2xl font-extrabold [font-variant-numeric:tabular-nums]">
            ₦{fmt(card.cost)}
          </span>
        </div>
      </div>
      <p className="border-t border-espresso/8 bg-cream/60 px-3.5 py-2.5 text-[11px] leading-relaxed text-espresso/65">
        {card.note}
      </p>
    </div>
  );
}

function RecipeCard({ card }: { card: Extract<BotCard, { kind: "recipe" }> }) {
  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-espresso/12 bg-white/60">
      <div className="border-b border-espresso/8 bg-espresso px-3.5 py-2.5 text-cream">
        <p className="text-[14px] font-extrabold">{card.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-cream/70">
          <span className="flex items-center gap-1">
            <Clock3 className="h-3 w-3" /> {card.time}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> Serves {card.serves}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-flame px-2 py-0.5 text-cream">
            <Egg className="h-3 w-3" /> {card.size} eggs
          </span>
        </div>
      </div>
      <div className="px-3.5 py-2.5">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-espresso/50">
          Ingredients
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-espresso/75">
          {card.ingredients.join(" · ")}
        </p>
        <p className="mt-2.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-espresso/50">
          Method
        </p>
        <ol className="mt-1 space-y-1.5">
          {card.steps.map((s, i) => (
            <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-espresso/80">
              <span className="font-extrabold text-flame [font-variant-numeric:tabular-nums]">
                {i + 1}.
              </span>
              {s}
            </li>
          ))}
        </ol>
      </div>
      <p className="border-t border-espresso/8 bg-yolk/15 px-3.5 py-2.5 text-[11px] italic leading-relaxed text-espresso/70">
        Chef's tip — {card.tip}
      </p>
    </div>
  );
}

function CardRenderer({ card }: { card: BotCard }) {
  if (card.kind === "tiers") return <TiersCard />;
  if (card.kind === "planner") return <PlannerCard card={card} />;
  return <RecipeCard card={card} />;
}

/* ------------------------------------------------------------------ */
/* Concierge                                                             */
/* ------------------------------------------------------------------ */

export default function AiConcierge() {
  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [flow, setFlow] = useState<Flow>(null);
  const flowData = useRef<{ people: number; eggsEach: number }>({ people: 4, eggsEach: 1.5 });
  const [input, setInput] = useState("");
  const timers = useRef<number[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const booted = useRef(false);

  const later = useCallback((fn: () => void, ms: number) => {
    const t = window.setTimeout(fn, ms);
    timers.current.push(t);
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const scrollDown = useCallback(() => {
    later(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, 30);
  }, [later]);

  const streamBot = useCallback(
    (reply: BotReply, delay = 650) => {
      const id = nextId();
      setMsgs((m) => [...m, { id, from: "bot", text: "", done: false, thinking: true }]);
      scrollDown();
      later(() => {
        setMsgs((m) => m.map((x) => (x.id === id ? { ...x, thinking: false } : x)));
        let i = 0;
        const step = () => {
          i = Math.min(reply.text.length, i + 2 + Math.floor(Math.random() * 3));
          const t = reply.text.slice(0, i);
          setMsgs((m) =>
            m.map((x) =>
              x.id === id
                ? { ...x, text: t, done: i >= reply.text.length, card: i >= reply.text.length ? reply.card : undefined, chips: i >= reply.text.length ? reply.chips : undefined }
                : x,
            ),
          );
          scrollDown();
          if (i < reply.text.length) later(step, 13 + Math.random() * 22);
        };
        step();
      }, delay);
    },
    [later, scrollDown],
  );

  const boot = useCallback(() => {
    if (booted.current) return;
    booted.current = true;
    const mem = bumpVisit();
    const chips: Chip[] = [...HOME_CHIPS];
    let text: string;

    if ((mem.visits ?? 1) > 1) {
      const bits: string[] = [];
      if (mem.lastTier) bits.push(`team ${mem.lastTier}`);
      if (mem.plan) bits.push(`${mem.plan.people} mouths`);
      text = `Welcome back${bits.length ? ` — still ${bits.join(", ")}?` : "!"} ${countdownLine()}`;
      if (mem.plan) {
        chips.unshift({ label: "Recalculate my trays", payload: "cmd:planner" });
      }
      if (mem.lastTier) {
        chips.unshift({ label: `Reorder ${mem.lastTier}`, payload: `cmd:order:${mem.lastTier}` });
      }
    } else {
      text = `${greetingByHour()} I'm Yolk AI — farm-trained, egg-obsessed. I can plan your trays, pick your size, or dream up a recipe. ${countdownLine()} What are we cracking today?`;
    }
    streamBot({ text, chips }, 400);
  }, [streamBot]);

  const openPanel = useCallback(() => {
    setOpen(true);
    setNudge(false);
    boot();
  }, [boot]);

  /* external triggers: nav button, quiz, pricing banner */
  useEffect(() => {
    const onOpen = () => openPanel();
    const onFlow = (e: Event) => {
      openPanel();
      const detail = (e as CustomEvent<string>).detail;
      later(() => handlePayload(detail ?? "cmd:home"), 700);
    };
    window.addEventListener("open-ai", onOpen);
    window.addEventListener("ai-flow", onFlow);
    return () => {
      window.removeEventListener("open-ai", onOpen);
      window.removeEventListener("ai-flow", onFlow);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPanel]);

  /* gentle nudge bubble */
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!booted.current) setNudge(true);
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  /* Escape closes the panel */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handlePayload = useCallback(
    (payload: string) => {
      if (payload.startsWith("cmd:order:")) {
        const tier = payload.split(":")[2] as TierName;
        saveMemory({ lastTier: tier });
        window.dispatchEvent(new CustomEvent("highlight-tier", { detail: tier }));
        streamBot({
          text: `${tier} tier locked in — ₦${fmt(TIERS[tier].price)} for 30 beautiful ${tier.toLowerCase()} eggs. Opening WhatsApp to confirm your delivery. Paying ahead? Ask for our account details right there and drop the receipt in the same chat.`,
        });
        later(() => {
          window.open(
            `https://wa.me/2348036501450?text=Hello%20Golden%20Yolk!%20Yolk%20AI%20helped%20me%20choose%20${tier}%20eggs%20(%E2%82%A6%20${fmt(TIERS[tier].price)}).`,
            "_blank",
          );
        }, 2400);
        return;
      }
      if (payload === "cmd:whatsapp-receipt") {
        streamBot({
          text: "Opening WhatsApp — attach your transfer receipt there and the farm confirms your tray instantly.",
        });
        later(
          () =>
            window.open(
              "https://wa.me/2348036501450?text=Hello%20Golden%20Yolk!%20Payment%20sent%20for%20my%20order%20—%20receipt%20attached.",
              "_blank",
            ),
          1600,
        );
        return;
      }
      if (payload === "cmd:whatsapp-account") {
        streamBot({
          text: "Opening WhatsApp — we share account details privately there (kept off the site for security). Reply and we'll send them instantly.",
        });
        later(
          () =>
            window.open(
              "https://wa.me/2348036501450?text=Hello%20Golden%20Yolk!%20I'd%20like%20to%20pay%20by%20transfer%20—%20please%20share%20your%20account%20details.",
              "_blank",
            ),
          1600,
        );
        return;
      }
      if (payload.startsWith("cmd:mood:")) {
        streamBot(generateRecipe(payload.split(":")[2]));
        return;
      }
      if (payload.startsWith("cmd:use:")) {
        streamBot(adviseSize(payload.split(":")[2] as "breakfast" | "baking" | "crowd"));
        return;
      }
      if (payload === "cmd:tiers") {
        streamBot({
          text: "The full lineup, priced per tray of 30 — tap order and I'll open WhatsApp for you:",
          card: { kind: "tiers" },
          chips: [
            { label: "Which size for me?", payload: "cmd:advise" },
            { label: "Plan my trays", payload: "cmd:planner" },
          ],
        });
        return;
      }
      if (payload === "cmd:recipe") {
        streamBot(respond("recipe ideas please"));
        return;
      }
      if (payload === "cmd:advise") {
        streamBot(respond("which size should I get"));
        return;
      }
      if (payload === "cmd:planner") {
        setFlow("pl-people");
        streamBot({
          text: "Tray Planner engaged. Simple math, honest eggs. Question 1 of 3 — how many mouths are we feeding each day? Type a number.",
        });
        return;
      }
      if (payload === "cmd:whatsapp") {
        streamBot({ text: "Opening WhatsApp — the farm team replies faster than a hen drops an egg. Almost." });
        later(
          () => window.open("https://wa.me/2348036501450?text=Hello%20Golden%20Yolk!%20I'd%20like%20a%20bulk%2Fbusiness%20quote.", "_blank"),
          1600,
        );
        return;
      }
      streamBot(respond(payload === "cmd:home" ? "hello" : payload));
    },
    [later, streamBot],
  );

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      setMsgs((m) => [...m, { id: nextId(), from: "user", text, done: true }]);
      setInput("");
      scrollDown();

      if (text.startsWith("cmd:")) {
        handlePayload(text);
        return;
      }

      /* guided planner flow */
      const num = parseInt(text.replace(/[^\d]/g, ""), 10);
      if (flow === "pl-people") {
        if (!Number.isFinite(num) || num <= 0 || num > 200) {
          streamBot({ text: "I need a real head-count — try something like 2, 4, or 12." });
          return;
        }
        flowData.current.people = num;
        setFlow("pl-eggs");
        streamBot({
          text: `${num} ${num === 1 ? "person" : "people"} — noted. Question 2 of 3: how many eggs does each person eat per day, on average? (0.5 for "sometimes", 2 for "gym mode")`,
        });
        return;
      }
      if (flow === "pl-eggs") {
        const each = parseFloat(text.replace(",", "."));
        if (!Number.isFinite(each) || each <= 0 || each > 12) {
          streamBot({ text: "Give me an eggs-per-day number — most humans land between 1 and 3." });
          return;
        }
        flowData.current.eggsEach = each;
        setFlow("pl-days");
        streamBot({ text: "Last one — how many days should this supply cover? A week is most popular: 7." });
        return;
      }
      if (flow === "pl-days") {
        if (!Number.isFinite(num) || num <= 0 || num > 90) {
          streamBot({ text: "Days, please — between 1 and 90." });
          return;
        }
        setFlow(null);
        saveMemory({
          plan: { people: flowData.current.people, eggsEach: flowData.current.eggsEach, days: num },
        });
        const plan = computePlan(flowData.current.people, flowData.current.eggsEach, num);
        streamBot({
          text: "Computed. Here's your Golden Yolk supply plan:",
          card: { kind: "planner", ...plan },
          chips: [
            { label: `Order ${plan.size} — ${fmt(TIERS[plan.size].price)}`, payload: `cmd:order:${plan.size}` },
            { label: "Start over", payload: "cmd:planner" },
            { label: "Recipe ideas", payload: "cmd:recipe" },
          ],
        });
        return;
      }

      streamBot(respond(text));
    },
    [flow, handlePayload, scrollDown, streamBot],
  );

  return (
    <>
      {/* floating orb */}
      <motion.button
        type="button"
        aria-label="Open Yolk AI"
        onClick={() => (open ? setOpen(false) : openPanel())}
        className="fixed bottom-4 right-4 z-[70] grid h-15 w-15 place-items-center rounded-full border border-espresso/20 shadow-[0_18px_50px_-12px_rgba(245,164,11,0.65)] md:bottom-7 md:right-7"
        style={{
          height: 60,
          width: 60,
          background: "radial-gradient(circle at 32% 30%, #FFD781 0%, #F5A40B 55%, #E4590E 100%)",
        }}
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 2.6, type: "spring", stiffness: 200, damping: 14 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        data-cursor="Ask AI"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-yolk/40 [animation-duration:2.4s]" />
        {open ? (
          <Minus className="relative h-5 w-5 text-espresso" strokeWidth={2.6} />
        ) : (
          <Sparkles className="relative h-5.5 w-5.5 text-espresso" strokeWidth={2.2} />
        )}
        <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-espresso text-[9px] font-extrabold text-cream">
          AI
        </span>
      </motion.button>

      {/* nudge bubble */}
      <AnimatePresence>
        {nudge && !open && (
          <motion.button
            type="button"
            onClick={openPanel}
            className="fixed bottom-24 right-6 z-[70] max-w-[210px] rounded-2xl rounded-br-sm border border-espresso/12 bg-cream px-4 py-3 text-left shadow-[0_18px_50px_-20px_rgba(33,20,8,0.5)] md:right-8"
            initial={{ opacity: 0, y: 14, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.92 }}
            data-cursor="Hi!"
          >
            <p className="text-[13px] font-bold leading-snug">
              Psst — Yolk AI can plan your trays & write you a recipe.
            </p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-flame">
              Tap to chat
            </p>
          </motion.button>
        )}
      </AnimatePresence>

      {/* panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed bottom-[5.25rem] right-3 z-[70] flex h-[min(600px,72svh)] w-[calc(100vw-1.5rem)] max-w-[400px] flex-col overflow-hidden rounded-[1.6rem] border border-espresso/12 bg-cream/90 shadow-[0_40px_120px_-30px_rgba(33,20,8,0.55)] backdrop-blur-2xl md:bottom-28 md:right-7"
            initial={{ opacity: 0, y: 40, scale: 0.92, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-espresso/10 bg-white/45 px-4 py-3">
              <div className="flex items-center gap-3">
                <span
                  className="grid h-9 w-9 place-items-center rounded-full border border-espresso/15"
                  style={{ background: "radial-gradient(circle at 32% 30%, #FFD781, #F5A40B 60%, #E4590E)" }}
                >
                  <Sparkles className="h-4 w-4 text-espresso" />
                </span>
                <div>
                  <p className="text-[14px] font-extrabold leading-none">Yolk AI</p>
                  <p className="mt-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-espresso/55">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-600" />
                    Farm-trained · online
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full border border-espresso/12 text-espresso/60 transition-colors hover:bg-espresso hover:text-cream"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* messages */}
            <div ref={scrollRef} data-lenis-prevent className="concierge-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {msgs.map((m) => (
                <div key={m.id} className={m.from === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={`max-w-[86%] ${
                      m.from === "user"
                        ? "rounded-2xl rounded-br-sm bg-espresso px-4 py-2.5 text-cream"
                        : "rounded-2xl rounded-bl-sm border border-espresso/10 bg-white/70 px-4 py-2.5"
                    }`}
                  >
                    {m.thinking ? (
                      <span className="flex items-center gap-1 py-1">
                        {[0, 1, 2].map((d) => (
                          <span
                            key={d}
                            className="h-1.5 w-1.5 animate-bounce rounded-full bg-espresso/50"
                            style={{ animationDelay: `${d * 0.15}s` }}
                          />
                        ))}
                      </span>
                    ) : (
                      <>
                        <p className="text-[13px] leading-relaxed">{m.text}</p>
                        {m.card && <CardRenderer card={m.card} />}
                      </>
                    )}
                  </div>
                </div>
              ))}

              {/* chips of last bot message */}
              {msgs.length > 0 &&
                (() => {
                  const last = [...msgs].reverse().find((m) => m.from === "bot");
                  if (!last || !last.done || !last.chips?.length) return null;
                  return (
                    <div className="flex flex-wrap gap-2 pl-1">
                      {last.chips.map((c) => (
                        <button
                          key={c.label}
                          type="button"
                          onClick={() => send(c.payload)}
                          className="rounded-full border border-espresso/20 bg-cream px-3.5 py-1.5 text-[12px] font-bold transition-all hover:border-flame hover:bg-flame hover:text-cream"
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  );
                })()}
            </div>

            {/* input */}
            <div className="border-t border-espresso/10 bg-white/45 p-3">
              <div className="flex items-center gap-2 rounded-full border border-espresso/15 bg-cream px-2 py-1.5 pl-4">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send(input)}
                  placeholder={flow ? "Type a number…" : "Ask about eggs, trays, recipes…"}
                  className="flex-1 bg-transparent text-[13px] font-medium outline-none placeholder:text-espresso/40"
                />
                <button
                  type="button"
                  onClick={() => send(input)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-espresso text-cream transition-colors hover:bg-flame"
                  aria-label="Send"
                >
                  <ArrowUp className="h-4 w-4" strokeWidth={2.6} />
                </button>
              </div>
              <p className="mt-1.5 text-center text-[9.5px] font-bold uppercase tracking-[0.2em] text-espresso/35">
                Yolk AI · raised free-range on this farm
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
