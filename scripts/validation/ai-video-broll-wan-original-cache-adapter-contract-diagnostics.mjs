#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DECISION =
  "ai_video_broll_wan_original_cache_adapter_contract_ready_no_model_import";
const NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-TOOL-REGISTRY-9: integrate Wan original-cache adapter validation into proof runner, no model import";
const SOURCE_CACHE =
  "/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B/37ec512624d61f7aa208f7ea8140a131f93afc9a";
const CONTRACT_BUILDER =
  "server/workers/ai-video-broll-controlled-install/build_wan_original_cache_adapter_contract.py";
const CONVERSION_PLANNER =
  "server/workers/ai-video-broll-controlled-install/plan_wan_cache_conversion.py";
const VALIDATOR =
  "server/workers/ai-video-broll-controlled-install/validate_wan_model_mount.py";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-wan-original-cache-adapter-contract.md",
  "docs/ai-video-broll-generation-wan-cache-conversion-plan.md",
  CONTRACT_BUILDER,
  CONVERSION_PLANNER,
  VALIDATOR,
  "scripts/validation/ai-video-broll-wan-original-cache-adapter-contract-diagnostics.mjs",
  "package.json"
];

const REQUIRED_INPUTS = [
  "config.json",
  "diffusion_pytorch_model.safetensors",
  "Wan2.1_VAE.pth",
  "models_t5_umt5-xxl-enc-bf16.pth",
  "google/umt5-xxl/spiece.model",
  "google/umt5-xxl/tokenizer.json"
];

const RUNTIME_FALSE_FLAGS = [
  "modelWeightsCopiedNow",
  "diffusersCacheCreatedNow",
  "symlinksCreatedNow",
  "modelImportsRun",
  "modelInferenceRun",
  "generatedVideoCreated",
  "generatedAssetsCreated"
];

const DOC_FALSE_FLAGS = [
  ...RUNTIME_FALSE_FLAGS,
  "dependencyInstalledNow",
  "vmCreated",
  "dockerRun",
  "gcpMutationCreated",
  "providerCallsMade",
  "workersDispatched",
  "supabaseTouched",
  "sqlExecuted",
  "storageUploaded",
  "signedUrlsCreated",
  "publicArtifactsCreated",
  "creditMutationCreated",
  "betaUnlocked",
  "productionUnlocked"
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

function assertNoHeavyRuntimeImports(label, source) {
  check(
    !/^\s*(?:import|from)\s+(torch|diffusers|transformers|accelerate|safetensors|huggingface_hub)\b/m.test(
      source
    ),
    `${label} must not import heavy model packages`
  );
  check(
    !/from_pretrained|WanPipeline|torch\.|diffusers\./.test(source),
    `${label} must not load models or pipelines`
  );
}

for (const file of REQUIRED_FILES) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
check(
  packageJson.scripts?.["ai-video-broll-wan-original-cache-adapter-contract:diagnostics"] ===
    "node scripts/validation/ai-video-broll-wan-original-cache-adapter-contract-diagnostics.mjs",
  "package.json must expose ai-video-broll-wan-original-cache-adapter-contract:diagnostics"
);

const doc = read("docs/ai-video-broll-generation-wan-original-cache-adapter-contract.md");
const conversionDoc = read("docs/ai-video-broll-generation-wan-cache-conversion-plan.md");
const builder = read(CONTRACT_BUILDER);
const planner = read(CONVERSION_PLANNER);
const validator = read(VALIDATOR);

check(doc.includes(DECISION), "Adapter contract decision mismatch");
check(doc.includes(NEXT_PROMPT), "Adapter contract next prompt mismatch");
check(doc.includes("Recommended conversion option: `original_cache_adapter`"), "Doc must pin original cache adapter recommendation");
check(doc.includes("Adapter allowed now: false"), "Doc must keep adapter disabled");
check(doc.includes("Valid for no-inference review: true"), "Doc must record no-inference review readiness");
check(conversionDoc.includes("Recommended option: `original_cache_adapter`"), "Conversion plan must still recommend original cache adapter");
check(builder.includes("CONTRACT_VERSION = \"ai-video-broll-wan-original-cache-adapter-contract-1\""), "Builder contract version missing");
check(builder.includes("future_owner_review_required"), "Builder must keep owner review required");
check(builder.includes("contentsRead=False"), "Builder must not read input contents");

for (const relativePath of REQUIRED_INPUTS) {
  check(doc.includes(relativePath), `Doc missing input ${relativePath}`);
  check(builder.includes(relativePath), `Builder missing input ${relativePath}`);
}
for (const flag of DOC_FALSE_FLAGS) {
  check(doc.includes(`${flag}: false`), `Doc must keep ${flag}=false`);
}

assertNoHeavyRuntimeImports("adapter contract builder", builder);
assertNoHeavyRuntimeImports("conversion planner", planner);
assertNoHeavyRuntimeImports("mount validator", validator);

execFileSync("python3", ["-m", "py_compile", path.join(ROOT, CONTRACT_BUILDER)], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"]
});

const output = execFileSync("python3", [
  path.join(ROOT, CONTRACT_BUILDER),
  "--source-cache",
  SOURCE_CACHE
], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"]
});
const contract = parseJson(output, "adapter contract output");

check(
  contract.contractVersion === "ai-video-broll-wan-original-cache-adapter-contract-1",
  "Contract version mismatch"
);
check(contract.modelId === "Wan-AI/Wan2.1-T2V-1.3B", "Contract model id mismatch");
check(
  contract.modelRevision === "37ec512624d61f7aa208f7ea8140a131f93afc9a",
  "Contract model revision mismatch"
);
check(contract.sourceLayout === "original_wan_runtime_essential_cache", "Contract source layout mismatch");
check(contract.recommendedConversionOption === "original_cache_adapter", "Contract must recommend original cache adapter");
check(contract.adapterStatus === "future_owner_review_required", "Contract adapter status mismatch");
check(contract.adapterAllowedNow === false, "Contract adapter must remain disabled");
check(contract.validForNoInferenceReview === true, "Contract must be valid for no-inference review");
check(Array.isArray(contract.requiredInputs), "Contract required inputs must be an array");
check(contract.requiredInputs.length === 6, "Contract must include six adapter inputs");
check(Array.isArray(contract.missingInputs), "Contract missing inputs must be an array");
check(contract.missingInputs.length === 0, "Contract must have no missing inputs");
for (const input of contract.requiredInputs) {
  check(REQUIRED_INPUTS.includes(input.relativePath), `Unexpected adapter input ${input.relativePath}`);
  check(input.exists === true, `Adapter input must exist: ${input.relativePath}`);
  check(input.contentsRead === false, `Adapter input contents must not be read: ${input.relativePath}`);
}
for (const flag of RUNTIME_FALSE_FLAGS) {
  check(contract[flag] === false, `Contract must keep ${flag}=false`);
}
check(contract.nextPrompt === NEXT_PROMPT, "Contract next prompt mismatch");

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  sourceLayout: contract.sourceLayout,
  recommendedConversionOption: contract.recommendedConversionOption,
  adapterStatus: contract.adapterStatus,
  adapterAllowedNow: contract.adapterAllowedNow,
  validForNoInferenceReview: contract.validForNoInferenceReview,
  requiredInputCount: contract.requiredInputs.length,
  missingInputCount: contract.missingInputs.length,
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
