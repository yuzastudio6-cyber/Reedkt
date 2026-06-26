#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DECISION = "qwen2_5_vl_7b_l4_cuda_vllm_import_proof_blocked_by_gpus_all_regions_quota";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_10: request or verify GPUS_ALL_REGIONS quota for Qwen L4 import proof, no VM/no inference";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-result.md",
  "docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md",
  "docs/qwen2-5-vl-7b-linux-l4-wheelhouse-prep-result.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-gpus-all-regions-quota-fix.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-cuda-vllm-import-proof.md",
  "scripts/validation/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-diagnostics.mjs",
  "package.json"
];

const REQUIRED_DOC_PHRASES = [
  DECISION,
  "Qwen/Qwen2.5-VL-7B-Instruct",
  "cc594898137f460bfe9f0759e9844b3ce807cfb5",
  "g2-standard-8",
  "nvidia-l4",
  "us-central1-b",
  "Regional NVIDIA L4 quota | limit `1`, usage `0`",
  "Project-wide `GPUS_ALL_REGIONS` quota | limit `0`, usage `0`",
  "VM created: false",
  "L4 CUDA visibility proof attempted: false",
  "vLLM GPU import proof attempted: false",
  "Blocker: `GPUS_ALL_REGIONS` limit is `0`",
  "Qwen2.5-VL remains a visual understanding, planning, and QA stack tool",
  NEXT_PROMPT
];

const FALSE_FLAGS = [
  "gcpMutatingCommandsExecuted",
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
  packageJson.scripts?.["qwen2-5-vl-7b-l4-cuda-vllm-import-proof:diagnostics"] ===
    "node scripts/validation/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-l4-cuda-vllm-import-proof:diagnostics"
);

const doc = read("docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-result.md");
const quotaPrompt = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-gpus-all-regions-quota-fix.md");
const priorPrompt = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-cuda-vllm-import-proof.md");

includesAll(doc, REQUIRED_DOC_PHRASES, "L4 CUDA vLLM import proof result");
includesAll(quotaPrompt, [
  NEXT_PROMPT,
  "GPUS_ALL_REGIONS limit: 0",
  "Do not create a VM.",
  "Do not import CUDA runtime on a VM.",
  "Do not import vLLM on a VM.",
  "Do not run model inference.",
  "QWEN2_5_VL_STACK_TOOL_9-RETRY: run Qwen2.5-VL L4 CUDA visibility and vLLM import proof, no inference"
], "quota fix prompt");
includesAll(priorPrompt, [
  "QWEN2_5_VL_STACK_TOOL_9: run Qwen2.5-VL L4 CUDA visibility and vLLM import proof, no inference",
  "Do not run inference.",
  "Use NVIDIA L4 / Google Cloud G2 first."
], "prior L4 proof prompt");

check(doc.includes("gcpReadOnlyCommandsExecuted=true"), "Read-only GCP preflight must be recorded");
for (const flag of FALSE_FLAGS) {
  includesAll(doc, [`${flag}=false`], `false runtime flag ${flag}`);
}

for (const file of [
  "docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-result.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-gpus-all-regions-quota-fix.md"
]) {
  assertNoForbiddenText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  selectedMachineType: "g2-standard-8",
  selectedGpu: "nvidia_l4_google_cloud_g2_first",
  regionalL4QuotaLimit: 1,
  regionalL4QuotaUsage: 0,
  gpusAllRegionsQuotaLimit: 0,
  gpusAllRegionsQuotaUsage: 0,
  vmCreated: false,
  cudaVisibilityCheckedOnL4: false,
  vllmImportedOnL4: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
