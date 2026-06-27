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
const nodeRuntimeProof = readJson("docs/tool-intelligence/ai-graphics/node-runtime-proof.json");
const browserRuntimeProof = readJson("docs/tool-intelligence/ai-graphics/browser-runtime-proof.json");
const satoriFontRuntimeProof = readJson("docs/tool-intelligence/ai-graphics/satori-font-runtime-proof.json");
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
  "realesrgan"
];

const acceptedNodeRuntimeStatuses = {
  d3: "node_runtime_proof_passed",
  vega_lite: "node_runtime_compile_passed",
  vega: "node_runtime_parse_passed",
  "svgdotjs_svg_js": "node_runtime_svg_construction_passed",
  viz_js: "node_runtime_dot_to_svg_passed"
};

const expectedReadinessRuntimeStatuses = {
  echarts: "browser_svg_chart_runtime_proof_passed_but_not_agent_executable",
  satori: "satori_font_fixture_svg_layout_proof_passed_but_not_agent_executable",
  lottie_web: "browser_svg_animation_runtime_proof_passed_but_not_agent_executable",
  animejs: "browser_dom_animation_runtime_proof_passed_but_not_agent_executable",
  three_js: "browser_webgl_runtime_proof_passed_but_not_agent_executable",
  pixi_js: "browser_canvas_webgl_runtime_proof_passed_but_not_agent_executable",
  konva: "browser_canvas_runtime_proof_passed_but_not_agent_executable",
  babylonjs: "browser_webgl_runtime_proof_passed_but_not_agent_executable"
};

const expectedBrowserRuntimeProofStatuses = {
  echarts: "browser_svg_chart_runtime_proof_passed",
  lottie_web: "browser_svg_animation_runtime_proof_passed",
  animejs: "browser_dom_animation_runtime_proof_passed",
  three_js: "browser_webgl_runtime_proof_passed",
  pixi_js: "browser_canvas_webgl_runtime_proof_passed",
  konva: "browser_canvas_runtime_proof_passed",
  babylonjs: "browser_webgl_runtime_proof_passed"
};

function hasRequirement(requirement) {
  return gpuRequirements.split(/\r?\n/).some((line) => {
    const trimmed = line.trim();
    return trimmed === requirement || trimmed.startsWith(`${requirement}==`);
  });
}

for (const requirement of requiredRequirementLines) {
  if (!hasRequirement(requirement)) {
    fail(`GPU requirements missing ${requirement}`);
  }
}
if (!gpuDockerfile.includes("--no-build-isolation") || !gpuDockerfile.includes("facebookresearch/sam2.git@2b90b9f5ceec907a1c18123530e92e794ad901a4")) {
  fail("GPU Dockerfile must install pinned SAM2 source with --no-build-isolation after the pinned Torch stack.");
}
if (!gpuDockerfile.includes("TORCH_CUDA_ARCH_LIST=8.9")) {
  fail("GPU Dockerfile must set TORCH_CUDA_ARCH_LIST=8.9 for the NVIDIA L4 install-proof target.");
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
  const readinessTools = new Map((readiness.tools || []).map((tool) => [tool.toolId, tool]));
  for (const toolId of expectedTools) {
    if (!toolIds.has(toolId)) {
      fail(`Readiness manifest missing tool ${toolId}`);
    }
  }
  if (toolIds.size !== expectedTools.length) {
    fail(`Readiness manifest expected ${expectedTools.length} unique tools, saw ${toolIds.size}`);
  }
  if (readiness.toolCounts?.jsRuntimeProofEvidenceAligned !== 13) {
    fail("Readiness manifest must align all 13 JS runtime proof evidence rows.");
  }
  if (readiness.toolCounts?.browserRuntimeProofToolsAligned !== 7) {
    fail("Readiness manifest must align all 7 browser runtime proof rows.");
  }
  if (readiness.toolCounts?.satoriFontRuntimeProofAligned !== 1) {
    fail("Readiness manifest must align the Satori font runtime proof row.");
  }
  if (readiness.toolCounts?.remainingNativeGpuRuntimeProofRequired !== 8) {
    fail("Readiness manifest must keep 8 native GPU runtime proofs pending.");
  }
  if (readiness.toolCounts?.remainingToolRouteWorkerGateRequired !== 21) {
    fail("Readiness manifest must keep Tool Route/Worker gates pending for all 21 tools.");
  }
  if (readiness.toolCounts?.remainingRuntimeProofRequired === 21) {
    fail("Readiness manifest still carries stale all-21 runtime proof pending count.");
  }
  for (const [toolId, status] of Object.entries(expectedReadinessRuntimeStatuses)) {
    if (readinessTools.get(toolId)?.runtimeStatus !== status) {
      fail(`Readiness manifest ${toolId} runtimeStatus expected ${status}`);
    }
  }
  for (const staleStatus of [
    "pending_browser_chart_runtime_proof",
    "blocked_pending_approved_font_fixture_for_text_svg_layout",
    "pending_animation_runtime_proof",
    "pending_browser_webgl_runtime_proof",
    "pending_browser_canvas_webgl_runtime_proof",
    "pending_canvas_runtime_proof"
  ]) {
    if ((readiness.tools || []).some((tool) => tool.runtimeStatus === staleStatus)) {
      fail(`Readiness manifest still has stale runtime status ${staleStatus}`);
    }
  }
  const booleans = readiness.booleans || {};
  const requiredTrue = [
    "all21ToolsCovered",
    "all13NodeGraphicsPackagesDeclaredAndLocked",
    "gpuWorkerInstallDeclarationsExpanded",
    "sam2UsesPinnedGpuSourceInstall",
    "birefnetUsesTransformersModelPath",
    "heavyModelToolsTargetGpuWorker",
    "all13JsGraphicsToolsHaveRuntimeProofEvidence",
    "all7BrowserRuntimeProofToolsAccepted",
    "satoriFontRuntimeProofAccepted",
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

if (nodeRuntimeProof?.decision !== "ai_graphics_node_runtime_proof_completed_with_warnings") {
  fail("Node runtime proof packet is missing or has unexpected decision.");
}
if (browserRuntimeProof?.decision !== "ai_graphics_browser_runtime_proof_completed_with_warnings") {
  fail("Browser runtime proof packet is missing or has unexpected decision.");
}
if (satoriFontRuntimeProof?.decision !== "ai_graphics_satori_font_runtime_proof_completed_with_warnings") {
  fail("Satori font runtime proof packet is missing or has unexpected decision.");
}
const nodeProofTools = new Map((nodeRuntimeProof?.tools || []).map((tool) => [tool.toolId, tool]));
for (const [toolId, status] of Object.entries(acceptedNodeRuntimeStatuses)) {
  if (nodeProofTools.get(toolId)?.status !== status) {
    fail(`Node runtime proof ${toolId} expected ${status}`);
  }
}
const browserProofTools = new Map((browserRuntimeProof?.tools || []).map((tool) => [tool.toolId, tool]));
for (const [toolId, status] of Object.entries(expectedBrowserRuntimeProofStatuses)) {
  if (browserProofTools.get(toolId)?.status !== status) {
    fail(`Browser runtime proof ${toolId} expected ${status}`);
  }
}
if (browserRuntimeProof?.booleans?.all7BrowserRuntimeToolsProofPassed !== true) {
  fail("Browser runtime proof must accept all 7 browser tools.");
}
if (satoriFontRuntimeProof?.tool?.status !== "satori_font_fixture_svg_layout_proof_passed") {
  fail("Satori font runtime proof status mismatch.");
}
if (satoriFontRuntimeProof?.booleans?.satoriTextSvgLayoutProofPassed !== true) {
  fail("Satori font runtime proof boolean mismatch.");
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
