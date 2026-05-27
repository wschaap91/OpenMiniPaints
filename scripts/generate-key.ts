/**
 * Generate a new API key and register it in the Convex database.
 *
 * Usage:
 *   npx tsx scripts/generate-key.ts <label>
 *
 * The raw key is printed ONCE. Store it securely — it cannot be recovered.
 * The database stores only a SHA-256 hash.
 *
 * Prerequisites:
 *   1. Run `npx convex dev --configure new --project open-mini-paints` to link the project.
 *   2. Ensure CONVEX_DEPLOY_KEY is set (exported from the Convex dashboard → Settings → Deploy Key).
 *      The key is used by `convex run` to call the internal mutation.
 *
 * How it works:
 *   This script generates the raw key + hash locally, then delegates the
 *   database insert to `npx convex run apiKeys:createKey` which can call
 *   internal Convex mutations via the admin API. The CLI is invoked via
 *   spawnSync with an explicit argument array — no shell is involved, so
 *   the label value cannot inject shell commands.
 */

import { createHash, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";

async function main() {
  if (process.env.CI) {
    console.error(
      "generate-key must not be run in CI — key would be exposed in build logs."
    );
    process.exit(1);
  }

  const label = process.argv[2];
  if (!label) {
    console.error("Usage: npx tsx scripts/generate-key.ts <label>");
    process.exit(1);
  }

  // Generate a cryptographically secure 32-byte random key.
  const rawKey = randomBytes(32).toString("hex");

  // Hash the key for storage — we never store the raw value.
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  // Call the internal Convex mutation via the CLI.
  // spawnSync with an explicit argument array avoids shell invocation entirely,
  // preventing shell injection via the label argument.
  // CONVEX_DEPLOY_KEY and CONVEX_DEPLOYMENT from .env.local are picked up
  // automatically from the inherited process environment.
  const args = JSON.stringify({ keyHash, label });
  const result = spawnSync("npx", ["convex", "run", "apiKeys:createKey", args], {
    stdio: "inherit",
  });

  if (result.status !== 0) {
    console.error(
      "\nFailed to insert key into Convex. Make sure:\n" +
        "  • CONVEX_DEPLOYMENT is set in .env.local\n" +
        "  • The deployment is reachable (run `npx convex dev --once` first if needed)\n"
    );
    process.exit(1);
  }

  console.log("\n========================================");
  console.log("  API key generated for:", label);
  console.log("========================================");
  console.log("\n  Key (save this — it will NOT be shown again):");
  console.log("\n  " + rawKey);
  console.log("\n========================================\n");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
