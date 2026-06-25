#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const EXPECTED_DECISION =
  "ai_video_broll_gen_9j_controlled_l4_private_proof_blocked_service_account_private_admin_path_ready_for_gcp_identity_approval";
const EXPECTED_NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-9J-FIX: proof service account and private admin path approval, no VM/no inference";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-gcp-controlled-l4-private-proof-result.md",
  "docs/ai-video-broll-generation-gcp-controlled-l4-private-proof-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-fix-proof-service-account.md",
  "scripts/validation/ai-video-broll-gen-9j-diagnostics.mjs",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-controlled-l4-private-proof.md",
  "docs/ai-video-broll-generation-gcp-private-proof-owner-execution-approval.md",
  "docs/ai-video-broll-generation-gcp-private-proof-execution-plan.md",
  "docs/ai-video-broll-generation-gcp-l4-quota-cost-verification-report.md",
  "docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md",
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
  packageJson.scripts?.["ai-video-broll-gen-9j:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-9j-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-9j:diagnostics"
);

const report = parseBlock(
  "docs/ai-video-broll-generation-gcp-controlled-l4-private-proof-result.md",
  "ai-video-broll-gen-9j-controlled-l4-private-proof-result"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-gcp-controlled-l4-private-proof-change-log.md",
  "ai-video-broll-gen-9j-controlled-l4-private-proof-change-log"
);
const gate9i = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-proof-owner-execution-approval.md",
  "ai-video-broll-gen-9i-private-proof-owner-execution-approval"
);
const gate9h = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-proof-execution-plan.md",
  "ai-video-broll-gen-9h-private-proof-execution-plan"
);

assert(report.decision === EXPECTED_DECISION, "Unexpected AI-VIDEO-BROLL-GEN-9J decision");
assert(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
assert(report.sourceCommit === "3db1e3d1", "Gate 9J source commit must be Gate 9I commit");
assert(
  gate9i.decision === "ai_video_broll_gen_9i_private_proof_owner_execution_approval_completed_ready_for_controlled_l4_private_proof",
  "Gate 9I source decision mismatch"
);
assert(
  gate9h.futureCommandPlan?.leastPrivilegeServiceAccountRequired === true,
  "Gate 9H must require least privilege service account"
);

assert(report.selectedTarget?.project === "reeditpro", "Project mismatch");
assert(report.selectedTarget?.region === "us-central1", "Region mismatch");
assert(report.selectedTarget?.zone === "us-central1-b", "Zone mismatch");
assert(report.selectedTarget?.machineType === "g2-standard-4", "Machine type mismatch");
assert(report.selectedTarget?.accelerator === "nvidia-l4", "Accelerator mismatch");
assert(report.selectedTarget?.acceleratorCount === 1, "Accelerator count mismatch");
assert(report.selectedTarget?.modelId === "Wan-AI/Wan2.1-T2V-1.3B", "Model id mismatch");
assert(report.selectedTarget?.modelRevision === "37ec512624d61f7aa208f7ea8140a131f93afc9a", "Model revision mismatch");
assert(report.selectedTarget?.fixture === "non_user_media_tabletop_fixture", "Fixture mismatch");
assert(report.selectedTarget?.placeholderCapUsd === 2, "Placeholder cap mismatch");

for (const flag of [
  "repoCleanBeforeEdits",
  "activeProjectReeditpro",
  "computeApiEnabled",
  "machineTypeVisible",
  "acceleratorVisible",
  "privateCacheExists",
  "privateCacheChecksumMatchesManifest",
  "fixtureIsNonUserMedia"
]) {
  assert(report.safePreflight?.[flag] === true, `Safe preflight must pass ${flag}`);
}
assert(report.safePreflight?.nvidiaL4QuotaLimit === 1, "L4 quota limit mismatch");
assert(report.safePreflight?.nvidiaL4QuotaUsage === 0, "L4 quota usage mismatch");
assert(report.safePreflight?.privateCacheFileCount === 10, "Private cache file count mismatch");
assert(report.safePreflight?.privateCacheByteTotal === 17567424122, "Private cache byte total mismatch");

for (const flag of [
  "concreteProofServiceAccountApproved",
  "privateAdminPathApproved",
  "noPublicIpPathExecutableNow",
  "cleanupGuaranteeAccepted",
  "diskTransferCleanupCostFullyBounded"
]) {
  assert(report.blockedPreflight?.[flag] === false, `Blocked preflight must keep ${flag} false`);
}
assert(
  report.blockedPreflight?.proofServiceAccountSource === "AI_VIDEO_BROLL_PROOF_SERVICE_ACCOUNT_EMAIL_PLACEHOLDER",
  "Proof service account placeholder must be recorded"
);

assert(report.executionOutcome?.controlledL4PrivateProofAttempted === false, "Proof must not be attempted");
assert(report.executionOutcome?.controlledL4PrivateProofPassed === false, "Proof must not pass");
assert(report.executionOutcome?.blockedBeforeVmCreate === true, "Proof must block before VM create");
assert(report.executionOutcome?.vmCreated === false, "VM must not be created");
assert(report.executionOutcome?.cleanupNeeded === false, "Cleanup must not be needed");
assert(report.executionOutcome?.modelInferenceRun === false, "Inference must not run");
assert(report.executionOutcome?.generatedFramesCreated === false, "Generated frames must not be created");
assert(report.executionOutcome?.generatedVideoCreated === false, "Generated video must not be created");

ensureFlagsClosed(report.runtimeFlags, "AI-VIDEO-BROLL-GEN-9J report");
assert(report.nextPrompt === EXPECTED_NEXT_PROMPT, "Report next prompt mismatch");

assert(changeLog.safePreflightPartiallyPassed === true, "Change log must record partial preflight pass");
assert(changeLog.controlledL4PrivateProofAttempted === false, "Change log must block proof attempt");
assert(changeLog.blockedBeforeVmCreate === true, "Change log must block before VM");
assert(changeLog.cloudResourcesCreated === false, "Cloud resources must not be created");
assert(changeLog.modelInferenceRun === false, "Model inference must not run");
assert(changeLog.generatedFramesCreated === false, "Generated frames must not be created");
assert(changeLog.generatedVideoCreated === false, "Generated video must not be created");
assert(changeLog.nextPrompt === EXPECTED_NEXT_PROMPT, "Change log next prompt mismatch");

const promptText = read("docs/implementation-prompts/prompt-ai-video-broll-gen-9j-fix-proof-service-account.md");
assert(promptText.includes("Proof Service Account And Private Admin Path Approval"), "Missing next prompt title");
assert(promptText.includes("approval-only"), "Next prompt must be approval-only");
assert(promptText.includes("GCP_CLOUD_RUNTIME"), "Next prompt must include GCP owner");
assert(promptText.includes("COMPLIANCE_SECURITY"), "Next prompt must include security owner");
assert(promptText.includes("no-public-IP"), "Next prompt must require no-public-IP path");
assert(promptText.includes("generated_local_fixture_passed"), "Next prompt must block generated local fixture claims");

ensureSafeText([
  "docs/ai-video-broll-generation-gcp-controlled-l4-private-proof-result.md",
  "docs/ai-video-broll-generation-gcp-controlled-l4-private-proof-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-fix-proof-service-account.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  safePreflight: report.safePreflight,
  blockedPreflight: report.blockedPreflight,
  executionOutcome: report.executionOutcome,
  commandsExecutedByThisGate: false,
  cloudResourcesCreated: false,
  vmCreated: false,
  serviceAccountCreated: false,
  modelInferenceRun: false,
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
