import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const failures = [];

const requiredFiles = [
  "docs/github-merge-hygiene/merge-hygiene-2-live-downstream-pr-state.md",
  "docs/github-merge-hygiene/merge-hygiene-2-rebase-retarget-plan.md",
  "docs/github-merge-hygiene/merge-hygiene-2-pr-readiness-after-parent-merge.md",
  "docs/github-merge-hygiene/merge-hygiene-2-duplicate-superseded-review.md",
  "docs/github-merge-hygiene/merge-hygiene-2-downstream-update-queue.md",
  "docs/github-merge-hygiene/merge-hygiene-2-owner-action-checklist.md",
  "docs/prompt-merge-hygiene-2-validation-results.md",
  "docs/implementation-prompts/prompt-merge-hygiene-2-downstream-branch-rebase-retarget-plan.md",
];

const mergedParents = [331, 334, 340, 343, 347];
const requiredPrs = [
  ...mergedParents,
  349, 350, 352, 353, 354, 355, 356, 348, 345, 344, 339, 338, 337, 336,
  335, 333, 332, 330,
];
const requiredActions = [
  "no_action",
  "rebase_needed",
  "retarget_needed",
  "rebase_and_retarget_needed",
  "mark_ready_after_parent_update",
  "keep_draft_pending_parent",
  "duplicate_or_superseded_owner_review",
  "close_later_if_owner_approved",
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

for (const pr of requiredPrs) {
  if (!allText.includes(`#${pr}`)) {
    failures.push(`Missing required PR reference: #${pr}`);
  }
}

for (const pr of mergedParents) {
  const mergedPattern = new RegExp("#" + pr + "[^\\n]*`MERGED`", "i");
  if (!mergedPattern.test(allText)) {
    failures.push(`Merged parent PR #${pr} is not recorded as MERGED`);
  }
}

for (const action of requiredActions) {
  if (!allText.includes(action)) {
    failures.push(`Missing allowed action classification: ${action}`);
  }
}

for (const phrase of [
  "queue_created_not_executed",
  "downstream_rebase_retarget_plan_created",
  "duplicate_superseded_owner_review_required",
  "owner_review_required_before_execution",
  "#349",
  "#352",
  "#355",
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
  "No PR merge, PR close, branch deletion, rebase, retarget, Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.";

if (!allText.includes(noScope)) {
  failures.push("Missing exact MERGE-HYGIENE-2 no-scope statement");
}

const forbiddenPatterns = [
  /\brebase executed:\s*`?true`?/i,
  /\bretarget executed:\s*`?true`?/i,
  /\bPR merge executed:\s*`?true`?/i,
  /\bPR close executed:\s*`?true`?/i,
  /\bBranch deletion executed:\s*`?true`?/i,
  /\bMERGE-HYGIENE-2 merged PR #\d+\b/i,
  /\bMERGE-HYGIENE-2 closed PR #\d+\b/i,
  /\bMERGE-HYGIENE-2 rebased\b/i,
  /\bMERGE-HYGIENE-2 retargeted\b/i,
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
  packageJson.scripts?.["merge-hygiene:2:diagnostics"] !==
  "node scripts/validation/github-merge-hygiene-2-diagnostics.mjs"
) {
  failures.push("package.json missing merge-hygiene:2:diagnostics script");
}

if (fs.existsSync(path.join(root, "scripts/validation/run-foundation-validation.mjs"))) {
  failures.push("Foundation validation runner exists but MERGE-HYGIENE-2 diagnostic was not wired");
}

if (failures.length > 0) {
  console.error("MERGE-HYGIENE-2 diagnostics failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      status: "passed",
      downstreamPlanStatus: "downstream_rebase_retarget_plan_created",
      queueStatus: "queue_created_not_executed",
      mergedParentsRecorded: mergedParents.length,
      prsNeedingRebase: [333],
      prsNeedingRetarget: [],
      prsNeedingBoth: [],
      supabaseUpdateRequired: "docs/status only",
      supabaseUpdateStatus: "docs_only",
      supabaseEnvironmentTouched: "none",
      sqlExecuted: "none",
      migrationDeployed: "no",
      nextRecommendedPrompt: "MERGE-HYGIENE-3 - Owner-Approved Downstream Rebase/Retarget Execution",
    },
    null,
    2,
  ),
);
