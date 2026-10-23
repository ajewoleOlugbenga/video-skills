# Drafting the pitch and the story

## Drafting the pitch from code

What the code *can* tell you: what the app does (routes, models, components), who it's probably for (domain words in models and copy: "invoice", "patient", "repo", "tenant"), integrations (Stripe, Slack, GitHub), and what's distinctive (real-time sync, AI features, offline support, keyboard shortcuts, export formats, multi-tenant).

What it *can't* tell you: market, competitors, pricing strategy, traction. Ask; don't guess.

Write the draft like this:

> **Draft pitch (from your code, please edit):**
> - **One-liner:** Invoicing for freelancers that gets you paid faster.
> - **For:** freelancers and small agencies
> - **Problem:** chasing late payments across email and spreadsheets
> - **Stands out:** 1) payment links on every invoice (Stripe), 2) automatic overdue reminders (cron job in /jobs/reminders), 3) multi-currency
>
> **Features I found:** dashboard (/dashboard) · create invoice (/invoices/new) · client list (/clients) · reminders settings (/settings/reminders) · PDF export · payments page (/payments). Which 3–5 should the video show?

Point each standout at evidence ("cron job in /jobs/reminders") so the developer can verify quickly.

Don't claim: "fastest", "most secure", "AI-powered" (unless there is real AI in the code), "trusted by", user counts, ratings, or compliance (SOC 2, HIPAA) unless the developer states it.

## Hooks for software

≤ 8 words, about the viewer's pain or goal:
- "Still chasing invoices over *email?*"
- "Your standups, *written for you*"
- "Ship docs your team *actually reads*"
- "From idea to *deployed* in one click"
- "*Stop* copy-pasting between five tabs"

## Scene plan by goal

| Goal | Structure | Length |
|---|---|---|
| Launch / Product Hunt / landing page | hook → intro (with hero shot) → 3–4 features → benefits → CTA | 40–60 s, 16:9 |
| Social teaser (Reels/TikTok/X) | hook → intro → 2–3 features (1 clip) → CTA | 20–30 s, 9:16 |
| Feature announcement | hook ("New: …") → 1 feature clip → 1–2 detail stills → CTA | 15–25 s |
| Investor / pitch deck | problem → intro → 3 features → stat (only real) → CTA | 45–60 s |

## Feature scenes

- **Title = benefit, not feature name.** "Get paid *twice as fast*" beats "Payment links". Put the feature name in `step` ("Payments").
- **Caption** ≤ 8 words of supporting detail.
- **Callout** 2–4 words that point at what to notice: "Auto-calculated", "One click", "Live".
- Order: most impressive feature first after the intro; the "aha" flow as the one recorded clip.
- 3–5 features. More than that becomes a tour; put extra screens in a `montage` ("And *much* more").

## On-screen text limits

hook ≤ 8 words · tagline ≤ 10 · feature title ≤ 6 · caption ≤ 8 · callout ≤ 4 · benefit items ≤ 6 · CTA text ≤ 5, button ≤ 3

Most social video is watched muted, so the text alone must tell the story, even when there's a voiceover. Spoken lines (`say`) follow their own rules in `voiceover.md`: they complement the on-screen text instead of repeating it.

## CTA

Exactly one action, matching the developer's goal: "Start free", "Join the waitlist", "Star on GitHub", "Book a demo". Show the URL or handle as a contact line with the `globe` icon (or `code` for GitHub).

## Colors

Use the app's own primary color (from `scan-repo` or the logo) for `primary`. Dark backgrounds (`#0E1020`-ish) make bright app screenshots pop; for dark-mode apps a slightly lighter background (`#1A1D2E`) separates the frame from the background.
