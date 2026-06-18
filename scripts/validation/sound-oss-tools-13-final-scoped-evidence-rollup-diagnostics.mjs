#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "docs/sound-oss-tools-13-final-scoped-evidence-rollup.md",
  "docs/sound-music-audio-open-source-tool-final-scoped-evidence-index.md",
  "docs/sound-music-audio-open-source-tool-final-scoped-status-register.md",
  "docs/sound-music-audio-open-source-tool-final-blocker-register.md",
  "docs/sound-music-audio-open-source-tool-final-cross-chat-handoff-summary.md",
  "docs/sound-music-audio-open-source-tool-final-scoped-completion-summary.md",
  "docs/sound-oss-tools-13-final-scoped-evidence-rollup-results.md",
  "docs/implementation-prompts/prompt-sound-oss-tools-14-final-rollup-owner-archive-review.md",
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
  "docs/sound-oss-tools-10-scoped-status-owner-approval.md",
  "docs/sound-oss-tools-9-scoped-synthetic-fixture-pass-review.md",
  "docs/sound-oss-tools-8-synthetic-fixture-gate-status.md",
  "docs/sound-oss-tools-7-synthetic-fixture-owner-review.md",
  "docs/sound-oss-tools-6-synthetic-fixture-validation-result.md",
  "docs/sound-music-audio-open-source-tool-synthetic-fixture-validation-matrix.md",
  "docs/sound-oss-tools-5-synthetic-fixture-validation-plan.md",
  "docs/sound-oss-tools-4-binary-import-proof-result.md",
  "docs/sound-oss-tools-3-controlled-dependency-install-result.md",
  "docs/sound-music-audio-open-source-tool-approved-install-plan.md",
  "docs/sound-music-audio-open-source-tool-license-provenance-approval.md",
  "docs/sound-music-audio-open-source-tool-stack-inventory.md",
  "docs/cross-chat-tool-ownership-registry.md",
  "docs/sound-music-audio-cross-chat-duplicate-risk-register.md",
  "docs/beta-readiness-scorecard.md",
  "docs/production-beta-blocker-inventory.md",
  "package.json",
  "package-lock.json"
];

const changedFiles = [
  "docs/sound-oss-tools-13-final-scoped-evidence-rollup.md",
  "docs/sound-music-audio-open-source-tool-final-scoped-evidence-index.md",
  "docs/sound-music-audio-open-source-tool-final-scoped-status-register.md",
  "docs/sound-music-audio-open-source-tool-final-blocker-register.md",
  "docs/sound-music-audio-open-source-tool-final-cross-chat-handoff-summary.md",
  "docs/sound-music-audio-open-source-tool-final-scoped-completion-summary.md",
  "docs/sound-oss-tools-13-final-scoped-evidence-rollup-results.md",
  "docs/implementation-prompts/prompt-sound-oss-tools-14-final-rollup-owner-archive-review.md",
  "scripts/validation/sound-oss-tools-13-final-scoped-evidence-rollup-diagnostics.mjs",
  "package.json"
];

const expectedDecision =
  "sound_oss_tools_13_final_scoped_evidence_rollup_completed_with_warnings_ready_for_archive_review";
const expectedPr489Decision =
  "sound_oss_tools_12_downstream_status_sync_owner_review_passed_with_warnings_ready_for_final_rollup";
const expectedScopedStatus = "sound_oss_tools_synthetic_fixture_validation_passed_with_warnings";
const expectedHumanWording = "SOUND OSS scoped synthetic fixture validation passed with warnings";
const expectedSourceHead = "922614fb9cda33010ac6365cbdec11bab0fdc5d7";
const expectedNextPrompt = "SOUND-OSS-TOOLS-14: final rollup owner archive review, no media processing";

const prNumbers = [418, 424, 431, 436, 442, 450, 453, 461, 465, 470, 474, 479, 483, 489];
const allowedDownstreamDocs = [
  "docs/beta-readiness-scorecard.md",
  "docs/production-beta-blocker-inventory.md"
];
const forbiddenStatuses = [
  "generated_local_fixture_passed",
  "dry_run_passed",
  "runtime_ready",
  "production_ready",
  "beta_ready",
  "media_processing_ready",
  "Supabase_ready",
  "artifact_ready",
  "provider_ready",
  "worker_ready",
  "route_ready"
];
const blockerPhrases = [
  "audioread",
  "pydub",
  "FFmpeg/ffprobe",
  "Demucs/RNNoise/Essentia/Rubber Band",
  "Signalsmith Stretch",
  "real user data",
  "media processing",
  "workers/routes/providers",
  "Supabase/SQL",
  "signed URLs/public artifacts",
  "credits/Stripe",
  "beta/production",
  "runtime readiness",
  "project-wide generated_local_fixture_passed",
  "dry_run_passed"
];

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

function includesAll(text, phrases, context) {
  for (const phrase of phrases) {
    assert(text.includes(phrase), `${context} missing phrase: ${phrase}`);
  }
}

for (const file of requiredFiles) {
  assert(existsSync(file), `Required file missing: ${file}`);
}

const rollup = parseBlock(
  "docs/sound-oss-tools-13-final-scoped-evidence-rollup.md",
  "sound-oss-tools-13-final-scoped-evidence-rollup"
);
const evidenceIndex = parseBlock(
  "docs/sound-music-audio-open-source-tool-final-scoped-evidence-index.md",
  "sound-oss-tools-13-final-scoped-evidence-index"
);
const statusRegister = parseBlock(
  "docs/sound-music-audio-open-source-tool-final-scoped-status-register.md",
  "sound-oss-tools-13-final-scoped-status-register"
);
const blockerRegister = parseBlock(
  "docs/sound-music-audio-open-source-tool-final-blocker-register.md",
  "sound-oss-tools-13-final-blocker-register"
);
const handoff = parseBlock(
  "docs/sound-music-audio-open-source-tool-final-cross-chat-handoff-summary.md",
  "sound-oss-tools-13-final-cross-chat-handoff-summary"
);
const completion = parseBlock(
  "docs/sound-music-audio-open-source-tool-final-scoped-completion-summary.md",
  "sound-oss-tools-13-final-scoped-completion-summary"
);
const results = parseBlock(
  "docs/sound-oss-tools-13-final-scoped-evidence-rollup-results.md",
  "sound-oss-tools-13-final-scoped-evidence-rollup-results"
);

for (const block of [rollup, evidenceIndex, statusRegister, blockerRegister, handoff, completion, results]) {
  assert(block.decision === expectedDecision, "SOUND-13 decision mismatch");
}

assert(rollup.sourcePullRequest === "PR #489", "PR #489 source must be referenced");
assert(rollup.sourceHead === expectedSourceHead, "PR #489 merge commit must be the source head");
assert(rollup.sourceDecision === expectedPr489Decision, "PR #489 decision must be consumed");
assert(results.evidenceAccepted?.pr489SourceVerified === true, "PR #489 source evidence must be accepted");
assert(results.evidenceAccepted?.pr489MergeCommit === expectedSourceHead, "PR #489 merge commit must be preserved");

for (const pr of prNumbers) {
  assert(rollup.completePrChain.includes(`PR #${pr}`), `Rollup missing PR #${pr}`);
  assert(evidenceIndex.entries.some((entry) => entry.pr === pr), `Evidence index missing PR #${pr}`);
  assert(results.prsInspected.includes(pr), `Results missing PR #${pr}`);
}

assert(evidenceIndex.entries.length === prNumbers.length, "Evidence index must have one entry per PR");
for (const entry of evidenceIndex.entries) {
  assert(entry.title, `PR #${entry.pr} title missing`);
  assert(entry.decision, `PR #${entry.pr} decision missing`);
  assert(entry.mergeCommit, `PR #${entry.pr} merge commit missing`);
  assert(entry.acceptedEvidence, `PR #${entry.pr} accepted evidence missing`);
  assert(Array.isArray(entry.warnings), `PR #${entry.pr} warnings missing`);
  assert(Array.isArray(entry.blockedScope), `PR #${entry.pr} blocked scope missing`);
  assert(entry.nextHandoff, `PR #${entry.pr} handoff missing`);
}

for (const block of [rollup, statusRegister, handoff, completion, results]) {
  const text = JSON.stringify(block);
  assert(text.includes(expectedScopedStatus), "Scoped machine status missing");
  assert(text.includes(expectedHumanWording), "Scoped human wording missing");
}

for (const doc of allowedDownstreamDocs) {
  assert(rollup.acceptedDownstreamDocs.includes(doc), `Rollup missing downstream doc ${doc}`);
  assert(statusRegister.allowedDownstreamDocs.includes(doc), `Status register missing downstream doc ${doc}`);
  assert(results.downstreamDocsAccepted.includes(doc), `Results missing downstream doc ${doc}`);
}
assert(rollup.downstreamSyncSummary.additionalDownstreamDocsApproved === false, "No additional downstream docs may be approved");
assert(statusRegister.futurePropagationRequiresOwnerGate === true, "Future propagation must require owner gate");
assert(handoff.futurePropagationRequiresOwnerGate === true, "Handoff must require owner gate");

for (const status of forbiddenStatuses) {
  assert(JSON.stringify(statusRegister).includes(status), `Status register missing forbidden status ${status}`);
  assert(JSON.stringify(rollup).includes(status), `Rollup missing forbidden status ${status}`);
}

const claimStatus = statusRegister.claimStatus;
for (const [key, value] of Object.entries(claimStatus)) {
  assert(value === false, `Claim status must remain false: ${key}`);
}

for (const [key, value] of Object.entries(rollup.runtimeGates)) {
  assert(value === false, `Runtime gate must remain false: ${key}`);
}

const blockerText = JSON.stringify(blockerRegister);
includesAll(blockerText, blockerPhrases, "Final blocker register");
assert(blockerRegister.blockers.length >= blockerPhrases.length, "Final blocker register must preserve inherited blockers");

assert(results.evidenceAccepted.pr461CountsPreserved.attempted === 14, "PR #461 attempted count must be 14");
assert(results.evidenceAccepted.pr461CountsPreserved.passed === 12, "PR #461 passed count must be 12");
assert(results.evidenceAccepted.pr461CountsPreserved.skippedByPolicy === 2, "PR #461 skipped count must be 2");
assert(results.evidenceAccepted.pr461CountsPreserved.failed === 0, "PR #461 failed count must be 0");

const source12 = read("docs/sound-oss-tools-12-downstream-status-sync-owner-review.md");
includesAll(source12, [expectedPr489Decision, expectedScopedStatus, expectedHumanWording], "SOUND-12 source");

const nextPrompt = read("docs/implementation-prompts/prompt-sound-oss-tools-14-final-rollup-owner-archive-review.md");
includesAll(nextPrompt, [expectedDecision, expectedScopedStatus, expectedHumanWording], "SOUND-14 prompt");
for (const phrase of [
  "process media",
  "use real user data",
  "mutate Supabase",
  "create public artifacts",
  "project-wide `generated_local_fixture_passed`",
  "`dry_run_passed`",
  "runtime readiness"
]) {
  assert(nextPrompt.includes(phrase), `SOUND-14 prompt missing prohibition: ${phrase}`);
}

const packageJson = JSON.parse(read("package.json"));
assert(
  packageJson.scripts?.["sound-oss-tools-13:diagnostics"] ===
    "node scripts/validation/sound-oss-tools-13-final-scoped-evidence-rollup-diagnostics.mjs",
  "package.json missing SOUND-13 diagnostics script"
);

const changedText = changedFiles.map(read).join("\n");
const unsafeTrueFlags = [
  "realUserDataUsed",
  "mediaFileRead",
  "mediaFileWritten",
  "generatedArtifactCreated",
  "runtimeExecutionRun",
  "workerExecutionRun",
  "routeExecutionRun",
  "providerCallRun",
  "modelCallRun",
  "supabaseMutationRun",
  "sqlExecuted",
  "mediaProcessingReady",
  "runtimeReady",
  "dryRunPassed",
  "generatedLocalFixturePassed",
  "betaReady",
  "productionReady",
  "signedUrlCreated",
  "publicArtifactCreated"
];
for (const flag of unsafeTrueFlags) {
  const re = new RegExp(`"${flag}"\\s*:\\s*true`);
  assert(!re.test(changedText), `Unsafe true flag found: ${flag}`);
}

const unsafePatterns = [
  { name: "authorization token", re: new RegExp("Authorization\\s*:\\s*" + "Bear" + "er\\s+[A-Za-z0-9._~+/=-]{16,}", "i") },
  { name: "standalone token", re: new RegExp("Bear" + "er\\s+[A-Za-z0-9._~+/=-]{48,}", "i") },
  { name: "jwt", re: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/ },
  { name: "github token", re: /(?:ghp|github_pat)_[A-Za-z0-9_]+/ },
  { name: "provider key", re: /(?:sk-proj-[A-Za-z0-9_-]{24,}|sk-(?=[A-Za-z0-9_-]{24,})(?=[A-Za-z0-9_-]*[A-Z0-9])[A-Za-z0-9_-]{24,})/ },
  { name: "supabase url", re: /https:\/\/[A-Za-z0-9.-]+\.supabase\.co/ },
  { name: "database url", re: /postgres(?:ql)?:\/\/[^\s"']+/i },
  { name: "signed url", re: new RegExp("X-Amz-" + "Signature=|signedUrl\\s*[:=]\\s*[\"']https?:\\/\\/", "i") },
  { name: "public artifact url", re: /publicUrl\s*[:=]\s*["']https?:\/\/|storage\.googleapis\.com\/[^\s"']+/i }
];
for (const { name, re } of unsafePatterns) {
  assert(!re.test(changedText), `Unsafe pattern found: ${name}`);
}

console.log("SOUND-OSS-TOOLS-13 final scoped evidence rollup diagnostics passed");
