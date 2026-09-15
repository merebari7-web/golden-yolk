/* ------------------------------------------------------------------ */
/*  Yolk AI — a fully client-side concierge brain.                     */
/*  Intent parsing, tray planning, recipe generation, size advice.     */
/* ------------------------------------------------------------------ */

export type TierName = "Small" | "Medium" | "Big";

export const TIERS: Record<
  TierName,
  { price: number; grams: string; vibe: string }
> = {
  Small: { price: 5000, grams: "45–52 g", vibe: "baking, sauces & kids' lunch boxes" },
  Medium: { price: 5800, grams: "52–62 g", vibe: "everyday breakfasts & family cooking" },
  Big: { price: 6000, grams: "62 g+", vibe: "serious omelettes & hungry humans" },
};

export const fmt = (n: number) => n.toLocaleString("en-US");

/* ------------------------------ types ------------------------------ */

export type BotCard =
  | { kind: "tiers" }
  | {
      kind: "planner";
      people: number;
      days: number;
      eggs: number;
      trays: number;
      size: TierName;
      cost: number;
      perEgg: number;
      note: string;
    }
  | {
      kind: "recipe";
      name: string;
      time: string;
      serves: number;
      size: TierName;
      ingredients: string[];
      steps: string[];
      tip: string;
    };

export interface Chip {
  label: string;
  payload: string;
}

export interface BotReply {
  text: string;
  chips?: Chip[];
  card?: BotCard;
}

/* --------------------------- egg science --------------------------- */

export const perEggCost = (t: TierName) => Math.round(TIERS[t].price / 30);

export function computePlan(people: number, eggsEach: number, days: number) {
  const eggs = Math.ceil(people * eggsEach * days);
  const trays = Math.max(1, Math.ceil(eggs / 30));

  let size: TierName = "Medium";
  if (people >= 6 || eggsEach >= 2.5) size = "Big";
  else if (trays <= 1 && people <= 2 && eggsEach <= 1.5) size = "Small";

  const cost = trays * TIERS[size].price;
  const perEgg = perEggCost(size);

  const alt = (Object.keys(TIERS) as TierName[]).find((k) => k !== size)!;
  const savings = Math.abs(TIERS[size].price - TIERS[alt].price) * trays;
  const note =
    size === "Big"
      ? `That's ₦${fmt(perEgg)} per egg — maximum yolk for the money. Choosing Big over Small here adds only ₦${fmt(savings)} for noticeably bigger breakfasts.`
      : size === "Small"
        ? `That's ₦${fmt(perEgg)} per egg — the most economical tray on the farm. Going Medium would only add ₦${fmt(savings)} total if appetites grow.`
        : `That's ₦${fmt(perEgg)} per egg — the sweet spot between Small (${perEggCost("Small")}) and Big (${perEggCost("Big")}). You'd save ₦${fmt(trays * (TIERS.Medium.price - TIERS.Small.price))} vs Big at this volume.`;

  return { people, days, eggs, trays, size, cost, perEgg, note };
}

export function adviseSize(usecase: "breakfast" | "baking" | "crowd"): BotReply {
  if (usecase === "baking")
    return {
      text: `For baking I prescribe Small (45–52 g) — ₦${fmt(TIERS.Small.price)} a tray. Bakers love them: more eggs per franc, and the yolk-to-white ratio makes custards and cakes richer. Two smalls beat one big in a batter, every time.`,
      card: { kind: "tiers" },
      chips: [
        { label: "Order Small — 5,000", payload: "cmd:order:Small" },
        { label: "Bake me a recipe", payload: "cmd:mood:sweet" },
      ],
    };
  if (usecase === "crowd")
    return {
      text: `Feeding a crowd? Go Big (62 g+) — ₦${fmt(TIERS.Big.price)} a tray. You get roughly 20% more egg than a Medium for only ₦${fmt(TIERS.Big.price - TIERS.Medium.price)} more per tray. That's the cheapest yolk-per-franc on the farm.`,
      card: { kind: "tiers" },
      chips: [
        { label: "Order Big — 6,000", payload: "cmd:order:Big" },
        { label: "Plan exact trays", payload: "cmd:planner" },
      ],
    };
  return {
    text: `Everyday breakfast duty? Medium (52–62 g) at ₦${fmt(TIERS.Medium.price)} is the farm favourite — big enough to feel generous, gentle on the wallet. It's what 7 out of 10 of our regulars reorder weekly.`,
    card: { kind: "tiers" },
    chips: [
      { label: "Order Medium — 5,800", payload: "cmd:order:Medium" },
      { label: "Plan my weekly trays", payload: "cmd:planner" },
    ],
  };
}

/* ---------------------------- recipes ------------------------------ */

type Mood = "quick" | "classic" | "fancy" | "sweet";

interface RecipeSeed {
  name: string;
  time: string;
  serves: number;
  size: TierName;
  ingredients: string[];
  steps: string[];
  tips: string[];
}

const RECIPES: Record<Mood, RecipeSeed[]> = {
  quick: [
    {
      name: "Golden Cloud Scramble",
      time: "8 min",
      serves: 2,
      size: "Medium",
      ingredients: ["3 Golden Yolk eggs", "1 tbsp butter", "2 tbsp milk", "Chives", "Flaky salt"],
      steps: [
        "Whisk eggs with milk until fully golden — no streaks.",
        "Low heat, butter in, eggs in. Wait 20 seconds.",
        "Push gently from edge to centre in slow folds.",
        "Off the heat while glossy — carryover finishes the job.",
        "Chives and flaky salt on top. Toast mandatory.",
      ],
      tips: ["Low and slow beats hot and fast.", "A knob of cold butter at the end = silk."],
    },
    {
      name: "Six-Minute Jammy Eggs",
      time: "10 min",
      serves: 2,
      size: "Big",
      ingredients: ["2 Big eggs", "Boiling water", "Ice bath", "Soy sauce + sesame drizzle"],
      steps: [
        "Lower fridge-cold eggs into boiling water gently.",
        "Exactly 6 minutes 30 seconds. Set a timer, trust it.",
        "Straight into ice water for 2 minutes.",
        "Peel under a thin stream of water.",
        "Halve, drizzle soy + sesame, watch the yolk glisten.",
      ],
      tips: ["Day-old eggs peel far easier than fresh-laid.", "Tap the wide end first."],
    },
  ],
  classic: [
    {
      name: "Farmhouse Omelette Supreme",
      time: "12 min",
      serves: 1,
      size: "Big",
      ingredients: ["3 Big eggs", "Handful of spinach", "Goat cheese", "Cherry tomatoes", "Butter", "Black pepper"],
      steps: [
        "Beat eggs with a pinch of salt until uniform.",
        "Medium-hot pan, butter foaming — eggs in.",
        "Tilt and lift edges so raw egg flows underneath.",
        "When barely set, add fillings to one half.",
        "Fold, slide, serve immediately — the centre should blush.",
      ],
      tips: ["Never brown a good omelette.", "Warm your plate first."],
    },
    {
      name: "Sunday Shakshuka",
      time: "25 min",
      serves: 3,
      size: "Medium",
      ingredients: ["4 Medium eggs", "2 tins crushed tomatoes", "1 red onion", "1 bell pepper", "Cumin + paprika", "Coriander", "Feta"],
      steps: [
        "Soften onion and pepper in olive oil, 8 minutes.",
        "Spices in, 30 seconds until the kitchen smells like a holiday.",
        "Tomatoes in, simmer 10 minutes until thick.",
        "Make wells, crack an egg into each.",
        "Lid on, 5 minutes — whites set, yolks still molten.",
        "Feta and coriander over everything. Bread for scooping.",
      ],
      tips: ["Runny yolk is the whole point.", "A pinch of sugar rescues acidic tomatoes."],
    },
  ],
  fancy: [
    {
      name: "63° Golden Yolk Royale",
      time: "60 min",
      serves: 2,
      size: "Big",
      ingredients: ["2 Big eggs", "Truffle oil", "Parmesan shavings", "Brioche soldiers", "Chive flowers"],
      steps: [
        "Water bath at exactly 63°C — eggs in, shell and all.",
        "Hold 60 minutes. This is patience, plated.",
        "Crack each into a warm bowl — the white barely holds.",
        "Truffle oil, parmesan, chive flowers.",
        "Brioche soldiers toasted in butter for dipping.",
      ],
      tips: ["No sous-vide? Keep water at the barest shimmer.", "The 63° yolk has the texture of warm custard."],
    },
    {
      name: "Brown-Butter Tamagoyaki",
      time: "18 min",
      serves: 2,
      size: "Medium",
      ingredients: ["4 Medium eggs", "1 tsp brown butter", "1 tsp sugar", "1 tsp soy", "1 tbsp dashi or water"],
      steps: [
        "Whisk everything until completely smooth. Strain it.",
        "Lightly oiled square pan, lowest heat.",
        "Pour a thin layer; roll it up when just set.",
        "Repeat in layers, rolling onto the log each time, 4–5 times.",
        "Rest 2 minutes, slice into pillows. Admire the layers.",
      ],
      tips: ["Low heat or zero mercy.", "Each layer should look slightly underdone before rolling."],
    },
  ],
  sweet: [
    {
      name: "Golden Yolk Custard Buns",
      time: "45 min",
      serves: 6,
      size: "Small",
      ingredients: ["4 Small egg yolks", "200 ml milk", "60 g sugar", "30 g custard powder", "Vanilla", "Soft brioche dough"],
      steps: [
        "Whisk yolks, sugar and custard powder to ribbons.",
        "Warm milk + vanilla, then temper into the yolks.",
        "Back on low heat, stir until thick pudding, 4 minutes.",
        "Cool with cling film touching the surface.",
        "Fill brioche buns, bake 12 min at 190°C, glaze warm.",
      ],
      tips: ["Rich small-yolk custard beats big-egg custard here.", "The film trick stops the skin."],
    },
    {
      name: "Cloud-Nine Meringues",
      time: "90 min",
      serves: 8,
      size: "Small",
      ingredients: ["3 Small egg whites", "150 g caster sugar", "Pinch of cream of tartar", "Vanilla", "Pinch of salt"],
      steps: [
        "Room-temperature whites in a spotless bowl.",
        "Whip to soft peaks, then add sugar one spoon at a time.",
        "Glossy stiff peaks — the bowl can go over your head.",
        "Pipe clouds onto lined trays.",
        "100°C for 75 minutes. Door ajar, cool inside the oven.",
      ],
      tips: ["Small-egg whites whip up the most stable foams.", "Save the yolks for custard — zero waste."],
    },
  ],
};

let recipeCounter = 0;

export function generateRecipe(mood: string): BotReply {
  const m = (["quick", "classic", "fancy", "sweet"].includes(mood) ? mood : "classic") as Mood;
  const pool = RECIPES[m];
  const seed = pool[recipeCounter++ % pool.length];
  const tip = seed.tips[Math.floor(Math.random() * seed.tips.length)];
  return {
    text: `The test kitchen hums... Here's my ${m === "sweet" ? "patisserie-grade" : "chef-approved"} pick — sized for ${seed.size} eggs (₦${fmt(TIERS[seed.size].price)}/tray):`,
    card: {
      kind: "recipe",
      name: seed.name,
      time: seed.time,
      serves: seed.serves,
      size: seed.size,
      ingredients: seed.ingredients,
      steps: seed.steps,
      tip,
    },
    chips: [
      { label: "Another one", payload: `cmd:mood:${m}` },
      { label: "Different mood", payload: "cmd:recipe" },
      { label: `Order ${seed.size} — ${fmt(TIERS[seed.size].price)}`, payload: `cmd:order:${seed.size}` },
    ],
  };
}

/* ------------------------------ facts ------------------------------ */

const FACTS = [
  "A yolk's colour is diet, not freshness — our maize-and-greens mix is what makes ours sunset-orange.",
  "An egg's shell has up to 17,000 tiny pores. It breathes. Treat it kindly.",
  "Fresh eggs sink and lie flat in water. Floaters get retired to the bakery.",
  "The chalazae — those white cords — are freshness anchors, not flaws. The more visible, the fresher.",
  "A hen takes about 25 hours to build one egg. Respect the craftsmanship.",
  "Room-temperature eggs whip fluffier and bake more evenly than fridge-cold ones.",
  "The average hen lays 250–300 eggs a year. Ours are overachievers.",
  "Eggs are the reference protein — every other food's protein quality is measured against them.",
];

export function eggFact(): string {
  const day = Math.floor(Date.now() / 86400000);
  return FACTS[day % FACTS.length];
}

/* ------------------------- intent NLU engine ------------------------ */

export function respond(raw: string): BotReply {
  const t = raw.toLowerCase().trim();
  const numMatch = t.match(/\d+/);
  const num = numMatch ? parseInt(numMatch[0], 10) : 0;

  const has = (...keys: string[]) => keys.some((k) => t.includes(k));

  /* quick math: people count mentioned with planning words */
  if (
    num > 0 &&
    has("people", "person", "family", "party", "guest", "mouth", "kids", "children", "crowd", "event", "staff")
  ) {
    const plan = computePlan(Math.min(num, 60), 1.5, 7);
    return {
      text: `Crunched it: ${Math.min(num, 60)} people × ~1.5 eggs a day × 7 days. Here's the tray math:`,
      card: { kind: "planner", ...plan },
      chips: [
        { label: "Fine-tune it", payload: "cmd:planner" },
        { label: `Order ${plan.size}`, payload: `cmd:order:${plan.size}` },
      ],
    };
  }

  if (has("plan", "how many tray", "how much egg", "quantit") || t.startsWith("cmd:planner"))
    return {
      text: "Let's do the tray math properly. First — how many mouths are we feeding each day? Just type a number.",
      chips: [{ label: "Never mind", payload: "cmd:home" }],
    };

  if (has("price", "cost", "how much", "frw", "rwf", "6000", "5800", "5000", "expensive", "cheap"))
    return {
      text: `Straight from the coop: Small 5,000 (${perEggCost("Small")}/egg) · Medium 5,800 (${perEggCost("Medium")}/egg) · Big 6,000 (${perEggCost("Big")}/egg) — all per tray of 30. Delivery's free when you take 2+ trays.`,
      card: { kind: "tiers" },
      chips: [
        { label: "Which size for me?", payload: "cmd:advise" },
        { label: "Plan my trays", payload: "cmd:planner" },
      ],
    };

  if (has("difference", "which size", "best size", "which one", "recommend", "suggest", "advise", "help me choose", "confused"))
    return {
      text: "Happy to play egg matchmaker. What's the main mission for these eggs?",
      chips: [
        { label: "Daily breakfasts", payload: "cmd:use:breakfast" },
        { label: "Baking & pastries", payload: "cmd:use:baking" },
        { label: "Feeding a crowd", payload: "cmd:use:crowd" },
      ],
    };

  if (has("deliver", "shipping", "bring", "pickup", "pick up", "collect my", "kigali", "transport"))
    return {
      text: `We run one delivery sweep daily at 2 PM — order by noon and your tray lands the same day. 2+ trays ride free; a single tray adds a small rider fee. Prefer pickup? The farm gate is open 6 AM–7 PM, Monday to Saturday.`,
      chips: [
        { label: "Order now", payload: "cmd:order:Medium" },
        { label: "Opening hours", payload: "hours?" },
      ],
    };

  if (has("bulk", "wholesale", "restaurant", "hotel", "cafe", "shop", "resell", "business", "cater"))
    return {
      text: `Ah, a volume player. Restaurants, cafés and resellers get standing weekly orders at a friendly rate — consistent size grading, priority on the 6 AM collection. Tell our farm team your weekly tray count on WhatsApp and we'll build you a deal.`,
      chips: [
        { label: "WhatsApp the farm", payload: "cmd:whatsapp" },
        { label: "See retail prices", payload: "cmd:tiers" },
      ],
    };

  if (has("hour", "open", "close", "when are you", "sunday", "monday"))
    return {
      text: "The farm wakes up at 6 AM sharp — Mon–Sat 6 AM to 7 PM, Sundays 7 AM to 1 PM. Delivery run leaves at 2 PM daily. Hens keep their own schedule; we just follow it.",
      chips: [{ label: "Order for today", payload: "cmd:order:Medium" }],
    };

  if (has("where", "location", "address", "find you", "visit", "directions", "farm"))
    return {
      text: "Golden Yolk Farm sits in Sunrise Valley, Kicukiro — follow the smell of fresh grass and extremely content chickens. Gate pickup daily, or we'll come to you: one delivery run across the city every day at 2 PM.",
      chips: [{ label: "Get eggs delivered", payload: "cmd:order:Medium" }],
    };

  if (has("fresh", "how long", "last", "expir", "store", "storage", "fridge", "keep", "old", "spoil"))
    return {
      text: `Collected this morning, at your door today — our eggs never sit more than 48 hours before they're sold (older ones go to the bakery next door). Kept cool, they'll stay glorious for 3+ weeks. Pro tip: pointy end down, and skip the fridge door — it's the warmest shelf.`,
      chips: [{ label: "Impress me with a recipe", payload: "cmd:recipe" }],
    };

  if (has("protein", "nutrition", "calorie", "healthy", "health", "diet", "vitamin", "gym", "muscle"))
    return {
      text: "Each egg packs ~7 g of reference-grade protein, choline for your brain, vitamin D, B12 and selenium — in about 75 golden calories. Bodybuilders and grandmothers agree: it's nature's multivitamin in a shell.",
      chips: [
        { label: "Gym-meal tray plan", payload: "cmd:planner" },
        { label: "High-protein recipe", payload: "cmd:mood:classic" },
      ],
    };

  if (has("pay", "payment", "transfer", "account", "bank", "opay", "palmpay", "momo", "ussd", "deposit", "receipt", "cash"))
    return {
      text: "Transfers are instant here — we share our account details privately on WhatsApp (never published online). Tap below and I'll open the chat, then drop your receipt there and your tray joins the next 2 PM run. Prefer cash? Farm-gate pickup works daily until 7 PM.",
      chips: [
        { label: "Get account details", payload: "cmd:whatsapp-account" },
        { label: "Send receipt", payload: "cmd:whatsapp-receipt" },
        { label: "See prices", payload: "cmd:tiers" },
      ],
    };

  if (has("recipe", "cook", "make with", "bake", "cake", "omelette", "omelet", "scramble", "boil", "fried", "pancake", "crepe", "quiche", "meringue", "shakshuka", "hungry", "dinner", "lunch", "breakfast idea"))
    return {
      text: "The Yolk AI test kitchen is at your service. Pick a mood and I'll compose a recipe sized for the right tray:",
      chips: [
        { label: "Quick (10 min)", payload: "cmd:mood:quick" },
        { label: "Classic comfort", payload: "cmd:mood:classic" },
        { label: "Fancy brunch", payload: "cmd:mood:fancy" },
        { label: "Sweet bake", payload: "cmd:mood:sweet" },
      ],
    };

  if (has("who are you", "what are you", "are you ai", "robot", "real", "human", "hen"))
    return {
      text: "I'm Yolk AI — a small neural network raised free-range on this very farm. I know every hen by name (Cluck Norris sends her regards), and my only job is matching humans with their perfect eggs.",
      chips: [
        { label: "Find my egg size", payload: "cmd:advise" },
        { label: "Surprise me", payload: "cmd:mood:fancy" },
      ],
    };

  if (has("fact", "tell me something", "interesting", "bored", "entertain"))
    return {
      text: `Farm intelligence, served fresh: ${eggFact()}`,
      chips: [
        { label: "Another fact", payload: "fact please" },
        { label: "Plan my trays", payload: "cmd:planner" },
      ],
    };

  if (/^(hi|hello|hey|yo|muraho|good morning|good afternoon|good evening|habari|bonjour|hola)/.test(t))
    return {
      text: `Hello, egg enthusiast! I'm Yolk AI — I plan trays, pick sizes, and compose recipes on demand. Today's farm fact: ${eggFact()}`,
      chips: [
        { label: "Plan my trays", payload: "cmd:planner" },
        { label: "Which size for me?", payload: "cmd:advise" },
        { label: "AI recipe ideas", payload: "cmd:recipe" },
      ],
    };

  if (has("thank", "great", "awesome", "perfect", "nice", "cool", "love"))
    return {
      text: "Anytime! May your yolks always be runny and your shells never in the bowl. Anything else — tray planning, recipes, sizing?",
      chips: [
        { label: "Order now", payload: "cmd:order:Medium" },
        { label: "One more recipe", payload: "cmd:recipe" },
      ],
    };

  if (has("bye", "later", "see you", "goodbye", "ciao"))
    return {
      text: "Crack on with your day! The hens and I will be here — same golden time, same golden place.",
      chips: [{ label: "Actually, one thing…", payload: "cmd:home" }],
    };

  if (num > 0 && t.replace(/\d/g, "").trim().length <= 2) {
    const plan = computePlan(Math.min(num, 60), 1.5, 7);
    return {
      text: `Taking a chef's guess: ${Math.min(num, 60)} people, everyday eating, one week. Here's the math — tap fine-tune to adjust:`,
      card: { kind: "planner", ...plan },
      chips: [
        { label: "Fine-tune it", payload: "cmd:planner" },
        { label: `Order ${plan.size}`, payload: `cmd:order:${plan.size}` },
      ],
    };
  }

  return {
    text: `Hmm, my hen-house training data is silent on that one — but ask me about prices, sizes, delivery, recipes, or how many trays your crew needs. Or just type a number of people and watch me do math.`,
    chips: [
      { label: "Plan my trays", payload: "cmd:planner" },
      { label: "AI recipe ideas", payload: "cmd:recipe" },
      { label: "Show prices", payload: "cmd:tiers" },
    ],
  };
}

export const HOME_CHIPS: Chip[] = [
  { label: "Plan my trays", payload: "cmd:planner" },
  { label: "Which size for me?", payload: "cmd:advise" },
  { label: "AI recipe ideas", payload: "cmd:recipe" },
  { label: "Prices", payload: "cmd:tiers" },
];
