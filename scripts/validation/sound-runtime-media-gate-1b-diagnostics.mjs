#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const decision = "sound_runtime_media_gate_1b_worker_contract_owner_review_passed_with_warnings_ready_for_cpu_worker_image_plan";
const gate1aDecision = "sound_runtime_media_gate_1a_controlled_cpu_install_proof_passed_with_warnings_ready_for_worker_contract_review";
const gate1Decision = "sound_runtime_media_gate_1_completed_with_warnings_ready_for_controlled_cpu_install_proof";
const gate0Decision = "sound_runtime_media_gate_0_completed_with_warnings_ready_for_cpu_worker_install_plan";
const packageScript = "node scripts/validation/sound-runtime-media-gate-1b-diagnostics.mjs";

const docs = [
  ["docs/sound-runtime-media-gate-1b-worker-contract-owner-review.md", "sound-runtime-media-gate-1b-worker-contract-owner-review"],
  ["docs/sound-runtime-media-gate-1b-worker-contract-acceptance-register.md", "sound-runtime-media-gate-1b-worker-contract-acceptance-register"],
  ["docs/sound-runtime-media-gate-1b-owner-handoff-approval-map.md", "sound-runtime-media-gate-1b-owner-handoff-approval-map"],
  ["docs/sound-runtime-media-gate-1b-runtime-claim-policy.md", "sound-runtime-media-gate-1b-runtime-claim-policy"],
  ["docs/implementation-prompts/prompt-sound-runtime-media-gate-1c-cpu-worker-image-plan.md", "sound-runtime-media-gate-1c-cpu-worker-image-plan"],
  ["docs/implementation-prompts/prompt-sound-runtime-media-gate-1d-worker-runtime-owner-handoff.md", "sound-runtime-media-gate-1d-worker-runtime-owner-handoff"]
];

const sourceDocs = [
  ["docs/sound-runtime-media-gate-1a-controlled-cpu-install-proof-result.md", "sound-runtime-media-gate-1a-controlled-cpu-install-proof-result"],
  ["docs/sound-runtime-media-gate-1a-package-metadata-proof-register.md", "sound-runtime-media-gate-1a-package-metadata-proof-register"],
  ["docs/sound-runtime-media-gate-1a-runtime-claim-policy.md", "sound-runtime-media-gate-1a-runtime-claim-policy"],
  ["docs/sound-runtime-media-gate-1-cpu-worker-contract-plan.md", "sound-runtime-media-gate-1-cpu-worker-contract-plan"],
  ["docs/sound-runtime-media-gate-1-cpu-worker-install-plan.md", "sound-runtime-media-gate-1-cpu-worker-install-plan"],
  ["docs/sound-runtime-media-gate-0-owner-handoff-map.md", "sound-runtime-media-gate-0-owner-handoff-map"]
];

const requiredFiles = [
  "docs/implementation-prompts/prompt-sound-runtime-media-gate-1b-worker-contract-owner-review.md",
  "docs/implementation-prompts/prompt-sound-runtime-media-gate-2-model-weight-owner-review.md",
  "docs/implementation-prompts/prompt-sound-runtime-media-gate-3-media-policy-owner-handoff.md",
  "scripts/validation/sound-runtime-media-gate-1b-diagnostics.mjs",
  "scripts/validation/sound-runtime-media-gate-1a-diagnostics.mjs",
  "scripts/validation/sound-runtime-media-gate-1-diagnostics.mjs",
  "scripts/validation/sound-runtime-media-gate-0-diagnostics.mjs"
];

const expectedWorkerNames = [
  "sound-cpu-analysis-worker",
  "sound-audio-metadata-worker"
];

const expectedAcceptedJobTypes = [
  "sound.package_import_smoke",
  "sound.numeric_array_analysis",
  "sound.symbolic_midi_analysis",
  "sound.loudness_synthetic_analysis"
];

const blockedClaims = [
  "generated_local_fixture_passed",
  "dry_run_passed",
  "runtime_ready",
  "media_processing_ready",
  "worker_ready",
  "route_ready",
  "provider_ready",
  "supabase_ready",
  "artifact_ready",
  "billing_ready",
  "beta_ready",
  "production_ready"
];

const requiredOwners = [
  "WORKER_RUNTIME_JOBS",
  "TRACK_A_RENDER_EXPORT",
  "TRACK_B_MEDIA_PROCESSING",
  "SUPABASE_RLS_STORAGE_DATABASE",
  "PROVIDER_GATEWAY_MODELS",
  "BILLING_STRIPE_CREDITS",
  "PUBLIC_ARTIFACT_DELIVERY_POLICY",
  "PRODUCT_BETA_READINESS",
  "COMPLIANCE_SECURITY"
];

const forbiddenTrueKeys = [
  "workerExecutionAcceptedNow",
  "routeExecutionAcceptedNow",
  "toolExecutionAcceptedNow",
  "mediaFileOpenAcceptedNow",
  "pydubMediaOperationAcceptedNow",
  "ffmpegFfprobeAcceptedNow",
  "artifactWriteAcceptedNow",
  "supabaseMutationAcceptedNow",
  "sqlExecutionAcceptedNow",
  "dockerGcpExecutionAcceptedNow",
  "providerModelCallAcceptedNow",
  "modelWeightDownloadAcceptedNow",
  "billingMutationAcceptedNow",
  "betaProductionAcceptedNow",
  "mayBuildDockerImage",
  "mayCallGcp",
  "mayExecuteWorker",
  "mayOpenMedia",
  "mayMutateSupabase",
  "mayCreateArtifacts"
];

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

function assertExactMembers(actual, expected, label) {
  assert(Array.isArray(actual), `${label} must be an array`);
  assert(actual.length === expected.length, `${label} count mismatch`);
  assertIncludesAll(actual, expected, label);
}

function flatten(value, seen = new Set()) {
  if (value === null || value === undefined) return [];
  if (typeof value !== "object") return [String(value)];
  if (seen.has(value)) return [];
  seen.add(value);
  if (Array.isArray(value)) return value.flatMap((item) => flatten(item, seen));
  return Object.values(value).flatMap((item) => flatten(item, seen));
}

function collectKeys(value, keys = []) {
  if (value === null || typeof value !== "object") return keys;
  for (const [key, nested] of Object.entries(value)) {
    keys.push([key, nested]);
    collectKeys(nested, keys);
  }
  return keys;
}

function assertSupabaseNoOp(value, label) {
  assert(value?.updateRequired === "no", `${label} Supabase updateRequired widened`);
  assert(value?.environmentTouched === "no", `${label} Supabase environmentTouched widened`);
  assert(value?.sqlExecuted === "no", `${label} Supabase sqlExecuted widened`);
  assert(value?.migrationDeployed === "no", `${label} Supabase migrationDeployed widened`);
  assert(value?.nextAction === "none", `${label} Supabase nextAction widened`);
}

function scanUnsafe(files) {
  const patterns = [
    /https:\/\/[a-z0-9.-]+\.supabase\.co/i,
    new RegExp("\\bservice" + "_role\\b", "i"),
    /\bBearer\s+[A-Za-z0-9._-]{20,}/,
    /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/,
    /\b(sk|pk)_(live|test)_[A-Za-z0-9]{16,}\b/,
    /\bAIza[0-9A-Za-z_-]{20,}\b/,
    /"(runtimeReady|mediaProcessingReady|modelWeightsDownloaded|gcpTouched|cloudRunExecuted|supabaseMutated|betaReady|productionReady)"\s*:\s*true/,
    /"(mediaFileOpenAttempted|audioreadAudioOpenAttempted|pydubMediaOperationAttempted|ffmpegExecuted|ffprobeExecuted|modelDownloadAttempted|providerCallAttempted|workerExecutionAttempted|routeExecutionAttempted|toolExecutionAttempted|gcpCallAttempted|dockerCloudRunAttempted|supabaseMutationAttempted|sqlExecutionAttempted|artifactCreationAttempted|signedUrlCreationAttempted|publicArtifactCreationAttempted)"\s*:\s*true/,
    /generated_local_fixture_passed\s*[:=]\s*(true|passed|ready)/i,
    /dry_run_passed\s*[:=]\s*(true|passed|ready)/i,
    /runtime readiness\s+(enabled|passed|ready|unlocked)/i,
    /media processing readiness\s+(enabled|passed|ready|unlocked)/i,
    /worker readiness\s+(enabled|passed|ready|unlocked)/i,
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
assert(packageJson.scripts?.["sound-runtime-media-gate-1b:diagnostics"] === packageScript, "package script missing");

const review = parsed.get("sound-runtime-media-gate-1b-worker-contract-owner-review");
const register = parsed.get("sound-runtime-media-gate-1b-worker-contract-acceptance-register");
const handoff = parsed.get("sound-runtime-media-gate-1b-owner-handoff-approval-map");
const policy = parsed.get("sound-runtime-media-gate-1b-runtime-claim-policy");
const prompt1c = parsed.get("sound-runtime-media-gate-1c-cpu-worker-image-plan");
const prompt1d = parsed.get("sound-runtime-media-gate-1d-worker-runtime-owner-handoff");

for (const doc of [review, register, handoff, policy]) {
  assert(doc.milestone === "SOUND-RUNTIME-MEDIA-GATE-1B", "Gate 1B milestone mismatch");
  assert(doc.decision === decision, "Gate 1B decision mismatch");
  assertSupabaseNoOp(doc.supabaseClassification, "Gate 1B doc");
}

const gate1aResult = sources.get("sound-runtime-media-gate-1a-controlled-cpu-install-proof-result");
const gate1aRegister = sources.get("sound-runtime-media-gate-1a-package-metadata-proof-register");
const gate1aPolicy = sources.get("sound-runtime-media-gate-1a-runtime-claim-policy");
const gate1Contract = sources.get("sound-runtime-media-gate-1-cpu-worker-contract-plan");
const gate1Install = sources.get("sound-runtime-media-gate-1-cpu-worker-install-plan");
const gate0Handoff = sources.get("sound-runtime-media-gate-0-owner-handoff-map");

assert(gate1aResult.decision === gate1aDecision, "Gate 1A result decision mismatch");
assert(gate1aResult.sourceVerification?.sourceHead === "efed6a5d699672aa926c31fe48f8e232f31c0152", "Gate 1A source head mismatch");
assert(gate1aResult.proofResult?.metadataPassedCount === 13, "Gate 1A metadata pass count mismatch");
assert(gate1aResult.proofResult?.metadataFailedCount === 0, "Gate 1A metadata failure count mismatch");
assert(gate1aResult.proofResult?.importPassedCount === 14, "Gate 1A import pass count mismatch");
assert(gate1aResult.proofResult?.importFailedCount === 0, "Gate 1A import failure count mismatch");
assert(gate1aResult.pythonEnvironment?.tempVenvRemoved === true, "Gate 1A temp venv removal mismatch");
assert(gate1aRegister.metadataPassedCount === 13, "Gate 1A register metadata count mismatch");
assert(gate1aRegister.importPassedCount === 14, "Gate 1A register import count mismatch");
assert(gate1aPolicy.blockedClaims?.generated_local_fixture_passed === "blocked_unclaimed", "Gate 1A generated local fixture claim widened");
assert(gate1aPolicy.blockedClaims?.dry_run_passed === "blocked_unclaimed", "Gate 1A dry run claim widened");

assert(gate1Contract.decision === gate1Decision, "Gate 1 contract decision mismatch");
assertExactMembers(gate1Contract.workerNameProposals, expectedWorkerNames, "Gate 1 worker proposals");
assertIncludesAll(gate1Contract.futureJobTypesAllowedForPlanningOnly, [...expectedAcceptedJobTypes, "sound.synthetic_fixture_validate"], "Gate 1 future job types");
assert(gate1Install.decision === gate1Decision, "Gate 1 install decision mismatch");
assert(gate1Install.cpuInstallCandidates?.directPinnedPackageCount === 13, "Gate 1 direct pinned package count mismatch");
assert(gate1Install.cpuInstallCandidates?.cpuInstallCandidateCount === 15, "Gate 1 CPU candidate count mismatch");
assert(gate0Handoff.decision === gate0Decision, "Gate 0 handoff decision mismatch");
assertIncludesAll(gate0Handoff.ownerDependencies.map((item) => item.owner), requiredOwners, "Gate 0 owner handoffs");

assert(review.sourceVerification?.sourceHead === "0126327c19f1af18bb1ca040c31d06736693d1b6", "Gate 1B source head mismatch");
assert(review.sourceVerification?.pr647?.status === "merged", "PR #647 status missing");
assert(review.sourceVerification?.gate1aDecision === gate1aDecision, "Gate 1A source decision missing");
assert(review.sourceVerification?.gate1aProof?.metadataPassedCount === 13, "Gate 1B metadata count mismatch");
assert(review.sourceVerification?.gate1aProof?.importPassedCount === 14, "Gate 1B import count mismatch");
assert(review.sourceVerification?.gate1aProof?.tempVenvRemoved === true, "Gate 1B temp venv source mismatch");
assertExactMembers(review.acceptedPlanningOnlyWorkerNames, expectedWorkerNames, "accepted worker names");
assertExactMembers(review.acceptedPlanningOnlyJobTypes, expectedAcceptedJobTypes, "accepted job types");
assert(review.sourceEvidenceOnlyJobTypes?.length === 1, "source-only job count mismatch");
assert(review.sourceEvidenceOnlyJobTypes[0]?.jobType === "sound.synthetic_fixture_validate", "synthetic fixture job must be source-only");
assert(review.sourceEvidenceOnlyJobTypes[0]?.gate1bStatus === "source_evidence_only_not_accepted_for_worker_execution_contract", "synthetic fixture job source-only status mismatch");
for (const [key, value] of Object.entries(review.runtimeFlags)) {
  assert(value === false, `runtime flag must remain false: ${key}`);
}
assertIncludesAll(review.blockedContractItems, ["media file open", "pydub media operations", "FFmpeg or ffprobe execution", "worker execution", "Supabase mutation", "SQL execution", "generated_local_fixture_passed", "dry_run_passed"], "blocked contract items");

assertExactMembers(register.acceptedWorkerNames.map((item) => item.name), expectedWorkerNames, "register accepted worker names");
for (const item of register.acceptedWorkerNames) {
  assert(item.acceptedForPlanning === true, `${item.name} must be planning accepted`);
  assert(item.acceptedForExecutionNow === false, `${item.name} must not be executable now`);
}
assertExactMembers(register.acceptedJobTypes.map((item) => item.jobType), expectedAcceptedJobTypes, "register accepted job types");
for (const item of register.acceptedJobTypes) {
  assert(item.acceptedForPlanning === true, `${item.jobType} must be planning accepted`);
  assert(item.acceptedForExecutionNow === false, `${item.jobType} must not be executable now`);
}
assert(register.sourceEvidenceOnly?.length === 1, "source-only register count mismatch");
assert(register.sourceEvidenceOnly[0]?.item === "sound.synthetic_fixture_validate", "source-only register item mismatch");
assert(register.sourceEvidenceOnly[0]?.acceptedForGate1bContract === false, "synthetic fixture must not be Gate 1B accepted");
assert(register.sourceEvidenceOnly[0]?.acceptedForExecutionNow === false, "synthetic fixture must not be executable");
assert(register.mergeForwardPolicy?.gate1cMayUseAcceptedPlanningTerms === true, "Gate 1C must be allowed to use planning terms");
assert(register.mergeForwardPolicy?.gate1cMayBuildDockerImage === false, "Gate 1C Docker build must remain blocked");
assert(register.mergeForwardPolicy?.gate1cMayCallGcp === false, "Gate 1C GCP call must remain blocked");
assert(register.mergeForwardPolicy?.gate1cMayExecuteWorker === false, "Gate 1C worker execution must remain blocked");
assertIncludesAll(register.blockedItems.map((item) => item.item), ["media file open", "pydub media operations", "FFmpeg/ffprobe", "Supabase writes or SQL", "provider/model calls", "model weight downloads", "billing, beta, or production unlock"], "register blocked items");

assertIncludesAll(handoff.ownerHandoffs.map((item) => item.owner), requiredOwners, "Gate 1B owner handoffs");
const workerHandoff = handoff.ownerHandoffs.find((item) => item.owner === "WORKER_RUNTIME_JOBS");
assert(workerHandoff?.gate1bApproval === "planning_contract_terms_accepted", "worker owner approval status mismatch");
assertIncludesAll(workerHandoff.acceptedTerms, [...expectedWorkerNames, ...expectedAcceptedJobTypes], "worker handoff accepted terms");
assertIncludesAll(workerHandoff.blockedNow, ["worker execution", "job dispatch", "runtime route execution", "queue mutation"], "worker handoff blocked actions");
const supabaseHandoff = handoff.ownerHandoffs.find((item) => item.owner === "SUPABASE_RLS_STORAGE_DATABASE");
assert(supabaseHandoff?.gate1bApproval === "no_op_classification_only", "Supabase handoff must remain no-op");
assertIncludesAll(supabaseHandoff.blockedNow, ["Supabase mutation", "SQL execution", "migration deployment", "storage transfer", "service-role handler"], "Supabase blocked actions");

for (const claim of blockedClaims) {
  assert(policy.blockedClaims?.[claim] === "blocked_unclaimed", `blocked claim widened: ${claim}`);
}
assert(policy.gate1cCarryForward?.requiredSourceMilestone === "SOUND-RUNTIME-MEDIA-GATE-1B", "Gate 1C carry-forward source mismatch");
assert(policy.gate1cCarryForward?.requiredSourceDecision === decision, "Gate 1C carry-forward decision mismatch");
assert(policy.gate1cCarryForward?.mayPlanWorkerImage === true, "Gate 1C must be allowed to plan worker image");
assert(policy.gate1cCarryForward?.mayBuildDockerImage === false, "Gate 1C Docker build widened");
assert(policy.gate1cCarryForward?.mayCallGcp === false, "Gate 1C GCP widened");
assert(policy.gate1cCarryForward?.mayExecuteWorker === false, "Gate 1C worker execution widened");
assert(policy.gate1cCarryForward?.mayOpenMedia === false, "Gate 1C media open widened");
assert(policy.gate1cCarryForward?.mayMutateSupabase === false, "Gate 1C Supabase widened");
assert(policy.gate1cCarryForward?.mayCreateArtifacts === false, "Gate 1C artifact widened");

assert(prompt1c.sourceMilestone === "SOUND-RUNTIME-MEDIA-GATE-1B", "Gate 1C source milestone not updated");
assert(prompt1c.requiredDecision === decision, "Gate 1C required decision not updated");
assert(prompt1c.sourceEvidenceRequired?.[0] === "SOUND-RUNTIME-MEDIA-GATE-1B worker contract owner review", "Gate 1C must require Gate 1B first");
assertIncludesAll(prompt1c.blockedActions, ["Docker build", "Cloud Run execution", "GCP API call", "worker execution", "media processing", "Supabase mutation", "SQL execution", "artifact creation", "beta or production unlock"], "Gate 1C blocked actions");

assert(prompt1d.sourceMilestone === "SOUND-RUNTIME-MEDIA-GATE-1B", "Gate 1D source milestone mismatch");
assert(prompt1d.requiredDecision === decision, "Gate 1D required decision mismatch");
assertExactMembers(prompt1d.acceptedPlanningOnlyWorkerNames, expectedWorkerNames, "Gate 1D worker names");
assertExactMembers(prompt1d.acceptedPlanningOnlyJobTypes, expectedAcceptedJobTypes, "Gate 1D job types");
assert(prompt1d.sourceEvidenceOnlyJobTypes?.includes("sound.synthetic_fixture_validate"), "Gate 1D must preserve synthetic fixture source-only status");
assertIncludesAll(prompt1d.blockedActions, ["worker execution", "route execution", "tool execution", "queue mutation", "media file open", "Docker build", "Cloud Run execution", "Supabase mutation", "SQL execution", "artifact write", "beta or production unlock"], "Gate 1D blocked actions");
assertSupabaseNoOp(prompt1d.supabaseClassification, "Gate 1D prompt");

const allObjects = [review, register, handoff, policy, prompt1c, prompt1d];
for (const object of allObjects) {
  for (const [key, value] of collectKeys(object)) {
    if (forbiddenTrueKeys.includes(key)) {
      assert(value === false, `Unsafe true flag ${key}`);
    }
  }
}

const flattened = allObjects.flatMap((object) => flatten(object));
for (const value of flattened) {
  assert(!/\bruntime_ready\s*:\s*(passed|ready|true)\b/i.test(value), "runtime_ready widened");
  assert(!/\bmedia_processing_ready\s*:\s*(passed|ready|true)\b/i.test(value), "media_processing_ready widened");
  assert(!/\bbeta_ready\s*:\s*(passed|ready|true)\b/i.test(value), "beta_ready widened");
  assert(!/\bproduction_ready\s*:\s*(passed|ready|true)\b/i.test(value), "production_ready widened");
}

const filesToScan = [
  ...docs.map(([file]) => file),
  "package.json",
  "scripts/validation/sound-runtime-media-gate-1b-diagnostics.mjs"
];
scanUnsafe(filesToScan);

console.log(JSON.stringify({
  ok: true,
  milestone: "SOUND-RUNTIME-MEDIA-GATE-1B",
  decision,
  sourceHead: review.sourceVerification.sourceHead,
  gate1aDecisionAccepted: gate1aResult.decision,
  acceptedWorkerNames: review.acceptedPlanningOnlyWorkerNames,
  acceptedPlanningOnlyJobTypes: review.acceptedPlanningOnlyJobTypes,
  sourceEvidenceOnlyJobTypes: review.sourceEvidenceOnlyJobTypes.map((item) => item.jobType),
  ownerHandoffCount: handoff.ownerHandoffs.length,
  blockedClaims: Object.keys(policy.blockedClaims).length,
  supabaseClassification: policy.supabaseClassification,
  nextPrompt: review.nextPrompt
}, null, 2));
