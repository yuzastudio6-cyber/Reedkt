#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DECISION =
  "ai_video_broll_private_cache_prefix_approved_no_inference_original_layout_validated";
const NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-TOOL-REGISTRY-7: plan Wan original-cache adapter or Diffusers cache conversion, no inference";
const PRIVATE_CACHE_PATH =
  "/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B/37ec512624d61f7aa208f7ea8140a131f93afc9a";
const VALIDATOR = "server/workers/ai-video-broll-controlled-install/validate_wan_model_mount.py";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-private-cache-prefix-approval.md",
  "docs/ai-video-broll-generation-wan-private-cache-validator-result.md",
  "docs/ai-video-broll-generation-wan-mount-validator.md",
  VALIDATOR,
  "scripts/validation/ai-video-broll-private-cache-prefix-approval-diagnostics.mjs",
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
  packageJson.scripts?.["ai-video-broll-private-cache-prefix-approval:diagnostics"] ===
    "node scripts/validation/ai-video-broll-private-cache-prefix-approval-diagnostics.mjs",
  "package.json must expose ai-video-broll-private-cache-prefix-approval:diagnostics"
);

const doc = read("docs/ai-video-broll-generation-private-cache-prefix-approval.md");
const previousResult = read("docs/ai-video-broll-generation-wan-private-cache-validator-result.md");
const validatorDoc = read("docs/ai-video-broll-generation-wan-mount-validator.md");
const validator = read(VALIDATOR);

check(doc.includes(DECISION), "Prefix approval decision mismatch");
check(doc.includes(NEXT_PROMPT), "Prefix approval next prompt mismatch");
check(doc.includes("/Volumes/backup/reeditpro-model-cache/ai-video-broll"), "Prefix approval doc must include evidence-cache prefix");
check(doc.includes("pathAllowed: true"), "Prefix approval doc must record pathAllowed true");
check(doc.includes("pathPrefixKind: `controlled_evidence_cache_prefix`"), "Prefix approval doc must record controlled evidence prefix");
check(doc.includes("layout: `original_wan_runtime_essential_cache`"), "Prefix approval doc must record original Wan layout");
check(doc.includes("runnableWithCurrentProofRunner: false"), "Prefix approval must keep runner compatibility false");
check(previousResult.includes("blocked_disallowed_prefix"), "Previous blocked result must remain as historical evidence");
check(validatorDoc.includes("Controlled evidence cache prefix"), "Validator doc must describe evidence cache prefix");
check(validator.includes("CONTROLLED_EVIDENCE_CACHE_PREFIX = Path(\"/Volumes/backup/reeditpro-model-cache/ai-video-broll\")"), "Validator must approve evidence-cache prefix");
check(!/^\s*(?:import|from)\s+(torch|diffusers|transformers|accelerate|safetensors|huggingface_hub)\b/m.test(validator), "Validator must not import heavy model packages");

for (const relative of REQUIRED_ORIGINAL_FILES) {
  check(doc.includes(relative), `Prefix approval doc missing required file ${relative}`);
}

const output = execFileSync("python3", [
  path.join(ROOT, VALIDATOR),
  "--candidate-mount",
  PRIVATE_CACHE_PATH
], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"]
});
const result = parseJson(output, "validator output");

check(result.pathAllowed === true, "Actual private cache validation must be pathAllowed true");
check(result.pathPrefixKind === "controlled_evidence_cache_prefix", "Actual private cache validation prefix mismatch");
check(result.layout === "original_wan_runtime_essential_cache", "Actual private cache layout mismatch");
check(result.exists === true, "Actual private cache should exist");
check(result.runnableWithCurrentProofRunner === false, "Original Wan layout must remain not runnable with current proof runner");
check(Array.isArray(result.missingRequiredFiles) && result.missingRequiredFiles.length === 0, "Actual private cache must not miss required original files");
check(result.modelImportsRun === false, "Validator must not import models");
check(result.modelInferenceRun === false, "Validator must not run inference");
check(result.generatedVideoCreated === false, "Validator must not create generated video");
check(result.generatedAssetsCreated === false, "Validator must not create generated assets");

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  actualPrivateCacheValidated: true,
  pathAllowed: result.pathAllowed,
  pathPrefixKind: result.pathPrefixKind,
  layout: result.layout,
  missingRequiredFiles: result.missingRequiredFiles.length,
  runnableWithCurrentProofRunner: result.runnableWithCurrentProofRunner,
  modelWeightsCopiedNow: false,
  modelMountCreatedNow: false,
  dependencyInstalledNow: false,
  sourceRepositoryClonedNow: false,
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
