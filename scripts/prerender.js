/*
 * Post-build prerender.
 *
 * CRA ships an empty <div id="root">, so crawlers and AI fetchers that don't
 * run JavaScript see nothing. This script renders the real <Main /> component
 * tree to static HTML and writes it into build/index.html, then adds a
 * schema.org ItemList generated from src/data/projects.js so the structured
 * data always matches the project cards. src/index.js hydrates the markup.
 *
 * Runs automatically after `npm run build` / `yarn build` (postbuild).
 */
"use strict";

process.env.BABEL_ENV = "test"; // babel-preset-react-app emits CommonJS for Node in "test"
process.env.NODE_ENV = "production";

const fs = require("fs");
const path = require("path");
const Module = require("module");
const babel = require("@babel/core");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const BUILD = path.join(ROOT, "build");
const SITE = "https://marcustravis.com/";

const manifest = JSON.parse(
  fs.readFileSync(path.join(BUILD, "asset-manifest.json"), "utf8")
).files;

// Images: use the same hashed file (or inlined data URI) webpack produced.
function assetUrl(file) {
  const rel = path.relative(SRC, file).split(path.sep).join("/");
  const key = Object.keys(manifest).find(
    (k) => k === "static/media/" + path.basename(rel) || k.endsWith("/" + path.basename(rel))
  );
  if (key) return manifest[key];
  const ext = path.extname(file).slice(1).toLowerCase();
  const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "svg" ? "image/svg+xml" : "image/" + ext;
  return "data:" + mime + ";base64," + fs.readFileSync(file).toString("base64");
}

for (const ext of [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"]) {
  Module._extensions[ext] = (mod, filename) => {
    mod.exports = assetUrl(filename);
  };
  Module._extensions[ext.toUpperCase()] = Module._extensions[ext];
}
Module._extensions[".css"] = () => {};

const origJs = Module._extensions[".js"];
Module._extensions[".js"] = (mod, filename) => {
  if (!filename.startsWith(SRC)) return origJs(mod, filename);
  const { code } = babel.transformSync(fs.readFileSync(filename, "utf8"), {
    filename,
    babelrc: false,
    configFile: false,
    presets: [require.resolve("babel-preset-react-app")],
  });
  mod._compile(code, filename);
};

const React = require("react");
const ReactDOMServer = require("react-dom/server");
const interop = (m) => (m && m.__esModule ? m.default : m);
const Main = interop(require(path.join(SRC, "components/Main")));
const projects = interop(require(path.join(SRC, "data/projects")));

const appHtml = ReactDOMServer.renderToString(
  React.createElement("div", { className: "App" }, React.createElement(Main))
);

const itemList = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "@id": SITE + "#projects",
  name: "Free, ad-free web tools by Marcus Travis",
  numberOfItems: projects.length,
  itemListElement: projects.map((p, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "WebSite",
      name: p.name,
      url: p.url,
      description: p.description,
      isAccessibleForFree: true,
      creator: { "@id": SITE + "#person" },
    },
  })),
};
const jsonLd = JSON.stringify(itemList).replace(/</g, "\\u003c");

const indexPath = path.join(BUILD, "index.html");
let html = fs.readFileSync(indexPath, "utf8");
if (!html.includes('<div id="root"></div>')) {
  throw new Error("prerender: empty #root not found in build/index.html");
}
html = html
  .replace('<div id="root"></div>', '<div id="root">' + appHtml + "</div>")
  .replace(
    "</head>",
    '<script type="application/ld+json">' + jsonLd + "</script></head>"
  );
fs.writeFileSync(indexPath, html);

const required = ["Marcus Travis", "On evenings and weekends I build fast, useful websites"]
  .concat(projects.map((p) => p.url));
const missing = required.filter((s) => !html.includes(s));
if (missing.length) throw new Error("prerender: missing from output: " + missing.join(", "));

// llms.txt is hand-written; warn (don't fail) if a project card is missing from it.
const llmsPath = path.join(BUILD, "llms.txt");
if (fs.existsSync(llmsPath)) {
  const llms = fs.readFileSync(llmsPath, "utf8");
  const notListed = projects.filter((p) => !llms.includes(p.url));
  if (notListed.length) {
    console.warn("prerender: WARNING public/llms.txt is missing: " + notListed.map((p) => p.name).join(", "));
  }
}

console.log(
  "prerender: wrote " + appHtml.length + " chars of static HTML and an ItemList of " +
    projects.length + " projects into build/index.html"
);
