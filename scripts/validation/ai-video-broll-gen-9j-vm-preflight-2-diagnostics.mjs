#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const EXPECTED_DECISION =
  "ai_video_broll_gen_9j_vm_preflight_2_blocked_iap_api_disabled_and_no_private_egress";
const EXPECTED_NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-9J-GCP-IAP-EGRESS-FIX: enable IAP API and approve no-public-IP dependency path, no VM/no inference";
const CACHE_VALIDATE_DECISION =
  "ai_video_broll_gen_9j_cache_validate_private_diffusers_cache_and_runner_envelope_validated_ready_for_vm_preflight";
const PRIVATE_CACHE_PATH =
  "/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B-Diffusers/0fad780a534b6463e45facd96134c9f345acfa5b";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-gcp-private-vm-preflight-2-result.md",
  "docs/ai-video-broll-generation-gcp-private-vm-preflight-2-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-gcp-iap-egress-fix.md",
  "docs/ai-video-broll-generation-gcp-private-cache-validate-result.md",
  "docs/ai-video-broll-generation-gcp-private-diffusers-cache-manifest.md",
  "server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt",
  "scripts/validation/ai-video-broll-gen-9j-vm-preflight-2-diagnostics.mjs",
  "package.json"
];

const UNSAFE_PATTERNS = [
  ["service account email", /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
  ["runtime execution true claim", /\b(vmCreated|diskCreated|networkMutated|dependencyInstallRun|modelImportRun|pipelineInstantiated|modelInferenceRun|generatedFramesCreated|generatedVideoCreated|providerCalled|workerDispatched|sqlExecuted|signedUrlsCreated|publicArtifactsCreated)\b\s*[:=]\s*(true|"true")/i],
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
  assert(findings.length === 0, `Unsafe doc text found: ${findings.join("; ")}`);
}

for (const file of REQUIRED_FILES) {
  assert(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
assert(
  packageJson.scripts?.["ai-video-broll-gen-9j-vm-preflight-2:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-9j-vm-preflight-2-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-9j-vm-preflight-2:diagnostics"
);

const result = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-vm-preflight-2-result.md",
  "ai-video-broll-gen-9j-vm-preflight-2-result"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-vm-preflight-2-change-log.md",
  "ai-video-broll-gen-9j-vm-preflight-2-change-log"
);
const cacheValidate = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-cache-validate-result.md",
  "ai-video-broll-gen-9j-cache-validate-result"
);

assert(result.decision === EXPECTED_DECISION, "Result decision mismatch");
assert(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
assert(cacheValidate.decision === CACHE_VALIDATE_DECISION, "Cache validate decision mismatch");
assert(result.nextPrompt === EXPECTED_NEXT_PROMPT, "Result next prompt mismatch");
assert(changeLog.nextPrompt === EXPECTED_NEXT_PROMPT, "Change log next prompt mismatch");

assert(result.gcpReadOnlyPreflight?.projectId === "reeditpro", "Project mismatch");
assert(result.gcpReadOnlyPreflight?.projectLifecycleState === "ACTIVE", "Project must be active");
assert(result.gcpReadOnlyPreflight?.targetRegion === "us-central1", "Target region mismatch");
assert(result.gcpReadOnlyPreflight?.targetZone === "us-central1-b", "Target zone mismatch");
assert(result.gcpReadOnlyPreflight?.defaultComputeZoneSet === false, "Default zone should be unset");
assert(result.gcpReadOnlyPreflight?.zoneStatus === "UP", "Zone must be UP");
assert(result.gcpReadOnlyPreflight?.computeApiEnabled === true, "Compute API must be enabled");
assert(result.gcpReadOnlyPreflight?.iamApiEnabled === true, "IAM API must be enabled");
assert(result.gcpReadOnlyPreflight?.loggingApiEnabled === true, "Logging API must be enabled");
assert(result.gcpReadOnlyPreflight?.monitoringApiEnabled === true, "Monitoring API must be enabled");
assert(result.gcpReadOnlyPreflight?.iapApiEnabled === false, "IAP API should be recorded disabled");
assert(result.gcpReadOnlyPreflight?.gcpMutatingCommandsExecuted === false, "GCP mutation must not run");

assert(result.machineAndQuota?.machineType === "g2-standard-4", "Machine type mismatch");
assert(result.machineAndQuota?.guestCpus === 4, "CPU count mismatch");
assert(result.machineAndQuota?.memoryMb === 16384, "Memory mismatch");
assert(result.machineAndQuota?.accelerator === "nvidia-l4", "Accelerator mismatch");
assert(result.machineAndQuota?.regionalL4QuotaLimit === 1, "L4 quota limit mismatch");
assert(result.machineAndQuota?.regionalL4QuotaUsage === 0, "L4 quota usage mismatch");
assert(result.machineAndQuota?.costFriendlyShapeSelected === true, "Cost-friendly shape must be selected");
assert(result.machineAndQuota?.onDemandPreferredForFirstProof === true, "On-demand should be preferred for first proof");

assert(result.identityAndFirewall?.proofServiceAccountId === "reeditpro-ai-broll-proof-sa", "Proof SA ID mismatch");
assert(result.identityAndFirewall?.proofServiceAccountExists === true, "Proof SA must exist");
assert(result.identityAndFirewall?.proofServiceAccountUserManagedKeyCount === 0, "Proof SA must have zero user keys");
assert(result.identityAndFirewall?.iapSshFirewallRuleExists === true, "IAP SSH firewall rule must exist");
assert(result.identityAndFirewall?.iapSshFirewallRuleDisabled === false, "IAP SSH firewall must be enabled");
assert(result.identityAndFirewall?.iapSshSourceRange === "35.235.240.0/20", "IAP source range mismatch");
assert(result.identityAndFirewall?.iapSshTargetTag === "ai-video-broll-wan-l4-proof", "IAP target tag mismatch");
assert(result.identityAndFirewall?.defaultSshOpenToWorld === true, "Default SSH exposure must be recorded");
assert(result.identityAndFirewall?.externalIpVmRejected === true, "External-IP VM must be rejected");

assert(result.networkAndDependencyPath?.privateIpGoogleAccess === false, "Private Google Access should be recorded false");
assert(result.networkAndDependencyPath?.cloudNatFoundInUsCentral1 === false, "Cloud NAT should be recorded absent");
assert(result.networkAndDependencyPath?.noPublicIpVmRequired === true, "No-public-IP VM must be required");
assert(result.networkAndDependencyPath?.noPublicIpDependencyPathReady === false, "Dependency path must not be ready");
assert(result.networkAndDependencyPath?.requiresIapAndEgressFix === true, "IAP/egress fix must be required");

assert(result.existingProofResources?.instancesFound === 0, "No proof instances should exist");
assert(result.existingProofResources?.disksFound === 0, "No proof disks should exist");
assert(result.existingProofResources?.staticAddressesFound === 0, "No static addresses should exist");
assert(result.existingProofResources?.reservationsFound === 0, "No reservations should exist");
assert(result.existingProofResources?.customImagesFound === 0, "No custom images should exist");

assert(result.cacheAndRunner?.privateCachePath === PRIVATE_CACHE_PATH, "Private cache path mismatch");
assert(result.cacheAndRunner?.runtimeEssentialFileCount === 19, "Runtime file count mismatch");
assert(result.cacheAndRunner?.manifestAggregateBytes === 28928887859, "Manifest aggregate mismatch");
assert(result.cacheAndRunner?.runnerValidateOnlyMustRunFirst === true, "Runner validate-only must run first");
assert(result.cacheAndRunner?.futureExecutionFlagAllowedNow === false, "Future execution flag must remain blocked");

for (const [flag, value] of Object.entries(result.runtimeFlags ?? {})) {
  assert(value === false, `Runtime flag ${flag} must be false`);
}

const promptText = read("docs/implementation-prompts/prompt-ai-video-broll-gen-9j-gcp-iap-egress-fix.md");
for (const expected of [
  EXPECTED_NEXT_PROMPT,
  "enable `iap.googleapis.com`",
  "keep VM creation blocked",
  "local wheelhouse/dependency bundle",
  "external-IP VM with open default SSH exposure",
  "AI-VIDEO-BROLL-GEN-9J-VM-PREFLIGHT-3"
]) {
  assert(promptText.includes(expected), `Next prompt missing ${expected}`);
}

ensureSafeDocs([
  "docs/ai-video-broll-generation-gcp-private-vm-preflight-2-result.md",
  "docs/ai-video-broll-generation-gcp-private-vm-preflight-2-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-gcp-iap-egress-fix.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  projectId: result.gcpReadOnlyPreflight.projectId,
  targetZone: result.gcpReadOnlyPreflight.targetZone,
  machineType: result.machineAndQuota.machineType,
  accelerator: result.machineAndQuota.accelerator,
  regionalL4QuotaLimit: result.machineAndQuota.regionalL4QuotaLimit,
  regionalL4QuotaUsage: result.machineAndQuota.regionalL4QuotaUsage,
  iapApiEnabled: result.gcpReadOnlyPreflight.iapApiEnabled,
  noPublicIpDependencyPathReady: result.networkAndDependencyPath.noPublicIpDependencyPathReady,
  vmPreflightPassed: result.runtimeFlags.vmPreflightPassed,
  vmCreateAllowedNext: result.runtimeFlags.vmCreateAllowedNext,
  gcpMutatingCommandsExecuted: result.gcpReadOnlyPreflight.gcpMutatingCommandsExecuted,
  vmCreated: false,
  dependencyInstallRun: false,
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
