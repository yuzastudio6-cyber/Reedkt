#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const EXPECTED_DECISION =
  "ai_video_broll_gen_9j_vm_create_plan_3_ready_for_controlled_vm_create_execute_no_inference";
const EXPECTED_NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-9J-VM-CREATE-EXECUTE: create controlled no-public-IP L4 proof VM, no inference";
const EXPECTED_EXECUTE_NEXT =
  "AI-VIDEO-BROLL-GEN-9J-IAP-WHEELHOUSE-TRANSFER-EXECUTE: transfer Python 3.12 wheelhouse to no-public-IP L4 proof VM over IAP, no inference";
const EXPECTED_WHEELHOUSE =
  "/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64";
const EXPECTED_MANIFEST = path.join(EXPECTED_WHEELHOUSE, "SHA256SUMS.json");
const EXPECTED_AGGREGATE_SHA =
  "55ab4ba840e664996b29ee684591a500568bbb9ade332d2b48f05af8e79eab64";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-gcp-private-vm-create-plan-3-result.md",
  "docs/ai-video-broll-generation-gcp-private-vm-create-plan-3-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-vm-create-execute.md",
  "docs/ai-video-broll-generation-gcp-private-vm-create-plan-2-result.md",
  "docs/ai-video-broll-generation-python-runtime-alignment-result.md",
  "scripts/validation/ai-video-broll-gen-9j-vm-create-plan-3-diagnostics.mjs",
  "package.json"
];

const REQUIRED_COMMAND_SNIPPETS = [
  "gcloud compute instances create reeditpro-ai-broll-wan-l4-proof",
  "--project=reeditpro",
  "--zone=us-central1-b",
  "--machine-type=g2-standard-4",
  "--accelerator=type=nvidia-l4,count=1",
  "--image-family=common-cu129-ubuntu-2404-nvidia-580",
  "--image-project=deeplearning-platform-release",
  "--boot-disk-size=150GB",
  "--boot-disk-type=pd-balanced",
  "--boot-disk-auto-delete",
  "--no-address",
  "--tags=ai-video-broll-wan-l4-proof",
  "--scopes=logging-write,monitoring-write",
  "gcloud compute instances delete reeditpro-ai-broll-wan-l4-proof"
];

const UNSAFE_PATTERNS = [
  [
    "runtime execution true claim",
    /\b(vmCreated|diskCreated|networkChanged|serviceAccountCreated|serviceAccountKeyCreated|firewallRuleCreated|routerCreated|cloudNatCreated|staticAddressCreated|reservationCreated|customImageCreated|bucketCreated|artifactRegistryImageCreated|cloudRunJobCreated|quotaRequestCreated|iapTransferExecuted|sshSessionOpened|dependencyInstalledOnVm|sourceRepositoryCloned|modelDownloaded|modelImported|pipelineInstantiated|modelFromPretrainedCalled|torchLoadCalled|modelInferenceRun|generatedFramesCreated|generatedVideoCreated|mediaProcessingRun|ffmpegRun|providerCalled|workerDispatched|supabaseTouched|sqlExecuted|storageUploaded|signedUrlsCreated|publicArtifactsCreated|creditMutationCreated|betaUnlocked|productionUnlocked|runtimeReadinessClaimed|dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i
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
  packageJson.scripts?.["ai-video-broll-gen-9j-vm-create-plan-3:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-9j-vm-create-plan-3-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-9j-vm-create-plan-3:diagnostics"
);

const result = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-vm-create-plan-3-result.md",
  "ai-video-broll-gen-9j-vm-create-plan-3-result"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-vm-create-plan-3-change-log.md",
  "ai-video-broll-gen-9j-vm-create-plan-3-change-log"
);
const manifest = JSON.parse(fs.readFileSync(EXPECTED_MANIFEST, "utf8"));

check(result.decision === EXPECTED_DECISION, "Result decision mismatch");
check(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
check(result.nextPrompt === EXPECTED_NEXT_PROMPT, "Result next prompt mismatch");
check(changeLog.nextPrompt === EXPECTED_NEXT_PROMPT, "Change log next prompt mismatch");

check(result.project?.projectId === "reeditpro", "Project mismatch");
check(result.project?.activeAccountVerified === true, "Active account must be verified");
check(result.project?.activeAccountRecorded === false, "Active account value must not be recorded");
check(result.project?.targetZone === "us-central1-b", "Target zone mismatch");
check(result.project?.zoneStatus === "UP", "Zone status mismatch");

check(result.futureVmShape?.futureVmName === "reeditpro-ai-broll-wan-l4-proof", "Future VM name mismatch");
check(result.futureVmShape?.machineType === "g2-standard-4", "Machine type mismatch");
check(result.futureVmShape?.guestCpus === 4, "Guest CPU mismatch");
check(result.futureVmShape?.memoryMb === 16384, "Memory mismatch");
check(result.futureVmShape?.accelerator === "nvidia-l4", "Accelerator mismatch");
check(result.futureVmShape?.acceleratorCount === 1, "Accelerator count mismatch");
check(result.futureVmShape?.targetTag === "ai-video-broll-wan-l4-proof", "Target tag mismatch");
check(result.futureVmShape?.serviceAccountId === "reeditpro-ai-broll-proof-sa", "Service account mismatch");
check(result.futureVmShape?.externalIpAllowed === false, "External IP must be blocked");
check(result.futureVmShape?.iapOnlyAccessRequired === true, "IAP-only access must be required");
check(result.futureVmShape?.bootDiskAutoDelete === true, "Boot disk auto-delete must be true");
check(result.futureVmShape?.cloudNatRequired === false, "Cloud NAT must be blocked");
check(result.futureVmShape?.sourceRepositoryCloneAllowed === false, "Source repository clone must be blocked");

check(result.gcpPreflight?.gcloudAuthRefreshPassed === true, "gcloud auth must pass");
check(result.gcpPreflight?.machineTypeAvailable === true, "Machine type must be available");
check(result.gcpPreflight?.acceleratorAvailable === true, "Accelerator must be available");
check(result.gcpPreflight?.l4GpuQuotaLimit === 1, "L4 quota limit mismatch");
check(result.gcpPreflight?.l4GpuQuotaUsage === 0, "L4 quota usage must be zero");
check(result.gcpPreflight?.preemptibleL4GpuQuotaLimit === 1, "Preemptible L4 quota limit mismatch");
check(result.gcpPreflight?.preemptibleL4GpuQuotaUsage === 0, "Preemptible L4 quota usage must be zero");
check(result.gcpPreflight?.cpuQuotaLimit === 200, "CPU quota limit mismatch");
check(result.gcpPreflight?.cpuQuotaUsage === 0, "CPU quota usage must be zero");
check(result.gcpPreflight?.ssdTotalGbQuotaLimit === 500, "SSD quota limit mismatch");
check(result.gcpPreflight?.ssdTotalGbQuotaUsage === 0, "SSD quota usage must be zero");
check(result.gcpPreflight?.proofServiceAccountPresent === true, "Proof service account must be present");
check(result.gcpPreflight?.proofServiceAccountDisabled === false, "Proof service account must be enabled");
check(result.gcpPreflight?.iapFirewallRulePresent === true, "IAP firewall must be present");
check(result.gcpPreflight?.iapFirewallTargetTag === "ai-video-broll-wan-l4-proof", "IAP target tag mismatch");
check(result.gcpPreflight?.broadDefaultSshFirewallPresent === true, "Default SSH firewall should be recorded");
check(result.gcpPreflight?.existingProofInstancePresent === false, "Proof instance must not exist");
check(result.gcpPreflight?.existingProofDiskPresent === false, "Proof disk must not exist");
check(result.gcpPreflight?.existingProofAddressPresent === false, "Proof address must not exist");
check(result.gcpPreflight?.existingProofReservationPresent === false, "Proof reservation must not exist");

for (const service of [
  "compute.googleapis.com",
  "iam.googleapis.com",
  "iap.googleapis.com",
  "logging.googleapis.com",
  "monitoring.googleapis.com"
]) {
  check(result.gcpPreflight?.requiredServicesEnabled?.includes(service), `Missing service: ${service}`);
}

check(result.imageRuntime?.family === "common-cu129-ubuntu-2404-nvidia-580", "Image family mismatch");
check(result.imageRuntime?.status === "READY", "Image status mismatch");
check(result.imageRuntime?.pythonVersion === "3.12", "Image Python mismatch");
check(result.wheelhouseRuntime?.path === EXPECTED_WHEELHOUSE, "Wheelhouse path mismatch");
check(result.wheelhouseRuntime?.pythonVersion === "3.12", "Wheelhouse Python mismatch");
check(result.wheelhouseRuntime?.abi === "cp312", "Wheelhouse ABI mismatch");
check(result.wheelhouseRuntime?.realWheelCount === 66, "Wheelhouse count mismatch");
check(result.wheelhouseRuntime?.aggregateBytes === 2802483442, "Aggregate bytes mismatch");
check(result.wheelhouseRuntime?.aggregateSha256 === EXPECTED_AGGREGATE_SHA, "Aggregate SHA mismatch");
check(result.wheelhouseRuntime?.offlineNoIndexResolverCopyPassed === true, "Offline proof missing");
check(manifest.realWheelCount === 66, "Manifest wheel count mismatch");
check(manifest.aggregateSha256 === EXPECTED_AGGREGATE_SHA, "Manifest aggregate SHA mismatch");

check(result.createPlan?.vmCreateCommandShapeReady === true, "VM create command shape must be ready");
check(result.createPlan?.vmCleanupCommandShapeReady === true, "Cleanup command shape must be ready");
check(result.createPlan?.pythonRuntimeCompatibleWithWheelhouse === true, "Python runtime must be compatible");
check(result.createPlan?.gcpReadOnlyPreflightPassed === true, "GCP preflight must pass");
check(result.createPlan?.vmCreateExecutionReady === true, "VM create execution should be ready for next prompt");
check(result.createPlan?.vmCreateExecutePromptAllowedNext === true, "VM create execute prompt should be allowed next");
check(result.createPlan?.vmCreateExecutedNow === false, "VM create must not execute now");

for (const [flag, value] of Object.entries(result.runtimeFlags ?? {})) {
  check(value === false, `Runtime flag ${flag} must be false`);
}
for (const [flag, value] of Object.entries(changeLog.runtimeFlags ?? {})) {
  check(value === false, `Change-log runtime flag ${flag} must be false`);
}

const resultText = read("docs/ai-video-broll-generation-gcp-private-vm-create-plan-3-result.md");
for (const snippet of REQUIRED_COMMAND_SNIPPETS) {
  check(resultText.includes(snippet), `Result missing command snippet: ${snippet}`);
}

const nextPrompt = read("docs/implementation-prompts/prompt-ai-video-broll-gen-9j-vm-create-execute.md");
for (const expected of [
  EXPECTED_NEXT_PROMPT,
  EXPECTED_EXECUTE_NEXT,
  "verify no existing instance, disk, static address, or reservation",
  "verify the VM exists and has no external NAT IP",
  "Do not run IAP transfer commands",
  "Do not import models"
]) {
  check(nextPrompt.includes(expected), `VM create execute prompt missing: ${expected}`);
}

const sidecars = fs.readdirSync(EXPECTED_WHEELHOUSE).filter((name) => name.startsWith("._"));
check(sidecars.length === 0, `Wheelhouse contains AppleDouble sidecars: ${sidecars.join(", ")}`);

ensureSafeText([
  "docs/ai-video-broll-generation-gcp-private-vm-create-plan-3-result.md",
  "docs/ai-video-broll-generation-gcp-private-vm-create-plan-3-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-vm-create-execute.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  projectId: result.project.projectId,
  targetZone: result.project.targetZone,
  futureVmName: result.futureVmShape.futureVmName,
  machineType: result.futureVmShape.machineType,
  accelerator: result.futureVmShape.accelerator,
  externalIpAllowed: result.futureVmShape.externalIpAllowed,
  iapOnlyAccessRequired: result.futureVmShape.iapOnlyAccessRequired,
  gcloudAuthRefreshPassed: result.gcpPreflight.gcloudAuthRefreshPassed,
  gcpReadOnlyPreflightPassed: result.createPlan.gcpReadOnlyPreflightPassed,
  wheelhousePython: result.wheelhouseRuntime.pythonVersion,
  wheelhouseAbi: result.wheelhouseRuntime.abi,
  aggregateSha256: result.wheelhouseRuntime.aggregateSha256,
  vmCreateExecutionReady: result.createPlan.vmCreateExecutionReady,
  vmCreateExecutePromptAllowedNext: result.createPlan.vmCreateExecutePromptAllowedNext,
  vmCreated: false,
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
