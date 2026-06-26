#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { QWEN2_5_VL_CLOUD_RUN_GPU_QUOTA_PREFLIGHT } from "../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-quota-preflight.ts";

const ROOT = process.cwd();
const DECISION = "qwen2_5_vl_7b_cloud_run_gpu_quota_preflight_passed_ready_for_container_readiness_spec_no_deploy";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_14-CLOUD-RUN-GPU-CONTAINER-READINESS-SPEC: define Qwen Cloud Run container and model-cache readiness, no build/no deploy/no inference";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-quota-preflight-result.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-quota-preflight-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-cloud-run-gpu-container-readiness-spec.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-quota-preflight.ts",
  "scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-quota-preflight-diagnostics.mjs",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-service-spec.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-service-spec.ts",
  "package.json"
];

const REQUIRED_RESULT_PHRASES = [
  DECISION,
  "| Preferred region | `us-central1` |",
  "| Cloud Run API | enabled |",
  "| Artifact Registry API | enabled |",
  "| Compute Engine API | enabled |",
  "| Cloud Run L4 no-zonal-redundancy quota metric | `run.googleapis.com/nvidia_l4_gpu_allocation_no_zonal_redundancy` |",
  "| Cloud Run L4 no-zonal-redundancy quota ID | `NvidiaL4GpuAllocNoZonalRedundancyPerProjectRegion` |",
  "| `us-central1` no-zonal-redundancy quota value | `3` |",
  "| Proposed max instances | `1` |",
  "| Quota sufficient for proposed proof | yes |",
  "| Service name collision | absent for `reeditpro-qwen2-5-vl-l4-worker` in `us-central1` |",
  "| Artifact Registry repo | `reeditpro-workers` Docker repo exists in `us-central1` |",
  "| Candidate production worker service account | `sa-ai-video-asset-worker` present |",
  "| Candidate staging GPU worker service account | `reeditpro-stg-gpu-worker-sa` present |",
  "| Active Compute reservations | none |",
  "Cloud Run L4 no-zonal-redundancy path is ready for a no-build/no-deploy container readiness spec.",
  "No Qwen Cloud Run container image exists.",
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
  packageJson.scripts?.["qwen2-5-vl-7b-cloud-run-gpu-quota-preflight:diagnostics"] ===
    "tsx scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-quota-preflight-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-cloud-run-gpu-quota-preflight:diagnostics"
);

const result = read("docs/qwen2-5-vl-7b-cloud-run-gpu-quota-preflight-result.md");
const prompt = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-cloud-run-gpu-container-readiness-spec.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-cloud-run-gpu-quota-preflight-change-log.md",
  "qwen2-5-vl-7b-cloud-run-gpu-quota-preflight-change-log"
);
const spec = QWEN2_5_VL_CLOUD_RUN_GPU_QUOTA_PREFLIGHT;

includesAll(result, REQUIRED_RESULT_PHRASES, "Cloud Run quota preflight result");
includesAll(prompt, [
  NEXT_PROMPT,
  "Define the Qwen Cloud Run container and model-cache readiness spec",
  "Do not deploy Cloud Run.",
  "Do not build or push Docker images.",
  "Do not run inference.",
  "Do not claim `generated_local_fixture_passed`."
], "container readiness spec prompt");

includesAll(result, ["gcpReadOnlyCommandsExecuted=true"], "read-only runtime flag");
for (const flag of FALSE_FLAGS) {
  includesAll(result, [`${flag}=false`], `false runtime flag ${flag}`);
}

check(changeLog.decision === DECISION, "Change log decision mismatch");
check(changeLog.preflight?.preferredRegion === "us-central1", "Preferred region mismatch");
check(changeLog.preflight?.cloudRunApiEnabled === true, "Cloud Run API must be enabled");
check(changeLog.preflight?.artifactRegistryApiEnabled === true, "Artifact Registry API must be enabled");
check(changeLog.preflight?.usCentral1NoZonalRedundancyQuotaValue === 3, "Quota value mismatch");
check(changeLog.preflight?.proposedMaxInstances === 1, "Max instances mismatch");
check(changeLog.preflight?.quotaSufficientForProposedProof === true, "Quota must be sufficient");
check(changeLog.preflight?.serviceNameCollision === false, "Service name collision must be false");
check(changeLog.preflight?.artifactRegistryRepoPresent === true, "Artifact repo must be present");
check(changeLog.preflight?.activeComputeReservations === 0, "Active reservations must be zero");
check(changeLog.nextPrompt === NEXT_PROMPT, "Next prompt mismatch");

check(spec.decision === DECISION, "Spec decision mismatch");
check(spec.preflight.preferredRegion === "us-central1", "Spec preferred region mismatch");
check(spec.preflight.usCentral1NoZonalRedundancyQuotaValue === 3, "Spec quota value mismatch");
check(spec.preflight.proposedMaxInstances === 1, "Spec max instances mismatch");
check(spec.preflight.quotaSufficientForProposedProof === true, "Spec quota proof mismatch");
check(spec.preflight.serviceNameCollision === false, "Spec service collision mismatch");
check(spec.preflight.artifactRegistryRepoPresent === true, "Spec artifact repo mismatch");
check(spec.preflight.activeComputeReservations === 0, "Spec active reservations mismatch");
check(spec.serviceSpecCarryForward.minInstances === 0, "Carry-forward min instances must be zero");
check(spec.serviceSpecCarryForward.maxInstances === 1, "Carry-forward max instances must be one");
check(spec.nextPrompt === NEXT_PROMPT, "Spec next prompt mismatch");

for (const flag of FALSE_FLAGS) {
  check(spec.runtimeFlags?.[flag] === false, `Spec runtime flag ${flag} must be false`);
  check(changeLog.runtimeFlags?.[flag] === false, `Change log runtime flag ${flag} must be false`);
}

for (const file of [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-quota-preflight-result.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-quota-preflight-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-cloud-run-gpu-container-readiness-spec.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-quota-preflight.ts"
]) {
  assertNoForbiddenText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  preferredRegion: spec.preflight.preferredRegion,
  quotaMetric: spec.preflight.cloudRunL4NoZonalRedundancyQuotaMetric,
  quotaValue: spec.preflight.usCentral1NoZonalRedundancyQuotaValue,
  proposedMaxInstances: spec.preflight.proposedMaxInstances,
  quotaSufficientForProposedProof: spec.preflight.quotaSufficientForProposedProof,
  cloudRunServiceCreated: false,
  modelInferenceRun: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
