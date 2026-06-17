#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "docs/sound-oss-tools-11-downstream-status-sync.md",
  "docs/sound-music-audio-open-source-tool-downstream-status-sync-register.md",
  "docs/sound-oss-tools-11-downstream-status-sync-results.md",
  "docs/implementation-prompts/prompt-sound-oss-tools-12-downstream-status-sync-owner-review.md",
  "docs/beta-readiness-scorecard.md",
  "docs/production-beta-blocker-inventory.md",
  "scripts/validation/sound-oss-tools-11-downstream-status-sync-diagnostics.mjs",
  "docs/sound-oss-tools-10-scoped-status-owner-approval.md",
  "docs/sound-music-audio-open-source-tool-scoped-status-owner-approval-register.md",
  "docs/sound-music-audio-open-source-tool-scoped-status-downstream-usage-policy.md",
  "docs/sound-music-audio-open-source-tool-scoped-status-owner-blocker-register.md",
  "docs/sound-music-audio-open-source-tool-scoped-status-downstream-handoff-approval.md",
  "docs/sound-oss-tools-10-scoped-status-owner-approval-results.md",
  "docs/implementation-prompts/prompt-sound-oss-tools-11-downstream-status-sync.md",
  "docs/sound-oss-tools-9-scoped-synthetic-fixture-pass-review.md",
  "docs/sound-music-audio-open-source-tool-scoped-synthetic-fixture-pass-review-evidence.md",
  "docs/sound-oss-tools-8-synthetic-fixture-gate-status.md",
  "docs/sound-oss-tools-7-synthetic-fixture-owner-review.md",
  "docs/sound-oss-tools-6-synthetic-fixture-validation-result.md",
  "docs/cross-chat-tool-ownership-registry.md",
  "docs/sound-music-audio-cross-chat-duplicate-risk-register.md",
  "docs/tool-route-execution-unlock-0-repo-audit.md",
  "docs/activation-tool-route-execution-unlock-5-dry-run-gate-status-reports/tool_route_tool_study_evidence_rollup.json",
  "README.md",
  "package.json",
  "package-lock.json"
];

const expectedDecision =
  "sound_oss_tools_11_downstream_status_sync_passed_with_warnings_ready_for_next_owner_review";
const expectedSound10Decision =
  "sound_oss_tools_10_scoped_status_owner_approval_passed_with_warnings_ready_for_downstream_status_sync";
const expectedSound9Decision =
  "sound_oss_tools_9_scoped_synthetic_fixture_pass_review_passed_with_warnings_ready_for_status_owner_approval";
const expectedScopedStatus = "sound_oss_tools_synthetic_fixture_validation_passed_with_warnings";
const expectedHumanWording = "SOUND OSS scoped synthetic fixture validation passed with warnings";
const expectedSourceHead = "61714ef7140348f273fb7c65b178ffa300a59ce3";
const expectedPr474MergeCommit = "9b2920a5104c01374192d4dbec0fc556643127c2";
const expectedNextPrompt = "SOUND-OSS-TOOLS-12: downstream status sync owner review, no media processing";

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
  packageJson.scripts?.["sound-oss-tools-11:diagnostics"] ===
    "node scripts/validation/sound-oss-tools-11-downstream-status-sync-diagnostics.mjs",
  "package.json must include sound-oss-tools-11:diagnostics",
);

const main = parseBlock(
  "docs/sound-oss-tools-11-downstream-status-sync.md",
  "sound-oss-tools-11-downstream-status-sync",
);
const register = parseBlock(
  "docs/sound-music-audio-open-source-tool-downstream-status-sync-register.md",
  "sound-oss-tools-11-downstream-sync-register",
);
const results = parseBlock(
  "docs/sound-oss-tools-11-downstream-status-sync-results.md",
  "sound-oss-tools-11-downstream-sync-results",
);

const sound10Approval = parseBlock(
  "docs/sound-oss-tools-10-scoped-status-owner-approval.md",
  "sound-oss-tools-10-scoped-status-owner-approval",
);
const sound10Register = parseBlock(
  "docs/sound-music-audio-open-source-tool-scoped-status-owner-approval-register.md",
  "sound-oss-tools-10-owner-approval-register",
);
const sound10Policy = parseBlock(
  "docs/sound-music-audio-open-source-tool-scoped-status-downstream-usage-policy.md",
  "sound-oss-tools-10-downstream-usage-policy",
);
const sound10Blockers = parseBlock(
  "docs/sound-music-audio-open-source-tool-scoped-status-owner-blocker-register.md",
  "sound-oss-tools-10-owner-blocker-register",
);
const sound10Handoff = parseBlock(
  "docs/sound-music-audio-open-source-tool-scoped-status-downstream-handoff-approval.md",
  "sound-oss-tools-10-downstream-handoff-approval",
);
const sound10Results = parseBlock(
  "docs/sound-oss-tools-10-scoped-status-owner-approval-results.md",
  "sound-oss-tools-10-owner-approval-results",
);
const sound9PassReview = parseBlock(
  "docs/sound-oss-tools-9-scoped-synthetic-fixture-pass-review.md",
  "sound-oss-tools-9-scoped-pass-review",
);
const sound9Evidence = parseBlock(
  "docs/sound-music-audio-open-source-tool-scoped-synthetic-fixture-pass-review-evidence.md",
  "sound-oss-tools-9-pass-review-evidence",
);
const sound6Result = parseBlock(
  "docs/sound-oss-tools-6-synthetic-fixture-validation-result.md",
  "sound-oss-tools-6-synthetic-fixture-validation-result",
);

for (const block of [main, register, results]) {
  assert(block.phase === "SOUND-OSS-TOOLS-11", "All SOUND-11 blocks must use phase SOUND-OSS-TOOLS-11");
  assert(block.decision === expectedDecision, "Unexpected SOUND-OSS-TOOLS-11 decision");
  assert(block.nextPrompt === expectedNextPrompt, "Unexpected SOUND-OSS-TOOLS-11 next prompt");
}
assert(main.sourceHead === expectedSourceHead, "Main source head must be PR #479 merge commit");
assert(results.sourceHead === expectedSourceHead, "Results source head must be PR #479 merge commit");
assert(main.pr479EvidenceConsumed?.pullRequest === "PR #479", "PR #479 evidence must be consumed");
assert(main.pr479EvidenceConsumed?.mergeCommit === expectedSourceHead, "PR #479 merge commit must match");
assert(main.pr479EvidenceConsumed?.decision === expectedSound10Decision, "PR #479 decision must match SOUND-10");
assert(main.pr479EvidenceConsumed?.accepted === true, "PR #479 evidence must be accepted");
assert(main.pr474EvidencePreserved?.pullRequest === "PR #474", "PR #474 evidence must be preserved");
assert(main.pr474EvidencePreserved?.mergeCommit === expectedPr474MergeCommit, "PR #474 merge commit must match");
assert(main.pr474EvidencePreserved?.decision === expectedSound9Decision, "PR #474 decision must match SOUND-9");
assert(main.pr474EvidencePreserved?.accepted === true, "PR #474 evidence must be accepted");

assert(sound10Approval.decision === expectedSound10Decision, "SOUND-10 approval decision drifted");
assert(sound10Approval.pr474EvidenceConsumed?.accepted === true, "SOUND-10 must accept PR #474 evidence");
assert(sound10Approval.acceptedScopedStatus === expectedScopedStatus, "SOUND-10 scoped status drifted");
assert(sound10Register.approvedScopedStatus === expectedScopedStatus, "SOUND-10 register scoped status drifted");
assert(sound10Policy.mayReference.includes(expectedScopedStatus), "SOUND-10 policy must allow scoped status");
assert(sound10Policy.maySay.includes(expectedHumanWording), "SOUND-10 policy must allow human wording");
assert(sound10Results.sourceEvidenceAccepted?.pr474PassReviewAccepted === true, "SOUND-10 results must accept PR #474");
assert(sound9PassReview.decision === expectedSound9Decision, "SOUND-9 decision drifted");
assert(sound9PassReview.pr470EvidenceConsumed?.accepted === true, "SOUND-9 must preserve PR #470 evidence");

const countBlocks = [
  main.pr461FixtureCountsPreserved,
  results.sourceEvidenceAccepted,
  sound10Approval.pr461FixtureCountsPreserved,
  sound10Policy.pr461FixtureCountsPreserved,
  sound10Results.sourceEvidenceAccepted,
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

for (const wording of [expectedScopedStatus, expectedHumanWording]) {
  assert(main.allowedDownstreamWording.includes(wording), `Main missing wording: ${wording}`);
  assert(results.scopedStatusSync.machineStatus === expectedScopedStatus, "Results machine status must match");
  assert(results.scopedStatusSync.humanMeaning === expectedHumanWording, "Results human meaning must match");
}

const updatedDocs = [
  "docs/beta-readiness-scorecard.md",
  "docs/production-beta-blocker-inventory.md"
];
assert(register.updatedDocCount === 2, "Register must update exactly two docs");
for (const doc of updatedDocs) {
  assert(main.downstreamDocsUpdated.includes(doc), `Main missing updated doc: ${doc}`);
  assert(results.scopedStatusSync.updatedDocs.includes(doc), `Results missing updated doc: ${doc}`);
  assert(
    register.inspectedCandidates.some((entry) => entry.targetDoc === doc && entry.safeToUpdate === true && entry.updated === true),
    `Register must mark doc updated and safe: ${doc}`,
  );
}

for (const skippedDoc of [
  "README.md",
  "docs/cross-chat-tool-ownership-registry.md",
  "docs/sound-music-audio-cross-chat-duplicate-risk-register.md",
  "docs/tool-route-execution-unlock-0-repo-audit.md",
  "docs/activation-tool-route-execution-unlock-5-dry-run-gate-status-reports/tool_route_tool_study_evidence_rollup.json"
]) {
  assert(main.intentionallySkippedDocs.includes(skippedDoc), `Main missing skipped doc: ${skippedDoc}`);
  assert(results.scopedStatusSync.skippedDocs.includes(skippedDoc), `Results missing skipped doc: ${skippedDoc}`);
  assert(
    register.inspectedCandidates.some((entry) => entry.targetDoc === skippedDoc && entry.safeToUpdate === false && entry.updated === false),
    `Register must mark doc skipped: ${skippedDoc}`,
  );
}

for (const doc of updatedDocs) {
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

for (const forbidden of [
  "generated_local_fixture_passed",
  "dry_run_passed",
  "runtime_ready",
  "production_ready",
  "beta_ready",
  "media_processing_ready"
]) {
  assert(main.forbiddenWording.includes(forbidden), `Main forbidden wording missing: ${forbidden}`);
  assert(register.forbiddenWording.includes(forbidden), `Register forbidden wording missing: ${forbidden}`);
  assert(results.forbiddenWording.includes(forbidden), `Results forbidden wording missing: ${forbidden}`);
  assert(sound10Policy.mayNotSay.includes(forbidden), `SOUND-10 policy forbidden wording missing: ${forbidden}`);
  assert(sound10Handoff.forbiddenClaims.includes(forbidden), `SOUND-10 handoff forbidden claim missing: ${forbidden}`);
}

for (const warning of ["audioread file-open", "pydub media operations"]) {
  assert(main.warnings.some((entry) => entry.includes(warning)), `Main missing warning: ${warning}`);
  assert(results.warnings.some((entry) => entry.includes(warning)), `Results missing warning: ${warning}`);
}
assert(sound10Policy.preserveWarningsAndBlockers.includes("audioread file-open blocker"), "SOUND-10 policy must preserve audioread blocker");
assert(sound10Policy.preserveWarningsAndBlockers.includes("pydub media-operation blocker"), "SOUND-10 policy must preserve pydub blocker");

const blockerIds = new Set(sound10Blockers.blockers.map((blocker) => blocker.blockerId));
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
  "dry_run_passed_blocked"
]) {
  assert(blockerIds.has(blockerId), `Missing inherited blocker: ${blockerId}`);
}
for (const blocker of sound10Blockers.blockers) {
  assert(blocker.status === "blocked", `Inherited blocker must remain blocked: ${blocker.blockerId}`);
  assert(blocker.mayExecuteNow === false, `Inherited blocker must not execute now: ${blocker.blockerId}`);
}
for (const blockedPhrase of [
  "FFmpeg/ffprobe",
  "Demucs/RNNoise/Essentia/Rubber Band",
  "workers/routes/providers",
  "Supabase/SQL",
  "signed URLs/public artifacts",
  "beta/production"
]) {
  assert(main.remainingBlockers.some((entry) => entry.includes(blockedPhrase)), `Main missing blocker phrase: ${blockedPhrase}`);
  assert(results.blockedScope.some((entry) => entry.includes(blockedPhrase)), `Results missing blocker phrase: ${blockedPhrase}`);
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
  "PR #479"
]) {
  assert(results.pullRequestsInspected.includes(pullRequest), `Missing inspected PR: ${pullRequest}`);
}
for (const pullRequest of ["PR #470", "PR #465", "PR #461", "PR #453", "PR #450", "PR #442", "PR #436", "PR #431", "PR #424", "PR #418"]) {
  assert(
    sound9Evidence.evidence.some((entry) => entry.pullRequest === pullRequest && entry.accepted === true),
    `SOUND-9 evidence missing accepted ${pullRequest}`,
  );
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
  assert(hasFalseFlag(main, field), `${field} must be false in main`);
  assert(hasFalseFlag(results, field), `${field} must be false in results`);
  assert(hasFalseFlag(sound10Approval, field), `${field} must remain false in SOUND-10 approval`);
  assert(hasFalseFlag(sound10Results, field), `${field} must remain false in SOUND-10 results`);
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
  "generatedArtifactCreated",
  "creditMutationRun",
  "stripeRun",
  "betaProductionUnlockClaimed"
]) {
  assert(main.runtimeFlags?.[field] === false, `${field} must be false in main`);
  assert(results.runtimeFlags?.[field] === false, `${field} must be false in results`);
}
for (const field of [
  "projectWideGeneratedLocalFixturePassed",
  "dryRunPassed",
  "runtimeReadiness",
  "mediaProcessingApproved",
  "supabaseMutationApproved",
  "artifactsApproved",
  "betaProductionApproved"
]) {
  assert(sound10Register[field] === false, `${field} must remain false in SOUND-10 owner register`);
}

const allText = requiredFiles.map(read).join("\n");
for (const phrase of [
  "PR #479",
  "PR #474",
  "PR #461",
  "14 attempted",
  "12 passed",
  "2 skipped",
  "0 failed",
  expectedScopedStatus,
  expectedHumanWording,
  "audioread file-open",
  "pydub media operations",
  "real user data",
  "media processing",
  "Supabase",
  "signed URL",
  "public artifact",
  "beta/production",
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
assert(!/\b(Authorization\s*:\s*Bearer|Bearer\s+[A-Za-z0-9._~+/=-]{24,})/i.test(allText), "Bearer token must not appear");
assert(!/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/.test(allText), "JWT must not appear");
assert(!/secret[_-]?key\s*[:=]\s*["'][^"']{8,}["']/i.test(allText), "Secret-shaped value must not appear");
assert(!/signedUrl\s*[:=]\s*["']https?:\/\//i.test(allText), "Signed URL value must not appear");
assert(!/publicArtifactUrl\s*[:=]\s*["']https?:\/\//i.test(allText), "Public artifact URL value must not appear");

console.log(
  JSON.stringify(
    {
      status: "passed",
      decision: main.decision,
      sourceHead: main.sourceHead,
      approvedScopedStatus: main.scopedStatus,
      updatedDocs,
      fixtureCounts: {
        attempted: main.pr461FixtureCountsPreserved.attempted,
        passed: main.pr461FixtureCountsPreserved.passed,
        skippedByPolicy: main.pr461FixtureCountsPreserved.skippedByPolicy,
        failed: main.pr461FixtureCountsPreserved.failed
      },
      warnings: ["audioread", "pydub"],
      nextPrompt: expectedNextPrompt
    },
    null,
    2,
  ),
);
