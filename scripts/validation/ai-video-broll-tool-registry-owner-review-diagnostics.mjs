#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DECISION =
  "ai_video_broll_tool_registry_owner_review_conditional_metadata_acceptance";
const NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-TOOL-REGISTRY-2: align model-weight templates with approved cache evidence, no inference";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-tool-registry-owner-review.md",
  "docs/ai-video-broll-generation-tool-registry-model-weight-integration.md",
  "docs/implementation-prompts/prompt-ai-video-broll-tool-registry-2-model-weight-evidence-alignment.md",
  "docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md",
  "scripts/validation/ai-video-broll-tool-registry-owner-review-diagnostics.mjs",
  "scripts/validation/ai-video-broll-tool-registry-model-weights-diagnostics.mjs",
  "package.json"
];

const MODEL_TERMS = [
  "wan_video",
  "ltx_video",
  "mochi_video",
  "hunyuan_video",
  "Wan/Wan2.1",
  "LTX-Video",
  "Mochi 1",
  "HunyuanVideo"
];

const UNSAFE_PATTERNS = [
  ["download true claim", /\b(modelWeightsDownloaded|modelWeightDownloadAllowed|downloadedNow)\b\s*[:=]\s*(true|"true")/i],
  ["dependency/install true claim", /\b(dependencyInstalled|packageInstalled|dockerRun)\b\s*[:=]\s*(true|"true")/i],
  ["model import/inference true claim", /\b(modelImportsRun|modelImported|modelInferenceRun|pipelineInstantiated|modelLoaded)\b\s*[:=]\s*(true|"true")/i],
  ["generated media true claim", /\b(generatedVideoCreated|generatedFramesCreated|generatedAssetsCreated)\b\s*[:=]\s*(true|"true")/i],
  ["runtime side effect true claim", /\b(providerCallsMade|workersDispatched|supabaseTouched|sqlExecuted|gcpMutationCreated|storageUploaded|signedUrlsCreated|publicArtifactsCreated|creditMutationCreated|betaUnlocked|productionUnlocked)\b\s*[:=]\s*(true|"true")/i],
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
  packageJson.scripts?.["ai-video-broll-tool-registry-owner-review:diagnostics"] ===
    "node scripts/validation/ai-video-broll-tool-registry-owner-review-diagnostics.mjs",
  "package.json must expose ai-video-broll-tool-registry-owner-review:diagnostics"
);

const review = read("docs/ai-video-broll-generation-tool-registry-owner-review.md");
const integration = read("docs/ai-video-broll-generation-tool-registry-model-weight-integration.md");
const nextPrompt = read("docs/implementation-prompts/prompt-ai-video-broll-tool-registry-2-model-weight-evidence-alignment.md");
const wanManifest = read("docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md");

check(review.includes(DECISION), "Owner-review decision mismatch");
check(review.includes(NEXT_PROMPT), "Owner-review next prompt mismatch");
check(nextPrompt.includes(NEXT_PROMPT), "Next prompt document title mismatch");
check(review.includes("metadata, diagnostics, owner routing, fail-closed registry checks"), "Owner-review scope must remain metadata-only");
check(review.includes("GPUS_ALL_REGIONS"), "Owner-review must preserve global GPU quota blocker");
check(review.includes("controlled-cache evidence"), "Owner-review must point to cache evidence alignment");
check(wanManifest.includes("Wan-AI/Wan2.1-T2V-1.3B"), "Wan controlled download manifest must remain present");
check(wanManifest.includes("37ec512624d61f7aa208f7ea8140a131f93afc9a"), "Wan controlled download manifest must preserve source revision");
check(wanManifest.includes("downloadedFileCount"), "Wan manifest must preserve file-count evidence");
check(integration.includes("ai_video_broll_tool_registry_model_weight_integration_ready_with_runtime_blockers"), "Integration source decision mismatch");

for (const term of MODEL_TERMS) {
  check(review.includes(term), `Owner-review doc missing ${term}`);
  check(nextPrompt.includes(term) || term === "wan_video" || term === "ltx_video" || term === "mochi_video" || term === "hunyuan_video", `Next prompt missing ${term}`);
}

check(review.includes("HunyuanVideo remains blocked"), "Hunyuan must remain blocked");
check(nextPrompt.includes("Hunyuan remains blocked"), "Next prompt must keep Hunyuan blocked");
check(nextPrompt.includes("Do not run inference"), "Next prompt must forbid inference");
check(nextPrompt.includes("Do not download model weights"), "Next prompt must forbid downloads");
check(nextPrompt.includes("Diagnostics prove all runtime gates remain closed"), "Next prompt must require diagnostics");

const safeFiles = [
  "docs/ai-video-broll-generation-tool-registry-owner-review.md",
  "docs/implementation-prompts/prompt-ai-video-broll-tool-registry-2-model-weight-evidence-alignment.md"
];
const findings = [];
for (const file of safeFiles) {
  const text = read(file);
  for (const [name, pattern] of UNSAFE_PATTERNS) {
    if (pattern.test(text)) {
      findings.push(`${name}: ${file}`);
    }
  }
}
check(findings.length === 0, `Unsafe owner-review text found: ${findings.join("; ")}`);

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  acceptedScope: "metadata_only_registry_model_weight_readiness",
  modelRoutes: ["wan_video", "ltx_video", "mochi_video", "hunyuan_video"],
  wanControlledCacheEvidencePresent: true,
  globalGpuQuotaBlockerPreserved: true,
  hunyuanVideoBlocked: true,
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
