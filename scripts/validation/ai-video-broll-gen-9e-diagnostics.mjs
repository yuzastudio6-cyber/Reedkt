#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const EXPECTED_DECISION =
  "ai_video_broll_gen_9e_gcp_compute_api_owner_approval_completed_ready_for_compute_api_enablement_plan";
const EXPECTED_NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-9F: Compute API enablement for accepted proof project, no VM/no quota request/no inference";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-gcp-compute-api-owner-approval-packet.md",
  "docs/ai-video-broll-generation-gcp-compute-api-owner-approval-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9f-compute-api-enablement.md",
  "scripts/validation/ai-video-broll-gen-9e-diagnostics.mjs",
  "docs/ai-video-broll-generation-gcp-compute-api-quota-owner-setup-plan.md",
  "docs/ai-video-broll-generation-gcp-compute-api-quota-setup-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9e-gcp-compute-api-owner-approval.md",
  "docs/ai-video-broll-generation-gcp-l4-prerequisite-verification-report.md",
  "docs/activation-gcp-staging-command-policy.md",
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
  ["mutating gcloud command now", /^\s*(?:\$|>)?\s*gcloud\s+(services\s+enable|compute\s+instances\s+create|compute\s+instances\s+delete|run\s+deploy|run\s+jobs\s+execute|builds\s+submit|artifacts\s+docker\s+images\s+delete)\b/im],
  ["docker execution command", /^\s*(?:\$|>)?\s*docker\s+(build|run|push|compose\s+up|start)\b/im],
  ["runtime execution claim", /\b(pipelineInstantiated|modelFromPretrainedCalled|torchLoadCalled|textEncodingCalled|denoisingStepRun|schedulerRun|vaeDecodeRun|modelInferenceRun|inferenceRun)\b\s*[:=]\s*(true|"true")/i],
  ["generated media claim", /\b(generatedFramesCreated|generatedVideoCreated|mediaArtifactsCreated|cloudResourcesCreated)\b\s*[:=]\s*(true|"true")/i],
  ["cloud mutation claim", /\b(computeEngineApiEnabled|quotaRequestCreated|cloudResourcesCreated|gcpCommandsRun)\b\s*[:=]\s*(true|"true")/i],
  ["runtime flag claim", /\b(dependencyInstallAllowed|modelWeightDownloadAllowed|dependencyModuleImportAllowed|modelLoaderMetadataInspectionAllowed|pipelineInstantiationAllowed|modelFromPretrainedAllowed|torchLoadAllowed|textEncodingAllowed|denoisingStepAllowed|schedulerRunAllowed|vaeEncodeDecodeAllowed|modelInferenceAllowed|generatedFramesAllowed|generatedVideoAllowed|mediaProcessingAllowed|ffmpegAllowed|providerCallsAllowed|workerExecutionAllowed|routeExecutionAllowed|supabaseMutationAllowed|sqlAllowed|dockerCloudRunAllowed|gcpMutationAllowed|cloudResourceCreationAllowed|storageUploadAllowed|signedUrlCreationAllowed|publicArtifactCreationAllowed|creditMutationAllowed|dryRunPassedClaimed|generatedLocalFixturePassedClaimed|runtimeReadinessClaimed|betaProductionUnlockClaimed)\b\s*[:=]\s*(true|"true")/i],
  ["generated local fixture wording claim", /\bgenerated_local_fixture_passed\s+(claimed|true|passed)/i],
  ["dry run wording claim", /\bdry_run_passed\s+(claimed|true|passed)/i],
  ["public URL", /https?:\/\/(?!cloud\.google\.com\/)[^\s`)]+/i],
  ["signed URL query", /\b(X-Amz-Signature|X-Amz-Credential|Expires=|Signature=|Policy=|Key-Pair-Id=)/i],
  ["DB URL", /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ["JWT", /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/],
  ["Authorization bearer", /\bAuthorization\s*:\s*Bearer\s+[A-Za-z0-9._-]+/i],
  ["Supabase project URL", /https:\/\/[a-z0-9]{20}\.supabase\.co/i],
  ["API key assignment", /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
  ["service role assignment", /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
  ["secret assignment", /\bsecret\s*[:=]\s*['"][^'"]+/i],
  ["active account value", /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i]
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
  packageJson.scripts?.["ai-video-broll-gen-9e:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-9e-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-9e:diagnostics"
);

const packet = parseBlock(
  "docs/ai-video-broll-generation-gcp-compute-api-owner-approval-packet.md",
  "ai-video-broll-gen-9e-gcp-compute-api-owner-approval-packet"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-gcp-compute-api-owner-approval-change-log.md",
  "ai-video-broll-gen-9e-gcp-compute-api-owner-approval-change-log"
);
const gate9d = parseBlock(
  "docs/ai-video-broll-generation-gcp-compute-api-quota-owner-setup-plan.md",
  "ai-video-broll-gen-9d-gcp-compute-api-quota-owner-setup-plan"
);

assert(packet.decision === EXPECTED_DECISION, "Unexpected AI-VIDEO-BROLL-GEN-9E decision");
assert(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
assert(packet.sourceCommit === "b557d596", "Gate 9E source commit must be Gate 9D commit");
assert(gate9d.decision === "ai_video_broll_gen_9d_gcp_compute_api_quota_owner_setup_plan_completed_ready_for_owner_approval", "Gate 9D source decision mismatch");
assert(packet.ownerDecision?.workstreamOwner === "GCP_CLOUD_RUNTIME", "GCP owner must own approval");
assert(packet.ownerDecision?.requestingWorkstream === "AI_VIDEO_BROLL_GENERATION", "Requesting workstream mismatch");
assert(packet.ownerDecision?.decisionMode === "owner_approval_packet_only", "Decision mode mismatch");
assert(packet.ownerDecision?.acceptedProject === "reeditpro", "Accepted project mismatch");
assert(packet.ownerDecision?.acceptedAsNonProductionPrivateProofProject === true, "Project must be accepted for non-production private proof scope");
assert(packet.ownerDecision?.computeApiEnablementFutureAllowed === true, "Future Compute API enablement must be conditionally allowed");
assert(packet.ownerDecision?.l4QuotaReadOnlyChecksFutureAllowed === true, "Future read-only L4 checks must be allowed");
assert(packet.ownerDecision?.quotaIncreasePlanningFutureAllowed === true, "Quota increase planning must be allowed");
assert(packet.ownerDecision?.quotaIncreaseRequestAllowedNow === false, "Quota request must not be allowed now");
assert(packet.ownerDecision?.resourceCreationAllowedNow === false, "Resource creation must not be allowed now");
assert(packet.ownerDecision?.proofExecutionAllowedNow === false, "Proof execution must not be allowed now");
assert(packet.ownerDecision?.humanReviewedCommandPlanRequired === true, "Human-reviewed command plan must be required");
assert(packet.acceptedProofScope?.modelId === "Wan-AI/Wan2.1-T2V-1.3B", "Model ID mismatch");
assert(packet.acceptedProofScope?.targetAccelerator === "nvidia_l4", "Target accelerator mismatch");
assert(packet.acceptedProofScope?.targetAcceleratorCount === 1, "Target accelerator count mismatch");
assert(packet.acceptedProofScope?.syntheticNonUserMediaOnly === true, "Synthetic-only scope required");
assert(packet.acceptedProofScope?.publicEndpointAllowed === false, "Public endpoint must be blocked");
assert(packet.acceptedProofScope?.userMediaAllowed === false, "User media must be blocked");
assert(packet.acceptedProofScope?.productionOrCustomerDataAllowed === false, "Production/customer data must be blocked");
assert(packet.acceptedProofScope?.generatedMediaAllowedNow === false, "Generated media must be blocked now");
for (const allowed of [
  "compute_engine_api_enablement_for_reeditpro_non_production_private_proof_scope",
  "read_only_compute_api_enabled_verification",
  "read_only_l4_quota_region_check",
  "quota_request_planning_if_needed"
]) {
  assert(packet.futureAllowedOnlyAfterThisApproval?.includes(allowed), `Missing future allowance ${allowed}`);
}
for (const forbidden of [
  "vm_creation",
  "quota_increase_request",
  "docker_run",
  "model_inference",
  "generated_media",
  "signed_url",
  "public_artifact",
  "supabase_mutation",
  "worker_dispatch",
  "credit_mutation"
]) {
  assert(packet.forbiddenNow?.includes(forbidden), `Missing forbidden item ${forbidden}`);
}
ensureFlagsClosed(packet.runtimeFlags, "AI-VIDEO-BROLL-GEN-9E packet");
assert(packet.nextPrompt === EXPECTED_NEXT_PROMPT, "Packet next prompt mismatch");

assert(changeLog.packageLockChanged === false, "package-lock must remain unchanged");
assert(changeLog.gcpCommandsRun === false, "GCP commands must not run");
assert(changeLog.computeEngineApiEnabled === false, "Compute API must not be enabled by Gate 9E");
assert(changeLog.quotaRequestCreated === false, "Quota request must not be created");
assert(changeLog.cloudResourcesCreated === false, "Cloud resources must not be created");
assert(changeLog.modelInferenceRun === false, "Model inference must not run");
assert(changeLog.generatedFramesCreated === false, "Generated frames must not be created");
assert(changeLog.generatedVideoCreated === false, "Generated video must not be created");
assert(changeLog.nextPrompt === EXPECTED_NEXT_PROMPT, "Change log next prompt mismatch");

const nextPromptText = read("docs/implementation-prompts/prompt-ai-video-broll-gen-9f-compute-api-enablement.md");
assert(nextPromptText.includes("AI-VIDEO-BROLL-GEN-9F Compute API Enablement Prompt"), "Missing Gate 9F prompt title");
assert(nextPromptText.includes("enable only the Compute Engine API"), "Gate 9F prompt must allow only Compute API enablement");
assert(nextPromptText.includes("confirm active project is still `reeditpro`"), "Gate 9F prompt must verify project");
assert(nextPromptText.includes("Forbidden in that future prompt"), "Gate 9F prompt must list forbidden actions");
assert(nextPromptText.includes("generated_local_fixture_passed"), "Gate 9F prompt must block generated local fixture claims");

ensureSafeText([
  "docs/ai-video-broll-generation-gcp-compute-api-owner-approval-packet.md",
  "docs/ai-video-broll-generation-gcp-compute-api-owner-approval-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9f-compute-api-enablement.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  workstreamOwner: "GCP_CLOUD_RUNTIME",
  requestingWorkstream: "AI_VIDEO_BROLL_GENERATION",
  acceptedProject: "reeditpro",
  acceptedAsNonProductionPrivateProofProject: true,
  computeApiEnablementFutureAllowed: true,
  l4QuotaReadOnlyChecksFutureAllowed: true,
  quotaIncreasePlanningFutureAllowed: true,
  quotaIncreaseRequestAllowedNow: false,
  resourceCreationAllowedNow: false,
  proofExecutionAllowedNow: false,
  computeEngineApiEnabledByThisGate: false,
  gcpCommandsRun: false,
  cloudResourcesCreated: false,
  dockerCommandsRun: false,
  proofExecutionAttempted: false,
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
