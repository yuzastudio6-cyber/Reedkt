#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DECISION =
  "ai_video_broll_wan_cache_conversion_plan_ready_no_copy_no_import";
const NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-TOOL-REGISTRY-8: author no-inference Wan original-cache adapter contract, no model import";
const SOURCE_CACHE =
  "/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B/37ec512624d61f7aa208f7ea8140a131f93afc9a";
const PLANNER = "server/workers/ai-video-broll-controlled-install/plan_wan_cache_conversion.py";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-wan-cache-conversion-plan.md",
  "docs/ai-video-broll-generation-private-cache-prefix-approval.md",
  "server/workers/ai-video-broll-controlled-install/plan_wan_cache_conversion.py",
  "server/workers/ai-video-broll-controlled-install/validate_wan_model_mount.py",
  "scripts/validation/ai-video-broll-wan-cache-conversion-plan-diagnostics.mjs",
  "package.json"
];

const REQUIRED_ORIGINAL_FILES = [
  "config.json",
  "diffusion_pytorch_model.safetensors",
  "Wan2.1_VAE.pth",
  "models_t5_umt5-xxl-enc-bf16.pth",
  "google/umt5-xxl/spiece.model",
  "google/umt5-xxl/tokenizer.json"
];

const REQUIRED_DIFFUSERS_REQUIREMENTS = [
  "model_index.json",
  "transformer/",
  "vae/",
  "scheduler/",
  "tokenizer/",
  "text_encoder/"
];

function check(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function parseJson(value, label) {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`Unable to parse ${label}: ${error.message}\n${value}`);
  }
}

for (const file of REQUIRED_FILES) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
check(
  packageJson.scripts?.["ai-video-broll-wan-cache-conversion-plan:diagnostics"] ===
    "node scripts/validation/ai-video-broll-wan-cache-conversion-plan-diagnostics.mjs",
  "package.json must expose ai-video-broll-wan-cache-conversion-plan:diagnostics"
);

const doc = read("docs/ai-video-broll-generation-wan-cache-conversion-plan.md");
const prefixApproval = read("docs/ai-video-broll-generation-private-cache-prefix-approval.md");
const planner = read(PLANNER);
const validator = read("server/workers/ai-video-broll-controlled-install/validate_wan_model_mount.py");

check(doc.includes(DECISION), "Conversion plan decision mismatch");
check(doc.includes(NEXT_PROMPT), "Conversion plan next prompt mismatch");
check(doc.includes("Recommended option: `original_cache_adapter`"), "Doc must recommend original cache adapter");
check(doc.includes("does not copy model weights"), "Doc must forbid model weight copy");
check(prefixApproval.includes("original_wan_runtime_essential_cache"), "Prefix approval source layout missing");
check(planner.includes("PLANNER_VERSION = \"ai-video-broll-wan-cache-conversion-plan-1\""), "Planner version missing");
check(planner.includes("original_cache_adapter"), "Planner must include original cache adapter option");
check(planner.includes("diffusers_cache_materialization"), "Planner must include Diffusers materialization option");
check(planner.includes("defer_until_vm_mount"), "Planner must include defer option");
check(!/^\s*(?:import|from)\s+(torch|diffusers|transformers|accelerate|safetensors|huggingface_hub)\b/m.test(planner), "Planner must not import heavy model packages");
check(!/from_pretrained|WanPipeline|torch\.|diffusers\./.test(planner), "Planner must not load models or pipelines");
check(!/^\s*(?:import|from)\s+(torch|diffusers|transformers|accelerate|safetensors|huggingface_hub)\b/m.test(validator), "Validator must remain no-import");

for (const relative of REQUIRED_ORIGINAL_FILES) {
  check(doc.includes(relative), `Doc missing original file ${relative}`);
}
for (const requirement of REQUIRED_DIFFUSERS_REQUIREMENTS) {
  check(doc.includes(requirement), `Doc missing future Diffusers requirement ${requirement}`);
  check(planner.includes(requirement), `Planner missing future Diffusers requirement ${requirement}`);
}

execFileSync("python3", ["-m", "py_compile", path.join(ROOT, PLANNER)], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"]
});

const output = execFileSync("python3", [
  path.join(ROOT, PLANNER),
  "--source-cache",
  SOURCE_CACHE
], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"]
});
const plan = parseJson(output, "conversion planner output");

check(plan.sourcePathAllowed === true, "Planner source path must be allowed");
check(plan.sourceExists === true, "Planner source cache must exist");
check(plan.sourceLayout === "original_wan_runtime_essential_cache", "Planner source layout mismatch");
check(Array.isArray(plan.sourceMissingRequiredFiles) && plan.sourceMissingRequiredFiles.length === 0, "Planner must have no missing original files");
check(plan.recommendedOption === "original_cache_adapter", "Planner must recommend original cache adapter");
check(plan.modelWeightsCopiedNow === false, "Planner must not copy weights");
check(plan.diffusersCacheCreatedNow === false, "Planner must not create Diffusers cache");
check(plan.symlinksCreatedNow === false, "Planner must not create symlinks");
check(plan.modelImportsRun === false, "Planner must not import models");
check(plan.modelInferenceRun === false, "Planner must not run inference");
check(plan.generatedVideoCreated === false, "Planner must not create generated video");
check(plan.generatedAssetsCreated === false, "Planner must not create assets");
check(plan.safeForFutureOwnerReview === true, "Planner must be safe for future owner review");
check(plan.nextPrompt === NEXT_PROMPT, "Planner next prompt mismatch");

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  sourceLayout: plan.sourceLayout,
  sourceMissingRequiredFiles: plan.sourceMissingRequiredFiles.length,
  recommendedOption: plan.recommendedOption,
  optionCount: plan.options.length,
  futureDiffusersLayoutRequirements: plan.futureDiffusersLayoutRequirements.length,
  modelWeightsCopiedNow: false,
  diffusersCacheCreatedNow: false,
  symlinksCreatedNow: false,
  dependencyInstalledNow: false,
  modelImportsRun: false,
  modelInferenceRun: false,
  generatedVideoCreated: false,
  generatedAssetsCreated: false,
  vmCreated: false,
  dockerRun: false,
  gcpMutationCreated: false,
  providerCallsMade: false,
  workersDispatched: false,
  supabaseTouched: false,
  sqlExecuted: false,
  storageUploaded: false,
  signedUrlsCreated: false,
  publicArtifactsCreated: false,
  creditMutationCreated: false,
  betaUnlocked: false,
  productionUnlocked: false,
  generatedLocalFixturePassedClaimed: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
