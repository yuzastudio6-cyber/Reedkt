#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const EXPECTED_DECISION =
  "ai_video_broll_gen_8_controlled_synthetic_generation_plan_completed_ready_for_controlled_synthetic_generation_proof";
const EXPECTED_NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-9: controlled synthetic generation proof, local tiny non-user-media only";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-controlled-synthetic-generation-plan.md",
  "docs/ai-video-broll-generation-controlled-synthetic-generation-runtime-estimate.md",
  "docs/ai-video-broll-generation-controlled-synthetic-generation-owner-gate-register.md",
  "docs/ai-video-broll-generation-controlled-synthetic-generation-change-log.md",
  "docs/ai-video-broll-generation-controlled-synthetic-generation-rollback-report.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9-controlled-synthetic-generation-proof.md",
  "scripts/validation/ai-video-broll-gen-8-diagnostics.mjs",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-8-controlled-synthetic-generation-plan.md",
  "docs/ai-video-broll-generation-controlled-model-loader-import-result.md",
  "docs/ai-video-broll-generation-controlled-model-loader-import-metadata.md",
  "docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md",
  "server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt",
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
  ["dependency install claim", /\bdependencyInstallAllowed\b\s*[:=]\s*(true|"true")/i],
  ["model weight download claim", /\bmodelWeightDownloadAllowed\b\s*[:=]\s*(true|"true")/i],
  ["model import claim", /\b(dependencyModuleImportAllowed|modelLoaderMetadataInspectionAllowed)\b\s*[:=]\s*(true|"true")/i],
  ["pipeline instantiation claim", /\bpipelineInstantiationAllowed\b\s*[:=]\s*(true|"true")/i],
  ["from pretrained claim", /\bmodelFromPretrainedAllowed\b\s*[:=]\s*(true|"true")/i],
  ["torch load claim", /\btorchLoadAllowed\b\s*[:=]\s*(true|"true")/i],
  ["text encoding claim", /\btextEncodingAllowed\b\s*[:=]\s*(true|"true")/i],
  ["denoising claim", /\bdenoisingStepAllowed\b\s*[:=]\s*(true|"true")/i],
  ["scheduler claim", /\bschedulerRunAllowed\b\s*[:=]\s*(true|"true")/i],
  ["VAE encode/decode claim", /\bvaeEncodeDecodeAllowed\b\s*[:=]\s*(true|"true")/i],
  ["model inference claim", /\b(modelInferenceAllowed|inferenceRun)\b\s*[:=]\s*(true|"true")/i],
  ["generated frames claim", /\b(generatedFramesAllowed|generatedFramesCreated)\b\s*[:=]\s*(true|"true")/i],
  ["generated video claim", /\b(generatedVideoAllowed|generatedVideoCreated)\b\s*[:=]\s*(true|"true")/i],
  ["media processing claim", /\bmediaProcessingAllowed\b\s*[:=]\s*(true|"true")/i],
  ["FFmpeg claim", /\bffmpegAllowed\b\s*[:=]\s*(true|"true")/i],
  ["provider call claim", /\bproviderCallsAllowed\b\s*[:=]\s*(true|"true")/i],
  ["worker execution claim", /\bworkerExecutionAllowed\b\s*[:=]\s*(true|"true")/i],
  ["route execution claim", /\brouteExecutionAllowed\b\s*[:=]\s*(true|"true")/i],
  ["Supabase mutation claim", /\bsupabaseMutationAllowed\b\s*[:=]\s*(true|"true")/i],
  ["SQL claim", /\bsqlAllowed\b\s*[:=]\s*(true|"true")/i],
  ["Docker/Cloud Run claim", /\bdockerCloudRunAllowed\b\s*[:=]\s*(true|"true")/i],
  ["GCP mutation claim", /\bgcpMutationAllowed\b\s*[:=]\s*(true|"true")/i],
  ["storage upload claim", /\bstorageUploadAllowed\b\s*[:=]\s*(true|"true")/i],
  ["signed URL claim", /\bsignedUrlCreationAllowed\b\s*[:=]\s*(true|"true")/i],
  ["public artifact claim", /\bpublicArtifactCreationAllowed\b\s*[:=]\s*(true|"true")/i],
  ["credit mutation claim", /\bcreditMutationAllowed\b\s*[:=]\s*(true|"true")/i],
  ["dry run passed claim", /\bdryRunPassedClaimed\b\s*[:=]\s*(true|"true")/i],
  ["generated local fixture claim", /\bgeneratedLocalFixturePassedClaimed\b\s*[:=]\s*(true|"true")/i],
  ["runtime readiness claim", /\bruntimeReadinessClaimed\b\s*[:=]\s*(true|"true")/i],
  ["beta production claim", /\bbetaProductionUnlockClaimed\b\s*[:=]\s*(true|"true")/i],
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
  packageJson.scripts?.["ai-video-broll-gen-8:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-8-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-8:diagnostics"
);

const plan = parseBlock(
  "docs/ai-video-broll-generation-controlled-synthetic-generation-plan.md",
  "ai-video-broll-gen-8-controlled-synthetic-generation-plan"
);
const runtime = parseBlock(
  "docs/ai-video-broll-generation-controlled-synthetic-generation-runtime-estimate.md",
  "ai-video-broll-gen-8-runtime-estimate"
);
const owners = parseBlock(
  "docs/ai-video-broll-generation-controlled-synthetic-generation-owner-gate-register.md",
  "ai-video-broll-gen-8-owner-gate-register"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-controlled-synthetic-generation-change-log.md",
  "ai-video-broll-gen-8-controlled-synthetic-generation-change-log"
);
const rollback = parseBlock(
  "docs/ai-video-broll-generation-controlled-synthetic-generation-rollback-report.md",
  "ai-video-broll-gen-8-controlled-synthetic-generation-rollback-report"
);
const gate7 = parseBlock(
  "docs/ai-video-broll-generation-controlled-model-loader-import-result.md",
  "ai-video-broll-gen-7-model-loader-import-result"
);

assert(plan.decision === EXPECTED_DECISION, "Unexpected AI-VIDEO-BROLL-GEN-8 plan decision");
assert(runtime.decision === EXPECTED_DECISION, "Runtime estimate decision mismatch");
assert(owners.decision === EXPECTED_DECISION, "Owner gate decision mismatch");
assert(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
assert(rollback.decision === EXPECTED_DECISION, "Rollback decision mismatch");
assert(plan.sourceCommit === "c0b9c420", "Gate 8 source commit must be Gate 7 commit");
assert(gate7.decision === "ai_video_broll_gen_7_model_loader_import_completed_ready_for_controlled_synthetic_generation_plan", "Gate 7 source decision mismatch");
assert(plan.selectedModel?.modelId === "Wan-AI/Wan2.1-T2V-1.3B", "Gate 8 must use Wan 1.3B");
assert(plan.selectedModel?.sourceRevision === "37ec512624d61f7aa208f7ea8140a131f93afc9a", "Unexpected source revision");
assert(plan.selectedModel?.networkFetchAllowedForFutureProof === false, "Future proof must not require network fetch");
assert(plan.syntheticFixturePlan?.inputKind === "structured_non_user_media_text_fixture", "Synthetic fixture must be structured non-user media");
assert(plan.syntheticFixturePlan?.userMediaUsed === false, "Synthetic fixture must not use user media");
assert(plan.syntheticFixturePlan?.rawChatUsedAsExecutionPlan === false, "Raw chat must not be an execution plan");
assert(plan.syntheticFixturePlan?.containsPeople === false, "Synthetic fixture must avoid people");
assert(plan.syntheticFixturePlan?.containsFaces === false, "Synthetic fixture must avoid faces");
assert(plan.syntheticFixturePlan?.containsBrandsOrLogos === false, "Synthetic fixture must avoid brands/logos");
assert(plan.syntheticFixturePlan?.containsReadableText === false, "Synthetic fixture must avoid readable text");
assert(plan.syntheticFixturePlan?.containsAudio === false, "Synthetic fixture must avoid audio");
assert(plan.syntheticFixturePlan?.generatedFramesCreatedNow === false, "Gate 8 must not create frames");
assert(plan.syntheticFixturePlan?.generatedVideoCreatedNow === false, "Gate 8 must not create video");
assert(plan.runtimeReadiness?.futureProofMayBeRequested === true, "Gate 8 must allow a future proof prompt");
assert(plan.runtimeReadiness?.cpuGenerationAccepted === false, "CPU generation must remain blocked");
assert(plan.runtimeReadiness?.ownerAcceptanceRequiredBeforeDenoising === true, "Denoising requires owner acceptance");
assert(plan.runtimeReadiness?.ownerAcceptanceRequiredBeforeFrameCreation === true, "Frame creation requires owner acceptance");
assert(plan.runtimeReadiness?.ownerAcceptanceRequiredBeforeVaeDecode === true, "VAE decode requires owner acceptance");
assert(plan.runtimeReadiness?.ownerAcceptanceRequiredBeforeVideoWrite === true, "Video write requires owner acceptance");
assert(plan.runtimeReadiness?.ownerAcceptanceRequiredBeforeFfmpeg === true, "FFmpeg requires owner acceptance");
ensureFlagsClosed(plan.runtimeFlags, "AI-VIDEO-BROLL-GEN-8 plan");
assert(plan.nextPrompt === EXPECTED_NEXT_PROMPT, "Unexpected next prompt");

assert(runtime.estimateKind === "planning_only_unbenchmarked", "Runtime estimate must be planning-only");
assert(runtime.cpuEstimate?.acceptedForFutureProof === false, "CPU proof must be rejected");
assert(runtime.cpuEstimate?.wallClockEstimateMinutes === ">720", "CPU runtime estimate must be explicit");
assert(runtime.localGpuEstimate?.acceptedForFutureProofOnlyAfterPreflight === true, "Local GPU must require preflight");
assert(runtime.localGpuEstimate?.minimumMemoryEstimateGiB === 10, "Local GPU minimum memory estimate mismatch");
assert(runtime.localGpuEstimate?.recommendedMemoryHeadroomGiB === 16, "Local GPU headroom mismatch");
assert(runtime.cloudGpuEstimate?.acceptedForFutureProofOnlyAfterOwnerApproval === true, "Cloud GPU must require owner approval");
assert(runtime.cloudGpuEstimate?.preferredCostFriendlyTarget === "single_l4_24gb_future_worker_only", "Unexpected cost-friendly GPU target");
assert(runtime.cloudGpuEstimate?.gcpExecutionAllowedNow === false, "GCP execution must remain blocked");
assert(runtime.cloudGpuEstimate?.cloudRunAllowedNow === false, "Cloud Run must remain blocked");
assert(runtime.abortThresholds?.projectedGpuMemoryGiBGreaterThan === 16, "GPU memory abort threshold mismatch");
assert(runtime.abortThresholds?.projectedRuntimeMinutesGreaterThan === 180, "Runtime abort threshold mismatch");
ensureFlagsClosed(runtime.runtimeFlags, "AI-VIDEO-BROLL-GEN-8 runtime estimate");

const ownerNames = new Set((owners.owners ?? []).map((owner) => owner.owner));
for (const expectedOwner of [
  "AI_VIDEO_BROLL_GENERATION",
  "WORKER_RUNTIME_JOBS",
  "PROVIDER_GATEWAY_MODELS",
  "TRACK_A_RENDER_EXPORT",
  "TRACK_B_MEDIA_PROCESSING",
  "SUPABASE_RLS_STORAGE_DATABASE",
  "OBSERVABILITY_AUDIT_COST",
  "BILLING_STRIPE_CREDITS",
  "PRODUCT_BETA_READINESS"
]) {
  assert(ownerNames.has(expectedOwner), `Missing owner gate ${expectedOwner}`);
}
for (const owner of owners.owners ?? []) {
  assert(owner.acceptedForExecutionNow === false, `${owner.owner} must not accept execution now`);
}
assert(owners.futureProofMayProceedToPrompt === true, "Future proof prompt may proceed");
assert(owners.futureProofExecutionApprovedNow === false, "Future proof execution must not be approved now");
ensureFlagsClosed(owners.runtimeFlags, "AI-VIDEO-BROLL-GEN-8 owner gates");

assert(changeLog.packageLockChanged === false, "package-lock must remain unchanged");
assert(changeLog.nodePackageDependencyChanged === false, "Node dependencies must not change");
assert(changeLog.pythonRequirementChanged === false, "Python requirements must not change");
assert(changeLog.runtimeFilesChanged === false, "Runtime files must not change");
assert(changeLog.supabaseFilesChanged === false, "Supabase files must not change");
assert(changeLog.sqlFilesChanged === false, "SQL files must not change");
assert(changeLog.modelWeightsChanged === false, "Model weights must not change");
assert(changeLog.privateModelCacheChanged === false, "Private model cache must not change");
assert(changeLog.pipelineInstantiated === false, "Pipeline must not instantiate");
assert(changeLog.modelInferenceRun === false, "Model inference must not run");
assert(changeLog.generatedFramesCreated === false, "Generated frames must not be created");
assert(changeLog.generatedVideoCreated === false, "Generated video must not be created");
assert(changeLog.nextPrompt === EXPECTED_NEXT_PROMPT, "Change log next prompt mismatch");

assert(rollback.throwawayEnvironmentRollbackRequired === false, "No throwaway environment rollback should be required");
assert(rollback.packageLockRollbackRequired === false, "package-lock rollback must not be required");
assert(rollback.runtimeRollbackRequired === false, "runtime rollback must not be required");
assert(rollback.supabaseRollbackRequired === false, "Supabase rollback must not be required");
assert(rollback.sqlRollbackRequired === false, "SQL rollback must not be required");
assert(rollback.artifactRollbackRequired === false, "artifact rollback must not be required");
assert(rollback.generatedFrameRollbackRequired === false, "generated frame rollback must not be required");
assert(rollback.generatedVideoRollbackRequired === false, "generated video rollback must not be required");
assert(rollback.nextPrompt === EXPECTED_NEXT_PROMPT, "Rollback next prompt mismatch");

const promptText = read("docs/implementation-prompts/prompt-ai-video-broll-gen-9-controlled-synthetic-generation-proof.md");
assert(promptText.includes("AI-VIDEO-BROLL-GEN-9 Controlled Synthetic Generation Proof Prompt"), "Missing Gate 9 prompt title");
assert(promptText.includes("No user media"), "Gate 9 prompt must block user media");
assert(promptText.includes("CPU generation remains blocked"), "Gate 9 prompt must block CPU generation");
assert(promptText.includes("Stop before execution"), "Gate 9 prompt must include stop-before-execution condition");
assert(promptText.includes("generated_local_fixture_passed"), "Gate 9 prompt must block generated local fixture claims");
assert(promptText.includes("dry_run_passed"), "Gate 9 prompt must block dry run claims");

ensureSafeText([
  "docs/ai-video-broll-generation-controlled-synthetic-generation-plan.md",
  "docs/ai-video-broll-generation-controlled-synthetic-generation-runtime-estimate.md",
  "docs/ai-video-broll-generation-controlled-synthetic-generation-owner-gate-register.md",
  "docs/ai-video-broll-generation-controlled-synthetic-generation-change-log.md",
  "docs/ai-video-broll-generation-controlled-synthetic-generation-rollback-report.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9-controlled-synthetic-generation-proof.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  modelId: "Wan-AI/Wan2.1-T2V-1.3B",
  sourceRevision: "37ec512624d61f7aa208f7ea8140a131f93afc9a",
  syntheticFixturePlanned: true,
  nonUserMediaOnly: true,
  cpuGenerationAccepted: false,
  gpuMemoryEstimateRecorded: true,
  runtimeEstimateRecorded: true,
  ownerGateCount: owners.owners.length,
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
