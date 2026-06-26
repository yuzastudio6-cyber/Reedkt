#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { QWEN2_5_VL_STORAGE_TRANSFER_URL_LIST_RESULT } from "../../src/backend/mock/mock-qwen2-5-vl-storage-transfer-url-list-result.ts";

const ROOT = process.cwd();
const DECISION =
  "qwen2_5_vl_7b_storage_transfer_url_list_completed_private_cache_no_deploy_no_inference";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_21-CLOUD-RUN-GPU-PRIVATE-CACHE-MOUNT-VERIFY: verify completed private GCS model cache mount/read path, no deploy/no inference";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-storage-transfer-url-list-result.md",
  "docs/qwen2-5-vl-7b-storage-transfer-url-list-result-change-log.md",
  "src/backend/mock/mock-qwen2-5-vl-storage-transfer-url-list-result.ts",
  "scripts/validation/qwen2-5-vl-7b-storage-transfer-url-list-result-diagnostics.mjs",
  "docs/qwen2-5-vl-7b-cloud-run-gpu-private-cache-upload-fix.md",
  "src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-private-cache-upload-fix.ts",
  "package.json"
];

const EXPECTED_OBJECTS = [
  [".gitattributes", 1519],
  ["README.md", 18574],
  ["chat_template.json", 1050],
  ["config.json", 1374],
  ["generation_config.json", 216],
  ["merges.txt", 1671839],
  ["model-00001-of-00005.safetensors", 3900233256],
  ["model-00002-of-00005.safetensors", 3864726320],
  ["model-00003-of-00005.safetensors", 3864726424],
  ["model-00004-of-00005.safetensors", 3864733680],
  ["model-00005-of-00005.safetensors", 1089994880],
  ["model.safetensors.index.json", 57619],
  ["preprocessor_config.json", 350],
  ["tokenizer.json", 7031645],
  ["tokenizer_config.json", 5702],
  ["vocab.json", 2776833]
];

const REQUIRED_DOC_PHRASES = [
  DECISION,
  "No GPU instance or Cloud Run GPU service is running from this packet.",
  "| Storage Transfer API enabled | true |",
  "| Temporary bucket-level object creator removed | true |",
  "| Test result | success |",
  "| Operation status | `SUCCESS` |",
  "| Source objects found | `16` |",
  "| Objects copied to staging | `16` |",
  "| Bytes copied to staging | `16595981281` |",
  "| Final prefix object count | `16` |",
  "| Final prefix total bytes | `16595981281` |",
  "| Full transfer job status after cleanup | `DELETED` |",
  "`remoteAggregateSha256Recomputed=false`",
  "`cloudRunDeployCommandExecuted=false`",
  "`modelInferenceRun=false`",
  "`supabaseTouched=false`",
  NEXT_PROMPT
];

const TRUE_FLAGS = [
  "storageTransferUrlListResultCreated",
  "storageTransferApiEnabled",
  "storageTransferServiceAgentConfigured",
  "temporaryStorageTransferObjectCreatorCreated",
  "temporaryStorageTransferObjectCreatorRemoved",
  "urlListObjectCreated",
  "urlListObjectCleanedUp",
  "storageTransferNamingTestRun",
  "storageTransferNamingTestPassed",
  "storageTransferFullJobCreated",
  "storageTransferFullJobRun",
  "storageTransferFullJobPassed",
  "storageTransferFullJobDeleted",
  "cloudToCloudFinalPrefixCopyRun",
  "temporaryTransferStagingObjectsCleanedUp",
  "gcsObjectUploadComplete",
  "remoteByteSizeManifestMatched"
];

const FALSE_FLAGS = [
  "remoteAggregateSha256Recomputed",
  "cloudRunVolumeMountCreated",
  "cloudRunDeployCommandExecuted",
  "cloudRunServiceCreated",
  "cloudRunJobCreated",
  "artifactRegistryImageCreated",
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
  packageJson.scripts?.["qwen2-5-vl-7b-storage-transfer-url-list-result:diagnostics"] ===
    "tsx scripts/validation/qwen2-5-vl-7b-storage-transfer-url-list-result-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-storage-transfer-url-list-result:diagnostics"
);

const doc = read("docs/qwen2-5-vl-7b-storage-transfer-url-list-result.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-storage-transfer-url-list-result-change-log.md",
  "qwen2-5-vl-7b-storage-transfer-url-list-result-change-log"
);
const spec = QWEN2_5_VL_STORAGE_TRANSFER_URL_LIST_RESULT;

includesAll(doc, REQUIRED_DOC_PHRASES, "Storage Transfer URL-list result doc");
includesAll(
  doc,
  EXPECTED_OBJECTS.map(([name]) => `| \`${name}\``),
  "Final inventory"
);

check(spec.decision === DECISION, "Spec decision mismatch");
check(changeLog.decision === DECISION, "Change log decision mismatch");
check(spec.finalPrivateCache.objectCount === 16, "Spec final object count mismatch");
check(spec.finalPrivateCache.totalBytes === 16595981281, "Spec final total bytes mismatch");
check(spec.finalPrivateCache.byteSizeManifestMatched === true, "Spec byte manifest flag mismatch");
check(spec.finalPrivateCache.readyForMountReview === true, "Spec mount review readiness mismatch");
check(spec.finalPrivateCache.readyForModelImport === false, "Spec import readiness must be false");
check(spec.finalPrivateCache.readyForInference === false, "Spec inference readiness must be false");
check(changeLog.finalPrivateCache?.objectCount === 16, "Change log final object count mismatch");
check(changeLog.finalPrivateCache?.totalBytes === 16595981281, "Change log final total bytes mismatch");
check(changeLog.fullTransfer?.status === "SUCCESS", "Change log full transfer must be success");
check(changeLog.fullTransfer?.jobStatusAfterCleanup === "DELETED", "Full transfer job must be deleted");
check(changeLog.namingTest?.jobStatusAfterCleanup === "DISABLED", "Naming test job must be disabled");
check(changeLog.storageTransfer?.temporaryObjectCreatorRemoved === true, "Temporary objectCreator must be removed");
check(spec.nextPrompt === NEXT_PROMPT, "Spec next prompt mismatch");
check(changeLog.nextPrompt === NEXT_PROMPT, "Change log next prompt mismatch");

const specObjects = new Map(spec.finalPrivateCache.objects.map((object) => [object.name, object.bytes]));
for (const [name, bytes] of EXPECTED_OBJECTS) {
  check(specObjects.get(name) === bytes, `Spec object ${name} byte mismatch`);
  check(doc.includes(`| \`${name}\` | \`${bytes}\` |`), `Doc object ${name} byte mismatch`);
}

for (const flag of TRUE_FLAGS) {
  check(spec.runtimeFlags?.[flag] === true, `Spec runtime flag ${flag} must be true`);
  check(changeLog.runtimeFlags?.[flag] === true, `Change log runtime flag ${flag} must be true`);
}
for (const flag of FALSE_FLAGS) {
  check(spec.runtimeFlags?.[flag] === false, `Spec runtime flag ${flag} must be false`);
  check(changeLog.runtimeFlags?.[flag] === false, `Change log runtime flag ${flag} must be false`);
}

for (const file of [
  "docs/qwen2-5-vl-7b-storage-transfer-url-list-result.md",
  "docs/qwen2-5-vl-7b-storage-transfer-url-list-result-change-log.md",
  "src/backend/mock/mock-qwen2-5-vl-storage-transfer-url-list-result.ts"
]) {
  assertNoForbiddenText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  finalObjectCount: spec.finalPrivateCache.objectCount,
  finalTotalBytes: spec.finalPrivateCache.totalBytes,
  expectedObjectCount: spec.expectedManifest.fileCount,
  expectedTotalBytes: spec.expectedManifest.totalBytes,
  storageTransferFullJobPassed: true,
  fullTransferJobDeleted: true,
  temporaryObjectCreatorRemoved: true,
  cloudRunServiceCreated: false,
  modelInferenceRun: false,
  supabaseTouched: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
