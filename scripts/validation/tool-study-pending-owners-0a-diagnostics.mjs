import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const failures = [];

const requiredFiles = [
  "docs/tool-studies/pending-owner-studies-validation-review.md",
  "docs/tool-studies/pending-owner-studies-readiness-matrix.md",
  "docs/tool-studies/pending-owner-studies-gap-register.md",
  "docs/tool-studies/pending-owner-studies-mark-ready-recommendation.md",
  "docs/prompt-tool-study-pending-owners-0a-validation-results.md",
  "docs/implementation-prompts/prompt-tool-study-pending-owners-0a-validation-ready-state-review.md",
];

function readRequired(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing required file: ${relativePath}`);
    return "";
  }

  return fs.readFileSync(absolutePath, "utf8");
}

function readIfExists(relativePath) {
  const absolutePath = path.join(root, relativePath);
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, "utf8") : "";
}

const texts = requiredFiles.map((file) => [file, readRequired(file)]);
const allText = [
  ...texts.map(([, text]) => text),
  readIfExists("docs/beta-readiness-scorecard.md"),
  readIfExists("docs/production-beta-blocker-inventory.md"),
].join("\n");

const ownerIds = [
  "WEB_SEARCH_CAPTURE",
  "MAP_GEOSPATIAL",
  "AI_TOOLS_CREATIVE_GRAPHICS",
  "TRACK_A_RENDER_EXPORT",
  "TRACK_B_MEDIA_PROCESSING",
  "SOUND_MUSIC_AUDIO",
];

for (const ownerId of ownerIds) {
  if (!allText.includes(ownerId)) {
    failures.push(`Missing owner study reference: ${ownerId}`);
  }
}

for (const phrase of [
  "ready_with_warnings_to_mark_pr_360_ready_for_review",
  "PR #360",
  "PR #362",
  "State | `OPEN`",
  "Draft | `true`",
  "Mergeability | `MERGEABLE / CLEAN`",
  "no_check_rollup_returned",
  "package-lock status",
  "markReadyActionTaken: `false`",
  "toolRouteExecutionApproved: `false`",
  "toolExecutionApproved: `false`",
  "workerExecutionApproved: `false`",
  "providerRuntimeApproved: `false`",
  "supabaseMutationApproved: `false`",
  "internalBetaApproved: `false`",
  "externalBetaApproved: `false`",
  "productionApproved: `false`",
  "Supabase update required: `docs/status only`",
  "Supabase update status: `docs_only`",
  "Supabase environment touched: `none`",
  "SQL executed: `none`",
  "Migration deployed: `no`",
  "Supabase milestone sync: `blocked_not_performed_docs_status_review_only`",
  "none; pending owner tool-study validation and ready-state review only",
]) {
  if (!allText.includes(phrase)) {
    failures.push(`Missing required phrase: ${phrase}`);
  }
}

const noScope =
  "No PR mark-ready action, Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, map rendering, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, media processing, or broad service-role handler was enabled.";

if (!allText.includes(noScope)) {
  failures.push("Missing exact TOOL-STUDY-PENDING-OWNERS-0A no-scope statement");
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (
  packageJson.scripts?.["tool-study-pending-owners-0a:diagnostics"] !==
  "node scripts/validation/tool-study-pending-owners-0a-diagnostics.mjs"
) {
  failures.push("package.json missing tool-study-pending-owners-0a:diagnostics script");
}

if (
  packageJson.scripts?.["tool-study-pending-owners-0:diagnostics"] !==
  "node scripts/validation/tool-study-pending-owners-0-diagnostics.mjs"
) {
  failures.push("package.json missing inherited tool-study-pending-owners-0:diagnostics script");
}

for (const file of [
  "docs/tool-study-pending-owners-0.md",
  "scripts/validation/tool-study-pending-owners-0-diagnostics.mjs",
  "docs/tool-studies/ai-tools-creative-graphics-tool-study.md",
  "docs/tool-studies/track-a-render-export-tool-study.md",
  "docs/tool-studies/track-b-media-processing-tool-study.md",
  "docs/tool-studies/sound-music-audio-tool-study.md",
]) {
  if (!fs.existsSync(path.join(root, file))) {
    failures.push(`Missing inherited PR #360 evidence file: ${file}`);
  }
}

if (fs.existsSync(path.join(root, "scripts/validation/run-foundation-validation.mjs"))) {
  failures.push("Foundation validation runner exists but TOOL-STUDY-PENDING-OWNERS-0A diagnostic was not wired");
}

const forbiddenPatterns = [
  /\bmarkReadyActionTaken:\s*`?true`?/i,
  /\bmark-ready action taken:\s*`?true`?/i,
  /\bmarked PR #360 ready\b/i,
  /\btoolRouteExecutionApproved:\s*`?true`?/i,
  /\btoolExecutionApproved:\s*`?true`?/i,
  /\bworkerExecutionApproved:\s*`?true`?/i,
  /\bproviderRuntimeApproved:\s*`?true`?/i,
  /\bsupabaseMutationApproved:\s*`?true`?/i,
  /\binternalBetaApproved:\s*`?true`?/i,
  /\bexternalBetaApproved:\s*`?true`?/i,
  /\bproductionApproved:\s*`?true`?/i,
  /\btool execution (was )?enabled:\s*`?(true|yes)`?/i,
  /\bworker execution (was )?enabled:\s*`?(true|yes)`?/i,
  /\broute execution (was )?enabled:\s*`?(true|yes)`?/i,
  /\bprovider call (was )?enabled:\s*`?(true|yes)`?/i,
  /\bmodel call (was )?enabled:\s*`?(true|yes)`?/i,
  /\bSupabase mutation (was )?enabled:\s*`?(true|yes)`?/i,
  /\bSQL executed:\s*`?(true|yes|staging|production)`?/i,
  /\binternal beta unlocked\b/i,
  /\bexternal beta unlocked\b/i,
  /\bproduction unlocked\b/i,
  /\bsigned URL created\b/i,
  /\bpublic artifact created\b/i,
  /\bGCS upload completed\b/i,
  /\bmedia processing executed\b/i,
  /\bbrowser capture executed\b/i,
  /\bmap rendering executed\b/i,
];

for (const pattern of forbiddenPatterns) {
  const match = allText.match(pattern);
  if (match) {
    failures.push(`Forbidden unsafe claim matched: ${match[0]}`);
  }
}

if (failures.length > 0) {
  console.error("TOOL-STUDY-PENDING-OWNERS-0A diagnostics failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      status: "passed",
      decisionState: "ready_with_warnings_to_mark_pr_360_ready_for_review",
      markReadyActionTaken: false,
      ownerStudiesReviewed: ownerIds.length,
      pr360State: "OPEN",
      pr360Draft: true,
      pr360Mergeability: "MERGEABLE / CLEAN",
      toolRouteExecutionApproved: false,
      toolExecutionApproved: false,
      workerExecutionApproved: false,
      providerRuntimeApproved: false,
      supabaseUpdateRequired: "docs/status only",
      supabaseUpdateStatus: "docs_only",
      supabaseEnvironmentTouched: "none",
      sqlExecuted: "none",
      migrationDeployed: "no",
      nextRecommendedPrompt: "TOOL-STUDY-PENDING-OWNERS-1 - Owner-Approved Mark PR #360 Ready",
    },
    null,
    2,
  ),
);
