#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const EXPECTED_DECISION =
  "ai_video_broll_gen_9h_private_proof_execution_plan_completed_ready_for_owner_execution_approval";
const EXPECTED_NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-9I: private proof owner execution approval, no VM/no inference";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-gcp-private-proof-execution-plan.md",
  "docs/ai-video-broll-generation-gcp-private-proof-execution-plan-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9i-private-proof-owner-execution-approval.md",
  "scripts/validation/ai-video-broll-gen-9h-diagnostics.mjs",
  "docs/ai-video-broll-generation-gcp-l4-quota-cost-verification-report.md",
  "docs/ai-video-broll-generation-gcp-l4-quota-cost-verification-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9h-private-proof-execution-plan.md",
  "docs/activation-gcp-staging-command-policy.md",
  "package.json"
];

const RUNTIME_FLAGS_FALSE = [
  "commandsExecutedByThisGate",
  "computeEngineApiEnabledByThisGate",
  "additionalApiEnabledByThisGate",
  "quotaRequestCreated",
  "quotaIncreaseRequested",
  "vmCreated",
  "diskCreated",
  "serviceAccountCreated",
  "networkCreated",
  "firewallRuleCreated",
  "iapSettingChanged",
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

const REQUIRED_OWNERS = [
  "AI_VIDEO_BROLL_GENERATION",
  "GCP_CLOUD_RUNTIME",
  "WORKER_RUNTIME_JOBS",
  "SUPABASE_RLS_STORAGE_DATABASE",
  "BILLING_STRIPE_CREDITS",
  "OBSERVABILITY_AUDIT_COST",
  "TRACK_A_RENDER_EXPORT",
  "TRACK_B_MEDIA_PROCESSING"
];

const UNSAFE_PATTERNS = [
  ["actual command execution marker", /\b(commandsExecutedByThisGate|cloudResourcesCreated|dockerCommandsRun|modelInferenceRun|generatedFramesCreated|generatedVideoCreated|mediaArtifactsCreated)\b\s*[:=]\s*(true|"true")/i],
  ["runtime execution claim", /\b(pipelineInstantiated|modelFromPretrainedCalled|torchLoadCalled|textEncodingCalled|denoisingStepRun|schedulerRun|vaeDecodeRun|modelInferenceRun|inferenceRun)\b\s*[:=]\s*(true|"true")/i],
  ["runtime flag claim", /\b(commandsExecutedByThisGate|computeEngineApiEnabledByThisGate|additionalApiEnabledByThisGate|quotaRequestCreated|quotaIncreaseRequested|vmCreated|diskCreated|serviceAccountCreated|networkCreated|firewallRuleCreated|iapSettingChanged|bucketCreated|artifactRegistryImageCreated|reservationCreated|cloudRunJobCreated|dockerCommandRun|dependencyInstallAllowed|modelWeightDownloadAllowed|dependencyModuleImportAllowed|modelLoaderMetadataInspectionAllowed|pipelineInstantiationAllowed|modelFromPretrainedAllowed|torchLoadAllowed|textEncodingAllowed|denoisingStepAllowed|schedulerRunAllowed|vaeEncodeDecodeAllowed|modelInferenceAllowed|generatedFramesAllowed|generatedVideoAllowed|mediaProcessingAllowed|ffmpegAllowed|providerCallsAllowed|workerExecutionAllowed|routeExecutionAllowed|supabaseMutationAllowed|sqlAllowed|storageUploadAllowed|signedUrlCreationAllowed|publicArtifactCreationAllowed|creditMutationAllowed|dryRunPassedClaimed|generatedLocalFixturePassedClaimed|runtimeReadinessClaimed|betaProductionUnlockClaimed)\b\s*[:=]\s*(true|"true")/i],
  ["generated local fixture wording claim", /\bgenerated_local_fixture_passed\s+(claimed|true|passed)/i],
  ["dry run wording claim", /\bdry_run_passed\s+(claimed|true|passed)/i],
  ["signed URL query", /\b(X-Amz-Signature|X-Amz-Credential|Expires=|Signature=|Policy=|Key-Pair-Id=)/],
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
  packageJson.scripts?.["ai-video-broll-gen-9h:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-9h-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-9h:diagnostics"
);

const report = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-proof-execution-plan.md",
  "ai-video-broll-gen-9h-private-proof-execution-plan"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-proof-execution-plan-change-log.md",
  "ai-video-broll-gen-9h-private-proof-execution-plan-change-log"
);
const gate9g = parseBlock(
  "docs/ai-video-broll-generation-gcp-l4-quota-cost-verification-report.md",
  "ai-video-broll-gen-9g-l4-quota-cost-verification-report"
);

assert(report.decision === EXPECTED_DECISION, "Unexpected AI-VIDEO-BROLL-GEN-9H decision");
assert(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
assert(report.sourceCommit === "feaf01ed", "Gate 9H source commit must be Gate 9G commit");
assert(
  gate9g.decision === "ai_video_broll_gen_9g_l4_quota_cost_verification_completed_ready_for_private_proof_execution_plan",
  "Gate 9G source decision mismatch"
);

assert(report.selectedFutureTarget?.project === "reeditpro", "Project mismatch");
assert(report.selectedFutureTarget?.region === "us-central1", "Region mismatch");
assert(report.selectedFutureTarget?.zone === "us-central1-b", "Zone mismatch");
assert(report.selectedFutureTarget?.machineType === "g2-standard-4", "Machine type mismatch");
assert(report.selectedFutureTarget?.accelerator === "nvidia-l4", "Accelerator mismatch");
assert(report.selectedFutureTarget?.acceleratorCount === 1, "Accelerator count mismatch");
assert(report.selectedFutureTarget?.planningPriceUsdPerHour === 0.706832276, "Planning price mismatch");
assert(report.selectedFutureTarget?.maxRuntimeMinutes === 60, "Runtime cap mismatch");
assert(report.selectedFutureTarget?.placeholderCapUsd === 2, "Placeholder cap mismatch");
assert(report.selectedFutureTarget?.modelId === "Wan-AI/Wan2.1-T2V-1.3B", "Model id mismatch");
assert(report.selectedFutureTarget?.modelRevision === "37ec512624d61f7aa208f7ea8140a131f93afc9a", "Model revision mismatch");
assert(report.selectedFutureTarget?.executionApprovedNow === false, "Execution must not be approved now");

assert(report.futureCommandPlan?.commandsAreFutureOnly === true, "Commands must be future-only");
assert(report.futureCommandPlan?.commandsExecutedByThisGate === false, "Commands must not be executed");
assert(report.futureCommandPlan?.requiresOwnerExecutionApproval === true, "Owner approval must be required");
assert(report.futureCommandPlan?.vmCreateCommandDefined === true, "VM create command shape must be defined");
assert(report.futureCommandPlan?.privateCacheTransferCommandDefined === true, "Private cache transfer command shape must be defined");
assert(report.futureCommandPlan?.proofRunnerCommandDefined === true, "Proof runner command shape must be defined");
assert(report.futureCommandPlan?.cleanupCommandsDefined === true, "Cleanup command shape must be defined");
assert(report.futureCommandPlan?.noPublicIpRequired === true, "No-public-IP requirement missing");
assert(report.futureCommandPlan?.iapOrPrivateAdminPathRequired === true, "Private admin path requirement missing");
assert(report.futureCommandPlan?.leastPrivilegeServiceAccountRequired === true, "Least privilege service account missing");
assert(report.futureCommandPlan?.secretValuesIncluded === false, "Secret values must not be included");
for (const command of [
  "gcloud config get-value project",
  "gcloud services list --enabled --project=reeditpro --filter='config.name=compute.googleapis.com' --format='value(config.name)'",
  "gcloud compute machine-types describe g2-standard-4 --project=reeditpro --zone=us-central1-b --format=json",
  "gcloud compute accelerator-types describe nvidia-l4 --project=reeditpro --zone=us-central1-b --format=json",
  "gcloud compute regions describe us-central1 --project=reeditpro --format=json"
]) {
  assert(report.futureCommandPlan.preflightCommands?.includes(command), `Missing preflight command: ${command}`);
}

assert(report.costGuard?.verifiedComputeUsdPerHour === 0.706832276, "Cost guard price mismatch");
assert(report.costGuard?.maxRuntimeMinutes === 60, "Cost guard runtime mismatch");
assert(report.costGuard?.computeOnlyProjectedCostUsd === 0.706832276, "Cost guard projected cost mismatch");
assert(report.costGuard?.placeholderCapUsd === 2, "Cost guard cap mismatch");
assert(report.costGuard?.diskCostBoundedNow === false, "Disk cost must remain future-gated");
assert(report.costGuard?.networkTransferCostBoundedNow === false, "Network cost must remain future-gated");
assert(report.costGuard?.storageCostBoundedNow === false, "Storage cost must remain future-gated");
assert(report.costGuard?.finalOfficialPricingRecheckRequired === true, "Final pricing recheck must be required");
assert(report.costGuard?.executeOnlyIfTotalBoundedCostUnderCap === true, "Total bounded cost must be under cap");
assert(report.costGuard?.creditMutationAllowed === false, "Credit mutation must be blocked");

assert(report.transferPolicy?.privateCacheTransferPlanned === true, "Private cache transfer must be planned");
assert(report.transferPolicy?.publicBucketAllowed === false, "Public buckets must be blocked");
assert(report.transferPolicy?.signedUrlAllowed === false, "Signed URLs must be blocked");
assert(report.transferPolicy?.runtimeAutoDownloadAllowed === false, "Runtime auto-download must be blocked");
assert(report.transferPolicy?.repoTrackedWeightsAllowed === false, "Repo-tracked weights must be blocked");
assert(report.transferPolicy?.checksumVerificationRequired === true, "Checksum verification must be required");
assert(report.transferPolicy?.cleanupRequired === true, "Cleanup must be required");
assert(report.transferPolicy?.storageUploadAllowed === false, "Storage upload must be blocked");

for (const owner of REQUIRED_OWNERS) {
  const entry = report.ownerAcceptanceChecklist?.find((item) => item.owner === owner);
  assert(entry?.status === "pending_owner_execution_approval", `Owner ${owner} must remain pending`);
}

ensureFlagsClosed(report.runtimeFlags, "AI-VIDEO-BROLL-GEN-9H report");
assert(report.nextPrompt === EXPECTED_NEXT_PROMPT, "Report next prompt mismatch");

assert(changeLog.futureCommandTextDefined === true, "Future command text must be defined");
assert(changeLog.commandsExecutedByThisGate === false, "Commands must not execute");
assert(changeLog.quotaRequestCreated === false, "Quota request must not be created");
assert(changeLog.cloudResourcesCreated === false, "Cloud resources must not be created");
assert(changeLog.dockerCommandsRun === false, "Docker commands must not run");
assert(changeLog.modelInferenceRun === false, "Model inference must not run");
assert(changeLog.generatedFramesCreated === false, "Generated frames must not be created");
assert(changeLog.generatedVideoCreated === false, "Generated video must not be created");
assert(changeLog.nextPrompt === EXPECTED_NEXT_PROMPT, "Change log next prompt mismatch");

const nextPromptText = read("docs/implementation-prompts/prompt-ai-video-broll-gen-9i-private-proof-owner-execution-approval.md");
assert(nextPromptText.includes("AI-VIDEO-BROLL-GEN-9I Private Proof Owner Execution Approval Prompt"), "Missing Gate 9I prompt title");
assert(nextPromptText.includes("no VM/no inference"), "Gate 9I prompt must stay no-execution");
for (const owner of REQUIRED_OWNERS) {
  assert(nextPromptText.includes(owner), `Gate 9I prompt must include owner ${owner}`);
}
assert(nextPromptText.includes("generated_local_fixture_passed"), "Gate 9I prompt must block generated local fixture claims");

const reportText = read("docs/ai-video-broll-generation-gcp-private-proof-execution-plan.md");
for (const expectedText of [
  "FUTURE ONLY - DO NOT RUN IN 9H",
  "gcloud compute instances create",
  "--no-address",
  "--tunnel-through-iap",
  "PRIVATE_WAN_1_3B_CACHE_PATH_PLACEHOLDER",
  "AI_VIDEO_BROLL_PROOF_RUNNER_PLACEHOLDER",
  "gcloud compute instances delete",
  "No-Scope Statement"
]) {
  assert(reportText.includes(expectedText), `Missing planned text: ${expectedText}`);
}

ensureSafeText([
  "docs/ai-video-broll-generation-gcp-private-proof-execution-plan.md",
  "docs/ai-video-broll-generation-gcp-private-proof-execution-plan-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9i-private-proof-owner-execution-approval.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  selectedFutureTarget: report.selectedFutureTarget,
  futureCommandTextDefined: true,
  commandsExecutedByThisGate: false,
  ownerAcceptanceChecklist: report.ownerAcceptanceChecklist,
  costGuard: report.costGuard,
  transferPolicy: report.transferPolicy,
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
