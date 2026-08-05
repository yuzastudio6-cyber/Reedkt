import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  CAPTION_TERMINAL_QUALIFICATION_INPUT_VERSION,
  type CaptionTerminalQualificationEvidenceInput,
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
import type { CaptionSharedOwnerKey } from
  '../../src/types/caption-shared-owner-integration'
import {
  CANONICAL_CAPTION_TRACK_ALL_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
} from '../../src/types/canonical-caption-track-all-support'
import {
  CANONICAL_CAPTION_VISUAL_INTELLIGENCE_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
} from '../../src/types/canonical-caption-visual-intelligence-support'
import {
  CAPTIONS_SUPPORTED_JOB_TYPES,
} from '../../src/types/captions-specialist'
import {
  calculateSkillContractDigest,
} from '../orchestra/orchestra-skill-contracts'
import {
  CAPTION_CURRENT_INTEGRATION_READINESS,
} from '../captions-specialist/caption-current-integration-readiness'
import {
  CAPTION_POST_CAP20_GOAL_COMPLETION_AUDIT,
} from '../captions-specialist/caption-goal-completion-audit'
import {
  CAPTION_CAP20_SHARED_OWNER_INTEGRATION_HANDOFF,
} from '../captions-specialist/caption-shared-owner-integration'
import {
  CAPTION_CURRENT_TERMINAL_QUALIFICATION_PREFLIGHT,
  createCaptionTerminalQualificationPreflight,
  createCaptionTerminalQualificationProjection,
  parseCaptionTerminalQualificationEvidenceInput,
  parseCaptionTerminalQualificationPreflight,
  parseCaptionTerminalQualificationProjection,
} from '../captions-specialist/caption-terminal-qualification'
import {
  CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST,
} from '../captions-specialist/captions-specialist-integration-manifest'
import {
  CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT,
} from '../captions-specialist/captions-specialist-integration-qualification'

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}
function expectThrow(action: () => unknown): void {
  assert.throws(action)
  assertions += 1
}
function hashText(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
function ref(id: string, version = 'private-evidence-v1'):
CaptionDomainRef {
  return { id, version, contentHash: hashText(`${id}:${version}`) }
}
function refFrom(
  id: string,
  version: string,
  contentHash: string,
): CaptionDomainRef {
  return { id, version, contentHash }
}
function redigestInput(value: unknown): CaptionTerminalQualificationEvidenceInput {
  const record = structuredClone(value) as Record<string, unknown>
  record.inputDigestSha256 = calculateSkillContractDigest(
    record, 'inputDigestSha256')
  return record as unknown as CaptionTerminalQualificationEvidenceInput
}

const ownerEvidence: Record<CaptionSharedOwnerKey, CaptionDomainRef> = {
  canonical_transcript: ref('canonical.transcript.actual-read',
    CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_BINDING_VERSION),
  visual_intelligence: ref('visual-intelligence.actual-evidence',
    CANONICAL_CAPTION_VISUAL_INTELLIGENCE_AUTHENTICATED_EVIDENCE_RECORD_VERSION),
  track_all: ref('track-all.actual-sam31-evidence',
    CANONICAL_CAPTION_TRACK_ALL_AUTHENTICATED_EVIDENCE_RECORD_VERSION),
  soundsync: ref('soundsync.actual-support-evidence',
    CAPTION_SOUND_SUPPORT_RESULT_VERSION),
  broll_owner: ref('broll.actual-owner-read',
    CAPTION_BROLL_OWNER_READ_BINDING_VERSION),
}
const outputIds = ['caption-output-wide', 'caption-output-vertical']
const inputWithoutDigest: Omit<CaptionTerminalQualificationEvidenceInput,
  'inputDigestSha256'> = {
  schemaVersion: CAPTION_TERMINAL_QUALIFICATION_INPUT_VERSION,
  inputId: 'captions.terminal.contract-shape-fixture',
  observedAt: '2026-08-05T12:00:00.000Z',
  canonicalScope: {
    ownerUserId: 'private-caption-qualification-user',
    workspaceId: 'private-caption-qualification-workspace',
    projectId: 'private-caption-qualification-project',
    editSessionId: 'private-caption-qualification-edit',
    planVersionId: 'private-caption-qualification-plan-v1',
    approvedSnapshotRef: ref('private.caption.qualification.snapshot'),
  },
  sourceCurrentReadinessRef: refFrom(
    CAPTION_CURRENT_INTEGRATION_READINESS.readinessId,
    CAPTION_CURRENT_INTEGRATION_READINESS.schemaVersion,
    CAPTION_CURRENT_INTEGRATION_READINESS.readinessDigestSha256),
  sourcePrivateReleaseRef: structuredClone(
    CAPTION_POST_CAP20_GOAL_COMPLETION_AUDIT.sourceCap20ReleaseRef),
  integrationManifestRef: refFrom(
    CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestId,
    CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestSchemaVersion,
    CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestHash),
  integrationQualificationRef: refFrom(
    CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT.snapshotId,
    CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT.schemaVersion,
    CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT
      .snapshotDigestSha256),
  canonicalExecution: {
    executionPackageRef: ref('canonical.caption.execution-package'),
    workGraphRef: ref('canonical.caption.work-graph'),
    assetManifestRef: ref('canonical.caption.asset-manifest'),
    masterTimingRef: ref('canonical.caption.master-timing'),
    storyTimingRef: ref('canonical.caption.story-timing'),
    estimateApprovalRef: ref('canonical.caption.estimate-approval'),
    creditReservationRef: ref('canonical.caption.credit-reservation'),
    costBindingRef: ref('canonical.caption.cost-binding'),
    exactApprovedSnapshotReread: true,
    exactExecutionPackageReread: true,
    allCaptionWorkItemsCompleted: true,
    allCaptionArtifactsPersistedAndReread: true,
    allCaptionJobResultsPersistedAndReread: true,
    unresolvedRequiredWorkItemCount: 0,
    unresolvedRequiredAssetCount: 0,
  },
  canonicalSharedOwnerEvidence: {
    canonicalTranscriptReadRef: ownerEvidence.canonical_transcript,
    visualIntelligenceEvidenceRef: ownerEvidence.visual_intelligence,
    trackAllEvidenceRef: ownerEvidence.track_all,
    soundSyncEvidenceRef: ownerEvidence.soundsync,
    brollOwnerEvidenceRef: ownerEvidence.broll_owner,
    actualCanonicalRecordsReread: true,
    sourceFixtureUsedAsRuntimeEvidence: false,
    referenceOnlyEvidenceAccepted: false,
  },
  jobEvidence: CAPTIONS_SUPPORTED_JOB_TYPES.map((jobType) => {
    const binding = CAPTION_CAP20_SHARED_OWNER_INTEGRATION_HANDOFF
      .conditionalJobBindings.find((item) => item.jobType === jobType)
    return {
      jobType,
      outputIds: [...outputIds],
      persistedCaptionJobResultRef: ref(`caption.job-result.${jobType}`),
      executionBundleRef: ref(`caption.execution-bundle.${jobType}`),
      workItemRef: ref(`caption.work-item.${jobType}`),
      plannedAssetManifestEntryRefs: [
        ref(`caption.asset-manifest-entry.${jobType}`),
      ],
      estimateCostBindingRefs: [ref(`caption.estimate-cost.${jobType}`)],
      producedArtifactRefs: [ref(`caption.produced-artifact.${jobType}`)],
      sharedOwnerEvidenceRefs: (binding?.requiredOwnerKeys ?? [])
        .map((ownerKey) => ownerEvidence[ownerKey]),
      deterministicQaEvidenceRefs: [
        ref(`caption.deterministic-qa.${jobType}`),
      ],
      renderedVisualReviewEvidenceRefs: [
        ref(`caption.visual-review.${jobType}`),
      ],
      independentFinalQaEvidenceRefs: [
        ref(`caption.independent-final-qa.${jobType}`),
      ],
      exactApprovedSnapshotReread: true,
      exactJobResultReread: true,
      allRequiredOwnerEvidenceReread: true,
      allRequiredArtifactsPersistedAndReread: true,
      deterministicQaPassed: true,
      qualifiedVisualReviewPassedWhereRequired: true,
      independentFinalQaPassed: true,
      blockerCodes: [],
    }
  }),
  outputEvidence: outputIds.map((outputId, repairGeneration) => ({
    outputId,
    confirmedOutputFrameRef: ref(`${outputId}.confirmed-frame`),
    renderedArtifactRef: ref(`${outputId}.rendered-artifact`),
    deterministicQaRef: ref(`${outputId}.deterministic-qa`),
    qualifiedCompleteTimeVisualReviewRef:
      ref(`${outputId}.qualified-complete-time-visual-review`),
    independentFinalQaRef: ref(`${outputId}.independent-final-qa`),
    privateReviewDecisionRef: ref(`${outputId}.private-review-decision`),
    repairGeneration,
    exactConfirmedFrameReread: true,
    exactRenderedArtifactReread: true,
    completeTimeVisualReviewPassed: true,
    independentFinalQaPassed: true,
    privateReviewAccepted: true,
    unresolvedBlockerCodes: [],
  })),
  evidenceSourceClass: 'canonical_private_persisted_evidence',
  privateInternalQualificationRun: true,
  allDeclaredCaptionJobsCovered: true,
  everyConfirmedOutputCoveredExactlyOnce: true,
  browserLocalCompletionAccepted: false,
  rawChatMediaBytesPathsUrlsOrCredentialsIncluded: false,
  directPeerDispatchPerformedByCaption: false,
  runtimeExecutionAuthorityGrantedToCaption: false,
  assetMutationAuthorityGrantedToCaption: false,
  finalQaApprovalAuthorityGrantedToCaption: false,
  creditOrBillingAuthorityGrantedToCaption: false,
  publicDeliveryAuthorityGrantedToCaption: false,
  productionAuthorityGrantedToCaption: false,
}
const contractShapeFixture = redigestInput({
  ...inputWithoutDigest,
  inputDigestSha256: '',
})

const current = parseCaptionTerminalQualificationPreflight(
  CAPTION_CURRENT_TERMINAL_QUALIFICATION_PREFLIGHT)
check(current.disposition === 'blocked_missing_canonical_evidence'
  && current.blockingGapIds.length === 9
  && !current.canonicalEvidenceAccepted
  && current.sourceQualificationInputRef === null,
'Current readiness remains blocked on all nine actual canonical gaps.')
check(current.terminalProjectionContractImplemented
  && !current.terminalProjectionCreated
  && !current.terminalStatusClaimed,
'The implemented terminal contract does not promote current readiness.')

const parsedInput = parseCaptionTerminalQualificationEvidenceInput(
  contractShapeFixture)
check(parsedInput.jobEvidence.length === 41
  && parsedInput.jobEvidence.map((job) => job.jobType).join('|')
    === CAPTIONS_SUPPORTED_JOB_TYPES.join('|'),
'The terminal input requires all 41 jobs in canonical order.')
check(parsedInput.outputEvidence.length === 2
  && parsedInput.canonicalSharedOwnerEvidence.actualCanonicalRecordsReread
  && !parsedInput.canonicalSharedOwnerEvidence
    .sourceFixtureUsedAsRuntimeEvidence,
'The terminal input requires exact output and actual owner-record assertions.')

const readyPreflight = createCaptionTerminalQualificationPreflight(parsedInput)
check(readyPreflight.disposition === 'ready_for_terminal_projection'
  && readyPreflight.blockingGapIds.length === 0
  && readyPreflight.canonicalEvidenceAccepted
  && !readyPreflight.terminalProjectionCreated
  && !readyPreflight.terminalStatusClaimed,
'Accepted evidence enables projection creation without claiming it early.')

const projection = createCaptionTerminalQualificationProjection(parsedInput)
check(projection.jobs.length === 41
  && projection.counts.qualifiedPrivateInternalJobs === 41
  && projection.counts.blockedJobs === 0
  && projection.allCaptionJobsQualified,
'A complete accepted input projects every supported job as qualified.')
check(projection.outputs.length === 2
  && projection.counts.confirmedOutputs === 2
  && projection.counts.qualifiedOutputs === 2
  && projection.allConfirmedOutputsQualified,
'Every exact confirmed output receives its own qualified evidence projection.')
check(projection.actualCanonicalEvidenceConsumed
  && projection.canonicalBackendPrivateExecutionMounted
  && projection.authenticatedPrivateSharedOwnerEvidenceIntegrated
  && projection.qualifiedAiCompleteTimeVisualReviewIntegrated
  && projection.independentFinalQaRereadIntegrated,
'Terminal status depends on canonical execution, owners, visual review, and QA.')
check(projection.privateInternalOnly
  && !projection.publicProductionRequiredForTerminalStatus
  && !projection.centralOrchestraImplemented
  && !projection.operationDispatchAuthority
  && !projection.providerOrModelRuntimeAuthority
  && !projection.assetMutationAuthority
  && !projection.finalQaApprovalAuthority
  && !projection.creditOrBillingAuthority
  && !projection.publicDeliveryAuthority
  && !projection.productionAuthority,
'Internal qualification grants no runtime, owner, billing, or production power.')
check(parseCaptionTerminalQualificationProjection(projection, parsedInput)
  .projectionDigestSha256 === projection.projectionDigestSha256,
'The terminal projection rereads against the exact source evidence input.')

const staleDigest = structuredClone(parsedInput)
staleDigest.canonicalScope.planVersionId = 'tampered-plan'
expectThrow(() => parseCaptionTerminalQualificationEvidenceInput(staleDigest))
const missingJob = structuredClone(parsedInput)
missingJob.jobEvidence.pop()
expectThrow(() => parseCaptionTerminalQualificationEvidenceInput(
  redigestInput(missingJob)))
const reorderedJobs = structuredClone(parsedInput)
reorderedJobs.jobEvidence.reverse()
expectThrow(() => parseCaptionTerminalQualificationEvidenceInput(
  redigestInput(reorderedJobs)))
const duplicateOutput = structuredClone(parsedInput)
duplicateOutput.outputEvidence[1].outputId = duplicateOutput
  .outputEvidence[0].outputId
expectThrow(() => parseCaptionTerminalQualificationEvidenceInput(
  redigestInput(duplicateOutput)))
const crossedOutputOrder = structuredClone(parsedInput)
crossedOutputOrder.jobEvidence[0].outputIds.reverse()
expectThrow(() => parseCaptionTerminalQualificationEvidenceInput(
  redigestInput(crossedOutputOrder)))
const uncoveredOutput = structuredClone(parsedInput)
uncoveredOutput.jobEvidence.forEach((job) => {
  job.outputIds = [outputIds[0]]
})
expectThrow(() => parseCaptionTerminalQualificationEvidenceInput(
  redigestInput(uncoveredOutput)))
const missingVisualReview = structuredClone(parsedInput)
missingVisualReview.jobEvidence[0].renderedVisualReviewEvidenceRefs = []
expectThrow(() => parseCaptionTerminalQualificationEvidenceInput(
  redigestInput(missingVisualReview)))
const missingFinalQa = structuredClone(parsedInput)
missingFinalQa.outputEvidence[0].independentFinalQaPassed = false as true
expectThrow(() => parseCaptionTerminalQualificationEvidenceInput(
  redigestInput(missingFinalQa)))
const fixtureOverclaim = structuredClone(parsedInput)
fixtureOverclaim.canonicalSharedOwnerEvidence
  .sourceFixtureUsedAsRuntimeEvidence = true as false
expectThrow(() => parseCaptionTerminalQualificationEvidenceInput(
  redigestInput(fixtureOverclaim)))
const referenceOnly = structuredClone(parsedInput)
referenceOnly.canonicalSharedOwnerEvidence
  .referenceOnlyEvidenceAccepted = true as false
expectThrow(() => parseCaptionTerminalQualificationEvidenceInput(
  redigestInput(referenceOnly)))
const authorityOverclaim = structuredClone(parsedInput)
authorityOverclaim.runtimeExecutionAuthorityGrantedToCaption = true as false
expectThrow(() => parseCaptionTerminalQualificationEvidenceInput(
  redigestInput(authorityOverclaim)))
const crossedOwner = structuredClone(parsedInput)
const trackJob = crossedOwner.jobEvidence.find((job) =>
  job.jobType === 'resolve_subject_occluded_typography')!
trackJob.sharedOwnerEvidenceRefs = [ownerEvidence.visual_intelligence]
expectThrow(() => parseCaptionTerminalQualificationEvidenceInput(
  redigestInput(crossedOwner)))
const wrongOwnerWire = structuredClone(parsedInput)
wrongOwnerWire.canonicalSharedOwnerEvidence.trackAllEvidenceRef.version =
  'caption-track-all-evidence-packet-v1'
wrongOwnerWire.jobEvidence.filter((job) =>
  job.sharedOwnerEvidenceRefs.some((item) =>
    item.id === ownerEvidence.track_all.id)).forEach((job) => {
  job.sharedOwnerEvidenceRefs = job.sharedOwnerEvidenceRefs.map((item) =>
    item.id === ownerEvidence.track_all.id
      ? wrongOwnerWire.canonicalSharedOwnerEvidence.trackAllEvidenceRef
      : item)
})
expectThrow(() => parseCaptionTerminalQualificationEvidenceInput(
  redigestInput(wrongOwnerWire)))
const duplicateResult = structuredClone(parsedInput)
duplicateResult.jobEvidence[1].persistedCaptionJobResultRef =
  duplicateResult.jobEvidence[0].persistedCaptionJobResultRef
expectThrow(() => parseCaptionTerminalQualificationEvidenceInput(
  redigestInput(duplicateResult)))
const unknown = structuredClone(parsedInput) as unknown as
  Record<string, unknown>
unknown.unexpected = true
expectThrow(() => parseCaptionTerminalQualificationEvidenceInput(unknown))
const inherited = Object.create({ productionAuthorityGrantedToCaption: true })
Object.assign(inherited, structuredClone(parsedInput))
expectThrow(() => parseCaptionTerminalQualificationEvidenceInput(inherited))
const cyclic = structuredClone(parsedInput) as unknown as
  Record<string, unknown>
cyclic.cycle = cyclic
expectThrow(() => parseCaptionTerminalQualificationEvidenceInput(cyclic))
const staleProjection = structuredClone(projection)
staleProjection.jobs[0].outputIds = [outputIds[0]]
staleProjection.projectionDigestSha256 = calculateSkillContractDigest(
  staleProjection as unknown as Record<string, unknown>,
  'projectionDigestSha256')
expectThrow(() => parseCaptionTerminalQualificationProjection(
  staleProjection, parsedInput))
const otherInput = redigestInput({
  ...structuredClone(parsedInput),
  inputId: 'captions.terminal.other-contract-shape-fixture',
})
expectThrow(() => parseCaptionTerminalQualificationProjection(
  projection, otherInput))
const invalidPreflight = structuredClone(readyPreflight)
invalidPreflight.blockingGapIds = ['final_per_job_qualification_projection']
invalidPreflight.preflightDigestSha256 = calculateSkillContractDigest(
  invalidPreflight as unknown as Record<string, unknown>,
  'preflightDigestSha256')
expectThrow(() => parseCaptionTerminalQualificationPreflight(
  invalidPreflight))

console.log(JSON.stringify({
  smoke: 'captions_specialist_terminal_qualification',
  assertions,
  currentDisposition: current.disposition,
  currentBlockingGapCount: current.blockingGapIds.length,
  terminalProjectionContractImplemented:
    current.terminalProjectionContractImplemented,
  qualifiedCandidateWasContractShapeOnly: true,
  actualCanonicalEvidenceConsumedByThisSmoke: false,
  currentTerminalStatusClaimed: false,
  candidateJobCount: projection.jobs.length,
  candidateOutputCount: projection.outputs.length,
  result: 'passed',
}, null, 2))
