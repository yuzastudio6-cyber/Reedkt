#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DECISION = "qwen2_5_vl_7b_python_runtime_alignment_ready_linux_l4_python312_no_inference";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_7: prepare Qwen2.5-VL Python 3.12 Linux L4 wheelhouse, no inference";
const WHEELHOUSE_TARGET =
  "/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/wheelhouses/qwen2.5-vl-7b-python312-linux-x86_64";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-python-runtime-alignment.md",
  "docs/qwen2-5-vl-7b-controlled-dependency-install-result.md",
  "docs/qwen2-5-vl-7b-runtime-dependency-install-plan.md",
  "docs/qwen2-5-vl-7b-private-loader-import-gate.md",
  "docs/qwen2-5-vl-7b-controlled-private-download-manifest.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-linux-l4-wheelhouse-prep.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-python-runtime-alignment.md",
  "server/workers/vlm-runtime/requirements.vlm.txt",
  "server/workers/vlm-runtime/l4_tuning_profiles.py",
  "server/tool-registry/production-tool-profiles.ts",
  "scripts/validation/qwen2-5-vl-7b-python-runtime-alignment-diagnostics.mjs",
  "package.json"
];

const REQUIRED_REQUIREMENTS = [
  "vllm==0.11.0",
  "transformers==4.57.1",
  "qwen-vl-utils==0.0.11",
  "Pillow==10.4.0",
  "numpy==1.26.4",
  "opencv-python-headless==4.10.0.84",
  "google-cloud-storage==2.19.0"
];

const REQUIRED_FALSE_FLAGS = [
  "dependencyInstallRun",
  "wheelhouseCreated",
  "metadataLoaderImportRun",
  "runtimeImportRun",
  "modelInferenceRun",
  "cudaInitialized",
  "vllmStarted",
  "sglangStarted",
  "apiServerStarted",
  "vmCreated",
  "dockerRun",
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
  ["storage URI", /\b(gs:\/\/|s3:\/\/|storage\.googleapis\.com\/)/i],
  ["raw worker prompt field", /\b(raw_worker_prompt|rawPromptPayload|raw_prompt)\b/i],
  ["runtime-ready true claim", /\b(runtimeReadinessClaimed|productionReady|betaReady)\b\s*[:=]\s*(true|"true")/i],
  ["execution true claim", /\b(dependencyInstallRun|wheelhouseCreated|metadataLoaderImportRun|runtimeImportRun|modelInferenceRun|cudaInitialized|vllmStarted|sglangStarted|apiServerStarted|vmCreated|dockerRun|generatedVideoCreated|generatedAssetsCreated|providerCallsMade|workersDispatched|supabaseTouched|sqlExecuted|gcpMutationCreated|publicArtifactsCreated|signedUrlsCreated|creditMutationCreated|betaUnlocked|productionUnlocked)\b\s*[:=]\s*(true|"true")/i],
  ["install command", /\b(pip install|uv pip install|poetry add|npm install)\b/i],
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
  packageJson.scripts?.["qwen2-5-vl-7b-python-runtime-alignment:diagnostics"] ===
    "node scripts/validation/qwen2-5-vl-7b-python-runtime-alignment-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-python-runtime-alignment:diagnostics"
);

const doc = read("docs/qwen2-5-vl-7b-python-runtime-alignment.md");
const dependencyResult = read("docs/qwen2-5-vl-7b-controlled-dependency-install-result.md");
const dependencyPlan = read("docs/qwen2-5-vl-7b-runtime-dependency-install-plan.md");
const nextPrompt = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-linux-l4-wheelhouse-prep.md");
const currentPrompt = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-python-runtime-alignment.md");
const requirements = read("server/workers/vlm-runtime/requirements.vlm.txt");
const l4Profiles = read("server/workers/vlm-runtime/l4_tuning_profiles.py");
const productionProfiles = read("server/tool-registry/production-tool-profiles.ts");

includesAll(doc, [
  DECISION,
  "Python version: `3.12`",
  "Python ABI: `cp312`",
  "CPU architecture: `x86_64`",
  "GPU target: NVIDIA L4 on Google Cloud G2",
  "First proof shape: `g2-standard-8`",
  "Minimum import-smoke shape: `g2-standard-4`",
  "Preferred runtime import proof: vLLM `0.11.0`",
  "Secondary runtime import proof: SGLang `0.4.10.post2`",
  "Python 3.11 remains a possible fallback",
  "The current macOS arm64 Python 3.13 environment must not be used",
  "Initial runtime envelope",
  "`max_model_len`: `2048`",
  "`max_num_seqs`: `1`",
  "Image cap: `384px`",
  WHEELHOUSE_TARGET,
  "Qwen2.5-VL is not an AI-video generation route",
  "Wan remains the primary generated B-roll route",
  "`HF_HUB_OFFLINE=1`",
  "`TRANSFORMERS_OFFLINE=1`",
  "`MODEL_DOWNLOADS_ENABLED=false`",
  "`PROVIDER_EXECUTION_ENABLED=false`",
  NEXT_PROMPT
], "python runtime alignment doc");

includesAll(dependencyResult, [
  "qwen2_5_vl_7b_controlled_dependency_install_blocked_python313_numpy_pin_no_inference",
  "No matching distribution found for numpy==1.26.4",
  "First GPU target: `nvidia_l4_google_cloud_g2_first`",
  "CPU-only execution remains blocked"
], "controlled dependency result");

includesAll(dependencyPlan, [
  "qwen2_5_vl_7b_runtime_dependency_install_plan_ready_no_install_no_inference",
  "Use the existing ReEditPro VLM requirements as the controlled install source",
  "Preferred first runtime proof: vLLM with `vllm==0.11.0`"
], "runtime dependency plan");

for (const requirement of REQUIRED_REQUIREMENTS) {
  includesAll(requirements, [requirement], "VLM requirements file");
  includesAll(doc, [requirement], "python runtime alignment requirements");
}

includesAll(l4Profiles, [
  "conservative-eager-short-context",
  "max_model_len=2048",
  "max_num_seqs=1",
  "image_max_size=384",
  "minimal-smoke-one-fixture"
], "L4 tuning profiles");

includesAll(productionProfiles, [
  "qwen_vl",
  "NVIDIA L4",
  "Google Cloud G2",
  "max_model_len around 2048",
  "image max size around 384px"
], "production tool profile");

includesAll(nextPrompt, [
  NEXT_PROMPT,
  "Python 3.12 / `cp312` Linux x86_64",
  "NVIDIA L4 / Google Cloud G2",
  "Preserve all committed VLM dependency pins",
  "Keep the wheelhouse private and outside the repository",
  "Do not run inference.",
  "Do not import the model."
], "next wheelhouse prompt");

includesAll(currentPrompt, [
  "QWEN2_5_VL_STACK_TOOL_6: align Qwen2.5-VL dependency runtime to Python 3.12 or Linux L4 worker, no inference",
  "Python 3.11/3.12 Linux worker environment",
  "NVIDIA L4 / Google Cloud G2"
], "current alignment prompt");

for (const flag of REQUIRED_FALSE_FLAGS) {
  includesAll(doc, [`${flag}=false`], `doc false runtime flag ${flag}`);
}

for (const file of [
  "docs/qwen2-5-vl-7b-python-runtime-alignment.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-linux-l4-wheelhouse-prep.md"
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
  minimumImportSmokeVmShape: "g2-standard-4",
  wheelhouseTarget: WHEELHOUSE_TARGET,
  dependencyInstallRun: false,
  wheelhouseCreated: false,
  metadataLoaderImportRun: false,
  runtimeImportRun: false,
  modelInferenceRun: false,
  qwenRemainsAiVideoGenerationRoute: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
