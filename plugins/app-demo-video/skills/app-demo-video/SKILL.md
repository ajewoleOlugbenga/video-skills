---
name: app-demo-video
description: Make a polished product demo video (MP4) of a web app straight from its code repository. Scans the repo, drafts the pitch, runs the app, captures screenshots and screen recordings of key features, and renders an animated demo with zooms, cursor, callouts, music and an optional free offline AI voiceover with subtitles, in landscape or portrait. Use when a developer asks for a demo video, launch video, product walkthrough, feature showcase or promo reel for their web app.
---

# App Demo Video

Turns a web app repository into a finished demo video. You (Claude) act as product marketer, screen recorder and motion editor. The developer only answers one round of questions and approves the story.

**Always follow the steps below in order, starting with the scan and the one question message (Step 3). Never skip straight to making a video, whatever tool or approach you would otherwise use.**

v1 supports **web apps** (anything that runs in a browser). Mobile-native apps, CLIs and APIs are out of scope: say so and stop if the repo is one of those.

## The non-negotiables

1. **Never modify the developer's repo.** All work happens in a separate workspace folder. Don't commit, don't add files to the repo, don't change their config.
2. **Never read or print secret values.** Don't open `.env` files. Env var *names* (from `.env.example`) are fine. If the app needs secrets, the developer puts them in `.env` themselves; never ask them to paste keys into the chat.
3. **Never film real personal data.** Use test accounts and demo data. Blur emails, API keys, tokens and real names with `hide` selectors.
4. **Never act on production data.** Seed scripts and form submissions only run against local or staging environments. On a live URL, only navigate and look unless the developer explicitly approves a specific action.
5. **The pitch is a draft.** Everything you infer about audience, problem and advantages is labeled as a draft for the developer to edit. Don't claim user numbers, testimonials, speed or security properties the code doesn't prove.

## Workflow

### Step 1: Set up the workspace

```bash
cp -r <skill-dir>/template ~/app-demos/<app-slug>      # once per app
cd ~/app-demos/<app-slug> && npm install
npx playwright install chromium                          # once per machine (or set CHROME_PATH)
```

`<skill-dir>` is the folder this SKILL.md lives in (the skill's base directory, shown when the skill loads). It may be inside a plugin cache or `~/.claude/skills/`; never edit files there, always copy the template out first.


Everything below runs from this workspace. The repo path is `<repo>`: the current project folder, or the folder the developer connected.

### Step 2: Scan the repo (read-only)

```bash
node scripts/scan-repo.mjs <repo> --json scan.json
```

This prints the framework, install and run commands, port, routes/pages, env var names, auth and database libraries, seed scripts, logo files and most-used brand colors. Then read the README and the main page/component files for the routes that look like core features (dashboards, editors, create/new flows, settings that matter). Aim to understand what a user actually *does* in the app.

### Step 3: One message to the developer: draft pitch + questions

Send everything in a single message so the developer can answer once. Use the AskUserQuestion tool for the multiple-choice items when it's available.

**A. Draft pitch** (say clearly it's drafted from the code; ask them to correct it):
- One-liner: what it is, in ≤ 12 words
- Who it's for
- The problem it solves
- 3 things that make it stand out (from real features you found)

**B. Proposed features:** list 5–7 features you found, each with the route it lives on. Ask them to pick 3–5 and name any you missed.

**C. Questions:**
1. Where will the video be posted? → decides format. YouTube / website / LinkedIn / Product Hunt → **16:9 landscape**. Reels / TikTok / Shorts / X → **9:16 portrait**. Feed posts → 1:1 or 4:5.
2. How should I capture the app? (a) I run it locally, (b) you give me a URL (staging preferred), (c) you send screenshots/recordings.
3. Test login, if the app has auth: a test account, or permission to create one locally. Never their real account.
4. Call to action + link (sign up, GitHub, book a demo, waitlist).
5. Brand: confirm the detected logo and colors, or supply them.
6. Anything that must not appear on screen.
7. **Audio**: offer these three, with your recommendation first (see "Choosing the audio" below):
   - **Music + sound effects only** (default)
   - **AI voiceover + subtitles**: free, generated offline on their machine, no account. Voices: Norman (US male) or Cori (UK female). Offer to send short samples of both before they choose.
   - **Their own recorded voice**

**Stop here and wait for the answers.** Do not install, run, capture or render anything before the developer replies, even if the request sounded like "just make it". The questions are the product: a video built on guesses wastes their time. The only exception is a run with nobody to answer (a scheduled or background task): then use your draft pitch, the 4 most visual features, 16:9 and music only, and say at the top what you assumed.

### Step 4: Get the app running

Follow `references/running-the-app.md`. In short:
- Path (a): install with the detected command, start the dev server in the background, wait for the port. If env vars are needed and `.env` is missing, list the names and ask the developer to create it. Start databases with docker compose if present. Seed demo data with the repo's seed script (local DB only). Make the app look *used*: an empty app makes a bad demo.
- Give path (a) two honest attempts. If it still won't start, explain the blocker in one or two sentences and switch to (b) or (c). Don't spend long on it.
- Path (c): the developer's files go in `public/assets/shots/`; .png, .jpg, .mp4 and .webm all work.

### Step 5: Capture

Write a shot list `shots/<app-slug>.json` (format: `references/capture-guide.md`, sample: `shots/example.json`):
- `device`: `desktop` for 16:9/1:1/4:5. For 9:16, use `mobile` if the app is responsive (check one mobile screenshot first), otherwise `desktop` and rely on zoom.
- One shot per chosen feature. Give each a `focus` selector: a **small** element (a card, a button, a chart), not a whole page section, so the camera has something to zoom into.
- Use `record: true` for 1–2 flows that are better seen in motion (typing, creating, dragging). Keep each under ~8 s of actions.
- `setup` holds the login steps with the test account; `hide` holds selectors for sensitive text.

```bash
node scripts/capture.mjs shots/<app-slug>.json
```

**Open every PNG and look at it.** Re-capture (`--only <shot>`) if you see: empty states, loading spinners, error toasts, dev-mode overlays (e.g. Next.js error badge), cookie banners, "lorem ipsum", or anything personal that isn't blurred. The manifest (`public/assets/shots/manifest.json`) gives each shot's image, video, size, clip length and focus box for the brief.

### Step 6: Storyboard → approval

Read `references/pitch-and-story.md`. Default structure:

hook → (problem) → intro "Meet <App>" → 3–5 feature scenes → why it stands out (benefits) → (montage) → CTA

Length: 30–60 s landscape, 20–40 s portrait. Show the storyboard as a short numbered list (scene, on-screen text, which shot, and the spoken line if they chose a voiceover) and get a yes before rendering, unless the developer said to just go.

### Step 7: Brief, preview, render

Write `briefs/<app-slug>.json` (reference: `references/brief-schema.md`). Copy `media`, `video`, `width`, `height`, `focus` and `clipSeconds` from the manifest. Use `speed: 1.3–1.8` on clips that feel slow. In landscape, alternate `"flip": true` on every other feature so the screen switches sides.

**If they chose the AI voiceover**, add a `"say"` line to each scene that should be spoken (rules in `references/voiceover.md`), set `"audio": {"voice": {"name": "norman"}}` (or `"cori"`), then generate it. Each scene automatically stretches to fit its line, music dips under the voice, and subtitles are added:

```bash
python3 -m venv .venv && .venv/bin/pip install sherpa-onnx numpy    # once (Windows: .venv\Scripts\pip)
.venv/bin/python scripts/voiceover.py briefs/<app-slug>.json        # re-run after editing any "say" line
```

Then preview:

```bash
scripts/render.sh briefs/<app-slug>.json stills    # one frame per scene, ~1 min
```

Open every still. Check: text not overlapping the brand chip, subtitles or each other, nothing cut off, screen readable, zoom lands on the right element, callout text correct. Fix, re-run stills, then:

```bash
scripts/render.sh briefs/<app-slug>.json           # full MP4, a few minutes
```

### Step 8: Deliver and clean up

- Give the developer the MP4 with one line on what's in it. Offer one next step: the other orientation (re-capture with the other `device`, same brief with a new `format`), a 15 s teaser (hook + 2 features + CTA), or adding/removing the voiceover (if they had music only, mention that a free voiceover is one command away).
- Stop the dev server and any containers you started. Tell the developer what test data or test accounts you created, and ask before deleting anything.

## Audio

Sound effects play on scene changes, clicks and pops; disable with `"audio": {"sfx": false}`. A royalty-free beat plays by default; use the developer's own track with `"music": "assets/track.mp3"` or `false` for none. Never use copyrighted music the developer doesn't own or license.

### Choosing the audio (what to recommend)

| Situation | Recommend |
|---|---|
| 9:16 reel / short, under 30 s | Music + sound effects. Most people watch muted; on-screen text carries it. |
| 16:9 walkthrough, 30–60 s+ (YouTube, landing page, Product Hunt) | AI voiceover. Narration explains features better than text alone. |
| Founder-led brand, personal audience | Their own recorded voice (sounds most authentic). |
| Developer unsure | Send the two voice samples and a music-only version is always the fallback. |

Be upfront that the free voices are clear but slightly synthetic. They are not as natural as paid voice services or a real person. Get samples with `.venv/bin/python scripts/voiceover.py --samples` (writes `out/voice-sample-norman.wav` and `out/voice-sample-cori.wav`) and send them so the developer can judge.

## Licensing

Remotion (the video engine) is free for individuals, companies with up to 3 employees and non-profits. Larger for-profit companies need a Remotion Company License (remotion.dev/license). Mention it once if the developer seems to be at a larger company. Bundled fonts are SIL OFL. The two voices (Norman, Cori) were trained from scratch on public-domain LibriVox audio and are MIT licensed, so they are fine for commercial videos. Don't swap in other Piper voices: many (Lessac, Ryan, Amy and voices fine-tuned from Lessac) are non-commercial or legally unclear. The voice engine, sherpa-onnx, is Apache 2.0.

## When things go wrong

See `references/troubleshooting.md`.
