#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const baseRef = "origin/codex/rp-ai-graphics-canonical-agent-selection-runtime-boundary-owner-review";
const expectedDecision = "ai_graphics_canonical_agent_selection_runtime_boundary_owner_approved_with_warnings";
const expectedScript = "ai-graphics:canonical-agent-selection:runtime-boundary-owner-approval-diagnostics";
const expectedScriptCommand =
  "node scripts/validation/ai-graphics-canonical-agent-selection-runtime-boundary-owner-approval-diagnostics.mjs";
const allowedDescendantScripts = new Set([
  "ai-graphics:model-weight-manifest-readiness:diagnostics",
  "ai-graphics:cpu-static-execution-proof:phase0-owner-diagnostics",
  "ai-graphics:cpu-static-execution-proof:phase0",
  "ai-graphics:cpu-static-execution-proof:phase0-diagnostics",
  "ai-graphics:cpu-static-execution-proof:phase0-qa-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-owner-approval-qa-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-canonicalization-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-canonicalization-qa-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-canonicalization-owner-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-canonicalization-owner-approval-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-canonicalization-owner-approval-qa-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-handoff-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-handoff-qa-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-handoff-owner-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-handoff-owner-approval-diagnostics",
  "ai-graphics:21-tool-runtime-install-readiness:diagnostics",
  "ai-graphics:gpu-import-readiness:diagnostics",
  "ai-graphics:node-runtime-proof",
  "ai-graphics:node-runtime-proof:diagnostics",
  "ai-graphics:gpu-worker-install-proof:diagnostics",
  "ai-graphics:browser-runtime-proof",
  "ai-graphics:browser-runtime-proof:diagnostics",
  "ai-graphics:satori-font-runtime-proof",
  "ai-graphics:satori-font-runtime-proof:diagnostics",
  "ai-graphics:gpu-model-install-build-targets:diagnostics",
  "ai-graphics:tool-call-readiness:diagnostics",
  "ai-graphics:tool-call-handoff:diagnostics",
  "ai-graphics:tool-call-plan-evaluator:diagnostics",
  "ai-graphics:beta-readiness-gate:diagnostics",
  "ai-graphics:tool-route-readiness:diagnostics",
  "ai-graphics:worker-handoff-readiness:diagnostics",
  "ai-graphics:21-tool-proper-install-audit:diagnostics",
  "ai-graphics:gpu-model-runtime-readiness-gate:diagnostics",
]);
const failures = [];
const fail = (message) => failures.push(message);
const rel = (file) => path.join(root, file);
const exists = (file) => fs.existsSync(rel(file));
const read = (file) => fs.readFileSync(rel(file), "utf8");
const parseJson = (file) => JSON.parse(read(file));
const gitEnv = { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" };
const git = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8", env: gitEnv }).trim();

const requiredDocs = [
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-owner-approval.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-owner-approval-source-lockfile.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-owner-approval-matrix.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-owner-approval-ledger.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-tool-map-owner-approval.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-capability-map-owner-approval.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-cpu-static-owner-approval.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-browser-chart-owner-approval.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-animation-owner-approval.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-browser-canvas-webgl-owner-approval.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-model-cpu-gpu-owner-approval.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-tool-route-owner-approval.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-worker-owner-approval.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-public-artifacts-owner-approval.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-planning-only-policy-owner-approval.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-blocked-use-register-owner-approval.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-next-lane-owner-approval.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-owner-approval-decision.md",
  "docs/prompt-ai-graphics-canonical-agent-selection-runtime-boundary-owner-approval-results.md",
  "docs/implementation-prompts/prompt-ai-graphics-canonical-agent-selection-runtime-boundary-owner-approval.md"
];
const requiredJson = [
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-owner-approval.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-owner-approval-source-lockfile.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-owner-approval-matrix.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-owner-approval-ledger.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-tool-map-owner-approval.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-capability-map-owner-approval.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-blocked-use-register-owner-approval.json"
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
    "docs/tool-intelligence/ai-graphics/canonical-agent-selection/runtime-boundary-owner-approval/" +
    capability.replaceAll("_", "-") +
    ".md"
);

for (const file of [...requiredDocs, ...requiredJson, ...capabilityDocs]) {
  if (!exists(file)) fail("Missing required file: " + file);
}

let approval = {};
let matrix = {};
let toolMap = {};
let capabilityMap = {};
let blocked = {};
try { approval = parseJson("docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-owner-approval.json"); } catch (error) { fail("Unable to parse owner approval JSON: " + error.message); }
try { matrix = parseJson("docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-owner-approval-matrix.json"); } catch (error) { fail("Unable to parse owner approval matrix JSON: " + error.message); }
try { toolMap = parseJson("docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-tool-map-owner-approval.json"); } catch (error) { fail("Unable to parse tool map JSON: " + error.message); }
try { capabilityMap = parseJson("docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-capability-map-owner-approval.json"); } catch (error) { fail("Unable to parse capability map JSON: " + error.message); }
try { blocked = parseJson("docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-blocked-use-register-owner-approval.json"); } catch (error) { fail("Unable to parse blocked-use JSON: " + error.message); }

if (approval.decision !== expectedDecision) fail("Unexpected decision: " + approval.decision);
const trueBooleans = [
  "canonicalAgentSelectionRuntimeBoundaryOwnerApprovalCompleted",
  "sourceRuntimeBoundaryOwnerReviewAccepted",
  "sourceRuntimeBoundaryQaAccepted",
  "sourceRuntimeBoundaryReviewAccepted",
  "all21ToolsCoveredByRuntimeBoundaryOwnerApproval",
  "allRequiredCapabilitiesCoveredByRuntimeBoundaryOwnerApproval",
  "runtimeBoundaryLedgerOwnerApproved",
  "runtimeBoundaryMatrixOwnerApproved",
  "runtimeBoundaryToolMapOwnerApproved",
  "runtimeBoundaryCapabilityMapOwnerApproved",
  "planningOnlyPolicyOwnerApproved",
  "blockedUseRegisterOwnerApproved",
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
for (const key of trueBooleans) if (approval.booleans?.[key] !== true) fail("Required true boolean missing: " + key);
for (const key of falseBooleans) if (approval.booleans?.[key] !== false) fail("Required false boolean missing: " + key);

for (const acceptance of [
  "sourceRuntimeBoundaryOwnerReview",
  "sourceRuntimeBoundaryQa",
  "sourceRuntimeBoundaryReview"
]) {
  if (approval[acceptance]?.accepted !== true) fail("Missing source acceptance: " + acceptance);
}
for (const approvalKey of [
  "runtimeBoundaryLedgerOwnerApproval",
  "runtimeBoundaryMatrixOwnerApproval",
  "runtimeBoundaryToolMapOwnerApproval",
  "runtimeBoundaryCapabilityMapOwnerApproval",
  "planningOnlyPolicyOwnerApproval",
  "blockedUseRegisterOwnerApproval"
]) {
  if (approval[approvalKey]?.approved !== true) fail("Missing owner approval: " + approvalKey);
}

const actualTools = new Set((toolMap.tools || approval.tools || []).map((tool) => tool.toolId));
for (const tool of allTools) if (!actualTools.has(tool)) fail("Missing owner-approved tool: " + tool);
if (actualTools.size !== allTools.length) fail("Unexpected owner-approved tool count: " + actualTools.size);

const actualCapabilities = new Set((capabilityMap.capabilities || approval.capabilities || []).map((capability) => capability.capabilityId));
for (const capability of capabilities) if (!actualCapabilities.has(capability)) fail("Missing owner-approved capability: " + capability);
if (actualCapabilities.size !== capabilities.length) fail("Unexpected owner-approved capability count: " + actualCapabilities.size);

const actualBuckets = new Set(Object.keys(matrix.runtimeBuckets || approval.runtimeBuckets || {}));
for (const bucket of buckets) if (!actualBuckets.has(bucket)) fail("Missing owner-approved runtime bucket: " + bucket);

const corpus = [
  ...requiredDocs.filter(exists).map(read),
  ...requiredJson.filter(exists).map(read),
  ...capabilityDocs.filter(exists).map(read)
].join("\n");
for (const pr of [699,696,694,621,425,433,441,376,361,542,544]) {
  if (!corpus.includes("#" + pr) && !JSON.stringify(approval.sourcePrs || {}).includes('"' + pr + '"')) {
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
  /E2E proof approved/i
];
for (const forbidden of forbiddenPatterns) {
  if (forbidden.test(corpus)) fail("Forbidden runtime/execution claim matched: " + forbidden);
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
  if (key !== expectedScript && !allowedDescendantScripts.has(key)) {
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
if (Object.values(blocked.blockedRuntimeClaims || {}).some((value) => value !== false)) {
  fail("Blocked-use register contains a non-false runtime claim.");
}

if (failures.length) {
  console.error("AI graphics canonical agent-selection runtime-boundary owner-approval diagnostics failed:");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}
console.log("AI graphics canonical agent-selection runtime-boundary owner-approval diagnostics passed.");
