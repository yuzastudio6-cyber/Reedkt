#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DECISION = "qwen2_5_vl_7b_l4_capacity_followup_ready_for_us_east1_b_retry_no_inference";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_9-RETRY-US-EAST1-B: run Qwen2.5-VL L4 CUDA visibility and vLLM import proof in us-east1-b, no inference";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-l4-capacity-followup-result.md",
  "docs/qwen2-5-vl-7b-l4-capacity-followup-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-cuda-vllm-import-proof-retry-us-east1-b.md",
  "docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-west1-a-result.md",
  "docs/qwen2-5-vl-7b-l4-capacity-review-result.md",
  "docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-central1-c-result.md",
  "scripts/validation/qwen2-5-vl-7b-l4-capacity-followup-diagnostics.mjs",
  "package.json"
];

const REQUIRED_RESULT_PHRASES = [
  DECISION,
  "`us-central1-b`, `us-central1-a`, `us-central1-c`, and `us-west1-a`",
  "| Project-wide `GPUS_ALL_REGIONS` quota | limit `1`, usage `0` |",
  "| `us-east1` `NVIDIA_L4_GPUS` quota | limit `1`, usage `0` |",
  "| `us-east1-b` | true | true |",
  "| Alternate U.S. region retry | recommended |",
  "| Reservation/capacity assurance | later approval only |",
  "| Smaller import-smoke shape | not product-valid as runtime proof |",
  "Select `us-east1-b` as the next bounded retry target.",
  "Qwen2.5-VL remains a visual understanding, planning, and QA stack tool",
  NEXT_PROMPT
];

const TRUE_FLAGS = [
  "gcpReadOnlyCommandsExecuted",
  "alternateRegionRetrySelected"
];

const FALSE_FLAGS = [
  "gcpMutatingCommandsExecuted",
  "reservationRecommendedNow",
  "reservationCreated",
  "smallerImportSmokeRecommended",
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
  packageJson.scripts?.["qwen2-5-vl-7b-l4-capacity-followup:diagnostics"] ===
    "node scripts/validation/qwen2-5-vl-7b-l4-capacity-followup-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-l4-capacity-followup:diagnostics"
);

const result = read("docs/qwen2-5-vl-7b-l4-capacity-followup-result.md");
const prompt = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-cuda-vllm-import-proof-retry-us-east1-b.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-l4-capacity-followup-change-log.md",
  "qwen2-5-vl-7b-l4-capacity-followup-change-log"
);

includesAll(result, REQUIRED_RESULT_PHRASES, "capacity followup result");
includesAll(prompt, [
  NEXT_PROMPT,
  "Selected retry zone: `us-east1-b`",
  "Create one no-public-IP `g2-standard-8` VM in `us-east1-b`",
  "Do not run inference.",
  "Do not claim `generated_local_fixture_passed`."
], "us-east1-b retry prompt");

for (const flag of TRUE_FLAGS) {
  includesAll(result, [`${flag}=true`], `true runtime flag ${flag}`);
}
for (const flag of FALSE_FLAGS) {
  includesAll(result, [`${flag}=false`], `false runtime flag ${flag}`);
}

check(changeLog.decision === DECISION, "Change log decision mismatch");
check(changeLog.readOnlyCapacityReview?.selectedRetryRegion === "us-east1", "Selected retry region mismatch");
check(changeLog.readOnlyCapacityReview?.selectedRetryZone === "us-east1-b", "Selected retry zone mismatch");
check(changeLog.readOnlyCapacityReview?.globalGpusAllRegionsQuotaLimit === 1, "Global GPU quota limit mismatch");
check(changeLog.readOnlyCapacityReview?.globalGpusAllRegionsQuotaUsage === 0, "Global GPU quota usage mismatch");
check(changeLog.readOnlyCapacityReview?.selectedRetryRegionalL4GpuQuotaLimit === 1, "Regional L4 quota limit mismatch");
check(changeLog.readOnlyCapacityReview?.selectedRetryRegionalL4GpuQuotaUsage === 0, "Regional L4 quota usage mismatch");
check(changeLog.readOnlyCapacityReview?.exactShapeVisibleInSelectedZone === true, "Selected zone exact shape must be visible");
check(changeLog.optionDecision?.alternateUsRegionRetry === "recommended", "Alternate U.S. retry must be recommended");
check(changeLog.optionDecision?.reservationPlanning === "later_if_us_east1_b_stocks_out", "Reservation planning decision mismatch");
check(changeLog.optionDecision?.smallerImportSmoke === "not_product_valid_runtime_proof", "Smaller smoke decision mismatch");
check(changeLog.nextPrompt === NEXT_PROMPT, "Next prompt mismatch");

for (const flag of TRUE_FLAGS) {
  check(changeLog.runtimeFlags?.[flag] === true, `Change log runtime flag ${flag} must be true`);
}
for (const flag of FALSE_FLAGS) {
  check(changeLog.runtimeFlags?.[flag] === false, `Change log runtime flag ${flag} must be false`);
}

for (const file of [
  "docs/qwen2-5-vl-7b-l4-capacity-followup-result.md",
  "docs/qwen2-5-vl-7b-l4-capacity-followup-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-cuda-vllm-import-proof-retry-us-east1-b.md"
]) {
  assertNoForbiddenText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  selectedRetryRegion: "us-east1",
  selectedRetryZone: "us-east1-b",
  selectedMachineType: "g2-standard-8",
  selectedGpu: "nvidia_l4_google_cloud_g2_first",
  reservationRecommendedNow: false,
  smallerImportSmokeRecommended: false,
  gcpMutatingCommandsExecuted: false,
  vmCreated: false,
  cudaVisibilityCheckedOnL4: false,
  vllmImportedOnL4: false,
  modelInferenceRun: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
