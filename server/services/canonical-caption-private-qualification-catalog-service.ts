import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CATALOG_ASSEMBLY_VERSION,
  CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CATALOG_READ_PORT_VERSION,
  CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CATALOG_REPOSITORY_VERSION,
  CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CATALOG_REQUEST_VERSION,
  CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CATALOG_VERSION,
  type CanonicalCaptionCatalogJobQualificationEvidence,
  type CanonicalCaptionCatalogOwnerCoverage,
  type CanonicalCaptionPrivateQualificationCatalog,
  type CanonicalCaptionPrivateQualificationCatalogAssembly,
  type CanonicalCaptionPrivateQualificationCatalogReadPort,
  type CanonicalCaptionPrivateQualificationCatalogRepository,
  type CanonicalCaptionPrivateQualificationCatalogRequest,
  type CanonicalCaptionQualificationCatalogOwnerKey,
} from '../../src/types/canonical-caption-private-qualification-catalog'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import type {
  CanonicalCaptionQualificationRunEvidence,
  CanonicalCaptionQualificationRunEvidenceRepository,
} from '../../src/types/canonical-caption-qualification-run-evidence'
import {
  CAPTIONS_SUPPORTED_JOB_TYPES,
  type CaptionsSupportedJobType,
} from '../../src/types/captions-specialist'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import {
  CAPTION_CAP20_SHARED_OWNER_INTEGRATION_HANDOFF,
} from '../captions-specialist/caption-shared-owner-integration'
import {
  CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT,
} from '../captions-specialist/captions-specialist-integration-qualification'
import {
  calculateSkillContractDigest,
} from '../orchestra/orchestra-skill-contracts'
import type { CanonicalCreateOnlyJsonObjectPort } from
  './canonical-gcs-source-analysis-lifecycle-store'
import {
  isCanonicalCaptionQualificationRunEvidenceRepository,
  parseCanonicalCaptionQualificationRunEvidence,
} from './canonical-caption-qualification-run-evidence-reader'

const safeKey = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const jobSchema = z.enum(CAPTIONS_SUPPORTED_JOB_TYPES)
const ownerKeySchema = z.enum([
  'canonical_transcript', 'visual_intelligence', 'track_all', 'soundsync',
  'broll_owner',
])
const requestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CATALOG_REQUEST_VERSION),
  requestId: safeKey,
  requestDigestSha256: sha256,
  qualificationScope: z.object({
    ownerUserId: safeKey,
    workspaceId: safeKey,
    suiteId: safeKey,
  }).strict(),
  sourcePlanningQualificationSnapshotRef: refSchema,
  runEvidenceRequestRefs: z.array(refSchema).min(2).max(128),
  requiredJobTypes: z.array(jobSchema).length(41),
  privateInternalQualificationRun: z.literal(true),
  multipleApprovedRunsExpected: z.literal(true),
  oneAllFeatureEditRequired: z.literal(false),
  callerSuppliedRunEvidenceAccepted: z.literal(false),
  planningOnlyEvidenceAcceptedAsQualification: z.literal(false),
  syntheticEngineeringFixtureAcceptedAsProfessionalAppearance:
    z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
  centralOrchestraImplemented: z.literal(false),
  operationOrRuntimeAuthorityGrantedToCaption: z.literal(false),
  providerOrModelAuthorityGrantedToCaption: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalAuthorityGrantedToCaption: z.literal(false),
  creditOrBillingAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryAuthorityGrantedToCaption: z.literal(false),
  productionAuthorityGrantedToCaption: z.literal(false),
}).strict()
const ownerEvidenceSchema = z.object({
  ownerKey: ownerKeySchema,
  evidenceRef: refSchema,
  evidenceClass: z.enum([
    'canonical_transcript_authenticated_read', 'canonical_owner_record',
  ]),
  exactPersistedOwnerEvidenceReread: z.literal(true),
}).strict()
const jobEvidenceSchema = z.object({
  jobType: jobSchema,
  sourceRunEvidenceRef: refSchema,
  sourceRunRequestRef: refSchema,
  sourceOccurrenceRef: refSchema,
  sourceOutputEvidenceRef: refSchema,
  requiredOwnerKeys: z.array(ownerKeySchema).min(1).max(5),
  ownerEvidenceRefs: z.array(ownerEvidenceSchema).min(1).max(5),
  qualificationBasis: z.literal(
    'approved_run_completed_job_plus_accepted_output_review'),
  actualApprovedRunCompleted: z.literal(true),
  actualPersistedPlanningArtifactReread: z.literal(true),
  actualRenderedOutputReread: z.literal(true),
  actualCompleteTimeVisualReviewPassed: z.literal(true),
  actualIndependentFinalQaPassed: z.literal(true),
  actualPrivateReviewAccepted: z.literal(true),
  planningOnlyEvidenceAcceptedAsQualification: z.literal(false),
  sourceFixtureRelabeledAsRuntimeEvidence: z.literal(false),
  syntheticEngineeringFixtureAcceptedAsProfessionalAppearance:
    z.literal(false),
  unresolvedBlockerCodes: z.array(safeKey).length(0),
  privateInternalQualified: z.literal(true),
}).strict()
const ownerCoverageSchema = z.object({
  ownerKey: ownerKeySchema,
  requiredJobCount: z.number().int().positive().max(41),
  coveredJobCount: z.number().int().positive().max(41),
  evidenceRefs: z.array(refSchema).min(1).max(256),
  exactPersistedEvidenceReread: z.literal(true),
  allRequiredJobsCovered: z.literal(true),
}).strict()
const catalogSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CATALOG_VERSION),
  catalogId: safeKey,
  catalogDigestSha256: sha256,
  requestRef: refSchema,
  observedAt: timestamp,
  qualificationScope: requestSchema.shape.qualificationScope,
  sourcePlanningQualificationSnapshotRef: refSchema,
  sourceRunEvidenceRefs: z.array(refSchema).min(2).max(128),
  sourceApprovedSnapshotRefs: z.array(refSchema).min(2).max(128),
  jobQualificationEvidence: z.array(jobEvidenceSchema).length(41),
  ownerCoverage: z.array(ownerCoverageSchema).length(5),
  counts: z.object({
    approvedRuns: z.number().int().min(2).max(128),
    distinctApprovedSnapshots: z.number().int().min(2).max(128),
    distinctReviewedOutputs: z.number().int().min(2).max(128),
    declaredCaptionJobs: z.literal(41),
    privateInternalQualifiedJobs: z.literal(41),
    requiredOwnerClasses: z.literal(5),
    requiredOwnerClassesCovered: z.literal(5),
    unresolvedJobBlockers: z.literal(0),
  }).strict(),
  gates: z.object({
    canonicalTranscriptEvidenceComplete: z.literal(true),
    visualIntelligenceEvidenceComplete: z.literal(true),
    trackAllEvidenceComplete: z.literal(true),
    soundSyncEvidenceComplete: z.literal(true),
    brollOwnerEvidenceComplete: z.literal(true),
    canonicalApprovedRunEvidenceComplete: z.literal(true),
    qualifiedCompleteTimeVisualReviewComplete: z.literal(true),
    independentFinalQaAndPrivateReviewComplete: z.literal(true),
    terminalPerJobProjectionReady: z.literal(true),
    terminalPerJobProjectionPublished: z.literal(false),
  }).strict(),
  currentStatus: z.literal(
    'ready_for_caption_private_internal_terminal_projection'),
  terminalStatusClaimed: z.literal(false),
  multipleApprovedRunsAggregated: z.literal(true),
  oneAllFeatureEditFabricated: z.literal(false),
  callerSuppliedRunEvidenceAccepted: z.literal(false),
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
  'private-internal/captions-specialist/v1/qualification-catalogs'
const MAX_CATALOG_BYTES = 64 * 1024 * 1024
const ownerOrder: CanonicalCaptionQualificationCatalogOwnerKey[] = [
  'canonical_transcript', 'visual_intelligence', 'track_all', 'soundsync',
  'broll_owner',
]
const planningQualificationRef: CaptionDomainRef = {
  id: CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT.snapshotId,
  version: CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT.schemaVersion,
  contentHash: CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT
    .snapshotDigestSha256,
}
const admittedReadPorts = new WeakSet<object>()
const admittedRepositories = new WeakSet<object>()

export function createCanonicalCaptionPrivateQualificationCatalogRequest(
  input: Omit<CanonicalCaptionPrivateQualificationCatalogRequest,
    'schemaVersion' | 'requestDigestSha256' | 'runEvidenceRequestRefs'> & {
      runEvidenceRequestRefs: readonly CaptionDomainRef[]
    },
): CanonicalCaptionPrivateQualificationCatalogRequest {
  const withoutDigest = {
    ...structuredClone(input),
    schemaVersion:
      CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CATALOG_REQUEST_VERSION,
    runEvidenceRequestRefs: [...input.runEvidenceRequestRefs]
      .map((item) => structuredClone(item)).sort(compareRefs),
  }
  return parseCanonicalCaptionPrivateQualificationCatalogRequest({
    ...withoutDigest,
    requestDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      requestDigestSha256: '',
    } as unknown as Record<string, unknown>, 'requestDigestSha256'),
  })
}

export function parseCanonicalCaptionPrivateQualificationCatalogRequest(
  value: unknown,
): CanonicalCaptionPrivateQualificationCatalogRequest {
  assertClosedContractTree(value,
    'Canonical Caption private qualification catalog request')
  rejectUnsafeText(value,
    'Canonical Caption private qualification catalog request')
  const parsed = requestSchema.parse(value)
  if (parsed.requestDigestSha256 !== calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>, 'requestDigestSha256')
    || refKey(parsed.sourcePlanningQualificationSnapshotRef) !==
      refKey(planningQualificationRef)
    || parsed.requiredJobTypes.join('|') !==
      CAPTIONS_SUPPORTED_JOB_TYPES.join('|')
    || !uniqueRefs(parsed.runEvidenceRequestRefs)
    || !isSortedRefs(parsed.runEvidenceRequestRefs)) {
    throw new Error(
      'Canonical Caption private qualification catalog request is invalid.')
  }
  return structuredClone(parsed)
}

export function parseCanonicalCaptionPrivateQualificationCatalog(
  value: unknown,
): CanonicalCaptionPrivateQualificationCatalog {
  assertClosedContractTree(value,
    'Canonical Caption private qualification catalog')
  rejectUnsafeText(value, 'Canonical Caption private qualification catalog')
  const parsed = catalogSchema.parse(value) as
    CanonicalCaptionPrivateQualificationCatalog
  const jobTypes = parsed.jobQualificationEvidence.map((item) => item.jobType)
  const outputCount = new Set(parsed.jobQualificationEvidence.map((item) =>
    refKey(item.sourceOutputEvidenceRef))).size
  const declaredRunKeys = new Set(parsed.sourceRunEvidenceRefs.map(refKey))
  const usedRunKeys = new Set(parsed.jobQualificationEvidence.map((item) =>
    refKey(item.sourceRunEvidenceRef)))
  const usedRunRequestKeys = new Set(parsed.jobQualificationEvidence.map(
    (item) => refKey(item.sourceRunRequestRef)))
  if (parsed.catalogDigestSha256 !== calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>, 'catalogDigestSha256')
    || jobTypes.join('|') !== CAPTIONS_SUPPORTED_JOB_TYPES.join('|')
    || parsed.ownerCoverage.map((item) => item.ownerKey).join('|') !==
      ownerOrder.join('|')
    || parsed.counts.approvedRuns !== parsed.sourceRunEvidenceRefs.length
    || parsed.counts.distinctApprovedSnapshots !==
      parsed.sourceApprovedSnapshotRefs.length
    || parsed.counts.distinctReviewedOutputs !== outputCount
    || !uniqueRefs(parsed.sourceRunEvidenceRefs)
    || !uniqueRefs(parsed.sourceApprovedSnapshotRefs)
    || declaredRunKeys.size !== usedRunKeys.size
    || [...declaredRunKeys].some((key) => !usedRunKeys.has(key))
    || usedRunRequestKeys.size !== parsed.counts.approvedRuns
    || !parsed.jobQualificationEvidence.every(validJobEvidence)
    || !validOwnerCoverage(parsed.ownerCoverage,
      parsed.jobQualificationEvidence)) {
    throw new Error(
      'Canonical Caption private qualification catalog is invalid.')
  }
  return structuredClone(parsed)
}

export function createCanonicalCaptionPrivateQualificationCatalogReadPort(
  readExact: CanonicalCaptionPrivateQualificationCatalogReadPort[
    'readExact'],
): CanonicalCaptionPrivateQualificationCatalogReadPort {
  if (typeof readExact !== 'function') {
    throw new Error('Canonical Caption qualification catalog reader required.')
  }
  const port = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CATALOG_READ_PORT_VERSION,
    sourceAuthority:
      'canonical_backend_persisted_caption_qualification_runs' as const,
    callerSuppliedRunEvidenceAccepted: false as const,
    readExact: readExact.bind(undefined),
  })
  admittedReadPorts.add(port)
  return port
}

export function isCanonicalCaptionPrivateQualificationCatalogReadPort(
  value: unknown,
): value is CanonicalCaptionPrivateQualificationCatalogReadPort {
  return Boolean(value && typeof value === 'object'
    && admittedReadPorts.has(value as object))
}

export function createCanonicalCaptionPrivateQualificationCatalogSource(
  input: {
    readonly runEvidenceRepository:
      CanonicalCaptionQualificationRunEvidenceRepository
  },
): CanonicalCaptionPrivateQualificationCatalogReadPort {
  if (!isCanonicalCaptionQualificationRunEvidenceRepository(
    input.runEvidenceRepository)) {
    throw new Error('Canonical Caption qualification run repository required.')
  }
  return createCanonicalCaptionPrivateQualificationCatalogReadPort(
    async (untrusted) => {
      const request = parseReadRequest(untrusted)
      const runs: CanonicalCaptionQualificationRunEvidence[] = []
      for (const runRequestRef of request.runEvidenceRequestRefs) {
        const value = await input.runEvidenceRepository.rereadRecord({
          requestRef: runRequestRef,
        })
        if (!value) return null
        const run = parseCanonicalCaptionQualificationRunEvidence(value)
        if (refKey(run.requestRef) !== refKey(runRequestRef)
          || run.canonicalScope.ownerUserId !==
            request.qualificationScope.ownerUserId
          || run.canonicalScope.workspaceId !==
            request.qualificationScope.workspaceId
          || !run.approvedCaptionRunEvidenceOnly
          || run.terminalJobQualificationClaimed
          || !run.requiresMultiRunEvidenceCatalogForTerminalQualification
          || run.syntheticEngineeringFixtureClaimedProfessionalAppearance) {
          throw new Error(
            'Canonical Caption qualification run crossed catalog authority.')
        }
        runs.push(run)
      }
      return createCatalog(request, runs)
    })
}

export function createCanonicalCaptionPrivateQualificationCatalogRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalCaptionPrivateQualificationCatalogRepository {
  assertObjectPort(input.objectPort)
  const prefix = prefixSchema.parse(input.prefix ?? DEFAULT_PREFIX)
  const repository = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CATALOG_REPOSITORY_VERSION,
    async persistCatalogCreateOnly(untrusted: unknown) {
      assertClosedContractTree(untrusted,
        'Canonical Caption private qualification catalog write')
      const catalog = parseCanonicalCaptionPrivateQualificationCatalog(
        z.object({ catalog: z.unknown() }).strict().parse(untrusted).catalog)
      const body = serializeCatalog(catalog)
      const objectPath = catalogPath(prefix, catalog.requestRef)
      const disposition = await input.objectPort.createOnly({
        objectPath,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const reread = await rereadCatalog(input.objectPort, objectPath,
        catalog.requestRef)
      if (!reread || !sameCanonical(reread, catalog)) {
        throw new Error(
          'Canonical Caption private qualification catalog conflict.')
      }
      return disposition === 'created' ? 'created' : 'identical_replay'
    },
    async rereadCatalog(untrusted: unknown) {
      assertClosedContractTree(untrusted,
        'Canonical Caption private qualification catalog read')
      const requestRef = z.object({ requestRef: refSchema }).strict()
        .parse(untrusted).requestRef
      return rereadCatalog(input.objectPort, catalogPath(prefix, requestRef),
        requestRef)
    },
  })
  admittedRepositories.add(repository)
  return repository
}

export function createCanonicalCaptionPrivateQualificationCatalogAssembly(
  input: {
    readonly sourceReadPort:
      CanonicalCaptionPrivateQualificationCatalogReadPort
    readonly repository:
      CanonicalCaptionPrivateQualificationCatalogRepository
  },
): CanonicalCaptionPrivateQualificationCatalogAssembly {
  if (!admittedReadPorts.has(input.sourceReadPort)
    || !admittedRepositories.has(input.repository)) {
    throw new Error('Canonical Caption qualification catalog ports invalid.')
  }
  const evidenceReadPort = createCanonicalCaptionPrivateQualificationCatalogReadPort(
    async (untrusted) => {
      const request = parseReadRequest(untrusted)
      const exactRequestRef = requestRef(request)
      const existing = await input.repository.rereadCatalog({
        requestRef: exactRequestRef,
      })
      if (existing) return structuredClone(existing)
      const first = await input.sourceReadPort.readExact({ request })
      if (!first) return null
      const second = await input.sourceReadPort.readExact({ request })
      if (!second || !sameCanonical(first, second)) {
        throw new Error(
          'Canonical Caption qualification catalog source changed.')
      }
      const parsed = parseCanonicalCaptionPrivateQualificationCatalog(first)
      if (refKey(parsed.requestRef) !== refKey(exactRequestRef)) {
        throw new Error(
          'Canonical Caption qualification catalog crossed request.')
      }
      await input.repository.persistCatalogCreateOnly({ catalog: parsed })
      const reread = await input.repository.rereadCatalog({
        requestRef: exactRequestRef,
      })
      if (!reread || !sameCanonical(reread, parsed)) {
        throw new Error(
          'Canonical Caption qualification catalog reread failed.')
      }
      return structuredClone(reread)
    })
  return Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CATALOG_ASSEMBLY_VERSION,
    evidenceReadPort,
    repository: input.repository,
    exactRunRecordsRereadBeforeAssembly: true,
    createOnlyPersistenceAndExactReread: true,
    callerSuppliedRunEvidenceAccepted: false,
    planningOnlyEvidenceAcceptedAsQualification: false,
    syntheticEngineeringFixtureAcceptedAsProfessionalAppearance: false,
    terminalStatusClaimed: false,
    operationOrRuntimeAuthorityGrantedToCaption: false,
    finalQaApprovalAuthorityGrantedToCaption: false,
    publicDeliveryAuthorityGrantedToCaption: false,
    productionAuthorityGrantedToCaption: false,
  })
}

function createCatalog(
  request: CanonicalCaptionPrivateQualificationCatalogRequest,
  runs: CanonicalCaptionQualificationRunEvidence[],
): CanonicalCaptionPrivateQualificationCatalog | null {
  const selected: CanonicalCaptionCatalogJobQualificationEvidence[] = []
  for (const jobType of CAPTIONS_SUPPORTED_JOB_TYPES) {
    const expectedOwners = requiredOwners(jobType)
    const candidates = runs.flatMap((run) => run.jobOccurrences
      .filter((occurrence) => occurrence.jobType === jobType)
      .map((occurrence) => ({ run, occurrence })))
      .filter(({ occurrence }) => occurrence.ownerEvidence.map((owner) =>
        owner.ownerKey).join('|') === expectedOwners.join('|'))
      .sort((left, right) => {
        const leftKey = `${refKey(left.run.requestRef)}|${
          left.occurrence.occurrenceId}`
        const rightKey = `${refKey(right.run.requestRef)}|${
          right.occurrence.occurrenceId}`
        return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0
      })
    const candidate = candidates[0]
    if (!candidate) return null
    const runRef = runEvidenceRef(candidate.run)
    const ownerEvidenceRefs = candidate.occurrence.ownerEvidence.map(
      (owner) => {
        const expectedClass = owner.ownerKey === 'canonical_transcript'
          ? 'canonical_transcript_authenticated_read' as const
          : 'canonical_owner_record' as const
        if (owner.evidenceClass !== expectedClass) {
          throw new Error(
            'Canonical Caption catalog requires actual owner records.')
        }
        return {
          ownerKey: owner.ownerKey as
            CanonicalCaptionQualificationCatalogOwnerKey,
          evidenceRef: structuredClone(owner.ownerEvidenceRef),
          evidenceClass: expectedClass,
          exactPersistedOwnerEvidenceReread: true as const,
        }
      })
    selected.push({
      jobType,
      sourceRunEvidenceRef: runRef,
      sourceRunRequestRef: structuredClone(candidate.run.requestRef),
      sourceOccurrenceRef: authorityRef(candidate.occurrence.occurrenceId,
        'canonical-caption-qualification-job-occurrence-v1',
        candidate.occurrence),
      sourceOutputEvidenceRef: authorityRef(
        `caption.qualification.output.${candidate.run.outputEvidence.outputId}`,
        'canonical-caption-qualification-output-evidence-v1',
        candidate.run.outputEvidence),
      requiredOwnerKeys: expectedOwners,
      ownerEvidenceRefs,
      qualificationBasis:
        'approved_run_completed_job_plus_accepted_output_review',
      actualApprovedRunCompleted: true,
      actualPersistedPlanningArtifactReread: true,
      actualRenderedOutputReread: true,
      actualCompleteTimeVisualReviewPassed: true,
      actualIndependentFinalQaPassed: true,
      actualPrivateReviewAccepted: true,
      planningOnlyEvidenceAcceptedAsQualification: false,
      sourceFixtureRelabeledAsRuntimeEvidence: false,
      syntheticEngineeringFixtureAcceptedAsProfessionalAppearance: false,
      unresolvedBlockerCodes: [],
      privateInternalQualified: true,
    })
  }
  const usedRunRequestKeys = new Set(selected.map((item) =>
    refKey(item.sourceRunRequestRef)))
  const usedRuns = runs.filter((run) => usedRunRequestKeys.has(
    refKey(run.requestRef)))
  if (usedRuns.length < 2 || usedRuns.length !== runs.length) return null
  const sourceRunEvidenceRefs = usedRuns.map(runEvidenceRef)
  const sourceApprovedSnapshotRefs = uniqueRefValues(usedRuns.map((run) =>
    run.canonicalScope.approvedSnapshotRef))
  if (sourceApprovedSnapshotRefs.length < 2) return null
  const ownerCoverage = createOwnerCoverage(selected)
  const withoutDigest = {
    schemaVersion: CANONICAL_CAPTION_PRIVATE_QUALIFICATION_CATALOG_VERSION,
    catalogId: `caption.private.qualification.catalog.${
      request.requestDigestSha256.slice(0, 40)}`,
    requestRef: requestRef(request),
    observedAt: usedRuns.map((run) => run.observedAt).sort().at(-1)!,
    qualificationScope: structuredClone(request.qualificationScope),
    sourcePlanningQualificationSnapshotRef:
      structuredClone(request.sourcePlanningQualificationSnapshotRef),
    sourceRunEvidenceRefs,
    sourceApprovedSnapshotRefs,
    jobQualificationEvidence: selected,
    ownerCoverage,
    counts: {
      approvedRuns: usedRuns.length,
      distinctApprovedSnapshots: sourceApprovedSnapshotRefs.length,
      distinctReviewedOutputs: new Set(selected.map((item) =>
        refKey(item.sourceOutputEvidenceRef))).size,
      declaredCaptionJobs: 41 as const,
      privateInternalQualifiedJobs: 41 as const,
      requiredOwnerClasses: 5 as const,
      requiredOwnerClassesCovered: 5 as const,
      unresolvedJobBlockers: 0 as const,
    },
    gates: {
      canonicalTranscriptEvidenceComplete: true as const,
      visualIntelligenceEvidenceComplete: true as const,
      trackAllEvidenceComplete: true as const,
      soundSyncEvidenceComplete: true as const,
      brollOwnerEvidenceComplete: true as const,
      canonicalApprovedRunEvidenceComplete: true as const,
      qualifiedCompleteTimeVisualReviewComplete: true as const,
      independentFinalQaAndPrivateReviewComplete: true as const,
      terminalPerJobProjectionReady: true as const,
      terminalPerJobProjectionPublished: false as const,
    },
    currentStatus:
      'ready_for_caption_private_internal_terminal_projection' as const,
    terminalStatusClaimed: false as const,
    multipleApprovedRunsAggregated: true as const,
    oneAllFeatureEditFabricated: false as const,
    callerSuppliedRunEvidenceAccepted: false as const,
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
  return parseCanonicalCaptionPrivateQualificationCatalog({
    ...withoutDigest,
    catalogDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      catalogDigestSha256: '',
    } as unknown as Record<string, unknown>, 'catalogDigestSha256'),
  })
}

function createOwnerCoverage(
  jobs: CanonicalCaptionCatalogJobQualificationEvidence[],
): CanonicalCaptionCatalogOwnerCoverage[] {
  return ownerOrder.map((ownerKey) => {
    const requiredJobs = jobs.filter((job) =>
      job.requiredOwnerKeys.includes(ownerKey))
    const evidenceRefs = uniqueRefValues(requiredJobs.flatMap((job) =>
      job.ownerEvidenceRefs.filter((owner) => owner.ownerKey === ownerKey)
        .map((owner) => owner.evidenceRef)))
    if (requiredJobs.length < 1 || evidenceRefs.length < 1) {
      throw new Error(`Canonical Caption owner coverage missing ${ownerKey}.`)
    }
    return {
      ownerKey,
      requiredJobCount: requiredJobs.length,
      coveredJobCount: requiredJobs.length,
      evidenceRefs,
      exactPersistedEvidenceReread: true,
      allRequiredJobsCovered: true,
    }
  })
}

function validJobEvidence(
  item: CanonicalCaptionCatalogJobQualificationEvidence,
): boolean {
  const owners = requiredOwners(item.jobType)
  return item.requiredOwnerKeys.join('|') === owners.join('|')
    && item.ownerEvidenceRefs.map((owner) => owner.ownerKey).join('|') ===
      owners.join('|')
    && item.ownerEvidenceRefs.every((owner) => owner.evidenceClass ===
      (owner.ownerKey === 'canonical_transcript'
        ? 'canonical_transcript_authenticated_read'
        : 'canonical_owner_record'))
    && uniqueRefs(item.ownerEvidenceRefs.map((owner) => owner.evidenceRef))
}

function validOwnerCoverage(
  coverage: CanonicalCaptionCatalogOwnerCoverage[],
  jobs: CanonicalCaptionCatalogJobQualificationEvidence[],
): boolean {
  return coverage.every((item) => {
    const requiredJobs = jobs.filter((job) =>
      job.requiredOwnerKeys.includes(item.ownerKey))
    const expectedRefs = uniqueRefValues(requiredJobs.flatMap((job) =>
      job.ownerEvidenceRefs.filter((owner) =>
        owner.ownerKey === item.ownerKey).map((owner) => owner.evidenceRef)))
    return item.requiredJobCount === requiredJobs.length
      && item.coveredJobCount === requiredJobs.length
      && item.evidenceRefs.map(refKey).join('|') ===
        expectedRefs.map(refKey).join('|')
  })
}

function requiredOwners(jobType: CaptionsSupportedJobType):
CanonicalCaptionQualificationCatalogOwnerKey[] {
  const conditional = CAPTION_CAP20_SHARED_OWNER_INTEGRATION_HANDOFF
    .conditionalJobBindings.find((item) => item.jobType === jobType)
  const owners: CanonicalCaptionQualificationCatalogOwnerKey[] = [
    'canonical_transcript',
  ]
  for (const owner of conditional?.requiredOwnerKeys ?? []) {
    if (!owners.includes(owner)) owners.push(owner)
  }
  return owners
}

function parseReadRequest(value: unknown):
CanonicalCaptionPrivateQualificationCatalogRequest {
  assertClosedContractTree(value,
    'Canonical Caption private qualification catalog read')
  const envelope = z.object({ request: z.unknown() }).strict().parse(value)
  return parseCanonicalCaptionPrivateQualificationCatalogRequest(
    envelope.request)
}

function requestRef(
  request: CanonicalCaptionPrivateQualificationCatalogRequest,
): CaptionDomainRef {
  return { id: request.requestId, version: request.schemaVersion,
    contentHash: request.requestDigestSha256 }
}

function authorityRef(id: string, version: string, value: unknown):
CaptionDomainRef {
  return { id, version, contentHash: calculateSkillContractDigest(
    { value, digest: '' }, 'digest') }
}

function runEvidenceRef(
  value: CanonicalCaptionQualificationRunEvidence,
): CaptionDomainRef {
  return { id: value.recordId, version: value.schemaVersion,
    contentHash: value.recordDigestSha256 }
}

function uniqueRefValues(values: CaptionDomainRef[]): CaptionDomainRef[] {
  const seen = new Set<string>()
  return values.filter((value) => {
    const key = refKey(value)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function uniqueRefs(values: CaptionDomainRef[]): boolean {
  return new Set(values.map(refKey)).size === values.length
}

function isSortedRefs(values: CaptionDomainRef[]): boolean {
  return values.map(refKey).join('|') === [...values].sort(compareRefs)
    .map(refKey).join('|')
}

function compareRefs(left: CaptionDomainRef, right: CaptionDomainRef): number {
  const leftKey = refKey(left)
  const rightKey = refKey(right)
  return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0
}

function refKey(value: { id: string; version: string;
  contentHash: string }): string {
  return `${value.id}|${value.version}|${value.contentHash}`
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error(
      'Canonical Caption private qualification catalog object port invalid.')
  }
}

function catalogPath(prefix: string, value: CaptionDomainRef): string {
  return `${prefix}/${value.contentHash}.json`
}

function serializeCatalog(
  value: CanonicalCaptionPrivateQualificationCatalog,
): Buffer {
  const body = Buffer.from(JSON.stringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAX_CATALOG_BYTES) {
    throw new Error(
      'Canonical Caption private qualification catalog size invalid.')
  }
  return body
}

async function rereadCatalog(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  expectedRequestRef: CaptionDomainRef,
): Promise<CanonicalCaptionPrivateQualificationCatalog | null> {
  const body = await port.readExact(objectPath)
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > MAX_CATALOG_BYTES) {
    throw new Error(
      'Canonical Caption private qualification catalog bytes invalid.')
  }
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8')) as unknown
  } catch (error) {
    throw new Error(
      'Canonical Caption private qualification catalog JSON invalid.', {
        cause: error,
      })
  }
  const catalog = parseCanonicalCaptionPrivateQualificationCatalog(value)
  if (refKey(catalog.requestRef) !== refKey(expectedRequestRef)) {
    throw new Error(
      'Canonical Caption private qualification catalog crossed request.')
  }
  return catalog
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
