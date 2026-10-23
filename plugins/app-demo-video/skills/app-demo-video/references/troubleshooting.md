# Troubleshooting

## Capture

**"App not reachable at …"**: dev server not running, or on another port. Read the dev server output for the real port and update `baseUrl`.

**"Could not start the browser"**: run `npx playwright install chromium`, or set `CHROME_PATH` to an installed Chrome:
macOS `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, Windows `C:\Program Files\Google\Chrome\Application\chrome.exe`, Linux `$(which chromium)`.

**Setup (login) fails**: look at `public/assets/shots/_setup-failed.png`. Usually a wrong selector, a cookie banner covering the form (click it away first), or a CAPTCHA/OAuth screen (see `running-the-app.md`; don't try to bypass CAPTCHAs).

**A shot fails**: look at `<name>-failed.png`. Fix the selector (prefer `text=` or `[data-testid]`), add `waitFor` for slow pages, then `--only <name>`.

**Spinners/skeletons in screenshots**: add `{ "waitFor": "<selector of loaded content>" }` or `{ "wait": 1500 }` to the shot's actions.

**Focus is null**: the selector didn't match at the end of the shot. Check it in the final screenshot.

**No zoom in the video**: the focus element is too big. Choose a smaller element.

## Render

**"Brief has problems: …"**: fix the listed fields (bad colors, unknown scene type, missing file in `public/`).

**Chrome download fails on render**: `REMOTION_BROWSER=/path/to/chrome scripts/render.sh …`

**Windows**: `render.sh` needs Git Bash or WSL; or run `npx remotion render src/index.ts Ad out/x.mp4 --props=briefs/x.json` directly.

**Clip shows a frozen frame or goes blank**: set `clipSeconds` from the manifest; keep `media` set to the shot's PNG (it sits under the clip).

**Text overlaps the brand chip or gets cut**: shorten the title/caption (see limits in `pitch-and-story.md`). For phone frames in 9:16, drop the caption.

**Screenshots look blurry when zoomed**: capture with `"scale": 2` (default) and keep `zoom` ≤ 2.5.

**Live editing**: `npx remotion studio`, then pick the composition and pass `--props=briefs/x.json`.

**Slow render**: add `--concurrency=50%` in `render.sh`, or `--crf=23`. Iterate with stills.
