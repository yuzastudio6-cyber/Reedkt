#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT } from "../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-runtime-contract.ts";

const ROOT = process.cwd();
const DECISION = "qwen2_5_vl_7b_cloud_run_gpu_approved_snapshot_runtime_contract_defined_no_inference";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_31-CLOUD-RUN-GPU-APPROVED-SNAPSHOT-CONTRACT-SMOKE: run local contract handler smoke for valid/invalid request fixtures, no inference";
const SCHEMA_VERSION = "qwen2_5_vl_cloud_run_gpu_runtime_request_v1";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-runtime-contract.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-runtime-contract-change-log.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-runtime-contract.ts",
  "scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-runtime-contract-diagnostics.mjs",
  "server/workers/qwen2_5_vl_cloud_run_gpu/service.py",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-vllm-engine-proof-result.md",
  "approved-plan-snapshot-policy.md",
  "model-routing-policy.md",
  "intent-led-edit-planning.md",
  "package.json"
];

const REQUIRED_DOC_PHRASES = [
  DECISION,
  SCHEMA_VERSION,
  "Raw chat must never become a worker input.",
  "structured agent findings",
  "edit intents",
  "approved plan snapshot",
  "queue lease / worker contract",
  "bounded Qwen runtime request",
  "| Max request bytes | `65536` |",
  "| Service contract endpoint | `/contract` |",
  "| POST execution allowed | false |",
  "`sourceOfTruthRefs.supabaseRowRefs`",
  "`sourceOfTruthRefs.privateManifestRefs`",
  "`sourceOfTruthRefs.checksumRefs`",
  "`sourceOfTruthRefs.approvedPlanSnapshotRefs`",
  "`visual_understanding`",
  "`broll_candidate_review`",
  "`frame_asset_qa`",
  "`caption_visual_consistency_qa`",
  "| Model ID | `Qwen/Qwen2.5-VL-7B-Instruct` |",
  "| Runtime | `vllm` |",
  "| GPU | `nvidia-l4` |",
  "| Serving profile | `bounded_preview_scale_to_zero` |",
  "`rawVlmPromptAllowed=false`",
  "`providerExecutionAllowed=false`",
  "`mediaProcessingAllowed=false`",
  "`publicOutputAllowed=false`",
  "`trackAExecutionAllowed=false`",
  "`modelInferenceEnabled=false`",
  "`qwen_runtime_contract_rejected`",
  "`qwen_inference_disabled_after_contract_check`",
  "`contractValidRequestStillExecutes=false`",
  "`serviceRuntimeRequestSent=false`",
  "`generatedLocalFixturePassedClaimed=false`",
  NEXT_PROMPT
];

const SERVICE_REQUIRED_PHRASES = [
  `RUNTIME_CONTRACT_SCHEMA_VERSION = "${SCHEMA_VERSION}"`,
  "MAX_REQUEST_BYTES = 65536",
  "REQUIRED_RUNTIME_REQUEST_FIELDS",
  "sourceOfTruthRequired",
  "allowedTaskUseCases",
  "runtimeGatesRequired",
  "validate_runtime_request",
  "_scan_for_raw_prompt_fields",
  "if self.path == \"/contract\"",
  "qwen_runtime_contract_rejected",
  "qwen_inference_disabled_after_contract_check",
  "runtimeContractExecutesNow"
];

const REQUIRED_FIELDS = [
  "schemaVersion",
  "requestId",
  "approvedPlanSnapshotId",
  "approvedPlanSnapshotHash",
  "approvalRecordId",
  "creditReservationId",
  "jobId",
  "queueLease",
  "idempotencyKey",
  "sourceOfTruthRefs",
  "modelPolicy",
  "runtimeGates",
  "task"
];

const TRUE_FLAGS = [
  "runtimeContractDefined",
  "runtimeContractEndpointAdded",
  "postBodyBounded",
  "approvedSnapshotRequired",
  "queueLeaseRequired",
  "idempotencyKeyRequired",
  "creditReservationRequired",
  "sourceOfTruthRefsRequired",
  "rawPromptFieldsRejected"
];

const FALSE_FLAGS = [
  "contractValidRequestStillExecutes",
  "modelImportOnStartup",
  "modelInferenceEnabled",
  "forwardPassRun",
  "promptProcessed",
  "inferenceRun",
  "serviceRuntimeRequestSent",
  "providerCallsMade",
  "workersDispatched",
  "supabaseTouched",
  "sqlExecuted",
  "generatedAssetsCreated",
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
  ["public storage endpoint", /\bstorage\.googleapis\.com\//i],
  ["inference true claim", /\b(inferenceRun|forwardPassRun|promptProcessed|modelInferenceEnabled)\b\s*[:=]\s*(true|"true")/i],
  ["service request true claim", /\b(serviceRuntimeRequestSent|apiServerInvoked)\b\s*[:=]\s*(true|"true")/i],
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
  packageJson.scripts?.["qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-runtime-contract:diagnostics"] ===
    "tsx scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-runtime-contract-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-runtime-contract:diagnostics"
);

const doc = read("docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-runtime-contract.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-runtime-contract-change-log.md",
  "qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-runtime-contract-change-log"
);
const service = read("server/workers/qwen2_5_vl_cloud_run_gpu/service.py");
const spec = QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT;

includesAll(doc, REQUIRED_DOC_PHRASES, "approved snapshot runtime contract doc");
includesAll(service, SERVICE_REQUIRED_PHRASES, "qwen service contract implementation");

check(changeLog.decision === DECISION, "Change log decision mismatch");
check(spec.decision === DECISION, "Spec decision mismatch");
check(spec.contract.schemaVersion === SCHEMA_VERSION, "Schema version mismatch");
check(spec.contract.postExecutionAllowed === false, "POST execution must stay blocked");
check(spec.contract.maxRequestBytes === 65536, "Max request bytes mismatch");
check(spec.contract.contractEndpoint === "/contract", "Contract endpoint mismatch");
check(spec.serviceBehavior.contractInvalidPostStatus === 403, "Invalid contract status mismatch");
check(spec.serviceBehavior.contractValidPostStatus === 403, "Valid contract status mismatch");
check(spec.serviceBehavior.contractValidPostReason === "qwen_inference_disabled_after_contract_check", "Valid contract reason mismatch");
check(spec.serviceBehavior.contractInvalidPostReason === "qwen_runtime_contract_rejected", "Invalid contract reason mismatch");
check(spec.nextPrompt === NEXT_PROMPT, "Spec next prompt mismatch");
check(changeLog.nextPrompt === NEXT_PROMPT, "Change log next prompt mismatch");

for (const field of REQUIRED_FIELDS) {
  check(spec.requiredRequestFields.includes(field), `Spec missing required field ${field}`);
  check(changeLog.requiredRequestFields.includes(field), `Change log missing required field ${field}`);
  check(service.includes(`"${field}"`), `Service missing required field ${field}`);
}

for (const field of spec.sourceOfTruthRequired) {
  check(changeLog.sourceOfTruthRequired.includes(field), `Change log missing source-of-truth field ${field}`);
  check(service.includes(`"${field}"`), `Service missing source-of-truth field ${field}`);
}

for (const useCase of spec.allowedTaskUseCases) {
  check(changeLog.allowedTaskUseCases.includes(useCase), `Change log missing use case ${useCase}`);
  check(service.includes(`"${useCase}"`), `Service missing use case ${useCase}`);
}

for (const field of spec.blockedPayloadFields) {
  check(changeLog.blockedPayloadFields.includes(field), `Change log missing blocked field ${field}`);
  check(service.includes(`"${field}"`), `Service missing blocked field ${field}`);
}

for (const flag of TRUE_FLAGS) {
  check(spec.runtimeFlags?.[flag] === true, `Spec runtime flag ${flag} must be true`);
  check(changeLog.runtimeFlags?.[flag] === true, `Change log runtime flag ${flag} must be true`);
}
for (const flag of FALSE_FLAGS) {
  check(spec.runtimeFlags?.[flag] === false, `Spec runtime flag ${flag} must be false`);
  check(changeLog.runtimeFlags?.[flag] === false, `Change log runtime flag ${flag} must be false`);
}

for (const [gate, value] of Object.entries(spec.runtimeGatesRequired)) {
  check(value === false, `Runtime gate ${gate} must be false`);
  check(changeLog.runtimeGatesRequired?.[gate] === false, `Change log runtime gate ${gate} must be false`);
}

for (const file of [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-runtime-contract.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-runtime-contract-change-log.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-runtime-contract.ts",
  "server/workers/qwen2_5_vl_cloud_run_gpu/service.py"
]) {
  assertNoForbiddenText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  schemaVersion: spec.contract.schemaVersion,
  requiredRequestFieldCount: spec.requiredRequestFields.length,
  sourceOfTruthRequired: spec.sourceOfTruthRequired,
  allowedTaskUseCases: spec.allowedTaskUseCases,
  contractValidPostStatus: spec.serviceBehavior.contractValidPostStatus,
  contractValidRequestStillExecutes: spec.runtimeFlags.contractValidRequestStillExecutes,
  inferenceRun: spec.runtimeFlags.inferenceRun,
  serviceRuntimeRequestSent: spec.runtimeFlags.serviceRuntimeRequestSent,
  nextPrompt: NEXT_PROMPT
}, null, 2));
