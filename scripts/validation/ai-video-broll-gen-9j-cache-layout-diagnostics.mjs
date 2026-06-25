#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const EXPECTED_DECISION =
  "ai_video_broll_gen_9j_cache_layout_diffusers_private_cache_lane_approved_ready_for_private_download_proof";
const EXPECTED_NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-9J-DIFFUSERS-CACHE-DOWNLOAD: download private Diffusers-format Wan cache, no VM/no inference";
const DIFFUSERS_COMMIT = "0fad780a534b6463e45facd96134c9f345acfa5b";
const DIFFUSERS_REPO = "Wan-AI/Wan2.1-T2V-1.3B-Diffusers";
const PRIVATE_CACHE_PATH =
  "/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B-Diffusers/0fad780a534b6463e45facd96134c9f345acfa5b";

const REQUIRED_RUNTIME_FILES = [
  "model_index.json",
  "scheduler/scheduler_config.json",
  "text_encoder/config.json",
  "text_encoder/model-00001-of-00005.safetensors",
  "text_encoder/model-00002-of-00005.safetensors",
  "text_encoder/model-00003-of-00005.safetensors",
  "text_encoder/model-00004-of-00005.safetensors",
  "text_encoder/model-00005-of-00005.safetensors",
  "text_encoder/model.safetensors.index.json",
  "tokenizer/special_tokens_map.json",
  "tokenizer/spiece.model",
  "tokenizer/tokenizer.json",
  "tokenizer/tokenizer_config.json",
  "transformer/config.json",
  "transformer/diffusion_pytorch_model-00001-of-00002.safetensors",
  "transformer/diffusion_pytorch_model-00002-of-00002.safetensors",
  "transformer/diffusion_pytorch_model.safetensors.index.json",
  "vae/config.json",
  "vae/diffusion_pytorch_model.safetensors"
];

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-gcp-private-proof-cache-layout-decision.md",
  "docs/ai-video-broll-generation-gcp-private-proof-cache-layout-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-diffusers-cache-download.md",
  "scripts/validation/ai-video-broll-gen-9j-cache-layout-diagnostics.mjs",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-cache-layout.md",
  "docs/ai-video-broll-generation-gcp-private-proof-runner-author-result.md",
  "server/workers/ai-video-broll-controlled-install/run_wan_l4_private_tabletop_proof.py",
  "package.json"
];

const UNSAFE_PATTERNS = [
  ["service account email", /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
  ["runtime execution true claim", /\b(modelWeightsDownloaded|modelImportAttempted|pipelineInstantiated|modelInferenceRun|generatedFramesCreated|generatedVideoCreated|vmCreated|gcpMutatingCommandsExecuted|providerCalled|workerDispatched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
  ["generated local fixture wording claim", /\bgenerated_local_fixture_passed\s+(claimed|true|passed)/i],
  ["dry run wording claim", /\bdry_run_passed\s+(claimed|true|passed)/i],
  ["signed URL query", /\b(X-Amz-Signature|X-Amz-Credential|Expires=|Signature=|Policy=|Key-Pair-Id=)/],
  ["DB URL", /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ["JWT", /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/],
  ["Authorization bearer", /\bAuthorization\s*:\s*Bearer\s+[A-Za-z0-9._-]+/i],
  ["Supabase project URL", /https:\/\/[a-z0-9]{20}\.supabase\.co/i],
  ["API key assignment", /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
  ["service role assignment", /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
  ["secret assignment", /\bsecret\s*[:=]\s*['"][^'"]+/i],
  ["Google credential env", /\bGOOGLE_APPLICATION_CREDENTIALS\b/]
];

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseBlock(relativePath, label) {
  const text = read(relativePath);
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp("```json\\s+" + escaped + "\\n([\\s\\S]*?)\\n```"));
  assert(match, `Missing JSON block ${label} in ${relativePath}`);
  return JSON.parse(match[1]);
}

function ensureSafeDocs(files) {
  const findings = [];
  for (const file of files) {
    const text = read(file);
    for (const [name, pattern] of UNSAFE_PATTERNS) {
      if (pattern.test(text)) {
        findings.push(`${name}: ${file}`);
      }
    }
  }
  assert(findings.length === 0, `Unsafe doc text found: ${findings.join("; ")}`);
}

for (const file of REQUIRED_FILES) {
  assert(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
assert(
  packageJson.scripts?.["ai-video-broll-gen-9j-cache-layout:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-9j-cache-layout-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-9j-cache-layout:diagnostics"
);

const decision = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-proof-cache-layout-decision.md",
  "ai-video-broll-gen-9j-cache-layout-decision"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-proof-cache-layout-change-log.md",
  "ai-video-broll-gen-9j-cache-layout-change-log"
);
const runnerAuthor = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-proof-runner-author-result.md",
  "ai-video-broll-gen-9j-runner-author-result"
);

assert(decision.decision === EXPECTED_DECISION, "Cache layout decision mismatch");
assert(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
assert(decision.selectedCacheLayout?.decision === "private_diffusers_format_cache_download_proof", "Selected cache layout mismatch");
assert(decision.selectedCacheLayout?.originalWanCacheAdapterApproved === false, "Original Wan adapter must not be selected");
assert(decision.selectedCacheLayout?.diffusersPrivateCacheLaneApproved === true, "Diffusers private cache lane must be approved");
assert(decision.selectedCacheLayout?.runtimeNetworkFetchAllowed === false, "Runtime network fetch must be blocked");
assert(decision.selectedCacheLayout?.modelRepository === DIFFUSERS_REPO, "Model repository mismatch");
assert(decision.selectedCacheLayout?.sourceCommit === DIFFUSERS_COMMIT, "Diffusers commit mismatch");
assert(decision.selectedCacheLayout?.privateCachePath === PRIVATE_CACHE_PATH, "Private cache path mismatch");
assert(decision.selectedCacheLayout?.downloadedNow === false, "Download must not run now");
assert(decision.selectedCacheLayout?.modelImportedNow === false, "Model import must not run now");
assert(decision.selectedCacheLayout?.runnerCanExecuteAfterDownloadProof === true, "Runner should execute after download proof");

assert(decision.metadataEvidence?.modelIndexClassName === "WanPipeline", "model_index class mismatch");
assert(decision.metadataEvidence?.modelIndexDiffusersVersion === "0.33.0.dev0", "Diffusers version mismatch");
assert(decision.metadataEvidence?.siblingCount === 31, "Sibling count mismatch");
assert(decision.metadataEvidence?.runtimeEssentialFileCount === REQUIRED_RUNTIME_FILES.length, "Runtime file count mismatch");
assert(decision.metadataEvidence?.transformerShardCount === 2, "Transformer shard count mismatch");
assert(decision.metadataEvidence?.transformerTotalSizeBytes === 5675987200, "Transformer size mismatch");
assert(decision.metadataEvidence?.textEncoderShardCount === 5, "Text encoder shard count mismatch");
assert(decision.metadataEvidence?.textEncoderTotalSizeBytes === 22723641344, "Text encoder size mismatch");

for (const [flag, value] of Object.entries(decision.runtimeFlags ?? {})) {
  assert(value === false, `Runtime flag ${flag} must be false`);
}
assert(decision.nextPrompt === EXPECTED_NEXT_PROMPT, "Next prompt mismatch");

assert(changeLog.selectedCacheLayout === "private_diffusers_format_cache_download_proof", "Change log selected layout mismatch");
assert(changeLog.modelWeightsDownloaded === false, "Change log must not download weights");
assert(changeLog.modelInferenceRun === false, "Change log must not run inference");
assert(changeLog.nextPrompt === EXPECTED_NEXT_PROMPT, "Change log next prompt mismatch");

assert(runnerAuthor.cacheLayout?.cacheLayoutReconciliationRequired === true, "Runner author source must require cache reconciliation");

const decisionText = read("docs/ai-video-broll-generation-gcp-private-proof-cache-layout-decision.md");
for (const expected of [
  DIFFUSERS_REPO,
  DIFFUSERS_COMMIT,
  PRIVATE_CACHE_PATH,
  "model_index.json",
  "scheduler/scheduler_config.json",
  "text_encoder/model-00005-of-00005.safetensors",
  "transformer/diffusion_pytorch_model-00002-of-00002.safetensors",
  "vae/diffusion_pytorch_model.safetensors",
  "assets/*",
  "examples/*",
  "WanPipeline",
  "UMT5EncoderModel",
  "T5TokenizerFast",
  "WanTransformer3DModel",
  "AutoencoderKLWan"
]) {
  assert(decisionText.includes(expected), `Decision doc missing ${expected}`);
}

const nextPromptText = read("docs/implementation-prompts/prompt-ai-video-broll-gen-9j-diffusers-cache-download.md");
for (const expected of [
  "no VM/no inference",
  DIFFUSERS_REPO,
  DIFFUSERS_COMMIT,
  PRIVATE_CACHE_PATH,
  "Do not download `assets/*`",
  "compute SHA-256",
  "do not import `torch`",
  "AI-VIDEO-BROLL-GEN-9J-CACHE-VALIDATE"
]) {
  assert(nextPromptText.includes(expected), `Next prompt missing ${expected}`);
}

ensureSafeDocs([
  "docs/ai-video-broll-generation-gcp-private-proof-cache-layout-decision.md",
  "docs/ai-video-broll-generation-gcp-private-proof-cache-layout-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-diffusers-cache-download.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  selectedCacheLayout: "private_diffusers_format_cache_download_proof",
  modelRepository: DIFFUSERS_REPO,
  sourceCommit: DIFFUSERS_COMMIT,
  runtimeEssentialFileCount: REQUIRED_RUNTIME_FILES.length,
  privateCachePath: PRIVATE_CACHE_PATH,
  modelWeightsDownloaded: false,
  dependencyInstallRun: false,
  modelImportRun: false,
  modelInferenceRun: false,
  generatedFramesCreated: false,
  generatedVideoCreated: false,
  vmCreated: false,
  gcpMutatingCommandsExecuted: false,
  supabaseTouched: false,
  sqlExecuted: false,
  providerCalled: false,
  workerDispatched: false,
  signedUrlsCreated: false,
  publicArtifactsCreated: false,
  betaUnlocked: false,
  productionUnlocked: false,
  dryRunPassedClaimed: false,
  generatedLocalFixturePassedClaimed: false,
  nextPrompt: EXPECTED_NEXT_PROMPT
}, null, 2));
