import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import type {
  CanonicalCaptionPrivateInternalQualificationService,
} from '../../src/types/canonical-caption-private-internal-qualification'
import type {
  CanonicalCaptionPrivateQualificationRunController,
  CanonicalCaptionPrivateQualificationRunOutcome,
} from '../../src/types/canonical-caption-private-qualification-run-controller'
import type {
  CanonicalCaptionPrivateQualificationRunControllerInputV2,
} from '../../src/types/canonical-caption-private-qualification-run-controller-v2'
import { CAPTIONS_SUPPORTED_JOB_TYPES } from
  '../../src/types/captions-specialist'
import {
  CAPTION_CURRENT_JOB_READINESS_LEDGER_V2,
} from '../captions-specialist/caption-current-job-readiness'
import {
  CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT,
} from '../captions-specialist/captions-specialist-integration-qualification'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  createCanonicalCaptionBrollOwnerEvidenceReadPort,
  createCanonicalCaptionBrollOwnerInspectionAuthorityReadPort,
  createCanonicalCaptionBrollOwnerInspectionBundleRepository,
  createCanonicalCaptionBrollOwnerInspectionProjectionService,
} from '../services/canonical-caption-broll-owner-inspection-projection-service'
import {
  createCanonicalCaptionDirectVisualInspectionEvidence,
  createCanonicalCaptionDirectVisualInspectionRepository,
} from '../services/canonical-caption-direct-visual-inspection-evidence-service'
import {
  createCanonicalCaptionPrivateQualificationCampaignControllerV2,
  parseCanonicalCaptionPrivateQualificationCampaignOutcomeV2,
} from '../services/canonical-caption-private-qualification-campaign-v2-service'
import {
  createCanonicalCaptionPrivateQualificationCatalogRequest,
} from '../services/canonical-caption-private-qualification-catalog-service'
import {
  parseCanonicalCaptionPrivateQualificationRunOutcome,
} from '../services/canonical-caption-private-qualification-run-controller'
import {
  createCanonicalCaptionPrivateQualificationRunControllerV2,
} from '../services/canonical-caption-private-qualification-run-controller-v2'
import {
  createCanonicalCaptionQualificationRunEvidenceAssembly,
  createCanonicalCaptionQualificationRunEvidenceReadPort,
  createCanonicalCaptionQualificationRunEvidenceRepository,
} from '../services/canonical-caption-qualification-run-evidence-reader'
import type { CanonicalCreateOnlyJsonObjectPort } from
  '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalCaptionRealSourceInspectionProjectionRequest,
} from '../services/canonical-caption-real-source-inspection-projection-service'
import {
  createCanonicalCaptionTerminalQualificationRequest,
} from '../services/canonical-caption-terminal-qualification-service'

let checks = 0
function check(value: unknown, message: string): asserts value {
  assert.ok(value, message)
  checks += 1
}
function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
function ref(
  id: string,
  version = 'caption-campaign-v2-fixture-v1',
): CaptionDomainRef {
  return { id, version, contentHash: hash(`${id}|${version}`) }
}
function memoryObjectPort(): CanonicalCreateOnlyJsonObjectPort {
  const values = new Map<string, Buffer>()
  return {
    async createOnly(input) {
      const previous = values.get(input.objectPath)
      if (previous) {
        if (!previous.equals(input.body)) throw new Error('create-only conflict')
        return 'already_exists'
      }
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const value = values.get(path)
      return value ? Buffer.from(value) : null
    },
  }
}

const ownerUserId = 'caption-campaign-v2-owner'
const workspaceId = 'caption-campaign-v2-workspace'
const projectId = 'caption-campaign-v2-project'

function runInput(
  index: number,
  approvedSnapshotRef = ref(`caption-campaign-v2-snapshot-${index}`,
    'private-edit-authority-snapshot-v1'),
): CanonicalCaptionPrivateQualificationRunControllerInputV2 {
  const editSessionId = `caption-campaign-v2-edit-${index}`
  const outputId = `caption-campaign-v2-output-${index}`
  const planVersionId = `caption-campaign-v2-plan-${index}.v1`
  const executionPackageRef = ref(`caption-campaign-v2-package-${index}`,
    'canonical-edit-execution-package-v1')
  const confirmedOutputFrameRef = ref(`caption-campaign-v2-frame-${index}`,
    'confirmed-output-frame-v1')
  const renderedArtifactRef = ref(`caption-campaign-v2-render-${index}`,
    'private-caption-render-v1')
  const deterministicQaRef = ref(`caption-campaign-v2-render-qa-${index}`,
    'private-caption-render-qa-v1')
  const receiptRef = ref(`caption-campaign-v2-inspection-${index}`,
    'caption-real-source-complete-time-direct-inspection-v1')
  const canonicalScope = {
    ownerUserId,
    workspaceId,
    projectId,
    editSessionId,
    planVersionId,
    approvedSnapshotRef,
    executionPackageRef,
    outputId,
  }
  return {
    inspectionLane: 'uploaded_source',
    inspectionRequest:
      createCanonicalCaptionRealSourceInspectionProjectionRequest({
        requestId: `caption-campaign-v2-inspection-request-${index}`,
        receiptKind: 'vertical_complete_time_v1',
        receiptRef,
        variant: 'vertical_full_motion',
        canonicalScope,
        confirmedOutputFrameRef,
        renderedArtifactRef,
        deterministicQaRef,
        expectedOriginalSourceRef: ref(`caption-campaign-v2-source-${index}`,
          'private-source-media-v1'),
        exactCaptionReceiptRereadRequired: true,
        exactReviewSpecRereadRequired: true,
        canonicalApprovedRunAuthorityRereadRequired: true,
        canonicalQualificationReaderMustRevalidateAuthority: true,
        callerSuppliedReceiptAccepted: false,
        browserLocalCompletionAccepted: false,
        mediaBytesAccepted: false,
        pathsUrlsOrCredentialsAccepted: false,
        providerCallRequested: false,
        operationDispatchAuthorityGranted: false,
        repairExecutionAuthorityGranted: false,
        assetMutationAuthorityGranted: false,
        finalQaApprovalGranted: false,
        billingAuthorityGranted: false,
        publicDeliveryGranted: false,
        productionAuthorityGranted: false,
      }),
    inspectionBundle: {
      receiptKind: 'vertical_complete_time_v1',
      receipt: {},
      reviewSpecs: [],
    },
    qualificationRequest:
      createCanonicalCaptionTerminalQualificationRequest({
        requestId: `caption-campaign-v2-qualification-request-${index}`,
        canonicalScope: {
          ownerUserId,
          workspaceId,
          projectId,
          editSessionId,
          planVersionId,
          approvedSnapshotRef,
        },
        executionPackageRef,
        currentJobReadinessRef: {
          id: CAPTION_CURRENT_JOB_READINESS_LEDGER_V2.ledgerId,
          version: CAPTION_CURRENT_JOB_READINESS_LEDGER_V2.schemaVersion,
          contentHash:
            CAPTION_CURRENT_JOB_READINESS_LEDGER_V2.ledgerDigestSha256,
        },
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
      }),
    captionOwnedClosedDirectInspectionReceiptProvided: true,
    exactApprovedRunRereadRequired: true,
    callerSuppliedCanonicalAuthorityAccepted: false,
    browserLocalCompletionAccepted: false,
    operationOrRuntimeAuthorityGrantedToCaption: false,
    providerOrModelAuthorityGrantedToCaption: false,
    assetMutationAuthorityGrantedToCaption: false,
    finalQaApprovalAuthorityGrantedToCaption: false,
    creditOrBillingAuthorityGrantedToCaption: false,
    publicDeliveryAuthorityGrantedToCaption: false,
    productionAuthorityGrantedToCaption: false,
  }
}

function pendingLegacyOutcome(
  input: Extract<CanonicalCaptionPrivateQualificationRunControllerInputV2, {
    inspectionLane: 'uploaded_source'
  }>,
): CanonicalCaptionPrivateQualificationRunOutcome {
  const request = input.inspectionRequest
  const evidence = createCanonicalCaptionDirectVisualInspectionEvidence({
    evidenceId: `evidence.${request.requestId}`,
    observedAt: '2026-08-06T20:00:00.000Z',
    canonicalScope: structuredClone(request.canonicalScope),
    confirmedOutputFrameRef: structuredClone(
      request.confirmedOutputFrameRef),
    renderedArtifactRef: structuredClone(request.renderedArtifactRef),
    deterministicQaRef: structuredClone(request.deterministicQaRef),
    sourceMediaAuthorityRef: ref(`source-authority.${request.requestId}`,
      'private-approved-source-binding-manifest-v1'),
    sourceMediaBindingRefs: [ref(`source-binding.${request.requestId}`,
      'private-approved-source-binding-v1')],
    inspectionArtifactSetRef: structuredClone(request.receiptRef),
    coverage: {
      renderedFrameCount: 120,
      representedFrameCount: 120,
      contactSheetCount: 5,
      originalResolutionSpotCheckCount: 6,
      everyRenderedFrameRepresentedExactlyOnce: true,
      contactSheetCoverageComplete: true,
      originalResolutionTransitionAndTailChecksComplete: true,
      completeMotionPlaybackClaimed: false,
    },
    findings: {
      faceObstructionObserved: false,
      gestureObstructionObserved: false,
      captionClippingObserved: false,
      phraseOverflowObserved: false,
      inaccessibleReadingStateObserved: false,
      importantSourceTextCollisionObserved: false,
      unstablePlacementObserved: false,
      unusableCueTransitionObserved: false,
      tailTruncationObserved: false,
      unprofessionalVisualTreatmentObserved: false,
    },
    inspectionMethod:
      'every_rendered_frame_contact_sheets_plus_original_resolution_checks_v1',
    inspectorClass: 'codex_agent_direct_visual_inspection',
    disposition: 'passed_caption_owned_professional_appearance',
    realUploadedSourcePixelsInspected: true,
    syntheticEngineeringFixtureUsed: false,
    acceptedForCaptionOwnedProfessionalAppearance: true,
    exactApprovedRenderAndSourceAuthorityBound: true,
    deterministicTechnicalQaReplaced: false,
    sharedPostrenderModelReviewClaimed: false,
    independentFinalQaClaimed: false,
    browserLocalCompletionClaimed: false,
    mediaBytesSerialized: false,
    localPathsOrUrlsSerialized: false,
    rawChatOrCredentialsSerialized: false,
    providerCallMadeByCaption: false,
    operationDispatchAuthorityGranted: false,
    repairExecutionAuthorityGranted: false,
    assetMutationAuthorityGranted: false,
    finalQaApprovalGranted: false,
    billingAuthorityGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  })
  const inspectionProjection = {
    disposition:
      'projected_canonical_direct_visual_inspection_evidence' as const,
    request,
    evidence,
    captionReceiptRereadTwice: true as const,
    reviewSpecsRereadTwice: true as const,
    canonicalApprovedRunAuthorityRereadTwice: true as const,
    canonicalApprovedRunAuthorityRef: ref(
      `authority.${request.requestId}`,
      'canonical-caption-real-source-inspection-authority-v1'),
    evidencePersistedCreateOnlyAndReread: true as const,
    canonicalQualificationReaderMustRevalidateAuthority: true as const,
    currentProductStatusChanged: false as const,
    publicOrProductionAuthorityGranted: false as const,
  }
  const withoutDigest = {
    schemaVersion:
      'canonical-caption-private-qualification-run-outcome-v1' as const,
    disposition:
      'inspection_projected_waiting_for_complete_run' as const,
    inspectionProjection,
    inspectionEvidenceRef: {
      id: evidence.evidenceId,
      version: evidence.schemaVersion,
      contentHash: evidence.evidenceDigestSha256,
    },
    qualificationRunEvidence: null,
    qualificationRunEvidenceRef: null,
    inspectionBundlePersistedCreateOnlyAndReread: true as const,
    canonicalInspectionAuthorityRereadTwice: true as const,
    canonicalRunEvidenceSourceReadAttempted: true as const,
    qualificationRunEvidencePersistedAndExactReread: false,
    incompleteRunPromoted: false as const,
    callerSuppliedCanonicalAuthorityAccepted: false as const,
    browserLocalCompletionAccepted: false as const,
    operationOrRuntimeAuthorityGrantedToCaption: false as const,
    providerOrModelAuthorityGrantedToCaption: false as const,
    assetMutationAuthorityGrantedToCaption: false as const,
    finalQaApprovalAuthorityGrantedToCaption: false as const,
    creditOrBillingAuthorityGrantedToCaption: false as const,
    publicDeliveryAuthorityGrantedToCaption: false as const,
    productionAuthorityGrantedToCaption: false as const,
  }
  return parseCanonicalCaptionPrivateQualificationRunOutcome({
    ...withoutDigest,
    outcomeDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      outcomeDigestSha256: '',
    }, 'outcomeDigestSha256'),
  })
}

const objectPort = memoryObjectPort()
const legacyUploadedSourceController = {
  schemaVersion: 'canonical-caption-private-qualification-run-controller-v1',
  closedCaptionDirectInspectionReceiptRequired: true,
  exactApprovedRunRereadRequired: true,
  incompleteRunPromotionAllowed: false,
  async reconcileApprovedRun(input) {
    return pendingLegacyOutcome({
      ...input,
      inspectionLane: 'uploaded_source',
    })
  },
} satisfies CanonicalCaptionPrivateQualificationRunController
const brollBundleRepository =
  createCanonicalCaptionBrollOwnerInspectionBundleRepository({
    objectPort,
    prefix: 'private/smoke/caption-campaign-v2/broll-bundles',
  })
const brollProjectionService =
  createCanonicalCaptionBrollOwnerInspectionProjectionService({
    bundleReadPort: brollBundleRepository,
    ownerEvidenceReadPort:
      createCanonicalCaptionBrollOwnerEvidenceReadPort(async () => null),
    authorityReadPort:
      createCanonicalCaptionBrollOwnerInspectionAuthorityReadPort(
        async () => null),
    evidenceRepository:
      createCanonicalCaptionDirectVisualInspectionRepository({
        objectPort,
        prefix: 'private/smoke/caption-campaign-v2/direct-evidence',
      }),
  })
const runEvidenceAssembly =
  createCanonicalCaptionQualificationRunEvidenceAssembly({
    sourceReadPort:
      createCanonicalCaptionQualificationRunEvidenceReadPort(
        async () => null),
    repository: createCanonicalCaptionQualificationRunEvidenceRepository({
      objectPort,
      prefix: 'private/smoke/caption-campaign-v2/run-evidence',
    }),
  })
const approvedRunController =
  createCanonicalCaptionPrivateQualificationRunControllerV2({
    legacyUploadedSourceController,
    brollInspectionBundleRepository: brollBundleRepository,
    brollInspectionProjectionService: brollProjectionService,
    runEvidenceAssembly,
  })
let qualificationCalls = 0
const qualificationService = {
  schemaVersion: 'canonical-caption-private-internal-qualification-service-v1',
  async qualifyPrivateInternal(request) {
    qualificationCalls += 1
    return {
      disposition: 'blocked_missing_canonical_private_evidence' as const,
      request,
      record: null,
      currentProductStatusChanged: false as const,
      centralOrchestraImplemented: false as const,
      publicOrProductionAuthorityGranted: false as const,
    }
  },
} satisfies CanonicalCaptionPrivateInternalQualificationService
const campaignController =
  createCanonicalCaptionPrivateQualificationCampaignControllerV2({
    approvedRunController,
    qualificationService,
  })
const runs = [runInput(1), runInput(2)]
const runRefs = runs.map((run) => ({
  id: run.qualificationRequest.requestId,
  version: run.qualificationRequest.schemaVersion,
  contentHash: run.qualificationRequest.requestDigestSha256,
})).sort((left, right) => refKey(left).localeCompare(refKey(right)))
const catalogRequest =
  createCanonicalCaptionPrivateQualificationCatalogRequest({
    requestId: 'caption-campaign-v2-catalog-request',
    qualificationScope: {
      ownerUserId,
      workspaceId,
      suiteId: 'caption-campaign-v2-private-internal-suite',
    },
    sourcePlanningQualificationSnapshotRef: {
      id: CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT.snapshotId,
      version:
        CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT.schemaVersion,
      contentHash:
        CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT
          .snapshotDigestSha256,
    },
    runEvidenceRequestRefs: runRefs,
    requiredJobTypes: [...CAPTIONS_SUPPORTED_JOB_TYPES],
    privateInternalQualificationRun: true,
    multipleApprovedRunsExpected: true,
    oneAllFeatureEditRequired: false,
    callerSuppliedRunEvidenceAccepted: false,
    planningOnlyEvidenceAcceptedAsQualification: false,
    syntheticEngineeringFixtureAcceptedAsProfessionalAppearance: false,
    browserLocalCompletionAccepted: false,
    centralOrchestraImplemented: false,
    operationOrRuntimeAuthorityGrantedToCaption: false,
    providerOrModelAuthorityGrantedToCaption: false,
    assetMutationAuthorityGrantedToCaption: false,
    finalQaApprovalAuthorityGrantedToCaption: false,
    creditOrBillingAuthorityGrantedToCaption: false,
    publicDeliveryAuthorityGrantedToCaption: false,
    productionAuthorityGrantedToCaption: false,
  })
function campaignInput(approvedRuns = runs) {
  return {
    catalogRequest,
    approvedRuns,
    exactCatalogRunSetRequired: true as const,
    multipleApprovedSnapshotsRequired: true as const,
    oneAllFeatureEditFabricated: false as const,
    mixedInspectionLanesAllowed: true as const,
    privateInternalQualificationHarnessOnly: true as const,
    callerSuppliedCanonicalAuthorityAccepted: false as const,
    browserLocalCompletionAccepted: false as const,
    centralOrchestraImplemented: false as const,
    operationOrRuntimeAuthorityGrantedToCaption: false as const,
    providerOrModelAuthorityGrantedToCaption: false as const,
    assetMutationAuthorityGrantedToCaption: false as const,
    finalQaApprovalAuthorityGrantedToCaption: false as const,
    creditOrBillingAuthorityGrantedToCaption: false as const,
    publicDeliveryAuthorityGrantedToCaption: false as const,
    productionAuthorityGrantedToCaption: false as const,
  }
}

const waiting = await campaignController.reconcileCampaign(campaignInput())
check(waiting.disposition === 'waiting_for_complete_approved_runs'
  && waiting.runOutcomes.length === 2
  && waiting.runOutcomes.every((run) =>
    run.inspectionLane === 'uploaded_source'
    && run.inspectionRequestRef.version ===
      'canonical-caption-real-source-inspection-projection-request-v1')
  && waiting.missingRunRequestRefs.length === 2
  && !waiting.everyDeclaredRunReconciled
  && !waiting.catalogAssemblyAndReleaseAttempted
  && qualificationCalls === 0,
'The V2 campaign must reconcile legacy uploaded-source runs through the '
  + 'additive controller and wait without fabricating terminal evidence.')
check(parseCanonicalCaptionPrivateQualificationCampaignOutcomeV2(waiting)
  .outcomeDigestSha256 === waiting.outcomeDigestSha256,
'The mixed-lane campaign outcome must remain closed and digest-verifiable.')
const replay = await campaignController.reconcileCampaign(campaignInput())
check(replay.outcomeDigestSha256 === waiting.outcomeDigestSha256,
'The campaign V2 waiting state must replay deterministically.')

const tamperedLane = structuredClone(waiting) as unknown as
  Record<string, unknown>
const tamperedRuns = tamperedLane.runOutcomes as Array<Record<string, unknown>>
tamperedRuns[0]!.inspectionLane = 'broll_owner'
tamperedLane.outcomeDigestSha256 = calculateSkillContractDigest(
  tamperedLane, 'outcomeDigestSha256')
assert.throws(() => parseCanonicalCaptionPrivateQualificationCampaignOutcomeV2(
  tamperedLane))
checks += 1

const duplicateSnapshotRuns = [
  runInput(3),
  runInput(4, ref('caption-campaign-v2-snapshot-3',
    'private-edit-authority-snapshot-v1')),
]
const duplicateSnapshotCatalog =
  createCanonicalCaptionPrivateQualificationCatalogRequest({
    ...structuredClone(catalogRequest),
    requestId: 'caption-campaign-v2-duplicate-snapshot-catalog',
    runEvidenceRequestRefs: duplicateSnapshotRuns.map((run) => ({
      id: run.qualificationRequest.requestId,
      version: run.qualificationRequest.schemaVersion,
      contentHash: run.qualificationRequest.requestDigestSha256,
    })).sort((left, right) => refKey(left).localeCompare(refKey(right))),
  })
await assert.rejects(() => campaignController.reconcileCampaign({
  ...campaignInput(duplicateSnapshotRuns),
  catalogRequest: duplicateSnapshotCatalog,
}), /run catalog/u)
checks += 1

assert.throws(() =>
  createCanonicalCaptionPrivateQualificationCampaignControllerV2({
    approvedRunController: { ...approvedRunController },
    qualificationService,
  }))
checks += 1

console.log(JSON.stringify({
  smoke: 'canonical-caption-private-qualification-campaign-v2',
  status: 'passed',
  checks,
  approvedRuns: runs.length,
  supportedInspectionLanes: approvedRunController.supportedInspectionLanes,
  mixedInspectionLanesAllowed: true,
  catalogCoverageFabricated: false,
  centralOrchestraImplemented: false,
  providerOrModelCallMade: false,
  publicOrProductionAuthorityGranted: false,
}, null, 2))

function refKey(value: CaptionDomainRef): string {
  return `${value.id}|${value.version}|${value.contentHash}`
}
