#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const DECISION = "qwen2_5_vl_7b_controlled_dependency_install_blocked_python313_numpy_pin_no_inference";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_6: align Qwen2.5-VL dependency runtime to Python 3.12 or Linux L4 worker, no inference";
const ENV_DIR =
  "/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/runtime-envs/qwen2.5-vl-7b-loader-py313-macos-arm64-v1";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-controlled-dependency-install-result.md",
  "docs/qwen2-5-vl-7b-runtime-dependency-install-plan.md",
  "docs/qwen2-5-vl-7b-private-loader-import-gate.md",
  "docs/qwen2-5-vl-7b-controlled-private-download-manifest.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-python-runtime-alignment.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-controlled-dependency-install.md",
  "server/workers/vlm-runtime/requirements.vlm.txt",
  "scripts/validation/qwen2-5-vl-7b-controlled-dependency-install-result-diagnostics.mjs",
  "package.json"
];

const REQUIRED_FALSE_FLAGS = [
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

const TARGET_PACKAGES = new Set([
  "transformers",
  "torch",
  "qwen-vl-utils",
  "Pillow",
  "numpy",
  "vllm",
  "sglang"
].map((name) => name.toLowerCase()));

const FORBIDDEN_PATTERNS = [
  ["signed URL token", /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ["credential assignment", /\b(api[_-]?key|service[_-]?role|secret|password|hf[_-]?token|access[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ["database URL", /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ["storage URI", /\b(gs:\/\/|s3:\/\/|storage\.googleapis\.com\/)/i],
  ["raw worker prompt field", /\b(raw_worker_prompt|rawPromptPayload|raw_prompt)\b/i],
  ["runtime-ready true claim", /\b(runtimeReadinessClaimed|productionReady|betaReady)\b\s*[:=]\s*(true|"true")/i],
  ["install/inference true claim", /\b(dependencyInstallRun|metadataLoaderImportRun|runtimeImportRun|modelInferenceRun|generatedVideoCreated|generatedAssetsCreated|providerCallsMade|workersDispatched|supabaseTouched|sqlExecuted|gcpMutationCreated|dockerRun|publicArtifactsCreated|signedUrlsCreated|creditMutationCreated|betaUnlocked|productionUnlocked)\b\s*[:=]\s*(true|"true")/i]
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

function runEnvPython(args) {
  const result = spawnSync(path.join(ENV_DIR, "bin/python"), args, {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 60000
  });
  check(result.error === undefined, `env python error: ${result.error?.message}`);
  check(result.status === 0, `env python exited ${result.status}: ${result.stderr}`);
  return result;
}

for (const file of REQUIRED_FILES) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
check(
  packageJson.scripts?.["qwen2-5-vl-7b-controlled-dependency-install-result:diagnostics"] ===
    "node scripts/validation/qwen2-5-vl-7b-controlled-dependency-install-result-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-controlled-dependency-install-result:diagnostics"
);

const doc = read("docs/qwen2-5-vl-7b-controlled-dependency-install-result.md");
const plan = read("docs/qwen2-5-vl-7b-runtime-dependency-install-plan.md");
const prompt = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-python-runtime-alignment.md");
const requirements = read("server/workers/vlm-runtime/requirements.vlm.txt");

includesAll(doc, [
  DECISION,
  ENV_DIR,
  "Environment created: true",
  "Python version: `3.13.13`",
  "Platform: `macOS arm64`",
  "Installed target packages: false",
  "Binary resolution attempted: true",
  "Dependency install run: false",
  "Metadata loader import run: false",
  "Runtime import run: false",
  "Model inference run: false",
  "No matching distribution found for numpy==1.26.4",
  "First GPU target: `nvidia_l4_google_cloud_g2_first`",
  "Recommended initial VM shape: `g2-standard-8`",
  "CPU-only execution remains blocked",
  "Qwen2.5-VL is not an AI-video generation route",
  NEXT_PROMPT
], "controlled dependency install result doc");

includesAll(plan, [
  "qwen2_5_vl_7b_runtime_dependency_install_plan_ready_no_install_no_inference",
  "Use the existing ReEditPro VLM requirements as the controlled install source",
  "Preferred first runtime proof: vLLM with `vllm==0.11.0`"
], "runtime dependency install plan");

includesAll(prompt, [
  NEXT_PROMPT,
  "Python 3.11/3.12 Linux worker environment",
  "Do not run inference.",
  "NVIDIA L4 / Google Cloud G2"
], "python runtime alignment prompt");

includesAll(requirements, [
  "vllm==0.11.0",
  "transformers==4.57.1",
  "qwen-vl-utils==0.0.11",
  "numpy==1.26.4"
], "VLM requirements");

for (const flag of REQUIRED_FALSE_FLAGS) {
  includesAll(doc, [`${flag}=false`], `doc false runtime flag ${flag}`);
}

for (const file of [
  "docs/qwen2-5-vl-7b-controlled-dependency-install-result.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-python-runtime-alignment.md"
]) {
  assertNoUnsafeClaims(file);
}

check(fs.existsSync(path.join(ENV_DIR, "bin/python")), "Private env python missing");
check(!path.resolve(ENV_DIR).startsWith(path.resolve(ROOT) + path.sep), "Private env must not be inside repo");

const version = runEnvPython(["--version"]).stdout.trim();
check(version === "Python 3.13.13", `Private env Python version mismatch: ${version}`);

const packageListResult = runEnvPython(["-m", "pip", "list", "--format=json"]);
const packages = JSON.parse(packageListResult.stdout);
const packageNames = packages.map((item) => String(item.name).toLowerCase());
check(packageNames.includes("pip"), "Private env should contain pip");
const installedTargets = packageNames.filter((name) => TARGET_PACKAGES.has(name));
check(installedTargets.length === 0, `Target packages must not be installed: ${installedTargets.join(", ")}`);

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  privateDependencyEnvironmentCreated: true,
  binaryResolutionAttempted: true,
  dependencyInstallRun: false,
  metadataLoaderImportRun: false,
  runtimeImportRun: false,
  modelInferenceRun: false,
  installedTargetPackages: installedTargets,
  blocker: "numpy==1.26.4 has no compatible binary for Python 3.13 macOS arm64",
  selectedGpu: "nvidia_l4_google_cloud_g2_first",
  recommendedInitialVmShape: "g2-standard-8",
  nextPrompt: NEXT_PROMPT
}, null, 2));
