import type { ApiErrorCode } from '../errors/error-codes'
import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import type {
  ProviderAttemptGetInput,
  ProviderAttemptListInput,
  ProviderBlockersInput,
  ProviderExecutionBlockedInput,
  ProviderOutputReadinessInput,
  ProviderReadinessInput,
  ProviderRequestAttemptCreateBoundaryInput,
  ProviderRequestEnvelopeInput,
  ProviderRoutePreviewInput,
  ProviderWebhookReadinessInput,
  ProviderWebhookReceiveBoundaryInput,
  ProviderWebhookSummaryInput,
} from '../validation/provider-gateway-schemas'
import { createProjectService } from './project-service'
import { getRequiredAuthUserId, nowIso, sanitizeJson } from './service-helpers'

type ProviderGatewayStatus = 'ready' | 'blocked' | 'backend_required' | 'mock_only'

interface ProviderGatewayBlocker {
  gate: string
  code: ApiErrorCode
  message: string
}

interface RequiredRecord {
  table: string
  id?: string
  status: 'present' | 'missing' | 'backend_required' | 'blocked' | 'not_applicable'
  note: string
}

export interface ProviderGatewayResult {
  status: ProviderGatewayStatus
  canProceed: boolean
  canCallProvider: boolean
  blockers: ProviderGatewayBlocker[]
  warnings: string[]
  requiredRecords: RequiredRecord[]
  nextAction: string
  providerCatalog?: Record<string, unknown>
  providerModel?: Record<string, unknown>
  providerSecretReference?: Record<string, unknown>
  providerRoutePreview?: Record<string, unknown>
  providerRequestEnvelope?: Record<string, unknown>
  providerAttempt?: Record<string, unknown>
  providerWebhook?: Record<string, unknown>
  providerOutput?: Record<string, unknown>
  intendedPayload?: Record<string, unknown>
  auditEvent?: Record<string, unknown>
}

const PROVIDER_CATALOG = [
  {
    providerKey: 'openai',
    providerType: 'image',
    displayName: 'OpenAI image models',
    readinessStatus: 'backend_required',
    secretReferenceStatus: 'backend_required',
    supportedRequestTypes: ['image_asset', 'prompt_preview'],
    disabledReason: 'Provider transport and Secret Manager access are not enabled in Prompt 15.',
  },
  {
    providerKey: 'wan',
    providerType: 'video',
    displayName: 'Wan AI video',
    readinessStatus: 'backend_required',
    secretReferenceStatus: 'backend_required',
    supportedRequestTypes: ['video_asset'],
    disabledReason: 'Provider transport and tier policy execution are not enabled in Prompt 15.',
  },
  {
    providerKey: 'hailuo',
    providerType: 'video',
    displayName: 'Hailuo AI video',
    readinessStatus: 'backend_required',
    secretReferenceStatus: 'backend_required',
    supportedRequestTypes: ['video_asset'],
    disabledReason: 'Provider transport and tier policy execution are not enabled in Prompt 15.',
  },
  {
    providerKey: 'veo',
    providerType: 'video',
    displayName: 'Veo fallback video',
    readinessStatus: 'blocked',
    secretReferenceStatus: 'backend_required',
    supportedRequestTypes: ['video_asset'],
    disabledReason: 'Veo remains Premium-only and final-fallback-only; Prompt 15 does not execute providers.',
  },
  {
    providerKey: 'lyria',
    providerType: 'music',
    displayName: 'Lyria music',
    readinessStatus: 'backend_required',
    secretReferenceStatus: 'backend_required',
    supportedRequestTypes: ['music_asset'],
    disabledReason: 'Music generation remains worker/provider-runtime blocked.',
  },
  {
    providerKey: 'mirelo',
    providerType: 'sfx',
    displayName: 'Mirelo SFX',
    readinessStatus: 'backend_required',
    secretReferenceStatus: 'backend_required',
    supportedRequestTypes: ['sfx_asset'],
    disabledReason: 'SFX generation remains worker/provider-runtime blocked.',
  },
  {
    providerKey: 'mmaudio',
    providerType: 'sfx',
    displayName: 'MMAudio draft SFX',
    readinessStatus: 'backend_required',
    secretReferenceStatus: 'backend_required',
    supportedRequestTypes: ['sfx_asset'],
    disabledReason: 'Draft SFX generation remains worker/provider-runtime blocked.',
  },
]

const PROVIDER_MODELS = [
  { providerModelKey: 'openai.gpt-image-2', providerKey: 'openai', modelName: 'GPT-Image-2', providerType: 'image', tierPolicy: 'approved snapshot and credit reservation required' },
  { providerModelKey: 'wan.video', providerKey: 'wan', modelName: 'Wan video', providerType: 'video', tierPolicy: 'Basic/Pro allowed when policy permits; no provider call in Prompt 15' },
  { providerModelKey: 'hailuo.video', providerKey: 'hailuo', modelName: 'Hailuo video', providerType: 'video', tierPolicy: 'Basic/Pro allowed when policy permits; no provider call in Prompt 15' },
  { providerModelKey: 'veo.3.1-lite', providerKey: 'veo', modelName: 'Veo 3.1 Lite', providerType: 'video', tierPolicy: 'Premium-only final fallback; blocked in Prompt 15' },
  { providerModelKey: 'lyria.music', providerKey: 'lyria', modelName: 'Lyria music', providerType: 'music', tierPolicy: 'future provider worker only' },
  { providerModelKey: 'mirelo.sfx', providerKey: 'mirelo', modelName: 'Mirelo SFX', providerType: 'sfx', tierPolicy: 'future provider worker only' },
  { providerModelKey: 'mmaudio.sfx', providerKey: 'mmaudio', modelName: 'MMAudio SFX', providerType: 'sfx', tierPolicy: 'future provider worker only' },
]

const FORBIDDEN_OPERATIONS = [
  'real provider calls',
  'provider SDK installation',
  'Secret Manager access',
  'provider secret reads',
  'external HTTP provider requests',
  'provider webhook processing',
  'generated asset creation',
  'job creation or worker execution',
  'render or export execution',
  'tool execution',
  'media processing',
  'credit mutation',
  'storage transfer',
]

export function assertRealProviderCallsDisabled(): void {
  throw new ApiError('REAL_PROVIDER_CALLS_DISABLED', 'Real provider calls are disabled in the Prompt 15 provider gateway foundation.', 403)
}

function baseResult(warnings: string[] = []): ProviderGatewayResult {
  return {
    status: 'backend_required',
    canProceed: false,
    canCallProvider: false,
    blockers: [],
    warnings,
    requiredRecords: [],
    nextAction: 'Use a future reviewed provider gateway runtime before enabling provider transport.',
  }
}

function addBlocker(result: ProviderGatewayResult, gate: string, code: ApiErrorCode, message: string): void {
  result.blockers.push({ gate, code, message })
}

function addRequiredRecord(result: ProviderGatewayResult, table: string, id: string | undefined, note: string): void {
  result.requiredRecords.push({
    table,
    id,
    status: id ? 'present' : 'missing',
    note,
  })
}

function finalize(result: ProviderGatewayResult): ProviderGatewayResult {
  result.canCallProvider = false
  if (result.blockers.length === 0) {
    result.status = 'ready'
    result.canProceed = true
    result.nextAction = 'Read-only provider gateway metadata is available. Provider execution remains blocked.'
    return result
  }

  result.status = result.blockers.some((blocker) => blocker.code === 'BACKEND_REQUIRED') ? 'backend_required' : 'blocked'
  result.canProceed = false
  result.nextAction = 'Resolve listed provider gates and add a reviewed transport/secrets/worker runtime before provider execution.'
  return result
}

function addProviderRuntimeBlockers(result: ProviderGatewayResult): void {
  addBlocker(result, 'ProviderTransportGate', 'BACKEND_REQUIRED', 'Provider transport is not enabled in Prompt 15.')
  addBlocker(result, 'ProviderSecretReferenceGate', 'BACKEND_REQUIRED', 'Provider secrets are reference-only; no secret value is read.')
  addBlocker(result, 'ProviderExecutionBlockedGate', 'BACKEND_REQUIRED', 'Prompt 15 validates provider boundaries but never calls providers.')
}

function findProvider(providerKey?: string) {
  if (!providerKey) return undefined
  return PROVIDER_CATALOG.find((provider) => provider.providerKey === providerKey)
}

function findModel(providerModelKey?: string) {
  if (!providerModelKey) return undefined
  return PROVIDER_MODELS.find((model) => model.providerModelKey === providerModelKey)
}

function buildAuditEvent(action: string, userId: string, details: Record<string, unknown>): Record<string, unknown> {
  return sanitizeJson({
    eventType: `provider_gateway.${action}`,
    userId,
    sanitized: true,
    details,
    createdAt: nowIso(),
  })
}

function buildEnvelope(input: ProviderRequestEnvelopeInput, userId: string, idempotencyKey?: string): Record<string, unknown> {
  return sanitizeJson({
    envelopeSchemaVersion: 'prompt-15.provider-request-envelope.v1',
    identity: {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      userId,
      approvedSnapshotId: input.approvedSnapshotId,
      jobId: input.jobId,
      toolCallIntentId: input.toolCallIntentId,
      providerKey: input.providerKey,
      providerModelKey: input.providerModelKey,
      requestType: input.requestType,
    },
    gateReferences: {
      approvedSnapshotStatus: input.approvedSnapshotId ? 'referenced_unverified' : 'missing',
      creditEstimateId: input.creditEstimateId,
      creditReservationId: input.creditReservationId,
      creditGateStatus: input.creditReservationId ? 'referenced_unverified' : 'missing',
      jobReadinessStatus: input.jobId ? 'referenced_unverified' : 'not_provided',
      workerClaimStatus: 'backend_required',
      mediaReadinessStatus: input.sourceMediaIds.length > 0 ? 'referenced_unverified' : 'not_provided',
      storageReadinessStatus: input.storageObjectRecordIds.length > 0 ? 'referenced_unverified' : 'not_provided',
      qaBlockerStatus: 'backend_required',
      providerReadinessStatus: 'backend_required',
      providerSecretReferenceStatus: 'backend_required',
    },
    providerRouting: {
      providerType: input.providerType,
      providerRoute: input.routePurpose,
      modelName: findModel(input.providerModelKey)?.modelName ?? input.providerModelKey,
      qualityLevel: input.qualityLevel,
      tierPolicy: findModel(input.providerModelKey)?.tierPolicy ?? 'approved snapshot and credit reservation required',
      fallbackPolicy: 'future policy only; no fallback execution in Prompt 15',
      retryPolicy: 'future provider runtime only',
      timeoutPolicy: 'future provider runtime only',
      providerDisabledReason: findProvider(input.providerKey)?.disabledReason ?? 'Provider is not enabled for execution.',
    },
    inputs: {
      promptReferenceId: input.promptReferenceId,
      hasSafePromptText: Boolean(input.safePromptText),
      hasNegativePrompt: Boolean(input.negativePrompt),
      styleConstraints: input.styleConstraints ?? {},
      timingConstraints: input.timingConstraints ?? {},
      outputRequirements: input.outputRequirements ?? {},
      sourceMediaIds: input.sourceMediaIds,
      storageObjectRecordIds: input.storageObjectRecordIds,
      approvedAssetIds: input.approvedAssetIds,
      noSignedUrlsAsSourceOfTruth: true,
      noRawSecrets: true,
      noProviderKeys: true,
      noServiceRoleKeys: true,
      noRawChatAsSoleInstruction: true,
    },
    outputPolicy: {
      expectedOutputType: input.expectedOutputType,
      storageTargetPolicy: 'storage_object_records only after future provider output persistence',
      previewOnly: input.previewOnly,
      finalExportEligible: input.finalExportEligible,
      qaRequired: input.qaRequired,
      provenanceRequired: input.provenanceRequired,
      userReviewRequired: true,
    },
    executionContract: {
      canCallProvider: false,
      backendRequiredReasons: [
        'Provider transport is unavailable.',
        'Secret Manager access is unavailable.',
        'Prompt 15 is provider gateway foundation only.',
      ],
      forbiddenOperations: FORBIDDEN_OPERATIONS,
      allowedFutureOperation: 'Create provider attempt only after approved snapshot, credit reservation, worker/job gates, secret reference, and transport review.',
      idempotencyKeyPresent: Boolean(idempotencyKey),
      auditEventPolicy: 'emit sanitized audit event only through future append-only audit service',
    },
    completionFailureContract: {
      providerAttemptStatus: 'not_started',
      providerRequestIdReference: null,
      sanitizedResponseSummary: null,
      failureCategory: 'provider_disabled',
      safeFailureMessage: 'Provider execution is disabled in Prompt 15.',
      retryable: false,
      refundOrReleaseNeeded: false,
      downstreamBlocked: true,
      userVisibleMessage: 'Provider work is not ready to run yet.',
    },
    integrity: {
      createdAt: nowIso(),
      updatedAt: nowIso(),
      auditEvent: 'provider_gateway.envelope_validated',
    },
  })
}

export function createProviderGatewayService(context: ServiceContext) {
  async function checkProjectGate(result: ProviderGatewayResult, projectId?: string): Promise<void> {
    if (!projectId) return
    const access = await createProjectService(context).checkProjectAccess(projectId)
    if (access.status === 'ready') {
      result.requiredRecords.push({
        table: 'projects',
        id: projectId,
        status: 'present',
        note: 'Project access verified through workspace membership.',
      })
      return
    }

    result.warnings.push(...access.warnings)
    result.requiredRecords.push({
      table: 'projects',
      id: projectId,
      status: 'backend_required',
      note: 'Project access requires backend workspace membership verification.',
    })
    addBlocker(result, 'ProjectAccessGate', 'BACKEND_REQUIRED', 'Project access could not be verified without backend runtime.')
  }

  function addDependencyRecords(result: ProviderGatewayResult, input: {
    approvedSnapshotId?: string
    creditEstimateId?: string
    creditReservationId?: string
    jobId?: string
    toolCallIntentId?: string
  }): void {
    addRequiredRecord(result, 'approved_plan_snapshots', input.approvedSnapshotId, 'Provider requests must be derived from approved snapshots.')
    addRequiredRecord(result, 'credit_estimates', input.creditEstimateId, 'Provider requests require an approved estimate when credits apply.')
    addRequiredRecord(result, 'credit_reservations', input.creditReservationId, 'Provider requests require an active credit reservation when credits apply.')
    addRequiredRecord(result, 'jobs', input.jobId, 'Provider execution must be coordinated through future job/worker runtime.')
    addRequiredRecord(result, 'tool_call_intents', input.toolCallIntentId, 'Tool-call intent is optional and readiness-only for provider requests.')
  }

  async function validateRequestEnvelope(input: ProviderRequestEnvelopeInput, idempotencyKey?: string) {
    const userId = getRequiredAuthUserId(context)
    const result = baseResult()
    await checkProjectGate(result, input.projectId)
    addDependencyRecords(result, input)
    addProviderRuntimeBlockers(result)
    result.providerRequestEnvelope = buildEnvelope(input, userId, idempotencyKey)
    result.auditEvent = buildAuditEvent('request_envelope_validated', userId, { providerKey: input.providerKey, projectId: input.projectId })
    return finalize(result)
  }

  async function checkWebhookReadiness(input: ProviderWebhookReadinessInput, idempotencyKey?: string) {
    const userId = getRequiredAuthUserId(context)
    const result = baseResult()
    await checkProjectGate(result, input.projectId)
    addBlocker(result, 'ProviderWebhookVerificationGate', 'BACKEND_REQUIRED', 'Webhook verification is not enabled in Prompt 15.')
    result.providerWebhook = sanitizeJson({
      providerKey: input.providerKey,
      providerWebhookEventId: input.providerWebhookEventId,
      sanitizedProviderEventId: input.sanitizedProviderEventId,
      idempotencyKeyPresent: Boolean(idempotencyKey),
      signatureVerified: false,
      rawPayloadStored: false,
    })
    result.auditEvent = buildAuditEvent('webhook_readiness_checked', userId, { providerKey: input.providerKey })
    return finalize(result)
  }

  return {
    async checkReadiness(input: ProviderReadinessInput) {
      const userId = getRequiredAuthUserId(context)
      const result = baseResult(['Provider readiness is fail-closed until transport, secrets, service-role, and worker runtime are reviewed.'])
      await checkProjectGate(result, input.projectId)
      if (input.providerKey && !findProvider(input.providerKey)) {
        addBlocker(result, 'ProviderCatalogGate', 'VALIDATION_FAILED', 'Provider key is not in the Prompt 15 static catalog.')
      }
      addProviderRuntimeBlockers(result)
      result.providerCatalog = sanitizeJson({ providerKey: input.providerKey, providerModelKey: input.providerModelKey, requestType: input.requestType })
      result.auditEvent = buildAuditEvent('readiness_checked', userId, { providerKey: input.providerKey, projectId: input.projectId })
      return finalize(result)
    },

    listCatalog(providerType?: string) {
      const result = baseResult()
      result.providerCatalog = {
        providers: PROVIDER_CATALOG
          .filter((provider) => !providerType || provider.providerType === providerType)
          .map((provider) => sanitizeJson(provider)),
      }
      return finalize(result)
    },

    getCatalogProvider(providerKey: string) {
      const result = baseResult()
      const provider = findProvider(providerKey)
      if (!provider) addBlocker(result, 'ProviderCatalogGate', 'VALIDATION_FAILED', 'Provider key is not in the Prompt 15 static catalog.')
      result.providerCatalog = sanitizeJson(provider ?? { providerKey, status: 'unknown' })
      return finalize(result)
    },

    listModels(providerKey?: string, providerType?: string) {
      const result = baseResult()
      result.providerCatalog = {
        models: PROVIDER_MODELS
          .filter((model) => !providerKey || model.providerKey === providerKey)
          .filter((model) => !providerType || model.providerType === providerType)
          .map((model) => sanitizeJson(model)),
      }
      return finalize(result)
    },

    getModel(providerModelKey: string) {
      const result = baseResult()
      const model = findModel(providerModelKey)
      if (!model) addBlocker(result, 'ProviderModelPolicyGate', 'VALIDATION_FAILED', 'Provider model key is not in the Prompt 15 static catalog.')
      result.providerModel = sanitizeJson(model ?? { providerModelKey, status: 'unknown' })
      return finalize(result)
    },

    async checkSecretReference(input: { workspaceId: string; projectId?: string; providerKey: string; providerModelKey?: string; secretReferenceLabel?: string }) {
      const userId = getRequiredAuthUserId(context)
      const result = baseResult()
      await checkProjectGate(result, input.projectId)
      result.providerSecretReference = sanitizeJson({
        providerKey: input.providerKey,
        providerModelKey: input.providerModelKey,
        secretReferenceLabel: input.secretReferenceLabel ?? `${input.providerKey}.runtime_secret_reference`,
        secretValueRead: false,
        frontendVisible: false,
        status: 'backend_required',
      })
      addBlocker(result, 'ProviderSecretReferenceGate', 'BACKEND_REQUIRED', 'Provider secret values are never read or returned in Prompt 15.')
      result.auditEvent = buildAuditEvent('secret_reference_checked', userId, { providerKey: input.providerKey, projectId: input.projectId })
      return finalize(result)
    },

    async previewRoute(input: ProviderRoutePreviewInput, idempotencyKey?: string) {
      const userId = getRequiredAuthUserId(context)
      const result = baseResult()
      await checkProjectGate(result, input.projectId)
      addDependencyRecords(result, input)
      addProviderRuntimeBlockers(result)
      result.providerRoutePreview = sanitizeJson({
        providerKey: input.providerKey,
        providerModelKey: input.providerModelKey,
        providerType: input.providerType,
        requestType: input.requestType,
        routePurpose: input.routePurpose,
        qualityLevel: input.qualityLevel,
        expectedOutputType: input.expectedOutputType,
        idempotencyKeyPresent: Boolean(idempotencyKey),
        canCallProvider: false,
        forbiddenOperations: FORBIDDEN_OPERATIONS,
      })
      result.auditEvent = buildAuditEvent('route_previewed', userId, { providerKey: input.providerKey, projectId: input.projectId })
      return finalize(result)
    },

    validateRequestEnvelope,

    async checkRequestAttemptReadiness(input: ProviderRequestEnvelopeInput, idempotencyKey?: string) {
      const result = await validateRequestEnvelope(input, idempotencyKey)
      result.providerAttempt = sanitizeJson({
        status: 'not_created',
        createAllowed: false,
        idempotencyKeyPresent: Boolean(idempotencyKey),
      })
      return result
    },

    async createRequestAttemptBoundary(input: ProviderRequestAttemptCreateBoundaryInput, idempotencyKey: string) {
      const result = await validateRequestEnvelope(input, idempotencyKey)
      result.providerAttempt = sanitizeJson({
        status: 'backend_required',
        wouldWriteTable: 'provider_request_attempts',
        writePerformed: false,
        providerCallPerformed: false,
        idempotencyKeyPresent: true,
        retryReason: input.retryReason,
      })
      result.intendedPayload = sanitizeJson({
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        approvedSnapshotId: input.approvedSnapshotId,
        creditReservationId: input.creditReservationId,
        providerKey: input.providerKey,
        providerModelKey: input.providerModelKey,
        requestType: input.requestType,
        expectedOutputType: input.expectedOutputType,
      })
      return result
    },

    async getRequestAttempt(input: ProviderAttemptGetInput) {
      const userId = getRequiredAuthUserId(context)
      const result = baseResult()
      await checkProjectGate(result, input.projectId)
      addBlocker(result, 'ProviderAttemptReadGate', 'BACKEND_REQUIRED', 'Provider attempt reads require reviewed RLS/service-role access.')
      result.providerAttempt = sanitizeJson({ providerAttemptId: input.providerAttemptId, status: 'backend_required' })
      result.auditEvent = buildAuditEvent('request_attempt_read', userId, { providerAttemptId: input.providerAttemptId })
      return finalize(result)
    },

    async listRequestAttemptsForProject(input: ProviderAttemptListInput & { projectId: string }) {
      const userId = getRequiredAuthUserId(context)
      const result = baseResult()
      await checkProjectGate(result, input.projectId)
      addBlocker(result, 'ProviderAttemptReadGate', 'BACKEND_REQUIRED', 'Provider attempt listing requires reviewed RLS/service-role access.')
      result.providerAttempt = sanitizeJson({ projectId: input.projectId, providerKey: input.providerKey, status: 'backend_required' })
      result.auditEvent = buildAuditEvent('request_attempts_listed', userId, { projectId: input.projectId })
      return finalize(result)
    },

    checkWebhookReadiness,

    async receiveWebhookBoundary(input: ProviderWebhookReceiveBoundaryInput, idempotencyKey: string) {
      const result = await checkWebhookReadiness(input, idempotencyKey)
      result.providerWebhook = sanitizeJson({
        providerKey: input.providerKey,
        providerEventId: input.providerEventId,
        generationRequestId: input.generationRequestId,
        jobId: input.jobId,
        eventPayloadSummaryJson: input.eventPayloadSummaryJson ?? {},
        status: 'backend_required',
        writePerformed: false,
        generationStateMutated: false,
        rawPayloadStored: false,
      })
      return result
    },

    async getWebhookSummary(input: ProviderWebhookSummaryInput) {
      const userId = getRequiredAuthUserId(context)
      const result = baseResult()
      await checkProjectGate(result, input.projectId)
      addBlocker(result, 'ProviderWebhookReadGate', 'BACKEND_REQUIRED', 'Webhook summary reads require reviewed RLS/service-role access.')
      result.providerWebhook = sanitizeJson({ providerWebhookEventId: input.providerWebhookEventId, status: 'backend_required' })
      result.auditEvent = buildAuditEvent('webhook_summary_read', userId, { providerWebhookEventId: input.providerWebhookEventId })
      return finalize(result)
    },

    async checkOutputReadiness(input: ProviderOutputReadinessInput, idempotencyKey?: string) {
      const userId = getRequiredAuthUserId(context)
      const result = baseResult()
      await checkProjectGate(result, input.projectId)
      addBlocker(result, 'ProviderOutputStorageGate', 'BACKEND_REQUIRED', 'Provider output persistence is not enabled in Prompt 15.')
      result.providerOutput = sanitizeJson({
        providerAttemptId: input.providerAttemptId,
        generationRequestId: input.generationRequestId,
        generatedAssetId: input.generatedAssetId,
        storageObjectRecordId: input.storageObjectRecordId,
        expectedOutputType: input.expectedOutputType,
        outputStored: false,
        idempotencyKeyPresent: Boolean(idempotencyKey),
      })
      result.auditEvent = buildAuditEvent('output_readiness_checked', userId, { projectId: input.projectId })
      return finalize(result)
    },

    async executionBlocked(input: ProviderExecutionBlockedInput, idempotencyKey?: string) {
      const userId = getRequiredAuthUserId(context)
      const result = baseResult()
      await checkProjectGate(result, input.projectId)
      addProviderRuntimeBlockers(result)
      result.providerAttempt = sanitizeJson({
        providerKey: input.providerKey,
        providerModelKey: input.providerModelKey,
        requestType: input.requestType,
        failureCategory: input.failureCategory,
        safeFailureMessage: input.safeFailureMessage ?? 'Provider execution is disabled in Prompt 15.',
        retryable: input.retryable,
        idempotencyKeyPresent: Boolean(idempotencyKey),
      })
      result.auditEvent = buildAuditEvent('execution_blocked', userId, { providerKey: input.providerKey, projectId: input.projectId })
      return finalize(result)
    },

    async blockers(input: ProviderBlockersInput, idempotencyKey?: string) {
      const userId = getRequiredAuthUserId(context)
      const result = baseResult()
      await checkProjectGate(result, input.projectId)
      addProviderRuntimeBlockers(result)
      result.providerCatalog = sanitizeJson({
        providerKey: input.providerKey,
        requestType: input.requestType,
        idempotencyKeyPresent: Boolean(idempotencyKey),
        forbiddenOperations: FORBIDDEN_OPERATIONS,
      })
      result.auditEvent = buildAuditEvent('blockers_listed', userId, { providerKey: input.providerKey, projectId: input.projectId })
      return finalize(result)
    },
  }
}
