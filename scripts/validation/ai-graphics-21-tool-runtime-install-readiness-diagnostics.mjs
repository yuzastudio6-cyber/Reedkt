import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const failures = [];

function fail(message) {
  failures.push(message);
}

function readJson(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`Missing ${relativePath}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (error) {
    fail(`Invalid JSON in ${relativePath}: ${error.message}`);
    return null;
  }
}

function readText(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`Missing ${relativePath}`);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

const packageJson = readJson("package.json");
const packageLock = readJson("package-lock.json");
const readiness = readJson("docs/tool-intelligence/ai-graphics/21-tool-runtime-install-readiness.json");
const readinessMarkdown = readText("docs/tool-intelligence/ai-graphics/21-tool-runtime-install-readiness.md");
const gpuRequirements = readText("docker/prod/gpu-worker/requirements.gpu.txt");
const gpuDockerfile = readText("docker/prod/gpu-worker/Dockerfile");
const gpuPolicy = readText("docs/production-gpu-worker-tool-install-policy.md");
const gpuPlan = readText("docs/production-gpu-ai-install-plan.md");
const containerImagePlan = readText("docs/production-container-image-plan.md");
const gpuToolVersionPolicy = readText("docker/prod/gpu-worker/gpu-tool-version-policy.md");

const expectedScript = "ai-graphics:21-tool-runtime-install-readiness:diagnostics";
if (packageJson?.scripts?.[expectedScript] !== "node scripts/validation/ai-graphics-21-tool-runtime-install-readiness-diagnostics.mjs") {
  fail(`Missing or incorrect package script ${expectedScript}`);
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
  "babylonjs"
];

const nodePackages = {
  d3: { packageName: "d3", version: "7.9.0" },
  echarts: { packageName: "echarts", version: "6.1.0" },
  vega_lite: { packageName: "vega-lite", version: "6.4.3" },
  vega: { packageName: "vega", version: "6.2.0" },
  satori: { packageName: "satori", version: "0.26.0" },
  svgdotjs_svg_js: { packageName: "@svgdotjs/svg.js", version: "3.2.5" },
  viz_js: { packageName: "@viz-js/viz", version: "3.28.0" },
  lottie_web: { packageName: "lottie-web", version: "5.13.0" },
  animejs: { packageName: "animejs", version: "4.4.1" },
  three_js: { packageName: "three", version: "0.184.0" },
  pixi_js: { packageName: "pixi.js", version: "8.19.0" },
  konva: { packageName: "konva", version: "10.3.0" },
  babylonjs: { packageName: "babylonjs", version: "9.12.0" }
};

const lockPackages = packageLock?.packages || {};
const rootPackage = lockPackages[""] || {};
const rootDeps = {
  ...(rootPackage.dependencies || {}),
  ...(rootPackage.devDependencies || {}),
  ...(rootPackage.optionalDependencies || {})
};

for (const [toolId, expected] of Object.entries(nodePackages)) {
  if (!rootDeps[expected.packageName]) {
    fail(`${toolId} missing direct package declaration ${expected.packageName}`);
  }
  const lockEntry = lockPackages[`node_modules/${expected.packageName}`];
  if (!lockEntry) {
    fail(`${toolId} missing package-lock entry for ${expected.packageName}`);
  } else if (lockEntry.version !== expected.version) {
    fail(`${toolId} expected ${expected.packageName}@${expected.version}, saw ${lockEntry.version}`);
  }
}

const requiredRequirementLines = [
  "torch",
  "torchvision",
  "transformers",
  "kornia",
  "rembg[gpu]",
  "transparent-background",
  "realesrgan",
  "git+https://github.com/facebookresearch/sam2.git@2b90b9f5ceec907a1c18123530e92e794ad901a4#egg=SAM-2"
];

for (const requirement of requiredRequirementLines) {
  if (!gpuRequirements.split(/\r?\n/).some((line) => line.trim() === requirement)) {
    fail(`GPU requirements missing ${requirement}`);
  }
}

for (const requiredText of [
  "FROM nvidia/cuda:12.4.1-devel-ubuntu22.04",
  "git",
  "SAM2_BUILD_ALLOW_ERRORS=0",
  "CUDA_HOME=/usr/local/cuda",
  "/opt/reeditpro/model-weights/transformers",
  "/opt/reeditpro/model-weights/rembg",
  "/opt/reeditpro/model-weights/transparent-background"
]) {
  if (!gpuDockerfile.includes(requiredText)) {
    fail(`GPU Dockerfile missing ${requiredText}`);
  }
}

if (readiness) {
  const toolIds = new Set((readiness.tools || []).map((tool) => tool.toolId));
  for (const toolId of expectedTools) {
    if (!toolIds.has(toolId)) {
      fail(`Readiness manifest missing tool ${toolId}`);
    }
  }
  if (toolIds.size !== expectedTools.length) {
    fail(`Readiness manifest expected ${expectedTools.length} unique tools, saw ${toolIds.size}`);
  }
  const booleans = readiness.booleans || {};
  const requiredTrue = [
    "all21ToolsCovered",
    "all13NodeGraphicsPackagesDeclaredAndLocked",
    "gpuWorkerInstallDeclarationsExpanded",
    "sam2UsesPinnedGpuSourceInstall",
    "birefnetUsesTransformersModelPath",
    "heavyModelToolsTargetGpuWorker",
    "coordinationDuplicateSearchCompleted",
    "agentCanSelectForPlanning"
  ];
  const requiredFalse = [
    "agentCanExecuteToolsNow",
    "toolRouteExecutionReadyNow",
    "workerExecutionReadyNow",
    "browserWebglCanvasRuntimeReadyNow",
    "gpuModelRuntimeReadyNow",
    "runtimeBetaReadyNow",
    "internalBetaReadyNow",
    "externalBetaReadyNow",
    "productionReadyNow",
    "packageLockMutationPerformed",
    "modelWeightsDownloaded",
    "mediaProcessingPerformed",
    "publicArtifactCreated",
    "signedUrlCreated"
  ];
  for (const key of requiredTrue) {
    if (booleans[key] !== true) {
      fail(`Expected ${key}=true`);
    }
  }
  for (const key of requiredFalse) {
    if (booleans[key] !== false) {
      fail(`Expected ${key}=false`);
    }
  }
}

for (const text of [
  "21-tool",
  "runtimeBetaReadyNow=false",
  "GPU worker",
  "Track A",
  "Track B"
]) {
  if (!readinessMarkdown.includes(text)) {
    fail(`Readiness markdown missing ${text}`);
  }
}

for (const text of [
  "Transformers",
  "SAM2 pinned source install",
  "Real-ESRGAN package declaration",
  "Package declarations do not approve inference"
]) {
  if (!gpuPolicy.includes(text)) {
    fail(`GPU worker policy missing ${text}`);
  }
}

if (!gpuPlan.includes("AI Graphics 21-Tool Install Readiness")) {
  fail("GPU install plan missing AI Graphics 21-Tool Install Readiness section.");
}

for (const text of [
  "Transformers",
  "pinned SAM2 source install",
  "Real-ESRGAN package foundation",
  "BiRefNet uses the Transformers model-loader path"
]) {
  if (!containerImagePlan.includes(text)) {
    fail(`Container image plan missing ${text}`);
  }
}

for (const text of [
  "Transformers",
  "Real-ESRGAN",
  "source-declared: pinned facebookresearch/SAM2 source install",
  "model-loader path: BiRefNet through Transformers"
]) {
  if (!gpuToolVersionPolicy.includes(text)) {
    fail(`GPU tool version policy missing ${text}`);
  }
}

const packageLockDiff = execFileSync("git", [
  "diff",
  "--name-only",
  "origin/codex/rp-ai-graphics-cpu-static-execution-proof-phase-0-owner-review",
  "--",
  "package-lock.json"
], {
  encoding: "utf8",
  env: {
    ...process.env,
    DEVELOPER_DIR: "/Library/Developer/CommandLineTools"
  }
}).trim();
if (packageLockDiff) {
  fail("package-lock.json changed in this install-readiness slice.");
}

const forbiddenClaims = [
  /runtimeBetaReadyNow["`:\s]+true/i,
  /internalBetaReadyNow["`:\s]+true/i,
  /productionReadyNow["`:\s]+true/i,
  /agentCanExecuteToolsNow["`:\s]+true/i,
  /gpuModelRuntimeReadyNow["`:\s]+true/i,
  /modelWeightsDownloaded["`:\s]+true/i,
  /mediaProcessingPerformed["`:\s]+true/i,
  /publicArtifactCreated["`:\s]+true/i,
  /signedUrlCreated["`:\s]+true/i
];
const changedDocs = [
  readinessMarkdown,
  JSON.stringify(readiness || {}),
  gpuPolicy,
  gpuPlan,
  containerImagePlan,
  gpuToolVersionPolicy
].join("\n");
for (const pattern of forbiddenClaims) {
  if (pattern.test(changedDocs)) {
    fail(`Forbidden readiness claim matched ${pattern}`);
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({
    status: "failed",
    decision: readiness?.decision || null,
    failures
  }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "passed",
  decision: readiness.decision,
  toolsCovered: expectedTools.length,
  nodePackagesChecked: Object.keys(nodePackages).length,
  gpuRequirementsChecked: requiredRequirementLines.length,
  runtimeBetaReadyNow: false
}, null, 2));
