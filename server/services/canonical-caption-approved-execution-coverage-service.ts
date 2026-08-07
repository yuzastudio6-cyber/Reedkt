import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  CANONICAL_CAPTION_APPROVED_EXECUTION_COVERAGE_REPOSITORY_VERSION,
  CANONICAL_CAPTION_APPROVED_EXECUTION_COVERAGE_VERSION,
  type CanonicalCaptionApprovedExecutionCoverage,
  type CanonicalCaptionApprovedExecutionCoverageOccurrence,
  type CanonicalCaptionApprovedExecutionCoverageRepository,
} from '../../src/types/canonical-caption-approved-execution-coverage'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import {
  CAPTIONS_SUPPORTED_JOB_TYPES,
  type CaptionsSupportedJobType,
} from '../../src/types/captions-specialist'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import type { CanonicalApprovedEditExecutionPackage } from
  '../edit-architecture/canonical-approved-edit-execution-package'
import {
  CAPTIONS_SPECIALIST_MANIFEST,
} from '../captions-specialist/captions-specialist-manifest'
import type { CanonicalPrivateJobExecutionAdapterResponse } from
  '../validation/canonical-private-job-execution-adapter-schemas'
import {
  canonicalPrivateJobExecutionAdapterResponseSchema,
} from '../validation/canonical-private-job-execution-adapter-schemas'
import type { ServiceContext } from '../types'
import type { CanonicalCreateOnlyJsonObjectPort } from
  './canonical-gcs-source-analysis-lifecycle-store'
import {
  parseCanonicalCaptionSpecialistWorkItemInput,
} from './canonical-caption-specialist-execution-service'
import {
  readCanonicalPrivateJobAdapterCompletion,
} from './canonical-private-job-execution-adapter-service'
import type { CanonicalApprovedExecutionAuthority } from
  './edit-planning-authority-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  calculateSkillContractDigest,
} from '../orchestra/orchestra-skill-contracts'

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
const frameRangeSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
}).strict().refine((value) =>
  value.endFrameExclusive > value.startFrame)
const occurrenceSchema = z.object({
  occurrenceId: safeKey,
  canonicalCatalogOrder: z.number().int().min(0).max(40),
  captionJobType: z.enum(CAPTIONS_SUPPORTED_JOB_TYPES),
  scopeLevel: z.enum(['video', 'scene', 'boundary']),
  outputId: safeKey,
  sceneId: safeKey.nullable(),
  boundaryId: safeKey.nullable(),
  authorizedFrameRanges: z.array(frameRangeSchema).min(1).max(16),
  approvedWorkItemRef: refSchema,
  canonicalJobRef: refSchema,
  plannedManifestEntryRef: refSchema,
  adapterCompletionRef: refSchema,
  resultArtifactRef: refSchema,
  adapterCompletedAt: timestamp,
  exactApprovedWorkJobAndManifestReread: z.literal(true),
  exactPersistedAdapterCompletionReread: z.literal(true),
  idempotentAdapterReplayVerified: z.literal(true),
  privateArtifactPersistenceClaimReread: z.literal(true),
  deterministicArtifactQaClaimReread: z.literal(true),
  reconciliationClaimReread: z.literal(true),
  artifactBytesIndependentlyRereadForThisRecord: z.literal(false),
  requiredOwnerEvidenceRereadForThisRecord: z.literal(false),
  qualifiedCompleteTimeVisualReviewRereadForThisRecord: z.literal(false),
  independentFinalQaRereadForThisRecord: z.literal(false),
  terminalJobQualificationClaimed: z.literal(false),
}).strict()
const coverageSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_APPROVED_EXECUTION_COVERAGE_VERSION),
  coverageId: safeKey,
  coverageDigestSha256: sha256,
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
  captionPlanningProjectionRef: refSchema,
  captionCapabilityManifestRef: refSchema,
  declaredCaptionJobTypes: z.array(
    z.enum(CAPTIONS_SUPPORTED_JOB_TYPES)).length(41),
  coveredCaptionJobTypes: z.array(
    z.enum(CAPTIONS_SUPPORTED_JOB_TYPES)).min(1).max(41),
  missingCaptionJobTypes: z.array(
    z.enum(CAPTIONS_SUPPORTED_JOB_TYPES)).max(40),
  outputIds: z.array(safeKey).min(1).max(32),
  jobOccurrences: z.array(occurrenceSchema).min(1).max(256),
  counts: z.object({
    declaredCaptionJobTypes: z.literal(41),
    projectedCaptionJobOccurrences: z.number().int().positive().max(256),
    executedCaptionJobOccurrences: z.number().int().positive().max(256),
    uniqueCoveredCaptionJobTypes: z.number().int().positive().max(41),
    missingCaptionJobTypes: z.number().int().nonnegative().max(40),
  }).strict(),
  disposition: z.enum([
    'partial_catalog_execution_coverage',
    'complete_catalog_execution_coverage_terminal_evidence_still_required',
  ]),
  allProjectedCaptionWorkItemsExecuted: z.literal(true),
  allProjectedAdapterCompletionsPersistedAndReread: z.literal(true),
  allProjectedAdapterResultsQaPassedAndReconciled: z.literal(true),
  completeCatalogExecutionCoverage: z.boolean(),
  requiresAdditionalApprovedRuns: z.boolean(),
  preterminalApprovedExecutionEvidenceOnly: z.literal(true),
  acceptedByTerminalQualificationRunRepository: z.literal(false),
  actualArtifactBytesIndependentlyRereadForThisRecord: z.literal(false),
  actualRequiredOwnerEvidenceRereadForThisRecord: z.literal(false),
  qualifiedCompleteTimeVisualReviewRereadForThisRecord: z.literal(false),
  independentFinalQaRereadForThisRecord: z.literal(false),
  terminalQualificationClaimed: z.literal(false),
  callerSuppliedEvidenceAccepted: z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
  sourceFixtureRelabeledAsTerminalEvidence: z.literal(false),
  directPeerDispatchPerformedByCaption: z.literal(false),
  operationOrRuntimeAuthorityGrantedToCaption: z.literal(false),
  providerOrModelAuthorityGrantedToCaption: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalAuthorityGrantedToCaption: z.literal(false),
  creditOrBillingAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryAuthorityGrantedToCaption: z.literal(false),
  productionAuthorityGrantedToCaption: z.literal(false),
}).strict()

const DEFAULT_PREFIX =
  'private-internal/captions-specialist/v1/approved-execution-coverage'
const prefixSchema = z.string().trim().min(1).max(1_024)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) =>
    !value.includes('..') && !value.includes('//') && !value.endsWith('/'))
const MAX_RECORD_BYTES = 8 * 1024 * 1024

export interface CanonicalCaptionApprovedExecutionObservation {
  readonly jobId: string
  readonly workItemKey: string
  readonly captionJob: boolean
  readonly initialResponse: CanonicalPrivateJobExecutionAdapterResponse
  readonly replayResponse: CanonicalPrivateJobExecutionAdapterResponse
}

export function parseCanonicalCaptionApprovedExecutionCoverage(
  value: unknown,
): CanonicalCaptionApprovedExecutionCoverage {
  assertClosedContractTree(value,
    'Canonical Caption approved execution coverage')
  rejectUnsafeText(value, 'Canonical Caption approved execution coverage')
  const parsed = coverageSchema.parse(value) as
    CanonicalCaptionApprovedExecutionCoverage
  const declared = CAPTIONS_SUPPORTED_JOB_TYPES as readonly
    CaptionsSupportedJobType[]
  const occurrenceKeys = parsed.jobOccurrences.map((item) => item.occurrenceId)
  const workItemKeys = parsed.jobOccurrences.map((item) =>
    refKey(item.approvedWorkItemRef))
  const jobKeys = parsed.jobOccurrences.map((item) =>
    refKey(item.canonicalJobRef))
  const coveredSet = new Set(parsed.jobOccurrences.map((item) =>
    item.captionJobType))
  const expectedCovered = declared.filter((jobType) => coveredSet.has(jobType))
  const expectedMissing = declared.filter((jobType) => !coveredSet.has(jobType))
  const expectedOutputs = [...new Set(parsed.jobOccurrences.map((item) =>
    item.outputId))].sort()
  const expectedObservedAt = [...parsed.jobOccurrences].sort((left, right) =>
    left.adapterCompletedAt.localeCompare(right.adapterCompletedAt)).at(-1)
    ?.adapterCompletedAt
  const complete = expectedMissing.length === 0
  if (parsed.coverageDigestSha256 !== calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>, 'coverageDigestSha256')
    || parsed.coverageId !== `caption.approved-execution-coverage.${
      parsed.executionPackageRef.contentHash.slice(0, 40)}`
    || parsed.declaredCaptionJobTypes.join('|') !== declared.join('|')
    || parsed.coveredCaptionJobTypes.join('|') !== expectedCovered.join('|')
    || parsed.missingCaptionJobTypes.join('|') !== expectedMissing.join('|')
    || parsed.outputIds.join('|') !== expectedOutputs.join('|')
    || parsed.observedAt !== expectedObservedAt
    || parsed.counts.projectedCaptionJobOccurrences !==
      parsed.jobOccurrences.length
    || parsed.counts.executedCaptionJobOccurrences !==
      parsed.jobOccurrences.length
    || parsed.counts.uniqueCoveredCaptionJobTypes !== expectedCovered.length
    || parsed.counts.missingCaptionJobTypes !== expectedMissing.length
    || parsed.completeCatalogExecutionCoverage !== complete
    || parsed.requiresAdditionalApprovedRuns === complete
    || parsed.disposition !== (complete
      ? 'complete_catalog_execution_coverage_terminal_evidence_still_required'
      : 'partial_catalog_execution_coverage')
    || parsed.captionCapabilityManifestRef.id !==
      CAPTIONS_SPECIALIST_MANIFEST.manifestId
    || parsed.captionCapabilityManifestRef.version !==
      CAPTIONS_SPECIALIST_MANIFEST.manifestSchemaVersion
    || parsed.captionCapabilityManifestRef.contentHash !==
      CAPTIONS_SPECIALIST_MANIFEST.manifestHash
    || new Set(occurrenceKeys).size !== occurrenceKeys.length
    || new Set(workItemKeys).size !== workItemKeys.length
    || new Set(jobKeys).size !== jobKeys.length
    || !occurrencesAreCanonical(parsed.jobOccurrences)
    || parsed.jobOccurrences.some((item) =>
      item.canonicalCatalogOrder !== declared.indexOf(item.captionJobType)
      || !validOccurrenceScope(item))) {
    throw new Error(
      'Canonical Caption approved execution coverage is inconsistent.')
  }
  return structuredClone(parsed)
}

export async function assembleCanonicalCaptionApprovedExecutionCoverage(input: {
  readonly context: ServiceContext
  readonly authority: CanonicalApprovedExecutionAuthority
  readonly executionPackage: CanonicalApprovedEditExecutionPackage
  readonly executions: readonly CanonicalCaptionApprovedExecutionObservation[]
}): Promise<CanonicalCaptionApprovedExecutionCoverage> {
  const { authority, executionPackage } = input
  const snapshot = authority.snapshot
  const projection = authority.captionPlanningProjection
  if (!projection || projection.disposition !==
      'planning_work_projected_downstream_caption_execution_required'
    || input.context.auth?.userId !== snapshot.approvedByUserId
    || executionPackage.workspaceId !== snapshot.workspaceId
    || executionPackage.projectId !== snapshot.projectId
    || executionPackage.editSessionId !== snapshot.editSessionId
    || executionPackage.approvedPlanSnapshotId !== snapshot.snapshotId
    || executionPackage.snapshotHash !== snapshot.snapshotHash
    || executionPackage.workGraphHash !== snapshot.workGraphHash
    || executionPackage.source !== 'canonical_edit_authority'
    || executionPackage.purpose !== 'private_internal_execution_handoff'
    || executionPackage.createdByUserId !== snapshot.approvedByUserId
    || !sha256.safeParse(executionPackage.packageHash).success) {
    throw new Error(
      'Canonical Caption execution coverage authority is inconsistent.')
  }
  const executionByJobId = new Map(input.executions.filter((item) =>
    item.captionJob).map((item) => [item.jobId, item]))
  if (executionByJobId.size !== input.executions.filter((item) =>
    item.captionJob).length) {
    throw new Error('Canonical Caption execution coverage contains duplicates.')
  }
  const occurrences: CanonicalCaptionApprovedExecutionCoverageOccurrence[] = []
  for (const workItemKey of projection.projectedWorkItemKeys) {
    const workItem = authority.workItems.find((item) =>
      item.workItemKey === workItemKey)
    const job = workItem && authority.jobs.find((item) =>
      item.approvedWorkItemId === workItem.id)
    const packageWorkItem = workItem && executionPackage.approvedWorkItems.find(
      (item) => item.id === workItem.id)
    const packageJob = job && executionPackage.jobs.find((item) =>
      item.id === job.id)
    if (!workItem || !job || !packageWorkItem || !packageJob
      || workItem.workerClass !== 'canonical_caption_specialist_worker_v1'
      || packageWorkItem.workItemKey !== workItem.workItemKey
      || packageWorkItem.executionInputHash !== workItem.executionInputHash
      || packageJob.approvedWorkItemId !== workItem.id) {
      throw new Error(
        'Canonical Caption execution coverage work authority is unavailable.')
    }
    const workInput = parseCanonicalCaptionSpecialistWorkItemInput(
      workItem.executionInput)
    const manifestEntries = authority.assetManifest.entries.filter((entry) =>
      entry.approvedWorkItemId === workItem.id && entry.required)
    const execution = executionByJobId.get(job.id)
    if (manifestEntries.length !== 1 || !execution
      || execution.workItemKey !== workItem.workItemKey) {
      throw new Error(
        'Canonical Caption execution coverage is missing exact output evidence.')
    }
    const completion = await readCanonicalPrivateJobAdapterCompletion({
      localStorageRoot: input.context.env.localStorageRoot,
      ownerUserId: snapshot.approvedByUserId,
      workspaceId: snapshot.workspaceId,
      projectId: snapshot.projectId,
      editSessionId: snapshot.editSessionId,
      jobId: job.id,
    })
    if (!completion) {
      throw new Error(
        'Canonical Caption persisted adapter completion is unavailable.')
    }
    assertAdapterCompletion({
      snapshotId: snapshot.snapshotId,
      workItemId: workItem.id,
      jobId: job.id,
      initial: execution.initialResponse,
      replay: execution.replayResponse,
      completion,
    })
    if (workInput.outputId === null) {
      throw new Error('Canonical Caption execution coverage lacks output scope.')
    }
    const manifestEntry = manifestEntries[0]!
    occurrences.push({
      occurrenceId: `caption.approved-execution-occurrence.${
        sha256AuthorityValue({ packageHash: executionPackage.packageHash,
          workItemId: workItem.id, jobId: job.id }).slice(0, 40)}`,
      canonicalCatalogOrder:
        CAPTIONS_SUPPORTED_JOB_TYPES.indexOf(workInput.captionJobType),
      captionJobType: workInput.captionJobType,
      scopeLevel: restrictedScope(workInput.scopeLevel),
      outputId: workInput.outputId,
      sceneId: workInput.sceneId,
      boundaryId: workInput.boundaryId,
      authorizedFrameRanges: structuredClone(workInput.authorizedFrameRanges),
      approvedWorkItemRef: authorityRef(workItem.id,
        'private-edit-authority-approved-work-item-v1', workItem),
      canonicalJobRef: authorityRef(job.id,
        'private-edit-authority-derived-job-v1', job),
      plannedManifestEntryRef: authorityRef(manifestEntry.id,
        'private-edit-asset-manifest-entry-v1', manifestEntry),
      adapterCompletionRef: {
        id: `caption.adapter-completion.${completion.identity.jobId}`,
        version: completion.schemaVersion,
        contentHash: completion.responseHash,
      },
      resultArtifactRef: {
        id: completion.result.artifactId,
        version: 'canonical-private-job-result-artifact-v1',
        contentHash: completion.result.sha256,
      },
      adapterCompletedAt: completion.completedAt,
      exactApprovedWorkJobAndManifestReread: true,
      exactPersistedAdapterCompletionReread: true,
      idempotentAdapterReplayVerified: true,
      privateArtifactPersistenceClaimReread: true,
      deterministicArtifactQaClaimReread: true,
      reconciliationClaimReread: true,
      artifactBytesIndependentlyRereadForThisRecord: false,
      requiredOwnerEvidenceRereadForThisRecord: false,
      qualifiedCompleteTimeVisualReviewRereadForThisRecord: false,
      independentFinalQaRereadForThisRecord: false,
      terminalJobQualificationClaimed: false,
    })
  }
  occurrences.sort(compareOccurrences)
  const coveredSet = new Set(occurrences.map((item) => item.captionJobType))
  const covered = CAPTIONS_SUPPORTED_JOB_TYPES.filter((item) =>
    coveredSet.has(item))
  const missing = CAPTIONS_SUPPORTED_JOB_TYPES.filter((item) =>
    !coveredSet.has(item))
  const outputIds = [...new Set(occurrences.map((item) => item.outputId))].sort()
  const complete = missing.length === 0
  const disposition: CanonicalCaptionApprovedExecutionCoverage['disposition'] =
    complete
      ? 'complete_catalog_execution_coverage_terminal_evidence_still_required'
      : 'partial_catalog_execution_coverage'
  const observedAt = [...occurrences].sort((left, right) =>
    left.adapterCompletedAt.localeCompare(right.adapterCompletedAt)).at(-1)!
    .adapterCompletedAt
  const withoutDigest = {
    schemaVersion: CANONICAL_CAPTION_APPROVED_EXECUTION_COVERAGE_VERSION,
    coverageId: `caption.approved-execution-coverage.${
      executionPackage.packageHash.slice(0, 40)}`,
    observedAt,
    canonicalScope: {
      ownerUserId: snapshot.approvedByUserId,
      workspaceId: snapshot.workspaceId,
      projectId: snapshot.projectId,
      editSessionId: snapshot.editSessionId,
      planVersionId: `${snapshot.planId}.v${snapshot.planVersion}`,
      approvedSnapshotRef: {
        id: snapshot.snapshotId,
        version: snapshot.schemaVersion,
        contentHash: snapshot.snapshotHash,
      },
    },
    executionPackageRef: {
      id: executionPackage.packageRecordId,
      version: executionPackage.schemaVersion,
      contentHash: executionPackage.packageHash,
    },
    workGraphRef: {
      id: `${snapshot.snapshotId}.work-graph`,
      version: 'private-edit-authority-work-graph-v1',
      contentHash: snapshot.workGraphHash,
    },
    captionPlanningProjectionRef: {
      id: projection.projectionId,
      version: projection.schemaVersion,
      contentHash: projection.projectionDigestSha256,
    },
    captionCapabilityManifestRef: {
      id: CAPTIONS_SPECIALIST_MANIFEST.manifestId,
      version: CAPTIONS_SPECIALIST_MANIFEST.manifestSchemaVersion,
      contentHash: CAPTIONS_SPECIALIST_MANIFEST.manifestHash,
    },
    declaredCaptionJobTypes: [...CAPTIONS_SUPPORTED_JOB_TYPES],
    coveredCaptionJobTypes: [...covered],
    missingCaptionJobTypes: [...missing],
    outputIds,
    jobOccurrences: occurrences,
    counts: {
      declaredCaptionJobTypes: 41 as const,
      projectedCaptionJobOccurrences: occurrences.length,
      executedCaptionJobOccurrences: occurrences.length,
      uniqueCoveredCaptionJobTypes: covered.length,
      missingCaptionJobTypes: missing.length,
    },
    disposition,
    allProjectedCaptionWorkItemsExecuted: true as const,
    allProjectedAdapterCompletionsPersistedAndReread: true as const,
    allProjectedAdapterResultsQaPassedAndReconciled: true as const,
    completeCatalogExecutionCoverage: complete,
    requiresAdditionalApprovedRuns: !complete,
    preterminalApprovedExecutionEvidenceOnly: true as const,
    acceptedByTerminalQualificationRunRepository: false as const,
    actualArtifactBytesIndependentlyRereadForThisRecord: false as const,
    actualRequiredOwnerEvidenceRereadForThisRecord: false as const,
    qualifiedCompleteTimeVisualReviewRereadForThisRecord: false as const,
    independentFinalQaRereadForThisRecord: false as const,
    terminalQualificationClaimed: false as const,
    callerSuppliedEvidenceAccepted: false as const,
    browserLocalCompletionAccepted: false as const,
    sourceFixtureRelabeledAsTerminalEvidence: false as const,
    directPeerDispatchPerformedByCaption: false as const,
    operationOrRuntimeAuthorityGrantedToCaption: false as const,
    providerOrModelAuthorityGrantedToCaption: false as const,
    assetMutationAuthorityGrantedToCaption: false as const,
    finalQaApprovalAuthorityGrantedToCaption: false as const,
    creditOrBillingAuthorityGrantedToCaption: false as const,
    publicDeliveryAuthorityGrantedToCaption: false as const,
    productionAuthorityGrantedToCaption: false as const,
  }
  return parseCanonicalCaptionApprovedExecutionCoverage({
    ...withoutDigest,
    coverageDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      coverageDigestSha256: '',
    } as unknown as Record<string, unknown>, 'coverageDigestSha256'),
  })
}

export function createCanonicalCaptionApprovedExecutionCoverageRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalCaptionApprovedExecutionCoverageRepository {
  assertObjectPort(input.objectPort)
  const prefix = prefixSchema.parse(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_APPROVED_EXECUTION_COVERAGE_REPOSITORY_VERSION,
    async persistCreateOnly(untrusted: unknown) {
      assertClosedContractTree(untrusted,
        'Canonical Caption approved execution coverage write')
      const coverage = parseCanonicalCaptionApprovedExecutionCoverage(
        z.object({ coverage: z.unknown() }).strict().parse(untrusted).coverage)
      const body = serializeCoverage(coverage)
      const path = coveragePath(prefix, coverage.executionPackageRef)
      const result = await input.objectPort.createOnly({
        objectPath: path,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const reread = await rereadCoverage(input.objectPort, path,
        coverage.executionPackageRef)
      if (!reread || stableAuthorityStringify(reread) !==
        stableAuthorityStringify(coverage)) {
        throw new Error(
          'Canonical Caption execution coverage create-only reread failed.')
      }
      return result === 'created' ? 'created' : 'identical_replay'
    },
    async rereadExact(untrusted: unknown) {
      assertClosedContractTree(untrusted,
        'Canonical Caption approved execution coverage read')
      const ref = z.object({ executionPackageRef: refSchema }).strict()
        .parse(untrusted).executionPackageRef
      return rereadCoverage(input.objectPort, coveragePath(prefix, ref), ref)
    },
  })
}

function assertAdapterCompletion(input: {
  snapshotId: string
  workItemId: string
  jobId: string
  initial: CanonicalPrivateJobExecutionAdapterResponse
  replay: CanonicalPrivateJobExecutionAdapterResponse
  completion: CanonicalPrivateJobExecutionAdapterResponse
}): void {
  const initial = parseAdapterResponse(input.initial)
  const replay = parseAdapterResponse(input.replay)
  const completion = parseAdapterResponse(input.completion)
  if (completion.identity.approvedPlanSnapshotId !== input.snapshotId
    || completion.identity.approvedWorkItemId !== input.workItemId
    || completion.identity.jobId !== input.jobId
    || initial.identity.jobId !== input.jobId
    || replay.identity.jobId !== input.jobId
    || !replay.evidence.idempotentAdapterReplay
    || !completion.evidence.privateArtifactPersisted
    || !completion.evidence.actualQaPassed
    || !completion.evidence.reconciliationPassed
    || stableAuthorityStringify(initial.result) !==
      stableAuthorityStringify(completion.result)
    || stableAuthorityStringify(replay.result) !==
      stableAuthorityStringify(completion.result)
    || Object.values(initial.permissions).some(Boolean)
    || Object.values(replay.permissions).some(Boolean)
    || Object.values(completion.permissions).some(Boolean)) {
    throw new Error(
      'Canonical Caption approved adapter completion is inconsistent.')
  }
}

function parseAdapterResponse(
  value: CanonicalPrivateJobExecutionAdapterResponse,
): CanonicalPrivateJobExecutionAdapterResponse {
  const parsed = canonicalPrivateJobExecutionAdapterResponseSchema.parse(value)
  const { responseHash, ...withoutHash } = parsed
  if (responseHash !== sha256AuthorityValue(withoutHash)) {
    throw new Error('Canonical Caption adapter response digest failed.')
  }
  return parsed
}

function restrictedScope(value: string): 'video' | 'scene' | 'boundary' {
  if (value !== 'video' && value !== 'scene' && value !== 'boundary') {
    throw new Error('Canonical Caption execution scope is unsupported.')
  }
  return value
}

function validOccurrenceScope(
  value: CanonicalCaptionApprovedExecutionCoverageOccurrence,
): boolean {
  return value.scopeLevel === 'video'
    ? value.sceneId === null && value.boundaryId === null
    : value.scopeLevel === 'scene'
      ? value.sceneId !== null && value.boundaryId === null
      : value.sceneId === null && value.boundaryId !== null
}

function compareOccurrences(
  left: CanonicalCaptionApprovedExecutionCoverageOccurrence,
  right: CanonicalCaptionApprovedExecutionCoverageOccurrence,
): number {
  return left.canonicalCatalogOrder - right.canonicalCatalogOrder
    || left.occurrenceId.localeCompare(right.occurrenceId)
}

function occurrencesAreCanonical(
  values: readonly CanonicalCaptionApprovedExecutionCoverageOccurrence[],
): boolean {
  return values.every((value, index) => index === 0
    || compareOccurrences(values[index - 1]!, value) < 0)
}

function authorityRef(
  id: string,
  version: string,
  value: unknown,
): CaptionDomainRef {
  return { id, version, contentHash: sha256AuthorityValue(value) }
}

function refKey(value: CaptionDomainRef): string {
  return `${value.id}|${value.version}|${value.contentHash}`
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error(
      'Canonical Caption execution coverage object port is incomplete.')
  }
}

function coveragePath(prefix: string, ref: CaptionDomainRef): string {
  return `${prefix}/${ref.contentHash}.json`
}

function serializeCoverage(
  value: CanonicalCaptionApprovedExecutionCoverage,
): Buffer {
  const body = Buffer.from(JSON.stringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw new Error('Canonical Caption execution coverage size is invalid.')
  }
  return body
}

async function rereadCoverage(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  expectedExecutionPackageRef: CaptionDomainRef,
): Promise<CanonicalCaptionApprovedExecutionCoverage | null> {
  const body = await port.readExact(path)
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw new Error('Canonical Caption execution coverage bytes are invalid.')
  }
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8')) as unknown
  } catch (error) {
    throw new Error('Canonical Caption execution coverage JSON is invalid.', {
      cause: error,
    })
  }
  const parsed = parseCanonicalCaptionApprovedExecutionCoverage(value)
  if (refKey(parsed.executionPackageRef) !==
    refKey(expectedExecutionPackageRef)) {
    throw new Error(
      'Canonical Caption execution coverage crossed execution packages.')
  }
  return parsed
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
