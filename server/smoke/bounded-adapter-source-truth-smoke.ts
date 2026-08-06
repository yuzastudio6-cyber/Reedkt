import assert from 'node:assert/strict'
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { loadRuntimeEnv } from '../config/env'
import { createApprovedEditExecutionPackageService } from '../services/approved-edit-execution-package-service'
import { createProfessionalToolAdapterSourceTruthEvidenceReview } from '../tool-registry/professional-tool-adapter-source-truth'
import type { ServiceContext } from '../types'
import { createApprovedPlanSnapshot } from '../../src/lib/approved-plan-snapshot'
import { sampleClips } from '../../src/lib/mock-planner/default-data'
import { createMockEditPlan } from '../../src/lib/mock-planner/full'
import type { PlannerInput } from '../../src/types/reeditpro'

const env = loadRuntimeEnv({
  ...process.env,
  E2E_RUNTIME_MODE: 'mock',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
})
const context: ServiceContext = {
  env,
  clients: { admin: null, public: null },
  requestId: 'bounded-adapter-source-truth-smoke',
  auth: {
    userId: 'mock-user-bounded-adapter-source-truth',
    email: 'bounded-adapter-source-truth@example.test',
    isMockUser: true,
  },
}
const service = createApprovedEditExecutionPackageService(context)
const checkedAt = '2026-07-06T00:00:00.000Z'
const workspaceId = 'workspace-bounded-adapter-source-truth-smoke'
const creditReservationId = 'credit-reservation-bounded-adapter-source-truth-smoke'
const audioToolNames = [
  'librosa',
  'audioread',
  'pydub',
  'scipy',
  'resampy',
  'pyloudnorm',
  'audioflux',
  'music21',
  'pretty_midi',
  'mido',
  'noisereduce',
  'pedalboard',
  'mir_eval',
  'pydub_effects',
  'ebu_r128_pyloudnorm',
]
const renderPackagingToolNames = [
  'streamer_render_pipeline_support',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
]
const readyAdapterToolNames = [
  ...audioToolNames,
  ...renderPackagingToolNames,
]

function createSnapshot(projectId: string) {
  const plannerInput: PlannerInput = {
    projectName: 'Bounded adapter source-truth smoke edit',
    targetPlatform: 'tiktok_reels_shorts',
    aspectRatio: '9:16',
    aspectRatioConfirmed: true,
    aspectRatioSource: 'user_selected',
    frameTemplateType: 'vertical_talking_head_lower_panel',
    editingCategory: 'storytelling',
    workflowType: 'custom_let_ai_decide',
    editLevel: 'pro',
    structurePreference: 'improve_if_needed',
    moodStyle: 'luxury',
    visualPreference: 'balanced_visual_mix',
    referenceUrl: '',
    customInstructions: 'Create a clean professional internal test edit and only use bounded backend-approved tool activities.',
    creditPreference: 'balanced',
    clips: sampleClips,
    sourceSequenceMode: 'multi_clip_story_order',
    sourceOrderConfirmed: true,
    cleanupPreference: 'balanced_cleanup',
    cleanupPreferenceConfirmed: true,
  }
  const plan = createMockEditPlan(plannerInput)
  return createApprovedPlanSnapshot({
    approvedBy: 'mock-user',
    editSessionId: `${projectId}-edit-session`,
    plan,
    projectId,
  })
}

function compactSnapshot(snapshot: ReturnType<typeof createSnapshot>): Record<string, unknown> {
  return {
    id: snapshot.id,
    projectId: snapshot.projectId,
    editSessionId: snapshot.editSessionId,
    editPlanVersionId: snapshot.editPlanVersionId,
    creditEstimateId: snapshot.creditEstimateId,
    approvedAt: snapshot.approvedAt,
    approvedBy: snapshot.approvedBy,
    compiledIntent: snapshot.compiledIntent,
    sourceSequence: snapshot.sourceSequence,
    segments: snapshot.segments,
    operations: snapshot.operations,
    rendererLayers: snapshot.rendererLayers,
    masterTimingPlan: snapshot.masterTimingPlan,
    captionVisualCueTimingPlan: snapshot.captionVisualCueTimingPlan,
    sourceCleanupPlan: snapshot.sourceCleanupPlan,
    sourcePlan: { goalSummary: snapshot.sourcePlan.goalSummary },
    creditEstimate: snapshot.creditEstimate,
    colorPipelinePlan: snapshot.colorPipelinePlan,
    editingAgentExecutionPlan: snapshot.editingAgentExecutionPlan,
    asyncAssetReconciliationPlan: snapshot.asyncAssetReconciliationPlan,
    agentQAFallbackPlan: snapshot.agentQAFallbackPlan,
    qaPlan: snapshot.qaPlan,
    toolStrategyPlan: {
      ...(snapshot.toolStrategyPlan ?? {}),
      toolIdsUsed: [],
    },
  }
}

function packageEvidence(toolIds: string[]) {
  return toolIds.map((toolId) => ({
    toolId,
    status: 'passed' as const,
    source: 'backend_tool_readiness_worker' as const,
    evidenceId: `backend-readiness-${toolId}`,
    checkedAt,
    summary: `${toolId} package/runtime readiness passed in backend-owned evidence.`,
  }))
}

const invalidPackageSourceReview = createProfessionalToolAdapterSourceTruthEvidenceReview({
  workspaceId,
  projectId: 'project-bounded-adapter-invalid-package-source',
  requestedToolNames: ['librosa'],
  approvedPlanSnapshotId: 'approved-snapshot-invalid-package-source',
  creditEstimateId: 'credit-estimate-invalid-package-source',
  creditReservationId,
  privateArtifactRefs: [{ artifactId: 'private-audio-source', privateArtifact: true }],
  packageReadinessEvidence: [{
    toolId: 'librosa',
    status: 'passed',
    source: 'browser_client_hint' as never,
    evidenceId: 'browser-claimed-librosa-ready',
    checkedAt,
    summary: 'Untrusted browser claim must not make package readiness pass.',
  }],
  modelWeightApprovals: [],
})
assert.equal(invalidPackageSourceReview.status, 'blocked')
assert.equal(invalidPackageSourceReview.acceptedPackageEvidenceCount, 0)
assert.equal(invalidPackageSourceReview.rejectedEvidenceCount, 1)
assert.ok(
  invalidPackageSourceReview.blockers.some((blocker) => /package readiness evidence source is not approved/i.test(blocker)),
  'Unapproved package readiness sources must be rejected before bounded adapter execution.',
)

const invalidModelSourceReview = createProfessionalToolAdapterSourceTruthEvidenceReview({
  workspaceId,
  projectId: 'project-bounded-adapter-invalid-model-source',
  requestedToolNames: ['sam2'],
  approvedPlanSnapshotId: 'approved-snapshot-invalid-model-source',
  creditEstimateId: 'credit-estimate-invalid-model-source',
  creditReservationId,
  privateArtifactRefs: [{ artifactId: 'private-video-source', privateArtifact: true }],
  packageReadinessEvidence: packageEvidence(['sam2']),
  modelWeightApprovals: [{
    toolId: 'sam2',
    approvalStatus: 'approved',
    source: 'browser_client_hint' as never,
    manifestId: 'browser-claimed-sam2-model-approved',
    checkedAt,
    summary: 'Untrusted browser claim must not approve model weights.',
  }],
})
assert.equal(invalidModelSourceReview.status, 'blocked')
assert.equal(invalidModelSourceReview.acceptedModelWeightApprovalCount, 0)
assert.equal(invalidModelSourceReview.rejectedEvidenceCount, 1)
assert.ok(
  invalidModelSourceReview.blockers.some((blocker) => /model-weight approval source is not approved/i.test(blocker)),
  'Unapproved model-weight sources must be rejected before bounded adapter execution.',
)

async function createStubHydratedPythonRuntime(packageNames: string[]) {
  const root = await mkdtemp(join(tmpdir(), 'reeditpro-adapter-python-runtime-'))
  const packageRoot = join(root, 'packages')
  await mkdir(packageRoot, { recursive: true })

  for (const packageName of packageNames) {
    const packagePath = join(packageRoot, packageName)
    await mkdir(packagePath, { recursive: true })
    await writeFile(join(packagePath, '__init__.py'), [
      `__version__ = "0.0.0-smoke-${packageName}"`,
      'def api_shape_probe():',
      `    return "${packageName}"`,
      '',
    ].join('\n'), 'utf8')
  }
  await writeFile(join(packageRoot, 'pydub', 'effects.py'), [
    '__version__ = "0.0.0-smoke-pydub-effects"',
    'def normalize(*args, **kwargs):',
    '    return {"status": "stubbed"}',
    '',
  ].join('\n'), 'utf8')

  const wrapperPath = join(root, 'python-wrapper.sh')
  await writeFile(wrapperPath, [
    '#!/bin/sh',
    `PYTHONPATH="${packageRoot}:$PYTHONPATH" exec python3 "$@"`,
    '',
  ].join('\n'), 'utf8')
  await chmod(wrapperPath, 0o755)

  return {
    root,
    wrapperPath,
    cleanup: () => rm(root, { recursive: true, force: true }),
  }
}

async function createStubBinaryRuntime(commandNames: string[]) {
  const root = await mkdtemp(join(tmpdir(), 'reeditpro-adapter-binary-runtime-'))
  const binDir = join(root, 'bin')
  await mkdir(binDir, { recursive: true })

  for (const commandName of commandNames) {
    const commandPath = join(binDir, commandName)
    await writeFile(commandPath, [
      '#!/bin/sh',
      'exit 0',
      '',
    ].join('\n'), 'utf8')
    await chmod(commandPath, 0o755)
  }

  return {
    root,
    binDir,
    cleanup: () => rm(root, { recursive: true, force: true }),
  }
}

const readySnapshot = createSnapshot('project-bounded-adapter-ready')
const readyPackage = await service.createPackage({
  workspaceId,
  projectId: readySnapshot.projectId,
  approvedPlanSnapshotId: readySnapshot.id,
  approvedSnapshot: compactSnapshot(readySnapshot),
  creditReservationId,
  requestedAdapterToolNames: audioToolNames,
  packageReadyToolIds: [],
  modelWeightApprovedToolIds: [],
  idempotencyKey: 'bounded-adapter-source-truth-smoke:ready-package',
  requestPath: '/smoke/bounded-adapter-source-truth#ready-package',
})

assert.equal(readyPackage.approvedEditExecutionPackage.boundedAdapterExecutionGate?.status, 'blocked')
assert.deepEqual(readyPackage.approvedEditExecutionPackage.packageReadyToolIds, [])

await assert.rejects(
  () => service.createBoundedAdapterExecutionRun({
    packageRecordId: readyPackage.approvedEditExecutionPackage.packageRecordId,
    workspaceId,
    projectId: readySnapshot.projectId,
    creditReservationId,
    handoffOnly: true,
    idempotencyKey: 'bounded-adapter-source-truth-smoke:pre-review-execution-run',
    requestPath: '/smoke/bounded-adapter-source-truth#pre-review-execution-run',
  }),
  /source-truth readiness and adapter gates pass/i,
)

const readyReview = await service.reviewBoundedAdapterSourceTruth({
  packageRecordId: readyPackage.approvedEditExecutionPackage.packageRecordId,
  workspaceId,
  projectId: readySnapshot.projectId,
  creditReservationId,
  packageReadinessEvidence: packageEvidence(readyAdapterToolNames),
  modelWeightApprovals: [],
  idempotencyKey: 'bounded-adapter-source-truth-smoke:ready-review',
  requestPath: '/smoke/bounded-adapter-source-truth#ready-review',
})

assert.equal(
  readyReview.sourceTruthReview.status,
  'ready_for_bounded_execution',
  `Non-model package-ready adapters should pass bounded execution. Blockers: ${readyReview.sourceTruthReview.blockers.join(' | ')}`,
)
assert.equal(readyReview.sourceTruthReview.clientReadinessHintsTrusted, false)
assert.equal(readyReview.sourceTruthReview.frontendExecutionAllowed, false)
assert.equal(readyReview.sourceTruthReview.productReady, false)
assert.deepEqual(readyReview.sourceTruthReview.packageReadyToolIds.sort(), [...readyAdapterToolNames].sort())
assert.equal(readyReview.approvedEditExecutionPackage.boundedAdapterExecutionGate?.status, 'ready_for_bounded_execution')
assert.equal(readyReview.approvedEditExecutionPackage.boundedAdapterExecutionGate?.readyToolCount, readyAdapterToolNames.length)
assert.equal(readyReview.approvedEditExecutionPackage.boundedAdapterExecutionGate?.blockedToolCount, 0)
assert.ok(readyReview.sourceTruthReview.noRuntimeSideEffects.some((note) => /does not import packages/i.test(note)))

const readyGateReadback = await service.getBoundedAdapterExecutionGate(readyPackage.approvedEditExecutionPackage.packageRecordId)
assert.equal(readyGateReadback.boundedAdapterExecutionGate?.status, 'ready_for_bounded_execution')
assert.equal(readyGateReadback.boundedAdapterExecutionGate?.readyToolCount, readyAdapterToolNames.length)

const readyExecutionRun = await service.createBoundedAdapterExecutionRun({
  packageRecordId: readyPackage.approvedEditExecutionPackage.packageRecordId,
  workspaceId,
  projectId: readySnapshot.projectId,
  creditReservationId,
  handoffOnly: true,
  idempotencyKey: 'bounded-adapter-source-truth-smoke:ready-execution-run',
  requestPath: '/smoke/bounded-adapter-source-truth#ready-execution-run',
})
assert.equal(readyExecutionRun.boundedAdapterExecutionRun.status, 'completed_private_manifest_handoff')
assert.equal(readyExecutionRun.boundedAdapterExecutionRun.preparedActivityCount, readyAdapterToolNames.length)
assert.equal(readyExecutionRun.boundedAdapterExecutionRun.privateResultManifestCount, readyAdapterToolNames.length)
assert.equal(readyExecutionRun.boundedAdapterExecutionRun.actualToolPackageExecutionCount, 0)
assert.equal(readyExecutionRun.boundedAdapterExecutionRun.frontendExecutionAllowed, false)
assert.equal(readyExecutionRun.boundedAdapterExecutionRun.productReady, false)
assert.ok(readyExecutionRun.boundedAdapterExecutionRun.activityResults.every((activity) =>
  activity.privateResultManifest.privateArtifact === true &&
  activity.privateResultManifest.publicArtifact === false &&
  activity.privateResultManifest.signedUrl === null &&
  activity.runnerBinding.actualToolPackageExecuted === false
))
assert.ok(readyExecutionRun.boundedAdapterExecutionRun.noRuntimeSideEffects.some((note) => /does not import packages/i.test(note)))

const readyExecutionReplay = await service.createBoundedAdapterExecutionRun({
  packageRecordId: readyPackage.approvedEditExecutionPackage.packageRecordId,
  workspaceId,
  projectId: readySnapshot.projectId,
  creditReservationId,
  handoffOnly: true,
  idempotencyKey: 'bounded-adapter-source-truth-smoke:ready-execution-run',
  requestPath: '/smoke/bounded-adapter-source-truth#ready-execution-run',
})
assert.equal(readyExecutionReplay.boundedAdapterExecutionRun.id, readyExecutionRun.boundedAdapterExecutionRun.id)

const registeredRunnerProbe = await service.runRegisteredAdapterRunners({
  boundedAdapterExecutionRunId: readyExecutionRun.boundedAdapterExecutionRun.id,
  workspaceId,
  projectId: readySnapshot.projectId,
  importProbeOnly: true,
  idempotencyKey: 'bounded-adapter-source-truth-smoke:registered-runner-probe',
  requestPath: '/smoke/bounded-adapter-source-truth#registered-runner-probe',
})
const audioProbeCompleted = registeredRunnerProbe.registeredRunnerRun.status === 'completed_import_probe'
assert.ok(
  audioProbeCompleted || registeredRunnerProbe.registeredRunnerRun.status === 'blocked',
  'Audio registered runner probe must either complete imports in the configured adapter Python runtime or report worker runtime hydration blockers.',
)
assert.equal(registeredRunnerProbe.registeredRunnerRun.requestedActivityCount, readyAdapterToolNames.length)
assert.equal(registeredRunnerProbe.registeredRunnerRun.mediaProcessingExecuted, false)
assert.equal(registeredRunnerProbe.registeredRunnerRun.frontendExecutionAllowed, false)
assert.equal(registeredRunnerProbe.registeredRunnerRun.productReady, false)
assert.equal(registeredRunnerProbe.registeredRunnerRun.actualToolPackageExecutionCount, 0)
assert.ok(registeredRunnerProbe.registeredRunnerRun.results.every((result) => result.importProbeOnly === true))
assert.ok(registeredRunnerProbe.registeredRunnerRun.results.every((result) => result.actualToolPackageExecuted === false))
if (audioProbeCompleted) {
  assert.equal(registeredRunnerProbe.registeredRunnerRun.completedImportProbeCount, readyAdapterToolNames.length)
  assert.equal(registeredRunnerProbe.registeredRunnerRun.blockedRunnerCount, 0)
  assert.ok(registeredRunnerProbe.registeredRunnerRun.results.every((result) =>
    result.status === 'completed_import_probe' &&
    result.packageResolved === true &&
    result.packageImported === true
  ))
} else {
  assert.ok(registeredRunnerProbe.registeredRunnerRun.blockedRunnerCount > 0, 'Backend should report runtime hydration blockers until dependencies are available in the configured adapter runtime.')
  assert.ok(registeredRunnerProbe.registeredRunnerRun.results.every((result) =>
    result.status === 'completed_import_probe' ||
    result.status === 'blocked_worker_runtime_not_hydrated' ||
    result.status === 'blocked_missing_binary' ||
    result.status === 'blocked_no_registered_runner' ||
    result.status === 'blocked_missing_package' ||
    result.status === 'blocked_native_runtime_incompatible'
  ))
  assert.ok(registeredRunnerProbe.registeredRunnerRun.results.some((result) =>
    result.status !== 'completed_import_probe' &&
    /runtime|package|binary|registered runner/i.test(result.summary)
  ), 'Blocked probes should still explain the missing backend runtime, package, binary, or runner.')
}
assert.ok(registeredRunnerProbe.registeredRunnerRun.noRuntimeSideEffects.some((note) => /does not process media/i.test(note)))

const registeredRunnerProbeReplay = await service.runRegisteredAdapterRunners({
  boundedAdapterExecutionRunId: readyExecutionRun.boundedAdapterExecutionRun.id,
  workspaceId,
  projectId: readySnapshot.projectId,
  importProbeOnly: true,
  idempotencyKey: 'bounded-adapter-source-truth-smoke:registered-runner-probe',
  requestPath: '/smoke/bounded-adapter-source-truth#registered-runner-probe',
})
assert.equal(registeredRunnerProbeReplay.registeredRunnerRun.id, registeredRunnerProbe.registeredRunnerRun.id)

let hydratedPythonRegisteredImportProbeCount: number
let hydratedPythonPrivateRunnerQaActualToolPackageExecutionCount: number
let hydratedPythonAdapterWorkerArtifactIntegrationArtifactCount: number
const stubHydratedPythonRuntime = await createStubHydratedPythonRuntime([
  'librosa',
  'audioread',
  'pydub',
  'scipy',
  'resampy',
  'pyloudnorm',
  'audioflux',
  'music21',
  'pretty_midi',
  'mido',
  'noisereduce',
  'pedalboard',
  'mir_eval',
])

try {
  const hydratedPythonEnv = loadRuntimeEnv({
    ...process.env,
    E2E_RUNTIME_MODE: 'mock',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    TOOL_ADAPTER_PYTHON_BIN: stubHydratedPythonRuntime.wrapperPath,
  })
  const hydratedPythonService = createApprovedEditExecutionPackageService({
    ...context,
    env: hydratedPythonEnv,
    requestId: 'bounded-adapter-source-truth-hydrated-python-smoke',
  })
  const hydratedPythonSnapshot = createSnapshot('project-bounded-adapter-audio-hydrated-runtime')
  const hydratedPythonPackage = await hydratedPythonService.createPackage({
    workspaceId,
    projectId: hydratedPythonSnapshot.projectId,
    approvedPlanSnapshotId: hydratedPythonSnapshot.id,
    approvedSnapshot: compactSnapshot(hydratedPythonSnapshot),
    creditReservationId,
    requestedAdapterToolNames: audioToolNames,
    adapterCandidateScope: 'requested_only',
    packageReadyToolIds: [],
    modelWeightApprovedToolIds: [],
    idempotencyKey: 'bounded-adapter-source-truth-smoke:hydrated-python-package',
    requestPath: '/smoke/bounded-adapter-source-truth#hydrated-python-package',
  })
  const hydratedPythonReview = await hydratedPythonService.reviewBoundedAdapterSourceTruth({
    packageRecordId: hydratedPythonPackage.approvedEditExecutionPackage.packageRecordId,
    workspaceId,
    projectId: hydratedPythonSnapshot.projectId,
    creditReservationId,
    packageReadinessEvidence: packageEvidence(audioToolNames),
    modelWeightApprovals: [],
    idempotencyKey: 'bounded-adapter-source-truth-smoke:hydrated-python-review',
    requestPath: '/smoke/bounded-adapter-source-truth#hydrated-python-review',
  })
  assert.equal(hydratedPythonReview.sourceTruthReview.status, 'ready_for_bounded_execution')

  const hydratedPythonExecutionRun = await hydratedPythonService.createBoundedAdapterExecutionRun({
    packageRecordId: hydratedPythonPackage.approvedEditExecutionPackage.packageRecordId,
    workspaceId,
    projectId: hydratedPythonSnapshot.projectId,
    creditReservationId,
    handoffOnly: true,
    idempotencyKey: 'bounded-adapter-source-truth-smoke:hydrated-python-execution-run',
    requestPath: '/smoke/bounded-adapter-source-truth#hydrated-python-execution-run',
  })
  assert.equal(hydratedPythonExecutionRun.boundedAdapterExecutionRun.actualToolPackageExecutionCount, 0)

  const hydratedPythonRegisteredRunnerProbe = await hydratedPythonService.runRegisteredAdapterRunners({
    boundedAdapterExecutionRunId: hydratedPythonExecutionRun.boundedAdapterExecutionRun.id,
    workspaceId,
    projectId: hydratedPythonSnapshot.projectId,
    importProbeOnly: true,
    idempotencyKey: 'bounded-adapter-source-truth-smoke:hydrated-python-registered-runner-probe',
    requestPath: '/smoke/bounded-adapter-source-truth#hydrated-python-registered-runner-probe',
  })
  hydratedPythonRegisteredImportProbeCount = hydratedPythonRegisteredRunnerProbe.registeredRunnerRun.completedImportProbeCount
  assert.equal(hydratedPythonRegisteredRunnerProbe.registeredRunnerRun.status, 'completed_import_probe')
  assert.equal(hydratedPythonRegisteredRunnerProbe.registeredRunnerRun.completedImportProbeCount, audioToolNames.length)
  assert.equal(hydratedPythonRegisteredRunnerProbe.registeredRunnerRun.blockedRunnerCount, 0)
  assert.equal(hydratedPythonRegisteredRunnerProbe.registeredRunnerRun.actualToolPackageExecutionCount, 0)
  assert.ok(hydratedPythonRegisteredRunnerProbe.registeredRunnerRun.results.every((result) =>
    result.runtime === 'python' &&
    result.runtimeBinary === stubHydratedPythonRuntime.wrapperPath &&
    result.packageImported === true &&
    result.actualToolPackageExecuted === false
  ))

  const hydratedPythonPrivateRunnerRun = await hydratedPythonService.runRegisteredAdapterPrivateMediaRunner({
    registeredRunnerRunId: hydratedPythonRegisteredRunnerProbe.registeredRunnerRun.id,
    workspaceId,
    projectId: hydratedPythonSnapshot.projectId,
    creditReservationId,
    privateMediaExecutionOnly: true,
    idempotencyKey: 'bounded-adapter-source-truth-smoke:hydrated-python-private-runner',
    requestPath: '/smoke/bounded-adapter-source-truth#hydrated-python-private-runner',
  })
  assert.equal(hydratedPythonPrivateRunnerRun.privateMediaRunnerRun.status, 'private_runner_manifest_ready')
  assert.equal(hydratedPythonPrivateRunnerRun.privateMediaRunnerRun.preparedPrivateRunnerManifestCount, audioToolNames.length)
  assert.ok(hydratedPythonPrivateRunnerRun.privateMediaRunnerRun.activities.every((activity) =>
    activity.runnerRuntime === 'python' &&
    activity.runtimeBinary === stubHydratedPythonRuntime.wrapperPath &&
    activity.registeredImportProbeReady === true
  ))

  const hydratedPythonPrivateRunnerQaReview = await hydratedPythonService.reviewRegisteredAdapterPrivateMediaRunnerQa({
    privateMediaRunnerRunId: hydratedPythonPrivateRunnerRun.privateMediaRunnerRun.id,
    workspaceId,
    projectId: hydratedPythonSnapshot.projectId,
    creditReservationId,
    qaReviewOnly: true,
    idempotencyKey: 'bounded-adapter-source-truth-smoke:hydrated-python-private-runner-qa',
    requestPath: '/smoke/bounded-adapter-source-truth#hydrated-python-private-runner-qa',
  })
  hydratedPythonPrivateRunnerQaActualToolPackageExecutionCount = hydratedPythonPrivateRunnerQaReview.privateMediaRunnerQaReview.actualToolPackageExecutionCount
  assert.equal(hydratedPythonPrivateRunnerQaReview.privateMediaRunnerQaReview.status, 'private_adapter_result_qa_passed_waiting_final_render_integration')
  assert.equal(hydratedPythonPrivateRunnerQaReview.privateMediaRunnerQaReview.artifactCount, audioToolNames.length)
  assert.equal(hydratedPythonPrivateRunnerQaReview.privateMediaRunnerQaReview.actualToolPackageExecutionCount, audioToolNames.length)
  assert.equal(hydratedPythonPrivateRunnerQaReview.privateMediaRunnerQaReview.boundedNodePackageExecutionCount, 0)
  assert.equal(hydratedPythonPrivateRunnerQaReview.privateMediaRunnerQaReview.mediaProcessingExecuted, false)
  assert.equal(hydratedPythonPrivateRunnerQaReview.privateMediaRunnerQaReview.productRuntimeExecuted, false)
  assert.ok(hydratedPythonPrivateRunnerQaReview.privateMediaRunnerQaReview.artifacts.every((artifact) =>
    artifact.boundedPackageExecution.status === 'executed_bounded_python_package' &&
    artifact.boundedPackageExecution.runtime === 'python' &&
    artifact.boundedPackageExecution.operation === 'python_import_api_shape_probe' &&
    artifact.boundedPackageExecution.actualToolPackageExecuted === true &&
    artifact.boundedPackageExecution.runtimeBinary === stubHydratedPythonRuntime.wrapperPath &&
    artifact.boundedPackageExecution.mediaProcessingExecuted === false &&
    artifact.boundedPackageExecution.productRuntimeExecuted === false &&
    artifact.boundedPackageExecution.publicArtifact === false &&
    artifact.boundedPackageExecution.signedUrl === null &&
    artifact.actualToolPackageExecuted === true
  ))
  const firstHydratedPythonArtifact = hydratedPythonPrivateRunnerQaReview.privateMediaRunnerQaReview.artifacts[0]
  assert.ok(firstHydratedPythonArtifact, 'Hydrated Python runner QA should persist at least one artifact.')
  const firstHydratedPythonArtifactJson = JSON.parse(await readFile(firstHydratedPythonArtifact.localFilePath, 'utf8')) as Record<string, unknown>
  assert.equal(firstHydratedPythonArtifactJson.runnerRuntime, 'python')
  assert.equal(firstHydratedPythonArtifactJson.runtimeBinary, stubHydratedPythonRuntime.wrapperPath)
  assert.equal((firstHydratedPythonArtifactJson.boundedPackageExecution as Record<string, unknown>)?.status, 'executed_bounded_python_package')
  assert.equal((firstHydratedPythonArtifactJson.boundedPackageExecution as Record<string, unknown>)?.mediaProcessingExecuted, false)
  assert.equal((firstHydratedPythonArtifactJson.boundedPackageExecution as Record<string, unknown>)?.productRuntimeExecuted, false)

  const hydratedPythonAdapterWorkerArtifactIntegration = await hydratedPythonService.createAdapterWorkerArtifactIntegration({
    privateMediaRunnerQaReviewId: hydratedPythonPrivateRunnerQaReview.privateMediaRunnerQaReview.id,
    workspaceId,
    projectId: hydratedPythonSnapshot.projectId,
    creditReservationId,
    integrationOnly: true,
    idempotencyKey: 'bounded-adapter-source-truth-smoke:hydrated-python-adapter-integration',
    requestPath: '/smoke/bounded-adapter-source-truth#hydrated-python-adapter-integration',
  })
  hydratedPythonAdapterWorkerArtifactIntegrationArtifactCount = hydratedPythonAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.integratedArtifactCount
  assert.equal(hydratedPythonAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.integratedArtifactCount, audioToolNames.length)
  assert.equal(hydratedPythonAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.mediaProcessingExecuted, false)
  assert.equal(hydratedPythonAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.mediaTransformOutputCount, 0)
  assert.equal(hydratedPythonAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.productRuntimeExecuted, false)
  assert.ok(hydratedPythonAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.artifacts.every((artifact) =>
    artifact.actualToolPackageExecuted === true &&
    artifact.mediaTransformOutputEligible === false &&
    artifact.privateArtifact === true &&
    artifact.publicArtifact === false &&
    artifact.signedUrl === null
  ))
} finally {
  await stubHydratedPythonRuntime.cleanup()
}

const visualSnapshot = createSnapshot('project-bounded-adapter-visual-runtime')
const visualToolNames = [
  'd3',
  'echarts',
  'vega_lite',
  'vega',
  'satori',
  'svg_js',
  'viz_js',
  'lottie_web',
  'animejs',
  'three',
  'pixi_js',
  'konva',
  'babylonjs',
]
const visualPackage = await service.createPackage({
  workspaceId,
  projectId: visualSnapshot.projectId,
  approvedPlanSnapshotId: visualSnapshot.id,
  approvedSnapshot: compactSnapshot(visualSnapshot),
  creditReservationId,
  requestedAdapterToolNames: visualToolNames,
  adapterCandidateScope: 'requested_only',
  packageReadyToolIds: [],
  modelWeightApprovedToolIds: [],
  idempotencyKey: 'bounded-adapter-source-truth-smoke:visual-package',
  requestPath: '/smoke/bounded-adapter-source-truth#visual-package',
})

const visualReview = await service.reviewBoundedAdapterSourceTruth({
  packageRecordId: visualPackage.approvedEditExecutionPackage.packageRecordId,
  workspaceId,
  projectId: visualSnapshot.projectId,
  creditReservationId,
  packageReadinessEvidence: packageEvidence(visualToolNames),
  modelWeightApprovals: [],
  idempotencyKey: 'bounded-adapter-source-truth-smoke:visual-review',
  requestPath: '/smoke/bounded-adapter-source-truth#visual-review',
})

assert.equal(
  visualReview.sourceTruthReview.status,
  'ready_for_bounded_execution',
  `Render-worker visual adapters should pass source-truth review after backend package evidence. Blockers: ${visualReview.sourceTruthReview.blockers.join(' | ')}`,
)
assert.equal(visualReview.sourceTruthReview.boundedAdapterExecutionGate.readyToolCount, visualToolNames.length)

const visualExecutionRun = await service.createBoundedAdapterExecutionRun({
  packageRecordId: visualPackage.approvedEditExecutionPackage.packageRecordId,
  workspaceId,
  projectId: visualSnapshot.projectId,
  creditReservationId,
  handoffOnly: true,
  idempotencyKey: 'bounded-adapter-source-truth-smoke:visual-execution-run',
  requestPath: '/smoke/bounded-adapter-source-truth#visual-execution-run',
})
assert.equal(visualExecutionRun.boundedAdapterExecutionRun.status, 'completed_private_manifest_handoff')
assert.equal(visualExecutionRun.boundedAdapterExecutionRun.preparedActivityCount, visualToolNames.length)
assert.equal(visualExecutionRun.boundedAdapterExecutionRun.actualToolPackageExecutionCount, 0)

const visualRegisteredRunnerProbe = await service.runRegisteredAdapterRunners({
  boundedAdapterExecutionRunId: visualExecutionRun.boundedAdapterExecutionRun.id,
  workspaceId,
  projectId: visualSnapshot.projectId,
  importProbeOnly: true,
  idempotencyKey: 'bounded-adapter-source-truth-smoke:visual-registered-runner-probe',
  requestPath: '/smoke/bounded-adapter-source-truth#visual-registered-runner-probe',
})
assert.equal(
  visualRegisteredRunnerProbe.registeredRunnerRun.status,
  'completed_import_probe',
  `Installed JS render-worker packages should resolve. Blockers: ${visualRegisteredRunnerProbe.registeredRunnerRun.blockers.join(' | ')}`,
)
assert.equal(visualRegisteredRunnerProbe.registeredRunnerRun.completedImportProbeCount, visualToolNames.length)
assert.equal(visualRegisteredRunnerProbe.registeredRunnerRun.blockedRunnerCount, 0)
assert.equal(visualRegisteredRunnerProbe.registeredRunnerRun.actualToolPackageExecutionCount, 0)
assert.equal(visualRegisteredRunnerProbe.registeredRunnerRun.mediaProcessingExecuted, false)
assert.equal(visualRegisteredRunnerProbe.registeredRunnerRun.frontendExecutionAllowed, false)
assert.equal(visualRegisteredRunnerProbe.registeredRunnerRun.productReady, false)
assert.ok(visualRegisteredRunnerProbe.registeredRunnerRun.results.every((result) =>
  result.status === 'completed_import_probe' &&
  result.runtime === 'node' &&
  result.packageResolved === true &&
  result.packageImported === true &&
  result.actualToolPackageExecuted === false
))

const visualPrivateRunnerRun = await service.runRegisteredAdapterPrivateMediaRunner({
  registeredRunnerRunId: visualRegisteredRunnerProbe.registeredRunnerRun.id,
  workspaceId,
  projectId: visualSnapshot.projectId,
  creditReservationId,
  privateMediaExecutionOnly: true,
  idempotencyKey: 'bounded-adapter-source-truth-smoke:visual-private-runner',
  requestPath: '/smoke/bounded-adapter-source-truth#visual-private-runner',
})
assert.equal(visualPrivateRunnerRun.privateMediaRunnerRun.status, 'private_runner_manifest_ready')
assert.equal(visualPrivateRunnerRun.privateMediaRunnerRun.registeredRunnerRunId, visualRegisteredRunnerProbe.registeredRunnerRun.id)
assert.equal(visualPrivateRunnerRun.privateMediaRunnerRun.boundedAdapterExecutionRunId, visualExecutionRun.boundedAdapterExecutionRun.id)
assert.equal(visualPrivateRunnerRun.privateMediaRunnerRun.creditReservationId, creditReservationId)
assert.equal(visualPrivateRunnerRun.privateMediaRunnerRun.preparedPrivateRunnerManifestCount, visualToolNames.length)
assert.equal(visualPrivateRunnerRun.privateMediaRunnerRun.mediaProcessingExecuted, false)
assert.equal(visualPrivateRunnerRun.privateMediaRunnerRun.productRuntimeExecuted, false)
assert.equal(visualPrivateRunnerRun.privateMediaRunnerRun.frontendExecutionAllowed, false)
assert.equal(visualPrivateRunnerRun.privateMediaRunnerRun.productReady, false)
assert.ok(visualPrivateRunnerRun.privateMediaRunnerRun.activities.every((activity) =>
  activity.status === 'private_runner_manifest_ready' &&
  activity.registeredImportProbeReady === true &&
  activity.privateRunnerResultManifest.privateArtifact === true &&
  activity.privateRunnerResultManifest.publicArtifact === false &&
  activity.privateRunnerResultManifest.signedUrl === null &&
  activity.runnerBoundary.mediaProcessingExecuted === false &&
  activity.runnerBoundary.productRuntimeExecuted === false
))
assert.ok(visualPrivateRunnerRun.privateMediaRunnerRun.noRuntimeSideEffects.some((note) => /does not process media/i.test(note)))

const visualPrivateRunnerReplay = await service.runRegisteredAdapterPrivateMediaRunner({
  registeredRunnerRunId: visualRegisteredRunnerProbe.registeredRunnerRun.id,
  workspaceId,
  projectId: visualSnapshot.projectId,
  creditReservationId,
  privateMediaExecutionOnly: true,
  idempotencyKey: 'bounded-adapter-source-truth-smoke:visual-private-runner',
  requestPath: '/smoke/bounded-adapter-source-truth#visual-private-runner',
})
assert.equal(visualPrivateRunnerReplay.privateMediaRunnerRun.id, visualPrivateRunnerRun.privateMediaRunnerRun.id)

const visualPrivateRunnerQaReview = await service.reviewRegisteredAdapterPrivateMediaRunnerQa({
  privateMediaRunnerRunId: visualPrivateRunnerRun.privateMediaRunnerRun.id,
  workspaceId,
  projectId: visualSnapshot.projectId,
  creditReservationId,
  qaReviewOnly: true,
  idempotencyKey: 'bounded-adapter-source-truth-smoke:visual-private-runner-qa',
  requestPath: '/smoke/bounded-adapter-source-truth#visual-private-runner-qa',
})
assert.equal(visualPrivateRunnerQaReview.privateMediaRunnerQaReview.status, 'private_adapter_result_qa_passed_waiting_final_render_integration')
assert.equal(visualPrivateRunnerQaReview.privateMediaRunnerQaReview.privateMediaRunnerRunId, visualPrivateRunnerRun.privateMediaRunnerRun.id)
assert.equal(visualPrivateRunnerQaReview.privateMediaRunnerQaReview.registeredRunnerRunId, visualRegisteredRunnerProbe.registeredRunnerRun.id)
assert.equal(visualPrivateRunnerQaReview.privateMediaRunnerQaReview.boundedAdapterExecutionRunId, visualExecutionRun.boundedAdapterExecutionRun.id)
assert.equal(visualPrivateRunnerQaReview.privateMediaRunnerQaReview.creditReservationId, creditReservationId)
assert.equal(visualPrivateRunnerQaReview.privateMediaRunnerQaReview.artifactCount, visualToolNames.length)
assert.equal(visualPrivateRunnerQaReview.privateMediaRunnerQaReview.boundedNodePackageExecutionCount, visualToolNames.length)
assert.equal(visualPrivateRunnerQaReview.privateMediaRunnerQaReview.actualToolPackageExecutionCount, visualToolNames.length)
assert.equal(visualPrivateRunnerQaReview.privateMediaRunnerQaReview.mediaProcessingExecuted, false)
assert.equal(visualPrivateRunnerQaReview.privateMediaRunnerQaReview.productRuntimeExecuted, false)
assert.equal(visualPrivateRunnerQaReview.privateMediaRunnerQaReview.frontendExecutionAllowed, false)
assert.equal(visualPrivateRunnerQaReview.privateMediaRunnerQaReview.productReady, false)
assert.equal(visualPrivateRunnerQaReview.privateMediaRunnerQaReview.finalRenderIntegrationReadiness.ready, false)
assert.equal(visualPrivateRunnerQaReview.privateMediaRunnerQaReview.nextRequiredGate, 'adapter_specific_worker_artifact_integration_with_private_render')
assert.ok(visualPrivateRunnerQaReview.privateMediaRunnerQaReview.artifacts.every((artifact) =>
  artifact.privateArtifact === true &&
  artifact.publicArtifact === false &&
  artifact.signedUrl === null &&
  artifact.sourceOfTruth === true &&
  artifact.sha256.length === 64 &&
  artifact.byteSize > 0 &&
  artifact.boundedPackageExecution.status === 'executed_bounded_node_package' &&
  artifact.boundedPackageExecution.runtime === 'node' &&
  artifact.boundedPackageExecution.operation === 'dynamic_import_api_shape_probe' &&
  artifact.boundedPackageExecution.actualToolPackageExecuted === true &&
  artifact.boundedPackageExecution.mediaProcessingExecuted === false &&
  artifact.boundedPackageExecution.productRuntimeExecuted === false &&
  artifact.boundedPackageExecution.publicArtifact === false &&
  artifact.boundedPackageExecution.signedUrl === null &&
  artifact.actualToolPackageExecuted === true &&
  artifact.finalRenderIntegrationEligible === false
))
const firstPrivateRunnerQaArtifact = visualPrivateRunnerQaReview.privateMediaRunnerQaReview.artifacts[0]
assert.ok(firstPrivateRunnerQaArtifact, 'Private runner QA review should persist at least one artifact.')
const firstPrivateRunnerQaArtifactJson = JSON.parse(await readFile(firstPrivateRunnerQaArtifact.localFilePath, 'utf8')) as Record<string, unknown>
assert.equal(firstPrivateRunnerQaArtifactJson.privateMediaRunnerRunId, visualPrivateRunnerRun.privateMediaRunnerRun.id)
assert.equal(firstPrivateRunnerQaArtifactJson.publicArtifact, false)
assert.equal(firstPrivateRunnerQaArtifactJson.signedUrl, null)
assert.equal(firstPrivateRunnerQaArtifactJson.mediaProcessingExecuted, false)
assert.equal((firstPrivateRunnerQaArtifactJson.boundedPackageExecution as Record<string, unknown>)?.status, 'executed_bounded_node_package')
assert.equal((firstPrivateRunnerQaArtifactJson.boundedPackageExecution as Record<string, unknown>)?.actualToolPackageExecuted, true)
assert.equal((firstPrivateRunnerQaArtifactJson.boundedPackageExecution as Record<string, unknown>)?.mediaProcessingExecuted, false)
assert.equal((firstPrivateRunnerQaArtifactJson.boundedPackageExecution as Record<string, unknown>)?.productRuntimeExecuted, false)

const visualPrivateRunnerQaReplay = await service.reviewRegisteredAdapterPrivateMediaRunnerQa({
  privateMediaRunnerRunId: visualPrivateRunnerRun.privateMediaRunnerRun.id,
  workspaceId,
  projectId: visualSnapshot.projectId,
  creditReservationId,
  qaReviewOnly: true,
  idempotencyKey: 'bounded-adapter-source-truth-smoke:visual-private-runner-qa',
  requestPath: '/smoke/bounded-adapter-source-truth#visual-private-runner-qa',
})
assert.equal(visualPrivateRunnerQaReplay.privateMediaRunnerQaReview.id, visualPrivateRunnerQaReview.privateMediaRunnerQaReview.id)

const visualAdapterWorkerArtifactIntegration = await service.createAdapterWorkerArtifactIntegration({
  privateMediaRunnerQaReviewId: visualPrivateRunnerQaReview.privateMediaRunnerQaReview.id,
  workspaceId,
  projectId: visualSnapshot.projectId,
  creditReservationId,
  integrationOnly: true,
  idempotencyKey: 'bounded-adapter-source-truth-smoke:visual-adapter-integration',
  requestPath: '/smoke/bounded-adapter-source-truth#visual-adapter-integration',
})
assert.equal(visualAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.status, 'adapter_worker_artifact_integration_passed_ready_for_render_preview')
assert.equal(visualAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.privateMediaRunnerQaReviewId, visualPrivateRunnerQaReview.privateMediaRunnerQaReview.id)
assert.equal(visualAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.integratedArtifactCount, visualPrivateRunnerQaReview.privateMediaRunnerQaReview.artifactCount)
assert.equal(visualAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.mediaProcessingExecuted, false)
assert.equal(visualAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.mediaTransformOutputCount, 0)
assert.equal(visualAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.productRuntimeExecuted, false)
assert.equal(visualAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.frontendExecutionAllowed, false)
assert.equal(visualAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.productReady, false)
assert.equal(visualAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.privateArtifact, true)
assert.equal(visualAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.publicArtifact, false)
assert.equal(visualAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.signedUrl, null)
assert.equal(visualAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.renderPreviewIntegrationReady, true)
assert.equal(visualAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.finalRenderDecisionManifestEligible, true)
assert.equal(visualAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.mediaTransformOutputEligible, false)
assert.equal(visualAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.integrationManifestArtifact.privateArtifact, true)
assert.equal(visualAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.integrationManifestArtifact.publicArtifact, false)
assert.equal(visualAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.integrationManifestArtifact.signedUrl, null)
assert.equal(visualAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.integrationManifestArtifact.sourceOfTruthScope, 'adapter_worker_artifact_render_integration_manifest')
assert.ok(visualAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.artifacts.every((artifact) =>
  artifact.finalRenderIntegrationEligible === true &&
  artifact.mediaTransformOutputEligible === false &&
  artifact.actualToolPackageExecuted === true &&
  artifact.privateArtifact === true &&
  artifact.publicArtifact === false &&
  artifact.signedUrl === null
))
const visualAdapterWorkerArtifactIntegrationManifestJson = JSON.parse(await readFile(
  visualAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.integrationManifestArtifact.localFilePath,
  'utf8',
)) as Record<string, unknown>
assert.equal(visualAdapterWorkerArtifactIntegrationManifestJson.privateMediaRunnerQaReviewId, visualPrivateRunnerQaReview.privateMediaRunnerQaReview.id)
assert.equal(visualAdapterWorkerArtifactIntegrationManifestJson.publicArtifact, false)
assert.equal(visualAdapterWorkerArtifactIntegrationManifestJson.signedUrl, null)
assert.equal(visualAdapterWorkerArtifactIntegrationManifestJson.mediaTransformOutputCount, 0)
assert.equal((visualAdapterWorkerArtifactIntegrationManifestJson.artifacts as Array<Record<string, unknown>>)
  .every((artifact) => artifact.actualToolPackageExecuted === true), true)

const visualAdapterWorkerArtifactIntegrationReplay = await service.createAdapterWorkerArtifactIntegration({
  privateMediaRunnerQaReviewId: visualPrivateRunnerQaReview.privateMediaRunnerQaReview.id,
  workspaceId,
  projectId: visualSnapshot.projectId,
  creditReservationId,
  integrationOnly: true,
  idempotencyKey: 'bounded-adapter-source-truth-smoke:visual-adapter-integration',
  requestPath: '/smoke/bounded-adapter-source-truth#visual-adapter-integration',
})
assert.equal(visualAdapterWorkerArtifactIntegrationReplay.adapterWorkerArtifactIntegration.id, visualAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.id)

let binaryRegisteredProbeCount: number
let binaryPrivateRunnerQaActualToolPackageExecutionCount: number
let binaryAdapterWorkerArtifactIntegrationArtifactCount: number
const stubBinaryRuntime = await createStubBinaryRuntime(['gst-launch-1.0', 'mkvmerge', 'MP4Box'])
const originalPath = process.env.PATH
process.env.PATH = `${stubBinaryRuntime.binDir}:${originalPath ?? ''}`

try {
  const binarySnapshot = createSnapshot('project-bounded-adapter-render-packaging-runtime')
  const binaryPackage = await service.createPackage({
    workspaceId,
    projectId: binarySnapshot.projectId,
    approvedPlanSnapshotId: binarySnapshot.id,
    approvedSnapshot: compactSnapshot(binarySnapshot),
    creditReservationId,
    requestedAdapterToolNames: renderPackagingToolNames,
    adapterCandidateScope: 'requested_only',
    packageReadyToolIds: [],
    modelWeightApprovedToolIds: [],
    idempotencyKey: 'bounded-adapter-source-truth-smoke:binary-package',
    requestPath: '/smoke/bounded-adapter-source-truth#binary-package',
  })

  const binaryReview = await service.reviewBoundedAdapterSourceTruth({
    packageRecordId: binaryPackage.approvedEditExecutionPackage.packageRecordId,
    workspaceId,
    projectId: binarySnapshot.projectId,
    creditReservationId,
    packageReadinessEvidence: packageEvidence(renderPackagingToolNames),
    modelWeightApprovals: [],
    idempotencyKey: 'bounded-adapter-source-truth-smoke:binary-review',
    requestPath: '/smoke/bounded-adapter-source-truth#binary-review',
  })
  assert.equal(
    binaryReview.sourceTruthReview.status,
    'ready_for_bounded_execution',
    `Binary render/packaging validators should pass source-truth review after backend package evidence. Blockers: ${binaryReview.sourceTruthReview.blockers.join(' | ')}`,
  )
  assert.equal(binaryReview.sourceTruthReview.boundedAdapterExecutionGate.readyToolCount, renderPackagingToolNames.length)

  const binaryExecutionRun = await service.createBoundedAdapterExecutionRun({
    packageRecordId: binaryPackage.approvedEditExecutionPackage.packageRecordId,
    workspaceId,
    projectId: binarySnapshot.projectId,
    creditReservationId,
    handoffOnly: true,
    idempotencyKey: 'bounded-adapter-source-truth-smoke:binary-execution-run',
    requestPath: '/smoke/bounded-adapter-source-truth#binary-execution-run',
  })
  assert.equal(binaryExecutionRun.boundedAdapterExecutionRun.status, 'completed_private_manifest_handoff')
  assert.equal(binaryExecutionRun.boundedAdapterExecutionRun.preparedActivityCount, renderPackagingToolNames.length)
  assert.equal(binaryExecutionRun.boundedAdapterExecutionRun.actualToolPackageExecutionCount, 0)

  const binaryRegisteredRunnerProbe = await service.runRegisteredAdapterRunners({
    boundedAdapterExecutionRunId: binaryExecutionRun.boundedAdapterExecutionRun.id,
    workspaceId,
    projectId: binarySnapshot.projectId,
    importProbeOnly: true,
    idempotencyKey: 'bounded-adapter-source-truth-smoke:binary-registered-runner-probe',
    requestPath: '/smoke/bounded-adapter-source-truth#binary-registered-runner-probe',
  })
  binaryRegisteredProbeCount = binaryRegisteredRunnerProbe.registeredRunnerRun.completedImportProbeCount
  assert.equal(
    binaryRegisteredRunnerProbe.registeredRunnerRun.status,
    'completed_import_probe',
    `Binary render/packaging commands should resolve in the configured backend worker PATH. Blockers: ${binaryRegisteredRunnerProbe.registeredRunnerRun.blockers.join(' | ')}`,
  )
  assert.equal(binaryRegisteredRunnerProbe.registeredRunnerRun.completedImportProbeCount, renderPackagingToolNames.length)
  assert.equal(binaryRegisteredRunnerProbe.registeredRunnerRun.blockedRunnerCount, 0)
  assert.equal(binaryRegisteredRunnerProbe.registeredRunnerRun.actualToolPackageExecutionCount, 0)
  assert.equal(binaryRegisteredRunnerProbe.registeredRunnerRun.mediaProcessingExecuted, false)
  assert.equal(binaryRegisteredRunnerProbe.registeredRunnerRun.frontendExecutionAllowed, false)
  assert.equal(binaryRegisteredRunnerProbe.registeredRunnerRun.productReady, false)
  assert.ok(binaryRegisteredRunnerProbe.registeredRunnerRun.results.every((result) =>
    result.status === 'completed_import_probe' &&
    result.runtime === 'binary' &&
    result.packageResolved === true &&
    result.packageImported === true &&
    result.actualToolPackageExecuted === false &&
    result.declaredRequirementsFiles.includes('docker/prod/render-worker/Dockerfile')
  ))

  const binaryPrivateRunnerRun = await service.runRegisteredAdapterPrivateMediaRunner({
    registeredRunnerRunId: binaryRegisteredRunnerProbe.registeredRunnerRun.id,
    workspaceId,
    projectId: binarySnapshot.projectId,
    creditReservationId,
    privateMediaExecutionOnly: true,
    idempotencyKey: 'bounded-adapter-source-truth-smoke:binary-private-runner',
    requestPath: '/smoke/bounded-adapter-source-truth#binary-private-runner',
  })
  assert.equal(binaryPrivateRunnerRun.privateMediaRunnerRun.status, 'private_runner_manifest_ready')
  assert.equal(binaryPrivateRunnerRun.privateMediaRunnerRun.preparedPrivateRunnerManifestCount, renderPackagingToolNames.length)
  assert.ok(binaryPrivateRunnerRun.privateMediaRunnerRun.activities.every((activity) =>
    activity.runnerRuntime === 'binary' &&
    activity.registeredImportProbeReady === true &&
    activity.privateRunnerResultManifest.privateArtifact === true &&
    activity.privateRunnerResultManifest.publicArtifact === false &&
    activity.privateRunnerResultManifest.signedUrl === null &&
    activity.runnerBoundary.mediaProcessingExecuted === false &&
    activity.runnerBoundary.productRuntimeExecuted === false
  ))

  const binaryPrivateRunnerQaReview = await service.reviewRegisteredAdapterPrivateMediaRunnerQa({
    privateMediaRunnerRunId: binaryPrivateRunnerRun.privateMediaRunnerRun.id,
    workspaceId,
    projectId: binarySnapshot.projectId,
    creditReservationId,
    qaReviewOnly: true,
    idempotencyKey: 'bounded-adapter-source-truth-smoke:binary-private-runner-qa',
    requestPath: '/smoke/bounded-adapter-source-truth#binary-private-runner-qa',
  })
  binaryPrivateRunnerQaActualToolPackageExecutionCount = binaryPrivateRunnerQaReview.privateMediaRunnerQaReview.actualToolPackageExecutionCount
  assert.equal(binaryPrivateRunnerQaReview.privateMediaRunnerQaReview.status, 'private_adapter_result_qa_passed_waiting_final_render_integration')
  assert.equal(binaryPrivateRunnerQaReview.privateMediaRunnerQaReview.artifactCount, renderPackagingToolNames.length)
  assert.equal(binaryPrivateRunnerQaReview.privateMediaRunnerQaReview.actualToolPackageExecutionCount, renderPackagingToolNames.length)
  assert.equal(binaryPrivateRunnerQaReview.privateMediaRunnerQaReview.boundedNodePackageExecutionCount, 0)
  assert.equal(binaryPrivateRunnerQaReview.privateMediaRunnerQaReview.mediaProcessingExecuted, false)
  assert.equal(binaryPrivateRunnerQaReview.privateMediaRunnerQaReview.productRuntimeExecuted, false)
  assert.ok(binaryPrivateRunnerQaReview.privateMediaRunnerQaReview.artifacts.every((artifact) =>
    artifact.boundedPackageExecution.status === 'executed_bounded_binary_package' &&
    artifact.boundedPackageExecution.runtime === 'binary' &&
    artifact.boundedPackageExecution.operation === 'binary_presence_probe' &&
    artifact.boundedPackageExecution.actualToolPackageExecuted === true &&
    artifact.boundedPackageExecution.mediaProcessingExecuted === false &&
    artifact.boundedPackageExecution.productRuntimeExecuted === false &&
    artifact.boundedPackageExecution.publicArtifact === false &&
    artifact.boundedPackageExecution.signedUrl === null &&
    artifact.actualToolPackageExecuted === true &&
    artifact.finalRenderIntegrationEligible === false
  ))

  const firstBinaryArtifact = binaryPrivateRunnerQaReview.privateMediaRunnerQaReview.artifacts[0]
  assert.ok(firstBinaryArtifact, 'Binary runner QA should persist at least one artifact.')
  const firstBinaryArtifactJson = JSON.parse(await readFile(firstBinaryArtifact.localFilePath, 'utf8')) as Record<string, unknown>
  assert.equal(firstBinaryArtifactJson.runnerRuntime, 'binary')
  assert.equal(firstBinaryArtifactJson.publicArtifact, false)
  assert.equal(firstBinaryArtifactJson.signedUrl, null)
  assert.equal(firstBinaryArtifactJson.mediaProcessingExecuted, false)
  assert.equal((firstBinaryArtifactJson.boundedPackageExecution as Record<string, unknown>)?.status, 'executed_bounded_binary_package')
  assert.equal((firstBinaryArtifactJson.boundedPackageExecution as Record<string, unknown>)?.mediaProcessingExecuted, false)
  assert.equal((firstBinaryArtifactJson.boundedPackageExecution as Record<string, unknown>)?.productRuntimeExecuted, false)

  const binaryAdapterWorkerArtifactIntegration = await service.createAdapterWorkerArtifactIntegration({
    privateMediaRunnerQaReviewId: binaryPrivateRunnerQaReview.privateMediaRunnerQaReview.id,
    workspaceId,
    projectId: binarySnapshot.projectId,
    creditReservationId,
    integrationOnly: true,
    idempotencyKey: 'bounded-adapter-source-truth-smoke:binary-adapter-integration',
    requestPath: '/smoke/bounded-adapter-source-truth#binary-adapter-integration',
  })
  binaryAdapterWorkerArtifactIntegrationArtifactCount = binaryAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.integratedArtifactCount
  assert.equal(binaryAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.status, 'adapter_worker_artifact_integration_passed_ready_for_render_preview')
  assert.equal(binaryAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.integratedArtifactCount, renderPackagingToolNames.length)
  assert.equal(binaryAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.mediaProcessingExecuted, false)
  assert.equal(binaryAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.mediaTransformOutputCount, 0)
  assert.equal(binaryAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.productRuntimeExecuted, false)
  assert.equal(binaryAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.privateArtifact, true)
  assert.equal(binaryAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.publicArtifact, false)
  assert.equal(binaryAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.signedUrl, null)
  assert.ok(binaryAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.artifacts.every((artifact) =>
    artifact.actualToolPackageExecuted === true &&
    artifact.mediaTransformOutputEligible === false &&
    artifact.privateArtifact === true &&
    artifact.publicArtifact === false &&
    artifact.signedUrl === null
  ))
} finally {
  process.env.PATH = originalPath
  await stubBinaryRuntime.cleanup()
}

const readyReviewReplay = await service.reviewBoundedAdapterSourceTruth({
  packageRecordId: readyPackage.approvedEditExecutionPackage.packageRecordId,
  workspaceId,
  projectId: readySnapshot.projectId,
  creditReservationId,
  packageReadinessEvidence: packageEvidence(readyAdapterToolNames),
  modelWeightApprovals: [],
  idempotencyKey: 'bounded-adapter-source-truth-smoke:ready-review',
  requestPath: '/smoke/bounded-adapter-source-truth#ready-review',
})
assert.equal(readyReviewReplay.sourceTruthReview.id, readyReview.sourceTruthReview.id)
assert.equal(readyReviewReplay.approvedEditExecutionPackage.boundedAdapterExecutionGate?.status, 'ready_for_bounded_execution')

const blockedSnapshot = createSnapshot('project-bounded-adapter-blocked')
const blockedPackage = await service.createPackage({
  workspaceId,
  projectId: blockedSnapshot.projectId,
  approvedPlanSnapshotId: blockedSnapshot.id,
  approvedSnapshot: compactSnapshot(blockedSnapshot),
  creditReservationId,
  requestedAdapterToolNames: ['librosa', 'sam2', 'torch_torchvision'],
  adapterCandidateScope: 'requested_only',
  packageReadyToolIds: [],
  modelWeightApprovedToolIds: [],
  idempotencyKey: 'bounded-adapter-source-truth-smoke:blocked-package',
  requestPath: '/smoke/bounded-adapter-source-truth#blocked-package',
})

const blockedReview = await service.reviewBoundedAdapterSourceTruth({
  packageRecordId: blockedPackage.approvedEditExecutionPackage.packageRecordId,
  workspaceId,
  projectId: blockedSnapshot.projectId,
  creditReservationId,
  packageReadinessEvidence: packageEvidence(['librosa', 'sam2', 'torch_torchvision']),
  modelWeightApprovals: [],
  idempotencyKey: 'bounded-adapter-source-truth-smoke:blocked-review',
  requestPath: '/smoke/bounded-adapter-source-truth#blocked-review',
})

assert.equal(blockedReview.sourceTruthReview.status, 'blocked')
assert.ok(
  blockedReview.sourceTruthReview.blockers.some((blocker) => /sam2 needs exact model\/checkpoint approval/i.test(blocker)),
  'Model-backed adapters must remain blocked without explicit model manifest approval.',
)
assert.ok(
  blockedReview.sourceTruthReview.blockers.some((blocker) => /torch_torchvision does not support bounded execution/i.test(blocker)),
  'Foundation readiness adapters must not become direct bounded edit execution tools.',
)
assert.equal(blockedReview.approvedEditExecutionPackage.boundedAdapterExecutionGate?.productReady, false)
await assert.rejects(
  () => service.createBoundedAdapterExecutionRun({
    packageRecordId: blockedPackage.approvedEditExecutionPackage.packageRecordId,
    workspaceId,
    projectId: blockedSnapshot.projectId,
    creditReservationId,
    handoffOnly: true,
    idempotencyKey: 'bounded-adapter-source-truth-smoke:blocked-execution-run',
    requestPath: '/smoke/bounded-adapter-source-truth#blocked-execution-run',
  }),
  /source-truth readiness and adapter gates pass/i,
)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'frontend_style_package_starts_blocked_without_server_source_truth',
    'unapproved_package_readiness_source_rejected',
    'unapproved_model_weight_source_rejected',
    'backend_source_truth_review_accepts_package_readiness_evidence',
    'backend_source_truth_review_refreshes_bounded_gate_readback',
    'backend_source_truth_review_replay_is_idempotent',
    'bounded_adapter_execution_handoff_blocks_before_source_truth',
    'bounded_adapter_execution_handoff_prepares_private_result_manifests',
    'bounded_adapter_execution_handoff_replay_is_idempotent',
    'registered_backend_runner_probe_reports_missing_or_imported_python_packages',
    'registered_backend_runner_probe_replay_is_idempotent',
    'hydrated_python_adapter_runtime_completes_audio_import_probes',
    'hydrated_python_adapter_runtime_records_bounded_package_qa',
    'hydrated_python_adapter_runtime_integrates_private_qa_without_media_processing',
    'node_visual_motion_runner_packages_resolve_in_backend_runtime',
    'binary_render_packaging_runner_commands_resolve_in_backend_runtime',
    'binary_render_packaging_runtime_records_bounded_package_qa',
    'binary_render_packaging_runtime_integrates_private_qa_without_media_processing',
    'registered_adapter_private_runner_manifest_gate_prepares_private_qa_inputs',
    'registered_adapter_private_runner_manifest_gate_replay_is_idempotent',
    'registered_adapter_private_runner_qa_persists_private_artifacts',
    'registered_adapter_private_runner_qa_replay_is_idempotent',
    'adapter_worker_artifact_integration_verifies_private_artifacts',
    'adapter_worker_artifact_integration_replay_is_idempotent',
    'model_weight_tools_remain_blocked_without_manifest_approval',
    'bounded_adapter_execution_handoff_blocks_model_and_foundation_tools',
    'foundation_runtime_tools_remain_readiness_only',
    'no_runtime_tool_media_storage_billing_side_effects',
  ],
  readyReviewStatus: readyReview.sourceTruthReview.status,
  readyToolCount: readyReview.sourceTruthReview.boundedAdapterExecutionGate.readyToolCount,
  preparedActivityCount: readyExecutionRun.boundedAdapterExecutionRun.preparedActivityCount,
  actualToolPackageExecutionCount: readyExecutionRun.boundedAdapterExecutionRun.actualToolPackageExecutionCount,
  registeredRunnerProbeStatus: registeredRunnerProbe.registeredRunnerRun.status,
  audioCompletedImportProbeCount: registeredRunnerProbe.registeredRunnerRun.completedImportProbeCount,
  blockedRunnerCount: registeredRunnerProbe.registeredRunnerRun.blockedRunnerCount,
  hydratedPythonRegisteredImportProbeCount,
  hydratedPythonPrivateRunnerQaActualToolPackageExecutionCount,
  hydratedPythonAdapterWorkerArtifactIntegrationArtifactCount,
  visualRegisteredRunnerProbeStatus: visualRegisteredRunnerProbe.registeredRunnerRun.status,
  visualCompletedImportProbeCount: visualRegisteredRunnerProbe.registeredRunnerRun.completedImportProbeCount,
  visualPrivateRunnerStatus: visualPrivateRunnerRun.privateMediaRunnerRun.status,
  visualPrivateRunnerManifestCount: visualPrivateRunnerRun.privateMediaRunnerRun.preparedPrivateRunnerManifestCount,
  visualPrivateRunnerQaStatus: visualPrivateRunnerQaReview.privateMediaRunnerQaReview.status,
  visualPrivateRunnerQaArtifactCount: visualPrivateRunnerQaReview.privateMediaRunnerQaReview.artifactCount,
  visualPrivateRunnerQaBoundedNodePackageExecutionCount: visualPrivateRunnerQaReview.privateMediaRunnerQaReview.boundedNodePackageExecutionCount,
  visualPrivateRunnerQaActualToolPackageExecutionCount: visualPrivateRunnerQaReview.privateMediaRunnerQaReview.actualToolPackageExecutionCount,
  visualPrivateRunnerQaNextRequiredGate: visualPrivateRunnerQaReview.privateMediaRunnerQaReview.nextRequiredGate,
  visualAdapterWorkerArtifactIntegrationStatus: visualAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.status,
  visualAdapterWorkerArtifactIntegrationArtifactCount: visualAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.integratedArtifactCount,
  visualAdapterWorkerArtifactIntegrationNextRequiredGate: visualAdapterWorkerArtifactIntegration.adapterWorkerArtifactIntegration.nextRequiredGate,
  binaryRegisteredProbeCount,
  binaryPrivateRunnerQaActualToolPackageExecutionCount,
  binaryAdapterWorkerArtifactIntegrationArtifactCount,
  blockedReviewStatus: blockedReview.sourceTruthReview.status,
  blockedToolCount: blockedReview.sourceTruthReview.boundedAdapterExecutionGate.blockedToolCount,
  productReady: false,
}, null, 2))
