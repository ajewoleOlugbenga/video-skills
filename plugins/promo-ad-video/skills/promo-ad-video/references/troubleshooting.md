# Troubleshooting

**"Brief has problems: …"** The validator in `scripts/scene-frames.mjs` checks colors and scene types. Fix the listed fields.

**Chrome download fails / no internet for downloads.** Point Remotion at an installed Chrome or Chromium:
`REMOTION_BROWSER="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" scripts/render.sh …`
(Windows: `C:\Program Files\Google\Chrome\Application\chrome.exe`; Linux: `$(which chromium)`).

**Windows.** `render.sh` needs Git Bash or WSL. Or run the commands inside it directly:
`npx remotion render src/index.ts Ad out/my-ad.mp4 --props=briefs/my-ad.json`

**Image not showing.** Path is relative to `public/`, e.g. `"image": "assets/product.png"`, and the file must be inside `public/assets/`. Filenames are case-sensitive.

**Symbol shows as a box (e.g. ₦).** Poppins lacks some symbols; the bundled Inter font covers them automatically. If you set a custom `brand.font`, make sure it is loaded in `src/Root.tsx` like the bundled fonts.

**Text overflows or wraps badly.** Shorten it (see limits in `ad-scriptwriting.md`). Don't shrink the font: small text doesn't read on a phone.

**Video too long/short.** Adjust `seconds` on individual scenes, or remove a scene. Target 15–30 s.

**Live preview while editing.** `npx remotion studio` opens a browser editor with a timeline. Pass the brief with `--props=briefs/<slug>.json`.

**Render is slow.** Add `--concurrency=50%` or lower `--crf` quality (`--crf=23`) inside `render.sh`. Stills are always the fast way to iterate.
