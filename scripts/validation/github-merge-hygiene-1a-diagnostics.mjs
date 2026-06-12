import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const failures = [];

const requiredFiles = [
  "docs/github-merge-hygiene/merge-hygiene-1a-live-pr-state.md",
  "docs/github-merge-hygiene/merge-hygiene-1a-approved-merge-queue.md",
  "docs/github-merge-hygiene/merge-hygiene-1a-merge-results.md",
  "docs/github-merge-hygiene/merge-hygiene-1a-downstream-update-needs.md",
  "docs/prompt-merge-hygiene-1a-validation-results.md",
  "docs/implementation-prompts/prompt-merge-hygiene-1a-owner-approved-parent-first-merge-execution.md",
];

const requiredPrs = [331, 334, 340, 343, 347, 349, 352];
const mergedPrs = [331, 334, 340, 343, 347];
const expectedMergeCommits = {
  331: "131d54e662abeafc8c415f63dca9b33f2b3f7afb",
  334: "e31c58b4063a2b924852f4fd89770c243079f3ad",
  340: "f33b36e246268ce4231045ed6aab8de46ef1ac94",
  343: "82672f2cda8c4f84e970a6a2275a7802ed3954ea",
  347: "ff9b87d5128dc09f618e7f96c71a4d2b3ac82b49",
};

function readRequired(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing required file: ${relativePath}`);
    return "";
  }

  return fs.readFileSync(absolutePath, "utf8");
}

const entries = requiredFiles.map((file) => [file, readRequired(file)]);
const fileText = new Map(entries);
const allText = entries.map(([, text]) => text).join("\n");

for (const pr of requiredPrs) {
  if (!allText.includes(`#${pr}`)) {
    failures.push(`Missing required PR reference: #${pr}`);
  }
}

for (const pr of mergedPrs) {
  const commit = expectedMergeCommits[pr];
  if (!allText.includes(commit)) {
    failures.push(`Missing observed merge commit for #${pr}: ${commit}`);
  }
  const rowPattern = new RegExp(
    "#" + pr + "[^\\n]*" + commit + "[^\\n]*\\| `false` \\|",
    "i",
  );
  if (!rowPattern.test(allText)) {
    failures.push(`PR #${pr} is not clearly marked mergedByThisPrompt: false`);
  }
}

for (const phrase of [
  "parent_first_merge_reconciled_no_local_merges",
  "Owner approval present: `true`",
  "mergedAnyPrLocally: `false`",
  "#352",
  "draft_preserved",
  "#349",
  "open_non_draft_preserved",
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
  "No unauthorized PR merge, branch deletion, Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.";

if (!allText.includes(noScope)) {
  failures.push("Missing exact MERGE-HYGIENE-1A no-scope statement");
}

const forbiddenPatterns = [
  /mergedAnyPrLocally:\s*`?true`?/i,
  /mergedByThisPrompt:\s*`?true`?/i,
  /mergedDraftPr:\s*`?true`?/i,
  /closedPr:\s*`?true`?/i,
  /deletedBranch:\s*`?true`?/i,
  /retargetedPr:\s*`?true`?/i,
  /rebasedBranch:\s*`?true`?/i,
  /\bMERGE-HYGIENE-1A merged PR #\d+\b/i,
  /\bMERGE-HYGIENE-1A closed PR #\d+\b/i,
  /\bMERGE-HYGIENE-1A deleted branch\b/i,
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
  packageJson.scripts?.["merge-hygiene:1a:diagnostics"] !==
  "node scripts/validation/github-merge-hygiene-1a-diagnostics.mjs"
) {
  failures.push("package.json missing merge-hygiene:1a:diagnostics script");
}

if (fs.existsSync(path.join(root, "scripts/validation/run-foundation-validation.mjs"))) {
  failures.push("Foundation validation runner exists but MERGE-HYGIENE-1A diagnostic was not wired");
}

if (failures.length > 0) {
  console.error("MERGE-HYGIENE-1A diagnostics failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      status: "passed",
      decisionState: "parent_first_merge_reconciled_no_local_merges",
      ownerApprovalPresent: true,
      mergedAnyPrLocally: false,
      reconciledMergedPrs: mergedPrs.length,
      preservedDraftPrsInclude: [352, 353],
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
