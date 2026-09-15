# Golden Yolk — AI-Powered Farm Fresh Eggs

[![Deploy](https://github.com/merebari7-web/golden-yolk/actions/workflows/deploy.yml/badge.svg)](https://github.com/merebari7-web/golden-yolk/actions)

**Live → https://merebari7-web.github.io/golden-yolk/**

A cinematic, scroll-driven egg shop: 3D WebGL eggs, a
scroll-scrubbed film sequence, an AI concierge (Yolk AI) with local
memory, adaptive GPU quality, a live delivery countdown, tray planner,
recipe generator and bank-transfer ordering.

**Pricing:** Small ₦5,000 · Medium ₦5,800 · Big ₦6,000 (tray of 30)
**Order / Transfers:** 0803 650 1450 — transfer details shared privately on WhatsApp

## Tech

- React 19 + Vite + Tailwind CSS 4
- Three.js / React Three Fiber (scroll-choreographed 3D egg scenes)
- 110-frame WebP scroll sequence (`public/scroll-sequence/`)
- Framer Motion, Lenis smooth scroll, Lucide icons
- Client-side AI concierge (`src/lib/ai.ts`) — no API key required

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build   # outputs dist/ (single-file html + scroll-sequence frames)
```

---

# 🚀 Deploy to your GitHub (4 commands)

Everything is already committed on the `main` branch with the Pages
workflow included. Run these in this folder:

```bash
# 1. Create the repo on your GitHub account (needs gh CLI: https://cli.github.com — or create it at github.com/new named "golden-yolk" and use step 2b)
gh repo create golden-yolk --public --source=. --push

# 2b. If you created it on the website instead:
git remote add origin https://github.com/YOUR-USERNAME/golden-yolk.git
git branch -M main
git push -u origin main
```

Then **one click in the GitHub UI**:

> Repo → **Settings → Pages → Build and deployment → Source: "GitHub Actions"**

That's it — every `git push` to `main` will rebuild and republish at:

```
https://YOUR-USERNAME.github.io/golden-yolk/
```

The workflow in `.github/workflows/deploy.yml` installs, builds and
publishes `dist/` automatically.

## Project map

| Path | What lives there |
| --- | --- |
| `src/components/EggScene.tsx` | The 3D scroll-choreographed eggs |
| `src/components/ScrollyVideo.tsx` | Canvas frame-scrub film section |
| `src/components/AiConcierge.tsx` | Yolk AI chat widget |
| `src/lib/ai.ts` | The concierge brain (intents, planner, recipes) |
| `src/lib/payment.ts` | Account number, WhatsApp & phone details |
| `public/scroll-sequence/` | 110 WebP frames for the film |
