#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const EXPECTED_DECISION =
  "ai_video_broll_gen_6_controlled_model_weight_download_completed_ready_for_model_loader_import_proof";

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-controlled-model-weight-download-result.md",
  "docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md",
  "docs/ai-video-broll-generation-controlled-model-weight-download-change-log.md",
  "docs/ai-video-broll-generation-controlled-model-weight-download-rollback-report.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-7-model-loader-import-proof.md",
  "scripts/validation/ai-video-broll-gen-6-diagnostics.mjs",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-6-controlled-model-weight-download-proof.md",
  "docs/ai-video-broll-generation-controlled-dependency-install-result.md",
  "docs/ai-video-broll-generation-weight-source-checksum-plan.md",
  "docs/ai-video-broll-generation-checksum-private-cache-policy.md",
  "server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt",
  "package.json"
];

const EXPECTED_FILES = [
  ["LICENSE.txt", 11357, "c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4"],
  ["README.md", 16913, "d19fb6c377090790940f64af3423c87d289abc9fdee4d45963018e18e5d84119"],
  ["config.json", 249, "ab37994c43740513f94b3ba6233a784035a67b43c8cde83c8f31aa90468c67ce"],
  ["Wan2.1_VAE.pth", 507609880, "38071ab59bd94681c686fa51d75a1968f64e470262043be31f7a094e442fd981"],
  ["diffusion_pytorch_model.safetensors", 5676070424, "96b6b242ca1c2f24e9d02cd6596066fab6d310e2d7538f33ae267cb18d957e8f"],
  ["models_t5_umt5-xxl-enc-bf16.pth", 11361920418, "7cace0da2b446bbbbc57d031ab6cf163a3d59b366da94e5afe36745b746fd81d"],
  ["google/umt5-xxl/special_tokens_map.json", 6623, "7b8a9f5040adb67b5805abdfd42c1f8d0f3d0e711f10726580eb3789cd0ad61d"],
  ["google/umt5-xxl/spiece.model", 4548313, "e3909a67b780650b35cf529ac782ad2b6b26e6d1f849d3fbb6a872905f452458"],
  ["google/umt5-xxl/tokenizer.json", 16837417, "6e197b4d3dbd71da14b4eb255f4fa91c9c1f2068b20a2de2472967ca3d22602b"],
  ["google/umt5-xxl/tokenizer_config.json", 61728, "ed9a3a8b0faa71a70a32847e0435fe036e6e112d4df4edb7bb48a921e344dc05"]
];

const RUNTIME_FLAGS_FALSE = [
  "dependencyInstallAllowed",
  "modelImportAllowed",
  "modelPipelineInstantiationAllowed",
  "modelInferenceAllowed",
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
  ["model import claim", /\bmodelImportAllowed\b\s*[:=]\s*(true|"true")/i],
  ["pipeline instantiation claim", /\bmodelPipelineInstantiationAllowed\b\s*[:=]\s*(true|"true")/i],
  ["model inference claim", /\bmodelInferenceAllowed\b\s*[:=]\s*(true|"true")/i],
  ["generated video claim", /\bgeneratedVideoAllowed\b\s*[:=]\s*(true|"true")/i],
  ["media processing claim", /\bmediaProcessingAllowed\b\s*[:=]\s*(true|"true")/i],
  ["FFmpeg claim", /\bffmpegAllowed\b\s*[:=]\s*(true|"true")/i],
  ["provider call claim", /\bproviderCallsAllowed\b\s*[:=]\s*(true|"true")/i],
  ["worker execution claim", /\bworkerExecutionAllowed\b\s*[:=]\s*(true|"true")/i],
  ["route execution claim", /\brouteExecutionAllowed\b\s*[:=]\s*(true|"true")/i],
  ["Supabase mutation claim", /\bsupabaseMutationAllowed\b\s*[:=]\s*(true|"true")/i],
  ["SQL claim", /\bsqlAllowed\b\s*[:=]\s*(true|"true")/i],
  ["Docker/Cloud Run claim", /\bdockerCloudRunAllowed\b\s*[:=]\s*(true|"true")/i],
  ["GCP mutation claim", /\bgcpMutationAllowed\b\s*[:=]\s*(true|"true")/i],
  ["storage upload claim", /\bstorageUploadAllowed\b\s*[:=]\s*(true|"true")/i],
  ["signed URL claim", /\bsignedUrlCreationAllowed\b\s*[:=]\s*(true|"true")/i],
  ["public artifact claim", /\bpublicArtifactCreationAllowed\b\s*[:=]\s*(true|"true")/i],
  ["credit mutation claim", /\bcreditMutationAllowed\b\s*[:=]\s*(true|"true")/i],
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
  assert(flags?.modelWeightDownloadAllowed === true, `${label} must allow model weight download only`);
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
  packageJson.scripts?.["ai-video-broll-gen-6:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-6-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-6:diagnostics"
);

const result = parseBlock(
  "docs/ai-video-broll-generation-controlled-model-weight-download-result.md",
  "ai-video-broll-gen-6-controlled-weight-download-result"
);
const manifest = parseBlock(
  "docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md",
  "ai-video-broll-gen-6-controlled-weight-download-manifest"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-controlled-model-weight-download-change-log.md",
  "ai-video-broll-gen-6-controlled-weight-download-change-log"
);
const rollback = parseBlock(
  "docs/ai-video-broll-generation-controlled-model-weight-download-rollback-report.md",
  "ai-video-broll-gen-6-controlled-weight-download-rollback-report"
);

assert(result.decision === EXPECTED_DECISION, "Unexpected AI-VIDEO-BROLL-GEN-6 decision");
assert(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
assert(rollback.decision === EXPECTED_DECISION, "Rollback decision mismatch");
assert(result.sourceCommit === "1ded3cae", "Gate 6 source commit must be Gate 5 commit");
assert(result.selectedModel?.modelId === "Wan-AI/Wan2.1-T2V-1.3B", "Gate 6 must use Wan 1.3B");
assert(result.selectedModel?.sourceRevision === "37ec512624d61f7aa208f7ea8140a131f93afc9a", "Unexpected source revision");
assert(result.selectedModel?.license === "apache-2.0", "Unexpected license");
assert(result.selectedModel?.gated === false, "Selected model must be ungated");
assert(result.downloadScope?.runtimeEssentialFilesDownloaded === true, "Runtime-essential file set must be downloaded");
assert(result.downloadScope?.downloadedFileCount === EXPECTED_FILES.length, "Unexpected downloaded file count");
assert(result.downloadScope?.downloadedByteTotal === 17567424122, "Unexpected downloaded byte total");
assert(result.downloadScope?.privateCacheOutsideRepository === true, "Private cache must be outside repository");
assert(result.downloadScope?.gitTrackedModelFiles === false, "Model files must not be tracked");
assert(result.downloadExecution?.modelWeightDownloadCompleted === true, "Model weight download must complete");
assert(result.downloadExecution?.downloadedFromOfficialSourceOnly === true, "Download must use official source only");
assert(result.downloadExecution?.signedRedirectUrlsRecorded === false, "Signed redirect URLs must not be recorded");
assert(result.downloadExecution?.sha256ComputedForEveryDownloadedFile === true, "Every file must have SHA-256");
ensureFlagsClosed(result.runtimeFlags, "AI-VIDEO-BROLL-GEN-6 result");

assert(manifest.modelId === "Wan-AI/Wan2.1-T2V-1.3B", "Manifest model mismatch");
assert(manifest.sourceRevision === "37ec512624d61f7aa208f7ea8140a131f93afc9a", "Manifest revision mismatch");
assert(manifest.checksumAlgorithm === "sha256", "Manifest checksum algorithm mismatch");
assert(manifest.privateCacheOutsideRepository === true, "Manifest cache must be outside repo");
assert(manifest.downloadedFileCount === EXPECTED_FILES.length, "Manifest file count mismatch");
assert(manifest.downloadedByteTotal === 17567424122, "Manifest byte total mismatch");
assert(manifest.runtimeFlags?.modelImportAllowed === false, "Manifest must block import");
assert(manifest.runtimeFlags?.modelInferenceAllowed === false, "Manifest must block inference");
assert(manifest.runtimeFlags?.generatedVideoAllowed === false, "Manifest must block generated video");

const filesByPath = new Map(manifest.files.map((file) => [file.relativePath, file]));
for (const [relativePath, bytes, sha256] of EXPECTED_FILES) {
  const file = filesByPath.get(relativePath);
  assert(file, `Missing manifest file ${relativePath}`);
  assert(file.bytes === bytes, `Byte count mismatch for ${relativePath}`);
  assert(file.sha256 === sha256, `SHA-256 mismatch for ${relativePath}`);
}

assert(changeLog.privateCacheChanges?.outsideRepository === true, "Change log must mark private cache outside repo");
assert(changeLog.privateCacheChanges?.committed === false, "Private cache must not be committed");
assert(changeLog.packageLockChanged === false, "package-lock must remain unchanged");
assert(changeLog.pythonRequirementChanged === false, "Python requirements must not change");
assert(changeLog.runtimeFilesChanged === false, "Runtime files must not change");
assert(changeLog.supabaseFilesChanged === false, "Supabase files must not change");
assert(changeLog.sqlFilesChanged === false, "SQL files must not change");
assert(changeLog.modelImportRun === false, "Model import must not run");
assert(changeLog.modelInferenceRun === false, "Model inference must not run");
assert(changeLog.generatedVideoCreated === false, "Generated video must not be created");

assert(rollback.privateCacheRollback?.requiredForRepositoryCleanliness === false, "Private cache cleanup must not be required for repo cleanliness");
assert(rollback.packageLockRollbackRequired === false, "package-lock rollback must not be required");
assert(rollback.runtimeRollbackRequired === false, "runtime rollback must not be required");
assert(rollback.supabaseRollbackRequired === false, "Supabase rollback must not be required");
assert(rollback.sqlRollbackRequired === false, "SQL rollback must not be required");
assert(rollback.artifactRollbackRequired === false, "artifact rollback must not be required");
assert(rollback.generatedVideoRollbackRequired === false, "generated video rollback must not be required");

const promptText = read("docs/implementation-prompts/prompt-ai-video-broll-gen-7-model-loader-import-proof.md");
assert(promptText.includes("AI-VIDEO-BROLL-GEN-7 Model Loader Import Proof Prompt"), "Missing Gate 7 prompt title");
assert(promptText.includes("No inference."), "Gate 7 prompt must block inference");
assert(promptText.includes("No generated video."), "Gate 7 prompt must block generated video");
assert(promptText.includes("No media processing or FFmpeg."), "Gate 7 prompt must block media processing");
assert(promptText.includes("dry_run_passed"), "Gate 7 prompt must block dry run pass claims");
assert(promptText.includes("generated_local_fixture_passed"), "Gate 7 prompt must block generated local fixture pass claims");

ensureSafeText([
  "docs/ai-video-broll-generation-controlled-model-weight-download-result.md",
  "docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md",
  "docs/ai-video-broll-generation-controlled-model-weight-download-change-log.md",
  "docs/ai-video-broll-generation-controlled-model-weight-download-rollback-report.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-7-model-loader-import-proof.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  modelId: "Wan-AI/Wan2.1-T2V-1.3B",
  sourceRevision: "37ec512624d61f7aa208f7ea8140a131f93afc9a",
  downloadedFileCount: EXPECTED_FILES.length,
  downloadedByteTotal: 17567424122,
  sha256VerifiedForEveryFile: true,
  privateCacheOutsideRepository: true,
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
  nextPrompt: "AI-VIDEO-BROLL-GEN-7: model loader import proof, no inference/no generated video"
}, null, 2));
