# Shot list reference (`scripts/capture.mjs`)

```jsonc
{
  "baseUrl": "http://localhost:3000",
  "device": "desktop",            // "desktop" 1440×900 | "laptop" 1280×800 | "mobile" 390×844 (iPhone UA, touch)
  "viewport": { "width": 1440, "height": 900 },   // optional override
  "scale": 2,                     // pixel density; 2 = crisp when zoomed
  "colorScheme": "light",         // or "dark" if the app looks better dark
  "outDir": "public/assets/shots",
  "slowMo": 450,                  // ms pause between actions in recordings
  "hide": [".user-email", "[data-testid=api-key]", "nextjs-portal"],   // blurred in every shot and clip
  "startPath": "/login",          // where setup begins
  "setup": [                      // runs once; the session is reused by every shot
    { "fill": ["input[name=email]", "demo@example.com"] },
    { "fill": ["input[name=password]", "demo-password-123"] },
    { "click": "button[type=submit]" },
    { "waitFor": "text=Dashboard" }
  ],
  "shots": [
    { "name": "dashboard", "path": "/dashboard", "focus": "[data-testid=revenue-card]" },
    { "name": "create-project", "path": "/projects", "record": true,
      "actions": [
        { "click": "text=New project" },
        { "type": ["input[name=name]", "Website redesign"] },
        { "click": "button:has-text('Create')" },
        { "waitFor": "text=Website redesign" }
      ],
      "focus": "text=Website redesign" }
  ]
}
```

## Actions

| action | value | notes |
|---|---|---|
| `goto` | `"/path"` | navigate |
| `click` | selector | in recordings the cursor glides to it first |
| `fill` | `[selector, text]` | instant; use for setup |
| `type` | `[selector, text]` | types visibly key by key; use in recordings |
| `press` | `"Enter"` | keyboard key |
| `hover` | selector | reveals tooltips/menus |
| `select` | `[selector, value]` | dropdowns |
| `scroll` | pixels | positive = down |
| `waitFor` | selector | wait until visible (15 s max) |
| `wait` | ms | fixed pause |

Selectors are Playwright selectors: CSS (`button.primary`), text (`text=Save`), `:has-text()`, roles (`role=button[name="Save"]`), test ids (`[data-testid=x]`). Prefer stable ones: test ids > roles/text > CSS classes (build-generated class names change).

## Focus (the zoom target)

`focus` is a selector for the element the video camera zooms into and the cursor clicks. The script measures it and writes fractions to the manifest.
- Pick something **small and meaningful**: a stat card, the button just clicked, the new row, a chart. An element wider than ~60% of the screen produces almost no zoom.
- For recordings, focus on the element that shows the *result* (the newly created item), because zoom happens on the final frame.

## Recordings

- `record: true` makes a .webm clip of the actions plus a final screenshot. Keep 1–2 per video; stills with zoom carry the rest.
- Clips include ~1 s of page load at the start; trim by using `speed` (1.3–1.8) in the brief.
- Headless browsers draw no cursor, so the script injects one with click ripples.

## Re-capturing

`node scripts/capture.mjs shots/x.json --only dashboard` re-shoots one shot and updates the manifest. Failed shots leave `<name>-failed.png` showing what the browser saw; setup failures leave `_setup-failed.png`.

## Checklist before moving on

Open every PNG. Re-shoot if any shows: empty states, spinners or skeleton loaders (add a `waitFor`), error toasts, dev overlays, cookie/consent banners (click "decline" in setup), unblurred personal data, or a page scrolled to the wrong spot.
