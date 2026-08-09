import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  CAPTION_TERMINAL_QUALIFICATION_INPUT_VERSION_V3,
  type CaptionTerminalQualificationEvidenceInputV3,
} from '../../src/types/caption-terminal-qualification'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import {
  CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_BINDING_VERSION,
} from '../../src/types/caption-canonical-transcript-authenticated-read'
import {
  CANONICAL_CAPTION_VISUAL_INTELLIGENCE_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
} from '../../src/types/canonical-caption-visual-intelligence-support'
import {
  CANONICAL_CAPTION_TRACK_ALL_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
} from '../../src/types/canonical-caption-track-all-support'
import { CAPTION_SOUND_SUPPORT_RESULT_VERSION } from
  '../../src/types/caption-sound-support'
import { CAPTION_BROLL_OWNER_READ_BINDING_VERSION } from
  '../../src/types/caption-multi-track-scene-graph'
import type { CaptionSharedOwnerKey } from
  '../../src/types/caption-shared-owner-integration'
import { CAPTIONS_SUPPORTED_JOB_TYPES, type CaptionsSupportedJobType } from
  '../../src/types/captions-specialist'
import {
  CANONICAL_CAPTION_PRIVATE_REVIEW_EVIDENCE_PROJECTION_VERSION,
  type CanonicalCaptionPrivateReviewEvidenceProjection,
} from '../../src/types/canonical-caption-private-review-evidence-projection'
import {
  CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_EVIDENCE_VERSION,
} from '../../src/types/canonical-caption-postrender-visual-qa-evidence'
import {
  calculateSkillContractDigest,
} from '../orchestra/orchestra-skill-contracts'
import {
  CAPTION_CURRENT_INTEGRATION_READINESS_V3,
} from '../captions-specialist/caption-current-integration-readiness'
import {
  CAPTION_POST_CAP20_GOAL_COMPLETION_AUDIT,
} from '../captions-specialist/caption-goal-completion-audit'
import {
  CAPTION_CAP20_SHARED_OWNER_INTEGRATION_HANDOFF,
} from '../captions-specialist/caption-shared-owner-integration'
import {
  CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST,
} from '../captions-specialist/captions-specialist-integration-manifest'
import {
  CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT,
} from '../captions-specialist/captions-specialist-integration-qualification'
import {
  createCaptionTerminalQualificationPreflightV3,
  createCaptionTerminalQualificationProjectionV3,
  parseCaptionTerminalQualificationEvidenceInputV3,
  parseCaptionTerminalQualificationProjectionV3,
} from '../captions-specialist/caption-terminal-qualification-v3'

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}
function expectThrow(action: () => unknown): void {
  assert.throws(action)
  assertions += 1
}
function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
function ref(id: string, version = 'canonical-private-evidence-v1'):
CaptionDomainRef {
  return { id, version, contentHash: hash(`${id}:${version}`) }
}
function exactRef(id: string, version: string, contentHash: string):
CaptionDomainRef {
  return { id, version, contentHash }
}
function refKey(value: CaptionDomainRef): string {
  return `${value.id}|${value.version}|${value.contentHash}`
}

const ownerVersions: Record<CaptionSharedOwnerKey, string> = {
  canonical_transcript:
    CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_BINDING_VERSION,
  visual_intelligence:
    CANONICAL_CAPTION_VISUAL_INTELLIGENCE_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
  track_all:
    CANONICAL_CAPTION_TRACK_ALL_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
  soundsync: CAPTION_SOUND_SUPPORT_RESULT_VERSION,
  broll_owner: CAPTION_BROLL_OWNER_READ_BINDING_VERSION,
}
const transcriptRef = ref('caption.terminal.v3.transcript',
  ownerVersions.canonical_transcript)
const outputId = 'caption-terminal-v3-output-wide'
const approvedSnapshotRef = ref('caption-terminal-v3-approved-snapshot')
const executionPackageRef = ref('caption-terminal-v3-execution-package')

function requiredOwners(jobType: CaptionsSupportedJobType):
readonly CaptionSharedOwnerKey[] {
  return CAPTION_CAP20_SHARED_OWNER_INTEGRATION_HANDOFF.conditionalJobBindings
    .find((binding) => binding.jobType === jobType)?.requiredOwnerKeys ?? []
}

function ownerRef(
  jobType: CaptionsSupportedJobType,
  owner: CaptionSharedOwnerKey,
): CaptionDomainRef {
  if (owner === 'canonical_transcript') return transcriptRef
  return ref(`caption.terminal.v3.${owner}.${jobType}`, ownerVersions[owner])
}

function evidenceSet(owner: CaptionSharedOwnerKey): CaptionDomainRef[] {
  if (owner === 'canonical_transcript') return [transcriptRef]
  return CAPTIONS_SUPPORTED_JOB_TYPES
    .filter((jobType) => requiredOwners(jobType).includes(owner))
    .map((jobType) => ownerRef(jobType, owner))
}

const outputEvidence:
CaptionTerminalQualificationEvidenceInputV3['outputEvidence'][number] = {
  outputId,
  confirmedOutputFrameRef: ref(`${outputId}.confirmed-frame`),
  renderedArtifactRef: ref(`${outputId}.rendered-artifact`, '1'),
  deterministicQaRef: ref(`${outputId}.deterministic-qa`, '1'),
  qualifiedCompleteTimeVisualReviewRef: ref(
    `${outputId}.complete-time-visual-review`,
    CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_EVIDENCE_VERSION),
  independentFinalQaRef: ref(`${outputId}.independent-final-qa`),
  privateReviewDecisionRef: ref(`${outputId}.private-review-decision`,
    'canonical-private-review-decision-response-v1'),
  repairGeneration: 0,
  exactConfirmedFrameReread: true,
  exactRenderedArtifactReread: true,
  completeTimeVisualReviewPassed: true,
  independentFinalQaPassed: true,
  privateReviewAccepted: true,
  unresolvedBlockerCodes: [],
}

const inputWithoutDigest: Omit<CaptionTerminalQualificationEvidenceInputV3,
  'inputDigestSha256'> = {
  schemaVersion: CAPTION_TERMINAL_QUALIFICATION_INPUT_VERSION_V3,
  inputId: 'captions.terminal.multi-owner-evidence-set-fixture',
  observedAt: '2026-08-05T23:59:00.000Z',
  canonicalScope: {
    ownerUserId: 'caption-terminal-v3-user',
    workspaceId: 'caption-terminal-v3-workspace',
    projectId: 'caption-terminal-v3-project',
    editSessionId: 'caption-terminal-v3-edit',
    planVersionId: 'caption-terminal-v3-plan-v1',
    approvedSnapshotRef,
  },
  sourceCurrentReadinessRef: exactRef(
    CAPTION_CURRENT_INTEGRATION_READINESS_V3.readinessId,
    CAPTION_CURRENT_INTEGRATION_READINESS_V3.schemaVersion,
    CAPTION_CURRENT_INTEGRATION_READINESS_V3.readinessDigestSha256),
  sourcePrivateReleaseRef: structuredClone(
    CAPTION_POST_CAP20_GOAL_COMPLETION_AUDIT.sourceCap20ReleaseRef),
  integrationManifestRef: exactRef(
    CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestId,
    CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestSchemaVersion,
    CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestHash),
  integrationQualificationRef: exactRef(
    CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT.snapshotId,
    CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT.schemaVersion,
    CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT
      .snapshotDigestSha256),
  canonicalExecution: {
    executionPackageRef,
    workGraphRef: ref('caption-terminal-v3-work-graph'),
    assetManifestRef: ref('caption-terminal-v3-asset-manifest'),
    masterTimingRef: ref('caption-terminal-v3-master-timing'),
    storyTimingRef: ref('caption-terminal-v3-story-timing'),
    estimateApprovalRef: ref('caption-terminal-v3-estimate-approval'),
    creditReservationRef: ref('caption-terminal-v3-credit-reservation'),
    costBindingRef: ref('caption-terminal-v3-cost-binding'),
    exactApprovedSnapshotReread: true,
    exactExecutionPackageReread: true,
    allCaptionWorkItemsCompleted: true,
    allCaptionArtifactsPersistedAndReread: true,
    allCaptionJobResultsPersistedAndReread: true,
    unresolvedRequiredWorkItemCount: 0,
    unresolvedRequiredAssetCount: 0,
  },
  canonicalSharedOwnerEvidence: {
    canonicalTranscriptReadRefs: evidenceSet('canonical_transcript'),
    visualIntelligenceEvidenceRefs: evidenceSet('visual_intelligence'),
    trackAllEvidenceRefs: evidenceSet('track_all'),
    soundSyncEvidenceRefs: evidenceSet('soundsync'),
    brollOwnerEvidenceRefs: evidenceSet('broll_owner'),
    actualCanonicalRecordsReread: true,
    sourceFixtureUsedAsRuntimeEvidence: false,
    referenceOnlyEvidenceAccepted: false,
  },
  jobEvidence: CAPTIONS_SUPPORTED_JOB_TYPES.map((jobType) => ({
    jobType,
    outputIds: [outputId],
    persistedCaptionJobResultRef: ref(`caption.v3.job-result.${jobType}`),
    executionBundleRef: ref(`caption.v3.execution-bundle.${jobType}`),
    workItemRef: ref(`caption.v3.work-item.${jobType}`),
    plannedAssetManifestEntryRefs: [
      ref(`caption.v3.asset-manifest-entry.${jobType}`),
    ],
    estimateCostBindingRefs: [ref(`caption.v3.estimate-cost.${jobType}`)],
    producedArtifactRefs: [ref(`caption.v3.produced-artifact.${jobType}`)],
    sharedOwnerEvidenceRefs: requiredOwners(jobType)
      .map((owner) => ownerRef(jobType, owner)),
    deterministicQaEvidenceRefs: [ref(`caption.v3.qa.${jobType}`)],
    renderedVisualReviewEvidenceRefs: [ref(`caption.v3.visual.${jobType}`)],
    independentFinalQaEvidenceRefs: [ref(`caption.v3.final-qa.${jobType}`)],
    exactApprovedSnapshotReread: true,
    exactJobResultReread: true,
    allRequiredOwnerEvidenceReread: true,
    allRequiredArtifactsPersistedAndReread: true,
    deterministicQaPassed: true,
    qualifiedVisualReviewPassedWhereRequired: true,
    independentFinalQaPassed: true,
    blockerCodes: [],
  })),
  outputEvidence: [outputEvidence],
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

function redigest(
  value: CaptionTerminalQualificationEvidenceInputV3,
): CaptionTerminalQualificationEvidenceInputV3 {
  value.inputDigestSha256 = calculateSkillContractDigest(
    value as unknown as Record<string, unknown>, 'inputDigestSha256')
  return value
}

const qualificationInput = redigest({
  ...structuredClone(inputWithoutDigest),
  inputDigestSha256: '',
})

function privateReviewProjection():
CanonicalCaptionPrivateReviewEvidenceProjection {
  const withoutDigest: Omit<CanonicalCaptionPrivateReviewEvidenceProjection,
    'projectionDigestSha256'> = {
    schemaVersion:
      CANONICAL_CAPTION_PRIVATE_REVIEW_EVIDENCE_PROJECTION_VERSION,
    projectionId: `caption.private-review.projection.${outputId}`,
    canonicalScope: {
      ownerUserId: qualificationInput.canonicalScope.ownerUserId,
      workspaceId: qualificationInput.canonicalScope.workspaceId,
      projectId: qualificationInput.canonicalScope.projectId,
      editSessionId: qualificationInput.canonicalScope.editSessionId,
      approvedSnapshotId: approvedSnapshotRef.id,
      approvedSnapshotHash: approvedSnapshotRef.contentHash,
      planId: 'caption-terminal-v3-plan',
      planVersion: 1,
      packageRecordId: executionPackageRef.id,
      packageHash: executionPackageRef.contentHash,
    },
    output: {
      outputId,
      confirmedOutputFrameRef: outputEvidence.confirmedOutputFrameRef,
      width: 1_920,
      height: 1_080,
      fpsNumerator: 30,
      fpsDenominator: 1,
      renderedArtifactRef: {
        id: outputEvidence.renderedArtifactRef.id,
        version: 1,
        contentHash: `sha256:${outputEvidence.renderedArtifactRef.contentHash}`,
      },
      deterministicQaRef: {
        id: outputEvidence.deterministicQaRef.id,
        version: 1,
        contentHash: `sha256:${outputEvidence.deterministicQaRef.contentHash}`,
      },
    },
    sourceRefs: {
      privateReviewDependencyBindingRef: ref(
        `${outputId}.private-review-dependency`,
        'canonical-caption-private-review-dependency-binding-v1'),
      postrenderVisualQaEvidenceRef: {
        id: outputEvidence.qualifiedCompleteTimeVisualReviewRef.id,
        version: 1,
        contentHash:
          `sha256:${outputEvidence.qualifiedCompleteTimeVisualReviewRef.contentHash}`,
      },
      workRequestRef: {
        id: `${outputId}.visual-work-request`,
        version: 1,
        contentHash: `sha256:${hash(`${outputId}.visual-work-request`)}`,
      },
      normalizedResultRef: {
        id: `${outputId}.visual-normalized-result`,
        version: 1,
        contentHash: `sha256:${hash(`${outputId}.visual-normalized-result`)}`,
      },
    },
    visualReview: {
      decision: 'passed',
      actualModelInferenceVerified: true,
      exactApprovedRenderBound: true,
      canonicalEvidenceReconciled: true,
      actualCompleteTimeVisualReviewPassed: true,
      smallestScopeRepairRequired: false,
      privateHumanReviewRequired: false,
    },
    canonicalPrivateReview: {
      assemblyRef: ref(`${outputId}.private-review-assembly`,
        'canonical-private-review-assembly-response-v1'),
      decisionRef: outputEvidence.privateReviewDecisionRef,
      decision: 'accept_private_internal_review',
      finalArtifactSha256: outputEvidence.renderedArtifactRef.contentHash,
      finalQaArtifactSha256: outputEvidence.deterministicQaRef.contentHash,
      exactAssemblyReread: true,
      exactDecisionReread: true,
      immutableApprovedSnapshotPreserved: true,
      immutableReviewManifestPreserved: true,
    },
    disposition: 'private_review_accepted_visual_pass',
    privateReviewAssemblyAllowed: true,
    privateReviewDecisionRecorded: true,
    privateReviewAccepted: true,
    terminalPrivateInternalQualificationEligible: true,
    requiresNewApprovedSnapshot: false,
    browserLocalCompletionAccepted: false,
    captionCreatedPrivateReviewDecision: false,
    captionExecutedRepair: false,
    approvedSnapshotMutationGranted: false,
    operationDispatchAuthority: false,
    providerOrModelRuntimeAuthority: false,
    assetMutationAuthority: false,
    finalQaApprovalAuthority: false,
    creditOrBillingAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  }
  return {
    ...withoutDigest,
    projectionDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      projectionDigestSha256: '',
    } as unknown as Record<string, unknown>, 'projectionDigestSha256'),
  }
}

function mutated(
  change: (value: CaptionTerminalQualificationEvidenceInputV3) => void,
): CaptionTerminalQualificationEvidenceInputV3 {
  const value = structuredClone(qualificationInput)
  change(value)
  return redigest(value)
}

const parsed = parseCaptionTerminalQualificationEvidenceInputV3(
  qualificationInput)
check(parsed.canonicalSharedOwnerEvidence.visualIntelligenceEvidenceRefs.length
  > 1 && parsed.canonicalSharedOwnerEvidence.trackAllEvidenceRefs.length > 1,
'V3 must preserve multiple exact per-job Visual Intelligence and Track All records.')
check(new Set(parsed.jobEvidence.flatMap((job) =>
  job.sharedOwnerEvidenceRefs.map(refKey))).size > 5,
'Per-job owner lineage must contain more than the five collapsed V2 globals.')

const projection = createCaptionTerminalQualificationProjectionV3(
  qualificationInput, [privateReviewProjection()])
const secondVisualRef = parsed.canonicalSharedOwnerEvidence
  .visualIntelligenceEvidenceRefs[1]!
check(projection.jobs.some((job) => job.evidenceRefs.some((item) =>
  refKey(item) === refKey(secondVisualRef))),
'The terminal projection must retain later owner records instead of the first record only.')
const blocked = createCaptionTerminalQualificationPreflightV3(
  qualificationInput)
check(blocked.disposition === 'blocked_missing_canonical_evidence'
  && blocked.sourceQualificationInputRef === null,
'A V3 input without exact private-review projections must remain blocked.')

expectThrow(() => parseCaptionTerminalQualificationEvidenceInputV3(mutated(
  (value) => value.canonicalSharedOwnerEvidence
    .visualIntelligenceEvidenceRefs.push(structuredClone(
      value.canonicalSharedOwnerEvidence.visualIntelligenceEvidenceRefs[0]!)))))
expectThrow(() => parseCaptionTerminalQualificationEvidenceInputV3(mutated(
  (value) => { value.canonicalSharedOwnerEvidence.trackAllEvidenceRefs[0]!
    .version = 'forged-track-all-version' })))
expectThrow(() => parseCaptionTerminalQualificationEvidenceInputV3(mutated(
  (value) => { value.jobEvidence.find((job) =>
    requiredOwners(job.jobType).includes('visual_intelligence'))!
    .sharedOwnerEvidenceRefs[0] = ref('foreign-owner-record',
      ownerVersions.visual_intelligence) })))

const multiOwnerJob = qualificationInput.jobEvidence.find((job) =>
  job.sharedOwnerEvidenceRefs.length > 1)!
expectThrow(() => parseCaptionTerminalQualificationEvidenceInputV3(mutated(
  (value) => { value.jobEvidence.find((job) =>
    job.jobType === multiOwnerJob.jobType)!.sharedOwnerEvidenceRefs.reverse() })))
expectThrow(() => parseCaptionTerminalQualificationEvidenceInputV3(mutated(
  (value) => value.canonicalSharedOwnerEvidence.visualIntelligenceEvidenceRefs
    .push(ref('unused-visual-owner-record', ownerVersions.visual_intelligence)))))

const ownerJob = qualificationInput.jobEvidence.find((job) =>
  job.sharedOwnerEvidenceRefs.length > 0)!
expectThrow(() => parseCaptionTerminalQualificationEvidenceInputV3(mutated(
  (value) => { const refs = value.jobEvidence.find((job) =>
    job.jobType === ownerJob.jobType)!.sharedOwnerEvidenceRefs
  refs.push(structuredClone(refs[0]!)) })))
expectThrow(() => parseCaptionTerminalQualificationEvidenceInputV3(mutated(
  (value) => { value.jobEvidence.find((job) =>
    job.jobType === ownerJob.jobType)!.sharedOwnerEvidenceRefs.pop() })))

const staleProjection = structuredClone(projection)
staleProjection.jobs[0]!.evidenceRefs.reverse()
staleProjection.projectionDigestSha256 = calculateSkillContractDigest(
  staleProjection as unknown as Record<string, unknown>,
  'projectionDigestSha256')
expectThrow(() => parseCaptionTerminalQualificationProjectionV3(
  staleProjection, qualificationInput))

console.log(JSON.stringify({
  smoke: 'captions_specialist_terminal_qualification_v3',
  status: 'passed',
  assertions,
  declaredCaptionJobs: parsed.jobEvidence.length,
  visualIntelligenceRecords:
    parsed.canonicalSharedOwnerEvidence.visualIntelligenceEvidenceRefs.length,
  trackAllRecords:
    parsed.canonicalSharedOwnerEvidence.trackAllEvidenceRefs.length,
  soundSyncRecords:
    parsed.canonicalSharedOwnerEvidence.soundSyncEvidenceRefs.length,
  brollOwnerRecords:
    parsed.canonicalSharedOwnerEvidence.brollOwnerEvidenceRefs.length,
  v2CompatibilityPreserved: true,
  realOwnerRecordsCollapsed: false,
  productionAuthority: false,
}, null, 2))
