#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { QWEN2_5_VL_CLOUD_RUN_GPU_VLLM_ENGINE_PROOF_RESULT } from "../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-vllm-engine-proof-result.ts";

const ROOT = process.cwd();
const DECISION = "qwen2_5_vl_7b_cloud_run_gpu_vllm_engine_proof_passed_bounded_l4_no_inference";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_30-CLOUD-RUN-GPU-VLLM-APPROVED-SNAPSHOT-RUNTIME-CONTRACT: define the approved-snapshot request contract for the fail-closed Cloud Run service, no inference";
const IMAGE_DIGEST = "sha256:35a7265a40272ac66938499f4f2c33f03855810d1677a49e9531b4f3740c4c39";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-vllm-engine-proof-result.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-vllm-engine-proof-result-change-log.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-vllm-engine-proof-result.ts",
  "scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-vllm-engine-proof-result-diagnostics.mjs",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-model-load-proof-result.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-model-import-proof-result.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-mount-read-proof-result.md",
  "docker/prod/qwen2-5-vl-cloud-run-gpu/Dockerfile",
  "package.json"
];

const REQUIRED_DOC_PHRASES = [
  DECISION,
  "| Dockerfile package added | `build-essential` |",
  "| Cloud Build ID | `b7ea9d0e-b95c-4fa5-8590-14cb11165cc7` |",
  `| Image digest | \`${IMAGE_DIGEST}\` |`,
  "| Proof job | `qwen25vl-vllm-engine-proof-0627030150` |",
  "| Proof execution | `qwen25vl-vllm-engine-proof-0627030150-7b7gv` |",
  "| Completion status | success |",
  "| Execution duration | `7m24.02s` |",
  "| Script elapsed time | `354.45s` |",
  "| vLLM engine initialization time | `314.8s` |",
  "| GPU | `1` x `nvidia-l4` |",
  "| CPU | `8` |",
  "| Memory | `32Gi` |",
  "| Proof job deleted | true |",
  "| Runtime | `vllm` |",
  "| vLLM version | `0.11.0` |",
  "| Torch version | `2.8.0+cu128` |",
  "| max model length | `1024` |",
  "| explicit KV cache memory bytes | `536870912` |",
  "| multimodal prompt limit | `image=1, video=0` |",
  "| CUDA device name | `NVIDIA L4` |",
  "| vLLM engine initialized | true |",
  "| Updated ready revision | `reeditpro-qwen2-5-vl-l4-worker-00003-9qh` |",
  "`vllmEngineInitialized=true`",
  "`forwardPassRun=false`",
  "`promptProcessed=false`",
  "`inferenceRun=false`",
  "`serviceRuntimeRequestSent=false`",
  "`generatedLocalFixturePassedClaimed=false`",
  "The current cost-friendly decision is to keep Qwen2.5-VL 7B on Cloud Run L4",
  NEXT_PROMPT
];

const TRUE_FLAGS = [
  "compilerReadyImageBuilt",
  "compilerReadyImageUsed",
  "cloudRunGpuJobCreated",
  "cloudRunGpuJobDeleted",
  "gpuRequested",
  "torchImported",
  "vllmImported",
  "cudaAvailable",
  "cudaL4Visible",
  "vllmEngineInitializationAttempted",
  "vllmEngineInitialized",
  "vllmEngineDeletedBeforeExit",
  "cudaCacheClearedBeforeExit",
  "cloudRunServiceUpdated",
  "cloudRunRevisionReady",
  "minInstancesZero",
  "maxInstancesOne",
  "boundedPreviewConfigUsed"
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
  ["service request true claim", /\b(serviceRuntimeRequestSent|apiServerInvoked)\b\s*[:=]\s*(true|"true")/i],
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
  packageJson.scripts?.["qwen2-5-vl-7b-cloud-run-gpu-vllm-engine-proof-result:diagnostics"] ===
    "tsx scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-vllm-engine-proof-result-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-cloud-run-gpu-vllm-engine-proof-result:diagnostics"
);

const doc = read("docs/qwen2-5-vl-7b-cloud-run-gpu-vllm-engine-proof-result.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-cloud-run-gpu-vllm-engine-proof-result-change-log.md",
  "qwen2-5-vl-7b-cloud-run-gpu-vllm-engine-proof-result-change-log"
);
const spec = QWEN2_5_VL_CLOUD_RUN_GPU_VLLM_ENGINE_PROOF_RESULT;
const dockerfile = read("docker/prod/qwen2-5-vl-cloud-run-gpu/Dockerfile");

includesAll(doc, REQUIRED_DOC_PHRASES, "vLLM engine proof result doc");
check(dockerfile.includes("build-essential libnuma1"), "Dockerfile must include build-essential and libnuma1");

check(changeLog.decision === DECISION, "Change log decision mismatch");
check(spec.decision === DECISION, "Spec decision mismatch");
check(spec.compilerReadyImage.buildEssentialAdded === true, "Compiler image must add build-essential");
check(spec.compilerReadyImage.imageDigest === IMAGE_DIGEST, "Compiler image digest mismatch");
check(spec.proofExecution.completedSuccessfully === true, "Proof execution must succeed");
check(spec.proofExecution.jobName === "qwen25vl-vllm-engine-proof-0627030150", "Proof job mismatch");
check(spec.proofExecution.executionName === "qwen25vl-vllm-engine-proof-0627030150-7b7gv", "Execution name mismatch");
check(spec.proofExecution.gpuType === "nvidia-l4", "GPU type mismatch");
check(spec.proofExecution.gpuCount === 1, "GPU count mismatch");
check(spec.proofExecution.cpu === 8, "CPU mismatch");
check(spec.proofExecution.memory === "32Gi", "Memory mismatch");
check(spec.proofExecution.proofJobDeleted === true, "Proof job must be deleted");
check(spec.runtimeImageAndMount.imageDigest === IMAGE_DIGEST, "Runtime image digest mismatch");
check(spec.runtimeImageAndMount.bucket === "reeditpro-staging-reeditpro-model-cache", "Bucket mismatch");
check(spec.runtimeImageAndMount.readOnlyMount === true, "Mount must be read-only");
check(spec.engineConfig.runtime === "vllm", "Runtime mismatch");
check(spec.engineConfig.vllmVersion === "0.11.0", "vLLM version mismatch");
check(spec.engineConfig.maxModelLen === 1024, "maxModelLen mismatch");
check(spec.engineConfig.maxNumSeqs === 1, "maxNumSeqs mismatch");
check(spec.engineConfig.maxNumBatchedTokens === 1024, "maxNumBatchedTokens mismatch");
check(spec.engineConfig.gpuMemoryUtilization === 0.95, "gpuMemoryUtilization mismatch");
check(spec.engineConfig.kvCacheMemoryBytes === 536870912, "kvCacheMemoryBytes mismatch");
check(spec.engineConfig.limitMmPerPrompt.image === 1, "image MM limit mismatch");
check(spec.engineConfig.limitMmPerPrompt.video === 0, "video MM limit mismatch");
check(spec.cudaAndEngineMetrics.cudaDeviceName === "NVIDIA L4", "CUDA device name mismatch");
check(spec.cudaAndEngineMetrics.vllmEngineInitialized === true, "vLLM engine must initialize");
check(spec.cudaAndEngineMetrics.cudaMemoryAllocatedAfterCleanup === 0, "CUDA allocated after cleanup mismatch");
check(spec.serviceUpdate.updatedReadyRevision === "reeditpro-qwen2-5-vl-l4-worker-00003-9qh", "Updated revision mismatch");
check(spec.serviceUpdate.runtimeRequestSent === false, "Service runtime request must be false");
check(spec.gpuDecision.selectedCostFriendlyGpu === "cloud_run_nvidia_l4", "GPU decision mismatch");
check(spec.gpuDecision.cloudRunScaleToZeroKept === true, "Scale-to-zero decision mismatch");
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
  "docs/qwen2-5-vl-7b-cloud-run-gpu-vllm-engine-proof-result.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-vllm-engine-proof-result-change-log.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-vllm-engine-proof-result.ts"
]) {
  assertNoForbiddenText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  proofJob: spec.proofExecution.jobName,
  proofJobDeleted: spec.proofExecution.proofJobDeleted,
  cudaDeviceName: spec.cudaAndEngineMetrics.cudaDeviceName,
  vllmEngineInitialized: spec.cudaAndEngineMetrics.vllmEngineInitialized,
  engineInitializationSeconds: spec.proofExecution.vllmEngineInitializationSeconds,
  selectedCostFriendlyGpu: spec.gpuDecision.selectedCostFriendlyGpu,
  selectedServingProfile: spec.gpuDecision.selectedServingProfile,
  inferenceRun: spec.runtimeFlags.inferenceRun,
  serviceRuntimeRequestSent: spec.runtimeFlags.serviceRuntimeRequestSent,
  nextPrompt: NEXT_PROMPT
}, null, 2));
