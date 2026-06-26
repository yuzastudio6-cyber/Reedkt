#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DECISION = "qwen2_5_vl_7b_l4_cuda_vllm_import_proof_us_west1_a_blocked_by_g2_l4_zonal_stockout";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_9-CAPACITY-FOLLOWUP: compare scheduled retry, reservation, and smaller import-smoke options after L4 stockout, no VM/no inference";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-west1-a-result.md",
  "docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-west1-a-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-capacity-followup.md",
  "docs/qwen2-5-vl-7b-l4-capacity-review-result.md",
  "docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-central1-c-result.md",
  "docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-central1-a-result.md",
  "docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-retry-result.md",
  "scripts/validation/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-west1-a-diagnostics.mjs",
  "package.json"
];

const REQUIRED_RESULT_PHRASES = [
  DECISION,
  "`us-central1-b`, `us-central1-a`, `us-central1-c`, and `us-west1-a` have now all returned zonal stockout",
  "| Target zone | `us-west1-a` |",
  "| Regional `NVIDIA_L4_GPUS` quota | limit `1`, usage `0` |",
  "| Project-wide `GPUS_ALL_REGIONS` quota | limit `1`, usage `0` |",
  "| Private Linux wheelhouse | present, 158 wheels |",
  "ZONE_RESOURCE_POOL_EXHAUSTED_WITH_DETAILS",
  "state: STOCKOUT",
  "approved create command attempted: true",
  "blocked by zonal stockout: true",
  "cross-region retry attempted: true",
  "VM created: false",
  "cleanup verified: true",
  "Qwen2.5-VL remains a visual understanding, planning, and QA stack tool",
  NEXT_PROMPT
];

const TRUE_FLAGS = [
  "gcpReadOnlyCommandsExecuted",
  "gcpMutatingCommandsExecuted",
  "approvedCreateCommandAttempted",
  "blockedByZonalStockout",
  "crossRegionRetryAttempted"
];

const FALSE_FLAGS = [
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
  "quotaRequestCreated",
  "reservationCreated",
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
  packageJson.scripts?.["qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-west1-a:diagnostics"] ===
    "node scripts/validation/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-west1-a-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-west1-a:diagnostics"
);

const result = read("docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-west1-a-result.md");
const prompt = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-capacity-followup.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-west1-a-change-log.md",
  "qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-west1-a-change-log"
);

includesAll(result, REQUIRED_RESULT_PHRASES, "us-west1-a result");
includesAll(prompt, [
  NEXT_PROMPT,
  "This is no-VM/no-inference planning.",
  "Do not create or delete a VM.",
  "Do not run inference.",
  "Do not claim `generated_local_fixture_passed`."
], "capacity followup prompt");

for (const flag of TRUE_FLAGS) {
  includesAll(result, [`${flag}=true`], `true runtime flag ${flag}`);
}
for (const flag of FALSE_FLAGS) {
  includesAll(result, [`${flag}=false`], `false runtime flag ${flag}`);
}

check(changeLog.decision === DECISION, "Change log decision mismatch");
check(changeLog.preflight?.targetZone === "us-west1-a", "Target zone mismatch");
check(changeLog.preflight?.targetRegion === "us-west1", "Target region mismatch");
check(changeLog.preflight?.globalGpusAllRegionsQuotaLimit === 1, "Global GPU quota limit mismatch");
check(changeLog.preflight?.regionalL4GpuQuotaLimit === 1, "Regional L4 quota limit mismatch");
check(changeLog.preflight?.privateWheelhouseWheelCount === 158, "Private wheelhouse count mismatch");
check(changeLog.createAttempt?.approvedCreateCommandAttempted === true, "Approved create attempt must be recorded");
check(changeLog.createAttempt?.blockedByQuota === false, "Create attempt must not be quota-blocked");
check(changeLog.createAttempt?.blockedByZonalStockout === true, "Create attempt must be stockout-blocked");
check(changeLog.postAttemptResourceState?.proofInstancePresent === false, "Proof instance must be absent");
check(changeLog.postAttemptResourceState?.regionalL4GpuQuotaUsageAfterAttempt === 0, "Regional L4 usage must remain zero");
check(changeLog.postAttemptResourceState?.globalGpusAllRegionsQuotaUsageAfterAttempt === 0, "Global GPU usage must remain zero");
check(changeLog.postAttemptResourceState?.cleanupVerified === true, "Cleanup must be verified");
check(changeLog.nextPrompt === NEXT_PROMPT, "Next prompt mismatch");

for (const flag of TRUE_FLAGS) {
  check(changeLog.runtimeFlags?.[flag] === true, `Change log runtime flag ${flag} must be true`);
}
for (const flag of FALSE_FLAGS) {
  check(changeLog.runtimeFlags?.[flag] === false, `Change log runtime flag ${flag} must be false`);
}

for (const file of [
  "docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-west1-a-result.md",
  "docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-west1-a-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-capacity-followup.md"
]) {
  assertNoForbiddenText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  attemptedZone: "us-west1-a",
  selectedMachineType: "g2-standard-8",
  selectedGpu: "nvidia_l4_google_cloud_g2_first",
  approvedCreateCommandAttempted: true,
  blockedByZonalStockout: true,
  crossRegionRetryAttempted: true,
  vmCreated: false,
  cleanupVerified: true,
  cudaVisibilityCheckedOnL4: false,
  vllmImportedOnL4: false,
  modelInferenceRun: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
