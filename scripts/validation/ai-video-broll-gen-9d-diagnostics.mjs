#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const EXPECTED_DECISION =
  "ai_video_broll_gen_9d_gcp_compute_api_quota_owner_setup_plan_completed_ready_for_owner_approval";
const EXPECTED_NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-9E: GCP Compute API owner approval packet, no resource creation/no inference";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-gcp-compute-api-quota-owner-setup-plan.md",
  "docs/ai-video-broll-generation-gcp-compute-api-quota-setup-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9e-gcp-compute-api-owner-approval.md",
  "scripts/validation/ai-video-broll-gen-9d-diagnostics.mjs",
  "docs/ai-video-broll-generation-gcp-l4-prerequisite-verification-report.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9d-gcp-compute-api-quota-owner-setup-plan.md",
  "docs/ai-video-broll-generation-gcp-l4-private-synthetic-proof-plan.md",
  "docs/ai-video-broll-generation-gcp-l4-cost-quota-preflight-plan.md",
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
  "https://cloud.google.com/service-usage/docs/enable-disable",
  "https://cloud.google.com/docs/quotas/view-manage",
  "https://cloud.google.com/compute/quotas-limits"
];

const UNSAFE_PATTERNS = [
  ["mutating gcloud command", /^\s*(?:\$|>)?\s*gcloud\s+(services\s+enable|compute\s+instances\s+create|compute\s+instances\s+delete|run\s+deploy|run\s+jobs\s+execute|builds\s+submit|artifacts\s+docker\s+images\s+delete)\b/im],
  ["docker execution command", /^\s*(?:\$|>)?\s*docker\s+(build|run|push|compose\s+up|start)\b/im],
  ["runtime execution claim", /\b(pipelineInstantiated|modelFromPretrainedCalled|torchLoadCalled|textEncodingCalled|denoisingStepRun|schedulerRun|vaeDecodeRun|modelInferenceRun|inferenceRun)\b\s*[:=]\s*(true|"true")/i],
  ["generated media claim", /\b(generatedFramesCreated|generatedVideoCreated|mediaArtifactsCreated|cloudResourcesCreated)\b\s*[:=]\s*(true|"true")/i],
  ["cloud mutation claim", /\b(computeEngineApiEnabled|quotaRequestCreated|cloudResourcesCreated|gcpCommandsRun)\b\s*[:=]\s*(true|"true")/i],
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
  packageJson.scripts?.["ai-video-broll-gen-9d:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-9d-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-9d:diagnostics"
);

const plan = parseBlock(
  "docs/ai-video-broll-generation-gcp-compute-api-quota-owner-setup-plan.md",
  "ai-video-broll-gen-9d-gcp-compute-api-quota-owner-setup-plan"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-gcp-compute-api-quota-setup-change-log.md",
  "ai-video-broll-gen-9d-gcp-compute-api-quota-setup-change-log"
);
const gate9c = parseBlock(
  "docs/ai-video-broll-generation-gcp-l4-prerequisite-verification-report.md",
  "ai-video-broll-gen-9c-gcp-l4-prerequisite-verification-report"
);

assert(plan.decision === EXPECTED_DECISION, "Unexpected AI-VIDEO-BROLL-GEN-9D decision");
assert(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
assert(plan.sourceCommit === "a2ce3b6c", "Gate 9D source commit must be Gate 9C commit");
assert(gate9c.decision === "ai_video_broll_gen_9c_gcp_l4_prerequisite_verification_blocked_compute_api_disabled_ready_for_gcp_compute_api_quota_owner_setup_plan", "Gate 9C source decision mismatch");
assert(plan.blockedPrerequisite?.computeEngineApiStatus === "service_disabled", "Compute API blocker must be preserved");
assert(plan.blockedPrerequisite?.l4QuotaVerified === false, "L4 quota must remain unverified");
assert(plan.ownerSetupPlan?.workstreamOwner === "GCP_CLOUD_RUNTIME", "GCP owner must own setup");
assert(plan.ownerSetupPlan?.requestingWorkstream === "AI_VIDEO_BROLL_GENERATION", "Requesting workstream mismatch");
assert(plan.ownerSetupPlan?.setupMode === "owner_setup_plan_only", "Setup mode mismatch");
assert(plan.ownerSetupPlan?.computeApiEnablementApprovedNow === false, "Compute API enablement must not be approved now");
assert(plan.ownerSetupPlan?.quotaRequestApprovedNow === false, "Quota request must not be approved now");
assert(plan.ownerSetupPlan?.resourceCreationApprovedNow === false, "Resource creation must not be approved now");
assert(plan.ownerSetupPlan?.proofExecutionApprovedNow === false, "Proof execution must not be approved now");
assert(plan.ownerSetupPlan?.requiresHumanReviewedCommandPlan === true, "Human-reviewed command plan must be required");
assert(plan.projectDecision?.observedActiveProject === "reeditpro", "Observed project mismatch");
assert(plan.projectDecision?.acceptedAsNonProductionProofProject === "pending_owner_decision", "Project acceptance must remain pending");
assert(plan.projectDecision?.productionOrCustomerDataAllowed === false, "Production/customer data must be blocked");
assert(plan.projectDecision?.userMediaAllowed === false, "User media must be blocked");
for (const requirement of [
  "project_identity_and_scope",
  "compute_engine_api_enablement_plan",
  "l4_quota_readiness_plan",
  "budget_guard",
  "no_public_endpoint_policy",
  "private_cache_transfer_policy",
  "cleanup_evidence",
  "no_user_media_no_provider_fallback"
]) {
  assert(plan.requiredOwnerAcceptance?.includes(requirement), `Missing owner acceptance ${requirement}`);
}
for (const region of ["us-central1", "us-east4", "us-west1"]) {
  assert(
    plan.candidateRegions?.some((entry) => entry.region === region && entry.status === "requires_compute_api_enabled_then_l4_quota_check"),
    `Missing candidate region ${region}`
  );
}
assert(plan.costGuard?.maxFirstProofRuntimeMinutes === 60, "Runtime cap mismatch");
assert(plan.costGuard?.maxFirstProofCostUsdPlaceholder === 2, "Cost cap mismatch");
assert(plan.costGuard?.freshOfficialPricingRequiredBeforeExecution === true, "Fresh pricing must be required");
assert(plan.costGuard?.billingApprovalCreated === false, "Billing approval must not be created");
assert(plan.futureAllowedOnlyAfterOwnerApproval?.includes("compute_engine_api_enablement_for_accepted_non_production_project"), "Future API enablement allowance missing");
assert(plan.futureAllowedOnlyAfterOwnerApproval?.includes("read_only_l4_quota_region_check"), "Future quota verification allowance missing");
ensureFlagsClosed(plan.runtimeFlags, "AI-VIDEO-BROLL-GEN-9D plan");
assert(plan.nextPrompt === EXPECTED_NEXT_PROMPT, "Plan next prompt mismatch");

assert(changeLog.packageLockChanged === false, "package-lock must remain unchanged");
assert(changeLog.gcpCommandsRun === false, "GCP commands must not run");
assert(changeLog.computeEngineApiEnabled === false, "Compute API must not be enabled");
assert(changeLog.quotaRequestCreated === false, "Quota request must not be created");
assert(changeLog.cloudResourcesCreated === false, "Cloud resources must not be created");
assert(changeLog.modelInferenceRun === false, "Model inference must not run");
assert(changeLog.generatedFramesCreated === false, "Generated frames must not be created");
assert(changeLog.generatedVideoCreated === false, "Generated video must not be created");
assert(changeLog.nextPrompt === EXPECTED_NEXT_PROMPT, "Change log next prompt mismatch");

const nextPromptText = read("docs/implementation-prompts/prompt-ai-video-broll-gen-9e-gcp-compute-api-owner-approval.md");
assert(nextPromptText.includes("AI-VIDEO-BROLL-GEN-9E GCP Compute API Owner Approval Packet Prompt"), "Missing Gate 9E prompt title");
assert(nextPromptText.includes("whether `reeditpro` is accepted"), "Gate 9E prompt must decide project acceptance");
assert(nextPromptText.includes("whether a later prompt may enable Compute Engine API"), "Gate 9E prompt must decide API enablement");
assert(nextPromptText.includes("Forbidden in that future prompt"), "Gate 9E prompt must list forbidden actions");
assert(nextPromptText.includes("generated_local_fixture_passed"), "Gate 9E prompt must block generated local fixture claims");

ensureSafeText([
  "docs/ai-video-broll-generation-gcp-compute-api-quota-owner-setup-plan.md",
  "docs/ai-video-broll-generation-gcp-compute-api-quota-setup-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9e-gcp-compute-api-owner-approval.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  blockedPrerequisite: "compute_engine_api_disabled",
  workstreamOwner: "GCP_CLOUD_RUNTIME",
  requestingWorkstream: "AI_VIDEO_BROLL_GENERATION",
  observedActiveProject: "reeditpro",
  projectDecisionPending: true,
  computeApiEnablementApprovedNow: false,
  quotaRequestApprovedNow: false,
  resourceCreationApprovedNow: false,
  proofExecutionApprovedNow: false,
  candidateRegions: plan.candidateRegions.map((entry) => entry.region),
  maxFirstProofRuntimeMinutes: 60,
  maxFirstProofCostUsdPlaceholder: 2,
  gcpCommandsRun: false,
  computeEngineApiEnabled: false,
  quotaRequestCreated: false,
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
