#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DECISION = "qwen2_5_vl_7b_wheelhouse_import_proof_ready_no_inference";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_9: run Qwen2.5-VL L4 CUDA visibility and vLLM import proof, no inference";
const MODEL_CACHE =
  "/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5";
const WHEELHOUSE =
  "/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/wheelhouses/qwen2.5-vl-7b-python312-linux-x86_64";
const RUNTIME_ENV =
  "/private/tmp/reeditpro-qwen2-5-vl-runtime-envs/qwen2.5-vl-7b-python312-linux-x86_64-wheelhouse-import-proof-v2";
const REPORT_PATH = path.join(
  RUNTIME_ENV,
  "evidence",
  "qwen2_5_vl_private_loader_gate_report_fixed.json"
);

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md",
  "docs/qwen2-5-vl-7b-linux-l4-wheelhouse-prep-result.md",
  "docs/qwen2-5-vl-7b-python-runtime-alignment.md",
  "docs/qwen2-5-vl-7b-runtime-dependency-install-plan.md",
  "docs/qwen2-5-vl-7b-private-loader-import-gate.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-cuda-vllm-import-proof.md",
  "server/workers/vlm-runtime/qwen2_5_vl_private_loader_gate.py",
  "server/workers/vlm-runtime/requirements.vlm.txt",
  "scripts/validation/qwen2-5-vl-7b-wheelhouse-import-proof-diagnostics.mjs",
  "package.json"
];

const DOC_REQUIRED = [
  DECISION,
  "Qwen/Qwen2.5-VL-7B-Instruct",
  "cc594898137f460bfe9f0759e9844b3ce807cfb5",
  MODEL_CACHE,
  WHEELHOUSE,
  RUNTIME_ENV,
  REPORT_PATH,
  "First GPU target for future execution: NVIDIA L4 on Google Cloud G2",
  "Recommended initial VM shape: `g2-standard-8`",
  "Minimum no-inference import-smoke shape: `g2-standard-4`",
  "Package index/network install used: false",
  "Wheelhouse package source used: true",
  "Source builds run: false",
  "`torch` import present: true",
  "`transformers` import present: true",
  "`qwen_vl_utils` import present: true",
  "`vllm` import present: true",
  "`sglang` import present: false",
  "Initial gate result: `metadata_import_blocked`",
  "Root cause: the gate patched `socket.socket` before importing Transformers and Hugging Face modules",
  "`privateCacheVerified=true`",
  "`localChecksumVerified=true`",
  "`fileVerificationPassed=true`",
  "`loaderImportAttempted=true`",
  "`loaderImportReady=true`",
  "`metadataImport.status=passed_metadata_import_only`",
  "`metadataImport.configClass=Qwen2_5_VLConfig`",
  "`metadataImport.processorClass=Qwen2_5_VLProcessor`",
  "Qwen2.5-VL is not an AI-video generation route",
  NEXT_PROMPT
];

const FALSE_DOC_FLAGS = [
  "modelImportRun",
  "modelInferenceRun",
  "cudaInitialized",
  "vllmStarted",
  "sglangStarted",
  "apiServerStarted",
  "gcpMutationCreated",
  "workerRuntimeContainerStarted",
  "providerCallsMade",
  "workersDispatched",
  "supabaseTouched",
  "sqlExecuted",
  "generatedVideoCreated",
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
  ["signed URL token", /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ["credential assignment", /\b(api[_-]?key|service[_-]?role|secret|password|hf[_-]?token|access[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ["database URL", /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ["remote storage URI", /\b(gs:\/\/|s3:\/\/|storage\.googleapis\.com\/)/i],
  ["raw worker prompt field", /\b(raw_worker_prompt|rawPromptPayload|raw_prompt)\b/i],
  ["runtime-ready true claim", /\b(productionReady|betaReady)\b\s*[:=]\s*(true|"true")/i],
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
  packageJson.scripts?.["qwen2-5-vl-7b-wheelhouse-import-proof:diagnostics"] ===
    "node scripts/validation/qwen2-5-vl-7b-wheelhouse-import-proof-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-wheelhouse-import-proof:diagnostics"
);

const doc = read("docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md");
const prompt = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-cuda-vllm-import-proof.md");
const loaderGate = read("server/workers/vlm-runtime/qwen2_5_vl_private_loader_gate.py");

includesAll(doc, DOC_REQUIRED, "wheelhouse import proof result");
includesAll(prompt, [
  NEXT_PROMPT,
  "Use the private wheelhouse as the only package source.",
  "Keep model loading local-files-only from the private cache.",
  "Use NVIDIA L4 / Google Cloud G2 first.",
  "Do not run inference.",
  "Do not start `vllm serve`.",
  "Do not claim `generated_local_fixture_passed`."
], "next prompt");

for (const flag of FALSE_DOC_FLAGS) {
  includesAll(doc, [`${flag}=false`], `false runtime flag ${flag}`);
}

check(
  loaderGate.indexOf("from transformers import AutoConfig, AutoProcessor") <
    loaderGate.indexOf("with block_network():"),
  "Loader gate must import Transformers before patching socket.socket"
);
check(
  loaderGate.includes("local_files_only=True"),
  "Loader gate must keep local_files_only=True"
);

for (const file of [
  "docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-cuda-vllm-import-proof.md"
]) {
  assertNoForbiddenText(file);
}

check(fs.existsSync(REPORT_PATH), `Missing fixed loader report: ${REPORT_PATH}`);
const report = JSON.parse(fs.readFileSync(REPORT_PATH, "utf8"));

check(report.ok === true, "Loader report ok mismatch");
check(report.status === "ready_for_no_inference_metadata_import", "Loader report status mismatch");
check(report.workstream === "AI_VIDEO_BROLL_GENERATION", "Loader report workstream mismatch");
check(report.toolId === "qwen_vl", "Loader report tool mismatch");
check(report.modelId === "Qwen/Qwen2.5-VL-7B-Instruct", "Loader report model mismatch");
check(report.sourceRevision === "cc594898137f460bfe9f0759e9844b3ce807cfb5", "Loader report revision mismatch");
check(report.modelDir === MODEL_CACHE, "Loader report model dir mismatch");
check(report.modelDirInsideRepo === false, "Model cache must be outside repo");
check(report.privateCacheVerified === true, "Private cache must verify");
check(report.localChecksumVerified === true, "Local checksum must verify");
check(report.fileVerificationPassed === true, "File verification must pass");
check(report.sidecarFileCount === 0, "Sidecar file count must be zero");
check(report.loaderImportAttempted === true, "Loader import should be attempted");
check(report.loaderImportReady === true, "Loader import should be ready");
check(report.metadataImport?.status === "passed_metadata_import_only", "Metadata import status mismatch");
check(report.metadataImport?.configClass === "Qwen2_5_VLConfig", "Config class mismatch");
check(report.metadataImport?.processorClass === "Qwen2_5_VLProcessor", "Processor class mismatch");
check(report.metadataImport?.localFilesOnly === true, "Metadata import must be local-only");
check(report.metadataImport?.trustRemoteCode === true, "Metadata import trustRemoteCode mismatch");
check(report.loaderDependencies?.transformers === true, "transformers dependency missing");
check(report.loaderDependencies?.torch === true, "torch dependency missing");
check(report.loaderDependencies?.qwen_vl_utils === true, "qwen_vl_utils dependency missing");
check(report.runtimeDependencies?.vllm === true, "vllm dependency missing");
check(report.runtimeDependencies?.sglang === false, "sglang should remain absent for this vLLM-first proof");
check(report.warnings?.includes("future_runtime_dependency_missing:sglang"), "Missing SGLang future warning");
check(report.blockers?.length === 0, "Fixed loader report must have no blockers");
check(report.selectedGpu === "nvidia_l4_google_cloud_g2_first", "Selected GPU mismatch");
check(report.recommendedInitialVmShape === "g2-standard-8", "Initial VM shape mismatch");
check(report.minimumImportSmokeVmShape === "g2-standard-4", "Minimum smoke VM shape mismatch");
check(report.modelInferenceRun === false, "Inference must not run");
check(report.autoDownloadAllowed === false, "Auto-download must remain false");

for (const value of Object.values(report.offlineEnv ?? {})) {
  check(value === true, "Offline env guard mismatch");
}

for (const [key, value] of Object.entries(report.runtimeGates ?? {})) {
  if (key === "loaderImportAttempted") {
    check(value === true, "runtimeGates.loaderImportAttempted must be true");
  } else {
    check(value === false, `runtimeGates.${key} must be false`);
  }
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  loaderImportReady: report.loaderImportReady,
  metadataImportStatus: report.metadataImport.status,
  vllmInstalled: report.runtimeDependencies.vllm,
  sglangInstalled: report.runtimeDependencies.sglang,
  selectedGpu: report.selectedGpu,
  nextPrompt: NEXT_PROMPT
}, null, 2));
