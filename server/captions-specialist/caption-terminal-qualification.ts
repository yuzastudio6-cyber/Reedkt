import { z } from 'zod'

import {
  CAPTION_TERMINAL_QUALIFICATION_INPUT_VERSION,
  CAPTION_TERMINAL_QUALIFICATION_PREFLIGHT_VERSION,
  CAPTION_TERMINAL_QUALIFICATION_PROJECTION_VERSION,
  type CaptionTerminalJobQualificationProjectionItem,
  type CaptionTerminalOutputQualificationProjectionItem,
  type CaptionTerminalQualificationEvidenceInput,
  type CaptionTerminalQualificationPreflight,
  type CaptionTerminalQualificationProjection,
} from '../../src/types/caption-terminal-qualification'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import {
  CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_BINDING_VERSION,
} from '../../src/types/caption-canonical-transcript-authenticated-read'
import {
  CAPTION_BROLL_OWNER_READ_BINDING_VERSION,
} from '../../src/types/caption-multi-track-scene-graph'
import {
  CAPTION_SOUND_SUPPORT_RESULT_VERSION,
} from '../../src/types/caption-sound-support'
import {
  CANONICAL_CAPTION_TRACK_ALL_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
} from '../../src/types/canonical-caption-track-all-support'
import {
  CANONICAL_CAPTION_VISUAL_INTELLIGENCE_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
} from '../../src/types/canonical-caption-visual-intelligence-support'
import {
  CAPTION_GOAL_COMPLETION_GAP_IDS,
} from '../../src/types/caption-goal-completion-audit'
import type {
  CanonicalCaptionPrivateReviewEvidenceProjection,
} from '../../src/types/canonical-caption-private-review-evidence-projection'
import {
  CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_EVIDENCE_VERSION,
} from '../../src/types/canonical-caption-postrender-visual-qa-evidence'
import type { CaptionSharedOwnerKey } from
  '../../src/types/caption-shared-owner-integration'
import {
  CAPTIONS_SUPPORTED_JOB_TYPES,
  type CaptionsSupportedJobType,
} from '../../src/types/captions-specialist'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  CAPTION_CURRENT_INTEGRATION_READINESS,
} from './caption-current-integration-readiness'
import {
  CAPTION_POST_CAP20_GOAL_COMPLETION_AUDIT,
} from './caption-goal-completion-audit'
import {
  CAPTION_CAP20_SHARED_OWNER_INTEGRATION_HANDOFF,
} from './caption-shared-owner-integration'
import {
  CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST,
} from './captions-specialist-integration-manifest'
import {
  CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT,
} from './captions-specialist-integration-qualification'
import {
  parseCanonicalCaptionPrivateReviewEvidenceProjection,
} from '../services/canonical-caption-private-review-evidence-service'

const safeKey = z.string().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const emptySafeKeyList = z.array(safeKey).length(0)
const refList = (minimum: number, maximum: number) =>
  z.array(refSchema).min(minimum).max(maximum)

const scopeSchema = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  planVersionId: safeKey,
  approvedSnapshotRef: refSchema,
}).strict()

const jobEvidenceSchema = z.object({
  jobType: z.enum(CAPTIONS_SUPPORTED_JOB_TYPES),
  outputIds: z.array(safeKey).min(1).max(8),
  persistedCaptionJobResultRef: refSchema,
  executionBundleRef: refSchema,
  workItemRef: refSchema,
  plannedAssetManifestEntryRefs: refList(1, 32),
  estimateCostBindingRefs: refList(1, 16),
  producedArtifactRefs: refList(1, 64),
  sharedOwnerEvidenceRefs: refList(0, 5),
  deterministicQaEvidenceRefs: refList(1, 16),
  renderedVisualReviewEvidenceRefs: refList(1, 16),
  independentFinalQaEvidenceRefs: refList(1, 16),
  exactApprovedSnapshotReread: z.literal(true),
  exactJobResultReread: z.literal(true),
  allRequiredOwnerEvidenceReread: z.literal(true),
  allRequiredArtifactsPersistedAndReread: z.literal(true),
  deterministicQaPassed: z.literal(true),
  qualifiedVisualReviewPassedWhereRequired: z.literal(true),
  independentFinalQaPassed: z.literal(true),
  blockerCodes: emptySafeKeyList,
}).strict()

const outputEvidenceSchema = z.object({
  outputId: safeKey,
  confirmedOutputFrameRef: refSchema,
  renderedArtifactRef: refSchema,
  deterministicQaRef: refSchema,
  qualifiedCompleteTimeVisualReviewRef: refSchema,
  independentFinalQaRef: refSchema,
  privateReviewDecisionRef: refSchema,
  repairGeneration: z.number().int().nonnegative().max(100),
  exactConfirmedFrameReread: z.literal(true),
  exactRenderedArtifactReread: z.literal(true),
  completeTimeVisualReviewPassed: z.literal(true),
  independentFinalQaPassed: z.literal(true),
  privateReviewAccepted: z.literal(true),
  unresolvedBlockerCodes: emptySafeKeyList,
}).strict()

const inputSchema = z.object({
  schemaVersion: z.literal(CAPTION_TERMINAL_QUALIFICATION_INPUT_VERSION),
  inputId: safeKey,
  inputDigestSha256: sha256,
  observedAt: z.string().datetime({ offset: true }),
  canonicalScope: scopeSchema,
  sourceCurrentReadinessRef: refSchema,
  sourcePrivateReleaseRef: refSchema,
  integrationManifestRef: refSchema,
  integrationQualificationRef: refSchema,
  canonicalExecution: z.object({
    executionPackageRef: refSchema,
    workGraphRef: refSchema,
    assetManifestRef: refSchema,
    masterTimingRef: refSchema,
    storyTimingRef: refSchema,
    estimateApprovalRef: refSchema,
    creditReservationRef: refSchema,
    costBindingRef: refSchema,
    exactApprovedSnapshotReread: z.literal(true),
    exactExecutionPackageReread: z.literal(true),
    allCaptionWorkItemsCompleted: z.literal(true),
    allCaptionArtifactsPersistedAndReread: z.literal(true),
    allCaptionJobResultsPersistedAndReread: z.literal(true),
    unresolvedRequiredWorkItemCount: z.literal(0),
    unresolvedRequiredAssetCount: z.literal(0),
  }).strict(),
  canonicalSharedOwnerEvidence: z.object({
    canonicalTranscriptReadRef: refSchema,
    visualIntelligenceEvidenceRef: refSchema,
    trackAllEvidenceRef: refSchema,
    soundSyncEvidenceRef: refSchema,
    brollOwnerEvidenceRef: refSchema,
    actualCanonicalRecordsReread: z.literal(true),
    sourceFixtureUsedAsRuntimeEvidence: z.literal(false),
    referenceOnlyEvidenceAccepted: z.literal(false),
  }).strict(),
  jobEvidence: z.array(jobEvidenceSchema)
    .length(CAPTIONS_SUPPORTED_JOB_TYPES.length),
  outputEvidence: z.array(outputEvidenceSchema).min(1).max(8),
  evidenceSourceClass: z.literal('canonical_private_persisted_evidence'),
  privateInternalQualificationRun: z.literal(true),
  allDeclaredCaptionJobsCovered: z.literal(true),
  everyConfirmedOutputCoveredExactlyOnce: z.literal(true),
  browserLocalCompletionAccepted: z.literal(false),
  rawChatMediaBytesPathsUrlsOrCredentialsIncluded: z.literal(false),
  directPeerDispatchPerformedByCaption: z.literal(false),
  runtimeExecutionAuthorityGrantedToCaption: z.literal(false),
  assetMutationAuthorityGrantedToCaption: z.literal(false),
  finalQaApprovalAuthorityGrantedToCaption: z.literal(false),
  creditOrBillingAuthorityGrantedToCaption: z.literal(false),
  publicDeliveryAuthorityGrantedToCaption: z.literal(false),
  productionAuthorityGrantedToCaption: z.literal(false),
}).strict()

const projectionJobSchema = z.object({
  jobType: z.enum(CAPTIONS_SUPPORTED_JOB_TYPES),
  outputIds: z.array(safeKey).min(1).max(8),
  qualificationStatus: z.literal('qualified_private_internal'),
  sourceJobResultRef: refSchema,
  evidenceRefs: refList(1, 256),
  blockerCodes: emptySafeKeyList,
  captionOwnedImplementationComplete: z.literal(true),
  requiredCanonicalEvidenceComplete: z.literal(true),
  runtimeOwnershipTransferredToCaption: z.literal(false),
  duplicateSharedOwnerCreated: z.literal(false),
}).strict()

const projectionOutputSchema = z.object({
  outputId: safeKey,
  confirmedOutputFrameRef: refSchema,
  renderedArtifactRef: refSchema,
  deterministicQaRef: refSchema,
  qualifiedCompleteTimeVisualReviewRef: refSchema,
  independentFinalQaRef: refSchema,
  privateReviewDecisionRef: refSchema,
  repairGeneration: z.number().int().nonnegative().max(100),
  qualificationStatus: z.literal('qualified_private_internal'),
  unresolvedBlockerCodes: emptySafeKeyList,
}).strict()

const projectionSchema = z.object({
  schemaVersion: z.literal(CAPTION_TERMINAL_QUALIFICATION_PROJECTION_VERSION),
  projectionId: safeKey,
  projectionDigestSha256: sha256,
  observedAt: z.string().datetime({ offset: true }),
  canonicalScope: scopeSchema,
  sourceInputRef: refSchema,
  sourceCurrentReadinessRef: refSchema,
  sourcePrivateReleaseRef: refSchema,
  jobs: z.array(projectionJobSchema)
    .length(CAPTIONS_SUPPORTED_JOB_TYPES.length),
  outputs: z.array(projectionOutputSchema).min(1).max(8),
  counts: z.object({
    declaredCaptionJobs: z.literal(41),
    qualifiedPrivateInternalJobs: z.literal(41),
    blockedJobs: z.literal(0),
    confirmedOutputs: z.number().int().min(1).max(8),
    qualifiedOutputs: z.number().int().min(1).max(8),
  }).strict(),
  allCaptionJobsQualified: z.literal(true),
  allConfirmedOutputsQualified: z.literal(true),
  canonicalBackendPrivateExecutionMounted: z.literal(true),
  authenticatedPrivateSharedOwnerEvidenceIntegrated: z.literal(true),
  qualifiedAiCompleteTimeVisualReviewIntegrated: z.literal(true),
  independentFinalQaRereadIntegrated: z.literal(true),
  actualCanonicalEvidenceConsumed: z.literal(true),
  currentStatus: z.literal('caption_specialist_private_internal_qualified'),
  terminalStatusClaimed: z.literal(true),
  privateInternalOnly: z.literal(true),
  publicProductionRequiredForTerminalStatus: z.literal(false),
  centralOrchestraRequiredForTerminalStatus: z.literal(false),
  centralOrchestraImplemented: z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
  sourceFixtureRelabeledAsActualOwnerRuntime: z.literal(false),
  directPeerDispatchPerformedByCaption: z.literal(false),
  operationDispatchAuthority: z.literal(false),
  providerOrModelRuntimeAuthority: z.literal(false),
  assetMutationAuthority: z.literal(false),
  finalQaApprovalAuthority: z.literal(false),
  creditOrBillingAuthority: z.literal(false),
  publicDeliveryAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

const preflightSchema = z.object({
  schemaVersion: z.literal(CAPTION_TERMINAL_QUALIFICATION_PREFLIGHT_VERSION),
  preflightId: safeKey,
  preflightDigestSha256: sha256,
  sourceCurrentReadinessRef: refSchema,
  sourceQualificationInputRef: refSchema.nullable(),
  disposition: z.enum([
    'blocked_missing_canonical_evidence', 'ready_for_terminal_projection',
  ]),
  blockingGapIds: z.array(z.enum(CAPTION_GOAL_COMPLETION_GAP_IDS)).max(9),
  canonicalEvidenceAccepted: z.boolean(),
  terminalProjectionContractImplemented: z.literal(true),
  terminalProjectionCreated: z.literal(false),
  terminalStatusClaimed: z.literal(false),
  duplicateOwnerCreated: z.literal(false),
  operationDispatchAuthority: z.literal(false),
  providerOrModelRuntimeAuthority: z.literal(false),
  assetMutationAuthority: z.literal(false),
  finalQaApprovalAuthority: z.literal(false),
  creditOrBillingAuthority: z.literal(false),
  publicDeliveryAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

function ref(
  id: string,
  version: string,
  contentHash: string,
): CaptionDomainRef {
  return { id, version, contentHash }
}

function refKey(value: CaptionDomainRef): string {
  return `${value.id}|${value.version}|${value.contentHash}`
}

function sameRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return refKey(left) === refKey(right)
}

function uniqueRefs(values: CaptionDomainRef[]): boolean {
  return new Set(values.map(refKey)).size === values.length
}

function uniqueStrings(values: string[]): boolean {
  return new Set(values).size === values.length
}

function verifyDigest(
  value: Record<string, unknown>,
  digestField: string,
  label: string,
): void {
  if (value[digestField] !== calculateSkillContractDigest(value, digestField)) {
    throw new Error(`${label} digest verification failed.`)
  }
}

const currentReadinessRef = ref(
  CAPTION_CURRENT_INTEGRATION_READINESS.readinessId,
  CAPTION_CURRENT_INTEGRATION_READINESS.schemaVersion,
  CAPTION_CURRENT_INTEGRATION_READINESS.readinessDigestSha256)
const privateReleaseRef = structuredClone(
  CAPTION_POST_CAP20_GOAL_COMPLETION_AUDIT.sourceCap20ReleaseRef)
const integrationManifestRef = ref(
  CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestId,
  CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestSchemaVersion,
  CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestHash)
const integrationQualificationRef = ref(
  CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT.snapshotId,
  CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT.schemaVersion,
  CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT
    .snapshotDigestSha256)
const expectedSharedOwnerVersions: Record<CaptionSharedOwnerKey, string> = {
  canonical_transcript:
    CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_BINDING_VERSION,
  visual_intelligence:
    CANONICAL_CAPTION_VISUAL_INTELLIGENCE_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
  track_all:
    CANONICAL_CAPTION_TRACK_ALL_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
  soundsync: CAPTION_SOUND_SUPPORT_RESULT_VERSION,
  broll_owner: CAPTION_BROLL_OWNER_READ_BINDING_VERSION,
}

function ownerRefs(input: CaptionTerminalQualificationEvidenceInput):
Record<CaptionSharedOwnerKey, CaptionDomainRef> {
  return {
    canonical_transcript:
      input.canonicalSharedOwnerEvidence.canonicalTranscriptReadRef,
    visual_intelligence:
      input.canonicalSharedOwnerEvidence.visualIntelligenceEvidenceRef,
    track_all: input.canonicalSharedOwnerEvidence.trackAllEvidenceRef,
    soundsync: input.canonicalSharedOwnerEvidence.soundSyncEvidenceRef,
    broll_owner: input.canonicalSharedOwnerEvidence.brollOwnerEvidenceRef,
  }
}

function expectedOwnerEvidenceForJob(
  input: CaptionTerminalQualificationEvidenceInput,
  jobType: CaptionsSupportedJobType,
): CaptionDomainRef[] {
  const binding = CAPTION_CAP20_SHARED_OWNER_INTEGRATION_HANDOFF
    .conditionalJobBindings.find((item) => item.jobType === jobType)
  if (!binding) return []
  const refs = ownerRefs(input)
  return binding.requiredOwnerKeys.map((ownerKey) => refs[ownerKey])
}

function validateInputSemantics(
  input: CaptionTerminalQualificationEvidenceInput,
): void {
  const outputIds = input.outputEvidence.map((item) => item.outputId)
  const outputIdSet = new Set(outputIds)
  const executionRefs = [
    input.canonicalExecution.executionPackageRef,
    input.canonicalExecution.workGraphRef,
    input.canonicalExecution.assetManifestRef,
    input.canonicalExecution.masterTimingRef,
    input.canonicalExecution.storyTimingRef,
    input.canonicalExecution.estimateApprovalRef,
    input.canonicalExecution.creditReservationRef,
    input.canonicalExecution.costBindingRef,
  ]
  const sharedRefs = Object.values(ownerRefs(input))
  const sharedEntries = Object.entries(ownerRefs(input)) as Array<
    [CaptionSharedOwnerKey, CaptionDomainRef]>
  const globalOutputRefs = input.outputEvidence.flatMap((item) => [
    item.confirmedOutputFrameRef,
    item.renderedArtifactRef,
    item.deterministicQaRef,
    item.qualifiedCompleteTimeVisualReviewRef,
    item.independentFinalQaRef,
    item.privateReviewDecisionRef,
  ])
  if (!sameRef(input.sourceCurrentReadinessRef, currentReadinessRef)
    || !sameRef(input.sourcePrivateReleaseRef, privateReleaseRef)
    || !sameRef(input.integrationManifestRef, integrationManifestRef)
    || !sameRef(input.integrationQualificationRef,
      integrationQualificationRef)
    || input.jobEvidence.map((item) => item.jobType).join('|')
      !== CAPTIONS_SUPPORTED_JOB_TYPES.join('|')
    || !uniqueStrings(outputIds)
    || !uniqueRefs(executionRefs)
    || !uniqueRefs(sharedRefs)
    || sharedEntries.some(([ownerKey, ownerRef]) =>
      ownerRef.version !== expectedSharedOwnerVersions[ownerKey])
    || !uniqueRefs(globalOutputRefs)
    || new Set(input.jobEvidence.map((item) =>
      refKey(item.persistedCaptionJobResultRef))).size
      !== CAPTIONS_SUPPORTED_JOB_TYPES.length
    || new Set(input.jobEvidence.map((item) =>
      refKey(item.workItemRef))).size !== CAPTIONS_SUPPORTED_JOB_TYPES.length) {
    throw new Error('Caption terminal qualification lineage is inconsistent.')
  }
  for (const job of input.jobEvidence) {
    const evidenceLists = [
      job.plannedAssetManifestEntryRefs,
      job.estimateCostBindingRefs,
      job.producedArtifactRefs,
      job.sharedOwnerEvidenceRefs,
      job.deterministicQaEvidenceRefs,
      job.renderedVisualReviewEvidenceRefs,
      job.independentFinalQaEvidenceRefs,
    ]
    const allJobRefs = [
      job.persistedCaptionJobResultRef,
      job.executionBundleRef,
      job.workItemRef,
      ...evidenceLists.flat(),
    ]
    const expectedOwnerRefs = expectedOwnerEvidenceForJob(input, job.jobType)
    if (!uniqueStrings(job.outputIds)
      || job.outputIds.some((outputId) => !outputIdSet.has(outputId))
      || job.outputIds.join('|') !== outputIds.filter((outputId) =>
        job.outputIds.includes(outputId)).join('|')
      || evidenceLists.some((refs) => !uniqueRefs(refs))
      || !uniqueRefs(allJobRefs)
      || JSON.stringify(job.sharedOwnerEvidenceRefs)
        !== JSON.stringify(expectedOwnerRefs)) {
      throw new Error(
        `Caption terminal job evidence is invalid for ${job.jobType}.`)
    }
  }
  if (outputIds.some((outputId) => !input.jobEvidence.some((job) =>
    job.outputIds.includes(outputId)))) {
    throw new Error('Caption terminal output has no per-job lineage.')
  }
}

export function parseCaptionTerminalQualificationEvidenceInput(
  value: unknown,
): CaptionTerminalQualificationEvidenceInput {
  assertClosedContractTree(value, 'Caption terminal qualification input')
  const parsed = inputSchema.parse(value) as
    CaptionTerminalQualificationEvidenceInput
  verifyDigest(parsed as unknown as Record<string, unknown>,
    'inputDigestSha256', 'Caption terminal qualification input')
  validateInputSemantics(parsed)
  return structuredClone(parsed)
}

function sourceInputRef(
  input: CaptionTerminalQualificationEvidenceInput,
): CaptionDomainRef {
  return ref(input.inputId, input.schemaVersion, input.inputDigestSha256)
}

function projectionEvidenceRefs(
  job: CaptionTerminalQualificationEvidenceInput['jobEvidence'][number],
): CaptionDomainRef[] {
  return [
    job.executionBundleRef,
    job.workItemRef,
    ...job.plannedAssetManifestEntryRefs,
    ...job.estimateCostBindingRefs,
    ...job.producedArtifactRefs,
    ...job.sharedOwnerEvidenceRefs,
    ...job.deterministicQaEvidenceRefs,
    ...job.renderedVisualReviewEvidenceRefs,
    ...job.independentFinalQaEvidenceRefs,
  ]
}

function expectedProjectionJobs(
  input: CaptionTerminalQualificationEvidenceInput,
): CaptionTerminalJobQualificationProjectionItem[] {
  return input.jobEvidence.map((job) => ({
    jobType: job.jobType,
    outputIds: [...job.outputIds],
    qualificationStatus: 'qualified_private_internal',
    sourceJobResultRef: structuredClone(job.persistedCaptionJobResultRef),
    evidenceRefs: projectionEvidenceRefs(job).map((item) =>
      structuredClone(item)),
    blockerCodes: [],
    captionOwnedImplementationComplete: true,
    requiredCanonicalEvidenceComplete: true,
    runtimeOwnershipTransferredToCaption: false,
    duplicateSharedOwnerCreated: false,
  }))
}

function expectedProjectionOutputs(
  input: CaptionTerminalQualificationEvidenceInput,
): CaptionTerminalOutputQualificationProjectionItem[] {
  return input.outputEvidence.map((output) => ({
    outputId: output.outputId,
    confirmedOutputFrameRef: structuredClone(output.confirmedOutputFrameRef),
    renderedArtifactRef: structuredClone(output.renderedArtifactRef),
    deterministicQaRef: structuredClone(output.deterministicQaRef),
    qualifiedCompleteTimeVisualReviewRef:
      structuredClone(output.qualifiedCompleteTimeVisualReviewRef),
    independentFinalQaRef: structuredClone(output.independentFinalQaRef),
    privateReviewDecisionRef: structuredClone(output.privateReviewDecisionRef),
    repairGeneration: output.repairGeneration,
    qualificationStatus: 'qualified_private_internal',
    unresolvedBlockerCodes: [],
  }))
}

export function parseCaptionTerminalQualificationProjection(
  value: unknown,
  sourceEvidenceInput: unknown,
): CaptionTerminalQualificationProjection {
  const input = parseCaptionTerminalQualificationEvidenceInput(
    sourceEvidenceInput)
  assertClosedContractTree(value, 'Caption terminal qualification projection')
  const parsed = projectionSchema.parse(value) as
    CaptionTerminalQualificationProjection
  verifyDigest(parsed as unknown as Record<string, unknown>,
    'projectionDigestSha256', 'Caption terminal qualification projection')
  if (!sameRef(parsed.sourceInputRef, sourceInputRef(input))
    || !sameRef(parsed.sourceCurrentReadinessRef, currentReadinessRef)
    || !sameRef(parsed.sourcePrivateReleaseRef, privateReleaseRef)
    || JSON.stringify(parsed.canonicalScope)
      !== JSON.stringify(input.canonicalScope)
    || JSON.stringify(parsed.jobs) !== JSON.stringify(
      expectedProjectionJobs(input))
    || JSON.stringify(parsed.outputs) !== JSON.stringify(
      expectedProjectionOutputs(input))
    || parsed.counts.confirmedOutputs !== input.outputEvidence.length
    || parsed.counts.qualifiedOutputs !== input.outputEvidence.length) {
    throw new Error('Caption terminal qualification projection is stale.')
  }
  return structuredClone(parsed)
}

export function createCaptionTerminalQualificationProjection(
  sourceEvidenceInput: unknown,
  privateReviewEvidenceProjections:
    readonly CanonicalCaptionPrivateReviewEvidenceProjection[],
): CaptionTerminalQualificationProjection {
  const input = parseCaptionTerminalQualificationEvidenceInput(
    sourceEvidenceInput)
  assertCaptionTerminalPrivateReviewEvidence(
    input, privateReviewEvidenceProjections)
  const withoutDigest: Omit<CaptionTerminalQualificationProjection,
    'projectionDigestSha256'> = {
    schemaVersion: CAPTION_TERMINAL_QUALIFICATION_PROJECTION_VERSION,
    projectionId:
      `captions.terminal.projection.${input.inputDigestSha256}`,
    observedAt: input.observedAt,
    canonicalScope: structuredClone(input.canonicalScope),
    sourceInputRef: sourceInputRef(input),
    sourceCurrentReadinessRef: currentReadinessRef,
    sourcePrivateReleaseRef: privateReleaseRef,
    jobs: expectedProjectionJobs(input),
    outputs: expectedProjectionOutputs(input),
    counts: {
      declaredCaptionJobs: 41,
      qualifiedPrivateInternalJobs: 41,
      blockedJobs: 0,
      confirmedOutputs: input.outputEvidence.length,
      qualifiedOutputs: input.outputEvidence.length,
    },
    allCaptionJobsQualified: true,
    allConfirmedOutputsQualified: true,
    canonicalBackendPrivateExecutionMounted: true,
    authenticatedPrivateSharedOwnerEvidenceIntegrated: true,
    qualifiedAiCompleteTimeVisualReviewIntegrated: true,
    independentFinalQaRereadIntegrated: true,
    actualCanonicalEvidenceConsumed: true,
    currentStatus: 'caption_specialist_private_internal_qualified',
    terminalStatusClaimed: true,
    privateInternalOnly: true,
    publicProductionRequiredForTerminalStatus: false,
    centralOrchestraRequiredForTerminalStatus: false,
    centralOrchestraImplemented: false,
    browserLocalCompletionAccepted: false,
    sourceFixtureRelabeledAsActualOwnerRuntime: false,
    directPeerDispatchPerformedByCaption: false,
    operationDispatchAuthority: false,
    providerOrModelRuntimeAuthority: false,
    assetMutationAuthority: false,
    finalQaApprovalAuthority: false,
    creditOrBillingAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  }
  const candidate: CaptionTerminalQualificationProjection = {
    ...withoutDigest,
    projectionDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      projectionDigestSha256: '',
    } as unknown as Record<string, unknown>, 'projectionDigestSha256'),
  }
  return parseCaptionTerminalQualificationProjection(candidate, input)
}

export function parseCaptionTerminalQualificationPreflight(
  value: unknown,
): CaptionTerminalQualificationPreflight {
  assertClosedContractTree(value, 'Caption terminal qualification preflight')
  const parsed = preflightSchema.parse(value) as
    CaptionTerminalQualificationPreflight
  verifyDigest(parsed as unknown as Record<string, unknown>,
    'preflightDigestSha256', 'Caption terminal qualification preflight')
  const blocked = parsed.disposition === 'blocked_missing_canonical_evidence'
  if (!sameRef(parsed.sourceCurrentReadinessRef, currentReadinessRef)
    || (blocked && (parsed.sourceQualificationInputRef !== null
      || parsed.canonicalEvidenceAccepted
      || parsed.blockingGapIds.join('|')
        !== CAPTION_GOAL_COMPLETION_GAP_IDS.join('|')))
    || (!blocked && (parsed.sourceQualificationInputRef === null
      || !parsed.canonicalEvidenceAccepted
      || parsed.blockingGapIds.length !== 0
      || parsed.sourceQualificationInputRef.version
        !== CAPTION_TERMINAL_QUALIFICATION_INPUT_VERSION))) {
    throw new Error('Caption terminal qualification preflight is invalid.')
  }
  return structuredClone(parsed)
}

export function createCaptionTerminalQualificationPreflight(
  sourceEvidenceInput?: unknown,
  privateReviewEvidenceProjections?:
    readonly CanonicalCaptionPrivateReviewEvidenceProjection[],
): CaptionTerminalQualificationPreflight {
  const candidate = sourceEvidenceInput === undefined
    ? null : parseCaptionTerminalQualificationEvidenceInput(sourceEvidenceInput)
  const input = candidate && privateReviewEvidenceProjections
    ? (assertCaptionTerminalPrivateReviewEvidence(
        candidate, privateReviewEvidenceProjections), candidate)
    : null
  const withoutDigest: Omit<CaptionTerminalQualificationPreflight,
    'preflightDigestSha256'> = {
    schemaVersion: CAPTION_TERMINAL_QUALIFICATION_PREFLIGHT_VERSION,
    preflightId: input === null
      ? 'captions.terminal.qualification.current-preflight'
      : `captions.terminal.preflight.${input.inputDigestSha256}`,
    sourceCurrentReadinessRef: currentReadinessRef,
    sourceQualificationInputRef: input === null ? null : sourceInputRef(input),
    disposition: input === null
      ? 'blocked_missing_canonical_evidence'
      : 'ready_for_terminal_projection',
    blockingGapIds: input === null
      ? [...CAPTION_GOAL_COMPLETION_GAP_IDS]
      : [],
    canonicalEvidenceAccepted: input !== null,
    terminalProjectionContractImplemented: true,
    terminalProjectionCreated: false,
    terminalStatusClaimed: false,
    duplicateOwnerCreated: false,
    operationDispatchAuthority: false,
    providerOrModelRuntimeAuthority: false,
    assetMutationAuthority: false,
    finalQaApprovalAuthority: false,
    creditOrBillingAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  }
  return parseCaptionTerminalQualificationPreflight({
    ...withoutDigest,
    preflightDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      preflightDigestSha256: '',
    } as unknown as Record<string, unknown>, 'preflightDigestSha256'),
  })
}

export const CAPTION_CURRENT_TERMINAL_QUALIFICATION_PREFLIGHT =
  createCaptionTerminalQualificationPreflight()

export function assertCaptionTerminalPrivateReviewEvidence(
  input: CaptionTerminalQualificationEvidenceInput,
  projections: readonly CanonicalCaptionPrivateReviewEvidenceProjection[],
): void {
  if (projections.length !== input.outputEvidence.length) {
    throw new Error(
      'Caption terminal qualification requires one exact private-review projection per output.',
    )
  }
  const parsed = projections.map((projection) =>
    parseCanonicalCaptionPrivateReviewEvidenceProjection(projection))
  if (new Set(parsed.map((projection) => projection.output.outputId)).size
    !== parsed.length) {
    throw new Error(
      'Caption terminal private-review projections contain duplicate outputs.',
    )
  }
  for (const [index, output] of input.outputEvidence.entries()) {
    const projection = parsed[index]
    if (!projection
      || projection.output.outputId !== output.outputId
      || projection.canonicalScope.ownerUserId
        !== input.canonicalScope.ownerUserId
      || projection.canonicalScope.workspaceId
        !== input.canonicalScope.workspaceId
      || projection.canonicalScope.projectId !== input.canonicalScope.projectId
      || projection.canonicalScope.editSessionId
        !== input.canonicalScope.editSessionId
      || projection.canonicalScope.approvedSnapshotId
        !== input.canonicalScope.approvedSnapshotRef.id
      || projection.canonicalScope.approvedSnapshotHash
        !== input.canonicalScope.approvedSnapshotRef.contentHash
      || projection.canonicalScope.packageRecordId
        !== input.canonicalExecution.executionPackageRef.id
      || projection.canonicalScope.packageHash
        !== input.canonicalExecution.executionPackageRef.contentHash
      || !sameRef(projection.output.confirmedOutputFrameRef,
        output.confirmedOutputFrameRef)
      || !sameRef(evidenceRefAsDomainRef(
        projection.output.renderedArtifactRef), output.renderedArtifactRef)
      || !sameRef(evidenceRefAsDomainRef(
        projection.output.deterministicQaRef), output.deterministicQaRef)
      || !sameRef({
        id: projection.sourceRefs.postrenderVisualQaEvidenceRef.id,
        version:
          CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_EVIDENCE_VERSION,
        contentHash: unprefix(
          projection.sourceRefs.postrenderVisualQaEvidenceRef.contentHash),
      }, output.qualifiedCompleteTimeVisualReviewRef)
      || projection.canonicalPrivateReview.decisionRef === null
      || !sameRef(projection.canonicalPrivateReview.decisionRef,
        output.privateReviewDecisionRef)
      || projection.disposition !== 'private_review_accepted_visual_pass'
      || !projection.privateReviewAccepted
      || !projection.terminalPrivateInternalQualificationEligible
      || !projection.visualReview.actualCompleteTimeVisualReviewPassed
      || !projection.canonicalPrivateReview.exactAssemblyReread
      || !projection.canonicalPrivateReview.exactDecisionReread) {
      throw new Error(
        `Caption terminal private-review evidence is invalid for ${output.outputId}.`,
      )
    }
  }
}

function evidenceRefAsDomainRef(value: {
  id: string
  version: number
  contentHash: string
}): CaptionDomainRef {
  return {
    id: value.id,
    version: String(value.version),
    contentHash: unprefix(value.contentHash),
  }
}

function unprefix(value: string): string {
  return value.startsWith('sha256:') ? value.slice(7) : value
}
