import { motion } from "framer-motion";
import { Star } from "lucide-react";

const QUOTES = [
  { q: "The yolks stand up in the pan like little suns. My pancakes have never had it this good.", name: "Aline U.", role: "Weekend baker" },
  { q: "Ordered at 9 AM, omelette by 6 PM. This is the fastest farm on Earth, I'm convinced.", name: "Jean-Paul K.", role: "Father of four" },
  { q: "Our restaurant switched the whole breakfast menu to Golden Yolk. Guests noticed in a week.", name: "Chef Grace M.", role: "Bistro owner" },
  { q: "The Big size is no joke — one egg is basically a meal. Worth every franc.", name: "Theo N.", role: "Gym enthusiast" },
  { q: "Yolk AI planned our family's weekly trays and it was scarily accurate. Two trays, zero waste.", name: "Diane I.", role: "Meal prepper" },
  { q: "I asked for a fancy brunch recipe and got a 63° egg that made my mother-in-law applaud.", name: "Samuel R.", role: "Brunch scientists" },
  { q: "Fresh enough that my grandmother asked which neighbour's chicken I'd stolen. High praise.", name: "Keza A.", role: "Sunday cook" },
  { q: "Cracked eggs replaced without discussion, delivery guy knows my gate code now. Loyal for life.", name: "Patrick H.", role: "Café regular" },
];

function QuoteCard({ q, name, role }: { q: string; name: string; role: string }) {
  return (
    <div className="mx-2.5 w-[min(290px,84vw)] shrink-0 rounded-3xl border border-espresso/10 bg-white/55 p-5 backdrop-blur-md md:w-[330px]">
      <div className="flex gap-1 text-flame">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-flame" strokeWidth={0} />
        ))}
      </div>
      <p className="mt-3 text-[14px] leading-relaxed text-espresso/85">“{q}”</p>
      <p className="mt-4 text-[12px] font-extrabold uppercase tracking-[0.14em]">{name}</p>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso/45">{role}</p>
    </div>
  );
}

export default function Testimonials() {
  const rowA = QUOTES.slice(0, 4);
  const rowB = QUOTES.slice(4);
  return (
    <section className="relative z-10 overflow-hidden py-16 md:py-32">
      <div className="px-5 text-center md:px-12">
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-espresso/70"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-flame" />
          Word from the breakfast tables
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 font-display text-4xl font-extrabold uppercase leading-[0.92] tracking-tight md:text-6xl"
        >
          800+ tables.
          <br />
          <span className="font-serif2 lowercase italic font-normal text-flame">one verdict.</span>
        </motion.h2>
      </div>

      <div className="group pointer-events-auto mt-14 space-y-5" data-lenis-prevent>
        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
          {[0, 1].map((n) => (
            <div key={n} className="flex">
              {rowA.map((q) => (
                <QuoteCard key={q.name} {...q} />
              ))}
            </div>
          ))}
        </div>
        <div className="flex w-max animate-marquee [animation-direction:reverse] group-hover:[animation-play-state:paused]">
          {[0, 1].map((n) => (
            <div key={n} className="flex">
              {rowB.map((q) => (
                <QuoteCard key={q.name} {...q} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
