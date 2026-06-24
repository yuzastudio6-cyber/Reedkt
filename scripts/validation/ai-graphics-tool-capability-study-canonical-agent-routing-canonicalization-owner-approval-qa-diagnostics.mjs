#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const baseRef = "origin/codex/rp-ai-graphics-tool-capability-study-canonical-agent-routing-canonicalization-owner-approval";
const expectedDecision = "ai_graphics_tool_capability_study_canonical_agent_routing_canonicalization_owner_approval_qa_passed_with_warnings";
const expectedScript = "ai-graphics:tool-capability-study:canonical-routing-canonicalization-owner-approval-qa-diagnostics";
const expectedScriptCommand = "node scripts/validation/ai-graphics-tool-capability-study-canonical-agent-routing-canonicalization-owner-approval-qa-diagnostics.mjs";
const allowedDescendantScripts = new Set([
  "ai-graphics:canonical-agent-selection:runtime-boundary-qa-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-owner-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-owner-approval-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-owner-approval-qa-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-canonicalization-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-diagnostics",
  "ai-graphics:canonical-agent-selection:canonicalization-owner-approval-qa-diagnostics",
  "ai-graphics:canonical-agent-selection:canonicalization-owner-approval-diagnostics",
  "ai-graphics:canonical-agent-selection:canonicalization-diagnostics",
  "ai-graphics:canonical-agent-selection:canonicalization-qa-diagnostics",
  "ai-graphics:canonical-agent-selection:canonicalization-owner-diagnostics",
  "ai-graphics:canonical-agent-selection:owner-approval-qa-diagnostics",
  "ai-graphics:canonical-agent-selection:qa-diagnostics",
  "ai-graphics:canonical-agent-selection:review-diagnostics",
  "ai-graphics:canonical-agent-selection:owner-diagnostics",
  "ai-graphics:canonical-agent-selection:owner-approval-diagnostics",
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
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-owner-approval-qa-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-owner-approval-qa-source-lockfile.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-owner-approval-qa-ledger.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-owner-approval-qa-matrix.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-schema-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-capability-map-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-ranking-policy-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-elimination-policy-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-fallback-policy-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-safety-boundary-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-planning-only-policy-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-examples-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-blocked-use-register-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-next-lane-owner-approval-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-owner-approval-qa-decision.md",
  "docs/prompt-ai-graphics-tool-capability-study-canonical-agent-routing-canonicalization-owner-approval-qa-review-results.md",
  "docs/implementation-prompts/prompt-ai-graphics-tool-capability-study-canonical-agent-routing-canonicalization-owner-approval-qa-review.md"
];
const requiredJson = [
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-owner-approval-qa-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-owner-approval-qa-source-lockfile.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-owner-approval-qa-ledger.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-owner-approval-qa-matrix.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-schema-owner-approval-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-capability-map-owner-approval-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-ranking-policy-owner-approval-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-elimination-policy-owner-approval-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-fallback-policy-owner-approval-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-safety-boundary-owner-approval-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-planning-only-policy-owner-approval-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-examples-owner-approval-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-blocked-use-register-owner-approval-qa.json"
];
const capabilitySlugs = [
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
  "model-runtime-foundation"
];
const capabilityDocs = capabilitySlugs.map((name) => "docs/tool-intelligence/ai-graphics/canonical-routing/canonicalization-owner-approval-qa/" + name + ".md");
const sourceDocs = [
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-owner-approval.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-qa-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-owner-approval-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-owner-approval.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-qa-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-approval.json",
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
const requiredCapabilities = [
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

for (const file of [...requiredDocs, ...requiredJson, ...capabilityDocs, ...sourceDocs]) {
  if (!exists(file)) fail("Missing required file: " + file);
}

let qa = {};
try { qa = parseJson("docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-owner-approval-qa-review.json"); }
catch (error) { fail("Unable to parse owner approval QA JSON: " + error.message); }
if (qa.decision !== expectedDecision) fail("Unexpected decision: " + qa.decision);

const trueBooleans = [
  "canonicalAgentRoutingCanonicalizationOwnerApprovalQaCompleted",
  "sourceCanonicalizationOwnerApprovalAccepted",
  "sourceCanonicalizationOwnerReviewAccepted",
  "sourceCanonicalizationQaAccepted",
  "sourceCanonicalizationReviewAccepted",
  "sourceCanonicalRoutingOwnerApprovalQaAccepted",
  "sourceCanonicalRoutingOwnerApprovalAccepted",
  "sourceCanonicalRoutingOwnerReviewAccepted",
  "sourceCanonicalRoutingQaAccepted",
  "sourceCanonicalRoutingApprovalAccepted",
  "all21ToolsCoveredByCanonicalRoutingOwnerApprovalQa",
  "allRequiredCapabilitiesCanonicalizedOwnerApprovalQa",
  "canonicalizationLedgerOwnerApprovalQaAccepted",
  "canonicalizationMatrixOwnerApprovalQaAccepted",
  "canonicalRoutingSchemaCanonicalizationOwnerApprovalQaAccepted",
  "capabilityMapCanonicalizationOwnerApprovalQaAccepted",
  "rankingPolicyCanonicalizationOwnerApprovalQaAccepted",
  "eliminationPolicyCanonicalizationOwnerApprovalQaAccepted",
  "fallbackPolicyCanonicalizationOwnerApprovalQaAccepted",
  "planningOnlyPolicyCanonicalizationOwnerApprovalQaAccepted",
  "safetyBoundaryCanonicalizationOwnerApprovalQaAccepted",
  "routingExamplesCanonicalizationOwnerApprovalQaAccepted",
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
for (const key of trueBooleans) if (qa.booleans?.[key] !== true) fail("Expected true boolean: " + key);
for (const key of falseBooleans) if (qa.booleans?.[key] !== false) fail("Expected false boolean: " + key);

const toolSet = new Set((qa.tools || []).map((row) => row.toolId));
for (const tool of allTools) if (!toolSet.has(tool)) fail("Missing owner-approval QA tool row: " + tool);
for (const row of qa.tools || []) {
  if (row.agentCanSelectForPlanning !== true) fail("Tool not selectable for planning: " + row.toolId);
  for (const key of ["agentCanExecuteNow", "routeExecutionApprovedNow", "workerExecutionApprovedNow", "toolExecutionApprovedNow", "browserWebglCanvasRuntimeApprovedNow", "gpuRuntimeApprovedNow", "providerRuntimeApprovedNow", "publicArtifactApprovedNow", "signedUrlApprovedNow", "runtimeReadyNow", "internalBetaReadyNow", "externalBetaReadyNow", "productionReadyNow"]) {
    if (row[key] !== false) fail("Tool should keep false " + key + ": " + row.toolId);
  }
}
const capabilityMap = qa.capabilityCanonicalizationOwnerApprovalQa || {};
for (const capability of requiredCapabilities) {
  const row = capabilityMap[capability];
  if (!row) fail("Missing capability owner-approval QA row: " + capability);
  for (const key of ["capabilityId", "canonicalStatusOwnerApprovalQaAccepted", "sourceCanonicalizationOwnerApprovalAccepted", "sourceCanonicalizationOwnerReviewAccepted", "sourceCanonicalizationQaAccepted", "sourceCanonicalizationReviewAccepted", "preferredPlanningToolsOwnerApprovalQaAccepted", "conditionalPlanningToolsOwnerApprovalQaAccepted", "fallbackPlanningToolsOwnerApprovalQaAccepted", "eliminatedToolsOwnerApprovalQaAccepted", "currentExecutionAllowed", "blockedRuntimeReasonsOwnerApprovalQaAccepted", "nextProofMilestoneOwnerApprovalQaAccepted"]) {
    if (!(key in row)) fail("Capability " + capability + " missing field: " + key);
  }
  if (row.currentExecutionAllowed !== false) fail("Capability should not allow execution: " + capability);
}
if (Object.keys(capabilityMap).some((key) => /track|atlas|owner/i.test(key))) fail("Internal owner labels leaked into capability IDs.");
const schema = qa.schemaCanonicalizationOwnerApprovalQa?.schema || {};
for (const section of ["requestCapabilityExtraction", "candidateToolRanking", "eliminationResult", "planningOnlyRecommendation", "safetyBoundary"]) {
  if (!Array.isArray(schema[section]) || schema[section].length === 0) fail("Missing schema section: " + section);
}
const ledger = qa.canonicalizationOwnerApprovalQaLedger || {};
if (ledger.sourceOwnerApprovalAccepted !== true || ledger.canonicalizationLedgerOwnerApprovalQaAccepted !== true) fail("Ledger owner-approval QA missing.");
for (const chainPr of ["PR #623", "PR #638", "PR #642", "PR #645", "PR #646", "PR #651", "PR #656", "PR #657", "PR #661", "PR #665"]) {
  if (!ledger.acceptedChain?.includes(chainPr)) fail("Ledger missing accepted chain PR: " + chainPr);
}
const matrix = qa.canonicalizationOwnerApprovalQaMatrix || {};
if ((matrix.tools || []).length !== allTools.length) fail("Owner-approval QA matrix missing all 21 tools.");
if (Object.keys(matrix.capabilities || {}).length !== requiredCapabilities.length) fail("Owner-approval QA matrix missing all 12 capabilities.");
const ranking = qa.rankingPolicyCanonicalizationOwnerApprovalQa || {};
if (ranking.source !== "PR #623 scoring model") fail("Ranking owner-approval QA does not reference PR #623 scoring model.");
for (const [key, value] of Object.entries({ capabilityFit: 25, outputQualityPotential: 20, reliabilityProof: 15, cloudReadiness: 10, costEfficiency: 10, integrationSimplicity: 10, safetyAndControl: 10, totalScore: 100 })) {
  if (ranking.rankingPolicy?.scoringModel?.[key] !== value) fail("Ranking score mismatch: " + key);
}
const eliminationText = (qa.eliminationPolicyCanonicalizationOwnerApprovalQa?.eliminationPolicy?.rules || []).join("\n");
for (const blocker of ["capability mismatch", "proof status", "browser/WebGL/canvas", "GPU runtime or model weights", "public artifact creation or signed URL creation", "Tool Route execution or Worker execution", "provider/model execution", "Supabase, SQL, or GCS mutation", "simpler tool", "deferred, backlog, or blocked"]) {
  if (!eliminationText.includes(blocker)) fail("Missing elimination blocker: " + blocker);
}
const fallback = qa.fallbackPolicyCanonicalizationOwnerApprovalQa?.fallbackPolicy || {};
for (const capability of requiredCapabilities) {
  const row = fallback[capability];
  if (!Array.isArray(row?.preferred) || row.preferred.length === 0) fail("Fallback missing preferred tools: " + capability);
  if (!Array.isArray(row?.conditional)) fail("Fallback missing conditional tools: " + capability);
  if (!Array.isArray(row?.fallback) || row.fallback.length === 0) fail("Fallback missing fallback tools: " + capability);
}
const examples = qa.routingExamplesCanonicalizationOwnerApprovalQa?.routeExamples || {};
for (const capability of requiredCapabilities) {
  if (!examples[capability]) fail("Routing examples missing: " + capability);
  if (examples[capability]?.executionAllowedNow !== false) fail("Routing example should block execution: " + capability);
}
const blocked = qa.blockedUseRegisterCanonicalizationOwnerApprovalQa?.blockedUseRegister || {};
for (const phrase of ["Tool execution remains blocked.", "Tool Route execution remains blocked.", "Worker execution remains blocked.", "Provider/model execution remains blocked.", "Browser/WebGL/canvas runtime remains blocked.", "GPU runtime and model weights remain blocked.", "Signed URL and public artifact creation remain blocked."]) {
  if (!blocked.runtimeBlocks?.includes(phrase)) fail("Blocked-use register missing: " + phrase);
}
const safety = qa.safetyBoundaryCanonicalizationOwnerApprovalQa?.safetyBoundary || {};
if (safety.trackBExclusion?.ownerId !== "TRACK_B_MEDIA_OSS_STEWARD") fail("Track B exclusion missing or wrong.");
if (!String(safety.trackAExclusion?.citedEvidence || "").includes("PR #544")) fail("Track A exclusion missing PR #544.");
for (const key of ["toolExecutionAllowed", "workerExecutionAllowed", "routeExecutionAllowed", "browserWebglCanvasAllowed", "gpuRuntimeAllowed", "modelWeightsAllowed", "providerModelExecutionAllowed", "publicArtifactAllowed", "signedUrlAllowed", "betaOrProductionAllowed"]) {
  if (safety[key] !== false) fail("Safety boundary should be false: " + key);
}
const combinedText = [...requiredDocs, ...requiredJson, ...capabilityDocs, ...sourceDocs, "docs/production-beta-readiness-scorecard.md"].filter(exists).map(read).join("\n");
for (const pr of ["665", "661", "657", "656", "651", "646", "645", "642", "638", "634", "632", "628", "627", "623", "621", "617", "616", "604", "589", "543", "425", "433", "441", "376", "361", "542", "544"]) {
  if (!combinedText.includes("PR #" + pr)) fail("Missing PR citation: PR #" + pr);
}
for (const phrase of ["TRACK_B_MEDIA_OSS_STEWARD", "Track A render/export exclusion", "PR #544"]) {
  if (!combinedText.includes(phrase)) fail("Missing exclusion phrase: " + phrase);
}
if (/product-facing capability categor(y|ies).*Track/i.test(combinedText)) fail("Docs appear to use Track labels as product-facing capability categories.");
for (const pattern of [
  /\"agentCanExecuteToolsNow\"\s*:\s*true/i,
  /\"toolExecutionPerformed\"\s*:\s*true/i,
  /\"routeExecutionApprovedNow\"\s*:\s*true/i,
  /\"workerExecutionApprovedNow\"\s*:\s*true/i,
  /\"runtimeReadyNow\"\s*:\s*true/i,
  /\"internalBetaReadyNow\"\s*:\s*true/i,
  /\"productionReadyNow\"\s*:\s*true/i,
  /\"browserWebglCanvasRuntimePerformed\"\s*:\s*true/i,
  /\"gpuRuntimePerformed\"\s*:\s*true/i,
  /\"providerRuntimePerformed\"\s*:\s*true/i,
  /\"supabaseMutationPerformed\"\s*:\s*true/i,
  /\"gcsUploadPerformed\"\s*:\s*true/i,
  /\"publicArtifactCreated\"\s*:\s*true/i,
  /\"signedUrlCreated\"\s*:\s*true/i,
  /E2E proof approved/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
]) {
  if (pattern.test(combinedText)) fail("Forbidden true claim matched: " + pattern);
}
let packageJson = {}; let basePackageJson = {};
try { packageJson = JSON.parse(read("package.json")); basePackageJson = JSON.parse(git(["show", baseRef + ":package.json"])); }
catch (error) { fail("Unable to read package metadata: " + error.message); }
for (const section of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
  if (JSON.stringify(packageJson[section] || {}) !== JSON.stringify(basePackageJson[section] || {})) fail("Package dependency section changed: " + section);
}
if (packageJson.scripts?.[expectedScript] !== expectedScriptCommand) fail("Expected package script is missing or incorrect.");
const scriptDrift = Object.keys(packageJson.scripts || {}).filter((key) => JSON.stringify(packageJson.scripts[key]) !== JSON.stringify(basePackageJson.scripts?.[key]));
for (const key of scriptDrift) if (key !== expectedScript && !allowedDescendantScripts.has(key)) fail("Unexpected script drift: " + key);
for (const key of Object.keys(basePackageJson.scripts || {})) if (!(key in (packageJson.scripts || {}))) fail("Removed package script: " + key);
try { if (git(["diff", "--name-only", baseRef, "--", "package-lock.json"])) fail("package-lock.json changed relative to base."); }
catch (error) { fail("Unable to verify package-lock diff: " + error.message); }
let tracked = "";
try { tracked = git(["ls-files"]); } catch (error) { fail("Unable to list tracked files: " + error.message); }
for (const file of tracked.split("\n").filter(Boolean)) {
  if (file.includes(".local-artifacts")) fail("Committed .local-artifacts path: " + file);
  if (/(^|\/)(generated-artifacts?|generated-media|media-output|browser-output|canvas-output|webgl-output|public-artifacts?|signed-urls?)(\/|$)/i.test(file)) fail("Committed generated artifact path: " + file);
}
if (failures.length) {
  console.error("AI graphics canonical routing canonicalization owner-approval QA diagnostics failed:");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}
console.log("AI graphics canonical routing canonicalization owner-approval QA diagnostics passed.");
