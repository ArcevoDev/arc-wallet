#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const OUTPUT = path.join(ROOT, "arcwallet_codebase_snapshot.txt");
const IGNORE_DIRS = new Set([
  "node_modules",
  ".expo",
  ".git",
  ".agent",
  ".commandcode",
  ".vscode",
  "assets",
  "docs",
]);
const IGNORE_FILES = new Set([
  ".gitignore",
  ".npmrc",
  "pnpm-lock.yaml",
  "arcwallet_codebase_snapshot.txt",
  "package-lock.json",
  "yarn.lock",
]);

const extensions = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".css",
  ".md",
  ".env",
  ".yaml",
  ".yml",
  ".sh",
  ".mjs",
  ".cjs",
]);

function walk(dir) {
  const entries = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
      entries.push(...walk(full));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (!extensions.has(ext)) continue;
      if (IGNORE_FILES.has(entry.name)) continue;
      entries.push(full);
    }
  }
  return entries;
}

const files = walk(ROOT).sort();
const lines = [];

for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  const ext = path.extname(file).slice(1);
  lines.push(`// File: ${rel} (${ext})`);
  lines.push(fs.readFileSync(file, "utf8").trimEnd());
  lines.push("");
  lines.push("");
}

fs.writeFileSync(OUTPUT, lines.join("\n"));
console.log(`Snapshot written to ${OUTPUT} (${(fs.statSync(OUTPUT).size / 1024).toFixed(1)} KB)`);
