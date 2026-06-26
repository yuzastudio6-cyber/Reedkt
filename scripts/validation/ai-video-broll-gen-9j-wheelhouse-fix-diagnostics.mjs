#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const EXPECTED_DECISION =
  "ai_video_broll_gen_9j_wheelhouse_fix_complete_private_binary_wheelhouse_ready_for_iap_transfer_preflight";
const EXPECTED_NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-9J-VM-PREFLIGHT-4: verify IAP wheelhouse transfer readiness, no VM/no inference";
const EXPECTED_WHEELHOUSE =
  "/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python313-linux-x86_64";
const EXPECTED_MANIFEST = path.join(EXPECTED_WHEELHOUSE, "SHA256SUMS.json");
const EXPECTED_AGGREGATE_SHA =
  "366835269639cd0d7bd24fcb876d39f94bca2bb9c4772735a16fa2458dfbfc11";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-gcp-private-wheelhouse-fix-result.md",
  "docs/ai-video-broll-generation-gcp-private-wheelhouse-fix-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-vm-preflight-4.md",
  "docs/ai-video-broll-generation-gcp-private-wheelhouse-prep-result.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-wheelhouse-fix.md",
  "server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt",
  "scripts/validation/ai-video-broll-gen-9j-wheelhouse-fix-diagnostics.mjs",
  "package.json"
];

const REQUIRED_WHEEL_PREFIXES = [
  "torch-2.12.1-",
  "torchvision-0.27.1-",
  "diffusers-0.38.0-",
  "transformers-5.12.1-",
  "accelerate-1.14.0-",
  "safetensors-0.8.0-",
  "huggingface_hub-1.21.0-",
  "sentencepiece-0.2.1-",
  "protobuf-7.35.1-",
  "einops-0.8.2-",
  "numpy-2.5.0-",
  "pillow-12.2.0-",
  "cuda_toolkit-13.0.2-",
  "nvidia_cublas-13.1.0.3-",
  "cuda_bindings-13.3.1-",
  "cuda_pathfinder-1.5.5-",
  "nvidia_cudnn_cu13-9.20.0.48-",
  "nvidia_cusparselt_cu13-0.8.1-",
  "nvidia_nccl_cu13-2.29.7-",
  "nvidia_nvshmem_cu13-3.4.5-",
  "triton-3.7.1-",
  "nvidia_cuda_runtime-13.0.96-",
  "nvidia_cufft-12.0.0.61-",
  "nvidia_cufile-1.15.1.6-",
  "nvidia_cuda_cupti-13.0.85-",
  "nvidia_curand-10.4.0.35-",
  "nvidia_cusolver-12.0.4.66-",
  "nvidia_cusparse-12.6.3.3-",
  "nvidia_nvjitlink-13.0.88-",
  "nvidia_cuda_nvrtc-13.0.88-",
  "nvidia_nvtx-13.0.85-"
];

const REJECTED_WHEEL_PREFIXES = [
  "nvidia_cublas-13.1.1.3-",
  "nvidia_cuda_nvrtc-13.3.33-"
];

const UNSAFE_PATTERNS = [
  ["service account email", /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
  ["runtime execution true claim", /\b(vmCreated|gcpMutated|dependencyInstalledOnVm|sourceRepositoryCloned|modelDownloaded|modelImported|pipelineInstantiated|modelFromPretrainedCalled|torchLoadCalled|modelInferenceRun|generatedFramesCreated|generatedVideoCreated|mediaProcessingRun|ffmpegRun|providerCalled|workerDispatched|supabaseTouched|sqlExecuted|storageUploaded|signedUrlsCreated|publicArtifactsCreated|creditMutationCreated|betaUnlocked|productionUnlocked|dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i],
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
  packageJson.scripts?.["ai-video-broll-gen-9j-wheelhouse-fix:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-9j-wheelhouse-fix-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-9j-wheelhouse-fix:diagnostics"
);

const result = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-wheelhouse-fix-result.md",
  "ai-video-broll-gen-9j-wheelhouse-fix-result"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-wheelhouse-fix-change-log.md",
  "ai-video-broll-gen-9j-wheelhouse-fix-change-log"
);
const manifest = JSON.parse(fs.readFileSync(EXPECTED_MANIFEST, "utf8"));

check(result.decision === EXPECTED_DECISION, "Result decision mismatch");
check(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
check(result.nextPrompt === EXPECTED_NEXT_PROMPT, "Result next prompt mismatch");
check(changeLog.nextPrompt === EXPECTED_NEXT_PROMPT, "Change log next prompt mismatch");
check(result.targetWheelhouse === EXPECTED_WHEELHOUSE, "Result wheelhouse path mismatch");
check(result.checksumManifest === EXPECTED_MANIFEST, "Result manifest path mismatch");
check(manifest.wheelhousePath === EXPECTED_WHEELHOUSE, "Manifest wheelhouse path mismatch");
check(manifest.phase === "AI-VIDEO-BROLL-GEN-9J-WHEELHOUSE-FIX", "Manifest phase mismatch");
check(
  manifest.status === "complete_private_binary_wheelhouse_ready_for_iap_transfer_preflight",
  "Manifest status mismatch"
);

check(result.wheelhouseManifest?.realWheelCount === 66, "Result wheel count mismatch");
check(result.wheelhouseManifest?.aggregateBytes === 2802293613, "Result aggregate bytes mismatch");
check(result.wheelhouseManifest?.aggregateSha256 === EXPECTED_AGGREGATE_SHA, "Result aggregate SHA mismatch");
check(manifest.realWheelCount === 66, "Manifest wheel count mismatch");
check(manifest.aggregateBytes === 2802293613, "Manifest aggregate bytes mismatch");
check(manifest.aggregateSha256 === EXPECTED_AGGREGATE_SHA, "Manifest aggregate SHA mismatch");
check(Array.isArray(manifest.wheels) && manifest.wheels.length === 66, "Manifest wheel list mismatch");

const wheelNames = manifest.wheels.map((wheel) => wheel.fileName);
for (const prefix of REQUIRED_WHEEL_PREFIXES) {
  check(wheelNames.some((name) => name.startsWith(prefix)), `Missing wheel prefix: ${prefix}`);
}
for (const prefix of REJECTED_WHEEL_PREFIXES) {
  check(!wheelNames.some((name) => name.startsWith(prefix)), `Superseded wheel must be pruned: ${prefix}`);
}
check(wheelNames.every((name) => name.endsWith(".whl")), "Manifest must list only wheel files");
check(wheelNames.every((name) => !name.startsWith("._")), "Manifest must exclude AppleDouble sidecars");

check(result.dependencyStatus?.directRequirementsWheelDownloadPassed === true, "Direct requirements must pass");
check(result.dependencyStatus?.linuxRuntimeDependencyResolutionPassed === true, "Linux runtime deps must pass");
check(result.dependencyStatus?.cudaToolkitLinuxExtrasExplicitlyBundled === true, "CUDA extras must be explicit");
check(result.dependencyStatus?.offlineNoIndexResolverCopyPassed === true, "Offline resolver-copy must pass");
check(result.dependencyStatus?.offlineResolvedWheelCount === 66, "Offline resolved count mismatch");
check(result.dependencyStatus?.sourceBuildsUsed === false, "Source builds must not be used");
check(result.dependencyStatus?.wheelhouseComplete === true, "Wheelhouse must be complete");
check(
  result.dependencyStatus?.wheelhouseReadyForIapTransferPreflight === true,
  "Wheelhouse must be ready for IAP transfer preflight"
);
check(result.dependencyStatus?.vmCreateAllowedNext === false, "VM creation must remain blocked");
check(result.dependencyStatus?.nextGateRequiresIapTransferPreflight === true, "Next gate mismatch");
check(manifest.offlineNoIndexResolverCopyPassed === true, "Manifest offline proof mismatch");
check(manifest.wheelhouseComplete === true, "Manifest completion mismatch");
check(manifest.vmCreateAllowedNext === false, "Manifest VM gate mismatch");

for (const [flag, value] of Object.entries(result.runtimeFlags ?? {})) {
  check(value === false, `Runtime flag ${flag} must be false`);
}
for (const [flag, value] of Object.entries(changeLog.runtimeFlags ?? {})) {
  check(value === false, `Change-log runtime flag ${flag} must be false`);
}
for (const [flag, value] of Object.entries(manifest.runtimeFlags ?? {})) {
  check(value === false, `Manifest runtime flag ${flag} must be false`);
}

const nextPrompt = read("docs/implementation-prompts/prompt-ai-video-broll-gen-9j-vm-preflight-4.md");
for (const expected of [
  EXPECTED_NEXT_PROMPT,
  "verify the future IAP transfer command shape without running it",
  "verify the future no-index install command shape without running it",
  "Do not create a VM",
  "Do not run IAP transfer commands",
  "Do not import models"
]) {
  check(nextPrompt.includes(expected), `VM preflight 4 prompt missing: ${expected}`);
}

const sidecars = fs.readdirSync(EXPECTED_WHEELHOUSE).filter((name) => name.startsWith("._"));
check(sidecars.length === 0, `Wheelhouse contains AppleDouble sidecars: ${sidecars.join(", ")}`);

ensureSafeText([
  "docs/ai-video-broll-generation-gcp-private-wheelhouse-fix-result.md",
  "docs/ai-video-broll-generation-gcp-private-wheelhouse-fix-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-vm-preflight-4.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  targetWheelhouse: EXPECTED_WHEELHOUSE,
  manifestPath: EXPECTED_MANIFEST,
  realWheelCount: manifest.realWheelCount,
  aggregateBytes: manifest.aggregateBytes,
  aggregateSha256: manifest.aggregateSha256,
  directRequirementsWheelDownloadPassed: result.dependencyStatus.directRequirementsWheelDownloadPassed,
  linuxRuntimeDependencyResolutionPassed: result.dependencyStatus.linuxRuntimeDependencyResolutionPassed,
  cudaToolkitLinuxExtrasExplicitlyBundled: result.dependencyStatus.cudaToolkitLinuxExtrasExplicitlyBundled,
  offlineNoIndexResolverCopyPassed: result.dependencyStatus.offlineNoIndexResolverCopyPassed,
  offlineResolvedWheelCount: result.dependencyStatus.offlineResolvedWheelCount,
  sourceBuildsUsed: result.dependencyStatus.sourceBuildsUsed,
  wheelhouseComplete: result.dependencyStatus.wheelhouseComplete,
  wheelhouseReadyForIapTransferPreflight: result.dependencyStatus.wheelhouseReadyForIapTransferPreflight,
  vmCreateAllowedNext: result.dependencyStatus.vmCreateAllowedNext,
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
