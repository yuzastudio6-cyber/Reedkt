#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_MOUNT_READ_PROOF_RESULT } from "../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-mount-read-proof-result.ts";

const ROOT = process.cwd();
const DECISION =
  "qwen2_5_vl_7b_cloud_run_gpu_private_mount_read_proof_passed_dedicated_bucket_no_model_import_no_inference";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_27-CLOUD-RUN-GPU-MODEL-IMPORT-PROOF: verify Qwen model import from private mount on L4, no inference";
const IMAGE_DIGEST = "sha256:572acc29405cee48a42baf98f39d949915b8ef14df638736b886673efc47b630";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-mount-read-proof-result.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-mount-read-proof-result-change-log.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-mount-read-proof-result.ts",
  "scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-private-mount-read-proof-result-diagnostics.mjs",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-deploy-result.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-image-build-result.md",
  "package.json"
];

const REQUIRED_DOC_PHRASES = [
  DECISION,
  "| Failed proof job | `qwen25vl-mount-read-proof-0627004851` |",
  "| Failure reason | GCSFuse mount required bucket-level `storage.objects.list` |",
  "| Shared bucket | `reeditpro-staging-reeditpro-generated-assets` |",
  "| Bucket | `reeditpro-staging-reeditpro-model-cache` |",
  "| Public access prevention | `enforced` |",
  "| Uniform bucket-level access | true |",
  "| Runtime IAM role | `roles/storage.objectViewer` |",
  "| Public principal granted | false |",
  "| Broad storage admin granted | false |",
  "| Object count | `16` |",
  "| Total bytes | `16595981281` |",
  "| Proof job | `qwen25vl-mount-read-proof-0627005216` |",
  "| Proof execution | `qwen25vl-mount-read-proof-0627005216-d4m6q` |",
  "| Completion status | success |",
  "| GPU requested | false |",
  "| Proof job deleted | true |",
  "| `ok` | true |",
  "| Mounted file count | `16` |",
  "| Mounted total bytes | `16595981281` |",
  "| Updated ready revision | `reeditpro-qwen2-5-vl-l4-worker-00002-r2s` |",
  "| Operation ID | `454569de-8a93-4caf-ae08-16b80912aca7` |",
  `| Image digest | \`${IMAGE_DIGEST}\` |`,
  "| Public unauthenticated access | disabled |",
  "| Ingress | `internal-and-cloud-load-balancing` |",
  "| GPU | `1` x `nvidia-l4` |",
  "| Min instances | `0` |",
  "| Max instances | `1` |",
  "| Concurrency | `1` |",
  "`QWEN_MODEL_CACHE_BUCKET=reeditpro-staging-reeditpro-model-cache`",
  "`runtimeDataPlaneReadProofPassed=true`",
  "`serviceRuntimeRequestSent=false`",
  "`modelImportRun=false`",
  "`modelInferenceRun=false`",
  "`generatedLocalFixturePassedClaimed=false`",
  NEXT_PROMPT
];

const TRUE_FLAGS = [
  "dedicatedModelCacheBucketCreated",
  "dedicatedModelCacheCopied",
  "dedicatedModelCachePublicAccessPreventionEnforced",
  "dedicatedModelCacheUniformBucketLevelAccess",
  "runtimeServiceAccountObjectViewerOnDedicatedBucket",
  "failedSharedBucketProofRecorded",
  "passingDedicatedBucketProofRecorded",
  "proofJobCreated",
  "proofJobDeleted",
  "cloudRunServiceUpdated",
  "cloudRunRevisionReady",
  "cloudRunVolumeMountUpdated",
  "runtimeDataPlaneReadProofPassed"
];

const FALSE_FLAGS = [
  "sharedGeneratedAssetsBucketBroadReadGranted",
  "serviceRuntimeRequestSent",
  "modelImportRun",
  "modelLoadRun",
  "modelInferenceRun",
  "apiServerInvoked",
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
  ["http URL", /\bhttps?:\/\/(?!127\.0\.0\.1|localhost)/i],
  ["signed URL token", /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ["credential assignment", /\b(api[_-]?key|secret|password|hf[_-]?token|access[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ["database URL", /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ["public storage endpoint", /\bstorage\.googleapis\.com\//i],
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
  packageJson.scripts?.["qwen2-5-vl-7b-cloud-run-gpu-private-mount-read-proof-result:diagnostics"] ===
    "tsx scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-private-mount-read-proof-result-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-cloud-run-gpu-private-mount-read-proof-result:diagnostics"
);

const doc = read("docs/qwen2-5-vl-7b-cloud-run-gpu-private-mount-read-proof-result.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-mount-read-proof-result-change-log.md",
  "qwen2-5-vl-7b-cloud-run-gpu-private-mount-read-proof-result-change-log"
);
const spec = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_MOUNT_READ_PROOF_RESULT;

includesAll(doc, REQUIRED_DOC_PHRASES, "private mount read proof result doc");

check(changeLog.decision === DECISION, "Change log decision mismatch");
check(spec.decision === DECISION, "Spec decision mismatch");
check(changeLog.sharedBucketMountFailure.exitCode === 255, "Shared-bucket failure exit code mismatch");
check(spec.sharedBucketMountFailure.proofJobDeleted === true, "Failed proof job must be deleted");
check(spec.sharedBucketMountFailure.sharedGeneratedAssetsBucketBroadReadGranted === false, "Shared bucket broad read must be false");
check(spec.dedicatedModelCacheBucket.bucket === "reeditpro-staging-reeditpro-model-cache", "Dedicated bucket mismatch");
check(spec.dedicatedModelCacheBucket.uniformBucketLevelAccess === true, "UBLA must be true");
check(spec.dedicatedModelCacheBucket.publicAccessPrevention === "enforced", "Public access prevention mismatch");
check(spec.dedicatedModelCacheBucket.runtimeIamRole === "roles/storage.objectViewer", "Runtime IAM role mismatch");
check(spec.dedicatedModelCacheBucket.publicPrincipalGranted === false, "Public principal must be false");
check(spec.dedicatedCacheInventory.objectCount === 16, "Dedicated object count mismatch");
check(spec.dedicatedCacheInventory.totalBytes === 16595981281, "Dedicated total bytes mismatch");
check(spec.proofExecution.completedSuccessfully === true, "Proof execution must succeed");
check(spec.proofExecution.gpuRequested === false, "Proof job must not request GPU");
check(spec.proofExecution.proofJobDeleted === true, "Passing proof job must be deleted");
check(spec.proofJson.ok === true, "Proof JSON ok must be true");
check(spec.proofJson.fileCount === 16, "Proof JSON file count mismatch");
check(spec.proofJson.totalBytesFromStat === 16595981281, "Proof JSON total bytes mismatch");
check(spec.proofJson.missingRequiredFiles.length === 0, "Proof JSON missing files must be empty");
check(spec.proofJson.unexpectedFiles.length === 0, "Proof JSON unexpected files must be empty");
check(spec.proofJson.fullAggregateSha256Computed === false, "Full aggregate hash must not be recomputed");
check(spec.proofJson.smallReads["config.json"].readBytes === 1374, "config.json small read mismatch");
check(spec.proofJson.smallReads["model.safetensors.index.json"].readBytes === 4096, "model index small read mismatch");
check(spec.serviceUpdate.updatedRevision === "reeditpro-qwen2-5-vl-l4-worker-00002-r2s", "Updated revision mismatch");
check(spec.serviceUpdate.operationId === "454569de-8a93-4caf-ae08-16b80912aca7", "Operation ID mismatch");
check(spec.serviceUpdate.ready === true, "Service must be ready");
check(spec.serviceUpdate.imageDigest === IMAGE_DIGEST, "Image digest mismatch");
check(spec.serviceUpdate.serviceUrlRedactedInRepoEvidence === true, "Service URL must be redacted");
check(spec.serviceUpdate.publicUnauthenticatedAccessAllowed === false, "Public unauth access must be false");
check(spec.serviceUpdate.iamBindingsPresent === false, "Cloud Run IAM bindings must be absent");
check(spec.runtimeShape.gpuType === "nvidia-l4", "GPU type mismatch");
check(spec.runtimeShape.minInstances === 0, "Min instances must be zero");
check(spec.runtimeShape.maxInstances === 1, "Max instances must be one");
check(spec.mount.bucket === "reeditpro-staging-reeditpro-model-cache", "Mount bucket mismatch");
check(spec.mount.readOnly === true, "Mount must be read-only");
check(spec.mount.runtimeDataPlaneReadProofPassed === true, "Runtime data-plane proof must pass");
check(spec.mount.serviceRuntimeRequestSent === false, "Service runtime request must be false");
check(spec.failClosedEnvironment.QWEN_MODEL_CACHE_BUCKET === "reeditpro-staging-reeditpro-model-cache", "Cache bucket env mismatch");
check(spec.failClosedEnvironment.QWEN_MODEL_IMPORT_ON_STARTUP === "false", "Import on startup must remain false");
check(spec.failClosedEnvironment.QWEN_INFERENCE_ENABLED === "false", "Inference must remain disabled");
check(spec.nextPrompt === NEXT_PROMPT, "Spec next prompt mismatch");
check(changeLog.nextPrompt === NEXT_PROMPT, "Change log next prompt mismatch");

for (const flag of TRUE_FLAGS) {
  check(spec.runtimeFlags?.[flag] === true, `Spec runtime flag ${flag} must be true`);
  check(changeLog.runtimeFlags?.[flag] === true, `Change log runtime flag ${flag} must be true`);
}
for (const flag of FALSE_FLAGS) {
  check(spec.runtimeFlags?.[flag] === false, `Spec runtime flag ${flag} must be false`);
  check(changeLog.runtimeFlags?.[flag] === false, `Change log runtime flag ${flag} must be false`);
}
check(spec.runtimeFlags.dedicatedModelCacheObjectCount === 16, "Object count runtime flag mismatch");
check(spec.runtimeFlags.dedicatedModelCacheTotalBytes === 16595981281, "Total bytes runtime flag mismatch");

for (const file of [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-mount-read-proof-result.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-mount-read-proof-result-change-log.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-mount-read-proof-result.ts"
]) {
  assertNoForbiddenText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  dedicatedBucket: spec.dedicatedModelCacheBucket.bucket,
  proofJob: spec.proofExecution.jobName,
  proofJobDeleted: spec.proofExecution.proofJobDeleted,
  proofFileCount: spec.proofJson.fileCount,
  proofTotalBytes: spec.proofJson.totalBytesFromStat,
  updatedRevision: spec.serviceUpdate.updatedRevision,
  minInstances: spec.runtimeShape.minInstances,
  maxInstances: spec.runtimeShape.maxInstances,
  serviceRuntimeRequestSent: spec.runtimeFlags.serviceRuntimeRequestSent,
  modelImportRun: spec.runtimeFlags.modelImportRun,
  modelInferenceRun: spec.runtimeFlags.modelInferenceRun,
  nextPrompt: NEXT_PROMPT
}, null, 2));
