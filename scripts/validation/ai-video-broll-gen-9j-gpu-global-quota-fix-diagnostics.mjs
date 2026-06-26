#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const EXPECTED_DECISION =
  "ai_video_broll_gen_9j_gpu_global_quota_fix_blocked_pending_console_quota_request";
const EXPECTED_NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-9J-GPU-GLOBAL-QUOTA-USER: request GPUS_ALL_REGIONS quota increase to 1 in Google Cloud Console, no repo changes";
const EXPECTED_VERIFY_PROMPT =
  "AI-VIDEO-BROLL-GEN-9J-GPU-GLOBAL-QUOTA-VERIFY: verify GPUS_ALL_REGIONS quota increase, no VM/no inference";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-gpu-global-quota-fix-result.md",
  "docs/ai-video-broll-generation-gpu-global-quota-fix-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-gpu-global-quota-user.md",
  "docs/ai-video-broll-generation-gcp-private-vm-create-execute-result.md",
  "scripts/validation/ai-video-broll-gen-9j-gpu-global-quota-fix-diagnostics.mjs",
  "package.json"
];

const UNSAFE_PATTERNS = [
  [
    "runtime true claim",
    /\b(vmCreated|diskCreated|externalIpCreated|networkChanged|serviceAccountCreated|serviceAccountKeyCreated|firewallRuleCreated|routerCreated|cloudNatCreated|staticAddressCreated|reservationCreated|customImageCreated|bucketCreated|artifactRegistryImageCreated|cloudRunJobCreated|quotaRequestCreated|iapTransferExecuted|sshSessionOpened|dependencyInstalledOnVm|sourceRepositoryCloned|modelDownloaded|modelImported|pipelineInstantiated|modelFromPretrainedCalled|torchLoadCalled|modelInferenceRun|generatedFramesCreated|generatedVideoCreated|mediaProcessingRun|ffmpegRun|providerCalled|workerDispatched|supabaseTouched|sqlExecuted|storageUploaded|signedUrlsCreated|publicArtifactsCreated|creditMutationCreated|betaUnlocked|productionUnlocked|runtimeReadinessClaimed|dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i
  ],
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
  ["Google credential env", /\bGOOGLE_APPLICATION_CREDENTIALS\b/],
  ["access token", /\bya29\.[A-Za-z0-9._-]+/i],
  ["refresh token", /\brefresh[_-]?token\s*[:=]\s*['"][^'"]+/i]
];

function check(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function parseBlock(relativePath, label) {
  const text = read(relativePath);
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp("```json\\s+" + escaped + "\\n([\\s\\S]*?)\\n```"));
  check(match, `Missing JSON block ${label} in ${relativePath}`);
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
  check(findings.length === 0, `Unsafe text found: ${findings.join("; ")}`);
}

for (const file of REQUIRED_FILES) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
check(
  packageJson.scripts?.["ai-video-broll-gen-9j-gpu-global-quota-fix:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-9j-gpu-global-quota-fix-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-9j-gpu-global-quota-fix:diagnostics"
);

const result = parseBlock(
  "docs/ai-video-broll-generation-gpu-global-quota-fix-result.md",
  "ai-video-broll-gen-9j-gpu-global-quota-fix-result"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-gpu-global-quota-fix-change-log.md",
  "ai-video-broll-gen-9j-gpu-global-quota-fix-change-log"
);
const createExecute = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-vm-create-execute-result.md",
  "ai-video-broll-gen-9j-vm-create-execute-result"
);

check(result.decision === EXPECTED_DECISION, "Result decision mismatch");
check(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
check(result.nextPrompt === EXPECTED_NEXT_PROMPT, "Result next prompt mismatch");
check(changeLog.nextPrompt === EXPECTED_NEXT_PROMPT, "Change log next prompt mismatch");
check(result.project?.projectId === "reeditpro", "Project mismatch");
check(result.project?.targetRegion === "us-central1", "Target region mismatch");
check(result.project?.targetZone === "us-central1-b", "Target zone mismatch");

check(result.quotaState?.regionalL4GpuQuotaLimit === 1, "Regional L4 quota limit mismatch");
check(result.quotaState?.regionalL4GpuQuotaUsage === 0, "Regional L4 quota usage mismatch");
check(result.quotaState?.preemptibleRegionalL4GpuQuotaLimit === 1, "Preemptible L4 quota limit mismatch");
check(result.quotaState?.preemptibleRegionalL4GpuQuotaUsage === 0, "Preemptible L4 quota usage mismatch");
check(result.quotaState?.globalGpusAllRegionsQuotaLimit === 0, "Global GPU quota limit must be zero");
check(result.quotaState?.globalGpusAllRegionsQuotaUsage === 0, "Global GPU quota usage must be zero");
check(result.quotaState?.minimumRequiredGlobalGpusAllRegionsQuota === 1, "Minimum required global quota mismatch");
check(result.quotaState?.quotaSufficientForOneL4Vm === false, "Quota must remain insufficient");

check(result.tooling?.computeProjectInfoReadOnlyInspectionPassed === true, "Read-only compute quota inspection must pass");
check(result.tooling?.stableServicesQuotaGroupAvailable === false, "Stable quota group must be unavailable");
check(result.tooling?.betaServicesQuotaGroupAvailableWithoutInstall === false, "Beta quota group must require install");
check(result.tooling?.sdkComponentInstallAttempted === false, "SDK component install must not be attempted");
check(result.tooling?.sdkComponentInstalled === false, "SDK component must not be installed");
check(result.tooling?.quotaRequestFiledNow === false, "Quota request must not be filed now");
check(result.tooling?.quotaRequestPreparedForOwner === true, "Owner quota request must be prepared");

check(result.resourceState?.proofInstancePresent === false, "Proof VM must be absent");
check(result.resourceState?.proofDiskPresent === false, "Proof disk must be absent");
check(result.resourceState?.proofAddressPresent === false, "Proof address must be absent");
check(result.resourceState?.proofReservationPresent === false, "Proof reservation must be absent");

check(changeLog.quotaOutcome?.globalGpusAllRegionsQuotaLimit === 0, "Change log quota limit mismatch");
check(changeLog.quotaOutcome?.minimumRequiredGlobalGpusAllRegionsQuota === 1, "Change log minimum quota mismatch");
check(changeLog.quotaOutcome?.quotaSufficientForOneL4Vm === false, "Change log quota sufficiency mismatch");
check(changeLog.quotaOutcome?.quotaRequestFiledNow === false, "Change log must not file quota request");
check(changeLog.quotaOutcome?.manualOwnerRequestRequired === true, "Manual owner request must be required");

check(createExecute.createAttempt?.blockedQuotaMetric === "GPUS_ALL_REGIONS", "Create execute blocker mismatch");
check(createExecute.postAttemptResourceState?.proofInstancePresent === false, "Create execute must record absent VM");

for (const [flag, value] of Object.entries(result.runtimeFlags ?? {})) {
  check(value === false, `Runtime flag ${flag} must be false`);
}
for (const [flag, value] of Object.entries(changeLog.runtimeFlags ?? {})) {
  check(value === false, `Change-log runtime flag ${flag} must be false`);
}

const userPrompt = read("docs/implementation-prompts/prompt-ai-video-broll-gen-9j-gpu-global-quota-user.md");
for (const expected of [
  EXPECTED_NEXT_PROMPT,
  EXPECTED_VERIFY_PROMPT,
  "find quota metric `GPUS_ALL_REGIONS`",
  "request limit `1`",
  "Do not create a VM",
  "Do not install SDK components",
  "Do not import models"
]) {
  check(userPrompt.includes(expected), `User prompt missing: ${expected}`);
}

ensureSafeText([
  "docs/ai-video-broll-generation-gpu-global-quota-fix-result.md",
  "docs/ai-video-broll-generation-gpu-global-quota-fix-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-gpu-global-quota-user.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  projectId: result.project.projectId,
  regionalL4GpuQuotaLimit: result.quotaState.regionalL4GpuQuotaLimit,
  globalGpusAllRegionsQuotaLimit: result.quotaState.globalGpusAllRegionsQuotaLimit,
  minimumRequiredGlobalGpusAllRegionsQuota: result.quotaState.minimumRequiredGlobalGpusAllRegionsQuota,
  quotaSufficientForOneL4Vm: result.quotaState.quotaSufficientForOneL4Vm,
  stableServicesQuotaGroupAvailable: result.tooling.stableServicesQuotaGroupAvailable,
  betaServicesQuotaGroupAvailableWithoutInstall: result.tooling.betaServicesQuotaGroupAvailableWithoutInstall,
  sdkComponentInstalled: result.tooling.sdkComponentInstalled,
  quotaRequestFiledNow: result.tooling.quotaRequestFiledNow,
  quotaRequestPreparedForOwner: result.tooling.quotaRequestPreparedForOwner,
  proofInstancePresent: result.resourceState.proofInstancePresent,
  vmCreated: false,
  quotaRequestCreated: false,
  dependencyInstalledOnVm: false,
  modelDownloaded: false,
  modelImported: false,
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
