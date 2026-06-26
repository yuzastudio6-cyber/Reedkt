#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const EXPECTED_DECISION =
  "ai_video_broll_gen_9j_wheelhouse_prep_blocked_missing_linux_gpu_runtime_wheels";
const EXPECTED_NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-9J-WHEELHOUSE-FIX: resolve Torch Linux GPU runtime wheel source, no VM/no inference";
const EXPECTED_WHEELHOUSE =
  "/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python313-linux_x86_64".replace(
    "linux_x86_64",
    "linux-x86_64"
  );
const EXPECTED_MANIFEST = path.join(EXPECTED_WHEELHOUSE, "SHA256SUMS.json");
const EXPECTED_AGGREGATE_SHA =
  "655519c2a7e281ac4c2b50bf8f0117f4bf9c83132fdb626a80a1dffe70f96ce3";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-gcp-private-wheelhouse-prep-result.md",
  "docs/ai-video-broll-generation-gcp-private-wheelhouse-prep-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-wheelhouse-fix.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-wheelhouse-prep.md",
  "docs/ai-video-broll-generation-gcp-private-vm-preflight-3-result.md",
  "server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt",
  "scripts/validation/ai-video-broll-gen-9j-wheelhouse-prep-diagnostics.mjs",
  "package.json"
];

const REQUIRED_DIRECT_WHEEL_PREFIXES = [
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
  "pillow-12.2.0-"
];

const REQUIRED_UNRESOLVED = [
  "cuda-toolkit",
  "nvidia-cublas",
  "cuda-bindings",
  "nvidia-cudnn-cu13",
  "nvidia-cusparselt-cu13",
  "nvidia-nccl-cu13",
  "nvidia-nvshmem-cu13",
  "triton"
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
  packageJson.scripts?.["ai-video-broll-gen-9j-wheelhouse-prep:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-9j-wheelhouse-prep-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-9j-wheelhouse-prep:diagnostics"
);

const result = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-wheelhouse-prep-result.md",
  "ai-video-broll-gen-9j-wheelhouse-prep-result"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-wheelhouse-prep-change-log.md",
  "ai-video-broll-gen-9j-wheelhouse-prep-change-log"
);
const manifest = JSON.parse(fs.readFileSync(EXPECTED_MANIFEST, "utf8"));

check(result.decision === EXPECTED_DECISION, "Result decision mismatch");
check(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
check(result.nextPrompt === EXPECTED_NEXT_PROMPT, "Result next prompt mismatch");
check(changeLog.nextPrompt === EXPECTED_NEXT_PROMPT, "Change log next prompt mismatch");

check(result.targetWheelhouse === EXPECTED_WHEELHOUSE, "Result wheelhouse path mismatch");
check(result.checksumManifest === EXPECTED_MANIFEST, "Result manifest path mismatch");
check(manifest.wheelhousePath === EXPECTED_WHEELHOUSE, "Manifest wheelhouse path mismatch");
check(manifest.requirementsManifest === result.requirementsManifest, "Manifest requirements mismatch");

check(result.target?.pythonVersion === "3.13", "Target Python version mismatch");
check(result.target?.abi === "cp313", "Target ABI mismatch");
check(result.target?.platforms?.includes("manylinux_2_28_x86_64"), "Missing manylinux_2_28 target");
check(result.target?.platforms?.includes("manylinux2014_x86_64"), "Missing manylinux2014 target");

check(result.wheelhouseManifest?.realWheelCount === 47, "Result wheel count mismatch");
check(result.wheelhouseManifest?.aggregateBytes === 606414976, "Result aggregate bytes mismatch");
check(result.wheelhouseManifest?.aggregateSha256 === EXPECTED_AGGREGATE_SHA, "Result aggregate SHA mismatch");
check(result.wheelhouseManifest?.appleDoubleSidecarsExcluded === true, "Sidecar exclusion must be recorded");
check(manifest.realWheelCount === 47, "Manifest wheel count mismatch");
check(manifest.aggregateBytes === 606414976, "Manifest aggregate bytes mismatch");
check(manifest.aggregateSha256 === EXPECTED_AGGREGATE_SHA, "Manifest aggregate SHA mismatch");
check(Array.isArray(manifest.wheels) && manifest.wheels.length === 47, "Manifest wheel list mismatch");

const wheelNames = manifest.wheels.map((wheel) => wheel.fileName);
for (const prefix of REQUIRED_DIRECT_WHEEL_PREFIXES) {
  check(wheelNames.some((name) => name.startsWith(prefix)), `Missing direct wheel prefix: ${prefix}`);
}
check(wheelNames.every((name) => name.endsWith(".whl")), "Manifest must list only wheel files");
check(wheelNames.every((name) => !name.startsWith("._")), "Manifest must exclude AppleDouble sidecars");

const unresolvedText = [
  ...(result.unresolvedTorchLinuxRuntimeDependencies ?? []),
  ...(manifest.unresolvedTorchLinuxRuntimeDependencies ?? [])
].join("\n");
for (const required of REQUIRED_UNRESOLVED) {
  check(unresolvedText.includes(required), `Missing unresolved runtime dependency: ${required}`);
}

check(result.dependencyStatus?.directRequirementsWheelDownloadPassed === true, "Direct requirements should pass");
check(result.dependencyStatus?.linuxRuntimeDependencyResolutionPassed === false, "Linux runtime dependency resolution must fail");
check(result.dependencyStatus?.wheelhouseComplete === false, "Wheelhouse must be incomplete");
check(result.dependencyStatus?.wheelhouseReadyForIapTransfer === false, "Wheelhouse must not be transfer-ready");
check(result.dependencyStatus?.vmCreateAllowedNext === false, "VM creation must remain blocked");
check(
  result.dependencyStatus?.firstResolutionFailure?.includes("nvidia-cublas"),
  "First resolution failure must record nvidia-cublas"
);
check(result.dependencyStatus?.python311MetadataMatchedTorchLinuxRuntimeDependencies === true, "cp311 metadata probe must be recorded");
check(result.dependencyStatus?.python312MetadataMatchedTorchLinuxRuntimeDependencies === true, "cp312 metadata probe must be recorded");

for (const [flag, value] of Object.entries(result.runtimeFlags ?? {})) {
  check(value === false, `Runtime flag ${flag} must be false`);
}
for (const [flag, value] of Object.entries(changeLog.runtimeFlags ?? {})) {
  check(value === false, `Change-log runtime flag ${flag} must be false`);
}
for (const [flag, value] of Object.entries(manifest.runtimeFlags ?? {})) {
  check(value === false, `Manifest runtime flag ${flag} must be false`);
}

const followUpPrompt = read("docs/implementation-prompts/prompt-ai-video-broll-gen-9j-wheelhouse-fix.md");
for (const expected of [
  EXPECTED_NEXT_PROMPT,
  "repair the private dependency wheelhouse plan",
  "Torch Linux GPU runtime dependencies",
  "AI-VIDEO-BROLL-GEN-9J-VM-PREFLIGHT-4",
  "Do not create a VM",
  "Do not import models"
]) {
  check(followUpPrompt.includes(expected), `Follow-up prompt missing: ${expected}`);
}

const sidecars = fs.readdirSync(EXPECTED_WHEELHOUSE).filter((name) => name.startsWith("._"));
check(sidecars.length === 0, `Wheelhouse contains AppleDouble sidecars: ${sidecars.join(", ")}`);

ensureSafeText([
  "docs/ai-video-broll-generation-gcp-private-wheelhouse-prep-result.md",
  "docs/ai-video-broll-generation-gcp-private-wheelhouse-prep-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-wheelhouse-fix.md"
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
  wheelhouseComplete: result.dependencyStatus.wheelhouseComplete,
  wheelhouseReadyForIapTransfer: result.dependencyStatus.wheelhouseReadyForIapTransfer,
  vmCreateAllowedNext: result.dependencyStatus.vmCreateAllowedNext,
  firstResolutionFailure: result.dependencyStatus.firstResolutionFailure,
  vmCreated: false,
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
