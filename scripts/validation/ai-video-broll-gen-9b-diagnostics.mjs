#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const EXPECTED_DECISION =
  "ai_video_broll_gen_9b_gcp_l4_private_proof_plan_completed_ready_for_prerequisite_verification";
const EXPECTED_NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-9C: GCP L4 prerequisite verification, no cloud mutation/no inference";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-gcp-l4-private-synthetic-proof-plan.md",
  "docs/ai-video-broll-generation-gcp-l4-cost-quota-preflight-plan.md",
  "docs/ai-video-broll-generation-gcp-l4-private-cache-transfer-policy.md",
  "docs/ai-video-broll-generation-gcp-l4-proof-plan-change-log.md",
  "docs/ai-video-broll-generation-gcp-l4-proof-plan-rollback-report.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9c-gcp-l4-prerequisite-verification.md",
  "scripts/validation/ai-video-broll-gen-9b-diagnostics.mjs",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9b-gcp-l4-private-proof-plan.md",
  "docs/ai-video-broll-generation-runtime-memory-owner-review.md",
  "docs/ai-video-broll-generation-runtime-memory-cost-target-matrix.md",
  "docs/ai-video-broll-generation-controlled-synthetic-generation-proof-result.md",
  "docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md",
  "docs/activation-gcp-staging-command-policy.md",
  "docs/activation-gcp-staging-resource-map.md",
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
  "cloudResourceCreationAllowed",
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
  ["cloud command claim", /\b(gcpCommandsRun|dockerCommandsRun|cloudResourceCreationAllowed|gcpCommandAllowed)\b\s*[:=]\s*(true|"true")/i],
  ["runtime flag claim", /\b(dependencyInstallAllowed|modelWeightDownloadAllowed|dependencyModuleImportAllowed|modelLoaderMetadataInspectionAllowed|pipelineInstantiationAllowed|modelFromPretrainedAllowed|torchLoadAllowed|textEncodingAllowed|denoisingStepAllowed|schedulerRunAllowed|vaeEncodeDecodeAllowed|modelInferenceAllowed|generatedFramesAllowed|generatedVideoAllowed|mediaProcessingAllowed|ffmpegAllowed|providerCallsAllowed|workerExecutionAllowed|routeExecutionAllowed|supabaseMutationAllowed|sqlAllowed|dockerCloudRunAllowed|gcpMutationAllowed|storageUploadAllowed|signedUrlCreationAllowed|publicArtifactCreationAllowed|creditMutationAllowed|dryRunPassedClaimed|generatedLocalFixturePassedClaimed|runtimeReadinessClaimed|betaProductionUnlockClaimed)\b\s*[:=]\s*(true|"true")/i],
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
  packageJson.scripts?.["ai-video-broll-gen-9b:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-9b-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-9b:diagnostics"
);

const plan = parseBlock(
  "docs/ai-video-broll-generation-gcp-l4-private-synthetic-proof-plan.md",
  "ai-video-broll-gen-9b-gcp-l4-private-proof-plan"
);
const preflight = parseBlock(
  "docs/ai-video-broll-generation-gcp-l4-cost-quota-preflight-plan.md",
  "ai-video-broll-gen-9b-cost-quota-preflight-plan"
);
const transfer = parseBlock(
  "docs/ai-video-broll-generation-gcp-l4-private-cache-transfer-policy.md",
  "ai-video-broll-gen-9b-private-cache-transfer-policy"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-gcp-l4-proof-plan-change-log.md",
  "ai-video-broll-gen-9b-gcp-l4-proof-plan-change-log"
);
const rollback = parseBlock(
  "docs/ai-video-broll-generation-gcp-l4-proof-plan-rollback-report.md",
  "ai-video-broll-gen-9b-gcp-l4-proof-plan-rollback-report"
);
const gate9a = parseBlock(
  "docs/ai-video-broll-generation-runtime-memory-owner-review.md",
  "ai-video-broll-gen-9a-runtime-memory-owner-review"
);

assert(plan.decision === EXPECTED_DECISION, "Unexpected AI-VIDEO-BROLL-GEN-9B decision");
assert(preflight.decision === EXPECTED_DECISION, "Preflight decision mismatch");
assert(transfer.decision === EXPECTED_DECISION, "Transfer policy decision mismatch");
assert(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
assert(rollback.decision === EXPECTED_DECISION, "Rollback decision mismatch");
assert(plan.sourceCommit === "d12ab93b", "Gate 9B source commit must be Gate 9A commit");
assert(gate9a.decision === "ai_video_broll_gen_9a_runtime_memory_owner_review_completed_ready_for_gcp_l4_private_proof_plan", "Gate 9A source decision mismatch");
assert(plan.selectedFutureTarget?.targetId === "gcp_single_l4_private_proof_plan", "Selected future target mismatch");
assert(plan.selectedFutureTarget?.accelerator === "nvidia_l4", "Accelerator must be L4");
assert(plan.selectedFutureTarget?.acceleratorCount === 1, "Accelerator count must be one");
assert(plan.selectedFutureTarget?.gpuMemoryClass === "24gb_l4_class", "GPU memory class mismatch");
assert(plan.selectedFutureTarget?.publicEndpointAllowed === false, "Public endpoint must be blocked");
assert(plan.selectedFutureTarget?.executionApprovedNow === false, "Execution must not be approved now");
assert(plan.selectedFutureTarget?.cloudRunServicePreferredNow === false, "Cloud Run service must not be preferred now");
assert(plan.regionCandidates?.[0]?.region === "us-central1", "First region candidate must be us-central1");
assert(plan.regionCandidates?.some((region) => region.region === "us-east4"), "us-east4 candidate missing");
assert(plan.regionCandidates?.some((region) => region.region === "us-west1"), "us-west1 candidate missing");
assert(plan.costAndRuntimeCaps?.freshOfficialPricingRequiredBeforeExecution === true, "Fresh pricing required");
assert(plan.costAndRuntimeCaps?.maxFirstProofRuntimeMinutes === 60, "Runtime cap mismatch");
assert(plan.costAndRuntimeCaps?.maxFirstProofCostUsdPlaceholder === 2, "Cost cap mismatch");
assert(plan.costAndRuntimeCaps?.costApprovalCreated === false, "No cost approval may be created");
assert(plan.transferPolicy?.publicBucketAllowed === false, "Public bucket must be blocked");
assert(plan.transferPolicy?.signedUrlAllowed === false, "Signed URL must be blocked");
assert(plan.transferPolicy?.repoTrackedWeightsAllowed === false, "Repo tracked weights must be blocked");
assert(plan.transferPolicy?.runtimeAutoDownloadAllowed === false, "Runtime auto-download must be blocked");
assert(plan.fallbackDecision?.ltxFallbackIfL4Blocked === true, "LTX fallback must exist");
assert(plan.fallbackDecision?.ltxRequiresSeparateWeightChecksumImportProof === true, "LTX fallback must require separate proof");
assert(plan.fallbackDecision?.cpuFallbackAllowed === false, "CPU fallback must be blocked");
assert(plan.fallbackDecision?.hunyuanFallbackAllowed === false, "Hunyuan fallback must be blocked");
ensureFlagsClosed(plan.runtimeFlags, "AI-VIDEO-BROLL-GEN-9B plan");
assert(plan.nextPrompt === EXPECTED_NEXT_PROMPT, "Plan next prompt mismatch");

assert(preflight.preflightMode === "future_read_only_verification_plan", "Preflight mode mismatch");
assert(preflight.candidateRegions?.includes("us-central1"), "Preflight region us-central1 missing");
assert(preflight.checksRequiredBeforeExecution?.includes("l4_quota_available"), "Quota check missing");
assert(preflight.checksRequiredBeforeExecution?.includes("fresh_official_price"), "Fresh price check missing");
assert(preflight.costCap?.placeholderUsd === 2, "Preflight cost cap mismatch");
assert(preflight.costCap?.exactCostApprovalCreated === false, "No exact cost approval may be created");
assert(preflight.allowedFutureVerificationCategories?.includes("read_only_quota_check_if_prompt_authorizes"), "Read-only quota check category missing");
assert(preflight.forbiddenFutureVerificationCategories?.includes("resource_creation"), "Resource creation must be forbidden");
ensureFlagsClosed(preflight.runtimeFlags, "AI-VIDEO-BROLL-GEN-9B preflight");
assert(preflight.nextPrompt === EXPECTED_NEXT_PROMPT, "Preflight next prompt mismatch");

assert(transfer.privateCacheOutsideRepository === true, "Private cache must be outside repository");
assert(transfer.privateCacheApproxSizeGiB === 16, "Private cache size mismatch");
for (const forbidden of [
  "public_bucket",
  "signed_url_source_of_truth",
  "repo_tracked_weights",
  "runtime_auto_download",
  "provider_hosted_fallback",
  "user_media_colocation",
  "production_customer_bucket",
  "unbounded_persistent_cache"
]) {
  assert(transfer.forbiddenTransferPaths?.includes(forbidden), `Missing forbidden transfer path ${forbidden}`);
}
assert(transfer.futureRequirements?.checksumVerificationRequired === true, "Checksum verification required");
assert(transfer.futureRequirements?.cleanupRequired === true, "Cleanup required");
ensureFlagsClosed(transfer.runtimeFlags, "AI-VIDEO-BROLL-GEN-9B transfer policy");
assert(transfer.nextPrompt === EXPECTED_NEXT_PROMPT, "Transfer next prompt mismatch");

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
assert(changeLog.dockerCommandsRun === false, "Docker commands must not run");
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

const promptText = read("docs/implementation-prompts/prompt-ai-video-broll-gen-9c-gcp-l4-prerequisite-verification.md");
assert(promptText.includes("AI-VIDEO-BROLL-GEN-9C GCP L4 Prerequisite Verification Prompt"), "Missing Gate 9C prompt title");
assert(promptText.includes("without mutating cloud resources"), "Gate 9C prompt must block cloud mutation");
assert(promptText.includes("read-only L4 quota"), "Gate 9C prompt must allow only read-only quota check");
assert(promptText.includes("Forbidden in that future prompt"), "Gate 9C prompt must list forbidden actions");
assert(promptText.includes("generated_local_fixture_passed"), "Gate 9C prompt must block generated local fixture claims");

ensureSafeText([
  "docs/ai-video-broll-generation-gcp-l4-private-synthetic-proof-plan.md",
  "docs/ai-video-broll-generation-gcp-l4-cost-quota-preflight-plan.md",
  "docs/ai-video-broll-generation-gcp-l4-private-cache-transfer-policy.md",
  "docs/ai-video-broll-generation-gcp-l4-proof-plan-change-log.md",
  "docs/ai-video-broll-generation-gcp-l4-proof-plan-rollback-report.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9c-gcp-l4-prerequisite-verification.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  selectedTarget: "gcp_single_l4_private_proof_plan",
  accelerator: "nvidia_l4",
  acceleratorCount: 1,
  regionCandidates: plan.regionCandidates.map((region) => region.region),
  maxFirstProofRuntimeMinutes: 60,
  maxFirstProofCostUsdPlaceholder: 2,
  ltxFallbackIfL4Blocked: true,
  gcpCommandsRun: false,
  cloudResourcesCreated: false,
  dockerCommandsRun: false,
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
