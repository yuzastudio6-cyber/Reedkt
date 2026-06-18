#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "docs/sound-oss-tools-12-downstream-status-sync-owner-review.md",
  "docs/sound-music-audio-open-source-tool-downstream-status-sync-owner-acceptance.md",
  "docs/sound-music-audio-open-source-tool-downstream-status-sync-owner-blocker-review.md",
  "docs/sound-music-audio-open-source-tool-downstream-status-sync-owner-decision-policy.md",
  "docs/sound-music-audio-open-source-tool-downstream-status-sync-next-stage-recommendation.md",
  "docs/sound-oss-tools-12-downstream-status-sync-owner-review-results.md",
  "docs/implementation-prompts/prompt-sound-oss-tools-13-final-scoped-evidence-rollup.md",
  "scripts/validation/sound-oss-tools-12-downstream-status-sync-owner-review-diagnostics.mjs",
  "docs/sound-oss-tools-11-downstream-status-sync.md",
  "docs/sound-music-audio-open-source-tool-downstream-status-sync-register.md",
  "docs/sound-oss-tools-11-downstream-status-sync-results.md",
  "docs/implementation-prompts/prompt-sound-oss-tools-12-downstream-status-sync-owner-review.md",
  "scripts/validation/sound-oss-tools-11-downstream-status-sync-diagnostics.mjs",
  "docs/beta-readiness-scorecard.md",
  "docs/production-beta-blocker-inventory.md",
  "docs/sound-oss-tools-10-scoped-status-owner-approval.md",
  "docs/sound-music-audio-open-source-tool-scoped-status-downstream-usage-policy.md",
  "docs/sound-music-audio-open-source-tool-scoped-status-owner-approval-register.md",
  "docs/sound-music-audio-open-source-tool-scoped-status-owner-blocker-register.md",
  "docs/sound-music-audio-open-source-tool-scoped-status-downstream-handoff-approval.md",
  "docs/sound-oss-tools-10-scoped-status-owner-approval-results.md",
  "docs/sound-oss-tools-9-scoped-synthetic-fixture-pass-review.md",
  "docs/sound-oss-tools-8-synthetic-fixture-gate-status.md",
  "docs/sound-oss-tools-6-synthetic-fixture-validation-result.md",
  "docs/cross-chat-tool-ownership-registry.md",
  "docs/sound-music-audio-cross-chat-duplicate-risk-register.md",
  "package.json",
  "package-lock.json"
];

const expectedDecision =
  "sound_oss_tools_12_downstream_status_sync_owner_review_passed_with_warnings_ready_for_final_rollup";
const expectedSound11Decision =
  "sound_oss_tools_11_downstream_status_sync_passed_with_warnings_ready_for_next_owner_review";
const expectedSound10Decision =
  "sound_oss_tools_10_scoped_status_owner_approval_passed_with_warnings_ready_for_downstream_status_sync";
const expectedScopedStatus = "sound_oss_tools_synthetic_fixture_validation_passed_with_warnings";
const expectedHumanWording = "SOUND OSS scoped synthetic fixture validation passed with warnings";
const expectedSourceHead = "a0c6d5f7a57bbb93c85c5b751b00cd1a416b1b05";
const expectedPr483Head = "cac88a7c16e0ea066d2c04030e4567a55dc74fbd";
const expectedNextPrompt = "SOUND-OSS-TOOLS-13: final scoped SOUND OSS evidence rollup, no media processing";

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

function hasFalseFlag(block, field) {
  return block?.[field] === false || block?.claimStatus?.[field] === false || block?.runtimeFlags?.[field] === false;
}

function includesAll(text, phrases, context) {
  for (const phrase of phrases) {
    assert(text.includes(phrase), `${context} missing phrase: ${phrase}`);
  }
}

for (const file of requiredFiles) {
  assert(existsSync(file), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
assert(
  packageJson.scripts?.["sound-oss-tools-12:diagnostics"] ===
    "node scripts/validation/sound-oss-tools-12-downstream-status-sync-owner-review-diagnostics.mjs",
  "package.json must include sound-oss-tools-12:diagnostics",
);

const review = parseBlock(
  "docs/sound-oss-tools-12-downstream-status-sync-owner-review.md",
  "sound-oss-tools-12-downstream-status-sync-owner-review",
);
const acceptance = parseBlock(
  "docs/sound-music-audio-open-source-tool-downstream-status-sync-owner-acceptance.md",
  "sound-oss-tools-12-owner-acceptance",
);
const blockerReview = parseBlock(
  "docs/sound-music-audio-open-source-tool-downstream-status-sync-owner-blocker-review.md",
  "sound-oss-tools-12-owner-blocker-review",
);
const policy = parseBlock(
  "docs/sound-music-audio-open-source-tool-downstream-status-sync-owner-decision-policy.md",
  "sound-oss-tools-12-owner-decision-policy",
);
const recommendation = parseBlock(
  "docs/sound-music-audio-open-source-tool-downstream-status-sync-next-stage-recommendation.md",
  "sound-oss-tools-12-next-stage-recommendation",
);
const results = parseBlock(
  "docs/sound-oss-tools-12-downstream-status-sync-owner-review-results.md",
  "sound-oss-tools-12-owner-review-results",
);

const sound11 = parseBlock(
  "docs/sound-oss-tools-11-downstream-status-sync.md",
  "sound-oss-tools-11-downstream-status-sync",
);
const sound11Register = parseBlock(
  "docs/sound-music-audio-open-source-tool-downstream-status-sync-register.md",
  "sound-oss-tools-11-downstream-sync-register",
);
const sound11Results = parseBlock(
  "docs/sound-oss-tools-11-downstream-status-sync-results.md",
  "sound-oss-tools-11-downstream-sync-results",
);
const sound10Approval = parseBlock(
  "docs/sound-oss-tools-10-scoped-status-owner-approval.md",
  "sound-oss-tools-10-scoped-status-owner-approval",
);
const sound10Policy = parseBlock(
  "docs/sound-music-audio-open-source-tool-scoped-status-downstream-usage-policy.md",
  "sound-oss-tools-10-downstream-usage-policy",
);
const sound6Result = parseBlock(
  "docs/sound-oss-tools-6-synthetic-fixture-validation-result.md",
  "sound-oss-tools-6-synthetic-fixture-validation-result",
);

for (const block of [review, acceptance, blockerReview, policy, recommendation, results]) {
  assert(block.phase === "SOUND-OSS-TOOLS-12", "All SOUND-12 blocks must use phase SOUND-OSS-TOOLS-12");
  assert(block.decision === expectedDecision, "Unexpected SOUND-OSS-TOOLS-12 decision");
  assert(block.nextPrompt === expectedNextPrompt || block.recommendation === expectedNextPrompt, "Unexpected SOUND-OSS-TOOLS-12 next prompt");
}

assert(review.sourceHead === expectedSourceHead, "Review source head must be PR #483 merge commit");
assert(results.sourceHead === expectedSourceHead, "Results source head must be PR #483 merge commit");
assert(review.pr483EvidenceConsumed?.pullRequest === "PR #483", "PR #483 evidence must be consumed");
assert(review.pr483EvidenceConsumed?.mergeCommit === expectedSourceHead, "PR #483 merge commit must match");
assert(review.pr483EvidenceConsumed?.headCommit === expectedPr483Head, "PR #483 head commit must match");
assert(review.pr483EvidenceConsumed?.decision === expectedSound11Decision, "PR #483 decision must match SOUND-11");
assert(review.pr483EvidenceConsumed?.accepted === true, "PR #483 evidence must be accepted");
assert(review.pr479EvidencePreserved?.accepted === true, "PR #479 evidence must remain accepted");

assert(sound11.decision === expectedSound11Decision, "SOUND-11 decision drifted");
assert(sound11.pr479EvidenceConsumed?.accepted === true, "SOUND-11 must accept PR #479 evidence");
assert(sound11.scopedStatus === expectedScopedStatus, "SOUND-11 scoped status drifted");
assert(sound11Results.scopedStatusSync?.machineStatus === expectedScopedStatus, "SOUND-11 results machine status drifted");
assert(sound11Results.scopedStatusSync?.humanMeaning === expectedHumanWording, "SOUND-11 results human wording drifted");
assert(sound10Approval.decision === expectedSound10Decision, "SOUND-10 approval decision drifted");
assert(sound10Policy.mayReference.includes(expectedScopedStatus), "SOUND-10 policy must allow scoped status");
assert(sound10Policy.maySay.includes(expectedHumanWording), "SOUND-10 policy must allow human wording");

for (const wording of [expectedScopedStatus, expectedHumanWording]) {
  assert(review.scopedWordingVerification?.machineStatus === expectedScopedStatus, "Review machine wording must match");
  assert(review.scopedWordingVerification?.humanMeaning === expectedHumanWording, "Review human wording must match");
  assert(policy.mayReference.includes(expectedScopedStatus), "Policy must allow only scoped machine status");
  assert(policy.maySay.includes(expectedHumanWording), "Policy must allow scoped human wording");
  assert(results.scopedWordingStatus?.machineStatus === expectedScopedStatus, "Results machine status must match");
  assert(results.scopedWordingStatus?.humanMeaning === expectedHumanWording, "Results human meaning must match");
  assert(read("docs/implementation-prompts/prompt-sound-oss-tools-13-final-scoped-evidence-rollup.md").includes(wording), `SOUND-13 prompt missing wording: ${wording}`);
}

const updatedDocs = [
  "docs/beta-readiness-scorecard.md",
  "docs/production-beta-blocker-inventory.md"
];
for (const doc of updatedDocs) {
  assert(review.downstreamDocsReviewed.includes(doc), `Review missing downstream doc: ${doc}`);
  assert(acceptance.reviewedDocs.some((entry) => entry.targetDoc === doc && entry.accepted === true), `Acceptance missing accepted doc: ${doc}`);
  assert(results.downstreamDocsAccepted.includes(doc), `Results missing accepted doc: ${doc}`);
  assert(sound11.downstreamDocsUpdated.includes(doc), `SOUND-11 missing updated doc: ${doc}`);
  assert(sound11Results.scopedStatusSync.updatedDocs.includes(doc), `SOUND-11 results missing updated doc: ${doc}`);
  const text = read(doc);
  includesAll(
    text,
    [
      "SOUND_MUSIC_AUDIO / SOUND OSS scoped status",
      expectedScopedStatus,
      expectedHumanWording,
      "SOUND OSS metadata/status only",
      "Not project-wide `generated_local_fixture_passed`",
      "Not `dry_run_passed`",
      "Not runtime readiness",
      "Not media processing readiness",
      "audioread",
      "pydub",
      "FFmpeg/ffprobe",
      "Demucs/RNNoise/Essentia/Rubber Band",
      "workers/routes/providers",
      "Supabase/SQL",
      "signed URLs/public artifacts",
      "beta/production"
    ],
    doc,
  );
}
for (const entry of acceptance.reviewedDocs) {
  assert(entry.accepted === true, `Reviewed doc must be accepted: ${entry.targetDoc}`);
  assert(entry.scopedWordingPresent === true, `Scoped wording missing for ${entry.targetDoc}`);
  assert(entry.forbiddenWordingAvoided === true, `Forbidden wording not avoided for ${entry.targetDoc}`);
  assert(entry.blockersPreserved === true, `Blockers not preserved for ${entry.targetDoc}`);
  assert(entry.wideningRisk === "none", `Widening risk must be none for ${entry.targetDoc}`);
}
assert(policy.additionalDownstreamDocsApproved === false, "Policy must not approve additional downstream docs");
assert(policy.requiresSeparateReviewForAdditionalDocs === true, "Policy must require separate review for additional docs");
assert(policy.furtherStatusPropagationRequiresExplicitGate === true, "Further propagation must require explicit gate");

for (const forbidden of [
  "generated_local_fixture_passed",
  "dry_run_passed",
  "runtime_ready",
  "production_ready",
  "beta_ready",
  "media_processing_ready"
]) {
  assert(review.forbiddenWordingVerification?.[forbidden] === "blocked_unclaimed", `Review forbidden status must be blocked: ${forbidden}`);
  assert(policy.mayNotClaim.includes(forbidden), `Policy forbidden status missing: ${forbidden}`);
  assert(results.forbiddenWordingStatus?.[forbidden] === "blocked_unclaimed", `Results forbidden status must be blocked: ${forbidden}`);
  assert(sound11.forbiddenWording.includes(forbidden), `SOUND-11 forbidden wording missing: ${forbidden}`);
  assert(sound10Policy.mayNotSay.includes(forbidden), `SOUND-10 policy forbidden wording missing: ${forbidden}`);
}

for (const field of [
  "projectWideGeneratedLocalFixturePassedClaimed",
  "generatedLocalFixturePassedClaimed",
  "dryRunPassedClaimed",
  "runtimeReadinessClaimed",
  "mediaProcessingReadyClaimed",
  "productionReadinessClaimed",
  "betaReadinessClaimed"
]) {
  assert(hasFalseFlag(review, field), `${field} must be false in review`);
  assert(hasFalseFlag(results, field), `${field} must be false in results`);
  assert(policy.claimPolicy?.[field] === false, `${field} must be false in policy`);
}

const blockerIds = new Set(blockerReview.blockers.map((blocker) => blocker.blockerId));
for (const blockerId of [
  "audioread_file_open_blocked_no_media",
  "pydub_media_operations_blocked_ffmpeg_avconv_warning",
  "ffmpeg_ffprobe_blocked",
  "demucs_rnnoise_essentia_rubber_band_blocked",
  "worker_route_provider_blocked",
  "supabase_sql_blocked",
  "signed_urls_public_artifacts_blocked",
  "credits_stripe_blocked",
  "beta_production_blocked",
  "runtime_readiness_blocked",
  "project_wide_generated_local_fixture_passed_blocked",
  "dry_run_passed_blocked"
]) {
  assert(blockerIds.has(blockerId), `Missing blocker: ${blockerId}`);
}
for (const blocker of blockerReview.blockers) {
  assert(blocker.preserved === true, `Blocker must be preserved: ${blocker.blockerId}`);
  assert(typeof blocker.ownerNeededToClear === "string" && blocker.ownerNeededToClear.length > 0, `Missing owner for blocker: ${blocker.blockerId}`);
  assert(typeof blocker.nextAction === "string" && blocker.nextAction.includes("Keep blocked"), `Missing blocked next action: ${blocker.blockerId}`);
}
assert(blockerReview.allBlockersPreserved === true, "All blockers must be preserved");

for (const key of [
  "audioreadFileOpen",
  "pydubMediaOperationsFfmpegWarning",
  "ffmpegFfprobe",
  "demucsRnnoiseEssentiaRubberBand",
  "workersRoutesProvidersModels",
  "supabaseSql",
  "signedUrlsPublicArtifacts",
  "creditsStripe",
  "betaProduction",
  "runtimeReadinessBlocker"
]) {
  assert(review.blockerPreservationVerification?.[key] === true, `Review blocker verification missing: ${key}`);
  assert(results.blockerPreservationStatus?.[key] === true, `Results blocker status missing: ${key}`);
}

const countBlocks = [
  sound11.pr461FixtureCountsPreserved,
  sound11Results.sourceEvidenceAccepted,
  results.sourceEvidenceAccepted,
  {
    fixturesAttempted: sound6Result.fixtureValidationSummary?.fixtureCount,
    fixturesPassed: sound6Result.fixtureValidationSummary?.passedCount,
    fixturesSkippedByPolicy: sound6Result.fixtureValidationSummary?.skippedCount,
    fixturesFailed: sound6Result.fixtureValidationSummary?.failedCount
  }
];
for (const count of countBlocks) {
  assert(count.attempted === 14 || count.fixturesAttempted === 14, "Fixture attempted count must be 14");
  assert(count.passed === 12 || count.fixturesPassed === 12, "Fixture passed count must be 12");
  assert(count.skippedByPolicy === 2 || count.fixturesSkippedByPolicy === 2, "Fixture skipped count must be 2");
  assert(count.failed === 0 || count.fixturesFailed === 0, "Fixture failed count must be 0");
}

for (const pullRequest of [
  "PR #418",
  "PR #424",
  "PR #431",
  "PR #436",
  "PR #442",
  "PR #450",
  "PR #453",
  "PR #461",
  "PR #465",
  "PR #470",
  "PR #474",
  "PR #479",
  "PR #483"
]) {
  assert(results.pullRequestsInspected.includes(pullRequest), `Missing inspected PR: ${pullRequest}`);
}
assert(results.sourceEvidenceAccepted?.pr483DownstreamStatusSyncAccepted === true, "PR #483 evidence must be accepted");
assert(results.sourceEvidenceAccepted?.pr479OwnerApprovalAccepted === true, "PR #479 evidence must be accepted");
assert(recommendation.recommendation === expectedNextPrompt, "Next-stage recommendation must be SOUND-13");
assert(recommendation.blockedFixPrompt === null, "No blocker fix prompt should be recommended");

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
  "generatedArtifactCreated",
  "creditMutationRun",
  "stripeRun",
  "betaProductionUnlockClaimed"
]) {
  assert(review.runtimeFlags?.[field] === false, `${field} must be false in review`);
  assert(results.runtimeFlags?.[field] === false, `${field} must be false in results`);
}

const allText = requiredFiles.map(read).join("\n");
for (const phrase of [
  "PR #483",
  "PR #479",
  "PR #461",
  "14 attempted",
  "12 passed",
  "2 skipped",
  "0 failed",
  expectedScopedStatus,
  expectedHumanWording,
  "audioread file-open",
  "pydub media operations",
  "FFmpeg/ffprobe",
  "Demucs/RNNoise/Essentia/Rubber Band",
  "workers/routes/providers",
  "Supabase/SQL",
  "signed URLs/public artifacts",
  "credits/Stripe",
  "beta/production",
  "runtime readiness",
  expectedNextPrompt
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
  "dryRunPassed",
  "dryRunPassedClaimed",
  "generatedLocalFixturePassedClaimed",
  "projectWideGeneratedLocalFixturePassed",
  "projectWideGeneratedLocalFixturePassedClaimed",
  "runtimeReadiness",
  "runtimeReadinessClaimed",
  "mediaProcessingApproved",
  "supabaseMutationApproved",
  "artifactsApproved",
  "betaProductionApproved",
  "betaProductionUnlockClaimed",
  "productionReadinessClaimed",
  "betaReadinessClaimed",
  "mediaProcessingReadyClaimed"
];
for (const field of unsafeTrueFields) {
  assert(!new RegExp(`"${field}"\\s*:\\s*true`).test(allText), `${field} must not be true`);
}

const generatedLocal = "generated" + "_local" + "_fixture" + "_passed";
const dryRun = "dry" + "_run" + "_passed";
assert(!new RegExp(`${generatedLocal}\\s*[:=]\\s*true`, "i").test(allText), "Project-wide fixture claim must not be true");
assert(!new RegExp(`${dryRun}\\s*[:=]\\s*true`, "i").test(allText), "dry run pass claim must not be true");
assert(!/https?:\/\/[a-z0-9-]+\.supabase\.co/i.test(allText), "Supabase URL must not appear");
assert(!/postgres(?:ql)?:\/\/[^\s"')]+/i.test(allText), "Database URL must not appear");
assert(!/\b(Authorization\s*:\s*Bearer|Bearer\s+[A-Za-z0-9._~+/=-]{24,})/i.test(allText), "Bearer token must not appear");
assert(!/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/.test(allText), "JWT must not appear");
assert(!/secret[_-]?key\s*[:=]\s*["'][^"']{8,}["']/i.test(allText), "Secret-shaped value must not appear");
assert(!/signedUrl\s*[:=]\s*["']https?:\/\//i.test(allText), "Signed URL value must not appear");
assert(!/publicArtifactUrl\s*[:=]\s*["']https?:\/\//i.test(allText), "Public artifact URL value must not appear");

console.log(
  JSON.stringify(
    {
      status: "passed",
      decision: review.decision,
      sourceHead: review.sourceHead,
      acceptedDocs: results.downstreamDocsAccepted,
      scopedStatus: review.scopedWordingVerification.machineStatus,
      warnings: ["audioread", "pydub", "inherited readiness blockers"],
      nextPrompt: expectedNextPrompt
    },
    null,
    2,
  ),
);
