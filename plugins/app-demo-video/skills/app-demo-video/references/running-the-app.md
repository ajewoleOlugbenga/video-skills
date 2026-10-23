# Running the developer's app for capture

Goal: the app running locally, logged in with a test account, full of realistic demo data. Budget: two honest attempts, then fall back to a URL or the developer's own recordings.

## Before installing

- Installing runs the repo's own install scripts. It's the developer's repo and they asked for the video, but if `package.json` has unusual `preinstall`/`postinstall` scripts that download or execute remote code, mention it before running.
- Use the detected package manager (pnpm/yarn/npm/bun). Monorepos: install at the root, run the web app's dev script in its folder.
- Install in the repo itself only if dependencies aren't installed yet; that creates `node_modules`, which is gitignored and expected. Never edit tracked files.

## Environment variables

- `scan-repo.mjs` lists names from `.env.example`. It never reads `.env`.
- If `.env` (or `.env.local`) is missing and variables are required: list the names, say which look essential (database URL, auth secret) and which are optional (analytics, email, payments), and ask the developer to create the file. Many apps run fine with only the essentials. Never ask for values in chat and never write secret values yourself.
- Random local-only secrets (e.g. `NEXTAUTH_SECRET`) are fine for the developer to generate with `openssl rand -base64 32`.

## Databases and services

- `docker-compose.yml` present → `docker compose up -d <db service>` (only the services needed).
- Prisma: `npx prisma migrate dev` or `npx prisma db push`, then the seed script. Drizzle: the repo's migrate script.
- Check the database URL host is `localhost`/`127.0.0.1`/a docker service name before migrating or seeding. If it points anywhere else, stop and ask.
- No database available and none easy to start → fall back.

## Demo data

An empty app makes a bad demo. In order of preference:
1. The repo's seed script (`npm run seed`, `prisma db seed`, `rails db:seed`, `php artisan db:seed`).
2. Create data through the UI using `setup` actions in the shot list: create a few projects/items with realistic names.
3. Ask the developer for a demo dataset or a staging URL that already has data.

Make data believable and specific to the app's audience: real-looking company names, sensible numbers, recent dates. Avoid "test", "asdf", "lorem ipsum" and real people's names or photos.

## Authentication

- Email/password or magic-link-free credentials: create a test account through the signup page or seed, and log in with `setup` actions.
- OAuth-only (Google/GitHub sign-in) can't be automated with a fresh browser. Options: ask whether the app has a dev/credentials login mode; use a staging URL; or have the developer provide recordings. Never use the developer's personal OAuth account.
- Clerk/Auth0/Supabase/Firebase: these usually need real keys. Check for a dev mode or test users. If none, fall back.

## Starting the server

Run the dev command in the background and wait for the port. The capture script also waits up to 90 s for `baseUrl`. Typical ports: Next.js/Remix/CRA/Rails 3000, Vite/SvelteKit 5173, Astro 4321, Angular 4200, Django/Laravel 8000, Flask 5000. Dev servers print the real port, so read the output.

Hide dev-only UI before capturing: Next.js error/route badges (`nextjs-portal`), Vite error overlays (`vite-error-overlay`), TanStack/React Query devtools buttons, and Vercel toolbar. Add them to `hide`, or better, fix the underlying error.

## Fallback B: a URL

- Prefer staging. On production, only navigate and look: no form submissions, no creating or deleting anything, unless the developer approves the specific action.
- Logged-in pages on a URL still need a test account.

## Fallback C: the developer's own captures

Ask for: one screenshot per feature at 1440×900 (desktop) or a phone-sized screenshot (portrait videos), plus optional short screen recordings (.mp4/.mov ≤ 10 s each). Put them in `public/assets/shots/`, convert `.mov` with `ffmpeg -i in.mov -c:v libx264 -an out.mp4`, and set `width`/`height` in the brief to the image's size divided by its pixel density (a 2880×1800 retina screenshot is 1440×900). Set `focus` by estimating fractions by eye.

## When done

Stop the dev server and any containers you started. Report test accounts and data you created; delete only with the developer's OK.
