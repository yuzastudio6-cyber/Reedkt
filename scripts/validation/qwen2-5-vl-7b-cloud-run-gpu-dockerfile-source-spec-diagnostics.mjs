#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { QWEN2_5_VL_CLOUD_RUN_GPU_DOCKERFILE_SOURCE_SPEC } from "../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-dockerfile-source-spec.ts";

const ROOT = process.cwd();
const DECISION = "qwen2_5_vl_7b_cloud_run_gpu_dockerfile_source_spec_ready_for_private_cache_mount_review";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_17-CLOUD-RUN-GPU-PRIVATE-CACHE-MOUNT-REVIEW: define private model cache bucket/mount/IAM plan, no upload/no deploy/no inference";

const REQUIRED_FILES = [
  "docker/prod/qwen2-5-vl-cloud-run-gpu/README.md",
  "docker/prod/qwen2-5-vl-cloud-run-gpu/Dockerfile",
  "docker/prod/qwen2-5-vl-cloud-run-gpu/Dockerfile.dockerignore",
  "docker/prod/qwen2-5-vl-cloud-run-gpu/requirements.qwen2-5-vl.txt",
  "server/workers/qwen2_5_vl_cloud_run_gpu/__init__.py",
  "server/workers/qwen2_5_vl_cloud_run_gpu/service.py",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-dockerfile-source-spec.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-dockerfile-source-spec-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-review.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-dockerfile-source-spec.ts",
  "scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-dockerfile-source-spec-diagnostics.mjs",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-no-build-image-plan.md",
  "package.json"
];

const REQUIRED_PHRASES = [
  DECISION,
  "| Source file authored | true |",
  "| Docker build run | false |",
  "| Docker push run | false |",
  "| Artifact Registry image created | false |",
  "| Runtime dependency scope | vLLM-focused Qwen image; SGLang remains a separate existing lane |",
  "| Model weights in image | false |",
  "| Request-time dependency install | false |",
  "| Health endpoint loads model | false |",
  "| POST execution accepted | false |",
  "| Private cache mount path | `/models/qwen2.5-vl-7b-instruct` |",
  "| Bucket created | false |",
  "| Object uploaded | false |",
  "| Volume mounted | false |",
  "| Min instances | `0` |",
  "| Max instances | `1` |",
  "No model inference proof is approved.",
  NEXT_PROMPT
];

const REQUIRED_DOCKERFILE_PHRASES = [
  "FROM pytorch/pytorch:2.6.0-cuda12.4-cudnn9-runtime",
  "HF_HUB_OFFLINE=1",
  "TRANSFORMERS_OFFLINE=1",
  "MODEL_DOWNLOADS_ENABLED=false",
  "RAW_VLM_PROMPT_ENABLED=false",
  "PROVIDER_EXECUTION_ENABLED=false",
  "QWEN_MODEL_IMPORT_ON_STARTUP=false",
  "QWEN_INFERENCE_ENABLED=false",
  "QWEN_MODEL_CACHE_MOUNT=/models/qwen2.5-vl-7b-instruct",
  "CMD [\"python\", \"/app/server/workers/qwen2_5_vl_cloud_run_gpu/service.py\"]"
];

const REQUIRED_REQUIREMENTS = [
  "vllm==0.11.0",
  "transformers==4.57.1",
  "qwen-vl-utils==0.0.11",
  "opencv-python-headless==4.11.0.86",
  "google-cloud-storage==2.19.0"
];

const FALSE_FLAGS = [
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
  packageJson.scripts?.["qwen2-5-vl-7b-cloud-run-gpu-dockerfile-source-spec:diagnostics"] ===
    "tsx scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-dockerfile-source-spec-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-cloud-run-gpu-dockerfile-source-spec:diagnostics"
);

const doc = read("docs/qwen2-5-vl-7b-cloud-run-gpu-dockerfile-source-spec.md");
const dockerfile = read("docker/prod/qwen2-5-vl-cloud-run-gpu/Dockerfile");
const requirements = read("docker/prod/qwen2-5-vl-cloud-run-gpu/requirements.qwen2-5-vl.txt");
const service = read("server/workers/qwen2_5_vl_cloud_run_gpu/service.py");
const prompt = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-review.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-cloud-run-gpu-dockerfile-source-spec-change-log.md",
  "qwen2-5-vl-7b-cloud-run-gpu-dockerfile-source-spec-change-log"
);
const spec = QWEN2_5_VL_CLOUD_RUN_GPU_DOCKERFILE_SOURCE_SPEC;

includesAll(doc, REQUIRED_PHRASES, "Dockerfile source spec doc");
includesAll(dockerfile, REQUIRED_DOCKERFILE_PHRASES, "Qwen Dockerfile");
includesAll(requirements, REQUIRED_REQUIREMENTS, "Qwen requirements");
check(
  !requirements.includes("sglang[all]"),
  "Qwen Cloud Run requirements must not bundle SGLang; the SGLang lane remains separate"
);
includesAll(service, [
  "modelImportOnStartup",
  "modelInferenceEnabled",
  "qwen_inference_disabled_in_source_spec",
  "ThreadingHTTPServer",
  "do_POST"
], "Qwen fail-closed service wrapper");
includesAll(prompt, [
  NEXT_PROMPT,
  "Do not build Docker.",
  "Do not upload model files.",
  "Do not create GCS buckets or objects.",
  "Do not deploy Cloud Run.",
  "Do not run inference."
], "next prompt");

for (const flag of FALSE_FLAGS) {
  includesAll(doc, [`${flag}=false`], `false runtime flag ${flag}`);
}

check(changeLog.decision === DECISION, "Change log decision mismatch");
check(changeLog.dockerfileSource?.dockerfileSourceCreated === true, "Change log Dockerfile source flag mismatch");
check(changeLog.dockerfileSource?.serviceWrapperSourceCreated === true, "Change log service source flag mismatch");
check(changeLog.dockerfileSource?.modelWeightsInImage === false, "Model weights in image must be false");
check(changeLog.privateModelCache?.volumeMounted === false, "Volume mount must not be created");
check(changeLog.privateModelCache?.objectUploaded === false, "Model object upload must be false");
check(changeLog.serviceCarryForward?.minInstances === 0, "Min instances must be zero");
check(changeLog.serviceCarryForward?.maxInstances === 1, "Max instances must be one");
check(changeLog.nextPrompt === NEXT_PROMPT, "Change log next prompt mismatch");

check(spec.decision === DECISION, "Spec decision mismatch");
check(spec.dockerfileSource.dockerfileSourceCreated === true, "Spec Dockerfile source flag mismatch");
check(spec.dockerfileSource.serviceWrapperSourceCreated === true, "Spec service wrapper flag mismatch");
check(
  spec.dockerfileSource.runtimeDependencyScope ===
    "vllm_focused_qwen_image_sglang_lane_remains_separate",
  "Spec runtime dependency scope mismatch"
);
check(spec.dockerfileSource.modelWeightsInImage === false, "Spec model weights flag mismatch");
check(spec.dockerfileSource.healthEndpointLoadsModel === false, "Health endpoint must not load model");
check(spec.dockerfileSource.postExecutionAccepted === false, "POST execution must be rejected");
check(spec.privateModelCache.mountPath === "/models/qwen2.5-vl-7b-instruct", "Spec mount path mismatch");
check(spec.privateModelCache.volumeMounted === false, "Spec volume mount must be false");
check(spec.privateModelCache.objectUploaded === false, "Spec object upload must be false");
check(spec.dependencySource.vllmVersion === "0.11.0", "Spec vLLM version mismatch");
check(spec.dependencySource.sglangBundledIntoQwenImage === false, "SGLang must not be bundled into Qwen image");
check(spec.dependencySource.sglangLane === "separate_existing_runtime_lane", "Spec SGLang lane mismatch");
check(spec.dependencySource.preparedWheelhouseCount === 158, "Spec wheelhouse count mismatch");
check(spec.serviceCarryForward.minInstances === 0, "Spec min instances must be zero");
check(spec.serviceCarryForward.maxInstances === 1, "Spec max instances must be one");
check(spec.nextPrompt === NEXT_PROMPT, "Spec next prompt mismatch");

check(spec.runtimeFlags.dockerfileSourceCreated === true, "Spec Dockerfile source flag must be true");
check(spec.runtimeFlags.serviceWrapperSourceCreated === true, "Spec service wrapper flag must be true");
check(spec.runtimeFlags.privateCacheMountSpecCreated === true, "Spec cache mount spec flag must be true");
for (const flag of FALSE_FLAGS) {
  check(spec.runtimeFlags?.[flag] === false, `Spec runtime flag ${flag} must be false`);
  check(changeLog.runtimeFlags?.[flag] === false, `Change log runtime flag ${flag} must be false`);
}

for (const file of [
  "docker/prod/qwen2-5-vl-cloud-run-gpu/README.md",
  "docker/prod/qwen2-5-vl-cloud-run-gpu/Dockerfile",
  "server/workers/qwen2_5_vl_cloud_run_gpu/service.py",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-dockerfile-source-spec.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-dockerfile-source-spec-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-review.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-dockerfile-source-spec.ts"
]) {
  assertNoForbiddenText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  dockerfileSourceCreated: true,
  serviceWrapperSourceCreated: true,
  privateCacheMountSpecCreated: true,
  minInstances: spec.serviceCarryForward.minInstances,
  maxInstances: spec.serviceCarryForward.maxInstances,
  dockerBuildRun: false,
  cloudRunServiceCreated: false,
  modelInferenceRun: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
