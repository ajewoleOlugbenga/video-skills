#!/usr/bin/env node
// Read-only scan of a web app repo. Runs nothing, installs nothing, never reads secret values.
// Usage: node scripts/scan-repo.mjs <repo-path> [--json out.json]
// Prints a readable summary; with --json also writes the full result for later steps.
import { readFileSync, existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, basename, extname } from "node:path";

const root = process.argv[2];
if (!root || !existsSync(root)) {
  console.error("usage: node scripts/scan-repo.mjs <repo-path> [--json out.json]");
  process.exit(1);
}
const jsonOut = process.argv.includes("--json") ? process.argv[process.argv.indexOf("--json") + 1] : null;

const IGNORE = new Set(["node_modules", ".git", "dist", "build", ".next", ".nuxt", ".svelte-kit", ".output", "coverage", "vendor", "__pycache__", ".venv", "venv", ".turbo", ".cache", "out", "target"]);
const SRC_EXT = new Set([".js", ".jsx", ".ts", ".tsx", ".vue", ".svelte", ".astro", ".py", ".rb", ".php", ".css", ".scss", ".html"]);

// ---- file walk (bounded) ----
const files = [];
(function walk(dir, depth) {
  if (depth > 8 || files.length > 20000) return;
  let entries = [];
  try { entries = readdirSync(dir); } catch { return; }
  for (const e of entries) {
    if (IGNORE.has(e)) continue;
    const p = join(dir, e);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) walk(p, depth + 1);
    else if (st.size < 400_000) files.push(relative(root, p));
  }
})(root, 0);

const read = (rel) => { try { return readFileSync(join(root, rel), "utf8"); } catch { return ""; } };
const has = (rel) => existsSync(join(root, rel));

// ---- find app packages (root + monorepo apps) ----
const pkgFiles = files.filter((f) => basename(f) === "package.json" && f.split(/[\\/]/).length <= 3);
const apps = [];
for (const pf of pkgFiles) {
  let pkg;
  try { pkg = JSON.parse(read(pf)); } catch { continue; }
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  const dir = pf.includes("/") ? pf.slice(0, pf.lastIndexOf("/")) : ".";
  const fw =
    deps.next ? "Next.js" : deps.nuxt ? "Nuxt" : deps["@sveltejs/kit"] ? "SvelteKit" :
    Object.keys(deps).some((d) => d.startsWith("@remix-run/")) ? "Remix" : deps.astro ? "Astro" :
    deps["@angular/core"] ? "Angular" : deps.gatsby ? "Gatsby" : deps["react-scripts"] ? "Create React App" :
    deps.vite && deps.react ? "Vite + React" : deps.vite && deps.vue ? "Vite + Vue" : deps.vite && deps.svelte ? "Vite + Svelte" :
    deps.vue ? "Vue" : deps.react ? "React" : deps.express ? "Express" : deps.fastify ? "Fastify" : deps.hono ? "Hono" : null;
  if (!fw && !pkg.scripts?.dev && !pkg.scripts?.start) continue;
  const scripts = pkg.scripts || {};
  const devKey = ["dev", "start", "serve", "develop"].find((k) => scripts[k]);
  const devCmd = devKey ? scripts[devKey] : null;
  const portMatch = devCmd && devCmd.match(/(?:--port[ =]|-p\s+|PORT=)(\d{2,5})/);
  const defaultPort = { "Next.js": 3000, Nuxt: 3000, SvelteKit: 5173, Remix: 5173, Astro: 4321, Angular: 4200, Gatsby: 8000,
    "Create React App": 3000, "Vite + React": 5173, "Vite + Vue": 5173, "Vite + Svelte": 5173, Vue: 8080, React: 3000, Express: 3000, Fastify: 3000, Hono: 3000 }[fw] ?? 3000;
  const authLibs = ["next-auth", "@auth/core", "@clerk/nextjs", "@clerk/clerk-react", "@supabase/supabase-js", "firebase", "passport", "lucia", "@auth0/auth0-react", "@auth0/nextjs-auth0", "better-auth", "@kinde-oss/kinde-auth-nextjs"].filter((d) => deps[d]);
  const dataLibs = ["prisma", "@prisma/client", "drizzle-orm", "mongoose", "typeorm", "sequelize", "@supabase/supabase-js", "firebase", "pg", "mysql2", "better-sqlite3", "@planetscale/database"].filter((d) => deps[d]);
  const pm = has(join(dir, "pnpm-lock.yaml")) || has("pnpm-lock.yaml") ? "pnpm" : has(join(dir, "yarn.lock")) || has("yarn.lock") ? "yarn" : has(join(dir, "bun.lockb")) || has("bun.lock") ? "bun" : "npm";
  apps.push({
    dir, name: pkg.name, framework: fw || "Node app", packageManager: pm,
    install: `${pm} install`, dev: devKey ? `${pm} run ${devKey}` : null, devScript: devCmd,
    port: portMatch ? Number(portMatch[1]) : defaultPort,
    seedScripts: Object.entries(scripts).filter(([k, v]) => /seed|fixture|demo/i.test(k + " " + v)).map(([k]) => `${pm} run ${k}`),
    dbScripts: Object.keys(scripts).filter((k) => /(db|migrat|prisma|drizzle)/i.test(k)),
    authLibs, dataLibs,
  });
}

// ---- non-JS frameworks ----
if (has("manage.py")) apps.push({ dir: ".", framework: "Django", install: "pip install -r requirements.txt", dev: "python manage.py runserver", port: 8000, seedScripts: [], authLibs: [], dataLibs: ["django orm"] });
if (has("Gemfile") && /rails/.test(read("Gemfile"))) apps.push({ dir: ".", framework: "Ruby on Rails", install: "bundle install", dev: "bin/rails server", port: 3000, seedScripts: has("db/seeds.rb") ? ["bin/rails db:seed"] : [], authLibs: /devise/.test(read("Gemfile")) ? ["devise"] : [], dataLibs: ["active record"] });
if (has("artisan")) apps.push({ dir: ".", framework: "Laravel", install: "composer install", dev: "php artisan serve", port: 8000, seedScripts: ["php artisan db:seed"], authLibs: [], dataLibs: ["eloquent"] });
if (!apps.length && files.some((f) => /(^|\/)app\.py$/.test(f)) && /flask/i.test(read("requirements.txt"))) apps.push({ dir: ".", framework: "Flask", install: "pip install -r requirements.txt", dev: "flask run", port: 5000, seedScripts: [], authLibs: [], dataLibs: [] });

// ---- routes / pages ----
const routes = new Set();
for (const f of files) {
  const n = f.replace(/\\/g, "/");
  let m;
  if ((m = n.match(/(?:^|\/)app\/(.*?)\/?page\.(t|j)sx?$/))) routes.add("/" + m[1].replace(/\([^)]*\)\/?/g, "").replace(/\/$/, ""));
  else if ((m = n.match(/(?:^|\/)(?:src\/)?pages\/(.+)\.(t|j)sx?$/)) && !/^(api\/|_app|_document|_error)/.test(m[1])) routes.add("/" + m[1].replace(/index$/, "").replace(/\/$/, ""));
  else if ((m = n.match(/(?:^|\/)src\/routes\/(.*?)\/?\+page\.svelte$/))) routes.add("/" + m[1].replace(/\([^)]*\)\/?/g, ""));
  else if ((m = n.match(/(?:^|\/)pages\/(.+)\.vue$/))) routes.add("/" + m[1].replace(/index$/, "").replace(/\/$/, ""));
  else if ((m = n.match(/(?:^|\/)src\/pages\/(.+)\.astro$/))) routes.add("/" + m[1].replace(/index$/, "").replace(/\/$/, ""));
  else if ((m = n.match(/(?:^|\/)app\/routes\/(.+)\.(t|j)sx?$/))) routes.add("/" + m[1].replace(/^_index$/, "").replace(/\._index$/, "").replace(/\./g, "/").replace(/\$/g, ":"));
}
// code-defined routes (react-router, vue-router, express, django, rails)
const codeFiles = files.filter((f) => SRC_EXT.has(extname(f)) && !/\.(css|scss|html)$/.test(f));
for (const f of codeFiles.slice(0, 4000)) {
  const src = read(f);
  for (const re of [/<Route[^>]*\spath=["'`]([^"'`]+)["'`]/g, /\bpath:\s*["'`](\/[^"'`]*)["'`]/g, /\b(?:app|router)\.get\(\s*["'`](\/[^"'`]*)["'`]/g, /\bpath\(\s*["']([^"']*)["']/g]) {
    let m;
    while ((m = re.exec(src))) if (m[1].length < 60 && !/^\/?api\b/.test(m[1])) routes.add(m[1].startsWith("/") ? m[1] : "/" + m[1]);
  }
}
if (has("config/routes.rb")) for (const m of read("config/routes.rb").matchAll(/(?:get|resources?|root)\s+[:'"]?([\w\/]+)/g)) routes.add("/" + m[1]);
const routeList = [...routes].map((r) => r.replace(/\/+/g, "/") || "/").filter((r, i, a) => a.indexOf(r) === i).sort();

// ---- environment variable NAMES (from example files only; real .env is never read) ----
const envExample = files.find((f) => /(^|\/)\.env\.(example|sample|template|local\.example|dist)$/.test(f));
const envNames = envExample ? [...read(envExample).matchAll(/^\s*([A-Z][A-Z0-9_]+)\s*=/gm)].map((m) => m[1]) : [];
const envFilePresent = files.some((f) => /(^|\/)\.env(\.local|\.development)?$/.test(f));

// ---- docker / services ----
const compose = files.find((f) => /(^|\/)(docker-)?compose\.ya?ml$/.test(f));
const services = compose ? [...read(compose).matchAll(/^\s{2}([a-zA-Z0-9_-]+):\s*$/gm)].map((m) => m[1]).slice(0, 10) : [];

// ---- README pitch material ----
const readmeFile = files.find((f) => /^readme(\.md)?$/i.test(basename(f)) && !f.includes("/"));
const readme = readmeFile ? read(readmeFile) : "";
const title = (readme.match(/^#\s+(.+)$/m) || [])[1]?.replace(/[*_`]/g, "").trim() || apps[0]?.name || basename(root);
const intro = readme
  .replace(/```[\s\S]*?```/g, "").replace(/<[^>]+>/g, "").replace(/!\[[^\]]*\]\([^)]*\)/g, "")
  .split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && !p.startsWith("#") && !p.startsWith(">") && !/^\[!\[|^\||^-{3}/.test(p) && p.length > 40)
  .slice(0, 2).join("\n\n").slice(0, 700);
const featureBullets = (() => {
  const sec = readme.match(/#+\s*(features|what it does|highlights|why)[^\n]*\n([\s\S]*?)(\n#+\s|$)/i);
  return sec ? [...sec[2].matchAll(/^\s*[-*]\s+(.+)$/gm)].map((m) => m[1].replace(/[*_`]/g, "").trim()).slice(0, 12) : [];
})();

// ---- brand hints: logo files + most used hex colors in styles/theme ----
const logos = files.filter((f) => /(logo|icon|favicon|brand)[^/]*\.(svg|png|webp)$/i.test(f) && !/node_modules/.test(f)).slice(0, 8);
const colorCount = {};
for (const f of files.filter((f) => /\.(css|scss)$|tailwind\.config|theme\.(t|j)s/.test(f)).slice(0, 300)) {
  for (const m of read(f).matchAll(/#([0-9a-fA-F]{6})\b/g)) {
    const c = "#" + m[1].toUpperCase();
    if (!["#FFFFFF", "#000000"].includes(c)) colorCount[c] = (colorCount[c] || 0) + 1;
  }
}
const colors = Object.entries(colorCount).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([c]) => c);
const seedFiles = files.filter((f) => /(seed|fixture|demo[-_]?data|mock[-_]?data)/i.test(f) && !/\.(png|jpg|svg)$/.test(f)).slice(0, 10);

const result = { repo: root, title, intro, featureBullets, apps, routes: routeList.slice(0, 80), envExample, envNames, envFilePresent, dockerCompose: compose, services, seedFiles, logos, colors };
if (jsonOut) writeFileSync(jsonOut, JSON.stringify(result, null, 2));

// ---- readable summary ----
const L = (s = "") => console.log(s);
L(`# ${title}`);
if (intro) L(`\n${intro}`);
if (featureBullets.length) L(`\nREADME features:\n- ${featureBullets.join("\n- ")}`);
L(`\nApps found: ${apps.length || "none (not a recognized web app?)"}`);
for (const a of apps) {
  L(`- ${a.dir}: ${a.framework} | install: ${a.install} | run: ${a.dev ?? "?"} | port ~${a.port}`);
  if (a.authLibs?.length) L(`    auth: ${a.authLibs.join(", ")}`);
  if (a.dataLibs?.length) L(`    data: ${a.dataLibs.join(", ")}`);
  if (a.seedScripts?.length) L(`    seed: ${a.seedScripts.join(", ")}`);
}
L(`\nRoutes/pages (${routeList.length}): ${routeList.slice(0, 40).join("  ") || "none detected (read the router code)"}`);
L(`\nEnv vars needed (${envNames.length}, names only): ${envNames.join(", ") || "none listed"}${envFilePresent ? "  [a local .env exists, values not read]" : ""}`);
if (compose) L(`Docker compose: ${compose} (services: ${services.join(", ")})`);
if (seedFiles.length) L(`Seed/demo data files: ${seedFiles.join(", ")}`);
if (logos.length) L(`Logo candidates: ${logos.join(", ")}`);
if (colors.length) L(`Most used colors: ${colors.join(" ")}`);
