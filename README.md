# Craft Web Registry

Next.js landing + per-app pages serving storytold Craft web bundles.
Bundles are fetched from GitHub releases at Docker build time.

15 apps pinned in `apps.json` (anicraft excluded — no web release yet).

## Local dev (no Docker)

```sh
npm install
node scripts/fetch-bundles.mjs
npm run dev
```

## VPS

```sh
docker compose pull   # ghcr.io/dvteixeira24/craft-web-registry:latest
docker compose up -d
# open http://<vps>:3000
```

Behind a subpath (e.g. `/craft/`), strip the prefix when proxying —
bundle asset URLs are relative so no rebuild is needed.

## Update an app version

Edit `apps.json` tag, commit, tag `vX.Y.Z` to publish via Actions to GHCR.
