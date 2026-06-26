#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DECISION = "qwen2_5_vl_7b_stack_tool_registered_no_inference";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_1: approve exact Qwen2.5-VL model revision and checksum plan, no inference";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-stack-tool-integration.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-model-revision-checksum-plan.md",
  "server/tool-registry/production-tool-types.ts",
  "server/tool-registry/production-tool-profiles.ts",
  "server/tool-registry/tool-qa-policy.ts",
  "server/tool-registry/tool-fallback-policy.ts",
  "server/model-weights/model-weight-manifest-types.ts",
  "server/model-weights/model-weight-manifest-templates.ts",
  "server/workers/production-readiness/gpu-ai-readiness-checks.ts",
  "server/workers/production-readiness/gpu-tool-python-import-checks.ts",
  "server/workers/production-readiness/production-tool-readiness-specs.ts",
  "server/workers/vlm-runtime/requirements.vlm.txt",
  "server/workers/vlm-runtime/l4_tuning_profiles.py",
  "server/workers/vlm-runtime/run_structured_output_fixture.py",
  "server/smoke/production-tool-registry-smoke.ts",
  "scripts/validation/qwen2-5-vl-7b-stack-tool-diagnostics.mjs",
  "package.json"
];

const DOCS_TO_SCAN = [
  "docs/qwen2-5-vl-7b-stack-tool-integration.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-model-revision-checksum-plan.md"
];

const SOURCE_TO_SCAN = [
  "server/tool-registry/production-tool-profiles.ts",
  "server/model-weights/model-weight-manifest-templates.ts",
  "server/workers/production-readiness/gpu-tool-python-import-checks.ts",
  "server/workers/production-readiness/production-tool-readiness-specs.ts"
];

const REQUIRED_OFFICIAL_SOURCES = [
  "https://huggingface.co/Qwen/Qwen2.5-VL-7B-Instruct",
  "https://qwen.readthedocs.io/en/stable/deployment/vllm.html",
  "https://docs.vllm.ai/projects/recipes/en/latest/Qwen/Qwen2.5-VL.html",
  "https://docs.cloud.google.com/compute/docs/gpus",
  "https://www.nvidia.com/en-us/data-center/l4/"
];

const FORBIDDEN_TRUE_FLAGS = [
  "modelWeightsDownloaded",
  "dependencyInstalled",
  "modelImportsRun",
  "modelInferenceRun",
  "generatedVideoCreated",
  "generatedAssetsCreated",
  "providerCallsMade",
  "workersDispatched",
  "supabaseTouched",
  "sqlExecuted",
  "gcpMutationCreated",
  "dockerRun",
  "publicArtifactsCreated",
  "signedUrlsCreated",
  "creditMutationCreated",
  "betaUnlocked",
  "productionUnlocked",
  "dryRunPassedClaimed",
  "generatedLocalFixturePassedClaimed"
];

const FORBIDDEN_PATTERNS = [
  ["signed URL token", /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ["credential assignment", /\b(api[_-]?key|service[_-]?role|secret|password|token)\s*[:=]\s*['"][^'"]+['"]/i],
  ["database URL", /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ["storage URI", /\b(gs:\/\/|s3:\/\/|storage\.googleapis\.com\/)/i],
  ["raw worker prompt field", /\b(raw_worker_prompt|rawPromptPayload|raw_prompt)\b/i],
  ["runtime-ready claim", /\b(runtimeReadinessClaimed|productionReady|betaReady)\b\s*[:=]\s*(true|"true")/i],
  ["generated local fixture claim", /\bgenerated_local_fixture_passed\s+(claimed|true|passed)/i],
  ["dry run passed claim", /\bdry_run_passed\s+(claimed|true|passed)/i]
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

function assertNoUnsafeClaims(relativePath) {
  const text = read(relativePath);
  const findings = [];
  for (const flag of FORBIDDEN_TRUE_FLAGS) {
    const pattern = new RegExp(`\\b${flag}\\b\\s*[:=]\\s*(true|"true")`, "i");
    if (pattern.test(text)) {
      findings.push(`${flag}=true`);
    }
  }
  for (const [name, pattern] of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) {
      findings.push(name);
    }
  }
  check(findings.length === 0, `Unsafe claim or forbidden value in ${relativePath}: ${findings.join("; ")}`);
}

for (const file of REQUIRED_FILES) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
check(
  packageJson.scripts?.["qwen2-5-vl-7b-stack-tool:diagnostics"] ===
    "node scripts/validation/qwen2-5-vl-7b-stack-tool-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-stack-tool:diagnostics"
);

const doc = read("docs/qwen2-5-vl-7b-stack-tool-integration.md");
const prompt = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-model-revision-checksum-plan.md");
const types = read("server/tool-registry/production-tool-types.ts");
const profiles = read("server/tool-registry/production-tool-profiles.ts");
const qaPolicy = read("server/tool-registry/tool-qa-policy.ts");
const fallbackPolicy = read("server/tool-registry/tool-fallback-policy.ts");
const manifestTypes = read("server/model-weights/model-weight-manifest-types.ts");
const manifestTemplates = read("server/model-weights/model-weight-manifest-templates.ts");
const gpuReadiness = read("server/workers/production-readiness/gpu-ai-readiness-checks.ts");
const gpuImports = read("server/workers/production-readiness/gpu-tool-python-import-checks.ts");
const readinessSpecs = read("server/workers/production-readiness/production-tool-readiness-specs.ts");
const requirements = read("server/workers/vlm-runtime/requirements.vlm.txt");
const l4Profiles = read("server/workers/vlm-runtime/l4_tuning_profiles.py");
const vlmRunner = read("server/workers/vlm-runtime/run_structured_output_fixture.py");
const registrySmoke = read("server/smoke/production-tool-registry-smoke.ts");

check(doc.includes(DECISION), "Qwen integration doc decision mismatch");
check(doc.includes(NEXT_PROMPT), "Qwen integration doc next prompt mismatch");
includesAll(doc, REQUIRED_OFFICIAL_SOURCES, "Qwen integration doc official sources");
includesAll(doc, [
  "Selected first GPU target: `nvidia_l4`",
  "Google Cloud G2",
  "max_model_len",
  "max_num_seqs = 1",
  "max_num_batched_tokens",
  "image max size around 384px",
  "no model auto-download",
  "not registered for:",
  "AI B-roll generation",
  "Wan remains the primary generated B-roll model route"
], "Qwen integration doc");
includesAll(prompt, [
  NEXT_PROMPT,
  "Do not download model weights.",
  "Do not run inference.",
  "Qwen2.5-VL remains a visual-understanding/planning QA tool"
], "Qwen next prompt");

includesAll(types, ["| 'qwen_vl'", "'qwen_vl',"], "production-tool-types qwen_vl");
includesAll(profiles, [
  "toolId: 'qwen_vl'",
  "displayName: 'Qwen2.5-VL 7B Instruct'",
  "category: 'visual_analysis'",
  "productionStatus: 'planned'",
  "workerType: 'gpu_ai_worker'",
  "executionMode: 'worker_recipe'",
  "gpuRequired: true",
  "cpuAllowed: false",
  "fallbackToolIds: ['paddleocr', 'opencv', 'remotion']",
  "Qwen2.5-VL 7B Instruct weights must be pinned to an exact revision",
  "NVIDIA L4 / Google Cloud G2",
  "must not auto-download"
], "production profile qwen_vl");
check(!/toolId: 'qwen_vl'[\s\S]{0,900}category: 'ai_video_generation'/.test(profiles), "Qwen VLM must not be categorized as AI video generation");
check(!/toolId: 'qwen_vl'[\s\S]{0,1200}cpuAllowed: true/.test(profiles), "Qwen VLM must not be CPU allowed");

includesAll(qaPolicy, [
  "qwen_vl: {",
  "ocr_text_overlap",
  "caption_safe_zone",
  "render_asset_integrity",
  "Qwen2.5-VL visual-understanding output must remain advisory"
], "QA policy qwen_vl");
includesAll(fallbackPolicy, [
  "vlm_visual_understanding_fallback",
  "toolIds: ['qwen_vl']",
  "toolIds: ['paddleocr']",
  "toolIds: ['opencv', 'remotion']",
  "qwen_vl: ['vlm_visual_understanding_fallback', 'ocr_fallback']"
], "fallback policy qwen_vl");

includesAll(manifestTypes, ["| 'qwen2_5_vl_7b_model'"], "model-weight manifest type");
includesAll(manifestTemplates, [
  "id: 'qwen2_5_vl_7b_model'",
  "toolId: 'qwen_vl'",
  "modelName: 'Qwen2.5-VL 7B Instruct model'",
  "Qwen/Qwen2.5-VL-7B-Instruct@placeholder-exact-revision-required",
  "/vlm/qwen2.5-vl-7b-instruct/",
  "commercialUseAllowed: false",
  "commercialUseStatus: 'needs_review'",
  "reviewStatus: 'needs_review'",
  "blocksProductionIfMissing: true",
  "Future execution must use an approved private local model path"
], "Qwen model-weight manifest template");

includesAll(gpuReadiness, ["'qwen_vl',"], "GPU readiness qwen_vl");
includesAll(gpuImports, [
  "toolId: 'qwen_vl'",
  "checkName: 'python_import_qwen_vl_utils_optional'",
  "packageName: 'qwen-vl-utils'",
  "importName: 'qwen_vl_utils'",
  "optional: true",
  "modelWeightRequired: true",
  "do not import vLLM, load model weights, or run VLM inference"
], "GPU import qwen_vl");
includesAll(readinessSpecs, [
  "qwen_vl: [{ packageName: 'qwen-vl-utils', importName: 'qwen_vl_utils' }]",
  "qwen_vl: ['Qwen2.5-VL 7B Instruct model']",
  "qwen_vl: ['gpu_ai_worker', 'qa_worker']",
  "qwen_vl: ['gpu_worker', 'qa_worker', 'tool_readiness_worker']"
], "production readiness spec qwen_vl");
includesAll(requirements, ["vllm==0.11.0", "transformers==4.57.1", "qwen-vl-utils==0.0.11"], "VLM requirements");
includesAll(l4Profiles, ["max_model_len=2048", "max_num_seqs=1", "max_num_batched_tokens=1024", "image_max_size=384", "gpu_memory_utilization=0.92"], "L4 tuning profile");
includesAll(vlmRunner, ["limit_mm_per_prompt", "\"image\": 1", "PHASE39CQ_SO_LOCAL_MODEL_PATH_REQUIRED"], "VLM runner no auto-download boundary");
includesAll(registrySmoke, [
  "const qwenVl = requireProfile('qwen_vl')",
  "Qwen VLM must be visual analysis, not AI video generation.",
  "Unreviewed Qwen2.5-VL weights must be blocked."
], "production registry smoke qwen_vl");

for (const file of [...DOCS_TO_SCAN, ...SOURCE_TO_SCAN]) {
  assertNoUnsafeClaims(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  toolId: "qwen_vl",
  modelWeightTemplateId: "qwen2_5_vl_7b_model",
  selectedModel: "Qwen/Qwen2.5-VL-7B-Instruct",
  selectedGpu: "nvidia_l4_google_cloud_g2_first",
  role: "visual_analysis_planning_qa",
  aiVideoGenerationRoute: false,
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
  publicArtifactsCreated: false,
  signedUrlsCreated: false,
  betaUnlocked: false,
  productionUnlocked: false,
  generatedLocalFixturePassedClaimed: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
