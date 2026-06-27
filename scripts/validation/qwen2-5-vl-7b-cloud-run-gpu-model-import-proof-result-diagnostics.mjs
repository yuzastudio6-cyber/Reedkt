#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { QWEN2_5_VL_CLOUD_RUN_GPU_MODEL_IMPORT_PROOF_RESULT } from "../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-model-import-proof-result.ts";

const ROOT = process.cwd();
const DECISION =
  "qwen2_5_vl_7b_cloud_run_gpu_model_import_proof_passed_no_weight_load_no_inference";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_28-CLOUD-RUN-GPU-MODEL-LOAD-PROOF: verify Qwen weight load from private mount on L4, no inference";
const IMAGE_DIGEST = "sha256:572acc29405cee48a42baf98f39d949915b8ef14df638736b886673efc47b630";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-model-import-proof-result.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-model-import-proof-result-change-log.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-model-import-proof-result.ts",
  "scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-model-import-proof-result-diagnostics.mjs",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-mount-read-proof-result.md",
  "package.json"
];

const REQUIRED_DOC_PHRASES = [
  DECISION,
  "| Proof job | `qwen25vl-model-import-proof-0627012628` |",
  "| Proof execution | `qwen25vl-model-import-proof-0627012628-8x8p9` |",
  "| Completion status | success |",
  "| Execution duration | `2m55.17s` |",
  "| Script elapsed time | `26.443s` |",
  "| GPU | `1` x `nvidia-l4` |",
  "| Proof job deleted | true |",
  `| Image digest | \`${IMAGE_DIGEST}\` |`,
  "| Bucket | `reeditpro-staging-reeditpro-model-cache` |",
  "| Torch version | `2.8.0+cu128` |",
  "| CUDA available | true |",
  "| CUDA device name | `NVIDIA L4` |",
  "| Transformers version | `4.57.1` |",
  "| vLLM version | `0.11.0` |",
  "| Qwen VL utils module | `qwen_vl_utils` |",
  "| `AutoConfig.from_pretrained(..., local_files_only=true)` | true |",
  "| `AutoTokenizer.from_pretrained(..., local_files_only=true)` | true |",
  "| `AutoProcessor.from_pretrained(..., local_files_only=true)` | true |",
  "| Qwen model class imported | true |",
  "| Model type | `qwen2_5_vl` |",
  "| Architecture | `Qwen2_5_VLForConditionalGeneration` |",
  "| Tokenizer class | `Qwen2TokenizerFast` |",
  "| Processor class | `Qwen2_5_VLProcessor` |",
  "`modelWeightsLoaded=false`",
  "`modelLoadRun=false`",
  "`inferenceRun=false`",
  "`serviceRuntimeRequestSent=false`",
  "`generatedLocalFixturePassedClaimed=false`",
  NEXT_PROMPT
];

const TRUE_FLAGS = [
  "cloudRunGpuJobCreated",
  "cloudRunGpuJobDeleted",
  "gpuRequested",
  "torchImported",
  "cudaAvailable",
  "cudaL4Visible",
  "transformersImported",
  "qwenVlUtilsImported",
  "vllmImported",
  "autoConfigImportedFromMount",
  "autoTokenizerImportedFromMount",
  "autoProcessorImportedFromMount",
  "qwenModelClassImported"
];

const FALSE_FLAGS = [
  "modelWeightsLoaded",
  "modelLoadRun",
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
  packageJson.scripts?.["qwen2-5-vl-7b-cloud-run-gpu-model-import-proof-result:diagnostics"] ===
    "tsx scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-model-import-proof-result-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-cloud-run-gpu-model-import-proof-result:diagnostics"
);

const doc = read("docs/qwen2-5-vl-7b-cloud-run-gpu-model-import-proof-result.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-cloud-run-gpu-model-import-proof-result-change-log.md",
  "qwen2-5-vl-7b-cloud-run-gpu-model-import-proof-result-change-log"
);
const spec = QWEN2_5_VL_CLOUD_RUN_GPU_MODEL_IMPORT_PROOF_RESULT;

includesAll(doc, REQUIRED_DOC_PHRASES, "model import proof result doc");

check(changeLog.decision === DECISION, "Change log decision mismatch");
check(spec.decision === DECISION, "Spec decision mismatch");
check(spec.proofExecution.completedSuccessfully === true, "Proof execution must succeed");
check(spec.proofExecution.jobName === "qwen25vl-model-import-proof-0627012628", "Proof job mismatch");
check(spec.proofExecution.executionName === "qwen25vl-model-import-proof-0627012628-8x8p9", "Execution name mismatch");
check(spec.proofExecution.gpuType === "nvidia-l4", "GPU type mismatch");
check(spec.proofExecution.gpuCount === 1, "GPU count mismatch");
check(spec.proofExecution.proofJobDeleted === true, "Proof job must be deleted");
check(spec.runtimeImageAndMount.imageDigest === IMAGE_DIGEST, "Image digest mismatch");
check(spec.runtimeImageAndMount.bucket === "reeditpro-staging-reeditpro-model-cache", "Bucket mismatch");
check(spec.runtimeImageAndMount.readOnlyMount === true, "Mount must be read-only");
check(spec.cudaAndPackageImports.torchVersion === "2.8.0+cu128", "Torch version mismatch");
check(spec.cudaAndPackageImports.cudaAvailable === true, "CUDA must be available");
check(spec.cudaAndPackageImports.cudaDeviceName === "NVIDIA L4", "CUDA device name mismatch");
check(spec.cudaAndPackageImports.transformersVersion === "4.57.1", "Transformers version mismatch");
check(spec.cudaAndPackageImports.vllmVersion === "0.11.0", "vLLM version mismatch");
check(spec.cudaAndPackageImports.qwenVlUtilsModule === "qwen_vl_utils", "Qwen utils module mismatch");
check(spec.localModelMetadataImports.modelType === "qwen2_5_vl", "Model type mismatch");
check(spec.localModelMetadataImports.architectures.includes("Qwen2_5_VLForConditionalGeneration"), "Architecture missing");
check(spec.localModelMetadataImports.tokenizerClass === "Qwen2TokenizerFast", "Tokenizer class mismatch");
check(spec.localModelMetadataImports.processorClass === "Qwen2_5_VLProcessor", "Processor class mismatch");
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
  "docs/qwen2-5-vl-7b-cloud-run-gpu-model-import-proof-result.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-model-import-proof-result-change-log.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-model-import-proof-result.ts"
]) {
  assertNoForbiddenText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  proofJob: spec.proofExecution.jobName,
  proofJobDeleted: spec.proofExecution.proofJobDeleted,
  cudaDeviceName: spec.cudaAndPackageImports.cudaDeviceName,
  torchVersion: spec.cudaAndPackageImports.torchVersion,
  transformersVersion: spec.cudaAndPackageImports.transformersVersion,
  vllmVersion: spec.cudaAndPackageImports.vllmVersion,
  modelType: spec.localModelMetadataImports.modelType,
  processorClass: spec.localModelMetadataImports.processorClass,
  modelWeightsLoaded: spec.runtimeFlags.modelWeightsLoaded,
  inferenceRun: spec.runtimeFlags.inferenceRun,
  nextPrompt: NEXT_PROMPT
}, null, 2));
