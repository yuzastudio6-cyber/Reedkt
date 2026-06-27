#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { QWEN2_5_VL_CLOUD_RUN_GPU_MODEL_LOAD_PROOF_RESULT } from "../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-model-load-proof-result.ts";

const ROOT = process.cwd();
const DECISION = "qwen2_5_vl_7b_cloud_run_gpu_model_load_proof_passed_no_inference";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_29-CLOUD-RUN-GPU-VLLM-ENGINE-PROOF: verify vLLM engine initialization from private mount on L4, no inference";
const IMAGE_DIGEST = "sha256:572acc29405cee48a42baf98f39d949915b8ef14df638736b886673efc47b630";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-model-load-proof-result.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-model-load-proof-result-change-log.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-model-load-proof-result.ts",
  "scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-model-load-proof-result-diagnostics.mjs",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-model-import-proof-result.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-mount-read-proof-result.md",
  "package.json"
];

const REQUIRED_DOC_PHRASES = [
  DECISION,
  "| Proof job | `qwen25vl-model-load-proof-0627013557` |",
  "| Proof execution | `qwen25vl-model-load-proof-0627013557-t9d4z` |",
  "| Completion status | success |",
  "| Execution duration | `8m51.75s` |",
  "| Script elapsed time | `440.926s` |",
  "| Checkpoint load time | `46.239s` |",
  "| GPU | `1` x `nvidia-l4` |",
  "| CPU | `8` |",
  "| Memory | `32Gi` |",
  "| Proof job deleted | true |",
  `| Image digest | \`${IMAGE_DIGEST}\` |`,
  "| Bucket | `reeditpro-staging-reeditpro-model-cache` |",
  "| Loader | `Qwen2_5_VLForConditionalGeneration.from_pretrained` |",
  "| Load dtype | `bfloat16` |",
  "| Accelerate imported | false |",
  "| Accelerate missing reason | `No module named 'accelerate'` |",
  "| Load strategy | `transformers_from_pretrained_then_to_cuda` |",
  "| Model moved to CUDA | true |",
  "| Model eval set | true |",
  "| Model deleted before exit | true |",
  "| CUDA cache cleared before exit | true |",
  "| Torch version | `2.8.0+cu128` |",
  "| Transformers version | `4.57.1` |",
  "| CUDA device name | `NVIDIA L4` |",
  "| Parameter count | `8292166656` |",
  "| CUDA parameter count | `8292166656` |",
  "| Parameter dtype | `torch.bfloat16` |",
  "| Parameter device | `cuda:0` |",
  "| CUDA memory allocated after load | `16584369664` |",
  "| CUDA memory reserved after load | `16590569472` |",
  "`modelWeightsLoaded=true`",
  "`modelLoadRun=true`",
  "`forwardPassRun=false`",
  "`promptProcessed=false`",
  "`inferenceRun=false`",
  "`generatedLocalFixturePassedClaimed=false`",
  NEXT_PROMPT
];

const TRUE_FLAGS = [
  "cloudRunGpuJobCreated",
  "cloudRunGpuJobDeleted",
  "gpuRequested",
  "torchImported",
  "transformersImported",
  "cudaAvailable",
  "cudaL4Visible",
  "modelWeightsLoaded",
  "modelLoadRun",
  "modelMovedToCuda",
  "modelEvalSet",
  "parameterCountComputed",
  "modelDeletedBeforeExit",
  "cudaCacheClearedBeforeExit"
];

const FALSE_FLAGS = [
  "forwardPassRun",
  "promptProcessed",
  "inferenceRun",
  "serviceRuntimeRequestSent",
  "providerCallsMade",
  "workersDispatched",
  "supabaseTouched",
  "sqlExecuted",
  "generatedAssetsCreated",
  "publicArtifactsCreated",
  "signedUrlsCreated",
  "creditMutationCreated",
  "betaUnlocked",
  "productionUnlocked",
  "dryRunPassedClaimed",
  "generatedLocalFixturePassedClaimed"
];

const FORBIDDEN_PATTERNS = [
  ["http URL", /\bhttps?:\/\/(?!127\.0\.0\.1|localhost)/i],
  ["signed URL token", /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ["credential assignment", /\b(api[_-]?key|secret|password|hf[_-]?token|access[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ["database URL", /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ["public storage endpoint", /\bstorage\.googleapis\.com\//i],
  ["raw worker prompt field", /\b(raw_worker_prompt|rawPromptPayload|raw_prompt)\b/i],
  ["inference true claim", /\b(inferenceRun|forwardPassRun|promptProcessed)\b\s*[:=]\s*(true|"true")/i],
  ["runtime-ready true claim", /\b(productionReady|betaReady|runtimeReadinessClaimed|claimsRuntimeReady|claimsBetaReady|claimsProductionReady)\b\s*[:=]\s*(true|"true")/i],
  ["unsafe pass claim", /\b(dryRunPassedClaimed|generatedLocalFixturePassedClaimed|claimsDryRunPassed|claimsGeneratedLocalFixturePassed)\b\s*[:=]\s*(true|"true")/i]
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
  packageJson.scripts?.["qwen2-5-vl-7b-cloud-run-gpu-model-load-proof-result:diagnostics"] ===
    "tsx scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-model-load-proof-result-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-cloud-run-gpu-model-load-proof-result:diagnostics"
);

const doc = read("docs/qwen2-5-vl-7b-cloud-run-gpu-model-load-proof-result.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-cloud-run-gpu-model-load-proof-result-change-log.md",
  "qwen2-5-vl-7b-cloud-run-gpu-model-load-proof-result-change-log"
);
const spec = QWEN2_5_VL_CLOUD_RUN_GPU_MODEL_LOAD_PROOF_RESULT;

includesAll(doc, REQUIRED_DOC_PHRASES, "model load proof result doc");

check(changeLog.decision === DECISION, "Change log decision mismatch");
check(spec.decision === DECISION, "Spec decision mismatch");
check(spec.proofExecution.completedSuccessfully === true, "Proof execution must succeed");
check(spec.proofExecution.jobName === "qwen25vl-model-load-proof-0627013557", "Proof job mismatch");
check(spec.proofExecution.executionName === "qwen25vl-model-load-proof-0627013557-t9d4z", "Execution name mismatch");
check(spec.proofExecution.gpuType === "nvidia-l4", "GPU type mismatch");
check(spec.proofExecution.gpuCount === 1, "GPU count mismatch");
check(spec.proofExecution.cpu === 8, "CPU mismatch");
check(spec.proofExecution.memory === "32Gi", "Memory mismatch");
check(spec.proofExecution.proofJobDeleted === true, "Proof job must be deleted");
check(spec.runtimeImageAndMount.imageDigest === IMAGE_DIGEST, "Image digest mismatch");
check(spec.runtimeImageAndMount.bucket === "reeditpro-staging-reeditpro-model-cache", "Bucket mismatch");
check(spec.runtimeImageAndMount.readOnlyMount === true, "Mount must be read-only");
check(spec.loadStrategy.accelerateImported === false, "Accelerate flag mismatch");
check(spec.loadStrategy.strategy === "transformers_from_pretrained_then_to_cuda", "Load strategy mismatch");
check(spec.loadStrategy.modelMovedToCuda === true, "Model must move to CUDA");
check(spec.loadStrategy.modelDeletedBeforeExit === true, "Model deletion flag mismatch");
check(spec.loadStrategy.cudaCacheClearedBeforeExit === true, "CUDA cleanup flag mismatch");
check(spec.cudaAndModelMetrics.cudaDeviceName === "NVIDIA L4", "CUDA device name mismatch");
check(spec.cudaAndModelMetrics.parameterCount === 8292166656, "Parameter count mismatch");
check(spec.cudaAndModelMetrics.cudaParameterCount === 8292166656, "CUDA parameter count mismatch");
check(spec.cudaAndModelMetrics.dtypeParameterCounts["torch.bfloat16"] === 8292166656, "dtype parameter count mismatch");
check(spec.cudaAndModelMetrics.deviceParameterCounts["cuda:0"] === 8292166656, "device parameter count mismatch");
check(spec.cudaAndModelMetrics.cudaMemoryAllocatedAfterLoad === 16584369664, "CUDA allocated after load mismatch");
check(spec.cudaAndModelMetrics.cudaMemoryReservedAfterLoad === 16590569472, "CUDA reserved after load mismatch");
check(spec.nextPrompt === NEXT_PROMPT, "Spec next prompt mismatch");
check(changeLog.nextPrompt === NEXT_PROMPT, "Change log next prompt mismatch");

for (const flag of TRUE_FLAGS) {
  check(spec.runtimeFlags?.[flag] === true, `Spec runtime flag ${flag} must be true`);
  check(changeLog.runtimeFlags?.[flag] === true, `Change log runtime flag ${flag} must be true`);
}
for (const flag of FALSE_FLAGS) {
  check(spec.runtimeFlags?.[flag] === false, `Spec runtime flag ${flag} must be false`);
  check(changeLog.runtimeFlags?.[flag] === false, `Change log runtime flag ${flag} must be false`);
}

for (const file of [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-model-load-proof-result.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-model-load-proof-result-change-log.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-model-load-proof-result.ts"
]) {
  assertNoForbiddenText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  proofJob: spec.proofExecution.jobName,
  proofJobDeleted: spec.proofExecution.proofJobDeleted,
  cudaDeviceName: spec.cudaAndModelMetrics.cudaDeviceName,
  parameterCount: spec.cudaAndModelMetrics.parameterCount,
  cudaMemoryAllocatedAfterLoad: spec.cudaAndModelMetrics.cudaMemoryAllocatedAfterLoad,
  modelWeightsLoaded: spec.runtimeFlags.modelWeightsLoaded,
  inferenceRun: spec.runtimeFlags.inferenceRun,
  nextPrompt: NEXT_PROMPT
}, null, 2));
