import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  CANONICAL_CAPTION_QUALIFICATION_RUN_EVIDENCE_ASSEMBLY_V2_VERSION,
  CANONICAL_CAPTION_QUALIFICATION_RUN_EVIDENCE_READ_PORT_V2_VERSION,
  CANONICAL_CAPTION_QUALIFICATION_RUN_EVIDENCE_REPOSITORY_V2_VERSION,
  CANONICAL_CAPTION_QUALIFICATION_RUN_EVIDENCE_V1_VERSION,
  CANONICAL_CAPTION_QUALIFICATION_RUN_EVIDENCE_V2_VERSION,
  type CanonicalCaptionQualificationJobOccurrenceEvidence,
  type CanonicalCaptionQualificationOwnerEvidence,
  type CanonicalCaptionQualificationRunEvidence,
  type CanonicalCaptionQualificationRunEvidenceV1,
  type CanonicalCaptionQualificationRunEvidenceAssembly,
  type CanonicalCaptionQualificationRunEvidenceReadPort,
  type CanonicalCaptionQualificationRunEvidenceRepository,
} from '../../src/types/canonical-caption-qualification-run-evidence'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import type {
  SkillContractRef,
  SkillSupportRequest,
} from '../../src/types/orchestra-skill-contracts'
import { CAPTIONS_SUPPORTED_JOB_TYPES } from
  '../../src/types/captions-specialist'
import {
  CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_BINDING_VERSION,
  type CaptionCanonicalTranscriptReadScope,
} from '../../src/types/caption-canonical-transcript-authenticated-read'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  parseCanonicalCaptionSpecialistWorkItemInput,
} from './canonical-caption-specialist-execution-service'
import {
  parseCanonicalCaptionBrollAuthenticatedEvidenceRecord,
  type CanonicalCaptionBrollEvidenceRepository,
} from './canonical-caption-broll-support-service'
import {
  parseCanonicalCaptionSoundSyncAuthenticatedEvidenceRecord,
  type CanonicalCaptionSoundSyncEvidenceRepository,
} from './canonical-caption-soundsync-support-service'
import {
  type CanonicalCaptionTrackAllEvidenceRepository,
  parseCanonicalCaptionTrackAllAuthenticatedEvidenceRecord,
} from './canonical-caption-track-all-support-service'
import {
  type CanonicalCaptionVisualIntelligenceEvidenceRepository,
  parseCanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord,
} from './canonical-caption-visual-intelligence-support-service'
import type {
  CanonicalCaptionTranscriptEvidenceRepository,
} from './canonical-caption-transcript-support-service'
import {
  isCanonicalCaptionDirectVisualInspectionRepository,
  parseCanonicalCaptionDirectVisualInspectionEvidence,
} from './canonical-caption-direct-visual-inspection-evidence-service'
import type {
  CanonicalCaptionDirectVisualInspectionRepository,
} from '../../src/types/canonical-caption-direct-visual-inspection-evidence'
import {
  canonicalCaptionPrivateReviewVisualEvidenceRef,
  createCanonicalCaptionPrivateReviewEvidenceService,
  parseCanonicalCaptionPrivateReviewEvidenceProjection,
} from './canonical-caption-private-review-evidence-service'
import {
  createCanonicalCaptionTerminalQualificationRequest,
  parseCanonicalCaptionTerminalQualificationRequest,
} from './canonical-caption-terminal-qualification-service'
import {
  createCanonicalEditExecutionPackageService,
} from './canonical-edit-execution-package-service'
import type { CanonicalCreateOnlyJsonObjectPort } from
  './canonical-gcs-source-analysis-lifecycle-store'
import {
  verifyCanonicalCaptionSpecialistPlanningArtifact,
} from './canonical-internal-authority-artifact-verifier'
import {
  readCanonicalPrivateJobAdapterCompletion,
} from './canonical-private-job-execution-adapter-service'
import {
  createCanonicalPrivateReviewAssemblyService,
} from './canonical-private-review-assembly-service'
import {
  parseCanonicalSpecialistCallResultPair,
  rereadCanonicalSpecialistSupportResumeChain,
  type CanonicalSpecialistSupportResumeRepository,
} from './canonical-specialist-support-resume-service'
import {
  createEditPlanningAuthorityService,
  type CanonicalApprovedExecutionAuthority,
} from './edit-planning-authority-service'
import {
  findCurrentPrivateTestSelection,
  readPrivateArtifactQaAggregate,
  sha256ArtifactQaValue,
  verifyAllPrivateArtifactQaEvidenceBlobs,
} from './private-artifact-qa-authority-store'
import { sha256AuthorityValue } from './private-edit-authority-store'
import { getRequiredAuthUserId } from './service-helpers'
import {
  parseCanonicalCaptionSpecialistPlanningBinding,
} from '../captions-specialist/caption-canonical-work-planning'
import {
  calculateSkillContractDigest,
} from '../orchestra/orchestra-skill-contracts'

const safeKey = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const prefixSchema = z.string().trim().min(1).max(1_024)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) =>
    !value.includes('..') && !value.includes('//') && !value.endsWith('/'))
const DEFAULT_RECORD_PREFIX =
  'private-internal/captions-specialist/v1/qualification-runs'
const MAX_RECORD_BYTES = 64 * 1024 * 1024
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const artifactRefSchema = refSchema.extend({
  artifactType: safeKey,
  producerSkillKey: safeKey,
  privateArtifact: z.literal(true),
  byteFreeRef: z.literal(true),
  sourceSupportRequestRef: refSchema.nullable(),
}).strict()
const ownerEvidenceSchema = z.object({
  ownerKey: z.enum([
    'canonical_transcript', 'visual_intelligence', 'track_all',
    'living_frame', 'soundsync', 'transitions', 'broll_owner',
    'canonical_timing_owner', 'canonical_layout_owner',
  ]),
  supportRequestRef: refSchema.nullable(),
  ownerEvidenceRef: refSchema,
  authenticatedOwnerProjectionRef: refSchema.nullable(),
  resumeRecordRef: refSchema.nullable(),
  evidenceClass: z.enum([
    'canonical_transcript_authenticated_read',
    'canonical_owner_record',
    'authenticated_projection_only',
  ]),
  exactPersistedOwnerEvidenceReread: z.literal(true),
  directPeerDispatchPerformedByCaption: z.literal(false),
  runtimeOrProviderAuthorityGrantedToCaption: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalAuthorityGrantedToCaption: z.literal(false),
  billingAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const occurrenceSchema = z.object({
  occurrenceId: safeKey,
  jobType: z.enum(CAPTIONS_SUPPORTED_JOB_TYPES),
  outputId: safeKey,
  sceneId: safeKey.nullable(),
  boundaryId: safeKey.nullable(),
  approvedWorkItemRef: refSchema,
  canonicalJobRef: refSchema,
  plannedManifestEntryRef: refSchema,
  adapterCompletionRef: refSchema,
  selectedArtifactRef: refSchema,
  artifactQaRef: refSchema,
  artifactReconciliationRef: refSchema,
  specialistExecutionReceiptRef: refSchema,
  currentCallResultPairRef: refSchema,
  supportResumeChainRef: refSchema,
  producedArtifactRefs: z.array(artifactRefSchema).min(1).max(64),
  ownerEvidence: z.array(ownerEvidenceSchema).min(1).max(33),
  exactApprovedWorkJobManifestAndCostLineageReread: z.literal(true),
  exactArtifactBytesQaAndReconciliationReread: z.literal(true),
  exactCurrentSpecialistResultHeadReread: z.literal(true),
  resultDisposition: z.literal('completed'),
  planningOnly: z.literal(true),
  renderedMediaClaimedByPlanningJob: z.literal(false),
  finalQaClaimedByPlanningJob: z.literal(false),
  unresolvedBlockerCodes: z.array(safeKey).length(0),
}).strict()
const recordSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_QUALIFICATION_RUN_EVIDENCE_V2_VERSION),
  recordId: safeKey,
  recordDigestSha256: sha256,
  requestRef: refSchema,
  observedAt: timestamp,
  canonicalScope: z.object({
    ownerUserId: safeKey,
    workspaceId: safeKey,
    projectId: safeKey,
    editSessionId: safeKey,
    planVersionId: safeKey,
    approvedSnapshotRef: refSchema,
  }).strict(),
  executionPackageRef: refSchema,
  workGraphRef: refSchema,
  assetManifestRef: refSchema,
  estimateRef: refSchema,
  approvalRef: refSchema,
  creditReservationRef: refSchema,
  captionPlanningProjectionRef: refSchema,
  captionPrivateReviewProjectionRef: refSchema,
  privateReviewAssemblyRef: refSchema,
  outputEvidence: z.object({
    outputId: safeKey,
    confirmedOutputFrameRef: refSchema,
    renderedArtifactRef: refSchema,
    deterministicQaRef: refSchema,
    captionOwnedDirectVisualInspectionRef: refSchema,
    qualifiedCompleteTimeVisualReviewRef: refSchema,
    independentFinalQaRef: refSchema,
    privateReviewDecisionRef: refSchema,
    captionOwnedProfessionalAppearancePassed: z.literal(true),
    realUploadedSourcePixelsInspected: z.literal(true),
    syntheticEngineeringFixtureUsed: z.literal(false),
    actualCompleteTimeVisualReviewPassed: z.literal(true),
    independentFinalQaPassed: z.literal(true),
    privateReviewAccepted: z.literal(true),
  }).strict(),
  jobOccurrences: z.array(occurrenceSchema).min(1).max(256),
  exactRequestScopePackageAndOutputSetBound: z.literal(true),
  exactApprovedSnapshotAndExecutionPackageReread: z.literal(true),
  exactAllProjectedCaptionJobsReread: z.literal(true),
  allProjectedCaptionJobsCompleted: z.literal(true),
  allProjectedCaptionArtifactsPersistedQaPassedAndReconciled: z.literal(true),
  actualRequiredOwnerEvidenceReread: z.literal(true),
  approvedCaptionRunEvidenceOnly: z.literal(true),
  terminalJobQualificationClaimed: z.literal(false),
  requiresMultiRunEvidenceCatalogForTerminalQualification: z.literal(true),
  callerSuppliedEvidenceAccepted: z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
  sourceFixtureRelabeledAsRuntimeEvidence: z.literal(false),
  syntheticEngineeringFixtureClaimedProfessionalAppearance: z.literal(false),
  directPeerDispatchPerformedByCaption: z.literal(false),
  operationOrRuntimeAuthorityGrantedToCaption: z.literal(false),
  providerOrModelAuthorityGrantedToCaption: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalAuthorityGrantedToCaption: z.literal(false),
  creditOrBillingAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryAuthorityGrantedToCaption: z.literal(false),
  productionAuthorityGrantedToCaption: z.literal(false),
}).strict()
const legacyRecordV1Schema = recordSchema.extend({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_QUALIFICATION_RUN_EVIDENCE_V1_VERSION),
  outputEvidence: z.object({
    outputId: safeKey,
    confirmedOutputFrameRef: refSchema,
    renderedArtifactRef: refSchema,
    deterministicQaRef: refSchema,
    qualifiedCompleteTimeVisualReviewRef: refSchema,
    independentFinalQaRef: refSchema,
    privateReviewDecisionRef: refSchema,
    actualCompleteTimeVisualReviewPassed: z.literal(true),
    independentFinalQaPassed: z.literal(true),
    privateReviewAccepted: z.literal(true),
  }).strict(),
}).strict()

const admittedReadPorts = new WeakSet<object>()
const admittedRepositories = new WeakSet<object>()
const admittedAssemblies = new WeakSet<object>()

class MissingCanonicalRunEvidence extends Error {}

export function parseCanonicalCaptionQualificationRunEvidence(
  value: unknown,
): CanonicalCaptionQualificationRunEvidence {
  assertClosedContractTree(value, 'Canonical Caption qualification run')
  rejectUnsafeText(value, 'Canonical Caption qualification run')
  const parsed = recordSchema.parse(value) as
    CanonicalCaptionQualificationRunEvidence
  validateRunRecord(parsed)
  return structuredClone(parsed)
}

/**
 * Historical V1 records remain strictly decodable, but they do not contain
 * direct real-source visual-inspection lineage and are therefore never
 * accepted by the V2 terminal qualification repository or catalog.
 */
export function parseCanonicalCaptionQualificationRunEvidenceV1(
  value: unknown,
): CanonicalCaptionQualificationRunEvidenceV1 {
  assertClosedContractTree(value, 'Canonical Caption qualification run V1')
  rejectUnsafeText(value, 'Canonical Caption qualification run V1')
  const parsed = legacyRecordV1Schema.parse(value) as
    CanonicalCaptionQualificationRunEvidenceV1
  validateRunRecord(parsed)
  return structuredClone(parsed)
}

function validateRunRecord(
  parsed: CanonicalCaptionQualificationRunEvidence
    | CanonicalCaptionQualificationRunEvidenceV1,
): void {
  if (parsed.recordDigestSha256 !== calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>, 'recordDigestSha256')) {
    throw new Error('Canonical Caption qualification run digest failed.')
  }
  const occurrenceIds = parsed.jobOccurrences.map((item) => item.occurrenceId)
  const workItemRefs = parsed.jobOccurrences.map((item) =>
    refKey(item.approvedWorkItemRef))
  if (new Set(occurrenceIds).size !== occurrenceIds.length
    || new Set(workItemRefs).size !== workItemRefs.length
    || parsed.jobOccurrences.some((item) =>
      item.outputId !== parsed.outputEvidence.outputId
      || item.ownerEvidence[0]?.ownerKey !== 'canonical_transcript'
      || new Set(item.ownerEvidence.map((owner) => owner.ownerKey)).size
        !== item.ownerEvidence.length
      || !item.ownerEvidence.every(validOwnerEvidence)
      || !uniqueRefs(item.ownerEvidence.map((owner) =>
        owner.ownerEvidenceRef)))) {
    throw new Error('Canonical Caption qualification run lineage is invalid.')
  }
}

export function createCanonicalCaptionQualificationRunEvidenceReadPort(
  readExact: CanonicalCaptionQualificationRunEvidenceReadPort['readExact'],
): CanonicalCaptionQualificationRunEvidenceReadPort {
  if (typeof readExact !== 'function') {
    throw new Error('Canonical Caption qualification run reader is required.')
  }
  const port = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_QUALIFICATION_RUN_EVIDENCE_READ_PORT_V2_VERSION,
    sourceAuthority:
      'canonical_backend_persisted_caption_qualification_run_evidence' as const,
    callerSuppliedEvidenceAccepted: false as const,
    readExact: readExact.bind(undefined),
  })
  admittedReadPorts.add(port)
  return port
}

export function isCanonicalCaptionQualificationRunEvidenceReadPort(
  value: unknown,
): value is CanonicalCaptionQualificationRunEvidenceReadPort {
  return Boolean(value && typeof value === 'object'
    && admittedReadPorts.has(value as object))
}

export function createCanonicalCaptionQualificationRunEvidenceRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalCaptionQualificationRunEvidenceRepository {
  assertObjectPort(input.objectPort)
  const prefix = prefixSchema.parse(input.prefix ?? DEFAULT_RECORD_PREFIX)
  const repository = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_QUALIFICATION_RUN_EVIDENCE_REPOSITORY_V2_VERSION,
    async persistRecordCreateOnly(untrusted: unknown) {
      assertClosedContractTree(untrusted,
        'Canonical Caption qualification run write')
      const record = parseCanonicalCaptionQualificationRunEvidence(
        z.object({ record: z.unknown() }).strict().parse(untrusted).record)
      const body = serializeRecord(record)
      const objectPath = qualificationRunPath(prefix, record.requestRef)
      const disposition = await input.objectPort.createOnly({
        objectPath,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const reread = await rereadQualificationRun(
        input.objectPort, objectPath, record.requestRef)
      if (!reread || !sameCanonical(reread, record)) {
        throw new Error(
          'Canonical Caption qualification run create-only conflict.')
      }
      return disposition === 'created' ? 'created' : 'identical_replay'
    },
    async rereadRecord(untrusted: unknown) {
      assertClosedContractTree(untrusted,
        'Canonical Caption qualification run repository read')
      const requestRefValue = z.object({ requestRef: refSchema }).strict()
        .parse(untrusted).requestRef
      return rereadQualificationRun(input.objectPort,
        qualificationRunPath(prefix, requestRefValue), requestRefValue)
    },
  })
  admittedRepositories.add(repository)
  return repository
}

export function isCanonicalCaptionQualificationRunEvidenceRepository(
  value: unknown,
): value is CanonicalCaptionQualificationRunEvidenceRepository {
  return Boolean(value && typeof value === 'object'
    && admittedRepositories.has(value as object))
}

export function createCanonicalCaptionQualificationRunEvidenceAssembly(input: {
  readonly sourceReadPort: CanonicalCaptionQualificationRunEvidenceReadPort
  readonly repository: CanonicalCaptionQualificationRunEvidenceRepository
}): CanonicalCaptionQualificationRunEvidenceAssembly {
  if (!isCanonicalCaptionQualificationRunEvidenceReadPort(
    input.sourceReadPort)
    || !admittedRepositories.has(input.repository)
    || input.repository.schemaVersion !==
      CANONICAL_CAPTION_QUALIFICATION_RUN_EVIDENCE_REPOSITORY_V2_VERSION) {
    throw new Error('Canonical Caption qualification run ports are invalid.')
  }
  const evidenceReadPort = createCanonicalCaptionQualificationRunEvidenceReadPort(
    async (untrusted) => {
      const request = parseCanonicalCaptionTerminalQualificationRequest(
        requestFromEnvelope(untrusted))
      const exactRequestRef = requestRef(request)
      const existing = await input.repository.rereadRecord({
        requestRef: exactRequestRef,
      })
      if (existing) return structuredClone(existing)
      const first = await input.sourceReadPort.readExact({ request })
      if (!first) return null
      const second = await input.sourceReadPort.readExact({ request })
      if (!second || !sameCanonical(first, second)) {
        throw new Error(
          'Canonical Caption qualification source changed between rereads.')
      }
      const parsed = parseCanonicalCaptionQualificationRunEvidence(first)
      if (refKey(parsed.requestRef) !== refKey(exactRequestRef)) {
        throw new Error(
          'Canonical Caption qualification run crossed its request.')
      }
      await input.repository.persistRecordCreateOnly({ record: parsed })
      const reread = await input.repository.rereadRecord({
        requestRef: exactRequestRef,
      })
      if (!reread || !sameCanonical(reread, parsed)) {
        throw new Error(
          'Canonical Caption qualification run persistence reread failed.')
      }
      return structuredClone(reread)
    })
  const assembly = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_QUALIFICATION_RUN_EVIDENCE_ASSEMBLY_V2_VERSION,
    evidenceReadPort,
    repository: input.repository,
    exactSourceRereadBeforePersistence: true,
    createOnlyPersistenceAndExactReread: true,
    approvedCaptionRunEvidenceOnly: true,
    terminalJobQualificationClaimed: false,
    requiresMultiRunEvidenceCatalogForTerminalQualification: true,
    callerSuppliedEvidenceAccepted: false,
    browserLocalCompletionAccepted: false,
    directPeerDispatchPerformedByCaption: false,
    operationOrRuntimeAuthorityGrantedToCaption: false,
    providerOrModelAuthorityGrantedToCaption: false,
    assetMutationAuthorityGrantedToCaption: false,
    finalQaApprovalAuthorityGrantedToCaption: false,
    creditOrBillingAuthorityGrantedToCaption: false,
    publicDeliveryAuthorityGrantedToCaption: false,
    productionAuthorityGrantedToCaption: false,
  })
  admittedAssemblies.add(assembly)
  return assembly
}

export function isCanonicalCaptionQualificationRunEvidenceAssembly(
  value: unknown,
): value is CanonicalCaptionQualificationRunEvidenceAssembly {
  return Boolean(value && typeof value === 'object'
    && admittedAssemblies.has(value as object))
}

export function createCanonicalCaptionQualificationRunEvidenceReader(input: {
  readonly context: ServiceContext
  readonly supportResumeRepository:
    CanonicalSpecialistSupportResumeRepository
  readonly transcriptEvidenceRepository:
    CanonicalCaptionTranscriptEvidenceRepository
  readonly visualIntelligenceEvidenceRepository:
    CanonicalCaptionVisualIntelligenceEvidenceRepository
  readonly trackAllEvidenceRepository:
    CanonicalCaptionTrackAllEvidenceRepository
  readonly soundSyncEvidenceRepository:
    CanonicalCaptionSoundSyncEvidenceRepository
  readonly brollEvidenceRepository:
    CanonicalCaptionBrollEvidenceRepository
  readonly directVisualInspectionRepository:
    CanonicalCaptionDirectVisualInspectionRepository
}): CanonicalCaptionQualificationRunEvidenceReadPort {
  assertDependencies(input)
  return createCanonicalCaptionQualificationRunEvidenceReadPort(
    async (untrusted) => {
      const request = parseCanonicalCaptionTerminalQualificationRequest(
        requestFromEnvelope(untrusted))
      try {
        return await buildRunEvidence(input, request)
      } catch (error) {
        if (error instanceof MissingCanonicalRunEvidence
          || (error instanceof ApiError
            && error.code === 'JOB_DEPENDENCY_NOT_READY')) return null
        throw error
      }
    })
}

async function buildRunEvidence(
  dependencies: Parameters<
    typeof createCanonicalCaptionQualificationRunEvidenceReader>[0],
  request: ReturnType<
    typeof createCanonicalCaptionTerminalQualificationRequest>,
): Promise<CanonicalCaptionQualificationRunEvidence> {
  const context = dependencies.context
  const ownerUserId = getRequiredAuthUserId(context)
  const packageResult = await createCanonicalEditExecutionPackageService(
    context).getPackage(request.executionPackageRef.id,
    request.canonicalScope.workspaceId)
  const executionPackage = packageResult.approvedEditExecutionPackage
  const authority = await createEditPlanningAuthorityService(context)
    .loadApprovedExecutionAuthority(executionPackage.approvedPlanSnapshotId,
      request.canonicalScope.workspaceId)
  const projection = authority.captionPlanningProjection
  const planningBindingValue =
    authority.components.captionSpecialistPlanningBinding
  if (!projection || !planningBindingValue
    || projection.disposition !==
      'planning_work_projected_downstream_caption_execution_required') {
    throw new MissingCanonicalRunEvidence()
  }
  const planningBinding = parseCanonicalCaptionSpecialistPlanningBinding(
    planningBindingValue)
  assertRequestAuthority({ request, ownerUserId, executionPackage, authority,
    projection, planningBinding })
  const privateReview = await createCanonicalCaptionPrivateReviewEvidenceService(
    context).readForPackage({
      workspaceId: request.canonicalScope.workspaceId,
      packageRecordId: executionPackage.packageRecordId,
      outputId: projection.outputId,
    })
  if (!privateReview) throw new MissingCanonicalRunEvidence()
  const parsedReview = parseCanonicalCaptionPrivateReviewEvidenceProjection(
    privateReview)
  if (!parsedReview.terminalPrivateInternalQualificationEligible
    || !parsedReview.privateReviewAccepted
    || parsedReview.canonicalPrivateReview.assemblyRef === null
    || parsedReview.canonicalPrivateReview.decisionRef === null) {
    throw new MissingCanonicalRunEvidence()
  }
  const renderedArtifactRef = evidenceRef(
    parsedReview.output.renderedArtifactRef)
  const deterministicQaRef = evidenceRef(
    parsedReview.output.deterministicQaRef)
  const directInspectionValue = await dependencies
    .directVisualInspectionRepository.rereadEvidence({
      ownerUserId,
      workspaceId: request.canonicalScope.workspaceId,
      approvedSnapshotRef: request.canonicalScope.approvedSnapshotRef,
      outputId: projection.outputId,
      renderedArtifactRef,
    })
  if (!directInspectionValue) throw new MissingCanonicalRunEvidence()
  const directInspection =
    parseCanonicalCaptionDirectVisualInspectionEvidence(
      directInspectionValue)
  assertDirectVisualInspectionAuthority({
    evidence: directInspection,
    request,
    authority,
    executionPackage,
    renderedArtifactRef,
    deterministicQaRef,
    confirmedOutputFrameRef: parsedReview.output.confirmedOutputFrameRef,
  })
  const assembly = await createCanonicalPrivateReviewAssemblyService(
    context).getCompleted({
      workspaceId: request.canonicalScope.workspaceId,
      packageRecordId: executionPackage.packageRecordId,
    })
  if (assembly.responseHash !==
      parsedReview.canonicalPrivateReview.assemblyRef.contentHash
    || assembly.finalArtifact.sha256 !==
      parsedReview.canonicalPrivateReview.finalArtifactSha256
    || assembly.finalQaArtifact.sha256 !==
      parsedReview.canonicalPrivateReview.finalQaArtifactSha256) {
    throw new Error('Caption qualification private review crossed authority.')
  }
  const aggregateScope = {
    localStorageRoot: context.env.localStorageRoot,
    ownerUserId,
    workspaceId: request.canonicalScope.workspaceId,
  }
  const artifactAggregate = await readPrivateArtifactQaAggregate(
    aggregateScope)
  if (!artifactAggregate) throw new MissingCanonicalRunEvidence()
  await verifyAllPrivateArtifactQaEvidenceBlobs({
    scope: aggregateScope,
    aggregate: artifactAggregate,
  })
  const jobOccurrences: CanonicalCaptionQualificationJobOccurrenceEvidence[] = []
  for (const workItemKey of projection.projectedWorkItemKeys) {
    const workItem = authority.workItems.find((item) =>
      item.workItemKey === workItemKey)
    const job = workItem && authority.jobs.find((item) =>
      item.approvedWorkItemId === workItem.id)
    if (!workItem || !job) {
      throw new Error('Caption qualification projected work is unavailable.')
    }
    const manifestEntries = authority.assetManifest.entries.filter((entry) =>
      entry.approvedWorkItemId === workItem.id && entry.required)
    if (manifestEntries.length !== 1
      || !job.expectedAssetIds.includes(manifestEntries[0]!.id)) {
      throw new Error('Caption qualification manifest lineage is ambiguous.')
    }
    const manifestEntry = manifestEntries[0]!
    const completion = await readCanonicalPrivateJobAdapterCompletion({
      localStorageRoot: context.env.localStorageRoot,
      ownerUserId,
      workspaceId: request.canonicalScope.workspaceId,
      projectId: request.canonicalScope.projectId,
      editSessionId: request.canonicalScope.editSessionId,
      jobId: job.id,
    })
    if (!completion) throw new MissingCanonicalRunEvidence()
    const selection = findCurrentPrivateTestSelection({
      aggregate: artifactAggregate,
      identity: {
        workspaceId: request.canonicalScope.workspaceId,
        projectId: request.canonicalScope.projectId,
        editSessionId: request.canonicalScope.editSessionId,
        snapshotId: authority.snapshot.snapshotId,
        jobId: job.id,
        expectedAssetId: manifestEntry.id,
      },
    })
    if (!selection) throw new MissingCanonicalRunEvidence()
    assertCompletionSelection(completion, selection)
    const verified = await verifyCanonicalCaptionSpecialistPlanningArtifact({
      localStorageRoot: context.env.localStorageRoot,
      artifact: selection.artifact,
    })
    const currentPairValue = await dependencies.supportResumeRepository
      .rereadCallResultPair({ callRef: verified.receipt.captionCallRef })
    if (!currentPairValue) throw new MissingCanonicalRunEvidence()
    const currentPair = parseCanonicalSpecialistCallResultPair(
      currentPairValue)
    if (currentPair.pairId !== verified.callResultPairRef.id
      || currentPair.schemaVersion !== verified.callResultPairRef.version
      || currentPair.pairDigestSha256 !==
        verified.callResultPairRef.contentHash) {
      throw new Error('Caption qualification current pair crossed artifact.')
    }
    const initialCallRef = currentPair.call.resumeOriginCallRef
      ?? callRef(currentPair.call)
    const chain = await rereadCanonicalSpecialistSupportResumeChain({
      initialCallRef,
      repository: dependencies.supportResumeRepository,
    })
    if (!chain || !['completed_without_support',
      'completed_after_support_resume'].includes(chain.status)
      || chain.currentPair.pairDigestSha256 !== currentPair.pairDigestSha256
      || verified.receipt.captionResultRef.contentHash !==
        currentPair.result.resultDigestSha256) {
      throw new MissingCanonicalRunEvidence()
    }
    const workInput = parseCanonicalCaptionSpecialistWorkItemInput(
      workItem.executionInput)
    const ownerEvidence = await readOwnerEvidence({
      dependencies,
      request,
      workInput,
      currentPair,
      chain,
    })
    assertReceiptAuthority({
      receipt: verified.receipt,
      request,
      executionPackage,
      authority,
      workItem,
      job,
      manifestEntry,
    })
    jobOccurrences.push({
      occurrenceId: `caption.qualification.occurrence.${
        sha256AuthorityValue({ workItemKey, jobId: job.id }).slice(0, 40)}`,
      jobType: workInput.captionJobType,
      outputId: workInput.outputId!,
      sceneId: workInput.sceneId,
      boundaryId: workInput.boundaryId,
      approvedWorkItemRef: structuredClone(verified.receipt.approvedWorkItemRef),
      canonicalJobRef: structuredClone(verified.receipt.canonicalJobRef),
      plannedManifestEntryRef: structuredClone(
        verified.receipt.plannedManifestEntryRef),
      adapterCompletionRef: {
        id: `caption.adapter-completion.${completion.identity.jobId}`,
        version: completion.schemaVersion,
        contentHash: completion.responseHash,
      },
      selectedArtifactRef: artifactRef(selection.artifact),
      artifactQaRef: {
        id: selection.qa.qaEvaluationId,
        version: 'private-artifact-qa-evaluation-v1',
        contentHash: sha256ArtifactQaValue(selection.qa),
      },
      artifactReconciliationRef: {
        id: selection.reconciliation.reconciliationId,
        version: 'private-artifact-reconciliation-v1',
        contentHash: sha256ArtifactQaValue(selection.reconciliation),
      },
      specialistExecutionReceiptRef: {
        id: verified.receipt.receiptId,
        version: verified.receipt.schemaVersion,
        contentHash: verified.receipt.receiptDigestSha256,
      },
      currentCallResultPairRef: structuredClone(
        verified.callResultPairRef),
      supportResumeChainRef: {
        id: `caption.support-chain.${chain.chainDigestSha256.slice(0, 40)}`,
        version: chain.schemaVersion,
        contentHash: chain.chainDigestSha256,
      },
      producedArtifactRefs: structuredClone(verified.producedArtifactRefs),
      ownerEvidence,
      exactApprovedWorkJobManifestAndCostLineageReread: true,
      exactArtifactBytesQaAndReconciliationReread: true,
      exactCurrentSpecialistResultHeadReread: true,
      resultDisposition: 'completed',
      planningOnly: true,
      renderedMediaClaimedByPlanningJob: false,
      finalQaClaimedByPlanningJob: false,
      unresolvedBlockerCodes: [],
    })
  }
  if (jobOccurrences.length !== projection.projectedWorkItemKeys.length) {
    throw new Error('Caption qualification did not reread every projected job.')
  }
  const withoutDigest = {
    schemaVersion: CANONICAL_CAPTION_QUALIFICATION_RUN_EVIDENCE_V2_VERSION,
    recordId: `caption.qualification.run.${request.requestDigestSha256
      .slice(0, 40)}`,
    requestRef: requestRef(request),
    observedAt: assembly.assembledAt,
    canonicalScope: structuredClone(request.canonicalScope),
    executionPackageRef: structuredClone(request.executionPackageRef),
    workGraphRef: {
      id: `${authority.snapshot.snapshotId}.work-graph`,
      version: 'private-edit-authority-work-graph-v1',
      contentHash: authority.snapshot.workGraphHash,
    },
    assetManifestRef: {
      id: `${authority.snapshot.snapshotId}.asset-manifest`,
      version: authority.assetManifest.schemaVersion,
      contentHash: authority.assetManifest.manifestHash,
    },
    estimateRef: {
      id: authority.estimate.id,
      version: 'private-edit-authority-credit-estimate-v1',
      contentHash: authority.estimate.estimateHash,
    },
    approvalRef: authorityRef(authority.approval.id,
      'private-edit-authority-approval-v1', authority.approval),
    creditReservationRef: authorityRef(authority.reservation.id,
      'private-edit-authority-credit-reservation-v1', authority.reservation),
    captionPlanningProjectionRef: {
      id: projection.projectionId,
      version: projection.schemaVersion,
      contentHash: projection.projectionDigestSha256,
    },
    captionPrivateReviewProjectionRef: {
      id: parsedReview.projectionId,
      version: parsedReview.schemaVersion,
      contentHash: parsedReview.projectionDigestSha256,
    },
    privateReviewAssemblyRef: structuredClone(
      parsedReview.canonicalPrivateReview.assemblyRef),
    outputEvidence: {
      outputId: parsedReview.output.outputId,
      confirmedOutputFrameRef: structuredClone(
        parsedReview.output.confirmedOutputFrameRef),
      renderedArtifactRef,
      deterministicQaRef,
      captionOwnedDirectVisualInspectionRef: {
        id: directInspection.evidenceId,
        version: directInspection.schemaVersion,
        contentHash: directInspection.evidenceDigestSha256,
      },
      qualifiedCompleteTimeVisualReviewRef:
        canonicalCaptionPrivateReviewVisualEvidenceRef(parsedReview),
      independentFinalQaRef: {
        id: assembly.finalQaArtifact.artifactId,
        version: String(assembly.finalQaArtifact.artifactVersion),
        contentHash: assembly.finalQaArtifact.sha256,
      },
      privateReviewDecisionRef: structuredClone(
        parsedReview.canonicalPrivateReview.decisionRef),
      captionOwnedProfessionalAppearancePassed: true,
      realUploadedSourcePixelsInspected: true,
      syntheticEngineeringFixtureUsed: false,
      actualCompleteTimeVisualReviewPassed: true,
      independentFinalQaPassed: true,
      privateReviewAccepted: true,
    },
    jobOccurrences,
    exactRequestScopePackageAndOutputSetBound: true as const,
    exactApprovedSnapshotAndExecutionPackageReread: true as const,
    exactAllProjectedCaptionJobsReread: true as const,
    allProjectedCaptionJobsCompleted: true as const,
    allProjectedCaptionArtifactsPersistedQaPassedAndReconciled: true as const,
    actualRequiredOwnerEvidenceReread: true as const,
    approvedCaptionRunEvidenceOnly: true as const,
    terminalJobQualificationClaimed: false as const,
    requiresMultiRunEvidenceCatalogForTerminalQualification: true as const,
    callerSuppliedEvidenceAccepted: false as const,
    browserLocalCompletionAccepted: false as const,
    sourceFixtureRelabeledAsRuntimeEvidence: false as const,
    syntheticEngineeringFixtureClaimedProfessionalAppearance: false as const,
    directPeerDispatchPerformedByCaption: false as const,
    operationOrRuntimeAuthorityGrantedToCaption: false as const,
    providerOrModelAuthorityGrantedToCaption: false as const,
    assetMutationAuthorityGrantedToCaption: false as const,
    finalQaApprovalAuthorityGrantedToCaption: false as const,
    creditOrBillingAuthorityGrantedToCaption: false as const,
    publicDeliveryAuthorityGrantedToCaption: false as const,
    productionAuthorityGrantedToCaption: false as const,
  }
  return parseCanonicalCaptionQualificationRunEvidence({
    ...withoutDigest,
    recordDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      recordDigestSha256: '',
    } as unknown as Record<string, unknown>, 'recordDigestSha256'),
  })
}

async function readOwnerEvidence(input: {
  dependencies: Parameters<
    typeof createCanonicalCaptionQualificationRunEvidenceReader>[0]
  request: ReturnType<typeof createCanonicalCaptionTerminalQualificationRequest>
  workInput: ReturnType<typeof parseCanonicalCaptionSpecialistWorkItemInput>
  currentPair: ReturnType<typeof parseCanonicalSpecialistCallResultPair>
  chain: Awaited<ReturnType<
    typeof rereadCanonicalSpecialistSupportResumeChain>> & object
}): Promise<CanonicalCaptionQualificationOwnerEvidence[]> {
  const transcriptArtifact = input.workInput.initialArtifactRefs.find((item) =>
    item.artifactType === 'canonical_transcript')
  if (!transcriptArtifact) {
    throw new Error('Caption qualification transcript input is unavailable.')
  }
  const scope: CaptionCanonicalTranscriptReadScope = {
    ownerUserId: input.request.canonicalScope.ownerUserId,
    workspaceId: input.request.canonicalScope.workspaceId,
    projectId: input.request.canonicalScope.projectId,
    editSessionId: input.request.canonicalScope.editSessionId,
    planVersionId: input.request.canonicalScope.planVersionId,
    approvedSnapshotRef: structuredClone(
      input.request.canonicalScope.approvedSnapshotRef),
  }
  const transcript = await input.dependencies.transcriptEvidenceRepository
    .findExactForExecution({
      canonicalReadScope: scope,
      canonicalTranscriptRef: asDomainRef(transcriptArtifact),
    })
  if (!transcript) throw new MissingCanonicalRunEvidence()
  const transcriptBinding = transcript.authenticatedReadBinding
  const transcriptBindingRef: CaptionDomainRef = {
    id: transcriptBinding.bindingId,
    version:
      CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_BINDING_VERSION,
    contentHash: transcriptBinding.bindingDigestSha256,
  }
  if (!input.currentPair.call.inputArtifactRefs.some((item) =>
    item.artifactType === 'canonical_transcript_authenticated_read_binding'
    && refKey(item) === refKey(transcriptBindingRef))) {
    throw new Error('Caption qualification transcript binding was not executed.')
  }
  const evidence: CanonicalCaptionQualificationOwnerEvidence[] = [
    ownerEvidence({
      ownerKey: 'canonical_transcript',
      supportRequestRef: null,
      ownerEvidenceRef: transcriptBindingRef,
      authenticatedOwnerProjectionRef: null,
      resumeRecordRef: null,
      evidenceClass: 'canonical_transcript_authenticated_read',
    }),
  ]
  for (const record of input.chain.records) {
    const request = record.selectedSupportRequest
    const supportRequestRef = requestRef(request)
    const projectionRef: SkillContractRef = {
      id: record.authenticatedOwnerProjection.projectionId,
      version: record.authenticatedOwnerProjection.schemaVersion,
      contentHash:
        record.authenticatedOwnerProjection.projectionDigestSha256,
    }
    const resumeRecordRef: SkillContractRef = {
      id: record.recordId,
      version: record.schemaVersion,
      contentHash: record.recordDigestSha256,
    }
    let ownerRef: CaptionDomainRef
    let evidenceClass: CanonicalCaptionQualificationOwnerEvidence[
      'evidenceClass'] = 'canonical_owner_record'
    if (request.targetSkillKey === 'visual_intelligence') {
      const value = await input.dependencies
        .visualIntelligenceEvidenceRepository.rereadBySupportRequestRef({
          supportRequestRef,
        })
      if (!value) throw new MissingCanonicalRunEvidence()
      const parsed =
        parseCanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord(
          value)
      ownerRef = { id: parsed.recordId, version: parsed.schemaVersion,
        contentHash: parsed.recordDigestSha256 }
    } else if (request.targetSkillKey === 'track_all') {
      const value = await input.dependencies.trackAllEvidenceRepository
        .rereadBySupportRequestRef({ supportRequestRef })
      if (!value) throw new MissingCanonicalRunEvidence()
      const parsed = parseCanonicalCaptionTrackAllAuthenticatedEvidenceRecord(
        value)
      ownerRef = { id: parsed.recordId, version: parsed.schemaVersion,
        contentHash: parsed.recordDigestSha256 }
    } else if (request.targetSkillKey === 'soundsync') {
      const value = await input.dependencies.soundSyncEvidenceRepository
        .rereadEvidenceRecord({ supportRequestRef })
      if (!value) throw new MissingCanonicalRunEvidence()
      const parsed = parseCanonicalCaptionSoundSyncAuthenticatedEvidenceRecord(
        value)
      ownerRef = { id: parsed.soundSyncResult.resultId,
        version: parsed.soundSyncResult.schemaVersion,
        contentHash: parsed.soundSyncResult.resultDigestSha256 }
    } else if (request.targetSkillKey === 'broll_owner') {
      const value = await input.dependencies.brollEvidenceRepository
        .rereadEvidenceRecord({ supportRequestRef })
      if (!value) throw new MissingCanonicalRunEvidence()
      const parsed = parseCanonicalCaptionBrollAuthenticatedEvidenceRecord(
        value)
      ownerRef = { id: parsed.captionBinding.bindingId,
        version: parsed.captionBinding.schemaVersion,
        contentHash: parsed.captionBinding.bindingDigestSha256 }
    } else {
      ownerRef = asDomainRef(record.authenticatedOwnerProjection.ownerResultRef)
      evidenceClass = 'authenticated_projection_only'
    }
    if (record.authenticatedOwnerProjection.ownerKey !== request.targetSkillKey
      || refKey(record.authenticatedOwnerProjection.supportRequestRef)
        !== refKey(supportRequestRef)) {
      throw new Error('Caption qualification owner projection crossed request.')
    }
    evidence.push(ownerEvidence({
      ownerKey: request.targetSkillKey,
      supportRequestRef,
      ownerEvidenceRef: ownerRef,
      authenticatedOwnerProjectionRef: projectionRef,
      resumeRecordRef,
      evidenceClass,
    }))
  }
  return evidence
}

function assertRequestAuthority(input: {
  request: ReturnType<typeof createCanonicalCaptionTerminalQualificationRequest>
  ownerUserId: string
  executionPackage: Awaited<ReturnType<ReturnType<
    typeof createCanonicalEditExecutionPackageService>['getPackage']>>[
      'approvedEditExecutionPackage']
  authority: CanonicalApprovedExecutionAuthority
  projection: NonNullable<
    CanonicalApprovedExecutionAuthority['captionPlanningProjection']>
  planningBinding: ReturnType<
    typeof parseCanonicalCaptionSpecialistPlanningBinding>
}): void {
  const { request, executionPackage, authority, projection, planningBinding } =
    input
  const scope = request.canonicalScope
  if (scope.ownerUserId !== input.ownerUserId
    || scope.workspaceId !== authority.snapshot.workspaceId
    || scope.projectId !== authority.snapshot.projectId
    || scope.editSessionId !== authority.snapshot.editSessionId
    || scope.planVersionId !== `${authority.snapshot.planId}.v${
      authority.snapshot.planVersion}`
    || planningBinding.canonicalScope.ownerUserId !==
      authority.snapshot.approvedByUserId
    || planningBinding.canonicalScope.workspaceId !== scope.workspaceId
    || planningBinding.canonicalScope.projectId !== scope.projectId
    || planningBinding.canonicalScope.editSessionId !== scope.editSessionId
    || planningBinding.canonicalScope.outputId !== projection.outputId
    || refKey(scope.approvedSnapshotRef) !== refKey({
      id: authority.snapshot.snapshotId,
      version: authority.snapshot.schemaVersion,
      contentHash: authority.snapshot.snapshotHash,
    })
    || refKey(request.executionPackageRef) !== refKey({
      id: executionPackage.packageRecordId,
      version: executionPackage.schemaVersion,
      contentHash: executionPackage.packageHash,
    })
    || executionPackage.approvedPlanSnapshotId !== authority.snapshot.snapshotId
    || request.requiredOutputIds.length !== 1
    || request.requiredOutputIds[0] !== projection.outputId
    || projection.projectedWorkItemKeys.length < 1
    || projection.projectedWorkItemKeys.length !==
      projection.projectedJobTypes.length) {
    throw new Error('Caption qualification request crossed approved authority.')
  }
}

function assertReceiptAuthority(input: {
  receipt: Awaited<ReturnType<
    typeof verifyCanonicalCaptionSpecialistPlanningArtifact>>['receipt']
  request: ReturnType<typeof createCanonicalCaptionTerminalQualificationRequest>
  executionPackage: Parameters<typeof assertRequestAuthority>[0][
    'executionPackage']
  authority: CanonicalApprovedExecutionAuthority
  workItem: CanonicalApprovedExecutionAuthority['workItems'][number]
  job: CanonicalApprovedExecutionAuthority['jobs'][number]
  manifestEntry: CanonicalApprovedExecutionAuthority['assetManifest'][
    'entries'][number]
}): void {
  const { receipt } = input
  const workItemRef = authorityRef(input.workItem.id,
    'private-edit-authority-approved-work-item-v1', input.workItem)
  const jobRef = authorityRef(input.job.id,
    'private-edit-authority-derived-job-v1', input.job)
  const manifestEntryRef = authorityRef(input.manifestEntry.id,
    'private-edit-asset-manifest-entry-v1', input.manifestEntry)
  const reservationRef = authorityRef(input.authority.reservation.id,
    'private-edit-authority-credit-reservation-v1',
    input.authority.reservation)
  if (refKey(receipt.executionPackageRef) !==
      refKey(input.request.executionPackageRef)
    || refKey(receipt.approvedSnapshotRef) !== refKey(
      input.request.canonicalScope.approvedSnapshotRef)
    || refKey(receipt.approvedWorkItemRef) !== refKey(workItemRef)
    || refKey(receipt.canonicalJobRef) !== refKey(jobRef)
    || refKey(receipt.plannedManifestEntryRef) !== refKey(manifestEntryRef)
    || receipt.estimateRef.id !== input.authority.estimate.id
    || receipt.estimateRef.contentHash !== input.authority.estimate.estimateHash
    || refKey(receipt.reservationRef) !== refKey(reservationRef)
    || receipt.captionJobType !==
      input.workItem.executionInput.captionJobType
    || receipt.resultDisposition !== 'completed') {
    throw new Error('Caption qualification receipt crossed canonical authority.')
  }
}

function assertCompletionSelection(
  completion: Awaited<ReturnType<
    typeof readCanonicalPrivateJobAdapterCompletion>> & object,
  selection: NonNullable<ReturnType<typeof findCurrentPrivateTestSelection>>,
): void {
  if (completion.identity.expectedAssetId !== selection.artifact.identity
      .expectedAssetId
    || completion.result.artifactId !== selection.artifact.artifactId
    || completion.result.sha256 !== selection.artifact.content.sha256
    || completion.result.byteLength !== selection.artifact.content.byteLength
    || completion.result.contentType !== selection.artifact.content.contentType
    || completion.result.qaOutcome !== 'passed'
    || selection.qa.outcome !== 'passed'
    || selection.qa.artifactId !== selection.artifact.artifactId
    || selection.reconciliation.artifactId !== selection.artifact.artifactId
    || selection.reconciliation.qaEvaluationId !== selection.qa.qaEvaluationId
    || selection.reconciliation.decision !==
      'test_merged_not_live_authorized'
    || !selection.reconciliation.privateTestDependencySatisfied) {
    throw new Error('Caption qualification completion/QA lineage is invalid.')
  }
}

function ownerEvidence(
  input: Omit<CanonicalCaptionQualificationOwnerEvidence,
    'exactPersistedOwnerEvidenceReread'
    | 'directPeerDispatchPerformedByCaption'
    | 'runtimeOrProviderAuthorityGrantedToCaption'
    | 'assetMutationAuthorityGrantedToCaption'
    | 'finalQaApprovalAuthorityGrantedToCaption'
    | 'billingAuthorityGrantedToCaption'
    | 'publicDeliveryGranted'
    | 'productionAuthorityGranted'>,
): CanonicalCaptionQualificationOwnerEvidence {
  return {
    ...input,
    exactPersistedOwnerEvidenceReread: true,
    directPeerDispatchPerformedByCaption: false,
    runtimeOrProviderAuthorityGrantedToCaption: false,
    assetMutationAuthorityGrantedToCaption: false,
    finalQaApprovalAuthorityGrantedToCaption: false,
    billingAuthorityGrantedToCaption: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
}

function assertDependencies(input: Parameters<
  typeof createCanonicalCaptionQualificationRunEvidenceReader>[0]): void {
  if (!input.context
    || typeof input.supportResumeRepository?.rereadCallResultPair !== 'function'
    || typeof input.supportResumeRepository
      ?.rereadAuthenticatedOwnerProjection !== 'function'
    || typeof input.supportResumeRepository
      ?.rereadResumeRecordByResumedCall !== 'function'
    || typeof input.transcriptEvidenceRepository
      ?.findExactForExecution !== 'function'
    || typeof input.visualIntelligenceEvidenceRepository
      ?.rereadBySupportRequestRef !== 'function'
    || typeof input.trackAllEvidenceRepository
      ?.rereadBySupportRequestRef !== 'function'
    || typeof input.soundSyncEvidenceRepository
      ?.rereadEvidenceRecord !== 'function'
    || typeof input.brollEvidenceRepository
      ?.rereadEvidenceRecord !== 'function'
    || !isCanonicalCaptionDirectVisualInspectionRepository(
      input.directVisualInspectionRepository)) {
    throw new Error('Canonical Caption qualification reader is incomplete.')
  }
}

function assertDirectVisualInspectionAuthority(input: {
  evidence: ReturnType<
    typeof parseCanonicalCaptionDirectVisualInspectionEvidence>
  request: ReturnType<typeof createCanonicalCaptionTerminalQualificationRequest>
  authority: CanonicalApprovedExecutionAuthority
  executionPackage: Awaited<ReturnType<ReturnType<
    typeof createCanonicalEditExecutionPackageService>['getPackage']>>[
      'approvedEditExecutionPackage']
  renderedArtifactRef: CaptionDomainRef
  deterministicQaRef: CaptionDomainRef
  confirmedOutputFrameRef: CaptionDomainRef
}): void {
  const { evidence, request, authority, executionPackage } = input
  const source = authority.sourceAssetManifest
  if (source.schemaVersion !== 'private-approved-source-binding-manifest-v1') {
    throw new MissingCanonicalRunEvidence()
  }
  const expectedSourceAuthorityRef: CaptionDomainRef = {
    id: `${authority.snapshot.snapshotId}.approved-source-media`,
    version: source.schemaVersion,
    contentHash: source.manifestHash,
  }
  const expectedBindingRefs: CaptionDomainRef[] = source.bindings.map(
    (binding) => ({
      id: binding.mediaAssetId,
      version: 'private-approved-source-binding-v1',
      contentHash: binding.bindingHash,
    })).sort((left, right) => {
      const leftKey = refKey(left)
      const rightKey = refKey(right)
      return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0
    })
  const scope = evidence.canonicalScope
  if (scope.ownerUserId !== request.canonicalScope.ownerUserId
    || scope.workspaceId !== request.canonicalScope.workspaceId
    || scope.projectId !== request.canonicalScope.projectId
    || scope.editSessionId !== request.canonicalScope.editSessionId
    || scope.planVersionId !== request.canonicalScope.planVersionId
    || refKey(scope.approvedSnapshotRef) !==
      refKey(request.canonicalScope.approvedSnapshotRef)
    || refKey(scope.executionPackageRef) !==
      refKey(request.executionPackageRef)
    || scope.outputId !== request.requiredOutputIds[0]
    || refKey(evidence.confirmedOutputFrameRef) !==
      refKey(input.confirmedOutputFrameRef)
    || refKey(evidence.renderedArtifactRef) !==
      refKey(input.renderedArtifactRef)
    || refKey(evidence.deterministicQaRef) !==
      refKey(input.deterministicQaRef)
    || refKey(evidence.sourceMediaAuthorityRef) !==
      refKey(expectedSourceAuthorityRef)
    || evidence.sourceMediaBindingRefs.map(refKey).join('|') !==
      expectedBindingRefs.map(refKey).join('|')
    || executionPackage.approvedPlanSnapshotId !==
      request.canonicalScope.approvedSnapshotRef.id
    || !evidence.realUploadedSourcePixelsInspected
    || evidence.syntheticEngineeringFixtureUsed
    || !evidence.acceptedForCaptionOwnedProfessionalAppearance) {
    throw new Error(
      'Caption qualification direct visual inspection crossed authority.')
  }
}

function requestFromEnvelope(value: unknown): unknown {
  assertClosedContractTree(value, 'Canonical Caption qualification run read')
  const parsed = z.object({ request: z.unknown() }).strict().parse(value)
  return parsed.request
}

function requestRef(request: SkillSupportRequest): SkillContractRef
function requestRef(request: ReturnType<
  typeof createCanonicalCaptionTerminalQualificationRequest>): CaptionDomainRef
function requestRef(request: SkillSupportRequest | ReturnType<
  typeof createCanonicalCaptionTerminalQualificationRequest>):
SkillContractRef {
  return { id: request.requestId, version: request.schemaVersion,
    contentHash: request.requestDigestSha256 }
}

function callRef(call: { callId: string; schemaVersion: string;
  callDigestSha256: string }): SkillContractRef {
  return { id: call.callId, version: call.schemaVersion,
    contentHash: call.callDigestSha256 }
}

function artifactRef(artifact: NonNullable<ReturnType<
  typeof findCurrentPrivateTestSelection>>['artifact']): CaptionDomainRef {
  return { id: artifact.artifactId, version: String(artifact.artifactVersion),
    contentHash: artifact.content.sha256 }
}

function evidenceRef(value: { id: string; version: number;
  contentHash: string }): CaptionDomainRef {
  return { id: value.id, version: String(value.version),
    contentHash: unprefix(value.contentHash) }
}

function asDomainRef(value: SkillContractRef): CaptionDomainRef {
  return { id: value.id, version: value.version,
    contentHash: value.contentHash }
}

function authorityRef(id: string, version: string, value: unknown):
CaptionDomainRef {
  return { id, version, contentHash: sha256AuthorityValue(value) }
}

function unprefix(value: string): string {
  return value.startsWith('sha256:') ? value.slice(7) : value
}

function refKey(value: { id: string; version: string;
  contentHash: string }): string {
  return `${value.id}|${value.version}|${value.contentHash}`
}

function uniqueRefs(values: CaptionDomainRef[]): boolean {
  return new Set(values.map(refKey)).size === values.length
}

function validOwnerEvidence(
  value: CanonicalCaptionQualificationOwnerEvidence,
): boolean {
  if (value.ownerKey === 'canonical_transcript') {
    return value.evidenceClass ===
      'canonical_transcript_authenticated_read'
      && value.supportRequestRef === null
      && value.authenticatedOwnerProjectionRef === null
      && value.resumeRecordRef === null
  }
  return value.evidenceClass !==
      'canonical_transcript_authenticated_read'
    && value.supportRequestRef !== null
    && value.authenticatedOwnerProjectionRef !== null
    && value.resumeRecordRef !== null
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error(
      'Canonical Caption qualification run object port is incomplete.')
  }
}

function qualificationRunPath(
  prefix: string,
  value: CaptionDomainRef,
): string {
  return `${prefix}/${value.contentHash}.json`
}

function serializeRecord(
  value: CanonicalCaptionQualificationRunEvidence,
): Buffer {
  const body = Buffer.from(JSON.stringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw new Error('Canonical Caption qualification run size is invalid.')
  }
  return body
}

async function rereadQualificationRun(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  expectedRequestRef: CaptionDomainRef,
): Promise<CanonicalCaptionQualificationRunEvidence | null> {
  const body = await port.readExact(objectPath)
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw new Error('Canonical Caption qualification run bytes are invalid.')
  }
  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(body.toString('utf8')) as unknown
  } catch (error) {
    throw new Error('Canonical Caption qualification run JSON is invalid.', {
      cause: error,
    })
  }
  const record = parseCanonicalCaptionQualificationRunEvidence(parsedJson)
  if (refKey(record.requestRef) !== refKey(expectedRequestRef)) {
    throw new Error(
      'Canonical Caption qualification run repository crossed its request.')
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
