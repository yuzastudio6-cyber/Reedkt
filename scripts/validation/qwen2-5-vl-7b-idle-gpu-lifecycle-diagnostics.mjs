#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { QWEN2_5_VL_IDLE_GPU_LIFECYCLE } from "../../src/backend/mock/mock-qwen2-5-vl-idle-gpu-lifecycle.ts";

const ROOT = process.cwd();
const DECISION = "qwen2_5_vl_7b_idle_gpu_lifecycle_plan_ready_for_cloud_run_gpu_scale_to_zero_review";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_11-CLOUD-RUN-GPU-SCALE-TO-ZERO-REVIEW: evaluate Qwen Cloud Run GPU scale-to-zero fit, no deploy/no inference";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-idle-gpu-lifecycle-plan.md",
  "docs/qwen2-5-vl-7b-idle-gpu-lifecycle-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-cloud-run-gpu-scale-to-zero-review.md",
  "src/backend/mock/mock-qwen2-5-vl-idle-gpu-lifecycle.ts",
  "scripts/validation/qwen2-5-vl-7b-idle-gpu-lifecycle-diagnostics.mjs",
  "docs/qwen2-5-vl-7b-l4-reservation-create-us-east4-a-result.md",
  "docs/qwen2-5-vl-7b-stack-tool-integration.md",
  "model-routing-policy.md",
  "intent-led-edit-planning.md",
  "approved-plan-snapshot-policy.md",
  "editing-agent-execution-architecture.md",
  "async-edit-work-graph.md",
  "editing-asset-manifest.md",
  "pricing-and-credits.md",
  "package.json"
];

const REQUIRED_PLAN_PHRASES = [
  DECISION,
  "The model must run only when ReEditPro has approved queued work, then stop or scale to zero when idle.",
  "| Always-on GPU | rejected |",
  "| Long-held idle reservation | rejected as the default |",
  "| Preferred path | Cloud Run GPU scale-to-zero review |",
  "| Fallback path | ephemeral Compute Engine L4 worker with idle teardown |",
  "| First proof shape | `g2-standard-4` for import-smoke if accepted by the future proof |",
  "| Beta serving shape | `g2-standard-8` or Cloud Run GPU equivalent after cold-start and memory proof |",
  "min instances `0`",
  "max instances starts at `1`",
  "idle timeout of `600` seconds",
  "max runtime cap of `1800` seconds",
  "Qwen is a visual understanding, planning, and QA stack tool.",
  "| 8 | generated video creation | not owned by Qwen | Wan primary, Hailuo fallback, Veo Premium final fallback only |",
  "approved plan snapshot ID or explicit bounded proof scope",
  "no raw chat payload",
  "no signed URL source of truth",
  "no public artifact output",
  NEXT_PROMPT
];

const FALSE_FLAGS = [
  "gcpMutatingCommandsExecuted",
  "reservationCreated",
  "vmCreated",
  "cloudRunServiceCreated",
  "cloudRunJobCreated",
  "dockerBuildRun",
  "artifactRegistryImageCreated",
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
  packageJson.scripts?.["qwen2-5-vl-7b-idle-gpu-lifecycle:diagnostics"] ===
    "tsx scripts/validation/qwen2-5-vl-7b-idle-gpu-lifecycle-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-idle-gpu-lifecycle:diagnostics"
);

const plan = read("docs/qwen2-5-vl-7b-idle-gpu-lifecycle-plan.md");
const prompt = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-cloud-run-gpu-scale-to-zero-review.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-idle-gpu-lifecycle-change-log.md",
  "qwen2-5-vl-7b-idle-gpu-lifecycle-change-log"
);
const spec = QWEN2_5_VL_IDLE_GPU_LIFECYCLE;

includesAll(plan, REQUIRED_PLAN_PHRASES, "idle GPU lifecycle plan");
includesAll(prompt, [
  NEXT_PROMPT,
  "scale to zero when idle",
  "Do not deploy Cloud Run.",
  "Do not build or push Docker images.",
  "Do not run inference.",
  "Do not claim `generated_local_fixture_passed`."
], "Cloud Run GPU review prompt");

for (const flag of FALSE_FLAGS) {
  includesAll(plan, [`${flag}=false`], `false runtime flag ${flag}`);
}

check(changeLog.decision === DECISION, "Change log decision mismatch");
check(changeLog.lifecycleDecision?.selectedGpu === "nvidia_l4_google_cloud_g2", "Selected GPU mismatch");
check(changeLog.lifecycleDecision?.alwaysOnGpuRejected === true, "Always-on GPU must be rejected");
check(changeLog.lifecycleDecision?.longHeldIdleReservationRejected === true, "Long-held reservation must be rejected");
check(changeLog.lifecycleDecision?.runOnlyWhenQueuedRequired === true, "Run-only-when-queued must be required");
check(changeLog.lifecycleDecision?.stopWhenIdleRequired === true, "Stop-when-idle must be required");
check(changeLog.lifecycleDecision?.preferredPath === "cloud_run_gpu_scale_to_zero_review", "Preferred path mismatch");
check(changeLog.lifecycleDecision?.fallbackPath === "ephemeral_compute_engine_l4_worker_idle_teardown", "Fallback path mismatch");
check(changeLog.lifecycleDecision?.minActiveGpuWorkers === 0, "Min active workers must be zero");
check(changeLog.lifecycleDecision?.maxActiveGpuWorkers === 1, "Max active workers must start at one");
check(changeLog.lifecycleDecision?.proofIdleTimeoutSeconds === 600, "Proof idle timeout mismatch");
check(changeLog.lifecycleDecision?.proofMaxRuntimeSeconds === 1800, "Proof max runtime mismatch");
check(changeLog.toolRole?.generatedVideoRoute === false, "Qwen must not be generated-video route");
check(changeLog.toolRole?.wanRemainsGeneratedBrollPrimary === true, "Wan must remain generated B-roll primary");
check(changeLog.toolRole?.rawChatExecutionRejected === true, "Raw chat execution must be rejected");
check(changeLog.toolRole?.approvedSnapshotRequired === true, "Approved snapshot must be required");
check(changeLog.nextPrompt === NEXT_PROMPT, "Next prompt mismatch");

check(spec.decision === DECISION, "Spec decision mismatch");
check(spec.selectedGpu === "nvidia_l4_google_cloud_g2", "Spec selected GPU mismatch");
check(spec.lifecycle.alwaysOnGpuRejected === true, "Spec must reject always-on GPU");
check(spec.lifecycle.runOnlyWhenQueuedRequired === true, "Spec must require queued use");
check(spec.lifecycle.stopWhenIdleRequired === true, "Spec must require idle stop");
check(spec.lifecycle.minActiveGpuWorkers === 0, "Spec min active workers must be zero");
check(spec.lifecycle.maxActiveGpuWorkers === 1, "Spec max active workers must be one");
check(spec.lifecycle.proofIdleTimeoutSeconds === 600, "Spec idle timeout mismatch");
check(spec.lifecycle.proofMaxRuntimeSeconds === 1800, "Spec max runtime mismatch");
check(spec.gpuShapeRanking[0]?.shape === "cloud_run_gpu_nvidia_l4", "Cloud Run GPU must rank first");
check(spec.gpuShapeRanking[1]?.shape === "g2-standard-4+nvidia-l4", "g2-standard-4 must rank second for import smoke");
check(spec.gpuShapeRanking[2]?.shape === "g2-standard-8+nvidia-l4", "g2-standard-8 must rank third for beta candidate");
check(spec.toolCallRanking.at(-1)?.qwenRoute === "not_allowed", "Generated video route must be not allowed");
check(spec.workItemContract.approvedPlanSnapshotRequired === true, "Approved snapshot required mismatch");
check(spec.workItemContract.rawChatExecutionRejected === true, "Raw chat rejection mismatch");
check(spec.costControls.idleGpuBillingTarget === "zero", "Idle billing target must be zero");
check(spec.nextPrompt === NEXT_PROMPT, "Spec next prompt mismatch");

for (const flag of FALSE_FLAGS) {
  check(spec.runtimeFlags?.[flag] === false, `Spec runtime flag ${flag} must be false`);
  check(changeLog.runtimeFlags?.[flag] === false, `Change log runtime flag ${flag} must be false`);
}

for (const file of [
  "docs/qwen2-5-vl-7b-idle-gpu-lifecycle-plan.md",
  "docs/qwen2-5-vl-7b-idle-gpu-lifecycle-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-cloud-run-gpu-scale-to-zero-review.md",
  "src/backend/mock/mock-qwen2-5-vl-idle-gpu-lifecycle.ts"
]) {
  assertNoForbiddenText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  selectedGpu: spec.selectedGpu,
  alwaysOnGpuRejected: true,
  runOnlyWhenQueuedRequired: true,
  stopWhenIdleRequired: true,
  preferredPath: spec.lifecycle.preferredPath,
  fallbackPath: spec.lifecycle.fallbackPath,
  minActiveGpuWorkers: spec.lifecycle.minActiveGpuWorkers,
  maxActiveGpuWorkers: spec.lifecycle.maxActiveGpuWorkers,
  modelInferenceRun: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
