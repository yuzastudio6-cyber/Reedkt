import { createHash, randomUUID } from 'node:crypto'
import { sanitizeLogPayload } from '../observability/sanitized-log-policy'

export const EDIT_REFERENCE_OBSERVABILITY_VERSION = 'edit-reference-observability-v1' as const

export type EditReferenceObservabilityDomain =
  | 'reference'
  | 'study'
  | 'skill'
  | 'provider'
  | 'worker'
  | 'dna'
  | 'application'
  | 'retention'
  | 'recovery'

export type EditReferenceObservabilityPhase =
  | 'started'
  | 'completed'
  | 'failed'
  | 'blocked'
  | 'retrying'
  | 'paused'
  | 'resumed'
  | 'cancelled'
  | 'review_required'
  | 'ready'
  | 'stale'
  | 'deleted'
  | 'restored'

export type EditReferenceObservabilitySeverity = 'info' | 'warning' | 'error' | 'critical'

export const EDIT_REFERENCE_OBSERVED_OPERATIONS = {
  createReference: 'reference',
  updateReference: 'reference',
  createStudy: 'study',
  updateStudy: 'study',
  appendMessage: 'study',
  addEvidence: 'study',
  startLongFormStudy: 'study',
  getLongFormStudy: 'study',
  controlLongFormStudy: 'study',
  runEvidenceStudy: 'skill',
  reserveStudyChatReasoningAttempt: 'provider',
  startStudyChatReasoningAttempt: 'provider',
  settleStudyChatReasoningAttempt: 'provider',
  cancelStudyChatReasoningAttempt: 'provider',
  reserveStudyChatProviderRequest: 'provider',
  authorizeStudyChatProviderSubmission: 'provider',
  reconcileStudyChatProviderRequest: 'provider',
  scheduleStudyChatProviderCheckback: 'worker',
  claimStudyChatProviderCheckback: 'worker',
  settleStudyChatProviderCheckback: 'worker',
  stopStudyChatProviderCheckback: 'worker',
  resumeStudyChatProviderCheckback: 'worker',
  registerStudyChatProviderWorkflow: 'worker',
  claimStudyChatProviderWorkflow: 'worker',
  heartbeatStudyChatProviderWorkflow: 'worker',
  recordStudyChatProviderCallbackWake: 'worker',
  settleStudyChatProviderWorkflow: 'worker',
  stopStudyChatProviderWorkflow: 'worker',
  resumeStudyChatProviderWorkflow: 'worker',
  registerStudyChatInternalCostAuthority: 'provider',
  authorizeStudyChatInternalCost: 'provider',
  bindStudyChatInternalCostProviderRequest: 'provider',
  settleStudyChatInternalCost: 'provider',
  reservePreferenceDnaReasoningAttempt: 'provider',
  startPreferenceDnaReasoningAttempt: 'provider',
  settlePreferenceDnaReasoningAttempt: 'provider',
  cancelPreferenceDnaReasoningAttempt: 'provider',
  materializePreferenceDnaReasoningCandidate: 'dna',
  synthesizePreferenceDNA: 'dna',
  runPreferenceDNAQA: 'dna',
  approvePreferenceDNA: 'dna',
  createPreferenceApplication: 'application',
  connectPreferenceApplication: 'application',
  clearPreferenceApplication: 'application',
} as const satisfies Record<string, EditReferenceObservabilityDomain>

export type EditReferenceObservedOperation = keyof typeof EDIT_REFERENCE_OBSERVED_OPERATIONS

export interface EditReferenceTraceCorrelation {
  traceId: string
  requestId: string
  workspaceId?: string
  projectId?: string
  editSessionId?: string
  editReferenceId?: string
  studySessionId?: string
  referenceAssetId?: string
  skillRunId?: string
  dnaVersionId?: string
  preferenceApplicationId?: string
  approvedSnapshotId?: string
  reasoningAttemptId?: string
  providerRequestRecordId?: string
  checkbackId?: string
  workflowId?: string
  costAuthorityRecordId?: string
  jobId?: string
  idempotencyKeyHash?: string
}

export interface EditReferenceObservableEvent {
  schemaVersion: typeof EDIT_REFERENCE_OBSERVABILITY_VERSION
  eventId: string
  occurredAt: string
  domain: EditReferenceObservabilityDomain
  operation: EditReferenceObservedOperation | EditReferenceOperationalEventName
  phase: EditReferenceObservabilityPhase
  severity: EditReferenceObservabilitySeverity
  correlation: EditReferenceTraceCorrelation
  durationMs?: number
  replayed?: boolean
  reasonCode?: string
  skillFamily?: string
  providerRouteId?: string
  modelRouteId?: string
  workerType?: string
  internalCostMicros?: number
  progressBasisPoints?: number
  sourceMediaContentPresent: false
  modelInputTextPresent: false
  providerResponsePresent: false
  temporaryAccessLinkPresent: false
  credentialMaterialPresent: false
  customerPriceIncluded: false
  customerCreditsMutated: false
  serviceFeeIncluded: false
  deploymentClaimIncluded: false
  productionReadinessClaimIncluded: false
}

export type EditReferenceOperationalEventName =
  | 'skill_run'
  | 'provider_attempt'
  | 'worker_status'
  | 'study_progress'
  | 'retention_deletion'
  | 'backup_restore'
  | 'rollback'

export interface CreateEditReferenceObservableEventInput {
  eventId?: string
  occurredAt?: string
  domain: EditReferenceObservabilityDomain
  operation: EditReferenceObservableEvent['operation']
  phase: EditReferenceObservabilityPhase
  severity?: EditReferenceObservabilitySeverity
  correlation: EditReferenceTraceCorrelation
  durationMs?: number
  replayed?: boolean
  reasonCode?: string
  skillFamily?: string
  providerRouteId?: string
  modelRouteId?: string
  workerType?: string
  internalCostMicros?: number
  progressBasisPoints?: number
}

export interface EditReferenceMetricDefinition {
  metricName: string
  description: string
  unit: 'count' | 'ms' | 'usd_micros' | 'basis_points'
  labels: string[]
  lowCardinalityLabelsOnly: true
  templateOnly: true
  doesNotDeploy: true
}

export interface EditReferenceMetricSample {
  metricName: string
  value: number
  labels: Record<string, string>
}

export interface EditReferenceAlertTemplate {
  alertId: string
  description: string
  metricName: string
  severity: EditReferenceObservabilitySeverity
  runbookId: string
  templateOnly: true
  doesNotDeploy: true
}

export interface EditReferenceObservabilitySink {
  emit(event: EditReferenceObservableEvent, metrics: EditReferenceMetricSample[]): void | Promise<void>
}

export const editReferenceMetricsCatalog: EditReferenceMetricDefinition[] = [
  metric('edit_reference_operation_count', 'Observed Edit Reference operations by bounded operation and phase.', 'count', ['operation', 'phase', 'replayed']),
  metric('edit_reference_operation_duration_ms', 'Observed Edit Reference operation duration.', 'ms', ['operation', 'phase']),
  metric('edit_reference_operation_failure_count', 'Failed or blocked Edit Reference operations.', 'count', ['operation', 'reasonCode']),
  metric('edit_reference_study_progress_basis_points', 'Output-backed long-form study progress.', 'basis_points', ['phase']),
  metric('edit_reference_skill_run_count', 'Specialist study runs by family and phase.', 'count', ['skillFamily', 'phase']),
  metric('edit_reference_provider_attempt_count', 'Provider attempts by approved route and phase.', 'count', ['providerRouteId', 'phase']),
  metric('edit_reference_provider_duration_ms', 'Provider attempt duration by approved route.', 'ms', ['providerRouteId', 'phase']),
  metric('edit_reference_internal_cost_micros', 'Actual internal provider cost only, excluding customer price, credits, and service fee.', 'usd_micros', ['providerRouteId', 'phase']),
  metric('edit_reference_worker_status_count', 'Worker/checkback/workflow state transitions.', 'count', ['workerType', 'phase']),
  metric('edit_reference_dna_qa_failure_count', 'Preference DNA or QA failures.', 'count', ['operation', 'reasonCode']),
  metric('edit_reference_application_lifecycle_count', 'Preference Application lifecycle transitions.', 'count', ['operation', 'phase']),
  metric('edit_reference_retention_deletion_count', 'Retention/deletion outcomes.', 'count', ['phase', 'reasonCode']),
  metric('edit_reference_recovery_verification_count', 'Backup, restore, or rollback verification outcomes.', 'count', ['operation', 'phase']),
]

export const editReferenceAlertCatalog: EditReferenceAlertTemplate[] = [
  alert('edit_reference_study_stalled', 'Output-backed study progress stopped beyond the approved operations threshold.', 'edit_reference_study_progress_basis_points', 'warning', 'ER-RUNBOOK-STUDY-STALLED'),
  alert('edit_reference_skill_failure_rate', 'One or more specialist study families are failing repeatedly.', 'edit_reference_skill_run_count', 'error', 'ER-RUNBOOK-SKILL-FAILURE'),
  alert('edit_reference_provider_timeout_or_cost', 'A provider attempt timed out or approached its approved internal-cost ceiling.', 'edit_reference_provider_attempt_count', 'error', 'ER-RUNBOOK-PROVIDER-RECOVERY'),
  alert('edit_reference_worker_stuck_or_retrying', 'A checkback or workflow worker is stale or retrying beyond policy.', 'edit_reference_worker_status_count', 'error', 'ER-RUNBOOK-WORKER-RECOVERY'),
  alert('edit_reference_dna_qa_failures', 'Preference DNA or deterministic QA failures increased.', 'edit_reference_dna_qa_failure_count', 'error', 'ER-RUNBOOK-DNA-QA'),
  alert('edit_reference_application_invalidation_failure', 'Application replacement/removal could not complete downstream invalidation.', 'edit_reference_application_lifecycle_count', 'critical', 'ER-RUNBOOK-APPLICATION-INVALIDATION'),
  alert('edit_reference_retention_deletion_failure', 'A retention/deletion request failed or remained incomplete.', 'edit_reference_retention_deletion_count', 'critical', 'ER-RUNBOOK-RETENTION-DELETION'),
  alert('edit_reference_recovery_verification_stale', 'Backup/restore or rollback verification is missing or stale.', 'edit_reference_recovery_verification_count', 'critical', 'ER-RUNBOOK-RECOVERY'),
]

export function createEditReferenceObservableEvent(
  input: CreateEditReferenceObservableEventInput,
): EditReferenceObservableEvent {
  const event: EditReferenceObservableEvent = {
    schemaVersion: EDIT_REFERENCE_OBSERVABILITY_VERSION,
    eventId: normalizeIdentifier(input.eventId ?? `edit-reference-observation-${randomUUID()}`),
    occurredAt: normalizeTimestamp(input.occurredAt ?? new Date().toISOString()),
    domain: input.domain,
    operation: input.operation,
    phase: input.phase,
    severity: input.severity ?? severityForPhase(input.phase),
    correlation: normalizeCorrelation(input.correlation),
    ...(input.durationMs === undefined ? {} : { durationMs: normalizeInteger(input.durationMs, 'durationMs', 0, 86_400_000) }),
    ...(input.replayed === undefined ? {} : { replayed: input.replayed }),
    ...(input.reasonCode === undefined ? {} : { reasonCode: normalizeIdentifier(input.reasonCode) }),
    ...(input.skillFamily === undefined ? {} : { skillFamily: normalizeIdentifier(input.skillFamily) }),
    ...(input.providerRouteId === undefined ? {} : { providerRouteId: normalizeIdentifier(input.providerRouteId) }),
    ...(input.modelRouteId === undefined ? {} : { modelRouteId: normalizeIdentifier(input.modelRouteId) }),
    ...(input.workerType === undefined ? {} : { workerType: normalizeIdentifier(input.workerType) }),
    ...(input.internalCostMicros === undefined ? {} : { internalCostMicros: normalizeInteger(input.internalCostMicros, 'internalCostMicros', 0, Number.MAX_SAFE_INTEGER) }),
    ...(input.progressBasisPoints === undefined ? {} : { progressBasisPoints: normalizeInteger(input.progressBasisPoints, 'progressBasisPoints', 0, 10_000) }),
    sourceMediaContentPresent: false,
    modelInputTextPresent: false,
    providerResponsePresent: false,
    temporaryAccessLinkPresent: false,
    credentialMaterialPresent: false,
    customerPriceIncluded: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
    deploymentClaimIncluded: false,
    productionReadinessClaimIncluded: false,
  }
  validateEditReferenceObservableEvent(event)
  return event
}

export function validateEditReferenceObservableEvent(value: unknown): asserts value is EditReferenceObservableEvent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Edit Reference observation must be an object.')
  const event = value as Record<string, unknown>
  assertExactKeys(event, EVENT_KEYS, 'event')
  if (event.schemaVersion !== EDIT_REFERENCE_OBSERVABILITY_VERSION) throw new Error('Unsupported Edit Reference observation schema.')
  normalizeIdentifier(event.eventId)
  normalizeTimestamp(event.occurredAt)
  if (!DOMAINS.has(event.domain as EditReferenceObservabilityDomain)) throw new Error('Unknown Edit Reference observation domain.')
  if (!isKnownOperation(event.operation)) throw new Error('Unknown Edit Reference observation operation.')
  if (!PHASES.has(event.phase as EditReferenceObservabilityPhase)) throw new Error('Unknown Edit Reference observation phase.')
  if (!SEVERITIES.has(event.severity as EditReferenceObservabilitySeverity)) throw new Error('Unknown Edit Reference observation severity.')
  if (event.operation in EDIT_REFERENCE_OBSERVED_OPERATIONS) {
    const expected = EDIT_REFERENCE_OBSERVED_OPERATIONS[event.operation as EditReferenceObservedOperation]
    if (event.domain !== expected) throw new Error('Edit Reference operation/domain mismatch.')
  }
  normalizeCorrelation(event.correlation as EditReferenceTraceCorrelation)
  if (event.durationMs !== undefined) normalizeInteger(event.durationMs, 'durationMs', 0, 86_400_000)
  if (event.internalCostMicros !== undefined) normalizeInteger(event.internalCostMicros, 'internalCostMicros', 0, Number.MAX_SAFE_INTEGER)
  if (event.progressBasisPoints !== undefined) normalizeInteger(event.progressBasisPoints, 'progressBasisPoints', 0, 10_000)
  for (const key of ['reasonCode', 'skillFamily', 'providerRouteId', 'modelRouteId', 'workerType']) {
    if (event[key] !== undefined) normalizeIdentifier(event[key])
  }
  for (const key of SAFETY_FALSE_KEYS) if (event[key] !== false) throw new Error(`${key} must remain false.`)
  const findings = sanitizeLogPayload(event).findings
  if (findings.length > 0) throw new Error(`Unsafe Edit Reference observation field: ${findings[0]?.path ?? 'unknown'}`)
}

export function deriveEditReferenceMetricSamples(event: EditReferenceObservableEvent): EditReferenceMetricSample[] {
  validateEditReferenceObservableEvent(event)
  const samples: EditReferenceMetricSample[] = [{
    metricName: 'edit_reference_operation_count',
    value: 1,
    labels: { operation: event.operation, phase: event.phase, replayed: String(event.replayed === true) },
  }]
  if (event.durationMs !== undefined) samples.push({
    metricName: 'edit_reference_operation_duration_ms',
    value: event.durationMs,
    labels: { operation: event.operation, phase: event.phase },
  })
  if (event.phase === 'failed' || event.phase === 'blocked') samples.push({
    metricName: 'edit_reference_operation_failure_count',
    value: 1,
    labels: { operation: event.operation, reasonCode: event.reasonCode ?? 'unknown' },
  })
  if (event.progressBasisPoints !== undefined) samples.push({
    metricName: 'edit_reference_study_progress_basis_points',
    value: event.progressBasisPoints,
    labels: { phase: event.phase },
  })
  if (event.skillFamily) samples.push({
    metricName: 'edit_reference_skill_run_count',
    value: 1,
    labels: { skillFamily: event.skillFamily, phase: event.phase },
  })
  if (event.providerRouteId) {
    samples.push({ metricName: 'edit_reference_provider_attempt_count', value: 1, labels: { providerRouteId: event.providerRouteId, phase: event.phase } })
    if (event.durationMs !== undefined) samples.push({ metricName: 'edit_reference_provider_duration_ms', value: event.durationMs, labels: { providerRouteId: event.providerRouteId, phase: event.phase } })
    if (event.internalCostMicros !== undefined) samples.push({ metricName: 'edit_reference_internal_cost_micros', value: event.internalCostMicros, labels: { providerRouteId: event.providerRouteId, phase: event.phase } })
  }
  if (event.workerType) samples.push({ metricName: 'edit_reference_worker_status_count', value: 1, labels: { workerType: event.workerType, phase: event.phase } })
  if (event.domain === 'dna' && (event.phase === 'failed' || event.phase === 'blocked' || event.phase === 'review_required')) samples.push({ metricName: 'edit_reference_dna_qa_failure_count', value: 1, labels: { operation: event.operation, reasonCode: event.reasonCode ?? 'review_required' } })
  if (event.domain === 'application') samples.push({ metricName: 'edit_reference_application_lifecycle_count', value: 1, labels: { operation: event.operation, phase: event.phase } })
  if (event.domain === 'retention') samples.push({ metricName: 'edit_reference_retention_deletion_count', value: 1, labels: { phase: event.phase, reasonCode: event.reasonCode ?? 'none' } })
  if (event.domain === 'recovery') samples.push({ metricName: 'edit_reference_recovery_verification_count', value: 1, labels: { operation: event.operation, phase: event.phase } })
  assertMetricSamples(samples)
  return samples
}

export function hashEditReferenceIdempotencyKey(value: string): string {
  if (!value) throw new Error('Idempotency key is required before hashing.')
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function metric(metricName: string, description: string, unit: EditReferenceMetricDefinition['unit'], labels: string[]): EditReferenceMetricDefinition {
  return { metricName, description, unit, labels, lowCardinalityLabelsOnly: true, templateOnly: true, doesNotDeploy: true }
}

function alert(alertId: string, description: string, metricName: string, severity: EditReferenceObservabilitySeverity, runbookId: string): EditReferenceAlertTemplate {
  return { alertId, description, metricName, severity, runbookId, templateOnly: true, doesNotDeploy: true }
}

function normalizeCorrelation(value: EditReferenceTraceCorrelation): EditReferenceTraceCorrelation {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Edit Reference trace correlation is required.')
  assertExactKeys(value as unknown as Record<string, unknown>, CORRELATION_KEYS, 'correlation')
  const normalized = Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeIdentifier(entry)])) as unknown as EditReferenceTraceCorrelation
  if (!normalized.traceId || !normalized.requestId) throw new Error('Trace and request IDs are required.')
  return normalized
}

function normalizeIdentifier(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,191}$/.test(value)) {
    throw new Error('Observation identifiers must be bounded opaque IDs.')
  }
  return value
}

function normalizeTimestamp(value: unknown): string {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new Error('Observation timestamp must be canonical ISO-8601.')
  }
  return value
}

function normalizeInteger(value: unknown, name: string, minimum: number, maximum: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be a bounded safe integer.`)
  }
  return value
}

function severityForPhase(phase: EditReferenceObservabilityPhase): EditReferenceObservabilitySeverity {
  if (phase === 'failed') return 'error'
  if (phase === 'blocked' || phase === 'retrying' || phase === 'review_required' || phase === 'stale') return 'warning'
  return 'info'
}

function isKnownOperation(value: unknown): value is EditReferenceObservableEvent['operation'] {
  return typeof value === 'string'
    && (value in EDIT_REFERENCE_OBSERVED_OPERATIONS || OPERATIONAL_EVENTS.has(value as EditReferenceOperationalEventName))
}

function assertMetricSamples(samples: EditReferenceMetricSample[]): void {
  const definitions = new Map(editReferenceMetricsCatalog.map((definition) => [definition.metricName, definition]))
  for (const sample of samples) {
    const definition = definitions.get(sample.metricName)
    if (!definition) throw new Error(`Unknown Edit Reference metric ${sample.metricName}.`)
    if (!Number.isSafeInteger(sample.value) || sample.value < 0) throw new Error(`Metric ${sample.metricName} must be a non-negative safe integer.`)
    if (Object.keys(sample.labels).sort().join('|') !== definition.labels.slice().sort().join('|')) {
      throw new Error(`Metric ${sample.metricName} labels do not match its low-cardinality definition.`)
    }
    for (const value of Object.values(sample.labels)) normalizeIdentifier(value)
  }
}

function assertExactKeys(value: Record<string, unknown>, allowed: ReadonlySet<string>, label: string): void {
  for (const key of Object.keys(value)) if (!allowed.has(key)) throw new Error(`Unknown ${label} field ${key}.`)
}

const DOMAINS = new Set<EditReferenceObservabilityDomain>(['reference', 'study', 'skill', 'provider', 'worker', 'dna', 'application', 'retention', 'recovery'])
const PHASES = new Set<EditReferenceObservabilityPhase>(['started', 'completed', 'failed', 'blocked', 'retrying', 'paused', 'resumed', 'cancelled', 'review_required', 'ready', 'stale', 'deleted', 'restored'])
const SEVERITIES = new Set<EditReferenceObservabilitySeverity>(['info', 'warning', 'error', 'critical'])
const OPERATIONAL_EVENTS = new Set<EditReferenceOperationalEventName>(['skill_run', 'provider_attempt', 'worker_status', 'study_progress', 'retention_deletion', 'backup_restore', 'rollback'])
const SAFETY_FALSE_KEYS = ['sourceMediaContentPresent', 'modelInputTextPresent', 'providerResponsePresent', 'temporaryAccessLinkPresent', 'credentialMaterialPresent', 'customerPriceIncluded', 'customerCreditsMutated', 'serviceFeeIncluded', 'deploymentClaimIncluded', 'productionReadinessClaimIncluded'] as const
const EVENT_KEYS = new Set(['schemaVersion', 'eventId', 'occurredAt', 'domain', 'operation', 'phase', 'severity', 'correlation', 'durationMs', 'replayed', 'reasonCode', 'skillFamily', 'providerRouteId', 'modelRouteId', 'workerType', 'internalCostMicros', 'progressBasisPoints', ...SAFETY_FALSE_KEYS])
const CORRELATION_KEYS = new Set(['traceId', 'requestId', 'workspaceId', 'projectId', 'editSessionId', 'editReferenceId', 'studySessionId', 'referenceAssetId', 'skillRunId', 'dnaVersionId', 'preferenceApplicationId', 'approvedSnapshotId', 'reasoningAttemptId', 'providerRequestRecordId', 'checkbackId', 'workflowId', 'costAuthorityRecordId', 'jobId', 'idempotencyKeyHash'])
