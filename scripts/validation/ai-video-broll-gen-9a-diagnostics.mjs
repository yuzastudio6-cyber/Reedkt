#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const EXPECTED_DECISION =
  "ai_video_broll_gen_9a_runtime_memory_owner_review_completed_ready_for_gcp_l4_private_proof_plan";
const EXPECTED_NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-9B: GCP L4 private synthetic proof plan, no cloud execution";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-runtime-memory-owner-review.md",
  "docs/ai-video-broll-generation-runtime-memory-cost-target-matrix.md",
  "docs/ai-video-broll-generation-runtime-memory-owner-review-change-log.md",
  "docs/ai-video-broll-generation-runtime-memory-owner-review-rollback-report.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9b-gcp-l4-private-proof-plan.md",
  "scripts/validation/ai-video-broll-gen-9a-diagnostics.mjs",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9a-runtime-memory-owner-review.md",
  "docs/ai-video-broll-generation-controlled-synthetic-generation-proof-result.md",
  "docs/ai-video-broll-generation-controlled-synthetic-generation-proof-preflight.md",
  "docs/ai-video-broll-generation-controlled-synthetic-generation-runtime-estimate.md",
  "docs/ai-video-broll-generation-runtime-gpu-tier-decision.md",
  "package.json"
];

const RUNTIME_FLAGS_FALSE = [
  "dependencyInstallAllowed",
  "modelWeightDownloadAllowed",
  "dependencyModuleImportAllowed",
  "modelLoaderMetadataInspectionAllowed",
  "pipelineInstantiationAllowed",
  "modelFromPretrainedAllowed",
  "torchLoadAllowed",
  "textEncodingAllowed",
  "denoisingStepAllowed",
  "schedulerRunAllowed",
  "vaeEncodeDecodeAllowed",
  "modelInferenceAllowed",
  "generatedFramesAllowed",
  "generatedVideoAllowed",
  "mediaProcessingAllowed",
  "ffmpegAllowed",
  "providerCallsAllowed",
  "workerExecutionAllowed",
  "routeExecutionAllowed",
  "supabaseMutationAllowed",
  "sqlAllowed",
  "dockerCloudRunAllowed",
  "gcpMutationAllowed",
  "gcpCommandAllowed",
  "storageUploadAllowed",
  "signedUrlCreationAllowed",
  "publicArtifactCreationAllowed",
  "creditMutationAllowed",
  "dryRunPassedClaimed",
  "generatedLocalFixturePassedClaimed",
  "runtimeReadinessClaimed",
  "betaProductionUnlockClaimed"
];

const UNSAFE_PATTERNS = [
  ["runtime execution claim", /\b(containsRuntimeExecution|proofExecutionAttempted|pipelineInstantiated|modelFromPretrainedCalled|torchLoadCalled|textEncodingCalled|denoisingStepRun|schedulerRun|vaeDecodeRun|modelInferenceRun|inferenceRun)\b\s*[:=]\s*(true|"true")/i],
  ["generated media claim", /\b(generatedFramesCreated|generatedVideoCreated|mediaArtifactsCreated|cloudResourcesCreated)\b\s*[:=]\s*(true|"true")/i],
  ["runtime flag claim", /\b(dependencyInstallAllowed|modelWeightDownloadAllowed|dependencyModuleImportAllowed|modelLoaderMetadataInspectionAllowed|pipelineInstantiationAllowed|modelFromPretrainedAllowed|torchLoadAllowed|textEncodingAllowed|denoisingStepAllowed|schedulerRunAllowed|vaeEncodeDecodeAllowed|modelInferenceAllowed|generatedFramesAllowed|generatedVideoAllowed|mediaProcessingAllowed|ffmpegAllowed|providerCallsAllowed|workerExecutionAllowed|routeExecutionAllowed|supabaseMutationAllowed|sqlAllowed|dockerCloudRunAllowed|gcpMutationAllowed|gcpCommandAllowed|storageUploadAllowed|signedUrlCreationAllowed|publicArtifactCreationAllowed|creditMutationAllowed|dryRunPassedClaimed|generatedLocalFixturePassedClaimed|runtimeReadinessClaimed|betaProductionUnlockClaimed)\b\s*[:=]\s*(true|"true")/i],
  ["generated local fixture wording claim", /\bgenerated_local_fixture_passed\s+(claimed|true|passed)/i],
  ["dry run wording claim", /\bdry_run_passed\s+(claimed|true|passed)/i],
  ["signed URL query", /\b(X-Amz-Signature|X-Amz-Credential|Expires=|Signature=|Policy=|Key-Pair-Id=)/i],
  ["DB URL", /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ["JWT", /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/],
  ["Authorization bearer", /\bAuthorization\s*:\s*Bearer\s+[A-Za-z0-9._-]+/i],
  ["Supabase project URL", /https:\/\/[a-z0-9]{20}\.supabase\.co/i],
  ["API key assignment", /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
  ["service role assignment", /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
  ["secret assignment", /\bsecret\s*[:=]\s*['"][^'"]+/i]
];

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseBlock(relativePath, label) {
  const text = read(relativePath);
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp("```json\\s+" + escaped + "\\n([\\s\\S]*?)\\n```"));
  assert(match, `Missing JSON block ${label} in ${relativePath}`);
  return JSON.parse(match[1]);
}

function ensureFlagsClosed(flags, label) {
  for (const flag of RUNTIME_FLAGS_FALSE) {
    assert(flags?.[flag] === false, `${label} must keep ${flag} false`);
  }
}

function ensureSafeText(files) {
  const findings = [];
  for (const file of files) {
    const text = read(file);
    for (const [name, pattern] of UNSAFE_PATTERNS) {
      if (pattern.test(text)) {
        findings.push(`${name}: ${file}`);
      }
    }
  }
  assert(findings.length === 0, `Unsafe claims or secret-shaped text found: ${findings.join("; ")}`);
}

for (const file of REQUIRED_FILES) {
  assert(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
assert(
  packageJson.scripts?.["ai-video-broll-gen-9a:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-9a-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-9a:diagnostics"
);

const review = parseBlock(
  "docs/ai-video-broll-generation-runtime-memory-owner-review.md",
  "ai-video-broll-gen-9a-runtime-memory-owner-review"
);
const matrix = parseBlock(
  "docs/ai-video-broll-generation-runtime-memory-cost-target-matrix.md",
  "ai-video-broll-gen-9a-cost-target-matrix"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-runtime-memory-owner-review-change-log.md",
  "ai-video-broll-gen-9a-runtime-memory-owner-review-change-log"
);
const rollback = parseBlock(
  "docs/ai-video-broll-generation-runtime-memory-owner-review-rollback-report.md",
  "ai-video-broll-gen-9a-runtime-memory-owner-review-rollback-report"
);
const gate9 = parseBlock(
  "docs/ai-video-broll-generation-controlled-synthetic-generation-proof-result.md",
  "ai-video-broll-gen-9-controlled-synthetic-generation-proof-result"
);

assert(review.decision === EXPECTED_DECISION, "Unexpected AI-VIDEO-BROLL-GEN-9A decision");
assert(matrix.decision === EXPECTED_DECISION, "Cost matrix decision mismatch");
assert(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
assert(rollback.decision === EXPECTED_DECISION, "Rollback decision mismatch");
assert(review.sourceCommit === "cfb482e9", "Gate 9A source commit must be Gate 9 commit");
assert(gate9.decision === "ai_video_broll_gen_9_controlled_synthetic_generation_proof_blocked_ready_for_runtime_memory_owner_review", "Gate 9 source decision mismatch");
assert(review.blockedGate9Result?.localWanProofAccepted === false, "Local Wan proof must remain blocked");
assert(review.blockedGate9Result?.cpuProofAccepted === false, "CPU proof must remain blocked");
assert(review.blockedGate9Result?.blockedBeforeInference === true, "Gate 9 must block before inference");
assert(review.selectedNextPath?.pathId === "single_l4_private_job_plan", "Selected next path must be L4 private plan");
assert(review.selectedNextPath?.executionApprovedNow === false, "L4 execution must not be approved now");
assert(review.selectedNextPath?.cloudCommandsAllowedNow === false, "Cloud commands must not be allowed now");
assert(review.selectedNextPath?.modelPriorityPreserved.includes("Wan remains primary"), "Wan priority must be preserved");
assert(review.fallbackPaths?.some((row) => row.pathId === "ltx_local_or_l4_preview_plan" && row.requiresSeparateWeightChecksumImportProof === true), "LTX fallback must require separate proof");
assert(review.fallbackPaths?.some((row) => row.pathId === "single_t4_private_job_plan" && row.executionApprovedNow === false), "T4 fallback must stay non-executing");
assert(review.fallbackPaths?.some((row) => row.pathId === "higher_memory_local_gpu" && row.currentLocalM4Accepted === false), "Current local M4 must remain rejected");
for (const blockedPath of ["cpu_generation", "wan_14b_proof", "hunyuanvideo_proof", "public_endpoint", "user_media_beta", "provider_hosted_fallback"]) {
  assert(review.blockedPaths?.includes(blockedPath), `Missing blocked path ${blockedPath}`);
}
assert(review.officialSourceSnapshot?.gcpGpuDocsInspected === true, "GCP GPU docs must be recorded");
assert(review.officialSourceSnapshot?.cloudRunGpuDocsInspected === true, "Cloud Run GPU docs must be recorded");
assert(review.officialSourceSnapshot?.pricingDocsInspected === true, "Pricing docs must be recorded");
assert(review.officialSourceSnapshot?.requiresFreshPricingCheckBeforeExecution === true, "Fresh pricing check must be required");
for (const owner of [
  "AI_VIDEO_BROLL_GENERATION",
  "WORKER_RUNTIME_JOBS",
  "GCP_CLOUD_RUNTIME",
  "PROVIDER_GATEWAY_MODELS",
  "SUPABASE_RLS_STORAGE_DATABASE",
  "OBSERVABILITY_AUDIT_COST",
  "BILLING_STRIPE_CREDITS",
  "TRACK_A_RENDER_EXPORT",
  "TRACK_B_MEDIA_PROCESSING",
  "PRODUCT_BETA_READINESS"
]) {
  assert(review.ownerAcceptanceRequired?.includes(owner), `Missing owner acceptance ${owner}`);
}
ensureFlagsClosed(review.runtimeFlags, "AI-VIDEO-BROLL-GEN-9A review");
assert(review.nextPrompt === EXPECTED_NEXT_PROMPT, "Unexpected review next prompt");

const selectedTarget = matrix.targets?.find((target) => target.selected === true);
assert(selectedTarget?.targetId === "single_l4_private_job_plan", "Matrix selected target mismatch");
assert(selectedTarget?.executionApprovedNow === false, "Matrix selected target must be non-executing");
assert(selectedTarget?.freshPricingCheckRequiredBeforeExecution === true, "Fresh pricing required for selected target");
assert(matrix.targets?.some((target) => target.targetId === "ltx_local_or_l4_preview_plan" && target.requiresSeparateWeightChecksumImportProof === true), "Matrix must include LTX fallback");
assert(matrix.targets?.some((target) => target.targetId === "cpu_generation" && target.rejected === true), "Matrix must reject CPU generation");
assert(matrix.targets?.some((target) => target.targetId === "wan_14b_or_hunyuanvideo" && target.blocked === true), "Matrix must block Wan 14B/Hunyuan");
assert(matrix.pricePolicy?.exactCostApprovalCreated === false, "No exact cost approval may be created");
assert(matrix.pricePolicy?.billingMutationAllowed === false, "Billing mutation must remain blocked");
assert(matrix.pricePolicy?.requiresFreshOfficialPricingBeforeExecution === true, "Fresh official pricing must be required");
assert(matrix.pricePolicy?.requiresCostCapBeforeExecution === true, "Cost cap must be required");
ensureFlagsClosed(matrix.runtimeFlags, "AI-VIDEO-BROLL-GEN-9A matrix");
assert(matrix.nextPrompt === EXPECTED_NEXT_PROMPT, "Matrix next prompt mismatch");

assert(changeLog.packageLockChanged === false, "package-lock must remain unchanged");
assert(changeLog.nodePackageDependencyChanged === false, "Node dependencies must not change");
assert(changeLog.pythonRequirementChanged === false, "Python requirements must not change");
assert(changeLog.runtimeFilesChanged === false, "Runtime files must not change");
assert(changeLog.supabaseFilesChanged === false, "Supabase files must not change");
assert(changeLog.sqlFilesChanged === false, "SQL files must not change");
assert(changeLog.modelWeightsChanged === false, "Model weights must not change");
assert(changeLog.privateModelCacheChanged === false, "Private model cache must not change");
assert(changeLog.gcpFilesChanged === false, "GCP files must not change");
assert(changeLog.gcpCommandsRun === false, "GCP commands must not run");
assert(changeLog.cloudResourcesCreated === false, "Cloud resources must not be created");
assert(changeLog.modelInferenceRun === false, "Model inference must not run");
assert(changeLog.generatedFramesCreated === false, "Generated frames must not be created");
assert(changeLog.generatedVideoCreated === false, "Generated video must not be created");
assert(changeLog.nextPrompt === EXPECTED_NEXT_PROMPT, "Change log next prompt mismatch");

assert(rollback.gcpRollbackRequired === false, "GCP rollback must not be required");
assert(rollback.dockerRollbackRequired === false, "Docker rollback must not be required");
assert(rollback.runtimeRollbackRequired === false, "runtime rollback must not be required");
assert(rollback.supabaseRollbackRequired === false, "Supabase rollback must not be required");
assert(rollback.sqlRollbackRequired === false, "SQL rollback must not be required");
assert(rollback.artifactRollbackRequired === false, "artifact rollback must not be required");
assert(rollback.generatedFrameRollbackRequired === false, "generated frame rollback must not be required");
assert(rollback.generatedVideoRollbackRequired === false, "generated video rollback must not be required");
assert(rollback.creditRollbackRequired === false, "credit rollback must not be required");
assert(rollback.nextPrompt === EXPECTED_NEXT_PROMPT, "Rollback next prompt mismatch");

const promptText = read("docs/implementation-prompts/prompt-ai-video-broll-gen-9b-gcp-l4-private-proof-plan.md");
assert(promptText.includes("AI-VIDEO-BROLL-GEN-9B GCP L4 Private Synthetic Proof Plan Prompt"), "Missing Gate 9B prompt title");
assert(promptText.includes("Do not run Google Cloud commands"), "Gate 9B prompt must block GCP commands");
assert(promptText.includes("fresh official pricing check"), "Gate 9B prompt must require pricing check");
assert(promptText.includes("maximum runtime and cost cap"), "Gate 9B prompt must require cost cap");
assert(promptText.includes("blocked fallback to LTX"), "Gate 9B prompt must include LTX fallback");
assert(promptText.includes("generated_local_fixture_passed"), "Gate 9B prompt must block generated local fixture claims");

ensureSafeText([
  "docs/ai-video-broll-generation-runtime-memory-owner-review.md",
  "docs/ai-video-broll-generation-runtime-memory-cost-target-matrix.md",
  "docs/ai-video-broll-generation-runtime-memory-owner-review-change-log.md",
  "docs/ai-video-broll-generation-runtime-memory-owner-review-rollback-report.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9b-gcp-l4-private-proof-plan.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  selectedNextPath: "single_l4_private_job_plan",
  wanPrimaryPreserved: true,
  ltxFallbackPreserved: true,
  cpuGenerationRejected: true,
  localM4WanProofRejected: true,
  gcpCommandsRun: false,
  cloudResourcesCreated: false,
  proofExecutionAttempted: false,
  pipelineInstantiated: false,
  inferenceRun: false,
  generatedFramesCreated: false,
  generatedVideoCreated: false,
  mediaProcessingRun: false,
  ffmpegRun: false,
  supabaseTouched: false,
  sqlExecuted: false,
  providerCalled: false,
  workerDispatched: false,
  signedUrlsCreated: false,
  publicArtifactsCreated: false,
  betaUnlocked: false,
  productionUnlocked: false,
  dryRunPassedClaimed: false,
  generatedLocalFixturePassedClaimed: false,
  nextPrompt: EXPECTED_NEXT_PROMPT
}, null, 2));
