#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_CACHE_MOUNT_REVIEW } from "../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-cache-mount-review.ts";

const ROOT = process.cwd();
const DECISION = "qwen2_5_vl_7b_cloud_run_gpu_private_cache_mount_review_ready_for_private_cache_upload_plan";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_18-CLOUD-RUN-GPU-PRIVATE-CACHE-UPLOAD-PLAN: plan private model cache upload and checksum verification, no upload/no deploy/no inference";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-review.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-review-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-plan.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-cache-mount-review.ts",
  "scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-review-diagnostics.mjs",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-dockerfile-source-spec.md",
  "docker/prod/qwen2-5-vl-cloud-run-gpu/Dockerfile",
  "server/workers/qwen2_5_vl_cloud_run_gpu/service.py",
  "package.json"
];

const REQUIRED_DOC_PHRASES = [
  DECISION,
  "| Cache strategy | private Cloud Storage model-cache path |",
  "| Bucket candidate | `reeditpro-qwen2-5-vl-model-cache-us-central1` |",
  "| Object prefix candidate | `model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/` |",
  "| Container mount path | `/models/qwen2.5-vl-7b-instruct` |",
  "| Mount mode | read-only |",
  "| Cloud Storage object uploaded now | false |",
  "| Cloud Run mount created now | false |",
  "| Service-account key file allowed | false |",
  "| Public principal allowed | false |",
  "| Broad storage admin allowed | false |",
  "| IAM binding created now | false |",
  "| Min instances | `0` |",
  "| Max instances | `1` |",
  "| Checksum before import | required |",
  "| Model import before checksum | forbidden |",
  NEXT_PROMPT
];

const FALSE_FLAGS = [
  "bucketCreated",
  "gcsObjectUploaded",
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
  packageJson.scripts?.["qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-review:diagnostics"] ===
    "tsx scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-review-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-review:diagnostics"
);

const doc = read("docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-review.md");
const prompt = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-plan.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-review-change-log.md",
  "qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-review-change-log"
);
const spec = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_CACHE_MOUNT_REVIEW;

includesAll(doc, REQUIRED_DOC_PHRASES, "Private cache mount review doc");
includesAll(prompt, [
  NEXT_PROMPT,
  "Do not upload model files.",
  "Do not create GCS buckets or objects.",
  "Do not create IAM bindings.",
  "Do not deploy Cloud Run.",
  "Do not run inference."
], "private cache upload plan prompt");

for (const flag of FALSE_FLAGS) {
  includesAll(doc, [`${flag}=false`], `false runtime flag ${flag}`);
}

check(changeLog.decision === DECISION, "Change log decision mismatch");
check(changeLog.privateCacheStrategy?.bucketCandidate === "reeditpro-qwen2-5-vl-model-cache-us-central1", "Bucket candidate mismatch");
check(changeLog.privateCacheStrategy?.containerMountPath === "/models/qwen2.5-vl-7b-instruct", "Mount path mismatch");
check(changeLog.privateCacheStrategy?.gcsObjectUploadedNow === false, "Upload must be false");
check(changeLog.privateCacheStrategy?.cloudRunMountCreatedNow === false, "Mount creation must be false");
check(changeLog.runtimeIdentityAndIam?.iamBindingCreatedNow === false, "IAM binding must be false");
check(changeLog.serviceCarryForward?.minInstances === 0, "Min instances must be zero");
check(changeLog.serviceCarryForward?.maxInstances === 1, "Max instances must be one");
check(changeLog.nextPrompt === NEXT_PROMPT, "Change log next prompt mismatch");

check(spec.decision === DECISION, "Spec decision mismatch");
check(spec.privateCacheStrategy.bucketCandidate === "reeditpro-qwen2-5-vl-model-cache-us-central1", "Spec bucket candidate mismatch");
check(spec.privateCacheStrategy.containerMountPath === "/models/qwen2.5-vl-7b-instruct", "Spec mount path mismatch");
check(spec.privateCacheStrategy.gcsObjectUploadedNow === false, "Spec upload flag must be false");
check(spec.privateCacheStrategy.cloudRunMountCreatedNow === false, "Spec mount creation flag must be false");
check(spec.runtimeIdentityAndIam.serviceAccountKeyFileAllowed === false, "Spec key file flag must be false");
check(spec.runtimeIdentityAndIam.iamBindingCreatedNow === false, "Spec IAM binding flag must be false");
check(spec.modelCacheEvidence.aggregateSha256 === "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b", "Spec model sha mismatch");
check(spec.startupCopyAndChecksumPlan.checksumBeforeImport === true, "Spec checksum before import mismatch");
check(spec.serviceCarryForward.minInstances === 0, "Spec min instances must be zero");
check(spec.serviceCarryForward.maxInstances === 1, "Spec max instances must be one");
check(spec.nextPrompt === NEXT_PROMPT, "Spec next prompt mismatch");

check(spec.runtimeFlags.privateCacheMountReviewCreated === true, "Spec review flag must be true");
for (const flag of FALSE_FLAGS) {
  check(spec.runtimeFlags?.[flag] === false, `Spec runtime flag ${flag} must be false`);
  check(changeLog.runtimeFlags?.[flag] === false, `Change log runtime flag ${flag} must be false`);
}

for (const file of [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-review.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-review-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-plan.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-cache-mount-review.ts"
]) {
  assertNoForbiddenText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  bucketCandidate: spec.privateCacheStrategy.bucketCandidate,
  containerMountPath: spec.privateCacheStrategy.containerMountPath,
  minInstances: spec.serviceCarryForward.minInstances,
  maxInstances: spec.serviceCarryForward.maxInstances,
  bucketCreated: false,
  gcsObjectUploaded: false,
  iamBindingCreated: false,
  cloudRunVolumeMountCreated: false,
  cloudRunServiceCreated: false,
  modelInferenceRun: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
