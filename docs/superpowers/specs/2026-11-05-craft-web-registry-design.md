# Craft Web Registry — Design

Date: 2026-11-05
Scope: Craft suite only (~16 Rust Craft apps). Approach A: build-time fetch.

## Goal

Single repo in `D:\Code\craft-web-registry`: Next.js app with landing + per-app
pages serving storytold Craft web bundles. VPS: `docker compose pull && up`
usable from browser, no local install. Images published to GHCR via Actions.

## Architecture

- Next.js App Router + TypeScript, `output: standalone`.
- One container. Build stage downloads each `*-web.zip` from
  `github.com/storytold/<repo>/releases/download/<tag>/` and unzips to
  `public/bundles/<slug>/`. Runtime serves static, no DB, no volumes.
- `docker-compose.yml`: service `web`, `image: ghcr.io/<owner>/craft-web-registry:latest`,
  `ports: ["3000:3000"]`, `restart: unless-stopped`. Image:
  `ghcr.io/storytold/craft-web-registry:latest` (override owner via var).
- Reverse-proxy ready: relative `./` asset URLs work under subpath; document
  `/craft/` prefix strip example. HTTPS via proxy for WebGPU/clipboard.

## Components

- `apps.json`: `[{slug, repo, tag, title, blurb}]`. Day-one slugs
  (16): photocraft, pdfcraft, filmcraft, vectorcraft, lightcraft, designcraft,
  effectcraft, gridcraft, cadcraft, deckcraft, soundcraft, wordcraft, figcraft,
  anicraft, texturecraft, materialcraft. Tags pinned per repo latest `-web` release.
- `/`: landing grid of cards (title, blurb, version tag, Launch button).
- `/apps/[slug]`: header (back link, title, `?webgl` fallback toggle) +
  full-viewport iframe `src=/bundles/<slug>/index.html`,
  `allow="fullscreen; clipboard-read; clipboard-write"`.
- `scripts/fetch-bundles.mjs`: download + unzip + verify `index.html` exists;
  fails build loudly on 404/hash mismatch.
- `next.config`: `.wasm` → `application/wasm`; cache headers per HOSTING.md
  (`index.html`, `app/<app>.js`, `app/parts.txt` → `no-cache`;
  hashed `*.wasm/*.js/*.part-*` → `immutable`).
- CI `.github/workflows/docker.yml`: on tag `v*` + main, buildx (amd64/arm64),
  push to GHCR, attestations.

## Data flow

1. Edit `apps.json` tag to update an app.
2. `docker compose build` runs `fetch-bundles.mjs` then `next build`.
3. Container serves `/bundles/<slug>/index.html` + landing + app pages.
4. No runtime GitHub calls → no rate limits, deterministic builds.

## Error handling

- Missing bundle at build: fail with slug + URL + HTTP status.
- Unknown slug at runtime: `notFound()` page with link to release.
- Bundle without `index.html`: build fails.
- iframe load failure: stalled message from upstream page surfaces; app page
  adds Reload button.

## Testing

- `npm run verify`: every `apps.json` slug has `public/bundles/<slug>/index.html`.
- Build smoke: `curl` landing `/` 200, one bundle `index.html` 200 with
  `content-type: text/html`, one `.wasm` with `application/wasm`.
- Manual: launch 2 apps, open + save/export a file, `?webgl` toggle.

## Non-goals (v1)

- No runtime auto-update, no admin refresh endpoint, no auth, no per-app
  containers, no server-side storage. Rebuild to update.
