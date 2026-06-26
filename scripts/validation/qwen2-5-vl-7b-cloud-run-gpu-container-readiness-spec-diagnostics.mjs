#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { QWEN2_5_VL_CLOUD_RUN_GPU_CONTAINER_READINESS } from "../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-container-readiness.ts";

const ROOT = process.cwd();
const DECISION = "qwen2_5_vl_7b_cloud_run_gpu_container_readiness_spec_ready_for_no_build_image_plan";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_15-CLOUD-RUN-GPU-NO-BUILD-IMAGE-PLAN: define Qwen Cloud Run image build plan and private model-cache strategy, no build/no deploy/no inference";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-container-readiness-spec.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-container-readiness-spec-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-cloud-run-gpu-no-build-image-plan.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-container-readiness.ts",
  "scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-container-readiness-spec-diagnostics.mjs",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-quota-preflight-result.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-quota-preflight.ts",
  "docker/prod/vlm-sglang-runtime/README.md",
  "docker/prod/vlm-sglang-runtime/Dockerfile",
  "docs/qwen2-5-vl-7b-controlled-private-download-manifest.md",
  "docs/qwen2-5-vl-7b-linux-l4-wheelhouse-prep-result.md",
  "package.json"
];

const REQUIRED_SPEC_PHRASES = [
  DECISION,
  "| Existing VLM runtime lane | `docker/prod/vlm-sglang-runtime` found |",
  "| Duplicate runtime stack | rejected |",
  "| Immediate container build | false |",
  "| Immediate Cloud Run deploy | false |",
  "| Selected container direction | Qwen-specific Cloud Run service wrapper extending the existing VLM runtime boundary |",
  "| Model weights in image | rejected for first proof |",
  "| Runtime dependency install at request time | rejected |",
  "| Offline wheelhouse use | required for future image build plan |",
  "| Model | `Qwen/Qwen2.5-VL-7B-Instruct` |",
  "| Revision | `cc594898137f460bfe9f0759e9844b3ce807cfb5` |",
  "| Total bytes | `16595981281` |",
  "| Private model aggregate SHA-256 | `46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b` |",
  "| Runtime mount created | false |",
  "| Cloud Run model cache strategy approved | false |",
  "| Model hub auto-download | rejected |",
  "| Public model artifact | rejected |",
  "| Wheel count | `158` |",
  "| Wheelhouse bytes | `4960843100` |",
  "| Wheelhouse aggregate SHA-256 | `d3c782141f03882a0b1f103f68a24c3c27396a971b9fb4aedc15831935ba687c` |",
  "| Service name | `reeditpro-qwen2-5-vl-l4-worker` |",
  "| Region | `us-central1` |",
  "| Min instances | `0` |",
  "| Max instances | `1` |",
  "`RAW_VLM_PROMPT_ENABLED` | `false`",
  "Decide vLLM versus SGLang for Qwen Cloud Run service.",
  NEXT_PROMPT
];

const FALSE_FLAGS = [
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
  packageJson.scripts?.["qwen2-5-vl-7b-cloud-run-gpu-container-readiness-spec:diagnostics"] ===
    "tsx scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-container-readiness-spec-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-cloud-run-gpu-container-readiness-spec:diagnostics"
);

const doc = read("docs/qwen2-5-vl-7b-cloud-run-gpu-container-readiness-spec.md");
const prompt = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-cloud-run-gpu-no-build-image-plan.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-cloud-run-gpu-container-readiness-spec-change-log.md",
  "qwen2-5-vl-7b-cloud-run-gpu-container-readiness-spec-change-log"
);
const spec = QWEN2_5_VL_CLOUD_RUN_GPU_CONTAINER_READINESS;

includesAll(doc, REQUIRED_SPEC_PHRASES, "Cloud Run container readiness spec");
includesAll(prompt, [
  NEXT_PROMPT,
  "Define the Qwen Cloud Run image build plan and private model-cache strategy",
  "Do not build Docker.",
  "Do not deploy Cloud Run.",
  "Do not run inference.",
  "Do not claim `generated_local_fixture_passed`."
], "no-build image plan prompt");

includesAll(doc, ["containerReadinessSpecCreated=true"], "container readiness flag");
for (const flag of FALSE_FLAGS) {
  includesAll(doc, [`${flag}=false`], `false runtime flag ${flag}`);
}

check(changeLog.decision === DECISION, "Change log decision mismatch");
check(changeLog.containerDecision?.existingVlmRuntimeLaneFound === true, "Existing VLM lane must be found");
check(changeLog.containerDecision?.duplicateRuntimeStackRejected === true, "Duplicate runtime must be rejected");
check(changeLog.containerDecision?.modelWeightsInImageRejectedForFirstProof === true, "Weights in image must be rejected");
check(changeLog.privateModelCache?.revision === "cc594898137f460bfe9f0759e9844b3ce807cfb5", "Revision mismatch");
check(changeLog.privateModelCache?.totalBytes === 16595981281, "Model bytes mismatch");
check(changeLog.privateModelCache?.aggregateSha256 === "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b", "Model sha mismatch");
check(changeLog.privateModelCache?.modelHubAutoDownloadRejected === true, "Hub auto-download must be rejected");
check(changeLog.wheelhouse?.wheelCount === 158, "Wheel count mismatch");
check(changeLog.wheelhouse?.totalBytes === 4960843100, "Wheelhouse bytes mismatch");
check(changeLog.wheelhouse?.aggregateSha256 === "d3c782141f03882a0b1f103f68a24c3c27396a971b9fb4aedc15831935ba687c", "Wheelhouse sha mismatch");
check(changeLog.serviceCarryForward?.minInstances === 0, "Min instances must be zero");
check(changeLog.serviceCarryForward?.maxInstances === 1, "Max instances must be one");
check(changeLog.nextPrompt === NEXT_PROMPT, "Next prompt mismatch");

check(spec.decision === DECISION, "Spec decision mismatch");
check(spec.containerDecision.existingVlmRuntimeLaneFound === true, "Spec existing VLM lane mismatch");
check(spec.containerDecision.duplicateRuntimeStackRejected === true, "Spec duplicate runtime mismatch");
check(spec.privateModelCache.revision === "cc594898137f460bfe9f0759e9844b3ce807cfb5", "Spec revision mismatch");
check(spec.privateModelCache.totalBytes === 16595981281, "Spec model bytes mismatch");
check(spec.privateModelCache.aggregateSha256 === "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b", "Spec model sha mismatch");
check(spec.wheelhouse.wheelCount === 158, "Spec wheel count mismatch");
check(spec.wheelhouse.totalBytes === 4960843100, "Spec wheelhouse bytes mismatch");
check(spec.serviceCarryForward.minInstances === 0, "Spec min instances must be zero");
check(spec.serviceCarryForward.maxInstances === 1, "Spec max instances must be one");
check(spec.requiredRuntimeDefaults.RAW_VLM_PROMPT_ENABLED === "false", "Raw prompt env default mismatch");
check(spec.nextPrompt === NEXT_PROMPT, "Spec next prompt mismatch");

check(spec.runtimeFlags.containerReadinessSpecCreated === true, "Spec readiness flag must be true");
check(changeLog.runtimeFlags.containerReadinessSpecCreated === true, "Change log readiness flag must be true");
for (const flag of FALSE_FLAGS) {
  check(spec.runtimeFlags?.[flag] === false, `Spec runtime flag ${flag} must be false`);
  check(changeLog.runtimeFlags?.[flag] === false, `Change log runtime flag ${flag} must be false`);
}

for (const file of [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-container-readiness-spec.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-container-readiness-spec-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-cloud-run-gpu-no-build-image-plan.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-container-readiness.ts"
]) {
  assertNoForbiddenText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  existingVlmRuntimeLaneFound: true,
  duplicateRuntimeStackRejected: true,
  modelRevision: spec.privateModelCache.revision,
  modelBytes: spec.privateModelCache.totalBytes,
  wheelCount: spec.wheelhouse.wheelCount,
  minInstances: spec.serviceCarryForward.minInstances,
  maxInstances: spec.serviceCarryForward.maxInstances,
  dockerBuildRun: false,
  cloudRunServiceCreated: false,
  modelInferenceRun: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
