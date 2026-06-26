#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { QWEN2_5_VL_CLOUD_RUN_GPU_NO_DEPLOY_MOUNT_SPEC } from "../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-no-deploy-mount-spec.ts";

const ROOT = process.cwd();
const DECISION =
  "qwen2_5_vl_7b_cloud_run_gpu_no_deploy_mount_spec_ready_for_fail_closed_image_build";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_23-CLOUD-RUN-GPU-FAIL-CLOSED-IMAGE-BUILD: build and push the fail-closed Qwen Cloud Run image, no deploy/no inference";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-mount-spec.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-mount-spec-change-log.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-no-deploy-mount-spec.ts",
  "scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-mount-spec-diagnostics.mjs",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-verify.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-cache-mount-verify.ts",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-service-spec.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-dockerfile-source-spec.md",
  "docker/prod/qwen2-5-vl-cloud-run-gpu/Dockerfile",
  "server/workers/qwen2_5_vl_cloud_run_gpu/service.py",
  "package.json"
];

const REQUIRED_DOC_PHRASES = [
  DECISION,
  "No GPU instance or Cloud Run GPU service is running from this packet.",
  "| Runtime identity | `reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com` |",
  "| Object count | `16` |",
  "| Total bytes | `16595981281` |",
  "| Prefix-scoped read binding present | true |",
  "| Volume name | `qwen-model-cache` |",
  "| Volume type | `cloud-storage` |",
  "| Prefix strategy | mount only the approved Qwen2.5-VL revision prefix |",
  "| Mount option | `only-dir=model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/` |",
  "| Directory visibility option | `implicit-dirs` |",
  "| Mount path | `/models/qwen2.5-vl-7b-instruct` |",
  "| Read-only | true |",
  "| Request-time model download fallback | false |",
  "| Signed URL source fallback | false |",
  "| Public model source fallback | false |",
  "| Model baked into image | false |",
  "| Cloud Run mount created now | false |",
  "--add-volume=name=qwen-model-cache,type=cloud-storage,bucket=reeditpro-staging-reeditpro-generated-assets,readonly=true,mount-options=only-dir=model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/;implicit-dirs",
  "--add-volume-mount=volume=qwen-model-cache,mount-path=/models/qwen2.5-vl-7b-instruct",
  "QWEN_MODEL_CACHE_MOUNT=/models/qwen2.5-vl-7b-instruct",
  "minInstances=0",
  "maxInstances=1",
  "concurrency=1",
  NEXT_PROMPT
];

const TRUE_FLAGS = [
  "noDeployMountSpecCreated",
  "mountUsesCompletedPrivateCache",
  "mountUsesOnlyDir",
  "mountReadOnly",
  "runtimeIdentitySelected",
  "prefixScopedReadIamBindingRequired",
  "prefixScopedReadIamBindingPresent",
  "futureRuntimeReadProofRequired"
];

const FALSE_FLAGS = [
  "cloudRunVolumeMountCreated",
  "cloudRunDeployCommandExecuted",
  "cloudRunServiceCreated",
  "cloudRunJobCreated",
  "artifactRegistryImageCreated",
  "reservationCreated",
  "vmCreated",
  "dockerBuildRun",
  "dockerPushRun",
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
  ["public storage endpoint", /\bstorage\.googleapis\.com\//i],
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
  packageJson.scripts?.["qwen2-5-vl-7b-cloud-run-gpu-no-deploy-mount-spec:diagnostics"] ===
    "tsx scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-mount-spec-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-cloud-run-gpu-no-deploy-mount-spec:diagnostics"
);

const doc = read("docs/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-mount-spec.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-mount-spec-change-log.md",
  "qwen2-5-vl-7b-cloud-run-gpu-no-deploy-mount-spec-change-log"
);
const spec = QWEN2_5_VL_CLOUD_RUN_GPU_NO_DEPLOY_MOUNT_SPEC;

includesAll(doc, REQUIRED_DOC_PHRASES, "No-deploy mount spec doc");

check(spec.decision === DECISION, "Spec decision mismatch");
check(changeLog.decision === DECISION, "Change log decision mismatch");
check(spec.verifiedInputs.objectCount === 16, "Spec object count mismatch");
check(spec.verifiedInputs.totalBytes === 16595981281, "Spec total bytes mismatch");
check(spec.verifiedInputs.prefixScopedReadBindingPresent === true, "Spec IAM binding mismatch");
check(spec.mountSpec.volumeName === "qwen-model-cache", "Volume name mismatch");
check(spec.mountSpec.volumeType === "cloud-storage", "Volume type mismatch");
check(spec.mountSpec.bucket === "reeditpro-staging-reeditpro-generated-assets", "Bucket mismatch");
check(spec.mountSpec.mountPath === "/models/qwen2.5-vl-7b-instruct", "Mount path mismatch");
check(spec.mountSpec.onlyDir === "model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/", "only-dir mismatch");
check(spec.mountSpec.mountOptions.includes("implicit-dirs"), "implicit-dirs mount option missing");
check(spec.mountSpec.readOnly === true, "Mount must be read-only");
check(spec.mountSpec.requestTimeModelDownloadFallback === false, "Request-time download fallback must be false");
check(spec.mountSpec.signedUrlSourceFallback === false, "Signed URL fallback must be false");
check(spec.mountSpec.publicModelSourceFallback === false, "Public source fallback must be false");
check(spec.mountSpec.cloudRunMountCreatedNow === false, "Mount created now must be false");
check(spec.futureCommandShape.executableNow === false, "Future command must not be executable now");
check(spec.futureCommandShape.serviceAccount === "reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com", "Service account mismatch");
check(spec.futureCommandShape.noAllowUnauthenticated === true, "Unauthenticated access must be disabled");
check(spec.futureCommandShape.addVolume.includes("only-dir=model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/"), "add-volume only-dir missing");
check(spec.futureCommandShape.addVolumeMount === "volume=qwen-model-cache,mount-path=/models/qwen2.5-vl-7b-instruct", "add-volume-mount mismatch");
check(spec.environmentDefaults.QWEN_MODEL_CACHE_MOUNT === "/models/qwen2.5-vl-7b-instruct", "QWEN model mount env mismatch");
check(spec.environmentDefaults.QWEN_INFERENCE_ENABLED === "false", "Inference env must be false");
check(spec.environmentDefaults.QWEN_MODEL_IMPORT_ON_STARTUP === "false", "Import-on-startup env must be false");
check(spec.serviceCarryForward.minInstances === 0, "Min instances must be zero");
check(spec.serviceCarryForward.maxInstances === 1, "Max instances must be one");
check(spec.serviceCarryForward.concurrency === 1, "Concurrency must be one");
check(spec.serviceCarryForward.intendedScaleToZeroWhenIdle === true, "Scale-to-zero intent must be true");
check(spec.startupVerificationRequirements.healthCheckLoadsFullModel === false, "Health check must not load full model");
check(spec.nextPrompt === NEXT_PROMPT, "Spec next prompt mismatch");
check(changeLog.nextPrompt === NEXT_PROMPT, "Change log next prompt mismatch");
check(changeLog.mountSpec?.readOnly === true, "Change log read-only mismatch");
check(changeLog.mountSpec?.cloudRunMountCreatedNow === false, "Change log mount creation mismatch");

for (const flag of TRUE_FLAGS) {
  check(spec.runtimeFlags?.[flag] === true, `Spec runtime flag ${flag} must be true`);
  check(changeLog.runtimeFlags?.[flag] === true, `Change log runtime flag ${flag} must be true`);
}
for (const flag of FALSE_FLAGS) {
  check(spec.runtimeFlags?.[flag] === false, `Spec runtime flag ${flag} must be false`);
  check(changeLog.runtimeFlags?.[flag] === false, `Change log runtime flag ${flag} must be false`);
}

for (const file of [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-mount-spec.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-mount-spec-change-log.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-no-deploy-mount-spec.ts"
]) {
  assertNoForbiddenText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  volumeName: spec.mountSpec.volumeName,
  mountPath: spec.mountSpec.mountPath,
  onlyDir: spec.mountSpec.onlyDir,
  readOnly: spec.mountSpec.readOnly,
  minInstances: spec.serviceCarryForward.minInstances,
  maxInstances: spec.serviceCarryForward.maxInstances,
  cloudRunVolumeMountCreated: false,
  cloudRunDeployCommandExecuted: false,
  modelInferenceRun: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
