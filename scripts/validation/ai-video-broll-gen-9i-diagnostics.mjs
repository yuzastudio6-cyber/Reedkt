#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const EXPECTED_DECISION =
  "ai_video_broll_gen_9i_private_proof_owner_execution_approval_completed_ready_for_controlled_l4_private_proof";
const EXPECTED_NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-9J: controlled L4 private proof execution, bounded VM/non-user fixture";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-gcp-private-proof-owner-execution-approval.md",
  "docs/ai-video-broll-generation-gcp-private-proof-owner-execution-approval-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-controlled-l4-private-proof.md",
  "scripts/validation/ai-video-broll-gen-9i-diagnostics.mjs",
  "docs/ai-video-broll-generation-gcp-private-proof-execution-plan.md",
  "docs/ai-video-broll-generation-gcp-private-proof-execution-plan-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9i-private-proof-owner-execution-approval.md",
  "docs/cross-chat-tool-ownership-registry.md",
  "package.json"
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
  packageJson.scripts?.["ai-video-broll-gen-9i:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-9i-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-9i:diagnostics"
);

const report = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-proof-owner-execution-approval.md",
  "ai-video-broll-gen-9i-private-proof-owner-execution-approval"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-proof-owner-execution-approval-change-log.md",
  "ai-video-broll-gen-9i-private-proof-owner-execution-approval-change-log"
);
const gate9h = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-proof-execution-plan.md",
  "ai-video-broll-gen-9h-private-proof-execution-plan"
);

assert(report.decision === EXPECTED_DECISION, "Unexpected AI-VIDEO-BROLL-GEN-9I decision");
assert(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
assert(report.sourceCommit === "ecf78a7f", "Gate 9I source commit must be Gate 9H commit");
assert(
  gate9h.decision === "ai_video_broll_gen_9h_private_proof_execution_plan_completed_ready_for_owner_execution_approval",
  "Gate 9H source decision mismatch"
);

const boundary = report.approvedFutureBoundary;
assert(boundary?.nextPrompt === EXPECTED_NEXT_PROMPT, "Approved future prompt mismatch");
assert(boundary?.futureControlledL4PrivateProofPromptApproved === true, "Future controlled proof prompt must be approved");
assert(boundary?.executionApprovedInsideThisGate === false, "Execution must not be approved inside 9I");
assert(boundary?.project === "reeditpro", "Project mismatch");
assert(boundary?.region === "us-central1", "Region mismatch");
assert(boundary?.zone === "us-central1-b", "Zone mismatch");
assert(boundary?.machineType === "g2-standard-4", "Machine type mismatch");
assert(boundary?.accelerator === "nvidia-l4", "Accelerator mismatch");
assert(boundary?.acceleratorCount === 1, "Accelerator count mismatch");
assert(boundary?.modelId === "Wan-AI/Wan2.1-T2V-1.3B", "Model id mismatch");
assert(boundary?.modelRevision === "37ec512624d61f7aa208f7ea8140a131f93afc9a", "Model revision mismatch");
assert(boundary?.fixture === "non_user_media_tabletop_fixture", "Fixture mismatch");
assert(boundary?.maxRuntimeMinutes === 60, "Runtime cap mismatch");
assert(boundary?.computePlanningPriceUsdPerHour === 0.706832276, "Planning price mismatch");
assert(boundary?.placeholderCapUsd === 2, "Placeholder cap mismatch");
assert(boundary?.finalCostRecheckRequired === true, "Final cost recheck must be required");
for (const flag of [
  "publicEndpointAllowed",
  "publicIpAllowed",
  "storageUploadAllowed",
  "signedUrlAllowed",
  "publicArtifactAllowed",
  "supabaseMutationAllowed",
  "workerDispatchAllowed",
  "providerCallAllowed",
  "userMediaAllowed",
  "betaProductionUnlockAllowed"
]) {
  assert(boundary?.[flag] === false, `Boundary must keep ${flag} false`);
}

for (const owner of REQUIRED_OWNERS) {
  const entry = report.ownerDecisions?.find((item) => item.owner === owner);
  assert(entry?.decision === "approved_for_future_controlled_private_proof_prompt", `Owner ${owner} must approve future controlled prompt`);
  assert(entry?.executionAllowedInsideThisGate === false, `Owner ${owner} must not allow execution inside 9I`);
}

for (const requirement of [
  "clean_branch_state",
  "active_project_reeditpro",
  "compute_api_enabled",
  "g2_standard_4_visible_in_selected_zone",
  "nvidia_l4_visible_in_selected_zone",
  "nvidia_l4_quota_limit_at_least_one_usage_zero",
  "final_official_compute_pricing_under_cap",
  "disk_transfer_cleanup_cost_bounds_under_cap",
  "private_model_cache_checksum_matches_manifest",
  "fixture_is_non_user_media",
  "no_public_ip_or_public_endpoint",
  "no_public_bucket_signed_url_supabase_provider_worker_or_credit_mutation"
]) {
  assert(report.requiredFinalPreflight?.includes(requirement), `Missing final preflight requirement ${requirement}`);
}

ensureFlagsClosed(report.runtimeFlags, "AI-VIDEO-BROLL-GEN-9I report");
assert(report.nextPrompt === EXPECTED_NEXT_PROMPT, "Report next prompt mismatch");

assert(changeLog.futureControlledL4PrivateProofPromptApproved === true, "Change log must approve future controlled proof prompt");
assert(changeLog.executionApprovedInsideThisGate === false, "Change log must block execution inside 9I");
assert(changeLog.commandsExecutedByThisGate === false, "Commands must not execute");
assert(changeLog.quotaRequestCreated === false, "Quota request must not be created");
assert(changeLog.cloudResourcesCreated === false, "Cloud resources must not be created");
assert(changeLog.dockerCommandsRun === false, "Docker commands must not run");
assert(changeLog.modelInferenceRun === false, "Model inference must not run");
assert(changeLog.generatedFramesCreated === false, "Generated frames must not be created");
assert(changeLog.generatedVideoCreated === false, "Generated video must not be created");
assert(changeLog.nextPrompt === EXPECTED_NEXT_PROMPT, "Change log next prompt mismatch");

const nextPromptText = read("docs/implementation-prompts/prompt-ai-video-broll-gen-9j-controlled-l4-private-proof.md");
assert(nextPromptText.includes("AI-VIDEO-BROLL-GEN-9J Controlled L4 Private Proof Prompt"), "Missing Gate 9J prompt title");
assert(nextPromptText.includes("only if every final preflight"), "Gate 9J prompt must require final preflight");
assert(nextPromptText.includes("non-user-media"), "Gate 9J prompt must restrict fixture");
assert(nextPromptText.includes("Forbidden even in that future prompt"), "Gate 9J prompt must list forbidden actions");
assert(nextPromptText.includes("generated_local_fixture_passed"), "Gate 9J prompt must block generated local fixture claims");

ensureSafeText([
  "docs/ai-video-broll-generation-gcp-private-proof-owner-execution-approval.md",
  "docs/ai-video-broll-generation-gcp-private-proof-owner-execution-approval-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-controlled-l4-private-proof.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  approvedFutureBoundary: report.approvedFutureBoundary,
  ownerDecisions: report.ownerDecisions,
  requiredFinalPreflight: report.requiredFinalPreflight,
  futureControlledL4PrivateProofPromptApproved: true,
  executionApprovedInsideThisGate: false,
  commandsExecutedByThisGate: false,
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
