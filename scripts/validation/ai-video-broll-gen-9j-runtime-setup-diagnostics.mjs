#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const EXPECTED_DECISION =
  "ai_video_broll_gen_9j_runtime_setup_private_runner_dependency_path_approved_ready_for_runner_authoring";
const EXPECTED_NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-9J-RUNNER-AUTHOR: add fail-closed private L4 proof runner, no VM/no inference";
const APPROVED_RUNNER_PATH =
  "server/workers/ai-video-broll-controlled-install/run_wan_l4_private_tabletop_proof.py";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-gcp-private-proof-runner-dependency-approval.md",
  "docs/ai-video-broll-generation-gcp-private-proof-runner-dependency-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-runner-author.md",
  "scripts/validation/ai-video-broll-gen-9j-runtime-setup-diagnostics.mjs",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-runtime-setup.md",
  "docs/ai-video-broll-generation-gcp-controlled-l4-private-proof-retry-result.md",
  "docs/ai-video-broll-generation-controlled-dependency-install-result.md",
  "docs/ai-video-broll-generation-controlled-model-loader-import-result.md",
  "docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md",
  "server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt",
  "package.json"
];

const REQUIRED_FALSE_FLAGS = [
  "vmCreated",
  "diskCreated",
  "networkCreated",
  "serviceAccountCreated",
  "firewallRuleCreated",
  "gcpMutatingCommandsExecuted",
  "dependencyInstallAllowedNow",
  "dependencyInstallRun",
  "modelImportAllowedNow",
  "modelImportRun",
  "pipelineInstantiationAllowedNow",
  "pipelineInstantiated",
  "modelFromPretrainedAllowedNow",
  "modelFromPretrainedCalled",
  "torchLoadAllowedNow",
  "torchLoadCalled",
  "textEncodingAllowedNow",
  "textEncodingRun",
  "denoisingStepAllowedNow",
  "denoisingStepRun",
  "schedulerRunAllowedNow",
  "schedulerRun",
  "vaeEncodeDecodeAllowedNow",
  "vaeEncodeDecodeRun",
  "modelInferenceAllowedNow",
  "modelInferenceRun",
  "generatedFramesAllowedNow",
  "generatedFramesCreated",
  "generatedVideoAllowedNow",
  "generatedVideoCreated",
  "mediaProcessingAllowed",
  "ffmpegAllowed",
  "providerCallsAllowed",
  "workerExecutionAllowed",
  "routeExecutionAllowed",
  "supabaseMutationAllowed",
  "sqlAllowed",
  "storageUploadAllowed",
  "signedUrlCreationAllowed",
  "publicArtifactCreationAllowed",
  "creditMutationAllowed",
  "dryRunPassedClaimed",
  "generatedLocalFixturePassedClaimed",
  "runtimeReadinessClaimed",
  "betaProductionUnlockClaimed"
];

const UNSAFE_PATTERNS = [
  ["service account email", /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
  ["runtime execution true claim", /\b(pipelineInstantiated|modelFromPretrainedCalled|torchLoadCalled|textEncodingRun|denoisingStepRun|schedulerRun|vaeEncodeDecodeRun|modelInferenceRun|inferenceRun|generatedFramesCreated|generatedVideoCreated|mediaProcessingRun|ffmpegRun|providerCalled|workerDispatched)\b\s*[:=]\s*(true|"true")/i],
  ["generated local fixture wording claim", /\bgenerated_local_fixture_passed\s+(claimed|true|passed)/i],
  ["dry run wording claim", /\bdry_run_passed\s+(claimed|true|passed)/i],
  ["signed URL query", /\b(X-Amz-Signature|X-Amz-Credential|Expires=|Signature=|Policy=|Key-Pair-Id=)/],
  ["DB URL", /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ["JWT", /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/],
  ["Authorization bearer", /\bAuthorization\s*:\s*Bearer\s+[A-Za-z0-9._-]+/i],
  ["Supabase project URL", /https:\/\/[a-z0-9]{20}\.supabase\.co/i],
  ["API key assignment", /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
  ["service role assignment", /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
  ["secret assignment", /\bsecret\s*[:=]\s*['"][^'"]+/i],
  ["Google credential env", /\bGOOGLE_APPLICATION_CREDENTIALS\b/]
];

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseBlock(relativePath, label) {
  const text = read(relativePath);
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp("```json\\s+" + escaped + "\\n([\\s\\S]*?)\\n```"));
  assert(match, `Missing JSON block ${label} in ${relativePath}`);
  return JSON.parse(match[1]);
}

function ensureSafeText(files) {
  const findings = [];
  for (const file of files) {
    const text = read(file);
    for (const [name, pattern] of UNSAFE_PATTERNS) {
      if (pattern.test(text)) {
        findings.push(`${name}: ${file}`);
      }
    }
  }
  assert(findings.length === 0, `Unsafe claims or secret-shaped text found: ${findings.join("; ")}`);
}

for (const file of REQUIRED_FILES) {
  assert(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
assert(
  packageJson.scripts?.["ai-video-broll-gen-9j-runtime-setup:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-9j-runtime-setup-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-9j-runtime-setup:diagnostics"
);

const approval = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-proof-runner-dependency-approval.md",
  "ai-video-broll-gen-9j-runtime-setup-private-runner-dependency-approval"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-proof-runner-dependency-change-log.md",
  "ai-video-broll-gen-9j-runtime-setup-private-runner-dependency-change-log"
);
const retry = parseBlock(
  "docs/ai-video-broll-generation-gcp-controlled-l4-private-proof-retry-result.md",
  "ai-video-broll-gen-9j-retry-controlled-l4-private-proof-result"
);

assert(approval.decision === EXPECTED_DECISION, "Unexpected runtime setup decision");
assert(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
assert(approval.sourceCommit === "0786355a", "Runtime setup source commit mismatch");
assert(approval.runnerApproval?.runnerPathApproved === true, "Runner path must be approved");
assert(approval.runnerApproval?.runnerMode === "future_committed_script_path", "Runner mode mismatch");
assert(approval.runnerApproval?.approvedFutureRunnerPath === APPROVED_RUNNER_PATH, "Approved runner path mismatch");
assert(approval.runnerApproval?.runnerFileCreatedNow === false, "Runner file must not be created now");
assert(approval.runnerApproval?.approvedRunnerPathExistsNow === false, "Approved runner path must not exist yet");
assert(approval.runnerApproval?.temporaryVmAdHocScriptApproved === false, "Temporary VM ad hoc script must be rejected");
assert(approval.runnerApproval?.prebuiltPrivateImagePathApproved === false, "Private image path must be rejected");
assert(approval.runnerApproval?.directRetry2AllowedNow === false, "Direct retry must remain blocked");
assert(approval.runnerApproval?.runnerAuthoringGateRequired === true, "Runner authoring gate must be required");

assert(approval.dependencyApproval?.futureVmLocalDependencyInstallMayUseApprovedManifest === true, "Future VM dependency boundary must allow approved manifest");
assert(
  approval.dependencyApproval?.requirementsManifest ===
    "server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt",
  "Requirements manifest mismatch"
);
assert(approval.dependencyApproval?.dependencyInstallRunNow === false, "Dependency install must not run now");
assert(approval.dependencyApproval?.sourceRepoCloneAllowed === false, "Source repo clone must be blocked");
assert(approval.dependencyApproval?.ffmpegInstallAllowed === false, "FFmpeg install must be blocked");
assert(approval.dependencyApproval?.xformersInstallAllowed === false, "xFormers install must be blocked");

assert(approval.cacheApproval?.modelId === "Wan-AI/Wan2.1-T2V-1.3B", "Model mismatch");
assert(approval.cacheApproval?.modelRevision === "37ec512624d61f7aa208f7ea8140a131f93afc9a", "Revision mismatch");
assert(approval.cacheApproval?.offlineCacheOnly === true, "Offline cache only must be true");
assert(approval.cacheApproval?.runtimeNetworkModelFetchAllowed === false, "Runtime network model fetch must be blocked");
assert(approval.cacheApproval?.diffusersFormatCacheProven === false, "Diffusers format cache must not be claimed proven");
assert(approval.cacheApproval?.cacheLayoutMustBeHandledByRunnerAuthoringGate === true, "Cache layout must be delegated to runner authoring");
assert(approval.cacheApproval?.manifestListedFileTotalBytes === 17567083322, "Manifest listed total mismatch");
assert(approval.cacheApproval?.historicalAggregateBytes === 17567424122, "Historical aggregate mismatch");
assert(approval.cacheApproval?.futureTransferCostBytes === 17567083322, "Future transfer bytes mismatch");

assert(approval.fixtureBoundary?.fixture === "non-user-media-tabletop", "Fixture mismatch");
assert(approval.fixtureBoundary?.userMediaAllowed === false, "User media must be blocked");
assert(approval.fixtureBoundary?.rawChatUsedAsExecutionPlan === false, "Raw chat must be blocked as execution plan");
assert(approval.fixtureBoundary?.promptExtensionApiAllowed === false, "Prompt extension API must be blocked");

for (const flag of REQUIRED_FALSE_FLAGS) {
  assert(approval.runtimeFlags?.[flag] === false, `Runtime flag ${flag} must stay false`);
}
assert(approval.nextPrompt === EXPECTED_NEXT_PROMPT, "Next prompt mismatch");

assert(changeLog.approvedFutureRunnerPath === APPROVED_RUNNER_PATH, "Change log runner path mismatch");
assert(changeLog.runnerFileCreatedNow === false, "Change log must not create runner");
assert(changeLog.dependencyInstallRun === false, "Change log dependency install must be false");
assert(changeLog.modelInferenceRun === false, "Change log inference must be false");
assert(changeLog.vmCreated === false, "Change log VM must be false");
assert(changeLog.nextPrompt === EXPECTED_NEXT_PROMPT, "Change log next prompt mismatch");

assert(retry.blockedPreflight?.approvedProofRunnerPathExists === false, "Retry source must prove runner path was missing");
assert(retry.blockedPreflight?.proofRunnerSourceValue === "AI_VIDEO_BROLL_PROOF_RUNNER_PLACEHOLDER", "Retry source placeholder mismatch");

const approvalText = read("docs/ai-video-broll-generation-gcp-private-proof-runner-dependency-approval.md");
for (const expected of [
  "https://huggingface.co/docs/diffusers/v0.33.1/api/pipelines/wan",
  "https://huggingface.co/Wan-AI/Wan2.1-T2V-1.3B-Diffusers",
  APPROVED_RUNNER_PATH,
  "HF_HUB_OFFLINE=1",
  "TRANSFORMERS_OFFLINE=1",
  "DIFFUSERS_OFFLINE=1",
  "Temporary VM ad hoc script",
  "Diffusers-format",
  "17567083322",
  "17567424122"
]) {
  assert(approvalText.includes(expected), `Approval doc missing ${expected}`);
}

const nextPromptText = read("docs/implementation-prompts/prompt-ai-video-broll-gen-9j-runner-author.md");
for (const expected of [
  "no VM/no inference",
  APPROVED_RUNNER_PATH,
  "--offline-model-cache",
  "--fixture",
  "--max-runtime-minutes",
  "--output-dir",
  "--evidence-json",
  "Do not run the runner against model weights",
  "AI-VIDEO-BROLL-GEN-9J-RETRY-2"
]) {
  assert(nextPromptText.includes(expected), `Runner author prompt missing ${expected}`);
}

ensureSafeText([
  "docs/ai-video-broll-generation-gcp-private-proof-runner-dependency-approval.md",
  "docs/ai-video-broll-generation-gcp-private-proof-runner-dependency-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-runner-author.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  approvedFutureRunnerPath: APPROVED_RUNNER_PATH,
  runnerFileCreatedNow: false,
  directRetry2AllowedNow: false,
  runnerAuthoringGateRequired: true,
  futureVmLocalDependencyInstallMayUseApprovedManifest: true,
  dependencyInstallRun: false,
  modelImportRun: false,
  modelInferenceRun: false,
  generatedFramesCreated: false,
  generatedVideoCreated: false,
  vmCreated: false,
  gcpMutatingCommandsExecuted: false,
  supabaseTouched: false,
  sqlExecuted: false,
  providerCalled: false,
  workerDispatched: false,
  signedUrlsCreated: false,
  publicArtifactsCreated: false,
  betaUnlocked: false,
  productionUnlocked: false,
  dryRunPassedClaimed: false,
  generatedLocalFixturePassedClaimed: false,
  nextPrompt: EXPECTED_NEXT_PROMPT
}, null, 2));
