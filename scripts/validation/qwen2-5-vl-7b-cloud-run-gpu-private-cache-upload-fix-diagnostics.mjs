#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_CACHE_UPLOAD_FIX } from "../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-cache-upload-fix.ts";

const ROOT = process.cwd();
const DECISION =
  "qwen2_5_vl_7b_cloud_run_gpu_private_cache_upload_fix_selects_cloud_side_transfer_no_deploy_no_inference";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_20-STORAGE-TRANSFER-URL-LIST-EXECUTE: complete private Qwen model cache with one-time Storage Transfer URL-list job, no deploy/no inference";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-fix.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-fix-change-log.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-cache-upload-fix.ts",
  "scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-fix-diagnostics.mjs",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-result.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-cache-upload-result.ts",
  "package.json"
];

const REQUIRED_DOC_PHRASES = [
  DECISION,
  "| Current object count at intended prefix | `6` |",
  "| Current total bytes at intended prefix | `1694572` |",
  "| First large shard present | false |",
  "| Retry target | `model-00001-of-00005.safetensors` |",
  "| Retry elapsed before stop | more than `13` minutes |",
  "| Local-uplink strategy accepted for next step | false |",
  "Preferred next path: Storage Transfer Service URL-list transfer",
  "Fallback path if URL-list transfer cannot satisfy the safety/access rules",
  "`storage_transfer_url_list`",
  "`cloud_run_cpu_one_shot_transfer_runner`",
  "No GPU instance or Cloud Run GPU service is running from this packet.",
  NEXT_PROMPT
];

const REQUIRED_FILES_IN_URL_LIST = [
  ".gitattributes",
  "README.md",
  "chat_template.json",
  "config.json",
  "generation_config.json",
  "merges.txt",
  "model-00001-of-00005.safetensors",
  "model-00002-of-00005.safetensors",
  "model-00003-of-00005.safetensors",
  "model-00004-of-00005.safetensors",
  "model-00005-of-00005.safetensors",
  "model.safetensors.index.json",
  "preprocessor_config.json",
  "tokenizer_config.json",
  "tokenizer.json",
  "vocab.json"
];

const FALSE_FLAGS = [
  "localRetryPassed",
  "storageTransferJobCreated",
  "urlListObjectCreated",
  "cloudRunCpuTransferJobCreated",
  "cloudRunGpuServiceCreated",
  "gcsObjectUploadComplete",
  "remoteChecksumVerified",
  "remoteAggregateSha256Recomputed",
  "cloudRunVolumeMountCreated",
  "cloudRunDeployCommandExecuted",
  "cloudRunServiceCreated",
  "cloudRunJobCreated",
  "artifactRegistryImageCreated",
  "reservationCreated",
  "vmCreated",
  "dependencyInstallRun",
  "modelImportRun",
  "modelLoadRun",
  "modelInferenceRun",
  "apiServerStarted",
  "providerCallsMade",
  "workersDispatched",
  "supabaseTouched",
  "sqlExecuted",
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
  ["credential assignment", /\b(api[_-]?key|secret|password|hf[_-]?token|access[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ["database URL", /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ["raw worker prompt field", /\b(raw_worker_prompt|rawPromptPayload|raw_prompt)\b/i],
  ["runtime-ready true claim", /\b(productionReady|betaReady|runtimeReadinessClaimed|claimsRuntimeReady|claimsBetaReady|claimsProductionReady)\b\s*[:=]\s*(true|"true")/i],
  ["unsafe pass claim", /\b(dryRunPassedClaimed|generatedLocalFixturePassedClaimed|claimsDryRunPassed|claimsGeneratedLocalFixturePassed)\b\s*[:=]\s*(true|"true")/i]
];

function check(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function parseBlock(relativePath, label) {
  const text = read(relativePath);
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp("```json\\s+" + escaped + "\\n([\\s\\S]*?)\\n```"));
  check(match, `Missing JSON block ${label} in ${relativePath}`);
  return JSON.parse(match[1]);
}

function includesAll(text, values, label) {
  for (const value of values) {
    check(text.includes(value), `${label} missing ${value}`);
  }
}

function assertNoForbiddenText(relativePath) {
  const text = read(relativePath);
  const findings = [];
  for (const [name, pattern] of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) {
      findings.push(name);
    }
  }
  check(findings.length === 0, `Forbidden value in ${relativePath}: ${findings.join("; ")}`);
}

for (const file of REQUIRED_FILES) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
check(
  packageJson.scripts?.["qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-fix:diagnostics"] ===
    "tsx scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-fix-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-fix:diagnostics"
);

const doc = read("docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-fix.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-fix-change-log.md",
  "qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-fix-change-log"
);
const spec = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_CACHE_UPLOAD_FIX;

includesAll(doc, REQUIRED_DOC_PHRASES, "Private cache upload fix doc");
includesAll(doc, REQUIRED_FILES_IN_URL_LIST, "Future URL list file set");

for (const flag of FALSE_FLAGS) {
  includesAll(doc, [`${flag}=false`], `false runtime flag ${flag}`);
}

check(changeLog.decision === DECISION, "Change log decision mismatch");
check(changeLog.currentRemoteState?.currentObjectCount === 6, "Change log current object count mismatch");
check(changeLog.currentRemoteState?.currentTotalBytes === 1694572, "Change log current total bytes mismatch");
check(changeLog.currentRemoteState?.firstLargeShardPresent === false, "Change log first shard flag mismatch");
check(changeLog.followUpLocalRetry?.finalShardObjectCreated === false, "Change log final shard must be false");
check(changeLog.followUpLocalRetry?.localUplinkStrategyAcceptedForNextStep === false, "Change log local strategy acceptance must be false");
check(changeLog.selectedFixStrategy?.preferred === "storage_transfer_url_list", "Preferred fix mismatch");
check(changeLog.selectedFixStrategy?.fallback === "cloud_run_cpu_one_shot_transfer_runner", "Fallback fix mismatch");
check(changeLog.selectedFixStrategy?.gpuRequiredForTransfer === false, "GPU transfer flag must be false");
check(changeLog.nextPrompt === NEXT_PROMPT, "Change log next prompt mismatch");

check(spec.decision === DECISION, "Spec decision mismatch");
check(spec.currentRemoteState.currentObjectCount === 6, "Spec current object count mismatch");
check(spec.currentRemoteState.currentTotalBytes === 1694572, "Spec current total bytes mismatch");
check(spec.currentRemoteState.expectedObjectCount === 16, "Spec expected object count mismatch");
check(spec.followUpLocalRetry.localUplinkStrategyAcceptedForNextStep === false, "Spec local strategy accepted flag must be false");
check(spec.selectedFixStrategy.preferred === "storage_transfer_url_list", "Spec preferred fix mismatch");
check(spec.selectedFixStrategy.fallback === "cloud_run_cpu_one_shot_transfer_runner", "Spec fallback fix mismatch");
check(spec.selectedFixStrategy.gpuRequiredForTransfer === false, "Spec GPU transfer flag must be false");
check(spec.futureUrlListShape.fileCount === 16, "Spec URL list file count mismatch");
check(spec.futureUrlListShape.helperManifestFilesExcluded.length === 3, "Spec helper exclusions mismatch");
includesAll(spec.futureUrlListShape.requiredFiles.join("\n"), REQUIRED_FILES_IN_URL_LIST, "Spec URL list file set");
check(spec.nextPrompt === NEXT_PROMPT, "Spec next prompt mismatch");

check(spec.runtimeFlags.privateCacheUploadFixCreated === true, "Spec fix flag must be true");
check(spec.runtimeFlags.localRetryAttempted === true, "Spec local retry attempted must be true");
check(changeLog.runtimeFlags?.privateCacheUploadFixCreated === true, "Change log fix flag must be true");
check(changeLog.runtimeFlags?.localRetryAttempted === true, "Change log local retry attempted must be true");
for (const flag of FALSE_FLAGS) {
  check(spec.runtimeFlags?.[flag] === false, `Spec runtime flag ${flag} must be false`);
  check(changeLog.runtimeFlags?.[flag] === false, `Change log runtime flag ${flag} must be false`);
}

for (const file of [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-fix.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-fix-change-log.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-cache-upload-fix.ts"
]) {
  assertNoForbiddenText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  currentObjectCount: spec.currentRemoteState.currentObjectCount,
  expectedObjectCount: spec.currentRemoteState.expectedObjectCount,
  localRetryPassed: false,
  selectedNextTransferStrategy: spec.selectedFixStrategy.preferred,
  fallbackNextTransferStrategy: spec.selectedFixStrategy.fallback,
  gpuRequiredForTransfer: false,
  cloudRunGpuServiceCreated: false,
  modelInferenceRun: false,
  supabaseTouched: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
