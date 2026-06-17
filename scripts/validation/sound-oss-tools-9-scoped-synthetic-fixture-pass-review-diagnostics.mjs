#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "docs/sound-oss-tools-9-scoped-synthetic-fixture-pass-review.md",
  "docs/sound-music-audio-open-source-tool-scoped-synthetic-fixture-downstream-wording-register.md",
  "docs/sound-music-audio-open-source-tool-scoped-synthetic-fixture-pass-review-evidence.md",
  "docs/sound-music-audio-open-source-tool-scoped-synthetic-fixture-pass-review-blockers.md",
  "docs/sound-music-audio-open-source-tool-scoped-synthetic-fixture-next-stage-recommendation.md",
  "docs/sound-oss-tools-9-scoped-synthetic-fixture-pass-review-results.md",
  "docs/implementation-prompts/prompt-sound-oss-tools-10-scoped-status-owner-approval.md",
  "docs/sound-oss-tools-8-synthetic-fixture-gate-status.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-gate-status-register.md",
  "docs/sound-music-audio-open-source-tool-scoped-synthetic-fixture-claim-register.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-remaining-blocker-status.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-gate-owner-handoff.md",
  "docs/sound-oss-tools-8-synthetic-fixture-gate-status-results.md",
  "docs/implementation-prompts/prompt-sound-oss-tools-9-scoped-synthetic-fixture-pass-review.md",
  "scripts/validation/sound-oss-tools-8-synthetic-fixture-gate-status-diagnostics.mjs",
  "docs/sound-oss-tools-7-synthetic-fixture-owner-review.md",
  "docs/sound-oss-tools-6-synthetic-fixture-validation-result.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-validation-matrix.md",
  "docs/sound-oss-tools-5-synthetic-fixture-validation-plan.md",
  "docs/sound-oss-tools-4-binary-import-proof-result.md",
  "docs/sound-oss-tools-3-controlled-dependency-install-result.md",
  "docs/cross-chat-tool-ownership-registry.md",
  "docs/sound-music-audio-cross-chat-duplicate-risk-register.md",
  "package.json",
  "package-lock.json",
];

const expectedDecision =
  "sound_oss_tools_9_scoped_synthetic_fixture_pass_review_passed_with_warnings_ready_for_status_owner_approval";
const expectedPr470Decision =
  "sound_oss_tools_8_scoped_synthetic_fixture_gate_status_recorded_with_warnings_ready_for_pass_review";
const expectedScopedStatus = "sound_oss_tools_synthetic_fixture_validation_passed_with_warnings";
const expectedNextPrompt = "SOUND-OSS-TOOLS-10: scoped status owner approval, no media processing";

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
  packageJson.scripts?.["sound-oss-tools-9:diagnostics"] ===
    "node scripts/validation/sound-oss-tools-9-scoped-synthetic-fixture-pass-review-diagnostics.mjs",
  "package.json must include sound-oss-tools-9:diagnostics",
);

const passReview = parseBlock(
  "docs/sound-oss-tools-9-scoped-synthetic-fixture-pass-review.md",
  "sound-oss-tools-9-scoped-pass-review",
);
const wording = parseBlock(
  "docs/sound-music-audio-open-source-tool-scoped-synthetic-fixture-downstream-wording-register.md",
  "sound-oss-tools-9-downstream-wording-register",
);
const evidence = parseBlock(
  "docs/sound-music-audio-open-source-tool-scoped-synthetic-fixture-pass-review-evidence.md",
  "sound-oss-tools-9-pass-review-evidence",
);
const blockers = parseBlock(
  "docs/sound-music-audio-open-source-tool-scoped-synthetic-fixture-pass-review-blockers.md",
  "sound-oss-tools-9-pass-review-blockers",
);
const recommendation = parseBlock(
  "docs/sound-music-audio-open-source-tool-scoped-synthetic-fixture-next-stage-recommendation.md",
  "sound-oss-tools-9-next-stage-recommendation",
);
const results = parseBlock(
  "docs/sound-oss-tools-9-scoped-synthetic-fixture-pass-review-results.md",
  "sound-oss-tools-9-pass-review-results",
);

const pr470Gate = parseBlock(
  "docs/sound-oss-tools-8-synthetic-fixture-gate-status.md",
  "sound-oss-tools-8-synthetic-fixture-gate-status",
);
const pr470Register = parseBlock(
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-gate-status-register.md",
  "sound-oss-tools-8-gate-status-register",
);
const pr461Result = parseBlock(
  "docs/sound-oss-tools-6-synthetic-fixture-validation-result.md",
  "sound-oss-tools-6-synthetic-fixture-validation-result",
);

for (const block of [passReview, wording, evidence, blockers, recommendation, results]) {
  assert(block.phase === "SOUND-OSS-TOOLS-9", "All new blocks must be SOUND-OSS-TOOLS-9");
  assert(block.decision === expectedDecision, "Unexpected SOUND-OSS-TOOLS-9 decision");
  assert(
    block.nextPrompt === expectedNextPrompt || block.nextGate === expectedNextPrompt || block.recommendation?.includes("SOUND-OSS-TOOLS-10"),
    "Unexpected next prompt or recommendation",
  );
}

assert(pr470Gate.decision === expectedPr470Decision, "PR #470 gate-status decision drifted");
assert(passReview.pr470EvidenceConsumed?.pullRequest === "PR #470", "PR #470 evidence must be referenced");
assert(passReview.pr470EvidenceConsumed?.accepted === true, "PR #470 evidence must be accepted");
assert(passReview.pr470EvidenceConsumed?.scopedStatus === expectedScopedStatus, "PR #470 scoped status must be consumed");
assert(pr470Register.scopedStatus === expectedScopedStatus, "PR #470 scoped status must remain preserved");
assert(results.scopedStatusReviewed === expectedScopedStatus, "Results must review scoped status");

const counts = [
  evidence.fixtureCounts,
  results.sourceEvidenceAccepted,
  {
    fixturesAttempted: pr470Register.fixtureAttemptedCount,
    fixturesPassed: pr470Register.fixturePassedCount,
    fixturesSkippedByPolicy: pr470Register.fixtureSkippedCount,
    fixturesFailed: pr470Register.fixtureFailedCount,
  },
  {
    fixturesAttempted: pr461Result.fixtureValidationSummary?.fixtureCount,
    fixturesPassed: pr461Result.fixtureValidationSummary?.passedCount,
    fixturesSkippedByPolicy: pr461Result.fixtureValidationSummary?.skippedCount,
    fixturesFailed: pr461Result.fixtureValidationSummary?.failedCount,
  },
];

for (const count of counts) {
  assert(
    count.attempted === 14 || count.fixturesAttempted === 14,
    "Fixture attempted count must be 14",
  );
  assert(count.passed === 12 || count.fixturesPassed === 12, "Fixture passed count must be 12");
  assert(
    count.skippedByPolicy === 2 || count.fixturesSkippedByPolicy === 2,
    "Fixture skipped count must be 2",
  );
  assert(count.failed === 0 || count.fixturesFailed === 0, "Fixture failed count must be 0");
}

for (const pullRequest of ["PR #470", "PR #465", "PR #461", "PR #453", "PR #450", "PR #442", "PR #436", "PR #431", "PR #424", "PR #418"]) {
  assert(
    evidence.evidence.some((entry) => entry.pullRequest === pullRequest && entry.accepted === true),
    `Missing accepted evidence for ${pullRequest}`,
  );
}

for (const allowed of [
  expectedScopedStatus,
  "SOUND OSS scoped synthetic fixture validation passed with warnings",
]) {
  assert(wording.allowedWording.includes(allowed), `Allowed wording missing: ${allowed}`);
  assert(passReview.approvedDownstreamWording.includes(allowed), `Approved wording missing: ${allowed}`);
}

for (const forbidden of [
  "generated_local_fixture_passed",
  "dry_run_passed",
  "runtime_ready",
  "production_ready",
  "beta_ready",
  "media_processing_ready",
]) {
  assert(wording.forbiddenWording.includes(forbidden), `Forbidden wording missing: ${forbidden}`);
  assert(passReview.forbiddenWording.includes(forbidden), `Pass review forbidden wording missing: ${forbidden}`);
  assert(results.downstreamWordingDecision.forbidden.includes(forbidden), `Results forbidden wording missing: ${forbidden}`);
}

for (const field of [
  "projectWideGeneratedLocalFixturePassedClaimed",
  "generatedLocalFixturePassedClaimed",
  "dryRunPassedClaimed",
  "runtimeReadinessClaimed",
  "mediaProcessingReadyClaimed",
  "productionReadinessClaimed",
  "betaReadinessClaimed",
]) {
  assert(passReview.claimStatus?.[field] === false, `${field} must be false in pass review`);
  if (field in wording.claimPolicy) {
    assert(wording.claimPolicy[field] === false, `${field} must be false in wording register`);
  }
}

for (const field of [
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
  "creditMutationRun",
  "stripeRun",
  "betaProductionUnlockClaimed",
]) {
  assert(passReview.runtimeFlags?.[field] === false, `${field} must be false`);
}

assert(recommendation.fixPromptRequired === false, "Fix prompt must not be required");
assert(recommendation.recommendation.includes("SOUND-OSS-TOOLS-10"), "Must recommend SOUND-OSS-TOOLS-10");

const blockerIds = new Set(blockers.blockers.map((blocker) => blocker.blockerId));
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
  "runtime_readiness_blocked",
  "project_wide_generated_local_fixture_passed_blocked",
  "dry_run_passed_blocked",
]) {
  assert(blockerIds.has(blockerId), `Missing blocker: ${blockerId}`);
}
for (const blocker of blockers.blockers) {
  assert(blocker.status === "blocked", `Blocker must remain blocked: ${blocker.blockerId}`);
  assert(blocker.mayExecuteNow === false, `Blocker must not execute now: ${blocker.blockerId}`);
}

const allText = requiredFiles.map(read).join("\n");
for (const phrase of [
  "PR #470",
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
  expectedNextPrompt,
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
  "generatedArtifactCreated",
  "runtimeExecutionRun",
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
      decision: passReview.decision,
      scopedStatusReviewed: results.scopedStatusReviewed,
      fixtureCounts: {
        attempted: evidence.fixtureCounts.attempted,
        passed: evidence.fixtureCounts.passed,
        skippedByPolicy: evidence.fixtureCounts.skippedByPolicy,
        failed: evidence.fixtureCounts.failed,
      },
      warnings: ["audioread", "pydub"],
      nextPrompt: expectedNextPrompt,
    },
    null,
    2,
  ),
);
