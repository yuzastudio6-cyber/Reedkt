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
const packageLock = readJson("package-lock.json");
const proof = readJson("docs/tool-intelligence/ai-graphics/browser-runtime-proof.json");
const proofMarkdown = read("docs/tool-intelligence/ai-graphics/browser-runtime-proof.md");
const proofRunner = read("scripts/validation/ai-graphics-browser-runtime-proof.mjs");
const nodeProof = readJson("docs/tool-intelligence/ai-graphics/node-runtime-proof.json");
const gpuInstallProof = readJson("docs/tool-intelligence/ai-graphics/gpu-worker-install-proof.json");

const expectedScripts = {
  "ai-graphics:browser-runtime-proof": "node scripts/validation/ai-graphics-browser-runtime-proof.mjs",
  "ai-graphics:browser-runtime-proof:diagnostics": "node scripts/validation/ai-graphics-browser-runtime-proof-diagnostics.mjs",
};
for (const [script, command] of Object.entries(expectedScripts)) {
  if (packageJson?.scripts?.[script] !== command) fail(`Missing package script ${script}`);
}

if (proof?.decision !== "ai_graphics_browser_runtime_proof_completed_with_warnings") {
  fail(`Unexpected decision ${proof?.decision}`);
}
if (proof?.sourcePr?.number !== 783 || proof?.sourcePr?.headSha !== "8eaa8eb0a1a4a04bde91bc1ee4044ea1c5f0dc56") {
  fail("PR #783 source evidence is missing or stale.");
}
if (nodeProof?.decision !== "ai_graphics_node_runtime_proof_completed_with_warnings") fail("Node runtime proof source missing.");
if (gpuInstallProof?.decision !== "ai_graphics_gpu_worker_install_proof_hardened_with_warnings") fail("GPU worker install proof source missing.");

const expectedTools = [
  "echarts",
  "lottie_web",
  "animejs",
  "three_js",
  "pixi_js",
  "konva",
  "babylonjs",
];
const expectedPackages = {
  echarts: "echarts",
  lottie_web: "lottie-web",
  animejs: "animejs",
  three_js: "three",
  pixi_js: "pixi.js",
  konva: "konva",
  babylonjs: "babylonjs",
};
const proofTools = new Map((proof?.tools || []).map((tool) => [tool.toolId, tool]));
for (const tool of expectedTools) {
  if (!proofTools.has(tool)) fail(`Proof missing ${tool}`);
  if (!proofMarkdown.includes(tool)) fail(`Markdown missing ${tool}`);
  const packageName = expectedPackages[tool];
  if (!packageLock?.packages?.[`node_modules/${packageName}`]?.version) fail(`Lockfile missing ${packageName}`);
}
if (proofTools.size !== expectedTools.length) fail(`Expected ${expectedTools.length} tools, saw ${proofTools.size}`);

for (const [tool, status] of Object.entries({
  echarts: "browser_svg_chart_runtime_proof_passed",
  lottie_web: "browser_svg_animation_runtime_proof_passed",
  animejs: "browser_dom_animation_runtime_proof_passed",
  three_js: "browser_webgl_runtime_proof_passed",
  pixi_js: "browser_canvas_webgl_runtime_proof_passed",
  konva: "browser_canvas_runtime_proof_passed",
  babylonjs: "browser_webgl_runtime_proof_passed",
})) {
  if (proofTools.get(tool)?.status !== status) fail(`${tool} status mismatch: ${proofTools.get(tool)?.status}`);
}

const booleans = proof?.booleans || {};
for (const key of [
  "browserRuntimeProofCompleted",
  "all7BrowserRuntimeToolsProofAttempted",
  "all7BrowserRuntimeToolsProofPassed",
  "chromiumRuntimeUsed",
  "browserRuntimeExecutedInLocalProof",
  "agentCanSelectForPlanning",
]) {
  if (booleans[key] !== true) fail(`Expected ${key}=true`);
}
for (const key of [
  "publicArtifactCreated",
  "generatedArtifactsCommitted",
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
  "packageLockMutationPerformed",
  "signedUrlCreated",
]) {
  if (booleans[key] !== false) fail(`Expected ${key}=false`);
}

for (const token of [
  "chromium.launch",
  "echarts/dist/echarts.min.js",
  "lottie-web/build/player/lottie.min.js",
  "animejs/dist/modules/index.js",
  "three/build/three.module.js",
  "pixi.js/dist/pixi.mjs",
  "konva/konva.min.js",
  "babylonjs/babylon.js",
]) {
  if (!proofRunner.includes(token)) fail(`Proof runner missing ${token}`);
}

for (const forbidden of [
  /page\.screenshot\(/,
  /recordVideo/i,
  /fs\.writeFileSync\([^)]*\.(png|jpg|jpeg|webp|mp4|mov|webm|svg)/i,
  /from_pretrained\(/,
  /snapshot_download\(/,
  /fetch\(["']https?:/i,
]) {
  if (forbidden.test(proofRunner)) fail(`Proof runner contains forbidden call ${forbidden}`);
}

const changedLock = execFileSync("git", [
  "diff",
  "--name-only",
  "origin/codex/rp-ai-graphics-gpu-worker-install-proof",
  "--",
  "package-lock.json",
], {
  encoding: "utf8",
  env: { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" },
}).trim();
if (changedLock) fail("package-lock.json changed in browser runtime proof lane.");

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
  /gpuModelRuntimeReadyNow["`:\s]+true/i,
  /runtimeBetaReadyNow["`:\s]+true/i,
  /internalBetaReadyNow["`:\s]+true/i,
  /externalBetaReadyNow["`:\s]+true/i,
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
  browserRuntimeExecutedInLocalProof: true,
  runtimeBetaReadyNow: false,
}, null, 2));
