#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_DEPLOY_RESULT } from "../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-fail-closed-deploy-result.ts";

const ROOT = process.cwd();
const DECISION =
  "qwen2_5_vl_7b_cloud_run_gpu_fail_closed_service_deployed_no_model_import_no_inference";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_25-CLOUD-RUN-GPU-PRIVATE-MOUNT-READ-PROOF: verify fail-closed Cloud Run service mount/readiness, no model import/no inference";
const IMAGE_DIGEST = "sha256:572acc29405cee48a42baf98f39d949915b8ef14df638736b886673efc47b630";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-deploy-result.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-deploy-result-change-log.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-image-build-result.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-mount-spec.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-fail-closed-deploy-result.ts",
  "scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-deploy-result-diagnostics.mjs",
  "package.json"
];

const REQUIRED_DOC_PHRASES = [
  DECISION,
  "| Service | `reeditpro-qwen2-5-vl-l4-worker` |",
  "| Revision | `reeditpro-qwen2-5-vl-l4-worker-00001-t88` |",
  "| Operation ID | `ab759df5-4fe9-4a33-bbe7-e0c0963b8bbe` |",
  `| Image digest | \`${IMAGE_DIGEST}\` |`,
  "| GPU | `1` x `nvidia-l4` |",
  "| Min instances | `0` |",
  "| Max instances | `1` |",
  "| Deploy health check | disabled |",
  "| Public unauthenticated access | disabled |",
  "| Ingress | `internal-and-cloud-load-balancing` |",
  "| Service ready | true |",
  "| Revision deploy duration | `7m13.87s` |",
  "| Container image import duration | `7m11.18s` |",
  "| Read-only | true |",
  "| `allUsers` invoker binding | false |",
  "| Runtime request sent by this prompt | false |",
  "`QWEN_MODEL_IMPORT_ON_STARTUP=false`",
  "`QWEN_INFERENCE_ENABLED=false`",
  "`cloudRunDeployCommandExecuted=true`",
  "`cloudRunServiceCreated=true`",
  "`cloudRunVolumeMountCreated=true`",
  "`runtimeRequestSent=false`",
  "`modelInferenceRun=false`",
  "`generatedLocalFixturePassedClaimed=false`",
  NEXT_PROMPT
];

const TRUE_FLAGS = [
  "cloudRunDeployCommandExecuted",
  "cloudRunServiceCreated",
  "cloudRunRevisionReady",
  "cloudRunVolumeMountCreated",
  "artifactRegistryImageCreated",
  "minInstancesZero",
  "maxInstancesOne",
  "deployHealthCheckDisabled"
];

const FALSE_FLAGS = [
  "publicUnauthenticatedAccessAllowed",
  "ingressAllAllowed",
  "runtimeRequestSent",
  "modelImportRun",
  "modelLoadRun",
  "modelInferenceRun",
  "apiServerInvoked",
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
  packageJson.scripts?.["qwen2-5-vl-7b-cloud-run-gpu-fail-closed-deploy-result:diagnostics"] ===
    "tsx scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-deploy-result-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-cloud-run-gpu-fail-closed-deploy-result:diagnostics"
);

const doc = read("docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-deploy-result.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-deploy-result-change-log.md",
  "qwen2-5-vl-7b-cloud-run-gpu-fail-closed-deploy-result-change-log"
);
const spec = QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_DEPLOY_RESULT;

includesAll(doc, REQUIRED_DOC_PHRASES, "deploy result doc");

check(changeLog.decision === DECISION, "Change log decision mismatch");
check(changeLog.service.ready === true, "Service must be ready");
check(changeLog.service.name === "reeditpro-qwen2-5-vl-l4-worker", "Service name mismatch");
check(changeLog.service.revision === "reeditpro-qwen2-5-vl-l4-worker-00001-t88", "Revision mismatch");
check(changeLog.service.serviceUrlPresent === true, "Service URL presence must be recorded");
check(changeLog.service.serviceUrlRedactedInRepoEvidence === true, "Service URL must be redacted in repo evidence");
check(changeLog.image.digest === IMAGE_DIGEST, "Image digest mismatch");
check(changeLog.revisionReadiness.revisionReady === true, "Revision must be ready");
check(changeLog.runtimeShape.minInstances === 0, "Min instances must be zero");
check(changeLog.runtimeShape.maxInstances === 1, "Max instances must be one");
check(changeLog.runtimeShape.gpuType === "nvidia-l4", "GPU type mismatch");
check(changeLog.runtimeShape.publicUnauthenticatedAccessAllowed === false, "Public unauth access must be false");
check(changeLog.mount.readOnly === true, "Mount must be read-only");
check(changeLog.mount.runtimeDataPlaneReadProofStillRequired === true, "Runtime read proof must remain required");
check(changeLog.iam.policyBindingsPresent === false, "IAM bindings must be absent");
check(changeLog.iam.allUsersInvokerBindingPresent === false, "allUsers binding must be absent");
for (const flag of TRUE_FLAGS) {
  check(changeLog.runtimeFlags?.[flag] === true, `Change log runtime flag ${flag} must be true`);
}
for (const flag of FALSE_FLAGS) {
  check(changeLog.runtimeFlags?.[flag] === false, `Change log runtime flag ${flag} must be false`);
}
check(changeLog.nextPrompt === NEXT_PROMPT, "Change log next prompt mismatch");

check(spec.decision === DECISION, "Spec decision mismatch");
check(spec.service.ready === true, "Spec service ready mismatch");
check(spec.service.revision === "reeditpro-qwen2-5-vl-l4-worker-00001-t88", "Spec revision mismatch");
check(spec.service.serviceUrlRedactedInRepoEvidence === true, "Spec URL redaction mismatch");
check(spec.image.digest === IMAGE_DIGEST, "Spec image digest mismatch");
check(spec.runtimeShape.minInstances === 0, "Spec min instances must be zero");
check(spec.runtimeShape.maxInstances === 1, "Spec max instances must be one");
check(spec.runtimeShape.ingress === "internal-and-cloud-load-balancing", "Spec ingress mismatch");
check(spec.mount.readOnly === true, "Spec mount must be read-only");
check(spec.mount.runtimeDataPlaneReadProofStillRequired === true, "Spec read proof requirement mismatch");
check(spec.failClosedEnvironment.QWEN_MODEL_IMPORT_ON_STARTUP === "false", "Import on startup must remain false");
check(spec.failClosedEnvironment.QWEN_INFERENCE_ENABLED === "false", "Inference must remain disabled");
check(spec.iam.policyBindingsPresent === false, "Spec IAM bindings must be absent");
for (const flag of TRUE_FLAGS) {
  check(spec.runtimeFlags?.[flag] === true, `Spec runtime flag ${flag} must be true`);
}
for (const flag of FALSE_FLAGS) {
  check(spec.runtimeFlags?.[flag] === false, `Spec runtime flag ${flag} must be false`);
}
check(spec.nextPrompt === NEXT_PROMPT, "Spec next prompt mismatch");

for (const file of [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-deploy-result.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-deploy-result-change-log.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-fail-closed-deploy-result.ts"
]) {
  scanText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  service: spec.service.name,
  revision: spec.service.revision,
  ready: spec.service.ready,
  minInstances: spec.runtimeShape.minInstances,
  maxInstances: spec.runtimeShape.maxInstances,
  cloudRunDeployCommandExecuted: spec.runtimeFlags.cloudRunDeployCommandExecuted,
  runtimeRequestSent: spec.runtimeFlags.runtimeRequestSent,
  modelInferenceRun: spec.runtimeFlags.modelInferenceRun,
  nextPrompt: NEXT_PROMPT
}, null, 2));
