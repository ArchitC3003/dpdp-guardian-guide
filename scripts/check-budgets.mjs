// Ratchets: existing lint errors and the first-load script may shrink, never grow.
// Run after `vite build`. Lower the numbers in budgets.json whenever the real figure drops.
import { spawnSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";

const budgets = JSON.parse(readFileSync(new URL("./budgets.json", import.meta.url), "utf8"));
const failures = [];

const lint = spawnSync("node_modules/.bin/eslint", [".", "-f", "json"], {
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});
let lintErrors;
try {
  lintErrors = JSON.parse(lint.stdout).reduce((sum, file) => sum + file.errorCount, 0);
} catch {
  console.error(lint.stderr || lint.stdout);
  throw new Error("Could not read the lint report");
}
console.log(`Lint errors: ${lintErrors} (limit ${budgets.lintErrors})`);
if (lintErrors > budgets.lintErrors) {
  failures.push(`Lint errors rose to ${lintErrors}; the limit is ${budgets.lintErrors}. Run "npm run lint" to see them.`);
}

const entry = readFileSync("dist/index.html", "utf8").match(/assets\/index-[^"]+\.js/);
if (!entry) throw new Error("No entry script found in dist/index.html; run the build first");
const entryKb = Math.round(statSync(`dist/${entry[0]}`).size / 1000);
console.log(`First-load script: ${entryKb} kB (limit ${budgets.entryScriptKb} kB)`);
if (entryKb > budgets.entryScriptKb) {
  failures.push(`First-load script grew to ${entryKb} kB; the limit is ${budgets.entryScriptKb} kB. Load the new code on demand instead.`);
}

if (failures.length) {
  failures.forEach((f) => console.error(`FAIL: ${f}`));
  process.exit(1);
}
