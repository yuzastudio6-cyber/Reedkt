#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DECISION = "qwen2_5_vl_7b_linux_l4_wheelhouse_prepared_no_install_no_inference";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_8: install Qwen2.5-VL Linux L4 wheelhouse in isolated worker runtime and run metadata loader import proof, no inference";
const WHEELHOUSE_PATH =
  "/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/wheelhouses/qwen2.5-vl-7b-python312-linux-x86_64";
const MANIFEST_PATH = path.join(WHEELHOUSE_PATH, "SHA256SUMS.json");
const AGGREGATE_SHA256 = "d3c782141f03882a0b1f103f68a24c3c27396a971b9fb4aedc15831935ba687c";
const AGGREGATE_BYTES = 4960843100;
const WHEEL_COUNT = 158;

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-linux-l4-wheelhouse-prep-result.md",
  "docs/qwen2-5-vl-7b-python-runtime-alignment.md",
  "docs/qwen2-5-vl-7b-controlled-dependency-install-result.md",
  "docs/qwen2-5-vl-7b-runtime-dependency-install-plan.md",
  "docs/qwen2-5-vl-7b-private-loader-import-gate.md",
  "docs/qwen2-5-vl-7b-controlled-private-download-manifest.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-linux-l4-wheelhouse-import-proof.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-linux-l4-wheelhouse-prep.md",
  "server/workers/vlm-runtime/requirements.vlm.txt",
  "scripts/validation/qwen2-5-vl-7b-linux-l4-wheelhouse-prep-diagnostics.mjs",
  "package.json"
];

const REQUIRED_REQUIREMENTS = [
  "vllm==0.11.0",
  "transformers==4.57.1",
  "qwen-vl-utils==0.0.11",
  "Pillow==10.4.0",
  "numpy==1.26.4",
  "opencv-python-headless==4.11.0.86",
  "google-cloud-storage==2.19.0"
];

const REQUIRED_WHEEL_PREFIXES = [
  "vllm-0.11.0",
  "transformers-4.57.1",
  "qwen_vl_utils-0.0.11",
  "pillow-10.4.0",
  "numpy-1.26.4",
  "opencv_python_headless-4.11.0.86",
  "google_cloud_storage-2.19.0",
  "torch-2.8.0",
  "torchaudio-2.8.0",
  "torchvision-0.23.0",
  "xformers-0.0.32.post1",
  "xgrammar-0.1.25",
  "triton-3.4.0",
  "nvidia_cublas_cu12-12.8.4.1",
  "nvidia_cuda_runtime_cu12-12.8.90",
  "nvidia_cudnn_cu12-9.10.2.21",
  "nvidia_nccl_cu12-2.27.3",
  "cupy_cuda12x-13.6.0"
];

const FALSE_FLAGS = [
  "dependencyInstallRun",
  "packageSourceBuildRun",
  "metadataLoaderImportRun",
  "runtimeImportRun",
  "modelImportRun",
  "modelInferenceRun",
  "cudaInitialized",
  "vllmStarted",
  "sglangStarted",
  "apiServerStarted",
  "vmCreated",
  "workerRuntimeContainerStarted",
  "generatedVideoCreated",
  "generatedAssetsCreated",
  "providerCallsMade",
  "workersDispatched",
  "supabaseTouched",
  "sqlExecuted",
  "gcpMutationCreated",
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
  ["runtime-ready true claim", /\b(runtimeReadinessClaimed|productionReady|betaReady)\b\s*[:=]\s*(true|"true")/i],
  ["runtime execution true claim", /\b(dependencyInstallRun|metadataLoaderImportRun|runtimeImportRun|modelImportRun|modelInferenceRun|cudaInitialized|vllmStarted|sglangStarted|apiServerStarted|vmCreated|workerRuntimeContainerStarted|generatedVideoCreated|generatedAssetsCreated|providerCallsMade|workersDispatched|supabaseTouched|sqlExecuted|gcpMutationCreated|publicArtifactsCreated|signedUrlsCreated|creditMutationCreated|betaUnlocked|productionUnlocked)\b\s*[:=]\s*(true|"true")/i],
  ["inference command", /\b(generate\(|model\.generate|vllm serve|sglang launch_server)\b/i]
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

function assertNoUnsafeClaims(relativePath) {
  const text = read(relativePath);
  const findings = [];
  for (const [name, pattern] of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) {
      findings.push(name);
    }
  }
  check(findings.length === 0, `Unsafe claim or forbidden value in ${relativePath}: ${findings.join("; ")}`);
}

for (const file of REQUIRED_FILES) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
check(
  packageJson.scripts?.["qwen2-5-vl-7b-linux-l4-wheelhouse-prep:diagnostics"] ===
    "node scripts/validation/qwen2-5-vl-7b-linux-l4-wheelhouse-prep-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-linux-l4-wheelhouse-prep:diagnostics"
);

const doc = read("docs/qwen2-5-vl-7b-linux-l4-wheelhouse-prep-result.md");
const alignmentDoc = read("docs/qwen2-5-vl-7b-python-runtime-alignment.md");
const dependencyPlan = read("docs/qwen2-5-vl-7b-runtime-dependency-install-plan.md");
const nextPrompt = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-linux-l4-wheelhouse-import-proof.md");
const prepPrompt = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-linux-l4-wheelhouse-prep.md");
const requirements = read("server/workers/vlm-runtime/requirements.vlm.txt");

includesAll(doc, [
  DECISION,
  "Qwen/Qwen2.5-VL-7B-Instruct",
  "cc594898137f460bfe9f0759e9844b3ce807cfb5",
  "Python version: `3.12`",
  "Python ABI: `cp312`",
  "GPU target: NVIDIA L4 on Google Cloud G2",
  "First proof shape: `g2-standard-8`",
  "Minimum import-smoke shape: `g2-standard-4`",
  "Previous pin: `opencv-python-headless==4.10.0.84`",
  "Repaired pin: `opencv-python-headless==4.11.0.86`",
  WHEELHOUSE_PATH,
  MANIFEST_PATH,
  "Wheelhouse created: true",
  "Dependency download run: true",
  "Dependency install run: false",
  "Package source build run: false",
  "Wheel count: `158`",
  "Aggregate bytes: `4960843100`",
  AGGREGATE_SHA256,
  "Docker `linux/amd64`, Python `3.12`",
  "`HF_HUB_OFFLINE=1`",
  "`TRANSFORMERS_OFFLINE=1`",
  "`MODEL_DOWNLOADS_ENABLED=false`",
  "`PROVIDER_EXECUTION_ENABLED=false`",
  "Qwen2.5-VL is not an AI-video generation route",
  NEXT_PROMPT
], "wheelhouse prep result doc");

for (const requirement of REQUIRED_REQUIREMENTS) {
  includesAll(requirements, [requirement], "VLM requirements");
  includesAll(doc, [requirement], "wheelhouse prep requirements");
}

check(!requirements.includes("opencv-python-headless==4.10.0.84"), "Old OpenCV pin must not remain in VLM requirements");

includesAll(alignmentDoc, [
  "qwen2_5_vl_7b_python_runtime_alignment_ready_linux_l4_python312_no_inference",
  "opencv-python-headless==4.11.0.86",
  "Python 3.12 Linux x86_64"
], "python runtime alignment doc");

includesAll(dependencyPlan, [
  "qwen2_5_vl_7b_runtime_dependency_install_plan_ready_no_install_no_inference",
  "opencv-python-headless==4.11.0.86",
  "Preferred first runtime proof: vLLM with `vllm==0.11.0`"
], "runtime dependency plan");

includesAll(prepPrompt, [
  "QWEN2_5_VL_STACK_TOOL_7: prepare Qwen2.5-VL Python 3.12 Linux L4 wheelhouse, no inference",
  "Python 3.12 / `cp312` Linux x86_64",
  "Keep the wheelhouse private and outside the repository"
], "wheelhouse prep prompt");

includesAll(nextPrompt, [
  NEXT_PROMPT,
  "Use the private wheelhouse as the only package source",
  "Keep package resolution offline/no-index",
  "Run at most a metadata loader import proof",
  "Do not run inference.",
  "Do not generate video, frames, captions, or assets."
], "next import proof prompt");

for (const flag of FALSE_FLAGS) {
  includesAll(doc, [`${flag}=false`], `doc false runtime flag ${flag}`);
}

check(fs.existsSync(MANIFEST_PATH), `Missing private wheelhouse manifest: ${MANIFEST_PATH}`);
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
check(manifest.decision === DECISION, "Manifest decision mismatch");
check(manifest.evidence?.wheelCount === WHEEL_COUNT, "Manifest wheel count mismatch");
check(manifest.evidence?.aggregateBytes === AGGREGATE_BYTES, "Manifest aggregate bytes mismatch");
check(manifest.evidence?.aggregateSha256 === AGGREGATE_SHA256, "Manifest aggregate sha mismatch");
check(manifest.targetRuntime?.pythonVersion === "3.12", "Manifest Python version mismatch");
check(manifest.targetRuntime?.architecture === "x86_64", "Manifest architecture mismatch");
check(manifest.targetRuntime?.gpu === "nvidia_l4_google_cloud_g2_first", "Manifest GPU target mismatch");
check(manifest.resolver?.onlyBinary === true, "Manifest must record binary-only resolver");
check(manifest.resolver?.dependencyDownloadRun === true, "Manifest must record dependency download");
check(manifest.resolver?.dependencyInstallRun === false, "Manifest must not claim dependency install");
check(manifest.runtimeGates?.modelInferenceRun === false, "Manifest must not claim inference");
check(manifest.runtimeGates?.cudaInitialized === false, "Manifest must not claim CUDA initialization");

const wheelNames = manifest.wheels.map((wheel) => wheel.fileName);
check(wheelNames.length === WHEEL_COUNT, "Manifest wheel list length mismatch");
for (const wheel of manifest.wheels) {
  check(wheel.fileName.endsWith(".whl"), `Manifest non-wheel entry: ${wheel.fileName}`);
  check(!wheel.fileName.startsWith("._"), `Manifest AppleDouble sidecar entry: ${wheel.fileName}`);
  check(Number.isInteger(wheel.bytes) && wheel.bytes > 0, `Manifest invalid byte size for ${wheel.fileName}`);
  check(/^[a-f0-9]{64}$/.test(wheel.sha256), `Manifest invalid sha256 for ${wheel.fileName}`);
  check(fs.existsSync(path.join(WHEELHOUSE_PATH, wheel.fileName)), `Wheel file missing: ${wheel.fileName}`);
}

for (const prefix of REQUIRED_WHEEL_PREFIXES) {
  check(wheelNames.some((name) => name.startsWith(prefix)), `Required wheel prefix missing: ${prefix}`);
  check(manifest.requiredWheels?.includes(prefix), `Manifest requiredWheels missing: ${prefix}`);
}

const sidecars = fs.readdirSync(WHEELHOUSE_PATH).filter((name) => name.startsWith("._") || name === ".DS_Store");
check(sidecars.length === 0, `Wheelhouse sidecar metadata files must be absent: ${sidecars.join(", ")}`);

for (const file of [
  "docs/qwen2-5-vl-7b-linux-l4-wheelhouse-prep-result.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-linux-l4-wheelhouse-import-proof.md"
]) {
  assertNoUnsafeClaims(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  toolId: "qwen_vl",
  modelId: "Qwen/Qwen2.5-VL-7B-Instruct",
  targetOs: "linux",
  targetArch: "x86_64",
  targetPython: "3.12",
  targetAbi: "cp312",
  selectedGpu: "nvidia_l4_google_cloud_g2_first",
  recommendedInitialVmShape: "g2-standard-8",
  wheelhouseCreated: true,
  dependencyDownloadRun: true,
  dependencyInstallRun: false,
  modelInferenceRun: false,
  wheelCount: WHEEL_COUNT,
  aggregateBytes: AGGREGATE_BYTES,
  aggregateSha256: AGGREGATE_SHA256,
  nextPrompt: NEXT_PROMPT
}, null, 2));
