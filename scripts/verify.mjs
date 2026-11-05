import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const apps = JSON.parse(await readFile(path.join(root, "apps.json"), "utf8"));
let fail = 0;
for (const app of apps) {
  const p = path.join(root, "public", "bundles", app.slug, "index.html");
  if (!existsSync(p)) {
    console.error(`MISSING ${app.slug}: ${p}`);
    fail = 1;
  }
}
if (fail) {
  console.error("verify FAILED");
  process.exit(1);
}
console.log(`verify ok: ${apps.length} apps`);
