#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DECISION =
  "ai_video_broll_wan_private_cache_validator_blocked_disallowed_prefix_no_model_import";
const NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-TOOL-REGISTRY-6: approve private cache validation prefix, no model import";
const PRIVATE_CACHE_PATH =
  "/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B/37ec512624d61f7aa208f7ea8140a131f93afc9a";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-wan-private-cache-validator-result.md",
  "docs/ai-video-broll-generation-wan-mount-validator.md",
  "server/workers/ai-video-broll-controlled-install/validate_wan_model_mount.py",
  "scripts/validation/ai-video-broll-wan-private-cache-validator-result-diagnostics.mjs",
  "package.json"
];

const UNSAFE_PATTERNS = [
  ["runtime true claim", /\b(modelWeightsCopied|modelMountCreated|dependencyInstalled|sourceRepositoryCloned|modelPackageImported|modelLoaded|inferenceRun|generatedVideoCreated|generatedAssetCreated|vmCreated|dockerRun|gcpMutation|providerCall|workerDispatch|supabaseMutation|sqlExecution|storageUpload|signedUrl|publicArtifact|creditMutation|betaUnlock|productionUnlock)\b\s*[:=]\s*(true|"true")/i],
  ["dry run passed claim", /\bdry_run_passed\s+(claimed|true|passed)/i],
  ["generated local fixture claim", /\bgenerated_local_fixture_passed\s+(claimed|true|passed)/i],
  ["secret assignment", /\b(api[_-]?key|service[_-]?role|secret|password)\s*[:=]\s*['"][^'"]+/i],
  ["signed URL token", /\b(X-Amz-Signature|X-Amz-Credential|Expires=|Signature=|Policy=|Key-Pair-Id=)/i],
  ["database URL", /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i]
];

function check(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

for (const file of REQUIRED_FILES) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
check(
  packageJson.scripts?.["ai-video-broll-wan-private-cache-validator-result:diagnostics"] ===
    "node scripts/validation/ai-video-broll-wan-private-cache-validator-result-diagnostics.mjs",
  "package.json must expose ai-video-broll-wan-private-cache-validator-result:diagnostics"
);

const doc = read("docs/ai-video-broll-generation-wan-private-cache-validator-result.md");
const validatorDoc = read("docs/ai-video-broll-generation-wan-mount-validator.md");
const validator = read("server/workers/ai-video-broll-controlled-install/validate_wan_model_mount.py");

check(doc.includes(DECISION), "Private-cache validator result decision mismatch");
check(doc.includes(NEXT_PROMPT), "Private-cache validator result next prompt mismatch");
check(doc.includes(PRIVATE_CACHE_PATH), "Result doc must include sanitized private cache path");
check(doc.includes("private cache directory exists: true"), "Result doc must record existing private cache directory");
check(doc.includes("pathAllowed: false"), "Result doc must record pathAllowed false");
check(doc.includes("pathPrefixKind: `disallowed_prefix`"), "Result doc must record disallowed prefix");
check(doc.includes("layout: `disallowed_path`"), "Result doc must record disallowed path layout");
check(doc.includes("candidate mount path is outside approved local prefixes"), "Result doc must record fail-closed reason");
check(doc.includes("approve `/Volumes/backup/reeditpro-model-cache/ai-video-broll`"), "Result doc must identify required prefix approval");

check(validatorDoc.includes("ai_video_broll_wan_mount_validator_authored_no_model_import"), "Validator source doc mismatch");
check(validator.includes("CANONICAL_PRODUCTION_MOUNT_PREFIX = Path(\"/opt/reeditpro/model-weights/ai-video-broll\")"), "Validator must keep canonical production prefix");
check(validator.includes("CONTROLLED_PROOF_CACHE_PREFIX = Path(\"/tmp/reeditpro-private-model-cache\")"), "Validator must keep proof cache prefix");
check(!validator.includes("/Volumes/backup/reeditpro-model-cache"), "Validator must not yet approve the private evidence-cache prefix");
check(!/^\s*(?:import|from)\s+(torch|diffusers|transformers|accelerate|safetensors|huggingface_hub)\b/m.test(validator), "Validator must not import heavy model packages");

const findings = [];
for (const file of ["docs/ai-video-broll-generation-wan-private-cache-validator-result.md"]) {
  const text = read(file);
  for (const [name, pattern] of UNSAFE_PATTERNS) {
    if (pattern.test(text)) {
      findings.push(`${name}: ${file}`);
    }
  }
}
check(findings.length === 0, `Unsafe private-cache result text found: ${findings.join("; ")}`);

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  privateCacheDirectoryExists: true,
  pathAllowed: false,
  pathPrefixKind: "disallowed_prefix",
  layout: "disallowed_path",
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
