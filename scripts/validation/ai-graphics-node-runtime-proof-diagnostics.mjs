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
    fail(`Invalid JSON ${relativePath}: ${error.message}`);
    return null;
  }
}

const packageJson = readJson("package.json");
const packageLock = readJson("package-lock.json");
const proof = readJson("docs/tool-intelligence/ai-graphics/node-runtime-proof.json");
const proofMarkdown = read("docs/tool-intelligence/ai-graphics/node-runtime-proof.md");
const proofRunner = read("scripts/validation/ai-graphics-node-runtime-proof.mjs");
const installReadiness = readJson("docs/tool-intelligence/ai-graphics/21-tool-runtime-install-readiness.json");
const gpuImportReadiness = readJson("docs/tool-intelligence/ai-graphics/gpu-import-readiness.json");

const expectedScripts = {
  "ai-graphics:node-runtime-proof": "node scripts/validation/ai-graphics-node-runtime-proof.mjs",
  "ai-graphics:node-runtime-proof:diagnostics": "node scripts/validation/ai-graphics-node-runtime-proof-diagnostics.mjs",
};
for (const [script, command] of Object.entries(expectedScripts)) {
  if (packageJson?.scripts?.[script] !== command) fail(`Missing package script ${script}`);
}

const expectedTools = [
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
const expectedPackages = {
  d3: "d3",
  echarts: "echarts",
  vega_lite: "vega-lite",
  vega: "vega",
  satori: "satori",
  svgdotjs_svg_js: "@svgdotjs/svg.js",
  viz_js: "@viz-js/viz",
  lottie_web: "lottie-web",
  animejs: "animejs",
  three_js: "three",
  pixi_js: "pixi.js",
  konva: "konva",
  babylonjs: "babylonjs",
};
const rootPackage = packageLock?.packages?.[""] || {};
const rootDeps = {
  ...(rootPackage.dependencies || {}),
  ...(rootPackage.devDependencies || {}),
  ...(rootPackage.optionalDependencies || {}),
};
for (const [tool, packageName] of Object.entries(expectedPackages)) {
  if (!rootDeps[packageName]) fail(`${tool} missing root dependency ${packageName}`);
  if (!packageLock?.packages?.[`node_modules/${packageName}`]?.version) fail(`${tool} missing lock entry ${packageName}`);
}

if (proof?.decision !== "ai_graphics_node_runtime_proof_completed_with_warnings") {
  fail(`Unexpected node runtime proof decision ${proof?.decision}`);
}
const proofTools = new Map((proof?.tools || []).map((tool) => [tool.toolId, tool]));
for (const tool of expectedTools) {
  if (!proofTools.has(tool)) fail(`Proof missing ${tool}`);
  if (!proofMarkdown.includes(tool)) fail(`Proof markdown missing ${tool}`);
}
if (proofTools.size !== expectedTools.length) fail(`Expected ${expectedTools.length} proof tools, saw ${proofTools.size}`);

for (const [tool, status] of Object.entries({
  d3: "node_runtime_proof_passed",
  echarts: "import_api_shape_passed_browser_runtime_pending",
  vega_lite: "node_runtime_compile_passed",
  vega: "node_runtime_parse_passed",
  satori: "import_api_shape_passed_font_fixture_pending",
  svgdotjs_svg_js: "node_runtime_svg_construction_passed",
  viz_js: "node_runtime_dot_to_svg_passed",
  lottie_web: "manifest_metadata_import_passed_player_runtime_pending",
  animejs: "import_api_shape_passed_animation_runtime_pending",
  three_js: "import_api_shape_passed_webgl_runtime_pending",
  pixi_js: "import_api_shape_passed_canvas_webgl_runtime_pending",
  konva: "import_api_shape_passed_canvas_runtime_pending",
  babylonjs: "import_api_shape_passed_webgl_runtime_pending",
})) {
  if (proofTools.get(tool)?.status !== status) fail(`${tool} status mismatch: ${proofTools.get(tool)?.status}`);
}

const booleans = proof?.booleans || {};
for (const key of [
  "nodeRuntimeProofCompleted",
  "all13NodeGraphicsToolsProofAttempted",
  "npmCiFromLockForValidation",
  "d3NodeRuntimeProofPassed",
  "vegaLiteNodeCompilePassed",
  "vegaNodeParsePassed",
  "svgdotjsNodeSvgConstructionPassed",
  "vizJsNodeDotToSvgPassed",
  "satoriImportApiPassedFontFixturePending",
  "browserRuntimeStillRequired",
  "webglCanvasRuntimeStillRequired",
  "agentCanSelectForPlanning",
]) {
  if (booleans[key] !== true) fail(`Expected ${key}=true`);
}
for (const key of [
  "agentCanExecuteToolsNow",
  "toolRouteExecutionReadyNow",
  "workerExecutionReadyNow",
  "browserWebglCanvasRuntimeReadyNow",
  "runtimeBetaReadyNow",
  "internalBetaReadyNow",
  "externalBetaReadyNow",
  "productionReadyNow",
  "packageLockMutationPerformed",
  "generatedArtifactsCommitted",
  "publicArtifactCreated",
  "signedUrlCreated",
]) {
  if (booleans[key] !== false) fail(`Expected ${key}=false`);
}

if (!installReadiness?.booleans?.all21ToolsCovered) fail("21-tool install readiness source is not present.");
if (!gpuImportReadiness?.booleans?.gpuImportReadinessAligned) fail("GPU import readiness source is not present.");

for (const forbidden of [
  /new\s+WebGLRenderer\(/,
  /new\s+Application\(/,
  /new\s+Stage\(/,
  /new\s+Engine\(/,
  /loadAnimation\(/,
  /from_pretrained\(/,
  /snapshot_download\(/,
]) {
  if (forbidden.test(proofRunner)) fail(`Proof runner contains forbidden runtime call ${forbidden}`);
}

const changedLock = execFileSync("git", [
  "diff",
  "--name-only",
  "origin/codex/rp-ai-graphics-gpu-import-readiness",
  "--",
  "package-lock.json",
], {
  encoding: "utf8",
  env: { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" },
}).trim();
if (changedLock) fail("package-lock.json changed in node runtime proof lane.");

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

const allText = [proofMarkdown, JSON.stringify(proof || {})].join("\n");
for (const pattern of [
  /agentCanExecuteToolsNow["`:\s]+true/i,
  /toolRouteExecutionReadyNow["`:\s]+true/i,
  /workerExecutionReadyNow["`:\s]+true/i,
  /browserWebglCanvasRuntimeReadyNow["`:\s]+true/i,
  /runtimeBetaReadyNow["`:\s]+true/i,
  /internalBetaReadyNow["`:\s]+true/i,
  /productionReadyNow["`:\s]+true/i,
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
  toolsChecked: expectedTools.length,
  runtimeBetaReadyNow: false,
}, null, 2));
