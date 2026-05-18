#!/usr/bin/env node
// CI guard: fails build if any high/critical npm advisory is present.
import { execSync } from "node:child_process";

try {
  const out = execSync("npm audit --json", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  const data = JSON.parse(out);
  const vulns = data?.metadata?.vulnerabilities ?? {};
  const high = (vulns.high ?? 0) + (vulns.critical ?? 0);
  console.log("Audit summary:", vulns);
  if (high > 0) {
    console.error(`\n❌ ${high} high/critical vulnerabilit${high === 1 ? "y" : "ies"} detected. Failing build.`);
    process.exit(1);
  }
  console.log("✅ No high or critical vulnerabilities.");
} catch (e) {
  if (e.stdout) {
    try {
      const data = JSON.parse(e.stdout.toString());
      const vulns = data?.metadata?.vulnerabilities ?? {};
      const high = (vulns.high ?? 0) + (vulns.critical ?? 0);
      console.log("Audit summary:", vulns);
      if (high > 0) { console.error(`❌ ${high} high/critical advisories`); process.exit(1); }
      console.log("✅ No high or critical vulnerabilities.");
      process.exit(0);
    } catch {}
  }
  console.error("Audit failed to run:", e.message);
  process.exit(1);
}
