#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const baseRef = "origin/codex/rp-ai-graphics-canonical-agent-selection-review";
const expectedDecision = "ai_graphics_canonical_agent_selection_qa_passed_with_warnings";
const expectedScript = "ai-graphics:canonical-agent-selection:qa-diagnostics";
const expectedScriptCommand = "node scripts/validation/ai-graphics-canonical-agent-selection-qa-diagnostics.mjs";
const allowedDescendantScripts = new Set([
  "ai-graphics:canonical-agent-selection:canonicalization-owner-approval-diagnostics",
  "ai-graphics:canonical-agent-selection:canonicalization-diagnostics",
  "ai-graphics:canonical-agent-selection:canonicalization-qa-diagnostics",
  "ai-graphics:canonical-agent-selection:canonicalization-owner-diagnostics",
  "ai-graphics:canonical-agent-selection:owner-diagnostics",  "ai-graphics:canonical-agent-selection:owner-approval-diagnostics",
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
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-qa-review.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-qa-source-lockfile.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-schema-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-capability-map-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-ranking-rules-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-elimination-rules-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-fallback-rules-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-missing-proof-rules-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-safety-boundary-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-planning-only-policy-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-examples-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-blocked-use-register-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-next-lane-qa.md",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-qa-decision.md",
  "docs/prompt-ai-graphics-canonical-agent-selection-qa-review-results.md",
  "docs/implementation-prompts/prompt-ai-graphics-canonical-agent-selection-qa-review.md"
];
const requiredJson = [
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-qa-review.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-qa-source-lockfile.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-schema-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-capability-map-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-ranking-rules-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-elimination-rules-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-fallback-rules-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-examples-qa.json",
  "docs/tool-intelligence/ai-graphics/canonical-agent-selection-blocked-use-register-qa.json"
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
const capabilityDocs = capabilities.map((capability) => "docs/tool-intelligence/ai-graphics/canonical-agent-selection/qa/" + capability.replaceAll("_", "-") + ".md");
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
let qa = {};
try { qa = parseJson("docs/tool-intelligence/ai-graphics/canonical-agent-selection-qa-review.json"); } catch (error) { fail("Unable to parse QA JSON: " + error.message); }
if (qa.decision !== expectedDecision) fail("Unexpected decision: " + qa.decision);
const trueBooleans = [
  "canonicalAgentSelectionQaCompleted",
  "sourceCanonicalAgentSelectionReviewAccepted",
  "sourceCanonicalRoutingCanonicalizationAccepted",
  "all21ToolsCoveredByAgentSelectionQa",
  "allRequiredCapabilitiesCoveredByAgentSelectionQa",
  "canonicalAgentSelectionSchemaQaAccepted",
  "capabilityMapQaAccepted",
  "rankingRulesQaAccepted",
  "eliminationRulesQaAccepted",
  "fallbackRulesQaAccepted",
  "missingProofRulesQaAccepted",
  "planningOnlyPolicyQaAccepted",
  "safetyBoundaryQaAccepted",
  "selectionExamplesQaAccepted",
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
const toolSet = new Set((qa.tools || []).map((tool) => tool.toolId));
for (const tool of allTools) if (!toolSet.has(tool)) fail("Missing tool: " + tool);
const capMap = qa.capabilities || {};
for (const capability of capabilities) {
  const row = capMap[capability];
  if (!row) fail("Missing capability QA row: " + capability);
  for (const key of ["capabilityId", "sourceSelectionReviewAccepted", "preferredPlanningToolsQaAccepted", "conditionalPlanningToolsQaAccepted", "fallbackPlanningToolsQaAccepted", "eliminatedToolsQaAccepted", "missingProofRulesQaAccepted", "currentExecutionAllowed", "blockedRuntimeReasonsQaAccepted", "nextProofMilestoneQaAccepted"]) if (!(key in row)) fail("Capability " + capability + " missing field: " + key);
  if (row.currentExecutionAllowed !== false) fail("Capability should keep current execution false: " + capability);
}
const schema = qa.schemaQa || {};
for (const section of ["capabilityExtraction", "candidateMapping", "ranking", "elimination", "fallback", "missingProofRequirements", "planningOnlyRecommendation", "safetyBoundary"]) if (!schema.requiredSections?.includes(section)) fail("Missing schema QA section: " + section);
const expected = {
  "chart_overlay": {
    "preferred": [
      "vega_lite",
      "d3"
    ],
    "conditional": [
      "echarts"
    ],
    "fallback": [
      "vega"
    ],
    "eliminated": [
      "three_js",
      "sam2",
      "real_esrgan"
    ],
    "proof": [
      "browser chart runtime approval for echarts",
      "approved render/export lane before visual output"
    ]
  },
  "data_visualization": {
    "preferred": [
      "vega_lite",
      "vega",
      "d3"
    ],
    "conditional": [
      "echarts"
    ],
    "fallback": [
      "d3"
    ],
    "eliminated": [
      "sam2",
      "real_esrgan"
    ],
    "proof": [
      "runtime approval for browser chart execution",
      "artifact approval before output"
    ]
  },
  "svg_graphics": {
    "preferred": [
      "svgdotjs_svg_js",
      "satori"
    ],
    "conditional": [
      "d3"
    ],
    "fallback": [
      "d3"
    ],
    "eliminated": [
      "sam2",
      "real_esrgan"
    ],
    "proof": [
      "static SVG output contract approval",
      "public artifact boundary approval"
    ]
  },
  "diagram_graphics": {
    "preferred": [
      "viz_js"
    ],
    "conditional": [
      "svgdotjs_svg_js"
    ],
    "fallback": [
      "svgdotjs_svg_js"
    ],
    "eliminated": [
      "vega_lite"
    ],
    "proof": [
      "diagram output contract approval",
      "artifact boundary approval"
    ]
  },
  "animation_overlay": {
    "preferred": [
      "lottie_web",
      "animejs"
    ],
    "conditional": [],
    "fallback": [
      "animejs"
    ],
    "eliminated": [
      "real_esrgan",
      "sam2"
    ],
    "proof": [
      "animation manifest/runtime approval"
    ]
  },
  "canvas_scene": {
    "preferred": [
      "pixi_js",
      "konva"
    ],
    "conditional": [],
    "fallback": [
      "konva"
    ],
    "eliminated": [
      "sam2",
      "real_esrgan"
    ],
    "proof": [
      "browser/canvas sandbox approval"
    ]
  },
  "webgl_3d_scene": {
    "preferred": [
      "three_js",
      "babylonjs"
    ],
    "conditional": [],
    "fallback": [
      "babylonjs"
    ],
    "eliminated": [
      "vega_lite",
      "sam2"
    ],
    "proof": [
      "browser/WebGL sandbox approval"
    ]
  },
  "background_removal": {
    "preferred": [
      "sam2",
      "birefnet"
    ],
    "conditional": [
      "rembg",
      "transparent_background"
    ],
    "fallback": [
      "rembg",
      "transparent_background"
    ],
    "eliminated": [
      "vega_lite",
      "d3"
    ],
    "proof": [
      "model/import/provenance proof",
      "model boundary approval"
    ]
  },
  "subject_segmentation": {
    "preferred": [
      "sam2",
      "birefnet"
    ],
    "conditional": [],
    "fallback": [
      "birefnet"
    ],
    "eliminated": [
      "vega_lite",
      "real_esrgan"
    ],
    "proof": [
      "model/import/provenance proof",
      "model boundary approval"
    ]
  },
  "upscaling": {
    "preferred": [
      "real_esrgan"
    ],
    "conditional": [],
    "fallback": [
      "real_esrgan"
    ],
    "eliminated": [
      "vega_lite",
      "d3"
    ],
    "proof": [
      "model/GPU/provenance proof",
      "model boundary approval"
    ]
  },
  "tensor_image_ops": {
    "preferred": [
      "kornia"
    ],
    "conditional": [],
    "fallback": [
      "kornia"
    ],
    "eliminated": [
      "echarts",
      "lottie_web"
    ],
    "proof": [
      "CPU import proof",
      "operation boundary approval"
    ]
  },
  "model_runtime_foundation": {
    "preferred": [
      "torch_torchvision",
      "transformers"
    ],
    "conditional": [],
    "fallback": [
      "transformers"
    ],
    "eliminated": [
      "vega_lite",
      "d3"
    ],
    "proof": [
      "CPU/GPU/model-boundary proof",
      "model provenance approval"
    ]
  }
};
for (const [capability, behavior] of Object.entries(expected)) {
  const row = capMap[capability] || {};
  for (const tool of behavior.preferred) if (!row.preferredPlanningToolsQaAccepted?.includes(tool)) fail("Missing preferred tool " + tool + " for " + capability);
  for (const tool of behavior.conditional) if (!row.conditionalPlanningToolsQaAccepted?.includes(tool)) fail("Missing conditional tool " + tool + " for " + capability);
  for (const tool of behavior.fallback) if (!row.fallbackPlanningToolsQaAccepted?.includes(tool)) fail("Missing fallback tool " + tool + " for " + capability);
  for (const tool of behavior.eliminated) if (!row.eliminatedToolsQaAccepted?.includes(tool)) fail("Missing eliminated tool " + tool + " for " + capability);
  for (const proof of behavior.proof) if (!row.missingProofRulesQaAccepted?.includes(proof)) fail("Missing proof rule " + proof + " for " + capability);
}
const combinedText = [...requiredDocs, ...requiredJson, ...capabilityDocs, "docs/production-beta-readiness-scorecard.md"].filter(exists).map(read).join("\n");
for (const pr of ["671", "668", "665", "661", "657", "656", "651", "646", "642", "638", "623", "376", "361", "542", "544"]) if (!combinedText.includes("PR #" + pr)) fail("Missing PR citation: PR #" + pr);
for (const phrase of ["TRACK_B_MEDIA_OSS_STEWARD", "Track A render/export exclusion", "PR #544"]) if (!combinedText.includes(phrase)) fail("Missing exclusion phrase: " + phrase);
for (const pattern of [/\"agentCanExecuteToolsNow\"\s*:\s*true/i, /\"routeExecutionApprovedNow\"\s*:\s*true/i, /\"workerExecutionApprovedNow\"\s*:\s*true/i, /\"toolExecutionApprovedNow\"\s*:\s*true/i, /\"runtimeReadyNow\"\s*:\s*true/i, /\"internalBetaReadyNow\"\s*:\s*true/i, /\"productionReadyNow\"\s*:\s*true/i, /\"browserWebglCanvasRuntimePerformed\"\s*:\s*true/i, /\"gpuRuntimePerformed\"\s*:\s*true/i, /\"providerRuntimePerformed\"\s*:\s*true/i, /\"supabaseMutationPerformed\"\s*:\s*true/i, /\"gcsUploadPerformed\"\s*:\s*true/i, /\"publicArtifactCreated\"\s*:\s*true/i, /\"signedUrlCreated\"\s*:\s*true/i, /E2E proof approved/i, /dry_run_passed/i, /generated_local_fixture_passed/i]) if (pattern.test(combinedText)) fail("Forbidden true claim matched: " + pattern);
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
if (failures.length) { console.error("AI graphics canonical agent-selection QA diagnostics failed:"); for (const failure of failures) console.error("- " + failure); process.exit(1); }
console.log("AI graphics canonical agent-selection QA diagnostics passed.");
