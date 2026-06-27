#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_IMAGE_BUILD_RESULT } from "../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-fail-closed-image-build-result.ts";

const ROOT = process.cwd();
const DECISION =
  "qwen2_5_vl_7b_cloud_run_gpu_fail_closed_image_build_succeeded_no_deploy_no_inference";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_24-CLOUD-RUN-GPU-FAIL-CLOSED-DEPLOY: deploy fail-closed Cloud Run GPU service with private cache mount, no model import/no inference";
const IMAGE_TAG = "fail-closed-vllm-fc1f95fb-20260627t000018z";
const IMAGE_DIGEST = "sha256:572acc29405cee48a42baf98f39d949915b8ef14df638736b886673efc47b630";

const REQUIRED_FILES = [
  "cloudbuild/qwen2-5-vl-cloud-run-gpu-fail-closed.yaml",
  "cloudbuild/qwen2-5-vl-cloud-run-gpu-fail-closed.gcloudignore",
  "docker/prod/qwen2-5-vl-cloud-run-gpu/Dockerfile",
  "docker/prod/qwen2-5-vl-cloud-run-gpu/README.md",
  "docker/prod/qwen2-5-vl-cloud-run-gpu/requirements.qwen2-5-vl.txt",
  "server/workers/qwen2_5_vl_cloud_run_gpu/service.py",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-image-build-result.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-image-build-result-change-log.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-mount-spec.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-fail-closed-image-build-result.ts",
  "scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-image-build-result-diagnostics.mjs",
  "package.json"
];

const REQUIRED_DOC_PHRASES = [
  DECISION,
  "First build ID | `44b88195-e498-4737-93dd-d9fc04367cd7`",
  "First build status | `FAILURE`",
  "Retry build ID | `8626edb5-1275-4fbe-b56f-332b8087037c`",
  "Retry build status | `SUCCESS`",
  "Retry build duration | `16M35S`",
  "Source bundle | `7` files, `7.2 KiB` before compression",
  "Docker context | `17.41 KiB`",
  `Image tag | \`${IMAGE_TAG}\``,
  `Image digest | \`${IMAGE_DIGEST}\``,
  "Image size | `8395344201` bytes (`7.82 GiB`)",
  "| Model weights in image | false |",
  "| SGLang bundled into Qwen image | false |",
  "`dockerBuildRun=true`",
  "`dockerPushRun=true`",
  "`artifactRegistryImageCreated=true`",
  "`cloudRunDeployCommandExecuted=false`",
  "`cloudRunServiceCreated=false`",
  "`modelInferenceRun=false`",
  "`generatedLocalFixturePassedClaimed=false`",
  NEXT_PROMPT
];

const REQUIRED_FALSE_FLAGS = [
  "cloudRunDeployCommandExecuted",
  "cloudRunServiceCreated",
  "cloudRunJobCreated",
  "cloudRunVolumeMountCreated",
  "gpuServiceStarted",
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
  ["http URL", /\bhttps?:\/\/(?!127\.0\.0\.1|localhost)/i],
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

function scanText(relativePath) {
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
  packageJson.scripts?.["qwen2-5-vl-7b-cloud-run-gpu-fail-closed-image-build-result:diagnostics"] ===
    "tsx scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-image-build-result-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-cloud-run-gpu-fail-closed-image-build-result:diagnostics"
);

const doc = read("docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-image-build-result.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-image-build-result-change-log.md",
  "qwen2-5-vl-7b-cloud-run-gpu-fail-closed-image-build-result-change-log"
);
const requirements = read("docker/prod/qwen2-5-vl-cloud-run-gpu/requirements.qwen2-5-vl.txt");
const cloudBuild = read("cloudbuild/qwen2-5-vl-cloud-run-gpu-fail-closed.yaml");
const gcloudIgnore = read("cloudbuild/qwen2-5-vl-cloud-run-gpu-fail-closed.gcloudignore");
const sourceSpec = read("docs/qwen2-5-vl-7b-cloud-run-gpu-dockerfile-source-spec.md");
const spec = QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_IMAGE_BUILD_RESULT;

includesAll(doc, REQUIRED_DOC_PHRASES, "image build result doc");
includesAll(requirements, [
  "vllm==0.11.0",
  "transformers==4.57.1",
  "qwen-vl-utils==0.0.11",
  "google-cloud-storage==2.19.0"
], "Qwen build requirements");
check(!requirements.includes("sglang[all]"), "Qwen image requirements must not include SGLang");
includesAll(sourceSpec, [
  "| Runtime dependency scope | vLLM-focused Qwen image; SGLang remains a separate existing lane |"
], "updated Dockerfile source spec");
includesAll(cloudBuild, [
  "docker",
  "build",
  "--platform",
  "linux/amd64",
  "docker/prod/qwen2-5-vl-cloud-run-gpu/Dockerfile",
  "${_IMAGE}"
], "Cloud Build config");
includesAll(gcloudIgnore, [
  "qwen2-5-vl-cloud-run-gpu-fail-closed.yaml",
  "requirements.qwen2-5-vl.txt",
  "server/workers/qwen2_5_vl_cloud_run_gpu/**",
  "**/*.safetensors",
  "**/*.bin",
  "**/.env"
], "Cloud Build ignore allowlist");

check(changeLog.decision === DECISION, "Change log decision mismatch");
check(changeLog.failedAttempt.status === "FAILURE", "Failed attempt status mismatch");
check(changeLog.dependencyCorrection.sglangBundledIntoQwenImage === false, "SGLang bundling correction mismatch");
check(changeLog.successfulAttempt.buildId === "8626edb5-1275-4fbe-b56f-332b8087037c", "Successful build ID mismatch");
check(changeLog.successfulAttempt.status === "SUCCESS", "Successful build status mismatch");
check(changeLog.image.tag === IMAGE_TAG, "Image tag mismatch");
check(changeLog.image.digest === IMAGE_DIGEST, "Image digest mismatch");
check(changeLog.image.imageSizeBytes === 8395344201, "Image size mismatch");
check(changeLog.image.modelWeightsInImage === false, "Image must not include model weights");
check(changeLog.runtimeFlags.dockerBuildRun === true, "Build flag must be true");
check(changeLog.runtimeFlags.dockerPushRun === true, "Push flag must be true");
check(changeLog.runtimeFlags.artifactRegistryImageCreated === true, "Artifact Registry flag must be true");
for (const flag of REQUIRED_FALSE_FLAGS) {
  check(changeLog.runtimeFlags?.[flag] === false, `Change log runtime flag ${flag} must be false`);
}
check(changeLog.nextPrompt === NEXT_PROMPT, "Change log next prompt mismatch");

check(spec.decision === DECISION, "Spec decision mismatch");
check(spec.failedAttempt.status === "FAILURE", "Spec failed attempt mismatch");
check(spec.dependencyCorrection.sglangBundledIntoQwenImage === false, "Spec SGLang bundling mismatch");
check(spec.successfulAttempt.status === "SUCCESS", "Spec successful attempt mismatch");
check(spec.image.tag === IMAGE_TAG, "Spec image tag mismatch");
check(spec.image.digest === IMAGE_DIGEST, "Spec image digest mismatch");
check(spec.image.imageSizeBytes === 8395344201, "Spec image size mismatch");
check(spec.image.modelWeightsInImage === false, "Spec model weights in image mismatch");
check(spec.cloudBuildSourceBundle.fileCount === 7, "Source bundle file count mismatch");
check(spec.cloudBuildSourceBundle.modelWeightsIncluded === false, "Source bundle must not include model weights");
check(spec.serviceCarryForward.minInstances === 0, "Min instances must stay zero");
check(spec.serviceCarryForward.maxInstances === 1, "Max instances must stay one");
check(spec.runtimeFlags.dockerBuildRun === true, "Spec build flag must be true");
check(spec.runtimeFlags.dockerPushRun === true, "Spec push flag must be true");
check(spec.runtimeFlags.artifactRegistryImageCreated === true, "Spec artifact flag must be true");
for (const flag of REQUIRED_FALSE_FLAGS) {
  check(spec.runtimeFlags?.[flag] === false, `Spec runtime flag ${flag} must be false`);
}
check(spec.nextPrompt === NEXT_PROMPT, "Spec next prompt mismatch");

for (const file of [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-image-build-result.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-image-build-result-change-log.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-fail-closed-image-build-result.ts",
  "cloudbuild/qwen2-5-vl-cloud-run-gpu-fail-closed.yaml",
  "cloudbuild/qwen2-5-vl-cloud-run-gpu-fail-closed.gcloudignore"
]) {
  scanText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  failedBuildId: spec.failedAttempt.buildId,
  successfulBuildId: spec.successfulAttempt.buildId,
  imageTag: spec.image.tag,
  imageDigest: spec.image.digest,
  imageSizeBytes: spec.image.imageSizeBytes,
  dockerBuildRun: spec.runtimeFlags.dockerBuildRun,
  dockerPushRun: spec.runtimeFlags.dockerPushRun,
  cloudRunServiceCreated: spec.runtimeFlags.cloudRunServiceCreated,
  modelInferenceRun: spec.runtimeFlags.modelInferenceRun,
  nextPrompt: NEXT_PROMPT
}, null, 2));
