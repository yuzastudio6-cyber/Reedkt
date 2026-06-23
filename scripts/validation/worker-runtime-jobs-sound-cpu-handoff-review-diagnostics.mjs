#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const decision = "worker_runtime_jobs_sound_cpu_handoff_review_passed_with_warnings_ready_for_static_contract_plan";
const gate1dDecision = "sound_runtime_media_gate_1d_worker_runtime_owner_handoff_completed_with_warnings_ready_for_worker_owner_review";
const packageScript = "node scripts/validation/worker-runtime-jobs-sound-cpu-handoff-review-diagnostics.mjs";

const docs = [
  ["docs/worker-runtime-jobs-sound-cpu-handoff-review.md", "worker-runtime-jobs-sound-cpu-handoff-review"],
  ["docs/worker-runtime-jobs-sound-cpu-acceptance-register.md", "worker-runtime-jobs-sound-cpu-acceptance-register"],
  ["docs/worker-runtime-jobs-sound-cpu-runtime-blocker-map.md", "worker-runtime-jobs-sound-cpu-runtime-blocker-map"],
  ["docs/worker-runtime-jobs-sound-cpu-job-schema-review.md", "worker-runtime-jobs-sound-cpu-job-schema-review"],
  ["docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-static-contract-plan.md", "worker-runtime-jobs-sound-cpu-static-contract-plan"],
  ["docs/implementation-prompts/prompt-sound-runtime-media-gate-1e-dockerfile-static-plan.md", "sound-runtime-media-gate-1e-dockerfile-static-plan"]
];

const sourceDocs = [
  ["docs/sound-runtime-media-gate-1d-worker-runtime-owner-handoff.md", "sound-runtime-media-gate-1d-worker-runtime-owner-handoff"],
  ["docs/sound-runtime-media-gate-1d-worker-runtime-dependency-map.md", "sound-runtime-media-gate-1d-worker-runtime-dependency-map"],
  ["docs/sound-runtime-media-gate-1d-job-contract-handoff-register.md", "sound-runtime-media-gate-1d-job-contract-handoff-register"],
  ["docs/sound-runtime-media-gate-1d-worker-runtime-blocker-register.md", "sound-runtime-media-gate-1d-worker-runtime-blocker-register"],
  ["docs/sound-runtime-media-gate-1d-worker-runtime-owner-acceptance-request.md", "sound-runtime-media-gate-1d-worker-runtime-owner-acceptance-request"],
  ["docs/sound-runtime-media-gate-1d-runtime-claim-policy.md", "sound-runtime-media-gate-1d-runtime-claim-policy"],
  ["docs/sound-runtime-media-gate-1c-cpu-worker-image-plan.md", "sound-runtime-media-gate-1c-cpu-worker-image-plan"],
  ["docs/sound-runtime-media-gate-1b-worker-contract-owner-review.md", "sound-runtime-media-gate-1b-worker-contract-owner-review"],
  ["docs/sound-runtime-media-gate-1a-controlled-cpu-install-proof-result.md", "sound-runtime-media-gate-1a-controlled-cpu-install-proof-result"]
];

const requiredFiles = [
  "docs/cross-chat-tool-ownership-registry.md",
  "scripts/validation/sound-runtime-media-gate-1d-diagnostics.mjs",
  "scripts/validation/sound-runtime-media-gate-1c-diagnostics.mjs",
  "scripts/validation/sound-runtime-media-gate-1b-diagnostics.mjs",
  "scripts/validation/sound-runtime-media-gate-1a-diagnostics.mjs",
  "scripts/validation/sound-runtime-media-gate-1-diagnostics.mjs",
  "scripts/validation/sound-runtime-media-gate-0-diagnostics.mjs"
];

const workerNames = [
  "sound-cpu-analysis-worker",
  "sound-audio-metadata-worker"
];

const imageNames = [
  "reeditpro/sound-cpu-analysis-worker",
  "reeditpro/sound-audio-metadata-worker"
];

const planningJobTypes = [
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

const expectedBlockers = [
  "worker runtime implementation absent",
  "dispatch/claim/lease not approved",
  "worker execution not approved",
  "route execution not approved",
  "tool execution not approved",
  "Dockerfile not created",
  "Docker build not approved",
  "GCP/Cloud Run not approved",
  "service account not approved",
  "Secret Manager not approved",
  "media policy not approved",
  "artifact policy not approved",
  "Supabase persistence not approved",
  "observability/cost policy needed",
  "beta/production not approved",
  "generated_local_fixture_passed not claimed",
  "dry_run_passed not claimed",
  "runtime readiness not claimed"
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

function strings(value) {
  if (value === null || value === undefined) return [];
  if (typeof value !== "object") return [String(value)];
  if (Array.isArray(value)) return value.flatMap(strings);
  return Object.values(value).flatMap(strings);
}

function assertIncludesAll(actual, expected, label) {
  const set = new Set(actual);
  for (const value of expected) {
    assert(set.has(value), `${label} missing ${value}`);
  }
}

function assertSupabaseNoOp(value, label) {
  assert(value?.updateRequired === "no", `${label} Supabase updateRequired widened`);
  assert(value?.environmentTouched === "no", `${label} Supabase environmentTouched widened`);
  assert(value?.sqlExecuted === "no", `${label} Supabase sqlExecuted widened`);
  assert(value?.migrationDeployed === "no", `${label} Supabase migrationDeployed widened`);
  assert(value?.nextAction === "none", `${label} Supabase nextAction widened`);
}

function assertNoExecutionFlags(objects) {
  const flagNames = [
    "workerExecutionRun",
    "routeExecutionRun",
    "toolExecutionRun",
    "dockerBuildRun",
    "gcpTouched",
    "cloudRunTouched",
    "secretManagerTouched",
    "mediaProcessingRun",
    "supabaseTouched",
    "sqlExecuted",
    "modelWeightsDownloaded",
    "artifactCreated",
    "runtimeReadinessClaimed",
    "generatedLocalFixturePassedClaimed",
    "dryRunPassedClaimed",
    "acceptedForExecutionToday",
    "executionAllowedNow",
    "mediaAccessRequired",
    "artifactWriteRequired",
    "supabaseWriteRequired",
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
          assert(child === false, `${label} must be false`);
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
    /"(workerExecutionRun|routeExecutionRun|toolExecutionRun|dockerBuildRun|gcpTouched|cloudRunTouched|secretManagerTouched|mediaProcessingRun|supabaseTouched|modelWeightsDownloaded|artifactCreated|runtimeReadinessClaimed|generatedLocalFixturePassedClaimed|dryRunPassedClaimed)"\s*:\s*true/,
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
const sources = new Map(sourceDocs.map(([file, label]) => [label, parseBlock(file, label)]));

const packageJson = JSON.parse(read("package.json"));
assert(packageJson.scripts?.["worker-runtime-jobs:sound-cpu-handoff-review:diagnostics"] === packageScript, "package script missing");

const review = parsed.get("worker-runtime-jobs-sound-cpu-handoff-review");
const acceptance = parsed.get("worker-runtime-jobs-sound-cpu-acceptance-register");
const blockerMap = parsed.get("worker-runtime-jobs-sound-cpu-runtime-blocker-map");
const schemaReview = parsed.get("worker-runtime-jobs-sound-cpu-job-schema-review");
const staticPrompt = parsed.get("worker-runtime-jobs-sound-cpu-static-contract-plan");
const gate1ePrompt = parsed.get("sound-runtime-media-gate-1e-dockerfile-static-plan");

for (const doc of [review, acceptance, blockerMap, schemaReview]) {
  assert(doc.milestone === "WORKER_RUNTIME_JOBS-SOUND-CPU-HANDOFF-REVIEW", "milestone mismatch");
  assert(doc.decision === decision, "decision mismatch");
  assert(doc.targetOwner === "WORKER_RUNTIME_JOBS", "target owner mismatch");
  assertSupabaseNoOp(doc.supabaseClassification, "WORKER_RUNTIME_JOBS packet");
}

const sourceHandoff = sources.get("sound-runtime-media-gate-1d-worker-runtime-owner-handoff");
assert(sourceHandoff.decision === gate1dDecision, "Gate 1D decision mismatch");
assert(sourceHandoff.sourceBase?.head === "b46509a54695dd049d044fd7135b37a8faaef18e", "Gate 1D source head mismatch");
assert(sourceHandoff.targetOwner === "WORKER_RUNTIME_JOBS", "Gate 1D target owner mismatch");
assert(sourceHandoff.acceptedForHandoff?.directPinnedPackageCount === 13, "Gate 1D pinned package count mismatch");
assert(sourceHandoff.acceptedForHandoff?.importCheckCount === 14, "Gate 1D import check count mismatch");
assert(sourceHandoff.acceptedForHandoff?.failedImportCount === 0, "Gate 1D failed import count mismatch");
assert(sourceHandoff.nextPrompt === "WORKER_RUNTIME_JOBS-SOUND-CPU-HANDOFF-REVIEW: review SOUND CPU worker handoff, no execution", "Gate 1D next prompt mismatch");

assert(review.sourceBase?.head === "dbb6d7fe56e7a710059fd80385f11e6fe186f5e0", "source head mismatch");
assert(review.sourceBase?.pr663?.mergeCommit === "dbb6d7fe56e7a710059fd80385f11e6fe186f5e0", "PR #663 merge evidence mismatch");
assert(review.sourceBase?.pr663?.decision === gate1dDecision, "PR #663 decision mismatch");
assert(review.ownerReviewResult === "accepted_for_future_static_contract_planning_only", "owner review result mismatch");
assert(review.acceptedForExecutionToday === false, "review execution acceptance widened");

assertIncludesAll(review.acceptedForFuturePlanning.workerNames ?? [], workerNames, "review worker names");
assertIncludesAll(review.acceptedForFuturePlanning.imageNames ?? [], imageNames, "review image names");
assertIncludesAll(review.acceptedForFuturePlanning.jobTypes ?? [], planningJobTypes, "review job types");
assert(review.acceptedForFuturePlanning.directPinnedPackageCount === 13, "review pinned package count mismatch");
assert(review.acceptedForFuturePlanning.importCheckCount === 14, "review import check count mismatch");
assert(review.acceptedForFuturePlanning.failedImportCount === 0, "review failed import count mismatch");

const acceptanceItems = acceptance.items ?? [];
assertIncludesAll(acceptanceItems.map((item) => item.item), [...workerNames, ...imageNames, ...planningJobTypes], "acceptance items");
for (const item of acceptanceItems) {
  assert(item.acceptedForExecutionToday === false, `acceptance item ${item.item} execution widened`);
  if ([...workerNames, ...imageNames, ...planningJobTypes].includes(item.item)) {
    assert(item.acceptedForFuturePlanning === true, `acceptance item ${item.item} future planning not accepted`);
  }
}

assertIncludesAll(blockerMap.blockers?.map((item) => item.blocker) ?? [], expectedBlockers, "runtime blocker map");
assert(blockerMap.blockers.every((item) => item.executionAllowedNow === false), "runtime blocker execution widened");
assertIncludesAll(blockerMap.blockedJobTypes ?? [], blockedJobTypes, "runtime blocker job types");

assertIncludesAll(schemaReview.acceptedPlanningOnlyJobs?.map((item) => item.jobType) ?? [], planningJobTypes, "schema review jobs");
for (const job of schemaReview.acceptedPlanningOnlyJobs ?? []) {
  assert(job.mediaAccessRequired === false, `${job.jobType} media access widened`);
  assert(job.artifactWriteRequired === false, `${job.jobType} artifact write widened`);
  assert(job.supabaseWriteRequired === false, `${job.jobType} Supabase write widened`);
  assert(job.runtimeReadinessStatus === "blocked_unclaimed", `${job.jobType} runtime readiness widened`);
  assert(job.acceptanceResult === "accepted_for_future_static_contract_planning_only", `${job.jobType} acceptance result mismatch`);
}
assertIncludesAll(schemaReview.explicitlyRejectedForCurrentWorkerExecution?.map((item) => item.jobType) ?? [], blockedJobTypes, "schema rejected jobs");

assert(staticPrompt.sourceMilestone === "WORKER_RUNTIME_JOBS-SOUND-CPU-HANDOFF-REVIEW", "static prompt source mismatch");
assert(staticPrompt.requiredDecision === decision, "static prompt required decision mismatch");
assertIncludesAll(staticPrompt.acceptedPlanningOnlyWorkerNames ?? [], workerNames, "static prompt workers");
assertIncludesAll(staticPrompt.acceptedPlanningOnlyImageNames ?? [], imageNames, "static prompt images");
assertIncludesAll(staticPrompt.acceptedPlanningOnlyJobTypes ?? [], planningJobTypes, "static prompt jobs");
assertSupabaseNoOp(staticPrompt.supabaseClassification, "static prompt");

assert(gate1ePrompt.sourceMilestone === "SOUND-RUNTIME-MEDIA-GATE-1C", "Gate 1E source milestone mismatch");
assert(gate1ePrompt.requiredDecision === "sound_runtime_media_gate_1c_cpu_worker_image_plan_completed_with_warnings_ready_for_worker_runtime_handoff", "Gate 1E required decision mismatch");
assert(gate1ePrompt.workerOwnerReviewMilestone === "WORKER_RUNTIME_JOBS-SOUND-CPU-HANDOFF-REVIEW", "Gate 1E worker owner review milestone missing");
assert(gate1ePrompt.workerOwnerReviewRequiredDecision === decision, "Gate 1E worker owner required decision missing");
assert(gate1ePrompt.sourceEvidenceRequired?.includes("WORKER_RUNTIME_JOBS SOUND CPU handoff review"), "Gate 1E missing worker owner review evidence");
assertIncludesAll(gate1ePrompt.blockedActions ?? [], ["Dockerfile creation", "Docker build", "Docker run", "Cloud Run execution", "GCP API call", "worker execution", "Supabase mutation", "SQL execution"], "Gate 1E blocked actions");
assertSupabaseNoOp(gate1ePrompt.supabaseClassification, "Gate 1E prompt");

const ownershipText = read("docs/cross-chat-tool-ownership-registry.md");
assert(ownershipText.includes("WORKER_RUNTIME_JOBS"), "ownership registry missing WORKER_RUNTIME_JOBS");

assertNoExecutionFlags([review, acceptance, blockerMap, schemaReview, staticPrompt, gate1ePrompt]);
for (const source of sources.values()) {
  assertNoExecutionFlags([source]);
}

const allDocStrings = strings([review, acceptance, blockerMap, schemaReview, staticPrompt, gate1ePrompt]).join("\n");
for (const value of [...workerNames, ...imageNames, ...planningJobTypes, ...blockedJobTypes]) {
  assert(allDocStrings.includes(value), `packet text missing ${value}`);
}
assert(allDocStrings.includes("WORKER_RUNTIME_JOBS"), "packet text missing WORKER_RUNTIME_JOBS");

scanUnsafe(docs.map(([file]) => file));

console.log(JSON.stringify({
  status: "worker_runtime_jobs_sound_cpu_handoff_review_diagnostics_passed",
  decision,
  sourceHead: review.sourceBase.head,
  targetOwner: review.targetOwner,
  acceptedForFuturePlanning: {
    workerNames,
    imageNames,
    jobTypes: planningJobTypes
  },
  acceptedForExecutionToday: false,
  blockedJobTypeCount: blockedJobTypes.length,
  supabaseClassification: review.supabaseClassification,
  nextPrompt: review.nextPrompt
}, null, 2));
