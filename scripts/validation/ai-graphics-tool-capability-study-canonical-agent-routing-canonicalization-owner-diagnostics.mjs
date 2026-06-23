#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const baseRef =
  "origin/codex/rp-ai-graphics-tool-capability-study-canonical-agent-routing-canonicalization-qa-review";
const expectedDecision =
  "ai_graphics_tool_capability_study_canonical_agent_routing_canonicalization_owner_review_passed_with_warnings";
const expectedScript =
  "ai-graphics:tool-capability-study:canonical-routing-canonicalization-owner-diagnostics";
const expectedScriptCommand =
  "node scripts/validation/ai-graphics-tool-capability-study-canonical-agent-routing-canonicalization-owner-diagnostics.mjs";
const allowedDescendantScripts = new Set([
  "ai-graphics:canonical-agent-selection:owner-approval-qa-diagnostics",
  "ai-graphics:canonical-agent-selection:qa-diagnostics",
  "ai-graphics:canonical-agent-selection:review-diagnostics",
  "ai-graphics:tool-capability-study:canonical-routing-canonicalization-owner-approval-qa-diagnostics",
  "ai-graphics:tool-capability-study:canonical-routing-canonicalization-owner-approval-diagnostics",  "ai-graphics:canonical-agent-selection:owner-diagnostics",
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
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-owner-source-lockfile.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-owner-ledger.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-owner-matrix.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-schema-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-capability-map-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-ranking-policy-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-elimination-policy-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-fallback-policy-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-safety-boundary-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-planning-only-policy-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-examples-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-blocked-use-register-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-next-lane-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-owner-review-decision.md",
  "docs/prompt-ai-graphics-tool-capability-study-canonical-agent-routing-canonicalization-owner-review-results.md",
  "docs/implementation-prompts/prompt-ai-graphics-tool-capability-study-canonical-agent-routing-canonicalization-owner-review.md",
];
const requiredJson = [
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-owner-source-lockfile.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-owner-ledger.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-owner-matrix.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-schema-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-capability-map-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-ranking-policy-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-elimination-policy-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-fallback-policy-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-examples-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-blocked-use-register-owner-review.json",
];
const optionalJson = [
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-safety-boundary-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-planning-only-policy-owner-review.json",
];
const capabilitySlugs = [
  "chart-overlay", "data-visualization", "svg-graphics", "diagram-graphics", "animation-overlay", "canvas-scene", "webgl-3d-scene", "background-removal", "subject-segmentation", "upscaling", "tensor-image-ops", "model-runtime-foundation",
];
const capabilityDocs = capabilitySlugs.map((name) => `docs/tool-intelligence/ai-graphics/canonical-routing/canonicalization-owner-review/${name}.md`);
const sourceDocs = [
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-qa-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-qa-ledger.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-qa-matrix.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-schema-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-capability-map-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-ranking-policy-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-elimination-policy-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-fallback-policy-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-safety-boundary-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-planning-only-policy-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-examples-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-blocked-use-register-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-owner-approval-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-owner-approval.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-qa-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-routing-approval.json",
];
const allTools = [
  "torch_torchvision", "transformers", "sam2", "birefnet", "real_esrgan", "kornia", "rembg", "transparent_background", "d3", "echarts", "vega_lite", "vega", "satori", "svgdotjs_svg_js", "viz_js", "lottie_web", "animejs", "three_js", "pixi_js", "konva", "babylonjs",
];
const requiredCapabilities = [
  "chart_overlay", "data_visualization", "svg_graphics", "diagram_graphics", "animation_overlay", "canvas_scene", "webgl_3d_scene", "background_removal", "subject_segmentation", "upscaling", "tensor_image_ops", "model_runtime_foundation",
];

for (const file of [...requiredDocs, ...requiredJson, ...optionalJson, ...capabilityDocs, ...sourceDocs]) {
  if (!exists(file)) fail(`Missing required file: ${file}`);
}

let owner = {};
try { owner = parseJson("docs/tool-intelligence/ai-graphics/canonical-agent-routing-canonicalization-owner-review.json"); }
catch (error) { fail(`Unable to parse canonicalization owner JSON: ${error.message}`); }
if (owner.decision !== expectedDecision) fail(`Unexpected decision: ${owner.decision}`);

const trueBooleans = [
  "canonicalAgentRoutingCanonicalizationOwnerReviewCompleted",
  "sourceCanonicalizationQaAccepted",
  "sourceCanonicalizationReviewAccepted",
  "sourceCanonicalRoutingOwnerApprovalQaAccepted",
  "sourceCanonicalRoutingOwnerApprovalAccepted",
  "sourceCanonicalRoutingOwnerReviewAccepted",
  "sourceCanonicalRoutingQaAccepted",
  "sourceCanonicalRoutingApprovalAccepted",
  "all21ToolsCoveredByCanonicalRoutingOwnerReview",
  "allRequiredCapabilitiesCanonicalizedOwnerReview",
  "canonicalizationLedgerOwnerAccepted",
  "canonicalizationMatrixOwnerAccepted",
  "canonicalRoutingSchemaCanonicalizationOwnerAccepted",
  "capabilityMapCanonicalizationOwnerAccepted",
  "rankingPolicyCanonicalizationOwnerAccepted",
  "eliminationPolicyCanonicalizationOwnerAccepted",
  "fallbackPolicyCanonicalizationOwnerAccepted",
  "planningOnlyPolicyCanonicalizationOwnerAccepted",
  "safetyBoundaryCanonicalizationOwnerAccepted",
  "routingExamplesCanonicalizationOwnerAccepted",
  "agentCanSelectForPlanning",
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
];
for (const key of trueBooleans) if (owner.booleans?.[key] !== true) fail(`Expected true boolean: ${key}`);
for (const key of falseBooleans) if (owner.booleans?.[key] !== false) fail(`Expected false boolean: ${key}`);

const tools = new Set((owner.tools || []).map((row) => row.toolId));
for (const tool of allTools) if (!tools.has(tool)) fail(`Missing owner tool row: ${tool}`);
for (const row of owner.tools || []) {
  if (row.agentCanSelectForPlanning !== true) fail(`Tool not selectable for planning: ${row.toolId}`);
  if (row.agentCanExecuteNow !== false) fail(`Tool incorrectly executable: ${row.toolId}`);
  if (row.routeExecutionApprovedNow !== false || row.workerExecutionApprovedNow !== false || row.toolExecutionApprovedNow !== false || row.runtimeReadyNow !== false || row.internalBetaReadyNow !== false || row.productionReadyNow !== false) fail(`Execution/runtime flag mismatch: ${row.toolId}`);
}
const capabilityMap = owner.capabilityCanonicalizationOwnerReview || {};
for (const capability of requiredCapabilities) {
  const row = capabilityMap[capability];
  if (!row) fail(`Missing capability owner row: ${capability}`);
  for (const key of ["capabilityId", "canonicalStatusOwnerAccepted", "sourceCanonicalizationReviewAccepted", "sourceCanonicalizationQaAccepted", "sourceOwnerApprovalQaAccepted", "sourceOwnerApprovalAccepted", "sourceOwnerReviewAccepted", "sourceQaAccepted", "sourceApprovalAccepted", "preferredPlanningToolsOwnerAccepted", "conditionalPlanningToolsOwnerAccepted", "fallbackPlanningToolsOwnerAccepted", "eliminatedToolsOwnerAccepted", "currentExecutionAllowed", "blockedRuntimeReasonsOwnerAccepted", "nextProofMilestoneOwnerAccepted"]) {
    if (!(key in row)) fail(`Capability ${capability} missing field: ${key}`);
  }
  if (row.currentExecutionAllowed !== false) fail(`Capability should not allow execution: ${capability}`);
  for (const key of ["preferredPlanningToolsOwnerAccepted", "conditionalPlanningToolsOwnerAccepted", "fallbackPlanningToolsOwnerAccepted", "eliminatedToolsOwnerAccepted", "blockedRuntimeReasonsOwnerAccepted"]) {
    if (!Array.isArray(row[key])) fail(`Capability ${capability} ${key} should be an array`);
  }
}
if (Object.keys(capabilityMap).some((key) => /track|atlas|owner/i.test(key))) fail("Internal owner labels leaked into capability IDs.");

const schema = owner.schemaCanonicalizationOwnerReview?.schema || {};
for (const section of ["requestCapabilityExtraction", "candidateToolRanking", "eliminationResult", "planningOnlyRecommendation", "safetyBoundary"]) {
  if (!Array.isArray(schema[section]) || schema[section].length === 0) fail(`Missing schema owner section: ${section}`);
}
const ledger = owner.canonicalizationOwnerLedger || {};
if (ledger.sourceCanonicalizationQaAccepted !== true || ledger.canonicalizationLedgerOwnerAccepted !== true) fail("Ledger owner acceptance missing.");
for (const chainPr of ["PR #623", "PR #638", "PR #642", "PR #645", "PR #646", "PR #651", "PR #656", "PR #657"]) {
  if (!ledger.acceptedChain?.includes(chainPr)) fail(`Ledger owner missing accepted chain PR: ${chainPr}`);
}
const matrix = owner.canonicalizationOwnerMatrix || {};
if ((matrix.tools || []).length !== allTools.length) fail("Canonicalization owner matrix missing tool coverage.");
if (Object.keys(matrix.capabilities || {}).length !== requiredCapabilities.length) fail("Canonicalization owner matrix missing capability coverage.");
const ranking = owner.rankingPolicyCanonicalizationOwnerReview || {};
if (ranking.source !== "PR #623 scoring model") fail("Ranking owner review does not reference PR #623 scoring model.");
for (const [key, value] of Object.entries({ capabilityFit: 25, outputQualityPotential: 20, reliabilityProof: 15, cloudReadiness: 10, costEfficiency: 10, integrationSimplicity: 10, safetyAndControl: 10, totalScore: 100 })) {
  if (ranking.rankingPolicy?.scoringModel?.[key] !== value) fail(`Ranking score mismatch: ${key}`);
}
const eliminationText = (owner.eliminationPolicyCanonicalizationOwnerReview?.eliminationPolicy?.rules || []).join("\n");
for (const blocker of ["capability mismatch", "proof status", "browser/WebGL/canvas", "GPU runtime or model weights", "public artifact creation or signed URL creation", "Tool Route execution or Worker execution", "provider/model execution", "Supabase, SQL, or GCS mutation", "simpler tool", "deferred, backlog, or blocked"]) {
  if (!eliminationText.includes(blocker)) fail(`Missing elimination blocker: ${blocker}`);
}
const fallback = owner.fallbackPolicyCanonicalizationOwnerReview?.fallbackPolicy || {};
for (const capability of requiredCapabilities) {
  const row = fallback[capability];
  if (!Array.isArray(row?.preferred) || row.preferred.length === 0) fail(`Fallback missing preferred tools: ${capability}`);
  if (!Array.isArray(row?.conditional)) fail(`Fallback missing conditional tools: ${capability}`);
  if (!Array.isArray(row?.fallback) || row.fallback.length === 0) fail(`Fallback missing fallback tools: ${capability}`);
}
const examples = owner.routingExamplesCanonicalizationOwnerReview?.routeExamples || {};
for (const capability of ["chart_overlay", "svg_graphics", "diagram_graphics", "animation_overlay", "canvas_scene", "webgl_3d_scene", "background_removal", "subject_segmentation", "upscaling", "tensor_image_ops", "model_runtime_foundation"]) {
  if (!examples[capability]) fail(`Routing examples owner missing: ${capability}`);
  if (examples[capability]?.executionAllowedNow !== false) fail(`Routing example should block execution: ${capability}`);
}
const blocked = owner.blockedUseRegisterCanonicalizationOwnerReview?.blockedUseRegister || {};
for (const phrase of ["Tool execution remains blocked.", "Tool Route execution remains blocked.", "Worker execution remains blocked.", "Browser/WebGL/canvas runtime remains blocked.", "GPU runtime and model weights remain blocked.", "Signed URL and public artifact creation remain blocked."]) {
  if (!blocked.runtimeBlocks?.includes(phrase)) fail(`Blocked-use owner missing: ${phrase}`);
}
const safety = owner.safetyBoundaryCanonicalizationOwnerReview?.safetyBoundary || {};
if (safety.trackBExclusion?.ownerId !== "TRACK_B_MEDIA_OSS_STEWARD") fail("Track B exclusion missing or wrong.");
if (!String(safety.trackAExclusion?.citedEvidence || "").includes("PR #544")) fail("Track A exclusion missing PR #544.");
for (const key of ["toolExecutionAllowed", "workerExecutionAllowed", "routeExecutionAllowed", "browserWebglCanvasAllowed", "gpuRuntimeAllowed", "modelWeightsAllowed", "publicArtifactAllowed", "signedUrlAllowed", "betaOrProductionAllowed"]) {
  if (safety[key] !== false) fail(`Safety boundary should be false: ${key}`);
}
const combinedText = [...requiredDocs, ...requiredJson, ...optionalJson, ...capabilityDocs, ...sourceDocs, "docs/production-beta-readiness-scorecard.md"].filter(exists).map(read).join("\n");
for (const pr of ["657", "656", "651", "646", "645", "642", "638", "634", "632", "628", "627", "623", "621", "617", "616", "614", "607", "604", "589", "543", "425", "433", "441", "376", "361", "542", "544"]) {
  if (!combinedText.includes(`PR #${pr}`)) fail(`Missing PR citation: PR #${pr}`);
}
for (const forbidden of ["dry_run_passed", "generated_local_fixture_passed"]) if (combinedText.includes(forbidden)) fail(`Forbidden generic claim: ${forbidden}`);
for (const pattern of [
  /agentCanExecuteToolsNow[`"]?\s*[:=]\s*true/i, /toolExecutionPerformed[`"]?\s*[:=]\s*true/i, /toolExecutionApprovedNow[`"]?\s*[:=]\s*true/i, /routeExecutionPerformed[`"]?\s*[:=]\s*true/i, /routeExecutionApprovedNow[`"]?\s*[:=]\s*true/i, /workerExecutionPerformed[`"]?\s*[:=]\s*true/i, /workerExecutionApprovedNow[`"]?\s*[:=]\s*true/i, /providerRuntimePerformed[`"]?\s*[:=]\s*true/i, /providerRuntimeApprovedNow[`"]?\s*[:=]\s*true/i, /browserWebglCanvasRuntimePerformed[`"]?\s*[:=]\s*true/i, /browserWebglCanvasRuntimeApprovedNow[`"]?\s*[:=]\s*true/i, /gpuRuntimePerformed[`"]?\s*[:=]\s*true/i, /gpuRuntimeApprovedNow[`"]?\s*[:=]\s*true/i, /runtimeReadyNow[`"]?\s*[:=]\s*true/i, /internalBetaReadyNow[`"]?\s*[:=]\s*true/i, /externalBetaReadyNow[`"]?\s*[:=]\s*true/i, /productionReadyNow[`"]?\s*[:=]\s*true/i, /supabaseMutationPerformed[`"]?\s*[:=]\s*true/i, /gcsUploadPerformed[`"]?\s*[:=]\s*true/i, /publicArtifactCreated[`"]?\s*[:=]\s*true/i, /signedUrlCreated[`"]?\s*[:=]\s*true/i,
]) if (pattern.test(combinedText)) fail(`Forbidden true claim matched: ${pattern}`);
if (/product-facing capability categor(y|ies).*Track/i.test(combinedText)) fail("Docs appear to use Track labels as product-facing capability categories.");
let packageJson = {}; let basePackageJson = {};
try { packageJson = JSON.parse(read("package.json")); basePackageJson = JSON.parse(git(["show", `${baseRef}:package.json`])); }
catch (error) { fail(`Unable to read package metadata: ${error.message}`); }
for (const section of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
  if (JSON.stringify(packageJson[section] || {}) !== JSON.stringify(basePackageJson[section] || {})) fail(`Package dependency section changed: ${section}`);
}
if (packageJson.scripts?.[expectedScript] !== expectedScriptCommand) fail("Expected package script is missing or incorrect.");
const scriptDrift = Object.keys(packageJson.scripts || {}).filter((key) => JSON.stringify(packageJson.scripts[key]) !== JSON.stringify(basePackageJson.scripts?.[key]));
for (const key of scriptDrift) {
  if (key !== expectedScript && !allowedDescendantScripts.has(key)) fail(`Unexpected script drift: ${key}`);
}
for (const key of Object.keys(basePackageJson.scripts || {})) if (!(key in (packageJson.scripts || {}))) fail(`Removed package script: ${key}`);
try { if (git(["diff", "--name-only", baseRef, "--", "package-lock.json"])) fail("package-lock.json changed relative to base."); }
catch (error) { fail(`Unable to verify package-lock diff: ${error.message}`); }
let tracked = "";
try { tracked = git(["ls-files"]); } catch (error) { fail(`Unable to list tracked files: ${error.message}`); }
if (tracked.split("\n").some((file) => file.includes(".local-artifacts"))) fail("Tracked .local-artifacts path found.");
let changed = "";
try { changed = git(["diff", "--name-only", baseRef]); } catch (error) { fail(`Unable to list changed files: ${error.message}`); }
const generatedOutputPattern = /(^|\/)(\.local-artifacts|artifacts|renders?|exports?|public)(\/|$)|\.(png|jpe?g|gif|webp|mp4|mov|webm|mkv|avi|wav|mp3|flac)$/i;
for (const file of changed.split("\n").filter(Boolean)) if (generatedOutputPattern.test(file) && !file.startsWith("docs/")) fail(`Generated output-like path changed: ${file}`);
if (failures.length > 0) {
  console.error("AI graphics canonical routing canonicalization owner diagnostics failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("AI graphics canonical routing canonicalization owner diagnostics passed.");
