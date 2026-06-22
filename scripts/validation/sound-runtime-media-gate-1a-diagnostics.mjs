#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const decision = "sound_runtime_media_gate_1a_controlled_cpu_install_proof_passed_with_warnings_ready_for_worker_contract_review";
const gate1Decision = "sound_runtime_media_gate_1_completed_with_warnings_ready_for_controlled_cpu_install_proof";
const gate0Decision = "sound_runtime_media_gate_0_completed_with_warnings_ready_for_cpu_worker_install_plan";
const packageScript = "node scripts/validation/sound-runtime-media-gate-1a-diagnostics.mjs";

const docs = [
  ["docs/sound-runtime-media-gate-1a-controlled-cpu-install-proof-result.md", "sound-runtime-media-gate-1a-controlled-cpu-install-proof-result"],
  ["docs/sound-runtime-media-gate-1a-package-metadata-proof-register.md", "sound-runtime-media-gate-1a-package-metadata-proof-register"],
  ["docs/sound-runtime-media-gate-1a-exclusion-register.md", "sound-runtime-media-gate-1a-exclusion-register"],
  ["docs/sound-runtime-media-gate-1a-runtime-claim-policy.md", "sound-runtime-media-gate-1a-runtime-claim-policy"],
  ["docs/implementation-prompts/prompt-sound-runtime-media-gate-1c-cpu-worker-image-plan.md", "sound-runtime-media-gate-1c-cpu-worker-image-plan"]
];

const sourceDocs = [
  ["docs/sound-runtime-media-gate-1-cpu-worker-install-plan.md", "sound-runtime-media-gate-1-cpu-worker-install-plan"],
  ["docs/sound-runtime-media-gate-1-cpu-requirements-manifest-strategy.md", "sound-runtime-media-gate-1-cpu-requirements-manifest-strategy"],
  ["docs/sound-runtime-media-gate-1-cpu-proof-plan.md", "sound-runtime-media-gate-1-cpu-proof-plan"],
  ["docs/sound-runtime-media-gate-1-blocked-runtime-follow-up-register.md", "sound-runtime-media-gate-1-blocked-runtime-follow-up-register"],
  ["docs/sound-runtime-media-gate-0-runtime-tool-inventory.md", "sound-runtime-media-gate-0-runtime-tool-inventory"],
  ["docs/sound-runtime-media-gate-0-install-strategy.md", "sound-runtime-media-gate-0-install-strategy"]
];

const requiredFiles = [
  "scripts/validation/sound-runtime-media-gate-1a-controlled-cpu-install-proof-runner.py",
  "scripts/validation/sound-runtime-media-gate-1a-diagnostics.mjs",
  "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
  "docs/implementation-prompts/prompt-sound-runtime-media-gate-1a-controlled-cpu-install-proof.md",
  "docs/implementation-prompts/prompt-sound-runtime-media-gate-1b-worker-contract-owner-review.md",
  "docs/implementation-prompts/prompt-sound-runtime-media-gate-2-model-weight-owner-review.md"
];

const expectedPackages = [
  ["librosa", "0.11.0"],
  ["audioread", "3.1.0"],
  ["pydub", "0.25.1"],
  ["scipy", "1.17.1"],
  ["resampy", "0.4.3"],
  ["pyloudnorm", "0.2.0"],
  ["audioflux", "0.1.9"],
  ["music21", "10.3.0"],
  ["pretty_midi", "0.2.11"],
  ["mido", "1.3.3"],
  ["noisereduce", "3.0.3"],
  ["pedalboard", "0.9.23"],
  ["mir_eval", "0.8.2"]
];

const expectedImports = [
  "librosa",
  "audioread",
  "pydub",
  "scipy",
  "scipy.signal",
  "resampy",
  "pyloudnorm",
  "audioflux",
  "music21",
  "pretty_midi",
  "mido",
  "noisereduce",
  "pedalboard",
  "mir_eval"
];

const expectedModelTools = [
  "deepfilternet",
  "demucs",
  "spleeter",
  "open_unmix",
  "asteroid",
  "speechbrain_enhancement",
  "basic_pitch",
  "whisper_cpp",
  "faster_whisper",
  "pyannote_audio",
  "crepe",
  "torchcrepe"
];
const expectedSystemTools = [
  "ffmpeg",
  "ffprobe",
  "sox",
  "libsndfile",
  "soundfile",
  "soxr",
  "aubio",
  "madmom",
  "vamp_sonic_annotator",
  "fluidsynth_pyfluidsynth",
  "bs1770gain",
  "soundtouch",
  "opus_tools",
  "flac_metaflac",
  "vorbis_tools"
];
const expectedBlockedEvalTools = ["rnnoise", "pyrubberband", "rubberband_cli", "rubber_band", "essentia"];
const expectedProviderTools = ["lyria", "mirelo_sfx_v1_5", "mmaudio_v2"];

function filePath(file) {
  return path.join(root, file);
}

function read(file) {
  return fs.readFileSync(filePath(file), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseBlock(file, label) {
  assert(fs.existsSync(filePath(file)), `Missing file: ${file}`);
  const text = read(file);
  const pattern = new RegExp("```json\\s+" + escapeRegExp(label) + "\\n([\\s\\S]*?)```");
  const match = text.match(pattern);
  assert(match, `Missing JSON block ${label} in ${file}`);
  try {
    return JSON.parse(match[1]);
  } catch (error) {
    throw new Error(`Invalid JSON block ${label} in ${file}: ${error.message}`);
  }
}

function assertIncludesAll(actual, expected, label) {
  const set = new Set(actual);
  for (const value of expected) {
    assert(set.has(value), `${label} missing ${value}`);
  }
}

function flatten(value, seen = new Set()) {
  if (value === null || value === undefined) return [];
  if (typeof value !== "object") return [String(value)];
  if (seen.has(value)) return [];
  seen.add(value);
  if (Array.isArray(value)) return value.flatMap((item) => flatten(item, seen));
  return Object.values(value).flatMap((item) => flatten(item, seen));
}

function scanUnsafe(files) {
  const patterns = [
    /https:\/\/[a-z0-9.-]+\.supabase\.co/i,
    /\bservice_role\b/i,
    /\bBearer\s+[A-Za-z0-9._-]{20,}/,
    /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/,
    /\b(sk|pk)_(live|test)_[A-Za-z0-9]{16,}\b/,
    /\bAIza[0-9A-Za-z_-]{20,}\b/,
    /"(runtimeReady|mediaProcessingReady|modelWeightsDownloaded|gcpTouched|cloudRunExecuted|supabaseMutated|betaReady|productionReady)"\s*:\s*true/,
    /generated_local_fixture_passed\s*[:=]\s*(true|passed|ready)/i,
    /dry_run_passed\s*[:=]\s*(true|passed|ready)/i,
    /runtime readiness\s+(enabled|passed|ready|unlocked)/i,
    /media processing readiness\s+(enabled|passed|ready|unlocked)/i,
    /model download\s+(enabled|passed|ready|unlocked)/i,
    /Cloud Run\s+(executed|deployed|called)/i,
    /production readiness\s+(enabled|passed|ready|unlocked)/i,
    /beta readiness\s+(enabled|passed|ready|unlocked)/i
  ];
  for (const file of files) {
    const text = read(file);
    for (const pattern of patterns) {
      assert(!pattern.test(text), `Unsafe content pattern ${pattern} matched ${file}`);
    }
  }
}

for (const file of requiredFiles) {
  assert(fs.existsSync(filePath(file)), `Missing required file: ${file}`);
}

const parsed = new Map(docs.map(([file, label]) => [label, parseBlock(file, label)]));
const sources = new Map(sourceDocs.map(([file, label]) => [label, parseBlock(file, label)]));

const packageJson = JSON.parse(read("package.json"));
assert(packageJson.scripts?.["sound-runtime-media-gate-1a:diagnostics"] === packageScript, "package script missing");

const gate1Install = sources.get("sound-runtime-media-gate-1-cpu-worker-install-plan");
const gate1Manifest = sources.get("sound-runtime-media-gate-1-cpu-requirements-manifest-strategy");
const gate1Proof = sources.get("sound-runtime-media-gate-1-cpu-proof-plan");
const gate1Blocked = sources.get("sound-runtime-media-gate-1-blocked-runtime-follow-up-register");
const gate0Inventory = sources.get("sound-runtime-media-gate-0-runtime-tool-inventory");
const gate0Install = sources.get("sound-runtime-media-gate-0-install-strategy");

assert(gate1Install.decision === gate1Decision, "Gate 1 install plan decision mismatch");
assert(gate1Install.sourceBase?.head === "9d7dcbac75a4f708bd4c9cef684b6d5b0f47387c", "Gate 1 source head mismatch");
assert(gate1Install.cpuInstallCandidates?.directPinnedPackageCount === 13, "Gate 1 direct pinned count mismatch");
assert(gate1Install.cpuInstallCandidates?.aliasCoveredToolCount === 2, "Gate 1 alias count mismatch");
assert(gate1Install.cpuInstallCandidates?.cpuInstallCandidateCount === 15, "Gate 1 CPU candidate count mismatch");
assert(gate1Manifest.excludedPackages?.modelWeights?.length === 12, "Gate 1 model exclusion count mismatch");
assert(gate1Manifest.excludedPackages?.systemBinaryOrRuntimeHandoff?.length === 15, "Gate 1 system exclusion count mismatch");
assert(gate1Manifest.excludedPackages?.blockedEvaluation?.length === 5, "Gate 1 blocked evaluation count mismatch");
assert(gate1Proof.proofScope === "proposed for Gate 1A only", "Gate 1 proof source must point to Gate 1A");
assert(gate1Blocked.supabaseClassification?.updateRequired === "no", "Gate 1 Supabase classification widened");
assert(gate0Inventory.decision === gate0Decision, "Gate 0 inventory decision mismatch");
assert(gate0Inventory.candidateMatrix?.candidateCount === 65, "Gate 0 candidate matrix count mismatch");
assert(gate0Install.sourceEvidence?.pinnedPythonRequirementCount === 13, "Gate 0 pinned requirement count mismatch");
assert(gate0Install.sourceEvidence?.approvedInstallPlanToolCount === 16, "Gate 0 approved install-plan count mismatch");

const result = parsed.get("sound-runtime-media-gate-1a-controlled-cpu-install-proof-result");
const register = parsed.get("sound-runtime-media-gate-1a-package-metadata-proof-register");
const exclusions = parsed.get("sound-runtime-media-gate-1a-exclusion-register");
const policy = parsed.get("sound-runtime-media-gate-1a-runtime-claim-policy");
const prompt1c = parsed.get("sound-runtime-media-gate-1c-cpu-worker-image-plan");

for (const doc of [result, register, exclusions, policy]) {
  assert(doc.decision === decision, "Gate 1A decision mismatch");
}

assert(result.sourceVerification?.sourceHead === "efed6a5d699672aa926c31fe48f8e232f31c0152", "Gate 1A source head mismatch");
assert(result.sourceVerification?.pr640?.status === "merged", "PR #640 source status missing");
assert(result.proofCommand === "python3 scripts/validation/sound-runtime-media-gate-1a-controlled-cpu-install-proof-runner.py", "proof command mismatch");
assert(result.requirementsPath === "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt", "proof requirements path mismatch");
assert(result.pythonEnvironment?.python3VersionObserved === "3.13.13", "python3 proof version mismatch");
assert(result.pythonEnvironment?.pythonCommandAvailable === "no", "python command availability should remain no");
assert(result.pythonEnvironment?.tempVenvRemoved === true, "temp venv must be removed");
assert(result.proofResult?.metadataPassedCount === 13, "metadata pass count mismatch");
assert(result.proofResult?.metadataFailedCount === 0, "metadata failure count mismatch");
assert(result.proofResult?.importPassedCount === 14, "import pass count mismatch");
assert(result.proofResult?.importFailedCount === 0, "import failure count mismatch");
assert(Array.isArray(result.proofResult?.failedImports) && result.proofResult.failedImports.length === 0, "failed imports must be empty");
for (const [key, value] of Object.entries(result.runtimeFlags)) {
  assert(value === false, `runtime flag must remain false: ${key}`);
}
assert(result.supabaseClassification?.sqlExecuted === "no", "result SQL classification mismatch");

assert(register.directPinnedPackageCount === 13, "register direct package count mismatch");
assert(register.metadataPassedCount === 13, "register metadata pass count mismatch");
assert(register.importPassedCount === 14, "register import pass count mismatch");
assert(register.importFailedCount === 0, "register import failure count mismatch");
assertIncludesAll(register.metadataChecks.map((item) => item.packageName), expectedPackages.map(([name]) => name), "metadata package list");
for (const [packageName, version] of expectedPackages) {
  const item = register.metadataChecks.find((entry) => entry.packageName === packageName);
  assert(item.expectedVersion === version, `${packageName} expected version mismatch`);
  assert(item.installedVersionObserved === version, `${packageName} installed version mismatch`);
  assert(item.metadataStatus === "passed", `${packageName} metadata status mismatch`);
}
assertIncludesAll(register.importChecks.map((item) => item.moduleName), expectedImports, "import list");
for (const item of register.importChecks) {
  assert(item.importStatus === "passed", `${item.moduleName} import status mismatch`);
}
assert(register.proofBoundaries?.mediaFileOpenAllowed === false, "media file open boundary widened");
assert(register.proofBoundaries?.audioreadAudioOpenAllowed === false, "audioread boundary widened");
assert(register.proofBoundaries?.pydubMediaOperationAllowed === false, "pydub boundary widened");
assert(register.proofBoundaries?.ffmpegFfprobeAllowed === false, "ffmpeg boundary widened");

assert(exclusions.excludedCounts?.modelWeightGpuTools === 12, "model exclusion count mismatch");
assert(exclusions.excludedCounts?.systemBinaryHandoffTools === 15, "system exclusion count mismatch");
assert(exclusions.excludedCounts?.blockedEvaluationTools === 5, "blocked evaluation count mismatch");
assert(exclusions.excludedCounts?.providerTools === 3, "provider exclusion count mismatch");
assertIncludesAll(exclusions.modelWeightGpuTools, expectedModelTools, "model exclusions");
assertIncludesAll(exclusions.systemBinaryHandoffTools, expectedSystemTools, "system exclusions");
assertIncludesAll(exclusions.blockedEvaluationTools, expectedBlockedEvalTools, "blocked evaluation exclusions");
assertIncludesAll(exclusions.providerTools, expectedProviderTools, "provider exclusions");
for (const value of Object.values(exclusions.excludedScopePolicy)) {
  assert(value === "blocked", "excluded scope policy must remain blocked");
}

for (const value of Object.values(policy.blockedClaims)) {
  assert(value === "blocked_unclaimed", "blocked claim policy must remain blocked_unclaimed");
}
for (const value of Object.values(policy.blockedActions)) {
  assert(value === "blocked", "blocked action policy must remain blocked");
}
assert(policy.supabaseClassification?.nextAction === "none", "policy Supabase next action mismatch");
assert(prompt1c.requiredDecision === decision, "Gate 1C prompt required decision mismatch");
assert(prompt1c.blockedActions.includes("Docker build"), "Gate 1C Docker block missing");
assert(prompt1c.blockedActions.includes("GCP API call"), "Gate 1C GCP block missing");

const requirementLines = read("server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt")
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"));
assert(requirementLines.length === 13, "requirements file should still contain 13 pins");
for (const [packageName, version] of expectedPackages) {
  assert(requirementLines.includes(`${packageName}==${version}`), `requirements file missing ${packageName} pin`);
}

const runnerText = read("scripts/validation/sound-runtime-media-gate-1a-controlled-cpu-install-proof-runner.py");
assert(runnerText.includes("tempfile.mkdtemp"), "runner must create temp venv outside source");
assert(runnerText.includes("venv"), "runner must use a virtual environment");
assert(runnerText.includes("requirements.sound-oss-tools.txt"), "runner must install from source requirements");
assert(runnerText.includes("audioreadAudioOpenAttempted"), "runner must preserve audioread no-open flag");
assert(runnerText.includes("pydubMediaOperationAttempted"), "runner must preserve pydub no-media-operation flag");
assert(runnerText.includes("shutil.rmtree"), "runner must remove disposable venv");

scanUnsafe(docs.map(([file]) => file).concat([
  "docs/implementation-prompts/prompt-sound-runtime-media-gate-1a-controlled-cpu-install-proof.md",
  "docs/implementation-prompts/prompt-sound-runtime-media-gate-1b-worker-contract-owner-review.md",
  "docs/implementation-prompts/prompt-sound-runtime-media-gate-1c-cpu-worker-image-plan.md",
  "scripts/validation/sound-runtime-media-gate-1a-controlled-cpu-install-proof-runner.py",
  "scripts/validation/sound-runtime-media-gate-1a-diagnostics.mjs",
  "package.json"
]));

console.log(JSON.stringify({
  status: "passed",
  decision,
  sourceHead: result.sourceVerification.sourceHead,
  requirementsPath: result.requirementsPath,
  metadataPassedCount: result.proofResult.metadataPassedCount,
  importPassedCount: result.proofResult.importPassedCount,
  failedImports: result.proofResult.failedImports,
  tempVenvRemoved: result.pythonEnvironment.tempVenvRemoved,
  modelWeightGpuExclusionCount: exclusions.excludedCounts.modelWeightGpuTools,
  systemBinaryExclusionCount: exclusions.excludedCounts.systemBinaryHandoffTools,
  blockedEvaluationExclusionCount: exclusions.excludedCounts.blockedEvaluationTools,
  providerExclusionCount: exclusions.excludedCounts.providerTools,
  runtimeExecution: "not_run",
  mediaProcessing: "not_run",
  gcpTouched: "no",
  supabaseTouched: "no",
  sqlExecuted: "no",
  nextPrompt: policy.handoffPolicy.nextPrompt
}, null, 2));
