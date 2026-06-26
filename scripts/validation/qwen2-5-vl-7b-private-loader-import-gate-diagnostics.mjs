#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const DECISION = "qwen2_5_vl_7b_private_loader_gate_blocked_missing_runtime_dependencies_no_inference";
const SOURCE_REVISION = "cc594898137f460bfe9f0759e9844b3ce807cfb5";
const CACHE_PATH =
  "/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_4: controlled Qwen2.5-VL runtime dependency install plan, no inference";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-private-loader-import-gate.md",
  "docs/qwen2-5-vl-7b-controlled-private-download-manifest.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-private-loader-import-gate.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-runtime-dependency-install-plan.md",
  "server/workers/vlm-runtime/qwen2_5_vl_private_loader_gate.py",
  "scripts/validation/qwen2-5-vl-7b-private-loader-import-gate-diagnostics.mjs",
  "package.json"
];

const FALSE_RUNTIME_FLAGS = [
  "autoDownloadAllowed",
  "loaderImportAttempted",
  "loaderImportReady",
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
  ["forbidden runtime true claim", /\b(modelInferenceRun|generatedVideoCreated|generatedAssetsCreated|providerCallsMade|workersDispatched|supabaseTouched|sqlExecuted|gcpMutationCreated|dockerRun|publicArtifactsCreated|signedUrlsCreated|creditMutationCreated|betaUnlocked|productionUnlocked)\b\s*[:=]\s*(true|"true")/i]
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

function runLoaderGate() {
  const command = [
    "server/workers/vlm-runtime/qwen2_5_vl_private_loader_gate.py",
    "--model-dir",
    CACHE_PATH
  ];
  const result = spawnSync("python3", command, {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 420000,
    env: {
      ...process.env,
      HF_HUB_OFFLINE: "1",
      TRANSFORMERS_OFFLINE: "1",
      MODEL_DOWNLOADS_ENABLED: "false",
      PROVIDER_EXECUTION_ENABLED: "false"
    }
  });
  check(result.error === undefined, `Loader gate process error: ${result.error?.message}`);
  check(result.status === 0, `Loader gate exited ${result.status}: ${result.stderr}`);
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`Loader gate did not emit JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

for (const file of REQUIRED_FILES) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
check(
  packageJson.scripts?.["qwen2-5-vl-7b-private-loader-import-gate:diagnostics"] ===
    "node scripts/validation/qwen2-5-vl-7b-private-loader-import-gate-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-private-loader-import-gate:diagnostics"
);

const doc = read("docs/qwen2-5-vl-7b-private-loader-import-gate.md");
const priorDoc = read("docs/qwen2-5-vl-7b-controlled-private-download-manifest.md");
const promptDoc = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-private-loader-import-gate.md");
const nextPromptDoc = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-runtime-dependency-install-plan.md");
const pythonGate = read("server/workers/vlm-runtime/qwen2_5_vl_private_loader_gate.py");

includesAll(doc, [
  DECISION,
  SOURCE_REVISION,
  CACHE_PATH,
  "Private cache verified by this gate: true",
  "Local checksum verified by this gate: true",
  "Loader import attempted: false",
  "Loader import ready: false",
  "Model inference run: false",
  "Auto-download allowed: false",
  "`HF_HUB_OFFLINE=1`",
  "`TRANSFORMERS_OFFLINE=1`",
  "`MODEL_DOWNLOADS_ENABLED=false`",
  "`PROVIDER_EXECUTION_ENABLED=false`",
  "`transformers`",
  "`torch`",
  "`qwen_vl_utils`",
  "`vllm`",
  "`sglang`",
  "First GPU target: `nvidia_l4_google_cloud_g2_first`",
  "Recommended initial VM shape: `g2-standard-8`",
  "Qwen2.5-VL is not an AI-video generation route",
  NEXT_PROMPT
], "private loader gate doc");

includesAll(priorDoc, [
  "qwen2_5_vl_7b_controlled_private_download_verified_no_inference",
  "modelWeightsDownloaded=true",
  "modelImportsRun=false",
  "modelInferenceRun=false"
], "prior controlled download doc");

includesAll(promptDoc, [
  "QWEN2_5_VL_STACK_TOOL_3: private Qwen2.5-VL model loader import gate, no inference",
  "The current local Python runtime is expected to block before metadata import",
  NEXT_PROMPT
], "loader prompt doc");

includesAll(nextPromptDoc, [
  NEXT_PROMPT,
  "Plan the controlled worker/runtime dependency install path",
  "Do not run inference.",
  "NVIDIA L4 / Google Cloud G2"
], "runtime dependency prompt doc");

includesAll(pythonGate, [
  DECISION,
  "HF_HUB_OFFLINE",
  "TRANSFORMERS_OFFLINE",
  "MODEL_DOWNLOADS_ENABLED",
  "PROVIDER_EXECUTION_ENABLED",
  "importlib.util.find_spec",
  "local_files_only=True",
  "block_network",
  "modelInferenceRun"
], "python loader gate");

for (const flag of FALSE_RUNTIME_FLAGS) {
  includesAll(doc, [`${flag}=false`], `doc false runtime flag ${flag}`);
}

for (const file of [
  "docs/qwen2-5-vl-7b-private-loader-import-gate.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-private-loader-import-gate.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-runtime-dependency-install-plan.md",
  "server/workers/vlm-runtime/qwen2_5_vl_private_loader_gate.py"
]) {
  assertNoUnsafeClaims(file);
}

const gate = runLoaderGate();

check(gate.ok === true, "Loader gate did not report ok");
check(gate.decision === DECISION, "Loader gate decision mismatch");
check(gate.modelId === "Qwen/Qwen2.5-VL-7B-Instruct", "Loader gate model id mismatch");
check(gate.sourceRevision === SOURCE_REVISION, "Loader gate source revision mismatch");
check(gate.modelDir === CACHE_PATH, "Loader gate model dir mismatch");
check(gate.modelDirInsideRepo === false, "Model dir must remain outside repo");
check(gate.privateCacheVerified === true, "Private cache must verify");
check(gate.localChecksumVerified === true, "Local checksums must verify");
check(gate.fileVerificationPassed === true, "File verification must pass");
check(gate.expectedFileCount === 16, "Expected file count mismatch");
check(gate.verifiedFileCount === 16, "Verified file count mismatch");
check(gate.totalSizeBytes === 16595981281, "Total size mismatch");
check(gate.checksumManifestSha256 === "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b", "Aggregate checksum mismatch");
check(gate.sidecarFileCount === 0, "Private cache sidecars must be absent");
check(gate.autoDownloadAllowed === false, "Auto-download must be false");
check(gate.loaderImportAttempted === false, "Loader import must not be attempted by diagnostics");
check(gate.loaderImportReady === false, "Loader import readiness must stay blocked");
check(gate.modelInferenceRun === false, "Inference must not run");
check(gate.loaderDependencies?.transformers === false, "transformers should be missing in this local gate");
check(gate.loaderDependencies?.torch === false, "torch should be missing in this local gate");
check(gate.loaderDependencies?.qwen_vl_utils === false, "qwen_vl_utils should be missing in this local gate");
check(gate.runtimeDependencies?.vllm === false, "vllm should be missing in this local gate");
check(gate.runtimeDependencies?.sglang === false, "sglang should be missing in this local gate");
for (const blocker of ["dependency_missing:transformers", "dependency_missing:torch", "dependency_missing:qwen_vl_utils"]) {
  check(gate.dependencyBlockers?.includes(blocker), `Missing dependency blocker ${blocker}`);
}
for (const [key, value] of Object.entries(gate.runtimeGates ?? {})) {
  check(value === false, `runtimeGates.${key} must be false`);
}
check(gate.selectedGpu === "nvidia_l4_google_cloud_g2_first", "GPU target mismatch");
check(gate.recommendedInitialVmShape === "g2-standard-8", "Initial VM shape mismatch");
check(gate.nextPrompt === NEXT_PROMPT, "Next prompt mismatch");

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  modelId: gate.modelId,
  sourceRevision: gate.sourceRevision,
  privateCacheVerified: gate.privateCacheVerified,
  localChecksumVerified: gate.localChecksumVerified,
  loaderImportAttempted: gate.loaderImportAttempted,
  loaderImportReady: gate.loaderImportReady,
  dependencyBlockers: gate.dependencyBlockers,
  modelInferenceRun: gate.modelInferenceRun,
  generatedVideoCreated: false,
  generatedAssetsCreated: false,
  providerCallsMade: false,
  workersDispatched: false,
  selectedGpu: gate.selectedGpu,
  nextPrompt: NEXT_PROMPT
}, null, 2));
