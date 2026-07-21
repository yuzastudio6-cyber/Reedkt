import { createHash } from 'node:crypto'
import type { ServiceContext } from '../types'
import {
  EDIT_REFERENCE_OBSERVED_OPERATIONS,
  createEditReferenceObservableEvent,
  deriveEditReferenceMetricSamples,
  hashEditReferenceIdempotencyKey,
  type EditReferenceObservabilityPhase,
  type EditReferenceObservabilitySink,
  type EditReferenceObservedOperation,
  type EditReferenceTraceCorrelation,
} from '../edit-references/edit-reference-observability-contract'
import type { EditReferenceService } from './edit-reference-service'

export function instrumentEditReferenceService(
  service: EditReferenceService,
  context: Pick<ServiceContext, 'requestId'>,
  sink: EditReferenceObservabilitySink,
): EditReferenceService {
  return new Proxy(service, {
    get(target, property, receiver) {
      const member = Reflect.get(target, property, receiver)
      if (typeof property !== 'string' || typeof member !== 'function' || !isObservedOperation(property)) return member
      return async (...args: unknown[]) => {
        const startedAt = Date.now()
        const correlation = deriveCorrelation(property, args, context.requestId)
        emitSafely(sink, createEditReferenceObservableEvent({
          domain: EDIT_REFERENCE_OBSERVED_OPERATIONS[property],
          operation: property,
          phase: 'started',
          correlation,
          ...operationDimensions(property),
        }))
        try {
          const response = await Reflect.apply(member, target, args) as { replayed?: boolean }
          emitSafely(sink, createEditReferenceObservableEvent({
            domain: EDIT_REFERENCE_OBSERVED_OPERATIONS[property],
            operation: property,
            phase: successfulPhase(property, args),
            correlation,
            durationMs: boundedDuration(startedAt),
            replayed: response?.replayed === true,
            ...operationDimensions(property),
          }))
          return response
        } catch (error) {
          emitSafely(sink, createEditReferenceObservableEvent({
            domain: EDIT_REFERENCE_OBSERVED_OPERATIONS[property],
            operation: property,
            phase: failurePhase(error),
            correlation,
            durationMs: boundedDuration(startedAt),
            reasonCode: errorReasonCode(error),
            ...operationDimensions(property),
          }))
          throw error
        }
      }
    },
  })
}

function emitSafely(sink: EditReferenceObservabilitySink, event: ReturnType<typeof createEditReferenceObservableEvent>): void {
  try {
    const pending = sink.emit(event, deriveEditReferenceMetricSamples(event))
    if (pending && typeof (pending as PromiseLike<void>).then === 'function') {
      void Promise.resolve(pending).catch(() => undefined)
    }
  } catch {
    // Telemetry must never change the committed Edit Reference result.
  }
}

function isObservedOperation(value: string): value is EditReferenceObservedOperation {
  return value in EDIT_REFERENCE_OBSERVED_OPERATIONS
}

function deriveCorrelation(
  operation: EditReferenceObservedOperation,
  args: unknown[],
  requestId: string,
): EditReferenceTraceCorrelation {
  const safeRequestId = safeOpaqueId(requestId)
  const correlation: EditReferenceTraceCorrelation = {
    traceId: safeRequestId,
    requestId: safeRequestId,
  }
  const positional = POSITIONAL_CORRELATION[operation] ?? []
  for (const [index, field] of positional) {
    const value = args[index]
    if (typeof value === 'string' && value) correlation[field] = safeOpaqueId(value)
  }
  for (const value of args) collectObjectCorrelation(correlation, value)
  if (IDEMPOTENT_OPERATIONS.has(operation)) {
    const idempotencyKey = args.at(-1)
    if (typeof idempotencyKey === 'string' && idempotencyKey) {
      correlation.idempotencyKeyHash = hashEditReferenceIdempotencyKey(idempotencyKey)
    }
  }
  return correlation
}

function collectObjectCorrelation(correlation: EditReferenceTraceCorrelation, value: unknown): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return
  const record = value as Record<string, unknown>
  collectKnownFields(correlation, record)
  for (const key of ['targetContext', 'invalidationReceipt', 'targetSessionReceipt', 'providerIdentity']) {
    const nested = record[key]
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) collectKnownFields(correlation, nested as Record<string, unknown>)
  }
}

function collectKnownFields(correlation: EditReferenceTraceCorrelation, record: Record<string, unknown>): void {
  for (const [source, target] of Object.entries(OBJECT_CORRELATION_FIELDS) as Array<[string, keyof EditReferenceTraceCorrelation]>) {
    const value = record[source]
    if (typeof value === 'string' && value && correlation[target] === undefined) correlation[target] = safeOpaqueId(value)
  }
}

function operationDimensions(
  operation: EditReferenceObservedOperation,
): Pick<ReturnType<typeof createEditReferenceObservableEvent>, 'skillFamily' | 'providerRouteId' | 'modelRouteId' | 'workerType'> | Record<string, never> {
  if (operation === 'runEvidenceStudy') return { skillFamily: 'edit_reference_specialists' }
  if (EDIT_REFERENCE_OBSERVED_OPERATIONS[operation] === 'worker') {
    return { workerType: operation.includes('Checkback') ? 'provider_checkback' : 'provider_workflow' }
  }
  return {}
}

function successfulPhase(operation: EditReferenceObservedOperation, args: unknown[]): EditReferenceObservabilityPhase {
  if (operation !== 'controlLongFormStudy') return 'completed'
  const input = args[2]
  const action = input && typeof input === 'object' && !Array.isArray(input)
    ? (input as Record<string, unknown>).action
    : undefined
  if (action === 'pause') return 'paused'
  if (action === 'resume' || action === 'recover') return 'resumed'
  if (action === 'cancel') return 'cancelled'
  return 'completed'
}

function failurePhase(error: unknown): EditReferenceObservabilityPhase {
  const status = error && typeof error === 'object' ? (error as Record<string, unknown>).status : undefined
  return status === 401 || status === 403 || status === 409 || status === 422 ? 'blocked' : 'failed'
}

function errorReasonCode(error: unknown): string {
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>
    if (typeof record.code === 'string' && record.code) return safeOpaqueId(record.code.toLowerCase())
    if (typeof record.status === 'number' && Number.isSafeInteger(record.status)) return `http_${record.status}`
  }
  return 'unknown_error'
}

function safeOpaqueId(value: string): string {
  if (/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,191}$/.test(value)) return value
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function boundedDuration(startedAt: number): number {
  return Math.min(86_400_000, Math.max(0, Math.trunc(Date.now() - startedAt)))
}

const OBJECT_CORRELATION_FIELDS = {
  workspaceId: 'workspaceId',
  projectId: 'projectId',
  editSessionId: 'editSessionId',
  editReferenceId: 'editReferenceId',
  referenceId: 'editReferenceId',
  studySessionId: 'studySessionId',
  studyId: 'studySessionId',
  referenceAssetId: 'referenceAssetId',
  skillRunId: 'skillRunId',
  dnaVersionId: 'dnaVersionId',
  preferenceApplicationId: 'preferenceApplicationId',
  applicationId: 'preferenceApplicationId',
  approvedSnapshotId: 'approvedSnapshotId',
  attemptId: 'reasoningAttemptId',
  providerRequestRecordId: 'providerRequestRecordId',
  checkbackId: 'checkbackId',
  workflowId: 'workflowId',
  authorityRecordId: 'costAuthorityRecordId',
  jobId: 'jobId',
} as const satisfies Record<string, keyof EditReferenceTraceCorrelation>

const POSITIONAL_CORRELATION: Partial<Record<EditReferenceObservedOperation, Array<[number, keyof EditReferenceTraceCorrelation]>>> = {
  updateReference: [[0, 'editReferenceId']],
  createStudy: [[0, 'editReferenceId']],
  updateStudy: [[0, 'studySessionId']],
  appendMessage: [[0, 'studySessionId']],
  addEvidence: [[0, 'studySessionId']],
  startLongFormStudy: [[0, 'studySessionId'], [1, 'referenceAssetId']],
  getLongFormStudy: [[0, 'workspaceId'], [1, 'studySessionId'], [2, 'referenceAssetId']],
  controlLongFormStudy: [[0, 'studySessionId'], [1, 'referenceAssetId']],
  runEvidenceStudy: [[0, 'studySessionId']],
  materializePreferenceDnaReasoningCandidate: [[0, 'reasoningAttemptId']],
  synthesizePreferenceDNA: [[0, 'studySessionId']],
  runPreferenceDNAQA: [[0, 'studySessionId'], [1, 'dnaVersionId']],
  approvePreferenceDNA: [[0, 'studySessionId'], [1, 'dnaVersionId']],
  createPreferenceApplication: [[0, 'studySessionId'], [1, 'dnaVersionId']],
  connectPreferenceApplication: [[0, 'preferenceApplicationId']],
  clearPreferenceApplication: [[0, 'preferenceApplicationId']],
  startStudyChatReasoningAttempt: [[0, 'reasoningAttemptId']],
  settleStudyChatReasoningAttempt: [[0, 'reasoningAttemptId']],
  cancelStudyChatReasoningAttempt: [[0, 'reasoningAttemptId']],
  reserveStudyChatProviderRequest: [[0, 'reasoningAttemptId']],
  authorizeStudyChatProviderSubmission: [[0, 'providerRequestRecordId']],
  reconcileStudyChatProviderRequest: [[0, 'providerRequestRecordId']],
  scheduleStudyChatProviderCheckback: [[0, 'providerRequestRecordId']],
  claimStudyChatProviderCheckback: [[0, 'checkbackId']],
  settleStudyChatProviderCheckback: [[0, 'checkbackId']],
  stopStudyChatProviderCheckback: [[0, 'checkbackId']],
  resumeStudyChatProviderCheckback: [[0, 'checkbackId']],
  registerStudyChatProviderWorkflow: [[0, 'checkbackId']],
  claimStudyChatProviderWorkflow: [[0, 'workflowId']],
  heartbeatStudyChatProviderWorkflow: [[0, 'workflowId']],
  recordStudyChatProviderCallbackWake: [[0, 'workflowId']],
  settleStudyChatProviderWorkflow: [[0, 'workflowId']],
  stopStudyChatProviderWorkflow: [[0, 'workflowId']],
  resumeStudyChatProviderWorkflow: [[0, 'workflowId']],
  bindStudyChatInternalCostProviderRequest: [],
  startPreferenceDnaReasoningAttempt: [[0, 'reasoningAttemptId']],
  settlePreferenceDnaReasoningAttempt: [[0, 'reasoningAttemptId']],
  cancelPreferenceDnaReasoningAttempt: [[0, 'reasoningAttemptId']],
}

const IDEMPOTENT_OPERATIONS = new Set<EditReferenceObservedOperation>(
  Object.keys(EDIT_REFERENCE_OBSERVED_OPERATIONS).filter((operation) => operation !== 'getLongFormStudy') as EditReferenceObservedOperation[],
)
