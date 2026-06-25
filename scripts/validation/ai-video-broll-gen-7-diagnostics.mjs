#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const EXPECTED_DECISION =
  "ai_video_broll_gen_7_model_loader_import_completed_ready_for_controlled_synthetic_generation_plan";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-controlled-model-loader-import-result.md",
  "docs/ai-video-broll-generation-controlled-model-loader-import-metadata.md",
  "docs/ai-video-broll-generation-controlled-model-loader-import-change-log.md",
  "docs/ai-video-broll-generation-controlled-model-loader-import-rollback-report.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-8-controlled-synthetic-generation-plan.md",
  "scripts/validation/ai-video-broll-gen-7-diagnostics.mjs",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-7-model-loader-import-proof.md",
  "docs/ai-video-broll-generation-controlled-model-weight-download-result.md",
  "docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md",
  "server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt",
  "package.json"
];

const RUNTIME_FLAGS_FALSE = [
  "modelWeightDownloadAllowed",
  "pipelineInstantiationAllowed",
  "modelFromPretrainedAllowed",
  "torchLoadAllowed",
  "promptCreationAllowed",
  "textEncodingAllowed",
  "denoisingStepAllowed",
  "schedulerRunAllowed",
  "vaeEncodeDecodeAllowed",
  "modelInferenceAllowed",
  "generatedFramesAllowed",
  "generatedVideoAllowed",
  "mediaProcessingAllowed",
  "ffmpegAllowed",
  "providerCallsAllowed",
  "workerExecutionAllowed",
  "routeExecutionAllowed",
  "supabaseMutationAllowed",
  "sqlAllowed",
  "dockerCloudRunAllowed",
  "gcpMutationAllowed",
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
  ["pipeline instantiation claim", /\bpipelineInstantiated\b\s*[:=]\s*(true|"true")/i],
  ["from pretrained claim", /\bmodelFromPretrainedCalled\b\s*[:=]\s*(true|"true")/i],
  ["torch load claim", /\btorchLoadCalled\b\s*[:=]\s*(true|"true")/i],
  ["prompt creation claim", /\b(promptCreated|promptCreationAllowed)\b\s*[:=]\s*(true|"true")/i],
  ["text encoding claim", /\b(textEncodingCalled|textEncodingAllowed)\b\s*[:=]\s*(true|"true")/i],
  ["denoising claim", /\b(denoisingStepCalled|denoisingStepAllowed)\b\s*[:=]\s*(true|"true")/i],
  ["scheduler claim", /\b(schedulerRun|schedulerRunAllowed)\b\s*[:=]\s*(true|"true")/i],
  ["VAE encode/decode claim", /\b(vaeEncodeDecodeCalled|vaeEncodeDecodeAllowed)\b\s*[:=]\s*(true|"true")/i],
  ["model inference claim", /\b(modelInferenceAllowed|inferenceRun)\b\s*[:=]\s*(true|"true")/i],
  ["generated frames claim", /\b(generatedFramesAllowed|generatedFramesCreated)\b\s*[:=]\s*(true|"true")/i],
  ["generated video claim", /\b(generatedVideoAllowed|generatedVideoCreated)\b\s*[:=]\s*(true|"true")/i],
  ["media processing claim", /\bmediaProcessingAllowed\b\s*[:=]\s*(true|"true")/i],
  ["FFmpeg claim", /\bffmpegAllowed\b\s*[:=]\s*(true|"true")/i],
  ["provider call claim", /\bproviderCallsAllowed\b\s*[:=]\s*(true|"true")/i],
  ["worker execution claim", /\bworkerExecutionAllowed\b\s*[:=]\s*(true|"true")/i],
  ["Supabase mutation claim", /\bsupabaseMutationAllowed\b\s*[:=]\s*(true|"true")/i],
  ["SQL claim", /\bsqlAllowed\b\s*[:=]\s*(true|"true")/i],
  ["signed URL claim", /\bsignedUrlCreationAllowed\b\s*[:=]\s*(true|"true")/i],
  ["public artifact claim", /\bpublicArtifactCreationAllowed\b\s*[:=]\s*(true|"true")/i],
  ["dry run passed claim", /\bdryRunPassedClaimed\b\s*[:=]\s*(true|"true")/i],
  ["generated local fixture claim", /\bgeneratedLocalFixturePassedClaimed\b\s*[:=]\s*(true|"true")/i],
  ["runtime readiness claim", /\bruntimeReadinessClaimed\b\s*[:=]\s*(true|"true")/i],
  ["beta production claim", /\bbetaProductionUnlockClaimed\b\s*[:=]\s*(true|"true")/i],
  ["signed URL query", /\b(X-Amz-Signature|X-Amz-Credential|Expires=|Signature=|Policy=|Key-Pair-Id=)/i],
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
  assert(flags?.dependencyInstallAllowed === true, `${label} must allow throwaway dependency install`);
  assert(flags?.dependencyModuleImportAllowed === true, `${label} must allow dependency module import`);
  assert(flags?.modelLoaderMetadataInspectionAllowed === true, `${label} must allow metadata inspection`);
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
  packageJson.scripts?.["ai-video-broll-gen-7:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-7-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-7:diagnostics"
);

const result = parseBlock(
  "docs/ai-video-broll-generation-controlled-model-loader-import-result.md",
  "ai-video-broll-gen-7-model-loader-import-result"
);
const metadata = parseBlock(
  "docs/ai-video-broll-generation-controlled-model-loader-import-metadata.md",
  "ai-video-broll-gen-7-model-loader-import-metadata"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-controlled-model-loader-import-change-log.md",
  "ai-video-broll-gen-7-model-loader-import-change-log"
);
const rollback = parseBlock(
  "docs/ai-video-broll-generation-controlled-model-loader-import-rollback-report.md",
  "ai-video-broll-gen-7-model-loader-import-rollback-report"
);

assert(result.decision === EXPECTED_DECISION, "Unexpected AI-VIDEO-BROLL-GEN-7 decision");
assert(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
assert(rollback.decision === EXPECTED_DECISION, "Rollback decision mismatch");
assert(result.sourceCommit === "34ca209c", "Gate 7 source commit must be Gate 6 commit");
assert(result.selectedModel?.modelId === "Wan-AI/Wan2.1-T2V-1.3B", "Gate 7 must use Wan 1.3B");
assert(result.selectedModel?.sourceRevision === "37ec512624d61f7aa208f7ea8140a131f93afc9a", "Unexpected source revision");
assert(result.throwawayEnvironment?.requirementsManifest === "server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt", "Unexpected requirements manifest");
assert(result.throwawayEnvironment?.cleanupVerified === true, "Throwaway venv cleanup must be verified");
assert(result.offlineMode?.networkRequiredForProof === false, "Gate 7 proof must be offline");
assert(result.imports?.dependencyModulesImported === true, "Dependency modules must import");
assert(result.imports?.wanPipelineClassImported === "WanPipeline", "WanPipeline class import must be recorded");
assert(result.imports?.pipelineInstantiated === false, "Pipeline must not instantiate");
assert(result.imports?.modelFromPretrainedCalled === false, "from_pretrained must not be called");
assert(result.imports?.torchLoadCalled === false, "torch.load must not be called");
assert(result.metadataInspection?.modelType === "WanModel", "Model type mismatch");
assert(result.metadataInspection?.safetensorsTensorKeyCount === 825, "Unexpected safetensors key count");
assert(result.metadataInspection?.tokenizerClass === "T5Tokenizer", "Tokenizer class mismatch");
assert(result.metadataInspection?.textEncoderArchiveInspected === true, "Text encoder archive must be inspected");
assert(result.metadataInspection?.torchWeightDeserializationSkipped === true, "torch deserialization must be skipped");
ensureFlagsClosed(result.runtimeFlags, "AI-VIDEO-BROLL-GEN-7 result");

assert(metadata.proofMode === "model_loader_import_metadata_only", "Metadata proof mode mismatch");
assert(metadata.imports?.wanPipelineClassImported === "WanPipeline", "Metadata must record WanPipeline import");
assert(metadata.configInspection?.modelType === "WanModel", "Metadata model type mismatch");
assert(metadata.safetensorsInspection?.headerOpened === true, "Safetensors header must open");
assert(metadata.safetensorsInspection?.tensorKeyCount === 825, "Metadata tensor key count mismatch");
assert(metadata.tokenizerInspection?.autoTokenizerLoaded === true, "AutoTokenizer must load");
assert(metadata.tokenizerInspection?.textEncoded === false, "Tokenizer must not encode text");
for (const archive of metadata.archiveInspection ?? []) {
  assert(archive.isZipArchive === true, `${archive.relativePath} must be a zip archive`);
  assert(archive.deserializedByTorchLoad === false, `${archive.relativePath} must not be deserialized`);
}
assert(metadata.runtimeActions?.inferenceRun === false, "Metadata must block inference");
assert(metadata.runtimeActions?.generatedVideoCreated === false, "Metadata must block generated video");

assert(changeLog.throwawayEnvironment?.cleanupVerified === true, "Change log must record venv cleanup");
assert(changeLog.packageLockChanged === false, "package-lock must remain unchanged");
assert(changeLog.pythonRequirementChanged === false, "Python requirements must not change");
assert(changeLog.runtimeFilesChanged === false, "Runtime files must not change");
assert(changeLog.supabaseFilesChanged === false, "Supabase files must not change");
assert(changeLog.sqlFilesChanged === false, "SQL files must not change");
assert(changeLog.modelWeightsChanged === false, "Model weights must not change");
assert(changeLog.pipelineInstantiated === false, "Pipeline must not instantiate");
assert(changeLog.modelInferenceRun === false, "Model inference must not run");
assert(changeLog.generatedVideoCreated === false, "Generated video must not be created");

assert(rollback.throwawayVenvCleanup?.completed === true, "Rollback must record venv cleanup");
assert(rollback.privateModelCacheRollback?.requiredForRepositoryCleanliness === false, "Private cache cleanup must not be required for repo cleanliness");
assert(rollback.packageLockRollbackRequired === false, "package-lock rollback must not be required");
assert(rollback.runtimeRollbackRequired === false, "runtime rollback must not be required");
assert(rollback.supabaseRollbackRequired === false, "Supabase rollback must not be required");
assert(rollback.sqlRollbackRequired === false, "SQL rollback must not be required");
assert(rollback.artifactRollbackRequired === false, "artifact rollback must not be required");
assert(rollback.generatedVideoRollbackRequired === false, "generated video rollback must not be required");

const promptText = read("docs/implementation-prompts/prompt-ai-video-broll-gen-8-controlled-synthetic-generation-plan.md");
assert(promptText.includes("AI-VIDEO-BROLL-GEN-8 Controlled Synthetic Generation Plan Prompt"), "Missing Gate 8 prompt title");
assert(promptText.includes("without running inference"), "Gate 8 prompt must block inference");
assert(promptText.includes("No generated frames."), "Gate 8 prompt must block generated frames");
assert(promptText.includes("No generated video."), "Gate 8 prompt must block generated video");
assert(promptText.includes("No media processing or FFmpeg."), "Gate 8 prompt must block media processing");
assert(promptText.includes("dry_run_passed"), "Gate 8 prompt must block dry run pass claims");
assert(promptText.includes("generated_local_fixture_passed"), "Gate 8 prompt must block generated local fixture pass claims");

ensureSafeText([
  "docs/ai-video-broll-generation-controlled-model-loader-import-result.md",
  "docs/ai-video-broll-generation-controlled-model-loader-import-metadata.md",
  "docs/ai-video-broll-generation-controlled-model-loader-import-change-log.md",
  "docs/ai-video-broll-generation-controlled-model-loader-import-rollback-report.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-8-controlled-synthetic-generation-plan.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  modelId: "Wan-AI/Wan2.1-T2V-1.3B",
  sourceRevision: "37ec512624d61f7aa208f7ea8140a131f93afc9a",
  wanPipelineClassImported: true,
  dependencyModulesImported: true,
  tokenizerLoadedOffline: true,
  safetensorsHeaderOpened: true,
  pthArchivesInspectedWithoutTorchLoad: true,
  throwawayVenvCleaned: true,
  pipelineInstantiated: false,
  fromPretrainedCalled: false,
  torchLoadCalled: false,
  promptCreated: false,
  textEncodingCalled: false,
  inferenceRun: false,
  generatedFramesCreated: false,
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
  nextPrompt: "AI-VIDEO-BROLL-GEN-8: controlled synthetic generation plan, no execution"
}, null, 2));
