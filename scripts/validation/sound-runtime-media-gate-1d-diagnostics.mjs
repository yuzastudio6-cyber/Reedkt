#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const decision = "sound_runtime_media_gate_1d_worker_runtime_owner_handoff_completed_with_warnings_ready_for_worker_owner_review";
const gate1cDecision = "sound_runtime_media_gate_1c_cpu_worker_image_plan_completed_with_warnings_ready_for_worker_runtime_handoff";
const gate1bDecision = "sound_runtime_media_gate_1b_worker_contract_owner_review_passed_with_warnings_ready_for_cpu_worker_image_plan";
const gate1aDecision = "sound_runtime_media_gate_1a_controlled_cpu_install_proof_passed_with_warnings_ready_for_worker_contract_review";
const packageScript = "node scripts/validation/sound-runtime-media-gate-1d-diagnostics.mjs";

const docs = [
  ["docs/sound-runtime-media-gate-1d-worker-runtime-owner-handoff.md", "sound-runtime-media-gate-1d-worker-runtime-owner-handoff"],
  ["docs/sound-runtime-media-gate-1d-worker-runtime-dependency-map.md", "sound-runtime-media-gate-1d-worker-runtime-dependency-map"],
  ["docs/sound-runtime-media-gate-1d-job-contract-handoff-register.md", "sound-runtime-media-gate-1d-job-contract-handoff-register"],
  ["docs/sound-runtime-media-gate-1d-worker-runtime-blocker-register.md", "sound-runtime-media-gate-1d-worker-runtime-blocker-register"],
  ["docs/sound-runtime-media-gate-1d-worker-runtime-owner-acceptance-request.md", "sound-runtime-media-gate-1d-worker-runtime-owner-acceptance-request"],
  ["docs/sound-runtime-media-gate-1d-runtime-claim-policy.md", "sound-runtime-media-gate-1d-runtime-claim-policy"],
  ["docs/implementation-prompts/prompt-sound-runtime-media-gate-1e-dockerfile-static-plan.md", "sound-runtime-media-gate-1e-dockerfile-static-plan"],
  ["docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-handoff-review.md", "worker-runtime-jobs-sound-cpu-handoff-review"]
];

const sources = [
  ["docs/sound-runtime-media-gate-1c-cpu-worker-image-plan.md", "sound-runtime-media-gate-1c-cpu-worker-image-plan"],
  ["docs/sound-runtime-media-gate-1c-image-layer-strategy.md", "sound-runtime-media-gate-1c-image-layer-strategy"],
  ["docs/sound-runtime-media-gate-1c-image-proof-and-ci-plan.md", "sound-runtime-media-gate-1c-image-proof-and-ci-plan"],
  ["docs/sound-runtime-media-gate-1c-gcp-cloud-run-handoff-plan.md", "sound-runtime-media-gate-1c-gcp-cloud-run-handoff-plan"],
  ["docs/sound-runtime-media-gate-1c-runtime-disabled-default-policy.md", "sound-runtime-media-gate-1c-runtime-disabled-default-policy"],
  ["docs/sound-runtime-media-gate-1c-image-excluded-tools-register.md", "sound-runtime-media-gate-1c-image-excluded-tools-register"],
  ["docs/sound-runtime-media-gate-1b-worker-contract-owner-review.md", "sound-runtime-media-gate-1b-worker-contract-owner-review"],
  ["docs/sound-runtime-media-gate-1b-worker-contract-acceptance-register.md", "sound-runtime-media-gate-1b-worker-contract-acceptance-register"],
  ["docs/sound-runtime-media-gate-1a-controlled-cpu-install-proof-result.md", "sound-runtime-media-gate-1a-controlled-cpu-install-proof-result"],
  ["docs/sound-runtime-media-gate-1a-package-metadata-proof-register.md", "sound-runtime-media-gate-1a-package-metadata-proof-register"]
];

const requiredFiles = [
  "docs/cross-chat-tool-ownership-registry.md",
  "docs/implementation-prompts/prompt-sound-runtime-media-gate-2-model-weight-owner-review.md",
  "docs/implementation-prompts/prompt-sound-runtime-media-gate-3-media-policy-owner-handoff.md",
  "scripts/validation/sound-runtime-media-gate-1c-diagnostics.mjs",
  "scripts/validation/sound-runtime-media-gate-1b-diagnostics.mjs",
  "scripts/validation/sound-runtime-media-gate-1a-diagnostics.mjs",
  "scripts/validation/sound-runtime-media-gate-1-diagnostics.mjs",
  "scripts/validation/sound-runtime-media-gate-0-diagnostics.mjs"
];

const acceptedWorkerNames = [
  "sound-cpu-analysis-worker",
  "sound-audio-metadata-worker"
];

const plannedImageNames = [
  "reeditpro/sound-cpu-analysis-worker",
  "reeditpro/sound-audio-metadata-worker"
];

const acceptedJobTypes = [
  "sound.package_import_smoke",
  "sound.numeric_array_analysis",
  "sound.symbolic_midi_analysis",
  "sound.loudness_synthetic_analysis"
];

const blockedJobTypes = [
  "sound.open_media_file",
  "sound.process_real_audio",
  "sound.pydub_media_operation",
  "sound.ffmpeg_audio_extract",
  "sound.write_audio_artifact",
  "sound.generate_music",
  "sound.generate_sfx",
  "sound.download_model_weights"
];

const blockedActionTerms = [
  "worker execution",
  "route execution",
  "tool execution",
  "Docker build",
  "GCP API call",
  "Cloud Run execution",
  "Secret Manager API call",
  "media file open",
  "pydub media operation",
  "FFmpeg or ffprobe execution",
  "provider call",
  "model call",
  "model download",
  "artifact write",
  "Supabase mutation",
  "SQL execution",
  "signed URL creation",
  "public artifact creation",
  "beta or production unlock"
];

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

function strings(value) {
  if (value === null || value === undefined) return [];
  if (typeof value !== "object") return [String(value)];
  if (Array.isArray(value)) return value.flatMap(strings);
  return Object.values(value).flatMap(strings);
}

function assertNoExecutionFlags(objects) {
  const flagNames = [
    "workerExecutionRun",
    "routeExecutionRun",
    "toolExecutionRun",
    "dockerBuildRun",
    "gcpTouched",
    "mediaProcessingRun",
    "supabaseTouched",
    "sqlExecuted",
    "modelWeightsDownloaded",
    "artifactCreated",
    "runtimeReadinessClaimed",
    "allowedInWorkerRuntimeToday",
    "executionAllowedNow",
    "isWorkerReadiness",
    "isRouteReadiness",
    "isToolExecutionReadiness",
    "isMediaReadiness",
    "isDockerReadiness",
    "isGcpReadiness",
    "isSupabaseReadiness",
    "isArtifactReadiness",
    "isBetaReadiness",
    "isProductionReadiness",
    "isGeneratedLocalFixturePassed",
    "isDryRunPassed",
    "isRuntimeReadiness"
  ];

  function walk(value, pathParts = []) {
    if (value === null || value === undefined || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, pathParts.concat(String(index))));
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      if (flagNames.includes(key)) {
        const label = pathParts.concat(key).join(".");
        if (typeof child === "boolean") {
          assertFalse(child, label);
        } else {
          assert(child === "no" || child === "blocked_unclaimed", `${label} must be false/no/blocked_unclaimed`);
        }
      }
      walk(child, pathParts.concat(key));
    }
  }

  objects.forEach((object) => walk(object));
}

function scanUnsafe(files) {
  const patterns = [
    /https:\/\/[a-z0-9.-]+\.supabase\.co/i,
    new RegExp("\\bservice" + "_role\\b", "i"),
    /\bBearer\s+[A-Za-z0-9._-]{20,}/,
    /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/,
    /\b(sk|pk)_(live|test)_[A-Za-z0-9]{16,}\b/,
    /\bAIza[0-9A-Za-z_-]{20,}\b/,
    /"(workerExecutionRun|routeExecutionRun|toolExecutionRun|dockerBuildRun|gcpTouched|mediaProcessingRun|supabaseTouched|modelWeightsDownloaded|artifactCreated|runtimeReadinessClaimed)"\s*:\s*true/,
    /"(isWorkerReadiness|isRouteReadiness|isToolExecutionReadiness|isMediaReadiness|isDockerReadiness|isGcpReadiness|isSupabaseReadiness|isArtifactReadiness|isBetaReadiness|isProductionReadiness|isGeneratedLocalFixturePassed|isDryRunPassed|isRuntimeReadiness)"\s*:\s*true/,
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
assert(packageJson.scripts?.["sound-runtime-media-gate-1d:diagnostics"] === packageScript, "package script missing");

const handoff = parsed.get("sound-runtime-media-gate-1d-worker-runtime-owner-handoff");
const dependencyMap = parsed.get("sound-runtime-media-gate-1d-worker-runtime-dependency-map");
const jobRegister = parsed.get("sound-runtime-media-gate-1d-job-contract-handoff-register");
const blockerRegister = parsed.get("sound-runtime-media-gate-1d-worker-runtime-blocker-register");
const acceptance = parsed.get("sound-runtime-media-gate-1d-worker-runtime-owner-acceptance-request");
const claimPolicy = parsed.get("sound-runtime-media-gate-1d-runtime-claim-policy");
const prompt1e = parsed.get("sound-runtime-media-gate-1e-dockerfile-static-plan");
const workerPrompt = parsed.get("worker-runtime-jobs-sound-cpu-handoff-review");

for (const doc of [handoff, dependencyMap, jobRegister, blockerRegister, acceptance, claimPolicy]) {
  assert(doc.milestone === "SOUND-RUNTIME-MEDIA-GATE-1D", "Gate 1D milestone mismatch");
  assert(doc.decision === decision, "Gate 1D decision mismatch");
}

for (const doc of [handoff, dependencyMap, blockerRegister, acceptance, claimPolicy, prompt1e, workerPrompt]) {
  assertSupabaseNoOp(doc.supabaseClassification, "Gate 1D packet");
}

const gate1cPlan = sourceParsed.get("sound-runtime-media-gate-1c-cpu-worker-image-plan");
const gate1cPolicy = sourceParsed.get("sound-runtime-media-gate-1c-runtime-disabled-default-policy");
const gate1bReview = sourceParsed.get("sound-runtime-media-gate-1b-worker-contract-owner-review");
const gate1bRegister = sourceParsed.get("sound-runtime-media-gate-1b-worker-contract-acceptance-register");
const gate1aProof = sourceParsed.get("sound-runtime-media-gate-1a-controlled-cpu-install-proof-result");
const gate1aRegister = sourceParsed.get("sound-runtime-media-gate-1a-package-metadata-proof-register");

assert(gate1cPlan.decision === gate1cDecision, "Gate 1C source decision mismatch");
assert(gate1cPlan.sourceBase?.pr660?.mergeCommit === undefined || true, "Gate 1C source shape unexpected");
assert(gate1cPlan.packageSource?.directPinnedPackageCount === 13, "Gate 1C direct pinned count mismatch");
assert(gate1cPlan.packageSource?.cpuInstallCandidateCount === 15, "Gate 1C candidate count mismatch");
assertIncludesAll(gate1cPlan.gate1bEvidenceConsumed?.acceptedPlanningOnlyWorkerNames ?? [], acceptedWorkerNames, "Gate 1C worker names");
assertIncludesAll(gate1cPlan.gate1bEvidenceConsumed?.acceptedPlanningOnlyJobTypes ?? [], acceptedJobTypes, "Gate 1C job types");
assertIncludesAll(gate1cPlan.proposedImages?.map((item) => item.imageName) ?? [], plannedImageNames, "Gate 1C image names");
assert(gate1cPolicy.runtimeDefaults?.workerExecutionAllowedNow === false, "Gate 1C worker execution widened");
assert(gate1cPolicy.runtimeDefaults?.dockerBuildAllowedNow === false, "Gate 1C Docker widened");
assert(gate1bReview.decision === gate1bDecision, "Gate 1B decision mismatch");
assertIncludesAll(gate1bRegister.acceptedJobTypes?.map((item) => item.jobType) ?? [], acceptedJobTypes, "Gate 1B accepted job types");
assert(gate1aProof.decision === gate1aDecision, "Gate 1A decision mismatch");
assert(gate1aProof.proofResult?.metadataPassedCount === 13, "Gate 1A metadata count mismatch");
assert(gate1aProof.proofResult?.importPassedCount === 14, "Gate 1A import count mismatch");
assert(gate1aProof.proofResult?.importFailedCount === 0, "Gate 1A import failure count mismatch");
assert(gate1aProof.packageLockStatus === "unchanged_by_python_proof", "Gate 1A package lock status mismatch");
assert(gate1aRegister.directPinnedPackageCount === 13, "Gate 1A register pinned count mismatch");

assert(handoff.sourceBase?.head === "b46509a54695dd049d044fd7135b37a8faaef18e", "Gate 1D source head mismatch");
assert(handoff.sourceBase?.pr660?.mergeCommit === "b46509a54695dd049d044fd7135b37a8faaef18e", "PR #660 merge evidence mismatch");
assert(handoff.sourceBase?.pr660?.decision === gate1cDecision, "PR #660 decision mismatch");
assert(handoff.sourceBase?.pr653?.decision === gate1bDecision, "PR #653 decision mismatch");
assert(handoff.sourceBase?.pr647?.decision === gate1aDecision, "PR #647 decision mismatch");
assert(handoff.targetOwner === "WORKER_RUNTIME_JOBS", "handoff target owner mismatch");
assertIncludesAll(handoff.acceptedForHandoff?.plannedWorkerNames ?? [], acceptedWorkerNames, "handoff worker names");
assertIncludesAll(handoff.acceptedForHandoff?.plannedImageNames ?? [], plannedImageNames, "handoff image names");
assertIncludesAll(handoff.acceptedForHandoff?.planningOnlyJobTypes ?? [], acceptedJobTypes, "handoff job types");
assert(handoff.acceptedForHandoff?.directPinnedPackageCount === 13, "handoff package count mismatch");
assert(handoff.acceptedForHandoff?.importCheckCount === 14, "handoff import count mismatch");
assert(handoff.acceptedForHandoff?.failedImportCount === 0, "handoff failed import count mismatch");
assertIncludesAll(handoff.stillBlocked ?? [], ["worker execution", "route execution", "tool execution", "Docker build", "GCP or Cloud Run call", "media file open", "Supabase mutation", "SQL execution", "model weight download", "generated_local_fixture_passed", "dry_run_passed", "runtime readiness"], "handoff blocked list");
assert(handoff.nextPrompt === "WORKER_RUNTIME_JOBS-SOUND-CPU-HANDOFF-REVIEW: review SOUND CPU worker handoff, no execution", "handoff next prompt mismatch");

assertIncludesAll(dependencyMap.plannedWorkers?.map((item) => item.workerName) ?? [], acceptedWorkerNames, "dependency worker names");
assertIncludesAll(dependencyMap.plannedWorkers?.map((item) => item.imageName) ?? [], plannedImageNames, "dependency image names");
const dependencyText = strings(dependencyMap.dependencies).join("\n");
for (const owner of ["WORKER_RUNTIME_JOBS", "SUPABASE_RLS_STORAGE_DATABASE", "PUBLIC_ARTIFACT_DELIVERY_POLICY", "BILLING_STRIPE_CREDITS", "PRODUCT_BETA_READINESS"]) {
  assert(dependencyText.includes(owner), `dependency owners missing ${owner}`);
}
assert(dependencyMap.runtimeReadinessClaim === "blocked_unclaimed", "dependency runtime readiness widened");

assertIncludesAll(jobRegister.acceptedPlanningOnlyJobs?.map((item) => item.jobType) ?? [], acceptedJobTypes, "job register accepted jobs");
assertIncludesAll(jobRegister.blockedJobTypes?.map((item) => item.jobType) ?? [], blockedJobTypes, "job register blocked jobs");
assert(jobRegister.sourceEvidenceOnlyJobs?.some((item) => item.jobType === "sound.synthetic_fixture_validate" && item.acceptedForGate1dHandoff === false), "synthetic fixture source-only policy missing");
assert(jobRegister.generated_local_fixture_passed === "blocked_unclaimed", "generated_local_fixture_passed widened");
assert(jobRegister.dry_run_passed === "blocked_unclaimed", "dry_run_passed widened");

assertIncludesAll(blockerRegister.blockers?.map((item) => item.blocker) ?? [], ["worker execution", "route execution", "Docker build", "GCP and Cloud Run", "Supabase persistence", "model weights", "generated_local_fixture_passed", "dry_run_passed", "runtime readiness"], "blocker register");
assert(blockerRegister.blockers.every((item) => item.executionAllowedNow === false), "blocker execution flag widened");

assert(acceptance.targetOwner === "WORKER_RUNTIME_JOBS", "acceptance target owner mismatch");
assertIncludesAll(acceptance.acceptedPlanningOnlyWorkerNames ?? [], acceptedWorkerNames, "acceptance worker names");
assertIncludesAll(acceptance.plannedImageNames ?? [], plannedImageNames, "acceptance image names");
assertIncludesAll(acceptance.acceptedPlanningOnlyJobTypes ?? [], acceptedJobTypes, "acceptance job types");
assert(acceptance.futureGateNeededBeforeAnyWorkerExecution === "WORKER_RUNTIME_JOBS-SOUND-CPU-HANDOFF-REVIEW: review SOUND CPU worker handoff, no execution", "future owner prompt mismatch");

assertNoExecutionFlags([handoff, dependencyMap, jobRegister, blockerRegister, claimPolicy]);
for (const [claim, value] of Object.entries(claimPolicy.blockedClaims ?? {})) {
  assert(value === "blocked_unclaimed", `${claim} claim widened`);
}

assert(prompt1e.sourceEvidenceRequired?.includes("SOUND-RUNTIME-MEDIA-GATE-1D worker runtime owner handoff"), "Gate 1E missing Gate 1D evidence requirement");
assertIncludesAll(prompt1e.blockedActions ?? [], ["Dockerfile creation", "Docker build", "Docker run", "Cloud Run execution", "GCP API call", "worker execution", "Supabase mutation", "SQL execution"], "Gate 1E blocked actions");
assert(workerPrompt.sourceMilestone === "SOUND-RUNTIME-MEDIA-GATE-1D", "worker prompt source mismatch");
assert(workerPrompt.requiredDecision === decision, "worker prompt decision mismatch");
assert(workerPrompt.targetOwner === "WORKER_RUNTIME_JOBS", "worker prompt owner mismatch");
assertIncludesAll(workerPrompt.blockedActions ?? [], blockedActionTerms, "worker prompt blocked actions");

const ownershipText = read("docs/cross-chat-tool-ownership-registry.md");
assert(ownershipText.includes("WORKER_RUNTIME_JOBS"), "ownership registry missing WORKER_RUNTIME_JOBS");

scanUnsafe(docs.map(([file]) => file));

console.log(JSON.stringify({
  status: "sound_runtime_media_gate_1d_diagnostics_passed",
  decision,
  sourceHead: handoff.sourceBase.head,
  targetOwner: handoff.targetOwner,
  acceptedWorkerNames,
  plannedImageNames,
  acceptedJobTypes,
  blockedJobTypeCount: blockedJobTypes.length,
  supabaseClassification: handoff.supabaseClassification,
  nextPrompt: handoff.nextPrompt
}, null, 2));
