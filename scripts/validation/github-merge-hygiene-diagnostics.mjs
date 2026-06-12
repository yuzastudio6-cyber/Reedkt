import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const requiredFiles = [
  "docs/github-merge-hygiene/milestone-pr-stack-audit.md",
  "docs/github-merge-hygiene/milestone-merge-order.md",
  "docs/github-merge-hygiene/superseded-duplicate-pr-register.md",
  "docs/github-merge-hygiene/major-milestone-merge-rule.md",
  "docs/github-merge-hygiene/next-merge-execution-prompt.md",
  "docs/github-merge-hygiene/prompt-merge-execution-1-critical-model-worker-chain.md",
  "docs/activation-phase-merge-hygiene-0-results.md",
];

const requiredPrs = [
  296, 307, 315, 318, 322, 323, 326, 329, 330, 331, 332, 333, 334, 335,
  336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347,
];

const requiredOpenPrs = [331, 334, 340, 343, 347];
const requiredMergedPrs = [341, 342, 346];

const failures = [];

function readRequired(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing required file: ${relativePath}`);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

const fileText = new Map(
  requiredFiles.map((file) => [file, readRequired(file)]),
);

const allDocs = [...fileText.values()].join("\n");

for (const pr of requiredPrs) {
  if (!allDocs.includes(`#${pr}`)) {
    failures.push(`Missing required PR reference: #${pr}`);
  }
}

const mergeRule = fileText.get("docs/github-merge-hygiene/major-milestone-merge-rule.md") ?? "";
for (const state of [
  "merged",
  "ready_for_merge_execution",
  "blocked_with_reason",
  "deferred_with_owner",
  "superseded_by_pr",
  "rejected_or_closed",
]) {
  if (!mergeRule.includes(state)) {
    failures.push(`Major milestone rule missing state: ${state}`);
  }
}

const mergeOrder = fileText.get("docs/github-merge-hygiene/milestone-merge-order.md") ?? "";
const expectedOrder = ["#331", "#334", "#340", "#343"];
let lastIndex = -1;
for (const marker of expectedOrder) {
  const index = mergeOrder.indexOf(marker);
  if (index === -1) {
    failures.push(`Merge order missing ${marker}`);
  } else if (index < lastIndex) {
    failures.push(`Merge order is out of order at ${marker}`);
  }
  lastIndex = index;
}

const stackAudit = fileText.get("docs/github-merge-hygiene/milestone-pr-stack-audit.md") ?? "";
for (const pr of requiredOpenPrs) {
  const pattern = new RegExp(`\\| #${pr} \\|[^\\n]*\\| open \\|`, "i");
  if (!pattern.test(stackAudit)) {
    failures.push(`Open PR #${pr} is not recorded as open in stack audit`);
  }
  const mergedPattern = new RegExp(`\\| #${pr} \\|[^\\n]*\\| merged \\|`, "i");
  if (mergedPattern.test(stackAudit)) {
    failures.push(`Open PR #${pr} is incorrectly recorded as merged`);
  }
}

for (const pr of requiredMergedPrs) {
  const pattern = new RegExp(`\\| #${pr} \\|[^\\n]*\\| merged \\|`, "i");
  if (!pattern.test(stackAudit)) {
    failures.push(`Merged reference PR #${pr} is not recorded as merged`);
  }
}

const requiredSafetyPhrases = [
  "No PRs were merged, closed, retargeted",
  "Supabase environment touched: `none`",
  "SQL executed: `none`",
  "Migration deployed: `no`",
  "No provider/model/tool/worker/route/runtime execution occurred",
];

const results = fileText.get("docs/activation-phase-merge-hygiene-0-results.md") ?? "";
for (const phrase of requiredSafetyPhrases) {
  if (!results.includes(phrase)) {
    failures.push(`Results doc missing safety phrase: ${phrase}`);
  }
}

const forbiddenPatterns = [
  /\bproduction\s+unlocked\b/i,
  /\bexternal\s+beta\s+unlocked\b/i,
  /\bpublic\s+artifact\s+created\b/i,
  /\bsigned\s+url\s+created\b/i,
  /\bSQL executed:\s*`?true`?\b/i,
  /\bMigration deployed:\s*`?yes`?\b/i,
  /\bSupabase environment touched:\s*`?(staging|production)`?\b/i,
  /\bprovider payload\b.*\bstored\b/i,
  /\braw prompt\b.*\bstored\b/i,
];

for (const pattern of forbiddenPatterns) {
  const match = allDocs.match(pattern);
  if (match) {
    failures.push(`Forbidden unsafe claim matched: ${match[0]}`);
  }
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (packageJson.scripts?.["merge-hygiene:diagnostics"] !== "node scripts/validation/github-merge-hygiene-diagnostics.mjs") {
  failures.push("package.json missing merge-hygiene:diagnostics script");
}

if (failures.length > 0) {
  console.error("MERGE-HYGIENE-0 diagnostics failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("MERGE-HYGIENE-0 diagnostics passed");
