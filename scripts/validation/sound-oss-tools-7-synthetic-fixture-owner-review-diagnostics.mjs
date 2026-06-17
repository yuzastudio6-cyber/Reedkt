#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "docs/sound-oss-tools-7-synthetic-fixture-owner-review.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-owner-evidence-acceptance.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-claim-policy.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-owner-blocker-register.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-owner-handoff-status.md",
  "docs/sound-oss-tools-7-synthetic-fixture-owner-review-results.md",
  "docs/implementation-prompts/prompt-sound-oss-tools-8-synthetic-fixture-gate-status.md",
  "docs/sound-oss-tools-6-synthetic-fixture-validation-result.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-validation-matrix.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-validation-blocker-register.md",
];

const expectedDecision =
  "sound_oss_tools_7_owner_review_passed_with_warnings_ready_for_scoped_gate_status";
const expectedNextPrompt =
  "SOUND-OSS-TOOLS-8: synthetic fixture gate status packet, no media processing";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(path) {
  assert(existsSync(path), `Missing required file: ${path}`);
  return readFileSync(path, "utf8");
}

function parseBlock(path, label) {
  const text = read(path);
  const match = text.match(new RegExp("```json " + label + "\\n([\\s\\S]*?)\\n```"));
  assert(match, `Missing JSON block ${label} in ${path}`);
  return JSON.parse(match[1]);
}

for (const file of requiredFiles) {
  assert(existsSync(file), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
assert(
  packageJson.scripts?.["sound-oss-tools-7:diagnostics"] ===
    "node scripts/validation/sound-oss-tools-7-synthetic-fixture-owner-review-diagnostics.mjs",
  "package.json must include sound-oss-tools-7:diagnostics",
);

const ownerReview = parseBlock(
  "docs/sound-oss-tools-7-synthetic-fixture-owner-review.md",
  "sound-oss-tools-7-synthetic-fixture-owner-review",
);
const evidence = parseBlock(
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-owner-evidence-acceptance.md",
  "sound-oss-tools-7-owner-evidence-acceptance",
);
const claimPolicy = parseBlock(
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-claim-policy.md",
  "sound-oss-tools-7-synthetic-fixture-claim-policy",
);
const blockers = parseBlock(
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-owner-blocker-register.md",
  "sound-oss-tools-7-owner-blocker-register",
);
const handoffs = parseBlock(
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-owner-handoff-status.md",
  "sound-oss-tools-7-owner-handoff-status",
);
const results = parseBlock(
  "docs/sound-oss-tools-7-synthetic-fixture-owner-review-results.md",
  "sound-oss-tools-7-owner-review-results",
);
const pr461Result = parseBlock(
  "docs/sound-oss-tools-6-synthetic-fixture-validation-result.md",
  "sound-oss-tools-6-synthetic-fixture-validation-result",
);
const pr461Matrix = parseBlock(
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-validation-matrix.md",
  "sound-oss-tools-6-synthetic-fixture-validation-matrix",
);

for (const block of [ownerReview, evidence, claimPolicy, blockers, handoffs, results]) {
  assert(block.phase === "SOUND-OSS-TOOLS-7", "All owner review blocks must be SOUND-OSS-TOOLS-7");
  assert(block.decision === expectedDecision, `Unexpected decision in ${block.phase}`);
  assert(block.nextPrompt === expectedNextPrompt, "Unexpected next prompt");
}

assert(
  ownerReview.sourceHead === "72fb9b5d1ef5a30acd173e1c6949cd7a029ef0bd",
  "Owner review must record merged PR #461 source head",
);
assert(ownerReview.sourcePullRequests?.pr461, "Owner review must reference PR #461");
assert(evidence.evidenceCount === 8, "Evidence register must cover PR #418 through PR #461");
for (const pr of ["PR #418", "PR #424", "PR #431", "PR #436", "PR #442", "PR #450", "PR #453", "PR #461"]) {
  assert(
    evidence.evidence.some((entry) => entry.pullRequest === pr && entry.accepted === true),
    `Evidence register must accept ${pr}`,
  );
  assert(results.pullRequestsInspected.includes(pr), `Results must inspect ${pr}`);
}

assert(pr461Result.fixtureValidationSummary?.fixtureCount === 14, "PR #461 must record 14 fixtures");
assert(pr461Result.fixtureValidationSummary?.passedCount === 12, "PR #461 must record 12 passed fixtures");
assert(pr461Result.fixtureValidationSummary?.skippedCount === 2, "PR #461 must record 2 policy skips");
assert(pr461Result.fixtureValidationSummary?.failedCount === 0, "PR #461 must record 0 failed fixtures");
assert(pr461Matrix.matrixCount === 14, "PR #461 matrix must cover 14 fixtures");
assert(pr461Matrix.statusCounts?.passed === 12, "PR #461 matrix must record 12 passed fixtures");
assert(pr461Matrix.statusCounts?.skipped_blocked_by_policy === 2, "PR #461 matrix must record 2 skips");
assert(pr461Matrix.statusCounts?.failed === 0, "PR #461 matrix must record 0 failures");

assert(ownerReview.pr461Evidence?.fixturesAttempted === 14, "Owner review must preserve 14 attempted fixtures");
assert(ownerReview.pr461Evidence?.fixturesPassed === 12, "Owner review must preserve 12 passed fixtures");
assert(ownerReview.pr461Evidence?.fixturesSkippedByPolicy === 2, "Owner review must preserve 2 skipped fixtures");
assert(ownerReview.pr461Evidence?.fixturesFailed === 0, "Owner review must preserve 0 failed fixtures");
assert(results.evidenceAccepted?.accepted === true, "Results must accept evidence");

const pydubBlocker = blockers.blockers.find((blocker) =>
  blocker.blockerId === "pydub_media_operations_blocked_ffmpeg_avconv_warning"
);
assert(pydubBlocker?.mayExecuteNow === false, "pydub media blocker must remain non-executable");
assert(/FFmpeg\/avconv/.test(pydubBlocker.reason), "pydub blocker must preserve FFmpeg/avconv warning");
const audioreadBlocker = blockers.blockers.find((blocker) =>
  blocker.blockerId === "audioread_file_open_blocked_no_media"
);
assert(audioreadBlocker?.mayExecuteNow === false, "audioread file-open blocker must remain non-executable");
assert(/media files are prohibited/.test(audioreadBlocker.reason), "audioread blocker must preserve no-media policy");

assert(claimPolicy.projectWideGeneratedLocalFixturePassed.claimed === false, "Project-wide fixture claim must stay false");
assert(claimPolicy.dryRunPassed.claimed === false, "dry_run_passed claim must stay false");
assert(claimPolicy.runtimeReadiness.claimed === false, "runtime readiness claim must stay false");
assert(
  claimPolicy.approvedOwnerReviewScope.futureScopedClaimNameAllowedForPlanning ===
    "sound_oss_tools_synthetic_fixture_validation_passed",
  "Scoped future claim name must be distinct from project-wide generated_local_fixture_passed",
);

for (const key of [
  "dryRunPassedClaimed",
  "generatedLocalFixturePassedClaimed",
  "projectWideGeneratedLocalFixturePassedClaimed",
  "runtimeReadinessClaimed",
]) {
  assert(ownerReview.claimPolicy?.[key] === false, `${key} must remain false in owner review`);
  assert(results.claimStatus?.[key] === false, `${key} must remain false in results`);
}

for (const flag of [
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "routeExecutionAllowed",
  "providerCallsAllowed",
  "modelCallsAllowed",
  "supabaseMutationAllowed",
  "sqlAllowed",
  "publicArtifactAllowed",
  "signedUrlAllowed",
  "betaProductionUnlockClaimed",
  "runtimeReadinessClaimed",
]) {
  assert(handoffs.runtimeFlags?.[flag] === false, `${flag} must remain false in handoff status`);
}

const allText = requiredFiles.map(read).join("\n");
for (const phrase of [
  "PR #461",
  "audioread file-open",
  "pydub media operations",
  "FFmpeg/avconv",
  "media processing",
  "real user data",
  "Supabase",
  "signed URL",
  "public artifact",
  "beta/production",
]) {
  assert(allText.includes(phrase), `Missing required phrase: ${phrase}`);
}

const unsafeTrueFields = [
  "realUserDataUsed",
  "mediaFileRead",
  "mediaFileWritten",
  "mediaProcessingRun",
  "ffmpegOrFfprobeRun",
  "pydubMediaOperationsRun",
  "workerExecutionRun",
  "routeExecutionRun",
  "providerOrModelCallRun",
  "supabaseMutationRun",
  "sqlRun",
  "signedUrlCreated",
  "publicArtifactCreated",
  "artifactCreated",
  "dryRunPassedClaimed",
  "generatedLocalFixturePassedClaimed",
  "projectWideGeneratedLocalFixturePassedClaimed",
  "runtimeReadinessClaimed",
  "betaProductionUnlockClaimed",
];
for (const field of unsafeTrueFields) {
  assert(!new RegExp(`"${field}"\\s*:\\s*true`).test(allText), `${field} must not be true`);
}

const generatedLocal = "generated" + "_local" + "_fixture" + "_passed";
const dryRun = "dry" + "_run" + "_passed";
assert(!new RegExp(`${generatedLocal}\\s*[:=]\\s*true`, "i").test(allText), "Project-wide fixture claim must not be true");
assert(!new RegExp(`${dryRun}\\s*[:=]\\s*true`, "i").test(allText), "dry run pass claim must not be true");
assert(!/https?:\/\/[a-z0-9-]+\.supabase\.co/i.test(allText), "Supabase URL must not appear");
assert(!/\b(Authorization\s*:\s*Bearer|Bearer\s+[A-Za-z0-9._~+/=-]{24,})/i.test(allText), "Bearer token must not appear");
assert(!/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/.test(allText), "JWT must not appear");

console.log(
  JSON.stringify(
    {
      status: "passed",
      decision: ownerReview.decision,
      sourceHead: ownerReview.sourceHead,
      fixtureSummary: ownerReview.pr461Evidence,
      nextPrompt: ownerReview.nextPrompt,
      projectWideGeneratedLocalFixturePassedClaimed:
        ownerReview.claimPolicy.projectWideGeneratedLocalFixturePassedClaimed,
      dryRunPassedClaimed: ownerReview.claimPolicy.dryRunPassedClaimed,
      runtimeReadinessClaimed: ownerReview.claimPolicy.runtimeReadinessClaimed,
    },
    null,
    2,
  ),
);
