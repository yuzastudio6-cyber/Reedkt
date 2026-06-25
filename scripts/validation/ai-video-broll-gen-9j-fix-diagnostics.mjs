#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const EXPECTED_DECISION =
  "ai_video_broll_gen_9j_fix_proof_service_account_private_admin_approval_blocked_existing_identity_ready_for_proof_identity_setup";
const EXPECTED_NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-9J-FIX-SETUP: create proof service account and private admin path, no VM/no inference";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-gcp-proof-service-account-private-admin-approval.md",
  "docs/ai-video-broll-generation-gcp-proof-service-account-private-admin-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-fix-setup-proof-identity.md",
  "scripts/validation/ai-video-broll-gen-9j-fix-diagnostics.mjs",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-fix-proof-service-account.md",
  "docs/ai-video-broll-generation-gcp-controlled-l4-private-proof-result.md",
  "docs/ai-video-broll-generation-gcp-private-proof-owner-execution-approval.md",
  "docs/google-cloud/production-gcp-iam-plan.md",
  "docs/activation-gcp-staging-command-policy.md",
  "package.json"
];

const REQUIRED_RUNTIME_FALSE = [
  "mutatingCommandsExecuted",
  "vmCreated",
  "diskCreated",
  "serviceAccountCreated",
  "iamBindingCreated",
  "networkCreated",
  "firewallRuleCreated",
  "iapSettingChanged",
  "bucketCreated",
  "artifactRegistryImageCreated",
  "reservationCreated",
  "cloudRunJobCreated",
  "dockerCommandRun",
  "dependencyInstallAllowed",
  "modelImportAllowed",
  "pipelineInstantiationAllowed",
  "modelInferenceAllowed",
  "generatedFramesAllowed",
  "generatedVideoAllowed",
  "mediaProcessingAllowed",
  "ffmpegAllowed",
  "providerCallsAllowed",
  "workerExecutionAllowed",
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
  ["email address", /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
  ["actual command execution marker", /\b(cloudResourcesCreated|dockerCommandsRun|modelInferenceRun|generatedFramesCreated|generatedVideoCreated|mediaArtifactsCreated)\b\s*[:=]\s*(true|"true")/i],
  ["runtime execution claim", /\b(pipelineInstantiated|modelFromPretrainedCalled|torchLoadCalled|textEncodingCalled|denoisingStepRun|schedulerRun|vaeDecodeRun|modelInferenceRun|inferenceRun)\b\s*[:=]\s*(true|"true")/i],
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
  ["Google credential env", /\bGOOGLE_APPLICATION_CREDENTIALS\b/]
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
  packageJson.scripts?.["ai-video-broll-gen-9j-fix:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-9j-fix-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-9j-fix:diagnostics"
);

const report = parseBlock(
  "docs/ai-video-broll-generation-gcp-proof-service-account-private-admin-approval.md",
  "ai-video-broll-gen-9j-fix-proof-service-account-private-admin-approval"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-gcp-proof-service-account-private-admin-change-log.md",
  "ai-video-broll-gen-9j-fix-proof-service-account-private-admin-change-log"
);
const gate9j = parseBlock(
  "docs/ai-video-broll-generation-gcp-controlled-l4-private-proof-result.md",
  "ai-video-broll-gen-9j-controlled-l4-private-proof-result"
);

assert(report.decision === EXPECTED_DECISION, "Unexpected AI-VIDEO-BROLL-GEN-9J-FIX decision");
assert(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
assert(report.sourceCommit === "d75408dc", "Gate 9J-FIX source commit must be Gate 9J commit");
assert(
  gate9j.decision ===
    "ai_video_broll_gen_9j_controlled_l4_private_proof_blocked_service_account_private_admin_path_ready_for_gcp_identity_approval",
  "Gate 9J source decision mismatch"
);

const findings = report.readOnlyMetadataFindings;
assert(findings?.serviceAccountInventoryInspected === true, "Service account inventory must be inspected");
assert(findings?.proofOnlyServiceAccountFound === false, "Proof-only service account must not be falsely found");
assert(findings?.aiVideoWorkerIdentityFound === true, "AI-video worker identity evidence missing");
assert(findings?.aiVideoWorkerIdentityAcceptedForProofVm === false, "AI-video worker identity must be rejected for proof VM");
assert(findings?.gpuWorkerIdentityFound === true, "GPU worker identity evidence missing");
assert(findings?.gpuWorkerIdentityAcceptedForProofVm === false, "GPU worker identity must be rejected for proof VM");
assert(findings?.defaultComputeIdentityFound === true, "Default compute identity evidence missing");
assert(findings?.defaultComputeIdentityAcceptedForProofVm === false, "Default compute identity must be rejected for proof VM");
assert(findings?.defaultNetworkFound === true, "Default network evidence missing");
assert(findings?.iapFirewallRuleFound === false, "IAP firewall rule must remain absent");
assert(findings?.existingProofVmFound === false, "Existing proof VM must not be present");

const approval = report.approvalDecision;
assert(approval?.futureProofIdentitySetupShapeApproved === true, "Future proof identity setup shape must be approved");
assert(approval?.controlledL4PrivateProofRetryApprovedNow === false, "Proof retry must remain blocked");
assert(approval?.concreteProofServiceAccountApproved === false, "Concrete proof service account must remain unapproved");
assert(approval?.privateAdminPathApproved === false, "Private admin path must remain unapproved");
assert(approval?.futureProofServiceAccountCreationPathApproved === true, "Future proof service account creation path must be approved");
assert(approval?.futureIapOrEquivalentPrivateAdminPathSetupApproved === true, "Future private admin path setup must be approved");
assert(approval?.reuseDefaultComputeIdentityAllowed === false, "Default compute identity reuse must be blocked");
assert(approval?.reuseWorkerIdentityAllowed === false, "Worker identity reuse must be blocked");
assert(approval?.serviceAccountKeyFileAllowed === false, "Service account key files must be blocked");
assert(approval?.publicIpAllowed === false, "Public IP must be blocked");
assert(approval?.publicSshIngressAllowed === false, "Public SSH ingress must be blocked");

for (const item of [
  "create_or_identify_one_proof_only_service_account",
  "bind_minimal_logging_and_monitoring_roles_only",
  "approve_no_public_ip_private_admin_path",
  "create_or_verify_iap_or_equivalent_private_firewall_rule",
  "record_sanitized_identity_and_admin_path_evidence",
  "rerun_9j_preflight_before_any_vm_create"
]) {
  assert(report.requiredFutureSetup?.includes(item), `Missing required future setup item ${item}`);
}

for (const flag of REQUIRED_RUNTIME_FALSE) {
  assert(report.runtimeFlags?.[flag] === false, `Runtime flag ${flag} must stay false`);
}
assert(report.nextPrompt === EXPECTED_NEXT_PROMPT, "Next prompt mismatch");

assert(changeLog.futureProofIdentitySetupShapeApproved === true, "Change log must approve future setup shape");
assert(changeLog.controlledL4PrivateProofRetryApprovedNow === false, "Change log must keep retry blocked");
assert(changeLog.proofOnlyServiceAccountFound === false, "Change log must not claim proof service account found");
assert(changeLog.privateAdminPathApproved === false, "Change log must not approve private admin path");
assert(changeLog.cloudResourcesCreated === false, "Change log must not create cloud resources");
assert(changeLog.nextPrompt === EXPECTED_NEXT_PROMPT, "Change log next prompt mismatch");

const nextPromptText = read("docs/implementation-prompts/prompt-ai-video-broll-gen-9j-fix-setup-proof-identity.md");
assert(nextPromptText.includes("Create Proof Service Account And Private Admin Path"), "Missing next prompt title");
assert(nextPromptText.includes("must not create a VM or run inference"), "Next prompt must block VM/inference");
assert(nextPromptText.includes("reusing the default compute identity"), "Next prompt must reject default identity reuse");
assert(nextPromptText.includes("existing worker identity"), "Next prompt must reject worker identity reuse");
assert(nextPromptText.includes("generated_local_fixture_passed"), "Next prompt must block generated local fixture claims");

ensureSafeText([
  "docs/ai-video-broll-generation-gcp-proof-service-account-private-admin-approval.md",
  "docs/ai-video-broll-generation-gcp-proof-service-account-private-admin-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-fix-setup-proof-identity.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  readOnlyMetadataFindings: report.readOnlyMetadataFindings,
  approvalDecision: report.approvalDecision,
  runtimeFlags: report.runtimeFlags,
  mutatingCommandsExecuted: false,
  cloudResourcesCreated: false,
  vmCreated: false,
  serviceAccountCreated: false,
  iamBindingCreated: false,
  firewallRuleCreated: false,
  iapSettingChanged: false,
  modelInferenceRun: false,
  generatedFramesCreated: false,
  generatedVideoCreated: false,
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
