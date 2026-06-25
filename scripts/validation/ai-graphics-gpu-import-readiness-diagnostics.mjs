import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const failures = [];

function fail(message) {
  failures.push(message);
}

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`Missing ${relativePath}`);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

function readJson(relativePath) {
  const text = read(relativePath);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`Invalid JSON in ${relativePath}: ${error.message}`);
    return null;
  }
}

const packageJson = readJson("package.json");
const packageLock = readJson("package-lock.json");
const readiness = readJson("docs/tool-intelligence/ai-graphics/gpu-import-readiness.json");
const readinessMarkdown = read("docs/tool-intelligence/ai-graphics/gpu-import-readiness.md");
const installReadiness = readJson("docs/tool-intelligence/ai-graphics/21-tool-runtime-install-readiness.json");
const gpuImportChecks = read("server/workers/production-readiness/gpu-tool-python-import-checks.ts");
const gpuAiReadiness = read("server/workers/production-readiness/gpu-ai-readiness-checks.ts");
const modelTemplates = read("server/model-weights/model-weight-manifest-templates.ts");
const readinessSpecs = read("server/workers/production-readiness/production-tool-readiness-specs.ts");
const gpuSmoke = read("server/smoke/production-gpu-ai-install-smoke.ts");
const gpuRequirements = read("docker/prod/gpu-worker/requirements.gpu.txt");
const modelLayout = read("docker/prod/gpu-worker/model-weight-layout.md");
const gpuPlan = read("docs/production-gpu-ai-install-plan.md");
const gpuPolicy = read("docs/production-gpu-worker-tool-install-policy.md");

const expectedScript = "ai-graphics:gpu-import-readiness:diagnostics";
if (packageJson?.scripts?.[expectedScript] !== "node scripts/validation/ai-graphics-gpu-import-readiness-diagnostics.mjs") {
  fail(`Missing or incorrect package script ${expectedScript}`);
}

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
const gpuTools = [
  "torch_torchvision",
  "transformers",
  "sam2",
  "birefnet",
  "real_esrgan",
  "kornia",
  "rembg",
  "transparent_background",
];

if (installReadiness) {
  const covered = new Set((installReadiness.tools || []).map((tool) => tool.toolId));
  for (const tool of allTools) if (!covered.has(tool)) fail(`21-tool install readiness missing ${tool}`);
}

if (readiness) {
  if (readiness.decision !== "ai_graphics_gpu_import_readiness_aligned_with_21_tool_install_plan") {
    fail(`Unexpected decision ${readiness.decision}`);
  }
  const mapped = new Set((readiness.gpuImportReadinessTools || []).map((tool) => tool.toolId));
  for (const tool of gpuTools) if (!mapped.has(tool)) fail(`GPU import readiness missing ${tool}`);
  const booleans = readiness.booleans || {};
  for (const key of [
    "gpuImportReadinessAligned",
    "all21ToolsStillCovered",
    "gpuHeavyToolsMappedToGpuWorker",
    "sam2NoLongerPendingSourceInstallReview",
    "realEsrganNoLongerPendingSourceInstallReview",
    "birefnetUsesTransformersImportPath",
    "rembgModelWeightTemplateAdded",
    "transparentBackgroundModelWeightTemplateAdded",
    "npmCiFromLockForValidation",
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
    "packageLockMutationPerformed",
    "modelWeightsDownloaded",
    "mediaProcessingPerformed",
    "publicArtifactCreated",
    "signedUrlCreated",
  ]) {
    if (booleans[key] !== false) fail(`Expected ${key}=false`);
  }
}

for (const token of [
  "python_import_transformers",
  "python_import_transformers_for_birefnet",
  "python_import_sam2",
  "python_import_realesrgan",
  "python_import_rembg",
  "python_import_transparent_background",
  "python_import_kornia",
  "python_import_torch",
  "python_import_torchvision",
]) {
  if (!gpuImportChecks.includes(token)) fail(`Missing GPU import check ${token}`);
}

for (const stale of [
  "packageName: 'BiRefNet'",
  "packageName: 'SAM2'",
  "packageName: 'Real-ESRGAN'",
  "pending_source_install_review: BiRefNet",
  "pending_source_install_review: SAM2",
  "pending_source_install_review: Real-ESRGAN",
]) {
  if (gpuImportChecks.includes(stale) || gpuRequirements.includes(stale) || gpuSmoke.includes(stale)) {
    fail(`Stale pending-source marker remains: ${stale}`);
  }
}

if (!gpuImportChecks.includes("{ toolId: 'film' as const, packageName: 'FILM'")) {
  fail("FILM must remain the only pending source-install review item.");
}

for (const token of [
  "'transparent_background'",
  "'rembg'",
  "'real_esrgan'",
  "'sam2'",
  "'birefnet'",
]) {
  if (!gpuAiReadiness.includes(token)) fail(`GPU AI readiness missing ${token}`);
}

for (const token of [
  "transparent_background_model",
  "rembg_model",
  "sam2_checkpoint",
  "birefnet_model",
  "real_esrgan_model",
  "/opt/reeditpro/model-weights/transparent-background/",
  "/opt/reeditpro/model-weights/rembg/",
]) {
  if (!modelTemplates.includes(token) && !modelLayout.includes(token)) {
    fail(`Missing model-weight template/layout token ${token}`);
  }
}

for (const requirement of [
  "torch",
  "torchvision",
  "transformers",
  "kornia",
  "rembg[gpu]",
  "transparent-background",
  "realesrgan",
  "git+https://github.com/facebookresearch/sam2.git@2b90b9f5ceec907a1c18123530e92e794ad901a4#egg=SAM-2",
]) {
  if (!gpuRequirements.split(/\r?\n/).some((line) => line.trim() === requirement)) {
    fail(`GPU requirements missing exact declaration ${requirement}`);
  }
}

for (const token of [
  "transformers + ZhengPeng7/BiRefNet model snapshot",
  "SAM-2 pinned source package",
  "packageName: 'realesrgan'",
  "packageName: 'babylonjs'",
  "importName: 'babylonjs'",
]) {
  if (!readinessSpecs.includes(token)) fail(`Production readiness specs missing ${token}`);
}

for (const token of [
  "transformers",
  "SAM2",
  "rembg[gpu]",
  "transparent-background",
  "realesrgan",
  "Only FILM remains in pending source-install review",
]) {
  if (!gpuPlan.includes(token) && !gpuPolicy.includes(token) && !readinessMarkdown.includes(token)) {
    fail(`Docs missing ${token}`);
  }
}

const packageLockDiff = execFileSync("git", [
  "diff",
  "--name-only",
  "origin/codex/rp-ai-graphics-21-tool-runtime-install-readiness",
  "--",
  "package-lock.json",
], {
  encoding: "utf8",
  env: {
    ...process.env,
    DEVELOPER_DIR: "/Library/Developer/CommandLineTools",
  },
}).trim();
if (packageLockDiff) fail("package-lock.json changed in GPU import-readiness slice.");

const forbiddenPathOutput = execFileSync("git", [
  "ls-files",
  ".local-artifacts",
  "public",
  "dist",
  "build",
], {
  encoding: "utf8",
  env: {
    ...process.env,
    DEVELOPER_DIR: "/Library/Developer/CommandLineTools",
  },
}).trim();
if (forbiddenPathOutput.includes(".local-artifacts")) fail(".local-artifacts must not be committed.");

const changedText = [
  readinessMarkdown,
  JSON.stringify(readiness || {}),
  gpuPlan,
  gpuPolicy,
  gpuImportChecks,
  modelTemplates,
].join("\n");
for (const pattern of [
  /agentCanExecuteToolsNow["`:\s]+true/i,
  /toolRouteExecutionReadyNow["`:\s]+true/i,
  /workerExecutionReadyNow["`:\s]+true/i,
  /browserWebglCanvasRuntimeReadyNow["`:\s]+true/i,
  /gpuModelRuntimeReadyNow["`:\s]+true/i,
  /runtimeBetaReadyNow["`:\s]+true/i,
  /internalBetaReadyNow["`:\s]+true/i,
  /productionReadyNow["`:\s]+true/i,
  /modelWeightsDownloaded["`:\s]+true/i,
  /mediaProcessingPerformed["`:\s]+true/i,
  /publicArtifactCreated["`:\s]+true/i,
  /signedUrlCreated["`:\s]+true/i,
  /from_pretrained\(/i,
  /snapshot_download\(/i,
  /generated_local_fixture_passed/i,
  /dry_run_passed/i,
]) {
  if (pattern.test(changedText)) fail(`Forbidden claim or runtime token matched ${pattern}`);
}

if (!packageLock?.packages?.["node_modules/babylonjs"]?.version) {
  fail("package-lock must contain node_modules/babylonjs.");
}

if (failures.length) {
  console.error(JSON.stringify({ status: "failed", failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "passed",
  decision: readiness?.decision,
  gpuImportReadinessTools: gpuTools.length,
  runtimeBetaReadyNow: false,
  packageLockMutationPerformed: false,
}, null, 2));
