import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const failures = [];

const requiredFiles = [
  "docs/github-merge-hygiene/merge-hygiene-4-live-owner-review-state.md",
  "docs/github-merge-hygiene/merge-hygiene-4-mark-ready-candidates.md",
  "docs/github-merge-hygiene/merge-hygiene-4-superseded-duplicate-owner-review.md",
  "docs/github-merge-hygiene/merge-hygiene-4-conflict-resolution-queue.md",
  "docs/github-merge-hygiene/merge-hygiene-4-tool-study-gate-review.md",
  "docs/github-merge-hygiene/merge-hygiene-4-owner-action-packet.md",
  "docs/prompt-merge-hygiene-4-validation-results.md",
  "docs/implementation-prompts/prompt-merge-hygiene-4-mark-ready-superseded-pr-owner-review-packet.md",
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
  333, 352, 355, 348, 345, 344, 339, 338, 336, 335, 332, 323, 326, 329, 349,
  350, 337, 327, 325, 324, 322, 320, 330, 328, 354, 356, 357, 359, 360,
];

for (const pr of requiredPrs) {
  if (!allText.includes(`#${pr}`)) {
    failures.push(`Missing required PR reference: #${pr}`);
  }
}

for (const phrase of [
  "owner_review_packet_created",
  "review_packet_only",
  "none_safe_now",
  "conflict_resolution_needed",
  "tool_study_gate_blocked_pending_owner_acceptance",
  "keep_draft_pending_owner_acceptance",
  "duplicate_or_superseded_owner_review",
  "WEB_SEARCH_CAPTURE",
  "MAP_GEOSPATIAL",
  "AI_TOOLS_CREATIVE_GRAPHICS",
  "TRACK_A_RENDER_EXPORT",
  "TRACK_B_MEDIA_PROCESSING",
  "SOUND_MUSIC_AUDIO",
  "Mark-ready action executed | `false`",
  "closedAnyPr` | `false`",
  "mergedAnyPr` | `false`",
  "rebasedAnyBranch` | `false`",
  "retargetedAnyPr` | `false`",
  "resolvedAnyConflict` | `false`",
  "Supabase update required: `docs/status only`",
  "Supabase update status: `docs_only`",
  "Supabase environment touched: `none`",
  "SQL executed: `none`",
  "Migration deployed: `no`",
  "Supabase milestone sync: `not_performed`",
  "scripts/validation/run-foundation-validation.mjs",
]) {
  if (!allText.includes(phrase)) {
    failures.push(`Missing required phrase: ${phrase}`);
  }
}

const noScope =
  "No PR merge, PR close, branch deletion, mark-ready action, rebase, retarget, Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.";

if (!allText.includes(noScope)) {
  failures.push("Missing exact MERGE-HYGIENE-4 no-scope statement");
}

const forbiddenPatterns = [
  /\bmarked ready:\s*`?(true|yes)`?/i,
  /\bmark-ready action executed\s*\|\s*`?(true|yes)`?/i,
  /\bmarked ready PR #\d+\b/i,
  /\bPR merge executed:\s*`?(true|yes)`?/i,
  /\bPR close executed:\s*`?(true|yes)`?/i,
  /\bBranch deletion executed:\s*`?(true|yes)`?/i,
  /\bRebase executed:\s*`?(true|yes)`?/i,
  /\bRetarget executed:\s*`?(true|yes)`?/i,
  /\bConflict resolution executed:\s*`?(true|yes)`?/i,
  /\bBranch update executed:\s*`?(true|yes)`?/i,
  /\bmerged PR #\d+\b/i,
  /\bclosed PR #\d+\b/i,
  /\bdeleted branch\b/i,
  /\brebased PR #\d+\b/i,
  /\bretargeted PR #\d+\b/i,
  /\bresolved conflicts\b/i,
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
  packageJson.scripts?.["merge-hygiene:4:diagnostics"] !==
  "node scripts/validation/github-merge-hygiene-4-diagnostics.mjs"
) {
  failures.push("package.json missing merge-hygiene:4:diagnostics script");
}

if (fs.existsSync(path.join(root, "scripts/validation/run-foundation-validation.mjs"))) {
  failures.push("Foundation validation runner exists but MERGE-HYGIENE-4 diagnostic was not wired");
}

if (failures.length > 0) {
  console.error("MERGE-HYGIENE-4 diagnostics failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      status: "passed",
      packetStatus: "owner_review_packet_created",
      decisionState: "review_packet_only",
      markReadyCandidates: "none_safe_now",
      conflictQueueStatus: "conflict_resolution_needed",
      toolStudyGateStatus: "tool_study_gate_blocked_pending_owner_acceptance",
      prsMarkedReady: false,
      prsMerged: false,
      prsClosed: false,
      branchesDeleted: false,
      rebaseExecuted: false,
      retargetExecuted: false,
      supabaseUpdateRequired: "docs/status only",
      supabaseUpdateStatus: "docs_only",
      supabaseEnvironmentTouched: "none",
      sqlExecuted: "none",
      migrationDeployed: "no",
      nextRecommendedPrompt:
        "MERGE-HYGIENE-5 - Owner-Approved Mark Ready / Close Superseded Execution or MERGE-HYGIENE-3A - #333 Conflict Resolution Plan",
    },
    null,
    2,
  ),
);
