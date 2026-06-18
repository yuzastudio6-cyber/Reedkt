#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "docs/sound-oss-tools-15-post-archive-handoff-review.md",
  "docs/sound-music-audio-open-source-tool-post-archive-status-register.md",
  "docs/sound-music-audio-open-source-tool-post-archive-reopen-policy.md",
  "docs/sound-music-audio-open-source-tool-final-handoff-closure-register.md",
  "docs/sound-music-audio-open-source-tool-scoped-lane-completion-certificate.md",
  "docs/sound-oss-tools-15-post-archive-handoff-review-results.md",
  "docs/implementation-prompts/prompt-sound-oss-tools-complete-scoped-lane-no-next-implementation.md",
  "scripts/validation/sound-oss-tools-15-post-archive-handoff-review-diagnostics.mjs",
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
  "docs/cross-chat-tool-ownership-registry.md",
  "docs/sound-music-audio-cross-chat-duplicate-risk-register.md",
  "package.json",
  "package-lock.json"
];

const changedFiles = [
  "docs/sound-oss-tools-15-post-archive-handoff-review.md",
  "docs/sound-music-audio-open-source-tool-post-archive-status-register.md",
  "docs/sound-music-audio-open-source-tool-post-archive-reopen-policy.md",
  "docs/sound-music-audio-open-source-tool-final-handoff-closure-register.md",
  "docs/sound-music-audio-open-source-tool-scoped-lane-completion-certificate.md",
  "docs/sound-oss-tools-15-post-archive-handoff-review-results.md",
  "docs/implementation-prompts/prompt-sound-oss-tools-complete-scoped-lane-no-next-implementation.md",
  "scripts/validation/sound-oss-tools-15-post-archive-handoff-review-diagnostics.mjs",
  "package.json"
];

const expectedDecision =
  "sound_oss_tools_15_post_archive_handoff_review_passed_scoped_lane_complete_with_warnings";
const expectedSourceDecision =
  "sound_oss_tools_14_final_rollup_owner_archive_review_passed_with_warnings_ready_for_post_archive_handoff_review";
const expectedSourceHead = "ab8f780fce1764507438cba0547a00ca9bb4916e";
const expectedArchiveStatus = "archived_scoped_metadata_synthetic_fixture_lane_with_warnings";
const expectedScopedStatus = "sound_oss_tools_synthetic_fixture_validation_passed_with_warnings";
const expectedHumanWording = "SOUND OSS scoped synthetic fixture validation passed with warnings";
const completePromptText =
  "No further SOUND-OSS-TOOLS implementation prompt for the scoped metadata/synthetic-fixture lane. Future runtime/media work must use a new prompt family.";

const prNumbers = [418, 424, 431, 436, 442, 450, 453, 461, 465, 470, 474, 479, 483, 489, 495, 501];
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

const review = parseBlock(
  "docs/sound-oss-tools-15-post-archive-handoff-review.md",
  "sound-oss-tools-15-post-archive-handoff-review"
);
const statusRegister = parseBlock(
  "docs/sound-music-audio-open-source-tool-post-archive-status-register.md",
  "sound-oss-tools-15-post-archive-status-register"
);
const reopenPolicy = parseBlock(
  "docs/sound-music-audio-open-source-tool-post-archive-reopen-policy.md",
  "sound-oss-tools-15-post-archive-reopen-policy"
);
const closureRegister = parseBlock(
  "docs/sound-music-audio-open-source-tool-final-handoff-closure-register.md",
  "sound-oss-tools-15-final-handoff-closure-register"
);
const certificate = parseBlock(
  "docs/sound-music-audio-open-source-tool-scoped-lane-completion-certificate.md",
  "sound-oss-tools-15-scoped-lane-completion-certificate"
);
const results = parseBlock(
  "docs/sound-oss-tools-15-post-archive-handoff-review-results.md",
  "sound-oss-tools-15-post-archive-handoff-review-results"
);
const sourceReview = parseBlock(
  "docs/sound-oss-tools-14-final-rollup-owner-archive-review.md",
  "sound-oss-tools-14-final-rollup-owner-archive-review"
);
const sourceArchiveStatus = parseBlock(
  "docs/sound-music-audio-open-source-tool-final-archive-status-register.md",
  "sound-oss-tools-14-final-archive-status-register"
);
const sourceFutureWork = parseBlock(
  "docs/sound-music-audio-open-source-tool-post-archive-blocker-future-work-register.md",
  "sound-oss-tools-14-post-archive-blocker-future-work-register"
);
const sourceHandoff = parseBlock(
  "docs/sound-music-audio-open-source-tool-final-archive-handoff-summary.md",
  "sound-oss-tools-14-final-archive-handoff-summary"
);
const sourceCompletion = parseBlock(
  "docs/sound-music-audio-open-source-tool-final-archive-completion-notice.md",
  "sound-oss-tools-14-final-archive-completion-notice"
);
const sourceResults = parseBlock(
  "docs/sound-oss-tools-14-final-rollup-owner-archive-review-results.md",
  "sound-oss-tools-14-final-rollup-owner-archive-review-results"
);

for (const block of [review, statusRegister, reopenPolicy, closureRegister, certificate, results]) {
  assert(block.decision === expectedDecision, "SOUND-15 decision mismatch");
  const text = JSON.stringify(block);
  assert(text.includes(expectedScopedStatus), "Scoped machine status missing");
  assert(text.includes(expectedHumanWording), "Scoped human wording missing");
}

assert(review.sourcePullRequest === "PR #501", "PR #501 source must be referenced");
assert(review.sourceHead === expectedSourceHead, "PR #501 merge commit must be source head");
assert(review.sourceDecision === expectedSourceDecision, "PR #501 source decision must be consumed");
assert(review.sourceArchiveStatus === expectedArchiveStatus, "PR #501 archive status must be consumed");
assert(review.requiresMoreSOUNDOSSToolsPrompts === false, "Scoped lane must not require more SOUND-OSS-TOOLS prompts");
assert(review.futureRuntimeMediaWorkRequiresNewPromptFamily === true, "Future runtime/media work must require a new prompt family");
assert(statusRegister.requiresMoreSOUNDOSSToolsPrompts === false, "Status register must close SOUND-OSS-TOOLS prompt need");
assert(reopenPolicy.requiresMoreSOUNDOSSToolsPrompts === false, "Reopen policy must not require more SOUND-OSS-TOOLS prompts");
assert(reopenPolicy.futureRuntimeMediaWorkRequiresNewPromptFamily === true, "Reopen policy must require new runtime/media prompt family");
assert(certificate.scopedLaneCompleteWithWarnings === true, "Completion certificate must mark scoped lane complete with warnings");
assert(certificate.notRuntimeReadiness === true, "Certificate must reject runtime readiness");
assert(certificate.notMediaProcessingReadiness === true, "Certificate must reject media processing readiness");
assert(certificate.notBetaProductionReadiness === true, "Certificate must reject beta/production readiness");
assert(certificate.notProjectWideGeneratedLocalFixturePassed === true, "Certificate must reject project-wide fixture pass");
assert(certificate.notDryRunPassed === true, "Certificate must reject dry_run_passed");

assert(sourceReview.decision === expectedSourceDecision, "SOUND-14 source review decision mismatch");
assert(sourceReview.archiveStatus === expectedArchiveStatus, "SOUND-14 source archive status mismatch");
assert(sourceArchiveStatus.archiveStatus === expectedArchiveStatus, "SOUND-14 source status register mismatch");
assert(sourceResults.sourceEvidenceAccepted?.pr495SourceVerified === true, "SOUND-14 source must preserve PR #495 evidence");
assert(sourceResults.archiveStatus === expectedArchiveStatus, "SOUND-14 source results archive status mismatch");
assert(sourceHandoff.futurePropagationRequiresOwnerGate === true, "SOUND-14 source handoff must require owner gate");

for (const pr of prNumbers) {
  assert(results.prsInspected.includes(pr), `Results missing PR #${pr}`);
}

for (const status of forbiddenStatuses) {
  const text = JSON.stringify([review, statusRegister, reopenPolicy, certificate, results]);
  assert(text.includes(status), `SOUND-15 docs missing forbidden status ${status}`);
}

for (const [key, value] of Object.entries(review.runtimeGates)) {
  assert(value === false, `Runtime gate must remain false: ${key}`);
}
for (const [key, value] of Object.entries(statusRegister.claimStatus)) {
  assert(value === false, `Status register claim must remain false: ${key}`);
}
for (const [key, value] of Object.entries(certificate.noRuntimeStatus)) {
  assert(value === false, `Certificate runtime status must remain false: ${key}`);
}
for (const [key, value] of Object.entries(results.runtimeClaimStatus)) {
  assert(value === false, `Results runtime claim status must remain false: ${key}`);
}

const reopenText = JSON.stringify(reopenPolicy);
includesAll(reopenText, blockerPhrases, "Reopen policy");
const sourceFutureWorkText = JSON.stringify(sourceFutureWork);
includesAll(sourceFutureWorkText, blockerPhrases, "SOUND-14 future-work source");
for (const blocker of sourceFutureWork.blockers) {
  assert(blocker.mayExecuteNow === false, `SOUND-14 blocker mayExecuteNow must remain false: ${blocker.id}`);
}

for (const owner of handoffOwners) {
  assert(
    closureRegister.handoffs.some((entry) => entry.owner === owner),
    `Closure register missing owner ${owner}`
  );
}
for (const handoff of closureRegister.handoffs) {
  assert(typeof handoff.acceptedScopedEvidence === "boolean", `Handoff accepted evidence missing: ${handoff.owner}`);
  assert(Array.isArray(handoff.blockedRuntimeScopes), `Handoff blocked scopes missing: ${handoff.owner}`);
  assert(typeof handoff.futureOwnerGateNeeded === "boolean", `Handoff owner gate flag missing: ${handoff.owner}`);
  assert(handoff.nextAction, `Handoff next action missing: ${handoff.owner}`);
}

const noNextPrompt = read("docs/implementation-prompts/prompt-sound-oss-tools-complete-scoped-lane-no-next-implementation.md");
includesAll(
  noNextPrompt,
  [
    "No further SOUND-OSS-TOOLS implementation prompts are needed",
    "new prompt family",
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
  "No-next-implementation prompt"
);
assert(results.nextPromptRecommendation === completePromptText, "Results must record no-next-implementation recommendation");

const packageJson = JSON.parse(read("package.json"));
assert(
  packageJson.scripts?.["sound-oss-tools-15:diagnostics"] ===
    "node scripts/validation/sound-oss-tools-15-post-archive-handoff-review-diagnostics.mjs",
  "package.json missing SOUND-15 diagnostics script"
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
  { name: "public artifact url", re: /publicUrl\s*[:=]\s*["']https?:\/\/|storage\.googleapis\.com\/[^\s"']+/i },
  { name: "raw provider output", re: /rawProviderOutput\s*[:=]/i }
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

console.log("SOUND-OSS-TOOLS-15 post-archive handoff review diagnostics passed");
