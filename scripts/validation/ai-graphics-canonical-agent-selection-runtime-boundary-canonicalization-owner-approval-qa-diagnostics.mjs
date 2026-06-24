#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const baseRef = "origin/codex/rp-ai-graphics-canonical-agent-selection-runtime-boundary-canonicalization-owner-approval";
const expectedDecision =
  "ai_graphics_canonical_agent_selection_runtime_boundary_canonicalization_owner_approval_qa_passed_with_warnings";
const expectedScript =
  "ai-graphics:canonical-agent-selection:runtime-boundary-canonicalization-owner-approval-qa-diagnostics";
const expectedScriptCommand =
  "node scripts/validation/ai-graphics-canonical-agent-selection-runtime-boundary-canonicalization-owner-approval-qa-diagnostics.mjs";
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
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-owner-approval-qa-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-owner-approval-qa-source-lockfile.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-owner-approval-qa-matrix.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-owner-approval-qa-ledger.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-tool-map-canonicalization-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-capability-map-canonicalization-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-cpu-static-canonicalization-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-browser-chart-canonicalization-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-animation-canonicalization-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-browser-canvas-webgl-canonicalization-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-model-cpu-gpu-canonicalization-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-tool-route-canonicalization-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-worker-canonicalization-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-public-artifacts-canonicalization-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-planning-only-policy-canonicalization-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-blocked-use-register-canonicalization-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-next-lane-canonicalization-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-owner-approval-qa-decision.md",
  "docs/prompt-ai-graphics-canonical-agent-selection-runtime-boundary-canonicalization-owner-approval-qa-review-results.md",
  "docs/implementation-prompts/prompt-ai-graphics-canonical-agent-selection-runtime-boundary-canonicalization-owner-approval-qa-review.md"
];
const requiredJson = [
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-owner-approval-qa-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-owner-approval-qa-source-lockfile.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-owner-approval-qa-matrix.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-owner-approval-qa-ledger.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-tool-map-canonicalization-owner-approval-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-capability-map-canonicalization-owner-approval-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-blocked-use-register-canonicalization-owner-approval-qa.json"
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
    "docs/tool-intelligence/ai-graphics/canonical-agent-selection/runtime-boundary-canonicalization-owner-approval-qa/" +
    capability.replaceAll("_", "-") +
    ".md"
);

for (const file of [...requiredDocs, ...requiredJson, ...capabilityDocs]) {
  if (!exists(file)) fail("Missing required file: " + file);
}

let qa = {};
let matrix = {};
let toolMap = {};
let capabilityMap = {};
let blocked = {};
try {
  qa = parseJson(
    "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-owner-approval-qa-review.json"
  );
} catch (error) {
  fail("Unable to parse owner-approval QA JSON: " + error.message);
}
try {
  matrix = parseJson(
    "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-canonicalization-owner-approval-qa-matrix.json"
  );
} catch (error) {
  fail("Unable to parse owner-approval QA matrix JSON: " + error.message);
}
try {
  toolMap = parseJson(
    "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-tool-map-canonicalization-owner-approval-qa.json"
  );
} catch (error) {
  fail("Unable to parse owner-approval QA tool map JSON: " + error.message);
}
try {
  capabilityMap = parseJson(
    "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-capability-map-canonicalization-owner-approval-qa.json"
  );
} catch (error) {
  fail("Unable to parse owner-approval QA capability map JSON: " + error.message);
}
try {
  blocked = parseJson(
    "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-blocked-use-register-canonicalization-owner-approval-qa.json"
  );
} catch (error) {
  fail("Unable to parse owner-approval QA blocked-use JSON: " + error.message);
}

if (qa.decision !== expectedDecision) fail("Unexpected decision: " + qa.decision);
const trueBooleans = [
  "canonicalAgentSelectionRuntimeBoundaryCanonicalizationOwnerApprovalQaCompleted",
  "sourceRuntimeBoundaryCanonicalizationOwnerApprovalAccepted",
  "sourceRuntimeBoundaryCanonicalizationOwnerReviewAccepted",
  "sourceRuntimeBoundaryCanonicalizationQaAccepted",
  "sourceRuntimeBoundaryCanonicalizationReviewAccepted",
  "sourceRuntimeBoundaryOwnerApprovalQaAccepted",
  "sourceRuntimeBoundaryOwnerApprovalAccepted",
  "sourceRuntimeBoundaryOwnerReviewAccepted",
  "sourceRuntimeBoundaryQaAccepted",
  "sourceRuntimeBoundaryReviewAccepted",
  "all21ToolsCoveredByRuntimeBoundaryCanonicalizationOwnerApprovalQa",
  "allRequiredCapabilitiesCoveredByRuntimeBoundaryCanonicalizationOwnerApprovalQa",
  "runtimeBoundaryLedgerCanonicalizationOwnerApprovalQaAccepted",
  "runtimeBoundaryMatrixCanonicalizationOwnerApprovalQaAccepted",
  "runtimeBoundaryToolMapCanonicalizationOwnerApprovalQaAccepted",
  "runtimeBoundaryCapabilityMapCanonicalizationOwnerApprovalQaAccepted",
  "planningOnlyPolicyCanonicalizationOwnerApprovalQaAccepted",
  "blockedUseRegisterCanonicalizationOwnerApprovalQaAccepted",
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
  "externalBetaReadyNow",
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
  "signedUrlCreated",
  "generatedOutputActionsPerformed"
];
for (const key of trueBooleans) if (qa.booleans?.[key] !== true) fail("Required true boolean missing: " + key);
for (const key of falseBooleans) if (qa.booleans?.[key] !== false) fail("Required false boolean missing: " + key);

for (const key of [
  "runtimeBoundaryLedgerCanonicalizationOwnerApprovalQa",
  "runtimeBoundaryMatrixCanonicalizationOwnerApprovalQa",
  "runtimeBoundaryToolMapCanonicalizationOwnerApprovalQa",
  "runtimeBoundaryCapabilityMapCanonicalizationOwnerApprovalQa",
  "planningOnlyPolicyCanonicalizationOwnerApprovalQa",
  "blockedUseRegisterCanonicalizationOwnerApprovalQa"
]) {
  if (qa[key] !== "accepted_with_warnings") fail("Missing accepted QA record: " + key);
}

const actualTools = new Set((toolMap.tools || qa.tools || []).map((tool) => tool.toolId || tool));
for (const tool of allTools) if (!actualTools.has(tool)) fail("Missing QA-reviewed tool: " + tool);
if (actualTools.size !== allTools.length) fail("Unexpected QA-reviewed tool count: " + actualTools.size);

const actualCapabilities = new Set(
  (capabilityMap.capabilities || qa.capabilities || []).map((capability) => capability.capabilityId || capability)
);
for (const capability of capabilities) if (!actualCapabilities.has(capability)) fail("Missing QA-reviewed capability: " + capability);
if (actualCapabilities.size !== capabilities.length) fail("Unexpected QA-reviewed capability count: " + actualCapabilities.size);

const actualBuckets = new Set(Object.keys(matrix.runtimeBuckets || qa.runtimeBuckets || {}));
for (const bucket of buckets) if (!actualBuckets.has(bucket)) fail("Missing QA-reviewed runtime bucket: " + bucket);

const corpus = [
  ...requiredDocs.filter(exists).map(read),
  ...requiredJson.filter(exists).map(read),
  ...capabilityDocs.filter(exists).map(read)
].join("\n");
for (const pr of [
  714, 710, 709, 705, 704, 700, 699, 696, 694, 692, 689, 688, 686, 685, 683, 681, 677, 674, 671,
  668, 665, 661, 657, 656, 651, 646, 645, 642, 638, 623, 621, 425, 433, 441, 376, 361,
  542, 544
]) {
  if (!corpus.includes("#" + pr) && !JSON.stringify(qa.sourcePrs || {}).includes('"' + pr + '"')) {
    fail("Missing PR citation: #" + pr);
  }
}
for (const token of ["TRACK_B_MEDIA_OSS_STEWARD", "Track A render/export exclusion", "PR #544"]) {
  if (!corpus.includes(token)) fail("Missing exclusion token: " + token);
}
for (const tool of allTools) if (!corpus.includes(tool)) fail("Missing tool text: " + tool);
for (const capability of capabilities) if (!corpus.includes(capability)) fail("Missing capability text: " + capability);
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
  /externalBetaReadyNow:\s*true/i,
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
if (Object.values(blocked.blockedUse || {}).some((value) => value !== false)) {
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
  if (key !== expectedScript && key !== "ai-graphics:canonical-agent-selection:runtime-boundary-handoff-diagnostics") fail("Unexpected script drift: " + key);
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
  console.error("AI graphics canonical agent-selection runtime-boundary canonicalization owner approval QA diagnostics failed:");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}
console.log("AI graphics canonical agent-selection runtime-boundary canonicalization owner approval QA diagnostics passed.");
