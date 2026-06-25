#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const EXPECTED_DECISION =
  "ai_video_broll_gen_9j_fix_setup_proof_identity_completed_ready_for_controlled_l4_private_proof_retry";
const EXPECTED_NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-9J-RETRY: controlled L4 private proof execution with proof identity, bounded VM/non-user fixture";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-gcp-proof-identity-setup-result.md",
  "docs/ai-video-broll-generation-gcp-proof-identity-setup-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-retry-controlled-l4-private-proof.md",
  "scripts/validation/ai-video-broll-gen-9j-fix-setup-diagnostics.mjs",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-fix-setup-proof-identity.md",
  "docs/ai-video-broll-generation-gcp-proof-service-account-private-admin-approval.md",
  "docs/ai-video-broll-generation-gcp-controlled-l4-private-proof-result.md",
  "package.json"
];

const REQUIRED_FALSE_FLAGS = [
  "vmCreated",
  "diskCreated",
  "networkCreated",
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
  packageJson.scripts?.["ai-video-broll-gen-9j-fix-setup:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-9j-fix-setup-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-9j-fix-setup:diagnostics"
);

const report = parseBlock(
  "docs/ai-video-broll-generation-gcp-proof-identity-setup-result.md",
  "ai-video-broll-gen-9j-fix-setup-proof-identity-result"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-gcp-proof-identity-setup-change-log.md",
  "ai-video-broll-gen-9j-fix-setup-proof-identity-change-log"
);
const gate9jFix = parseBlock(
  "docs/ai-video-broll-generation-gcp-proof-service-account-private-admin-approval.md",
  "ai-video-broll-gen-9j-fix-proof-service-account-private-admin-approval"
);

assert(report.decision === EXPECTED_DECISION, "Unexpected AI-VIDEO-BROLL-GEN-9J-FIX-SETUP decision");
assert(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
assert(report.sourceCommit === "5fc8e156", "Gate 9J-FIX-SETUP source commit must be Gate 9J-FIX commit");
assert(
  gate9jFix.decision ===
    "ai_video_broll_gen_9j_fix_proof_service_account_private_admin_approval_blocked_existing_identity_ready_for_proof_identity_setup",
  "Gate 9J-FIX source decision mismatch"
);

const setup = report.setupResult;
assert(setup?.project === "reeditpro", "Project mismatch");
assert(setup?.proofServiceAccountId === "reeditpro-ai-broll-proof-sa", "Proof service account id mismatch");
assert(setup?.proofServiceAccountCreated === true, "Proof service account must be created");
assert(setup?.proofServiceAccountDisabled === false, "Proof service account must not be disabled");
assert(setup?.proofServiceAccountEmailOmitted === true, "Proof service account email must be omitted");
assert(setup?.userManagedServiceAccountKeysCreated === false, "User-managed keys must not be created");
assert(setup?.userManagedServiceAccountKeyCount === 0, "User-managed key count must be zero");
assert(setup?.rolesBound?.length === 2, "Exactly two roles must be bound");
assert(setup.rolesBound.includes("roles/logging.logWriter"), "Missing logging role");
assert(setup.rolesBound.includes("roles/monitoring.metricWriter"), "Missing monitoring role");
for (const flag of [
  "ownerRoleBound",
  "editorRoleBound",
  "storageAdminRoleBound",
  "artifactRegistryWriterRoleBound",
  "pubsubPublisherRoleBound",
  "providerSecretAccessBound",
  "supabaseAccessBound",
  "publicIpPathEnabled",
  "publicSshIngressEnabled",
  "proofVmExistsAfterSetup"
]) {
  assert(setup?.[flag] === false, `Setup flag ${flag} must be false`);
}
assert(setup?.firewallRuleName === "reeditpro-ai-broll-proof-iap-ssh", "Firewall rule mismatch");
assert(setup?.firewallRuleCreated === true, "Firewall rule must be created");
assert(setup?.firewallDirection === "INGRESS", "Firewall direction mismatch");
assert(setup?.firewallSourceRange === "35.235.240.0/20", "Firewall source range mismatch");
assert(setup?.firewallTargetTag === "ai-video-broll-wan-l4-proof", "Firewall target tag mismatch");
assert(setup?.firewallProtocol === "tcp", "Firewall protocol mismatch");
assert(setup?.firewallPort === "22", "Firewall port mismatch");
assert(setup?.firewallDisabled === false, "Firewall must not be disabled");

assert(report.runtimeFlags?.mutatingCommandsExecuted === true, "Setup must record mutating commands");
assert(report.runtimeFlags?.serviceAccountCreated === true, "Setup must record service account creation");
assert(report.runtimeFlags?.iamBindingCreated === true, "Setup must record IAM binding creation");
assert(report.runtimeFlags?.firewallRuleCreated === true, "Setup must record firewall creation");
for (const flag of REQUIRED_FALSE_FLAGS) {
  assert(report.runtimeFlags?.[flag] === false, `Runtime flag ${flag} must stay false`);
}
assert(report.nextPrompt === EXPECTED_NEXT_PROMPT, "Next prompt mismatch");

assert(changeLog.gcpIdentitySetupChanged === true, "Change log must record identity setup");
assert(changeLog.serviceAccountCreated === true, "Change log must record service account creation");
assert(changeLog.iamBindingCreated === true, "Change log must record IAM binding creation");
assert(changeLog.firewallRuleCreated === true, "Change log must record firewall creation");
assert(changeLog.vmCreated === false, "Change log must not create VM");
assert(changeLog.modelInferenceRun === false, "Change log must not run inference");
assert(changeLog.nextPrompt === EXPECTED_NEXT_PROMPT, "Change log next prompt mismatch");

const nextPromptText = read("docs/implementation-prompts/prompt-ai-video-broll-gen-9j-retry-controlled-l4-private-proof.md");
assert(nextPromptText.includes("Controlled L4 Private Proof With Proof Identity"), "Missing next prompt title");
assert(nextPromptText.includes("only if every final preflight still passes"), "Next prompt must require final preflight");
assert(nextPromptText.includes("reeditpro-ai-broll-proof-sa"), "Next prompt must reference proof service account ID");
assert(nextPromptText.includes("ai-video-broll-wan-l4-proof"), "Next prompt must reference proof target tag");
assert(nextPromptText.includes("no public IP"), "Next prompt must block public IP");
assert(nextPromptText.includes("generated_local_fixture_passed"), "Next prompt must block generated local fixture claims");

ensureSafeText([
  "docs/ai-video-broll-generation-gcp-proof-identity-setup-result.md",
  "docs/ai-video-broll-generation-gcp-proof-identity-setup-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-retry-controlled-l4-private-proof.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  setupResult: report.setupResult,
  runtimeFlags: report.runtimeFlags,
  vmCreated: false,
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
