#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const decision = "sound_runtime_media_gate_1c_cpu_worker_image_plan_completed_with_warnings_ready_for_worker_runtime_handoff";
const gate1bDecision = "sound_runtime_media_gate_1b_worker_contract_owner_review_passed_with_warnings_ready_for_cpu_worker_image_plan";
const gate1aDecision = "sound_runtime_media_gate_1a_controlled_cpu_install_proof_passed_with_warnings_ready_for_worker_contract_review";
const packageScript = "node scripts/validation/sound-runtime-media-gate-1c-diagnostics.mjs";

const docs = [
  ["docs/sound-runtime-media-gate-1c-cpu-worker-image-plan.md", "sound-runtime-media-gate-1c-cpu-worker-image-plan"],
  ["docs/sound-runtime-media-gate-1c-image-layer-strategy.md", "sound-runtime-media-gate-1c-image-layer-strategy"],
  ["docs/sound-runtime-media-gate-1c-image-proof-and-ci-plan.md", "sound-runtime-media-gate-1c-image-proof-and-ci-plan"],
  ["docs/sound-runtime-media-gate-1c-gcp-cloud-run-handoff-plan.md", "sound-runtime-media-gate-1c-gcp-cloud-run-handoff-plan"],
  ["docs/sound-runtime-media-gate-1c-runtime-disabled-default-policy.md", "sound-runtime-media-gate-1c-runtime-disabled-default-policy"],
  ["docs/sound-runtime-media-gate-1c-image-excluded-tools-register.md", "sound-runtime-media-gate-1c-image-excluded-tools-register"],
  ["docs/implementation-prompts/prompt-sound-runtime-media-gate-1d-worker-runtime-owner-handoff.md", "sound-runtime-media-gate-1d-worker-runtime-owner-handoff"],
  ["docs/implementation-prompts/prompt-sound-runtime-media-gate-1e-dockerfile-static-plan.md", "sound-runtime-media-gate-1e-dockerfile-static-plan"]
];

const sources = [
  ["docs/sound-runtime-media-gate-1b-worker-contract-owner-review.md", "sound-runtime-media-gate-1b-worker-contract-owner-review"],
  ["docs/sound-runtime-media-gate-1b-worker-contract-acceptance-register.md", "sound-runtime-media-gate-1b-worker-contract-acceptance-register"],
  ["docs/sound-runtime-media-gate-1b-runtime-claim-policy.md", "sound-runtime-media-gate-1b-runtime-claim-policy"],
  ["docs/sound-runtime-media-gate-1a-controlled-cpu-install-proof-result.md", "sound-runtime-media-gate-1a-controlled-cpu-install-proof-result"],
  ["docs/sound-runtime-media-gate-1a-package-metadata-proof-register.md", "sound-runtime-media-gate-1a-package-metadata-proof-register"],
  ["docs/sound-runtime-media-gate-1a-exclusion-register.md", "sound-runtime-media-gate-1a-exclusion-register"],
  ["docs/sound-runtime-media-gate-1-cpu-worker-install-plan.md", "sound-runtime-media-gate-1-cpu-worker-install-plan"],
  ["docs/sound-runtime-media-gate-1-cpu-worker-contract-plan.md", "sound-runtime-media-gate-1-cpu-worker-contract-plan"]
];

const requiredFiles = [
  "docs/implementation-prompts/prompt-sound-runtime-media-gate-2-model-weight-owner-review.md",
  "docs/implementation-prompts/prompt-sound-runtime-media-gate-3-media-policy-owner-handoff.md",
  "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
  "scripts/validation/sound-runtime-media-gate-1c-diagnostics.mjs",
  "scripts/validation/sound-runtime-media-gate-1b-diagnostics.mjs",
  "scripts/validation/sound-runtime-media-gate-1a-diagnostics.mjs"
];

const directPinnedPackages = [
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

const acceptedWorkerNames = [
  "sound-cpu-analysis-worker",
  "sound-audio-metadata-worker"
];

const acceptedJobTypes = [
  "sound.package_import_smoke",
  "sound.numeric_array_analysis",
  "sound.symbolic_midi_analysis",
  "sound.loudness_synthetic_analysis"
];

const modelWeightTools = [
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

const systemBinaryTools = [
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

const providerTools = ["lyria", "mirelo_sfx_v1_5", "mmaudio_v2"];
const blockedEvaluationTools = ["rnnoise", "pyrubberband", "rubberband_cli", "rubber_band", "essentia"];

function filePath(file) {
  return path.join(root, file);
}

function read(file) {
  return fs.readFileSync(filePath(file), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
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

function assertFalse(value, label) {
  assert(value === false, `${label} must be false`);
}

function assertSupabaseNoOp(value, label) {
  assert(value?.updateRequired === "no", `${label} Supabase updateRequired widened`);
  assert(value?.environmentTouched === "no", `${label} Supabase environmentTouched widened`);
  assert(value?.sqlExecuted === "no", `${label} Supabase sqlExecuted widened`);
  assert(value?.migrationDeployed === "no", `${label} Supabase migrationDeployed widened`);
  assert(value?.nextAction === "none", `${label} Supabase nextAction widened`);
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
    new RegExp("\\bservice" + "_role\\b", "i"),
    /\bBearer\s+[A-Za-z0-9._-]{20,}/,
    /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/,
    /\b(sk|pk)_(live|test)_[A-Za-z0-9]{16,}\b/,
    /\bAIza[0-9A-Za-z_-]{20,}\b/,
    /"(runtimeReady|mediaProcessingReady|workerReady|routeReady|toolReady|modelWeightsDownloaded|gcpTouched|cloudRunExecuted|dockerBuildRun|supabaseMutated|betaReady|productionReady)"\s*:\s*true/,
    /"(mediaFileOpenAttempted|audioreadAudioOpenAttempted|pydubMediaOperationAttempted|ffmpegExecuted|ffprobeExecuted|modelDownloadAttempted|providerCallAttempted|workerExecutionAttempted|routeExecutionAttempted|toolExecutionAttempted|gcpCallAttempted|dockerCloudRunAttempted|supabaseMutationAttempted|sqlExecutionAttempted|artifactCreationAttempted|signedUrlCreationAttempted|publicArtifactCreationAttempted)"\s*:\s*true/,
    /generated_local_fixture_passed\s*[:=]\s*(true|passed|ready)/i,
    /dry_run_passed\s*[:=]\s*(true|passed|ready)/i,
    /runtime readiness\s+(enabled|passed|ready|unlocked)/i,
    /worker readiness\s+(enabled|passed|ready|unlocked)/i,
    /media processing readiness\s+(enabled|passed|ready|unlocked)/i,
    /Docker build\s+(executed|ran|completed|passed)/i,
    /Cloud Run\s+(executed|deployed|called)/i,
    /model weight.*download(ed|s)?\s+(true|passed|ready|completed)/i,
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
const sourceParsed = new Map(sources.map(([file, label]) => [label, parseBlock(file, label)]));

const packageJson = JSON.parse(read("package.json"));
assert(packageJson.scripts?.["sound-runtime-media-gate-1c:diagnostics"] === packageScript, "package script missing");

const plan = parsed.get("sound-runtime-media-gate-1c-cpu-worker-image-plan");
const layers = parsed.get("sound-runtime-media-gate-1c-image-layer-strategy");
const proof = parsed.get("sound-runtime-media-gate-1c-image-proof-and-ci-plan");
const gcp = parsed.get("sound-runtime-media-gate-1c-gcp-cloud-run-handoff-plan");
const policy = parsed.get("sound-runtime-media-gate-1c-runtime-disabled-default-policy");
const exclusions = parsed.get("sound-runtime-media-gate-1c-image-excluded-tools-register");
const prompt1d = parsed.get("sound-runtime-media-gate-1d-worker-runtime-owner-handoff");
const prompt1e = parsed.get("sound-runtime-media-gate-1e-dockerfile-static-plan");

for (const doc of [plan, layers, proof, gcp, policy, exclusions]) {
  assert(doc.milestone === "SOUND-RUNTIME-MEDIA-GATE-1C", "Gate 1C milestone mismatch");
  assert(doc.decision === decision, "Gate 1C decision mismatch");
}
for (const doc of [plan, layers, proof, gcp, policy]) {
  assertSupabaseNoOp(doc.supabaseClassification, "Gate 1C doc");
}

const gate1b = sourceParsed.get("sound-runtime-media-gate-1b-worker-contract-owner-review");
const gate1bRegister = sourceParsed.get("sound-runtime-media-gate-1b-worker-contract-acceptance-register");
const gate1bPolicy = sourceParsed.get("sound-runtime-media-gate-1b-runtime-claim-policy");
const gate1a = sourceParsed.get("sound-runtime-media-gate-1a-controlled-cpu-install-proof-result");
const gate1aRegister = sourceParsed.get("sound-runtime-media-gate-1a-package-metadata-proof-register");
const gate1aExclusions = sourceParsed.get("sound-runtime-media-gate-1a-exclusion-register");
const gate1Install = sourceParsed.get("sound-runtime-media-gate-1-cpu-worker-install-plan");
const gate1Contract = sourceParsed.get("sound-runtime-media-gate-1-cpu-worker-contract-plan");

assert(gate1b.decision === gate1bDecision, "Gate 1B decision mismatch");
assert(gate1b.sourceVerification?.gate1aProof?.metadataPassedCount === 13, "Gate 1B metadata count mismatch");
assert(gate1b.sourceVerification?.gate1aProof?.importPassedCount === 14, "Gate 1B import count mismatch");
assert(gate1bRegister.acceptedJobTypes?.length === 4, "Gate 1B accepted job count mismatch");
assert(gate1bPolicy.gate1cCarryForward?.mayPlanWorkerImage === true, "Gate 1B does not permit Gate 1C planning");
assert(gate1bPolicy.gate1cCarryForward?.mayBuildDockerImage === false, "Gate 1B Docker boundary widened");
assert(gate1a.decision === gate1aDecision, "Gate 1A decision mismatch");
assert(gate1a.proofResult?.metadataPassedCount === 13, "Gate 1A metadata count mismatch");
assert(gate1a.proofResult?.importPassedCount === 14, "Gate 1A import count mismatch");
assert(gate1a.pythonEnvironment?.tempVenvRemoved === true, "Gate 1A temp venv mismatch");
assert(gate1aRegister.directPinnedPackageCount === 13, "Gate 1A package count mismatch");
assert(gate1aExclusions.excludedCounts?.modelWeightGpuTools === 12, "Gate 1A model exclusion count mismatch");
assert(gate1Install.cpuInstallCandidates?.cpuInstallCandidateCount === 15, "Gate 1 CPU candidate count mismatch");
assert(gate1Contract.runtimeEnabledNow === false, "Gate 1 runtime flag widened");

assert(plan.sourceBase?.head === "5bc262db23f6f6a4c9ab7b03f9b239536c6a0f91", "Gate 1C source head mismatch");
assert(plan.sourceBase?.pr653?.status === "merged", "PR #653 source status missing");
assert(plan.sourceBase?.pr653?.decision === gate1bDecision, "PR #653 decision mismatch");
assertIncludesAll(plan.gate1bEvidenceConsumed?.acceptedPlanningOnlyWorkerNames ?? [], acceptedWorkerNames, "Gate 1C worker names");
assertIncludesAll(plan.gate1bEvidenceConsumed?.acceptedPlanningOnlyJobTypes ?? [], acceptedJobTypes, "Gate 1C job types");
assert(plan.gate1bEvidenceConsumed?.sourceEvidenceOnlyJobTypes?.includes("sound.synthetic_fixture_validate"), "synthetic fixture source-only status missing");
assert(plan.gate1aProofConsumed?.metadataPassedCount === 13, "Gate 1C metadata count mismatch");
assert(plan.gate1aProofConsumed?.importPassedCount === 14, "Gate 1C import count mismatch");
assert(plan.packageSource?.directPinnedPackageCount === 13, "Gate 1C direct package count mismatch");
assert(plan.packageSource?.cpuInstallCandidateCount === 15, "Gate 1C CPU candidate count mismatch");
assertIncludesAll(plan.packageSource?.directPinnedPackages ?? [], directPinnedPackages, "Gate 1C pinned packages");
assertIncludesAll(plan.proposedImages?.map((item) => item.imageName) ?? [], ["reeditpro/sound-cpu-analysis-worker", "reeditpro/sound-audio-metadata-worker"], "planned image names");
for (const image of plan.proposedImages ?? []) {
  assertFalse(image.dockerfileCreatedNow, `${image.imageName} dockerfileCreatedNow`);
  assertFalse(image.dockerBuildRunNow, `${image.imageName} dockerBuildRunNow`);
  assertFalse(image.gcpTouchedNow, `${image.imageName} gcpTouchedNow`);
}
for (const key of ["dockerBuildRun", "dockerRun", "gcpApiCall", "cloudRunExecution", "secretManagerApiCall", "workerExecution", "routeExecution", "toolExecution", "mediaProcessing", "mediaFileOpen", "ffmpegFfprobeExecution", "modelWeightsDownloaded", "supabaseMutation", "sqlExecution", "artifactCreation"]) {
  assertFalse(plan.status?.[key], `plan status ${key}`);
}

assert(layers.layerPlan?.length === 7, "layer count mismatch");
assert(layers.systemDependencyPolicy?.ffmpegFfprobeInGate1cImagePlan === false, "FFmpeg layer widened");
assert(layers.systemDependencyPolicy?.modelWeightsInGate1cImagePlan === false, "model weight layer widened");
assert(layers.systemDependencyPolicy?.gpuRuntimeInGate1cImagePlan === false, "GPU layer widened");

for (const stage of proof.futureProofStages ?? []) {
  assert(stage.status === "proposed_not_executed_in_gate_1c", `proof stage executed: ${stage.stage}`);
}
for (const value of Object.values(proof.validationBoundaries ?? {})) {
  assert(value === false, "proof validation boundary widened");
}

for (const value of Object.values(gcp.blockedActions ?? {})) {
  assert(value === "blocked", "GCP blocked action widened");
}
assert(gcp.serviceAccountPolicy?.serviceAccountCreatedNow === false, "service account creation widened");
assert(gcp.secretPolicy?.secretManagerApiCallNow === false, "Secret Manager action widened");

for (const value of Object.values(policy.runtimeDefaults ?? {})) {
  assert(value === false, "runtime default widened");
}
for (const value of Object.values(policy.blockedClaims ?? {})) {
  assert(value === "blocked_unclaimed", "blocked claim widened");
}

assert(exclusions.excludedCounts?.modelWeightGpuTools === 12, "model exclusion count mismatch");
assert(exclusions.excludedCounts?.systemBinaryHandoffTools === 15, "system exclusion count mismatch");
assert(exclusions.excludedCounts?.providerTools === 3, "provider exclusion count mismatch");
assert(exclusions.excludedCounts?.blockedEvaluationTools === 5, "evaluation exclusion count mismatch");
assertIncludesAll(exclusions.modelWeightGpuTools ?? [], modelWeightTools, "model exclusions");
assertIncludesAll(exclusions.systemBinaryHandoffTools ?? [], systemBinaryTools, "system exclusions");
assertIncludesAll(exclusions.providerTools ?? [], providerTools, "provider exclusions");
assertIncludesAll(exclusions.blockedEvaluationTools ?? [], blockedEvaluationTools, "evaluation exclusions");
for (const value of Object.values(exclusions.scopePolicy ?? {})) {
  assert(value === "blocked", "excluded scope policy widened");
}

assert(prompt1d.sourceMilestone === "SOUND-RUNTIME-MEDIA-GATE-1C", "Gate 1D source milestone mismatch");
assert(prompt1d.requiredDecision === decision, "Gate 1D required decision mismatch");
assertIncludesAll(prompt1d.acceptedPlanningOnlyWorkerNames ?? [], acceptedWorkerNames, "Gate 1D worker names");
assertIncludesAll(prompt1d.acceptedPlanningOnlyJobTypes ?? [], acceptedJobTypes, "Gate 1D job types");
assertIncludesAll(prompt1d.blockedActions ?? [], ["worker execution", "route execution", "Docker build", "Docker run", "Cloud Run execution", "GCP API call", "Supabase mutation", "SQL execution"], "Gate 1D blocked actions");
assertSupabaseNoOp(prompt1d.supabaseClassification, "Gate 1D");

assert(prompt1e.sourceMilestone === "SOUND-RUNTIME-MEDIA-GATE-1C", "Gate 1E source milestone mismatch");
assert(prompt1e.requiredDecision === decision, "Gate 1E required decision mismatch");
assertIncludesAll(prompt1e.plannedImageNames ?? [], ["reeditpro/sound-cpu-analysis-worker", "reeditpro/sound-audio-metadata-worker"], "Gate 1E planned images");
assertIncludesAll(prompt1e.blockedActions ?? [], ["Dockerfile creation", "Docker build", "Docker run", "Cloud Run execution", "GCP API call", "Secret Manager API call", "worker execution", "Supabase mutation", "SQL execution"], "Gate 1E blocked actions");
assertSupabaseNoOp(prompt1e.supabaseClassification, "Gate 1E");

const requirementLines = read("server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt")
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"));
assert(requirementLines.length === 13, "requirements file should contain 13 pins");

const allDocs = [...docs.map(([file]) => file), "package.json", "scripts/validation/sound-runtime-media-gate-1c-diagnostics.mjs"];
scanUnsafe(allDocs);
const flattened = [...parsed.values()].flatMap((value) => flatten(value));
for (const text of flattened) {
  assert(!/\b(runtime_ready|worker_ready|media_processing_ready|beta_ready|production_ready)\s*:\s*(true|passed|ready)\b/i.test(text), "readiness widened");
}

console.log(JSON.stringify({
  ok: true,
  milestone: "SOUND-RUNTIME-MEDIA-GATE-1C",
  decision,
  sourceHead: plan.sourceBase.head,
  gate1bDecisionAccepted: gate1b.decision,
  directPinnedPackageCount: plan.packageSource.directPinnedPackageCount,
  cpuInstallCandidateCount: plan.packageSource.cpuInstallCandidateCount,
  plannedImages: plan.proposedImages.map((item) => item.imageName),
  acceptedPlanningOnlyJobTypes: plan.gate1bEvidenceConsumed.acceptedPlanningOnlyJobTypes,
  excludedModelWeightTools: exclusions.excludedCounts.modelWeightGpuTools,
  excludedSystemBinaryTools: exclusions.excludedCounts.systemBinaryHandoffTools,
  dockerBuildRun: plan.status.dockerBuildRun,
  gcpTouched: plan.status.gcpApiCall,
  workerExecution: plan.status.workerExecution,
  mediaProcessing: plan.status.mediaProcessing,
  supabaseClassification: plan.supabaseClassification,
  nextPrompt: plan.nextPrompt
}, null, 2));
