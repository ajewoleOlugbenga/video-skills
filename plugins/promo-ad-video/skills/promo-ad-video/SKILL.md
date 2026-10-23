---
name: promo-ad-video
description: Turn a short description of a small business, product or offer into a finished 15–30 second animated promo ad video (MP4) for Instagram Reels, TikTok, WhatsApp Status or Facebook, with kinetic text, brand colors, sound effects and music. Use when someone asks for a promo video, product ad, reel, sales video, flyer-style video or animated advert for a business.
---

# Promo Ad Video

Produces a ready-to-post vertical ad video from a plain-language description of a business. You (Claude) act as copywriter, motion designer and editor: you write the ad script, turn it into a brief JSON, and render it with the bundled Remotion template in `template/`.

Output: an MP4 (1080×1920 by default) plus preview stills, made with code, no editing software.

## Requirements

- Node.js 18+ and npm (the template installs Remotion on first run)
- ffmpeg is optional (only for trimming/converting user-supplied audio)
- First render downloads a headless Chrome (~100 MB) automatically. If downloads are blocked, set `REMOTION_BROWSER=/path/to/chrome`.
- Licensing: Remotion is free for individuals, companies with up to 3 employees and non-profits; larger for-profit companies need a Remotion Company License (remotion.dev/license). Mention this once if the user appears to be rendering for a larger company. Bundled fonts are SIL OFL (see `template/public/fonts/OFL.txt`).

## Workflow

Follow these steps in order. Do not skip the preview check in step 5.

### 1. Gather the brief

You need: business name, what is being sold, the offer/price, who it's for, how to buy (WhatsApp number, IG handle, website, location). Nice to have: brand colors, logo, product photos, real customer quotes, real numbers (customers served, years in business).

Ask for missing essentials in **one** short message (max 3 questions). Don't ask about things you can choose well yourself (colors, scene order, wording). If the user is not available, make sensible choices and say what you assumed.

### 2. Write the script

Read `references/ad-scriptwriting.md` and pick a structure. Write the script as a short scene list and show it to the user in a few lines before rendering, unless they asked you to just go. Rules that matter most:

- Hook in the first 2 seconds, max 7 words. Scroll-stopping, about the viewer, not the brand.
- Total 15–30 seconds, 5–8 scenes.
- **Never invent testimonials, customer counts, ratings or prices.** Only use `testimonial` and `stat` scenes with facts the user gave you. Otherwise leave them out.
- Copy prices, phone numbers and handles exactly as given.

### 3. Set up the workspace (once per project)

```bash
cp -r <skill-dir>/template ./promo-ads   # skip if ./promo-ads already exists
cd promo-ads && npm install
```

`<skill-dir>` is the folder this SKILL.md lives in (the skill's base directory, shown when the skill loads). It may be inside a plugin cache or `~/.claude/skills/`; never edit files there, always copy the template out first.


Put user-supplied logo, product photos and audio in `promo-ads/public/assets/`. Square or 4:5 product photos on a clean background look best.

### 4. Write the brief JSON

Create `promo-ads/briefs/<business-slug>.json`. Full field reference: `references/brief-schema.md`. Start from `template/briefs/example.json`.

Key points:
- Colors must be 6-digit hex. Pick a `background`, a strong `primary` (buttons, highlight marker), an `accent` (labels, price burst, badges), and `text` with strong contrast against the background.
- Wrap 1–2 key words per line in `*asterisks*` to highlight them, e.g. `"Too tired to *cook* tonight?"`.
- Scene types: `hook`, `problem`, `product`, `benefits`, `stat`, `price`, `testimonial`, `cta`. Each takes an optional `seconds`.
- Icons available: check, star, truck, clock, shield, phone, chat, globe, tag, spark, heart, location, cash, bolt, gift, x.

### 5. Preview stills, then look at them

```bash
scripts/render.sh briefs/<slug>.json stills
```

This validates the brief, then writes one PNG per scene to `out/<slug>-frames/`. **Open every still and check**:
- No text cut off or wrapping awkwardly (one orphan word on its own line → shorten the text)
- Text clearly readable against the background
- Nothing important near the top 15% or bottom 22% (platform buttons cover these; the template already keeps content in the safe zone, so this mostly matters for long text)
- Spelling, prices and contacts exactly right

Fix the brief and re-run stills until clean. This is cheap (≈1 min); a full render is not.

### 6. Render the video

```bash
scripts/render.sh briefs/<slug>.json
```

Writes `out/<slug>.mp4` (≈2–4 min for 30 s). Confirm the duration is 15–30 s.

### 7. Deliver

Give the user the MP4 and one line on what's in it. Offer one useful next step, such as:
- 2–3 alternative hooks as A/B variants (copy the brief, change only the hook scene)
- Another format: `"format": "1:1"` or `"4:5"` for feed posts, `"16:9"` for YouTube/website
- A voiceover version (see `references/voiceover.md`)

## Audio

- Sound effects (whoosh, pop, ding, impact) play automatically on scene changes and list items. Turn off with `"audio": {"sfx": false}`.
- A royalty-free starter beat plays by default. Use the user's own track with `"audio": {"music": "assets/song.mp3"}`, or `false` for none. Never download or use copyrighted songs; the user must own or license any track they supply.
- Voiceover: see `references/voiceover.md`.

## Customizing the look

For changes beyond the brief (new scene type, different animation), edit files in `promo-ads/src/`:
- `scenes/Scenes.tsx`: one component per scene type
- `components/Words.tsx`: kinetic text and the highlight marker
- `components/Frame.tsx`: background, brand chip, safe zones, scene exit transition
- `Ad.tsx`: scene timing defaults and audio

Keep to Remotion rules: all animation must be driven by `useCurrentFrame()` (no CSS transitions, no `setTimeout`), and assets must be loaded with `staticFile()`.

If something fails, see `references/troubleshooting.md`.
