# Brief JSON reference

The brief describes the whole video. Types: `template/src/types.ts`. Start from `template/briefs/example.json`.

```jsonc
{
  "brand": {
    "name": "Ledgerly",                     // shown in the top chip and the intro
    "logo": "assets/logo.png",              // optional, copy the repo's logo into public/assets
    "colors": {                             // all 6-digit hex
      "background": "#0E1020",
      "primary": "#4F46E5",                 // highlight marker, callouts, buttons
      "accent": "#A5B4FC",                  // small labels
      "text": "#FFFFFF",
      "muted": "#B9BED6"                    // captions
    },
    "style": "bold"                         // "bold" | "soft" | "dark-luxe" (background glow strength)
  },
  "format": "16:9",                         // "16:9" | "9:16" | "1:1" | "4:5"
  "scenes": [ ... ],
  "audio": {
    "music": "sfx/starter-beat.mp3",        // false = no music
    "sfx": true,
    "voice": { "name": "norman", "speed": 1.0 },   // only if the developer chose the AI voiceover
    "pronounce": { "Ledgerly": "Ledger lee" },
    "subtitles": true
  }
}
```

**Voice fields on any scene:** `"say": "the spoken line"` (you write it). `voice` and `voiceSeconds` are filled in by `scripts/voiceover.py`; don't write them by hand unless using the developer's own recordings. A scene is never shorter than its spoken line. See `voiceover.md`.

Wrap 1–2 words in `*asterisks*` in any title to highlight them. Every scene takes an optional `seconds`.

## App scenes

**intro**: "Meet <App>"
`{ "type": "intro", "tagline": "Invoicing that gets you *paid faster*", "media": "assets/shots/dashboard.png", "name": "Ledgerly", "label": "Meet" }`
`media` adds a tilted hero screenshot. `name` defaults to `brand.name`. Default 3.4 s (4.2 s with media).

**feature**: one screen with title, zoom, cursor, callout
```jsonc
{
  "type": "feature",
  "step": "Invoices",                        // small label above the title
  "title": "Bill a client in *30 seconds*",
  "caption": "Line items, tax and totals done for you.",
  "media": "assets/shots/new-invoice.png",   // screenshot (also the final frame under a clip)
  "video": "assets/shots/new-invoice.webm",  // optional recording; plays first, then zooms
  "clipSeconds": 6.8, "speed": 1.5,          // from manifest "seconds"; speed 1.3–1.8 for slow clips
  "width": 1440, "height": 900,              // from manifest
  "frame": "browser",                        // "browser" | "phone" (mobile captures) | "none"
  "url": "app.ledgerly.io/invoices/new",     // address bar text
  "focus": { "x": 0.62, "y": 0.71, "w": 0.18, "h": 0.06 },  // from manifest
  "zoom": 2.2,                               // max zoom (default 2.2 browser / 1.6 phone)
  "callout": "Auto-totals",                  // pops by the focus point
  "cursor": true,                            // animated cursor on stills (default when focus is set)
  "flip": true                               // landscape only: screen left, text right
}
```
Default length: 4.6 s for stills; clip length ÷ speed + 2.2 s for recordings.

**montage**: 2–4 extra screens fanned out
`{ "type": "montage", "title": "And *much* more", "media": ["assets/shots/a.png", "assets/shots/b.png", "assets/shots/c.png"] }`

## Supporting scenes

| type | fields | use for |
|---|---|---|
| `hook` | `text`, `sub?` | first 2 seconds |
| `problem` | `title?`, `lines[]` | the pain, each line crossed out |
| `benefits` | `title?`, `items[]` of `{icon?, text}` | "why it stands out" |
| `stat` | `value`, `label` | only real numbers from the developer |
| `testimonial` | `quote`, `name`, `role?`, `stars?` | only real quotes |
| `cta` | `text`, `button?`, `contacts[]` of `{icon?, text}`, `urgency?` | final action |
| `product`, `price` | see types.ts | rarely needed for apps; `price` suits pricing plans |

Icons: `check star truck clock shield phone chat globe tag spark heart location cash bolt gift x code lock users chart search cloud`

## Validation

`scripts/render.sh` validates the brief first: colors, scene types, focus values, and that every referenced file exists in `public/`.
