import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  CANONICAL_CAPTION_APPROVED_EXECUTION_CAMPAIGN_REPOSITORY_VERSION,
  CANONICAL_CAPTION_APPROVED_EXECUTION_CAMPAIGN_VERSION,
  type CanonicalCaptionApprovedExecutionCampaign,
  type CanonicalCaptionApprovedExecutionCampaignRepository,
} from '../../src/types/canonical-caption-approved-execution-campaign'
import type {
  CanonicalCaptionApprovedExecutionCoverageRepository,
} from '../../src/types/canonical-caption-approved-execution-coverage'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import {
  CAPTIONS_SUPPORTED_JOB_TYPES,
  type CaptionsSupportedJobType,
} from '../../src/types/captions-specialist'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { CAPTIONS_SPECIALIST_MANIFEST } from
  '../captions-specialist/captions-specialist-manifest'
import type { CanonicalCreateOnlyJsonObjectPort } from
  './canonical-gcs-source-analysis-lifecycle-store'
import {
  parseCanonicalCaptionApprovedExecutionCoverage,
} from './canonical-caption-approved-execution-coverage-service'
import {
  calculateSkillContractDigest,
} from '../orchestra/orchestra-skill-contracts'
import { stableAuthorityStringify } from './private-edit-authority-store'

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
const scopeSchema = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  planVersionId: safeKey,
  approvedSnapshotRef: refSchema,
}).strict()
const runSchema = z.object({
  ordinal: z.number().int().min(1).max(32),
  observedAt: timestamp,
  coverageRef: refSchema,
  canonicalScope: scopeSchema,
  executionPackageRef: refSchema,
  workGraphRef: refSchema,
  captionPlanningProjectionRef: refSchema,
  outputIds: z.array(safeKey).min(1).max(32),
  coveredCaptionJobTypes: z.array(
    z.enum(CAPTIONS_SUPPORTED_JOB_TYPES)).min(1).max(41),
  occurrenceCount: z.number().int().positive().max(256),
  exactCoverageRecordReread: z.literal(true),
  exactApprovedSnapshotAndExecutionPackageLineageVerified: z.literal(true),
  preterminalApprovedExecutionEvidenceOnly: z.literal(true),
  terminalQualificationClaimed: z.literal(false),
}).strict()
const campaignSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_APPROVED_EXECUTION_CAMPAIGN_VERSION),
  campaignId: safeKey,
  campaignDigestSha256: sha256,
  observedAt: timestamp,
  canonicalOwnerScope: z.object({
    ownerUserId: safeKey,
    workspaceId: safeKey,
    projectId: safeKey,
  }).strict(),
  captionCapabilityManifestRef: refSchema,
  runs: z.array(runSchema).min(2).max(32),
  declaredCaptionJobTypes: z.array(
    z.enum(CAPTIONS_SUPPORTED_JOB_TYPES)).length(41),
  coveredCaptionJobTypes: z.array(
    z.enum(CAPTIONS_SUPPORTED_JOB_TYPES)).min(1).max(41),
  missingCaptionJobTypes: z.array(
    z.enum(CAPTIONS_SUPPORTED_JOB_TYPES)).max(40),
  counts: z.object({
    approvedRuns: z.number().int().min(2).max(32),
    distinctEditSessions: z.number().int().min(1).max(32),
    distinctApprovedSnapshots: z.number().int().min(2).max(32),
    distinctExecutionPackages: z.number().int().min(2).max(32),
    executedCaptionJobOccurrences: z.number().int().positive().max(8_192),
    uniqueCoveredCaptionJobTypes: z.number().int().positive().max(41),
    missingCaptionJobTypes: z.number().int().nonnegative().max(40),
  }).strict(),
  disposition: z.enum([
    'partial_multi_snapshot_execution_coverage',
    'complete_multi_snapshot_execution_coverage_terminal_evidence_still_required',
  ]),
  completeCatalogExecutionCoverage: z.boolean(),
  requiresAdditionalApprovedRuns: z.boolean(),
  multipleApprovedSnapshotsRequired: z.literal(true),
  distinctApprovedSnapshotsAndExecutionPackagesVerified: z.literal(true),
  oneAllFeatureEditFabricated: z.literal(false),
  allCoverageRecordsPersistedCreateOnlyAndReread: z.literal(true),
  allRunCoveragePreterminalOnly: z.literal(true),
  structuralOwnerFixtureRelabeledAsPrivateQualification: z.literal(false),
  acceptedByTerminalQualificationRunRepository: z.literal(false),
  actualArtifactBytesIndependentlyRereadForThisCampaign: z.literal(false),
  actualRequiredOwnerEvidenceRereadForThisCampaign: z.literal(false),
  qualifiedCompleteTimeVisualReviewRereadForThisCampaign: z.literal(false),
  independentFinalQaRereadForThisCampaign: z.literal(false),
  privateReviewAcceptanceRereadForThisCampaign: z.literal(false),
  terminalQualificationClaimed: z.literal(false),
  callerSuppliedCoverageAccepted: z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
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
  'private-internal/captions-specialist/v1/approved-execution-campaign'
const prefixSchema = z.string().trim().min(1).max(1_024)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) =>
    !value.includes('..') && !value.includes('//') && !value.endsWith('/'))
const MAX_RECORD_BYTES = 16 * 1024 * 1024

export function parseCanonicalCaptionApprovedExecutionCampaign(
  value: unknown,
): CanonicalCaptionApprovedExecutionCampaign {
  assertClosedContractTree(value,
    'Canonical Caption approved execution campaign')
  rejectUnsafeText(value, 'Canonical Caption approved execution campaign')
  const parsed = campaignSchema.parse(value) as
    CanonicalCaptionApprovedExecutionCampaign
  const declared = CAPTIONS_SUPPORTED_JOB_TYPES as readonly
    CaptionsSupportedJobType[]
  const coveredSet = new Set(parsed.runs.flatMap((run) =>
    run.coveredCaptionJobTypes))
  const expectedCovered = declared.filter((jobType) => coveredSet.has(jobType))
  const expectedMissing = declared.filter((jobType) => !coveredSet.has(jobType))
  const editSessions = new Set(parsed.runs.map((run) =>
    run.canonicalScope.editSessionId))
  const snapshots = new Set(parsed.runs.map((run) =>
    refKey(run.canonicalScope.approvedSnapshotRef)))
  const packages = new Set(parsed.runs.map((run) =>
    refKey(run.executionPackageRef)))
  const coverageRefs = parsed.runs.map((run) => refKey(run.coverageRef))
  const occurrenceCount = parsed.runs.reduce((sum, run) =>
    sum + run.occurrenceCount, 0)
  const expectedObservedAt = [...parsed.runs].sort((left, right) =>
    left.observedAt.localeCompare(right.observedAt)).at(-1)?.observedAt
  const complete = expectedMissing.length === 0
  const identity = campaignIdentity(parsed.runs.map((run) => run.coverageRef))
  if (parsed.campaignDigestSha256 !== calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>, 'campaignDigestSha256')
    || parsed.campaignId !== `caption.approved-execution-campaign.${
      identity.slice(0, 40)}`
    || parsed.declaredCaptionJobTypes.join('|') !== declared.join('|')
    || parsed.coveredCaptionJobTypes.join('|') !== expectedCovered.join('|')
    || parsed.missingCaptionJobTypes.join('|') !== expectedMissing.join('|')
    || parsed.observedAt !== expectedObservedAt
    || parsed.runs.some((run, index) =>
      run.ordinal !== index + 1
      || index > 0 && compareRuns(parsed.runs[index - 1]!, run) >= 0
      || new Set(run.outputIds).size !== run.outputIds.length
      || run.outputIds.some((outputId, outputIndex) =>
        outputIndex > 0 && run.outputIds[outputIndex - 1]!
          .localeCompare(outputId) >= 0)
      || run.coveredCaptionJobTypes.some((jobType, jobIndex) =>
        declared.indexOf(jobType) <= (jobIndex === 0 ? -1 :
          declared.indexOf(run.coveredCaptionJobTypes[jobIndex - 1]!)))
      || run.canonicalScope.ownerUserId !==
        parsed.canonicalOwnerScope.ownerUserId
      || run.canonicalScope.workspaceId !==
        parsed.canonicalOwnerScope.workspaceId
      || run.canonicalScope.projectId !==
        parsed.canonicalOwnerScope.projectId)
    || new Set(coverageRefs).size !== parsed.runs.length
    || snapshots.size !== parsed.runs.length
    || packages.size !== parsed.runs.length
    || parsed.counts.approvedRuns !== parsed.runs.length
    || parsed.counts.distinctEditSessions !== editSessions.size
    || parsed.counts.distinctApprovedSnapshots !== snapshots.size
    || parsed.counts.distinctExecutionPackages !== packages.size
    || parsed.counts.executedCaptionJobOccurrences !== occurrenceCount
    || parsed.counts.uniqueCoveredCaptionJobTypes !== expectedCovered.length
    || parsed.counts.missingCaptionJobTypes !== expectedMissing.length
    || parsed.completeCatalogExecutionCoverage !== complete
    || parsed.requiresAdditionalApprovedRuns === complete
    || parsed.disposition !== (complete
      ? 'complete_multi_snapshot_execution_coverage_terminal_evidence_still_required'
      : 'partial_multi_snapshot_execution_coverage')
    || parsed.captionCapabilityManifestRef.id !==
      CAPTIONS_SPECIALIST_MANIFEST.manifestId
    || parsed.captionCapabilityManifestRef.version !==
      CAPTIONS_SPECIALIST_MANIFEST.manifestSchemaVersion
    || parsed.captionCapabilityManifestRef.contentHash !==
      CAPTIONS_SPECIALIST_MANIFEST.manifestHash) {
    throw new Error(
      'Canonical Caption approved execution campaign is inconsistent.')
  }
  return structuredClone(parsed)
}

export async function assembleCanonicalCaptionApprovedExecutionCampaign(input: {
  readonly executionPackageRefs: readonly CaptionDomainRef[]
  readonly coverageRepository: Pick<
    CanonicalCaptionApprovedExecutionCoverageRepository,
    'rereadExact'
  >
}): Promise<CanonicalCaptionApprovedExecutionCampaign> {
  const executionPackageRefs = z.array(refSchema).min(2).max(32)
    .parse(input.executionPackageRefs)
    .sort(compareRefs)
  if (new Set(executionPackageRefs.map(refKey)).size !==
      executionPackageRefs.length
    || typeof input.coverageRepository?.rereadExact !== 'function') {
    throw new Error('Caption campaign execution-package refs are invalid.')
  }
  const coverages = []
  for (const executionPackageRef of executionPackageRefs) {
    const value = await input.coverageRepository.rereadExact({
      executionPackageRef,
    })
    if (!value) {
      throw new Error('Caption campaign coverage record is unavailable.')
    }
    const coverage = parseCanonicalCaptionApprovedExecutionCoverage(value)
    if (refKey(coverage.executionPackageRef) !==
      refKey(executionPackageRef)) {
      throw new Error('Caption campaign execution package crossed authority.')
    }
    coverages.push(coverage)
  }
  const first = coverages[0]!
  if (coverages.some((coverage) =>
    coverage.canonicalScope.ownerUserId !== first.canonicalScope.ownerUserId
    || coverage.canonicalScope.workspaceId !== first.canonicalScope.workspaceId
    || coverage.canonicalScope.projectId !== first.canonicalScope.projectId
    || refKey(coverage.captionCapabilityManifestRef) !==
      refKey(first.captionCapabilityManifestRef))) {
    throw new Error('Caption campaign crossed canonical owner scope.')
  }
  const runs = coverages.map((coverage) => ({
    coverageRef: coverageRefFor(coverage),
    coverage,
  })).sort((left, right) => compareRefs(
    left.coverageRef, right.coverageRef)).map(({ coverage, coverageRef }, index) => ({
      ordinal: index + 1,
      observedAt: coverage.observedAt,
      coverageRef,
      canonicalScope: structuredClone(coverage.canonicalScope),
      executionPackageRef: structuredClone(coverage.executionPackageRef),
      workGraphRef: structuredClone(coverage.workGraphRef),
      captionPlanningProjectionRef:
        structuredClone(coverage.captionPlanningProjectionRef),
      outputIds: [...coverage.outputIds],
      coveredCaptionJobTypes: [...coverage.coveredCaptionJobTypes],
      occurrenceCount: coverage.jobOccurrences.length,
      exactCoverageRecordReread: true as const,
      exactApprovedSnapshotAndExecutionPackageLineageVerified: true as const,
      preterminalApprovedExecutionEvidenceOnly: true as const,
      terminalQualificationClaimed: false as const,
    }))
  const snapshots = new Set(runs.map((run) =>
    refKey(run.canonicalScope.approvedSnapshotRef)))
  const packages = new Set(runs.map((run) =>
    refKey(run.executionPackageRef)))
  if (snapshots.size !== runs.length || packages.size !== runs.length) {
    throw new Error(
      'Caption campaign requires distinct approved snapshots and packages.')
  }
  const coveredSet = new Set(runs.flatMap((run) =>
    run.coveredCaptionJobTypes))
  const covered = CAPTIONS_SUPPORTED_JOB_TYPES.filter((jobType) =>
    coveredSet.has(jobType))
  const missing = CAPTIONS_SUPPORTED_JOB_TYPES.filter((jobType) =>
    !coveredSet.has(jobType))
  const complete = missing.length === 0
  const observedAt = [...coverages].sort((left, right) =>
    left.observedAt.localeCompare(right.observedAt)).at(-1)!.observedAt
  const identity = campaignIdentity(runs.map((run) => run.coverageRef))
  const withoutDigest = {
    schemaVersion: CANONICAL_CAPTION_APPROVED_EXECUTION_CAMPAIGN_VERSION,
    campaignId: `caption.approved-execution-campaign.${identity.slice(0, 40)}`,
    observedAt,
    canonicalOwnerScope: {
      ownerUserId: first.canonicalScope.ownerUserId,
      workspaceId: first.canonicalScope.workspaceId,
      projectId: first.canonicalScope.projectId,
    },
    captionCapabilityManifestRef:
      structuredClone(first.captionCapabilityManifestRef),
    runs,
    declaredCaptionJobTypes: [...CAPTIONS_SUPPORTED_JOB_TYPES],
    coveredCaptionJobTypes: [...covered],
    missingCaptionJobTypes: [...missing],
    counts: {
      approvedRuns: runs.length,
      distinctEditSessions: new Set(runs.map((run) =>
        run.canonicalScope.editSessionId)).size,
      distinctApprovedSnapshots: snapshots.size,
      distinctExecutionPackages: packages.size,
      executedCaptionJobOccurrences: runs.reduce((sum, run) =>
        sum + run.occurrenceCount, 0),
      uniqueCoveredCaptionJobTypes: covered.length,
      missingCaptionJobTypes: missing.length,
    },
    disposition: complete
      ? 'complete_multi_snapshot_execution_coverage_terminal_evidence_still_required' as const
      : 'partial_multi_snapshot_execution_coverage' as const,
    completeCatalogExecutionCoverage: complete,
    requiresAdditionalApprovedRuns: !complete,
    multipleApprovedSnapshotsRequired: true as const,
    distinctApprovedSnapshotsAndExecutionPackagesVerified: true as const,
    oneAllFeatureEditFabricated: false as const,
    allCoverageRecordsPersistedCreateOnlyAndReread: true as const,
    allRunCoveragePreterminalOnly: true as const,
    structuralOwnerFixtureRelabeledAsPrivateQualification: false as const,
    acceptedByTerminalQualificationRunRepository: false as const,
    actualArtifactBytesIndependentlyRereadForThisCampaign: false as const,
    actualRequiredOwnerEvidenceRereadForThisCampaign: false as const,
    qualifiedCompleteTimeVisualReviewRereadForThisCampaign: false as const,
    independentFinalQaRereadForThisCampaign: false as const,
    privateReviewAcceptanceRereadForThisCampaign: false as const,
    terminalQualificationClaimed: false as const,
    callerSuppliedCoverageAccepted: false as const,
    browserLocalCompletionAccepted: false as const,
    directPeerDispatchPerformedByCaption: false as const,
    operationOrRuntimeAuthorityGrantedToCaption: false as const,
    providerOrModelAuthorityGrantedToCaption: false as const,
    assetMutationAuthorityGrantedToCaption: false as const,
    finalQaApprovalAuthorityGrantedToCaption: false as const,
    creditOrBillingAuthorityGrantedToCaption: false as const,
    publicDeliveryAuthorityGrantedToCaption: false as const,
    productionAuthorityGrantedToCaption: false as const,
  }
  return parseCanonicalCaptionApprovedExecutionCampaign({
    ...withoutDigest,
    campaignDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      campaignDigestSha256: '',
    } as unknown as Record<string, unknown>, 'campaignDigestSha256'),
  })
}

export function createCanonicalCaptionApprovedExecutionCampaignRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalCaptionApprovedExecutionCampaignRepository {
  assertObjectPort(input.objectPort)
  const prefix = prefixSchema.parse(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_APPROVED_EXECUTION_CAMPAIGN_REPOSITORY_VERSION,
    async persistCreateOnly(untrusted: unknown) {
      assertClosedContractTree(untrusted,
        'Canonical Caption approved execution campaign write')
      const campaign = parseCanonicalCaptionApprovedExecutionCampaign(
        z.object({ campaign: z.unknown() }).strict().parse(untrusted).campaign)
      const body = serializeCampaign(campaign)
      const result = await input.objectPort.createOnly({
        objectPath: campaignPath(prefix, campaignRefFor(campaign)),
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const reread = await rereadCampaign(input.objectPort, prefix,
        campaignRefFor(campaign))
      if (!reread || stableAuthorityStringify(reread) !==
        stableAuthorityStringify(campaign)) {
        throw new Error('Caption campaign create-only reread failed.')
      }
      return result === 'created' ? 'created' : 'identical_replay'
    },
    async rereadExact(untrusted: unknown) {
      assertClosedContractTree(untrusted,
        'Canonical Caption approved execution campaign read')
      const campaignRef = z.object({ campaignRef: refSchema }).strict()
        .parse(untrusted).campaignRef
      return rereadCampaign(input.objectPort, prefix, campaignRef)
    },
  })
}

function coverageRefFor(
  coverage: ReturnType<typeof parseCanonicalCaptionApprovedExecutionCoverage>,
): CaptionDomainRef {
  return {
    id: coverage.coverageId,
    version: coverage.schemaVersion,
    contentHash: coverage.coverageDigestSha256,
  }
}

function campaignIdentity(refs: readonly CaptionDomainRef[]): string {
  return calculateSkillContractDigest({
    coverageRefs: [...refs].sort(compareRefs),
  }, 'unusedDigestField')
}

function campaignRefFor(
  campaign: CanonicalCaptionApprovedExecutionCampaign,
): CaptionDomainRef {
  return {
    id: campaign.campaignId,
    version: campaign.schemaVersion,
    contentHash: campaign.campaignDigestSha256,
  }
}

function compareRefs(left: CaptionDomainRef, right: CaptionDomainRef): number {
  return refKey(left).localeCompare(refKey(right))
}

function compareRuns(
  left: CanonicalCaptionApprovedExecutionCampaign['runs'][number],
  right: CanonicalCaptionApprovedExecutionCampaign['runs'][number],
): number {
  return compareRefs(left.coverageRef, right.coverageRef)
}

function refKey(value: CaptionDomainRef): string {
  return `${value.id}|${value.version}|${value.contentHash}`
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error('Canonical Caption campaign object port is incomplete.')
  }
}

function campaignPath(prefix: string, ref: CaptionDomainRef): string {
  return `${prefix}/${ref.contentHash}.json`
}

function serializeCampaign(
  campaign: CanonicalCaptionApprovedExecutionCampaign,
): Buffer {
  const body = Buffer.from(JSON.stringify(campaign), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw new Error('Canonical Caption campaign size is invalid.')
  }
  return body
}

async function rereadCampaign(
  port: CanonicalCreateOnlyJsonObjectPort,
  prefix: string,
  expectedRef: CaptionDomainRef,
): Promise<CanonicalCaptionApprovedExecutionCampaign | null> {
  const body = await port.readExact(campaignPath(prefix, expectedRef))
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw new Error('Canonical Caption campaign bytes are invalid.')
  }
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8')) as unknown
  } catch (error) {
    throw new Error('Canonical Caption campaign JSON is invalid.', {
      cause: error,
    })
  }
  const campaign = parseCanonicalCaptionApprovedExecutionCampaign(value)
  if (refKey(campaignRefFor(campaign)) !== refKey(expectedRef)) {
    throw new Error('Canonical Caption campaign crossed its exact ref.')
  }
  return campaign
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
