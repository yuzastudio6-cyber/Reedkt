#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "docs/sound-oss-tools-10-scoped-status-owner-approval.md",
  "docs/sound-music-audio-open-source-tool-scoped-status-owner-approval-register.md",
  "docs/sound-music-audio-open-source-tool-scoped-status-downstream-usage-policy.md",
  "docs/sound-music-audio-open-source-tool-scoped-status-owner-blocker-register.md",
  "docs/sound-music-audio-open-source-tool-scoped-status-downstream-handoff-approval.md",
  "docs/sound-oss-tools-10-scoped-status-owner-approval-results.md",
  "docs/implementation-prompts/prompt-sound-oss-tools-11-downstream-status-sync.md",
  "docs/sound-oss-tools-9-scoped-synthetic-fixture-pass-review.md",
  "docs/sound-music-audio-open-source-tool-scoped-synthetic-fixture-downstream-wording-register.md",
  "docs/sound-music-audio-open-source-tool-scoped-synthetic-fixture-pass-review-evidence.md",
  "docs/sound-music-audio-open-source-tool-scoped-synthetic-fixture-pass-review-blockers.md",
  "docs/sound-music-audio-open-source-tool-scoped-synthetic-fixture-next-stage-recommendation.md",
  "docs/sound-oss-tools-9-scoped-synthetic-fixture-pass-review-results.md",
  "docs/implementation-prompts/prompt-sound-oss-tools-10-scoped-status-owner-approval.md",
  "scripts/validation/sound-oss-tools-9-scoped-synthetic-fixture-pass-review-diagnostics.mjs",
  "docs/sound-oss-tools-8-synthetic-fixture-gate-status.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-gate-status-register.md",
  "docs/sound-music-audio-open-source-tool-scoped-synthetic-fixture-claim-register.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-remaining-blocker-status.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-gate-owner-handoff.md",
  "docs/sound-oss-tools-8-synthetic-fixture-gate-status-results.md",
  "docs/sound-oss-tools-7-synthetic-fixture-owner-review.md",
  "docs/sound-oss-tools-6-synthetic-fixture-validation-result.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-validation-matrix.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-validation-blocker-register.md",
  "docs/sound-oss-tools-5-synthetic-fixture-validation-plan.md",
  "docs/sound-oss-tools-4-binary-import-proof-result.md",
  "docs/sound-oss-tools-3-controlled-dependency-install-result.md",
  "docs/cross-chat-tool-ownership-registry.md",
  "docs/sound-music-audio-cross-chat-duplicate-risk-register.md",
  "package.json",
  "package-lock.json",
];

const expectedDecision =
  "sound_oss_tools_10_scoped_status_owner_approval_passed_with_warnings_ready_for_downstream_status_sync";
const expectedPr474Decision =
  "sound_oss_tools_9_scoped_synthetic_fixture_pass_review_passed_with_warnings_ready_for_status_owner_approval";
const expectedScopedStatus = "sound_oss_tools_synthetic_fixture_validation_passed_with_warnings";
const expectedHumanWording = "SOUND OSS scoped synthetic fixture validation passed with warnings";
const expectedNextPrompt = "SOUND-OSS-TOOLS-11: downstream status sync, no media processing";

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

for (const file of requiredFiles) {
  assert(existsSync(file), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
assert(
  packageJson.scripts?.["sound-oss-tools-10:diagnostics"] ===
    "node scripts/validation/sound-oss-tools-10-scoped-status-owner-approval-diagnostics.mjs",
  "package.json must include sound-oss-tools-10:diagnostics",
);

const approval = parseBlock(
  "docs/sound-oss-tools-10-scoped-status-owner-approval.md",
  "sound-oss-tools-10-scoped-status-owner-approval",
);
const register = parseBlock(
  "docs/sound-music-audio-open-source-tool-scoped-status-owner-approval-register.md",
  "sound-oss-tools-10-owner-approval-register",
);
const policy = parseBlock(
  "docs/sound-music-audio-open-source-tool-scoped-status-downstream-usage-policy.md",
  "sound-oss-tools-10-downstream-usage-policy",
);
const blockers = parseBlock(
  "docs/sound-music-audio-open-source-tool-scoped-status-owner-blocker-register.md",
  "sound-oss-tools-10-owner-blocker-register",
);
const handoff = parseBlock(
  "docs/sound-music-audio-open-source-tool-scoped-status-downstream-handoff-approval.md",
  "sound-oss-tools-10-downstream-handoff-approval",
);
const results = parseBlock(
  "docs/sound-oss-tools-10-scoped-status-owner-approval-results.md",
  "sound-oss-tools-10-owner-approval-results",
);

const pr474PassReview = parseBlock(
  "docs/sound-oss-tools-9-scoped-synthetic-fixture-pass-review.md",
  "sound-oss-tools-9-scoped-pass-review",
);
const pr474Wording = parseBlock(
  "docs/sound-music-audio-open-source-tool-scoped-synthetic-fixture-downstream-wording-register.md",
  "sound-oss-tools-9-downstream-wording-register",
);
const pr474Evidence = parseBlock(
  "docs/sound-music-audio-open-source-tool-scoped-synthetic-fixture-pass-review-evidence.md",
  "sound-oss-tools-9-pass-review-evidence",
);
const pr461Result = parseBlock(
  "docs/sound-oss-tools-6-synthetic-fixture-validation-result.md",
  "sound-oss-tools-6-synthetic-fixture-validation-result",
);

for (const block of [approval, register, policy, blockers, handoff, results]) {
  assert(block.phase === "SOUND-OSS-TOOLS-10", "All new blocks must be SOUND-OSS-TOOLS-10");
  assert(block.decision === expectedDecision, "Unexpected SOUND-OSS-TOOLS-10 decision");
  assert(
    block.nextPrompt === expectedNextPrompt ||
      block.nextGate === expectedNextPrompt ||
      block.ownerApprovalConclusion?.nextGate === expectedNextPrompt ||
      block.ownerApprovalDecision?.nextGate === expectedNextPrompt,
    "Unexpected next prompt or next gate",
  );
}

assert(pr474PassReview.decision === expectedPr474Decision, "PR #474 pass-review decision drifted");
assert(pr474PassReview.pr470EvidenceConsumed?.accepted === true, "PR #470 evidence must remain accepted by PR #474");
assert(approval.pr474EvidenceConsumed?.pullRequest === "PR #474", "PR #474 evidence must be referenced");
assert(approval.pr474EvidenceConsumed?.mergeCommit === "9b2920a5104c01374192d4dbec0fc556643127c2", "PR #474 merge commit must match");
assert(approval.pr474EvidenceConsumed?.accepted === true, "PR #474 evidence must be accepted");
assert(approval.pr474EvidenceConsumed?.decision === expectedPr474Decision, "PR #474 decision must be consumed");
assert(approval.acceptedScopedStatus === expectedScopedStatus, "Accepted scoped status must match");
assert(register.approvedScopedStatus === expectedScopedStatus, "Owner register scoped status must match");
assert(handoff.approvedScopedStatus === expectedScopedStatus, "Handoff scoped status must match");

for (const wording of [expectedScopedStatus, expectedHumanWording]) {
  assert(approval.allowedDownstreamWording.includes(wording), `Approval missing wording: ${wording}`);
  assert(results.allowedDownstreamWording.includes(wording), `Results missing wording: ${wording}`);
}
assert(policy.mayReference.includes(expectedScopedStatus), "Policy must allow the scoped machine status");
assert(policy.maySay.includes(expectedHumanWording), "Policy must allow the scoped human wording");
assert(pr474Wording.allowedWording.includes(expectedScopedStatus), "PR #474 allowed wording must include scoped status");
assert(pr474Wording.allowedWording.includes(expectedHumanWording), "PR #474 allowed wording must include human wording");

const allowedEntries = register.allowedDownstreamWording.filter(
  (entry) => entry.mayReferenceInDownstreamStatusDocs === true,
);
assert(allowedEntries.length === 2, "Only two owner-register entries may reference downstream status docs");
assert(
  allowedEntries.every((entry) => [expectedScopedStatus, expectedHumanWording].includes(entry.value)),
  "Only the scoped machine and human status may be downstream-referenced",
);

for (const forbidden of [
  "generated_local_fixture_passed",
  "dry_run_passed",
  "runtime_ready",
  "production_ready",
  "beta_ready",
  "media_processing_ready",
]) {
  assert(approval.forbiddenWording.includes(forbidden), `Approval forbidden wording missing: ${forbidden}`);
  assert(policy.mayNotSay.includes(forbidden), `Policy forbidden wording missing: ${forbidden}`);
  assert(handoff.forbiddenClaims.includes(forbidden), `Handoff forbidden claim missing: ${forbidden}`);
  assert(results.forbiddenWording.includes(forbidden), `Results forbidden wording missing: ${forbidden}`);
  assert(
    register.forbiddenWording.some(
      (entry) => entry.value === forbidden && entry.mayReferenceInDownstreamStatusDocs === false,
    ),
    `Register forbidden wording must be false: ${forbidden}`,
  );
}

const countBlocks = [
  approval.pr461FixtureCountsPreserved,
  policy.pr461FixtureCountsPreserved,
  results.sourceEvidenceAccepted,
  {
    fixturesAttempted: pr461Result.fixtureValidationSummary?.fixtureCount,
    fixturesPassed: pr461Result.fixtureValidationSummary?.passedCount,
    fixturesSkippedByPolicy: pr461Result.fixtureValidationSummary?.skippedCount,
    fixturesFailed: pr461Result.fixtureValidationSummary?.failedCount,
  },
];
for (const count of countBlocks) {
  assert(count.attempted === 14 || count.fixturesAttempted === 14, "Fixture attempted count must be 14");
  assert(count.passed === 12 || count.fixturesPassed === 12, "Fixture passed count must be 12");
  assert(count.skippedByPolicy === 2 || count.fixturesSkippedByPolicy === 2, "Fixture skipped count must be 2");
  assert(count.failed === 0 || count.fixturesFailed === 0, "Fixture failed count must be 0");
}
for (const pullRequest of [
  "PR #474",
  "PR #470",
  "PR #465",
  "PR #461",
  "PR #453",
  "PR #450",
  "PR #442",
  "PR #436",
  "PR #431",
  "PR #424",
  "PR #418",
]) {
  assert(results.pullRequestsInspected.includes(pullRequest), `Missing inspected PR: ${pullRequest}`);
}
for (const pullRequest of ["PR #470", "PR #465", "PR #461", "PR #453", "PR #450", "PR #442", "PR #436", "PR #431", "PR #424", "PR #418"]) {
  assert(
    pr474Evidence.evidence.some((entry) => entry.pullRequest === pullRequest && entry.accepted === true),
    `PR #474 evidence missing accepted ${pullRequest}`,
  );
}

for (const warning of ["audioread file-open", "pydub media operations"]) {
  assert(approval.warnings.some((entry) => entry.includes(warning)), `Approval missing warning: ${warning}`);
  assert(results.warnings.some((entry) => entry.includes(warning)), `Results missing warning: ${warning}`);
}
assert(policy.preserveWarningsAndBlockers.includes("audioread file-open blocker"), "Policy must preserve audioread blocker");
assert(policy.preserveWarningsAndBlockers.includes("pydub media-operation blocker"), "Policy must preserve pydub blocker");

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
  assert(typeof blocker.ownerNeededToClear === "string" && blocker.ownerNeededToClear.length > 0, `Missing owner clearance path: ${blocker.blockerId}`);
}

for (const handoffEntry of handoff.handoffStatus) {
  assert(handoffEntry.metadataOnly === true, `Handoff must be metadata-only for ${handoffEntry.owner}`);
  assert(handoffEntry.blockedExecutionScope === true, `Execution must remain blocked for ${handoffEntry.owner}`);
}
for (const owner of [
  "SOUND_MUSIC_AUDIO",
  "TOOL_ROUTE_EXECUTION",
  "WORKER_RUNTIME_JOBS",
  "PROVIDER_GATEWAY_MODELS",
  "TRACK_A_RENDER_EXPORT",
  "TRACK_B_MEDIA_PROCESSING",
  "SUPABASE_RLS_STORAGE_DATABASE",
  "OBSERVABILITY_AUDIT_COST",
  "BILLING_STRIPE_CREDITS",
  "PUBLIC_ARTIFACT_DELIVERY_POLICY",
  "COMPLIANCE_SECURITY",
]) {
  assert(handoff.handoffStatus.some((entry) => entry.owner === owner), `Missing handoff owner: ${owner}`);
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
  assert(hasFalseFlag(approval, field), `${field} must be false in approval`);
  assert(hasFalseFlag(results, field), `${field} must be false in results`);
  if (field in policy.claimPolicy) {
    assert(policy.claimPolicy[field] === false, `${field} must be false in policy`);
  }
}
for (const field of [
  "projectWideGeneratedLocalFixturePassed",
  "dryRunPassed",
  "runtimeReadiness",
  "mediaProcessingApproved",
  "supabaseMutationApproved",
  "artifactsApproved",
  "betaProductionApproved",
]) {
  assert(register[field] === false, `${field} must be false in owner register`);
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
  "betaProductionUnlockClaimed",
]) {
  assert(approval.runtimeFlags?.[field] === false, `${field} must be false in approval`);
  assert(results.runtimeFlags?.[field] === false, `${field} must be false in results`);
}

const allText = requiredFiles.map(read).join("\n");
for (const phrase of [
  "PR #474",
  "PR #461",
  "14 attempted",
  "12 passed",
  "2 skipped",
  "0 failed",
  "audioread file-open",
  "pydub media operations",
  "pydub media-operation blocker",
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
  "mediaProcessingReadyClaimed",
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
      decision: approval.decision,
      approvedScopedStatus: approval.acceptedScopedStatus,
      downstreamMetadataStatusDocsApproved: true,
      fixtureCounts: {
        attempted: approval.pr461FixtureCountsPreserved.attempted,
        passed: approval.pr461FixtureCountsPreserved.passed,
        skippedByPolicy: approval.pr461FixtureCountsPreserved.skippedByPolicy,
        failed: approval.pr461FixtureCountsPreserved.failed,
      },
      warnings: ["audioread", "pydub"],
      nextPrompt: expectedNextPrompt,
    },
    null,
    2,
  ),
);
