#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const baseRef = "origin/codex/rp-ai-graphics-canonical-agent-selection-qa-review";
const expectedDecision = "ai_graphics_canonical_agent_selection_owner_review_passed_with_warnings";
const expectedScript = "ai-graphics:canonical-agent-selection:owner-diagnostics";
const expectedScriptCommand = "node scripts/validation/ai-graphics-canonical-agent-selection-owner-diagnostics.mjs";
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
  "ai-graphics:canonical-agent-selection:runtime-boundary-diagnostics",
  "ai-graphics:canonical-agent-selection:canonicalization-owner-approval-qa-diagnostics",
  "ai-graphics:canonical-agent-selection:canonicalization-owner-approval-diagnostics",
  "ai-graphics:canonical-agent-selection:canonicalization-diagnostics",
  "ai-graphics:canonical-agent-selection:canonicalization-qa-diagnostics",
  "ai-graphics:canonical-agent-selection:canonicalization-owner-diagnostics",
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
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-owner-source-lockfile.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-schema-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-capability-map-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-ranking-rules-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-elimination-rules-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-fallback-rules-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-missing-proof-rules-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-safety-boundary-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-planning-only-policy-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-examples-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-blocked-use-register-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-next-lane-owner-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-owner-review-decision.md",
  "docs/prompt-ai-graphics-canonical-agent-selection-owner-review-results.md",
  "docs/implementation-prompts/prompt-ai-graphics-canonical-agent-selection-owner-review.md"
];
const requiredJson = [
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-owner-source-lockfile.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-schema-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-capability-map-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-ranking-rules-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-elimination-rules-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-fallback-rules-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-examples-owner-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-blocked-use-register-owner-review.json"
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
const capabilityDocs = capabilities.map((capability) => "docs/tool-intelligence/ai-graphics/canonical-agent-selection/owner-review/" + capability.replaceAll("_", "-") + ".md");
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
let owner = {};
try { owner = parseJson("docs/tool-intelligence/ai-graphics/canonical-agent-selection-owner-review.json"); } catch (error) { fail("Unable to parse owner JSON: " + error.message); }
if (owner.decision !== expectedDecision) fail("Unexpected decision: " + owner.decision);
const trueBooleans = [
  "canonicalAgentSelectionOwnerReviewCompleted",
  "sourceCanonicalAgentSelectionQaAccepted",
  "sourceCanonicalAgentSelectionReviewAccepted",
  "sourceCanonicalRoutingCanonicalizationAccepted",
  "all21ToolsCoveredByAgentSelectionOwnerReview",
  "allRequiredCapabilitiesCoveredByAgentSelectionOwnerReview",
  "canonicalAgentSelectionSchemaOwnerAccepted",
  "capabilityMapOwnerAccepted",
  "rankingRulesOwnerAccepted",
  "eliminationRulesOwnerAccepted",
  "fallbackRulesOwnerAccepted",
  "missingProofRulesOwnerAccepted",
  "planningOnlyPolicyOwnerAccepted",
  "safetyBoundaryOwnerAccepted",
  "selectionExamplesOwnerAccepted",
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
for (const key of trueBooleans) if (owner.booleans?.[key] !== true) fail("Expected true boolean: " + key);
for (const key of falseBooleans) if (owner.booleans?.[key] !== false) fail("Expected false boolean: " + key);
const toolSet = new Set((owner.tools || []).map((tool) => tool.toolId));
for (const tool of allTools) if (!toolSet.has(tool)) fail("Missing tool: " + tool);
const capMap = owner.capabilities || {};
for (const capability of capabilities) {
  const row = capMap[capability];
  if (!row) fail("Missing capability owner row: " + capability);
  for (const key of ["capabilityId", "sourceSelectionReviewAccepted", "sourceSelectionQaAccepted", "preferredPlanningToolsOwnerAccepted", "conditionalPlanningToolsOwnerAccepted", "fallbackPlanningToolsOwnerAccepted", "eliminatedToolsOwnerAccepted", "missingProofRulesOwnerAccepted", "currentExecutionAllowed", "blockedRuntimeReasonsOwnerAccepted", "nextProofMilestoneOwnerAccepted"]) if (!(key in row)) fail("Capability " + capability + " missing field: " + key);
  if (row.currentExecutionAllowed !== false) fail("Capability should keep current execution false: " + capability);
}
const schema = owner.schemaOwnerReview || {};
for (const section of ["capabilityExtraction", "candidateMapping", "ranking", "elimination", "fallback", "missingProofRequirements", "planningOnlyRecommendation", "safetyBoundary"]) if (!schema.requiredSections?.includes(section)) fail("Missing schema owner section: " + section);
const combinedText = [...requiredDocs, ...requiredJson, ...capabilityDocs, "docs/production-beta-readiness-scorecard.md"].filter(exists).map(read).join("\n");
for (const pr of ["674", "671", "668", "665", "661", "657", "656", "651", "646", "645", "642", "638", "623", "621", "425", "433", "441", "376", "361", "542", "544"]) {
  if (!combinedText.includes("PR #" + pr)) fail("Missing PR citation: PR #" + pr);
}
for (const phrase of ["TRACK_B_MEDIA_OSS_STEWARD", "Track A render/export exclusion", "PR #544"]) if (!combinedText.includes(phrase)) fail("Missing exclusion phrase: " + phrase);
for (const pattern of [
  /"agentCanExecuteToolsNow"\s*:\s*true/i,
  /"routeExecutionApprovedNow"\s*:\s*true/i,
  /"workerExecutionApprovedNow"\s*:\s*true/i,
  /"toolExecutionApprovedNow"\s*:\s*true/i,
  /"runtimeReadyNow"\s*:\s*true/i,
  /"internalBetaReadyNow"\s*:\s*true/i,
  /"productionReadyNow"\s*:\s*true/i,
  /"browserWebglCanvasRuntimePerformed"\s*:\s*true/i,
  /"gpuRuntimePerformed"\s*:\s*true/i,
  /"providerRuntimePerformed"\s*:\s*true/i,
  /"supabaseMutationPerformed"\s*:\s*true/i,
  /"gcsUploadPerformed"\s*:\s*true/i,
  /"publicArtifactCreated"\s*:\s*true/i,
  /"signedUrlCreated"\s*:\s*true/i,
  /E2E proof approved/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
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
if (failures.length) { console.error("AI graphics canonical agent-selection owner diagnostics failed:"); for (const failure of failures) console.error("- " + failure); process.exit(1); }
console.log("AI graphics canonical agent-selection owner diagnostics passed.");
