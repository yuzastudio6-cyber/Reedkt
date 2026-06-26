#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = process.cwd();
const DECISION =
  "ai_video_broll_wan_mount_validator_authored_no_model_import";
const NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-TOOL-REGISTRY-5: run no-inference Wan mount validator on approved private cache, no model import";
const VALIDATOR = "server/workers/ai-video-broll-controlled-install/validate_wan_model_mount.py";
const WAN_REVISION = "37ec512624d61f7aa208f7ea8140a131f93afc9a";
const TEMP_PREFIX = "/tmp/reeditpro-private-model-cache";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-wan-mount-validator.md",
  "docs/ai-video-broll-generation-wan-model-mount-source-install-plan.md",
  VALIDATOR,
  "scripts/validation/ai-video-broll-wan-mount-validator-diagnostics.mjs",
  "package.json"
];

const ORIGINAL_WAN_FILES = [
  "config.json",
  "diffusion_pytorch_model.safetensors",
  "Wan2.1_VAE.pth",
  "models_t5_umt5-xxl-enc-bf16.pth",
  "google/umt5-xxl/spiece.model",
  "google/umt5-xxl/tokenizer.json"
];

const DIFFUSERS_MARKERS = [
  "model_index.json",
  "transformer",
  "vae",
  "scheduler"
];

const HEAVY_IMPORT_PATTERN = /^\s*(?:import|from)\s+(torch|diffusers|transformers|accelerate|safetensors|huggingface_hub)\b/m;

function check(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function parseJsonOutput(output, label) {
  try {
    return JSON.parse(output);
  } catch (error) {
    throw new Error(`Failed to parse ${label} JSON: ${error.message}\n${output}`);
  }
}

function runValidator(python, candidateMount) {
  const output = execFileSync(python, [
    path.join(ROOT, VALIDATOR),
    "--candidate-mount",
    candidateMount
  ], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  return parseJsonOutput(output, candidateMount);
}

function touch(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, "");
}

for (const file of REQUIRED_FILES) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
check(
  packageJson.scripts?.["ai-video-broll-wan-mount-validator:diagnostics"] ===
    "node scripts/validation/ai-video-broll-wan-mount-validator-diagnostics.mjs",
  "package.json must expose ai-video-broll-wan-mount-validator:diagnostics"
);

const doc = read("docs/ai-video-broll-generation-wan-mount-validator.md");
const plan = read("docs/ai-video-broll-generation-wan-model-mount-source-install-plan.md");
const validatorSource = read(VALIDATOR);

check(doc.includes(DECISION), "Validator doc decision mismatch");
check(doc.includes(NEXT_PROMPT), "Validator doc next prompt mismatch");
check(doc.includes(WAN_REVISION), "Validator doc must include Wan revision");
check(plan.includes("ai_video_broll_wan_model_mount_source_install_plan_ready_no_inference"), "Mount/source-install plan decision missing");
check(validatorSource.includes("VALIDATOR_VERSION = \"ai-video-broll-wan-mount-validator-1\""), "Validator version missing");
check(validatorSource.includes("CANONICAL_PRODUCTION_MOUNT_PREFIX = Path(\"/opt/reeditpro/model-weights/ai-video-broll\")"), "Validator canonical mount prefix missing");
check(validatorSource.includes("CONTROLLED_PROOF_CACHE_PREFIX = Path(\"/tmp/reeditpro-private-model-cache\")"), "Validator proof cache prefix missing");
check(!HEAVY_IMPORT_PATTERN.test(validatorSource), "Validator must not import heavy model/runtime packages");
check(!/from_pretrained|WanPipeline|torch\.|diffusers\./.test(validatorSource), "Validator must not load models or pipelines");

const python = process.env.PYTHON ?? "python3";
execFileSync(python, ["-m", "py_compile", path.join(ROOT, VALIDATOR)], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"]
});

fs.mkdirSync(TEMP_PREFIX, { recursive: true });
const tempRoot = fs.mkdtempSync(path.join(TEMP_PREFIX, "/validator-diagnostics-"));

try {
  const missingPath = path.join(tempRoot, "missing-wan");
  const missing = runValidator(python, missingPath);
  check(missing.layout === "missing_mount", "Missing path must report missing_mount");
  check(missing.pathAllowed === true, "Missing path under prefix must be allowed");
  check(missing.modelImportsRun === false && missing.modelInferenceRun === false, "Missing path check must not import/infer");

  const originalPath = path.join(tempRoot, "original-layout");
  for (const relative of ORIGINAL_WAN_FILES) {
    touch(path.join(originalPath, relative));
  }
  const original = runValidator(python, originalPath);
  check(original.layout === "original_wan_runtime_essential_cache", "Original layout must be detected");
  check(original.runnableWithCurrentProofRunner === false, "Original layout must remain not runnable with current proof runner");
  check(original.missingRequiredFiles.length === 0, "Original layout must not miss required original files");
  check(original.generatedVideoCreated === false && original.generatedAssetsCreated === false, "Original layout check must not create media/assets");

  const diffusersPath = path.join(tempRoot, "diffusers-layout");
  for (const marker of DIFFUSERS_MARKERS) {
    const markerPath = path.join(diffusersPath, marker);
    if (marker.endsWith(".json")) {
      touch(markerPath);
    } else {
      fs.mkdirSync(markerPath, { recursive: true });
    }
  }
  const diffusers = runValidator(python, diffusersPath);
  check(diffusers.layout === "diffusers_cache_layout", "Diffusers layout must be detected");
  check(diffusers.runnableWithCurrentProofRunner === true, "Complete diffusers marker layout should be runner-compatible");
  check(diffusers.modelImportsRun === false && diffusers.modelInferenceRun === false, "Diffusers layout check must not import/infer");

  const disallowed = runValidator(python, path.join(os.tmpdir(), "not-approved-wan-cache"));
  check(disallowed.layout === "disallowed_path" && disallowed.pathAllowed === false, "Disallowed path must fail closed");
  check(disallowed.modelImportsRun === false && disallowed.modelInferenceRun === false, "Disallowed path check must not import/infer");
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  validatorCompiled: true,
  syntheticMountChecksRun: true,
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
