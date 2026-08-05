import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  CAPTION_TERMINAL_QUALIFICATION_INPUT_VERSION_V2,
  type CaptionTerminalQualificationEvidenceInputV2,
} from '../../src/types/caption-terminal-qualification'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import {
  CANONICAL_CAPTION_PRIVATE_REVIEW_EVIDENCE_PROJECTION_VERSION,
  type CanonicalCaptionPrivateReviewEvidenceProjection,
} from '../../src/types/canonical-caption-private-review-evidence-projection'
import {
  CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_EVIDENCE_VERSION,
} from '../../src/types/canonical-caption-postrender-visual-qa-evidence'
import {
  CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_BINDING_VERSION,
} from '../../src/types/caption-canonical-transcript-authenticated-read'
import {
  CANONICAL_CAPTION_VISUAL_INTELLIGENCE_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
} from '../../src/types/canonical-caption-visual-intelligence-support'
import {
  CANONICAL_CAPTION_TRACK_ALL_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
} from '../../src/types/canonical-caption-track-all-support'
import {
  CAPTION_SOUND_SUPPORT_RESULT_VERSION,
} from '../../src/types/caption-sound-support'
import {
  CAPTION_BROLL_OWNER_READ_BINDING_VERSION,
} from '../../src/types/caption-multi-track-scene-graph'
import {
  CAPTIONS_SUPPORTED_JOB_TYPES,
} from '../../src/types/captions-specialist'
import {
  CAPTION_CURRENT_JOB_READINESS_LEDGER,
} from '../captions-specialist/caption-current-job-readiness'
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
  calculateSkillContractDigest,
} from '../orchestra/orchestra-skill-contracts'
import {
  createCanonicalCaptionTerminalEvidenceBundle,
  createCanonicalCaptionTerminalEvidenceReadPort,
  createCanonicalCaptionTerminalQualificationRepository,
  createCanonicalCaptionTerminalQualificationRequest,
  createCanonicalCaptionTerminalQualificationService,
  parseCanonicalCaptionTerminalQualificationRequest,
} from '../services/canonical-caption-terminal-qualification-service'
import type { CanonicalCreateOnlyJsonObjectPort } from
  '../services/canonical-gcs-source-analysis-lifecycle-store'

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}
async function expectReject(action: () => Promise<unknown>): Promise<void> {
  await assert.rejects(action)
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

const ownerEvidence = {
  canonical_transcript: ref('canonical.transcript.actual-read',
    CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_BINDING_VERSION),
  visual_intelligence: ref('visual-intelligence.actual-evidence',
    CANONICAL_CAPTION_VISUAL_INTELLIGENCE_AUTHENTICATED_EVIDENCE_RECORD_VERSION),
  track_all: ref('track-all.actual-evidence',
    CANONICAL_CAPTION_TRACK_ALL_AUTHENTICATED_EVIDENCE_RECORD_VERSION),
  soundsync: ref('soundsync.actual-evidence',
    CAPTION_SOUND_SUPPORT_RESULT_VERSION),
  broll_owner: ref('broll.actual-evidence',
    CAPTION_BROLL_OWNER_READ_BINDING_VERSION),
}
const outputId = 'caption-terminal-output-wide'
const approvedSnapshotRef = ref('caption-terminal-approved-snapshot')
const executionPackageRef = ref('caption-terminal-execution-package')

const request = createCanonicalCaptionTerminalQualificationRequest({
  requestId: 'caption.terminal.private-internal.request.fixture',
  canonicalScope: {
    ownerUserId: 'caption-terminal-user',
    workspaceId: 'caption-terminal-workspace',
    projectId: 'caption-terminal-project',
    editSessionId: 'caption-terminal-edit',
    planVersionId: 'caption-terminal-plan-v1',
    approvedSnapshotRef,
  },
  executionPackageRef,
  currentJobReadinessRef: exactRef(
    CAPTION_CURRENT_JOB_READINESS_LEDGER.ledgerId,
    CAPTION_CURRENT_JOB_READINESS_LEDGER.schemaVersion,
    CAPTION_CURRENT_JOB_READINESS_LEDGER.ledgerDigestSha256),
  requiredOutputIds: [outputId],
  privateInternalQualificationRun: true,
  callerSuppliedEvidenceAccepted: false,
  browserLocalCompletionAccepted: false,
  rawChatMediaBytesPathsUrlsOrCredentialsIncluded: false,
  operationOrRuntimeAuthorityGrantedToCaption: false,
  providerOrModelAuthorityGrantedToCaption: false,
  assetMutationAuthorityGrantedToCaption: false,
  finalQaApprovalAuthorityGrantedToCaption: false,
  creditOrBillingAuthorityGrantedToCaption: false,
  publicDeliveryAuthorityGrantedToCaption: false,
  productionAuthorityGrantedToCaption: false,
})

const outputEvidence:
CaptionTerminalQualificationEvidenceInputV2['outputEvidence'][number] = {
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
  exactConfirmedFrameReread: true as const,
  exactRenderedArtifactReread: true as const,
  completeTimeVisualReviewPassed: true as const,
  independentFinalQaPassed: true as const,
  privateReviewAccepted: true as const,
  unresolvedBlockerCodes: [],
}

const inputWithoutDigest: Omit<CaptionTerminalQualificationEvidenceInputV2,
  'inputDigestSha256'> = {
  schemaVersion: CAPTION_TERMINAL_QUALIFICATION_INPUT_VERSION_V2,
  inputId: 'captions.terminal.canonical-service-contract-fixture',
  observedAt: '2026-08-05T23:45:00.000Z',
  canonicalScope: structuredClone(request.canonicalScope),
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
    workGraphRef: ref('caption-terminal-work-graph'),
    assetManifestRef: ref('caption-terminal-asset-manifest'),
    masterTimingRef: ref('caption-terminal-master-timing'),
    storyTimingRef: ref('caption-terminal-story-timing'),
    estimateApprovalRef: ref('caption-terminal-estimate-approval'),
    creditReservationRef: ref('caption-terminal-credit-reservation'),
    costBindingRef: ref('caption-terminal-cost-binding'),
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
      outputIds: [outputId],
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
      deterministicQaEvidenceRefs: [ref(`caption.qa.${jobType}`)],
      renderedVisualReviewEvidenceRefs: [ref(`caption.visual.${jobType}`)],
      independentFinalQaEvidenceRefs: [ref(`caption.final-qa.${jobType}`)],
      exactApprovedSnapshotReread: true as const,
      exactJobResultReread: true as const,
      allRequiredOwnerEvidenceReread: true as const,
      allRequiredArtifactsPersistedAndReread: true as const,
      deterministicQaPassed: true as const,
      qualifiedVisualReviewPassedWhereRequired: true as const,
      independentFinalQaPassed: true as const,
      blockerCodes: [],
    }
  }),
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
const qualificationInput: CaptionTerminalQualificationEvidenceInputV2 = {
  ...inputWithoutDigest,
  inputDigestSha256: calculateSkillContractDigest({
    ...inputWithoutDigest,
    inputDigestSha256: '',
  } as unknown as Record<string, unknown>, 'inputDigestSha256'),
}

function privateReviewProjection():
CanonicalCaptionPrivateReviewEvidenceProjection {
  const withoutDigest: Omit<CanonicalCaptionPrivateReviewEvidenceProjection,
    'projectionDigestSha256'> = {
    schemaVersion:
      CANONICAL_CAPTION_PRIVATE_REVIEW_EVIDENCE_PROJECTION_VERSION,
    projectionId: `caption.private-review.projection.${outputId}`,
    canonicalScope: {
      ownerUserId: request.canonicalScope.ownerUserId,
      workspaceId: request.canonicalScope.workspaceId,
      projectId: request.canonicalScope.projectId,
      editSessionId: request.canonicalScope.editSessionId,
      approvedSnapshotId: approvedSnapshotRef.id,
      approvedSnapshotHash: approvedSnapshotRef.contentHash,
      planId: 'caption-terminal-plan',
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

function memoryObjectPort(): CanonicalCreateOnlyJsonObjectPort {
  const objects = new Map<string, Buffer>()
  return {
    async createOnly(input) {
      const existing = objects.get(input.objectPath)
      if (existing) return 'already_exists'
      objects.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(objectPath) {
      const value = objects.get(objectPath)
      return value ? Buffer.from(value) : null
    },
  }
}

async function run(): Promise<void> {
  const blockedRepository = createCanonicalCaptionTerminalQualificationRepository({
    objectPort: memoryObjectPort(),
  })
  const missingReadPort = createCanonicalCaptionTerminalEvidenceReadPort(
    async () => null)
  const blockedService = createCanonicalCaptionTerminalQualificationService({
    evidenceReadPort: missingReadPort,
    repository: blockedRepository,
  })
  const blocked = await blockedService.qualifyPrivateInternal(request)
  check(blocked.disposition === 'blocked_missing_canonical_evidence'
    && blocked.preflight.blockingGapIds.length === 9
    && blocked.record === null
    && blocked.terminalProjection === null,
  'Missing canonical evidence must return a blocked preflight without a record.')

  expectThrow(() => createCanonicalCaptionTerminalEvidenceBundle({
    request,
    qualificationInput,
    privateReviewEvidenceProjections: [privateReviewProjection()],
  }))
  let ownerReads = 0
  const evidenceReadPort = createCanonicalCaptionTerminalEvidenceReadPort(
    async () => {
      ownerReads += 1
      return null
    })
  const repository = createCanonicalCaptionTerminalQualificationRepository({
    objectPort: memoryObjectPort(),
  })
  const service = createCanonicalCaptionTerminalQualificationService({
    evidenceReadPort,
    repository,
    now: () => new Date('2026-08-05T23:55:00.000Z'),
  })
  const sourceBlocked = await service.qualifyPrivateInternal(request)
  check(sourceBlocked.disposition === 'blocked_missing_canonical_evidence'
    && sourceBlocked.record === null
    && sourceBlocked.terminalProjection === null
    && ownerReads === 0,
  'The current four-job source-readiness gap must block before owner evidence is read.')
  check(!sourceBlocked.currentProductStatusChanged
    && !sourceBlocked.publicOrProductionAuthorityGranted,
  'A source-readiness block cannot promote product, public, or production state.')

  expectThrow(() => createCanonicalCaptionTerminalQualificationService({
    evidenceReadPort: {
      schemaVersion: 'canonical-caption-terminal-evidence-read-port-v1',
      sourceAuthority: 'canonical_backend_persisted_caption_evidence',
      callerSuppliedEvidenceAccepted: false,
      async readExact() { return null },
    },
    repository,
  }))
  expectThrow(() => createCanonicalCaptionTerminalQualificationService({
    evidenceReadPort,
    repository: {
      schemaVersion:
        'canonical-caption-terminal-qualification-repository-v1',
      async persistRecordCreateOnly() { return 'created' },
      async rereadRecord() { return null },
    },
  }))
  const staleRequest = structuredClone(request)
  staleRequest.requiredOutputIds = ['crossed-output']
  expectThrow(() => parseCanonicalCaptionTerminalQualificationRequest(
    staleRequest))
  const callerEvidence = {
    ...structuredClone(request),
    qualificationInput,
  }
  await expectReject(() => service.qualifyPrivateInternal(callerEvidence))
  const crossedInput = structuredClone(qualificationInput)
  crossedInput.canonicalScope.workspaceId = 'crossed-workspace'
  crossedInput.inputDigestSha256 = calculateSkillContractDigest(
    crossedInput as unknown as Record<string, unknown>, 'inputDigestSha256')
  expectThrow(() => createCanonicalCaptionTerminalEvidenceBundle({
    request,
    qualificationInput: crossedInput,
    privateReviewEvidenceProjections: [privateReviewProjection()],
  }))

  console.log(JSON.stringify({
    smoke: 'canonical_caption_terminal_qualification_service',
    status: 'passed',
    assertions,
    blockedWithoutCanonicalEvidence: true,
    qualifiedCandidateWasContractShapeOnly: true,
    actualCanonicalEvidenceConsumedByThisSmoke: false,
    currentSourceReadinessBlockedBeforeOwnerRead: ownerReads === 0,
    currentV2ProjectionBuilderBlockedBySourceReadiness: true,
    callerSuppliedEvidenceAccepted: false,
    browserLocalCompletionAccepted: false,
    productionAuthority: false,
  }, null, 2))
}

void run()
