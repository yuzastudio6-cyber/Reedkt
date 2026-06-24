#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const baseRef = "origin/codex/rp-ai-graphics-canonical-agent-selection-runtime-boundary-review";
const expectedDecision = "ai_graphics_canonical_agent_selection_runtime_boundary_qa_passed_with_warnings";
const expectedScript = "ai-graphics:canonical-agent-selection:runtime-boundary-qa-diagnostics";
const expectedScriptCommand = "node scripts/validation/ai-graphics-canonical-agent-selection-runtime-boundary-qa-diagnostics.mjs";
const allowedDescendantScripts = new Set([
  "ai-graphics:canonical-agent-selection:runtime-boundary-owner-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-owner-approval-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-owner-approval-qa-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-canonicalization-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-canonicalization-qa-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-canonicalization-owner-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-canonicalization-owner-approval-diagnostics",
  "ai-graphics:canonical-agent-selection:runtime-boundary-canonicalization-owner-approval-qa-diagnostics"
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
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-qa-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-qa-source-lockfile.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-qa-ledger.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-qa-matrix.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-qa-tool-map.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-qa-capability-map.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-qa-runtime-buckets.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-qa-planning-only-policy.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-qa-blocked-use-register.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-qa-next-lane.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-qa-decision.md",
  "docs/prompt-ai-graphics-canonical-agent-selection-runtime-boundary-qa-review-results.md",
  "docs/implementation-prompts/prompt-ai-graphics-canonical-agent-selection-runtime-boundary-qa-review.md"
];
const requiredJson = [
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-qa-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-qa-source-lockfile.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-qa-ledger.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-qa-matrix.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-qa-tool-map.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-qa-capability-map.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-qa-runtime-buckets.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-qa-planning-only-policy.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-qa-blocked-use-register.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-qa-next-lane.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-qa-decision.json"
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
const capabilityDocs = capabilities.map((capability) => "docs/tool-intelligence/ai-graphics/canonical-agent-selection/runtime-boundary-qa/" + capability.replaceAll("_", "-") + ".md");
for (const file of [...requiredDocs, ...requiredJson, ...capabilityDocs]) if (!exists(file)) fail("Missing required file: " + file);

let qa = {}; let matrix = {}; let toolMap = {}; let capabilityMap = {}; let bucketMap = {}; let blocked = {};
try { qa = parseJson("docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-qa-review.json"); } catch (error) { fail("Unable to parse QA JSON: " + error.message); }
try { matrix = parseJson("docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-qa-matrix.json"); } catch (error) { fail("Unable to parse matrix JSON: " + error.message); }
try { toolMap = parseJson("docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-qa-tool-map.json"); } catch (error) { fail("Unable to parse tool map JSON: " + error.message); }
try { capabilityMap = parseJson("docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-qa-capability-map.json"); } catch (error) { fail("Unable to parse capability map JSON: " + error.message); }
try { bucketMap = parseJson("docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-qa-runtime-buckets.json"); } catch (error) { fail("Unable to parse bucket JSON: " + error.message); }
try { blocked = parseJson("docs/tool-intelligence/ai-graphics/canonical-agent-selection-runtime-boundary-qa-blocked-use-register.json"); } catch (error) { fail("Unable to parse blocked-use JSON: " + error.message); }
if (qa.decision !== expectedDecision) fail("Unexpected decision: " + qa.decision);
const trueBooleans = [
  "canonicalAgentSelectionRuntimeBoundaryQaCompleted",
  "sourceCanonicalAgentSelectionRuntimeBoundaryReviewAccepted",
  "sourceCanonicalAgentSelectionCanonicalizationOwnerApprovalQaAccepted",
  "all21ToolsCoveredByRuntimeBoundaryQa",
  "allRequiredCapabilitiesCoveredByRuntimeBoundaryQa",
  "runtimeBoundaryLedgerQaAccepted",
  "runtimeBoundaryMatrixQaAccepted",
  "runtimeBoundaryToolMapQaAccepted",
  "runtimeBoundaryCapabilityMapQaAccepted",
  "runtimeBoundaryBucketsQaAccepted",
  "planningOnlyPolicyQaAccepted",
  "blockedUseRegisterQaAccepted",
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
for (const key of trueBooleans) if (qa.booleans?.[key] !== true) fail("Required true boolean missing: " + key);
for (const key of falseBooleans) if (qa.booleans?.[key] !== false) fail("Required false boolean missing: " + key);
for (const acceptance of ["sourceRuntimeBoundaryQa", "runtimeBoundaryLedgerQa", "runtimeBoundaryMatrixQa", "runtimeBoundaryToolMapQa", "runtimeBoundaryCapabilityMapQa", "runtimeBoundaryBucketsQa", "planningOnlyPolicyQa", "blockedUseRegisterQa"]) {
  if (qa[acceptance]?.accepted !== true) fail("Missing QA acceptance: " + acceptance);
}
const actualTools = new Set((toolMap.tools || qa.tools || []).map((tool) => tool.toolId));
for (const tool of allTools) if (!actualTools.has(tool)) fail("Missing QA tool: " + tool);
if (actualTools.size !== allTools.length) fail("Unexpected QA tool count: " + actualTools.size);
const actualCapabilities = new Set((capabilityMap.capabilities || qa.capabilities || []).map((capability) => capability.capabilityId));
for (const capability of capabilities) if (!actualCapabilities.has(capability)) fail("Missing QA capability: " + capability);
if (actualCapabilities.size !== capabilities.length) fail("Unexpected QA capability count: " + actualCapabilities.size);
const actualBuckets = new Set(Object.keys(bucketMap.runtimeBuckets || qa.runtimeBuckets || matrix.runtimeBuckets || {}));
for (const bucket of buckets) if (!actualBuckets.has(bucket)) fail("Missing QA runtime bucket: " + bucket);
const corpus = [...requiredDocs.filter(exists).map(read), ...requiredJson.filter(exists).map(read), ...capabilityDocs.filter(exists).map(read)].join("\n");
for (const pr of [694,692,689,688,686,685,683,681,677,674,671,668,665,661,657,656,651,646,645,642,638,623,621,425,433,441,376,361,542,544]) {
  if (!corpus.includes("#" + pr) && !JSON.stringify(qa.sourcePrs || {}).includes('"' + pr + '"')) fail("Missing PR citation: #" + pr);
}
for (const token of ["TRACK_B_MEDIA_OSS_STEWARD", "Track A render/export exclusion", "PR #544"]) if (!corpus.includes(token)) fail("Missing exclusion token: " + token);
for (const forbidden of [
  /agentCanExecuteToolsNow:\s*true/i,
  /routeExecutionApprovedNow:\s*true/i,
  /workerExecutionApprovedNow:\s*true/i,
  /toolExecutionApprovedNow:\s*true/i,
  /runtimeReadyNow:\s*true/i,
  /internalBetaReadyNow:\s*true/i,
  /externalBetaReadyNow:\s*true/i,
  /productionReadyNow:\s*true/i,
  /browserWebglCanvasRuntimeApprovedNow:\s*true/i,
  /gpuRuntimeApprovedNow:\s*true/i,
  /providerRuntimeApprovedNow:\s*true/i,
  /publicArtifactApprovedNow:\s*true/i,
  /signedUrlApprovedNow:\s*true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
  /E2E proof approved/i,
]) if (forbidden.test(corpus)) fail("Forbidden runtime/execution claim matched: " + forbidden);
if (!corpus.includes("planning/study metadata")) fail("Planning/study metadata allowance not documented.");
let packageJson = {}; let basePackageJson = {};
try { packageJson = JSON.parse(read("package.json")); basePackageJson = JSON.parse(git(["show", baseRef + ":package.json"])); } catch (error) { fail("Unable to read package metadata: " + error.message); }
for (const section of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
  if (JSON.stringify(packageJson[section] || {}) !== JSON.stringify(basePackageJson[section] || {})) fail("Package dependency section changed: " + section);
}
if (packageJson.scripts?.[expectedScript] !== expectedScriptCommand) fail("Expected package script is missing or incorrect.");
const scriptDrift = Object.keys(packageJson.scripts || {}).filter((key) => JSON.stringify(packageJson.scripts[key]) !== JSON.stringify(basePackageJson.scripts?.[key]));
for (const key of scriptDrift) {
  if (key !== expectedScript && !allowedDescendantScripts.has(key)) fail("Unexpected script drift: " + key);
}
for (const key of Object.keys(basePackageJson.scripts || {})) if (!(key in (packageJson.scripts || {}))) fail("Removed package script: " + key);
try { if (git(["diff", "--name-only", baseRef, "--", "package-lock.json"])) fail("package-lock.json changed relative to base."); } catch (error) { fail("Unable to verify package-lock diff: " + error.message); }
let tracked = "";
try { tracked = git(["ls-files"]); } catch (error) { fail("Unable to list tracked files: " + error.message); }
for (const file of tracked.split("\n").filter(Boolean)) {
  if (file.includes(".local-artifacts")) fail("Committed .local-artifacts path: " + file);
  if (/(^|\/)(generated-artifacts?|generated-media|media-output|browser-output|canvas-output|webgl-output|public-artifacts?|signed-urls?)(\/|$)/i.test(file)) fail("Committed generated artifact path: " + file);
}
if (failures.length) {
  console.error("AI graphics canonical agent-selection runtime-boundary QA diagnostics failed:");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}
console.log("AI graphics canonical agent-selection runtime-boundary QA diagnostics passed.");
