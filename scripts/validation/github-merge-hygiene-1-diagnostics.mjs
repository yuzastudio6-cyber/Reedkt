import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const failures = [];

const requiredFiles = [
  "docs/github-merge-hygiene/merge-hygiene-1-current-pr-state.md",
  "docs/github-merge-hygiene/merge-hygiene-1-parent-first-merge-execution-plan.md",
  "docs/github-merge-hygiene/merge-hygiene-1-merge-decision-record.md",
  "docs/github-merge-hygiene/merge-hygiene-1-post-merge-results.md",
  "docs/prompt-merge-hygiene-1-validation-results.md",
  "docs/implementation-prompts/prompt-merge-hygiene-1-parent-first-merge-execution.md",
];

const requiredPrs = [
  330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343,
  344, 345, 346, 347, 348, 349, 350, 351,
];

const criticalPrs = [331, 334, 340, 343, 347];
const draftPrs = [351, 348, 345, 344, 339, 338, 336, 335, 333, 332];
const mergedReferencePrs = [341, 342, 346];

function readRequired(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing required file: ${relativePath}`);
    return "";
  }

  return fs.readFileSync(absolutePath, "utf8");
}

const fileEntries = requiredFiles.map((file) => [file, readRequired(file)]);
const fileText = new Map(fileEntries);
const allText = fileEntries.map(([, text]) => text).join("\n");

for (const pr of requiredPrs) {
  if (!allText.includes(`#${pr}`)) {
    failures.push(`Missing required PR reference: #${pr}`);
  }
}

for (const pr of criticalPrs) {
  if (!allText.includes(`#${pr}`) || !allText.includes("eligible")) {
    failures.push(`Critical/downstream PR #${pr} is not recorded as eligible or preserved`);
  }
}

for (const pr of draftPrs) {
  const draftPattern = new RegExp(`#${pr}[\\s\\S]{0,220}(draft|preserved_for_later_owner_review)`, "i");
  if (!draftPattern.test(allText)) {
    failures.push(`Draft PR #${pr} is not clearly preserved for later owner review`);
  }
}

for (const pr of mergedReferencePrs) {
  const referencePattern = new RegExp(`#${pr}[\\s\\S]{0,180}(merged|reference)`, "i");
  if (!referencePattern.test(allText)) {
    failures.push(`Merged reference PR #${pr} is not recorded as reference evidence`);
  }
}

for (const state of [
  "merge_execution_packet_only",
  "parent_first_merge_executed",
  "blocked_pending_owner_approval",
  "blocked_pending_parent_merge",
  "blocked_pending_ci",
  "blocked_pending_review",
  "blocked_pending_rebase",
  "blocked_duplicate_or_superseded_review",
]) {
  if (!allText.includes(state)) {
    failures.push(`Missing required merge hygiene state: ${state}`);
  }
}

const decisionRecord = fileText.get("docs/github-merge-hygiene/merge-hygiene-1-merge-decision-record.md") ?? "";
for (const [key, value] of [
  ["decisionState", "merge_execution_packet_only"],
  ["ownerApprovedMergeExecution", "false"],
  ["mergedAnyPr", "false"],
  ["mergedDraftPr", "false"],
  ["mergedBlockedPr", "false"],
  ["closedPr", "false"],
  ["deletedBranch", "false"],
  ["runtimeEnabled", "false"],
  ["productionEnabled", "false"],
  ["betaEnabled", "false"],
  ["supabaseMutationEnabled", "false"],
]) {
  const pattern = new RegExp(`${key}:\\s*${value}\\b`);
  if (!pattern.test(decisionRecord)) {
    failures.push(`Decision record missing ${key}: ${value}`);
  }
}

for (const phrase of [
  "Supabase update required: `docs/status only`",
  "Supabase update status: `docs_only`",
  "Supabase environment touched: `none`",
  "SQL executed: `none`",
  "Migration deployed: `no`",
]) {
  if (!allText.includes(phrase)) {
    failures.push(`Missing Supabase docs-only phrase: ${phrase}`);
  }
}

const noScope =
  "No unauthorized PR merge, branch deletion, Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.";

if (!allText.includes(noScope)) {
  failures.push("Missing exact MERGE-HYGIENE-1 no-scope statement");
}

for (const forbidden of [
  /ownerApprovedMergeExecution:\s*true/i,
  /mergedAnyPr:\s*true/i,
  /mergedDraftPr:\s*true/i,
  /mergedBlockedPr:\s*true/i,
  /closedPr:\s*true/i,
  /deletedBranch:\s*true/i,
  /runtimeEnabled:\s*true/i,
  /productionEnabled:\s*true/i,
  /betaEnabled:\s*true/i,
  /supabaseMutationEnabled:\s*true/i,
  /\bMERGE-HYGIENE-1 merged PR #\d+\b/i,
  /\bMERGE-HYGIENE-1 closed PR #\d+\b/i,
  /\bMERGE-HYGIENE-1 deleted branch\b/i,
  /\bproduction unlocked\b/i,
  /\binternal beta unlocked\b/i,
  /\bexternal beta unlocked\b/i,
  /\bSupabase mutation (was )?enabled:\s*`?(true|yes)`?/i,
  /\bSQL executed:\s*`?(true|yes|staging|production)`?/i,
  /\bprovider call (was )?enabled\b/i,
  /\bmodel call (was )?enabled\b/i,
  /\btool execution (was )?enabled\b/i,
  /\bworker execution (was )?enabled\b/i,
  /\broute execution (was )?enabled\b/i,
  /\bsigned URL created\b/i,
  /\bpublic artifact created\b/i,
]) {
  const match = allText.match(forbidden);
  if (match) {
    failures.push(`Forbidden unsafe claim matched: ${match[0]}`);
  }
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (
  packageJson.scripts?.["merge-hygiene:1:diagnostics"] !==
  "node scripts/validation/github-merge-hygiene-1-diagnostics.mjs"
) {
  failures.push("package.json missing merge-hygiene:1:diagnostics script");
}

if (fs.existsSync(path.join(root, "scripts/validation/run-foundation-validation.mjs"))) {
  failures.push("Foundation validation runner exists but MERGE-HYGIENE-1 diagnostic was not manually wired");
}

if (failures.length > 0) {
  console.error("MERGE-HYGIENE-1 diagnostics failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      status: "passed",
      decisionState: "merge_execution_packet_only",
      ownerApprovedMergeExecution: false,
      mergedAnyPr: false,
      criticalPrsChecked: criticalPrs.length,
      draftPrsPreserved: draftPrs.length,
      supabaseUpdateRequired: "docs/status only",
      supabaseUpdateStatus: "docs_only",
      supabaseEnvironmentTouched: "none",
      sqlExecuted: "none",
      migrationDeployed: "no",
      nextRecommendedPrompt: "MERGE-HYGIENE-2 - Downstream Branch Rebase/Retarget Plan",
    },
    null,
    2,
  ),
);
