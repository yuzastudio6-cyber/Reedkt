#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "docs/sound-oss-tools-14-final-rollup-owner-archive-review.md",
  "docs/sound-music-audio-open-source-tool-final-archive-status-register.md",
  "docs/sound-music-audio-open-source-tool-post-archive-blocker-future-work-register.md",
  "docs/sound-music-audio-open-source-tool-final-archive-handoff-summary.md",
  "docs/sound-music-audio-open-source-tool-final-archive-completion-notice.md",
  "docs/sound-oss-tools-14-final-rollup-owner-archive-review-results.md",
  "docs/implementation-prompts/prompt-sound-oss-tools-15-post-archive-handoff-review.md",
  "scripts/validation/sound-oss-tools-14-final-rollup-owner-archive-review-diagnostics.mjs",
  "docs/sound-oss-tools-13-final-scoped-evidence-rollup.md",
  "docs/sound-music-audio-open-source-tool-final-scoped-evidence-index.md",
  "docs/sound-music-audio-open-source-tool-final-scoped-status-register.md",
  "docs/sound-music-audio-open-source-tool-final-blocker-register.md",
  "docs/sound-music-audio-open-source-tool-final-cross-chat-handoff-summary.md",
  "docs/sound-music-audio-open-source-tool-final-scoped-completion-summary.md",
  "docs/sound-oss-tools-13-final-scoped-evidence-rollup-results.md",
  "docs/implementation-prompts/prompt-sound-oss-tools-14-final-rollup-owner-archive-review.md",
  "scripts/validation/sound-oss-tools-13-final-scoped-evidence-rollup-diagnostics.mjs",
  "docs/beta-readiness-scorecard.md",
  "docs/production-beta-blocker-inventory.md",
  "docs/cross-chat-tool-ownership-registry.md",
  "docs/sound-music-audio-cross-chat-duplicate-risk-register.md",
  "package.json",
  "package-lock.json"
];

const changedFiles = [
  "docs/sound-oss-tools-14-final-rollup-owner-archive-review.md",
  "docs/sound-music-audio-open-source-tool-final-archive-status-register.md",
  "docs/sound-music-audio-open-source-tool-post-archive-blocker-future-work-register.md",
  "docs/sound-music-audio-open-source-tool-final-archive-handoff-summary.md",
  "docs/sound-music-audio-open-source-tool-final-archive-completion-notice.md",
  "docs/sound-oss-tools-14-final-rollup-owner-archive-review-results.md",
  "docs/implementation-prompts/prompt-sound-oss-tools-15-post-archive-handoff-review.md",
  "scripts/validation/sound-oss-tools-14-final-rollup-owner-archive-review-diagnostics.mjs",
  "package.json"
];

const expectedDecision =
  "sound_oss_tools_14_final_rollup_owner_archive_review_passed_with_warnings_ready_for_post_archive_handoff_review";
const expectedSourceDecision =
  "sound_oss_tools_13_final_scoped_evidence_rollup_completed_with_warnings_ready_for_archive_review";
const expectedScopedStatus = "sound_oss_tools_synthetic_fixture_validation_passed_with_warnings";
const expectedHumanWording = "SOUND OSS scoped synthetic fixture validation passed with warnings";
const expectedSourceHead = "83a45c3532f803bb0f291e16541bdaa2e4fea45b";
const expectedArchiveStatus = "archived_scoped_metadata_synthetic_fixture_lane_with_warnings";
const expectedNextPrompt = "SOUND-OSS-TOOLS-15: post-archive handoff review, no media processing";

const prNumbers = [418, 424, 431, 436, 442, 450, 453, 461, 465, 470, 474, 479, 483, 489, 495];
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
const handoffOwners = [
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
  "FRONTEND_PRODUCT_UX"
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

const archiveReview = parseBlock(
  "docs/sound-oss-tools-14-final-rollup-owner-archive-review.md",
  "sound-oss-tools-14-final-rollup-owner-archive-review"
);
const archiveStatus = parseBlock(
  "docs/sound-music-audio-open-source-tool-final-archive-status-register.md",
  "sound-oss-tools-14-final-archive-status-register"
);
const futureWork = parseBlock(
  "docs/sound-music-audio-open-source-tool-post-archive-blocker-future-work-register.md",
  "sound-oss-tools-14-post-archive-blocker-future-work-register"
);
const archiveHandoff = parseBlock(
  "docs/sound-music-audio-open-source-tool-final-archive-handoff-summary.md",
  "sound-oss-tools-14-final-archive-handoff-summary"
);
const completionNotice = parseBlock(
  "docs/sound-music-audio-open-source-tool-final-archive-completion-notice.md",
  "sound-oss-tools-14-final-archive-completion-notice"
);
const results = parseBlock(
  "docs/sound-oss-tools-14-final-rollup-owner-archive-review-results.md",
  "sound-oss-tools-14-final-rollup-owner-archive-review-results"
);
const sourceRollup = parseBlock(
  "docs/sound-oss-tools-13-final-scoped-evidence-rollup.md",
  "sound-oss-tools-13-final-scoped-evidence-rollup"
);
const sourceEvidenceIndex = parseBlock(
  "docs/sound-music-audio-open-source-tool-final-scoped-evidence-index.md",
  "sound-oss-tools-13-final-scoped-evidence-index"
);
const sourceStatusRegister = parseBlock(
  "docs/sound-music-audio-open-source-tool-final-scoped-status-register.md",
  "sound-oss-tools-13-final-scoped-status-register"
);
const sourceBlockerRegister = parseBlock(
  "docs/sound-music-audio-open-source-tool-final-blocker-register.md",
  "sound-oss-tools-13-final-blocker-register"
);
const sourceResults = parseBlock(
  "docs/sound-oss-tools-13-final-scoped-evidence-rollup-results.md",
  "sound-oss-tools-13-final-scoped-evidence-rollup-results"
);

for (const block of [archiveReview, archiveStatus, futureWork, archiveHandoff, completionNotice, results]) {
  assert(block.decision === expectedDecision, "SOUND-14 decision mismatch");
  assert(JSON.stringify(block).includes(expectedScopedStatus), "Scoped machine status missing");
  assert(JSON.stringify(block).includes(expectedHumanWording), "Scoped human wording missing");
  assert(JSON.stringify(block).includes(expectedNextPrompt), "SOUND-15 next prompt missing");
}

assert(archiveReview.sourcePullRequest === "PR #495", "PR #495 source must be referenced");
assert(archiveReview.sourceHead === expectedSourceHead, "PR #495 merge commit must be the source head");
assert(archiveReview.sourceDecision === expectedSourceDecision, "PR #495 decision must be consumed");
assert(archiveReview.archiveStatus === expectedArchiveStatus, "Archive status mismatch");
assert(archiveStatus.archiveStatus === expectedArchiveStatus, "Archive status register mismatch");
assert(results.sourceEvidenceAccepted?.pr495SourceVerified === true, "PR #495 source evidence must be accepted");
assert(results.sourceEvidenceAccepted?.pr495MergeCommit === expectedSourceHead, "PR #495 merge commit must be preserved");
assert(results.sourceEvidenceAccepted?.pr495Decision === expectedSourceDecision, "PR #495 decision must be preserved");

assert(sourceRollup.decision === expectedSourceDecision, "SOUND-13 source rollup decision mismatch");
assert(sourceRollup.finalScopedStatus === expectedScopedStatus, "SOUND-13 source scoped status mismatch");
assert(sourceRollup.finalHumanWording === expectedHumanWording, "SOUND-13 source human wording mismatch");
assert(sourceResults.evidenceAccepted?.pr489SourceVerified === true, "SOUND-13 source results must accept PR #489");
assert(sourceResults.evidenceAccepted?.pr489MergeCommit === "922614fb9cda33010ac6365cbdec11bab0fdc5d7", "SOUND-13 source results must preserve PR #489 merge commit");

for (const pr of prNumbers) {
  assert(archiveReview.completePrChain.includes(`PR #${pr}`), `Archive review missing PR #${pr}`);
  assert(results.prsInspected.includes(pr), `Results missing PR #${pr}`);
}
for (const pr of prNumbers.filter((pr) => pr !== 495)) {
  assert(sourceEvidenceIndex.entries.some((entry) => entry.pr === pr), `SOUND-13 source evidence missing PR #${pr}`);
}
assert(sourceEvidenceIndex.entries.length === prNumbers.length - 1, "SOUND-13 evidence index must cover PR #418 through PR #489");

for (const doc of allowedDownstreamDocs) {
  assert(archiveStatus.allowedDownstreamDocs.includes(doc), `Archive status missing downstream doc ${doc}`);
  assert(sourceStatusRegister.allowedDownstreamDocs.includes(doc), `Source status register missing downstream doc ${doc}`);
}

for (const status of forbiddenStatuses) {
  const archiveText = JSON.stringify([archiveReview, archiveStatus, completionNotice, results]);
  assert(archiveText.includes(status), `SOUND-14 docs missing forbidden status ${status}`);
  assert(JSON.stringify(sourceStatusRegister).includes(status), `Source status register missing forbidden status ${status}`);
}

for (const [key, value] of Object.entries(archiveStatus.claimStatus)) {
  assert(value === false, `Archive claim status must remain false: ${key}`);
}
for (const [key, value] of Object.entries(archiveReview.runtimeGates)) {
  assert(value === false, `Archive runtime gate must remain false: ${key}`);
}
for (const [key, value] of Object.entries(completionNotice.noRuntimeStatus)) {
  assert(value === false, `Completion no-runtime status must remain false: ${key}`);
}
for (const [key, value] of Object.entries(results.runtimeClaimStatus)) {
  assert(value === false, `Results runtime claim status must remain false: ${key}`);
}

const futureWorkText = JSON.stringify(futureWork);
includesAll(futureWorkText, blockerPhrases, "Post-archive blocker/future-work register");
assert(futureWork.blockers.length >= blockerPhrases.length, "Post-archive blocker register must preserve inherited blockers");
for (const blocker of futureWork.blockers) {
  assert(blocker.currentStatus.includes("blocked"), `Blocker must remain blocked: ${blocker.id}`);
  assert(blocker.mayExecuteNow === false, `Blocker mayExecuteNow must be false: ${blocker.id}`);
  assert(blocker.ownerNeeded, `Blocker owner missing: ${blocker.id}`);
  assert(blocker.requiredEvidence, `Blocker required evidence missing: ${blocker.id}`);
  assert(blocker.likelyPromptFamily, `Blocker prompt family missing: ${blocker.id}`);
}
includesAll(JSON.stringify(sourceBlockerRegister), blockerPhrases, "SOUND-13 blocker register");

for (const owner of handoffOwners) {
  assert(
    archiveHandoff.handoffs.some((entry) => entry.owner === owner),
    `Archive handoff missing owner ${owner}`
  );
}
for (const handoff of archiveHandoff.handoffs) {
  assert(handoff.mayExecuteNow === false, `Archive handoff mayExecuteNow must be false: ${handoff.owner}`);
}
assert(archiveHandoff.futurePropagationRequiresOwnerGate === true, "Future propagation must require owner gate");

assert(results.sourceEvidenceAccepted.pr461CountsPreserved.attempted === 14, "PR #461 attempted count must be 14");
assert(results.sourceEvidenceAccepted.pr461CountsPreserved.passed === 12, "PR #461 passed count must be 12");
assert(results.sourceEvidenceAccepted.pr461CountsPreserved.skippedByPolicy === 2, "PR #461 skipped count must be 2");
assert(results.sourceEvidenceAccepted.pr461CountsPreserved.failed === 0, "PR #461 failed count must be 0");

const prompt15 = read("docs/implementation-prompts/prompt-sound-oss-tools-15-post-archive-handoff-review.md");
includesAll(
  prompt15,
  [
    expectedDecision,
    expectedArchiveStatus,
    expectedScopedStatus,
    expectedHumanWording,
    "process media",
    "use real user data",
    "mutate Supabase",
    "create public artifacts",
    "project-wide `generated_local_fixture_passed`",
    "`dry_run_passed`",
    "runtime readiness"
  ],
  "SOUND-15 prompt"
);

const packageJson = JSON.parse(read("package.json"));
assert(
  packageJson.scripts?.["sound-oss-tools-14:diagnostics"] ===
    "node scripts/validation/sound-oss-tools-14-final-rollup-owner-archive-review-diagnostics.mjs",
  "package.json missing SOUND-14 diagnostics script"
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

for (const path of changedFiles) {
  assert(!path.includes("package-lock.json"), "package-lock.json must not be changed");
  assert(!path.includes("node_modules"), "node_modules must not be changed");
  assert(!path.startsWith("supabase/"), "Supabase files must not be changed");
  assert(!path.endsWith(".sql"), "SQL files must not be changed");
  assert(!path.startsWith("docker/"), "Docker files must not be changed");
  assert(!path.startsWith("src/"), "Runtime/provider/worker/route files must not be changed");
  assert(!path.includes("._"), "macOS AppleDouble sidecars must not be changed");
}

console.log("SOUND-OSS-TOOLS-14 final rollup owner archive review diagnostics passed");
