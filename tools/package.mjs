// Package the static game for the projector. An HTML entry with data-URL ES modules
// also works when a presenter opens the extracted folder directly from disk.
import { readFile, writeFile, mkdir, cp, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
const project = fileURLToPath(new URL("../", import.meta.url));
const out = join(project, "dist");
const cache = new Map();
async function portableModule(path) {
  if (cache.has(path)) return cache.get(path);
  let source = await readFile(path, "utf8");
  const imports = [...source.matchAll(/\bfrom\s+(['"])(\.\/[^'"]+\.js)\1/g)];
  for (const match of imports) {
    const url = await portableModule(resolve(dirname(path), match[2]));
    source = source.replace(match[0], "from '" + url + "'");
  }
  const url =
    "data:text/javascript;base64," + Buffer.from(source).toString("base64");
  cache.set(path, url);
  return url;
}
await mkdir(join(out, "src"), { recursive: true });
const entry = await portableModule(join(project, "src/app.js"));
const page = (await readFile(join(project, "index.html"), "utf8")).replace(
  'src="src/app.js"',
  'src="' + entry + '"',
);
await writeFile(join(out, "index.html"), page);
await cp(join(project, "assets"), join(out, "assets"), { recursive: true });
for (const name of await readdir(join(project, "src"))) {
  if (name.endsWith(".css"))
    await cp(join(project, "src", name), join(out, "src", name));
}
console.log("Presentation copy ready in dist/index.html");
