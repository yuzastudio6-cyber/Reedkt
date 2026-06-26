#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const EXPECTED_DECISION =
  "ai_video_broll_gen_9j_vm_create_execute_blocked_by_gpus_all_regions_quota";
const EXPECTED_NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-9J-GPU-GLOBAL-QUOTA-FIX: request or verify GPUS_ALL_REGIONS quota for controlled L4 proof VM, no VM create/no inference";
const EXPECTED_FOLLOWUP =
  "AI-VIDEO-BROLL-GEN-9J-VM-CREATE-EXECUTE-2: retry controlled no-public-IP L4 proof VM create, no inference";
const EXPECTED_WHEELHOUSE =
  "/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64";
const EXPECTED_MANIFEST = path.join(EXPECTED_WHEELHOUSE, "SHA256SUMS.json");
const EXPECTED_AGGREGATE_SHA =
  "55ab4ba840e664996b29ee684591a500568bbb9ade332d2b48f05af8e79eab64";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-gcp-private-vm-create-execute-result.md",
  "docs/ai-video-broll-generation-gcp-private-vm-create-execute-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-gpu-global-quota-fix.md",
  "docs/ai-video-broll-generation-gcp-private-vm-create-plan-3-result.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-vm-create-execute.md",
  "scripts/validation/ai-video-broll-gen-9j-vm-create-execute-diagnostics.mjs",
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
check(fs.existsSync(EXPECTED_MANIFEST), `Missing Python 3.12 manifest: ${EXPECTED_MANIFEST}`);

const packageJson = JSON.parse(read("package.json"));
check(
  packageJson.scripts?.["ai-video-broll-gen-9j-vm-create-execute:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-9j-vm-create-execute-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-9j-vm-create-execute:diagnostics"
);

const result = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-vm-create-execute-result.md",
  "ai-video-broll-gen-9j-vm-create-execute-result"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-vm-create-execute-change-log.md",
  "ai-video-broll-gen-9j-vm-create-execute-change-log"
);
const plan3 = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-vm-create-plan-3-result.md",
  "ai-video-broll-gen-9j-vm-create-plan-3-result"
);
const manifest = JSON.parse(fs.readFileSync(EXPECTED_MANIFEST, "utf8"));

check(result.decision === EXPECTED_DECISION, "Result decision mismatch");
check(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
check(result.nextPrompt === EXPECTED_NEXT_PROMPT, "Result next prompt mismatch");
check(changeLog.nextPrompt === EXPECTED_NEXT_PROMPT, "Change log next prompt mismatch");

check(result.project?.projectId === "reeditpro", "Project mismatch");
check(result.project?.targetRegion === "us-central1", "Target region mismatch");
check(result.project?.targetZone === "us-central1-b", "Target zone mismatch");
check(result.project?.zoneStatus === "UP", "Zone status mismatch");

check(result.preflight?.projectVerified === true, "Project must be verified");
check(result.preflight?.zoneUp === true, "Zone must be up");
check(result.preflight?.machineTypeAvailable === true, "Machine type must be available");
check(result.preflight?.acceleratorAvailable === true, "Accelerator must be available");
check(result.preflight?.regionalL4GpuQuotaLimit === 1, "Regional L4 quota limit mismatch");
check(result.preflight?.regionalL4GpuQuotaUsage === 0, "Regional L4 quota usage mismatch");
check(result.preflight?.preemptibleRegionalL4GpuQuotaLimit === 1, "Preemptible L4 quota limit mismatch");
check(result.preflight?.preemptibleRegionalL4GpuQuotaUsage === 0, "Preemptible L4 quota usage mismatch");
check(result.preflight?.globalGpusAllRegionsQuotaLimit === 0, "Global GPU quota limit must be zero");
check(result.preflight?.globalGpusAllRegionsQuotaUsage === 0, "Global GPU quota usage must be zero");
check(result.preflight?.cpuQuotaLimit === 200, "CPU quota limit mismatch");
check(result.preflight?.cpuQuotaUsage === 0, "CPU quota usage mismatch");
check(result.preflight?.ssdTotalGbQuotaLimit === 500, "SSD quota limit mismatch");
check(result.preflight?.ssdTotalGbQuotaUsage === 0, "SSD quota usage mismatch");
check(result.preflight?.proofServiceAccountPresent === true, "Proof service account must exist");
check(result.preflight?.proofServiceAccountDisabled === false, "Proof service account must be enabled");
check(result.preflight?.iapFirewallRulePresent === true, "IAP firewall must exist");
check(result.preflight?.iapFirewallTargetTag === "ai-video-broll-wan-l4-proof", "IAP target tag mismatch");
check(result.preflight?.existingProofInstancePresentBeforeCreate === false, "Proof VM must be absent before create");
check(result.preflight?.existingProofDiskPresentBeforeCreate === false, "Proof disk must be absent before create");
check(result.preflight?.existingProofAddressPresentBeforeCreate === false, "Proof address must be absent before create");
check(result.preflight?.existingProofReservationPresentBeforeCreate === false, "Proof reservation must be absent before create");
check(result.preflight?.wheelhouseManifestPresent === true, "Wheelhouse manifest must be present");
check(result.preflight?.wheelhousePythonVersion === "3.12", "Wheelhouse Python mismatch");
check(result.preflight?.wheelhouseAbi === "cp312", "Wheelhouse ABI mismatch");
check(result.preflight?.wheelhouseRealWheelCount === 66, "Wheelhouse count mismatch");
check(result.preflight?.wheelhouseAggregateSha256 === EXPECTED_AGGREGATE_SHA, "Wheelhouse SHA mismatch");

check(result.createAttempt?.approvedCreateCommandAttempted === true, "Approved create command must be attempted");
check(result.createAttempt?.attemptedVmName === "reeditpro-ai-broll-wan-l4-proof", "Attempted VM mismatch");
check(result.createAttempt?.attemptedMachineType === "g2-standard-4", "Attempted machine type mismatch");
check(result.createAttempt?.attemptedAccelerator === "nvidia-l4", "Attempted accelerator mismatch");
check(result.createAttempt?.attemptedAcceleratorCount === 1, "Attempted accelerator count mismatch");
check(result.createAttempt?.attemptedNoExternalIp === true, "Attempted VM must have no external IP");
check(result.createAttempt?.attemptedTargetTag === "ai-video-broll-wan-l4-proof", "Attempted target tag mismatch");
check(result.createAttempt?.attemptedServiceAccount === "reeditpro-ai-broll-proof-sa", "Attempted service account mismatch");
check(result.createAttempt?.attemptedScopes?.includes("logging-write"), "Logging scope missing");
check(result.createAttempt?.attemptedScopes?.includes("monitoring-write"), "Monitoring scope missing");
check(result.createAttempt?.blockedByQuota === true, "Create must be blocked by quota");
check(result.createAttempt?.blockedQuotaMetric === "GPUS_ALL_REGIONS", "Blocked quota metric mismatch");
check(result.createAttempt?.blockedQuotaLimit === 0, "Blocked quota limit mismatch");
check(result.createAttempt?.blockedQuotaUsage === 0, "Blocked quota usage mismatch");
check(result.createAttempt?.gcpErrorSanitized === true, "GCP error must be sanitized");

check(result.postAttemptResourceState?.proofInstancePresent === false, "Proof VM must be absent after attempt");
check(result.postAttemptResourceState?.proofDiskPresent === false, "Proof disk must be absent after attempt");
check(result.postAttemptResourceState?.proofAddressPresent === false, "Proof address must be absent after attempt");
check(result.postAttemptResourceState?.proofReservationPresent === false, "Proof reservation must be absent after attempt");
check(result.postAttemptResourceState?.cleanupRequired === false, "Cleanup must not be required");

check(changeLog.gcpOutcome?.approvedCreateCommandAttempted === true, "Change log create attempt missing");
check(changeLog.gcpOutcome?.vmCreated === false, "Change log must record no VM");
check(changeLog.gcpOutcome?.blockedQuotaMetric === "GPUS_ALL_REGIONS", "Change log quota metric mismatch");
check(changeLog.gcpOutcome?.postAttemptProofResourcesAbsent === true, "Change log must record absent resources");

for (const [flag, value] of Object.entries(result.runtimeFlags ?? {})) {
  check(value === false, `Runtime flag ${flag} must be false`);
}
for (const [flag, value] of Object.entries(changeLog.runtimeFlags ?? {})) {
  check(value === false, `Change-log runtime flag ${flag} must be false`);
}

check(plan3.createPlan?.vmCreateExecutionReady === true, "Plan 3 must have allowed execute attempt");
check(plan3.createPlan?.vmCreateExecutedNow === false, "Plan 3 must remain no-execution planning");
check(manifest.target?.pythonVersion === "3.12", "Manifest target Python mismatch");
check(manifest.target?.abi === "cp312", "Manifest target ABI mismatch");
check(manifest.realWheelCount === 66, "Manifest wheel count mismatch");
check(manifest.aggregateSha256 === EXPECTED_AGGREGATE_SHA, "Manifest aggregate SHA mismatch");

const quotaPrompt = read("docs/implementation-prompts/prompt-ai-video-broll-gen-9j-gpu-global-quota-fix.md");
for (const expected of [
  EXPECTED_NEXT_PROMPT,
  EXPECTED_FOLLOWUP,
  "`GPUS_ALL_REGIONS` must be at least `1`",
  "Do not create a VM",
  "Do not import models",
  "Do not SSH"
]) {
  check(quotaPrompt.includes(expected), `Quota prompt missing: ${expected}`);
}

const activeMigration = path.join(ROOT, "supabase/migrations/999_supabase_sound_local_fixture_records_draft.sql");
check(!fs.existsSync(activeMigration), "Unexpected active Supabase draft migration exists");

const sidecars = fs.readdirSync(EXPECTED_WHEELHOUSE).filter((name) => name.startsWith("._"));
check(sidecars.length === 0, `Wheelhouse contains AppleDouble sidecars: ${sidecars.join(", ")}`);

ensureSafeText([
  "docs/ai-video-broll-generation-gcp-private-vm-create-execute-result.md",
  "docs/ai-video-broll-generation-gcp-private-vm-create-execute-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-gpu-global-quota-fix.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  projectId: result.project.projectId,
  targetZone: result.project.targetZone,
  approvedCreateCommandAttempted: result.createAttempt.approvedCreateCommandAttempted,
  blockedByQuota: result.createAttempt.blockedByQuota,
  blockedQuotaMetric: result.createAttempt.blockedQuotaMetric,
  blockedQuotaLimit: result.createAttempt.blockedQuotaLimit,
  regionalL4GpuQuotaLimit: result.preflight.regionalL4GpuQuotaLimit,
  globalGpusAllRegionsQuotaLimit: result.preflight.globalGpusAllRegionsQuotaLimit,
  proofInstancePresent: result.postAttemptResourceState.proofInstancePresent,
  proofDiskPresent: result.postAttemptResourceState.proofDiskPresent,
  proofAddressPresent: result.postAttemptResourceState.proofAddressPresent,
  proofReservationPresent: result.postAttemptResourceState.proofReservationPresent,
  cleanupRequired: result.postAttemptResourceState.cleanupRequired,
  vmCreated: false,
  diskCreated: false,
  externalIpCreated: false,
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
