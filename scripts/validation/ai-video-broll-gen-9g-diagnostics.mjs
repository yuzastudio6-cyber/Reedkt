#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const EXPECTED_DECISION =
  "ai_video_broll_gen_9g_l4_quota_cost_verification_completed_ready_for_private_proof_execution_plan";
const EXPECTED_NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-9H: private proof execution plan, no VM/no inference";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-gcp-l4-quota-cost-verification-report.md",
  "docs/ai-video-broll-generation-gcp-l4-quota-cost-verification-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9h-private-proof-execution-plan.md",
  "scripts/validation/ai-video-broll-gen-9g-diagnostics.mjs",
  "docs/ai-video-broll-generation-gcp-compute-api-enablement-report.md",
  "docs/ai-video-broll-generation-gcp-compute-api-enablement-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9g-l4-quota-cost-verification.md",
  "docs/ai-video-broll-generation-gcp-l4-private-synthetic-proof-plan.md",
  "package.json"
];

const RUNTIME_FLAGS_FALSE = [
  "additionalApiEnabledByThisGate",
  "quotaRequestCreated",
  "quotaIncreaseRequested",
  "vmCreated",
  "diskCreated",
  "serviceAccountCreated",
  "networkCreated",
  "bucketCreated",
  "artifactRegistryImageCreated",
  "reservationCreated",
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

const ALLOWED_URLS = new Set([
  "https://cloud.google.com/products/compute/pricing/accelerator-optimized",
  "https://docs.cloud.google.com/compute/docs/gpus",
  "https://docs.cloud.google.com/compute/docs/regions-zones/gpu-regions-zones"
]);

const UNSAFE_PATTERNS = [
  ["mutating gcloud command", /^\s*(?:\$|>)?\s*gcloud\s+(compute\s+instances\s+create|compute\s+instances\s+delete|run\s+deploy|run\s+jobs\s+execute|builds\s+submit|artifacts\s+docker\s+images\s+delete)\b/im],
  ["additional service enablement", /^\s*(?:\$|>)?\s*gcloud\s+services\s+enable\s+(?!compute\.googleapis\.com\b)[a-z0-9.-]+/im],
  ["quota request command", /\b(gcloud\s+(?:alpha\s+|beta\s+)?services\s+quota|quota\s+increase|quotaIncreaseRequest|quotaIncreaseRequested\s*[:=]\s*(true|"true"))\b/i],
  ["docker execution command", /^\s*(?:\$|>)?\s*docker\s+(build|run|push|compose\s+up|start)\b/im],
  ["runtime execution claim", /\b(pipelineInstantiated|modelFromPretrainedCalled|torchLoadCalled|textEncodingCalled|denoisingStepRun|schedulerRun|vaeDecodeRun|modelInferenceRun|inferenceRun)\b\s*[:=]\s*(true|"true")/i],
  ["generated media claim", /\b(generatedFramesCreated|generatedVideoCreated|mediaArtifactsCreated|cloudResourcesCreated)\b\s*[:=]\s*(true|"true")/i],
  ["runtime flag claim", /\b(additionalApiEnabledByThisGate|quotaRequestCreated|quotaIncreaseRequested|vmCreated|diskCreated|serviceAccountCreated|networkCreated|bucketCreated|artifactRegistryImageCreated|reservationCreated|cloudRunJobCreated|dockerCommandRun|dependencyInstallAllowed|modelWeightDownloadAllowed|dependencyModuleImportAllowed|modelLoaderMetadataInspectionAllowed|pipelineInstantiationAllowed|modelFromPretrainedAllowed|torchLoadAllowed|textEncodingAllowed|denoisingStepAllowed|schedulerRunAllowed|vaeEncodeDecodeAllowed|modelInferenceAllowed|generatedFramesAllowed|generatedVideoAllowed|mediaProcessingAllowed|ffmpegAllowed|providerCallsAllowed|workerExecutionAllowed|routeExecutionAllowed|supabaseMutationAllowed|sqlAllowed|storageUploadAllowed|signedUrlCreationAllowed|publicArtifactCreationAllowed|creditMutationAllowed|dryRunPassedClaimed|generatedLocalFixturePassedClaimed|runtimeReadinessClaimed|betaProductionUnlockClaimed)\b\s*[:=]\s*(true|"true")/i],
  ["generated local fixture wording claim", /\bgenerated_local_fixture_passed\s+(claimed|true|passed)/i],
  ["dry run wording claim", /\bdry_run_passed\s+(claimed|true|passed)/i],
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
    for (const rawUrl of text.match(/https?:\/\/[^\s`)]+/gi) ?? []) {
      const url = rawUrl.replace(/[",.;]+$/g, "");
      if (!ALLOWED_URLS.has(url)) {
        findings.push(`unexpected public URL ${rawUrl}: ${file}`);
      }
    }
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
  packageJson.scripts?.["ai-video-broll-gen-9g:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-9g-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-9g:diagnostics"
);

const report = parseBlock(
  "docs/ai-video-broll-generation-gcp-l4-quota-cost-verification-report.md",
  "ai-video-broll-gen-9g-l4-quota-cost-verification-report"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-gcp-l4-quota-cost-verification-change-log.md",
  "ai-video-broll-gen-9g-l4-quota-cost-verification-change-log"
);
const gate9f = parseBlock(
  "docs/ai-video-broll-generation-gcp-compute-api-enablement-report.md",
  "ai-video-broll-gen-9f-compute-api-enablement-report"
);

assert(report.decision === EXPECTED_DECISION, "Unexpected AI-VIDEO-BROLL-GEN-9G decision");
assert(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
assert(report.sourceCommit === "a9dc0212", "Gate 9G source commit must be Gate 9F commit");
assert(
  gate9f.decision === "ai_video_broll_gen_9f_compute_api_enablement_completed_ready_for_l4_quota_cost_verification",
  "Gate 9F source decision mismatch"
);
assert(gate9f.postEnableVerification?.computeApiAfter === "enabled", "Gate 9F must have enabled Compute API");

assert(report.readOnlyVerification?.project === "reeditpro", "Project mismatch");
assert(report.readOnlyVerification?.computeEngineApiEnabled === true, "Compute API must be enabled");
assert(report.readOnlyVerification?.additionalApiEnabledByThisGate === false, "No additional API may be enabled");
assert(report.readOnlyVerification?.quotaRequestCreated === false, "No quota request may be created");
assert(report.readOnlyVerification?.billingCatalogAnonymousApiAllowed === false, "Billing catalog anonymous API must not be treated as source");
assert(report.readOnlyVerification?.pricingPageFetchedByCurl === true, "Pricing page curl extraction must be recorded");

assert(report.machineTypeVerification?.machineType === "g2-standard-4", "Machine type mismatch");
assert(report.machineTypeVerification?.attachedGpuType === "nvidia-l4", "GPU type mismatch");
assert(report.machineTypeVerification?.attachedGpuCount === 1, "GPU count mismatch");
assert(report.machineTypeVerification?.guestCpus === 4, "vCPU mismatch");
assert(report.machineTypeVerification?.memoryMb === 16384, "Memory mismatch");
assert(report.machineTypeVerification?.officialGpuMemoryGb === 24, "GPU memory mismatch");

for (const zone of [
  "us-central1-a",
  "us-central1-b",
  "us-central1-c",
  "us-east4-a",
  "us-east4-c",
  "us-west1-a",
  "us-west1-b",
  "us-west1-c"
]) {
  assert(report.machineTypeVerification.machineTypeVisibleInCandidateZones?.includes(zone), `Missing machine zone ${zone}`);
  assert(report.machineTypeVerification.acceleratorTypeVisibleInCandidateZones?.includes(zone), `Missing accelerator zone ${zone}`);
}

for (const [region, machineZoneCount, acceleratorZoneCount] of [
  ["us-central1", 3, 3],
  ["us-east4", 2, 2],
  ["us-west1", 3, 3]
]) {
  const quota = report.candidateRegionQuotaVerification?.find((entry) => entry.region === region);
  assert(quota?.machineZoneCount === machineZoneCount, `Machine zone count mismatch for ${region}`);
  assert(quota?.acceleratorZoneCount === acceleratorZoneCount, `Accelerator zone count mismatch for ${region}`);
  assert(quota?.nvidiaL4GpuLimit === 1, `L4 quota limit mismatch for ${region}`);
  assert(quota?.nvidiaL4GpuUsage === 0, `L4 quota usage mismatch for ${region}`);
  assert(quota?.preemptibleNvidiaL4GpuLimit === 1, `preemptible L4 quota limit mismatch for ${region}`);
  assert(quota?.preemptibleNvidiaL4GpuUsage === 0, `preemptible L4 quota usage mismatch for ${region}`);
  assert(quota?.acceptedForOneL4Planning === true, `Region ${region} must be accepted for one-L4 planning`);
}

assert(report.pricingVerification?.pricingSource === "official_google_cloud_accelerator_optimized_pricing_page", "Pricing source mismatch");
assert(report.pricingVerification?.pricingRegionExtracted === "us-central1", "Pricing region mismatch");
assert(report.pricingVerification?.onDemandUsdPerHour === 0.706832276, "On-demand price mismatch");
assert(report.pricingVerification?.maxRuntimeMinutes === 60, "Runtime cap mismatch");
assert(report.pricingVerification?.projectedComputeCostUsdForMaxRuntime === 0.706832276, "Projected cost mismatch");
assert(report.pricingVerification?.placeholderCapUsd === 2, "Placeholder cap mismatch");
assert(report.pricingVerification?.underPlaceholderCap === true, "Price must be under placeholder cap");
assert(report.pricingVerification?.diskNetworkAndStorageCostsIncluded === false, "Disk/network/storage costs must not be included");
assert(report.pricingVerification?.finalPricingRecheckRequiredBeforeExecution === true, "Final pricing recheck must be required");

assert(report.recommendedFutureTarget?.region === "us-central1", "Recommended region mismatch");
assert(report.recommendedFutureTarget?.defaultZoneCandidate === "us-central1-b", "Recommended zone mismatch");
assert(report.recommendedFutureTarget?.machineType === "g2-standard-4", "Recommended machine type mismatch");
assert(report.recommendedFutureTarget?.accelerator === "nvidia-l4", "Recommended accelerator mismatch");
assert(report.recommendedFutureTarget?.planningPriceUsdPerHour === 0.706832276, "Planning price mismatch");
assert(report.recommendedFutureTarget?.placeholderCapUsd === 2, "Target cap mismatch");
assert(report.recommendedFutureTarget?.executionApprovedNow === false, "Execution must not be approved now");

for (const blocker of [
  "boot_image_and_driver_strategy",
  "service_account_and_no_secret_policy",
  "private_model_cache_transfer_plan",
  "private_output_directory_and_cleanup_plan",
  "disk_size_and_cost_cap",
  "network_and_storage_transfer_cost_cap",
  "vm_creation_command_text",
  "cleanup_command_text",
  "proof_runner_command_text",
  "final_owner_acceptance_for_exact_future_commands"
]) {
  assert(report.blockedUntilFutureGate?.includes(blocker), `Missing future blocker ${blocker}`);
}

assert(report.runtimeFlags?.computeEngineApiEnabled === true, "Compute API enabled flag must be true");
ensureFlagsClosed(report.runtimeFlags, "AI-VIDEO-BROLL-GEN-9G report");
assert(report.nextPrompt === EXPECTED_NEXT_PROMPT, "Report next prompt mismatch");

assert(changeLog.computeEngineApiAlreadyEnabled === true, "Compute API already enabled must be recorded");
assert(changeLog.additionalGcpApiEnabled === false, "Additional API must not be enabled");
assert(changeLog.quotaRequestCreated === false, "Quota request must not be created");
assert(changeLog.cloudResourcesCreated === false, "Cloud resources must not be created");
assert(changeLog.dockerCommandsRun === false, "Docker commands must not run");
assert(changeLog.modelInferenceRun === false, "Model inference must not run");
assert(changeLog.generatedFramesCreated === false, "Generated frames must not be created");
assert(changeLog.generatedVideoCreated === false, "Generated video must not be created");
assert(changeLog.nextPrompt === EXPECTED_NEXT_PROMPT, "Change log next prompt mismatch");

const nextPromptText = read("docs/implementation-prompts/prompt-ai-video-broll-gen-9h-private-proof-execution-plan.md");
assert(nextPromptText.includes("AI-VIDEO-BROLL-GEN-9H Private Proof Execution Plan Prompt"), "Missing Gate 9H prompt title");
assert(nextPromptText.includes("no-execution private proof execution plan"), "Gate 9H prompt must be no-execution");
assert(nextPromptText.includes("g2-standard-4"), "Gate 9H prompt must carry selected machine type");
assert(nextPromptText.includes("us-central1-b"), "Gate 9H prompt must carry selected zone");
assert(nextPromptText.includes("Forbidden in that future prompt"), "Gate 9H prompt must list forbidden actions");
assert(nextPromptText.includes("generated_local_fixture_passed"), "Gate 9H prompt must block generated local fixture claims");

ensureSafeText([
  "docs/ai-video-broll-generation-gcp-l4-quota-cost-verification-report.md",
  "docs/ai-video-broll-generation-gcp-l4-quota-cost-verification-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9h-private-proof-execution-plan.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  activeProject: "reeditpro",
  computeApiEnabled: true,
  machineType: report.machineTypeVerification.machineType,
  accelerator: report.machineTypeVerification.attachedGpuType,
  candidateQuota: report.candidateRegionQuotaVerification,
  pricingSource: report.pricingVerification.pricingSource,
  onDemandUsdPerHour: report.pricingVerification.onDemandUsdPerHour,
  projectedComputeCostUsdForMaxRuntime: report.pricingVerification.projectedComputeCostUsdForMaxRuntime,
  placeholderCapUsd: report.pricingVerification.placeholderCapUsd,
  underPlaceholderCap: report.pricingVerification.underPlaceholderCap,
  recommendedFutureTarget: report.recommendedFutureTarget,
  additionalApiEnabledByThisGate: false,
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
