#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DECISION =
  "ai_video_broll_tool_registry_model_weight_integration_ready_with_runtime_blockers";
const NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-TOOL-REGISTRY-1: owner review AI B-roll registry and model-weight readiness, no inference";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-tool-registry-model-weight-integration.md",
  "server/tool-registry/production-tool-types.ts",
  "server/tool-registry/production-tool-profiles.ts",
  "server/tool-registry/tool-qa-policy.ts",
  "server/tool-registry/tool-fallback-policy.ts",
  "server/model-weights/model-weight-manifest-types.ts",
  "server/model-weights/model-weight-manifest-templates.ts",
  "server/workers/production-readiness/production-tool-readiness-specs.ts",
  "server/workers/production-readiness/gpu-ai-readiness-checks.ts",
  "server/workers/production-readiness/gpu-tool-python-import-checks.ts",
  "scripts/validation/ai-video-broll-tool-registry-model-weights-diagnostics.mjs",
  "package.json"
];

const MODEL_TOOLS = [
  {
    toolId: "wan_video",
    templateId: "wan_video_model",
    displayName: "Wan / Wan2.1",
    status: "planned",
    role: "Primary",
    expectedPathSuffix: "/ai-video-broll/wan2.1-t2v-1.3b/",
    sourceReviewName: "Wan/Wan2.1"
  },
  {
    toolId: "ltx_video",
    templateId: "ltx_video_model",
    displayName: "LTX-Video",
    status: "needs_license_review",
    role: "Secondary",
    expectedPathSuffix: "/ai-video-broll/ltx-video/",
    sourceReviewName: "LTX-Video"
  },
  {
    toolId: "mochi_video",
    templateId: "mochi_video_model",
    displayName: "Mochi 1",
    status: "evaluation_only",
    role: "Fallback/research",
    expectedPathSuffix: "/ai-video-broll/mochi-1/",
    sourceReviewName: "Mochi 1"
  },
  {
    toolId: "hunyuan_video",
    templateId: "hunyuan_video_model",
    displayName: "HunyuanVideo",
    status: "blocked",
    role: "Optional premium gated",
    expectedPathSuffix: "/ai-video-broll/hunyuanvideo/",
    sourceReviewName: "HunyuanVideo"
  }
];

const CREATED_DOCS = [
  "docs/ai-video-broll-generation-tool-registry-model-weight-integration.md"
];

const UNSAFE_DOC_PATTERNS = [
  ["model weights downloaded claim", /\b(modelWeightsDownloaded|modelWeightDownloadAllowed|weightsDownloaded)\b\s*[:=]\s*(true|"true")/i],
  ["model import claim", /\b(modelImportsRun|dependencyModuleImportAllowed|modelImported)\b\s*[:=]\s*(true|"true")/i],
  ["inference claim", /\b(modelInferenceRun|modelInferenceAllowed|pipelineInstantiated)\b\s*[:=]\s*(true|"true")/i],
  ["generated video claim", /\b(generatedVideoCreated|generatedFramesCreated|generatedAssetsCreated)\b\s*[:=]\s*(true|"true")/i],
  ["provider worker claim", /\b(providerCallsMade|providerCalled|workersDispatched|workerDispatched)\b\s*[:=]\s*(true|"true")/i],
  ["db/cloud mutation claim", /\b(supabaseTouched|sqlExecuted|gcpMutationCreated|dockerRun)\b\s*[:=]\s*(true|"true")/i],
  ["beta production claim", /\b(betaUnlocked|productionUnlocked|runtimeReadinessClaimed)\b\s*[:=]\s*(true|"true")/i],
  ["dry run passed claim", /\bdry_run_passed\s+(claimed|true|passed)/i],
  ["generated local fixture claim", /\bgenerated_local_fixture_passed\s+(claimed|true|passed)/i],
  ["signed URL token", /\b(X-Amz-Signature|X-Amz-Credential|Expires=|Signature=|Policy=|Key-Pair-Id=)/i],
  ["credential assignment", /\b(api[_-]?key|service[_-]?role|secret|password)\s*[:=]\s*['"][^'"]+/i],
  ["database URL", /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i]
];

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function check(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function includesAll(text, values, label) {
  for (const value of values) {
    check(text.includes(value), `${label} missing ${value}`);
  }
}

function ensureSafeDocs() {
  const findings = [];
  for (const file of CREATED_DOCS) {
    const text = read(file);
    for (const [name, pattern] of UNSAFE_DOC_PATTERNS) {
      if (pattern.test(text)) {
        findings.push(`${name}: ${file}`);
      }
    }
  }
  check(findings.length === 0, `Unsafe generated-doc claim found: ${findings.join("; ")}`);
}

for (const file of REQUIRED_FILES) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
check(
  packageJson.scripts?.["ai-video-broll-tool-registry-model-weights:diagnostics"] ===
    "node scripts/validation/ai-video-broll-tool-registry-model-weights-diagnostics.mjs",
  "package.json must expose ai-video-broll-tool-registry-model-weights:diagnostics"
);

const doc = read("docs/ai-video-broll-generation-tool-registry-model-weight-integration.md");
const types = read("server/tool-registry/production-tool-types.ts");
const profiles = read("server/tool-registry/production-tool-profiles.ts");
const qaPolicy = read("server/tool-registry/tool-qa-policy.ts");
const fallbackPolicy = read("server/tool-registry/tool-fallback-policy.ts");
const manifestTypes = read("server/model-weights/model-weight-manifest-types.ts");
const manifestTemplates = read("server/model-weights/model-weight-manifest-templates.ts");
const readinessSpecs = read("server/workers/production-readiness/production-tool-readiness-specs.ts");
const gpuReadiness = read("server/workers/production-readiness/gpu-ai-readiness-checks.ts");
const gpuImports = read("server/workers/production-readiness/gpu-tool-python-import-checks.ts");

check(doc.includes(DECISION), "Integration doc decision mismatch");
check(doc.includes(NEXT_PROMPT), "Integration doc next prompt mismatch");
includesAll(doc, MODEL_TOOLS.map((model) => model.role), "Integration doc model roles");
includesAll(doc, MODEL_TOOLS.map((model) => model.displayName), "Integration doc model names");
check(doc.includes("HunyuanVideo, blocked"), "Hunyuan must be described as blocked in integration doc");

check(types.includes("| 'ai_video_generation'"), "ProductionToolCategory must include ai_video_generation");
for (const model of MODEL_TOOLS) {
  includesAll(types, [`| '${model.toolId}'`, `'${model.toolId}',`], `production-tool-types ${model.toolId}`);
  includesAll(manifestTypes, [`| '${model.templateId}'`], `model-weight template type ${model.templateId}`);
  includesAll(manifestTemplates, [
    `id: '${model.templateId}'`,
    `toolId: '${model.toolId}'`,
    model.expectedPathSuffix,
    "blocksProductionIfMissing: true"
  ], `model-weight manifest template ${model.templateId}`);
  includesAll(profiles, [
    `toolId: '${model.toolId}'`,
    `displayName: '${model.displayName}'`,
    "category: 'ai_video_generation'",
    `productionStatus: '${model.status}'`,
    "workerType: 'gpu_ai_worker'",
    "gpuRequired: true",
    "cpuAllowed: false"
  ], `production profile ${model.toolId}`);
  includesAll(qaPolicy, [
    `${model.toolId}: {`,
    "render_asset_integrity",
    "export_duration_sync",
    "enhancement_artifacts"
  ], `QA policy ${model.toolId}`);
  includesAll(fallbackPolicy, [
    "ai_video_broll_generation_fallback",
    `${model.toolId}: ['ai_video_broll_generation_fallback']`
  ], `fallback policy ${model.toolId}`);
  includesAll(readinessSpecs, [
    `${model.toolId}: [`,
    model.displayName === "Wan / Wan2.1" ? "Wan/Wan2.1 video generation model" : model.displayName === "LTX-Video" ? "LTX-Video model" : model.displayName === "Mochi 1" ? "Mochi 1 video generation model" : "HunyuanVideo model"
  ], `production readiness spec ${model.toolId}`);
  includesAll(gpuReadiness, [`'${model.toolId}',`], `GPU readiness list ${model.toolId}`);
  includesAll(gpuImports, [
    `toolId: '${model.toolId}' as const`,
    `packageName: '${model.sourceReviewName}'`
  ], `GPU source install review ${model.toolId}`);
}

check(profiles.includes("blockedModelWeightPolicy"), "Blocked model-weight policy helper must exist for premium-gated blocked models");
check(profiles.includes("commercialUseStatus: 'blocked'"), "Blocked model must keep commercial use blocked");
check(profiles.includes("fallbackToolIds: ['wan_video', 'ltx_video', 'mochi_video', 'remotion']"), "Hunyuan fallback path must avoid enabling itself as default");
check(fallbackPolicy.includes("use_simpler_recipe"), "AI B-roll fallback must include deterministic simpler recipe");
check(fallbackPolicy.includes("block_final_export"), "AI B-roll fallback must block final export when required assets remain unresolved");
check(manifestTemplates.includes("reviewStatus: 'blocked'"), "Hunyuan model-weight template must be blocked");
check(gpuImports.includes("pending legal, territory, commercial, GPU"), "Hunyuan source review must keep legal/territory/commercial block");

ensureSafeDocs();

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  modelToolIds: MODEL_TOOLS.map((model) => model.toolId),
  modelWeightTemplateIds: MODEL_TOOLS.map((model) => model.templateId),
  primary: "wan_video",
  secondary: "ltx_video",
  fallbackResearch: "mochi_video",
  optionalPremiumGatedBlocked: "hunyuan_video",
  frontendToolUnionExpanded: false,
  modelWeightsDownloaded: false,
  dependencyInstalled: false,
  modelImportsRun: false,
  modelInferenceRun: false,
  generatedVideoCreated: false,
  generatedAssetsCreated: false,
  providerCallsMade: false,
  workersDispatched: false,
  supabaseTouched: false,
  sqlExecuted: false,
  gcpMutationCreated: false,
  dockerRun: false,
  betaUnlocked: false,
  productionUnlocked: false,
  generatedLocalFixturePassedClaimed: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
