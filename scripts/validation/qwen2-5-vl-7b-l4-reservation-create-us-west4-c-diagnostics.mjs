#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DECISION = "qwen2_5_vl_7b_l4_reservation_create_us_west4_c_blocked_by_gpu_availability_no_vm_no_inference";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_9-RESERVATION-CREATE-US-EAST1-C: create bounded L4 reservation for Qwen proof in us-east1-c, no VM/no inference";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-l4-reservation-create-us-west4-c-result.md",
  "docs/qwen2-5-vl-7b-l4-reservation-create-us-west4-c-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-reservation-create-us-east1-c.md",
  "docs/qwen2-5-vl-7b-l4-reservation-create-us-west4-a-result.md",
  "docs/qwen2-5-vl-7b-l4-reservation-capacity-followup-result.md",
  "docs/qwen2-5-vl-7b-l4-reservation-create-result.md",
  "docs/qwen2-5-vl-7b-l4-reservation-approval-result.md",
  "scripts/validation/qwen2-5-vl-7b-l4-reservation-create-us-west4-c-diagnostics.mjs",
  "package.json"
];

const REQUIRED_RESULT_PHRASES = [
  DECISION,
  "Google Cloud rejected the reservation create before a reservation existed",
  "| Target zone | `us-west4-c` |",
  "| Target reservation before create | absent |",
  "| Regional `NVIDIA_L4_GPUS` quota | limit `1`, usage `0` |",
  "| Project-wide `GPUS_ALL_REGIONS` quota | limit `1`, usage `0` |",
  "Reservation name: `reeditpro-qwen2-5-vl-l4-proof-reservation`",
  "Specific reservation required: true",
  "ZONE_RESOURCE_POOL_EXHAUSTED",
  "reason: gpu_availability",
  "| Reservation `reeditpro-qwen2-5-vl-l4-proof-reservation` in `us-west4-c` | absent |",
  "| `g2-standard-8` in `us-east1-c` | visible |",
  "| `nvidia-l4` in `us-east1-c` | visible |",
  "reservation create command attempted: true",
  "blocked by GPU availability: true",
  "reservation created: false",
  "cleanup verified: true",
  NEXT_PROMPT
];

const TRUE_FLAGS = [
  "gcpReadOnlyCommandsExecuted",
  "gcpMutatingCommandsExecuted",
  "reservationCreateCommandAttempted",
  "blockedByReservationGpuAvailability"
];

const FALSE_FLAGS = [
  "blockedByQuota",
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
  packageJson.scripts?.["qwen2-5-vl-7b-l4-reservation-create-us-west4-c:diagnostics"] ===
    "node scripts/validation/qwen2-5-vl-7b-l4-reservation-create-us-west4-c-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-l4-reservation-create-us-west4-c:diagnostics"
);

const result = read("docs/qwen2-5-vl-7b-l4-reservation-create-us-west4-c-result.md");
const prompt = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-reservation-create-us-east1-c.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-l4-reservation-create-us-west4-c-change-log.md",
  "qwen2-5-vl-7b-l4-reservation-create-us-west4-c-change-log"
);

includesAll(result, REQUIRED_RESULT_PHRASES, "reservation create us-west4-c result");
includesAll(prompt, [
  NEXT_PROMPT,
  "Zone: `us-east1-c`",
  "Do not create or delete a VM.",
  "Do not run inference.",
  "Do not claim `generated_local_fixture_passed`."
], "reservation create us-east1-c prompt");

for (const flag of TRUE_FLAGS) {
  includesAll(result, [`${flag}=true`], `true runtime flag ${flag}`);
}
for (const flag of FALSE_FLAGS) {
  includesAll(result, [`${flag}=false`], `false runtime flag ${flag}`);
}

check(changeLog.decision === DECISION, "Change log decision mismatch");
check(changeLog.preflight?.targetZone === "us-west4-c", "Target zone mismatch");
check(changeLog.preflight?.targetRegion === "us-west4", "Target region mismatch");
check(changeLog.preflight?.reservationPresentBeforeCreate === false, "Reservation must be absent before create");
check(changeLog.preflight?.proofInstancePresentBeforeCreate === false, "Proof instance must be absent before create");
check(changeLog.preflight?.machineTypeAvailable === true, "Machine type must be available");
check(changeLog.preflight?.acceleratorAvailable === true, "Accelerator must be available");
check(changeLog.reservationCreateAttempt?.reservationCreateCommandAttempted === true, "Reservation create attempt must be recorded");
check(changeLog.reservationCreateAttempt?.blockedByQuota === false, "Reservation attempt must not be quota-blocked");
check(changeLog.reservationCreateAttempt?.blockedByReservationGpuAvailability === true, "Reservation attempt must be GPU-availability blocked");
check(changeLog.postAttemptResourceState?.reservationPresent === false, "Reservation must be absent after attempt");
check(changeLog.postAttemptResourceState?.proofInstancePresent === false, "Proof instance must be absent");
check(changeLog.postAttemptResourceState?.regionalL4GpuQuotaUsageAfterAttempt === 0, "Regional L4 usage must remain zero");
check(changeLog.postAttemptResourceState?.globalGpusAllRegionsQuotaUsageAfterAttempt === 0, "Global GPU usage must remain zero");
check(changeLog.postAttemptResourceState?.cleanupVerified === true, "Cleanup must be verified");
check(changeLog.fallbackTarget?.selectedZone === "us-east1-c", "Fallback zone must be us-east1-c");
check(changeLog.fallbackTarget?.machineTypeAvailable === true, "Fallback machine type must be available");
check(changeLog.fallbackTarget?.acceleratorAvailable === true, "Fallback accelerator must be available");
check(changeLog.fallbackTarget?.reservationPresent === false, "Fallback reservation must be absent");
check(changeLog.nextPrompt === NEXT_PROMPT, "Next prompt mismatch");

for (const flag of TRUE_FLAGS) {
  check(changeLog.runtimeFlags?.[flag] === true, `Change log runtime flag ${flag} must be true`);
}
for (const flag of FALSE_FLAGS) {
  check(changeLog.runtimeFlags?.[flag] === false, `Change log runtime flag ${flag} must be false`);
}

for (const file of [
  "docs/qwen2-5-vl-7b-l4-reservation-create-us-west4-c-result.md",
  "docs/qwen2-5-vl-7b-l4-reservation-create-us-west4-c-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-reservation-create-us-east1-c.md"
]) {
  assertNoForbiddenText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  attemptedZone: "us-west4-c",
  reservationCreateCommandAttempted: true,
  blockedByReservationGpuAvailability: true,
  reservationCreated: false,
  vmCreated: false,
  cleanupVerified: true,
  fallbackZone: "us-east1-c",
  cudaVisibilityCheckedOnL4: false,
  vllmImportedOnL4: false,
  modelInferenceRun: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
