import { createHash } from 'node:crypto'

import { z } from 'zod'

import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import {
  SKILL_QUALIFICATION_SNAPSHOT_VERSION,
  type SkillQualificationSnapshot,
} from '../../src/types/orchestra-skill-contracts'
import type {
  CanonicalCaptionPrivateQualificationCatalog,
  CanonicalCaptionPrivateQualificationCatalogReadPort,
} from '../../src/types/canonical-caption-private-qualification-catalog'
import {
  CANONICAL_CAPTION_PRIVATE_INTERNAL_QUALIFICATION_RECORD_VERSION,
  CANONICAL_CAPTION_PRIVATE_INTERNAL_QUALIFICATION_REPOSITORY_VERSION,
  CANONICAL_CAPTION_PRIVATE_INTERNAL_QUALIFICATION_SERVICE_VERSION,
  type CanonicalCaptionPrivateInternalQualificationOutcome,
  type CanonicalCaptionPrivateInternalQualificationRecord,
  type CanonicalCaptionPrivateInternalQualificationRepository,
  type CanonicalCaptionPrivateInternalQualificationService,
} from '../../src/types/canonical-caption-private-internal-qualification'
import {
  CAPTIONS_SUPPORTED_JOB_TYPES,
} from '../../src/types/captions-specialist'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import {
  calculateSkillContractDigest,
  parseSkillQualificationSnapshot,
} from '../orchestra/orchestra-skill-contracts'
import {
  CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST,
} from '../captions-specialist/captions-specialist-integration-manifest'
import {
  isCanonicalCaptionPrivateQualificationCatalogReadPort,
  parseCanonicalCaptionPrivateQualificationCatalog,
  parseCanonicalCaptionPrivateQualificationCatalogRequest,
} from './canonical-caption-private-qualification-catalog-service'
import type { CanonicalCreateOnlyJsonObjectPort } from
  './canonical-gcs-source-analysis-lifecycle-store'

const safeKey = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const jobSchema = z.enum(CAPTIONS_SUPPORTED_JOB_TYPES)
const qualifiedJobSchema = z.object({
  jobType: jobSchema,
  sourceCatalogJobEvidenceRef: refSchema,
  sourceApprovedRunEvidenceRef: refSchema,
  sourceReviewedOutputEvidenceRef: refSchema,
  status: z.literal('qualified'),
  qualifiedModes: z.tuple([
    z.literal('planning'), z.literal('private_internal'),
  ]),
  exactApprovedRunEvidenceReread: z.literal(true),
  exactOwnerEvidenceReread: z.literal(true),
  exactRenderedOutputAndQaReread: z.literal(true),
  actualCompleteTimeVisualReviewPassed: z.literal(true),
  actualIndependentFinalQaPassed: z.literal(true),
  actualPrivateReviewAccepted: z.literal(true),
  planningOnlyEvidenceAcceptedAsQualification: z.literal(false),
  syntheticEngineeringFixtureAcceptedAsProfessionalAppearance:
    z.literal(false),
  blockerCodes: z.array(safeKey).length(0),
}).strict()
const recordSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_PRIVATE_INTERNAL_QUALIFICATION_RECORD_VERSION),
  recordId: safeKey,
  recordDigestSha256: sha256,
  requestRef: refSchema,
  catalogRef: refSchema,
  sourcePlanningQualificationSnapshotRef: refSchema,
  privateInternalQualificationSnapshot: z.unknown(),
  privateInternalQualificationSnapshotRef: refSchema,
  qualifiedAt: z.string().datetime({ offset: true }),
  qualificationScope: z.object({
    ownerUserId: safeKey,
    workspaceId: safeKey,
    suiteId: safeKey,
  }).strict(),
  qualifiedJobs: z.array(qualifiedJobSchema).length(41),
  counts: z.object({
    approvedRuns: z.number().int().min(2).max(128),
    qualifiedCaptionJobs: z.literal(41),
    blockedCaptionJobs: z.literal(0),
    excludedSupportedCaptionJobs: z.literal(0),
    qualifiedOwnerClasses: z.literal(5),
    qualifiedReviewedOutputs: z.number().int().min(2).max(128),
  }).strict(),
  currentStatus: z.literal('caption_specialist_private_internal_qualified'),
  privateInternalSpecialistQualified: z.literal(true),
  allRequiredSupportedCaptionJobsQualified: z.literal(true),
  realApprovedRunsAggregated: z.literal(true),
  actualRenderedOutputsReread: z.literal(true),
  actualCompleteTimeVisualReviewConsumed: z.literal(true),
  actualIndependentFinalQaAndPrivateReviewConsumed: z.literal(true),
  finalPerJobQualificationProjectionPublished: z.literal(true),
  documentationAndFutureOrchestraMountStillSeparate: z.literal(true),
  publicProductionRequiredForThisStatus: z.literal(false),
  centralOrchestraRequiredForThisStatus: z.literal(false),
  centralOrchestraImplemented: z.literal(false),
  callerSuppliedEvidenceAccepted: z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
  oneAllFeatureEditFabricated: z.literal(false),
  planningOnlyEvidenceAcceptedAsQualification: z.literal(false),
  syntheticEngineeringFixtureAcceptedAsProfessionalAppearance:
    z.literal(false),
  directPeerDispatchPerformedByCaption: z.literal(false),
  operationOrRuntimeAuthorityGrantedToCaption: z.literal(false),
  providerOrModelAuthorityGrantedToCaption: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalAuthorityGrantedToCaption: z.literal(false),
  creditOrBillingAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryAuthorityGrantedToCaption: z.literal(false),
  productionAuthorityGrantedToCaption: z.literal(false),
}).strict()
const prefixSchema = z.string().trim().min(1).max(1_024)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) =>
    !value.includes('..') && !value.includes('//') && !value.endsWith('/'))
const DEFAULT_PREFIX =
  'private-internal/captions-specialist/v1/private-qualification-records'
const MAX_RECORD_BYTES = 64 * 1024 * 1024
const admittedRepositories = new WeakSet<object>()

export function parseCanonicalCaptionPrivateInternalQualificationRecord(
  value: unknown,
): CanonicalCaptionPrivateInternalQualificationRecord {
  assertClosedContractTree(value,
    'Canonical Caption private internal qualification record')
  rejectUnsafeText(value,
    'Canonical Caption private internal qualification record')
  const envelope = recordSchema.parse(value)
  const privateInternalQualificationSnapshot =
    parseSkillQualificationSnapshot(
      envelope.privateInternalQualificationSnapshot)
  const parsed = {
    ...envelope,
    privateInternalQualificationSnapshot,
  } as CanonicalCaptionPrivateInternalQualificationRecord
  const expectedSnapshotRef = qualificationSnapshotRef(
    privateInternalQualificationSnapshot)
  if (parsed.recordDigestSha256 !== calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>, 'recordDigestSha256')
    || parsed.qualifiedJobs.map((item) => item.jobType).join('|') !==
      CAPTIONS_SUPPORTED_JOB_TYPES.join('|')
    || new Set(parsed.qualifiedJobs.map((item) =>
      refKey(item.sourceCatalogJobEvidenceRef))).size !== 41
    || parsed.counts.qualifiedCaptionJobs !== parsed.qualifiedJobs.length
    || refKey(parsed.privateInternalQualificationSnapshotRef) !==
      refKey(expectedSnapshotRef)
    || !validPrivateInternalSnapshot(parsed)) {
    throw new Error(
      'Canonical Caption private internal qualification record invalid.')
  }
  return structuredClone(parsed)
}

export function createCanonicalCaptionPrivateInternalQualificationRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalCaptionPrivateInternalQualificationRepository {
  assertObjectPort(input.objectPort)
  const prefix = prefixSchema.parse(input.prefix ?? DEFAULT_PREFIX)
  const repository = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_PRIVATE_INTERNAL_QUALIFICATION_REPOSITORY_VERSION,
    async persistRecordCreateOnly(untrusted: unknown) {
      assertClosedContractTree(untrusted,
        'Canonical Caption private qualification write')
      const record = parseCanonicalCaptionPrivateInternalQualificationRecord(
        z.object({ record: z.unknown() }).strict().parse(untrusted).record)
      const body = serialize(record)
      const objectPath = recordPath(prefix, record.requestRef)
      const disposition = await input.objectPort.createOnly({
        objectPath,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const reread = await readExact(input.objectPort, objectPath,
        record.requestRef)
      if (!reread || !sameCanonical(reread, record)) {
        throw new Error(
          'Canonical Caption private qualification create-only conflict.')
      }
      return disposition === 'created' ? 'created' : 'identical_replay'
    },
    async rereadRecord(untrusted: unknown) {
      assertClosedContractTree(untrusted,
        'Canonical Caption private qualification read')
      const requestRef = z.object({ requestRef: refSchema }).strict()
        .parse(untrusted).requestRef
      return readExact(input.objectPort, recordPath(prefix, requestRef),
        requestRef)
    },
  })
  admittedRepositories.add(repository)
  return repository
}

export function createCanonicalCaptionPrivateInternalQualificationService(
  input: {
    readonly catalogReadPort:
      CanonicalCaptionPrivateQualificationCatalogReadPort
    readonly repository:
      CanonicalCaptionPrivateInternalQualificationRepository
  },
): CanonicalCaptionPrivateInternalQualificationService {
  if (!isCanonicalCaptionPrivateQualificationCatalogReadPort(
    input.catalogReadPort)
    || !admittedRepositories.has(input.repository)) {
    throw new Error(
      'Canonical Caption private qualification service ports invalid.')
  }
  return Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_PRIVATE_INTERNAL_QUALIFICATION_SERVICE_VERSION,
    async qualifyPrivateInternal(untrusted: unknown):
    Promise<CanonicalCaptionPrivateInternalQualificationOutcome> {
      const request = parseCanonicalCaptionPrivateQualificationCatalogRequest(
        untrusted)
      const exactRequestRef = requestRef(request)
      const existing = await input.repository.rereadRecord({
        requestRef: exactRequestRef,
      })
      if (existing) return outcome(request, existing)
      const first = await input.catalogReadPort.readExact({ request })
      if (!first) return outcome(request, null)
      const second = await input.catalogReadPort.readExact({ request })
      if (!second || !sameCanonical(first, second)) {
        throw new Error(
          'Canonical Caption qualification catalog changed before release.')
      }
      const catalog = parseCanonicalCaptionPrivateQualificationCatalog(first)
      if (refKey(catalog.requestRef) !== refKey(exactRequestRef)
        || catalog.currentStatus !==
          'ready_for_caption_private_internal_terminal_projection'
        || catalog.terminalStatusClaimed
        || catalog.jobQualificationEvidence.length !== 41) {
        throw new Error(
          'Canonical Caption qualification catalog is not releasable.')
      }
      const record = createRecord(request, catalog)
      await input.repository.persistRecordCreateOnly({ record })
      const reread = await input.repository.rereadRecord({
        requestRef: exactRequestRef,
      })
      if (!reread || !sameCanonical(reread, record)) {
        throw new Error(
          'Canonical Caption private qualification reread failed.')
      }
      return outcome(request, reread)
    },
  })
}

function createRecord(
  request: ReturnType<
    typeof parseCanonicalCaptionPrivateQualificationCatalogRequest>,
  catalog: CanonicalCaptionPrivateQualificationCatalog,
): CanonicalCaptionPrivateInternalQualificationRecord {
  const privateInternalQualificationSnapshot =
    createPrivateInternalQualificationSnapshot(catalog)
  const withoutDigest = {
    schemaVersion:
      CANONICAL_CAPTION_PRIVATE_INTERNAL_QUALIFICATION_RECORD_VERSION,
    recordId: `caption.private.internal.qualification.${
      catalog.catalogDigestSha256.slice(0, 40)}`,
    requestRef: requestRef(request),
    catalogRef: {
      id: catalog.catalogId,
      version: catalog.schemaVersion,
      contentHash: catalog.catalogDigestSha256,
    },
    sourcePlanningQualificationSnapshotRef:
      structuredClone(catalog.sourcePlanningQualificationSnapshotRef),
    privateInternalQualificationSnapshot,
    privateInternalQualificationSnapshotRef: qualificationSnapshotRef(
      privateInternalQualificationSnapshot),
    qualifiedAt: catalog.observedAt,
    qualificationScope: structuredClone(catalog.qualificationScope),
    qualifiedJobs: catalog.jobQualificationEvidence.map((item) => ({
      jobType: item.jobType,
      sourceCatalogJobEvidenceRef: authorityRef(
        `caption.catalog.job.${item.jobType}`,
        'canonical-caption-catalog-job-qualification-evidence-v1', item),
      sourceApprovedRunEvidenceRef:
        structuredClone(item.sourceRunEvidenceRef),
      sourceReviewedOutputEvidenceRef:
        structuredClone(item.sourceOutputEvidenceRef),
      status: 'qualified' as const,
      qualifiedModes: ['planning', 'private_internal'] as const,
      exactApprovedRunEvidenceReread: true as const,
      exactOwnerEvidenceReread: true as const,
      exactRenderedOutputAndQaReread: true as const,
      actualCompleteTimeVisualReviewPassed: true as const,
      actualIndependentFinalQaPassed: true as const,
      actualPrivateReviewAccepted: true as const,
      planningOnlyEvidenceAcceptedAsQualification: false as const,
      syntheticEngineeringFixtureAcceptedAsProfessionalAppearance:
        false as const,
      blockerCodes: [] as [],
    })),
    counts: {
      approvedRuns: catalog.counts.approvedRuns,
      qualifiedCaptionJobs: 41 as const,
      blockedCaptionJobs: 0 as const,
      excludedSupportedCaptionJobs: 0 as const,
      qualifiedOwnerClasses: 5 as const,
      qualifiedReviewedOutputs: catalog.counts.distinctReviewedOutputs,
    },
    currentStatus: 'caption_specialist_private_internal_qualified' as const,
    privateInternalSpecialistQualified: true as const,
    allRequiredSupportedCaptionJobsQualified: true as const,
    realApprovedRunsAggregated: true as const,
    actualRenderedOutputsReread: true as const,
    actualCompleteTimeVisualReviewConsumed: true as const,
    actualIndependentFinalQaAndPrivateReviewConsumed: true as const,
    finalPerJobQualificationProjectionPublished: true as const,
    documentationAndFutureOrchestraMountStillSeparate: true as const,
    publicProductionRequiredForThisStatus: false as const,
    centralOrchestraRequiredForThisStatus: false as const,
    centralOrchestraImplemented: false as const,
    callerSuppliedEvidenceAccepted: false as const,
    browserLocalCompletionAccepted: false as const,
    oneAllFeatureEditFabricated: false as const,
    planningOnlyEvidenceAcceptedAsQualification: false as const,
    syntheticEngineeringFixtureAcceptedAsProfessionalAppearance:
      false as const,
    directPeerDispatchPerformedByCaption: false as const,
    operationOrRuntimeAuthorityGrantedToCaption: false as const,
    providerOrModelAuthorityGrantedToCaption: false as const,
    assetMutationAuthorityGrantedToCaption: false as const,
    finalQaApprovalAuthorityGrantedToCaption: false as const,
    creditOrBillingAuthorityGrantedToCaption: false as const,
    publicDeliveryAuthorityGrantedToCaption: false as const,
    productionAuthorityGrantedToCaption: false as const,
  }
  return parseCanonicalCaptionPrivateInternalQualificationRecord({
    ...withoutDigest,
    recordDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      recordDigestSha256: '',
    } as unknown as Record<string, unknown>, 'recordDigestSha256'),
  })
}

function createPrivateInternalQualificationSnapshot(
  catalog: CanonicalCaptionPrivateQualificationCatalog,
): SkillQualificationSnapshot {
  const manifestRef: CaptionDomainRef = {
    id: CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestId,
    version: CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestSchemaVersion,
    contentHash: CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestHash,
  }
  const releaseRef: CaptionDomainRef = {
    id: catalog.catalogId,
    version: catalog.schemaVersion,
    contentHash: catalog.catalogDigestSha256,
  }
  const withoutDigest: Omit<SkillQualificationSnapshot,
  'snapshotDigestSha256'> = {
    schemaVersion: SKILL_QUALIFICATION_SNAPSHOT_VERSION,
    snapshotId: `captions.specialist.private-internal.${
      catalog.catalogDigestSha256.slice(0, 40)}`,
    skillKey: 'captions',
    manifestRef,
    observedAt: catalog.observedAt,
    releaseRef,
    jobEntries: catalog.jobQualificationEvidence.map((item) => {
      const capability = CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST
        .capabilityEntries.find((entry) =>
          entry.supportedJobType === item.jobType)
      if (!capability) {
        throw new Error(
          `Caption capability missing for ${item.jobType}.`)
      }
      const catalogJobEvidenceRef = authorityRef(
        `caption.catalog.job.${item.jobType}`,
        'canonical-caption-catalog-job-qualification-evidence-v1', item)
      return {
        jobType: item.jobType,
        status: 'qualified' as const,
        qualifiedModes: ['planning', 'private_internal'] as const,
        blockerCodes: [],
        routeRefs: [
          structuredClone(item.sourceRunEvidenceRef),
          structuredClone(item.sourceOutputEvidenceRef),
        ],
        evidenceRefs: [
          catalogJobEvidenceRef,
          ...item.ownerEvidenceRefs.map((owner) =>
            structuredClone(owner.evidenceRef)),
        ],
        requiredEvidenceTypes: [...capability.requiredEvidence],
        contractDigestSha256: calculateSkillContractDigest({
          jobType: item.jobType,
          catalogJobEvidenceRef,
          digest: '',
        }, 'digest'),
        manifestDigestSha256:
          CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestHash,
      }
    }),
    wholeSkillQualificationClaimed: false,
    productionQualificationClaimed: false,
  }
  return parseSkillQualificationSnapshot({
    ...withoutDigest,
    snapshotDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      snapshotDigestSha256: '',
    }, 'snapshotDigestSha256'),
  })
}

function qualificationSnapshotRef(
  snapshot: SkillQualificationSnapshot,
): CaptionDomainRef {
  return {
    id: snapshot.snapshotId,
    version: snapshot.schemaVersion,
    contentHash: snapshot.snapshotDigestSha256,
  }
}

function validPrivateInternalSnapshot(
  record: CanonicalCaptionPrivateInternalQualificationRecord,
): boolean {
  const snapshot = record.privateInternalQualificationSnapshot
  const manifest = CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST
  return snapshot.skillKey === 'captions'
    && snapshot.observedAt === record.qualifiedAt
    && refKey(snapshot.manifestRef) === refKey({
      id: manifest.manifestId,
      version: manifest.manifestSchemaVersion,
      contentHash: manifest.manifestHash,
    })
    && refKey(snapshot.releaseRef) === refKey(record.catalogRef)
    && !snapshot.wholeSkillQualificationClaimed
    && !snapshot.productionQualificationClaimed
    && snapshot.jobEntries.length === record.qualifiedJobs.length
    && snapshot.jobEntries.every((entry, index) => {
      const job = record.qualifiedJobs[index]
      return job !== undefined
        && entry.jobType === job.jobType
        && entry.status === 'qualified'
        && entry.qualifiedModes.join('|') === 'planning|private_internal'
        && entry.blockerCodes.length === 0
        && entry.evidenceRefs.some((ref) =>
          refKey(ref) === refKey(job.sourceCatalogJobEvidenceRef))
    })
}

function outcome(
  request: ReturnType<
    typeof parseCanonicalCaptionPrivateQualificationCatalogRequest>,
  record: CanonicalCaptionPrivateInternalQualificationRecord | null,
): CanonicalCaptionPrivateInternalQualificationOutcome {
  return {
    disposition: record ? 'qualified_private_internal'
      : 'blocked_missing_canonical_private_evidence',
    request: structuredClone(request),
    record: record ? structuredClone(record) : null,
    currentProductStatusChanged: false,
    centralOrchestraImplemented: false,
    publicOrProductionAuthorityGranted: false,
  }
}

function requestRef(request: ReturnType<
  typeof parseCanonicalCaptionPrivateQualificationCatalogRequest>):
CaptionDomainRef {
  return { id: request.requestId, version: request.schemaVersion,
    contentHash: request.requestDigestSha256 }
}

function authorityRef(id: string, version: string, value: unknown):
CaptionDomainRef {
  return { id, version, contentHash: calculateSkillContractDigest(
    { value, digest: '' }, 'digest') }
}

function refKey(value: CaptionDomainRef): string {
  return `${value.id}|${value.version}|${value.contentHash}`
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error(
      'Canonical Caption private qualification object port invalid.')
  }
}

function recordPath(prefix: string, requestRefValue: CaptionDomainRef): string {
  return `${prefix}/${requestRefValue.contentHash}.json`
}

function serialize(
  record: CanonicalCaptionPrivateInternalQualificationRecord,
): Buffer {
  const body = Buffer.from(JSON.stringify(record), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw new Error(
      'Canonical Caption private qualification record size invalid.')
  }
  return body
}

async function readExact(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  expectedRequestRef: CaptionDomainRef,
): Promise<CanonicalCaptionPrivateInternalQualificationRecord | null> {
  const body = await port.readExact(objectPath)
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw new Error(
      'Canonical Caption private qualification record bytes invalid.')
  }
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8')) as unknown
  } catch (error) {
    throw new Error(
      'Canonical Caption private qualification record JSON invalid.', {
        cause: error,
      })
  }
  const record = parseCanonicalCaptionPrivateInternalQualificationRecord(value)
  if (refKey(record.requestRef) !== refKey(expectedRequestRef)) {
    throw new Error(
      'Canonical Caption private qualification record crossed request.')
  }
  return record
}

function sameCanonical(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function rejectUnsafeText(value: unknown, label: string): void {
  const stack: unknown[] = [value]
  while (stack.length > 0) {
    const current = stack.pop()
    if (typeof current === 'string') {
      if (/https?:\/\/|file:\/\/|data:|blob:|javascript:|\/(?:Users|Volumes|home|tmp)\/|\\|\.\.[/\\]|(?:authorization|password|credential|secret|access[_ -]?token|refresh[_ -]?token)\s*[:=]|\bsk-[a-z0-9_-]+|AIza[a-z0-9_-]+|x-goog/iu.test(current)) {
        throw new Error(`${label} contains unsafe serialized text.`)
      }
      continue
    }
    if (Array.isArray(current)) stack.push(...current)
    else if (current && typeof current === 'object') {
      stack.push(...Object.values(current as Record<string, unknown>))
    }
  }
}
