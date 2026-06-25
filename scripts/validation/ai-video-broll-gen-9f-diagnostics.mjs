#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const EXPECTED_DECISION =
  "ai_video_broll_gen_9f_compute_api_enablement_completed_ready_for_l4_quota_cost_verification";
const EXPECTED_NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-9G: L4 quota and cost verification, no VM/no inference";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-gcp-compute-api-enablement-report.md",
  "docs/ai-video-broll-generation-gcp-compute-api-enablement-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9g-l4-quota-cost-verification.md",
  "scripts/validation/ai-video-broll-gen-9f-diagnostics.mjs",
  "docs/ai-video-broll-generation-gcp-compute-api-owner-approval-packet.md",
  "docs/ai-video-broll-generation-gcp-compute-api-owner-approval-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9f-compute-api-enablement.md",
  "docs/ai-video-broll-generation-gcp-compute-api-quota-owner-setup-plan.md",
  "package.json"
];

const RUNTIME_FLAGS_FALSE = [
  "quotaRequestCreated",
  "vmCreated",
  "diskCreated",
  "serviceAccountCreated",
  "networkCreated",
  "bucketCreated",
  "cloudRunJobCreated",
  "dockerCommandRun",
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
  ["disallowed mutating gcloud command", /^\s*(?:\$|>)?\s*gcloud\s+(compute\s+instances\s+create|compute\s+instances\s+delete|run\s+deploy|run\s+jobs\s+execute|builds\s+submit|artifacts\s+docker\s+images\s+delete)\b/im],
  ["additional service enablement", /^\s*(?:\$|>)?\s*gcloud\s+services\s+enable\s+(?!compute\.googleapis\.com\b)[a-z0-9.-]+/im],
  ["quota request command", /\b(gcloud\s+(?:alpha\s+|beta\s+)?services\s+quota|quota\s+increase|quotaIncreaseRequest)\b/i],
  ["docker execution command", /^\s*(?:\$|>)?\s*docker\s+(build|run|push|compose\s+up|start)\b/im],
  ["runtime execution claim", /\b(pipelineInstantiated|modelFromPretrainedCalled|torchLoadCalled|textEncodingCalled|denoisingStepRun|schedulerRun|vaeDecodeRun|modelInferenceRun|inferenceRun)\b\s*[:=]\s*(true|"true")/i],
  ["generated media claim", /\b(generatedFramesCreated|generatedVideoCreated|mediaArtifactsCreated|cloudResourcesCreated)\b\s*[:=]\s*(true|"true")/i],
  ["runtime flag claim", /\b(quotaRequestCreated|vmCreated|diskCreated|serviceAccountCreated|networkCreated|bucketCreated|cloudRunJobCreated|dockerCommandRun|dependencyInstallAllowed|modelWeightDownloadAllowed|dependencyModuleImportAllowed|modelLoaderMetadataInspectionAllowed|pipelineInstantiationAllowed|modelFromPretrainedAllowed|torchLoadAllowed|textEncodingAllowed|denoisingStepAllowed|schedulerRunAllowed|vaeEncodeDecodeAllowed|modelInferenceAllowed|generatedFramesAllowed|generatedVideoAllowed|mediaProcessingAllowed|ffmpegAllowed|providerCallsAllowed|workerExecutionAllowed|routeExecutionAllowed|supabaseMutationAllowed|sqlAllowed|storageUploadAllowed|signedUrlCreationAllowed|publicArtifactCreationAllowed|creditMutationAllowed|dryRunPassedClaimed|generatedLocalFixturePassedClaimed|runtimeReadinessClaimed|betaProductionUnlockClaimed)\b\s*[:=]\s*(true|"true")/i],
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
  packageJson.scripts?.["ai-video-broll-gen-9f:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-9f-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-9f:diagnostics"
);

const report = parseBlock(
  "docs/ai-video-broll-generation-gcp-compute-api-enablement-report.md",
  "ai-video-broll-gen-9f-compute-api-enablement-report"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-gcp-compute-api-enablement-change-log.md",
  "ai-video-broll-gen-9f-compute-api-enablement-change-log"
);
const gate9e = parseBlock(
  "docs/ai-video-broll-generation-gcp-compute-api-owner-approval-packet.md",
  "ai-video-broll-gen-9e-gcp-compute-api-owner-approval-packet"
);

assert(report.decision === EXPECTED_DECISION, "Unexpected AI-VIDEO-BROLL-GEN-9F decision");
assert(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
assert(report.sourceCommit === "8f775a63", "Gate 9F source commit must be Gate 9E commit");
assert(gate9e.decision === "ai_video_broll_gen_9e_gcp_compute_api_owner_approval_completed_ready_for_compute_api_enablement_plan", "Gate 9E source decision mismatch");
assert(report.preflight?.activeProject === "reeditpro", "Active project mismatch");
assert(report.preflight?.activeAccountPresent === true, "Active account presence must be verified");
assert(report.preflight?.activeAccountValueStored === false, "Active account value must not be stored");
assert(report.preflight?.computeApiBefore === "disabled", "Compute API before state mismatch");
assert(report.approvedMutation?.mutationScope === "compute_engine_api_enablement_only", "Mutation scope mismatch");
assert(report.approvedMutation?.sanitizedCommand === "gcloud services enable compute.googleapis.com --project=reeditpro --quiet", "Sanitized command mismatch");
assert(report.approvedMutation?.computeEngineApiEnabledByThisGate === true, "Compute API must be enabled by this gate");
assert(report.approvedMutation?.operationCompletedSuccessfully === true, "Operation must complete successfully");
assert(report.approvedMutation?.operationIdentifierStoredAsSourceOfTruth === false, "Operation ID must not be source of truth");
assert(report.postEnableVerification?.computeApiAfter === "enabled", "Compute API after state mismatch");
assert(report.postEnableVerification?.nvidiaL4AcceleratorTypesVisible === true, "L4 types must be visible");
assert(report.postEnableVerification?.visibleNvidiaL4AcceleratorTypeEntries === 44, "Visible L4 entry count mismatch");
for (const [region, zoneCount] of [
  ["us-central1", 3],
  ["us-east4", 2],
  ["us-west1", 3]
]) {
  const visibility = report.postEnableVerification.candidateRegionVisibility?.find((entry) => entry.region === region);
  assert(visibility?.l4ZoneCount === zoneCount, `L4 zone count mismatch for ${region}`);
  const quota = report.postEnableVerification.candidateRegionQuotaSpotCheck?.find((entry) => entry.region === region);
  assert(quota?.nvidiaL4GpuLimit === 1, `L4 quota limit mismatch for ${region}`);
  assert(quota?.nvidiaL4GpuUsage === 0, `L4 quota usage mismatch for ${region}`);
  assert(quota?.preemptibleNvidiaL4GpuLimit === 1, `preemptible L4 quota limit mismatch for ${region}`);
  assert(quota?.preemptibleNvidiaL4GpuUsage === 0, `preemptible L4 quota usage mismatch for ${region}`);
}
assert(report.postEnableVerification?.formalCostVerificationCompleted === false, "Formal cost verification must remain future-gated");
assert(report.postEnableVerification?.executionApprovedNow === false, "Execution must not be approved now");
for (const blocker of [
  "exact_current_compute_g2_l4_pricing",
  "selected_region_and_zone",
  "selected_machine_type",
  "service_account_plan",
  "private_cache_transfer_plan",
  "cleanup_plan",
  "execution_command_plan"
]) {
  assert(report.blockedUntilFutureGate?.includes(blocker), `Missing future blocker ${blocker}`);
}
assert(report.runtimeFlags?.computeEngineApiEnablementAllowedAndCompleted === true, "Compute API enablement flag must be true");
ensureFlagsClosed(report.runtimeFlags, "AI-VIDEO-BROLL-GEN-9F report");
assert(report.nextPrompt === EXPECTED_NEXT_PROMPT, "Report next prompt mismatch");

assert(changeLog.gcpServiceUsageMutationCompleted === true, "Service Usage mutation must be recorded");
assert(changeLog.computeEngineApiEnabled === true, "Compute API enabled must be recorded");
assert(changeLog.quotaRequestCreated === false, "Quota request must not be created");
assert(changeLog.cloudResourcesCreated === false, "Cloud resources must not be created");
assert(changeLog.dockerCommandsRun === false, "Docker commands must not run");
assert(changeLog.modelInferenceRun === false, "Model inference must not run");
assert(changeLog.generatedFramesCreated === false, "Generated frames must not be created");
assert(changeLog.generatedVideoCreated === false, "Generated video must not be created");
assert(changeLog.nextPrompt === EXPECTED_NEXT_PROMPT, "Change log next prompt mismatch");

const nextPromptText = read("docs/implementation-prompts/prompt-ai-video-broll-gen-9g-l4-quota-cost-verification.md");
assert(nextPromptText.includes("AI-VIDEO-BROLL-GEN-9G L4 Quota And Cost Verification Prompt"), "Missing Gate 9G prompt title");
assert(nextPromptText.includes("confirm Compute Engine API remains enabled"), "Gate 9G prompt must verify API");
assert(nextPromptText.includes("inspect official current pricing sources"), "Gate 9G prompt must verify pricing");
assert(nextPromptText.includes("Forbidden in that future prompt"), "Gate 9G prompt must list forbidden actions");
assert(nextPromptText.includes("generated_local_fixture_passed"), "Gate 9G prompt must block generated local fixture claims");

ensureSafeText([
  "docs/ai-video-broll-generation-gcp-compute-api-enablement-report.md",
  "docs/ai-video-broll-generation-gcp-compute-api-enablement-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9g-l4-quota-cost-verification.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  activeProject: "reeditpro",
  computeApiBefore: "disabled",
  computeApiAfter: "enabled",
  computeEngineApiEnabledByThisGate: true,
  mutationScope: "compute_engine_api_enablement_only",
  nvidiaL4AcceleratorTypesVisible: true,
  visibleNvidiaL4AcceleratorTypeEntries: 44,
  candidateRegions: report.postEnableVerification.candidateRegionVisibility,
  quotaSpotCheck: report.postEnableVerification.candidateRegionQuotaSpotCheck,
  formalCostVerificationCompleted: false,
  executionApprovedNow: false,
  quotaRequestCreated: false,
  cloudResourcesCreated: false,
  dockerCommandsRun: false,
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
