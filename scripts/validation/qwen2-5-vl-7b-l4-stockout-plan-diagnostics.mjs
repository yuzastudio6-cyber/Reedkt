#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DECISION = "qwen2_5_vl_7b_l4_stockout_plan_ready_for_us_central1_a_retry_no_inference";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_9-RETRY-US-CENTRAL1-A: run Qwen2.5-VL L4 CUDA visibility and vLLM import proof in us-central1-a, no inference";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-l4-stockout-plan-result.md",
  "docs/qwen2-5-vl-7b-l4-stockout-plan-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-cuda-vllm-import-proof-retry-us-central1-a.md",
  "docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-retry-result.md",
  "docs/qwen2-5-vl-7b-gpus-all-regions-quota-fix-result.md",
  "scripts/validation/qwen2-5-vl-7b-l4-stockout-plan-diagnostics.mjs",
  "package.json"
];

const REQUIRED_RESULT_PHRASES = [
  DECISION,
  "This is a planning-only result.",
  "| `g2-standard-8` visible in `us-central1-a` | true |",
  "| `nvidia-l4` visible in `us-central1-a` | true |",
  "| `us-central1-a` status | `UP` |",
  "| Regional `NVIDIA_L4_GPUS` quota | limit `1`, usage `0` |",
  "| Project-wide `GPUS_ALL_REGIONS` quota | limit `1`, usage `0` |",
  "Select `us-central1-a` as the next bounded retry target.",
  "`us-central1-c` remains the second same-region retry candidate",
  "Qwen2.5-VL remains a visual understanding, planning, and QA stack tool",
  NEXT_PROMPT
];

const TRUE_FLAGS = ["gcpReadOnlyCommandsExecuted", "alternateZoneSelected"];
const FALSE_FLAGS = [
  "gcpMutatingCommandsExecuted",
  "vmCreated",
  "diskCreated",
  "externalIpCreated",
  "networkChanged",
  "serviceAccountCreated",
  "serviceAccountKeyCreated",
  "firewallRuleCreated",
  "reservationCreated",
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
  packageJson.scripts?.["qwen2-5-vl-7b-l4-stockout-plan:diagnostics"] ===
    "node scripts/validation/qwen2-5-vl-7b-l4-stockout-plan-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-l4-stockout-plan:diagnostics"
);

const result = read("docs/qwen2-5-vl-7b-l4-stockout-plan-result.md");
const retryPrompt = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-cuda-vllm-import-proof-retry-us-central1-a.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-l4-stockout-plan-change-log.md",
  "qwen2-5-vl-7b-l4-stockout-plan-change-log"
);

includesAll(result, REQUIRED_RESULT_PHRASES, "stockout plan result");
includesAll(retryPrompt, [
  NEXT_PROMPT,
  "Selected retry zone: `us-central1-a`",
  "Create one no-public-IP `g2-standard-8` VM in `us-central1-a`",
  "Do not run inference.",
  "Do not claim `generated_local_fixture_passed`."
], "us-central1-a retry prompt");

for (const flag of TRUE_FLAGS) {
  includesAll(result, [`${flag}=true`], `true runtime flag ${flag}`);
}
for (const flag of FALSE_FLAGS) {
  includesAll(result, [`${flag}=false`], `false runtime flag ${flag}`);
}

check(changeLog.decision === DECISION, "Change log decision mismatch");
check(changeLog.readOnlyAvailability?.selectedRetryZone === "us-central1-a", "Selected retry zone mismatch");
check(changeLog.readOnlyAvailability?.secondRetryCandidateZone === "us-central1-c", "Second retry zone mismatch");
check(changeLog.readOnlyAvailability?.usCentral1aMachineTypeVisible === true, "us-central1-a machine type visibility mismatch");
check(changeLog.readOnlyAvailability?.usCentral1aAcceleratorVisible === true, "us-central1-a accelerator visibility mismatch");
check(changeLog.readOnlyAvailability?.regionalL4GpuQuotaLimit === 1, "Regional L4 quota limit mismatch");
check(changeLog.readOnlyAvailability?.globalGpusAllRegionsQuotaLimit === 1, "Global GPU quota limit mismatch");
check(changeLog.readOnlyAvailability?.exactProofResourcesAbsentInSelectedZone === true, "Selected zone resources must be absent");
check(changeLog.nextPrompt === NEXT_PROMPT, "Next prompt mismatch");

for (const flag of TRUE_FLAGS) {
  check(changeLog.runtimeFlags?.[flag] === true, `Change log runtime flag ${flag} must be true`);
}
for (const flag of FALSE_FLAGS) {
  check(changeLog.runtimeFlags?.[flag] === false, `Change log runtime flag ${flag} must be false`);
}

for (const file of [
  "docs/qwen2-5-vl-7b-l4-stockout-plan-result.md",
  "docs/qwen2-5-vl-7b-l4-stockout-plan-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-cuda-vllm-import-proof-retry-us-central1-a.md"
]) {
  assertNoForbiddenText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  selectedRetryZone: "us-central1-a",
  secondRetryCandidateZone: "us-central1-c",
  selectedMachineType: "g2-standard-8",
  selectedGpu: "nvidia_l4_google_cloud_g2_first",
  globalGpusAllRegionsQuotaLimit: 1,
  globalGpusAllRegionsQuotaUsage: 0,
  gcpMutatingCommandsExecuted: false,
  vmCreated: false,
  cudaVisibilityCheckedOnL4: false,
  vllmImportedOnL4: false,
  modelInferenceRun: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
