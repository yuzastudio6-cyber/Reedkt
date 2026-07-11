import { Router } from 'express'
import { ApiError } from '../errors/api-error'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency, requireSensitiveIdempotencyKey } from '../middleware/idempotency'
import { requireInternalServiceAuth } from '../middleware/internal-service-auth'
import { createApprovedEditExecutionPackageService } from '../services/approved-edit-execution-package-service'
import { createCanonicalEditExecutionPackageService } from '../services/canonical-edit-execution-package-service'
import { createCanonicalExecutionReadinessService } from '../services/canonical-execution-readiness-service'
import { createCanonicalPrivateFinalArtifactDownloadService } from '../services/canonical-private-final-artifact-download-service'
import { createCanonicalWorkerLeaseAuthorityService } from '../services/canonical-worker-lease-authority-service'
import {
  listProvenToolIdentityCatalog,
  summarizeProvenToolIdentityCatalog,
} from '../tool-execution/proven-tool-identity-catalog'
import { createToolRuntimeEvidenceAuthority } from '../tool-runtime-evidence'
import {
  createApprovedEditExecutionPackageSchema,
  createApprovedEditExecutionAdapterWorkerArtifactIntegrationSchema,
  createApprovedEditExecutionBoundedAdapterExecutionRunSchema,
  createApprovedEditExecutionBoundedAdapterSourceTruthReviewSchema,
  createApprovedEditExecutionDispatchReadinessSchema,
  createApprovedEditExecutionFinalDeliveryQaReviewSchema,
  createApprovedEditExecutionFinalRenderExecutionSchema,
  createApprovedEditExecutionFinalRenderReadinessReviewSchema,
  createApprovedEditExecutionHandlerDryRunSchema,
  createApprovedEditExecutionJobBatchPlanSchema,
  createApprovedEditExecutionMockQueueSchema,
  createApprovedEditExecutionMockWorkerClaimsSchema,
  createApprovedEditExecutionPrivateInternalTestRunSchema,
  createApprovedEditExecutionLocalWorkerOutputSchema,
  createApprovedEditExecutionLocalWorkerOutputQaReviewSchema,
  createApprovedEditExecutionLocalMediaProcessingExecutionSchema,
  createApprovedEditExecutionPrivateWorkerArtifactQaReviewSchema,
  createApprovedEditExecutionPrivateInternalDownloadDeliverySchema,
  createApprovedEditExecutionPrivateMediaArtifactQaReviewSchema,
  createApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerSchema,
  createApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerQaReviewSchema,
  createApprovedEditExecutionRegisteredAdapterRunnerProbeSchema,
  createApprovedEditExecutionRenderPreviewAssemblySchema,
  createApprovedEditExecutionResultReconciliationSchema,
  createApprovedEditExecutionUploadedMediaWorkerExecutionSchema,
  createApprovedEditExecutionUserPreviewReviewSchema,
  createApprovedEditExecutionWorkflowRehearsalSchema,
} from '../validation/edit-execution-schemas'
import { authorityWorkspaceQuerySchema } from '../validation/edit-planning-authority-schemas'
import { canonicalExecutionReadinessRouteBodySchema } from '../validation/canonical-execution-readiness-schemas'
import { inspectToolRuntimeEvidenceSchema } from '../validation/tool-runtime-evidence-schemas'
import { canonicalPrivateFinalArtifactDownloadQuerySchema } from '../validation/canonical-private-final-artifact-download-schemas'
import {
  claimCanonicalWorkerLeaseRouteBodySchema,
  heartbeatCanonicalWorkerLeaseRouteBodySchema,
  releaseCanonicalWorkerLeaseRouteBodySchema,
} from '../validation/canonical-worker-lease-authority-schemas'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, getIdempotencyKey, getRouteParam, getServiceContext, sendOk } from './route-helpers'
import { resolveProfessionalToolAdapterContract } from '../tool-registry/professional-tool-adapter-contracts'

type PrivateInternalAdapterActivityGroupId =
  | 'audio_preparation'
  | 'visual_layers'
  | 'motion_graphics'
  | 'image_cleanup'
  | 'model_foundation'
  | 'private_review_packaging'
  | 'readiness_checks'

const WORKER_LEASE_CREDENTIAL_HEADER = 'x-reeditpro-worker-lease-credential'

type PrivateInternalAdapterActivityGroupStatus = 'ready' | 'partial' | 'pending' | 'blocked'

type PrivateInternalAdapterActivityGroup = {
  id: PrivateInternalAdapterActivityGroupId
  label: string
  resolvedActivityCount: number
  integratedActivityCount: number
  pendingActivityCount: number
  status: PrivateInternalAdapterActivityGroupStatus
  userFacingSummary: string
}

const privateInternalAdapterActivityGroupLabels: Record<PrivateInternalAdapterActivityGroupId, string> = {
  audio_preparation: 'Audio preparation',
  visual_layers: 'Visual layers',
  motion_graphics: 'Motion graphics',
  image_cleanup: 'Image cleanup',
  model_foundation: 'Readiness foundation',
  private_review_packaging: 'Private review package',
  readiness_checks: 'Readiness checks',
}

const privateInternalAdapterActivityGroups: Array<{
  id: PrivateInternalAdapterActivityGroupId
  aliases: string[]
}> = [
  {
    id: 'audio_preparation',
    aliases: [
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
    ],
  },
  {
    id: 'visual_layers',
    aliases: [
      'd3',
      'd3_js',
      'echarts',
      'vega_lite',
      'vega',
      'satori',
      'svg_js',
      'svgjs',
      'viz_js',
    ],
  },
  {
    id: 'motion_graphics',
    aliases: [
      'lottie_web',
      'lottie',
      'animejs',
      'anime_js',
      'three',
      'three_js',
      'pixi_js',
      'pixijs',
      'konva',
      'babylonjs',
      'babylon_js',
    ],
  },
  {
    id: 'image_cleanup',
    aliases: [
      'sam2',
      'birefnet',
      'rembg',
      'transparent_background',
      'real_esrgan',
      'kornia',
    ],
  },
  {
    id: 'model_foundation',
    aliases: [
      'torch_torchvision',
      'torch',
      'torchvision',
      'transformers',
    ],
  },
  {
    id: 'private_review_packaging',
    aliases: [
      'streamer_render_pipeline_support',
      'mkvtoolnix_container_validation',
      'gpac_mp4box_packaging_validation',
      'gstreamer',
      'mkvtoolnix',
      'mp4box',
      'gpac',
    ],
  },
]

export interface EditExecutionRouteOptions {
  includeInternalTestRoutes?: boolean
}

export function createEditExecutionRoutes(options: EditExecutionRouteOptions = {}): Router {
  const router = Router()

  registerEditExecutionUserRoutes(router)

  if (options.includeInternalTestRoutes === false) {
    return router
  }

  // All remaining edit-execution endpoints are private/internal test or
  // control-plane surfaces. Route-level `requireAuth` below still verifies the
  // user identity; this middleware adds the separate internal-service gate.
  router.use('/v1/edit-executions', requireInternalServiceAuth)

  router.post('/v1/edit-executions/packages', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedEditExecutionPackageSchema, request.body)
    const result = await createCanonicalEditExecutionPackageService(getServiceContext(request)).createPackage({
      ...body,
      idempotencyKey: getIdempotencyKey(request),
      requestPath: request.originalUrl,
    })
    sendOk(response, {
      approvedEditExecutionPackage: result.approvedEditExecutionPackage,
      toolCapabilityManifest: result.toolCapabilityManifest,
    }, result.warnings, 201)
  }))

  router.get('/v1/edit-executions/packages/:packageRecordId', requireAuth, asyncRoute(async (request, response) => {
    const query = validateBody(authorityWorkspaceQuerySchema, request.query)
    const result = await createCanonicalEditExecutionPackageService(getServiceContext(request)).getPackage(
      getRouteParam(request, 'packageRecordId'),
      query.workspaceId,
    )
    sendOk(response, {
      approvedEditExecutionPackage: result.approvedEditExecutionPackage,
      toolCapabilityManifest: result.toolCapabilityManifest,
    }, result.warnings)
  }))

  router.post('/v1/edit-executions/jobs/:jobId/readiness-inspection', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(canonicalExecutionReadinessRouteBodySchema, request.body)
    const result = await createCanonicalExecutionReadinessService(getServiceContext(request)).inspectJob({
      ...body,
      jobId: getRouteParam(request, 'jobId'),
    })
    sendOk(response, { executionReadinessEnvelope: result.executionReadinessEnvelope }, result.warnings)
  }))

  router.post('/v1/edit-executions/tool-runtime-evidence/inspect', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(inspectToolRuntimeEvidenceSchema, request.body)
    const toolRuntimeEvidenceAuthority = createToolRuntimeEvidenceAuthority({ probeMode: body.probeMode })
    const provenToolIdentitySummary = summarizeProvenToolIdentityCatalog()
    const provenToolIdentityCatalog = listProvenToolIdentityCatalog()
    sendOk(response, {
      toolRuntimeEvidenceAuthority,
      provenToolIdentitySummary,
      provenToolIdentityCatalog,
    }, [
      'Local presence evidence is read-only and cannot authorize a tool call, worker dispatch, artifact write, render, or credit spend.',
      'Confined runner proof and exact canonical end-to-end proof are separate states in the proven tool identity catalog.',
      'Production readiness remains fail-closed until every per-tool blocker in this report has deployed evidence.',
    ])
  }))

  router.post('/v1/edit-executions/jobs/:jobId/leases', requireAuth, requireSensitiveIdempotencyKey, asyncRoute(async (request, response) => {
    const body = validateBody(claimCanonicalWorkerLeaseRouteBodySchema, request.body)
    const result = await createCanonicalWorkerLeaseAuthorityService(getServiceContext(request)).claim({
      ...body,
      jobId: getRouteParam(request, 'jobId'),
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { workerLeaseClaim: result.workerLeaseClaim }, result.warnings, 201)
  }))

  router.post('/v1/edit-executions/jobs/:jobId/leases/:leaseId/heartbeat', requireAuth, requireSensitiveIdempotencyKey, asyncRoute(async (request, response) => {
    const body = validateBody(heartbeatCanonicalWorkerLeaseRouteBodySchema, request.body)
    const result = await createCanonicalWorkerLeaseAuthorityService(getServiceContext(request)).heartbeat({
      ...body,
      jobId: getRouteParam(request, 'jobId'),
      leaseId: getRouteParam(request, 'leaseId'),
      leaseCredential: requireWorkerLeaseCredential(request.header(WORKER_LEASE_CREDENTIAL_HEADER)),
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { workerLeaseHeartbeat: result.workerLeaseHeartbeat }, result.warnings)
  }))

  router.post('/v1/edit-executions/jobs/:jobId/leases/:leaseId/release', requireAuth, requireSensitiveIdempotencyKey, asyncRoute(async (request, response) => {
    const body = validateBody(releaseCanonicalWorkerLeaseRouteBodySchema, request.body)
    const result = await createCanonicalWorkerLeaseAuthorityService(getServiceContext(request)).release({
      ...body,
      jobId: getRouteParam(request, 'jobId'),
      leaseId: getRouteParam(request, 'leaseId'),
      leaseCredential: requireWorkerLeaseCredential(request.header(WORKER_LEASE_CREDENTIAL_HEADER)),
      idempotencyKey: getIdempotencyKey(request),
    })
    sendOk(response, { workerLeaseRelease: result.workerLeaseRelease }, result.warnings)
  }))

  router.use('/v1/edit-executions', asyncRoute(async () => {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Legacy execution stages are disabled until they consume canonical jobs, source assets, tool evidence, QA results, and cost evidence server-side.',
      503,
      { requiredGate: 'canonical_execution_stage_adapters' },
    )
  }))

  router.get('/v1/edit-executions/packages/:packageRecordId/bounded-adapter-execution-gate', requireAuth, asyncRoute(async (request, response) => {
    const result = await createApprovedEditExecutionPackageService(getServiceContext(request)).getBoundedAdapterExecutionGate(
      getRouteParam(request, 'packageRecordId'),
    )
    sendOk(response, {
      packageRecordId: result.packageRecordId,
      workspaceId: result.workspaceId,
      projectId: result.projectId,
      approvedPlanSnapshotId: result.approvedPlanSnapshotId,
      boundedAdapterExecutionGate: result.boundedAdapterExecutionGate,
    }, result.warnings)
  }))

  router.post('/v1/edit-executions/packages/:packageRecordId/bounded-adapter-source-truth-review', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedEditExecutionBoundedAdapterSourceTruthReviewSchema, request.body)
    const result = await createApprovedEditExecutionPackageService(getServiceContext(request)).reviewBoundedAdapterSourceTruth({
      ...body,
      packageRecordId: getRouteParam(request, 'packageRecordId'),
      idempotencyKey: getIdempotencyKey(request),
      requestPath: request.originalUrl,
    })
    sendOk(response, {
      sourceTruthReview: result.sourceTruthReview,
      approvedEditExecutionPackage: result.approvedEditExecutionPackage,
    }, result.warnings, 201)
  }))

  router.post('/v1/edit-executions/packages/:packageRecordId/bounded-adapter-execution-runs', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedEditExecutionBoundedAdapterExecutionRunSchema, request.body)
    const result = await createApprovedEditExecutionPackageService(getServiceContext(request)).createBoundedAdapterExecutionRun({
      ...body,
      packageRecordId: getRouteParam(request, 'packageRecordId'),
      idempotencyKey: getIdempotencyKey(request),
      requestPath: request.originalUrl,
    })
    sendOk(response, { boundedAdapterExecutionRun: result.boundedAdapterExecutionRun }, result.warnings, 201)
  }))

  router.post('/v1/edit-executions/bounded-adapter-execution-runs/:boundedAdapterExecutionRunId/registered-runner-probe', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedEditExecutionRegisteredAdapterRunnerProbeSchema, request.body)
    const result = await createApprovedEditExecutionPackageService(getServiceContext(request)).runRegisteredAdapterRunners({
      ...body,
      boundedAdapterExecutionRunId: getRouteParam(request, 'boundedAdapterExecutionRunId'),
      idempotencyKey: getIdempotencyKey(request),
      requestPath: request.originalUrl,
    })
    sendOk(response, { registeredRunnerRun: result.registeredRunnerRun }, result.warnings, 201)
  }))

  router.post('/v1/edit-executions/registered-runner-runs/:registeredRunnerRunId/private-media-runner-execution', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerSchema, request.body)
    const result = await createApprovedEditExecutionPackageService(getServiceContext(request)).runRegisteredAdapterPrivateMediaRunner({
      ...body,
      registeredRunnerRunId: getRouteParam(request, 'registeredRunnerRunId'),
      idempotencyKey: getIdempotencyKey(request),
      requestPath: request.originalUrl,
    })
    sendOk(response, { privateMediaRunnerRun: result.privateMediaRunnerRun }, result.warnings, 201)
  }))

  router.post('/v1/edit-executions/private-media-runner-runs/:privateMediaRunnerRunId/qa-review', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedEditExecutionRegisteredAdapterPrivateMediaRunnerQaReviewSchema, request.body)
    const result = await createApprovedEditExecutionPackageService(getServiceContext(request)).reviewRegisteredAdapterPrivateMediaRunnerQa({
      ...body,
      privateMediaRunnerRunId: getRouteParam(request, 'privateMediaRunnerRunId'),
      idempotencyKey: getIdempotencyKey(request),
      requestPath: request.originalUrl,
    })
    sendOk(response, { privateMediaRunnerQaReview: result.privateMediaRunnerQaReview }, result.warnings, 201)
  }))

  router.post('/v1/edit-executions/private-runner-qa-reviews/:privateMediaRunnerQaReviewId/adapter-worker-artifact-integration', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedEditExecutionAdapterWorkerArtifactIntegrationSchema, request.body)
    const result = await createApprovedEditExecutionPackageService(getServiceContext(request)).createAdapterWorkerArtifactIntegration({
      ...body,
      privateMediaRunnerQaReviewId: getRouteParam(request, 'privateMediaRunnerQaReviewId'),
      idempotencyKey: getIdempotencyKey(request),
      requestPath: request.originalUrl,
    })
    sendOk(response, { adapterWorkerArtifactIntegration: result.adapterWorkerArtifactIntegration }, result.warnings, 201)
  }))

  router.post('/v1/edit-executions/private-internal-test-runs', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedEditExecutionPrivateInternalTestRunSchema, request.body)
    const idempotencyKey = getIdempotencyKey(request)
    const stageKey = (stage: string) => `${idempotencyKey}:${stage}`
    const requestPath = (stage: string) => `${request.originalUrl}#${stage}`
    const service = createApprovedEditExecutionPackageService(getServiceContext(request))
    const warnings: string[] = []
    const backendAdapterIntegrationCandidates = resolvePrivateInternalAdapterIntegrationCandidates(body.requestedAdapterToolNames)

    const packageResult = await service.createPackage({
      workspaceId: body.workspaceId,
      projectId: body.projectId,
      approvedPlanSnapshotId: body.approvedPlanSnapshotId,
      approvedSnapshot: body.approvedSnapshot,
      creditReservationId: body.creditReservationId,
      requestedAdapterToolNames: body.requestedAdapterToolNames,
      packageReadyToolIds: [],
      modelWeightApprovedToolIds: [],
      idempotencyKey: stageKey('package'),
      requestPath: requestPath('package'),
    })
    warnings.push(...packageResult.warnings)

    const jobBatchResult = await service.createJobBatchPlan({
      packageRecordId: packageResult.approvedEditExecutionPackage.packageRecordId,
      workspaceId: body.workspaceId,
      projectId: body.projectId,
      creditReservationId: body.creditReservationId,
      dryRunOnly: true,
      idempotencyKey: stageKey('job-batch-plan'),
      requestPath: requestPath('job-batch-plan'),
    })
    warnings.push(...jobBatchResult.warnings)

    const mockQueueResult = await service.createMockQueue({
      jobBatchPlanId: jobBatchResult.jobBatchPlan.id,
      workspaceId: body.workspaceId,
      projectId: body.projectId,
      creditReservationId: body.creditReservationId,
      mockQueueOnly: true,
      idempotencyKey: stageKey('mock-queue'),
      requestPath: requestPath('mock-queue'),
    })
    warnings.push(...mockQueueResult.warnings)

    const dispatchReadinessResult = await service.createDispatchReadiness({
      mockQueueId: mockQueueResult.mockQueue.id,
      workspaceId: body.workspaceId,
      projectId: body.projectId,
      creditReservationId: body.creditReservationId,
      dryRunOnly: true,
      idempotencyKey: stageKey('dispatch-readiness'),
      requestPath: requestPath('dispatch-readiness'),
    })
    warnings.push(...dispatchReadinessResult.warnings)

    const mockWorkerClaimsResult = await service.createMockWorkerClaims({
      dispatchReadinessId: dispatchReadinessResult.dispatchReadiness.id,
      workspaceId: body.workspaceId,
      projectId: body.projectId,
      creditReservationId: body.creditReservationId,
      mockClaimsOnly: true,
      idempotencyKey: stageKey('mock-worker-claims'),
      requestPath: requestPath('mock-worker-claims'),
    })
    warnings.push(...mockWorkerClaimsResult.warnings)

    const handlerDryRunResult = await service.createHandlerDryRun({
      mockWorkerClaimsId: mockWorkerClaimsResult.mockWorkerClaims.id,
      workspaceId: body.workspaceId,
      projectId: body.projectId,
      creditReservationId: body.creditReservationId,
      handlerDryRunOnly: true,
      idempotencyKey: stageKey('handler-dry-run'),
      requestPath: requestPath('handler-dry-run'),
    })
    warnings.push(...handlerDryRunResult.warnings)

    const resultReconciliationResult = await service.createResultReconciliation({
      handlerDryRunId: handlerDryRunResult.handlerDryRun.id,
      workspaceId: body.workspaceId,
      projectId: body.projectId,
      creditReservationId: body.creditReservationId,
      reconcileDryRunOnly: true,
      idempotencyKey: stageKey('result-reconciliation'),
      requestPath: requestPath('result-reconciliation'),
    })
    warnings.push(...resultReconciliationResult.warnings)

    const localWorkerOutputResult = await service.createLocalWorkerOutput({
      resultReconciliationId: resultReconciliationResult.resultReconciliation.id,
      workspaceId: body.workspaceId,
      projectId: body.projectId,
      creditReservationId: body.creditReservationId,
      localOutputOnly: true,
      idempotencyKey: stageKey('local-worker-output'),
      requestPath: requestPath('local-worker-output'),
    })
    warnings.push(...localWorkerOutputResult.warnings)

    const localWorkerOutputQaResult = await service.createLocalWorkerOutputQaReview({
      localWorkerOutputId: localWorkerOutputResult.localWorkerOutput.id,
      workspaceId: body.workspaceId,
      projectId: body.projectId,
      creditReservationId: body.creditReservationId,
      qaReviewOnly: true,
      idempotencyKey: stageKey('local-worker-output-qa'),
      requestPath: requestPath('local-worker-output-qa'),
    })
    warnings.push(...localWorkerOutputQaResult.warnings)

    const workflowRehearsalResult = await service.createWorkflowRehearsal({
      localWorkerOutputId: localWorkerOutputResult.localWorkerOutput.id,
      workspaceId: body.workspaceId,
      projectId: body.projectId,
      creditReservationId: body.creditReservationId,
      rehearsalOnly: true,
      idempotencyKey: stageKey('workflow-rehearsal'),
      requestPath: requestPath('workflow-rehearsal'),
    })
    warnings.push(...workflowRehearsalResult.warnings)

    const uploadedMediaWorkerExecutionResult = await service.createUploadedMediaWorkerExecution({
      workflowRehearsalId: workflowRehearsalResult.workflowRehearsal.id,
      localWorkerOutputId: localWorkerOutputResult.localWorkerOutput.id,
      localWorkerOutputQaReviewId: localWorkerOutputQaResult.localWorkerOutputQaReview.id,
      workspaceId: body.workspaceId,
      projectId: body.projectId,
      creditReservationId: body.creditReservationId,
      uploadedMediaExecutionOnly: true,
      sourceMediaAssets: body.sourceMediaAssets,
      idempotencyKey: stageKey('uploaded-media-worker-execution'),
      requestPath: requestPath('uploaded-media-worker-execution'),
    })
    warnings.push(...uploadedMediaWorkerExecutionResult.warnings)

    const privateWorkerArtifactQaResult = await service.createPrivateWorkerArtifactQaReview({
      uploadedMediaWorkerExecutionId: uploadedMediaWorkerExecutionResult.uploadedMediaWorkerExecution.id,
      workspaceId: body.workspaceId,
      projectId: body.projectId,
      creditReservationId: body.creditReservationId,
      qaReviewOnly: true,
      idempotencyKey: stageKey('private-worker-artifact-qa'),
      requestPath: requestPath('private-worker-artifact-qa'),
    })
    warnings.push(...privateWorkerArtifactQaResult.warnings)

    const localMediaProcessingResult = await service.createLocalMediaProcessingExecution({
      privateWorkerArtifactQaReviewId: privateWorkerArtifactQaResult.privateWorkerArtifactQaReview.id,
      workspaceId: body.workspaceId,
      projectId: body.projectId,
      creditReservationId: body.creditReservationId,
      processingExecutionOnly: true,
      processingMode: body.processingMode,
      maxDurationSeconds: body.maxDurationSeconds,
      targetWidth: body.targetWidth,
      targetHeight: body.targetHeight,
      fps: body.fps,
      idempotencyKey: stageKey('local-media-processing'),
      requestPath: requestPath('local-media-processing'),
    })
    warnings.push(...localMediaProcessingResult.warnings)

    const privateMediaArtifactQaResult = await service.createPrivateMediaArtifactQaReview({
      localMediaProcessingExecutionId: localMediaProcessingResult.localMediaProcessingExecution.id,
      workspaceId: body.workspaceId,
      projectId: body.projectId,
      creditReservationId: body.creditReservationId,
      qaReviewOnly: true,
      idempotencyKey: stageKey('private-media-artifact-qa'),
      requestPath: requestPath('private-media-artifact-qa'),
    })
    warnings.push(...privateMediaArtifactQaResult.warnings)

    let adapterSourceTruthReviewId: string | null = null
    let adapterIntegrationPackageRecordId: string | null = null
    let adapterBoundedExecutionRunId: string | null = null
    let adapterRegisteredRunnerRunId: string | null = null
    let adapterPrivateMediaRunnerRunId: string | null = null
    let adapterPrivateMediaRunnerQaReviewId: string | null = null
    let adapterWorkerArtifactIntegrationId: string | null = null
    let adapterWorkerArtifactIntegratedActivityCount = 0
    let adapterWorkerArtifactIntegratedToolNames: string[] = []
    let adapterActualToolPackageExecutionCount = 0
    let adapterIntegrationStatus = backendAdapterIntegrationCandidates.length
      ? 'backend_adapter_integration_candidates_selected'
      : 'no_backend_adapter_integration_candidates'
    const adapterIntegrationBlockers: string[] = []

    if (backendAdapterIntegrationCandidates.length) {
      try {
        const adapterIntegrationPackageResult = await service.createPackage({
          workspaceId: body.workspaceId,
          projectId: body.projectId,
          approvedPlanSnapshotId: body.approvedPlanSnapshotId,
          approvedSnapshot: body.approvedSnapshot,
          creditReservationId: body.creditReservationId,
          requestedAdapterToolNames: backendAdapterIntegrationCandidates.map((candidate) => candidate.requestedToolName),
          adapterCandidateScope: 'requested_only',
          packageReadyToolIds: [],
          modelWeightApprovedToolIds: [],
          idempotencyKey: stageKey('backend-adapter-integration-package'),
          requestPath: requestPath('backend-adapter-integration-package'),
        })
        warnings.push(...adapterIntegrationPackageResult.warnings)
        adapterIntegrationPackageRecordId = adapterIntegrationPackageResult.approvedEditExecutionPackage.packageRecordId

        const checkedAt = adapterIntegrationPackageResult.approvedEditExecutionPackage.createdAt
        const adapterSourceTruthReviewResult = await service.reviewBoundedAdapterSourceTruth({
          packageRecordId: adapterIntegrationPackageResult.approvedEditExecutionPackage.packageRecordId,
          workspaceId: body.workspaceId,
          projectId: body.projectId,
          creditReservationId: body.creditReservationId,
          privateArtifactRefs: body.sourceMediaAssets.map((asset) => ({
            artifactId: asset.mediaAssetId,
            assetType: 'uploaded_source_media',
            storageProvider: asset.storageProvider,
            storageObjectPath: asset.storagePath,
            sourceOfTruth: true,
            privateArtifact: true,
            publicArtifact: false,
            signedUrl: null,
            byteSize: asset.byteSize,
            checksumSha256: asset.checksumSha256,
            uploadedOrder: asset.uploadedOrder,
          })),
          packageReadinessEvidence: backendAdapterIntegrationCandidates.map((candidate) => ({
            toolId: candidate.canonicalToolId,
            status: 'passed',
            source: 'owner_approved_source_truth',
            evidenceId: `private-internal-adapter-source-truth-${candidate.canonicalToolId}`,
            checkedAt,
            summary: `${candidate.userFacingActivity} is selected from backend-owned adapter contracts for registered runner import probing; the import probe remains the package availability authority.`,
          })),
          modelWeightApprovals: [],
          idempotencyKey: stageKey('backend-adapter-source-truth-review'),
          requestPath: requestPath('backend-adapter-source-truth-review'),
        })
        warnings.push(...adapterSourceTruthReviewResult.warnings)
        adapterSourceTruthReviewId = adapterSourceTruthReviewResult.sourceTruthReview.id

        if (adapterSourceTruthReviewResult.sourceTruthReview.status !== 'ready_for_bounded_execution') {
          adapterIntegrationStatus = 'backend_adapter_source_truth_blocked'
          adapterIntegrationBlockers.push(...adapterSourceTruthReviewResult.sourceTruthReview.blockers)
        } else {
          const adapterExecutionRunResult = await service.createBoundedAdapterExecutionRun({
            packageRecordId: adapterIntegrationPackageResult.approvedEditExecutionPackage.packageRecordId,
            workspaceId: body.workspaceId,
            projectId: body.projectId,
            creditReservationId: body.creditReservationId,
            handoffOnly: true,
            idempotencyKey: stageKey('backend-adapter-bounded-execution-run'),
            requestPath: requestPath('backend-adapter-bounded-execution-run'),
          })
          warnings.push(...adapterExecutionRunResult.warnings)
          adapterBoundedExecutionRunId = adapterExecutionRunResult.boundedAdapterExecutionRun.id

          const adapterRegisteredRunnerResult = await service.runRegisteredAdapterRunners({
            boundedAdapterExecutionRunId: adapterExecutionRunResult.boundedAdapterExecutionRun.id,
            workspaceId: body.workspaceId,
            projectId: body.projectId,
            importProbeOnly: true,
            idempotencyKey: stageKey('backend-adapter-registered-runner-probe'),
            requestPath: requestPath('backend-adapter-registered-runner-probe'),
          })
          warnings.push(...adapterRegisteredRunnerResult.warnings)
          adapterRegisteredRunnerRunId = adapterRegisteredRunnerResult.registeredRunnerRun.id

          if (adapterRegisteredRunnerResult.registeredRunnerRun.status !== 'completed_import_probe') {
            adapterIntegrationBlockers.push(...adapterRegisteredRunnerResult.registeredRunnerRun.blockers)
          }

          if (adapterRegisteredRunnerResult.registeredRunnerRun.completedImportProbeCount < 1) {
            adapterIntegrationStatus = 'backend_adapter_registered_runner_probe_blocked'
          } else {
            const adapterPrivateRunnerResult = await service.runRegisteredAdapterPrivateMediaRunner({
              registeredRunnerRunId: adapterRegisteredRunnerResult.registeredRunnerRun.id,
              workspaceId: body.workspaceId,
              projectId: body.projectId,
              creditReservationId: body.creditReservationId,
              privateMediaExecutionOnly: true,
              idempotencyKey: stageKey('backend-adapter-private-runner'),
              requestPath: requestPath('backend-adapter-private-runner'),
            })
            warnings.push(...adapterPrivateRunnerResult.warnings)
            adapterPrivateMediaRunnerRunId = adapterPrivateRunnerResult.privateMediaRunnerRun.id

            const adapterPrivateRunnerQaResult = await service.reviewRegisteredAdapterPrivateMediaRunnerQa({
              privateMediaRunnerRunId: adapterPrivateRunnerResult.privateMediaRunnerRun.id,
              workspaceId: body.workspaceId,
              projectId: body.projectId,
              creditReservationId: body.creditReservationId,
              qaReviewOnly: true,
              idempotencyKey: stageKey('backend-adapter-private-runner-qa'),
              requestPath: requestPath('backend-adapter-private-runner-qa'),
            })
            warnings.push(...adapterPrivateRunnerQaResult.warnings)
            adapterPrivateMediaRunnerQaReviewId = adapterPrivateRunnerQaResult.privateMediaRunnerQaReview.id
            adapterActualToolPackageExecutionCount = adapterPrivateRunnerQaResult.privateMediaRunnerQaReview.actualToolPackageExecutionCount

            const adapterWorkerArtifactIntegrationResult = await service.createAdapterWorkerArtifactIntegration({
              privateMediaRunnerQaReviewId: adapterPrivateRunnerQaResult.privateMediaRunnerQaReview.id,
              workspaceId: body.workspaceId,
              projectId: body.projectId,
              creditReservationId: body.creditReservationId,
              integrationOnly: true,
              idempotencyKey: stageKey('backend-adapter-worker-artifact-integration'),
              requestPath: requestPath('backend-adapter-worker-artifact-integration'),
            })
            warnings.push(...adapterWorkerArtifactIntegrationResult.warnings)
            adapterWorkerArtifactIntegrationId = adapterWorkerArtifactIntegrationResult.adapterWorkerArtifactIntegration.id
            adapterWorkerArtifactIntegratedActivityCount = adapterWorkerArtifactIntegrationResult.adapterWorkerArtifactIntegration.integratedArtifactCount
            adapterWorkerArtifactIntegratedToolNames = adapterWorkerArtifactIntegrationResult.adapterWorkerArtifactIntegration.artifacts.map((artifact) => artifact.canonicalToolId)
            adapterIntegrationStatus = adapterIntegrationBlockers.length
              ? 'backend_adapter_worker_artifacts_partially_integrated_for_private_render'
              : 'backend_adapter_worker_artifacts_integrated_for_private_render'
          }
        }
      } catch (error) {
        adapterIntegrationStatus = 'backend_adapter_integration_blocked'
        adapterIntegrationBlockers.push(error instanceof Error ? error.message : String(error))
        warnings.push(`Backend adapter artifact integration was skipped for this private internal test run: ${adapterIntegrationBlockers.at(-1)}`)
      }
    }

    const renderPreviewAssemblyResult = await service.createRenderPreviewAssembly({
      privateMediaArtifactQaReviewId: privateMediaArtifactQaResult.privateMediaArtifactQaReview.id,
      workspaceId: body.workspaceId,
      projectId: body.projectId,
      creditReservationId: body.creditReservationId,
      assemblyOnly: true,
      ...(adapterWorkerArtifactIntegrationId && adapterPrivateMediaRunnerQaReviewId
        ? {
            adapterWorkerArtifactIntegrationId,
            privateMediaRunnerQaReviewId: adapterPrivateMediaRunnerQaReviewId,
          }
        : {}),
      idempotencyKey: stageKey('render-preview-assembly'),
      requestPath: requestPath('render-preview-assembly'),
    })
    warnings.push(...renderPreviewAssemblyResult.warnings)

    const userPreviewReviewResult = await service.createUserPreviewReview({
      renderPreviewAssemblyId: renderPreviewAssemblyResult.renderPreviewAssembly.id,
      workspaceId: body.workspaceId,
      projectId: body.projectId,
      creditReservationId: body.creditReservationId,
      reviewOnly: true,
      reviewDecision: 'approved_for_final_render_readiness',
      reviewerNote: body.reviewerNote,
      idempotencyKey: stageKey('user-preview-review'),
      requestPath: requestPath('user-preview-review'),
    })
    warnings.push(...userPreviewReviewResult.warnings)

    const finalRenderReadinessResult = await service.createFinalRenderReadinessReview({
      userPreviewReviewId: userPreviewReviewResult.userPreviewReview.id,
      workspaceId: body.workspaceId,
      projectId: body.projectId,
      creditReservationId: body.creditReservationId,
      readinessReviewOnly: true,
      idempotencyKey: stageKey('final-render-readiness'),
      requestPath: requestPath('final-render-readiness'),
    })
    warnings.push(...finalRenderReadinessResult.warnings)

    const finalRenderExecutionResult = await service.createFinalRenderExecution({
      finalRenderReadinessReviewId: finalRenderReadinessResult.finalRenderReadinessReview.id,
      workspaceId: body.workspaceId,
      projectId: body.projectId,
      creditReservationId: body.creditReservationId,
      renderExecutionOnly: true,
      idempotencyKey: stageKey('final-render-execution'),
      requestPath: requestPath('final-render-execution'),
    })
    warnings.push(...finalRenderExecutionResult.warnings)

    const finalDeliveryQaResult = await service.createFinalDeliveryQaReview({
      finalRenderExecutionId: finalRenderExecutionResult.finalRenderExecution.id,
      workspaceId: body.workspaceId,
      projectId: body.projectId,
      creditReservationId: body.creditReservationId,
      qaReviewOnly: true,
      idempotencyKey: stageKey('final-delivery-qa'),
      requestPath: requestPath('final-delivery-qa'),
    })
    warnings.push(...finalDeliveryQaResult.warnings)

    const privateInternalDownloadResult = await service.createPrivateInternalDownloadDelivery({
      finalDeliveryQaReviewId: finalDeliveryQaResult.finalDeliveryQaReview.id,
      workspaceId: body.workspaceId,
      projectId: body.projectId,
      creditReservationId: body.creditReservationId,
      deliveryOnly: true,
      idempotencyKey: stageKey('private-internal-download'),
      requestPath: requestPath('private-internal-download'),
    })
    warnings.push(...privateInternalDownloadResult.warnings)

    const adapterOrchestrationPlan = packageResult.approvedEditExecutionPackage.adapterOrchestrationPlan
    const backendIntegrationPendingActivityCount = Math.max(
      0,
      packageResult.approvedEditExecutionPackage.resolvedAdapterToolCount - adapterWorkerArtifactIntegratedActivityCount,
    )
    const adapterGateSummary = {
      status: adapterOrchestrationPlan?.status ?? 'no_adapter_plan_required',
      executionMode: 'private_internal_dry_run_and_local_fallback',
      requestedActivityCount: packageResult.approvedEditExecutionPackage.requestedAdapterToolNames.length,
      resolvedActivityCount: packageResult.approvedEditExecutionPackage.resolvedAdapterToolCount,
      readyActivityCount: [
        ...(adapterOrchestrationPlan?.editAdapterPlan?.tools ?? []),
        ...(adapterOrchestrationPlan?.readinessPlan?.tools ?? []),
      ].filter((tool) => tool.status === 'ready').length,
      blockedActivityCount: adapterOrchestrationPlan?.blockers.length ?? 0,
      editActivityCount: adapterOrchestrationPlan?.editAdapterPlan?.resolvedToolCount ?? 0,
      readinessCheckCount: adapterOrchestrationPlan?.readinessPlan?.resolvedToolCount ?? 0,
      toolsExecutedCount: adapterActualToolPackageExecutionCount,
      fullToolExecutionReady: false,
      privateFallbackReviewOnly: true,
      privateRenderIntegrationStatus: adapterIntegrationStatus,
      privateRenderIntegrationReady: Boolean(adapterWorkerArtifactIntegrationId),
      privateRenderIntegratedActivityCount: adapterWorkerArtifactIntegratedActivityCount,
      backendIntegrationCandidateCount: backendAdapterIntegrationCandidates.length,
      backendIntegrationPendingActivityCount,
      backendIntegrationBlockedActivityCount: adapterIntegrationBlockers.length > 0
        ? backendIntegrationPendingActivityCount
        : 0,
      backendIntegrationBlockers: adapterIntegrationBlockers,
      clientReadinessHintsTrusted: false,
      serverSourceTruthRequiredForFullExecution: true,
      frontendExecutionAllowed: false,
      productReady: false,
      userFacingSummary: adapterOrchestrationPlan?.userFacingSummary ??
        'No extra approved edit activity adapters were needed for this internal run.',
      noRuntimeSideEffects: [
        ...(adapterOrchestrationPlan?.noRuntimeSideEffects ?? []),
        'Client-supplied package/model readiness hints are ignored as source truth for private internal runs.',
        'Backend source-truth evidence is required before bounded/full advanced tool worker execution.',
      ],
    }
    const adapterActivityGroups = buildPrivateInternalAdapterActivityGroups({
      requestedToolNames: packageResult.approvedEditExecutionPackage.requestedAdapterToolNames,
      integratedToolNames: adapterWorkerArtifactIntegratedToolNames,
      integrationBlocked: adapterIntegrationBlockers.length > 0,
    })
    const privateInternalNextRequiredGate = adapterIntegrationBlockers.length > 0
      ? 'backend_adapter_runtime_evidence_before_external_beta_or_production_release'
      : 'external_beta_or_production_release_gates'

    sendOk(response, {
      internalTestRun: {
        id: `private-internal-test-run:${privateInternalDownloadResult.privateInternalDownloadDelivery.id}`,
        workspaceId: body.workspaceId,
        projectId: body.projectId,
        approvedPlanSnapshotId: body.approvedPlanSnapshotId,
        creditReservationId: body.creditReservationId,
        status: 'private_internal_test_run_completed_ready_for_download',
        internalTestRunOnly: true,
        sourceMediaAssetCount: body.sourceMediaAssets.length,
        adapterGateSummary: {
          ...adapterGateSummary,
          activityGroups: adapterActivityGroups,
        },
        stageIds: {
          packageRecordId: packageResult.approvedEditExecutionPackage.packageRecordId,
          jobBatchPlanId: jobBatchResult.jobBatchPlan.id,
          mockQueueId: mockQueueResult.mockQueue.id,
          dispatchReadinessId: dispatchReadinessResult.dispatchReadiness.id,
          mockWorkerClaimsId: mockWorkerClaimsResult.mockWorkerClaims.id,
          handlerDryRunId: handlerDryRunResult.handlerDryRun.id,
          resultReconciliationId: resultReconciliationResult.resultReconciliation.id,
          localWorkerOutputId: localWorkerOutputResult.localWorkerOutput.id,
          localWorkerOutputQaReviewId: localWorkerOutputQaResult.localWorkerOutputQaReview.id,
          workflowRehearsalId: workflowRehearsalResult.workflowRehearsal.id,
          uploadedMediaWorkerExecutionId: uploadedMediaWorkerExecutionResult.uploadedMediaWorkerExecution.id,
          privateWorkerArtifactQaReviewId: privateWorkerArtifactQaResult.privateWorkerArtifactQaReview.id,
          adapterIntegrationPackageRecordId,
          adapterSourceTruthReviewId,
          adapterBoundedExecutionRunId,
          adapterRegisteredRunnerRunId,
          adapterPrivateMediaRunnerRunId,
          adapterPrivateMediaRunnerQaReviewId,
          adapterWorkerArtifactIntegrationId,
          localMediaProcessingExecutionId: localMediaProcessingResult.localMediaProcessingExecution.id,
          privateMediaArtifactQaReviewId: privateMediaArtifactQaResult.privateMediaArtifactQaReview.id,
          renderPreviewAssemblyId: renderPreviewAssemblyResult.renderPreviewAssembly.id,
          userPreviewReviewId: userPreviewReviewResult.userPreviewReview.id,
          finalRenderReadinessReviewId: finalRenderReadinessResult.finalRenderReadinessReview.id,
          finalRenderExecutionId: finalRenderExecutionResult.finalRenderExecution.id,
          finalDeliveryQaReviewId: finalDeliveryQaResult.finalDeliveryQaReview.id,
          privateInternalDownloadDeliveryId: privateInternalDownloadResult.privateInternalDownloadDelivery.id,
        },
        finalDeliveryQaReview: finalDeliveryQaResult.finalDeliveryQaReview,
        privateInternalDownloadDelivery: privateInternalDownloadResult.privateInternalDownloadDelivery,
        privateInternalDownloadPath: privateInternalDownloadResult.privateInternalDownloadDelivery.internalDownloadPath,
        privateInternalManifestPath: privateInternalDownloadResult.privateInternalDownloadDelivery.internalManifestPath,
        finalRenderArtifact: privateInternalDownloadResult.privateInternalDownloadDelivery.finalRenderArtifact,
        publicDeliveryReady: privateInternalDownloadResult.privateInternalDownloadDelivery.publicDeliveryReady,
        externalBetaReady: privateInternalDownloadResult.privateInternalDownloadDelivery.externalBetaReady,
        productionReady: privateInternalDownloadResult.privateInternalDownloadDelivery.productionReady,
        nextRequiredGate: privateInternalNextRequiredGate,
        userFacingSummary: 'Your approved edit has completed a private internal review render and is ready to download. Bounded backend package checks may be attached; media-transform workers remain gated.',
        noRuntimeSideEffects: [
          'The internal test run used approved snapshot and credit reservation metadata for every stage.',
          'Adapter activity was source-truth checked and may include bounded backend package evidence; full media-transform worker execution remains gated until backend runtime evidence passes.',
          'No public artifact, signed URL, Supabase/GCS write, external beta release, production release, provider call, or billing mutation occurred.',
        ],
      },
    }, [
      ...warnings,
      'Private internal test run completed through final delivery QA and authenticated local fallback download readiness only.',
    ], 201)
  }))

  router.post('/v1/edit-executions/packages/:packageRecordId/job-batch-plan', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedEditExecutionJobBatchPlanSchema, request.body)
    const result = await createApprovedEditExecutionPackageService(getServiceContext(request)).createJobBatchPlan({
      ...body,
      packageRecordId: getRouteParam(request, 'packageRecordId'),
      idempotencyKey: getIdempotencyKey(request),
      requestPath: request.originalUrl,
    })
    sendOk(response, { jobBatchPlan: result.jobBatchPlan }, result.warnings, 201)
  }))

  router.post('/v1/edit-executions/job-batch-plans/:jobBatchPlanId/mock-queue', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedEditExecutionMockQueueSchema, request.body)
    const result = await createApprovedEditExecutionPackageService(getServiceContext(request)).createMockQueue({
      ...body,
      jobBatchPlanId: getRouteParam(request, 'jobBatchPlanId'),
      idempotencyKey: getIdempotencyKey(request),
      requestPath: request.originalUrl,
    })
    sendOk(response, { mockQueue: result.mockQueue }, result.warnings, 201)
  }))

  router.post('/v1/edit-executions/mock-queues/:mockQueueId/dispatch-readiness', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedEditExecutionDispatchReadinessSchema, request.body)
    const result = await createApprovedEditExecutionPackageService(getServiceContext(request)).createDispatchReadiness({
      ...body,
      mockQueueId: getRouteParam(request, 'mockQueueId'),
      idempotencyKey: getIdempotencyKey(request),
      requestPath: request.originalUrl,
    })
    sendOk(response, { dispatchReadiness: result.dispatchReadiness }, result.warnings, 201)
  }))

  router.post('/v1/edit-executions/dispatch-readiness/:dispatchReadinessId/mock-worker-claims', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedEditExecutionMockWorkerClaimsSchema, request.body)
    const result = await createApprovedEditExecutionPackageService(getServiceContext(request)).createMockWorkerClaims({
      ...body,
      dispatchReadinessId: getRouteParam(request, 'dispatchReadinessId'),
      idempotencyKey: getIdempotencyKey(request),
      requestPath: request.originalUrl,
    })
    sendOk(response, { mockWorkerClaims: result.mockWorkerClaims }, result.warnings, 201)
  }))

  router.post('/v1/edit-executions/mock-worker-claims/:mockWorkerClaimsId/handler-dry-run', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedEditExecutionHandlerDryRunSchema, request.body)
    const result = await createApprovedEditExecutionPackageService(getServiceContext(request)).createHandlerDryRun({
      ...body,
      mockWorkerClaimsId: getRouteParam(request, 'mockWorkerClaimsId'),
      idempotencyKey: getIdempotencyKey(request),
      requestPath: request.originalUrl,
    })
    sendOk(response, { handlerDryRun: result.handlerDryRun }, result.warnings, 201)
  }))

  router.post('/v1/edit-executions/handler-dry-runs/:handlerDryRunId/result-reconciliation', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedEditExecutionResultReconciliationSchema, request.body)
    const result = await createApprovedEditExecutionPackageService(getServiceContext(request)).createResultReconciliation({
      ...body,
      handlerDryRunId: getRouteParam(request, 'handlerDryRunId'),
      idempotencyKey: getIdempotencyKey(request),
      requestPath: request.originalUrl,
    })
    sendOk(response, { resultReconciliation: result.resultReconciliation }, result.warnings, 201)
  }))

  router.post('/v1/edit-executions/result-reconciliations/:resultReconciliationId/local-worker-output', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedEditExecutionLocalWorkerOutputSchema, request.body)
    const result = await createApprovedEditExecutionPackageService(getServiceContext(request)).createLocalWorkerOutput({
      ...body,
      resultReconciliationId: getRouteParam(request, 'resultReconciliationId'),
      idempotencyKey: getIdempotencyKey(request),
      requestPath: request.originalUrl,
    })
    sendOk(response, { localWorkerOutput: result.localWorkerOutput }, result.warnings, 201)
  }))

  router.post('/v1/edit-executions/local-worker-outputs/:localWorkerOutputId/qa-review', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedEditExecutionLocalWorkerOutputQaReviewSchema, request.body)
    const result = await createApprovedEditExecutionPackageService(getServiceContext(request)).createLocalWorkerOutputQaReview({
      ...body,
      localWorkerOutputId: getRouteParam(request, 'localWorkerOutputId'),
      idempotencyKey: getIdempotencyKey(request),
      requestPath: request.originalUrl,
    })
    sendOk(response, { localWorkerOutputQaReview: result.localWorkerOutputQaReview }, result.warnings, 201)
  }))

  router.post('/v1/edit-executions/local-worker-outputs/:localWorkerOutputId/workflow-rehearsal', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedEditExecutionWorkflowRehearsalSchema, request.body)
    const result = await createApprovedEditExecutionPackageService(getServiceContext(request)).createWorkflowRehearsal({
      ...body,
      localWorkerOutputId: getRouteParam(request, 'localWorkerOutputId'),
      idempotencyKey: getIdempotencyKey(request),
      requestPath: request.originalUrl,
    })
    sendOk(response, { workflowRehearsal: result.workflowRehearsal }, result.warnings, 201)
  }))

  router.post('/v1/edit-executions/workflow-rehearsals/:workflowRehearsalId/uploaded-media-worker-execution', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedEditExecutionUploadedMediaWorkerExecutionSchema, request.body)
    const result = await createApprovedEditExecutionPackageService(getServiceContext(request)).createUploadedMediaWorkerExecution({
      ...body,
      workflowRehearsalId: getRouteParam(request, 'workflowRehearsalId'),
      idempotencyKey: getIdempotencyKey(request),
      requestPath: request.originalUrl,
    })
    sendOk(response, { uploadedMediaWorkerExecution: result.uploadedMediaWorkerExecution }, result.warnings, 201)
  }))

  router.post('/v1/edit-executions/uploaded-media-worker-executions/:uploadedMediaWorkerExecutionId/private-artifact-qa-review', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedEditExecutionPrivateWorkerArtifactQaReviewSchema, request.body)
    const result = await createApprovedEditExecutionPackageService(getServiceContext(request)).createPrivateWorkerArtifactQaReview({
      ...body,
      uploadedMediaWorkerExecutionId: getRouteParam(request, 'uploadedMediaWorkerExecutionId'),
      idempotencyKey: getIdempotencyKey(request),
      requestPath: request.originalUrl,
    })
    sendOk(response, { privateWorkerArtifactQaReview: result.privateWorkerArtifactQaReview }, result.warnings, 201)
  }))

  router.post('/v1/edit-executions/private-worker-artifact-qa-reviews/:privateWorkerArtifactQaReviewId/local-media-processing-execution', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedEditExecutionLocalMediaProcessingExecutionSchema, request.body)
    const result = await createApprovedEditExecutionPackageService(getServiceContext(request)).createLocalMediaProcessingExecution({
      ...body,
      privateWorkerArtifactQaReviewId: getRouteParam(request, 'privateWorkerArtifactQaReviewId'),
      idempotencyKey: getIdempotencyKey(request),
      requestPath: request.originalUrl,
    })
    sendOk(response, { localMediaProcessingExecution: result.localMediaProcessingExecution }, result.warnings, 201)
  }))

  router.post('/v1/edit-executions/local-media-processing-executions/:localMediaProcessingExecutionId/private-media-artifact-qa-review', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedEditExecutionPrivateMediaArtifactQaReviewSchema, request.body)
    const result = await createApprovedEditExecutionPackageService(getServiceContext(request)).createPrivateMediaArtifactQaReview({
      ...body,
      localMediaProcessingExecutionId: getRouteParam(request, 'localMediaProcessingExecutionId'),
      idempotencyKey: getIdempotencyKey(request),
      requestPath: request.originalUrl,
    })
    sendOk(response, { privateMediaArtifactQaReview: result.privateMediaArtifactQaReview }, result.warnings, 201)
  }))

  router.post('/v1/edit-executions/private-media-artifact-qa-reviews/:privateMediaArtifactQaReviewId/render-preview-assembly', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedEditExecutionRenderPreviewAssemblySchema, request.body)
    const result = await createApprovedEditExecutionPackageService(getServiceContext(request)).createRenderPreviewAssembly({
      ...body,
      privateMediaArtifactQaReviewId: getRouteParam(request, 'privateMediaArtifactQaReviewId'),
      idempotencyKey: getIdempotencyKey(request),
      requestPath: request.originalUrl,
    })
    sendOk(response, { renderPreviewAssembly: stripServerLocalPaths(result.renderPreviewAssembly) }, result.warnings, 201)
  }))

  router.post('/v1/edit-executions/user-preview-reviews/:userPreviewReviewId/final-render-readiness-review', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedEditExecutionFinalRenderReadinessReviewSchema, request.body)
    const result = await createApprovedEditExecutionPackageService(getServiceContext(request)).createFinalRenderReadinessReview({
      ...body,
      userPreviewReviewId: getRouteParam(request, 'userPreviewReviewId'),
      idempotencyKey: getIdempotencyKey(request),
      requestPath: request.originalUrl,
    })
    sendOk(response, { finalRenderReadinessReview: result.finalRenderReadinessReview }, result.warnings, 201)
  }))

  router.post('/v1/edit-executions/final-render-readiness-reviews/:finalRenderReadinessReviewId/final-render-execution', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedEditExecutionFinalRenderExecutionSchema, request.body)
    const result = await createApprovedEditExecutionPackageService(getServiceContext(request)).createFinalRenderExecution({
      ...body,
      finalRenderReadinessReviewId: getRouteParam(request, 'finalRenderReadinessReviewId'),
      idempotencyKey: getIdempotencyKey(request),
      requestPath: request.originalUrl,
    })
    sendOk(response, { finalRenderExecution: result.finalRenderExecution }, result.warnings, 201)
  }))

  router.post('/v1/edit-executions/final-render-executions/:finalRenderExecutionId/final-delivery-qa-review', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedEditExecutionFinalDeliveryQaReviewSchema, request.body)
    const result = await createApprovedEditExecutionPackageService(getServiceContext(request)).createFinalDeliveryQaReview({
      ...body,
      finalRenderExecutionId: getRouteParam(request, 'finalRenderExecutionId'),
      idempotencyKey: getIdempotencyKey(request),
      requestPath: request.originalUrl,
    })
    sendOk(response, { finalDeliveryQaReview: result.finalDeliveryQaReview }, result.warnings, 201)
  }))

  router.post('/v1/edit-executions/final-delivery-qa-reviews/:finalDeliveryQaReviewId/private-internal-download-delivery', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedEditExecutionPrivateInternalDownloadDeliverySchema, request.body)
    const result = await createApprovedEditExecutionPackageService(getServiceContext(request)).createPrivateInternalDownloadDelivery({
      ...body,
      finalDeliveryQaReviewId: getRouteParam(request, 'finalDeliveryQaReviewId'),
      idempotencyKey: getIdempotencyKey(request),
      requestPath: request.originalUrl,
    })
    sendOk(response, { privateInternalDownloadDelivery: result.privateInternalDownloadDelivery }, result.warnings, 201)
  }))

  return router
}

function registerEditExecutionUserRoutes(router: Router): void {
  router.get('/v1/edit-executions/canonical-private-final-artifacts/:artifactId/file', requireAuth, asyncRoute(async (request, response) => {
    const query = validateBody(canonicalPrivateFinalArtifactDownloadQuerySchema, request.query)
    const file = await createCanonicalPrivateFinalArtifactDownloadService(getServiceContext(request)).read({
      ...query,
      artifactId: getRouteParam(request, 'artifactId'),
    })
    response.status(200)
    response.setHeader('content-type', file.mimeType)
    response.setHeader('content-length', String(file.byteSize))
    response.setHeader('content-disposition', `attachment; filename="${file.fileName}"`)
    response.setHeader('cache-control', 'private, no-store, max-age=0')
    response.setHeader('x-content-type-options', 'nosniff')
    response.setHeader('content-security-policy', "default-src 'none'; sandbox")
    response.setHeader('x-reeditpro-artifact-sha256', file.sha256)
    response.end(file.bytes)
  }))

  router.post('/v1/edit-executions/render-preview-assemblies/:renderPreviewAssemblyId/user-preview-review', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(createApprovedEditExecutionUserPreviewReviewSchema, request.body)
    const result = await createApprovedEditExecutionPackageService(getServiceContext(request)).createUserPreviewReview({
      ...body,
      renderPreviewAssemblyId: getRouteParam(request, 'renderPreviewAssemblyId'),
      idempotencyKey: getIdempotencyKey(request),
      requestPath: request.originalUrl,
    })
    sendOk(response, { userPreviewReview: result.userPreviewReview }, result.warnings, 201)
  }))

  router.get('/v1/edit-executions/private-internal-downloads/:privateInternalDownloadDeliveryId/file', requireAuth, asyncRoute(async (request, response) => {
    const file = await createApprovedEditExecutionPackageService(getServiceContext(request)).getPrivateInternalDownloadFile(
      getRouteParam(request, 'privateInternalDownloadDeliveryId'),
    )
    response.status(200)
    response.setHeader('content-type', file.mimeType)
    response.setHeader('content-length', String(file.byteSize))
    response.setHeader('content-disposition', `attachment; filename="${file.fileName}"`)
    response.setHeader('cache-control', 'no-store')
    const stream = await file.createReadStream()
    stream.pipe(response)
  }))

  router.get('/v1/edit-executions/private-internal-downloads/:privateInternalDownloadDeliveryId/manifest', requireAuth, asyncRoute(async (request, response) => {
    const file = await createApprovedEditExecutionPackageService(getServiceContext(request)).getPrivateInternalDownloadManifestFile(
      getRouteParam(request, 'privateInternalDownloadDeliveryId'),
    )
    response.status(200)
    response.setHeader('content-type', file.mimeType)
    response.setHeader('content-length', String(file.byteSize))
    response.setHeader('content-disposition', `attachment; filename="${file.fileName}"`)
    response.setHeader('cache-control', 'no-store')
    const stream = await file.createReadStream()
    stream.pipe(response)
  }))
}

function stripServerLocalPaths(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripServerLocalPaths)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => key !== 'localFilePath')
    .map(([key, nested]) => [key, stripServerLocalPaths(nested)]))
}

function normalizeAdapterActivityName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

function resolvePrivateInternalAdapterActivityGroup(toolName: string): PrivateInternalAdapterActivityGroupId {
  const normalized = normalizeAdapterActivityName(toolName)
  for (const group of privateInternalAdapterActivityGroups) {
    if (group.aliases.some((alias) => normalizeAdapterActivityName(alias) === normalized)) {
      return group.id
    }
  }
  return 'readiness_checks'
}

function summarizePrivateInternalAdapterActivityGroup(input: {
  label: string
  resolvedActivityCount: number
  integratedActivityCount: number
  pendingActivityCount: number
  status: PrivateInternalAdapterActivityGroupStatus
}) {
  if (input.status === 'ready') {
    return `${input.label} is attached to this private review.`
  }
  if (input.status === 'partial') {
    return `${input.label} has ${input.integratedActivityCount} approved check${input.integratedActivityCount === 1 ? '' : 's'} attached and ${input.pendingActivityCount} still waiting for backend evidence.`
  }
  if (input.status === 'blocked') {
    return `${input.label} is blocked until backend evidence is resolved.`
  }
  return `${input.label} is planned and still waiting for backend evidence.`
}

function buildPrivateInternalAdapterActivityGroups(input: {
  requestedToolNames: string[]
  integratedToolNames: string[]
  integrationBlocked: boolean
}): PrivateInternalAdapterActivityGroup[] {
  const requestedCounts = new Map<PrivateInternalAdapterActivityGroupId, number>()
  const integratedCounts = new Map<PrivateInternalAdapterActivityGroupId, number>()

  for (const requestedToolName of input.requestedToolNames) {
    const groupId = resolvePrivateInternalAdapterActivityGroup(requestedToolName)
    requestedCounts.set(groupId, (requestedCounts.get(groupId) ?? 0) + 1)
  }

  for (const integratedToolName of input.integratedToolNames) {
    const groupId = resolvePrivateInternalAdapterActivityGroup(integratedToolName)
    integratedCounts.set(groupId, (integratedCounts.get(groupId) ?? 0) + 1)
  }

  return Array.from(requestedCounts.entries()).map(([id, resolvedActivityCount]) => {
    const label = privateInternalAdapterActivityGroupLabels[id]
    const integratedActivityCount = Math.min(resolvedActivityCount, integratedCounts.get(id) ?? 0)
    const pendingActivityCount = Math.max(0, resolvedActivityCount - integratedActivityCount)
    const status: PrivateInternalAdapterActivityGroupStatus = pendingActivityCount === 0
      ? 'ready'
      : integratedActivityCount > 0
        ? 'partial'
        : input.integrationBlocked
          ? 'blocked'
          : 'pending'

    return {
      id,
      label,
      resolvedActivityCount,
      integratedActivityCount,
      pendingActivityCount,
      status,
      userFacingSummary: summarizePrivateInternalAdapterActivityGroup({
        label,
        resolvedActivityCount,
        integratedActivityCount,
        pendingActivityCount,
        status,
      }),
    }
  })
}

function resolvePrivateInternalAdapterIntegrationCandidates(requestedAdapterToolNames: string[]) {
  const seen = new Set<string>()
  return requestedAdapterToolNames.flatMap((requestedToolName) => {
    const contract = resolveProfessionalToolAdapterContract(requestedToolName)
    if (!contract) return []
    if (contract.requiresModelWeightApproval) return []
    if (!contract.requiresPackageReadiness) return []
    if (!contract.modes.includes('bounded_execution')) return []
    if (seen.has(contract.canonicalToolId)) return []
    seen.add(contract.canonicalToolId)
    return [{
      requestedToolName: contract.requestedToolName,
      canonicalToolId: contract.canonicalToolId,
      userFacingActivity: contract.userFacingActivity,
    }]
  })
}

function requireWorkerLeaseCredential(value: string | undefined): string {
  const credential = value?.trim()
  if (!credential) {
    throw new ApiError(
      'WORKER_LEASE_EXPIRED',
      'A valid opaque worker lease credential is required.',
      409,
    )
  }
  return credential
}
