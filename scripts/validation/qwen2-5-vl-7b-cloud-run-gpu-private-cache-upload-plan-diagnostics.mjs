#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_CACHE_UPLOAD_PLAN } from "../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-cache-upload-plan.ts";

const ROOT = process.cwd();
const DECISION = "qwen2_5_vl_7b_cloud_run_gpu_private_cache_upload_plan_ready_for_upload_execute_no_deploy";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_19-CLOUD-RUN-GPU-PRIVATE-CACHE-UPLOAD-EXECUTE: upload private model cache to approved private bucket and verify checksum, no deploy/no inference";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-plan.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-plan-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-execute.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-cache-upload-plan.ts",
  "scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-plan-diagnostics.mjs",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-review.md",
  "docs/qwen2-5-vl-7b-controlled-private-download-manifest.md",
  "package.json"
];

const REQUIRED_DOC_PHRASES = [
  DECISION,
  "| Existing target bucket | `reeditpro-staging-reeditpro-generated-assets` |",
  "| Bucket location | `US-CENTRAL1` |",
  "| Dedicated new bucket needed for first proof | false |",
  "| Candidate runtime identity | `reeditpro-stg-gpu-worker-sa` |",
  "| Selected bucket | `reeditpro-staging-reeditpro-generated-assets` |",
  "| Selected object prefix | `model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/` |",
  "| File count | `16` |",
  "| Weight shard count | `5` |",
  "| Total bytes | `16595981281` |",
  "| Aggregate SHA-256 | `46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b` |",
  "The future upload step must verify the local manifest before upload",
  "Do not deploy Cloud Run.",
  NEXT_PROMPT
];

const FALSE_FLAGS = [
  "bucketCreated",
  "gcsObjectUploaded",
  "remoteChecksumVerified",
  "iamBindingCreated",
  "serviceAccountKeyCreated",
  "cloudRunVolumeMountCreated",
  "dockerBuildRun",
  "dockerPushRun",
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
  packageJson.scripts?.["qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-plan:diagnostics"] ===
    "tsx scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-plan-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-plan:diagnostics"
);

const doc = read("docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-plan.md");
const prompt = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-execute.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-plan-change-log.md",
  "qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-plan-change-log"
);
const spec = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_CACHE_UPLOAD_PLAN;

includesAll(doc, REQUIRED_DOC_PHRASES, "Private cache upload plan doc");
includesAll(prompt, [
  NEXT_PROMPT,
  "Confirm selected bucket exists in `US-CENTRAL1`.",
  "Confirm selected prefix is empty or contains only the same revision manifest.",
  "Do not deploy Cloud Run.",
  "Do not run inference."
], "private cache upload execute prompt");

for (const flag of FALSE_FLAGS) {
  includesAll(doc, [`${flag}=false`], `false runtime flag ${flag}`);
}

check(changeLog.decision === DECISION, "Change log decision mismatch");
check(changeLog.readOnlyGcpInventory?.existingTargetBucket === "reeditpro-staging-reeditpro-generated-assets", "Target bucket mismatch");
check(changeLog.readOnlyGcpInventory?.dedicatedNewBucketNeededForFirstProof === false, "Dedicated bucket flag mismatch");
check(changeLog.selectedUploadTarget?.objectUploadedNow === false, "Object upload must be false");
check(changeLog.selectedUploadTarget?.cloudRunMountCreatedNow === false, "Cloud Run mount must be false");
check(changeLog.uploadManifest?.fileCount === 16, "File count mismatch");
check(changeLog.uploadManifest?.totalBytes === 16595981281, "Total bytes mismatch");
check(changeLog.uploadManifest?.aggregateSha256 === "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b", "Aggregate SHA mismatch");
check(changeLog.nextPrompt === NEXT_PROMPT, "Change log next prompt mismatch");

check(spec.decision === DECISION, "Spec decision mismatch");
check(spec.readOnlyGcpInventory.existingTargetBucket === "reeditpro-staging-reeditpro-generated-assets", "Spec target bucket mismatch");
check(spec.readOnlyGcpInventory.bucketCreatedNow === false, "Spec bucket creation flag must be false");
check(spec.readOnlyGcpInventory.iamBindingCreatedNow === false, "Spec IAM binding flag must be false");
check(spec.selectedUploadTarget.objectUploadedNow === false, "Spec object upload flag must be false");
check(spec.uploadManifest.fileCount === 16, "Spec file count mismatch");
check(spec.uploadManifest.totalBytes === 16595981281, "Spec total bytes mismatch");
check(spec.futureUploadPreflight.confirmLocalAggregateSha256 === "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b", "Spec preflight SHA mismatch");
check(spec.futureIamAndMountFollowup.cloudRunDeployApproved === false, "Spec deploy approval must be false");
check(spec.nextPrompt === NEXT_PROMPT, "Spec next prompt mismatch");

check(spec.runtimeFlags.privateCacheUploadPlanCreated === true, "Spec upload plan flag must be true");
for (const flag of FALSE_FLAGS) {
  check(spec.runtimeFlags?.[flag] === false, `Spec runtime flag ${flag} must be false`);
  check(changeLog.runtimeFlags?.[flag] === false, `Change log runtime flag ${flag} must be false`);
}

for (const file of [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-plan.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-plan-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-execute.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-cache-upload-plan.ts"
]) {
  assertNoForbiddenText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  selectedBucket: spec.selectedUploadTarget.selectedBucket,
  selectedObjectPrefix: spec.selectedUploadTarget.selectedObjectPrefix,
  fileCount: spec.uploadManifest.fileCount,
  totalBytes: spec.uploadManifest.totalBytes,
  bucketCreated: false,
  gcsObjectUploaded: false,
  remoteChecksumVerified: false,
  cloudRunServiceCreated: false,
  modelInferenceRun: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
