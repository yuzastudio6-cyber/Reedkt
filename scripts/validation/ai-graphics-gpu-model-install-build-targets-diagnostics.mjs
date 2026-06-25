import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const failures = [];
const baseRef = "origin/codex/rp-ai-graphics-satori-font-runtime-proof";

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
const proof = readJson("docs/tool-intelligence/ai-graphics/gpu-model-install-build-targets.json");
const proofMarkdown = read("docs/tool-intelligence/ai-graphics/gpu-model-install-build-targets.md");
const resultRecord = read("docs/prompt-ai-graphics-gpu-model-install-build-targets-results.md");
const implementationPrompt = read("docs/implementation-prompts/prompt-ai-graphics-gpu-model-install-build-targets.md");
const scorecard = read("docs/production-beta-readiness-scorecard.md");
const sourceSatoriProof = readJson("docs/tool-intelligence/ai-graphics/satori-font-runtime-proof.json");
const sourceGpuInstallProof = readJson("docs/tool-intelligence/ai-graphics/gpu-worker-install-proof.json");
const sourceGpuImportReadiness = readJson("docs/tool-intelligence/ai-graphics/gpu-import-readiness.json");
const gpuRequirements = read("docker/prod/gpu-worker/requirements.gpu.txt");
const sam2Requirements = read("docker/prod/sam2-runtime/requirements.sam2.txt");
const birefnetRequirements = read("docker/prod/birefnet-runtime/requirements.birefnet.txt");
const realEsrganRequirements = read("docker/prod/real-esrgan-runtime/requirements.real-esrgan.txt");

const expectedScript = "ai-graphics:gpu-model-install-build-targets:diagnostics";
if (packageJson?.scripts?.[expectedScript] !== "node scripts/validation/ai-graphics-gpu-model-install-build-targets-diagnostics.mjs") {
  fail(`Missing package script ${expectedScript}`);
}

if (proof?.decision !== "ai_graphics_gpu_model_install_build_targets_prepared_with_warnings") {
  fail(`Unexpected decision ${proof?.decision}`);
}
if (proof?.sourcePr?.number !== 791) fail("Missing PR #791 source evidence.");
if (sourceSatoriProof?.decision !== "ai_graphics_satori_font_runtime_proof_completed_with_warnings") {
  fail("Missing Satori source proof.");
}
if (sourceGpuInstallProof?.decision !== "ai_graphics_gpu_worker_install_proof_hardened_with_warnings") {
  fail("Missing GPU worker install source proof.");
}
if (sourceGpuImportReadiness?.decision !== "ai_graphics_gpu_import_readiness_aligned_with_21_tool_install_plan") {
  fail("Missing GPU import readiness source proof.");
}
if (proof?.dependencyAlignment?.numpyPin !== "1.26.4") fail("Missing numpy 1.26.4 dependency alignment.");
if (proof?.dependencyAlignment?.torchaudioPin !== "2.5.1+cu124") fail("Missing torchaudio 2.5.1+cu124 dependency alignment.");
if (proof?.dependencyAlignment?.opencvPythonPin !== "4.10.0.84") fail("Missing OpenCV 4.10.0.84 full package dependency alignment.");
if (proof?.dependencyAlignment?.opencvPythonHeadlessPin !== "4.10.0.84") fail("Missing OpenCV 4.10.0.84 dependency alignment.");
if (proof?.dependencyAlignment?.rembgGpuPin !== "2.0.69") fail("Missing rembg[gpu] 2.0.69 dependency alignment.");
if (!/NumPy 2\.x/.test(proof?.dependencyAlignment?.reason ?? "")) fail("Dependency alignment must record NumPy 2.x conflict reason.");
if (!/Python 3\.11/.test(proof?.dependencyAlignment?.reason ?? "")) fail("Dependency alignment must record rembg Python 3.11 compatibility reason.");
if (!/Demucs/.test(proof?.dependencyAlignment?.reason ?? "")) fail("Dependency alignment must record Demucs torchaudio compatibility reason.");
if (!/--no-build-isolation/.test(proof?.dependencyAlignment?.sam2NoBuildIsolationInstall?.reason ?? "")) {
  fail("Missing SAM2 no-build-isolation install reason.");
}
if (proof?.dependencyAlignment?.sam2NoBuildIsolationInstall?.torchCudaArchList !== "8.9") {
  fail("Missing SAM2 TORCH_CUDA_ARCH_LIST=8.9 dependency alignment for NVIDIA L4.");
}
if (!/Torch extension architecture inference/.test(proof?.dependencyAlignment?.sam2NoBuildIsolationInstall?.reason ?? "")) {
  fail("Missing SAM2 build-time architecture inference reason.");
}
if (proof?.dependencyAlignment?.sam2PythonDevHeaders?.package !== "python3-dev") {
  fail("Missing python3-dev SAM2 source extension header alignment.");
}
if (!/Python\.h/.test(proof?.dependencyAlignment?.sam2PythonDevHeaders?.reason ?? "")) {
  fail("Missing SAM2 Python.h header reason.");
}
if (!/functional_tensor/.test(proof?.dependencyAlignment?.torchvisionFunctionalTensorShim?.reason ?? "")) {
  fail("Missing torchvision functional_tensor shim reason.");
}

for (const token of [
  "torch==2.5.1+cu124",
  "torchvision==0.20.1+cu124",
  "torchaudio==2.5.1+cu124",
  "numpy==1.26.4",
  "opencv-python==4.10.0.84",
  "opencv-python-headless==4.10.0.84",
]) {
  if (!gpuRequirements.includes(token)) fail(`gpu-worker requirements missing ${token}`);
}
if (!gpuRequirements.includes("rembg[gpu]==2.0.69")) {
  fail("gpu-worker requirements must pin rembg[gpu]==2.0.69 for Python 3.10 compatibility");
}
if (/rembg\[gpu\]==2\.0\.(7[0-9]|[89][0-9])/.test(gpuRequirements)) {
  fail("gpu-worker requirements must not use rembg[gpu] releases that require Python 3.11");
}

for (const [label, text] of [
  ["gpu-worker", gpuRequirements],
  ["sam2", sam2Requirements],
  ["birefnet", birefnetRequirements],
  ["real-esrgan", realEsrganRequirements],
]) {
  if (!text.includes("opencv-python-headless==4.10.0.84")) {
    fail(`${label} requirements must pin opencv-python-headless==4.10.0.84 for numpy 1.26 compatibility`);
  }
  if (text.includes("opencv-python-headless==4.12.0.88")) {
    fail(`${label} requirements must not use opencv-python-headless==4.12.0.88 with numpy 1.26`);
  }
}

const expectedProfiles = {
  gpu_worker_ai_graphics: {
    dockerfile: "docker/prod/gpu-worker/Dockerfile",
    smoke: "python3 /tmp/ai-graphics-gpu-install-smoke.py --profile gpu_worker_ai_graphics",
    blockedBeforeTarget: ["COPY package*.json", "COPY dist-server"],
    tools: ["torch_torchvision", "transformers", "sam2", "real_esrgan", "kornia", "rembg", "transparent_background"],
  },
  sam2: {
    dockerfile: "docker/prod/sam2-runtime/Dockerfile",
    smoke: "python3 ./ai-graphics-gpu-install-smoke.py --profile sam2",
    blockedBeforeTarget: ["COPY dist-staging-sam2-runtime-worker"],
    tools: ["sam2", "torch_torchvision"],
  },
  birefnet: {
    dockerfile: "docker/prod/birefnet-runtime/Dockerfile",
    smoke: "python3 /tmp/ai-graphics-gpu-install-smoke.py --profile birefnet",
    blockedBeforeTarget: ["COPY package*.json", "COPY dist-staging-birefnet-runtime-worker"],
    tools: ["birefnet", "transformers", "kornia", "torch_torchvision"],
  },
  real_esrgan: {
    dockerfile: "docker/prod/real-esrgan-runtime/Dockerfile",
    smoke: "python3 /tmp/ai-graphics-gpu-install-smoke.py --profile real_esrgan",
    blockedBeforeTarget: ["COPY package*.json", "COPY dist-staging-real-esrgan-runtime-worker"],
    tools: ["real_esrgan", "torch_torchvision"],
  },
};

const profileEntries = new Map((proof?.profiles || []).map((entry) => [entry.profileId, entry]));
for (const [profileId, expected] of Object.entries(expectedProfiles)) {
  const entry = profileEntries.get(profileId);
  if (!entry) fail(`Missing profile ${profileId}`);
  if (entry?.dockerfile !== expected.dockerfile) fail(`${profileId} dockerfile mismatch`);
  if (entry?.target !== "ai_graphics_install_proof") fail(`${profileId} target mismatch`);
  if (entry?.smokeCommand !== expected.smoke) fail(`${profileId} smoke command mismatch`);
  if (entry?.appBundleRequiredForInstallProof !== false) fail(`${profileId} app bundle must not be required for install proof`);
  if (entry?.modelWeightsRequiredForInstallProof !== false) fail(`${profileId} model weights must not be required for install proof`);
  for (const tool of expected.tools) {
    if (!entry?.tools?.includes(tool)) fail(`${profileId} missing tool ${tool}`);
  }

  const dockerfile = read(expected.dockerfile);
  if (!dockerfile.includes("AS ai_graphics_install_proof")) fail(`${expected.dockerfile} missing ai_graphics_install_proof stage`);
  if (!dockerfile.includes(expected.smoke)) fail(`${expected.dockerfile} missing smoke command ${expected.smoke}`);
  if (["gpu_worker_ai_graphics", "birefnet", "real_esrgan"].includes(profileId)) {
    if (!dockerfile.includes("PIP_DEFAULT_TIMEOUT=120") || !dockerfile.includes("--retries 10 --timeout 120")) {
      fail(`${expected.dockerfile} missing hardened pip timeout/retry install settings`);
    }
  }
  if (profileId === "gpu_worker_ai_graphics") {
    if (!dockerfile.includes("ninja-build")) fail(`${expected.dockerfile} missing ninja-build for SAM2 extension builds`);
    if (!dockerfile.includes("--no-build-isolation") || !dockerfile.includes("facebookresearch/sam2.git@2b90b9f5ceec907a1c18123530e92e794ad901a4")) {
      fail(`${expected.dockerfile} must install pinned SAM2 source with --no-build-isolation after the pinned Torch stack`);
    }
    if (!dockerfile.includes("TORCH_CUDA_ARCH_LIST=8.9")) {
      fail(`${expected.dockerfile} must set TORCH_CUDA_ARCH_LIST=8.9 for the NVIDIA L4 install-proof target`);
    }
    if (!dockerfile.includes("python3-dev")) {
      fail(`${expected.dockerfile} must install python3-dev before SAM2 source extension build`);
    }
    if (dockerfile.includes('python3 -m pip install --no-cache-dir --upgrade "packaging>=24.0"')) {
      fail(`${expected.dockerfile} must not upgrade packaging>=24.0 because deepfilternet requires packaging<24`);
    }
  }
  const targetIndex = dockerfile.indexOf("AS ai_graphics_install_proof");
  for (const token of expected.blockedBeforeTarget) {
    const tokenIndex = dockerfile.indexOf(token);
    if (tokenIndex !== -1 && tokenIndex < targetIndex) {
      fail(`${expected.dockerfile} copies app artifact before install proof target: ${token}`);
    }
  }
  if (!dockerfile.includes("FROM") || targetIndex < 0) fail(`${expected.dockerfile} malformed target stage`);
  if (["gpu_worker_ai_graphics", "real_esrgan"].includes(profileId)) {
    if (!dockerfile.includes("functional_tensor.py") || !dockerfile.includes("from .functional import rgb_to_grayscale")) {
      fail(`${expected.dockerfile} missing Real-ESRGAN/BasicSR torchvision compatibility shim`);
    }
  }
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
const proofTools = new Map((proof?.tools || []).map((entry) => [entry.toolId, entry]));
for (const tool of expectedTools) {
  const entry = proofTools.get(tool);
  if (!entry) fail(`Missing tool ${tool}`);
  if (entry?.status !== "install_proof_target_prepared_runtime_gpu_required") {
    fail(`${tool} status mismatch ${entry?.status}`);
  }
  if (!/nvidia_l4/.test(entry?.runtimeTarget ?? "")) fail(`${tool} runtime target must be NVIDIA L4`);
}

const buildEvidence = new Map((proof?.localBuildEvidence || []).map((entry) => [entry.profileId, entry]));
const gpuWorkerBuild = buildEvidence.get("gpu_worker_ai_graphics");
if (!gpuWorkerBuild) {
  fail("Missing local shared GPU worker install-proof build evidence.");
} else {
  if (gpuWorkerBuild.dockerfile !== "docker/prod/gpu-worker/Dockerfile") fail("GPU worker build dockerfile mismatch.");
  if (gpuWorkerBuild.target !== "ai_graphics_install_proof") fail("GPU worker build target mismatch.");
  if (gpuWorkerBuild.platform !== "linux/amd64") fail("GPU worker build platform mismatch.");
  if (gpuWorkerBuild.status !== "blocked_pending_native_linux_amd64_gpu_builder") {
    fail("GPU worker local build must remain blocked pending native linux/amd64 GPU builder.");
  }
  if (gpuWorkerBuild.importSmokeStatus !== "not_run") fail("GPU worker import smoke must not be claimed locally.");
  if (gpuWorkerBuild.observedInstallProgress?.mainRequirementsInstall !== "passed") {
    fail("GPU worker build evidence must record main requirements install passed.");
  }
  if (gpuWorkerBuild.observedInstallProgress?.sam2TorchCudaArchList !== "8.9") {
    fail("GPU worker build evidence must record SAM2 TORCH_CUDA_ARCH_LIST=8.9.");
  }
  if (!/compute_89/.test(gpuWorkerBuild.observedInstallProgress?.sam2NvccCommandObserved ?? "")) {
    fail("GPU worker build evidence must record nvcc compute_89/sm_89 compile attempt.");
  }
  if (!/QEMU/.test(gpuWorkerBuild.blockedReason ?? "") || !/segfault/.test(gpuWorkerBuild.blockedReason ?? "")) {
    fail("GPU worker build evidence must record QEMU segfault local build blocker.");
  }
  for (const key of [
    "cudaRuntimeRequired",
    "nvidiaRuntimeUsed",
    "modelWeightsLoaded",
    "mediaProcessed",
    "providerRuntimeUsed",
    "appBundleCopiedBeforeProofTarget",
    "publicArtifactCreated",
    "signedUrlCreated",
  ]) {
    if (gpuWorkerBuild[key] !== false) fail(`GPU worker build evidence expected ${key}=false`);
  }
}
const sam2Build = buildEvidence.get("sam2");
if (!sam2Build) {
  fail("Missing local SAM2 install-proof build evidence.");
} else {
  if (sam2Build.dockerfile !== "docker/prod/sam2-runtime/Dockerfile") fail("SAM2 build dockerfile mismatch.");
  if (sam2Build.target !== "ai_graphics_install_proof") fail("SAM2 build target mismatch.");
  if (sam2Build.platform !== "linux/amd64") fail("SAM2 build platform mismatch.");
  if (sam2Build.status !== "passed") fail("SAM2 install-proof build must be passed.");
  if (sam2Build.importSmokeStatus !== "passed") fail("SAM2 import smoke must be passed.");
  for (const [moduleName, version] of Object.entries({
    torch: "2.5.1+cu124",
    torchvision: "0.20.1+cu124",
    numpy: "1.26.4",
    PIL: "12.2.0",
    cv2: "4.11.0",
    hydra: "1.3.2",
    iopath: "0.1.10",
    sam2: "unknown",
  })) {
    if (sam2Build.observedImportVersions?.[moduleName] !== version) {
      fail(`SAM2 build evidence missing ${moduleName} ${version}`);
    }
  }
  for (const key of [
    "cudaRuntimeRequired",
    "nvidiaRuntimeUsed",
    "modelWeightsLoaded",
    "mediaProcessed",
    "providerRuntimeUsed",
    "appBundleCopiedBeforeProofTarget",
    "publicArtifactCreated",
    "signedUrlCreated",
  ]) {
    if (sam2Build[key] !== false) fail(`SAM2 build evidence expected ${key}=false`);
  }
}
const realEsrganBuild = buildEvidence.get("real_esrgan");
if (!realEsrganBuild) {
  fail("Missing local Real-ESRGAN install-proof build evidence.");
} else {
  if (realEsrganBuild.dockerfile !== "docker/prod/real-esrgan-runtime/Dockerfile") fail("Real-ESRGAN build dockerfile mismatch.");
  if (realEsrganBuild.target !== "ai_graphics_install_proof") fail("Real-ESRGAN build target mismatch.");
  if (realEsrganBuild.platform !== "linux/amd64") fail("Real-ESRGAN build platform mismatch.");
  if (realEsrganBuild.status !== "passed") fail("Real-ESRGAN install-proof build must be passed.");
  if (realEsrganBuild.importSmokeStatus !== "passed") fail("Real-ESRGAN import smoke must be passed.");
  for (const [moduleName, version] of Object.entries({
    torch: "2.5.1+cu124",
    torchvision: "0.20.1+cu124",
    numpy: "1.26.4",
    PIL: "10.4.0",
    cv2: "4.11.0",
    basicsr: "1.4.2",
  })) {
    if (realEsrganBuild.observedImportVersions?.[moduleName] !== version) {
      fail(`Real-ESRGAN build evidence missing ${moduleName} ${version}`);
    }
  }
  if (!/realesrgan/.test(realEsrganBuild.observedImportVersions?.realesrgan ?? "")) {
    fail("Real-ESRGAN build evidence missing realesrgan import success.");
  }
  for (const key of [
    "cudaRuntimeRequired",
    "nvidiaRuntimeUsed",
    "modelWeightsLoaded",
    "mediaProcessed",
    "providerRuntimeUsed",
    "appBundleCopiedBeforeProofTarget",
    "publicArtifactCreated",
    "signedUrlCreated",
  ]) {
    if (realEsrganBuild[key] !== false) fail(`Real-ESRGAN build evidence expected ${key}=false`);
  }
}
const birefnetBuild = buildEvidence.get("birefnet");
if (!birefnetBuild) {
  fail("Missing local BiRefNet install-proof build evidence.");
} else {
  if (birefnetBuild.dockerfile !== "docker/prod/birefnet-runtime/Dockerfile") fail("BiRefNet build dockerfile mismatch.");
  if (birefnetBuild.target !== "ai_graphics_install_proof") fail("BiRefNet build target mismatch.");
  if (birefnetBuild.platform !== "linux/amd64") fail("BiRefNet build platform mismatch.");
  if (birefnetBuild.status !== "passed") fail("BiRefNet install-proof build must be passed.");
  if (birefnetBuild.importSmokeStatus !== "passed") fail("BiRefNet import smoke must be passed.");
  for (const [moduleName, version] of Object.entries({
    torch: "2.5.1+cu124",
    torchvision: "0.20.1+cu124",
    transformers: "4.57.6",
    safetensors: "0.7.0",
    PIL: "10.4.0",
    cv2: "4.10.0",
    numpy: "1.26.4",
    timm: "1.0.27",
    kornia: "0.8.1",
    einops: "0.8.2",
    scipy: "1.15.3",
    skimage: "0.25.2",
  })) {
    if (birefnetBuild.observedImportVersions?.[moduleName] !== version) {
      fail(`BiRefNet build evidence missing ${moduleName} ${version}`);
    }
  }
  for (const key of [
    "cudaRuntimeRequired",
    "nvidiaRuntimeUsed",
    "modelWeightsLoaded",
    "mediaProcessed",
    "providerRuntimeUsed",
    "appBundleCopiedBeforeProofTarget",
    "publicArtifactCreated",
    "signedUrlCreated",
  ]) {
    if (birefnetBuild[key] !== false) fail(`BiRefNet build evidence expected ${key}=false`);
  }
}

const booleans = proof?.booleans || {};
for (const key of [
  "gpuModelInstallBuildTargetsPrepared",
  "all8ModelGpuToolsCovered",
  "all4ImageProfilesHaveInstallProofTarget",
  "sam2InstallProofTargetBuiltLocally",
  "sam2InstallProofImportSmokePassed",
  "realEsrganInstallProofTargetBuiltLocally",
  "realEsrganInstallProofImportSmokePassed",
  "birefnetInstallProofTargetBuiltLocally",
  "birefnetInstallProofImportSmokePassed",
  "linuxAmd64GpuBuilderStillRequired",
  "agentCanSelectForPlanning",
]) {
  if (booleans[key] !== true) fail(`Expected ${key}=true`);
}
for (const key of [
  "all8GpuModelInstallProofTargetsBuiltLocally",
  "appBundleRequiredForInstallProof",
  "modelWeightsRequiredForInstallProof",
  "localDockerGpuRuntimeAvailable",
  "localGpuRuntimeExecuted",
  "modelWeightsDownloaded",
  "mediaProcessingPerformed",
  "providerRuntimePerformed",
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
  "publicArtifactCreated",
  "signedUrlCreated",
]) {
  if (booleans[key] !== false) fail(`Expected ${key}=false`);
}

for (const token of [
  "ai_graphics_install_proof",
  "docker buildx build --platform linux/amd64",
  "SAM2",
  "torch==2.5.1+cu124",
  "Real-ESRGAN",
  "basicsr==1.4.2",
  "BiRefNet",
  "transformers==4.57.6",
  "kornia==0.8.1",
  "TORCH_CUDA_ARCH_LIST=8.9",
  "Python.h",
  "blocked_pending_native_linux_amd64_gpu_builder",
  "QEMU",
  "nvidia-smi",
  "agentCanExecuteToolsNow=false",
  "gpuModelRuntimeReadyNow=false",
]) {
  if (!proofMarkdown.includes(token)) fail(`Markdown missing ${token}`);
}

for (const [label, text] of [
  ["result record", resultRecord],
  ["implementation prompt", implementationPrompt],
  ["scorecard", scorecard],
]) {
  for (const token of [
    "ai_graphics_gpu_model_install_build_targets_prepared_with_warnings",
    "ai_graphics_install_proof",
    "gpuModelRuntimeReadyNow",
  ]) {
    if (!text.includes(token)) fail(`${label} missing ${token}`);
  }
}

const requiredSmokeTokens = [
  '"gpu_worker_ai_graphics"',
  '"sam2"',
  '"birefnet"',
  '"real_esrgan"',
  'MODEL_DOWNLOADS_ENABLED must stay false',
  'PROVIDER_EXECUTION_ENABLED must stay false',
  '"modelWeightsLoaded": False',
  '"cudaRuntimeRequired": False',
];
const smoke = read("docker/prod/ai-graphics-gpu-install-smoke.py");
for (const token of requiredSmokeTokens) {
  if (!smoke.includes(token)) fail(`Smoke script missing ${token}`);
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

const allText = [proofMarkdown, JSON.stringify(proof || {})].join("\n");
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
  /mediaProcessingPerformed["`:\s]+true/i,
  /providerRuntimePerformed["`:\s]+true/i,
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
  decision: proof?.decision,
  profilesChecked: Object.keys(expectedProfiles).length,
  toolsChecked: expectedTools.length,
  gpuModelRuntimeReadyNow: false,
}, null, 2));
