import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const failures = [];
const baseRef = "origin/codex/rp-ai-graphics-browser-runtime-proof";

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
const proof = readJson("docs/tool-intelligence/ai-graphics/satori-font-runtime-proof.json");
const markdown = read("docs/tool-intelligence/ai-graphics/satori-font-runtime-proof.md");
const resultRecord = read("docs/prompt-ai-graphics-satori-font-runtime-proof-results.md");
const implementationPrompt = read("docs/implementation-prompts/prompt-ai-graphics-satori-font-runtime-proof.md");
const runner = read("scripts/validation/ai-graphics-satori-font-runtime-proof.mjs");
const nodeProof = readJson("docs/tool-intelligence/ai-graphics/node-runtime-proof.json");
const browserProof = readJson("docs/tool-intelligence/ai-graphics/browser-runtime-proof.json");

const expectedScripts = {
  "ai-graphics:satori-font-runtime-proof": "node scripts/validation/ai-graphics-satori-font-runtime-proof.mjs",
  "ai-graphics:satori-font-runtime-proof:diagnostics": "node scripts/validation/ai-graphics-satori-font-runtime-proof-diagnostics.mjs",
};
for (const [script, command] of Object.entries(expectedScripts)) {
  if (packageJson?.scripts?.[script] !== command) fail(`Missing package script ${script}`);
}

if (proof?.decision !== "ai_graphics_satori_font_runtime_proof_completed_with_warnings") {
  fail(`Unexpected decision ${proof?.decision}`);
}
if (proof?.status !== "completed_with_warnings") fail(`Unexpected proof status ${proof?.status}`);
if (proof?.sourcePr?.number !== 787) fail("Missing PR #787 source evidence.");
if (nodeProof?.decision !== "ai_graphics_node_runtime_proof_completed_with_warnings") fail("Missing node runtime proof source.");
if (browserProof?.decision !== "ai_graphics_browser_runtime_proof_completed_with_warnings") fail("Missing browser runtime proof source.");

const lockPackages = packageLock?.packages || {};
if (lockPackages["node_modules/satori"]?.version !== "0.26.0") fail("Expected satori@0.26.0 in package-lock.");
if (lockPackages["node_modules/three"]?.version !== "0.184.0") fail("Expected three@0.184.0 in package-lock.");

const fontPath = "node_modules/three/examples/fonts/ttf/kenpixel.ttf";
if (!fs.existsSync(path.join(root, fontPath))) fail(`Missing locked font fixture ${fontPath}`);

const tool = proof?.tool || {};
if (tool.toolId !== "satori") fail(`Unexpected tool ${tool.toolId}`);
if (tool.packageName !== "satori") fail(`Unexpected package ${tool.packageName}`);
if (tool.version !== "0.26.0") fail(`Unexpected satori version ${tool.version}`);
if (tool.status !== "satori_font_fixture_svg_layout_proof_passed") fail(`Unexpected satori status ${tool.status}`);
if (tool.runtimeTarget !== "node_cpu_static_svg_layout") fail(`Unexpected runtime target ${tool.runtimeTarget}`);
if (tool.fontFixture?.path !== fontPath) fail(`Unexpected font fixture path ${tool.fontFixture?.path}`);
if (tool.fontFixture?.packageName !== "three") fail("Font fixture must come from the locked three package.");
if (tool.fontFixture?.packageVersion !== "0.184.0") fail(`Unexpected font package version ${tool.fontFixture?.packageVersion}`);
if (!/^[a-f0-9]{64}$/.test(tool.fontFixture?.sha256 ?? "")) fail("Font fixture SHA-256 missing.");
if ((tool.fontFixture?.byteLength ?? 0) <= 0) fail("Font fixture byte length missing.");
if (tool.outputContract?.hasSvgRoot !== true) fail("SVG root was not proven.");
if (tool.outputContract?.hasExpectedViewBox !== true) fail("Expected viewBox was not proven.");
if ((tool.outputContract?.pathCount ?? 0) <= 0) fail("SVG path output was not proven.");
if (tool.outputContract?.deterministic !== true) fail("Satori output was not deterministic.");
if (tool.outputContract?.svgArtifactCommitted !== false) fail("SVG artifact must not be committed.");
if (tool.outputContract?.publicArtifactCreated !== false) fail("Public artifact must not be created.");

for (const token of [
  "satori",
  "node_modules/three/examples/fonts/ttf/kenpixel.ttf",
  "fonts:",
  "sha256",
  "firstSvgSha256",
  "secondSvgSha256",
]) {
  if (!runner.includes(token)) fail(`Runner missing ${token}`);
}

for (const token of [
  "satori_font_fixture_svg_layout_proof_passed",
  "locked `three",
  "Font binary committed by this lane: `false`",
  "agentCanExecuteToolsNow=false",
  "runtimeBetaReadyNow=false",
]) {
  if (!markdown.includes(token)) fail(`Markdown missing ${token}`);
}

for (const [label, text] of [
  ["result record", resultRecord],
  ["implementation prompt", implementationPrompt],
]) {
  for (const token of [
    "ai_graphics_satori_font_runtime_proof_completed_with_warnings",
    "satori_font_fixture_svg_layout_proof_passed",
    "node_modules/three/examples/fonts/ttf/kenpixel.ttf",
    "package-lock mutation",
  ]) {
    if (!text.includes(token)) fail(`${label} missing ${token}`);
  }
}

const booleans = proof?.booleans || {};
for (const key of [
  "satoriFontRuntimeProofCompleted",
  "lockedPackageFontFixtureUsed",
  "satoriTextSvgLayoutProofPassed",
  "all13JsGraphicsToolsHaveRuntimeProofEvidence",
  "npmCiFromLockForValidation",
  "agentCanSelectForPlanning",
]) {
  if (booleans[key] !== true) fail(`Expected ${key}=true`);
}
for (const key of [
  "committedFontBinary",
  "dependencyInstallPerformed",
  "packageLockMutationPerformed",
  "generatedArtifactsCommitted",
  "publicArtifactCreated",
  "signedUrlCreated",
  "modelWeightsDownloaded",
  "mediaProcessingPerformed",
  "providerRuntimePerformed",
  "browserWebglCanvasRuntimePerformed",
  "gpuRuntimePerformed",
  "agentCanExecuteToolsNow",
  "toolRouteExecutionReadyNow",
  "workerExecutionReadyNow",
  "browserWebglCanvasRuntimeReadyNow",
  "gpuModelRuntimeReadyNow",
  "runtimeBetaReadyNow",
  "internalBetaReadyNow",
  "externalBetaReadyNow",
  "productionReadyNow",
]) {
  if (booleans[key] !== false) fail(`Expected ${key}=false`);
}

const packageLockDiff = execFileSync("git", [
  "diff",
  "--name-only",
  baseRef,
  "--",
  "package-lock.json",
], {
  encoding: "utf8",
  env: { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" },
}).trim();
if (packageLockDiff) fail("package-lock.json changed in satori font proof lane.");

const dependencyDiff = execFileSync("git", [
  "diff",
  "--unified=0",
  baseRef,
  "--",
  "package.json",
], {
  encoding: "utf8",
  env: { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" },
});
for (const line of dependencyDiff.split(/\r?\n/)) {
  if (/^[+-]\s*"dependencies"\s*:/.test(line) || /^[+-]\s*"devDependencies"\s*:/.test(line)) {
    fail("Dependency sections changed unexpectedly.");
  }
  if (/^[+]\s*"[^"]+"\s*:\s*"\^?[^"]+"/.test(line) && !line.includes("ai-graphics:satori-font-runtime-proof")) {
    if (
      !line.includes("scripts/validation/ai-graphics-satori-font-runtime-proof") &&
      !line.includes("ai-graphics:gpu-model-install-build-targets:diagnostics") &&
      !line.includes("ai-graphics:gpu-model-runtime-readiness-gate:diagnostics") &&
      !line.includes("ai-graphics:tool-call-readiness:diagnostics") &&
      !line.includes("ai-graphics:21-tool-proper-install-audit:diagnostics")
    ) {
      fail(`Unexpected package.json addition: ${line}`);
    }
  }
}

const trackedLocalArtifacts = execFileSync("git", [
  "ls-files",
  ".local-artifacts",
], {
  encoding: "utf8",
  env: { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" },
}).trim();
if (trackedLocalArtifacts) fail(".local-artifacts must not be committed.");

const changedFiles = execFileSync("git", [
  "diff",
  "--name-only",
  baseRef,
], {
  encoding: "utf8",
  env: { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" },
}).trim();
if (/\.(svg|png|jpg|jpeg|webp|mp4|mov|webm|ttf|otf|woff2?)$/im.test(changedFiles)) {
  fail(`Generated media/font artifact path changed in this lane: ${changedFiles}`);
}

const allText = [markdown, JSON.stringify(proof || {})].join("\n");
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
  /dependencyInstallPerformed["`:\s]+true/i,
  /packageLockMutationPerformed["`:\s]+true/i,
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
  tool: "satori",
  proofStatus: tool.status,
  runtimeBetaReadyNow: false,
}, null, 2));
