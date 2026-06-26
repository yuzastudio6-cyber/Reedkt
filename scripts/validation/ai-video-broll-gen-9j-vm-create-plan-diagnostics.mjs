#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const EXPECTED_DECISION =
  "ai_video_broll_gen_9j_vm_create_plan_blocked_pending_python_runtime_alignment";
const EXPECTED_NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-9J-PYTHON-RUNTIME-ALIGNMENT: align VM Python runtime with private wheelhouse, no VM/no inference";
const EXPECTED_FOLLOWUP_PROMPT =
  "AI-VIDEO-BROLL-GEN-9J-VM-CREATE-PLAN-2: re-plan controlled no-public-IP L4 proof VM creation with aligned Python runtime, no inference";
const EXPECTED_WHEELHOUSE =
  "/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python313-linux-x86_64";
const EXPECTED_MANIFEST = path.join(EXPECTED_WHEELHOUSE, "SHA256SUMS.json");
const EXPECTED_AGGREGATE_SHA =
  "366835269639cd0d7bd24fcb876d39f94bca2bb9c4772735a16fa2458dfbfc11";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-gcp-private-vm-create-plan.md",
  "docs/ai-video-broll-generation-gcp-private-vm-create-plan-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-python-runtime-alignment.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-vm-create-plan.md",
  "docs/ai-video-broll-generation-gcp-private-vm-preflight-4-result.md",
  "docs/ai-video-broll-generation-gcp-private-wheelhouse-fix-result.md",
  "docs/ai-video-broll-generation-gcp-private-vm-preflight-3-result.md",
  "docs/ai-video-broll-generation-gcp-iap-egress-fix-result.md",
  "docs/ai-video-broll-generation-python-cuda-compatibility-plan.md",
  "server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt",
  "scripts/validation/ai-video-broll-gen-9j-vm-create-plan-diagnostics.mjs",
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
  ["Google credential env", /\bGOOGLE_APPLICATION_CREDENTIALS\b/]
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
check(fs.existsSync(EXPECTED_MANIFEST), `Missing private wheelhouse manifest: ${EXPECTED_MANIFEST}`);

const packageJson = JSON.parse(read("package.json"));
check(
  packageJson.scripts?.["ai-video-broll-gen-9j-vm-create-plan:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-9j-vm-create-plan-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-9j-vm-create-plan:diagnostics"
);

const result = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-vm-create-plan.md",
  "ai-video-broll-gen-9j-vm-create-plan-result"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-vm-create-plan-change-log.md",
  "ai-video-broll-gen-9j-vm-create-plan-change-log"
);
const manifest = JSON.parse(fs.readFileSync(EXPECTED_MANIFEST, "utf8"));

check(result.decision === EXPECTED_DECISION, "Result decision mismatch");
check(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
check(result.nextPrompt === EXPECTED_NEXT_PROMPT, "Result next prompt mismatch");
check(changeLog.nextPrompt === EXPECTED_NEXT_PROMPT, "Change log next prompt mismatch");

check(result.project?.projectId === "reeditpro", "Project mismatch");
check(result.project?.targetZone === "us-central1-b", "Target zone mismatch");
check(result.project?.zoneStatus === "UP", "Zone status mismatch");
check(result.futureVmShape?.futureVmName === "reeditpro-ai-broll-wan-l4-proof", "Future VM name mismatch");
check(result.futureVmShape?.machineType === "g2-standard-4", "Machine type mismatch");
check(result.futureVmShape?.accelerator === "nvidia-l4", "Accelerator mismatch");
check(result.futureVmShape?.acceleratorCount === 1, "Accelerator count mismatch");
check(result.futureVmShape?.targetTag === "ai-video-broll-wan-l4-proof", "Target tag mismatch");
check(result.futureVmShape?.serviceAccountId === "reeditpro-ai-broll-proof-sa", "Service account mismatch");
check(result.futureVmShape?.externalIpAllowed === false, "External IP must be blocked");
check(result.futureVmShape?.iapOnlyAccessRequired === true, "IAP-only access must be required");
check(result.futureVmShape?.bootDiskAutoDelete === true, "Boot disk auto-delete must be true");
check(result.futureVmShape?.cloudNatRequired === false, "Cloud NAT must be blocked");
check(result.futureVmShape?.sourceRepositoryCloneAllowed === false, "Source repository clone must be blocked");

check(result.gcpPreflight?.machineTypeAvailable === true, "Machine type must be available");
check(result.gcpPreflight?.acceleratorAvailable === true, "L4 accelerator must be available");
check(result.gcpPreflight?.l4GpuQuotaLimit === 1, "L4 quota limit mismatch");
check(result.gcpPreflight?.l4GpuQuotaUsage === 0, "L4 quota usage must be zero");
check(result.gcpPreflight?.proofServiceAccountPresent === true, "Proof service account must be present");
check(result.gcpPreflight?.proofServiceAccountDisabled === false, "Proof service account must be enabled");
check(result.gcpPreflight?.iapFirewallRulePresent === true, "IAP firewall rule must be present");
check(result.gcpPreflight?.existingProofInstancePresent === false, "Proof instance must not exist");
check(result.gcpPreflight?.existingProofDiskPresent === false, "Proof disk must not exist");
check(result.gcpPreflight?.existingProofAddressPresent === false, "Proof address must not exist");
check(result.gcpPreflight?.existingProofReservationPresent === false, "Proof reservation must not exist");

check(result.wheelhouseRuntime?.path === EXPECTED_WHEELHOUSE, "Wheelhouse path mismatch");
check(result.wheelhouseRuntime?.pythonVersion === "3.13", "Wheelhouse Python must be 3.13");
check(result.wheelhouseRuntime?.abi === "cp313", "Wheelhouse ABI must be cp313");
check(result.wheelhouseRuntime?.realWheelCount === 66, "Wheelhouse count mismatch");
check(result.wheelhouseRuntime?.aggregateSha256 === EXPECTED_AGGREGATE_SHA, "Wheelhouse aggregate SHA mismatch");
check(result.wheelhouseRuntime?.torchWheel.includes("cp313"), "Torch wheel must be cp313");
check(manifest.target?.pythonVersion === "3.13", "Manifest Python must be 3.13");
check(manifest.target?.abi === "cp313", "Manifest ABI must be cp313");
check(manifest.realWheelCount === 66, "Manifest wheel count mismatch");
check(manifest.aggregateSha256 === EXPECTED_AGGREGATE_SHA, "Manifest aggregate SHA mismatch");

check(Array.isArray(result.candidateImages), "Candidate images must be an array");
check(result.candidateImages.length >= 2, "Candidate images must include common and pytorch images");
for (const image of result.candidateImages) {
  check(image.descriptionPython === "3.12", `Candidate image ${image.family} must record Python 3.12`);
  check(image.status === "READY", `Candidate image ${image.family} must be READY`);
  check(image.compatibleWithWheelhouse === false, `Candidate image ${image.family} must be incompatible with cp313`);
}

check(result.createPlan?.vmCreateCommandShapeDrafted === true, "VM create command shape must be drafted");
check(result.createPlan?.vmCleanupCommandShapeDrafted === true, "VM cleanup command shape must be drafted");
check(result.createPlan?.vmCreateExecutionReady === false, "VM create execution must remain blocked");
check(
  result.createPlan?.pythonRuntimeCompatibleWithWheelhouse === false,
  "Python runtime must be marked incompatible with wheelhouse"
);
check(
  result.createPlan?.nextGateRequiresPythonRuntimeAlignment === true,
  "Next gate must require Python runtime alignment"
);

for (const [flag, value] of Object.entries(result.runtimeFlags ?? {})) {
  check(value === false, `Runtime flag ${flag} must be false`);
}
for (const [flag, value] of Object.entries(changeLog.runtimeFlags ?? {})) {
  check(value === false, `Change-log runtime flag ${flag} must be false`);
}

const resultText = read("docs/ai-video-broll-generation-gcp-private-vm-create-plan.md");
for (const snippet of REQUIRED_COMMAND_SNIPPETS) {
  check(resultText.includes(snippet), `Result missing command snippet: ${snippet}`);
}

const nextPrompt = read("docs/implementation-prompts/prompt-ai-video-broll-gen-9j-python-runtime-alignment.md");
for (const expected of [
  EXPECTED_NEXT_PROMPT,
  EXPECTED_FOLLOWUP_PROMPT,
  "Python 3.13",
  "cp313",
  "Python 3.12",
  "Do not create a VM",
  "Do not import models"
]) {
  check(nextPrompt.includes(expected), `Python alignment prompt missing: ${expected}`);
}

const sidecars = fs.readdirSync(EXPECTED_WHEELHOUSE).filter((name) => name.startsWith("._"));
check(sidecars.length === 0, `Wheelhouse contains AppleDouble sidecars: ${sidecars.join(", ")}`);

ensureSafeText([
  "docs/ai-video-broll-generation-gcp-private-vm-create-plan.md",
  "docs/ai-video-broll-generation-gcp-private-vm-create-plan-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-python-runtime-alignment.md"
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
  vmCreateCommandShapeDrafted: result.createPlan.vmCreateCommandShapeDrafted,
  vmCreateExecutionReady: result.createPlan.vmCreateExecutionReady,
  wheelhousePython: result.wheelhouseRuntime.pythonVersion,
  wheelhouseAbi: result.wheelhouseRuntime.abi,
  candidateImagePython: "3.12",
  pythonRuntimeCompatibleWithWheelhouse: result.createPlan.pythonRuntimeCompatibleWithWheelhouse,
  nextGateRequiresPythonRuntimeAlignment: result.createPlan.nextGateRequiresPythonRuntimeAlignment,
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
