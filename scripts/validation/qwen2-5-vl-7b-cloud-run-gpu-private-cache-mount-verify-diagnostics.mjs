#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_CACHE_MOUNT_VERIFY } from "../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-cache-mount-verify.ts";

const ROOT = process.cwd();
const DECISION =
  "qwen2_5_vl_7b_cloud_run_gpu_private_cache_mount_verified_for_no_deploy_mount_spec";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_22-CLOUD-RUN-GPU-NO-DEPLOY-MOUNT-SPEC: author Cloud Run service revision mount/IAM spec with completed private cache, no deploy/no inference";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-verify.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-verify-change-log.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-cache-mount-verify.ts",
  "scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-verify-diagnostics.mjs",
  "docs/qwen2-5-vl-7b-storage-transfer-url-list-result.md",
  "src/backend/mock/mock-qwen2-5-vl-storage-transfer-url-list-result.ts",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-review.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-no-deploy-service-spec.md",
  "package.json"
];

const REQUIRED_DOC_PHRASES = [
  DECISION,
  "No GPU instance or Cloud Run GPU service is running from this packet.",
  "| Final prefix object count | `16` |",
  "| Final prefix total bytes | `16595981281` |",
  "| Expected aggregate SHA-256 | `46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b` |",
  "| Runtime identity | `reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com` |",
  "| IAM role | `roles/storage.objectViewer` |",
  "| IAM condition title | `qwen25vl_model_read` |",
  "| Service-account key file created | false |",
  "| Public principal granted | false |",
  "| Broad storage admin granted | false |",
  "| TokenCreator granted for probe | false |",
  "| Object metadata read as active operator | passed |",
  "| Final prefix inventory as active operator | passed |",
  "| Qwen Cloud Run service found | false |",
  "| Impersonated object read as runtime identity | not run to data plane |",
  "| Policy Troubleshooter membership matched | true |",
  "| Policy Troubleshooter role permission included | true |",
  "| Policy Troubleshooter condition granted | false in tool context |",
  "| Qwen Cloud Run service exists | false |",
  "| Cloud Run volume mount created now | false |",
  "| Cloud Run deploy command executed | false |",
  "| Cloud Run job created | false |",
  "| Artifact Registry image created | false |",
  "minInstances=0",
  "maxInstances=1",
  "concurrency=1",
  NEXT_PROMPT
];

const TRUE_FLAGS = [
  "privateCacheMountVerifyCreated",
  "finalPrivateCacheVerified",
  "prefixScopedReadIamBindingPresent",
  "runtimeIdentitySelected",
  "currentUserObjectMetadataRead",
  "currentUserPrefixInventoryRead",
  "cloudRunServiceAbsenceVerified",
  "impersonatedRuntimeReadBlockedByTokenCreator",
  "policyTroubleshooterMembershipMatched",
  "policyTroubleshooterRolePermissionIncluded"
];

const FALSE_FLAGS = [
  "impersonatedRuntimeReadPassed",
  "policyTroubleshooterConditionGranted",
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
  packageJson.scripts?.["qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-verify:diagnostics"] ===
    "tsx scripts/validation/qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-verify-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-verify:diagnostics"
);

const doc = read("docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-verify.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-verify-change-log.md",
  "qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-verify-change-log"
);
const spec = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_CACHE_MOUNT_VERIFY;

includesAll(doc, REQUIRED_DOC_PHRASES, "Private cache mount verify doc");

check(spec.decision === DECISION, "Spec decision mismatch");
check(changeLog.decision === DECISION, "Change log decision mismatch");
check(spec.verifiedPrivateCache.objectCount === 16, "Spec object count mismatch");
check(spec.verifiedPrivateCache.totalBytes === 16595981281, "Spec total bytes mismatch");
check(spec.verifiedPrivateCache.expectedAggregateSha256 === "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b", "Spec aggregate sha mismatch");
check(spec.verifiedPrivateCache.cloudAggregateSha256RecomputedNow === false, "Cloud sha recompute flag must be false");
check(spec.runtimeIdentityAndIam.runtimeIdentity === "reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com", "Runtime identity mismatch");
check(spec.runtimeIdentityAndIam.iamRole === "roles/storage.objectViewer", "IAM role mismatch");
check(spec.runtimeIdentityAndIam.iamConditionTitle === "qwen25vl_model_read", "IAM condition title mismatch");
check(spec.runtimeIdentityAndIam.prefixScopedReadIamBindingPresent === true, "Prefix scoped IAM binding must be present");
check(spec.runtimeIdentityAndIam.serviceAccountKeyFileCreated === false, "Service account key flag must be false");
check(spec.readPathProbe.impersonatedRuntimeReadPassed === false, "Impersonated runtime read must be false");
check(spec.readPathProbe.impersonatedRuntimeReadBlockedByTokenCreator === true, "TokenCreator blocker must be true");
check(spec.readPathProbe.policyTroubleshooterMembershipMatched === true, "Troubleshooter membership mismatch");
check(spec.readPathProbe.policyTroubleshooterRolePermissionIncluded === true, "Troubleshooter role permission mismatch");
check(spec.readPathProbe.policyTroubleshooterConditionGranted === false, "Troubleshooter condition must be false");
check(spec.cloudRunState.qwenCloudRunServiceExists === false, "Qwen service existence must be false");
check(spec.serviceCarryForward.minInstances === 0, "Min instances must be zero");
check(spec.serviceCarryForward.maxInstances === 1, "Max instances must be one");
check(spec.serviceCarryForward.concurrency === 1, "Concurrency must be one");
check(spec.serviceCarryForward.intendedScaleToZeroWhenIdle === true, "Scale-to-zero intent must be true");
check(spec.nextPrompt === NEXT_PROMPT, "Spec next prompt mismatch");
check(changeLog.nextPrompt === NEXT_PROMPT, "Change log next prompt mismatch");
check(changeLog.verifiedPrivateCache?.objectCount === 16, "Change log object count mismatch");
check(changeLog.verifiedPrivateCache?.totalBytes === 16595981281, "Change log total bytes mismatch");
check(changeLog.runtimeIdentityAndIam?.prefixScopedReadIamBindingPresent === true, "Change log IAM binding mismatch");
check(changeLog.readPathProbe?.impersonatedRuntimeReadBlockedByTokenCreator === true, "Change log TokenCreator blocker mismatch");
check(changeLog.cloudRunState?.qwenCloudRunServiceExists === false, "Change log service existence mismatch");

for (const flag of TRUE_FLAGS) {
  check(spec.runtimeFlags?.[flag] === true, `Spec runtime flag ${flag} must be true`);
  check(changeLog.runtimeFlags?.[flag] === true, `Change log runtime flag ${flag} must be true`);
}
for (const flag of FALSE_FLAGS) {
  check(spec.runtimeFlags?.[flag] === false, `Spec runtime flag ${flag} must be false`);
  check(changeLog.runtimeFlags?.[flag] === false, `Change log runtime flag ${flag} must be false`);
}

for (const file of [
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-verify.md",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-mount-verify-change-log.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-cache-mount-verify.ts"
]) {
  assertNoForbiddenText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  objectCount: spec.verifiedPrivateCache.objectCount,
  totalBytes: spec.verifiedPrivateCache.totalBytes,
  prefixScopedReadIamBindingPresent: true,
  qwenCloudRunServiceExists: false,
  cloudRunVolumeMountCreated: false,
  cloudRunDeployCommandExecuted: false,
  modelInferenceRun: false,
  intendedScaleToZeroWhenIdle: true,
  nextPrompt: NEXT_PROMPT
}, null, 2));
