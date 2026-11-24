import { createServer } from "node:http";
import { readFile, realpath } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, extname } from "node:path";
const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 4173);
const mime = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".woff2": "font/woff2",
};
const gameFile =
  /^\/(?:dist\/)?(?:index\.html|src\/[\w-]+\.(?:js|css)|assets\/(?:[\w-]+\/)*[\w-]+\.(?:svg|webp|png|woff2))$/;
createServer(async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  try {
    const requested = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    const gamePath =
      requested === "/" || requested === "/dist/"
        ? requested + "index.html"
        : requested;
    if (!gameFile.test(gamePath)) throw Error();
    const pathname = resolve(root, "." + gamePath);
    if ((await realpath(pathname)) !== pathname) throw Error();
    const bytes = await readFile(pathname);
    res.writeHead(200, {
      "Content-Type": mime[extname(pathname)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(req.method === "HEAD" ? undefined : bytes);
  } catch {
    res.writeHead(404);
    res.end("Page unavailable");
  }
}).listen(port, "127.0.0.1", () =>
  console.log("PolamLife is running at http://127.0.0.1:" + port),
);
