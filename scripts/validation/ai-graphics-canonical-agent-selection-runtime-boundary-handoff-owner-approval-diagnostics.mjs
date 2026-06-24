#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const baseRef = "origin/codex/rp-ai-graphics-canonical-agent-selection-runtime-boundary-handoff-owner-review";
const expectedDecision = "ai_graphics_canonical_agent_selection_runtime_boundary_handoff_owner_approved_with_warnings";
const expectedScript = "ai-graphics:canonical-agent-selection:runtime-boundary-handoff-owner-approval-diagnostics";
const expectedScriptCommand = "node scripts/validation/ai-graphics-canonical-agent-selection-runtime-boundary-handoff-owner-approval-diagnostics.mjs";
const failures = [];

const fail = (message) => failures.push(message);
const rel = (file) => path.join(root, file);
const exists = (file) => fs.existsSync(rel(file));
const read = (file) => fs.readFileSync(rel(file), "utf8");
const parseJson = (file) => JSON.parse(read(file));
const gitEnv = { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" };
const git = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8", env: gitEnv }).trim();

const requiredDocs = [
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-owner-approval.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-owner-approval-source-lockfile.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-schema-owner-approval.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-contract-owner-approval.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-tool-map-owner-approval.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-capability-map-owner-approval.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-runtime-buckets-owner-approval.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-proof-status-owner-approval.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-missing-proof-owner-approval.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-planning-only-policy-owner-approval.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-blocked-use-register-owner-approval.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-safety-boundary-owner-approval.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-tool-route-placeholder-owner-approval.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-worker-placeholder-owner-approval.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-next-lane-owner-approval.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-owner-approval-decision.md",
  "docs/prompt-ai-graphics-canonical-agent-selection-runtime-boundary-handoff-owner-approval-results.md",
  "docs/implementation-prompts/prompt-ai-graphics-canonical-agent-selection-runtime-boundary-handoff-owner-approval.md"
];

const requiredJson = [
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-owner-approval.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-owner-approval-source-lockfile.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-schema-owner-approval.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-contract-owner-approval.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-tool-map-owner-approval.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-capability-map-owner-approval.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-runtime-buckets-owner-approval.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-proof-status-owner-approval.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-blocked-use-register-owner-approval.json"
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

const schemaFields = [
  "handoffId",
  "sourceBoundaryDecision",
  "sourceBoundaryPr",
  "agentSelectionConsumer",
  "requestedCapability",
  "candidateTools",
  "rankedTools",
  "eliminatedTools",
  "runtimeBoundaryByTool",
  "runtimeBoundaryByCapability",
  "proofStatusByTool",
  "missingProofByTool",
  "preferredPlanningTools",
  "fallbackPlanningTools",
  "executionAllowedNow",
  "routeExecutionAllowedNow",
  "workerExecutionAllowedNow",
  "toolExecutionAllowedNow",
  "browserWebglCanvasAllowedNow",
  "gpuModelRuntimeAllowedNow",
  "providerRuntimeAllowedNow",
  "publicArtifactAllowedNow",
  "signedUrlAllowedNow",
  "runtimeReadyNow",
  "internalBetaReadyNow",
  "productionReadyNow",
  "nextProofMilestone"
];

const capabilityDocs = capabilities.map((capability) =>
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection/runtime-boundary-handoff-owner-approval/" +
  capability.replaceAll("_", "-") + ".md"
);

for (const file of [...requiredDocs, ...requiredJson, ...capabilityDocs]) {
  if (!exists(file)) fail("Missing required file: " + file);
}

let approval = {};
let lockfile = {};
let schema = {};
let contract = {};
let toolMap = {};
let capabilityMap = {};
let runtimeBucketDoc = {};
let proofStatus = {};
let blocked = {};

try { approval = parseJson("docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-owner-approval.json"); } catch (error) { fail("Unable to parse owner approval JSON: " + error.message); }
try { lockfile = parseJson("docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-owner-approval-source-lockfile.json"); } catch (error) { fail("Unable to parse owner approval source lockfile JSON: " + error.message); }
try { schema = parseJson("docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-schema-owner-approval.json"); } catch (error) { fail("Unable to parse schema owner approval JSON: " + error.message); }
try { contract = parseJson("docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-contract-owner-approval.json"); } catch (error) { fail("Unable to parse contract owner approval JSON: " + error.message); }
try { toolMap = parseJson("docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-tool-map-owner-approval.json"); } catch (error) { fail("Unable to parse tool map owner approval JSON: " + error.message); }
try { capabilityMap = parseJson("docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-capability-map-owner-approval.json"); } catch (error) { fail("Unable to parse capability map owner approval JSON: " + error.message); }
try { runtimeBucketDoc = parseJson("docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-runtime-buckets-owner-approval.json"); } catch (error) { fail("Unable to parse runtime buckets owner approval JSON: " + error.message); }
try { proofStatus = parseJson("docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-proof-status-owner-approval.json"); } catch (error) { fail("Unable to parse proof status owner approval JSON: " + error.message); }
try { blocked = parseJson("docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-handoff-blocked-use-register-owner-approval.json"); } catch (error) { fail("Unable to parse blocked-use owner approval JSON: " + error.message); }

if (approval.decision !== expectedDecision) fail("Unexpected decision: " + approval.decision);

const trueBooleans = [
  "canonicalAgentSelectionRuntimeBoundaryHandoffOwnerApprovalCompleted",
  "sourceRuntimeBoundaryHandoffOwnerReviewAccepted",
  "sourceRuntimeBoundaryHandoffQaAccepted",
  "sourceRuntimeBoundaryHandoffReviewAccepted",
  "sourceRuntimeBoundaryCanonicalizationOwnerApprovalQaAccepted",
  "all21ToolsCoveredByRuntimeBoundaryHandoffOwnerApproval",
  "allRequiredCapabilitiesCoveredByRuntimeBoundaryHandoffOwnerApproval",
  "allRuntimeBucketsCoveredByRuntimeBoundaryHandoffOwnerApproval",
  "handoffSchemaOwnerApproved",
  "handoffContractOwnerApproved",
  "handoffToolMapOwnerApproved",
  "handoffCapabilityMapOwnerApproved",
  "handoffProofStatusOwnerApproved",
  "handoffMissingProofOwnerApproved",
  "handoffPlanningOnlyPolicyOwnerApproved",
  "handoffBlockedUseRegisterOwnerApproved",
  "toolRoutePlaceholderOwnerApproved",
  "workerPlaceholderOwnerApproved",
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

for (const key of trueBooleans) {
  if (approval.booleans?.[key] !== true) fail("Required true boolean missing: " + key);
}
for (const key of falseBooleans) {
  if (approval.booleans?.[key] !== false) fail("Required false boolean missing: " + key);
}

for (const field of schemaFields) {
  if (!(schema.schemaFields || approval.schemaFields || []).includes(field)) fail("Missing schema field: " + field);
}
if (schema.requiredFieldsPresent !== true) fail("Schema owner approval does not mark required fields present.");
if (
  contract.planningOnlyPreserved !== true ||
  contract.executionAllowedNow !== false ||
  contract.routeExecutionAllowedNow !== false ||
  contract.workerExecutionAllowedNow !== false ||
  contract.toolExecutionAllowedNow !== false
) {
  fail("Handoff contract does not preserve planning-only behavior.");
}

const actualTools = new Set((toolMap.tools || approval.tools || []).map((tool) => tool.toolId || tool));
for (const tool of allTools) if (!actualTools.has(tool)) fail("Missing owner-approved tool: " + tool);
if (actualTools.size !== allTools.length) fail("Unexpected owner-approved tool count: " + actualTools.size);

const actualCapabilities = new Set((capabilityMap.capabilities || approval.capabilities || []).map((capability) => capability.capabilityId || capability));
for (const capability of capabilities) if (!actualCapabilities.has(capability)) fail("Missing owner-approved capability: " + capability);
if (actualCapabilities.size !== capabilities.length) fail("Unexpected owner-approved capability count: " + actualCapabilities.size);

const actualBuckets = new Set(Object.keys(runtimeBucketDoc.runtimeBuckets || approval.runtimeBuckets || {}));
for (const bucket of buckets) if (!actualBuckets.has(bucket)) fail("Missing owner-approved runtime bucket: " + bucket);
if (actualBuckets.size !== buckets.length) fail("Unexpected owner-approved runtime bucket count: " + actualBuckets.size);

for (const tool of allTools) {
  if (!(proofStatus.tools || []).some((entry) => entry.toolId === tool)) fail("Missing proof-status owner-approved tool: " + tool);
}
if (Object.values(blocked.blockedUse || {}).some((value) => value !== false)) {
  fail("Blocked-use owner approval register contains a non-false runtime claim.");
}

const corpus = [
  ...requiredDocs.filter(exists).map(read),
  ...requiredJson.filter(exists).map(read),
  ...capabilityDocs.filter(exists).map(read)
].join("\n");

for (const pr of [722,719,718,715,714,710,709,705,704,700,699,696,694,692,689,688,686,685,683,681,677,674,671,668,665,661,657,656,651,646,645,642,638,623,621,425,433,441,376,361,542,544]) {
  const inReview = JSON.stringify(approval.sourcePrs || {}).includes("\"" + pr + "\"");
  const inLockfile = JSON.stringify(lockfile.sourcePrs || {}).includes("\"" + pr + "\"");
  if (!corpus.includes("#" + pr) && !inReview && !inLockfile) fail("Missing PR citation: #" + pr);
}

for (const token of ["TRACK_B_MEDIA_OSS_STEWARD", "Track A render/export exclusion", "PR #544"]) {
  if (!corpus.includes(token)) fail("Missing exclusion token: " + token);
}
for (const tool of allTools) if (!corpus.includes(tool)) fail("Missing tool text: " + tool);
for (const capability of capabilities) if (!corpus.includes(capability)) fail("Missing capability text: " + capability);
for (const bucket of buckets) if (!corpus.includes(bucket)) fail("Missing runtime bucket text: " + bucket);

for (const phrase of [
  "planning/study metadata",
  "agentCanSelectForPlanning",
  "Tool Route handoff is a future-only placeholder",
  "Worker handoff is a future-only placeholder"
]) {
  if (!corpus.includes(phrase)) fail("Missing owner-approval phrase: " + phrase);
}

for (const phrase of [
  "agent may read runtime-boundary metadata",
  "agent may select tools for planning/study only",
  "agent may rank tools",
  "agent may eliminate tools",
  "agent may explain missing proof",
  "agent may recommend preferred and fallback tools for planning",
  "agent may return next proof milestones"
]) {
  if (!corpus.includes(phrase) && !JSON.stringify(contract).includes(phrase)) {
    fail("Missing allowed handoff behavior: " + phrase);
  }
}

for (const phrase of [
  "no tool execution",
  "no Tool Route execution",
  "no Worker execution",
  "no provider/model execution",
  "no browser/WebGL/canvas runtime",
  "no GPU/model runtime",
  "no signed URL",
  "no public artifact"
]) {
  if (!corpus.includes(phrase) && !JSON.stringify(contract).includes(phrase)) {
    fail("Missing blocked handoff behavior: " + phrase);
  }
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
const scriptDrift = Object.keys(packageJson.scripts || {}).filter((key) =>
  JSON.stringify(packageJson.scripts[key]) !== JSON.stringify(basePackageJson.scripts?.[key])
);
for (const key of scriptDrift) {
  if (
    key !== expectedScript &&
    key !== "ai-graphics:cpu-static-execution-proof:phase0" &&
    key !== "ai-graphics:cpu-static-execution-proof:phase0-diagnostics" &&
    key !== "ai-graphics:cpu-static-execution-proof:phase0-qa-diagnostics"
  ) fail("Unexpected script drift: " + key);
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
  console.error("AI graphics canonical agent-selection runtime-boundary handoff owner approval diagnostics failed:");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}
console.log("AI graphics canonical agent-selection runtime-boundary handoff owner approval diagnostics passed.");
