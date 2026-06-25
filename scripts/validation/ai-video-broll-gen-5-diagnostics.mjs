#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const EXPECTED_DECISION =
  "ai_video_broll_gen_5_controlled_dependency_install_completed_with_warnings_ready_for_model_weight_download_proof";

const REQUIREMENTS_PATH =
  "server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt";

const REQUIRED_FILES = [
  REQUIREMENTS_PATH,
  "docs/ai-video-broll-generation-controlled-dependency-install-result.md",
  "docs/ai-video-broll-generation-controlled-install-change-log.md",
  "docs/ai-video-broll-generation-controlled-install-rollback-report.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-6-controlled-model-weight-download-proof.md",
  "scripts/validation/ai-video-broll-gen-5-diagnostics.mjs",
  "docs/ai-video-broll-generation-runtime-gpu-owner-review.md",
  "docs/ai-video-broll-generation-runtime-gpu-tier-decision.md",
  "docs/ai-video-broll-generation-runtime-owner-acceptance-map.md",
  "docs/ai-video-broll-generation-gate-4-blocker-register.md",
  "package.json"
];

const EXPECTED_REQUIREMENTS = [
  "torch==2.12.1",
  "torchvision==0.27.1",
  "diffusers==0.38.0",
  "transformers==5.12.1",
  "accelerate==1.14.0",
  "safetensors==0.8.0",
  "huggingface-hub==1.21.0",
  "sentencepiece==0.2.1",
  "protobuf==7.35.1",
  "einops==0.8.2",
  "numpy==2.5.0",
  "pillow==12.2.0"
];

const FORBIDDEN_REQUIREMENT_NAMES = [
  "hunyuan",
  "mochi",
  "wan2",
  "ltx-video",
  "ffmpeg",
  "ffprobe",
  "imageio-ffmpeg",
  "opencv-python",
  "xformers",
  "flash-attn",
  "triton",
  "comfyui"
];

const RUNTIME_FLAGS_FALSE = [
  "modelWeightDownloadAllowed",
  "modelImportAllowed",
  "modelInferenceAllowed",
  "generatedVideoAllowed",
  "mediaProcessingAllowed",
  "providerCallsAllowed",
  "workerExecutionAllowed",
  "routeExecutionAllowed",
  "supabaseMutationAllowed",
  "sqlAllowed",
  "dockerCloudRunAllowed",
  "signedUrlCreationAllowed",
  "publicArtifactCreationAllowed",
  "creditMutationAllowed",
  "dryRunPassedClaimed",
  "generatedLocalFixturePassedClaimed",
  "runtimeReadinessClaimed",
  "betaProductionUnlockClaimed"
];

const UNSAFE_PATTERNS = [
  ["model weight download claim", /\bmodelWeightDownloadAllowed\b\s*[:=]\s*(true|"true")/i],
  ["model import claim", /\bmodelImportAllowed\b\s*[:=]\s*(true|"true")/i],
  ["model inference claim", /\bmodelInferenceAllowed\b\s*[:=]\s*(true|"true")/i],
  ["generated video claim", /\bgeneratedVideoAllowed\b\s*[:=]\s*(true|"true")/i],
  ["media processing claim", /\bmediaProcessingAllowed\b\s*[:=]\s*(true|"true")/i],
  ["provider call claim", /\bproviderCallsAllowed\b\s*[:=]\s*(true|"true")/i],
  ["worker execution claim", /\bworkerExecutionAllowed\b\s*[:=]\s*(true|"true")/i],
  ["route execution claim", /\brouteExecutionAllowed\b\s*[:=]\s*(true|"true")/i],
  ["Supabase mutation claim", /\bsupabaseMutationAllowed\b\s*[:=]\s*(true|"true")/i],
  ["SQL claim", /\bsqlAllowed\b\s*[:=]\s*(true|"true")/i],
  ["Docker/Cloud Run claim", /\bdockerCloudRunAllowed\b\s*[:=]\s*(true|"true")/i],
  ["signed URL claim", /\bsignedUrlCreationAllowed\b\s*[:=]\s*(true|"true")/i],
  ["public artifact claim", /\bpublicArtifactCreationAllowed\b\s*[:=]\s*(true|"true")/i],
  ["credit mutation claim", /\bcreditMutationAllowed\b\s*[:=]\s*(true|"true")/i],
  ["dry run passed claim", /\bdryRunPassedClaimed\b\s*[:=]\s*(true|"true")/i],
  ["generated local fixture claim", /\bgeneratedLocalFixturePassedClaimed\b\s*[:=]\s*(true|"true")/i],
  ["runtime readiness claim", /\bruntimeReadinessClaimed\b\s*[:=]\s*(true|"true")/i],
  ["beta production claim", /\bbetaProductionUnlockClaimed\b\s*[:=]\s*(true|"true")/i],
  ["DB URL", /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ["JWT", /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/],
  ["Authorization bearer", /\bAuthorization\s*:\s*Bearer\s+[A-Za-z0-9._-]+/i],
  ["Supabase project URL", /https:\/\/[a-z0-9]{20}\.supabase\.co/i],
  ["API key assignment", /\bapi[_-]?key\s*[:=]\s*['"][^'"]+/i],
  ["service role assignment", /\bservice[_-]?role\s*[:=]\s*['"][^'"]+/i],
  ["secret assignment", /\bsecret\s*[:=]\s*['"][^'"]+/i]
];

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function sorted(values) {
  return [...values].sort();
}

function sameSet(actual, expected, label) {
  assert(
    JSON.stringify(sorted(actual)) === JSON.stringify(sorted(expected)),
    `${label} mismatch`
  );
}

function parseBlock(relativePath, label) {
  const text = read(relativePath);
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp("```json\\s+" + escaped + "\\n([\\s\\S]*?)\\n```"));
  assert(match, `Missing JSON block ${label} in ${relativePath}`);
  return JSON.parse(match[1]);
}

function ensureFlagsClosed(flags, label) {
  for (const flag of RUNTIME_FLAGS_FALSE) {
    assert(flags?.[flag] === false, `${label} must keep ${flag} false`);
  }
  assert(flags?.dependencyResolutionAllowed === true, `${label} must allow dependency resolution only`);
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
  packageJson.scripts?.["ai-video-broll-gen-5:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-5-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-5:diagnostics"
);

const requirementsText = read(REQUIREMENTS_PATH);
const requirementLines = requirementsText
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

sameSet(requirementLines, EXPECTED_REQUIREMENTS, "requirements direct pins");
for (const line of requirementLines) {
  assert(/^[A-Za-z0-9_.-]+==[0-9][A-Za-z0-9_.!+-]*$/.test(line), `Invalid exact pin: ${line}`);
}

const lowerRequirements = requirementsText.toLowerCase();
for (const forbidden of FORBIDDEN_REQUIREMENT_NAMES) {
  assert(!lowerRequirements.includes(forbidden), `Forbidden dependency in requirements: ${forbidden}`);
}

const result = parseBlock(
  "docs/ai-video-broll-generation-controlled-dependency-install-result.md",
  "ai-video-broll-gen-5-controlled-install-result"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-controlled-install-change-log.md",
  "ai-video-broll-gen-5-controlled-install-change-log"
);
const rollback = parseBlock(
  "docs/ai-video-broll-generation-controlled-install-rollback-report.md",
  "ai-video-broll-gen-5-controlled-install-rollback-report"
);

assert(result.decision === EXPECTED_DECISION, "Unexpected AI-VIDEO-BROLL-GEN-5 decision");
assert(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
assert(rollback.decision === EXPECTED_DECISION, "Rollback decision mismatch");
assert(result.sourceCommit === "0aa0b1cb", "Gate 5 source commit must be Gate 4 commit");
assert(result.requirementsManifest === REQUIREMENTS_PATH, "Unexpected requirements manifest path");
assert(result.proofScope?.smallPreviewLaneOnly === true, "Proof must stay small-preview lane only");
assert(result.proofScope?.hunyuanBlocked === true, "Hunyuan must remain blocked");
assert(result.pythonResolution?.controlledDependencyInstallCompleted === true, "Controlled dependency install must complete");
assert(result.pythonResolution?.tempVenvCleaned === true, "Temp venv cleanup must be verified");
assert(result.pythonResolution?.modelWeightDownloadsRun === false, "Model weights must not download");
assert(result.pythonResolution?.modelImportCommandsRun === false, "Model import must not run");
assert(result.pythonResolution?.inferenceCommandsRun === false, "Inference must not run");
assert(result.pythonResolution?.generatedVideoCommandsRun === false, "Generated video commands must not run");
assert(result.pythonResolution?.mediaProcessingCommandsRun === false, "Media processing must not run");
ensureFlagsClosed(result.runtimeFlags, "AI-VIDEO-BROLL-GEN-5 result");

sameSet(
  result.directPackagePins.map((item) => item.manifestLine),
  EXPECTED_REQUIREMENTS,
  "result manifest pins"
);
sameSet(changeLog.manifestDirectPins, EXPECTED_REQUIREMENTS, "change log manifest pins");

assert(changeLog.packageLockChanged === false, "package-lock must remain unchanged");
assert(changeLog.nodePackageDependencyChanged === false, "node dependencies must not change");
assert(changeLog.runtimeFilesChanged === false, "runtime files must not change");
assert(changeLog.supabaseFilesChanged === false, "Supabase files must not change");
assert(changeLog.sqlFilesChanged === false, "SQL files must not change");
assert(changeLog.modelWeightsCreated === false, "model weights must not be created");
assert(changeLog.mediaArtifactsCreated === false, "media artifacts must not be created");

assert(rollback.packageLockRollbackRequired === false, "package-lock rollback must not be required");
assert(rollback.runtimeRollbackRequired === false, "runtime rollback must not be required");
assert(rollback.supabaseRollbackRequired === false, "Supabase rollback must not be required");
assert(rollback.sqlRollbackRequired === false, "SQL rollback must not be required");
assert(rollback.artifactRollbackRequired === false, "artifact rollback must not be required");
assert(rollback.modelWeightRollbackRequired === false, "model weight rollback must not be required");
assert(rollback.tempVenvCleanup?.completed === true, "temp venv cleanup must be completed");

const promptText = read("docs/implementation-prompts/prompt-ai-video-broll-gen-6-controlled-model-weight-download-proof.md");
assert(promptText.includes("AI-VIDEO-BROLL-GEN-6 Controlled Model Weight Download Proof"), "Missing Gate 6 prompt title");
assert(promptText.includes("No model import."), "Gate 6 prompt must block model import");
assert(promptText.includes("No inference."), "Gate 6 prompt must block inference");
assert(promptText.includes("No generated video."), "Gate 6 prompt must block generated video");
assert(promptText.includes("dry_run_passed"), "Gate 6 prompt must block dry run pass claims");
assert(promptText.includes("generated_local_fixture_passed"), "Gate 6 prompt must block generated local fixture pass claims");

for (const required of [
  "conditional_runtime_gpu_acceptance_for_future_dependency_install_proof",
  "small_preview_gpu",
  "futureDependencyInstallProofAllowedAfterPreflight: true"
]) {
  const sourceText = read("docs/ai-video-broll-generation-runtime-owner-acceptance-map.md") +
    read("docs/ai-video-broll-generation-runtime-gpu-owner-review.md") +
    read("docs/ai-video-broll-generation-runtime-gpu-tier-decision.md");
  assert(sourceText.includes(required), `Missing Gate 4 source evidence: ${required}`);
}

ensureSafeText([
  REQUIREMENTS_PATH,
  "docs/ai-video-broll-generation-controlled-dependency-install-result.md",
  "docs/ai-video-broll-generation-controlled-install-change-log.md",
  "docs/ai-video-broll-generation-controlled-install-rollback-report.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-6-controlled-model-weight-download-proof.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  requirementsManifest: REQUIREMENTS_PATH,
  directPackageCount: EXPECTED_REQUIREMENTS.length,
  controlledDependencyInstallCompleted: true,
  tempVenvCleaned: true,
  modelWeightsDownloaded: false,
  modelImported: false,
  inferenceRun: false,
  generatedVideoCreated: false,
  dockerOrGcpTouched: false,
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
  nextPrompt: "AI-VIDEO-BROLL-GEN-6: controlled model weight download proof, no import/no inference"
}, null, 2));
