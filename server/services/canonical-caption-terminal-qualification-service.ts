import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  CANONICAL_CAPTION_TERMINAL_EVIDENCE_BUNDLE_VERSION,
  CANONICAL_CAPTION_TERMINAL_EVIDENCE_READ_PORT_VERSION,
  CANONICAL_CAPTION_TERMINAL_QUALIFICATION_RECORD_VERSION,
  CANONICAL_CAPTION_TERMINAL_QUALIFICATION_REPOSITORY_VERSION,
  CANONICAL_CAPTION_TERMINAL_QUALIFICATION_REQUEST_VERSION,
  CANONICAL_CAPTION_TERMINAL_QUALIFICATION_SERVICE_VERSION,
  type CanonicalCaptionTerminalEvidenceBundle,
  type CanonicalCaptionTerminalEvidenceReadPort,
  type CanonicalCaptionTerminalQualificationOutcome,
  type CanonicalCaptionTerminalQualificationRecord,
  type CanonicalCaptionTerminalQualificationRepository,
  type CanonicalCaptionTerminalQualificationRequest,
} from '../../src/types/canonical-caption-terminal-qualification'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import {
  CAPTION_CURRENT_JOB_READINESS_LEDGER,
} from '../captions-specialist/caption-current-job-readiness'
import {
  CAPTION_CURRENT_TERMINAL_QUALIFICATION_PREFLIGHT_V2,
  createCaptionTerminalQualificationPreflightV2,
  createCaptionTerminalQualificationProjectionV2,
  parseCaptionTerminalQualificationEvidenceInputV2,
  parseCaptionTerminalQualificationPreflightV2,
  parseCaptionTerminalQualificationProjectionV2,
} from '../captions-specialist/caption-terminal-qualification-v2'
import {
  parseCanonicalCaptionPrivateReviewEvidenceProjection,
} from './canonical-caption-private-review-evidence-service'
import type { CanonicalCreateOnlyJsonObjectPort } from
  './canonical-gcs-source-analysis-lifecycle-store'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'

const DEFAULT_PREFIX = 'private-internal/captions-specialist/v1/qualification'
const MAX_RECORD_BYTES = 64 * 1024 * 1024
const safeKey = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const prefixSchema = z.string().trim().min(1).max(1_024)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) =>
    !value.includes('..') && !value.includes('//') && !value.endsWith('/'))
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const scopeSchema = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  planVersionId: safeKey,
  approvedSnapshotRef: refSchema,
}).strict()
const requestSchema: z.ZodType<CanonicalCaptionTerminalQualificationRequest> =
z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_TERMINAL_QUALIFICATION_REQUEST_VERSION),
  requestId: safeKey,
  requestDigestSha256: sha256,
  canonicalScope: scopeSchema,
  executionPackageRef: refSchema,
  currentJobReadinessRef: refSchema,
  requiredOutputIds: z.array(safeKey).min(1).max(8),
  privateInternalQualificationRun: z.literal(true),
  callerSuppliedEvidenceAccepted: z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
  rawChatMediaBytesPathsUrlsOrCredentialsIncluded: z.literal(false),
  operationOrRuntimeAuthorityGrantedToCaption: z.literal(false),
  providerOrModelAuthorityGrantedToCaption: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalAuthorityGrantedToCaption: z.literal(false),
  creditOrBillingAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryAuthorityGrantedToCaption: z.literal(false),
  productionAuthorityGrantedToCaption: z.literal(false),
}).strict()
const bundleEnvelopeSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_TERMINAL_EVIDENCE_BUNDLE_VERSION),
  bundleId: safeKey,
  bundleDigestSha256: sha256,
  requestRef: refSchema,
  qualificationInput: z.unknown(),
  privateReviewEvidenceProjections: z.array(z.unknown()).min(1).max(8),
  sourceAuthority: z.literal('canonical_backend_persisted_caption_evidence'),
  actualCanonicalRecordsReread: z.literal(true),
  exactRequestScopePackageAndOutputSetBound: z.literal(true),
  callerSuppliedEvidenceAccepted: z.literal(false),
  sourceFixtureRelabeledAsRuntimeEvidence: z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
  operationOrRuntimeAuthorityGrantedToCaption: z.literal(false),
  providerOrModelAuthorityGrantedToCaption: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalAuthorityGrantedToCaption: z.literal(false),
  creditOrBillingAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryAuthorityGrantedToCaption: z.literal(false),
  productionAuthorityGrantedToCaption: z.literal(false),
}).strict()
const recordEnvelopeSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_TERMINAL_QUALIFICATION_RECORD_VERSION),
  recordId: safeKey,
  recordDigestSha256: sha256,
  request: z.unknown(),
  requestRef: refSchema,
  evidenceBundle: z.unknown(),
  evidenceBundleRef: refSchema,
  qualificationInputRef: refSchema,
  preflight: z.unknown(),
  terminalProjection: z.unknown(),
  createdAt: timestamp,
  exactCanonicalEvidenceReread: z.literal(true),
  evidenceBundlePersistedOwnerSideBeforeQualification: z.literal(true),
  qualificationRecordPersistedCreateOnlyAndReread: z.literal(true),
  allFortyOneJobsQualified: z.literal(true),
  allConfirmedOutputsQualified: z.literal(true),
  privateInternalOnly: z.literal(true),
  centralOrchestraImplemented: z.literal(false),
  directPeerDispatchPerformedByCaption: z.literal(false),
  operationOrRuntimeAuthorityGrantedToCaption: z.literal(false),
  providerOrModelAuthorityGrantedToCaption: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalAuthorityGrantedToCaption: z.literal(false),
  creditOrBillingAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryAuthorityGrantedToCaption: z.literal(false),
  productionAuthorityGrantedToCaption: z.literal(false),
}).strict()

const admittedEvidenceReadPorts = new WeakSet<object>()
const admittedRepositories = new WeakSet<object>()

export function createCanonicalCaptionTerminalEvidenceReadPort(
  readExact: CanonicalCaptionTerminalEvidenceReadPort['readExact'],
): CanonicalCaptionTerminalEvidenceReadPort {
  if (typeof readExact !== 'function') {
    throw new Error('Canonical Caption terminal evidence reader is required.')
  }
  const port = Object.freeze({
    schemaVersion: CANONICAL_CAPTION_TERMINAL_EVIDENCE_READ_PORT_VERSION,
    sourceAuthority:
      'canonical_backend_persisted_caption_evidence' as const,
    callerSuppliedEvidenceAccepted: false as const,
    readExact: readExact.bind(undefined),
  })
  admittedEvidenceReadPorts.add(port)
  return port
}

export function createCanonicalCaptionTerminalQualificationRequest(
  input: Omit<CanonicalCaptionTerminalQualificationRequest,
    'schemaVersion' | 'requestDigestSha256'>,
): CanonicalCaptionTerminalQualificationRequest {
  const withoutDigest = {
    schemaVersion:
      CANONICAL_CAPTION_TERMINAL_QUALIFICATION_REQUEST_VERSION,
    ...input,
  }
  return parseCanonicalCaptionTerminalQualificationRequest({
    ...withoutDigest,
    requestDigestSha256: digest(withoutDigest, 'requestDigestSha256'),
  })
}

export function parseCanonicalCaptionTerminalQualificationRequest(
  value: unknown,
): CanonicalCaptionTerminalQualificationRequest {
  assertClosedContractTree(value, 'Canonical Caption terminal request')
  rejectUnsafeText(value, 'Canonical Caption terminal request')
  const parsed = requestSchema.parse(value)
  if (parsed.requestDigestSha256 !== digest(parsed, 'requestDigestSha256')
    || !sameRef(parsed.currentJobReadinessRef, currentJobReadinessRef())
    || new Set(parsed.requiredOutputIds).size !== parsed.requiredOutputIds.length) {
    throw new Error('Canonical Caption terminal request is inconsistent.')
  }
  return structuredClone(parsed)
}

export function createCanonicalCaptionTerminalEvidenceBundle(input: {
  request: CanonicalCaptionTerminalQualificationRequest
  qualificationInput: unknown
  privateReviewEvidenceProjections: readonly unknown[]
}): CanonicalCaptionTerminalEvidenceBundle {
  const request = parseCanonicalCaptionTerminalQualificationRequest(
    input.request)
  const withoutDigest = {
    schemaVersion: CANONICAL_CAPTION_TERMINAL_EVIDENCE_BUNDLE_VERSION,
    bundleId: `caption.terminal.evidence.${request.requestDigestSha256}`,
    requestRef: requestRef(request),
    qualificationInput: structuredClone(input.qualificationInput),
    privateReviewEvidenceProjections:
      structuredClone(input.privateReviewEvidenceProjections),
    sourceAuthority:
      'canonical_backend_persisted_caption_evidence' as const,
    actualCanonicalRecordsReread: true as const,
    exactRequestScopePackageAndOutputSetBound: true as const,
    callerSuppliedEvidenceAccepted: false as const,
    sourceFixtureRelabeledAsRuntimeEvidence: false as const,
    browserLocalCompletionAccepted: false as const,
    operationOrRuntimeAuthorityGrantedToCaption: false as const,
    providerOrModelAuthorityGrantedToCaption: false as const,
    assetMutationAuthorityGrantedToCaption: false as const,
    finalQaApprovalAuthorityGrantedToCaption: false as const,
    creditOrBillingAuthorityGrantedToCaption: false as const,
    publicDeliveryAuthorityGrantedToCaption: false as const,
    productionAuthorityGrantedToCaption: false as const,
  }
  return parseCanonicalCaptionTerminalEvidenceBundle({
    ...withoutDigest,
    bundleDigestSha256: digest(withoutDigest, 'bundleDigestSha256'),
  }, request)
}

export function parseCanonicalCaptionTerminalEvidenceBundle(
  value: unknown,
  requestValue: unknown,
): CanonicalCaptionTerminalEvidenceBundle {
  const request = parseCanonicalCaptionTerminalQualificationRequest(
    requestValue)
  assertClosedContractTree(value, 'Canonical Caption terminal evidence bundle')
  rejectUnsafeText(value, 'Canonical Caption terminal evidence bundle')
  const envelope = bundleEnvelopeSchema.parse(value)
  const qualificationInput = parseCaptionTerminalQualificationEvidenceInputV2(
    envelope.qualificationInput)
  const projections = envelope.privateReviewEvidenceProjections.map(
    (projection) =>
      parseCanonicalCaptionPrivateReviewEvidenceProjection(projection))
  const preflight = createCaptionTerminalQualificationPreflightV2(
    qualificationInput, projections)
  const outputIds = qualificationInput.outputEvidence.map((output) =>
    output.outputId)
  if (envelope.bundleDigestSha256 !== digest(
    envelope, 'bundleDigestSha256')
    || !sameRef(envelope.requestRef, requestRef(request))
    || !sameScope(request.canonicalScope, qualificationInput.canonicalScope)
    || !sameRef(request.executionPackageRef,
      qualificationInput.canonicalExecution.executionPackageRef)
    || request.requiredOutputIds.join('|') !== outputIds.join('|')
    || projections.map((projection) => projection.output.outputId).join('|')
      !== outputIds.join('|')
    || preflight.disposition !== 'ready_for_terminal_projection'
    || !preflight.canonicalEvidenceAccepted) {
    throw new Error('Canonical Caption terminal evidence is inconsistent.')
  }
  return structuredClone({
    ...envelope,
    qualificationInput,
    privateReviewEvidenceProjections: projections,
  }) as CanonicalCaptionTerminalEvidenceBundle
}

export function parseCanonicalCaptionTerminalQualificationRecord(
  value: unknown,
): CanonicalCaptionTerminalQualificationRecord {
  assertClosedContractTree(value, 'Canonical Caption terminal record')
  rejectUnsafeText(value, 'Canonical Caption terminal record')
  const envelope = recordEnvelopeSchema.parse(value)
  const request = parseCanonicalCaptionTerminalQualificationRequest(
    envelope.request)
  const evidenceBundle = parseCanonicalCaptionTerminalEvidenceBundle(
    envelope.evidenceBundle, request)
  const qualificationInput = evidenceBundle.qualificationInput
  const preflight = parseCaptionTerminalQualificationPreflightV2(
    envelope.preflight, qualificationInput)
  const projection = parseCaptionTerminalQualificationProjectionV2(
    envelope.terminalProjection, qualificationInput)
  if (envelope.recordDigestSha256 !== digest(envelope, 'recordDigestSha256')
    || !sameRef(envelope.requestRef, requestRef(request))
    || !sameRef(envelope.evidenceBundleRef, bundleRef(evidenceBundle))
    || !sameRef(envelope.qualificationInputRef,
      qualificationInputRef(qualificationInput))
    || preflight.disposition !== 'ready_for_terminal_projection'
    || !preflight.canonicalEvidenceAccepted
    || projection.currentStatus
      !== 'caption_specialist_private_internal_qualified'
    || projection.counts.qualifiedPrivateInternalJobs !== 41
    || projection.counts.qualifiedOutputs !== request.requiredOutputIds.length) {
    throw new Error('Canonical Caption terminal record is inconsistent.')
  }
  return structuredClone({
    ...envelope,
    request,
    evidenceBundle,
    preflight,
    terminalProjection: projection,
  }) as CanonicalCaptionTerminalQualificationRecord
}

export function createCanonicalCaptionTerminalQualificationRepository(input: {
  objectPort: CanonicalCreateOnlyJsonObjectPort
  prefix?: string
}): CanonicalCaptionTerminalQualificationRepository {
  assertObjectPort(input.objectPort)
  const prefix = prefixSchema.parse(input.prefix ?? DEFAULT_PREFIX)
  const repository = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_TERMINAL_QUALIFICATION_REPOSITORY_VERSION,
    async persistRecordCreateOnly(untrusted: unknown) {
      assertClosedContractTree(untrusted, 'Canonical Caption terminal write')
      const write = z.object({ record: z.unknown() }).strict().parse(untrusted)
      const record = parseCanonicalCaptionTerminalQualificationRecord(
        write.record)
      return persistExact(input.objectPort,
        recordPath(prefix, record.requestRef), record)
    },
    async rereadRecord(untrusted: unknown) {
      assertClosedContractTree(untrusted, 'Canonical Caption terminal read')
      const read = z.object({ requestRef: refSchema }).strict().parse(untrusted)
      return readExact(input.objectPort, recordPath(prefix, read.requestRef))
    },
  })
  admittedRepositories.add(repository)
  return repository
}

export function createCanonicalCaptionTerminalQualificationService(input: {
  evidenceReadPort: CanonicalCaptionTerminalEvidenceReadPort
  repository: CanonicalCaptionTerminalQualificationRepository
  now?: () => Date
}) {
  assertPorts(input)
  return Object.freeze({
    schemaVersion: CANONICAL_CAPTION_TERMINAL_QUALIFICATION_SERVICE_VERSION,
    async qualifyPrivateInternal(untrusted: unknown):
    Promise<CanonicalCaptionTerminalQualificationOutcome> {
      const request = parseCanonicalCaptionTerminalQualificationRequest(
        untrusted)
      if (!currentSourceReadinessAllowsTerminalQualification()) {
        return {
          disposition: 'blocked_missing_canonical_evidence',
          request,
          preflight: structuredClone(
            CAPTION_CURRENT_TERMINAL_QUALIFICATION_PREFLIGHT_V2),
          record: null,
          terminalProjection: null,
          currentProductStatusChanged: false,
          publicOrProductionAuthorityGranted: false,
        }
      }
      const existing = await input.repository.rereadRecord({
        requestRef: requestRef(request),
      })
      if (existing) {
        const record = parseCanonicalCaptionTerminalQualificationRecord(
          existing)
        if (!sameCanonical(record.request, request)) {
          throw new Error('Canonical Caption terminal replay crossed authority.')
        }
        return outcome(request, record)
      }
      const rawBundle = await input.evidenceReadPort.readExact({ request })
      if (!rawBundle) {
        return {
          disposition: 'blocked_missing_canonical_evidence',
          request,
          preflight: structuredClone(
            CAPTION_CURRENT_TERMINAL_QUALIFICATION_PREFLIGHT_V2),
          record: null,
          terminalProjection: null,
          currentProductStatusChanged: false,
          publicOrProductionAuthorityGranted: false,
        }
      }
      const bundle = parseCanonicalCaptionTerminalEvidenceBundle(
        rawBundle, request)
      const preflight = createCaptionTerminalQualificationPreflightV2(
        bundle.qualificationInput, bundle.privateReviewEvidenceProjections)
      const terminalProjection = createCaptionTerminalQualificationProjectionV2(
        bundle.qualificationInput, bundle.privateReviewEvidenceProjections)
      const withoutDigest = {
        schemaVersion:
          CANONICAL_CAPTION_TERMINAL_QUALIFICATION_RECORD_VERSION,
        recordId: `caption.terminal.qualification.${request.requestDigestSha256}`,
        request,
        requestRef: requestRef(request),
        evidenceBundle: bundle,
        evidenceBundleRef: bundleRef(bundle),
        qualificationInputRef: qualificationInputRef(
          bundle.qualificationInput),
        preflight,
        terminalProjection,
        createdAt: (input.now ?? (() => new Date()))().toISOString(),
        exactCanonicalEvidenceReread: true as const,
        evidenceBundlePersistedOwnerSideBeforeQualification: true as const,
        qualificationRecordPersistedCreateOnlyAndReread: true as const,
        allFortyOneJobsQualified: true as const,
        allConfirmedOutputsQualified: true as const,
        privateInternalOnly: true as const,
        centralOrchestraImplemented: false as const,
        directPeerDispatchPerformedByCaption: false as const,
        operationOrRuntimeAuthorityGrantedToCaption: false as const,
        providerOrModelAuthorityGrantedToCaption: false as const,
        assetMutationAuthorityGrantedToCaption: false as const,
        finalQaApprovalAuthorityGrantedToCaption: false as const,
        creditOrBillingAuthorityGrantedToCaption: false as const,
        publicDeliveryAuthorityGrantedToCaption: false as const,
        productionAuthorityGrantedToCaption: false as const,
      }
      const record = parseCanonicalCaptionTerminalQualificationRecord({
        ...withoutDigest,
        recordDigestSha256: digest(withoutDigest, 'recordDigestSha256'),
      })
      await input.repository.persistRecordCreateOnly({ record })
      const reread = await input.repository.rereadRecord({
        requestRef: requestRef(request),
      })
      if (!reread || !sameCanonical(reread, record)) {
        throw new Error('Canonical Caption terminal record reread failed.')
      }
      return outcome(request,
        parseCanonicalCaptionTerminalQualificationRecord(reread))
    },
  })
}

function outcome(
  request: CanonicalCaptionTerminalQualificationRequest,
  record: CanonicalCaptionTerminalQualificationRecord,
): CanonicalCaptionTerminalQualificationOutcome {
  return {
    disposition: 'qualified_private_internal',
    request: structuredClone(request),
    preflight: structuredClone(record.preflight),
    record: structuredClone(record),
    terminalProjection: structuredClone(record.terminalProjection),
    currentProductStatusChanged: false,
    publicOrProductionAuthorityGranted: false,
  }
}

function currentJobReadinessRef(): CaptionDomainRef {
  return {
    id: CAPTION_CURRENT_JOB_READINESS_LEDGER.ledgerId,
    version: CAPTION_CURRENT_JOB_READINESS_LEDGER.schemaVersion,
    contentHash: CAPTION_CURRENT_JOB_READINESS_LEDGER.ledgerDigestSha256,
  }
}

function currentSourceReadinessAllowsTerminalQualification(): boolean {
  const ledger = CAPTION_CURRENT_JOB_READINESS_LEDGER
  return ledger.counts.sourcePathsReadyForPrivateEvidenceRun
      === ledger.counts.declaredSupportedJobs
    && ledger.counts.jobsWaitingOnCanonicalOwnerMount === 0
    && ledger.ownerMounts.every((owner) =>
      owner.canonicalCompositionMountImplemented)
    && ledger.jobs.every((job) =>
      job.sourceReadiness === 'ready_for_private_internal_evidence_run'
      && job.missingCanonicalOwnerMountKeys.length === 0)
}

function requestRef(
  request: CanonicalCaptionTerminalQualificationRequest,
): CaptionDomainRef {
  return {
    id: request.requestId,
    version: request.schemaVersion,
    contentHash: request.requestDigestSha256,
  }
}

function bundleRef(bundle: CanonicalCaptionTerminalEvidenceBundle):
CaptionDomainRef {
  return {
    id: bundle.bundleId,
    version: bundle.schemaVersion,
    contentHash: bundle.bundleDigestSha256,
  }
}

function qualificationInputRef(
  input: CanonicalCaptionTerminalEvidenceBundle['qualificationInput'],
): CaptionDomainRef {
  return {
    id: input.inputId,
    version: input.schemaVersion,
    contentHash: input.inputDigestSha256,
  }
}

function sameScope(
  left: CanonicalCaptionTerminalQualificationRequest['canonicalScope'],
  right: CanonicalCaptionTerminalEvidenceBundle[
    'qualificationInput']['canonicalScope'],
): boolean {
  return left.ownerUserId === right.ownerUserId
    && left.workspaceId === right.workspaceId
    && left.projectId === right.projectId
    && left.editSessionId === right.editSessionId
    && left.planVersionId === right.planVersionId
    && sameRef(left.approvedSnapshotRef, right.approvedSnapshotRef)
}

function sameRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function digest(value: unknown, field: string): string {
  return calculateSkillContractDigest(
    value as Record<string, unknown>, field)
}

function sameCanonical(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function recordPath(prefix: string, value: CaptionDomainRef): string {
  return `${prefix}/records/${value.contentHash}.json`
}

async function persistExact(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  value: CanonicalCaptionTerminalQualificationRecord,
): Promise<'created' | 'identical_replay'> {
  const body = serialize(value)
  const disposition = await port.createOnly({
    objectPath,
    body,
    contentSha256: createHash('sha256').update(body).digest('hex'),
  })
  const reread = await readExact(port, objectPath)
  if (!reread || !sameCanonical(reread, value)) {
    throw new Error('Canonical Caption terminal create-only reread failed.')
  }
  return disposition === 'created' ? 'created' : 'identical_replay'
}

async function readExact(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
): Promise<CanonicalCaptionTerminalQualificationRecord | null> {
  const body = await port.readExact(objectPath)
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw new Error('Canonical Caption terminal record bytes are invalid.')
  }
  try {
    return parseCanonicalCaptionTerminalQualificationRecord(
      JSON.parse(body.toString('utf8')) as unknown)
  } catch (error) {
    if (error instanceof Error
      && error.message.includes('Canonical Caption terminal')) throw error
    throw new Error('Canonical Caption terminal record JSON is invalid.', {
      cause: error,
    })
  }
}

function serialize(value: unknown): Buffer {
  const body = Buffer.from(JSON.stringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw new Error('Canonical Caption terminal record size is invalid.')
  }
  return body
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error('Canonical Caption terminal object port is incomplete.')
  }
}

function assertPorts(input: {
  evidenceReadPort: CanonicalCaptionTerminalEvidenceReadPort
  repository: CanonicalCaptionTerminalQualificationRepository
}): void {
  if (!admittedEvidenceReadPorts.has(input.evidenceReadPort)
    || !admittedRepositories.has(input.repository)
    || input.evidenceReadPort.schemaVersion
      !== CANONICAL_CAPTION_TERMINAL_EVIDENCE_READ_PORT_VERSION
    || input.evidenceReadPort.sourceAuthority
      !== 'canonical_backend_persisted_caption_evidence'
    || input.evidenceReadPort.callerSuppliedEvidenceAccepted
    || input.repository.schemaVersion
      !== CANONICAL_CAPTION_TERMINAL_QUALIFICATION_REPOSITORY_VERSION
    || typeof input.repository?.persistRecordCreateOnly !== 'function'
    || typeof input.repository?.rereadRecord !== 'function') {
    throw new Error('Canonical Caption terminal ports are incomplete.')
  }
}

function rejectUnsafeText(value: unknown, label: string): void {
  const stack: unknown[] = [value]
  while (stack.length > 0) {
    const current = stack.pop()
    if (typeof current === 'string') {
      if (/https?:\/\/|file:\/\/|data:|blob:|javascript:|\/(?:Users|Volumes|home|tmp)\/|\\|\.\.[/\\]|(?:authorization|password|credential|secret|access[_ -]?token|refresh[_ -]?token)\s*[:=]|\bsk-[a-z0-9_-]+|AIza[a-z0-9_-]+/iu.test(current)) {
        throw new Error(`${label} contains unsafe serialized text.`)
      }
    } else if (Array.isArray(current)) stack.push(...current)
    else if (current && typeof current === 'object') {
      stack.push(...Object.values(current as Record<string, unknown>))
    }
  }
}
