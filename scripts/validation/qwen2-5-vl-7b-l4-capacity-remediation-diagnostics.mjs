#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DECISION = "qwen2_5_vl_7b_l4_capacity_remediation_ready_for_us_east4_a_reservation_create_no_vm_no_inference";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_9-RESERVATION-CREATE-US-EAST4-A: create bounded L4 reservation for Qwen proof in us-east4-a, no VM/no inference";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-l4-capacity-remediation-result.md",
  "docs/qwen2-5-vl-7b-l4-capacity-remediation-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-reservation-create-us-east4-a.md",
  "docs/qwen2-5-vl-7b-l4-reservation-create-us-east1-b-retry-result.md",
  "docs/qwen2-5-vl-7b-l4-reservation-create-us-east1-c-result.md",
  "docs/qwen2-5-vl-7b-l4-reservation-create-us-west4-c-result.md",
  "docs/qwen2-5-vl-7b-l4-reservation-create-us-west4-a-result.md",
  "docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md",
  "scripts/validation/qwen2-5-vl-7b-l4-capacity-remediation-diagnostics.mjs",
  "package.json"
];

const REQUIRED_RESULT_PHRASES = [
  DECISION,
  "The decision keeps NVIDIA L4 on Google Cloud G2 as the selected cost/performance GPU",
  "Changing away from L4 remains a separate GPU-selection review",
  "| Active reservations | none |",
  "| Project-wide `GPUS_ALL_REGIONS` quota | limit `1`, usage `0` |",
  "| Existing selected GPU | NVIDIA L4 on Google Cloud G2 |",
  "| Try unattempted `us-east4-a` | recommended |",
  "Select `us-east4-a` as the next bounded reservation-create target.",
  "`selectedReservationZone=us-east4-a`",
  "`gcpMutatingCommandsExecuted=false`",
  "`reservationCreateCommandAttempted=false`",
  "`reservationCreated=false`",
  "`vmCreated=false`",
  "`modelInferenceRun=false`",
  NEXT_PROMPT
];

const FALSE_FLAGS = [
  "gcpMutatingCommandsExecuted",
  "reservationCreateCommandAttempted",
  "reservationCreated",
  "reservationDeleted",
  "vmCreated",
  "diskCreated",
  "externalIpCreated",
  "networkChanged",
  "serviceAccountCreated",
  "serviceAccountKeyCreated",
  "firewallRuleCreated",
  "bucketCreated",
  "artifactRegistryImageCreated",
  "cloudRunJobCreated",
  "iapTransferExecuted",
  "sshSessionOpened",
  "dependencyInstalledOnVm",
  "runtimeImportRunOnL4",
  "cudaVisibilityCheckedOnL4",
  "vllmImportedOnL4",
  "sglangImportedOnL4",
  "apiServerStarted",
  "modelImportRun",
  "modelInferenceRun",
  "generatedVideoCreated",
  "generatedAssetsCreated",
  "providerCallsMade",
  "workersDispatched",
  "supabaseTouched",
  "sqlExecuted",
  "publicArtifactsCreated",
  "signedUrlsCreated",
  "creditMutationCreated",
  "betaUnlocked",
  "productionUnlocked",
  "dryRunPassedClaimed",
  "generatedLocalFixturePassedClaimed"
];

const FORBIDDEN_PATTERNS = [
  ["signed URL token", /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ["credential assignment", /\b(api[_-]?key|service[_-]?role|secret|password|hf[_-]?token|access[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ["database URL", /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ["remote storage URI", /\b(gs:\/\/|s3:\/\/|storage\.googleapis\.com\/)/i],
  ["raw worker prompt field", /\b(raw_worker_prompt|rawPromptPayload|raw_prompt)\b/i],
  ["runtime-ready true claim", /\b(productionReady|betaReady|runtimeReadinessClaimed)\b\s*[:=]\s*(true|"true")/i],
  ["unsafe pass claim", /\b(dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i]
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

function includesAll(text, values, label) {
  for (const value of values) {
    check(text.includes(value), `${label} missing ${value}`);
  }
}

function assertNoForbiddenText(relativePath) {
  const text = read(relativePath);
  const findings = [];
  for (const [name, pattern] of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) {
      findings.push(name);
    }
  }
  check(findings.length === 0, `Forbidden value in ${relativePath}: ${findings.join("; ")}`);
}

for (const file of REQUIRED_FILES) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
check(
  packageJson.scripts?.["qwen2-5-vl-7b-l4-capacity-remediation:diagnostics"] ===
    "node scripts/validation/qwen2-5-vl-7b-l4-capacity-remediation-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-l4-capacity-remediation:diagnostics"
);

const result = read("docs/qwen2-5-vl-7b-l4-capacity-remediation-result.md");
const prompt = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-reservation-create-us-east4-a.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-l4-capacity-remediation-change-log.md",
  "qwen2-5-vl-7b-l4-capacity-remediation-change-log"
);

includesAll(result, REQUIRED_RESULT_PHRASES, "capacity remediation result");
includesAll(prompt, [
  NEXT_PROMPT,
  "Zone: `us-east4-a`",
  "Do not create or delete a VM.",
  "Do not run inference.",
  "Do not claim `generated_local_fixture_passed`."
], "reservation create us-east4-a prompt");

for (const flag of FALSE_FLAGS) {
  includesAll(result, [`${flag}=false`], `false runtime flag ${flag}`);
}

check(changeLog.decision === DECISION, "Change log decision mismatch");
check(changeLog.capacityEvidence?.activeReservations === 0, "Active reservations must be zero");
check(changeLog.capacityEvidence?.gpusAllRegionsQuotaUsage === 0, "Global GPU usage must be zero");
check(changeLog.capacityEvidence?.selectedGpu === "nvidia_l4_google_cloud_g2", "Selected GPU mismatch");
check(changeLog.capacityEvidence?.changingGpuRejectedForThisPrompt === true, "GPU switch must be rejected");
check(changeLog.selectedRemediation?.targetRegion === "us-east4", "Target region mismatch");
check(changeLog.selectedRemediation?.targetZone === "us-east4-a", "Target zone mismatch");
check(changeLog.selectedRemediation?.regionalL4GpuQuotaLimit === 1, "Regional L4 quota limit mismatch");
check(changeLog.selectedRemediation?.regionalL4GpuQuotaUsage === 0, "Regional L4 quota usage must be zero");
check(changeLog.selectedRemediation?.machineTypeAvailable === true, "Machine type must be available");
check(changeLog.selectedRemediation?.acceleratorAvailable === true, "Accelerator must be available");
check(changeLog.selectedRemediation?.reservationPresent === false, "Reservation must be absent");
check(changeLog.selectedRemediation?.proofInstancePresent === false, "Proof instance must be absent");
check(changeLog.selectedRemediation?.reservationCreateApprovedInFuturePrompt === true, "Future reservation create should be approved");
check(changeLog.selectedRemediation?.vmCreateApprovedInFuturePrompt === false, "Future VM create must be false");
check(changeLog.selectedRemediation?.inferenceApprovedInFuturePrompt === false, "Future inference must be false");
check(changeLog.nextPrompt === NEXT_PROMPT, "Next prompt mismatch");

check(changeLog.runtimeFlags?.gcpReadOnlyCommandsExecuted === true, "Read-only commands must be recorded");
for (const flag of FALSE_FLAGS) {
  check(changeLog.runtimeFlags?.[flag] === false, `Runtime flag ${flag} must be false`);
}

for (const file of [
  "docs/qwen2-5-vl-7b-l4-capacity-remediation-result.md",
  "docs/qwen2-5-vl-7b-l4-capacity-remediation-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-reservation-create-us-east4-a.md"
]) {
  assertNoForbiddenText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  selectedGpu: "nvidia_l4_google_cloud_g2",
  selectedReservationZone: "us-east4-a",
  gcpMutatingCommandsExecuted: false,
  reservationCreated: false,
  vmCreated: false,
  modelInferenceRun: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
