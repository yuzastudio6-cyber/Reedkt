import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const failures = [];
const baseRef = "origin/codex/rp-ai-graphics-gpu-model-install-build-targets";

function fail(message) {
  failures.push(message);
}

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) {
    fail(`Missing ${relativePath}`);
    return "";
  }
  return fs.readFileSync(filePath, "utf8");
}

function readJson(relativePath) {
  const text = read(relativePath);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`Invalid JSON ${relativePath}: ${error.message}`);
    return null;
  }
}

const env = { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" };
const git = (args) => execFileSync("git", args, { encoding: "utf8", env }).trim();

const packageJson = readJson("package.json");
const packageLock = readJson("package-lock.json");
const gate = readJson("docs/tool-intelligence/ai-graphics/gpu-model-runtime-readiness-gate.json");
const gateMarkdown = read("docs/tool-intelligence/ai-graphics/gpu-model-runtime-readiness-gate.md");
const resultRecord = read("docs/prompt-ai-graphics-gpu-model-runtime-readiness-gate-results.md");
const implementationPrompt = read("docs/implementation-prompts/prompt-ai-graphics-gpu-model-runtime-readiness-gate.md");
const scorecard = read("docs/production-beta-readiness-scorecard.md");
const sourceInstallProof = readJson("docs/tool-intelligence/ai-graphics/gpu-model-install-build-targets.json");
const commandPlan = readJson("docs/tool-intelligence/ai-graphics/gpu-runtime-proof-command-plan.json");
const runtimeScript = read("docker/prod/ai-graphics-gpu-runtime-readiness.py");

const expectedScript = "ai-graphics:gpu-model-runtime-readiness-gate:diagnostics";
if (packageJson?.scripts?.[expectedScript] !== "node scripts/validation/ai-graphics-gpu-model-runtime-readiness-gate-diagnostics.mjs") {
  fail(`Missing package script ${expectedScript}`);
}

if (gate?.decision !== "ai_graphics_gpu_model_runtime_readiness_gate_prepared_with_warnings") {
  fail(`Unexpected decision ${gate?.decision}`);
}
if (gate?.sourcePr?.number !== 833) fail("Missing PR #833 source evidence.");
if (sourceInstallProof?.decision !== "ai_graphics_gpu_model_install_build_targets_prepared_with_warnings") {
  fail("Missing GPU model install build target source proof.");
}
if (gate?.runtimeReadinessScript?.path !== "docker/prod/ai-graphics-gpu-runtime-readiness.py") {
  fail("Runtime readiness script path mismatch.");
}
if (gate?.runtimeReadinessScript?.requiresExplicitOptInEnv !== "REEDITPRO_AI_GRAPHICS_GPU_RUNTIME_PROOF=true") {
  fail("Runtime readiness gate must require explicit opt-in env.");
}
for (const key of [
  "requiresNativeNvidiaRuntime",
  "requiresNvidiaSmi",
  "requiresTorchCudaAvailable",
  "tinyCudaTensorProbe",
  "modelWeightManifestCheckAvailable",
  "modelWeightManifestContentValidation",
]) {
  if (gate?.runtimeReadinessScript?.[key] !== true) fail(`Expected runtimeReadinessScript.${key}=true`);
}
if (gate?.runtimeReadinessScript?.minComputeCapability !== "8.9") {
  fail("Runtime readiness gate must require compute capability 8.9 for the L4 target.");
}
for (const field of [
  "manifestId",
  "toolId",
  "templateId",
  "privateArtifactRef",
  "checksumSha256",
  "sourceLicenseRef",
  "modelCardRef",
  "commercialUseReviewed",
  "redistributionReviewed",
  "qualityReviewed",
  "securityReviewed",
  "provenanceReviewed",
  "approvedForInternalBeta",
]) {
  if (!gate?.runtimeReadinessScript?.modelWeightManifestRequiredFields?.includes(field)) {
    fail(`Runtime readiness gate missing required manifest field ${field}`);
  }
}
if (gate?.runtimeReadinessScript?.modelWeightManifestPublicUrlRejected !== true) {
  fail("Runtime readiness gate must reject public or signed URL manifest artifact refs.");
}
if (gate?.runtimeReadinessScript?.modelWeightManifestForbiddenExecutionClaimsRejected !== true) {
  fail("Runtime readiness gate must reject execution-completed manifest claims.");
}
for (const key of [
  "modelWeightsLoaded",
  "mediaProcessed",
  "providerRuntimeUsed",
  "toolRouteExecutionReadyNow",
  "workerExecutionReadyNow",
]) {
  if (gate?.runtimeReadinessScript?.[key] !== false) fail(`Expected runtimeReadinessScript.${key}=false`);
}

const expectedProfiles = {
  gpu_worker_ai_graphics: {
    dockerfile: "docker/prod/gpu-worker/Dockerfile",
    scriptPath: "/usr/local/bin/ai-graphics-gpu-runtime-readiness.py",
    copyToken: "COPY docker/prod/ai-graphics-gpu-runtime-readiness.py /usr/local/bin/ai-graphics-gpu-runtime-readiness.py",
    commandToken: "--profile gpu_worker_ai_graphics --require-model-weight-manifests",
    tools: ["torch_torchvision", "transformers", "sam2", "real_esrgan", "kornia", "rembg", "transparent_background"],
  },
  sam2: {
    dockerfile: "docker/prod/sam2-runtime/Dockerfile",
    scriptPath: "/app/ai-graphics-gpu-runtime-readiness.py",
    copyToken: "COPY docker/prod/ai-graphics-gpu-runtime-readiness.py ./ai-graphics-gpu-runtime-readiness.py",
    commandToken: "--profile sam2 --require-model-weight-manifests",
    tools: ["sam2", "torch_torchvision"],
  },
  birefnet: {
    dockerfile: "docker/prod/birefnet-runtime/Dockerfile",
    scriptPath: "/usr/local/bin/ai-graphics-gpu-runtime-readiness.py",
    copyToken: "COPY docker/prod/ai-graphics-gpu-runtime-readiness.py /usr/local/bin/ai-graphics-gpu-runtime-readiness.py",
    commandToken: "--profile birefnet --require-model-weight-manifests",
    tools: ["birefnet", "transformers", "kornia", "torch_torchvision"],
  },
  real_esrgan: {
    dockerfile: "docker/prod/real-esrgan-runtime/Dockerfile",
    scriptPath: "/usr/local/bin/ai-graphics-gpu-runtime-readiness.py",
    copyToken: "COPY docker/prod/ai-graphics-gpu-runtime-readiness.py /usr/local/bin/ai-graphics-gpu-runtime-readiness.py",
    commandToken: "--profile real_esrgan --require-model-weight-manifests",
    tools: ["real_esrgan", "torch_torchvision"],
  },
};

const profileEntries = new Map((gate?.runtimeProfiles || []).map((entry) => [entry.profileId, entry]));
for (const [profileId, expected] of Object.entries(expectedProfiles)) {
  const entry = profileEntries.get(profileId);
  if (!entry) fail(`Missing runtime profile ${profileId}`);
  if (entry?.dockerfile !== expected.dockerfile) fail(`${profileId} dockerfile mismatch`);
  if (entry?.scriptPathInImage !== expected.scriptPath) fail(`${profileId} runtime script path mismatch`);
  if (!entry?.requiredCommand?.includes("docker run --rm --gpus all")) fail(`${profileId} command must require docker --gpus all`);
  if (!entry?.requiredCommand?.includes("REEDITPRO_AI_GRAPHICS_GPU_RUNTIME_PROOF=true")) fail(`${profileId} command must require explicit runtime-proof opt-in`);
  if (!entry?.requiredCommand?.includes(expected.commandToken)) fail(`${profileId} command missing ${expected.commandToken}`);
  if (entry?.status !== "gate_prepared_runtime_not_executed_here") fail(`${profileId} status mismatch`);
  for (const tool of expected.tools) {
    if (!entry?.tools?.includes(tool)) fail(`${profileId} missing tool ${tool}`);
  }

  const dockerfile = read(expected.dockerfile);
  if (!dockerfile.includes(expected.copyToken)) fail(`${expected.dockerfile} missing runtime readiness script copy`);
}

const expectedNativeProofProfiles = [
  "gpu_worker_ai_graphics",
  "sam2",
  "birefnet",
  "real_esrgan",
  "rembg",
  "transparent_background",
];
if (gate?.runtimeProbeImageProfilesCount !== 4) fail("Runtime gate must distinguish four image-level probe placements.");
if (gate?.nativeGpuProofProfilesRequiredLaterCount !== 6) fail("Runtime gate must cite six downstream native GPU proof profiles.");
if (commandPlan?.counts?.runtimeProfiles !== 6) fail("Command plan must cover six native GPU proof profiles.");
if (commandPlan?.booleans?.all6RuntimeProfilesCovered !== true) fail("Command plan must record all6RuntimeProfilesCovered=true.");
if (!gateMarkdown.includes("six current native GPU proof profiles")) {
  fail("Markdown must distinguish six downstream native GPU proof profiles from four image probe placements.");
}
for (const profileId of expectedNativeProofProfiles) {
  if (!gate?.nativeGpuProofProfilesRequiredLater?.includes(profileId)) {
    fail(`Runtime gate missing downstream native GPU proof profile ${profileId}`);
  }
  if (!commandPlan?.runtimeProfiles?.some((entry) => entry.profileId === profileId)) {
    fail(`Command plan missing downstream native GPU proof profile ${profileId}`);
  }
  if (!gateMarkdown.includes(profileId)) fail(`Markdown missing downstream native GPU proof profile ${profileId}`);
}

const expectedTools = [
  "torch_torchvision",
  "transformers",
  "sam2",
  "birefnet",
  "real_esrgan",
  "kornia",
  "rembg",
  "transparent_background",
];
const toolEntries = new Map((gate?.tools || []).map((entry) => [entry.toolId, entry]));
for (const tool of expectedTools) {
  const entry = toolEntries.get(tool);
  if (!entry) fail(`Missing runtime-gated tool ${tool}`);
  if (entry?.status !== "runtime_gate_prepared_native_gpu_required") fail(`${tool} status mismatch`);
}
if (!/SAM2 optional CUDA post-processing extension/.test(toolEntries.get("sam2")?.knownRemainingBlock ?? "")) {
  fail("SAM2 remaining runtime block must be recorded.");
}
if (!/Numba runtime JIT/.test(toolEntries.get("rembg")?.knownRemainingBlock ?? "")) {
  fail("rembg Numba/JIT remaining runtime block must be recorded.");
}

for (const token of [
  "REEDITPRO_AI_GRAPHICS_GPU_RUNTIME_PROOF",
  "blocked_missing_runtime_proof_opt_in",
  "nvidia-smi",
  "torch.cuda.is_available",
  "torch.cuda.device_count",
  "torch.cuda.get_device_capability",
  "torch.ones((1,), device=\"cuda\")",
  "MODEL_DOWNLOADS_ENABLED",
  "PROVIDER_EXECUTION_ENABLED",
  "TOOL_ROUTE_EXECUTION_ENABLED",
  "WORKER_EXECUTION_ENABLED",
  "SUPABASE_MUTATION_ENABLED",
  "GCS_UPLOAD_ENABLED",
  "--require-model-weight-manifests",
  "model_tree_manifest.json",
  "REQUIRED_MODEL_MANIFEST_FIELDS",
  "MODEL_MANIFEST_TEMPLATE_IDS",
  "MODEL_MANIFEST_SOURCE_CANDIDATE_IDS",
  "MODEL_MANIFEST_SUGGESTED_CHECKSUM_SHA256",
  "MODEL_MANIFEST_CHECKSUM_EVIDENCE_STATUS",
  "FORBIDDEN_MANIFEST_TRUE_FIELDS",
  "SHA256_PATTERN",
  "validate_model_manifest",
  "validate_private_artifact_ref",
  "blocked_model_manifest_validation_failed",
  "validated_not_loaded",
  "present_private_ref_not_logged",
  "privateArtifactRef must not be an HTTP(S) URL",
  "checksumSha256 must be a 64-character hex SHA-256 digest",
  "checksumSha256 must match reviewed source-catalog checksum",
  "\"modelWeightsLoaded\": False",
  "\"mediaProcessed\": False",
  "\"providerRuntimeUsed\": False",
  "\"runtimeBetaReadyNow\": False",
]) {
  if (!runtimeScript.includes(token)) fail(`Runtime readiness script missing ${token}`);
}

const booleans = gate?.booleans || {};
for (const key of [
  "gpuModelRuntimeReadinessGatePrepared",
  "all8GpuModelToolsCoveredByRuntimeGate",
  "all4GpuRuntimeProfilesHaveRuntimeProbe",
  "all6NativeGpuProofProfilesCoveredByCommandPlan",
  "nativeNvidiaRuntimeRequired",
  "explicitRuntimeProofOptInRequired",
  "modelWeightManifestGatePrepared",
  "agentCanSelectForPlanning",
]) {
  if (booleans[key] !== true) fail(`Expected ${key}=true`);
}
for (const key of [
  "agentCanExecuteToolsNow",
  "toolRouteExecutionReadyNow",
  "workerExecutionReadyNow",
  "browserWebglCanvasRuntimeReadyNow",
  "gpuModelRuntimeReadyNow",
  "runtimeBetaReadyNow",
  "internalBetaReadyNow",
  "externalBetaReadyNow",
  "productionReadyNow",
  "dependencyInstallPerformedOutsideDockerBuildTarget",
  "packageLockMutationPerformed",
  "modelWeightsDownloaded",
  "modelWeightsLoaded",
  "mediaProcessingPerformed",
  "providerRuntimePerformed",
  "toolExecutionPerformed",
  "workerExecutionPerformed",
  "routeExecutionPerformed",
  "supabaseMutationPerformed",
  "gcsUploadPerformed",
  "publicArtifactCreated",
  "signedUrlCreated",
]) {
  if (booleans[key] !== false) fail(`Expected ${key}=false`);
}

for (const [label, text] of [
  ["Markdown", gateMarkdown],
  ["result record", resultRecord],
  ["implementation prompt", implementationPrompt],
  ["scorecard", scorecard],
]) {
  for (const token of [
    "ai_graphics_gpu_model_runtime_readiness_gate_prepared_with_warnings",
    "REEDITPRO_AI_GRAPHICS_GPU_RUNTIME_PROOF",
    "nvidia-smi",
    "torch.cuda.is_available",
    "agentCanExecuteToolsNow=false",
    "runtimeBetaReadyNow=false",
    "productionReadyNow=false",
  ]) {
    if (!text.includes(token)) fail(`${label} missing ${token}`);
  }
}

const basePackageJson = JSON.parse(git(["show", `${baseRef}:package.json`]));
for (const section of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
  if (JSON.stringify(packageJson?.[section] ?? {}) !== JSON.stringify(basePackageJson?.[section] ?? {})) {
    fail(`Dependency section changed: ${section}`);
  }
}
if (JSON.stringify(packageLock) !== JSON.stringify(JSON.parse(git(["show", `${baseRef}:package-lock.json`])))) {
  fail("package-lock.json changed.");
}

const changedFiles = git(["diff", "--name-only", baseRef]);
if (/(^|\/)\.local-artifacts\//.test(changedFiles)) fail(".local-artifacts changed.");
if (/\.(png|jpe?g|webp|gif|mp4|mov|webm|svg|ttf|otf|woff2?)$/im.test(changedFiles)) {
  fail(`Generated media/font artifact changed: ${changedFiles}`);
}

const allText = [gateMarkdown, resultRecord, implementationPrompt, scorecard, JSON.stringify(gate || {})].join("\n");
for (const pattern of [
  /agentCanExecuteToolsNow["`:\s]+true/i,
  /toolRouteExecutionReadyNow["`:\s]+true/i,
  /workerExecutionReadyNow["`:\s]+true/i,
  /gpuModelRuntimeReadyNow["`:\s]+true/i,
  /runtimeBetaReadyNow["`:\s]+true/i,
  /internalBetaReadyNow["`:\s]+true/i,
  /externalBetaReadyNow["`:\s]+true/i,
  /productionReadyNow["`:\s]+true/i,
  /modelWeightsDownloaded["`:\s]+true/i,
  /modelWeightsLoaded["`:\s]+true/i,
  /mediaProcessingPerformed["`:\s]+true/i,
  /providerRuntimePerformed["`:\s]+true/i,
  /toolExecutionPerformed["`:\s]+true/i,
  /workerExecutionPerformed["`:\s]+true/i,
  /routeExecutionPerformed["`:\s]+true/i,
  /publicArtifactCreated["`:\s]+true/i,
  /signedUrlCreated["`:\s]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]) {
  if (pattern.test(allText)) fail(`Forbidden claim matched ${pattern}`);
}

if (failures.length) {
  console.error(JSON.stringify({ status: "failed", failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "passed",
  decision: gate?.decision,
  profilesChecked: Object.keys(expectedProfiles).length,
  toolsChecked: expectedTools.length,
  gpuModelRuntimeReadyNow: false,
}, null, 2));
