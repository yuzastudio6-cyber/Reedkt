#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { QWEN2_5_VL_CLOUD_RUN_GPU_SERVICE_SPEC } from "../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-service-spec.ts";

const ROOT = process.cwd();
const DECISION = "qwen2_5_vl_7b_cloud_run_gpu_no_deploy_service_spec_ready_for_quota_preflight";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_13-CLOUD-RUN-GPU-QUOTA-PREFLIGHT: verify Qwen Cloud Run L4 quota and deploy prerequisites, no deploy/no inference";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-service-spec.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-service-spec-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-cloud-run-gpu-quota-preflight.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-service-spec.ts",
  "scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-service-spec-diagnostics.mjs",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-scale-to-zero-review.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-scale-to-zero-review.ts",
  "docker/prod/vlm-sglang-runtime/README.md",
  "docker/prod/vlm-sglang-runtime/Dockerfile",
  "package.json"
];

const REQUIRED_SPEC_PHRASES = [
  DECISION,
  "| Service name | `reeditpro-qwen2-5-vl-l4-worker` |",
  "| Deployment status | no-deploy spec only |",
  "| Region | `us-central1` |",
  "| GPU type | `nvidia-l4` |",
  "| GPU count | `1` |",
  "| CPU | `8` |",
  "| Memory | `32Gi` |",
  "| Minimum proof floor | 4 CPU and 16 GiB |",
  "| Min instances | `0` |",
  "| Max instances | `1` |",
  "| Concurrency | `1` |",
  "| Timeout candidate | `900s` |",
  "| Public unauthenticated access | rejected |",
  "--gpu=1",
  "--gpu-type=nvidia-l4",
  "--min-instances=0",
  "--max-instances=1",
  "--concurrency=1",
  "--no-allow-unauthenticated",
  "The command above is a shape only. It must not be run from this packet.",
  "The Qwen Cloud Run service spec must not duplicate that lane.",
  "`RAW_VLM_PROMPT_ENABLED` | `false`",
  "`QWEN_APPROVED_SNAPSHOT_REQUIRED` | `true`",
  "raw chat as worker instruction",
  "signed URLs as source of truth",
  "No Qwen Cloud Run image exists.",
  NEXT_PROMPT
];

const FALSE_FLAGS = [
  "gcpMutatingCommandsExecuted",
  "cloudRunDeployCommandExecuted",
  "cloudRunServiceCreated",
  "cloudRunJobCreated",
  "dockerBuildRun",
  "dockerPushRun",
  "artifactRegistryImageCreated",
  "reservationCreated",
  "vmCreated",
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
  packageJson.scripts?.["qwen2-5-vl-7b-cloud-run-gpu-no-deploy-service-spec:diagnostics"] ===
    "tsx scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-service-spec-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-cloud-run-gpu-no-deploy-service-spec:diagnostics"
);

const specDoc = read("docs/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-service-spec.md");
const prompt = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-cloud-run-gpu-quota-preflight.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-service-spec-change-log.md",
  "qwen2-5-vl-7b-cloud-run-gpu-no-deploy-service-spec-change-log"
);
const spec = QWEN2_5_VL_CLOUD_RUN_GPU_SERVICE_SPEC;

includesAll(specDoc, REQUIRED_SPEC_PHRASES, "Cloud Run no-deploy service spec");
includesAll(prompt, [
  NEXT_PROMPT,
  "Verify Qwen Cloud Run L4 quota and deploy prerequisites",
  "Do not deploy Cloud Run.",
  "Do not build or push Docker images.",
  "Do not run inference.",
  "Do not claim `generated_local_fixture_passed`."
], "Cloud Run quota preflight prompt");

for (const flag of FALSE_FLAGS) {
  includesAll(specDoc, [`${flag}=false`], `false runtime flag ${flag}`);
}

check(changeLog.decision === DECISION, "Change log decision mismatch");
check(changeLog.serviceSpec?.serviceName === "reeditpro-qwen2-5-vl-l4-worker", "Service name mismatch");
check(changeLog.serviceSpec?.deploymentStatus === "no_deploy_spec_only", "Deployment status mismatch");
check(changeLog.serviceSpec?.region === "us-central1", "Region mismatch");
check(changeLog.serviceSpec?.gpuType === "nvidia-l4", "GPU type mismatch");
check(changeLog.serviceSpec?.gpuCount === 1, "GPU count mismatch");
check(changeLog.serviceSpec?.cpu === 8, "CPU mismatch");
check(changeLog.serviceSpec?.memory === "32Gi", "Memory mismatch");
check(changeLog.serviceSpec?.minimumProofCpu === 4, "Minimum CPU mismatch");
check(changeLog.serviceSpec?.minimumProofMemoryGiB === 16, "Minimum memory mismatch");
check(changeLog.serviceSpec?.minInstances === 0, "Min instances must be zero");
check(changeLog.serviceSpec?.maxInstances === 1, "Max instances must be one");
check(changeLog.serviceSpec?.concurrency === 1, "Concurrency must be one");
check(changeLog.serviceSpec?.publicUnauthenticatedAccessAllowed === false, "Public unauth must be false");
check(changeLog.serviceSpec?.imageExistsNow === false, "Image should not exist yet");
check(changeLog.runtimeBoundary?.existingVlmSglangRuntimeFound === true, "Existing VLM runtime must be recorded");
check(changeLog.runtimeBoundary?.duplicateRuntimeStackCreated === false, "Duplicate runtime stack must not be created");
check(changeLog.runtimeBoundary?.rawChatExecutionRejected === true, "Raw chat execution must be rejected");
check(changeLog.nextPrompt === NEXT_PROMPT, "Next prompt mismatch");

check(spec.decision === DECISION, "Spec decision mismatch");
check(spec.service.name === "reeditpro-qwen2-5-vl-l4-worker", "Spec service name mismatch");
check(spec.service.region === "us-central1", "Spec region mismatch");
check(spec.service.gpuType === "nvidia-l4", "Spec GPU type mismatch");
check(spec.service.cpu === 8, "Spec CPU mismatch");
check(spec.service.memory === "32Gi", "Spec memory mismatch");
check(spec.service.minInstances === 0, "Spec min instances must be zero");
check(spec.service.maxInstances === 1, "Spec max instances must be one");
check(spec.service.concurrency === 1, "Spec concurrency must be one");
check(spec.service.publicUnauthenticatedAccessAllowed === false, "Spec public unauth must be false");
check(spec.futureCommandShape.executableNow === false, "Future command must not be executable now");
check(spec.existingRuntimeBoundary.duplicateRuntimeStackCreated === false, "Spec duplicate runtime must be false");
check(spec.payloadContract.rawChatExecutionRejected === true, "Spec raw chat rejection mismatch");
check(spec.payloadContract.signedUrlSourceOfTruthRejected === true, "Spec signed URL rejection mismatch");
check(spec.nextPrompt === NEXT_PROMPT, "Spec next prompt mismatch");

for (const flag of FALSE_FLAGS) {
  check(spec.runtimeFlags?.[flag] === false, `Spec runtime flag ${flag} must be false`);
  check(changeLog.runtimeFlags?.[flag] === false, `Change log runtime flag ${flag} must be false`);
}

for (const file of [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-service-spec.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-service-spec-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-cloud-run-gpu-quota-preflight.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-service-spec.ts"
]) {
  assertNoForbiddenText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  serviceName: spec.service.name,
  region: spec.service.region,
  gpuType: spec.service.gpuType,
  minInstances: spec.service.minInstances,
  maxInstances: spec.service.maxInstances,
  concurrency: spec.service.concurrency,
  deploymentStatus: spec.service.deploymentStatus,
  cloudRunServiceCreated: false,
  modelInferenceRun: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
