import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const failures = [];

const requiredFiles = [
  "docs/github-merge-hygiene/merge-hygiene-3-live-pr-recheck.md",
  "docs/github-merge-hygiene/merge-hygiene-3-approved-update-actions.md",
  "docs/github-merge-hygiene/merge-hygiene-3-update-results.md",
  "docs/github-merge-hygiene/merge-hygiene-3-ready-state-recommendations.md",
  "docs/prompt-merge-hygiene-3-validation-results.md",
  "docs/implementation-prompts/prompt-merge-hygiene-3-owner-approved-downstream-rebase-retarget-execution.md",
];

function readRequired(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing required file: ${relativePath}`);
    return "";
  }

  return fs.readFileSync(absolutePath, "utf8");
}

const entries = requiredFiles.map((file) => [file, readRequired(file)]);
const allText = entries.map(([, text]) => text).join("\n");

const requiredPrs = [
  333, 352, 355, 348, 345, 344, 339, 338, 336, 335, 332, 349, 350, 337,
  327, 325, 324, 322, 320, 330, 354, 356, 357, 331, 334, 340, 343, 347, 353,
];

for (const pr of requiredPrs) {
  if (!allText.includes(`#${pr}`)) {
    failures.push(`Missing required PR reference: #${pr}`);
  }
}

for (const phrase of [
  "OWNER_APPROVES_DOWNSTREAM_REBASE_RETARGET_EXECUTION=true",
  "owner_approved_update_attempt_completed",
  "live_recheck_completed",
  "blocked_conflict",
  "ready_state_recommendations_created",
  "Rebase executed: `false`",
  "Retarget executed: `false`",
  "Branch update executed: `false`",
  "PRs merged: `false`",
  "PRs closed: `false`",
  "Branches deleted: `false`",
  "skipped_draft",
  "skipped_duplicate_review",
  "skipped_no_longer_needed",
  "Supabase update required: `docs/status only`",
  "Supabase update status: `docs_only`",
  "Supabase environment touched: `none`",
  "SQL executed: `none`",
  "Migration deployed: `no`",
]) {
  if (!allText.includes(phrase)) {
    failures.push(`Missing required phrase: ${phrase}`);
  }
}

const noScope =
  "No PR merge, PR close, branch deletion, unauthorized rebase, unauthorized retarget, Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.";

if (!allText.includes(noScope)) {
  failures.push("Missing exact MERGE-HYGIENE-3 no-scope statement");
}

const forbiddenPatterns = [
  /\bRebase executed:\s*`?true`?/i,
  /\bRetarget executed:\s*`?true`?/i,
  /\bPR merge executed:\s*`?true`?/i,
  /\bPR close executed:\s*`?true`?/i,
  /\bBranch deletion executed:\s*`?true`?/i,
  /\bPRs merged:\s*`?true`?/i,
  /\bPRs closed:\s*`?true`?/i,
  /\bBranches deleted:\s*`?true`?/i,
  /\bforced branch rewrite:\s*`?(true|yes)`?/i,
  /\bforce-pushed:\s*`?(true|yes)`?/i,
  /\bmerged PR #\d+\b/i,
  /\bclosed PR #\d+\b/i,
  /\bdeleted branch\b/i,
  /\bmarked ready:\s*`?(true|yes)`?/i,
  /\bproduction unlocked\b/i,
  /\binternal beta unlocked\b/i,
  /\bexternal beta unlocked\b/i,
  /\bSupabase mutation (was )?enabled:\s*`?(true|yes)`?/i,
  /\bSQL executed:\s*`?(true|yes|staging|production)`?/i,
  /\bprovider call (was )?enabled:\s*`?(true|yes)`?/i,
  /\bmodel call (was )?enabled:\s*`?(true|yes)`?/i,
  /\btool execution (was )?enabled:\s*`?(true|yes)`?/i,
  /\bworker execution (was )?enabled:\s*`?(true|yes)`?/i,
  /\broute execution (was )?enabled:\s*`?(true|yes)`?/i,
  /\bsigned URL created\b/i,
  /\bpublic artifact created\b/i,
];

for (const pattern of forbiddenPatterns) {
  const match = allText.match(pattern);
  if (match) {
    failures.push(`Forbidden unsafe claim matched: ${match[0]}`);
  }
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (
  packageJson.scripts?.["merge-hygiene:3:diagnostics"] !==
  "node scripts/validation/github-merge-hygiene-3-diagnostics.mjs"
) {
  failures.push("package.json missing merge-hygiene:3:diagnostics script");
}

if (fs.existsSync(path.join(root, "scripts/validation/run-foundation-validation.mjs"))) {
  failures.push("Foundation validation runner exists but MERGE-HYGIENE-3 diagnostic was not wired");
}

if (failures.length > 0) {
  console.error("MERGE-HYGIENE-3 diagnostics failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      status: "passed",
      ownerApprovalPresent: true,
      updateAttemptStatus: "blocked_conflict",
      branchUpdateExecuted: false,
      rebaseExecuted: false,
      retargetExecuted: false,
      prsMerged: false,
      prsClosed: false,
      branchesDeleted: false,
      supabaseUpdateRequired: "docs/status only",
      supabaseUpdateStatus: "docs_only",
      supabaseEnvironmentTouched: "none",
      sqlExecuted: "none",
      migrationDeployed: "no",
      nextRecommendedPrompt: "MERGE-HYGIENE-4 - Mark Ready / Superseded PR Owner Review Packet",
    },
    null,
    2,
  ),
);
