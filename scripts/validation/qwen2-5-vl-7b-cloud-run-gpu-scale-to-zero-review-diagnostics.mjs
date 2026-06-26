#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { QWEN2_5_VL_CLOUD_RUN_GPU_SCALE_TO_ZERO_REVIEW } from "../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-scale-to-zero-review.ts";

const ROOT = process.cwd();
const DECISION = "qwen2_5_vl_7b_cloud_run_gpu_scale_to_zero_review_ready_for_no_deploy_service_spec";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_12-CLOUD-RUN-GPU-NO-DEPLOY-SERVICE-SPEC: author Qwen scale-to-zero Cloud Run service spec, no deploy/no inference";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-scale-to-zero-review.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-scale-to-zero-review-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-cloud-run-gpu-no-deploy-service-spec.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-scale-to-zero-review.ts",
  "scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-scale-to-zero-review-diagnostics.mjs",
  "docs/qwen2-5-vl-7b-idle-gpu-lifecycle-plan.md",
  "src/backend/mock/mock-qwen2-5-vl-idle-gpu-lifecycle.ts",
  "package.json"
];

const REQUIRED_REVIEW_PHRASES = [
  DECISION,
  "| Cloud Run API | enabled |",
  "| Artifact Registry API | enabled |",
  "| Compute Engine API | enabled |",
  "| `gcloud run deploy` GPU flags | `--gpu`, `--gpu-type`, `--min-instances`, `--max-instances`, `--concurrency`, and `--timeout` visible |",
  "| Existing Qwen Cloud Run services | none found |",
  "| Active Compute reservations | none |",
  "Cloud Run GPU services can scale down to zero when not in use.",
  "Cloud Run GPU offers on-demand availability without reservations.",
  "L4 requires at least 4 CPU and 16 GiB memory.",
  "min instances `0`",
  "| Preferred runtime path | Cloud Run GPU scale-to-zero |",
  "| Preferred review region | `us-central1` |",
  "| Secondary region | `us-east4` |",
  "| Tertiary region | `europe-west1` |",
  "| CPU/memory proof floor | 4 CPU and 16 GiB |",
  "| Qwen beta candidate | 8 CPU and 32 GiB |",
  "| Min instances | `0` |",
  "| Max instances | `1` until beta load evidence |",
  "| Concurrency | `1` until model memory/concurrency proof |",
  "| Public unauthenticated access | rejected |",
  "| Always-on GPU | rejected |",
  "| Runtime deployment now | false |",
  "service name `reeditpro-qwen2-5-vl-l4-worker`",
  "fallback to ephemeral Compute Engine L4 worker",
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
  packageJson.scripts?.["qwen2-5-vl-7b-cloud-run-gpu-scale-to-zero-review:diagnostics"] ===
    "tsx scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-scale-to-zero-review-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-cloud-run-gpu-scale-to-zero-review:diagnostics"
);

const review = read("docs/qwen2-5-vl-7b-cloud-run-gpu-scale-to-zero-review.md");
const prompt = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-cloud-run-gpu-no-deploy-service-spec.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-cloud-run-gpu-scale-to-zero-review-change-log.md",
  "qwen2-5-vl-7b-cloud-run-gpu-scale-to-zero-review-change-log"
);
const spec = QWEN2_5_VL_CLOUD_RUN_GPU_SCALE_TO_ZERO_REVIEW;

includesAll(review, REQUIRED_REVIEW_PHRASES, "Cloud Run GPU review");
includesAll(prompt, [
  NEXT_PROMPT,
  "service name `reeditpro-qwen2-5-vl-l4-worker`",
  "region `us-central1`",
  "GPU type `nvidia-l4`",
  "min instances `0`",
  "max instances `1`",
  "concurrency `1`",
  "Do not deploy Cloud Run.",
  "Do not run inference.",
  "Do not claim `generated_local_fixture_passed`."
], "Cloud Run no-deploy service spec prompt");

includesAll(review, ["gcpReadOnlyCommandsExecuted=true"], "read-only runtime flag");
for (const flag of FALSE_FLAGS) {
  includesAll(review, [`${flag}=false`], `false runtime flag ${flag}`);
}

check(changeLog.decision === DECISION, "Change log decision mismatch");
check(changeLog.readOnlyGcpFindings?.cloudRunApiEnabled === true, "Cloud Run API must be enabled");
check(changeLog.readOnlyGcpFindings?.artifactRegistryApiEnabled === true, "Artifact Registry API must be enabled");
check(changeLog.readOnlyGcpFindings?.computeEngineApiEnabled === true, "Compute API must be enabled");
check(changeLog.readOnlyGcpFindings?.gcloudRunGpuFlagsVisible === true, "gcloud GPU flags must be visible");
check(changeLog.readOnlyGcpFindings?.existingQwenCloudRunServices === 0, "No existing Qwen service expected");
check(changeLog.readOnlyGcpFindings?.activeComputeReservations === 0, "No active reservations expected");
check(changeLog.cloudRunGpuFit?.preferredRegion === "us-central1", "Preferred region mismatch");
check(changeLog.cloudRunGpuFit?.secondaryRegion === "us-east4", "Secondary region mismatch");
check(changeLog.cloudRunGpuFit?.tertiaryRegion === "europe-west1", "Tertiary region mismatch");
check(changeLog.cloudRunGpuFit?.minInstances === 0, "Min instances must be zero");
check(changeLog.cloudRunGpuFit?.maxInstances === 1, "Max instances must be one");
check(changeLog.cloudRunGpuFit?.concurrency === 1, "Concurrency must be one");
check(changeLog.cloudRunGpuFit?.publicUnauthenticatedAccessAllowed === false, "Public unauth must be false");
check(changeLog.cloudRunGpuFit?.alwaysOnGpuRejected === true, "Always-on GPU must be rejected");
check(changeLog.nextPrompt === NEXT_PROMPT, "Next prompt mismatch");

check(spec.decision === DECISION, "Spec decision mismatch");
check(spec.preferredRuntime === "cloud_run_gpu_scale_to_zero", "Preferred runtime mismatch");
check(spec.fallbackRuntime === "ephemeral_compute_engine_l4_worker_idle_teardown", "Fallback runtime mismatch");
check(spec.officialCloudRunGpuEvidence.gpuServicesCanScaleToZero === true, "Scale-to-zero evidence missing");
check(spec.officialCloudRunGpuEvidence.onDemandNoReservationPath === true, "On-demand evidence missing");
check(spec.officialCloudRunGpuEvidence.l4MinimumCpu === 4, "L4 CPU minimum mismatch");
check(spec.officialCloudRunGpuEvidence.l4MinimumMemoryGiB === 16, "L4 memory minimum mismatch");
check(spec.serviceSpecSeed.serviceName === "reeditpro-qwen2-5-vl-l4-worker", "Service name mismatch");
check(spec.serviceSpecSeed.preferredRegion === "us-central1", "Spec preferred region mismatch");
check(spec.serviceSpecSeed.gpuType === "nvidia-l4", "Spec GPU type mismatch");
check(spec.serviceSpecSeed.minInstances === 0, "Spec min instances must be zero");
check(spec.serviceSpecSeed.maxInstances === 1, "Spec max instances must be one");
check(spec.serviceSpecSeed.concurrency === 1, "Spec concurrency must be one");
check(spec.serviceSpecSeed.publicUnauthenticatedAccessAllowed === false, "Spec public unauth must be false");
check(spec.nextPrompt === NEXT_PROMPT, "Spec next prompt mismatch");

for (const flag of FALSE_FLAGS) {
  check(spec.runtimeFlags?.[flag] === false, `Spec runtime flag ${flag} must be false`);
  check(changeLog.runtimeFlags?.[flag] === false, `Change log runtime flag ${flag} must be false`);
}

for (const file of [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-scale-to-zero-review.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-scale-to-zero-review-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-cloud-run-gpu-no-deploy-service-spec.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-scale-to-zero-review.ts"
]) {
  assertNoForbiddenText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  selectedGpu: spec.selectedGpu,
  preferredRuntime: spec.preferredRuntime,
  fallbackRuntime: spec.fallbackRuntime,
  preferredRegion: spec.serviceSpecSeed.preferredRegion,
  minInstances: spec.serviceSpecSeed.minInstances,
  maxInstances: spec.serviceSpecSeed.maxInstances,
  concurrency: spec.serviceSpecSeed.concurrency,
  cloudRunServiceCreated: false,
  modelInferenceRun: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
