#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const EXPECTED_DECISION =
  "ai_video_broll_gen_9j_vm_create_plan_2_blocked_pending_gcloud_auth_refresh";
const EXPECTED_NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-9J-GCLOUD-AUTH-REFRESH: refresh local gcloud auth for read-only preflight, no VM/no inference";
const EXPECTED_WHEELHOUSE =
  "/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64";
const EXPECTED_MANIFEST = path.join(EXPECTED_WHEELHOUSE, "SHA256SUMS.json");
const EXPECTED_AGGREGATE_SHA =
  "55ab4ba840e664996b29ee684591a500568bbb9ade332d2b48f05af8e79eab64";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-gcp-private-vm-create-plan-2-result.md",
  "docs/ai-video-broll-generation-gcp-private-vm-create-plan-2-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-gcloud-auth-refresh.md",
  "docs/ai-video-broll-generation-python-runtime-alignment-result.md",
  "docs/ai-video-broll-generation-gcp-private-vm-create-plan.md",
  "scripts/validation/ai-video-broll-gen-9j-vm-create-plan-2-diagnostics.mjs",
  "package.json"
];

const UNSAFE_PATTERNS = [
  [
    "runtime execution true claim",
    /\b(vmCreated|diskCreated|networkChanged|serviceAccountCreated|serviceAccountKeyCreated|firewallRuleCreated|routerCreated|cloudNatCreated|staticAddressCreated|reservationCreated|customImageCreated|bucketCreated|artifactRegistryImageCreated|cloudRunJobCreated|quotaRequestCreated|iapTransferExecuted|sshSessionOpened|dependencyInstalledOnVm|sourceRepositoryCloned|modelDownloaded|modelImported|pipelineInstantiated|modelFromPretrainedCalled|torchLoadCalled|modelInferenceRun|generatedFramesCreated|generatedVideoCreated|mediaProcessingRun|ffmpegRun|providerCalled|workerDispatched|supabaseTouched|sqlExecuted|storageUploaded|signedUrlsCreated|publicArtifactsCreated|creditMutationCreated|betaUnlocked|productionUnlocked|runtimeReadinessClaimed|dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i
  ],
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
  ["Google credential env", /\bGOOGLE_APPLICATION_CREDENTIALS\b/],
  ["access token", /\bya29\.[A-Za-z0-9._-]+/i],
  ["refresh token", /\brefresh[_-]?token\s*[:=]\s*['"][^'"]+/i]
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
  check(findings.length === 0, `Unsafe text found: ${findings.join("; ")}`);
}

for (const file of REQUIRED_FILES) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`);
}
check(fs.existsSync(EXPECTED_MANIFEST), `Missing Python 3.12 manifest: ${EXPECTED_MANIFEST}`);

const packageJson = JSON.parse(read("package.json"));
check(
  packageJson.scripts?.["ai-video-broll-gen-9j-vm-create-plan-2:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-9j-vm-create-plan-2-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-9j-vm-create-plan-2:diagnostics"
);

const result = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-vm-create-plan-2-result.md",
  "ai-video-broll-gen-9j-vm-create-plan-2-result"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-vm-create-plan-2-change-log.md",
  "ai-video-broll-gen-9j-vm-create-plan-2-change-log"
);
const alignment = parseBlock(
  "docs/ai-video-broll-generation-python-runtime-alignment-result.md",
  "ai-video-broll-gen-9j-python-runtime-alignment-result"
);
const manifest = JSON.parse(fs.readFileSync(EXPECTED_MANIFEST, "utf8"));

check(result.decision === EXPECTED_DECISION, "Result decision mismatch");
check(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
check(result.nextPrompt === EXPECTED_NEXT_PROMPT, "Result next prompt mismatch");
check(changeLog.nextPrompt === EXPECTED_NEXT_PROMPT, "Change log next prompt mismatch");

check(result.pythonRuntimeAlignment?.aligned === true, "Python runtime must be aligned");
check(result.pythonRuntimeAlignment?.targetPython === "3.12", "Target Python mismatch");
check(result.pythonRuntimeAlignment?.targetAbi === "cp312", "Target ABI mismatch");
check(result.pythonRuntimeAlignment?.wheelhousePath === EXPECTED_WHEELHOUSE, "Wheelhouse path mismatch");
check(result.pythonRuntimeAlignment?.manifestPath === EXPECTED_MANIFEST, "Manifest path mismatch");
check(result.pythonRuntimeAlignment?.realWheelCount === 66, "Wheel count mismatch");
check(result.pythonRuntimeAlignment?.aggregateBytes === 2802483442, "Aggregate bytes mismatch");
check(result.pythonRuntimeAlignment?.aggregateSha256 === EXPECTED_AGGREGATE_SHA, "Aggregate SHA mismatch");
check(result.pythonRuntimeAlignment?.offlineNoIndexResolverCopyPassed === true, "Offline proof missing");

check(alignment.dependencyStatus?.wheelhouseReadyForVmCreatePlanRecheck === true, "Alignment must be recheck-ready");
check(manifest.target?.pythonVersion === "3.12", "Manifest target Python mismatch");
check(manifest.target?.abi === "cp312", "Manifest target ABI mismatch");
check(manifest.realWheelCount === 66, "Manifest wheel count mismatch");
check(manifest.aggregateSha256 === EXPECTED_AGGREGATE_SHA, "Manifest aggregate SHA mismatch");

check(result.gcpRecheck?.readOnlyPreflightAttempted === true, "Read-only GCP preflight must be attempted");
check(result.gcpRecheck?.gcloudAuthRefreshPassed === false, "gcloud auth refresh must be blocked");
check(result.gcpRecheck?.secretsPrinted === false, "Secrets must not be printed");
check(result.gcpRecheck?.tokensPrinted === false, "Tokens must not be printed");
check(result.gcpRecheck?.projectResourceStateReverified === false, "Project state must not be marked reverified");
check(result.createPlan?.vmCreateCommandShapeReadyFromPriorPlan === true, "VM shape must remain drafted");
check(result.createPlan?.pythonRuntimeCompatibleWithWheelhouse === true, "Python runtime should be compatible now");
check(result.createPlan?.vmCreateExecutionReady === false, "VM create execution must remain blocked");
check(result.createPlan?.vmCreateExecutePromptAllowedNext === false, "VM create execute prompt must not be next");
check(result.createPlan?.nextGateRequiresGcloudAuthRefresh === true, "Next gate must require gcloud auth refresh");
check(result.createPlan?.nextGateRequiresReadOnlyGcpPreflight === true, "Next gate must require read-only preflight");

for (const [flag, value] of Object.entries(result.runtimeFlags ?? {})) {
  check(value === false, `Runtime flag ${flag} must be false`);
}
for (const [flag, value] of Object.entries(changeLog.runtimeFlags ?? {})) {
  check(value === false, `Change-log runtime flag ${flag} must be false`);
}

const nextPrompt = read("docs/implementation-prompts/prompt-ai-video-broll-gen-9j-gcloud-auth-refresh.md");
for (const expected of [
  EXPECTED_NEXT_PROMPT,
  "AI-VIDEO-BROLL-GEN-9J-VM-CREATE-PLAN-3: re-run controlled no-public-IP L4 VM create preflight, no inference",
  "Do not create a VM",
  "Do not import models",
  "no secret, token, refresh-token, credential-file, or environment-value printing"
]) {
  check(nextPrompt.includes(expected), `gcloud auth prompt missing: ${expected}`);
}

const sidecars = fs.readdirSync(EXPECTED_WHEELHOUSE).filter((name) => name.startsWith("._"));
check(sidecars.length === 0, `Wheelhouse contains AppleDouble sidecars: ${sidecars.join(", ")}`);

ensureSafeText([
  "docs/ai-video-broll-generation-gcp-private-vm-create-plan-2-result.md",
  "docs/ai-video-broll-generation-gcp-private-vm-create-plan-2-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-gcloud-auth-refresh.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  pythonRuntimeAligned: result.pythonRuntimeAlignment.aligned,
  targetPython: result.pythonRuntimeAlignment.targetPython,
  targetAbi: result.pythonRuntimeAlignment.targetAbi,
  wheelCount: result.pythonRuntimeAlignment.realWheelCount,
  aggregateSha256: result.pythonRuntimeAlignment.aggregateSha256,
  readOnlyPreflightAttempted: result.gcpRecheck.readOnlyPreflightAttempted,
  gcloudAuthRefreshPassed: result.gcpRecheck.gcloudAuthRefreshPassed,
  projectResourceStateReverified: result.gcpRecheck.projectResourceStateReverified,
  vmCreateExecutionReady: result.createPlan.vmCreateExecutionReady,
  vmCreateExecutePromptAllowedNext: result.createPlan.vmCreateExecutePromptAllowedNext,
  vmCreated: false,
  dependencyInstalledOnVm: false,
  modelDownloaded: false,
  modelImported: false,
  modelInferenceRun: false,
  generatedFramesCreated: false,
  generatedVideoCreated: false,
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
