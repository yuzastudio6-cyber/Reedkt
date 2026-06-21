#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const decision = "sound_runtime_media_gate_1_completed_with_warnings_ready_for_controlled_cpu_install_proof";
const gate0Decision = "sound_runtime_media_gate_0_completed_with_warnings_ready_for_cpu_worker_install_plan";
const scopedStatus = "sound_oss_tools_synthetic_fixture_validation_passed_with_warnings";
const packageScript = "node scripts/validation/sound-runtime-media-gate-1-diagnostics.mjs";

const docs = [
  ["docs/sound-runtime-media-gate-1-cpu-worker-install-plan.md", "sound-runtime-media-gate-1-cpu-worker-install-plan"],
  ["docs/sound-runtime-media-gate-1-cpu-requirements-manifest-strategy.md", "sound-runtime-media-gate-1-cpu-requirements-manifest-strategy"],
  ["docs/sound-runtime-media-gate-1-cpu-worker-contract-plan.md", "sound-runtime-media-gate-1-cpu-worker-contract-plan"],
  ["docs/sound-runtime-media-gate-1-cpu-proof-plan.md", "sound-runtime-media-gate-1-cpu-proof-plan"],
  ["docs/sound-runtime-media-gate-1-blocked-runtime-follow-up-register.md", "sound-runtime-media-gate-1-blocked-runtime-follow-up-register"],
  ["docs/implementation-prompts/prompt-sound-runtime-media-gate-1a-controlled-cpu-install-proof.md", "sound-runtime-media-gate-1a-controlled-cpu-install-proof"],
  ["docs/implementation-prompts/prompt-sound-runtime-media-gate-1b-worker-contract-owner-review.md", "sound-runtime-media-gate-1b-worker-contract-owner-review"]
];

const sourceDocs = [
  "docs/sound-runtime-media-gate-0-runtime-tool-inventory.md",
  "docs/sound-runtime-media-gate-0-install-strategy.md",
  "docs/sound-runtime-media-gate-0-worker-gcp-readiness-plan.md",
  "docs/sound-runtime-media-gate-0-media-runtime-policy-plan.md",
  "docs/sound-runtime-media-gate-0-owner-handoff-map.md",
  "docs/cross-chat-tool-ownership-registry.md",
  "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt"
];

const expectedPinnedPackages = [
  "librosa",
  "audioread",
  "pydub",
  "scipy",
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

const expectedAliasTools = ["pydub_effects", "ebu_r128_pyloudnorm"];
const expectedModelWeightTools = [
  "basic_pitch",
  "deepfilternet",
  "demucs",
  "spleeter",
  "open_unmix",
  "asteroid",
  "speechbrain_enhancement",
  "whisper_cpp",
  "faster_whisper",
  "pyannote_audio",
  "crepe",
  "torchcrepe"
];
const expectedBlockedEvalTools = ["essentia", "rnnoise", "pyrubberband", "rubberband_cli", "rubber_band"];
const expectedSystemBinaryCount = 15;

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

function parseBlock(file, label) {
  assert(fs.existsSync(filePath(file)), `Missing file: ${file}`);
  const text = read(file);
  const start = "```json " + label + "\n";
  const startIndex = text.indexOf(start);
  assert(startIndex >= 0, `Missing JSON block ${label} in ${file}`);
  const bodyStart = startIndex + start.length;
  const endIndex = text.indexOf("```", bodyStart);
  assert(endIndex >= 0, `Unclosed JSON block ${label} in ${file}`);
  try {
    return JSON.parse(text.slice(bodyStart, endIndex));
  } catch (error) {
    throw new Error(`Invalid JSON block ${label} in ${file}: ${error.message}`);
  }
}

function assertIncludesAll(actual, expected, label) {
  const set = new Set(actual);
  for (const item of expected) {
    assert(set.has(item), `${label} missing ${item}`);
  }
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
    /media processing\s+(enabled|passed|ready|unlocked)/i,
    /model weights?\s+(downloaded|enabled|ready)/i,
    /Cloud Run\s+(executed|deployed|called)/i,
    /production\s+(enabled|passed|ready|unlocked)/i
  ];
  for (const file of files) {
    const text = read(file);
    for (const pattern of patterns) {
      assert(!pattern.test(text), `Unsafe content pattern ${pattern} matched ${file}`);
    }
  }
}

for (const file of sourceDocs) {
  assert(fs.existsSync(filePath(file)), `Missing source file: ${file}`);
}

const parsed = new Map(docs.map(([file, label]) => [label, parseBlock(file, label)]));
const gate0Inventory = parseBlock("docs/sound-runtime-media-gate-0-runtime-tool-inventory.md", "sound-runtime-media-gate-0-runtime-tool-inventory");
const gate0Install = parseBlock("docs/sound-runtime-media-gate-0-install-strategy.md", "sound-runtime-media-gate-0-install-strategy");
const gate0Worker = parseBlock("docs/sound-runtime-media-gate-0-worker-gcp-readiness-plan.md", "sound-runtime-media-gate-0-worker-gcp-readiness-plan");
const gate0Media = parseBlock("docs/sound-runtime-media-gate-0-media-runtime-policy-plan.md", "sound-runtime-media-gate-0-media-runtime-policy-plan");
const gate0Owner = parseBlock("docs/sound-runtime-media-gate-0-owner-handoff-map.md", "sound-runtime-media-gate-0-owner-handoff-map");

assert(gate0Inventory.decision === gate0Decision, "Gate 0 decision mismatch");
assert(gate0Inventory.sourceEvidence?.soundScopedLane?.status === scopedStatus, "Gate 0 scoped status missing");
assert(gate0Inventory.candidateMatrix?.candidateCount === 65, "Gate 0 candidate matrix count mismatch");
assert(gate0Install.sourceEvidence?.pinnedPythonRequirementCount === 13, "Gate 0 pinned requirements count mismatch");
assert(gate0Install.sourceEvidence?.approvedInstallPlanToolCount === 16, "Gate 0 approved install count mismatch");
assert(gate0Worker.gcpPolicy?.googleCloudApiCall === "blocked", "Gate 0 GCP gate widened");
assert(gate0Media.defaultPolicies?.mediaProcessing === "blocked", "Gate 0 media processing gate widened");
assert(gate0Owner.supabaseClassification?.updateRequired === "no", "Gate 0 Supabase classification changed");

const packageJson = JSON.parse(read("package.json"));
assert(packageJson.scripts?.["sound-runtime-media-gate-1:diagnostics"] === packageScript, "package script missing");

const installPlan = parsed.get("sound-runtime-media-gate-1-cpu-worker-install-plan");
const manifest = parsed.get("sound-runtime-media-gate-1-cpu-requirements-manifest-strategy");
const contract = parsed.get("sound-runtime-media-gate-1-cpu-worker-contract-plan");
const proof = parsed.get("sound-runtime-media-gate-1-cpu-proof-plan");
const blocked = parsed.get("sound-runtime-media-gate-1-blocked-runtime-follow-up-register");

for (const doc of [installPlan, manifest, contract, proof, blocked]) {
  assert(doc.decision === decision, "Gate 1 decision mismatch");
}

const requirementLines = read("server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt")
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);
assert(requirementLines.length === 13, "source requirements count must be 13");

assert(installPlan.sourceBase?.head === "9d7dcbac75a4f708bd4c9cef684b6d5b0f47387c", "source head mismatch");
assert(installPlan.gate0EvidenceConsumed?.pinnedPythonRequirementCount === 13, "Gate 1 pinned count mismatch");
assert(installPlan.gate0EvidenceConsumed?.approvedInstallPlanToolCount === 16, "Gate 1 approved count mismatch");
assert(installPlan.cpuInstallCandidates?.directPinnedPackageCount === 13, "direct pinned count mismatch");
assert(installPlan.cpuInstallCandidates?.aliasCoveredToolCount === 2, "alias covered count mismatch");
assert(installPlan.cpuInstallCandidates?.cpuInstallCandidateCount === 15, "CPU install candidate count mismatch");
assertIncludesAll(installPlan.cpuInstallCandidates.directPinnedPackages, expectedPinnedPackages, "direct pinned packages");
assertIncludesAll(installPlan.cpuInstallCandidates.aliasCoveredTools.map((item) => item.toolId), expectedAliasTools, "alias tools");
assert(installPlan.cpuInstallCandidates.approvedButPlanningOnly.includes("signalsmith_stretch"), "signalsmith_stretch must remain planning-only");

assert(manifest.requirementsSource?.path === "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt", "requirements source mismatch");
assert(manifest.requirementsSource?.createRuntimeSpecificCopyNow === false, "runtime copy must not be created now");
assert(manifest.pinnedRequirements.length === 13, "manifest pinned requirements count mismatch");
assertIncludesAll(manifest.aliasCoveredTools.map((item) => item.toolId), expectedAliasTools, "manifest alias tools");
assertIncludesAll(manifest.excludedPackages.modelWeights, expectedModelWeightTools, "model weight exclusions");
assert(manifest.excludedPackages.modelWeights.length === 12, "model weight exclusion count mismatch");
assert(manifest.excludedPackages.systemBinaryOrRuntimeHandoff.length === expectedSystemBinaryCount, "system/binary exclusion count mismatch");
assertIncludesAll(manifest.excludedPackages.blockedEvaluation, expectedBlockedEvalTools, "blocked evaluation exclusions");
assert(manifest.excludedPackages.blockedEvaluation.length === 5, "blocked/evaluation exclusion count mismatch");
assert(manifest.excludedPackages.providers.length === 3, "provider exclusion count mismatch");
assert(manifest.modelWeightsDownloadedNow === false, "model weights must not be downloaded");

assert(contract.runtimeEnabledNow === false, "worker runtime must be disabled by default");
assert(contract.workerNameProposals.includes("sound-cpu-analysis-worker"), "worker name proposal missing");
assert(contract.workerNameProposals.includes("sound-audio-metadata-worker"), "worker name proposal missing");
assert(contract.futureJobTypesAllowedForPlanningOnly.includes("sound.package_import_smoke"), "package import smoke job type missing");
assert(contract.blockedFutureCapabilities.includes("sound.open_media_file"), "open media capability must be blocked");
assert(contract.supabasePolicy.updateRequired === "no", "contract Supabase policy mismatch");

assert(proof.proofScope === "proposed for Gate 1A only", "proof must remain future scope");
assert(proof.proposedFutureCommandsNotRunInGate1.length >= 3, "future proof commands missing");
assert(proof.runtimeReadinessClaim === "blocked_unclaimed", "proof runtime claim widened");

const blockedGates = new Set(blocked.blockedFollowUps.map((item) => item.gate));
for (const gate of ["audioread_file_open", "pydub_media_operations", "ffmpeg_ffprobe_handoff", "worker_execution", "route_execution", "model_weights", "gpu"]) {
  assert(blockedGates.has(gate), `blocked gate missing: ${gate}`);
}
for (const value of Object.values(blocked.forbiddenStatusClaims)) {
  assert(value === "blocked_unclaimed", "forbidden status must remain blocked_unclaimed");
}
assert(blocked.supabaseClassification.sqlExecuted === "no", "blocked register Supabase SQL classification mismatch");

for (const label of [
  "sound-runtime-media-gate-1a-controlled-cpu-install-proof",
  "sound-runtime-media-gate-1b-worker-contract-owner-review"
]) {
  const prompt = parsed.get(label);
  assert(prompt.requiredDecision === decision, `prompt ${label} decision mismatch`);
}

const allFiles = docs.map(([file]) => file).concat([
  "scripts/validation/sound-runtime-media-gate-1-diagnostics.mjs",
  "package.json"
]);
scanUnsafe(allFiles);

console.log(JSON.stringify({
  status: "passed",
  decision,
  sourceHead: installPlan.sourceBase.head,
  cpuInstallCandidateCount: installPlan.cpuInstallCandidates.cpuInstallCandidateCount,
  directPinnedPackageCount: installPlan.cpuInstallCandidates.directPinnedPackageCount,
  aliasCoveredToolCount: installPlan.cpuInstallCandidates.aliasCoveredToolCount,
  excludedModelWeightToolCount: manifest.excludedPackages.modelWeights.length,
  excludedSystemBinaryToolCount: manifest.excludedPackages.systemBinaryOrRuntimeHandoff.length,
  blockedEvaluationToolCount: manifest.excludedPackages.blockedEvaluation.length,
  workerContractPlanCreated: true,
  cpuProofPlanCreated: true,
  runtimeExecution: "not_run",
  mediaProcessing: "not_run",
  gcpTouched: "no",
  supabaseTouched: "no",
  sqlExecuted: "no",
  modelWeightsDownloaded: "no"
}, null, 2));
