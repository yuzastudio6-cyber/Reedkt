#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const baseRef = "origin/codex/rp-ai-graphics-canonical-agent-selection-canonicalization-qa-review";
const expectedDecision = "ai_graphics_canonical_agent_selection_canonicalization_owner_review_passed_with_warnings";
const expectedScript = "ai-graphics:canonical-agent-selection:canonicalization-owner-diagnostics";
const expectedScriptCommand =
  "node scripts/validation/ai-graphics-canonical-agent-selection-canonicalization-owner-diagnostics.mjs";
const failures = [];
const fail = (message) => failures.push(message);
const rel = (file) => path.join(root, file);
const exists = (file) => fs.existsSync(rel(file));
const read = (file) => fs.readFileSync(rel(file), "utf8");
const parseJson = (file) => JSON.parse(read(file));
const gitEnv = { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" };
const git = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8", env: gitEnv }).trim();

const requiredDocs = [
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-canonicalization-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-canonicalization-owner-source-lockfile.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-canonicalization-owner-ledger.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-canonicalization-owner-matrix.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-schema-canonicalization-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-capability-map-canonicalization-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-ranking-rules-canonicalization-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-elimination-rules-canonicalization-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-fallback-rules-canonicalization-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-missing-proof-rules-canonicalization-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-safety-boundary-canonicalization-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-planning-only-policy-canonicalization-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-examples-canonicalization-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-blocked-use-register-canonicalization-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-next-lane-canonicalization-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-canonicalization-owner-review-decision.md",
  "docs/prompt-ai-graphics-canonical-agent-selection-canonicalization-owner-review-results.md",
  "docs/implementation-prompts/prompt-ai-graphics-canonical-agent-selection-canonicalization-owner-review.md"
];

const requiredJson = [
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-canonicalization-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-canonicalization-owner-source-lockfile.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-canonicalization-owner-ledger.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-canonicalization-owner-matrix.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-schema-canonicalization-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-capability-map-canonicalization-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-ranking-rules-canonicalization-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-elimination-rules-canonicalization-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-fallback-rules-canonicalization-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-missing-proof-rules-canonicalization-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-safety-boundary-canonicalization-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-planning-only-policy-canonicalization-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-examples-canonicalization-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-blocked-use-register-canonicalization-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-next-lane-canonicalization-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-canonicalization-owner-review-decision.json"
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

const capabilityDocs = capabilities.map(
  (capability) =>
    "docs/tool-intelligence/ai-graphics/canonical-agent-selection/canonicalization-owner-review/" +
    capability.replaceAll("_", "-") +
    ".md"
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
  "babylonjs"
];

for (const file of [...requiredDocs, ...requiredJson, ...capabilityDocs]) {
  if (!exists(file)) fail("Missing required file: " + file);
}

let owner = {};
try {
  owner = parseJson("docs/tool-intelligence/ai-graphics/canonical-agent-selection-canonicalization-owner-review.json");
} catch (error) {
  fail("Unable to parse canonicalization owner-review JSON: " + error.message);
}

if (owner.decision !== expectedDecision) fail("Unexpected decision: " + owner.decision);
if (owner.canonicalAgentSelectionLedgerOwner?.accepted !== true) fail("Canonical ledger owner review was not accepted.");
if (owner.canonicalAgentSelectionMatrixOwner?.accepted !== true) fail("Canonical matrix owner review was not accepted.");

const trueBooleans = [
  "canonicalAgentSelectionCanonicalizationOwnerReviewCompleted",
  "sourceCanonicalAgentSelectionCanonicalizationQaAccepted",
  "sourceCanonicalAgentSelectionCanonicalizationReviewAccepted",
  "sourceCanonicalAgentSelectionOwnerApprovalQaAccepted",
  "sourceCanonicalAgentSelectionOwnerApprovalAccepted",
  "sourceCanonicalAgentSelectionOwnerReviewAccepted",
  "sourceCanonicalAgentSelectionQaAccepted",
  "sourceCanonicalAgentSelectionReviewAccepted",
  "sourceCanonicalRoutingCanonicalizationAccepted",
  "all21ToolsCoveredByAgentSelectionCanonicalizationOwnerReview",
  "allRequiredCapabilitiesCoveredByAgentSelectionCanonicalizationOwnerReview",
  "canonicalAgentSelectionLedgerOwnerAccepted",
  "canonicalAgentSelectionMatrixOwnerAccepted",
  "canonicalAgentSelectionSchemaCanonicalizationOwnerAccepted",
  "capabilityMapCanonicalizationOwnerAccepted",
  "rankingRulesCanonicalizationOwnerAccepted",
  "eliminationRulesCanonicalizationOwnerAccepted",
  "fallbackRulesCanonicalizationOwnerAccepted",
  "missingProofRulesCanonicalizationOwnerAccepted",
  "planningOnlyPolicyCanonicalizationOwnerAccepted",
  "safetyBoundaryCanonicalizationOwnerAccepted",
  "selectionExamplesCanonicalizationOwnerAccepted",
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
  "generatedOutputCreated"
];

for (const key of trueBooleans) {
  if (owner.booleans?.[key] !== true) fail("Expected true boolean: " + key);
}
for (const key of falseBooleans) {
  if (owner.booleans?.[key] !== false) fail("Expected false boolean: " + key);
}

const toolSet = new Set((owner.tools || []).map((tool) => tool.toolId));
for (const tool of allTools) {
  if (!toolSet.has(tool)) fail("Missing tool: " + tool);
}

const capMap = owner.capabilities || {};
for (const capability of capabilities) {
  const row = capMap[capability];
  if (!row) fail("Missing capability owner-review row: " + capability);
  for (const key of [
    "capabilityId",
    "canonicalStatusOwnerAccepted",
    "sourceSelectionReviewAccepted",
    "sourceSelectionQaAccepted",
    "sourceSelectionOwnerReviewAccepted",
    "sourceSelectionOwnerApprovalAccepted",
    "sourceSelectionOwnerApprovalQaAccepted",
    "sourceSelectionCanonicalizationReviewAccepted",
    "sourceSelectionCanonicalizationQaAccepted",
    "preferredPlanningToolsOwnerAccepted",
    "conditionalPlanningToolsOwnerAccepted",
    "fallbackPlanningToolsOwnerAccepted",
    "eliminatedToolsOwnerAccepted",
    "missingProofRulesOwnerAccepted",
    "currentExecutionAllowed",
    "blockedRuntimeReasonsOwnerAccepted",
    "nextProofMilestoneOwnerAccepted"
  ]) {
    if (!(key in row)) fail("Capability " + capability + " missing field: " + key);
  }
  if (row.canonicalStatusOwnerAccepted !== "owner_accepted_canonical_planning_study_metadata_selection_only") {
    fail("Unexpected owner status for capability: " + capability);
  }
  if (row.currentExecutionAllowed !== false) fail("Capability should keep current execution false: " + capability);
}

const schema = owner.schemaOwnerReview || {};
for (const section of [
  "capabilityExtraction",
  "candidateMapping",
  "ranking",
  "elimination",
  "fallback",
  "missingProofRequirements",
  "planningOnlyRecommendation",
  "safetyBoundary"
]) {
  if (!schema.requiredSections?.includes(section)) fail("Missing schema owner-review section: " + section);
}

const combinedText = [
  ...requiredDocs,
  ...requiredJson,
  ...capabilityDocs,
  "docs/production-beta-readiness-scorecard.md"
]
  .filter(exists)
  .map(read)
  .join("\n");

for (const pr of [
  "686",
  "685",
  "683",
  "681",
  "677",
  "674",
  "671",
  "668",
  "665",
  "661",
  "657",
  "656",
  "651",
  "646",
  "642",
  "638",
  "623",
  "376",
  "361",
  "425",
  "433",
  "441",
  "542",
  "544"
]) {
  if (!combinedText.includes("PR #" + pr)) fail("Missing PR citation: PR #" + pr);
}

for (const phrase of ["TRACK_B_MEDIA_OSS_STEWARD", "Track A render/export exclusion", "PR #544"]) {
  if (!combinedText.includes(phrase)) fail("Missing exclusion phrase: " + phrase);
}

for (const capability of capabilities) {
  if (!combinedText.includes(capability)) fail("Missing product-facing capability: " + capability);
}

for (const pattern of [
  /"agentCanExecuteToolsNow"\s*:\s*true/i,
  /"routeExecutionApprovedNow"\s*:\s*true/i,
  /"workerExecutionApprovedNow"\s*:\s*true/i,
  /"toolExecutionApprovedNow"\s*:\s*true/i,
  /"runtimeReadyNow"\s*:\s*true/i,
  /"internalBetaReadyNow"\s*:\s*true/i,
  /"externalBetaReadyNow"\s*:\s*true/i,
  /"productionReadyNow"\s*:\s*true/i,
  /"browserWebglCanvasRuntimePerformed"\s*:\s*true/i,
  /"gpuRuntimePerformed"\s*:\s*true/i,
  /"providerRuntimePerformed"\s*:\s*true/i,
  /"supabaseMutationPerformed"\s*:\s*true/i,
  /"gcsUploadPerformed"\s*:\s*true/i,
  /"publicArtifactCreated"\s*:\s*true/i,
  /"signedUrlCreated"\s*:\s*true/i,
  /execution approved now:\s*true/i,
  /runtime ready now:\s*true/i,
  /E2E proof approved/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i
]) {
  if (pattern.test(combinedText)) fail("Forbidden execution/runtime claim matched: " + pattern);
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
    key !== "ai-graphics:canonical-agent-selection:canonicalization-owner-approval-diagnostics" &&
    key !== "ai-graphics:canonical-agent-selection:canonicalization-owner-approval-qa-diagnostics" &&
    key !== "ai-graphics:canonical-agent-selection:runtime-boundary-diagnostics" &&
    key !== "ai-graphics:canonical-agent-selection:runtime-boundary-qa-diagnostics" &&
    key !== "ai-graphics:canonical-agent-selection:runtime-boundary-owner-diagnostics" &&
    key !== "ai-graphics:canonical-agent-selection:runtime-boundary-owner-approval-diagnostics" &&
    key !== "ai-graphics:canonical-agent-selection:runtime-boundary-owner-approval-qa-diagnostics" &&
    key !== "ai-graphics:canonical-agent-selection:runtime-boundary-canonicalization-diagnostics" &&
    key !== "ai-graphics:canonical-agent-selection:runtime-boundary-canonicalization-qa-diagnostics"
  ) {
    fail("Unexpected script drift: " + key);
  }
}
for (const key of Object.keys(basePackageJson.scripts || {})) {
  if (!(key in (packageJson.scripts || {}))) fail("Removed package script: " + key);
}

try {
  if (git(["diff", "--name-only", baseRef, "--", "package-lock.json"])) {
    fail("package-lock.json changed relative to base.");
  }
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
  console.error("AI graphics canonical agent-selection canonicalization owner diagnostics failed:");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}
console.log("AI graphics canonical agent-selection canonicalization owner diagnostics passed.");
