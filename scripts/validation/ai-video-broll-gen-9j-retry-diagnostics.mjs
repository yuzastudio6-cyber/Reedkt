#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const EXPECTED_DECISION =
  "ai_video_broll_gen_9j_retry_controlled_l4_private_proof_blocked_missing_approved_vm_runner_dependency_path";
const EXPECTED_NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-9J-RUNTIME-SETUP: approve private L4 proof runner dependency path, no VM/no inference";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-gcp-controlled-l4-private-proof-retry-result.md",
  "docs/ai-video-broll-generation-gcp-controlled-l4-private-proof-retry-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-runtime-setup.md",
  "scripts/validation/ai-video-broll-gen-9j-retry-diagnostics.mjs",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-retry-controlled-l4-private-proof.md",
  "docs/ai-video-broll-generation-gcp-proof-identity-setup-result.md",
  "docs/ai-video-broll-generation-gcp-private-proof-execution-plan.md",
  "docs/ai-video-broll-generation-gcp-private-proof-owner-execution-approval.md",
  "docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md",
  "package.json"
];

const REQUIRED_FALSE_FLAGS = [
  "gcpMutatingCommandsExecuted",
  "serviceAccountCreated",
  "iamBindingCreated",
  "firewallRuleCreated",
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
  "dependencyInstallRun",
  "modelImportAllowed",
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
  ["service account email", /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
  ["runtime execution true claim", /\b(pipelineInstantiated|modelFromPretrainedCalled|torchLoadCalled|textEncodingCalled|denoisingStepRun|schedulerRun|vaeDecodeRun|modelInferenceRun|inferenceRun|generatedFramesCreated|generatedVideoCreated|mediaProcessingRun|ffmpegRun|providerCalled|workerDispatched)\b\s*[:=]\s*(true|"true")/i],
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
  packageJson.scripts?.["ai-video-broll-gen-9j-retry:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-9j-retry-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-9j-retry:diagnostics"
);

const report = parseBlock(
  "docs/ai-video-broll-generation-gcp-controlled-l4-private-proof-retry-result.md",
  "ai-video-broll-gen-9j-retry-controlled-l4-private-proof-result"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-gcp-controlled-l4-private-proof-retry-change-log.md",
  "ai-video-broll-gen-9j-retry-controlled-l4-private-proof-change-log"
);
const setup = parseBlock(
  "docs/ai-video-broll-generation-gcp-proof-identity-setup-result.md",
  "ai-video-broll-gen-9j-fix-setup-proof-identity-result"
);
const plan = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-proof-execution-plan.md",
  "ai-video-broll-gen-9h-private-proof-execution-plan"
);

assert(report.decision === EXPECTED_DECISION, "Unexpected retry decision");
assert(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
assert(report.sourceCommit === "a9015c78", "Retry source commit mismatch");
assert(report.selectedTarget?.project === "reeditpro", "Project mismatch");
assert(report.selectedTarget?.zone === "us-central1-b", "Zone mismatch");
assert(report.selectedTarget?.machineType === "g2-standard-4", "Machine type mismatch");
assert(report.selectedTarget?.accelerator === "nvidia-l4", "Accelerator mismatch");
assert(report.selectedTarget?.modelId === "Wan-AI/Wan2.1-T2V-1.3B", "Model mismatch");
assert(report.selectedTarget?.modelRevision === "37ec512624d61f7aa208f7ea8140a131f93afc9a", "Model revision mismatch");
assert(report.selectedTarget?.fixture === "non_user_media_tabletop_fixture", "Fixture mismatch");
assert(report.selectedTarget?.proofServiceAccountId === "reeditpro-ai-broll-proof-sa", "Proof service account ID mismatch");
assert(report.selectedTarget?.proofTargetTag === "ai-video-broll-wan-l4-proof", "Proof tag mismatch");

for (const flag of [
  "repoCleanBeforeEdits",
  "activeProjectReeditpro",
  "computeApiEnabled",
  "proofServiceAccountExists",
  "machineTypeVisible",
  "acceleratorVisible",
  "firewallRuleExists",
  "privateCacheExists",
  "privateCachePerFileSizesMatch",
  "privateCachePerFileSha256Matches",
  "fixtureIsNonUserMedia"
]) {
  assert(report.safePreflight?.[flag] === true, `Safe preflight must pass ${flag}`);
}

assert(report.safePreflight?.proofServiceAccountDisabled === false, "Proof service account must not be disabled");
assert(report.safePreflight?.proofServiceAccountUserManagedKeyCount === 0, "Proof service account key count must be zero");
assert(report.safePreflight?.proofServiceAccountUnexpectedRolesFound === false, "Proof service account must not have unexpected roles");
assert(report.safePreflight?.firewallDisabled === false, "Firewall must not be disabled");
assert(report.safePreflight?.firewallSourceRange === "35.235.240.0/20", "Firewall source range mismatch");
assert(report.safePreflight?.firewallTargetTag === "ai-video-broll-wan-l4-proof", "Firewall target mismatch");
assert(report.safePreflight?.nvidiaL4QuotaLimit === 1, "L4 quota limit mismatch");
assert(report.safePreflight?.nvidiaL4QuotaUsage === 0, "L4 quota usage mismatch");
assert(report.safePreflight?.existingProofVmFound === false, "No proof VM should exist");
assert(report.safePreflight?.privateCacheFileCount === 10, "Private cache file count mismatch");
assert(report.safePreflight?.privateCacheManifestListedByteTotal === 17567083322, "Listed byte sum mismatch");
assert(report.safePreflight?.privateCacheManifestAggregateByteTotal === 17567424122, "Aggregate byte total mismatch");
assert(report.safePreflight?.privateCacheAggregateByteTotalMatchesManifest === false, "Aggregate mismatch must be recorded");

assert(report.blockedPreflight?.blockedBeforeVmCreate === true, "Retry must block before VM creation");
assert(report.blockedPreflight?.approvedProofRunnerPathExists === false, "Approved proof runner must be missing");
assert(report.blockedPreflight?.proofRunnerSourceValue === "AI_VIDEO_BROLL_PROOF_RUNNER_PLACEHOLDER", "Proof runner placeholder mismatch");
assert(report.blockedPreflight?.approvedRemoteDependencySetupPathExists === false, "Remote dependency path must be missing");
assert(report.blockedPreflight?.finalRunCostAccepted === false, "Final run cost must not be accepted");
assert(report.blockedPreflight?.cacheAggregateByteTotalNeedsReconciliation === true, "Cache aggregate drift must be recorded");

assert(report.executionOutcome?.controlledL4PrivateProofAttempted === false, "Proof must not be attempted");
assert(report.executionOutcome?.vmCreated === false, "VM must not be created");
assert(report.executionOutcome?.cacheTransferred === false, "Cache must not be transferred");
assert(report.executionOutcome?.proofRunnerExecuted === false, "Proof runner must not execute");
assert(report.executionOutcome?.modelInferenceRun === false, "Inference must not run");
assert(report.executionOutcome?.cleanupNeeded === false, "Cleanup must not be needed");

assert(report.runtimeFlags?.gcpReadOnlyCommandsExecuted === true, "Read-only GCP checks must be recorded");
for (const flag of REQUIRED_FALSE_FLAGS) {
  assert(report.runtimeFlags?.[flag] === false, `Runtime flag ${flag} must stay false`);
}
assert(report.nextPrompt === EXPECTED_NEXT_PROMPT, "Next prompt mismatch");

assert(changeLog.gcpReadOnlyCommandsExecuted === true, "Change log must record read-only GCP checks");
assert(changeLog.gcpMutatingCommandsExecuted === false, "Change log must record no GCP mutation");
assert(changeLog.vmCreated === false, "Change log must record no VM");
assert(changeLog.modelInferenceRun === false, "Change log must record no inference");
assert(changeLog.generatedVideoCreated === false, "Change log must record no generated video");
assert(changeLog.nextPrompt === EXPECTED_NEXT_PROMPT, "Change log next prompt mismatch");

assert(setup.setupResult?.proofServiceAccountId === "reeditpro-ai-broll-proof-sa", "Setup source proof service account mismatch");
assert(setup.setupResult?.firewallTargetTag === "ai-video-broll-wan-l4-proof", "Setup source target tag mismatch");
assert(plan.futureCommandPlan?.proofRunnerCommandDefined === true, "Gate 9H must define a proof runner command shape");
assert(
  read("docs/ai-video-broll-generation-gcp-private-proof-execution-plan.md").includes("AI_VIDEO_BROLL_PROOF_RUNNER_PLACEHOLDER"),
  "Gate 9H placeholder must remain visible as retry blocker"
);

const nextPromptText = read("docs/implementation-prompts/prompt-ai-video-broll-gen-9j-runtime-setup.md");
for (const expected of [
  "approve a concrete, private, no-public-endpoint proof runner",
  "replace",
  "AI_VIDEO_BROLL_PROOF_RUNNER_PLACEHOLDER",
  "reconcile the private cache aggregate byte total",
  "no VM/no inference",
  "AI-VIDEO-BROLL-GEN-9J-RETRY-2"
]) {
  assert(nextPromptText.includes(expected), `Next prompt doc missing ${expected}`);
}

ensureSafeText([
  "docs/ai-video-broll-generation-gcp-controlled-l4-private-proof-retry-result.md",
  "docs/ai-video-broll-generation-gcp-controlled-l4-private-proof-retry-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-runtime-setup.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  blockedBeforeVmCreate: true,
  blockedReason: "missing approved private VM proof runner and dependency setup path",
  cacheAggregateByteTotalNeedsReconciliation: true,
  gcpReadOnlyCommandsExecuted: true,
  gcpMutatingCommandsExecuted: false,
  vmCreated: false,
  cacheTransferred: false,
  dependencyInstallRun: false,
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
