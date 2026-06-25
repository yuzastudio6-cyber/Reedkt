#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const baseRef = "origin/codex/rp-ai-graphics-canonical-agent-selection-runtime-boundary-canonicalization-review";
const expectedDecision =
  "ai_graphics_canonical_agent_selection_runtime_boundary_canonicalization_qa_passed_with_warnings";
const expectedScript =
  "ai-graphics:canonical-agent-selection:runtime-boundary-canonicalization-qa-diagnostics";
const expectedScriptCommand =
  "node scripts/validation/ai-graphics-canonical-agent-selection-runtime-boundary-canonicalization-qa-diagnostics.mjs";
const failures = [];
const fail = (message) => failures.push(message);
const rel = (file) => path.join(root, file);
const exists = (file) => fs.existsSync(rel(file));
const read = (file) => fs.readFileSync(rel(file), "utf8");
const parseJson = (file) => JSON.parse(read(file));
const gitEnv = { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" };
const git = (args) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8", env: gitEnv }).trim();

const requiredDocs = [
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-qa-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-qa-source-lockfile.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-qa-matrix.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-qa-ledger.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-tool-map-canonicalization-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-capability-map-canonicalization-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-cpu-static-canonicalization-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-browser-chart-canonicalization-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-animation-canonicalization-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-browser-canvas-webgl-canonicalization-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-model-cpu-gpu-canonicalization-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-tool-route-canonicalization-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-worker-canonicalization-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-public-artifacts-canonicalization-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-planning-only-policy-canonicalization-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-blocked-use-register-canonicalization-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-next-lane-canonicalization-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-qa-decision.md",
  "docs/prompt-ai-graphics-canonical-agent-selection-runtime-boundary-canonicalization-qa-review-results.md",
  "docs/implementation-prompts/prompt-ai-graphics-canonical-agent-selection-runtime-boundary-canonicalization-qa-review.md"
];
const requiredJson = [
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-qa-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-qa-source-lockfile.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-qa-matrix.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-qa-ledger.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-tool-map-canonicalization-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-capability-map-canonicalization-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-blocked-use-register-canonicalization-qa.json"
];
const capabilities = [
  "chart_overlay",
  "data_visualization",
  "svg_graphics",
  "diagram_graphics",
  "animation_overlay",
  "canvas_scene",
  "webgl_3d_scene",
  "background_removal",
  "subject_segmentation",
  "upscaling",
  "tensor_image_ops",
  "model_runtime_foundation"
];
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
  "babylonjs"
];
const buckets = [
  "planning_metadata_allowed_now",
  "cpu_static_execution_previously_validated_but_not_agent_executable_now",
  "browser_chart_runtime_later",
  "animation_runtime_later",
  "browser_canvas_webgl_runtime_later",
  "model_cpu_gpu_runtime_later",
  "tool_route_handoff_later",
  "worker_handoff_later",
  "public_artifact_and_signed_url_later"
];
const capabilityDocs = capabilities.map(
  (capability) =>
    "docs/tool-intelligence/ai-graphics/canonical-agent-selection/runtime-boundary-canonicalization-qa/" +
    capability.replaceAll("_", "-") +
    ".md"
);

for (const file of [...requiredDocs, ...requiredJson, ...capabilityDocs]) {
  if (!exists(file)) fail("Missing required file: " + file);
}

let review = {};
let matrix = {};
let toolMap = {};
let capabilityMap = {};
let blocked = {};
try {
  review = parseJson(
    "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-qa-review.json"
  );
} catch (error) {
  fail("Unable to parse canonicalization QA review JSON: " + error.message);
}
try {
  matrix = parseJson(
    "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-qa-matrix.json"
  );
} catch (error) {
  fail("Unable to parse canonicalization QA matrix JSON: " + error.message);
}
try {
  toolMap = parseJson(
    "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-tool-map-canonicalization-qa.json"
  );
} catch (error) {
  fail("Unable to parse canonicalization QA tool map JSON: " + error.message);
}
try {
  capabilityMap = parseJson(
    "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-capability-map-canonicalization-qa.json"
  );
} catch (error) {
  fail("Unable to parse canonicalization QA capability map JSON: " + error.message);
}
try {
  blocked = parseJson(
    "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-blocked-use-register-canonicalization-qa.json"
  );
} catch (error) {
  fail("Unable to parse canonicalization QA blocked-use JSON: " + error.message);
}

if (review.decision !== expectedDecision) fail("Unexpected decision: " + review.decision);
const trueBooleans = [
  "canonicalAgentSelectionRuntimeBoundaryCanonicalizationQaCompleted",
  "sourceRuntimeBoundaryCanonicalizationReviewAccepted",
  "sourceRuntimeBoundaryOwnerApprovalQaAccepted",
  "sourceRuntimeBoundaryOwnerApprovalAccepted",
  "sourceRuntimeBoundaryOwnerReviewAccepted",
  "sourceRuntimeBoundaryQaAccepted",
  "sourceRuntimeBoundaryReviewAccepted",
  "all21ToolsCoveredByRuntimeBoundaryCanonicalizationQa",
  "allRequiredCapabilitiesCoveredByRuntimeBoundaryCanonicalizationQa",
  "runtimeBoundaryLedgerCanonicalizationQaAccepted",
  "runtimeBoundaryMatrixCanonicalizationQaAccepted",
  "runtimeBoundaryToolMapCanonicalizationQaAccepted",
  "runtimeBoundaryCapabilityMapCanonicalizationQaAccepted",
  "planningOnlyPolicyCanonicalizationQaAccepted",
  "blockedUseRegisterCanonicalizationQaAccepted",
  "agentCanSelectForPlanning"
];
const falseBooleans = [
  "agentCanExecuteToolsNow",
  "routeExecutionApprovedNow",
  "workerExecutionApprovedNow",
  "toolExecutionApprovedNow",
  "browserWebglCanvasRuntimeApprovedNow",
  "gpuRuntimeApprovedNow",
  "providerRuntimeApprovedNow",
  "publicArtifactApprovedNow",
  "signedUrlApprovedNow",
  "runtimeReadyNow",
  "internalBetaReadyNow",
  "productionReadyNow",
  "dependencyInstallPerformed",
  "packageLockMutationPerformed",
  "toolExecutionPerformed",
  "workerExecutionPerformed",
  "routeExecutionPerformed",
  "providerRuntimePerformed",
  "browserWebglCanvasRuntimePerformed",
  "gpuRuntimePerformed",
  "supabaseMutationPerformed",
  "gcsUploadPerformed",
  "publicArtifactCreated",
  "signedUrlCreated"
];
for (const key of trueBooleans) if (review.booleans?.[key] !== true) fail("Required true boolean missing: " + key);
for (const key of falseBooleans) if (review.booleans?.[key] !== false) fail("Required false boolean missing: " + key);

for (const acceptance of [
  "sourceRuntimeBoundaryCanonicalizationReview",
  "sourceRuntimeBoundaryOwnerApprovalQa",
  "sourceRuntimeBoundaryOwnerApproval",
  "sourceRuntimeBoundaryOwnerReview",
  "sourceRuntimeBoundaryQa",
  "sourceRuntimeBoundaryReview"
]) {
  if (review.acceptedSourceChain?.[acceptance]?.accepted !== true) {
    fail("Missing QA source acceptance: " + acceptance);
  }
}
for (const canonical of [
  "runtimeBoundaryLedgerCanonicalizationQa",
  "runtimeBoundaryMatrixCanonicalizationQa",
  "runtimeBoundaryToolMapCanonicalizationQa",
  "runtimeBoundaryCapabilityMapCanonicalizationQa",
  "planningOnlyPolicyCanonicalizationQa",
  "blockedUseRegisterCanonicalizationQa"
]) {
  if (review[canonical]?.accepted !== true) fail("Missing accepted QA record: " + canonical);
}

const actualTools = new Set((toolMap.tools || review.tools || []).map((tool) => tool.toolId || tool));
for (const tool of allTools) if (!actualTools.has(tool)) fail("Missing QA-reviewed tool: " + tool);
if (actualTools.size !== allTools.length) fail("Unexpected QA-reviewed tool count: " + actualTools.size);

const actualCapabilities = new Set(
  (capabilityMap.capabilities || review.capabilities || []).map((capability) => capability.capabilityId || capability)
);
for (const capability of capabilities) if (!actualCapabilities.has(capability)) fail("Missing QA-reviewed capability: " + capability);
if (actualCapabilities.size !== capabilities.length) fail("Unexpected QA-reviewed capability count: " + actualCapabilities.size);

const actualBuckets = new Set(Object.keys(matrix.runtimeBuckets || review.runtimeBuckets || {}));
for (const bucket of buckets) if (!actualBuckets.has(bucket)) fail("Missing QA-reviewed runtime bucket: " + bucket);

const corpus = [
  ...requiredDocs.filter(exists).map(read),
  ...requiredJson.filter(exists).map(read),
  ...capabilityDocs.filter(exists).map(read)
].join("\n");
for (const pr of [
  705, 704, 700, 699, 696, 694, 692, 689, 688, 686, 685, 683, 681, 677, 674, 671, 668,
  665, 661, 657, 656, 651, 646, 645, 642, 638, 623, 621, 425, 433, 441, 376, 361,
  542, 544
]) {
  if (!corpus.includes("#" + pr) && !JSON.stringify(review.sourcePrs || {}).includes('"' + pr + '"')) {
    fail("Missing PR citation: #" + pr);
  }
}
for (const token of ["TRACK_B_MEDIA_OSS_STEWARD", "Track A render/export exclusion", "PR #544"]) {
  if (!corpus.includes(token)) fail("Missing exclusion token: " + token);
}
for (const bucket of buckets) if (!corpus.includes(bucket)) fail("Missing runtime bucket text: " + bucket);
for (const phrase of ["planning/study metadata", "agentCanSelectForPlanning"]) {
  if (!corpus.includes(phrase)) fail("Missing planning-only phrase: " + phrase);
}

const forbiddenPatterns = [
  /agentCanExecuteToolsNow:\s*true/i,
  /routeExecutionApprovedNow:\s*true/i,
  /workerExecutionApprovedNow:\s*true/i,
  /toolExecutionApprovedNow:\s*true/i,
  /browserWebglCanvasRuntimeApprovedNow:\s*true/i,
  /gpuRuntimeApprovedNow:\s*true/i,
  /providerRuntimeApprovedNow:\s*true/i,
  /publicArtifactApprovedNow:\s*true/i,
  /signedUrlApprovedNow:\s*true/i,
  /runtimeReadyNow:\s*true/i,
  /internalBetaReadyNow:\s*true/i,
  /productionReadyNow:\s*true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
  /E2E proof approved/i,
  /agent execution approved/i,
  /route execution approved/i,
  /worker execution approved/i,
  /tool execution approved/i,
  /browser\/WebGL\/canvas runtime approved/i,
  /GPU\/model runtime approved/i,
  /Supabase\/GCS.*approved/i,
  /signed URLs.*approved/i,
  /public artifacts.*approved/i
];
for (const forbidden of forbiddenPatterns) {
  if (forbidden.test(corpus)) fail("Forbidden runtime/execution claim matched: " + forbidden);
}
if (Object.values(blocked.blockedRuntimeClaims || {}).some((value) => value !== false)) {
  fail("Blocked-use QA register contains a non-false runtime claim.");
}

let packageJson = {};
let basePackageJson = {};
try {
  packageJson = JSON.parse(read("package.json"));
  basePackageJson = JSON.parse(git(["show", baseRef + ":package.json"]));
} catch (error) {
  fail("Unable to read package metadata: " + error.message);
}
for (const section of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
  if (JSON.stringify(packageJson[section] || {}) !== JSON.stringify(basePackageJson[section] || {})) {
    fail("Package dependency section changed: " + section);
  }
}
if (packageJson.scripts?.[expectedScript] !== expectedScriptCommand) {
  fail("Expected package script is missing or incorrect.");
}
const scriptDrift = Object.keys(packageJson.scripts || {}).filter(
  (key) => JSON.stringify(packageJson.scripts[key]) !== JSON.stringify(basePackageJson.scripts?.[key])
);
for (const key of scriptDrift) {
  if (
    key !== expectedScript &&
    key !== "ai-graphics:cpu-static-execution-proof:phase0-qa-diagnostics" &&
    key !== "ai-graphics:cpu-static-execution-proof:phase0-owner-diagnostics" &&
    key !== "ai-graphics:21-tool-runtime-install-readiness:diagnostics" &&
    key !== "ai-graphics:gpu-import-readiness:diagnostics" &&
    key !== "ai-graphics:node-runtime-proof" &&
    key !== "ai-graphics:node-runtime-proof:diagnostics" &&
    key !== "ai-graphics:gpu-worker-install-proof:diagnostics" &&
    key !== "ai-graphics:browser-runtime-proof" &&
    key !== "ai-graphics:browser-runtime-proof:diagnostics" &&
    key !== "ai-graphics:satori-font-runtime-proof" &&
    key !== "ai-graphics:satori-font-runtime-proof:diagnostics" &&
    key !== "ai-graphics:gpu-model-install-build-targets:diagnostics" &&
    key !== "ai-graphics:21-tool-runtime-install-readiness:diagnostics" &&
    key !== "ai-graphics:gpu-import-readiness:diagnostics" &&
    key !== "ai-graphics:node-runtime-proof" &&
    key !== "ai-graphics:node-runtime-proof:diagnostics" &&
    key !== "ai-graphics:gpu-worker-install-proof:diagnostics" &&
    key !== "ai-graphics:browser-runtime-proof" &&
    key !== "ai-graphics:browser-runtime-proof:diagnostics" &&
    key !== "ai-graphics:satori-font-runtime-proof" &&
    key !== "ai-graphics:satori-font-runtime-proof:diagnostics" &&
    key !== "ai-graphics:gpu-model-install-build-targets:diagnostics" &&
    key !== "ai-graphics:cpu-static-execution-proof:phase0-diagnostics" &&
    key !== "ai-graphics:cpu-static-execution-proof:phase0" &&
    key !== "ai-graphics:canonical-agent-selection:runtime-boundary-canonicalization-owner-diagnostics" &&
    key !== "ai-graphics:canonical-agent-selection:runtime-boundary-canonicalization-owner-approval-diagnostics" &&
    key !== "ai-graphics:canonical-agent-selection:runtime-boundary-canonicalization-owner-approval-qa-diagnostics" &&
    key !== "ai-graphics:canonical-agent-selection:runtime-boundary-handoff-diagnostics" &&
    key !== "ai-graphics:canonical-agent-selection:runtime-boundary-handoff-qa-diagnostics" &&
    key !== "ai-graphics:canonical-agent-selection:runtime-boundary-handoff-owner-diagnostics" &&
    key !== "ai-graphics:canonical-agent-selection:runtime-boundary-handoff-owner-approval-diagnostics"
  ) {
    fail("Unexpected script drift: " + key);
  }
}
for (const key of Object.keys(basePackageJson.scripts || {})) {
  if (!(key in (packageJson.scripts || {}))) fail("Removed package script: " + key);
}
try {
  if (git(["diff", "--name-only", baseRef, "--", "package-lock.json"])) fail("package-lock.json changed relative to base.");
} catch (error) {
  fail("Unable to verify package-lock diff: " + error.message);
}
let tracked = "";
try {
  tracked = git(["ls-files"]);
} catch (error) {
  fail("Unable to list tracked files: " + error.message);
}
for (const file of tracked.split("\n").filter(Boolean)) {
  if (file.includes(".local-artifacts")) fail("Committed .local-artifacts path: " + file);
  if (/(^|\/)(generated-artifacts?|generated-media|media-output|browser-output|canvas-output|webgl-output|public-artifacts?|signed-urls?)(\/|$)/i.test(file)) {
    fail("Committed generated artifact path: " + file);
  }
}

if (failures.length) {
  console.error("AI graphics canonical agent-selection runtime-boundary canonicalization QA diagnostics failed:");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}
console.log("AI graphics canonical agent-selection runtime-boundary canonicalization QA diagnostics passed.");
