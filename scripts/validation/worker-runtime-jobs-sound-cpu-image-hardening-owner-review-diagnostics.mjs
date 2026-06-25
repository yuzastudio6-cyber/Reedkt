#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const DECISION = 'worker_runtime_jobs_sound_cpu_image_hardening_owner_review_passed_with_warnings_ready_for_dockerignore_source_plan';
const SOURCE_HEAD = 'ab60df00af11930947dbf5aab55bf663dea153aa';
const PR737_DECISION = 'worker_runtime_jobs_sound_cpu_image_hardening_plan_completed_with_warnings_ready_for_image_hardening_owner_review';
const PR734_DECISION = 'worker_runtime_jobs_sound_cpu_docker_build_proof_owner_review_passed_with_warnings_ready_for_image_hardening_plan';
const DOCKERFILE_PATH = 'server/workers/sound-cpu/Dockerfile';
const REQUIREMENTS_PATH = 'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt';
const NEXT_PROMPT = 'WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERIGNORE-SOURCE-PLAN';

const DOC_BLOCKS = [
  ['docs/worker-runtime-jobs-sound-cpu-image-hardening-owner-review.md', 'worker-runtime-jobs-sound-cpu-image-hardening-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-image-hardening-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-image-hardening-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-base-image-digest-owner-register.md', 'worker-runtime-jobs-sound-cpu-base-image-digest-owner-register'],
  ['docs/worker-runtime-jobs-sound-cpu-vulnerability-sbom-owner-register.md', 'worker-runtime-jobs-sound-cpu-vulnerability-sbom-owner-register'],
  ['docs/worker-runtime-jobs-sound-cpu-build-context-dockerignore-owner-register.md', 'worker-runtime-jobs-sound-cpu-build-context-dockerignore-owner-register'],
  ['docs/worker-runtime-jobs-sound-cpu-image-metadata-labels-owner-register.md', 'worker-runtime-jobs-sound-cpu-image-metadata-labels-owner-register'],
  ['docs/worker-runtime-jobs-sound-cpu-runtime-disabled-hardening-owner-register.md', 'worker-runtime-jobs-sound-cpu-runtime-disabled-hardening-owner-register'],
  ['docs/worker-runtime-jobs-sound-cpu-image-hardening-owner-blocker-follow-up-register.md', 'worker-runtime-jobs-sound-cpu-image-hardening-owner-blocker-follow-up-register'],
  ['docs/worker-runtime-jobs-sound-cpu-image-hardening-owner-claim-policy.md', 'worker-runtime-jobs-sound-cpu-image-hardening-owner-claim-policy']
];

const PROMPT_BLOCKS = [
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-dockerignore-source-plan.md', 'worker-runtime-jobs-sound-cpu-dockerignore-source-plan'],
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-vulnerability-sbom-readiness-plan.md', 'worker-runtime-jobs-sound-cpu-vulnerability-sbom-readiness-plan'],
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-image-hardening-source-plan.md', 'worker-runtime-jobs-sound-cpu-image-hardening-source-plan']
];

const SOURCE_BLOCKS = [
  ['docs/worker-runtime-jobs-sound-cpu-image-hardening-plan.md', 'worker-runtime-jobs-sound-cpu-image-hardening-plan'],
  ['docs/worker-runtime-jobs-sound-cpu-docker-build-proof-owner-review.md', 'worker-runtime-jobs-sound-cpu-docker-build-proof-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-vulnerability-sbom-plan.md', 'worker-runtime-jobs-sound-cpu-vulnerability-sbom-plan'],
  ['docs/worker-runtime-jobs-sound-cpu-build-context-dockerignore-plan.md', 'worker-runtime-jobs-sound-cpu-build-context-dockerignore-plan']
];

const REQUIRED_FILES = [
  DOCKERFILE_PATH,
  REQUIREMENTS_PATH,
  'docs/cross-chat-tool-ownership-registry.md',
  'package.json',
  'scripts/validation/worker-runtime-jobs-sound-cpu-image-hardening-plan-diagnostics.mjs',
  'scripts/validation/worker-runtime-jobs-sound-cpu-docker-build-proof-owner-review-diagnostics.mjs'
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  assert(existsSync(file), `Missing required file: ${file}`);
  return readFileSync(file, 'utf8');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseBlock(file, label) {
  const text = read(file);
  const pattern = new RegExp('```json\\s+' + escapeRegExp(label) + '\\n([\\s\\S]*?)\\n```');
  const match = text.match(pattern);
  assert(match, `Missing JSON block ${label} in ${file}`);
  try {
    return JSON.parse(match[1]);
  } catch (error) {
    throw new Error(`Invalid JSON block ${label} in ${file}: ${error.message}`);
  }
}

function assertNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase updateRequired widened`);
  assert(value?.environmentTouched === 'no', `${label} Supabase environmentTouched widened`);
  assert(value?.sqlExecuted === 'no', `${label} Supabase sqlExecuted widened`);
  assert(value?.migrationDeployed === 'no', `${label} Supabase migrationDeployed widened`);
  assert(value?.nextAction === 'none', `${label} Supabase nextAction widened`);
}

function assertClosed(value, label) {
  assert(value === false || value === 'no' || value === 'none' || value === 'blocked' || value === 'blocked_unclaimed' || value === 'unclaimed', `${label} must stay closed`);
}

function walkClosed(value, trail = []) {
  if (value === null || value === undefined || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((child, index) => walkClosed(child, trail.concat(String(index))));
    return;
  }

  const guarded = new Set([
    'dockerBuildRun',
    'dockerPushRun',
    'dockerRunRun',
    'dockerPullRun',
    'gcpTouched',
    'cloudRunTouched',
    'secretManagerTouched',
    'serviceAccountsTouched',
    'workerExecutionRun',
    'routeExecutionRun',
    'toolExecutionRun',
    'mediaProcessingRun',
    'ffmpegOrFfprobeRun',
    'modelWeightsDownloaded',
    'supabaseTouched',
    'sqlExecuted',
    'artifactCreated',
    'scannerExecutionRun',
    'dockerImageScanRun',
    'sbomGenerated',
    'acceptedForDockerBuildToday',
    'acceptedForDockerPushToday',
    'acceptedForDockerRunToday',
    'acceptedForRuntimeExecutionToday',
    'acceptedForExecutionToday',
    'runtimeReadinessClaim',
    'workerReadinessClaim',
    'mediaReadinessClaim',
    'dockerReadiness',
    'imageReadiness',
    'workerReadiness',
    'runtimeReadiness',
    'mediaReadiness'
  ]);

  for (const [key, child] of Object.entries(value)) {
    const label = trail.concat(key).join('.');
    if (guarded.has(key)) assertClosed(child, label);
    if (key === 'allowed' && !trail.includes('positiveClaims')) assertClosed(child, label);
    walkClosed(child, trail.concat(key));
  }
}

function scanUnsafe(files) {
  const patterns = [
    /https:\/\/[a-z0-9.-]+\.supabase\.co/i,
    /\b(?:postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i,
    /\bBearer\s+[A-Za-z0-9._-]{20,}\b/i,
    /\b(?:sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/,
    /\bAIza[0-9A-Za-z_-]{20,}\b/,
    /"(dockerBuildRun|dockerPushRun|dockerRunRun|gcpTouched|cloudRunTouched|secretManagerTouched|workerExecutionRun|routeExecutionRun|toolExecutionRun|mediaProcessingRun|ffmpegOrFfprobeRun|modelWeightsDownloaded|supabaseTouched|sqlExecuted|artifactCreated)"\s*:\s*true/,
    /generated_local_fixture_passed\s*[:=]\s*(true|passed|ready)/i,
    /dry_run_passed\s*[:=]\s*(true|passed|ready)/i,
    /(docker|image|worker|runtime|media)\s+readiness\s*[:=]\s*(true|passed|ready)/i
  ];

  for (const file of files) {
    const text = read(file);
    for (const pattern of patterns) assert(!pattern.test(text), `${file} matched unsafe pattern ${pattern}`);
  }
}

for (const file of REQUIRED_FILES) read(file);
const parsed = Object.fromEntries([...DOC_BLOCKS, ...PROMPT_BLOCKS, ...SOURCE_BLOCKS].map(([file, label]) => [label, parseBlock(file, label)]));

const sourcePlan = parsed['worker-runtime-jobs-sound-cpu-image-hardening-plan'];
assert(sourcePlan.decision === PR737_DECISION, 'PR #737 image-hardening plan decision mismatch');
assert(sourcePlan.nextPrompt.startsWith('WORKER_RUNTIME_JOBS-SOUND-CPU-IMAGE-HARDENING-OWNER-REVIEW'), 'source next prompt mismatch');
assert(sourcePlan.acceptedSourceEvidence.imageId === 'sha256:b9c202435f9037acddd7bd96b1daf790cea69623e1450128205c68472e506a2b', 'source image ID mismatch');
assertNoop(sourcePlan.supabaseClassification, 'source plan');

const buildProofReview = parsed['worker-runtime-jobs-sound-cpu-docker-build-proof-owner-review'];
assert(buildProofReview.decision === PR734_DECISION, 'PR #734 owner-review decision mismatch');
assert(buildProofReview.ownerReviewResult.acceptedForImageHardeningPlanning === true, 'PR #734 did not authorize image-hardening planning');
assertNoop(buildProofReview.supabaseClassification, 'build-proof owner review');

const review = parsed['worker-runtime-jobs-sound-cpu-image-hardening-owner-review'];
assert(review.decision === DECISION, 'owner-review decision mismatch');
assert(review.sourceBase.head === SOURCE_HEAD, 'owner-review source head mismatch');
assert(review.sourceBase.pr737.mergeCommit === SOURCE_HEAD, 'PR #737 merge commit mismatch');
assert(review.sourceBase.pr737.decision === PR737_DECISION, 'PR #737 decision missing');
assert(review.sourceBase.pr734.decision === PR734_DECISION, 'PR #734 decision missing');
assert(review.targetOwner === 'WORKER_RUNTIME_JOBS', 'owner mismatch');
assert(review.ownerReviewResult === 'passed_with_warnings', 'owner review result mismatch');
assert(review.imageHardeningPlanAcceptedForFollowUpPlanning === 'yes', 'image hardening plan not accepted');
assert(review.dockerignoreSourcePlanningMayProceed === 'yes', 'dockerignore planning not accepted');
assert(review.vulnerabilitySbomReadinessPlanningMayProceed === 'yes', 'SBOM planning not accepted');
assert(review.imageHardeningSourcePlanning === 'blocked_until_dockerignore_and_vulnerability_sbom_readiness_plans', 'image hardening source planning too broad');
assert(review.dockerfilePath === DOCKERFILE_PATH, 'Dockerfile path mismatch');
assert(review.requirementsSource === REQUIREMENTS_PATH, 'requirements path mismatch');
assert(review.nextPrompt.startsWith(NEXT_PROMPT), 'next prompt mismatch');
assertNoop(review.supabaseClassification, 'owner review');

const acceptance = parsed['worker-runtime-jobs-sound-cpu-image-hardening-acceptance-register'];
assert(acceptance.decision === DECISION, 'acceptance decision mismatch');
assert(acceptance.sourceDecision === PR737_DECISION, 'acceptance source decision mismatch');
for (const item of ['image-hardening plan', 'topic register', 'base image and digest pinning plan', 'vulnerability and SBOM plan', 'build context and .dockerignore plan', 'image metadata and labels plan', 'runtime-disabled hardening plan', 'blocker register', 'claim policy']) {
  const row = acceptance.register.find((entry) => entry.item === item);
  assert(row, `acceptance register missing ${item}`);
  assert(row.accepted === true, `${item} not accepted`);
  assert(row.acceptedForFollowUpPlanning === true, `${item} follow-up planning missing`);
  assert(row.acceptedForExecutionToday === false, `${item} execution widened`);
}
assert(acceptance.acceptedNextPlanning.dockerignoreSourcePlanningMayProceed === 'yes', 'dockerignore next planning missing');
assert(acceptance.acceptedNextPlanning.vulnerabilitySbomReadinessPlanningMayProceed === 'yes', 'SBOM next planning missing');
assert(acceptance.acceptedNextPlanning.imageHardeningSourcePlanningMayProceed === 'no', 'source planning must wait');
assertNoop(acceptance.supabaseClassification, 'acceptance register');

const base = parsed['worker-runtime-jobs-sound-cpu-base-image-digest-owner-register'];
assert(base.currentBaseImage === 'python:3.13-slim', 'base image mismatch');
assert(base.baseImageDigestPlanningAccepted === 'yes', 'digest planning acceptance missing');
assert(base.futureDigestPinningPlanningMayProceed === 'yes', 'digest future planning missing');
assert(base.actualDigestPinnedToday === 'no', 'digest pinned too early');
assertNoop(base.supabaseClassification, 'base/digest register');

const sbom = parsed['worker-runtime-jobs-sound-cpu-vulnerability-sbom-owner-register'];
assert(sbom.vulnerabilitySbomReadinessPlanningMayProceed === 'yes', 'SBOM readiness missing');
assert(sbom.scannerCandidatesAcceptedForPlanning.includes('trivy'), 'trivy planning missing');
assert(sbom.sbomCandidatesAcceptedForPlanning.includes('syft'), 'syft planning missing');
assertNoop(sbom.supabaseClassification, 'SBOM register');

const dockerignore = parsed['worker-runtime-jobs-sound-cpu-build-context-dockerignore-owner-register'];
assert(dockerignore.dockerignoreSourcePlanningMayProceed === 'yes', 'dockerignore source planning missing');
assert(dockerignore.actualDockerignoreCreatedToday === 'no', '.dockerignore created too early');
assert(dockerignore.requiredIncludedPaths.includes(DOCKERFILE_PATH), 'Dockerfile include missing');
assert(dockerignore.requiredIncludedPaths.includes(REQUIREMENTS_PATH), 'requirements include missing');
assertNoop(dockerignore.supabaseClassification, 'dockerignore register');

const labels = parsed['worker-runtime-jobs-sound-cpu-image-metadata-labels-owner-register'];
assert(labels.metadataLabelsPlanningAccepted === 'yes', 'metadata label planning missing');
assert(labels.actualDockerfileLabelChangeToday === 'no', 'label source changed too early');
assert(labels.proposedFutureLabels.includes('org.opencontainers.image.revision'), 'revision label missing');
assert(labels.privacyAndSecretPolicy.secretsInLabels === 'no', 'label secrets widened');
assertNoop(labels.supabaseClassification, 'metadata labels register');

const runtime = parsed['worker-runtime-jobs-sound-cpu-runtime-disabled-hardening-owner-register'];
assert(runtime.runtimeDisabledHardeningAcceptedForPlanning === 'yes', 'runtime-disabled planning missing');
assert(runtime.runtimeDisabledEnvFlags.REEDITPRO_SOUND_CPU_RUNTIME_ENABLED === '0', 'SOUND runtime flag mismatch');
assert(runtime.runtimeDisabledEnvFlags.REEDITPRO_WORKER_EXECUTION_ENABLED === '0', 'worker execution flag mismatch');
assert(runtime.runtimeDisabledEnvFlags.REEDITPRO_MEDIA_PROCESSING_ENABLED === '0', 'media processing flag mismatch');
assertNoop(runtime.supabaseClassification, 'runtime-disabled register');

const blockers = parsed['worker-runtime-jobs-sound-cpu-image-hardening-owner-blocker-follow-up-register'];
for (const scope of ['Docker build', 'Docker push', 'Docker run', 'Cloud Run', 'GCP APIs', 'Secret Manager', 'service accounts', 'worker execution', 'route/tool execution', 'media processing', 'FFmpeg/ffprobe', 'Supabase/SQL', 'artifacts', 'model weights', 'beta/production', 'generated_local_fixture_passed', 'dry_run_passed', 'runtime readiness']) {
  assert(blockers.blockers.some((row) => row.scope === scope && (row.status === 'blocked' || row.status === 'blocked_unclaimed')), `blocker missing ${scope}`);
}
assert(blockers.allowedFollowUps.includes('WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERIGNORE-SOURCE-PLAN'), 'dockerignore follow-up missing');
assert(blockers.allowedFollowUps.includes('WORKER_RUNTIME_JOBS-SOUND-CPU-VULNERABILITY-SBOM-READINESS-PLAN'), 'SBOM follow-up missing');
assertNoop(blockers.supabaseClassification, 'blocker register');

const claimPolicy = parsed['worker-runtime-jobs-sound-cpu-image-hardening-owner-claim-policy'];
for (const claim of ['Docker build', 'Docker push', 'Docker run', 'image readiness', 'Cloud Run readiness', 'worker readiness', 'route readiness', 'runtime readiness', 'media readiness', 'GCP readiness', 'Supabase readiness', 'artifact readiness', 'beta readiness', 'production readiness', 'generated_local_fixture_passed', 'dry_run_passed']) {
  assert(claimPolicy.notClaims.some((row) => row.claim === claim && row.allowed === 'no'), `claim policy missing ${claim}`);
}
assertNoop(claimPolicy.supabaseClassification, 'claim policy');

const dockerignorePrompt = parsed['worker-runtime-jobs-sound-cpu-dockerignore-source-plan'];
assert(dockerignorePrompt.requiredPr737MergeCommit === SOURCE_HEAD, 'dockerignore prompt source head missing');
assert(dockerignorePrompt.requiredImageHardeningOwnerReviewDecision === DECISION, 'dockerignore prompt owner decision missing');
assert(dockerignorePrompt.dockerignoreSourcePlanningAcceptedByOwnerReview === 'yes', 'dockerignore prompt owner acceptance missing');
assert(dockerignorePrompt.actualDockerignoreCreatedByThisPrompt === 'no', 'dockerignore prompt creates source too early');
assertNoop(dockerignorePrompt.supabaseClassification, 'dockerignore prompt');

const sbomPrompt = parsed['worker-runtime-jobs-sound-cpu-vulnerability-sbom-readiness-plan'];
assert(sbomPrompt.requiredPr737MergeCommit === SOURCE_HEAD, 'SBOM prompt source head missing');
assert(sbomPrompt.requiredImageHardeningOwnerReviewDecision === DECISION, 'SBOM prompt owner decision missing');
assert(sbomPrompt.vulnerabilitySbomReadinessPlanningAcceptedByOwnerReview === 'yes', 'SBOM prompt owner acceptance missing');
assert(sbomPrompt.scannerExecutionRun === 'no', 'SBOM prompt scanner execution widened');
assertNoop(sbomPrompt.supabaseClassification, 'SBOM prompt');

const sourcePrompt = parsed['worker-runtime-jobs-sound-cpu-image-hardening-source-plan'];
assert(sourcePrompt.requiredImageHardeningOwnerReviewDecision === DECISION, 'source prompt owner decision missing');
assert(sourcePrompt.requiredPredecessorPlanning.includes('WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERIGNORE-SOURCE-PLAN'), 'source prompt missing dockerignore predecessor');
assert(sourcePrompt.requiredPredecessorPlanning.includes('WORKER_RUNTIME_JOBS-SOUND-CPU-VULNERABILITY-SBOM-READINESS-PLAN'), 'source prompt missing SBOM predecessor');
assert(sourcePrompt.sourceChangesAuthorizedByThisPrompt === 'no', 'source prompt authorizes source too early');
assertNoop(sourcePrompt.supabaseClassification, 'source prompt');

for (const [, label] of [...DOC_BLOCKS, ...PROMPT_BLOCKS]) {
  walkClosed(parsed[label], [label]);
  assertNoop(parsed[label].supabaseClassification, label);
}

const packageJson = JSON.parse(read('package.json'));
assert(packageJson.scripts?.['worker-runtime-jobs:sound-cpu-image-hardening-owner-review:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-image-hardening-owner-review-diagnostics.mjs', 'package script missing');
assert(read('docs/cross-chat-tool-ownership-registry.md').includes('WORKER_RUNTIME_JOBS'), 'WORKER_RUNTIME_JOBS ownership missing');

scanUnsafe([...DOC_BLOCKS, ...PROMPT_BLOCKS].map(([file]) => file));

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_image_hardening_owner_review_diagnostics_passed',
  decision: DECISION,
  sourceHead: SOURCE_HEAD,
  pr737Verified: true,
  pr734Verified: true,
  imageHardeningOwnerReviewPassed: true,
  dockerignoreSourcePlanningMayProceed: true,
  vulnerabilitySbomReadinessPlanningMayProceed: true,
  dockerBuildRun: false,
  dockerPushRun: false,
  dockerRunRun: false,
  workerExecutionRun: false,
  routeExecutionRun: false,
  toolExecutionRun: false,
  mediaProcessingRun: false,
  gcpTouched: false,
  supabaseTouched: false,
  sqlExecuted: false,
  modelWeightsDownloaded: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
