#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DECISION = "qwen2_5_vl_7b_l4_cuda_vllm_import_proof_retry_blocked_by_g2_l4_zonal_stockout";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_9-STOCKOUT-PLAN: plan alternate G2/L4 zone retry or scheduled same-zone retry, no VM/no inference";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-retry-result.md",
  "docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-retry-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-stockout-plan.md",
  "docs/qwen2-5-vl-7b-gpus-all-regions-quota-fix-result.md",
  "docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md",
  "scripts/validation/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-retry-diagnostics.mjs",
  "package.json"
];

const REQUIRED_RESULT_PHRASES = [
  DECISION,
  "Google Cloud rejected the VM create before an instance existed because the zone was stocked out",
  "| Project-wide `GPUS_ALL_REGIONS` quota | limit `1`, usage `0` |",
  "ZONE_RESOURCE_POOL_EXHAUSTED_WITH_DETAILS",
  "state: STOCKOUT",
  "approved create command attempted: true",
  "blocked by zonal stockout: true",
  "VM created: false",
  "cleanup verified: true",
  "Qwen2.5-VL remains a visual understanding, planning, and QA stack tool",
  NEXT_PROMPT
];

const TRUE_FLAGS = [
  "gcpReadOnlyCommandsExecuted",
  "gcpMutatingCommandsExecuted",
  "approvedCreateCommandAttempted",
  "blockedByZonalStockout"
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
  packageJson.scripts?.["qwen2-5-vl-7b-l4-cuda-vllm-import-proof-retry:diagnostics"] ===
    "node scripts/validation/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-retry-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-l4-cuda-vllm-import-proof-retry:diagnostics"
);

const result = read("docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-retry-result.md");
const prompt = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-stockout-plan.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-retry-change-log.md",
  "qwen2-5-vl-7b-l4-cuda-vllm-import-proof-retry-change-log"
);

includesAll(result, REQUIRED_RESULT_PHRASES, "L4 proof retry result");
includesAll(prompt, [
  NEXT_PROMPT,
  "This is planning-only.",
  "Do not create or delete a VM.",
  "Do not run inference.",
  "Do not claim `generated_local_fixture_passed`."
], "stockout plan prompt");

for (const flag of TRUE_FLAGS) {
  includesAll(result, [`${flag}=true`], `true runtime flag ${flag}`);
}
for (const flag of FALSE_FLAGS) {
  includesAll(result, [`${flag}=false`], `false runtime flag ${flag}`);
}

check(changeLog.decision === DECISION, "Change log decision mismatch");
check(changeLog.preflight?.globalGpusAllRegionsQuotaLimit === 1, "Global GPU quota limit mismatch");
check(changeLog.preflight?.globalGpusAllRegionsQuotaUsage === 0, "Global GPU quota usage mismatch");
check(changeLog.preflight?.regionalL4GpuQuotaLimit === 1, "Regional L4 quota limit mismatch");
check(changeLog.preflight?.regionalL4GpuQuotaUsage === 0, "Regional L4 quota usage mismatch");
check(changeLog.createAttempt?.approvedCreateCommandAttempted === true, "Approved create attempt must be recorded");
check(changeLog.createAttempt?.blockedByQuota === false, "Create attempt must not be quota-blocked");
check(changeLog.createAttempt?.blockedByZonalStockout === true, "Create attempt must be stockout-blocked");
check(changeLog.postAttemptResourceState?.proofInstancePresent === false, "Proof instance must be absent");
check(changeLog.postAttemptResourceState?.proofDiskPresent === false, "Proof disk must be absent");
check(changeLog.postAttemptResourceState?.cleanupVerified === true, "Cleanup must be verified");
check(changeLog.nextPrompt === NEXT_PROMPT, "Next prompt mismatch");

for (const flag of TRUE_FLAGS) {
  check(changeLog.runtimeFlags?.[flag] === true, `Change log runtime flag ${flag} must be true`);
}
for (const flag of FALSE_FLAGS) {
  check(changeLog.runtimeFlags?.[flag] === false, `Change log runtime flag ${flag} must be false`);
}

for (const file of [
  "docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-retry-result.md",
  "docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-retry-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-stockout-plan.md"
]) {
  assertNoForbiddenText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  selectedMachineType: "g2-standard-8",
  selectedGpu: "nvidia_l4_google_cloud_g2_first",
  globalGpusAllRegionsQuotaLimit: 1,
  globalGpusAllRegionsQuotaUsage: 0,
  approvedCreateCommandAttempted: true,
  blockedByZonalStockout: true,
  vmCreated: false,
  cleanupVerified: true,
  cudaVisibilityCheckedOnL4: false,
  vllmImportedOnL4: false,
  modelInferenceRun: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
