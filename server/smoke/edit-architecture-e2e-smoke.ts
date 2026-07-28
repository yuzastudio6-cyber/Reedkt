import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createApprovedEditExecutionPackage } from '../edit-architecture/approved-edit-execution-package'
import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import { createSyntheticMp4Fixture } from '../media/test-media-fixture'
import { createApprovedEditExecutionPackageService } from '../services/approved-edit-execution-package-service'
import {
  CANONICAL_PRIVATE_E2E_TOOL_IDS,
  NON_E2E_TOOL_CAPABILITY_IDS,
  listProfessionalToolAdapterNames,
} from '../tool-registry'
import type { ServiceContext } from '../types'
import { createApprovedPlanSnapshot } from '../../src/lib/approved-plan-snapshot'
import { agentFallbackActions } from '../../src/lib/agent-failure-fallback-matrix'
import { createEditSessionExecutionRehearsal } from '../../src/lib/edit-session-execution-rehearsal'
import { mapAnimationPresets } from '../../src/lib/map-animation-presets'
import { sampleClips } from '../../src/lib/mock-planner/default-data'
import { createMockEditPlan } from '../../src/lib/mock-planner/full'
import { speakerVisualLayoutModes } from '../../src/lib/speaker-visual-layouts'
import type { OpenSourceToolId, PlannerInput } from '../../src/types/reeditpro'

const professionalAdapterToolNames = listProfessionalToolAdapterNames()
const canonicalPrivateE2EToolIdSet = new Set<string>(CANONICAL_PRIVATE_E2E_TOOL_IDS)
const nonE2EToolCapabilityIdSet = new Set<string>(NON_E2E_TOOL_CAPABILITY_IDS)

function assertCanonicalPlannerToolSelection(
  candidatePlan: ReturnType<typeof createMockEditPlan>,
  label: string,
) {
  const selectedToolIds = candidatePlan.toolStrategyPlan?.toolIdsUsed ?? []
  const renderToolIds = candidatePlan.renderStrategyPlan?.openSourceToolsUsed ?? []
  assert.ok(
    [...selectedToolIds, ...renderToolIds].every((toolId) =>
      canonicalPrivateE2EToolIdSet.has(toolId)),
    `${label} must select only exact canonical 50-tool identities.`,
  )
  assert.ok(
    [...selectedToolIds, ...renderToolIds].every((toolId) =>
      !nonE2EToolCapabilityIdSet.has(toolId)),
    `${label} must not select capability-only or runner-foundation identities.`,
  )
}

const plannerInput: PlannerInput = {
  projectName: 'Internal architecture video edit',
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
  referenceUrl: 'https://example.com/internal-reference',
  customInstructions: 'Create a clean professional edit from the uploaded clips, keep the speaker clear, use a subtle music bed only when it supports the story, and add only useful visuals.',
  creditPreference: 'balanced',
  clips: sampleClips,
  sourceSequenceMode: 'multi_clip_story_order',
  sourceOrderConfirmed: true,
  cleanupPreference: 'balanced_cleanup',
  cleanupPreferenceConfirmed: true,
}

const plan = createMockEditPlan(plannerInput)
assertCanonicalPlannerToolSelection(plan, 'Default approved plan')
assert.ok(plan.sourceSequenceMap.length === sampleClips.length, 'Plan must preserve the uploaded source sequence.')
assert.ok(plan.compiledIntent, 'Plan must compile the user intent before approval.')
assert.ok(plan.creditEstimate.total > 0, 'Plan must include a credit estimate before approval.')
assert.ok(plan.editingAgentExecutionPlan?.workItems.length, 'Full plan must include an editing execution graph.')
assert.ok(plan.asyncAssetReconciliationPlan, 'Full plan must include async asset reconciliation.')
assert.ok(plan.agentQAFallbackPlan, 'Full plan must include QA/fallback policy.')
for (const toolId of [
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
] satisfies OpenSourceToolId[]) {
  assert.ok(plan.toolStrategyPlan?.toolIdsUsed.includes(toolId), `Approved audio strategy should carry ${toolId} for scoped backend adapter evidence.`)
}
const visualAdapterPlan = createMockEditPlan({
  ...plannerInput,
  projectName: 'Internal architecture visual adapter edit',
  editLevel: 'premium',
  visualPreference: 'more_graphic_design',
  customInstructions: 'Create a clean professional edit with a chart diagram, a 3D product-style visual, motion graphic cards, subject cutout, background removal, mask segmentation, and upscale/enhance support where useful.',
})
for (const toolId of [
  'd3',
  'echarts',
  'vega_lite',
  'vega',
  'viz_js',
  'satori',
  'svg_js',
  'lottie',
  'animejs',
  'pixijs',
  'konva',
  'three_js',
  'babylon_js',
  'kornia',
  'rembg',
] satisfies OpenSourceToolId[]) {
  assert.ok(visualAdapterPlan.toolStrategyPlan?.toolIdsUsed.includes(toolId), `Visual-heavy approved strategy should carry ${toolId} for scoped backend adapter evidence.`)
}
assertCanonicalPlannerToolSelection(visualAdapterPlan, 'Visual-heavy approved plan')
for (const capabilityId of [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'transparent_background',
  'real_esrgan',
] satisfies OpenSourceToolId[]) {
  assert.ok(
    !visualAdapterPlan.toolStrategyPlan?.toolIdsUsed.includes(capabilityId),
    `Capability-only ${capabilityId} must not enter canonical selectedToolIds.`,
  )
}

const mapPlan = createMockEditPlan({
  ...plannerInput,
  projectName: 'Internal architecture route map edit',
  customInstructions: 'Show an exact source-backed route map from Boston to New York with readable labels.',
})
assertCanonicalPlannerToolSelection(mapPlan, 'Map approved plan')
const mapToolStrategy = mapPlan.toolStrategyPlan?.items.find((item) =>
  item.chainId === 'map_route_chain')
assert.ok(mapToolStrategy, 'Map request should retain a controlled map tool strategy.')
assert.deepEqual(
  mapToolStrategy.selectedToolIds,
  ['d3', 'svg_js', 'remotion'],
  'Canonical map selection should use the proven vector/composition path.',
)
assert.ok(
  !mapToolStrategy.selectedToolIds.includes('maplibre') &&
    !mapToolStrategy.selectedToolIds.includes('turf'),
  'Capability-only MapLibre/Turf identities must not enter canonical selection.',
)
for (const preset of mapAnimationPresets) {
  assert.deepEqual(
    preset.preferredTools,
    ['d3', 'svg_js', 'remotion'],
    `${preset.id} must expose only the canonical controlled map stack.`,
  )
}
for (const fallbackAction of agentFallbackActions) {
  assert.ok(
    (fallbackAction.allowedToolIds ?? []).every((toolId) =>
      canonicalPrivateE2EToolIdSet.has(toolId)),
    `${fallbackAction.id} must not authorize a capability-only or retired tool identity.`,
  )
}
assert.deepEqual(
  speakerVisualLayoutModes.find((layout) => layout.id === 'full_map_takeover')?.preferredTools,
  ['D3', 'SVG.js', 'Remotion'],
  'The user-facing map layout must describe the same canonical map stack.',
)

const snapshot = createApprovedPlanSnapshot({
  approvedBy: 'mock-user',
  editSessionId: 'mock-edit-session',
  plan,
  projectId: 'mock-project',
})
const executableSnapshot = createCompactSnapshot(snapshot)

assert.ok(snapshot.sourceSequence.length === sampleClips.length, 'Approved snapshot must freeze source order.')
assert.ok(snapshot.segments.length > 0, 'Approved snapshot must freeze segment operations.')
assert.ok(snapshot.operations.length > 0, 'Approved snapshot must freeze edit operations.')
assert.ok(snapshot.creditEstimate.total_credits === plan.creditEstimate.total, 'Approved snapshot must point to the approved credit estimate.')

const rehearsal = createEditSessionExecutionRehearsal({ approvedSnapshot: snapshot })
assert.equal(rehearsal.status, 'ready_for_mock_preview_review', 'Approved snapshot must produce a mock preview rehearsal.')
assert.ok(rehearsal.executionPlan, 'Rehearsal must expose a bound execution plan.')
assert.equal(rehearsal.executionPlan?.approvedPlanSnapshotId, snapshot.id, 'Execution plan must point to the approved snapshot.')
assert.ok(rehearsal.executionPlan?.workItems.every((item) => item.approvedPlanSnapshotId === snapshot.id), 'Every work item must be bound to the approved snapshot.')
assert.ok(rehearsal.executionPlan?.assetManifest.every((asset) => asset.metadata.approvedPlanSnapshotId === snapshot.id), 'Every asset manifest item must carry approved snapshot lineage.')
assert.equal(rehearsal.executionPlan?.workItems.find((item) => item.id === 'work-validate-approved-snapshot')?.status, 'ready', 'Snapshot validation work item should be ready after binding.')
assert.ok(rehearsal.previewJob?.status === 'completed', 'Mock preview job should complete for internal review without real media work.')
assert.ok(rehearsal.previewSteps.length >= 6, 'Mock preview rehearsal should retain structured progress steps.')
assert.ok(rehearsal.finalRenderBlocked, 'Final export must remain blocked until real worker assets and QA exist.')
assert.ok(rehearsal.noRuntimeSideEffects.some((note) => /No media bytes/i.test(note)), 'Rehearsal must state that no media bytes were processed.')
assert.ok(!JSON.stringify(rehearsal).toLowerCase().includes('service_role_key'), 'Rehearsal must not expose service-role secrets.')
assert.ok(!JSON.stringify(rehearsal).toLowerCase().includes('signed url'), 'Rehearsal must not use signed URLs as source truth.')

const executionPackage = createApprovedEditExecutionPackage({
  workspaceId: 'mock-workspace',
  approvedSnapshot: snapshot,
  requestedAdapterToolNames: [...professionalAdapterToolNames],
  creditReservationId: 'mock-credit-reservation',
  packageReadyToolIds: [...professionalAdapterToolNames],
  modelWeightApprovedToolIds: ['sam2', 'birefnet', 'rembg', 'transparent_background', 'real_esrgan'],
})

assert.equal(executionPackage.status, 'ready_for_mock_preview_review', 'Approved edit package should be ready for mock preview review.')
assert.equal(executionPackage.agentCallReady, true, 'Agent call rehearsal should be ready after approval, private manifests, and adapter evidence.')
assert.equal(executionPackage.liveExecutionReady, false, 'Live execution must remain disabled by this architecture smoke.')
assert.equal(executionPackage.resolvedAdapterToolCount, professionalAdapterToolNames.length, 'Execution package should resolve all professional adapter tools.')
assert.equal(executionPackage.adapterOrchestrationPlan?.editAdapterPlan?.resolvedToolCount, professionalAdapterToolNames.length, 'Every exact professional adapter name should resolve as an edit adapter.')
assert.equal(executionPackage.adapterOrchestrationPlan?.readinessPlan, undefined, 'Runner-only foundations must remain outside the professional tool adapter request list.')
assert.ok(executionPackage.privateArtifactRefCount > 0, 'Execution package must expose private artifact references for backend handoff.')
assert.equal(executionPackage.professionalSkillTrace?.source, 'approved_professional_skill_plan', 'Execution package must preserve the approved professional skill trace.')
assert.equal(executionPackage.professionalSkillTrace?.editBriefOptional, true, 'Execution package skill trace must preserve optional Edit Brief support.')
assert.equal(executionPackage.professionalSkillTrace?.promptFirstPlanning, true, 'Execution package skill trace must preserve prompt-first planning support.')
assert.ok((executionPackage.professionalSkillTrace?.activityGroups.length ?? 0) > 0, 'Execution package skill trace must preserve professional activity groups.')
assert.ok(Array.isArray(executionPackage.professionalSkillTrace?.warnings), 'Execution package skill trace should preserve sanitized warning state.')
assert.equal(executionPackage.professionalSkillTrace?.noUserVisibleToolNames, true, 'Execution package skill trace must be marked safe for user-facing copy.')
assert.ok(!executionPackage.userFacingSummary.toLowerCase().includes('d3'), 'User-facing package summary must not expose exact tool names.')
assert.ok(
  !/librosa|pydub|ffmpeg|gpac|mkvtoolnix|streamer_render_pipeline_support|d3|three_js|sam2/i.test(JSON.stringify(executionPackage.professionalSkillTrace ?? {})),
  'Execution package skill trace must not expose internal adapter/tool names.',
)
assert.ok(!JSON.stringify(executionPackage).toLowerCase().includes('signed url'), 'Execution package must not use signed URLs as source truth.')

let legacyRuntimeBoundary: ApiError | undefined
try {
  await createPrivateInternalReviewArchitectureProof(executableSnapshot)
} catch (error) {
  if (error instanceof ApiError) legacyRuntimeBoundary = error
}
assert.equal(legacyRuntimeBoundary?.code, 'TOOL_NOT_READY', 'Legacy caller-authored execution packaging must fail closed.')
assert.equal(
  (legacyRuntimeBoundary?.details as Record<string, unknown> | undefined)?.requiredGate,
  'canonical_edit_authority_execution_package',
  'The fail-closed boundary must identify the canonical server-owned execution package gate.',
)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'uploaded_source_sequence_preserved',
    'compiled_intent_before_approval',
    'credit_estimate_before_approval',
    'approved_snapshot_created',
    'execution_graph_bound_to_snapshot',
    'asset_manifest_bound_to_snapshot',
    'mock_execution_package_compiled',
    'professional_skill_trace_bound_to_execution_package',
    'professional_adapter_orchestration_ready',
    'mock_preview_handoff_ready',
    'legacy_caller_authored_runtime_chain_fails_closed',
    'canonical_execution_package_authority_required',
    'no_runtime_media_provider_or_secret_side_effects',
  ],
  sourceClipCount: rehearsal.sourceClipCount,
  segmentCount: rehearsal.segmentCount,
  operationCount: rehearsal.operationCount,
  plannedWorkItemCount: rehearsal.plannedWorkItemCount,
  assetManifestCount: rehearsal.assetManifestCount,
  qaGateCount: rehearsal.qaGateCount,
  adapterToolCount: executionPackage.resolvedAdapterToolCount,
  plannedPrivateArtifactRefCount: executionPackage.privateArtifactRefCount,
  runtimeProofScope: 'mock_plan_rehearsal_and_fail_closed_legacy_boundary',
  requiredCanonicalGate: 'canonical_edit_authority_execution_package',
}, null, 2))

async function createPrivateInternalReviewArchitectureProof(
  approvedSnapshot: ReturnType<typeof createCompactSnapshot>,
): Promise<{
  privateProcessedArtifactCount: number
  privateFinalRenderByteCount: number
  privateManifestByteCount: number
  privateDownloadPath: string
}> {
  const localStorageRoot = await mkdtemp(join(tmpdir(), 'reeditpro-edit-architecture-e2e-'))
  const env = loadRuntimeEnv({
    NODE_ENV: 'test',
    E2E_RUNTIME_MODE: 'local',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
    LOCAL_STORAGE_ROOT: localStorageRoot,
    SUPABASE_URL: '',
    SUPABASE_SERVICE_ROLE_KEY: '',
  })
  const context: ServiceContext = {
    env,
    clients: { admin: null, public: null },
    requestId: 'edit-architecture-private-review-proof',
    auth: {
      userId: 'mock-user',
      isMockUser: true,
    },
  }
  const service = createApprovedEditExecutionPackageService(context)
  const workspaceId = 'mock-workspace'
  const projectId = approvedSnapshot.projectId
  const creditReservationId = 'mock-credit-reservation'

  try {
    // The legacy service is retained only as a regression boundary. It must reject
    // this caller-authored snapshot before fixture bytes, workers, or renders run.
    await service.createPackage({
      workspaceId,
      projectId,
      approvedPlanSnapshotId: approvedSnapshot.id,
      approvedSnapshot: approvedSnapshot as unknown as Record<string, unknown>,
      creditReservationId,
      requestedAdapterToolNames: [...professionalAdapterToolNames],
      packageReadyToolIds: [...professionalAdapterToolNames],
      modelWeightApprovedToolIds: ['sam2', 'birefnet', 'rembg', 'transparent_background', 'real_esrgan'],
      idempotencyKey: 'architecture-canonical-boundary',
      requestPath: '/smoke/edit-architecture/canonical-boundary',
    })
    failUnexpectedLegacyRuntimeAcceptance()

    const sourceMediaAssets = []
    for (const [index, item] of approvedSnapshot.sourceSequence.entries()) {
      const storagePath = join(
        'source-media',
        'edit-architecture-private-review-proof',
        `${String(index + 1).padStart(2, '0')}-${item.uploaded_clip_id}.mp4`,
      ).split('/').join('/')
      const fixture = await createSyntheticMp4Fixture({
        outputPath: join(localStorageRoot, storagePath),
        localStorageRoot,
        durationSeconds: 1,
        width: 160,
        height: 90,
        includeAudio: true,
        videoPattern: index % 2 === 0 ? 'solid_red' : 'solid_blue',
      })
      assert.equal(fixture.available, true, `Synthetic uploaded source fixture should be available: ${fixture.warnings.join('; ')}`)
      assert.ok(fixture.sizeBytes && fixture.sizeBytes > 0, 'Synthetic uploaded source fixture should have bytes.')
      assert.ok(fixture.checksumSha256, 'Synthetic uploaded source fixture should have checksum evidence.')

      sourceMediaAssets.push({
        mediaAssetId: `architecture-source-media-${index + 1}`,
        sourceSequenceItemId: item.id,
        uploadedClipId: item.uploaded_clip_id,
        uploadedOrder: item.source_order,
        storageProvider: 'local_private' as const,
        storagePath,
        fileName: `${item.uploaded_clip_id}.mp4`,
        mimeType: 'video/mp4',
        byteSize: fixture.sizeBytes,
        checksumSha256: fixture.checksumSha256,
        privateArtifact: true as const,
        publicUrl: null,
        signedUrl: null,
      })
    }

    const packageResult = await service.createPackage({
      workspaceId,
      projectId,
      approvedPlanSnapshotId: approvedSnapshot.id,
      approvedSnapshot: approvedSnapshot as unknown as Record<string, unknown>,
      creditReservationId,
      requestedAdapterToolNames: [...professionalAdapterToolNames],
      packageReadyToolIds: [...professionalAdapterToolNames],
      modelWeightApprovedToolIds: ['sam2', 'birefnet', 'rembg', 'transparent_background', 'real_esrgan'],
      idempotencyKey: 'architecture-package',
      requestPath: '/smoke/edit-architecture/package',
    })
    const packageRecordId = packageResult.approvedEditExecutionPackage.packageRecordId
    const jobBatch = await service.createJobBatchPlan({
      packageRecordId,
      workspaceId,
      projectId,
      creditReservationId,
      dryRunOnly: true,
      idempotencyKey: 'architecture-job-batch',
      requestPath: '/smoke/edit-architecture/job-batch',
    })
    const mockQueue = await service.createMockQueue({
      jobBatchPlanId: jobBatch.jobBatchPlan.id,
      workspaceId,
      projectId,
      creditReservationId,
      mockQueueOnly: true,
      idempotencyKey: 'architecture-mock-queue',
      requestPath: '/smoke/edit-architecture/mock-queue',
    })
    const dispatchReadiness = await service.createDispatchReadiness({
      mockQueueId: mockQueue.mockQueue.id,
      workspaceId,
      projectId,
      creditReservationId,
      dryRunOnly: true,
      idempotencyKey: 'architecture-dispatch-readiness',
      requestPath: '/smoke/edit-architecture/dispatch-readiness',
    })
    const mockWorkerClaims = await service.createMockWorkerClaims({
      dispatchReadinessId: dispatchReadiness.dispatchReadiness.id,
      workspaceId,
      projectId,
      creditReservationId,
      mockClaimsOnly: true,
      idempotencyKey: 'architecture-mock-worker-claims',
      requestPath: '/smoke/edit-architecture/mock-worker-claims',
    })
    const handlerDryRun = await service.createHandlerDryRun({
      mockWorkerClaimsId: mockWorkerClaims.mockWorkerClaims.id,
      workspaceId,
      projectId,
      creditReservationId,
      handlerDryRunOnly: true,
      idempotencyKey: 'architecture-handler-dry-run',
      requestPath: '/smoke/edit-architecture/handler-dry-run',
    })
    const resultReconciliation = await service.createResultReconciliation({
      handlerDryRunId: handlerDryRun.handlerDryRun.id,
      workspaceId,
      projectId,
      creditReservationId,
      reconcileDryRunOnly: true,
      idempotencyKey: 'architecture-result-reconciliation',
      requestPath: '/smoke/edit-architecture/result-reconciliation',
    })
    const localWorkerOutput = await service.createLocalWorkerOutput({
      resultReconciliationId: resultReconciliation.resultReconciliation.id,
      workspaceId,
      projectId,
      creditReservationId,
      localOutputOnly: true,
      idempotencyKey: 'architecture-local-worker-output',
      requestPath: '/smoke/edit-architecture/local-worker-output',
    })
    const localWorkerOutputQa = await service.createLocalWorkerOutputQaReview({
      localWorkerOutputId: localWorkerOutput.localWorkerOutput.id,
      workspaceId,
      projectId,
      creditReservationId,
      qaReviewOnly: true,
      idempotencyKey: 'architecture-local-worker-output-qa',
      requestPath: '/smoke/edit-architecture/local-worker-output-qa',
    })
    const workflowRehearsal = await service.createWorkflowRehearsal({
      localWorkerOutputId: localWorkerOutput.localWorkerOutput.id,
      workspaceId,
      projectId,
      creditReservationId,
      rehearsalOnly: true,
      idempotencyKey: 'architecture-workflow-rehearsal',
      requestPath: '/smoke/edit-architecture/workflow-rehearsal',
    })
    const uploadedMediaWorkerExecution = await service.createUploadedMediaWorkerExecution({
      workflowRehearsalId: workflowRehearsal.workflowRehearsal.id,
      localWorkerOutputId: localWorkerOutput.localWorkerOutput.id,
      localWorkerOutputQaReviewId: localWorkerOutputQa.localWorkerOutputQaReview.id,
      workspaceId,
      projectId,
      creditReservationId,
      sourceMediaAssets,
      uploadedMediaExecutionOnly: true,
      idempotencyKey: 'architecture-uploaded-media-worker-execution',
      requestPath: '/smoke/edit-architecture/uploaded-media-worker-execution',
    })
    const privateWorkerArtifactQa = await service.createPrivateWorkerArtifactQaReview({
      uploadedMediaWorkerExecutionId: uploadedMediaWorkerExecution.uploadedMediaWorkerExecution.id,
      workspaceId,
      projectId,
      creditReservationId,
      qaReviewOnly: true,
      idempotencyKey: 'architecture-private-worker-artifact-qa',
      requestPath: '/smoke/edit-architecture/private-worker-artifact-qa',
    })
    const localMediaProcessing = await service.createLocalMediaProcessingExecution({
      privateWorkerArtifactQaReviewId: privateWorkerArtifactQa.privateWorkerArtifactQaReview.id,
      workspaceId,
      projectId,
      creditReservationId,
      processingExecutionOnly: true,
      processingMode: 'private_internal_review_render',
      maxDurationSeconds: 3,
      targetWidth: 320,
      targetHeight: 180,
      fps: 15,
      idempotencyKey: 'architecture-local-media-processing',
      requestPath: '/smoke/edit-architecture/local-media-processing',
    })
    assert.ok(localMediaProcessing.localMediaProcessingExecution.processedArtifactCount > 0, 'Private source media should be processed into private review artifacts.')

    const privateMediaArtifactQa = await service.createPrivateMediaArtifactQaReview({
      localMediaProcessingExecutionId: localMediaProcessing.localMediaProcessingExecution.id,
      workspaceId,
      projectId,
      creditReservationId,
      qaReviewOnly: true,
      idempotencyKey: 'architecture-private-media-artifact-qa',
      requestPath: '/smoke/edit-architecture/private-media-artifact-qa',
    })
    const renderPreviewAssembly = await service.createRenderPreviewAssembly({
      privateMediaArtifactQaReviewId: privateMediaArtifactQa.privateMediaArtifactQaReview.id,
      workspaceId,
      projectId,
      creditReservationId,
      assemblyOnly: true,
      idempotencyKey: 'architecture-render-preview-assembly',
      requestPath: '/smoke/edit-architecture/render-preview-assembly',
    })
    const userPreviewReview = await service.createUserPreviewReview({
      renderPreviewAssemblyId: renderPreviewAssembly.renderPreviewAssembly.id,
      workspaceId,
      projectId,
      creditReservationId,
      reviewOnly: true,
      reviewDecision: 'approved_for_final_render_readiness',
      reviewerNote: 'Architecture smoke approves the private review candidate for final render readiness.',
      idempotencyKey: 'architecture-user-preview-review',
      requestPath: '/smoke/edit-architecture/user-preview-review',
    })
    const finalRenderReadiness = await service.createFinalRenderReadinessReview({
      userPreviewReviewId: userPreviewReview.userPreviewReview.id,
      workspaceId,
      projectId,
      creditReservationId,
      readinessReviewOnly: true,
      idempotencyKey: 'architecture-final-render-readiness',
      requestPath: '/smoke/edit-architecture/final-render-readiness',
    })
    const finalRenderExecution = await service.createFinalRenderExecution({
      finalRenderReadinessReviewId: finalRenderReadiness.finalRenderReadinessReview.id,
      workspaceId,
      projectId,
      creditReservationId,
      renderExecutionOnly: true,
      idempotencyKey: 'architecture-final-render-execution',
      requestPath: '/smoke/edit-architecture/final-render-execution',
    })
    assert.equal(finalRenderExecution.finalRenderExecution.finalRenderReady, true, 'Private final render execution should create a private final render candidate.')
    assert.equal(finalRenderExecution.finalRenderExecution.finalRenderArtifact.privateArtifact, true, 'Private final render should remain private.')
    assert.equal(finalRenderExecution.finalRenderExecution.finalRenderArtifact.publicArtifact, false, 'Private final render should not create public artifacts.')
    assert.equal(finalRenderExecution.finalRenderExecution.finalRenderArtifact.signedUrl, null, 'Private final render should not create signed URLs.')

    const finalDeliveryQa = await service.createFinalDeliveryQaReview({
      finalRenderExecutionId: finalRenderExecution.finalRenderExecution.id,
      workspaceId,
      projectId,
      creditReservationId,
      qaReviewOnly: true,
      idempotencyKey: 'architecture-final-delivery-qa',
      requestPath: '/smoke/edit-architecture/final-delivery-qa',
    })
    assert.equal(finalDeliveryQa.finalDeliveryQaReview.status, 'final_delivery_qa_passed_ready_for_private_internal_download', 'Final delivery QA should pass for private internal download.')
    assert.equal(finalDeliveryQa.finalDeliveryQaReview.professionalEditQaSummary.privateInternalQaReady, true, 'Final delivery QA should produce professional private review evidence.')

    const privateDownload = await service.createPrivateInternalDownloadDelivery({
      finalDeliveryQaReviewId: finalDeliveryQa.finalDeliveryQaReview.id,
      workspaceId,
      projectId,
      creditReservationId,
      deliveryOnly: true,
      idempotencyKey: 'architecture-private-internal-download',
      requestPath: '/smoke/edit-architecture/private-internal-download',
    })
    assert.equal(privateDownload.privateInternalDownloadDelivery.status, 'private_internal_download_delivery_ready', 'Private internal download should be ready after final delivery QA.')
    assert.equal(privateDownload.privateInternalDownloadDelivery.privateInternalDownloadReady, true, 'Private internal download flag should be true.')
    assert.equal(privateDownload.privateInternalDownloadDelivery.publicDeliveryReady, false, 'Public delivery must remain off.')
    assert.equal(privateDownload.privateInternalDownloadDelivery.externalBetaReady, false, 'External beta must remain off.')
    assert.equal(privateDownload.privateInternalDownloadDelivery.productionReady, false, 'Production must remain off.')

    const privateFile = await service.getPrivateInternalDownloadFile(privateDownload.privateInternalDownloadDelivery.id)
    const privateManifest = await service.getPrivateInternalDownloadManifestFile(privateDownload.privateInternalDownloadDelivery.id)
    assert.ok(privateFile.byteSize > 0, 'Private internal MP4 file should stream bytes.')
    assert.ok(privateManifest.byteSize > 0, 'Private internal edit decision manifest should stream bytes.')

    return {
      privateProcessedArtifactCount: localMediaProcessing.localMediaProcessingExecution.processedArtifactCount,
      privateFinalRenderByteCount: privateDownload.privateInternalDownloadDelivery.finalRenderArtifact.byteSize,
      privateManifestByteCount: privateManifest.byteSize,
      privateDownloadPath: privateDownload.privateInternalDownloadDelivery.internalDownloadPath,
    }
  } finally {
    await rm(localStorageRoot, { recursive: true, force: true })
  }
}

function createCompactSnapshot(snapshotRecord: ReturnType<typeof createApprovedPlanSnapshot>) {
  return {
    id: snapshotRecord.id,
    projectId: snapshotRecord.projectId,
    editSessionId: snapshotRecord.editSessionId,
    editPlanVersionId: snapshotRecord.editPlanVersionId,
    creditEstimateId: snapshotRecord.creditEstimateId,
    approvedAt: snapshotRecord.approvedAt,
    approvedBy: snapshotRecord.approvedBy,
    compiledIntent: snapshotRecord.compiledIntent,
    sourceSequence: snapshotRecord.sourceSequence,
    segments: snapshotRecord.segments,
    operations: snapshotRecord.operations,
    rendererLayers: snapshotRecord.rendererLayers,
    masterTimingPlan: snapshotRecord.masterTimingPlan,
    captionVisualCueTimingPlan: snapshotRecord.captionVisualCueTimingPlan,
    sourceCleanupPlan: snapshotRecord.sourceCleanupPlan,
    sourcePlan: {
      goalSummary: snapshotRecord.sourcePlan.goalSummary,
    },
    creditEstimate: snapshotRecord.creditEstimate,
    colorPipelinePlan: snapshotRecord.colorPipelinePlan,
    editingAgentExecutionPlan: snapshotRecord.editingAgentExecutionPlan,
    asyncAssetReconciliationPlan: snapshotRecord.asyncAssetReconciliationPlan,
    agentQAFallbackPlan: snapshotRecord.agentQAFallbackPlan,
    qaPlan: snapshotRecord.qaPlan,
    toolStrategyPlan: snapshotRecord.toolStrategyPlan,
  }
}

function failUnexpectedLegacyRuntimeAcceptance(): void {
  throw new Error('Legacy caller-authored execution packaging unexpectedly crossed the canonical authority boundary.')
}
