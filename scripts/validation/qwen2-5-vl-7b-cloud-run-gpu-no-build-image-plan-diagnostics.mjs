#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { QWEN2_5_VL_CLOUD_RUN_GPU_NO_BUILD_IMAGE_PLAN } from "../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-no-build-image-plan.ts";

const ROOT = process.cwd();
const DECISION = "qwen2_5_vl_7b_cloud_run_gpu_no_build_image_plan_ready_for_dockerfile_source_spec";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_16-CLOUD-RUN-GPU-DOCKERFILE-SOURCE-SPEC: author Qwen Cloud Run Dockerfile source and private cache mount spec, no build/no deploy/no inference";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-no-build-image-plan.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-no-build-image-plan-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-cloud-run-gpu-dockerfile-source-spec.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-no-build-image-plan.ts",
  "scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-no-build-image-plan-diagnostics.mjs",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-container-readiness-spec.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-container-readiness.ts",
  "docs/qwen2-5-vl-7b-controlled-private-download-manifest.md",
  "docs/qwen2-5-vl-7b-linux-l4-wheelhouse-prep-result.md",
  "package.json"
];

const REQUIRED_PLAN_PHRASES = [
  DECISION,
  "| Image build status | no-build plan only |",
  "| Dockerfile source created now | false |",
  "| Docker build run | false |",
  "| Image push run | false |",
  "| Artifact Registry image created | false |",
  "| Existing VLM lane | reuse boundary from `docker/prod/vlm-sglang-runtime` |",
  "| Duplicate runtime stack | rejected |",
  "| Model weights in first proof image | rejected |",
  "| Runtime dependency install at request time | rejected |",
  "| Dependency install timing | image build time only, from reviewed wheelhouse or reviewed package source |",
  "| Bake 16.6 GB model into first proof image | rejected |",
  "| Download model from Hugging Face at request time | rejected |",
  "| Private GCS read-only model cache mount | selected for next review |",
  "| Copy from private GCS mount to local ephemeral path at startup | candidate |",
  "| Ephemeral Compute Engine L4 VM | fallback |",
  "| Total bytes | `16595981281` |",
  "| Private model aggregate SHA-256 | `46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b` |",
  "| Wheel count | `158` |",
  "| Wheelhouse bytes | `4960843100` |",
  "| Wheelhouse aggregate SHA-256 | `d3c782141f03882a0b1f103f68a24c3c27396a971b9fb4aedc15831935ba687c` |",
  "No Qwen Cloud Run Dockerfile source spec exists.",
  NEXT_PROMPT
];

const FALSE_FLAGS = [
  "dockerfileSourceCreated",
  "dockerBuildRun",
  "dockerPushRun",
  "cloudRunDeployCommandExecuted",
  "cloudRunServiceCreated",
  "cloudRunJobCreated",
  "artifactRegistryImageCreated",
  "gcsBucketCreated",
  "gcsObjectUploaded",
  "cloudRunVolumeMountCreated",
  "reservationCreated",
  "vmCreated",
  "dependencyInstallRun",
  "modelImportRun",
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
  ["credential assignment", /\b(api[_-]?key|service[_-]?role|secret|password|hf[_-]?token|access[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
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
  packageJson.scripts?.["qwen2-5-vl-7b-cloud-run-gpu-no-build-image-plan:diagnostics"] ===
    "tsx scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-no-build-image-plan-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-cloud-run-gpu-no-build-image-plan:diagnostics"
);

const doc = read("docs/qwen2-5-vl-7b-cloud-run-gpu-no-build-image-plan.md");
const prompt = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-cloud-run-gpu-dockerfile-source-spec.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-cloud-run-gpu-no-build-image-plan-change-log.md",
  "qwen2-5-vl-7b-cloud-run-gpu-no-build-image-plan-change-log"
);
const spec = QWEN2_5_VL_CLOUD_RUN_GPU_NO_BUILD_IMAGE_PLAN;

includesAll(doc, REQUIRED_PLAN_PHRASES, "Cloud Run no-build image plan");
includesAll(prompt, [
  NEXT_PROMPT,
  "Author Qwen Cloud Run Dockerfile source and private cache mount spec files",
  "Do not build Docker.",
  "Do not deploy Cloud Run.",
  "Do not upload model files.",
  "Do not run inference.",
  "Do not claim `generated_local_fixture_passed`."
], "Dockerfile source spec prompt");

includesAll(doc, ["imageBuildPlanCreated=true"], "image build plan flag");
for (const flag of FALSE_FLAGS) {
  includesAll(doc, [`${flag}=false`], `false runtime flag ${flag}`);
}

check(changeLog.decision === DECISION, "Change log decision mismatch");
check(changeLog.imageBuildStrategy?.imageBuildStatus === "no_build_plan_only", "Image build status mismatch");
check(changeLog.imageBuildStrategy?.dockerfileSourceCreatedNow === false, "Dockerfile source must not be created");
check(changeLog.imageBuildStrategy?.duplicateRuntimeStackRejected === true, "Duplicate runtime must be rejected");
check(changeLog.imageBuildStrategy?.modelWeightsInFirstProofImageRejected === true, "Model weights in image must be rejected");
check(changeLog.privateModelCacheStrategy?.privateGcsReadOnlyModelCacheMount === "selected_for_next_review", "Private GCS mount strategy mismatch");
check(changeLog.privateModelCache?.totalBytes === 16595981281, "Model bytes mismatch");
check(changeLog.privateModelCache?.aggregateSha256 === "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b", "Model sha mismatch");
check(changeLog.privateModelCache?.cloudRunVolumeMountCreated === false, "Volume mount must not be created");
check(changeLog.wheelhouse?.wheelCount === 158, "Wheel count mismatch");
check(changeLog.wheelhouse?.totalBytes === 4960843100, "Wheelhouse bytes mismatch");
check(changeLog.nextPrompt === NEXT_PROMPT, "Next prompt mismatch");

check(spec.decision === DECISION, "Spec decision mismatch");
check(spec.imageBuildStrategy.imageBuildStatus === "no_build_plan_only", "Spec image build status mismatch");
check(spec.imageBuildStrategy.dockerfileSourceCreatedNow === false, "Spec Dockerfile source flag mismatch");
check(spec.imageBuildStrategy.duplicateRuntimeStackRejected === true, "Spec duplicate runtime mismatch");
check(spec.privateModelCacheStrategy.privateGcsReadOnlyModelCacheMount === "selected_for_next_review", "Spec private GCS strategy mismatch");
check(spec.privateModelCache.totalBytes === 16595981281, "Spec model bytes mismatch");
check(spec.privateModelCache.aggregateSha256 === "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b", "Spec model sha mismatch");
check(spec.privateModelCache.cloudRunVolumeMountCreated === false, "Spec volume mount must be false");
check(spec.wheelhouse.wheelCount === 158, "Spec wheel count mismatch");
check(spec.wheelhouse.totalBytes === 4960843100, "Spec wheelhouse bytes mismatch");
check(spec.proposedFutureImageContents.modelWeightsIncluded === false, "Spec image must not include weights");
check(spec.serviceCarryForward.minInstances === 0, "Spec min instances must be zero");
check(spec.serviceCarryForward.maxInstances === 1, "Spec max instances must be one");
check(spec.nextPrompt === NEXT_PROMPT, "Spec next prompt mismatch");

check(spec.runtimeFlags.imageBuildPlanCreated === true, "Spec image build plan flag must be true");
check(changeLog.runtimeFlags.imageBuildPlanCreated === true, "Change log image build plan flag must be true");
for (const flag of FALSE_FLAGS) {
  check(spec.runtimeFlags?.[flag] === false, `Spec runtime flag ${flag} must be false`);
  check(changeLog.runtimeFlags?.[flag] === false, `Change log runtime flag ${flag} must be false`);
}

for (const file of [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-no-build-image-plan.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-no-build-image-plan-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-cloud-run-gpu-dockerfile-source-spec.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-no-build-image-plan.ts"
]) {
  assertNoForbiddenText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  imageBuildStatus: spec.imageBuildStrategy.imageBuildStatus,
  duplicateRuntimeStackRejected: true,
  privateModelCacheStrategy: spec.privateModelCacheStrategy.privateGcsReadOnlyModelCacheMount,
  modelWeightsInFirstProofImageRejected: true,
  modelBytes: spec.privateModelCache.totalBytes,
  wheelCount: spec.wheelhouse.wheelCount,
  dockerBuildRun: false,
  cloudRunServiceCreated: false,
  modelInferenceRun: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
