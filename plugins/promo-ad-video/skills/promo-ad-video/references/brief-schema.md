# Brief JSON reference

The brief is the only thing you need to write to make a new ad. Types are in `template/src/types.ts`.

```jsonc
{
  "brand": {
    "name": "Mama Tee's Kitchen",          // shown in the top chip
    "logo": "assets/logo.png",             // optional, file in public/
    "colors": {
      "background": "#14100D",             // all colors: 6-digit hex
      "primary": "#FF7A1A",                // buttons, highlight marker, icon tiles
      "accent": "#FFD23F",                 // labels, price burst, badges
      "text": "#FFFFFF",                   // must contrast with background
      "muted": "#CFC6BA"                   // optional, secondary text
    },
    "font": "Montserrat",                  // optional; must be installed or added to src/Root.tsx. Poppins is bundled.
    "style": "bold"                        // "bold" | "soft" | "dark-luxe" (background glow strength)
  },
  "format": "9:16",                        // "9:16" (Reels/TikTok/Status) | "4:5" | "1:1" | "16:9"
  "fps": 30,
  "scenes": [ /* see below */ ],
  "audio": {
    "music": "sfx/starter-beat.mp3",       // default; or "assets/your-track.mp3"; or false
    "musicVolume": 0.35,                   // default 0.35, or 0.12 when there is a voiceover
    "voiceover": "assets/vo.mp3",          // optional
    "sfx": true                            // whooshes and pops
  }
}
```

## Scenes

Every scene takes an optional `"seconds"` to override its default length.

| type | fields | default length |
|---|---|---|
| `hook` | `text`, `sub?` | 2.4 s |
| `problem` | `title?`, `lines[]` | 1.6 s + 0.6 s per line |
| `product` | `title`, `subtitle?`, `image?` (e.g. `assets/product.png`), `badge?` | 3.2 s |
| `benefits` | `title?`, `items[]` of `{ icon?, text }` | 1.2 s + 0.75 s per item |
| `stat` | `value` (numbers count up, e.g. `"5,000+"`), `label` | 2.6 s |
| `price` | `label?`, `price`, `oldPrice?` (struck through), `note?` | 3.2 s |
| `testimonial` | `quote`, `name`, `role?`, `stars?` (default 5) | 4.2 s |
| `cta` | `text`, `button?`, `contacts[]` of `{ icon?, text }`, `urgency?` | 4.5 s |

Without `image`, the product scene shows a branded gradient tile with the business name.

## Icons

`check star truck clock shield phone chat globe tag spark heart location cash bolt gift x`

Generic line icons only. Don't add brand logos (WhatsApp, Instagram) unless the user supplies them as their own asset; use `chat` for WhatsApp and `globe` for social handles.

## Highlighting

`*word*` or `*several words*` inside any `text`/`title` field draws the primary-colored marker behind those words.
