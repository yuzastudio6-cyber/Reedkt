import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const failures = [];

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

const packageJson = readJson("package.json");
const proof = readJson("docs/tool-intelligence/ai-graphics/gpu-worker-install-proof.json");
const proofMarkdown = read("docs/tool-intelligence/ai-graphics/gpu-worker-install-proof.md");
const nodeProof = readJson("docs/tool-intelligence/ai-graphics/node-runtime-proof.json");
const installReadiness = readJson("docs/tool-intelligence/ai-graphics/21-tool-runtime-install-readiness.json");
const gpuImportReadiness = readJson("docs/tool-intelligence/ai-graphics/gpu-import-readiness.json");
const smoke = read("docker/prod/ai-graphics-gpu-install-smoke.py");

const files = {
  gpuDocker: read("docker/prod/gpu-worker/Dockerfile"),
  gpuRequirements: read("docker/prod/gpu-worker/requirements.gpu.txt"),
  gpuReadme: read("docker/prod/gpu-worker/README.md"),
  gpuPolicy: read("docker/prod/gpu-worker/gpu-tool-version-policy.md"),
  sam2Docker: read("docker/prod/sam2-runtime/Dockerfile"),
  sam2Requirements: read("docker/prod/sam2-runtime/requirements.sam2.txt"),
  birefnetDocker: read("docker/prod/birefnet-runtime/Dockerfile"),
  birefnetRequirements: read("docker/prod/birefnet-runtime/requirements.birefnet.txt"),
  realEsrganDocker: read("docker/prod/real-esrgan-runtime/Dockerfile"),
  realEsrganRequirements: read("docker/prod/real-esrgan-runtime/requirements.real-esrgan.txt"),
};

const expectedScript = "ai-graphics:gpu-worker-install-proof:diagnostics";
if (packageJson?.scripts?.[expectedScript] !== "node scripts/validation/ai-graphics-gpu-worker-install-proof-diagnostics.mjs") {
  fail(`Missing package script ${expectedScript}`);
}

if (proof?.decision !== "ai_graphics_gpu_worker_install_proof_hardened_with_warnings") {
  fail(`Unexpected decision ${proof?.decision}`);
}
if (proof?.sourcePr?.number !== 780 || proof?.sourcePr?.headSha !== "740a72818b4ca89bbec24ca9c9d22eae915d9a91") {
  fail("PR #780 source evidence is missing or stale.");
}
if (nodeProof?.decision !== "ai_graphics_node_runtime_proof_completed_with_warnings") {
  fail("Node runtime proof source is missing.");
}
if (!installReadiness?.booleans?.all21ToolsCovered) fail("21-tool install readiness source is missing.");
if (!gpuImportReadiness?.booleans?.gpuImportReadinessAligned) fail("GPU import readiness source is missing.");

const allTools = [
  "torch_torchvision",
  "transformers",
  "sam2",
  "birefnet",
  "real_esrgan",
  "kornia",
  "rembg",
  "transparent_background",
  "d3",
  "echarts",
  "vega_lite",
  "vega",
  "satori",
  "svgdotjs_svg_js",
  "viz_js",
  "lottie_web",
  "animejs",
  "three_js",
  "pixi_js",
  "konva",
  "babylonjs",
];
const proofTools = new Set((proof?.tools || []).map((tool) => tool.toolId));
for (const tool of allTools) {
  if (!proofTools.has(tool)) fail(`GPU worker install proof missing ${tool}`);
  if (!proofMarkdown.includes(tool)) fail(`GPU worker install markdown missing ${tool}`);
}
if (proofTools.size !== allTools.length) fail(`Expected ${allTools.length} proof tools, saw ${proofTools.size}`);

const pinned = proof?.pinnedPackages || {};
const expectedPins = {
  "torch": "2.5.1+cu124",
  "torchvision": "0.20.1+cu124",
  "transformers": "4.57.6",
  "kornia": "0.8.1",
  "opencv-python-headless": "4.12.0.88",
  "rembg[gpu]": "2.0.76",
  "transparent-background": "1.3.4",
  "realesrgan": "0.3.0",
};
for (const [pkg, version] of Object.entries(expectedPins)) {
  if (pinned[pkg] !== version) fail(`Pinned package mismatch ${pkg}`);
}

function requireLine(text, line, label) {
  if (!text.split(/\r?\n/).some((candidate) => candidate.trim() === line)) {
    fail(`${label} missing exact line ${line}`);
  }
}

for (const line of [
  "--extra-index-url https://download.pytorch.org/whl/cu124",
  "torch==2.5.1+cu124",
  "torchvision==0.20.1+cu124",
  "transformers==4.57.6",
  "kornia==0.8.1",
  "opencv-python==4.10.0.84",
  "opencv-python-headless==4.10.0.84",
  "rembg[gpu]==2.0.69",
  "transparent-background==1.3.4",
  "realesrgan==0.3.0",
]) {
  requireLine(files.gpuRequirements, line, "gpu-worker requirements");
}
if (!files.gpuDocker.includes("--no-build-isolation") || !files.gpuDocker.includes("facebookresearch/sam2.git@2b90b9f5ceec907a1c18123530e92e794ad901a4")) {
  fail("gpu-worker Dockerfile must install pinned SAM2 source with --no-build-isolation after the pinned Torch stack.");
}
if (!files.gpuDocker.includes("TORCH_CUDA_ARCH_LIST=8.9")) {
  fail("gpu-worker Dockerfile must set TORCH_CUDA_ARCH_LIST=8.9 for the NVIDIA L4 install-proof target.");
}
if (!files.gpuDocker.includes("python3-dev")) {
  fail("gpu-worker Dockerfile must install python3-dev before SAM2 source extension build.");
}

for (const line of [
  "torch==2.5.1+cu124",
  "torchvision==0.20.1+cu124",
  "numpy==1.26.4",
  "pillow==10.4.0",
  "tqdm==4.67.1",
  "hydra-core==1.3.3",
  "iopath==0.1.10",
  "opencv-python-headless==4.10.0.84",
  "git+https://github.com/facebookresearch/sam2.git@2b90b9f5ceec907a1c18123530e92e794ad901a4",
]) {
  requireLine(files.sam2Requirements, line, "SAM2 requirements");
}

for (const line of [
  "torch==2.5.1+cu124",
  "torchvision==0.20.1+cu124",
  "transformers==4.57.6",
  "safetensors==0.7.0",
  "pillow==10.4.0",
  "opencv-python-headless==4.10.0.84",
  "numpy==1.26.4",
  "timm==1.0.27",
  "kornia==0.8.1",
  "einops==0.8.2",
  "scipy==1.15.3",
  "scikit-image==0.25.2",
]) {
  requireLine(files.birefnetRequirements, line, "BiRefNet requirements");
}

for (const line of [
  "torch==2.5.1+cu124",
  "torchvision==0.20.1+cu124",
  "numpy==1.26.4",
  "opencv-python-headless==4.10.0.84",
  "pillow==10.4.0",
  "tqdm==4.67.1",
  "basicsr==1.4.2",
  "realesrgan==0.3.0",
]) {
  requireLine(files.realEsrganRequirements, line, "Real-ESRGAN requirements");
}

for (const [label, dockerfile, profile] of [
  ["gpu-worker", files.gpuDocker, "gpu_worker_ai_graphics"],
  ["sam2", files.sam2Docker, "sam2"],
  ["birefnet", files.birefnetDocker, "birefnet"],
  ["real-esrgan", files.realEsrganDocker, "real_esrgan"],
]) {
  if (!dockerfile.includes("ai-graphics-gpu-install-smoke.py")) fail(`${label} Dockerfile missing install smoke copy.`);
  if (!dockerfile.includes(`--profile ${profile}`)) fail(`${label} Dockerfile missing install smoke profile ${profile}.`);
}

for (const token of [
  '"gpu_worker_ai_graphics"',
  '"sam2"',
  '"birefnet"',
  '"real_esrgan"',
  'MODEL_DOWNLOADS_ENABLED must stay false',
  'PROVIDER_EXECUTION_ENABLED must stay false',
  '"cudaRuntimeRequired": False',
]) {
  if (!smoke.includes(token)) fail(`Install smoke missing token ${token}`);
}
for (const forbidden of [
  /from_pretrained\(/,
  /snapshot_download\(/,
  /predict\(/,
  /remove\(/,
  /enhance\(/,
  /cuda\.is_available\(/,
]) {
  if (forbidden.test(smoke)) fail(`Install smoke contains forbidden runtime call ${forbidden}`);
}

if (!files.gpuReadme.includes("ai-graphics-gpu-install-smoke.py")) fail("GPU README must document build-time import smoke.");
if (!files.gpuPolicy.includes("2.5.1+cu124") || !files.gpuPolicy.includes("Worker image builds run import-only install smokes")) {
  fail("GPU version policy must document pinned install proof and build-time imports.");
}

const booleans = proof?.booleans || {};
for (const key of [
  "gpuWorkerInstallProofHardened",
  "all21ToolsStillCovered",
  "all8ModelGpuToolsMappedToInstallSurface",
  "dedicatedRuntimeImagesPreserved",
  "buildTimeImportSmokeDeclared",
  "directAiGraphicsGpuPackagesPinned",
  "agentCanSelectForPlanning",
]) {
  if (booleans[key] !== true) fail(`Expected ${key}=true`);
}
for (const key of [
  "trackAOrTrackBRuntimeOwnershipDuplicated",
  "localDockerGpuImageBuilt",
  "localGpuRuntimeExecuted",
  "modelWeightsDownloaded",
  "mediaProcessingPerformed",
  "agentCanExecuteToolsNow",
  "toolRouteExecutionReadyNow",
  "workerExecutionReadyNow",
  "gpuModelRuntimeReadyNow",
  "browserWebglCanvasRuntimeReadyNow",
  "runtimeBetaReadyNow",
  "internalBetaReadyNow",
  "externalBetaReadyNow",
  "productionReadyNow",
  "packageLockMutationPerformed",
  "publicArtifactCreated",
  "signedUrlCreated",
]) {
  if (booleans[key] !== false) fail(`Expected ${key}=false`);
}

const changedLock = execFileSync("git", [
  "diff",
  "--name-only",
  "origin/codex/rp-ai-graphics-node-runtime-proof",
  "--",
  "package-lock.json",
], {
  encoding: "utf8",
  env: { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" },
}).trim();
if (changedLock) fail("package-lock.json changed in GPU worker install proof lane.");

const committedForbidden = execFileSync("git", [
  "ls-files",
  ".local-artifacts",
  "public",
  "dist",
  "build",
], {
  encoding: "utf8",
  env: { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" },
}).trim();
if (committedForbidden.includes(".local-artifacts")) fail(".local-artifacts must not be committed.");

const allText = [
  proofMarkdown,
  JSON.stringify(proof || {}),
  files.gpuReadme,
  files.gpuPolicy,
].join("\n");
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
  toolsCovered: allTools.length,
  gpuModelToolsMapped: 8,
  localGpuRuntimeExecuted: false,
  runtimeBetaReadyNow: false,
}, null, 2));
