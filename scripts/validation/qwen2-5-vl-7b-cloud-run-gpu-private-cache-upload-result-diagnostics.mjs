#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_CACHE_UPLOAD_RESULT } from "../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-cache-upload-result.ts";

const ROOT = process.cwd();
const DECISION =
  "qwen2_5_vl_7b_cloud_run_gpu_private_cache_upload_blocked_partial_no_deploy_no_inference";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_19-FIX-CLOUD-RUN-GPU-PRIVATE-CACHE-UPLOAD: retry private cache upload with improved resumable transfer strategy, no deploy/no inference";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-result.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-result-change-log.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-cache-upload-result.ts",
  "scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-result-diagnostics.mjs",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-plan.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-cache-upload-plan.ts",
  "package.json"
];

const REQUIRED_DOC_PHRASES = [
  DECISION,
  "| Bucket | `reeditpro-staging-reeditpro-generated-assets` |",
  "| Bucket location | `US-CENTRAL1` |",
  "| Object prefix | `model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/` |",
  "| Expected model file count | `16` |",
  "| Expected total bytes | `16595981281` |",
  "| Expected aggregate SHA-256 | `46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b` |",
  "| Remote object count at intended prefix | `6` |",
  "| Remote total bytes at intended prefix | `1694572` |",
  "| Remote upload complete | false |",
  "| Remote checksum fully verified | false |",
  "| Upload status | `blocked_partial` |",
  "| Model cache ready for Cloud Run mount | false |",
  "No GPU instance or Cloud Run GPU service is running from this packet.",
  NEXT_PROMPT
];

const FALSE_FLAGS = [
  "gcsObjectUploadPassed",
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
  ["public URL", /\bhttps?:\/\/(?!127\.0\.0\.1|localhost)/i],
  ["signed URL token", /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ["credential assignment", /\b(api[_-]?key|secret|password|hf[_-]?token|access[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ["database URL", /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ["remote storage URI", /\b(gs:\/\/|s3:\/\/|storage\.googleapis\.com\/)/i],
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
  packageJson.scripts?.["qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-result:diagnostics"] ===
    "tsx scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-result-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-result:diagnostics"
);

const doc = read("docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-result.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-result-change-log.md",
  "qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-result-change-log"
);
const spec = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_CACHE_UPLOAD_RESULT;

includesAll(doc, REQUIRED_DOC_PHRASES, "Private cache upload result doc");

for (const flag of FALSE_FLAGS) {
  includesAll(doc, [`${flag}=false`], `false runtime flag ${flag}`);
}

check(changeLog.decision === DECISION, "Change log decision mismatch");
check(changeLog.uploadTarget?.bucket === "reeditpro-staging-reeditpro-generated-assets", "Change log bucket mismatch");
check(changeLog.uploadTarget?.bucketLocation === "US-CENTRAL1", "Change log bucket location mismatch");
check(changeLog.expectedManifest?.fileCount === 16, "Change log expected file count mismatch");
check(changeLog.expectedManifest?.totalBytes === 16595981281, "Change log expected total bytes mismatch");
check(changeLog.remoteInventory?.objectCount === 6, "Change log remote object count mismatch");
check(changeLog.remoteInventory?.totalBytes === 1694572, "Change log remote total bytes mismatch");
check(changeLog.remoteInventory?.remoteUploadComplete === false, "Remote upload must be incomplete");
check(changeLog.blockedOutcome?.uploadAttempted === true, "Upload attempt flag mismatch");
check(changeLog.blockedOutcome?.uploadPassed === false, "Upload passed must be false");
check(changeLog.blockedOutcome?.temporaryCompositeObjectsTreatedAsFinalModelCache === false, "Temp components must not be final model cache");
check(changeLog.nextPrompt === NEXT_PROMPT, "Change log next prompt mismatch");

check(spec.decision === DECISION, "Spec decision mismatch");
check(spec.uploadTarget.bucket === "reeditpro-staging-reeditpro-generated-assets", "Spec bucket mismatch");
check(spec.uploadTarget.bucketLocation === "US-CENTRAL1", "Spec bucket location mismatch");
check(spec.uploadTarget.objectPrefix === "model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/", "Spec object prefix mismatch");
check(spec.expectedManifest.fileCount === 16, "Spec expected file count mismatch");
check(spec.expectedManifest.totalBytes === 16595981281, "Spec expected total bytes mismatch");
check(spec.expectedManifest.aggregateSha256 === "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b", "Spec aggregate SHA mismatch");
check(spec.remoteInventory.objectCount === 6, "Spec remote object count mismatch");
check(spec.remoteInventory.totalBytes === 1694572, "Spec remote total bytes mismatch");
check(spec.remoteInventory.expectedObjectCount === 16, "Spec expected remote object count mismatch");
check(spec.remoteInventory.remoteUploadComplete === false, "Spec remote upload must be incomplete");
check(spec.blockedOutcome.uploadAttempted === true, "Spec upload attempt flag mismatch");
check(spec.blockedOutcome.uploadPassed === false, "Spec upload passed flag must be false");
check(spec.blockedOutcome.uploadStatus === "blocked_partial", "Spec upload status mismatch");
check(spec.nextPrompt === NEXT_PROMPT, "Spec next prompt mismatch");

check(spec.runtimeFlags.privateCacheUploadResultCreated === true, "Spec result flag must be true");
check(spec.runtimeFlags.gcsObjectUploadAttempted === true, "Spec attempted flag must be true");
check(changeLog.runtimeFlags?.privateCacheUploadResultCreated === true, "Change log result flag must be true");
check(changeLog.runtimeFlags?.gcsObjectUploadAttempted === true, "Change log attempted flag must be true");
for (const flag of FALSE_FLAGS) {
  check(spec.runtimeFlags?.[flag] === false, `Spec runtime flag ${flag} must be false`);
  check(changeLog.runtimeFlags?.[flag] === false, `Change log runtime flag ${flag} must be false`);
}

for (const file of [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-result.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-result-change-log.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-cache-upload-result.ts"
]) {
  assertNoForbiddenText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  uploadAttempted: true,
  uploadPassed: false,
  uploadStatus: spec.blockedOutcome.uploadStatus,
  remoteObjectCount: spec.remoteInventory.objectCount,
  remoteTotalBytes: spec.remoteInventory.totalBytes,
  expectedObjectCount: spec.remoteInventory.expectedObjectCount,
  expectedTotalBytes: spec.remoteInventory.expectedTotalBytes,
  remoteChecksumVerified: false,
  cloudRunServiceCreated: false,
  modelInferenceRun: false,
  supabaseTouched: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
