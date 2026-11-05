import { createWriteStream, existsSync, mkdirSync, rmSync, readdirSync, renameSync, writeFileSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { get } from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const apps = JSON.parse(await readFile(path.join(root, "apps.json"), "utf8"));
const outDir = path.join(root, "public", "bundles");
mkdirSync(outDir, { recursive: true });

// shortcut: anicraft has no web release yet; add it to apps.json once storytold/AniCraft ships one.
for (const app of apps) {
  const slugDir = path.join(outDir, app.slug);
  const tagFile = path.join(slugDir, ".fetch-tag");
  const wantTag = `${app.repo}@${app.tag}`;
  if (existsSync(path.join(slugDir, "index.html")) && existsSync(tagFile) && readFileSync(tagFile, "utf8").trim() === wantTag) {
    console.log(`skip ${app.slug} (already at ${app.tag})`);
    continue;
  }
  const zipName = `${app.slug}-web-${app.tag.replace(/^v/, "")}.zip`;
  const url = `https://github.com/${app.repo}/releases/download/${app.tag}/${zipName}`;
  const dest = path.join(outDir, `${app.slug}.zip`);
  console.log(`fetch ${app.slug} ${url}`);
  await download(url, dest);
  rmSync(slugDir, { recursive: true, force: true });
  const tmp = `${slugDir}-tmp`;
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  try {
    execSync(`unzip -o "${dest}" -d "${tmp}"`, { stdio: "inherit" });
  } catch {
    execSync(`powershell -Command "Expand-Archive -Force '${dest}' '${tmp}'"`, { stdio: "inherit" });
  }
  const entries = readdirSync(tmp);
  const inner = entries.length === 1 ? path.join(tmp, entries[0]) : tmp;
  mkdirSync(slugDir, { recursive: true });
  for (const e of readdirSync(inner)) renameSync(path.join(inner, e), path.join(slugDir, e));
  rmSync(tmp, { recursive: true, force: true });
  if (!existsSync(path.join(slugDir, "index.html"))) throw new Error(`${app.slug}: index.html missing after unzip`);
  rmSync(dest, { force: true });
  writeFileSync(tagFile, wantTag + "\n");
  console.log(`ok ${app.slug}`);
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    get(url, { headers: { "User-Agent": "craft-web-registry" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        download(res.headers.location, dest).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`${url}: HTTP ${res.statusCode}`));
        res.resume();
        return;
      }
      const f = createWriteStream(dest);
      res.pipe(f);
      f.on("finish", () => f.close(resolve));
      f.on("error", reject);
    }).on("error", reject);
  });
}
