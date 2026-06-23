#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const baseRef =
  "origin/codex/rp-ai-graphics-tool-capability-study-ranking-matrix-owner-approval-qa-review";
const expectedDecision =
  "ai_graphics_tool_capability_study_canonical_agent_routing_approved_with_warnings";
const expectedScript =
  "ai-graphics:tool-capability-study:canonical-routing-approval-diagnostics";
const expectedScriptCommand =
  "node scripts/validation/ai-graphics-tool-capability-study-canonical-agent-routing-approval-diagnostics.mjs";
const allowedDescendantScripts = new Set([
  "ai-graphics:canonical-agent-selection:review-diagnostics",
  "ai-graphics:tool-capability-study:canonical-routing-canonicalization-owner-approval-qa-diagnostics",
  "ai-graphics:tool-capability-study:canonical-routing-canonicalization-owner-approval-diagnostics",
  "ai-graphics:tool-capability-study:canonical-routing-qa-diagnostics",
  "ai-graphics:tool-capability-study:canonical-routing-owner-diagnostics",
  "ai-graphics:tool-capability-study:canonical-routing-owner-approval-diagnostics",
  "ai-graphics:tool-capability-study:canonical-routing-owner-approval-qa-diagnostics",
  "ai-graphics:tool-capability-study:canonical-routing-canonicalization-diagnostics",
  "ai-graphics:tool-capability-study:canonical-routing-canonicalization-qa-diagnostics",
  "ai-graphics:tool-capability-study:canonical-routing-canonicalization-owner-diagnostics",
]);

const failures = [];
const fail = (message) => failures.push(message);
const rel = (file) => path.join(root, file);
const exists = (file) => fs.existsSync(rel(file));
const read = (file) => fs.readFileSync(rel(file), "utf8");
const parseJson = (file) => JSON.parse(read(file));
const gitEnv = {
  ...process.env,
  DEVELOPER_DIR: "/Library/Developer/CommandLineTools",
};
const git = (args) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8", env: gitEnv }).trim();

const requiredDocs = [
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-approval.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-source-lockfile.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-schema.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-capability-map.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-ranking-policy.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-elimination-policy.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-fallback-policy.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-safety-boundary.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-planning-only-policy.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-examples.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-blocked-use-register.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-next-lane.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-approval-decision.md",
  "docs/prompt-ai-graphics-tool-capability-study-canonical-agent-routing-approval-results.md",
  "docs/implementation-prompts/prompt-ai-graphics-tool-capability-study-canonical-agent-routing-approval.md",
];

const requiredJson = [
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-approval.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-source-lockfile.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-schema.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-capability-map.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-ranking-policy.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-elimination-policy.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-fallback-policy.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-safety-boundary.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-planning-only-policy.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-examples.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-blocked-use-register.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-decision.json",
];

const routeDocs = [
  "chart-overlay",
  "data-visualization",
  "svg-graphics",
  "diagram-graphics",
  "animation-overlay",
  "canvas-scene",
  "webgl-3d-scene",
  "background-removal",
  "subject-segmentation",
  "upscaling",
  "tensor-image-ops",
  "model-runtime-foundation",
].map(
  (name) => `docs/tool-intelligence/ai-graphics/canonical-routing/${name}.md`,
);

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

const productCapabilities = [
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
  "model_runtime_foundation",
];

for (const file of [...requiredDocs, ...requiredJson, ...routeDocs]) {
  if (!exists(file)) fail(`Missing required file: ${file}`);
}

let approval = {};
let schema = {};
let capabilityMap = {};
let rankingPolicy = {};
let eliminationPolicy = {};
let fallbackPolicy = {};
let examples = {};
let blockedUse = {};
let safetyBoundary = {};

try {
  approval = parseJson(
    "docs/tool-intelligence/ai-graphics/canonical-agent-routing-approval.json",
  );
  schema = parseJson(
    "docs/tool-intelligence/ai-graphics/canonical-agent-routing-schema.json",
  ).routingSchema;
  capabilityMap = parseJson(
    "docs/tool-intelligence/ai-graphics/canonical-agent-routing-capability-map.json",
  ).capabilities;
  rankingPolicy = parseJson(
    "docs/tool-intelligence/ai-graphics/canonical-agent-routing-ranking-policy.json",
  ).rankingPolicy;
  eliminationPolicy = parseJson(
    "docs/tool-intelligence/ai-graphics/canonical-agent-routing-elimination-policy.json",
  ).eliminationPolicy;
  fallbackPolicy = parseJson(
    "docs/tool-intelligence/ai-graphics/canonical-agent-routing-fallback-policy.json",
  ).fallbackPolicy;
  examples = parseJson(
    "docs/tool-intelligence/ai-graphics/canonical-agent-routing-examples.json",
  ).routeExamples;
  blockedUse = parseJson(
    "docs/tool-intelligence/ai-graphics/canonical-agent-routing-blocked-use-register.json",
  ).blockedUseRegister;
  safetyBoundary = parseJson(
    "docs/tool-intelligence/ai-graphics/canonical-agent-routing-safety-boundary.json",
  ).safetyBoundary;
} catch (error) {
  fail(`Unable to parse canonical routing JSON: ${error.message}`);
}

if (approval.decision !== expectedDecision) {
  fail(`Unexpected decision: ${approval.decision}`);
}

const requiredTrue = [
  "canonicalAgentRoutingApprovalCompleted",
  "sourceCapabilityStudyOwnerApprovalQaAccepted",
  "all21ToolsCoveredByRouting",
  "allRequiredCapabilitiesCovered",
  "canonicalRoutingSchemaCreated",
  "capabilityMapCreated",
  "rankingPolicyCreated",
  "eliminationPolicyCreated",
  "fallbackPolicyCreated",
  "planningOnlyPolicyCreated",
  "safetyBoundaryCreated",
  "routingExamplesCreated",
  "agentCanSelectForPlanning",
];
const requiredFalse = [
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
];
for (const key of requiredTrue) {
  if (approval.booleans?.[key] !== true) fail(`Expected true boolean: ${key}`);
}
for (const key of requiredFalse) {
  if (approval.booleans?.[key] !== false) fail(`Expected false boolean: ${key}`);
}

const schemaSections = {
  requestCapabilityExtraction: [
    "requestedCapability",
    "inputMediaType",
    "desiredOutputType",
    "visualIntent",
    "timeSensitivity",
    "qualityPreference",
    "executionAllowed",
    "artifactPolicy",
    "runtimeConstraints",
  ],
  candidateToolRanking: [
    "candidateToolId",
    "capabilityFitScore",
    "proofLevelScore",
    "runtimeReadinessScore",
    "costClass",
    "latencyClass",
    "cloudTarget",
    "fallbackRank",
    "selectionReason",
    "blockedReason",
  ],
  eliminationResult: [
    "toolId",
    "eliminated",
    "eliminationReason",
    "requiredMissingApproval",
    "saferAlternative",
  ],
  planningOnlyRecommendation: [
    "recommendedToolIds",
    "fallbackToolIds",
    "blockedToolIds",
    "planningSummary",
    "executionAllowedNow",
    "nextProofRequired",
  ],
  safetyBoundary: [
    "toolExecutionAllowed",
    "workerExecutionAllowed",
    "routeExecutionAllowed",
    "browserWebglCanvasAllowed",
    "gpuRuntimeAllowed",
    "modelWeightsAllowed",
    "publicArtifactAllowed",
    "signedUrlAllowed",
    "betaOrProductionAllowed",
  ],
};
for (const [section, fields] of Object.entries(schemaSections)) {
  if (!Array.isArray(schema?.[section])) fail(`Missing schema section: ${section}`);
  for (const field of fields) {
    if (!schema?.[section]?.includes(field)) {
      fail(`Missing schema field: ${section}.${field}`);
    }
  }
}

const capabilityKeys = Object.keys(capabilityMap || {});
for (const capability of productCapabilities) {
  if (!capabilityKeys.includes(capability)) fail(`Missing capability map: ${capability}`);
  if (!examples?.[capability]) fail(`Missing route example: ${capability}`);
  if (!fallbackPolicy?.[capability]) fail(`Missing fallback policy: ${capability}`);
}
if (capabilityKeys.some((key) => /track|atlas|owner/i.test(key))) {
  fail("Internal owner labels leaked into product-facing capability IDs.");
}

const routedTools = new Set((approval.tools || []).map((row) => row.toolId));
for (const tool of allTools) {
  if (!routedTools.has(tool)) fail(`Missing routed tool: ${tool}`);
}
for (const row of approval.tools || []) {
  if (row.agentCanSelectForPlanning !== true) {
    fail(`Tool is not selectable for planning: ${row.toolId}`);
  }
  if (row.agentCanExecuteNow !== false) {
    fail(`Tool is executable now: ${row.toolId}`);
  }
  if (
    row.runtimeReadyNow !== false ||
    row.internalBetaReadyNow !== false ||
    row.productionReadyNow !== false
  ) {
    fail(`Runtime/beta/production flag mismatch for ${row.toolId}`);
  }
}

if (rankingPolicy.source !== "PR #623 scoring model") {
  fail("Ranking policy does not reference PR #623 scoring model.");
}
for (const [key, value] of Object.entries({
  capabilityFit: 25,
  outputQualityPotential: 20,
  reliabilityProof: 15,
  cloudReadiness: 10,
  costEfficiency: 10,
  integrationSimplicity: 10,
  safetyAndControl: 10,
  totalScore: 100,
})) {
  if (rankingPolicy.scoringModel?.[key] !== value) {
    fail(`Ranking policy score mismatch: ${key}`);
  }
}

const eliminationText = (eliminationPolicy.rules || []).join("\n");
for (const blocker of [
  "capability mismatch",
  "proof status",
  "browser/WebGL/canvas",
  "GPU runtime or model weights",
  "public artifact creation or signed URL creation",
  "Tool Route execution or Worker execution",
  "provider/model execution",
  "Supabase, SQL, or GCS mutation",
  "simpler tool",
  "deferred, backlog, or blocked",
]) {
  if (!eliminationText.includes(blocker)) {
    fail(`Missing elimination blocker: ${blocker}`);
  }
}

for (const [capability, policy] of Object.entries(fallbackPolicy || {})) {
  if (!Array.isArray(policy.preferred) || policy.preferred.length === 0) {
    fail(`Fallback preferred list missing for ${capability}`);
  }
  if (!Array.isArray(policy.conditional)) {
    fail(`Fallback conditional list missing for ${capability}`);
  }
  if (!Array.isArray(policy.fallback) || policy.fallback.length === 0) {
    fail(`Fallback list missing for ${capability}`);
  }
}

if (blockedUse.agentCanExecuteToolsNow !== false) {
  fail("Blocked-use register does not block agent execution.");
}
for (const block of [
  "Tool execution remains blocked.",
  "Tool Route execution remains blocked.",
  "Worker execution remains blocked.",
  "Browser/WebGL/canvas runtime remains blocked.",
  "GPU runtime and model weights remain blocked.",
  "Signed URL and public artifact creation remain blocked.",
]) {
  if (!blockedUse.runtimeBlocks?.includes(block)) {
    fail(`Missing blocked-use statement: ${block}`);
  }
}
if (safetyBoundary.trackBExclusion?.ownerId !== "TRACK_B_MEDIA_OSS_STEWARD") {
  fail("Track B exclusion is missing or incorrect.");
}
if (!String(safetyBoundary.trackAExclusion?.citedEvidence || "").includes("PR #544")) {
  fail("Track A exclusion is missing PR #544 context.");
}
for (const key of [
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "routeExecutionAllowed",
  "browserWebglCanvasAllowed",
  "gpuRuntimeAllowed",
  "modelWeightsAllowed",
  "publicArtifactAllowed",
  "signedUrlAllowed",
  "betaOrProductionAllowed",
]) {
  if (safetyBoundary[key] !== false) fail(`Safety boundary must be false: ${key}`);
}

const combinedText = [...requiredDocs, ...requiredJson, ...routeDocs]
  .filter(exists)
  .map(read)
  .join("\n");
for (const pr of [
  "634",
  "632",
  "628",
  "627",
  "623",
  "621",
  "617",
  "616",
  "614",
  "607",
  "604",
  "589",
  "543",
  "425",
  "433",
  "441",
  "376",
  "361",
  "542",
  "544",
]) {
  if (!combinedText.includes(`PR #${pr}`)) fail(`Missing citation: PR #${pr}`);
}
for (const forbidden of ["dry_run_passed", "generated_local_fixture_passed"]) {
  if (combinedText.includes(forbidden)) fail(`Forbidden generic claim: ${forbidden}`);
}
for (const pattern of [
  /agentCanExecuteToolsNow[`"]?\s*[:=]\s*true/i,
  /toolExecutionPerformed[`"]?\s*[:=]\s*true/i,
  /routeExecutionPerformed[`"]?\s*[:=]\s*true/i,
  /workerExecutionPerformed[`"]?\s*[:=]\s*true/i,
  /providerRuntimePerformed[`"]?\s*[:=]\s*true/i,
  /browserWebglCanvasRuntimePerformed[`"]?\s*[:=]\s*true/i,
  /gpuRuntimePerformed[`"]?\s*[:=]\s*true/i,
  /runtimeReadyNow[`"]?\s*[:=]\s*true/i,
  /internalBetaReadyNow[`"]?\s*[:=]\s*true/i,
  /externalBetaReadyNow[`"]?\s*[:=]\s*true/i,
  /productionReadyNow[`"]?\s*[:=]\s*true/i,
  /supabaseMutationPerformed[`"]?\s*[:=]\s*true/i,
  /gcsUploadPerformed[`"]?\s*[:=]\s*true/i,
  /publicArtifactCreated[`"]?\s*[:=]\s*true/i,
  /signedUrlCreated[`"]?\s*[:=]\s*true/i,
]) {
  if (pattern.test(combinedText)) fail(`Forbidden true claim matched: ${pattern}`);
}

let packageJson = {};
let basePackageJson = {};
try {
  packageJson = JSON.parse(read("package.json"));
  basePackageJson = JSON.parse(git(["show", `${baseRef}:package.json`]));
} catch (error) {
  fail(`Unable to read package metadata: ${error.message}`);
}
for (const section of [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
]) {
  if (
    JSON.stringify(packageJson[section] || {}) !==
    JSON.stringify(basePackageJson[section] || {})
  ) {
    fail(`Package dependency section changed: ${section}`);
  }
}
if (packageJson.scripts?.[expectedScript] !== expectedScriptCommand) {
  fail("Expected package script is missing or incorrect.");
}
const scriptDrift = Object.keys(packageJson.scripts || {}).filter(
  (key) =>
    JSON.stringify(packageJson.scripts[key]) !==
    JSON.stringify(basePackageJson.scripts?.[key]),
);
for (const key of scriptDrift) {
  if (key !== expectedScript && !allowedDescendantScripts.has(key)) {
    fail(`Unexpected script drift: ${key}`);
  }
}
for (const key of Object.keys(basePackageJson.scripts || {})) {
  if (!(key in (packageJson.scripts || {}))) fail(`Removed package script: ${key}`);
}

try {
  if (git(["diff", "--name-only", baseRef, "--", "package-lock.json"])) {
    fail("package-lock.json changed relative to base.");
  }
} catch (error) {
  fail(`Unable to verify package-lock diff: ${error.message}`);
}

let tracked = "";
try {
  tracked = git(["ls-files"]);
} catch (error) {
  fail(`Unable to list tracked files: ${error.message}`);
}
if (tracked.split("\n").some((file) => file.includes(".local-artifacts"))) {
  fail("Tracked .local-artifacts path found.");
}

let changed = "";
try {
  changed = git(["diff", "--name-only", baseRef]);
} catch (error) {
  fail(`Unable to list changed files: ${error.message}`);
}
const generatedOutputPattern =
  /(^|\/)(\.local-artifacts|artifacts|renders?|exports?|public)(\/|$)|\.(png|jpe?g|gif|webp|mp4|mov|webm|mkv|avi|wav|mp3|flac)$/i;
for (const file of changed.split("\n").filter(Boolean)) {
  if (generatedOutputPattern.test(file) && !file.startsWith("docs/")) {
    fail(`Generated output-like path changed: ${file}`);
  }
}

if (failures.length > 0) {
  console.error("AI graphics canonical routing approval diagnostics failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("AI graphics canonical routing approval diagnostics passed.");
