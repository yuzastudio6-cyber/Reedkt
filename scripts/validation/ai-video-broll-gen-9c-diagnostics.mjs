#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const EXPECTED_DECISION =
  "ai_video_broll_gen_9c_gcp_l4_prerequisite_verification_blocked_compute_api_disabled_ready_for_gcp_compute_api_quota_owner_setup_plan";
const EXPECTED_NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-9D: GCP Compute API and L4 quota owner setup plan, no resource creation/no inference";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-gcp-l4-prerequisite-verification-report.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9d-gcp-compute-api-quota-owner-setup-plan.md",
  "docs/ai-video-broll-generation-gcp-l4-private-synthetic-proof-plan.md",
  "docs/ai-video-broll-generation-gcp-l4-cost-quota-preflight-plan.md",
  "docs/ai-video-broll-generation-gcp-l4-private-cache-transfer-policy.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9c-gcp-l4-prerequisite-verification.md",
  "docs/ai-video-broll-generation-runtime-memory-owner-review.md",
  "docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md",
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

const SAFE_PUBLIC_URLS = [
  "https://cloud.google.com/compute/docs/gpus",
  "https://cloud.google.com/compute/gpus-pricing",
  "https://cloud.google.com/run/docs/configuring/services/gpu",
  "https://cloud.google.com/run/pricing"
];

const UNSAFE_PATTERNS = [
  ["mutating gcloud command", /\bgcloud\s+(services\s+enable|compute\s+instances\s+create|compute\s+instances\s+delete|run\s+deploy|run\s+jobs\s+execute|builds\s+submit|artifacts\s+docker\s+images\s+delete)\b/i],
  ["docker execution command", /^\s*(?:\$|>)?\s*docker\s+(build|run|push|compose\s+up|start)\b/im],
  ["runtime execution claim", /\b(pipelineInstantiated|modelFromPretrainedCalled|torchLoadCalled|textEncodingCalled|denoisingStepRun|schedulerRun|vaeDecodeRun|modelInferenceRun|inferenceRun)\b\s*[:=]\s*(true|"true")/i],
  ["generated media claim", /\b(generatedFramesCreated|generatedVideoCreated|mediaArtifactsCreated|cloudResourcesCreated)\b\s*[:=]\s*(true|"true")/i],
  ["runtime flag claim", /\b(dependencyInstallAllowed|modelWeightDownloadAllowed|dependencyModuleImportAllowed|modelLoaderMetadataInspectionAllowed|pipelineInstantiationAllowed|modelFromPretrainedAllowed|torchLoadAllowed|textEncodingAllowed|denoisingStepAllowed|schedulerRunAllowed|vaeEncodeDecodeAllowed|modelInferenceAllowed|generatedFramesAllowed|generatedVideoAllowed|mediaProcessingAllowed|ffmpegAllowed|providerCallsAllowed|workerExecutionAllowed|routeExecutionAllowed|supabaseMutationAllowed|sqlAllowed|dockerCloudRunAllowed|gcpMutationAllowed|cloudResourceCreationAllowed|storageUploadAllowed|signedUrlCreationAllowed|publicArtifactCreationAllowed|creditMutationAllowed|dryRunPassedClaimed|generatedLocalFixturePassedClaimed|runtimeReadinessClaimed|betaProductionUnlockClaimed)\b\s*[:=]\s*(true|"true")/i],
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

function ensureOnlySafePublicUrls(file, text) {
  const urls = [...text.matchAll(/https?:\/\/[^\s`)]+/g)].map((match) => match[0]);
  const unsafe = urls.filter((url) => !SAFE_PUBLIC_URLS.includes(url));
  assert(unsafe.length === 0, `Unexpected public URL in ${file}: ${unsafe.join(", ")}`);
}

function ensureSafeText(files) {
  const findings = [];
  for (const file of files) {
    const text = read(file);
    ensureOnlySafePublicUrls(file, text);
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
  packageJson.scripts?.["ai-video-broll-gen-9c:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-9c-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-9c:diagnostics"
);

const report = parseBlock(
  "docs/ai-video-broll-generation-gcp-l4-prerequisite-verification-report.md",
  "ai-video-broll-gen-9c-gcp-l4-prerequisite-verification-report"
);
const gate9b = parseBlock(
  "docs/ai-video-broll-generation-gcp-l4-private-synthetic-proof-plan.md",
  "ai-video-broll-gen-9b-gcp-l4-private-proof-plan"
);

assert(report.decision === EXPECTED_DECISION, "Unexpected AI-VIDEO-BROLL-GEN-9C decision");
assert(report.sourceCommit === "2c05cfb3", "Gate 9C source commit must be Gate 9B commit");
assert(gate9b.decision === "ai_video_broll_gen_9b_gcp_l4_private_proof_plan_completed_ready_for_prerequisite_verification", "Gate 9B source decision mismatch");
assert(report.selectedFutureTarget?.targetId === "gcp_single_l4_private_proof_plan", "Selected target mismatch");
assert(report.selectedFutureTarget?.accelerator === "nvidia_l4", "Accelerator must be L4");
assert(report.selectedFutureTarget?.acceleratorCount === 1, "Accelerator count must be one");
assert(report.selectedFutureTarget?.executionApprovedNow === false, "Execution must remain blocked");
assert(report.readOnlyVerification?.gcloudInstalled === true, "gcloud must be present");
assert(report.readOnlyVerification?.activeAccountPresent === true, "active account presence must be verified");
assert(report.readOnlyVerification?.activeAccountValueStored === false, "active account value must not be stored");
assert(report.readOnlyVerification?.projectId === "reeditpro", "Project ID must match observed read-only config");
assert(report.gcpPrerequisites?.computeEngineApiStatus === "service_disabled", "Compute API status must be service_disabled");
assert(report.gcpPrerequisites?.computeEngineApiEnabledByThisGate === false, "Gate 9C must not enable Compute API");
assert(report.gcpPrerequisites?.l4AcceleratorTypesVisible === false, "L4 accelerator types must remain unverified");
assert(report.gcpPrerequisites?.l4RegionAvailabilityVerified === false, "L4 region availability must remain unverified");
assert(report.gcpPrerequisites?.l4QuotaVerified === false, "L4 quota must remain unverified");
assert(report.gcpPrerequisites?.candidateRegionsChecked?.length === 3, "Three candidate regions must be represented");
for (const region of ["us-central1", "us-east4", "us-west1"]) {
  assert(
    report.gcpPrerequisites.candidateRegionsChecked.some((entry) => entry.region === region && entry.status === "blocked_compute_engine_api_disabled"),
    `Candidate region ${region} must be blocked by Compute API disabled`
  );
}
assert(report.pricingSourceCheck?.officialPricingSourcesInspected === true, "Pricing sources must be inspected");
assert(report.pricingSourceCheck?.cloudRunL4NoZonalRedundancyUsdPerSecond === 0.0001867, "Cloud Run L4 no-zonal price snapshot mismatch");
assert(report.pricingSourceCheck?.cloudRunL4ZonalRedundancyUsdPerSecond === 0.0002909, "Cloud Run L4 zonal price snapshot mismatch");
assert(report.pricingSourceCheck?.exactComputeG2L4ProofCostVerified === false, "Exact Compute G2 cost must remain unverified");
assert(report.pricingSourceCheck?.costUnderTwoDollarPlaceholderCapVerified === false, "Cost under cap must remain unverified");
assert(report.blockedReason === "compute_engine_api_disabled_for_active_project", "Blocked reason mismatch");
ensureFlagsClosed(report.runtimeFlags, "AI-VIDEO-BROLL-GEN-9C report");
assert(report.nextPrompt === EXPECTED_NEXT_PROMPT, "Report next prompt mismatch");

const nextPromptText = read("docs/implementation-prompts/prompt-ai-video-broll-gen-9d-gcp-compute-api-quota-owner-setup-plan.md");
assert(nextPromptText.includes("AI-VIDEO-BROLL-GEN-9D GCP Compute API And L4 Quota Owner Setup Plan Prompt"), "Missing Gate 9D prompt title");
assert(nextPromptText.includes("Compute Engine API owner acceptance"), "Gate 9D prompt must include Compute API owner acceptance");
assert(nextPromptText.includes("L4 quota request/readiness plan"), "Gate 9D prompt must include L4 quota readiness");
assert(nextPromptText.includes("Forbidden in that future prompt"), "Gate 9D prompt must list forbidden actions");
assert(nextPromptText.includes("generated_local_fixture_passed"), "Gate 9D prompt must block generated local fixture claims");

ensureSafeText([
  "docs/ai-video-broll-generation-gcp-l4-prerequisite-verification-report.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9d-gcp-compute-api-quota-owner-setup-plan.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  selectedTarget: "gcp_single_l4_private_proof_plan",
  accelerator: "nvidia_l4",
  gcloudInstalled: true,
  projectId: "reeditpro",
  activeAccountPresent: true,
  activeAccountValueStored: false,
  computeEngineApiStatus: "service_disabled",
  l4RegionAvailabilityVerified: false,
  l4QuotaVerified: false,
  exactComputeG2L4ProofCostVerified: false,
  cloudRunL4NoZonalRedundancyUsdPerSecond: 0.0001867,
  cloudRunL4ZonalRedundancyUsdPerSecond: 0.0002909,
  computeEngineApiEnabledByThisGate: false,
  gcpMutationAllowed: false,
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
