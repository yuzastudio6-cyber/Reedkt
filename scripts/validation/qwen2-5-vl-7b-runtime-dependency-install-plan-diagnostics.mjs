#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DECISION = "qwen2_5_vl_7b_runtime_dependency_install_plan_ready_no_install_no_inference";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_5: controlled Qwen2.5-VL dependency install in private worker environment, no inference";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-runtime-dependency-install-plan.md",
  "docs/qwen2-5-vl-7b-private-loader-import-gate.md",
  "docs/qwen2-5-vl-7b-controlled-private-download-manifest.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-controlled-dependency-install.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-runtime-dependency-install-plan.md",
  "server/workers/vlm-runtime/requirements.vlm.txt",
  "server/workers/vlm-sglang-runtime/requirements.sglang.txt",
  "server/workers/vlm-runtime/qwen2_5_vl_private_loader_gate.py",
  "scripts/validation/qwen2-5-vl-7b-runtime-dependency-install-plan-diagnostics.mjs",
  "package.json"
];

const REQUIRED_VLM_REQUIREMENTS = [
  "vllm==0.11.0",
  "transformers==4.57.1",
  "qwen-vl-utils==0.0.11",
  "Pillow==10.4.0",
  "numpy==1.26.4",
  "opencv-python-headless==4.10.0.84",
  "google-cloud-storage==2.19.0"
];

const FALSE_FLAGS = [
  "dependencyInstallRun",
  "metadataLoaderImportRun",
  "runtimeImportRun",
  "modelInferenceRun",
  "cudaInitialized",
  "vllmStarted",
  "sglangStarted",
  "apiServerStarted",
  "generatedVideoCreated",
  "generatedAssetsCreated",
  "providerCallsMade",
  "workersDispatched",
  "supabaseTouched",
  "sqlExecuted",
  "gcpMutationCreated",
  "dockerRun",
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
  ["storage URI", /\b(gs:\/\/|s3:\/\/|storage\.googleapis\.com\/)/i],
  ["raw worker prompt field", /\b(raw_worker_prompt|rawPromptPayload|raw_prompt)\b/i],
  ["runtime-ready true claim", /\b(runtimeReadinessClaimed|productionReady|betaReady)\b\s*[:=]\s*(true|"true")/i],
  ["install/inference true claim", /\b(dependencyInstallRun|metadataLoaderImportRun|runtimeImportRun|modelInferenceRun|generatedVideoCreated|generatedAssetsCreated|providerCallsMade|workersDispatched|supabaseTouched|sqlExecuted|gcpMutationCreated|dockerRun|publicArtifactsCreated|signedUrlsCreated|creditMutationCreated|betaUnlocked|productionUnlocked)\b\s*[:=]\s*(true|"true")/i],
  ["package install command", /\b(pip install|uv pip install|poetry add|npm install)\b/i]
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
  packageJson.scripts?.["qwen2-5-vl-7b-runtime-dependency-install-plan:diagnostics"] ===
    "node scripts/validation/qwen2-5-vl-7b-runtime-dependency-install-plan-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-runtime-dependency-install-plan:diagnostics"
);

const doc = read("docs/qwen2-5-vl-7b-runtime-dependency-install-plan.md");
const loaderGateDoc = read("docs/qwen2-5-vl-7b-private-loader-import-gate.md");
const controlledDownloadDoc = read("docs/qwen2-5-vl-7b-controlled-private-download-manifest.md");
const nextPromptDoc = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-controlled-dependency-install.md");
const currentPromptDoc = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-runtime-dependency-install-plan.md");
const vlmRequirements = read("server/workers/vlm-runtime/requirements.vlm.txt");
const sglangRequirements = read("server/workers/vlm-sglang-runtime/requirements.sglang.txt");
const loaderGate = read("server/workers/vlm-runtime/qwen2_5_vl_private_loader_gate.py");

includesAll(doc, [
  DECISION,
  "Private cache verified: true",
  "Local checksums verified: true",
  "Loader import attempted: false",
  "Loader import ready: false",
  "`transformers`",
  "`torch`",
  "`qwen_vl_utils`",
  "`vllm`",
  "`sglang`",
  "Use the existing ReEditPro VLM requirements as the controlled install source",
  "Preferred first runtime proof: vLLM with `vllm==0.11.0`",
  "Secondary runtime proof: SGLang with `sglang[all]==0.4.10.post2`",
  "First GPU target: `nvidia_l4_google_cloud_g2_first`",
  "Recommended initial VM shape: `g2-standard-8`",
  "Minimum import-smoke VM shape: `g2-standard-4`",
  "CPU-only execution remains blocked",
  "Qwen2.5-VL is not an AI-video generation route",
  "`HF_HUB_OFFLINE=1`",
  "`TRANSFORMERS_OFFLINE=1`",
  "`MODEL_DOWNLOADS_ENABLED=false`",
  "`PROVIDER_EXECUTION_ENABLED=false`",
  NEXT_PROMPT
], "runtime dependency install plan doc");

for (const requirement of REQUIRED_VLM_REQUIREMENTS) {
  includesAll(vlmRequirements, [requirement], "VLM requirements");
  includesAll(doc, [requirement], "runtime dependency install plan requirements");
}

includesAll(sglangRequirements, [
  "sglang[all]==0.4.10.post2",
  "qwen-vl-utils==0.0.11",
  "google-cloud-storage==2.19.0"
], "SGLang requirements");

includesAll(loaderGateDoc, [
  "qwen2_5_vl_7b_private_loader_gate_blocked_missing_runtime_dependencies_no_inference",
  "Loader import ready: false",
  "Model inference run: false"
], "loader gate doc");

includesAll(controlledDownloadDoc, [
  "qwen2_5_vl_7b_controlled_private_download_verified_no_inference",
  "modelWeightsDownloaded=true",
  "modelImportsRun=false",
  "modelInferenceRun=false"
], "controlled download doc");

includesAll(nextPromptDoc, [
  NEXT_PROMPT,
  "Install the approved Qwen2.5-VL metadata-loader dependencies",
  "server/workers/vlm-runtime/requirements.vlm.txt",
  "Do not run inference.",
  "NVIDIA L4 / Google Cloud G2"
], "controlled dependency install prompt");

includesAll(currentPromptDoc, [
  "QWEN2_5_VL_STACK_TOOL_4: controlled Qwen2.5-VL runtime dependency install plan, no inference",
  "controlled worker/runtime dependency install path"
], "current prompt doc");

includesAll(loaderGate, [
  "--allow-metadata-import",
  "local_files_only=True",
  "trust_remote_code=True",
  "block_network"
], "loader gate metadata import guard");

for (const flag of FALSE_FLAGS) {
  includesAll(doc, [`${flag}=false`], `doc false runtime flag ${flag}`);
}

for (const file of [
  "docs/qwen2-5-vl-7b-runtime-dependency-install-plan.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-controlled-dependency-install.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-runtime-dependency-install-plan.md"
]) {
  assertNoUnsafeClaims(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  toolId: "qwen_vl",
  modelId: "Qwen/Qwen2.5-VL-7B-Instruct",
  dependencyInstallRun: false,
  metadataLoaderImportRun: false,
  runtimeImportRun: false,
  modelInferenceRun: false,
  selectedGpu: "nvidia_l4_google_cloud_g2_first",
  recommendedInitialVmShape: "g2-standard-8",
  firstInstallSurface: "worker_private_vlm_runtime_environment",
  preferredRuntimeProof: "vllm==0.11.0",
  secondaryRuntimeProof: "sglang[all]==0.4.10.post2",
  qwenRemainsAiVideoGenerationRoute: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
