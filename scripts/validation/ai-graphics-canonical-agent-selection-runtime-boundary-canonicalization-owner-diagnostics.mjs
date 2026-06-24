#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const baseRef = "origin/codex/rp-ai-graphics-canonical-agent-selection-runtime-boundary-canonicalization-qa-review";
const expectedDecision =
  "ai_graphics_canonical_agent_selection_runtime_boundary_canonicalization_owner_review_passed_with_warnings";
const expectedScript =
  "ai-graphics:canonical-agent-selection:runtime-boundary-canonicalization-owner-diagnostics";
const expectedScriptCommand =
  "node scripts/validation/ai-graphics-canonical-agent-selection-runtime-boundary-canonicalization-owner-diagnostics.mjs";
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
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-owner-source-lockfile.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-owner-matrix.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-owner-ledger.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-tool-map-canonicalization-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-capability-map-canonicalization-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-cpu-static-canonicalization-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-browser-chart-canonicalization-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-animation-canonicalization-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-browser-canvas-webgl-canonicalization-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-model-cpu-gpu-canonicalization-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-tool-route-canonicalization-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-worker-canonicalization-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-public-artifacts-canonicalization-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-planning-only-policy-canonicalization-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-blocked-use-register-canonicalization-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-next-lane-canonicalization-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-owner-review-decision.md",
  "docs/prompt-ai-graphics-canonical-agent-selection-runtime-boundary-canonicalization-owner-review-results.md",
  "docs/implementation-prompts/prompt-ai-graphics-canonical-agent-selection-runtime-boundary-canonicalization-owner-review.md"
];
const requiredJson = [
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-owner-source-lockfile.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-owner-matrix.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-owner-ledger.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-tool-map-canonicalization-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-capability-map-canonicalization-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-blocked-use-register-canonicalization-owner-review.json"
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
    "docs/tool-intelligence/ai-graphics/canonical-agent-selection/runtime-boundary-canonicalization-owner-review/" +
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
    "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-owner-review.json"
  );
} catch (error) {
  fail("Unable to parse canonicalization owner review JSON: " + error.message);
}
try {
  matrix = parseJson(
    "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-owner-matrix.json"
  );
} catch (error) {
  fail("Unable to parse canonicalization owner matrix JSON: " + error.message);
}
try {
  toolMap = parseJson(
    "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-tool-map-canonicalization-owner-review.json"
  );
} catch (error) {
  fail("Unable to parse canonicalization owner tool map JSON: " + error.message);
}
try {
  capabilityMap = parseJson(
    "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-capability-map-canonicalization-owner-review.json"
  );
} catch (error) {
  fail("Unable to parse canonicalization owner capability map JSON: " + error.message);
}
try {
  blocked = parseJson(
    "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-blocked-use-register-canonicalization-owner-review.json"
  );
} catch (error) {
  fail("Unable to parse canonicalization owner blocked-use JSON: " + error.message);
}

if (review.decision !== expectedDecision) fail("Unexpected decision: " + review.decision);
const trueBooleans = [
  "canonicalAgentSelectionRuntimeBoundaryCanonicalizationOwnerReviewCompleted",
  "sourceRuntimeBoundaryCanonicalizationQaAccepted",
  "sourceRuntimeBoundaryCanonicalizationReviewAccepted",
  "sourceRuntimeBoundaryOwnerApprovalQaAccepted",
  "sourceRuntimeBoundaryOwnerApprovalAccepted",
  "sourceRuntimeBoundaryOwnerReviewAccepted",
  "sourceRuntimeBoundaryQaAccepted",
  "sourceRuntimeBoundaryReviewAccepted",
  "all21ToolsCoveredByRuntimeBoundaryCanonicalizationOwnerReview",
  "allRequiredCapabilitiesCoveredByRuntimeBoundaryCanonicalizationOwnerReview",
  "runtimeBoundaryLedgerCanonicalizationOwnerAccepted",
  "runtimeBoundaryMatrixCanonicalizationOwnerAccepted",
  "runtimeBoundaryToolMapCanonicalizationOwnerAccepted",
  "runtimeBoundaryCapabilityMapCanonicalizationOwnerAccepted",
  "planningOnlyPolicyCanonicalizationOwnerAccepted",
  "blockedUseRegisterCanonicalizationOwnerAccepted",
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
  "sourceRuntimeBoundaryCanonicalizationQa",
  "sourceRuntimeBoundaryCanonicalizationReview",
  "sourceRuntimeBoundaryOwnerApprovalQa",
  "sourceRuntimeBoundaryOwnerApproval",
  "sourceRuntimeBoundaryOwnerReview",
  "sourceRuntimeBoundaryQa",
  "sourceRuntimeBoundaryReview"
]) {
  if (review.acceptedSourceChain?.[acceptance]?.accepted !== true) {
    fail("Missing owner source acceptance: " + acceptance);
  }
}
for (const canonical of [
  "runtimeBoundaryLedgerCanonicalizationOwner",
  "runtimeBoundaryMatrixCanonicalizationOwner",
  "runtimeBoundaryToolMapCanonicalizationOwner",
  "runtimeBoundaryCapabilityMapCanonicalizationOwner",
  "planningOnlyPolicyCanonicalizationOwner",
  "blockedUseRegisterCanonicalizationOwner"
]) {
  if (review[canonical]?.accepted !== true) fail("Missing accepted owner record: " + canonical);
}

const actualTools = new Set((toolMap.tools || review.tools || []).map((tool) => tool.toolId || tool));
for (const tool of allTools) if (!actualTools.has(tool)) fail("Missing owner-reviewed tool: " + tool);
if (actualTools.size !== allTools.length) fail("Unexpected owner-reviewed tool count: " + actualTools.size);

const actualCapabilities = new Set(
  (capabilityMap.capabilities || review.capabilities || []).map((capability) => capability.capabilityId || capability)
);
for (const capability of capabilities) if (!actualCapabilities.has(capability)) fail("Missing owner-reviewed capability: " + capability);
if (actualCapabilities.size !== capabilities.length) fail("Unexpected owner-reviewed capability count: " + actualCapabilities.size);

const actualBuckets = new Set(Object.keys(matrix.runtimeBuckets || review.runtimeBuckets || {}));
for (const bucket of buckets) if (!actualBuckets.has(bucket)) fail("Missing owner-reviewed runtime bucket: " + bucket);

const corpus = [
  ...requiredDocs.filter(exists).map(read),
  ...requiredJson.filter(exists).map(read),
  ...capabilityDocs.filter(exists).map(read)
].join("\n");
for (const pr of [
  709, 705, 704, 700, 699, 696, 694, 692, 689, 688, 686, 685, 683, 681, 677, 674, 671, 668,
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
  fail("Blocked-use owner register contains a non-false runtime claim.");
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
    key !== "ai-graphics:canonical-agent-selection:runtime-boundary-canonicalization-owner-approval-diagnostics"
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
  console.error("AI graphics canonical agent-selection runtime-boundary canonicalization owner diagnostics failed:");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}
console.log("AI graphics canonical agent-selection runtime-boundary canonicalization owner diagnostics passed.");
