#!/usr/bin/env node
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = process.cwd();
const EXPECTED_DECISION =
  "ai_video_broll_gen_9j_cache_validate_private_diffusers_cache_and_runner_envelope_validated_ready_for_vm_preflight";
const EXPECTED_NEXT_PROMPT =
  "AI-VIDEO-BROLL-GEN-9J-VM-PREFLIGHT-2: prepare controlled L4 private proof VM preflight, no inference";
const DOWNLOAD_DECISION =
  "ai_video_broll_gen_9j_diffusers_cache_download_private_cache_hashed_ready_for_cache_validate";
const DIFFUSERS_REPO = "Wan-AI/Wan2.1-T2V-1.3B-Diffusers";
const DIFFUSERS_COMMIT = "0fad780a534b6463e45facd96134c9f345acfa5b";
const PRIVATE_CACHE_PATH =
  "/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B-Diffusers/0fad780a534b6463e45facd96134c9f345acfa5b";
const AGGREGATE_BYTES = 28928887859;
const RUNNER_PATH = "server/workers/ai-video-broll-controlled-install/run_wan_l4_private_tabletop_proof.py";
const TEMP_CACHE_PATH = "/tmp/reeditpro-private-model-cache/cache-validate-diffusers-envelope";
const TEMP_OUTPUT_PATH = "/tmp/reeditpro-private-proof-output/cache-validate";
const TEMP_HF_HOME = "/tmp/reeditpro-private-hf-home/cache-validate";

const MANIFEST = [
  ["model_index.json", 400, "b8b28e022329acf975e027579a1d2dc3de44dba28f4c909b98a880fbf5b0de7d"],
  ["scheduler/scheduler_config.json", 751, "3fed2abbd9bbc301a74db01947198057ec5049808910dccab320925bf27bea6e"],
  ["text_encoder/config.json", 854, "4087b6192155a4643f6d29fd326c4610103130674011ef4d0a53f8bce5de967d"],
  ["text_encoder/model-00001-of-00005.safetensors", 4972389712, "c0ef3a140898e228a3520c9adec60743d2e8e5b3d229651bb37f1a3921919f99"],
  ["text_encoder/model-00002-of-00005.safetensors", 4899225672, "481c7b2b39771c44df6dd8d13ee12ed072d731b4a650bd092885d4d52db229ad"],
  ["text_encoder/model-00003-of-00005.safetensors", 4966309504, "f93148bcc04052a169e1e49bfcf6125df6cf9bf243cb9c627da75266cf8e35c3"],
  ["text_encoder/model-00004-of-00005.safetensors", 4999880704, "a451792c739c05bca4606190cc2dd16731411bac03b4cf6aacc5767321f857c9"],
  ["text_encoder/model-00005-of-00005.safetensors", 2885866152, "7e76e18d224531b8197a46231cb53daf7f2f6ca707130252becf933026ac4eea"],
  ["text_encoder/model.safetensors.index.json", 22476, "8af791f24a6447aa30c95786f40adf23d3c9df97470d2f36159c8f1113f120b4"],
  ["tokenizer/special_tokens_map.json", 7079, "456b58fd240a06c743a7c2cf8008bec501240d68ebd1fc4018ea569505fea270"],
  ["tokenizer/spiece.model", 4548313, "e3909a67b780650b35cf529ac782ad2b6b26e6d1f849d3fbb6a872905f452458"],
  ["tokenizer/tokenizer.json", 16837459, "20a46ac256746594ed7e1e3ef733b83fbc5a6f0922aa7480eda961743de080ef"],
  ["tokenizer/tokenizer_config.json", 61758, "1d8d2a216bf8e70ac15b7ddcea566c4dd0433c024b39a58ca5e4c66bd78defbd"],
  ["transformer/config.json", 465, "0b093fa072e9ff28763febe9b964ee582f566733a6d6709deb9dfba1bde16b81"],
  ["transformer/diffusion_pytorch_model-00001-of-00002.safetensors", 4998781576, "6d011927dbd2cc8afe53d57abab04a8fd86f615d83324770d985fb058ece3a24"],
  ["transformer/diffusion_pytorch_model-00002-of-00002.safetensors", 677289072, "b92ec2309b1f239af6f746431815a881afcc938abb26a4f08d9a2fd6c892f872"],
  ["transformer/diffusion_pytorch_model.safetensors.index.json", 73296, "dcbcf3497134a3f50557ff069dd7d2c84b5c4d8c5932472f6bdb780fb4016589"],
  ["vae/config.json", 724, "f0c1cc1d7decb5badc384f54691746a27a9aeff49f7ebca974e583389342d527"],
  ["vae/diffusion_pytorch_model.safetensors", 507591892, "d6e524b3fffede1787a74e81b30976dce5400c4439ba64222168e607ed19e793"]
];

const REQUIRED_FILES = [
  "docs/ai-video-broll-generation-gcp-private-cache-validate-result.md",
  "docs/ai-video-broll-generation-gcp-private-cache-validate-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-vm-preflight-2.md",
  "docs/ai-video-broll-generation-gcp-private-diffusers-cache-download-result.md",
  "docs/ai-video-broll-generation-gcp-private-diffusers-cache-manifest.md",
  RUNNER_PATH,
  "scripts/validation/ai-video-broll-gen-9j-cache-validate-diagnostics.mjs",
  "package.json"
];

const UNSAFE_DOC_PATTERNS = [
  ["service account email", /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
  ["runtime execution true claim", /\b(dependencyInstallRun|modelImportRun|pipelineInstantiated|modelInferenceRun|generatedFramesCreated|generatedVideoCreated|vmCreated|gcpMutatingCommandsExecuted|providerCalled|workerDispatched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
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

function sha256(filePath) {
  const hash = crypto.createHash("sha256");
  const buffer = Buffer.allocUnsafe(1024 * 1024 * 8);
  const fd = fs.openSync(filePath, "r");
  try {
    let bytesRead = 0;
    do {
      bytesRead = fs.readSync(fd, buffer, 0, buffer.length, null);
      if (bytesRead > 0) {
        hash.update(buffer.subarray(0, bytesRead));
      }
    } while (bytesRead > 0);
  } finally {
    fs.closeSync(fd);
  }
  return hash.digest("hex");
}

function removePath(targetPath) {
  fs.rmSync(targetPath, { force: true, recursive: true });
}

function mkdir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

function walkFiles(directory) {
  const output = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      output.push(...walkFiles(fullPath));
    } else {
      output.push(fullPath);
    }
  }
  return output;
}

function ensureSafeDocs(files) {
  const findings = [];
  for (const file of files) {
    const text = read(file);
    for (const [name, pattern] of UNSAFE_DOC_PATTERNS) {
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
  packageJson.scripts?.["ai-video-broll-gen-9j-cache-validate:diagnostics"] ===
    "node scripts/validation/ai-video-broll-gen-9j-cache-validate-diagnostics.mjs",
  "package.json must expose ai-video-broll-gen-9j-cache-validate:diagnostics"
);

const result = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-cache-validate-result.md",
  "ai-video-broll-gen-9j-cache-validate-result"
);
const runnerOutput = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-cache-validate-result.md",
  "ai-video-broll-gen-9j-cache-validate-runner-output"
);
const changeLog = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-cache-validate-change-log.md",
  "ai-video-broll-gen-9j-cache-validate-change-log"
);
const downloadResult = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-diffusers-cache-download-result.md",
  "ai-video-broll-gen-9j-diffusers-cache-download-result"
);
const manifestDoc = parseBlock(
  "docs/ai-video-broll-generation-gcp-private-diffusers-cache-manifest.md",
  "ai-video-broll-gen-9j-diffusers-cache-manifest"
);

assert(result.decision === EXPECTED_DECISION, "Result decision mismatch");
assert(changeLog.decision === EXPECTED_DECISION, "Change log decision mismatch");
assert(downloadResult.decision === DOWNLOAD_DECISION, "Download decision mismatch");
assert(manifestDoc.decision === DOWNLOAD_DECISION, "Manifest decision mismatch");
assert(result.nextPrompt === EXPECTED_NEXT_PROMPT, "Result next prompt mismatch");
assert(changeLog.nextPrompt === EXPECTED_NEXT_PROMPT, "Change log next prompt mismatch");
assert(result.privateCacheValidation?.privateCachePath === PRIVATE_CACHE_PATH, "Private cache path mismatch");
assert(result.privateCacheValidation?.modelRepository === DIFFUSERS_REPO, "Model repo mismatch");
assert(result.privateCacheValidation?.sourceCommit === DIFFUSERS_COMMIT, "Source commit mismatch");
assert(result.privateCacheValidation?.runtimeEssentialFileCount === MANIFEST.length, "Runtime file count mismatch");
assert(result.privateCacheValidation?.aggregateBytes === AGGREGATE_BYTES, "Aggregate bytes mismatch");
assert(result.privateCacheValidation?.hashesVerified === true, "Hashes must be verified");
assert(result.privateCacheValidation?.modelIndexClassName === "WanPipeline", "Model index class mismatch");
assert(result.privateCacheValidation?.indexRefsLocal === true, "Index refs must be local");
assert(result.privateCacheValidation?.partialFilesRemaining === false, "Partial files must not remain");
assert(result.privateCacheValidation?.appleDoubleSidecarsRemaining === false, "AppleDouble files must not remain");
assert(result.privateCacheValidation?.unexpectedFilesPresent === false, "Unexpected cache files must not be present");

assert(result.runnerValidateOnly?.run === true, "Runner validate-only must be recorded");
assert(result.runnerValidateOnly?.exitCode === 78, "Runner exit code must be 78");
assert(result.runnerValidateOnly?.status === "validated_but_execution_refused_fail_closed", "Runner status mismatch");
assert(result.runnerValidateOnly?.tempCachePath === TEMP_CACHE_PATH, "Runner temp cache path mismatch");
assert(result.runnerValidateOnly?.cacheLayout === "diffusers_cache_layout", "Runner cache layout mismatch");
assert(result.runnerValidateOnly?.runnableWithCurrentRunner === true, "Runner should classify Diffusers marker layout as runnable");
assert(result.runnerValidateOnly?.offlineEnvironmentOk === true, "Runner offline env must be OK");
assert(result.runnerValidateOnly?.futureExecutionFlagPresent === false, "Future execution flag must be absent");
assert(result.runnerValidateOnly?.proofExecutionAllowedByThisSource === false, "Proof execution must be refused");
assert(runnerOutput.runnerExitCode === 78, "Runner output exit code mismatch");
assert(runnerOutput.status === "validated_but_execution_refused_fail_closed", "Runner output status mismatch");
assert(runnerOutput.cacheLayout === "diffusers_cache_layout", "Runner output cache layout mismatch");

for (const [flag, value] of Object.entries(result.runtimeFlags ?? {})) {
  if (flag === "runnerValidateOnlyRun") {
    assert(value === true, "runnerValidateOnlyRun must be true for this gate");
  } else {
    assert(value === false, `Runtime flag ${flag} must be false`);
  }
}

assert(fs.existsSync(PRIVATE_CACHE_PATH), "Private cache path must exist");
const expectedRelativeFiles = new Set(MANIFEST.map(([relativePath]) => relativePath));
const actualFiles = walkFiles(PRIVATE_CACHE_PATH)
  .map((file) => path.relative(PRIVATE_CACHE_PATH, file).split(path.sep).join("/"))
  .sort();
for (const relativePath of actualFiles) {
  assert(!relativePath.endsWith(".part"), `Partial file remains: ${relativePath}`);
  assert(!path.basename(relativePath).startsWith("._"), `AppleDouble sidecar remains: ${relativePath}`);
  assert(!relativePath.startsWith("assets/"), `Unexpected assets file downloaded: ${relativePath}`);
  assert(!relativePath.startsWith("examples/"), `Unexpected examples file downloaded: ${relativePath}`);
  assert(expectedRelativeFiles.has(relativePath), `Unexpected private cache file: ${relativePath}`);
}
assert(actualFiles.length === MANIFEST.length, "Private cache file count mismatch");

let aggregateBytes = 0;
for (const [relativePath, expectedBytes, expectedSha] of MANIFEST) {
  const filePath = path.join(PRIVATE_CACHE_PATH, relativePath);
  assert(fs.existsSync(filePath), `Missing private cache file: ${relativePath}`);
  const stats = fs.statSync(filePath);
  assert(stats.size === expectedBytes, `Byte size mismatch for ${relativePath}`);
  assert(sha256(filePath) === expectedSha, `SHA-256 mismatch for ${relativePath}`);
  aggregateBytes += stats.size;
}
assert(aggregateBytes === AGGREGATE_BYTES, "Computed aggregate bytes mismatch");

const modelIndex = JSON.parse(fs.readFileSync(path.join(PRIVATE_CACHE_PATH, "model_index.json"), "utf8"));
assert(modelIndex._class_name === "WanPipeline", "model_index.json must declare WanPipeline");

for (const indexPath of [
  "text_encoder/model.safetensors.index.json",
  "transformer/diffusion_pytorch_model.safetensors.index.json"
]) {
  const indexJson = JSON.parse(fs.readFileSync(path.join(PRIVATE_CACHE_PATH, indexPath), "utf8"));
  const indexDirectory = path.dirname(indexPath);
  for (const shard of new Set(Object.values(indexJson.weight_map ?? {}))) {
    assert(!path.isAbsolute(shard), `${indexPath} contains an absolute shard path`);
    assert(!shard.split(/[\\/]/).includes(".."), `${indexPath} contains parent traversal`);
    assert(fs.existsSync(path.join(PRIVATE_CACHE_PATH, indexDirectory, shard)), `${indexPath} missing shard ${shard}`);
  }
}

removePath(TEMP_CACHE_PATH);
removePath(TEMP_OUTPUT_PATH);
removePath(TEMP_HF_HOME);
mkdir(path.join(TEMP_CACHE_PATH, "transformer"));
mkdir(path.join(TEMP_CACHE_PATH, "vae"));
mkdir(path.join(TEMP_CACHE_PATH, "scheduler"));
mkdir(TEMP_OUTPUT_PATH);
mkdir(TEMP_HF_HOME);
fs.copyFileSync(
  path.join(PRIVATE_CACHE_PATH, "model_index.json"),
  path.join(TEMP_CACHE_PATH, "model_index.json")
);

const runner = spawnSync("python3", [
  path.join(ROOT, RUNNER_PATH),
  "--offline-model-cache",
  TEMP_CACHE_PATH,
  "--fixture",
  "non-user-media-tabletop",
  "--max-runtime-minutes",
  "60",
  "--output-dir",
  TEMP_OUTPUT_PATH,
  "--evidence-json",
  path.join(TEMP_OUTPUT_PATH, "evidence.json"),
  "--validate-only"
], {
  cwd: ROOT,
  env: {
    ...process.env,
    HF_HUB_OFFLINE: "1",
    TRANSFORMERS_OFFLINE: "1",
    DIFFUSERS_OFFLINE: "1",
    HF_HOME: TEMP_HF_HOME
  },
  encoding: "utf8",
  maxBuffer: 1024 * 1024 * 2
});

assert(runner.status === 78, `Runner should return fail-closed exit code 78, got ${runner.status}`);
assert(!runner.stderr.trim(), `Runner stderr must be empty: ${runner.stderr}`);
const runnerJson = JSON.parse(runner.stdout);
assert(runnerJson.status === "validated_but_execution_refused_fail_closed", "Runner JSON status mismatch");
assert(runnerJson.cache_layout?.layout === "diffusers_cache_layout", "Runner JSON cache layout mismatch");
assert(runnerJson.cache_layout?.runnable_with_current_runner === true, "Runner JSON should be runnable with marker layout");
assert(Array.isArray(runnerJson.cache_layout?.missing_required_files), "Runner JSON missing required files shape mismatch");
assert(runnerJson.cache_layout.missing_required_files.length === 0, "Runner JSON should not miss marker files");
assert(runnerJson.offline_environment_ok === true, "Runner JSON offline env mismatch");
assert(runnerJson.future_execution_flag_present === false, "Runner JSON future flag must be absent");
assert(runnerJson.proof_execution_allowed_by_this_source === false, "Runner JSON proof execution must be false");
assert(runnerJson.modelInferenceRun === false, "Runner JSON must not run inference");
assert(runnerJson.generatedFramesCreated === false, "Runner JSON must not create frames");
assert(runnerJson.generatedVideoCreated === false, "Runner JSON must not create video");
assert(!fs.existsSync(path.join(TEMP_OUTPUT_PATH, "evidence.json")), "Runner validate-only must not write proof evidence");

const nextPromptText = read("docs/implementation-prompts/prompt-ai-video-broll-gen-9j-vm-preflight-2.md");
for (const expected of [
  EXPECTED_NEXT_PROMPT,
  PRIVATE_CACHE_PATH,
  "g2-standard-4",
  "nvidia-l4",
  "do not pass `--allow-approved-local-proof-execution`",
  "do not call `from_pretrained`",
  "AI-VIDEO-BROLL-GEN-9J-VM-CREATE"
]) {
  assert(nextPromptText.includes(expected), `Next prompt missing ${expected}`);
}

ensureSafeDocs([
  "docs/ai-video-broll-generation-gcp-private-cache-validate-result.md",
  "docs/ai-video-broll-generation-gcp-private-cache-validate-change-log.md",
  "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-vm-preflight-2.md"
]);

console.log(JSON.stringify({
  ok: true,
  decision: EXPECTED_DECISION,
  privateCachePath: PRIVATE_CACHE_PATH,
  runtimeEssentialFileCount: MANIFEST.length,
  aggregateBytes,
  hashesVerified: true,
  modelIndexClassName: modelIndex._class_name,
  indexRefsLocal: true,
  runnerValidateOnlyRun: true,
  runnerExitCode: runner.status,
  runnerStatus: runnerJson.status,
  runnerCacheLayout: runnerJson.cache_layout.layout,
  futureExecutionFlagPresent: runnerJson.future_execution_flag_present,
  proofExecutionAllowedByThisSource: runnerJson.proof_execution_allowed_by_this_source,
  dependencyInstallRun: false,
  modelImportRun: false,
  pipelineInstantiated: false,
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
