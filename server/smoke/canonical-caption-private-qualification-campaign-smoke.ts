import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import type {
  CanonicalCaptionPrivateInternalQualificationService,
} from '../../src/types/canonical-caption-private-internal-qualification'
import type {
  CanonicalCaptionPrivateQualificationRunController,
  CanonicalCaptionPrivateQualificationRunControllerInput,
} from '../../src/types/canonical-caption-private-qualification-run-controller'
import { CAPTIONS_SUPPORTED_JOB_TYPES } from
  '../../src/types/captions-specialist'
import {
  CAPTION_CURRENT_JOB_READINESS_LEDGER_V2,
} from '../captions-specialist/caption-current-job-readiness'
import {
  CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT,
} from '../captions-specialist/captions-specialist-integration-qualification'
import {
  calculateSkillContractDigest,
} from '../orchestra/orchestra-skill-contracts'
import {
  createCanonicalCaptionPrivateQualificationCampaignController,
  parseCanonicalCaptionPrivateQualificationCampaignOutcome,
} from '../services/canonical-caption-private-qualification-campaign-service'
import {
  createCanonicalCaptionPrivateQualificationCatalogRequest,
} from '../services/canonical-caption-private-qualification-catalog-service'
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

const ownerUserId = 'caption-campaign-owner'
const workspaceId = 'caption-campaign-workspace'
const projectId = 'caption-campaign-project'
const planningQualificationRef: CaptionDomainRef = {
  id: CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT.snapshotId,
  version:
    CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT.schemaVersion,
  contentHash:
    CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT
      .snapshotDigestSha256,
}

function hash(label: string): string {
  return createHash('sha256').update(label, 'utf8').digest('hex')
}

function ref(id: string, version = 'caption-campaign-fixture-v1'):
CaptionDomainRef {
  return { id, version, contentHash: hash(`${id}:${version}`) }
}

function runInput(index: number):
CanonicalCaptionPrivateQualificationRunControllerInput {
  const editSessionId = `caption-campaign-edit-${index}`
  const outputId = `caption-campaign-output-${index}`
  const approvedSnapshotRef = ref(`caption-campaign-snapshot-${index}`,
    'private-edit-authority-snapshot-v1')
  const executionPackageRef = ref(`caption-campaign-package-${index}`,
    'canonical-edit-execution-package-v1')
  const confirmedOutputFrameRef = ref(
    `caption-campaign-frame-${index}`,
    'confirmed-output-frame-v1')
  const renderedArtifactRef = ref(`caption-campaign-render-${index}`,
    'private-caption-render-v1')
  const deterministicQaRef = ref(`caption-campaign-render-qa-${index}`,
    'private-caption-render-qa-v1')
  const receiptRef = ref(`caption-campaign-inspection-${index}`,
    'caption-real-source-complete-time-direct-inspection-v1')
  const canonicalScope = {
    ownerUserId,
    workspaceId,
    projectId,
    editSessionId,
    planVersionId: `caption-campaign-plan-${index}.v1`,
    approvedSnapshotRef,
    executionPackageRef,
    outputId,
  }
  return {
    inspectionRequest:
      createCanonicalCaptionRealSourceInspectionProjectionRequest({
        requestId: `caption-campaign-inspection-request-${index}`,
        receiptKind: 'vertical_complete_time_v1',
        receiptRef,
        variant: 'vertical_full_motion',
        canonicalScope,
        confirmedOutputFrameRef,
        renderedArtifactRef,
        deterministicQaRef,
        expectedOriginalSourceRef: ref(`caption-campaign-source-${index}`,
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
        requestId: `caption-campaign-qualification-request-${index}`,
        canonicalScope: {
          ownerUserId,
          workspaceId,
          projectId,
          editSessionId,
          planVersionId: canonicalScope.planVersionId,
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

const runs = [runInput(1), runInput(2)]
function qualificationRequestRef(
  run: CanonicalCaptionPrivateQualificationRunControllerInput,
): CaptionDomainRef {
  return {
    id: run.qualificationRequest.requestId,
    version: run.qualificationRequest.schemaVersion,
    contentHash: run.qualificationRequest.requestDigestSha256,
  }
}

const catalogRequest =
  createCanonicalCaptionPrivateQualificationCatalogRequest({
    requestId: 'caption-campaign-catalog-request',
    qualificationScope: {
      ownerUserId,
      workspaceId,
      suiteId: 'caption-campaign-private-internal-suite',
    },
    sourcePlanningQualificationSnapshotRef: planningQualificationRef,
    runEvidenceRequestRefs: runs.map(qualificationRequestRef),
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

function fakeRunController(
  recordedRequestIds: ReadonlySet<string>,
): CanonicalCaptionPrivateQualificationRunController {
  return {
    schemaVersion: 'canonical-caption-private-qualification-run-controller-v1',
    closedCaptionDirectInspectionReceiptRequired: true,
    exactApprovedRunRereadRequired: true,
    incompleteRunPromotionAllowed: false,
    async reconcileApprovedRun(input) {
      const recorded = recordedRequestIds.has(
        input.qualificationRequest.requestId)
      const withoutDigest = {
        schemaVersion:
          'canonical-caption-private-qualification-run-outcome-v1' as const,
        disposition: recorded
          ? 'approved_run_recorded' as const
          : 'inspection_projected_waiting_for_complete_run' as const,
        inspectionEvidenceRef: ref(
          `caption-campaign-projected-inspection-${
            input.qualificationRequest.requestId}`,
          'canonical-caption-direct-visual-inspection-evidence-v1'),
        qualificationRunEvidenceRef: recorded ? ref(
          `caption-campaign-run-evidence-${
            input.qualificationRequest.requestId}`,
          'canonical-caption-qualification-run-evidence-v2') : null,
      }
      return {
        ...withoutDigest,
        outcomeDigestSha256: calculateSkillContractDigest({
          ...withoutDigest,
          outcomeDigestSha256: '',
        }, 'outcomeDigestSha256'),
      } as unknown as Awaited<ReturnType<
        CanonicalCaptionPrivateQualificationRunController[
          'reconcileApprovedRun']>>
    },
  }
}

const qualificationState = { calls: 0 }
function qualificationCallCount(): number {
  return qualificationState.calls
}
const waitingQualificationService = {
  schemaVersion: 'canonical-caption-private-internal-qualification-service-v1',
  async qualifyPrivateInternal(request) {
    qualificationState.calls += 1
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

function campaignInput(approvedRuns = runs) {
  return {
    catalogRequest,
    approvedRuns,
    exactCatalogRunSetRequired: true as const,
    multipleApprovedSnapshotsRequired: true as const,
    oneAllFeatureEditFabricated: false as const,
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

const partiallyRecorded =
  createCanonicalCaptionPrivateQualificationCampaignController({
    approvedRunController: fakeRunController(new Set([
      runs[0]!.qualificationRequest.requestId,
    ])),
    qualificationService: waitingQualificationService,
  })
const waiting = await partiallyRecorded.reconcileCampaign(campaignInput())
check(waiting.disposition === 'waiting_for_complete_approved_runs'
  && waiting.runOutcomes.length === 2
  && waiting.missingRunRequestRefs.length === 1
  && !waiting.everyDeclaredRunReconciled
  && !waiting.catalogAssemblyAndReleaseAttempted
  && waiting.qualificationRecord === null
  && qualificationCallCount() === 0,
'The campaign must reconcile every declared run and wait before catalog release.')
check(parseCanonicalCaptionPrivateQualificationCampaignOutcome(waiting)
  .outcomeDigestSha256 === waiting.outcomeDigestSha256,
'The waiting campaign outcome must be closed and digest-verifiable.')

const allRecorded =
  createCanonicalCaptionPrivateQualificationCampaignController({
    approvedRunController: fakeRunController(new Set(runs.map((run) =>
      run.qualificationRequest.requestId))),
    qualificationService: waitingQualificationService,
  })
const waitingCatalog = await allRecorded.reconcileCampaign(campaignInput())
check(waitingCatalog.disposition ===
  'waiting_for_complete_catalog_coverage'
  && waitingCatalog.missingRunRequestRefs.length === 0
  && waitingCatalog.everyDeclaredRunReconciled
  && waitingCatalog.catalogAssemblyAndReleaseAttempted
  && !waitingCatalog.qualificationRecordPersistedAndExactReread
  && qualificationCallCount() === 1,
'Recorded runs must advance to the catalog owner without fabricating coverage.')

const invalidQualificationState = {
  schemaVersion: 'canonical-caption-private-internal-qualification-service-v1',
  async qualifyPrivateInternal(request) {
    return {
      disposition: 'qualified_private_internal' as const,
      request,
      record: null,
      currentProductStatusChanged: false as const,
      centralOrchestraImplemented: false as const,
      publicOrProductionAuthorityGranted: false as const,
    }
  },
} satisfies CanonicalCaptionPrivateInternalQualificationService
const invalidQualificationController =
  createCanonicalCaptionPrivateQualificationCampaignController({
    approvedRunController: fakeRunController(new Set(runs.map((run) =>
      run.qualificationRequest.requestId))),
    qualificationService: invalidQualificationState,
  })
await assert.rejects(() => invalidQualificationController.reconcileCampaign(
  campaignInput()), /qualification service returned invalid state/u)
checks += 1

await assert.rejects(() => partiallyRecorded.reconcileCampaign(campaignInput([
  runs[0]!,
  {
    ...runs[1]!,
    qualificationRequest: runs[0]!.qualificationRequest,
  },
])), /run catalog/u)
checks += 1

const escalatedCampaign = structuredClone(campaignInput()) as unknown as
  Record<string, unknown>
escalatedCampaign.productionAuthorityGrantedToCaption = true
await assert.rejects(() => partiallyRecorded.reconcileCampaign(
  escalatedCampaign as unknown as ReturnType<typeof campaignInput>),
/Invalid literal value|expected false/iu)
checks += 1

assert.throws(() =>
  createCanonicalCaptionPrivateQualificationCampaignController({
    approvedRunController: {} as CanonicalCaptionPrivateQualificationRunController,
    qualificationService: waitingQualificationService,
  }), /dependencies are invalid/u)
checks += 1

console.log(JSON.stringify({
  smoke: 'canonical-caption-private-qualification-campaign',
  status: 'passed',
  checks,
  runs: 2,
  incompleteRunPromotionAllowed: false,
  catalogCoverageFabricated: false,
  centralOrchestraImplemented: false,
  publicOrProductionAuthorityGranted: false,
}, null, 2))
