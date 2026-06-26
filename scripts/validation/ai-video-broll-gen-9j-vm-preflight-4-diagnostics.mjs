#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const EXPECTED_DECISION =
  "ai_video_broll_gen_9j_vm_preflight_4_iap_wheelhouse_transfer_packet_ready_vm_still_blocked";
const EXPECTED_NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-9J-VM-CREATE-PLAN: plan controlled no-public-IP L4 proof VM creation, no inference";
const EXPECTED_WHEELHOUSE =
  "/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python313-linux-x86_64";
const EXPECTED_MANIFEST = path.join(EXPECTED_WHEELHOUSE, "SHA256SUMS.json");
const EXPECTED_AGGREGATE_SHA =
  "366835269639cd0d7bd24fcb876d39f94bca2bb9c4772735a16fa2458dfbfc11";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-gcp-private-vm-preflight-4-result.md",
  "docs/ai-video-broll-generation-gcp-private-vm-preflight-4-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-vm-create-plan.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-vm-preflight-4.md",
  "docs/ai-video-broll-generation-gcp-private-wheelhouse-fix-result.md",
  "docs/ai-video-broll-generation-gcp-private-vm-preflight-3-result.md",
  "docs/ai-video-broll-generation-gcp-iap-egress-fix-result.md",
  "server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt",
  "scripts/validation/ai-video-broll-gen-9j-vm-preflight-4-diagnostics.mjs",
  "package.json"
];

const REQUIRED_COMMAND_SNIPPETS = [
  "gcloud compute scp",
  "--project=reeditpro",
  "--zone=us-central1-b",
  "--tunnel-through-iap",
  "--recurse",
  "reeditpro-ai-broll-wan-l4-proof:/tmp/reeditpro-ai-video-broll-wheelhouses/python313-linux-x86_64",
  "server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt",
  "reeditpro-ai-broll-wan-l4-proof:/tmp/reeditpro-ai-video-broll-wheelhouses/python313-linux-x86_64/requirements.ai-video-broll.txt",
  "python3 -m venv /tmp/reeditpro-ai-video-broll-proof-venv",
  "--no-index",
  "--find-links /tmp/reeditpro-ai-video-broll-wheelhouses/python313-linux-x86_64"
];

const UNSAFE_PATTERNS = [
  ["service account email", /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
  ["runtime execution true claim", /\b(vmCreated|diskCreated|networkChanged|serviceAccountCreated|serviceAccountKeyCreated|firewallRuleCreated|routerCreated|cloudNatCreated|staticAddressCreated|reservationCreated|customImageCreated|bucketCreated|artifactRegistryImageCreated|cloudRunJobCreated|quotaRequestCreated|iapTransferExecuted|dependencyInstalledOnVm|sourceRepositoryCloned|modelDownloaded|modelImported|pipelineInstantiated|modelFromPretrainedCalled|torchLoadCalled|modelInferenceRun|generatedFramesCreated|generatedVideoCreated|mediaProcessingRun|ffmpegRun|providerCalled|workerDispatched|supabaseTouched|sqlExecuted|storageUploaded|signedUrlsCreated|publicArtifactsCreated|creditMutationCreated|betaUnlocked|productionUnlocked|dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i],
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
check(fs.existsSync(EXPECTED_MANIFEST), `Missing private wheelhouse manifest: ${EXPECTED_MANIFEST}`);

const packageJson = JSON.parse(read("package.json"));
check(
  packageJson.scripts?.["ai-video-broll-gen-9j-vm-preflight-4:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-9j-vm-preflight-4-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-9j-vm-preflight-4:diagnostics"
);

const result = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-vm-preflight-4-result.md",
  "ai-video-broll-gen-9j-vm-preflight-4-result"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-vm-preflight-4-change-log.md",
  "ai-video-broll-gen-9j-vm-preflight-4-change-log"
);
const wheelhouseFix = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-wheelhouse-fix-result.md",
  "ai-video-broll-gen-9j-wheelhouse-fix-result"
);
const manifest = JSON.parse(fs.readFileSync(EXPECTED_MANIFEST, "utf8"));

check(result.decision === EXPECTED_DECISION, "Result decision mismatch");
check(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
check(result.nextPrompt === EXPECTED_NEXT_PROMPT, "Result next prompt mismatch");
check(changeLog.nextPrompt === EXPECTED_NEXT_PROMPT, "Change log next prompt mismatch");

check(result.project?.projectId === "reeditpro", "Project mismatch");
check(result.project?.targetZone === "us-central1-b", "Target zone mismatch");
check(result.futureVmShape?.futureVmName === "reeditpro-ai-broll-wan-l4-proof", "Future VM name mismatch");
check(result.futureVmShape?.machineType === "g2-standard-4", "Machine type mismatch");
check(result.futureVmShape?.accelerator === "nvidia-l4", "Accelerator mismatch");
check(result.futureVmShape?.acceleratorCount === 1, "Accelerator count mismatch");
check(result.futureVmShape?.targetTag === "ai-video-broll-wan-l4-proof", "Target tag mismatch");
check(result.futureVmShape?.serviceAccountId === "reeditpro-ai-broll-proof-sa", "Service account mismatch");
check(result.futureVmShape?.externalIpAllowed === false, "External IP must be blocked");
check(result.futureVmShape?.iapOnlyAccessRequired === true, "IAP-only access must be required");

check(result.wheelhouseManifest?.realWheelCount === 66, "Result wheel count mismatch");
check(result.wheelhouseManifest?.aggregateBytes === 2802293613, "Result aggregate bytes mismatch");
check(result.wheelhouseManifest?.aggregateSha256 === EXPECTED_AGGREGATE_SHA, "Result aggregate SHA mismatch");
check(result.wheelhouseManifest?.wheelhouseComplete === true, "Wheelhouse must be complete");
check(result.wheelhouseManifest?.offlineNoIndexResolverCopyPassed === true, "Offline resolver proof missing");
check(result.wheelhouseManifest?.appleDoubleSidecarsPresent === false, "AppleDouble sidecars must be absent");
check(manifest.realWheelCount === 66, "Manifest wheel count mismatch");
check(manifest.aggregateSha256 === EXPECTED_AGGREGATE_SHA, "Manifest aggregate SHA mismatch");
check(manifest.wheelhouseComplete === true, "Manifest wheelhouse must be complete");
check(manifest.offlineNoIndexResolverCopyPassed === true, "Manifest offline proof missing");
check(wheelhouseFix.dependencyStatus?.wheelhouseReadyForIapTransferPreflight === true, "Wheelhouse fix must be transfer-ready");

check(result.transferPacket?.transferCommandShapeReady === true, "Transfer command shape must be ready");
check(
  result.transferPacket?.requirementsTransferCommandShapeReady === true,
  "Requirements transfer command shape must be ready"
);
check(result.transferPacket?.transferCommandExecuted === false, "Transfer command must not execute");
check(result.transferPacket?.usesGcloudComputeScp === true, "Transfer must use gcloud compute scp");
check(result.transferPacket?.usesTunnelThroughIap === true, "Transfer must use IAP tunnel");
check(result.transferPacket?.usesRecurse === true, "Transfer must be recursive");
check(result.transferPacket?.sourcePath === EXPECTED_WHEELHOUSE, "Transfer source mismatch");
check(
  result.transferPacket?.requirementsSourcePath ===
    "server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt",
  "Requirements source mismatch"
);
check(
  result.transferPacket?.remotePath === "/tmp/reeditpro-ai-video-broll-wheelhouses/python313-linux-x86_64",
  "Remote path mismatch"
);
check(
  result.transferPacket?.remoteRequirementsPath ===
    "/tmp/reeditpro-ai-video-broll-wheelhouses/python313-linux-x86_64/requirements.ai-video-broll.txt",
  "Remote requirements path mismatch"
);
check(result.transferPacket?.remotePathPrivateVmLocal === true, "Remote path must be VM-local");
check(result.transferPacket?.runtimeInternetInstallRequired === false, "Runtime internet install must be false");
check(result.transferPacket?.cloudNatRequired === false, "Cloud NAT must not be required");
check(result.transferPacket?.sourceRepositoryCloneAllowed === false, "Source repo clone must be blocked");

check(result.installPacket?.installCommandShapeReady === true, "Install command shape must be ready");
check(result.installPacket?.installCommandExecuted === false, "Install command must not execute");
check(result.installPacket?.venvPath === "/tmp/reeditpro-ai-video-broll-proof-venv", "Venv path mismatch");
check(result.installPacket?.usesNoIndex === true, "Install packet must use no-index");
check(result.installPacket?.usesFindLinksOnly === true, "Install packet must use find-links only");
check(result.installPacket?.sourceBuildsAllowed === false, "Source builds must be blocked");
check(result.installPacket?.modelImportAllowedDuringInstall === false, "Model import during install must be blocked");
check(result.installPacket?.inferenceAllowedDuringInstall === false, "Inference during install must be blocked");

for (const [flag, value] of Object.entries(result.runtimeFlags ?? {})) {
  if (flag === "vmPreflight4Passed") {
    check(value === true, "vmPreflight4Passed must be true");
  } else {
    check(value === false, `Runtime flag ${flag} must be false`);
  }
}
for (const [flag, value] of Object.entries(changeLog.runtimeFlags ?? {})) {
  check(value === false, `Change-log runtime flag ${flag} must be false`);
}

const resultText = read("docs/ai-video-broll-generation-gcp-private-vm-preflight-4-result.md");
for (const snippet of REQUIRED_COMMAND_SNIPPETS) {
  check(resultText.includes(snippet), `Result missing command snippet: ${snippet}`);
}

const nextPrompt = read("docs/implementation-prompts/prompt-ai-video-broll-gen-9j-vm-create-plan.md");
for (const expected of [
  EXPECTED_NEXT_PROMPT,
  "g2-standard-4",
  "nvidia-l4",
  "external IP disabled",
  "IAP-only SSH/transfer",
  "Do not create a VM",
  "Do not import models"
]) {
  check(nextPrompt.includes(expected), `VM create-plan prompt missing: ${expected}`);
}

const sidecars = fs.readdirSync(EXPECTED_WHEELHOUSE).filter((name) => name.startsWith("._"));
check(sidecars.length === 0, `Wheelhouse contains AppleDouble sidecars: ${sidecars.join(", ")}`);

ensureSafeText([
  "docs/ai-video-broll-generation-gcp-private-vm-preflight-4-result.md",
  "docs/ai-video-broll-generation-gcp-private-vm-preflight-4-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-vm-create-plan.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  projectId: result.project.projectId,
  targetZone: result.project.targetZone,
  futureVmName: result.futureVmShape.futureVmName,
  machineType: result.futureVmShape.machineType,
  accelerator: result.futureVmShape.accelerator,
  externalIpAllowed: result.futureVmShape.externalIpAllowed,
  iapOnlyAccessRequired: result.futureVmShape.iapOnlyAccessRequired,
  wheelCount: result.wheelhouseManifest.realWheelCount,
  aggregateSha256: result.wheelhouseManifest.aggregateSha256,
  transferCommandShapeReady: result.transferPacket.transferCommandShapeReady,
  transferCommandExecuted: result.transferPacket.transferCommandExecuted,
  installCommandShapeReady: result.installPacket.installCommandShapeReady,
  installCommandExecuted: result.installPacket.installCommandExecuted,
  vmPreflight4Passed: result.runtimeFlags.vmPreflight4Passed,
  vmCreateAllowedNext: result.runtimeFlags.vmCreateAllowedNext,
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
