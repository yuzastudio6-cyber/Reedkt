#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const EXPECTED_DECISION =
  "ai_video_broll_gen_9j_gcp_iap_egress_fix_iap_enabled_wheelhouse_path_approved_vm_still_blocked";
const EXPECTED_NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-9J-VM-PREFLIGHT-3: re-check controlled L4 proof VM readiness, no inference";
const PREVIOUS_DECISION =
  "ai_video_broll_gen_9j_vm_preflight_2_blocked_iap_api_disabled_and_no_private_egress";
const PRIVATE_CACHE_PATH =
  "/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B-Diffusers/0fad780a534b6463e45facd96134c9f345acfa5b";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-gcp-iap-egress-fix-result.md",
  "docs/ai-video-broll-generation-gcp-iap-egress-fix-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-vm-preflight-3.md",
  "docs/ai-video-broll-generation-gcp-private-vm-preflight-2-result.md",
  "docs/ai-video-broll-generation-gcp-private-cache-validate-result.md",
  "docs/ai-video-broll-generation-gcp-private-diffusers-cache-manifest.md",
  "server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt",
  "scripts/validation/ai-video-broll-gen-9j-gcp-iap-egress-fix-diagnostics.mjs",
  "package.json"
];

const UNSAFE_PATTERNS = [
  ["service account email", /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
  ["runtime execution true claim", /\b(vmCreated|diskCreated|serviceAccountCreated|serviceAccountKeyCreated|firewallRuleCreated|routerCreated|cloudNatCreated|staticAddressCreated|reservationCreated|customImageCreated|bucketCreated|artifactRegistryImageCreated|cloudRunJobCreated|quotaRequestCreated|dependencyInstallRun|wheelhouseCreated|modelImportRun|pipelineInstantiated|modelFromPretrainedCalled|torchLoadCalled|modelInferenceRun|generatedFramesCreated|generatedVideoCreated|providerCalled|workerDispatched|supabaseTouched|sqlExecuted|storageUploaded|signedUrlsCreated|publicArtifactsCreated|creditMutationCreated)\b\s*[:=]\s*(true|"true")/i],
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

function check(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseBlock(relativePath, label) {
  const text = read(relativePath);
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp("```json\\s+" + escaped + "\\n([\\s\\S]*?)\\n```"));
  check(match, `Missing JSON block ${label} in ${relativePath}`);
  return JSON.parse(match[1]);
}

function ensureSafeDocs(files) {
  const findings = [];
  for (const file of files) {
    const text = read(file);
    for (const [name, pattern] of UNSAFE_PATTERNS) {
      if (pattern.test(text)) {
        findings.push(`${name}: ${file}`);
      }
    }
  }
  check(findings.length === 0, `Unsafe doc text found: ${findings.join("; ")}`);
}

for (const file of REQUIRED_FILES) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
check(
  packageJson.scripts?.["ai-video-broll-gen-9j-gcp-iap-egress-fix:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-9j-gcp-iap-egress-fix-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-9j-gcp-iap-egress-fix:diagnostics"
);

const result = parseBlock(
  "docs/ai-video-broll-generation-gcp-iap-egress-fix-result.md",
  "ai-video-broll-gen-9j-gcp-iap-egress-fix-result"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-gcp-iap-egress-fix-change-log.md",
  "ai-video-broll-gen-9j-gcp-iap-egress-fix-change-log"
);
const previous = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-vm-preflight-2-result.md",
  "ai-video-broll-gen-9j-vm-preflight-2-result"
);

check(result.decision === EXPECTED_DECISION, "Result decision mismatch");
check(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
check(previous.decision === PREVIOUS_DECISION, "Previous preflight decision mismatch");
check(result.nextPrompt === EXPECTED_NEXT_PROMPT, "Result next prompt mismatch");
check(changeLog.nextPrompt === EXPECTED_NEXT_PROMPT, "Change log next prompt mismatch");

check(result.projectVerification?.projectId === "reeditpro", "Project mismatch");
check(result.projectVerification?.projectLifecycleState === "ACTIVE", "Project must be active");
check(result.projectVerification?.targetRegion === "us-central1", "Target region mismatch");
check(result.projectVerification?.targetZone === "us-central1-b", "Target zone mismatch");
check(result.projectVerification?.zoneStatus === "UP", "Zone must be UP");

check(result.apiState?.computeApiEnabled === true, "Compute API must be enabled");
check(result.apiState?.iamApiEnabled === true, "IAM API must be enabled");
check(result.apiState?.loggingApiEnabled === true, "Logging API must be enabled");
check(result.apiState?.monitoringApiEnabled === true, "Monitoring API must be enabled");
check(result.apiState?.iapApiWasEnabledBeforeThisPrompt === false, "IAP should be recorded disabled before prompt");
check(result.apiState?.iapApiEnabledByThisPrompt === true, "IAP must be enabled by this prompt");
check(result.apiState?.iapApiEnabledAfterThisPrompt === true, "IAP must be enabled after prompt");
check(result.apiState?.gcpMutatingCommandsExecuted === true, "The IAP API enablement mutation must be recorded");
check(result.apiState?.onlyGcpMutation === "enable_iap_googleapis_com", "Only allowed GCP mutation mismatch");

check(result.machineAndQuota?.machineType === "g2-standard-4", "Machine type mismatch");
check(result.machineAndQuota?.guestCpus === 4, "CPU count mismatch");
check(result.machineAndQuota?.memoryMb === 16384, "Memory mismatch");
check(result.machineAndQuota?.accelerator === "nvidia-l4", "Accelerator mismatch");
check(result.machineAndQuota?.acceleratorCount === 1, "Accelerator count mismatch");
check(result.machineAndQuota?.regionalL4QuotaLimit === 1, "L4 quota limit mismatch");
check(result.machineAndQuota?.regionalL4QuotaUsage === 0, "L4 quota usage mismatch");
check(result.machineAndQuota?.costFriendlyShapeSelected === true, "Cost-friendly shape must remain selected");

check(result.identityAndFirewall?.proofServiceAccountId === "reeditpro-ai-broll-proof-sa", "Proof SA ID mismatch");
check(result.identityAndFirewall?.proofServiceAccountExists === true, "Proof SA must exist");
check(result.identityAndFirewall?.proofServiceAccountUserManagedKeyCount === 0, "Proof SA must have zero user keys");
check(result.identityAndFirewall?.iapSshFirewallRuleExists === true, "IAP SSH rule must exist");
check(result.identityAndFirewall?.iapSshSourceRange === "35.235.240.0/20", "IAP source range mismatch");
check(result.identityAndFirewall?.iapSshTargetTag === "ai-video-broll-wan-l4-proof", "IAP target tag mismatch");
check(result.identityAndFirewall?.defaultSshOpenToWorld === true, "Default SSH exposure must be recorded");
check(result.identityAndFirewall?.externalIpVmRejected === true, "External-IP VM must be rejected");

check(result.dependencyPathDecision?.selectedPath === "local_wheelhouse_transfer_over_iap", "Selected dependency path mismatch");
check(result.dependencyPathDecision?.selectedPathApproved === true, "Selected dependency path must be approved");
check(result.dependencyPathDecision?.selectedPathReadyNow === false, "Selected dependency path must not be ready");
check(result.dependencyPathDecision?.wheelhouseCreated === false, "Wheelhouse must not be created");
check(result.dependencyPathDecision?.cloudNatApprovedNow === false, "Cloud NAT must not be approved now");
check(result.dependencyPathDecision?.cloudNatCreated === false, "Cloud NAT must not be created");
check(result.dependencyPathDecision?.externalIpVmApproved === false, "External-IP VM must not be approved");
check(result.dependencyPathDecision?.runtimeInternetPipInstallApproved === false, "Runtime internet pip install must be rejected");
check(result.dependencyPathDecision?.sourceRepoCloneApproved === false, "Source repo clone must be rejected");

check(result.networkAndResources?.privateIpGoogleAccess === false, "Private Google Access should remain false");
check(result.networkAndResources?.cloudNatFoundInUsCentral1 === false, "Cloud NAT should remain absent");
check(result.networkAndResources?.instancesFound === 0, "No instances should exist");
check(result.networkAndResources?.disksFound === 0, "No disks should exist");

check(result.cacheAndRunner?.privateCachePath === PRIVATE_CACHE_PATH, "Private cache path mismatch");
check(result.cacheAndRunner?.runtimeEssentialFileCount === 19, "Runtime file count mismatch");
check(result.cacheAndRunner?.manifestAggregateBytes === 28928887859, "Aggregate byte mismatch");
check(result.cacheAndRunner?.runnerValidateOnlyMustRunFirst === true, "Runner validate-only must run first");
check(result.cacheAndRunner?.futureExecutionFlagAllowedNow === false, "Future execution flag must remain blocked");

for (const [flag, value] of Object.entries(result.runtimeFlags ?? {})) {
  check(value === false, `Runtime flag ${flag} must be false`);
}

const promptText = read("docs/implementation-prompts/prompt-ai-video-broll-gen-9j-vm-preflight-3.md");
for (const expected of [
  EXPECTED_NEXT_PROMPT,
  "re-check `iap.googleapis.com` remains enabled",
  "local wheelhouse transfer over IAP",
  "AI-VIDEO-BROLL-GEN-9J-WHEELHOUSE-PREP",
  "AI-VIDEO-BROLL-GEN-9J-VM-CREATE-PACKET",
  "Do not create a VM"
]) {
  check(promptText.includes(expected), `Next prompt missing ${expected}`);
}

ensureSafeDocs([
  "docs/ai-video-broll-generation-gcp-iap-egress-fix-result.md",
  "docs/ai-video-broll-generation-gcp-iap-egress-fix-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-vm-preflight-3.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  projectId: result.projectVerification.projectId,
  targetZone: result.projectVerification.targetZone,
  machineType: result.machineAndQuota.machineType,
  accelerator: result.machineAndQuota.accelerator,
  iapApiEnabledAfterThisPrompt: result.apiState.iapApiEnabledAfterThisPrompt,
  onlyGcpMutation: result.apiState.onlyGcpMutation,
  dependencyPath: result.dependencyPathDecision.selectedPath,
  dependencyPathApproved: result.dependencyPathDecision.selectedPathApproved,
  dependencyPathReadyNow: result.dependencyPathDecision.selectedPathReadyNow,
  vmCreateAllowedNext: result.runtimeFlags.vmCreateAllowedNext,
  vmCreated: false,
  cloudNatCreated: false,
  dependencyInstallRun: false,
  wheelhouseCreated: false,
  modelImportRun: false,
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
