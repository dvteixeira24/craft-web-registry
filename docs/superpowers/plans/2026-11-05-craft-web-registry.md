# Craft Web Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `D:\Code\craft-web-registry` so `docker compose pull/up` serves a Next.js landing + 15 Craft web apps from GHCR builds.

**Architecture:** Next.js App Router standalone, build-time `fetch-bundles.mjs` downloads 15 pinned `*-web.zip` releases into `public/bundles/<slug>/`, pages at `/apps/[slug]` iframe `/bundles/<slug>/index.html`. Single image `ghcr.io/storytold/craft-web-registry`.

**Tech Stack:** Next.js 14, React 18, TypeScript, Node 20, Docker buildx, GHCR.

---

### Task 1: Scaffold Next.js minimal app

**Files:**
- Create: `D:\Code\craft-web-registry\package.json`
- Create: `D:\Code\craft-web-registry\tsconfig.json`
- Create: `D:\Code\craft-web-registry\next.config.mjs`
- Create: `D:\Code\craft-web-registry\app\layout.tsx`
- Create: `D:\Code\craft-web-registry\app\globals.css`
- Create: `D:\Code\craft-web-registry\.gitignore`
- Create: `D:\Code\craft-web-registry\.dockerignore`

- [ ] **Step 1: Write package.json**

```json
{
  "name": "craft-web-registry",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "node scripts/fetch-bundles.mjs && next build",
    "start": "next start",
    "verify": "node scripts/verify.mjs"
  },
  "dependencies": {
    "next": "14.2.5",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "typescript": "5.5.4",
    "@types/node": "20.14.12",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0"
  }
}
```

- [ ] **Step 2: Write tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", "scripts/*.mjs"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Write next.config.mjs**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/bundles/:slug/*.wasm",
        headers: [
          { key: "Content-Type", value: "application/wasm" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/bundles/:slug/app/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/bundles/:slug/index.html",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
    ];
  },
};
export default nextConfig;
```

- [ ] **Step 4: Write app/layout.tsx**

```tsx
export const metadata = { title: "Craft Web Registry", description: "Storytold Craft apps on the web" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Write app/globals.css**

```css
* { box-sizing: border-box; }
a { color: inherit; }
```

- [ ] **Step 6: Write .gitignore**

```text
node_modules/
.next/
out/
public/bundles/
*.zip
.superpowers/
```

- [ ] **Step 7: Write .dockerignore**

```text
node_modules
.next
.git
.superpowers
```

- [ ] **Step 8: Install and commit**

Run: `cd D:\Code\craft-web-registry && npm install`
Expected: `added N packages`, `next-env.d.ts` generated.

```bash
git add package.json tsconfig.json next.config.mjs app .gitignore .dockerignore
git commit -m "feat: scaffold Next.js standalone app"
```

### Task 2: App manifest + bundle fetcher + verifier

**Files:**
- Create: `D:\Code\craft-web-registry\apps.json`
- Create: `D:\Code\craft-web-registry\scripts\fetch-bundles.mjs`
- Create: `D:\Code\craft-web-registry\scripts\verify.mjs`

- [ ] **Step 1: Write apps.json (15 apps, anicraft excluded — no releases yet)**

```json
[
  { "slug": "photocraft", "repo": "storytold/photocraft", "tag": "v0.20.2", "title": "PhotoCraft", "blurb": "Photo editor" },
  { "slug": "pdfcraft", "repo": "storytold/pdfcraft", "tag": "v0.18.2", "title": "PdfCraft", "blurb": "PDF reader and editor" },
  { "slug": "filmcraft", "repo": "storytold/filmcraft", "tag": "v0.17.1", "title": "FilmCraft", "blurb": "Nonlinear video editor" },
  { "slug": "vectorcraft", "repo": "storytold/vectorcraft", "tag": "v0.21.1", "title": "VectorCraft", "blurb": "Vector art tool" },
  { "slug": "lightcraft", "repo": "storytold/lightcraft", "tag": "v0.18.1", "title": "LightCraft", "blurb": "Nondestructive photo editor" },
  { "slug": "designcraft", "repo": "storytold/designcraft", "tag": "v0.17.2", "title": "DesignCraft", "blurb": "Page and layout design" },
  { "slug": "effectcraft", "repo": "storytold/effectcraft", "tag": "v0.21.1", "title": "EffectCraft", "blurb": "Motion graphics and compositing" },
  { "slug": "gridcraft", "repo": "storytold/gridcraft", "tag": "v0.16.1", "title": "GridCraft", "blurb": "Spreadsheet" },
  { "slug": "cadcraft", "repo": "storytold/cadcraft", "tag": "v0.17.1", "title": "CadCraft", "blurb": "CAD and drafting" },
  { "slug": "deckcraft", "repo": "storytold/deckcraft", "tag": "v0.15.1", "title": "DeckCraft", "blurb": "Presentations" },
  { "slug": "soundcraft", "repo": "storytold/soundcraft", "tag": "v0.17.1", "title": "SoundCraft", "blurb": "Pro audio workstation" },
  { "slug": "wordcraft", "repo": "storytold/wordcraft", "tag": "v0.15.2", "title": "WordCraft", "blurb": "Word processor" },
  { "slug": "figcraft", "repo": "storytold/figcraft", "tag": "v0.15.1", "title": "FigCraft", "blurb": "Interface design and prototyping" },
  { "slug": "texturecraft", "repo": "storytold/texturecraft", "tag": "v0.3.2", "title": "TextureCraft", "blurb": "3D texture painting" },
  { "slug": "materialcraft", "repo": "storytold/materialcraft", "tag": "v0.1.2", "title": "MaterialCraft", "blurb": "Node-based material designer" }
]
```

- [ ] **Step 2: Write scripts/fetch-bundles.mjs**

```js
import { createWriteStream, existsSync, mkdirSync, rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import path from "node:path";

const root = new URL("..", import.meta.url).pathname;
const apps = JSON.parse(await readFile(new URL("../apps.json", import.meta.url), "utf8"));
const outDir = path.join(root, "public", "bundles");
mkdirSync(outDir, { recursive: true });

for (const app of apps) {
  const assetBase = app.slug === "craft-launcher" ? "artcraft-launcher" : app.slug;
  const zipName = `${assetBase}-web-${app.tag.replace(/^v/, "")}.zip`;
  const url = `https://github.com/${app.repo}/releases/download/${app.tag}/${zipName}`;
  const dest = path.join(outDir, `${app.slug}.zip`);
  console.log(`fetch ${app.slug} ${url}`);
  await download(url, dest);
  const slugDir = path.join(outDir, app.slug);
  rmSync(slugDir, { recursive: true, force: true });
  mkdirSync(slugDir, { recursive: true });
  execSync(`powershell -Command "Expand-Archive -Force '${dest}' '${slugDir}-tmp'"`, { stdio: "inherit" });
  // zip contains top-level folder <name>/ — flatten one level
  const { readdirSync, renameSync, rmSync: rm2 } = await import("node:fs");
  const tmp = `${slugDir}-tmp`;
  const entries = readdirSync(tmp);
  const inner = entries.length === 1 ? path.join(tmp, entries[0]) : tmp;
  for (const e of readdirSync(inner)) renameSync(path.join(inner, e), path.join(slugDir, e));
  rm2(tmp, { recursive: true, force: true });
  if (!existsSync(path.join(slugDir, "index.html"))) throw new Error(`${app.slug}: index.html missing after unzip`);
  console.log(`ok ${app.slug}`);
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith("https") ? import("node:https") : import("node:http");
    proto.then(({ get }) => {
      get(url, { headers: { "User-Agent": "craft-web-registry" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          download(res.headers.location, dest).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) { reject(new Error(`${url}: HTTP ${res.statusCode}`)); res.resume(); return; }
        const f = createWriteStream(dest);
        res.pipe(f);
        f.on("finish", () => f.close(resolve));
        f.on("error", reject);
      }).on("error", reject);
    }, reject);
  });
}
```

- [ ] **Step 3: Write scripts/verify.mjs**

```js
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

const apps = JSON.parse(await readFile(new URL("../apps.json", import.meta.url), "utf8"));
let fail = 0;
for (const app of apps) {
  const p = new URL(`../public/bundles/${app.slug}/index.html`, import.meta.url);
  if (!existsSync(p)) { console.error(`MISSING ${app.slug}: ${p.pathname}`); fail = 1; }
}
if (fail) { console.error("verify FAILED"); process.exit(1); }
console.log(`verify ok: ${apps.length} apps`);
```

- [ ] **Step 4: Run fetcher + verifier**

Run: `cd D:\Code\craft-web-registry && npm run build 2>&1 | tail -5`
Expected: all 15 `ok <slug>`, Next build succeeds. (First run downloads ~200MB.)

Run: `npm run verify`
Expected: `verify ok: 15 apps`

- [ ] **Step 5: Commit**

```bash
git add apps.json scripts
git commit -m "feat: fetch 15 Craft web bundles at build time"
```

### Task 3: Landing + app pages

**Files:**
- Create: `D:\Code\craft-web-registry\app\page.tsx`
- Create: `D:\Code\craft-web-registry\app\apps\[slug]\page.tsx`

- [ ] **Step 1: Write app/page.tsx**

```tsx
import apps from "../../apps.json";

export default function Home() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <h1>Craft Web Registry</h1>
      <p>Storytold Craft apps on the web. Pick one to launch.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
        {(apps as { slug: string; title: string; blurb: string; tag: string }[]).map((a) => (
          <a key={a.slug} href={`/apps/${a.slug}`} style={{ border: "1px solid #333", borderRadius: 8, padding: 16, textDecoration: "none" }}>
            <h3 style={{ margin: "0 0 8px" }}>{a.title}</h3>
            <p style={{ margin: "0 0 8px", color: "#888" }}>{a.blurb}</p>
            <small style={{ color: "#666" }}>{a.tag}</small>
          </a>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Write app/apps/[slug]/page.tsx**

```tsx
import { notFound } from "next/navigation";
import apps from "../../../apps.json";

type App = { slug: string; title: string; tag: string };

export function generateStaticParams() {
  return (apps as App[]).map((a) => ({ slug: a.slug }));
}

export default function AppPage({ params, searchParams }: { params: { slug: string }; searchParams?: { webgl?: string } }) {
  const app = (apps as App[]).find((a) => a.slug === params.slug);
  if (!app) notFound();
  const src = `/bundles/${app.slug}/index.html${searchParams?.webgl !== undefined ? "?webgl" : ""}`;
  return (
    <main style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 16px", borderBottom: "1px solid #333" }}>
        <a href="/">← All apps</a>
        <strong>{app.title}</strong>
        <small style={{ color: "#666" }}>{app.tag}</small>
        <a href={src} style={{ marginLeft: "auto" }}>Reload</a>
      </header>
      <iframe src={src} title={app.title} allow="fullscreen; clipboard-read; clipboard-write" allowFullScreen style={{ flex: 1, width: "100%", border: 0 }} />
    </main>
  );
}
```

- [ ] **Step 3: Typecheck + commit**

Run: `cd D:\Code\craft-web-registry && npx tsc --noEmit`
Expected: no errors.

```bash
git add app/page.tsx "app/apps/[slug]/page.tsx"
git commit -m "feat: landing grid and per-app iframe pages"
```

### Task 4: Docker, compose, CI, README

**Files:**
- Create: `D:\Code\craft-web-registry\Dockerfile`
- Create: `D:\Code\craft-web-registry\docker-compose.yml`
- Create: `D:\Code\craft-web-registry\.github\workflows\docker.yml`
- Create: `D:\Code\craft-web-registry\README.md`

- [ ] **Step 1: Write Dockerfile**

```dockerfile
FROM node:20-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends curl unzip && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://localhost:3000/').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
```

Hmm — Expand-Archive is Windows-only; Linux build needs `unzip`. Fix: replace the powershell line in fetch-bundles.mjs with `unzip -o dest -d tmp`. Do that fix inline in this task before building.

- [ ] **Step 2: Patch fetcher for Linux (unzip)**

Replace in `scripts/fetch-bundles.mjs`:
old: `execSync(\`powershell -Command "Expand-Archive -Force '${dest}' '${slugDir}-tmp'"\`, { stdio: "inherit" });`
new: `execSync(\`unzip -o "${dest}" -d "${slugDir}-tmp"\`, { stdio: "inherit" });`
Keep Windows compat: try unzip, fall back to powershell:
```js
try { execSync(`unzip -o "${dest}" -d "${slugDir}-tmp"`, { stdio: "inherit" }); }
catch { execSync(`powershell -Command "Expand-Archive -Force '${dest}' '${slugDir}-tmp'"`, { stdio: "inherit" }); }
```

- [ ] **Step 3: Write docker-compose.yml**

```yaml
services:
  web:
    image: ghcr.io/storytold/craft-web-registry:latest
    ports:
      - "3000:3000"
    restart: unless-stopped
```

- [ ] **Step 4: Write .github/workflows/docker.yml**

```yaml
name: docker
on:
  push:
    branches: [main]
    tags: ["v*"]
permissions:
  contents: read
  packages: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-qemu-action@v3
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ghcr.io/storytold/craft-web-registry:latest,ghcr.io/storytold/craft-web-registry:${{ github.ref_name }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

- [ ] **Step 5: Write README.md**

```md
# Craft Web Registry

Next.js landing + per-app pages serving storytold Craft web bundles.
Bundles are fetched from GitHub releases at Docker build time.

## Local dev (no Docker)

npm install
npm run dev  # bundles must exist: node scripts/fetch-bundles.mjs first
```

## VPS

docker compose pull
docker compose up -d
# open http://<vps>:3000

## Update an app version

Edit `apps.json` tag, commit, tag `vX.Y.Z` to publish via Actions.
```

- [ ] **Step 6: Build + verify + commit**

Run: `cd D:\Code\craft-web-registry && docker build -t craft-web-registry:local .`
Expected: build succeeds, 15 bundles fetched.

Run: `docker run --rm -p 3000:3000 craft-web-registry:local & sleep 8; curl -s -o NUL -w "%{http_code}" http://localhost:3000/`
Expected: `200`. Then: `curl -sI http://localhost:3000/bundles/photocraft/index.html | findstr -i "content-type text/html"` and one `.wasm` under `/bundles/photocraft/` returns `application/wasm`.

```bash
git add Dockerfile docker-compose.yml .github README.md scripts/fetch-bundles.mjs
git commit -m "feat: docker, compose, GHCR publishing"
```

### Task 5: Ship

- [ ] **Step 1: Final verify + tag**

Run: `cd D:\Code\craft-web-registry && npm run verify && npx tsc --noEmit`
Expected: `verify ok: 15 apps`, no TS errors.

- [ ] **Step 2: Create GitHub repo + push + tag v0.1.0**

Run:
```bash
cd D:\Code\craft-web-registry
gh repo create storytold/craft-web-registry --public --source=. --push
git tag v0.1.0
git push origin v0.1.0
```
Expected: Actions builds and pushes `ghcr.io/storytold/craft-web-registry:latest`.
If `gh` is missing: print `git remote -v` and stop — user creates remote manually.

- [ ] **Step 3: VPS instructions output**

Print exactly:
```text
On VPS: docker compose pull && docker compose up -d (compose points at ghcr.io/storytold/craft-web-registry:latest)
```
