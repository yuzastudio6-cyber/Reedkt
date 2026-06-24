#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const baseRef = "origin/codex/rp-ai-graphics-canonical-agent-selection-canonicalization-owner-approval";
const expectedDecision = "ai_graphics_canonical_agent_selection_canonicalization_owner_approval_qa_passed_with_warnings";
const expectedScript = "ai-graphics:canonical-agent-selection:canonicalization-owner-approval-qa-diagnostics";
const expectedScriptCommand = "node scripts/validation/ai-graphics-canonical-agent-selection-canonicalization-owner-approval-qa-diagnostics.mjs";
const failures = [];
const fail = (message) => failures.push(message);
const rel = (file) => path.join(root, file);
const exists = (file) => fs.existsSync(rel(file));
const read = (file) => fs.readFileSync(rel(file), "utf8");
const parseJson = (file) => JSON.parse(read(file));
const gitEnv = { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" };
const git = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8", env: gitEnv }).trim();

const requiredDocs = [
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-canonicalization-owner-approval-qa-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-canonicalization-owner-approval-qa-source-lockfile.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-canonicalization-owner-approval-qa-ledger.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-canonicalization-owner-approval-qa-matrix.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-schema-canonicalization-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-capability-map-canonicalization-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-ranking-rules-canonicalization-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-elimination-rules-canonicalization-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-fallback-rules-canonicalization-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-missing-proof-rules-canonicalization-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-safety-boundary-canonicalization-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-planning-only-policy-canonicalization-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-examples-canonicalization-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-blocked-use-register-canonicalization-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-next-lane-canonicalization-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-canonicalization-owner-approval-qa-decision.md",
  "docs/prompt-ai-graphics-canonical-agent-selection-canonicalization-owner-approval-qa-review-results.md",
  "docs/implementation-prompts/prompt-ai-graphics-canonical-agent-selection-canonicalization-owner-approval-qa-review.md"
];

const requiredJson = [
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-canonicalization-owner-approval-qa-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-canonicalization-owner-approval-qa-source-lockfile.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-canonicalization-owner-approval-qa-ledger.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-canonicalization-owner-approval-qa-matrix.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-schema-canonicalization-owner-approval-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-capability-map-canonicalization-owner-approval-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-ranking-rules-canonicalization-owner-approval-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-elimination-rules-canonicalization-owner-approval-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-fallback-rules-canonicalization-owner-approval-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-missing-proof-rules-canonicalization-owner-approval-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-safety-boundary-canonicalization-owner-approval-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-planning-only-policy-canonicalization-owner-approval-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-examples-canonicalization-owner-approval-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-blocked-use-register-canonicalization-owner-approval-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-next-lane-canonicalization-owner-approval-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-canonicalization-owner-approval-qa-decision.json"
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
    "docs/tool-intelligence/ai-graphics/canonical-agent-selection/canonicalization-owner-approval-qa/" +
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

let qa = {};
try {
  qa = parseJson("docs/tool-intelligence/ai-graphics/canonical-agent-selection-canonicalization-owner-approval-qa-review.json");
} catch (error) {
  fail("Unable to parse canonicalization owner-approval QA JSON: " + error.message);
}

if (qa.decision !== expectedDecision) fail("Unexpected decision: " + qa.decision);
if (qa.canonicalAgentSelectionLedgerOwnerApprovalQa?.accepted !== true) fail("Canonical ledger owner-approval QA was not accepted.");
if (qa.canonicalAgentSelectionMatrixOwnerApprovalQa?.accepted !== true) fail("Canonical matrix owner-approval QA was not accepted.");

const trueBooleans = [
  "canonicalAgentSelectionCanonicalizationOwnerApprovalQaCompleted",
  "sourceCanonicalAgentSelectionCanonicalizationOwnerApprovalAccepted",
  "sourceCanonicalAgentSelectionCanonicalizationOwnerReviewAccepted",
  "sourceCanonicalAgentSelectionCanonicalizationQaAccepted",
  "sourceCanonicalAgentSelectionCanonicalizationReviewAccepted",
  "sourceCanonicalAgentSelectionOwnerApprovalQaAccepted",
  "sourceCanonicalAgentSelectionOwnerApprovalAccepted",
  "sourceCanonicalAgentSelectionOwnerReviewAccepted",
  "sourceCanonicalAgentSelectionQaAccepted",
  "sourceCanonicalAgentSelectionReviewAccepted",
  "sourceCanonicalRoutingCanonicalizationAccepted",
  "all21ToolsCoveredByAgentSelectionCanonicalizationOwnerApprovalQa",
  "allRequiredCapabilitiesCoveredByAgentSelectionCanonicalizationOwnerApprovalQa",
  "canonicalAgentSelectionLedgerOwnerApprovalQaAccepted",
  "canonicalAgentSelectionMatrixOwnerApprovalQaAccepted",
  "canonicalAgentSelectionSchemaCanonicalizationOwnerApprovalQaAccepted",
  "capabilityMapCanonicalizationOwnerApprovalQaAccepted",
  "rankingRulesCanonicalizationOwnerApprovalQaAccepted",
  "eliminationRulesCanonicalizationOwnerApprovalQaAccepted",
  "fallbackRulesCanonicalizationOwnerApprovalQaAccepted",
  "missingProofRulesCanonicalizationOwnerApprovalQaAccepted",
  "planningOnlyPolicyCanonicalizationOwnerApprovalQaAccepted",
  "safetyBoundaryCanonicalizationOwnerApprovalQaAccepted",
  "selectionExamplesCanonicalizationOwnerApprovalQaAccepted",
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
  if (qa.booleans?.[key] !== true) fail("Expected true boolean: " + key);
}
for (const key of falseBooleans) {
  if (qa.booleans?.[key] !== false) fail("Expected false boolean: " + key);
}

const toolSet = new Set((qa.tools || []).map((tool) => tool.toolId));
for (const tool of allTools) {
  if (!toolSet.has(tool)) fail("Missing tool: " + tool);
}

const capMap = qa.capabilities || {};
for (const capability of capabilities) {
  const row = capMap[capability];
  if (!row) fail("Missing capability owner-approval QA row: " + capability);
  for (const key of [
    "capabilityId",
    "canonicalStatusOwnerApprovalQaAccepted",
    "sourceSelectionReviewAccepted",
    "sourceSelectionQaAccepted",
    "sourceSelectionOwnerReviewAccepted",
    "sourceSelectionOwnerApprovalAccepted",
    "sourceSelectionOwnerApprovalQaAccepted",
    "sourceSelectionCanonicalizationReviewAccepted",
    "sourceSelectionCanonicalizationQaAccepted",
    "sourceSelectionCanonicalizationOwnerReviewAccepted",
    "sourceSelectionCanonicalizationOwnerApprovalAccepted",
    "preferredPlanningToolsOwnerApprovalQaAccepted",
    "conditionalPlanningToolsOwnerApprovalQaAccepted",
    "fallbackPlanningToolsOwnerApprovalQaAccepted",
    "eliminatedToolsOwnerApprovalQaAccepted",
    "missingProofRulesOwnerApprovalQaAccepted",
    "currentExecutionAllowed",
    "blockedRuntimeReasonsOwnerApprovalQaAccepted",
    "nextProofMilestoneOwnerApprovalQaAccepted"
  ]) {
    if (!(key in row)) fail("Capability " + capability + " missing field: " + key);
  }
  if (row.canonicalStatusOwnerApprovalQaAccepted !== "owner_approval_qa_accepted_canonical_planning_study_metadata_selection_only") {
    fail("Unexpected owner-approval QA status for capability: " + capability);
  }
  if (row.currentExecutionAllowed !== false) fail("Capability should keep current execution false: " + capability);
}

const schema = qa.schemaOwnerApprovalQa || {};
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
  if (!schema.requiredSections?.includes(section)) fail("Missing schema owner-approval QA section: " + section);
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
  "689",
  "688",
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
    key !== "ai-graphics:canonical-agent-selection:runtime-boundary-diagnostics" &&
    key !== "ai-graphics:canonical-agent-selection:runtime-boundary-qa-diagnostics" &&
    key !== "ai-graphics:canonical-agent-selection:runtime-boundary-owner-diagnostics" &&
    key !== "ai-graphics:canonical-agent-selection:runtime-boundary-owner-approval-diagnostics" &&
    key !== "ai-graphics:canonical-agent-selection:runtime-boundary-owner-approval-qa-diagnostics" &&
    key !== "ai-graphics:canonical-agent-selection:runtime-boundary-canonicalization-diagnostics" &&
    key !== "ai-graphics:canonical-agent-selection:runtime-boundary-canonicalization-qa-diagnostics" &&
    key !== "ai-graphics:canonical-agent-selection:runtime-boundary-canonicalization-owner-diagnostics"
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
  console.error("AI graphics canonical agent-selection canonicalization owner-approval QA diagnostics failed:");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}
console.log("AI graphics canonical agent-selection canonicalization owner-approval QA diagnostics passed.");
