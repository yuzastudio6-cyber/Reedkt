#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "docs/sound-oss-tools-8-synthetic-fixture-gate-status.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-gate-status-register.md",
  "docs/sound-music-audio-open-source-tool-scoped-synthetic-fixture-claim-register.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-remaining-blocker-status.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-gate-owner-handoff.md",
  "docs/sound-oss-tools-8-synthetic-fixture-gate-status-results.md",
  "docs/implementation-prompts/prompt-sound-oss-tools-9-scoped-synthetic-fixture-pass-review.md",
  "docs/sound-oss-tools-7-synthetic-fixture-owner-review.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-owner-evidence-acceptance.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-claim-policy.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-owner-blocker-register.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-owner-handoff-status.md",
  "docs/sound-oss-tools-7-synthetic-fixture-owner-review-results.md",
  "docs/sound-oss-tools-6-synthetic-fixture-validation-result.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-validation-matrix.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-validation-blocker-register.md",
  "package.json",
];

const expectedDecision =
  "sound_oss_tools_8_scoped_synthetic_fixture_gate_status_recorded_with_warnings_ready_for_pass_review";
const expectedSourceDecision =
  "sound_oss_tools_7_owner_review_passed_with_warnings_ready_for_scoped_gate_status";
const expectedNextPrompt =
  "SOUND-OSS-TOOLS-9: scoped synthetic fixture pass review, no media processing";
const expectedScopedStatus = "sound_oss_tools_synthetic_fixture_validation_passed_with_warnings";

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
  packageJson.scripts?.["sound-oss-tools-8:diagnostics"] ===
    "node scripts/validation/sound-oss-tools-8-synthetic-fixture-gate-status-diagnostics.mjs",
  "package.json must include sound-oss-tools-8:diagnostics",
);

const gateStatus = parseBlock(
  "docs/sound-oss-tools-8-synthetic-fixture-gate-status.md",
  "sound-oss-tools-8-synthetic-fixture-gate-status",
);
const statusRegister = parseBlock(
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-gate-status-register.md",
  "sound-oss-tools-8-gate-status-register",
);
const claimRegister = parseBlock(
  "docs/sound-music-audio-open-source-tool-scoped-synthetic-fixture-claim-register.md",
  "sound-oss-tools-8-scoped-claim-register",
);
const blockerStatus = parseBlock(
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-remaining-blocker-status.md",
  "sound-oss-tools-8-remaining-blocker-status",
);
const handoff = parseBlock(
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-gate-owner-handoff.md",
  "sound-oss-tools-8-gate-owner-handoff",
);
const results = parseBlock(
  "docs/sound-oss-tools-8-synthetic-fixture-gate-status-results.md",
  "sound-oss-tools-8-gate-status-results",
);

const ownerReview = parseBlock(
  "docs/sound-oss-tools-7-synthetic-fixture-owner-review.md",
  "sound-oss-tools-7-synthetic-fixture-owner-review",
);
const ownerResults = parseBlock(
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

for (const block of [gateStatus, statusRegister, claimRegister, blockerStatus, handoff, results]) {
  assert(block.phase === "SOUND-OSS-TOOLS-8", "All new blocks must be SOUND-OSS-TOOLS-8");
  assert(block.decision === expectedDecision, "Unexpected SOUND-OSS-TOOLS-8 decision");
  assert(block.nextPrompt === expectedNextPrompt || block.nextGate === expectedNextPrompt, "Unexpected next prompt");
}

assert(gateStatus.sourceHead === "efeff4f968778408a96b8861ddd98be41cc01264", "Gate status must record PR #465 source head");
assert(gateStatus.sourceEvidenceConsumed?.pr465?.decision === expectedSourceDecision, "Gate status must consume PR #465 owner decision");
assert(gateStatus.sourceEvidenceConsumed?.pr465?.accepted === true, "PR #465 source evidence must be accepted");
assert(gateStatus.sourceEvidenceConsumed?.pr461?.acceptedByPr465 === true, "PR #461 evidence must be accepted by PR #465");

assert(ownerReview.decision === expectedSourceDecision, "Owner review source decision drifted");
assert(ownerResults.evidenceAccepted?.accepted === true, "Owner review results must accept source evidence");
assert(pr461Result.fixtureValidationSummary?.fixtureCount === 14, "PR #461 must record 14 fixtures");
assert(pr461Result.fixtureValidationSummary?.passedCount === 12, "PR #461 must record 12 passed fixtures");
assert(pr461Result.fixtureValidationSummary?.skippedCount === 2, "PR #461 must record 2 policy skips");
assert(pr461Result.fixtureValidationSummary?.failedCount === 0, "PR #461 must record 0 failed fixtures");
assert(pr461Matrix.matrixCount === 14, "PR #461 matrix must cover 14 fixtures");
assert(pr461Matrix.statusCounts?.passed === 12, "PR #461 matrix must record 12 passed fixtures");
assert(pr461Matrix.statusCounts?.skipped_blocked_by_policy === 2, "PR #461 matrix must record 2 skips");
assert(pr461Matrix.statusCounts?.failed === 0, "PR #461 matrix must record 0 failures");

for (const block of [gateStatus.sourceEvidenceConsumed.pr461, statusRegister, results.sourceEvidenceAccepted]) {
  assert(block.fixturesAttempted === 14 || block.fixtureAttemptedCount === 14, "Fixture attempted count must be 14");
  assert(block.fixturesPassed === 12 || block.fixturePassedCount === 12, "Fixture passed count must be 12");
  assert(block.fixturesSkippedByPolicy === 2 || block.fixtureSkippedCount === 2, "Fixture skipped count must be 2");
  assert(block.fixturesFailed === 0 || block.fixtureFailedCount === 0, "Fixture failed count must be 0");
}

assert(statusRegister.scopedStatus === expectedScopedStatus, "Scoped status missing from register");
assert(results.scopedGateStatus === expectedScopedStatus, "Scoped status missing from results");
assert(claimRegister.allowedScopedWording.includes(expectedScopedStatus), "Allowed scoped wording missing");
for (const forbidden of [
  "generated_local_fixture_passed",
  "dry_run_passed",
  "runtime_ready",
  "production_ready",
  "beta_ready",
]) {
  assert(claimRegister.forbiddenWording.includes(forbidden), `Forbidden wording missing: ${forbidden}`);
}

for (const flag of [
  "projectWideGeneratedLocalFixturePassed",
  "generatedLocalFixturePassed",
  "dryRunPassed",
  "runtimeReadiness",
  "mediaProcessingApproved",
  "supabaseMutationApproved",
  "sqlApproved",
  "artifactsApproved",
  "signedUrlsApproved",
  "betaProductionApproved",
]) {
  assert(statusRegister[flag] === false, `${flag} must be false`);
}

for (const flag of [
  "projectWideGeneratedLocalFixturePassedClaimed",
  "generatedLocalFixturePassedClaimed",
  "dryRunPassedClaimed",
  "runtimeReadinessClaimed",
  "productionReadinessClaimed",
  "betaReadinessClaimed",
  "supabaseReadinessClaimed",
]) {
  assert(claimRegister.claimPolicy?.[flag] === false, `${flag} must be false`);
}

for (const flag of [
  "generatedLocalFixturePassedClaimed",
  "projectWideGeneratedLocalFixturePassedClaimed",
  "dryRunPassedClaimed",
  "runtimeReadinessClaimed",
]) {
  assert(gateStatus.claimStatus?.[flag] === false, `${flag} must remain false in gate status`);
  assert(results.claimStatus?.[flag] === false, `${flag} must remain false in results`);
}

for (const field of [
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "routeExecutionAllowed",
  "providerCallsAllowed",
  "modelCallsAllowed",
  "mediaProcessingAllowed",
  "supabaseMutationAllowed",
  "sqlAllowed",
  "publicArtifactAllowed",
  "signedUrlAllowed",
  "creditMutationAllowed",
  "betaProductionUnlockClaimed",
  "runtimeReadinessClaimed",
]) {
  assert(handoff.runtimeFlags?.[field] === false, `${field} must remain false`);
}

const blockerIds = new Set(blockerStatus.blockers.map((blocker) => blocker.blockerId));
for (const blockerId of [
  "audioread_file_open_blocked_no_media",
  "pydub_media_operations_blocked_ffmpeg_avconv_warning",
  "ffmpeg_ffprobe_blocked",
  "demucs_rnnoise_essentia_rubber_band_blocked",
  "signalsmith_stretch_blocked",
  "worker_route_provider_blocked",
  "supabase_sql_blocked",
  "signed_urls_public_artifacts_blocked",
  "credits_stripe_blocked",
  "beta_production_blocked",
  "project_wide_generated_local_fixture_passed_blocked",
  "dry_run_runtime_readiness_blocked",
]) {
  assert(blockerIds.has(blockerId), `Missing blocker: ${blockerId}`);
}
for (const blocker of blockerStatus.blockers) {
  assert(blocker.status === "blocked", `Blocker must remain blocked: ${blocker.blockerId}`);
  assert(blocker.mayExecuteNow === false, `Blocker must not execute now: ${blocker.blockerId}`);
}

const allText = requiredFiles.map(read).join("\n");
for (const phrase of [
  "PR #465",
  "PR #461",
  "14 attempted",
  "12 passed",
  "2 skipped",
  "0 failed",
  "audioread file-open",
  "pydub media operations",
  "FFmpeg/avconv",
  "real user data",
  "media processing",
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
  "mediaProcessingApproved",
  "supabaseMutationApproved",
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
      decision: gateStatus.decision,
      scopedGateStatus: statusRegister.scopedStatus,
      fixtureCounts: {
        attempted: statusRegister.fixtureAttemptedCount,
        passed: statusRegister.fixturePassedCount,
        skipped: statusRegister.fixtureSkippedCount,
        failed: statusRegister.fixtureFailedCount,
      },
      warnings: statusRegister.skippedReasons.map((entry) => entry.module),
      nextPrompt: expectedNextPrompt,
    },
    null,
    2,
  ),
);
