import { access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

const requiredFunctions = [
  "tldv-sync-transcripts",
  "market-news",
  "ai-suggest-tasks",
  "lemlist-sync",
  "semrush-sync",
  "supermetrics-sync",
  "fetch-linkedin-posts",
];

async function exists(filePath) {
  try {
    await access(filePath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const root = process.cwd();
  const missing = [];

  for (const fnName of requiredFunctions) {
    const entry = path.join(root, "supabase", "functions", fnName, "index.ts");
    const ok = await exists(entry);
    if (!ok) missing.push(entry);
  }

  const sharedFiles = [
    path.join(root, "supabase", "functions", "_shared", "ingestion.ts"),
    path.join(root, "supabase", "functions", "_shared", "claude.ts"),
  ];
  for (const shared of sharedFiles) {
    const ok = await exists(shared);
    if (!ok) missing.push(shared);
  }

  if (missing.length > 0) {
    console.error("Edge function smoke check failed. Missing files:");
    for (const miss of missing) console.error(`- ${miss}`);
    process.exit(1);
  }

  console.log("Edge function smoke check passed.");
}

main().catch((error) => {
  console.error("Smoke check errored:", error);
  process.exit(1);
});
