#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const EXPECTED_DECISION =
  "ai_video_broll_gen_9_controlled_synthetic_generation_proof_blocked_ready_for_runtime_memory_owner_review";
const EXPECTED_NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-9A: runtime memory owner review for cost-friendly synthetic proof target, no inference";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-controlled-synthetic-generation-proof-result.md",
  "docs/ai-video-broll-generation-controlled-synthetic-generation-proof-preflight.md",
  "docs/ai-video-broll-generation-controlled-synthetic-generation-proof-change-log.md",
  "docs/ai-video-broll-generation-controlled-synthetic-generation-proof-rollback-report.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9a-runtime-memory-owner-review.md",
  "scripts/validation/ai-video-broll-gen-9-diagnostics.mjs",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9-controlled-synthetic-generation-proof.md",
  "docs/ai-video-broll-generation-controlled-synthetic-generation-plan.md",
  "docs/ai-video-broll-generation-controlled-synthetic-generation-runtime-estimate.md",
  "docs/ai-video-broll-generation-controlled-synthetic-generation-owner-gate-register.md",
  "docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md",
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
  ["generated media claim", /\b(generatedFramesCreated|generatedVideoCreated|temporaryProofArtifactsCreated|mediaArtifactsCreated)\b\s*[:=]\s*(true|"true")/i],
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
  packageJson.scripts?.["ai-video-broll-gen-9:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-9-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-9:diagnostics"
);

const result = parseBlock(
  "docs/ai-video-broll-generation-controlled-synthetic-generation-proof-result.md",
  "ai-video-broll-gen-9-controlled-synthetic-generation-proof-result"
);
const preflight = parseBlock(
  "docs/ai-video-broll-generation-controlled-synthetic-generation-proof-preflight.md",
  "ai-video-broll-gen-9-preflight"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-controlled-synthetic-generation-proof-change-log.md",
  "ai-video-broll-gen-9-controlled-synthetic-generation-proof-change-log"
);
const rollback = parseBlock(
  "docs/ai-video-broll-generation-controlled-synthetic-generation-proof-rollback-report.md",
  "ai-video-broll-gen-9-controlled-synthetic-generation-proof-rollback-report"
);
const gate8Plan = parseBlock(
  "docs/ai-video-broll-generation-controlled-synthetic-generation-plan.md",
  "ai-video-broll-gen-8-controlled-synthetic-generation-plan"
);

assert(result.decision === EXPECTED_DECISION, "Unexpected AI-VIDEO-BROLL-GEN-9 decision");
assert(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
assert(rollback.decision === EXPECTED_DECISION, "Rollback decision mismatch");
assert(result.sourceCommit === "0cbd0bf0", "Gate 9 source commit must be Gate 8 commit");
assert(gate8Plan.decision === "ai_video_broll_gen_8_controlled_synthetic_generation_plan_completed_ready_for_controlled_synthetic_generation_proof", "Gate 8 source decision mismatch");
assert(result.selectedModel?.modelId === "Wan-AI/Wan2.1-T2V-1.3B", "Gate 9 must use Wan 1.3B");
assert(result.selectedModel?.sourceRevision === "37ec512624d61f7aa208f7ea8140a131f93afc9a", "Unexpected source revision");
assert(result.selectedModel?.privateCacheExists === true, "Private cache must exist");
assert(result.selectedModel?.privateCacheOutsideRepository === true, "Private cache must be outside repo");
assert(result.selectedModel?.privateCacheFileCount === 10, "Private cache file count mismatch");
assert(result.selectedModel?.privateCacheApproxSizeGiB === 16, "Private cache size must be recorded");
assert(result.syntheticFixture?.nonUserMediaOnly === true, "Synthetic fixture must be non-user-media only");
for (const field of [
  "containsPeople",
  "containsFaces",
  "containsMinors",
  "containsPublicFigures",
  "containsBrandsOrLogos",
  "containsReadableText",
  "containsCopyrightedCharacters",
  "containsUserMedia",
  "containsAudio",
  "rawChatUsedAsExecutionPlan"
]) {
  assert(result.syntheticFixture?.[field] === false, `Synthetic fixture must keep ${field} false`);
}
assert(result.localTargetProof?.hostArchitecture === "arm64", "Host architecture mismatch");
assert(result.localTargetProof?.systemMemoryBytes === 17179869184, "System memory bytes mismatch");
assert(result.localTargetProof?.systemMemoryGiB === 16, "System memory GiB mismatch");
assert(result.localTargetProof?.gate8RecommendedMemoryHeadroomGiB === 16, "Gate 8 memory headroom mismatch");
assert(result.localTargetProof?.projectedMemoryWithinGate8Envelope === false, "Memory projection must be blocked");
assert(result.localTargetProof?.cpuGenerationAccepted === false, "CPU generation must remain blocked");
assert(result.localTargetProof?.cloudGpuExecutionAllowedNow === false, "Cloud GPU execution must remain blocked");
assert(result.localTargetProof?.localProofAttempted === false, "Local proof must not be attempted");
assert(result.localTargetProof?.blockedBeforeInference === true, "Proof must block before inference");
assert(result.proofResult?.preflightPassed === false, "Preflight must fail closed");
assert(result.proofResult?.proofExecutionAttempted === false, "Proof execution must not be attempted");
assert(result.proofResult?.cleanupRequired === false, "No cleanup should be required");
assert(result.proofResult?.cleanupVerified === true, "Cleanup must be verified as not needed");
ensureFlagsClosed(result.runtimeFlags, "AI-VIDEO-BROLL-GEN-9 result");
assert(result.nextPrompt === EXPECTED_NEXT_PROMPT, "Unexpected next prompt");

assert(preflight.status === "blocked_before_inference", "Preflight status mismatch");
assert(preflight.gate8Pr?.number === 823, "Gate 8 PR number mismatch");
assert(preflight.gate8Pr?.mergeStateStatus === "CLEAN", "Gate 8 PR must be clean");
assert(preflight.repoTrackedStateBeforeProof === "clean", "Repo must be clean before proof");
assert(preflight.host?.architecture === "arm64", "Preflight architecture mismatch");
assert(preflight.host?.memoryBytes === 17179869184, "Preflight memory bytes mismatch");
assert(preflight.graphics?.chipset === "Apple M4", "Preflight GPU mismatch");
assert(preflight.privateCache?.exists === true, "Preflight cache must exist");
assert(preflight.privateCache?.outsideRepository === true, "Preflight cache must be outside repo");
assert(preflight.privateCache?.fileCount === 10, "Preflight cache file count mismatch");
assert(preflight.privateCache?.approxSizeGiB === 16, "Preflight cache size mismatch");
assert(preflight.privateCache?.networkFetchRequired === false, "Network fetch must not be required");
assert(preflight.safetyChecks?.syntheticFixtureNonUserMediaOnly === true, "Preflight fixture must be non-user-media");
assert(preflight.safetyChecks?.cpuGenerationBlocked === true, "Preflight must block CPU generation");
assert(preflight.safetyChecks?.localGpuMemoryHeadroomProven === false, "Local GPU memory headroom must not be proven");
assert(preflight.safetyChecks?.ownerApprovedCloudGpuAvailable === false, "Cloud GPU must not be available now");
assert(preflight.safetyChecks?.stopBeforeExecutionRequired === true, "Stop-before-execution must be required");
for (const [action, notRun] of Object.entries(preflight.actionsNotRun ?? {})) {
  assert(notRun === true, `${action} must not run`);
}
assert(preflight.blockedReason === "local_m4_16g_unified_memory_cannot_prove_safe_wan_1_3b_generation_headroom", "Blocked reason mismatch");
assert(preflight.nextPrompt === EXPECTED_NEXT_PROMPT, "Preflight next prompt mismatch");

assert(changeLog.packageLockChanged === false, "package-lock must remain unchanged");
assert(changeLog.nodePackageDependencyChanged === false, "Node dependencies must not change");
assert(changeLog.pythonRequirementChanged === false, "Python requirements must not change");
assert(changeLog.runtimeFilesChanged === false, "Runtime files must not change");
assert(changeLog.supabaseFilesChanged === false, "Supabase files must not change");
assert(changeLog.sqlFilesChanged === false, "SQL files must not change");
assert(changeLog.modelWeightsChanged === false, "Model weights must not change");
assert(changeLog.privateModelCacheChanged === false, "Private model cache must not change");
assert(changeLog.temporaryProofDirectoryCreated === false, "Temporary proof directory must not be created");
assert(changeLog.modelInferenceRun === false, "Model inference must not run");
assert(changeLog.generatedFramesCreated === false, "Generated frames must not be created");
assert(changeLog.generatedVideoCreated === false, "Generated video must not be created");
assert(changeLog.nextPrompt === EXPECTED_NEXT_PROMPT, "Change log next prompt mismatch");

assert(rollback.throwawayEnvironmentRollbackRequired === false, "No throwaway environment rollback should be required");
assert(rollback.temporaryProofDirectoryRollbackRequired === false, "No proof directory rollback should be required");
assert(rollback.packageLockRollbackRequired === false, "package-lock rollback must not be required");
assert(rollback.runtimeRollbackRequired === false, "runtime rollback must not be required");
assert(rollback.supabaseRollbackRequired === false, "Supabase rollback must not be required");
assert(rollback.sqlRollbackRequired === false, "SQL rollback must not be required");
assert(rollback.artifactRollbackRequired === false, "artifact rollback must not be required");
assert(rollback.generatedFrameRollbackRequired === false, "generated frame rollback must not be required");
assert(rollback.generatedVideoRollbackRequired === false, "generated video rollback must not be required");
assert(rollback.nextPrompt === EXPECTED_NEXT_PROMPT, "Rollback next prompt mismatch");

const promptText = read("docs/implementation-prompts/prompt-ai-video-broll-gen-9a-runtime-memory-owner-review.md");
assert(promptText.includes("AI-VIDEO-BROLL-GEN-9A Runtime Memory Owner Review Prompt"), "Missing Gate 9A prompt title");
assert(promptText.includes("without running inference"), "Gate 9A prompt must block inference");
assert(promptText.includes("cost-friendly cloud proof target"), "Gate 9A prompt must include cloud target review");
assert(promptText.includes("smaller secondary model proof"), "Gate 9A prompt must include smaller model review");
assert(promptText.includes("HunyuanVideo remains premium gated/blocked"), "Gate 9A prompt must preserve Hunyuan block");
assert(promptText.includes("generated_local_fixture_passed"), "Gate 9A prompt must block generated local fixture claims");

ensureSafeText([
  "docs/ai-video-broll-generation-controlled-synthetic-generation-proof-result.md",
  "docs/ai-video-broll-generation-controlled-synthetic-generation-proof-preflight.md",
  "docs/ai-video-broll-generation-controlled-synthetic-generation-proof-change-log.md",
  "docs/ai-video-broll-generation-controlled-synthetic-generation-proof-rollback-report.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9a-runtime-memory-owner-review.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  modelId: "Wan-AI/Wan2.1-T2V-1.3B",
  sourceRevision: "37ec512624d61f7aa208f7ea8140a131f93afc9a",
  preflightPassed: false,
  blockedBeforeInference: true,
  blockedReason: "local_m4_16g_unified_memory_cannot_prove_safe_wan_1_3b_generation_headroom",
  hostArchitecture: "arm64",
  localGpu: "Apple M4 integrated GPU, 10 cores",
  systemMemoryGiB: 16,
  privateCacheApproxSizeGiB: 16,
  proofExecutionAttempted: false,
  pipelineInstantiated: false,
  textEncodingCalled: false,
  denoisingRun: false,
  vaeDecodeRun: false,
  inferenceRun: false,
  generatedFramesCreated: false,
  generatedVideoCreated: false,
  mediaProcessingRun: false,
  ffmpegRun: false,
  dockerOrGcpTouched: false,
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
