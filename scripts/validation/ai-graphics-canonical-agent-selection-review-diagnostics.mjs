#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const baseRef = "origin/codex/rp-ai-graphics-tool-capability-study-canonical-agent-routing-canonicalization-owner-approval-qa-review";
const expectedDecision = "ai_graphics_canonical_agent_selection_review_passed_with_warnings";
const expectedScript = "ai-graphics:canonical-agent-selection:review-diagnostics";
const expectedScriptCommand = "node scripts/validation/ai-graphics-canonical-agent-selection-review-diagnostics.mjs";
const allowedDescendantScripts = new Set([
  "ai-graphics:canonical-agent-selection:runtime-boundary-qa-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-owner-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-owner-approval-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-owner-approval-qa-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-canonicalization-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-canonicalization-qa-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-canonicalization-owner-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-canonicalization-owner-approval-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-canonicalization-owner-approval-qa-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-handoff-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-handoff-qa-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-handoff-owner-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-diagnostics",
  "ai-graphics:canonical-agent-selection:canonicalization-owner-approval-qa-diagnostics",
  "ai-graphics:canonical-agent-selection:canonicalization-owner-approval-diagnostics",
  "ai-graphics:canonical-agent-selection:canonicalization-diagnostics",
  "ai-graphics:canonical-agent-selection:canonicalization-qa-diagnostics",
  "ai-graphics:canonical-agent-selection:canonicalization-owner-diagnostics",
  "ai-graphics:canonical-agent-selection:qa-diagnostics",  "ai-graphics:canonical-agent-selection:owner-diagnostics",
  "ai-graphics:canonical-agent-selection:owner-approval-diagnostics",
  "ai-graphics:canonical-agent-selection:owner-approval-qa-diagnostics",

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
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-source-lockfile.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-schema.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-capability-map.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-ranking-rules.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-elimination-rules.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-fallback-rules.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-safety-boundary.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-planning-only-policy.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-examples.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-blocked-use-register.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-next-lane.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-decision.md",
  "docs/prompt-ai-graphics-canonical-agent-selection-review-results.md",
  "docs/implementation-prompts/prompt-ai-graphics-canonical-agent-selection-review.md"
];
const requiredJson = [
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-source-lockfile.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-schema.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-capability-map.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-ranking-rules.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-elimination-rules.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-fallback-rules.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-examples.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-blocked-use-register.json"
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
const capabilityDocs = capabilities.map((capability) => "docs/tool-intelligence/ai-graphics/canonical-agent-selection/" + capability.replaceAll("_", "-") + ".md");
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
for (const file of [...requiredDocs, ...requiredJson, ...capabilityDocs]) if (!exists(file)) fail("Missing required file: " + file);
let review = {};
try { review = parseJson("docs/tool-intelligence/ai-graphics/canonical-agent-selection-review.json"); } catch (error) { fail("Unable to parse review JSON: " + error.message); }
if (review.decision !== expectedDecision) fail("Unexpected decision: " + review.decision);
const trueBooleans = [
  "canonicalAgentSelectionReviewCompleted",
  "sourceCanonicalRoutingCanonicalizationAccepted",
  "all21ToolsCoveredByAgentSelection",
  "allRequiredCapabilitiesCoveredByAgentSelection",
  "canonicalAgentSelectionSchemaCreated",
  "capabilityMapCreated",
  "rankingRulesCreated",
  "eliminationRulesCreated",
  "fallbackRulesCreated",
  "planningOnlyPolicyCreated",
  "safetyBoundaryCreated",
  "selectionExamplesCreated",
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
  "signedUrlCreated"
];
for (const key of trueBooleans) if (review.booleans?.[key] !== true) fail("Expected true boolean: " + key);
for (const key of falseBooleans) if (review.booleans?.[key] !== false) fail("Expected false boolean: " + key);
const toolSet = new Set((review.tools || []).map((tool) => tool.toolId));
for (const tool of allTools) if (!toolSet.has(tool)) fail("Missing tool: " + tool);
const capMap = review.capabilities || {};
for (const capability of capabilities) if (!capMap[capability]) fail("Missing capability: " + capability);
const schema = review.schema || {};
for (const field of [
  "requestId",
  "requestedCapability",
  "inputIntent",
  "inputMediaType",
  "desiredOutputType",
  "visualIntent",
  "candidateTools",
  "rankedTools",
  "eliminatedTools",
  "preferredPlanningTools",
  "fallbackPlanningTools",
  "requiredProofBeforeExecution",
  "executionAllowedNow",
  "routeExecutionAllowedNow",
  "workerExecutionAllowedNow",
  "browserWebglCanvasAllowedNow",
  "gpuModelRuntimeAllowedNow",
  "publicArtifactAllowedNow",
  "signedUrlAllowedNow",
  "runtimeReadyNow",
  "internalBetaReadyNow",
  "productionReadyNow"
]) if (!schema.fields?.includes(field)) fail("Missing schema field: " + field);
for (const section of ["capabilityExtraction", "ranking", "elimination", "fallback", "planningOnlyRecommendation", "safetyBoundary"]) if (!schema.sections?.[section]) fail("Missing schema section: " + section);
const elimination = review.eliminationRules?.rules || [];
for (const phrase of ["capability mismatch", "proof level", "browser/WebGL/canvas", "GPU/model weights", "Tool Route execution", "Worker execution", "provider/model runtime", "public artifact or signed URL", "simpler/lower-cost", "deferred/backlog"]) {
  if (!elimination.some((rule) => rule.includes(phrase))) fail("Missing elimination rule phrase: " + phrase);
}
const fallback = review.fallbackRules?.fallbackByCapability || {};
for (const capability of capabilities) {
  const row = fallback[capability];
  if (!row?.preferredPlanningTools?.length) fail("Missing preferred planning fallback row: " + capability);
  if (!row?.fallbackPlanningTools?.length) fail("Missing fallback planning row: " + capability);
  if (row.executionAllowedNow !== false) fail("Fallback row should keep execution false: " + capability);
}
const examples = review.selectionExamples || {};
for (const capability of capabilities) {
  const row = examples[capability];
  if (!row) fail("Missing example: " + capability);
  for (const key of ["executionAllowedNow", "routeExecutionAllowedNow", "workerExecutionAllowedNow", "browserWebglCanvasAllowedNow", "gpuModelRuntimeAllowedNow", "publicArtifactAllowedNow", "signedUrlAllowedNow", "runtimeReadyNow", "internalBetaReadyNow", "productionReadyNow"]) {
    if (row[key] !== false) fail("Example should keep false " + key + ": " + capability);
  }
}
const safety = review.safetyBoundary || {};
if (safety.trackBExclusion?.ownerId !== "TRACK_B_MEDIA_OSS_STEWARD") fail("Track B exclusion missing.");
if (!String(safety.trackAExclusion?.citedEvidence || "").includes("PR #544")) fail("Track A exclusion missing.");
const combinedText = [...requiredDocs, ...requiredJson, ...capabilityDocs, "docs/production-beta-readiness-scorecard.md"].filter(exists).map(read).join("\n");
for (const pr of ["668", "665", "661", "657", "656", "651", "646", "645", "642", "638", "623", "621", "425", "433", "441", "376", "361", "542", "544"]) {
  if (!combinedText.includes("PR #" + pr)) fail("Missing PR citation: PR #" + pr);
}
for (const phrase of ["TRACK_B_MEDIA_OSS_STEWARD", "Track A render/export exclusion", "PR #544"]) if (!combinedText.includes(phrase)) fail("Missing exclusion phrase: " + phrase);
for (const pattern of [
  /\"agentCanExecuteToolsNow\"\s*:\s*true/i,
  /\"routeExecutionApprovedNow\"\s*:\s*true/i,
  /\"workerExecutionApprovedNow\"\s*:\s*true/i,
  /\"toolExecutionApprovedNow\"\s*:\s*true/i,
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
  /E2E proof approved/i, /dry_run_passed/i, /generated_local_fixture_passed/i,
]) if (pattern.test(combinedText)) fail("Forbidden true claim matched: " + pattern);
let packageJson = {}; let basePackageJson = {};
try { packageJson = JSON.parse(read("package.json")); basePackageJson = JSON.parse(git(["show", baseRef + ":package.json"])); } catch (error) { fail("Unable to read package metadata: " + error.message); }
for (const section of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) if (JSON.stringify(packageJson[section] || {}) !== JSON.stringify(basePackageJson[section] || {})) fail("Package dependency section changed: " + section);
if (packageJson.scripts?.[expectedScript] !== expectedScriptCommand) fail("Expected package script is missing or incorrect.");
const scriptDrift = Object.keys(packageJson.scripts || {}).filter((key) => JSON.stringify(packageJson.scripts[key]) !== JSON.stringify(basePackageJson.scripts?.[key]));
for (const key of scriptDrift) if (key !== expectedScript && !allowedDescendantScripts.has(key)) fail("Unexpected script drift: " + key);
for (const key of Object.keys(basePackageJson.scripts || {})) if (!(key in (packageJson.scripts || {}))) fail("Removed package script: " + key);
try { if (git(["diff", "--name-only", baseRef, "--", "package-lock.json"])) fail("package-lock.json changed relative to base."); } catch (error) { fail("Unable to verify package-lock diff: " + error.message); }
let tracked = "";
try { tracked = git(["ls-files"]); } catch (error) { fail("Unable to list tracked files: " + error.message); }
for (const file of tracked.split("\n").filter(Boolean)) {
  if (file.includes(".local-artifacts")) fail("Committed .local-artifacts path: " + file);
  if (/(^|\/)(generated-artifacts?|generated-media|media-output|browser-output|canvas-output|webgl-output|public-artifacts?|signed-urls?)(\/|$)/i.test(file)) fail("Committed generated artifact path: " + file);
}
if (failures.length) { console.error("AI graphics canonical agent-selection review diagnostics failed:"); for (const failure of failures) console.error("- " + failure); process.exit(1); }
console.log("AI graphics canonical agent-selection review diagnostics passed.");
