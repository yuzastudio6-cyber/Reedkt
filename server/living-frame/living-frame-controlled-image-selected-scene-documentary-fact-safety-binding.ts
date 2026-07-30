import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import type {
  FactClaimStatus,
  FactSafetyPlanItem,
  FactSafetyVisualTreatment,
} from '../../src/types/reeditpro'
import type {
  LivingFrameSourceTruthMode,
} from '../../src/types/living-frame'
import {
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_DOCUMENTARY_FACT_SAFETY_BINDING_CLASS,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_DOCUMENTARY_FACT_SAFETY_BINDING_STATE,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_DOCUMENTARY_FACT_SAFETY_BINDING_VERSION,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_DOCUMENTARY_FACT_SAFETY_ISSUE_CODES,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_DOCUMENTARY_FACT_SAFETY_OPEN_GATES,
  type LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyAuthority,
  type LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBinding,
  type LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingDraft,
  type LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingResult,
  type LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingUnit,
  type LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyIssue,
  type LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyIssueCode,
  type LivingFrameSelectedSceneDocumentaryFactSafetyDisposition,
  type LivingFrameSelectedSceneDocumentaryFactSafetyPrivateBrief,
  type LivingFrameSelectedSceneDocumentaryFactSafetyPrivateBriefLease,
  type LivingFrameSelectedSceneDocumentaryFactSafetySeverity,
  type LivingFrameSelectedSceneDocumentaryFactSafetySnapshotPacket,
  type LivingFrameSelectedSceneDocumentaryFactSafetySnapshotReaderPort,
} from '../../src/types/living-frame-controlled-image-selected-scene-documentary-fact-safety-binding'
import type {
  LivingFrameControlledImageSelectedSceneRequestUnit,
} from '../../src/types/living-frame-controlled-image-selected-scene-request'
import {
  createLivingFrameControlledImageSelectedScenePrivatePromptReader,
  type LivingFrameControlledImageSelectedScenePrivatePromptPacket,
  type LivingFrameControlledImageSelectedScenePrivatePromptReaderPort,
} from './living-frame-controlled-image-selected-scene-private-prompt-materialization'
import {
  type CreateLivingFrameControlledImageSelectedSceneRequestInput,
  verifyLivingFrameControlledImageSelectedSceneRequest,
} from './living-frame-controlled-image-selected-scene-request'
import type {
  LivingFrameControlledImageSelectedSceneRequest,
} from '../../src/types/living-frame-controlled-image-selected-scene-request'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const MAX_FACT_SAFETY_TEXT_BYTES = 8_192
const EXACT_FACT_SAFETY_MODES =
  new Set<LivingFrameSourceTruthMode>([
    'exact_geography_verification_required',
    'exact_data_verification_required',
    'documentary_source_verification_required',
  ])
const CLAIM_STATUSES = new Set<FactClaimStatus>([
  'fictional',
  'verified_fact',
  'allegation',
  'charge',
  'claim_by_source',
  'opinion',
  'unknown',
])
const VISUAL_TREATMENTS =
  new Set<FactSafetyVisualTreatment>([
    'neutral_name_card',
    'evidence_board_card',
    'timeline_card',
    'document_card',
    'money_trail_graphic',
    'source_attribution_card',
    'generic_silhouette',
    'stylized_non_realistic_figure',
    'no_visual',
    'needs_user_confirmation',
  ])
const SEVERITY_RANK = {
  low: 1,
  medium: 2,
  high: 3,
  blocking: 4,
} as const

const AUTHORITY_BOUNDARY:
  LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyAuthority =
  deepFreeze({
    serverDerivedPrivateFactSafetyBindingAuthority: true,
    privateFactSafetyConstraintMergeAuthority: true,
    selectedSceneAuthority: false,
    documentaryFactAuthority: false,
    factVerificationAuthority: false,
    sourceTruthAuthority: false,
    promptAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    snapshotMutationAuthority: false,
    operationRegistryAuthority: false,
    providerAuthority: false,
    queueAuthority: false,
    dispatchAuthority: false,
    workerLeaseAuthority: false,
    runtimeAuthority: false,
    gpuAttemptAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    actualCostAuthority: false,
    customerPriceAuthority: false,
    customerCreditAuthority: false,
    workItemAuthority: false,
    workGraphMutationAuthority: false,
    artifactPersistenceAuthority: false,
    artifactQaAuthority: false,
    assetManifestAuthority: false,
    privateReviewAuthority: false,
    renderAuthority: false,
    finalCanvasAuthority: false,
    productionAuthority: false,
  })

const factSafetyReaders = new WeakSet<object>()
const factSafetyLeases = new WeakSet<object>()
const consumedFactSafetyLeases = new WeakSet<object>()
const privateBriefs = new WeakMap<
  object,
  LivingFrameSelectedSceneDocumentaryFactSafetyPrivateBrief
>()

export interface CreateLivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingInput {
  readonly bindingId: string
  readonly serverOwnedFactSafetyLocatorId: string
  readonly selectedSceneRequest:
    LivingFrameControlledImageSelectedSceneRequest
  readonly selectedSceneRequestInput:
    CreateLivingFrameControlledImageSelectedSceneRequestInput
  readonly reader:
    LivingFrameSelectedSceneDocumentaryFactSafetySnapshotReaderPort
}

export class LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingError
  extends Error {
  readonly issues:
    readonly LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyIssue[]

  constructor(
    issues:
      readonly LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyIssue[],
  ) {
    super(
      'Living Frame selected-scene documentary fact-safety binding failed.',
    )
    this.name =
      'LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingError'
    this.issues = issues
  }
}

export function createLivingFrameSelectedSceneDocumentaryFactSafetySnapshotReader(
  readCurrentByServerOwnedLocator:
    LivingFrameSelectedSceneDocumentaryFactSafetySnapshotReaderPort[
      'readCurrentByServerOwnedLocator'
    ],
): LivingFrameSelectedSceneDocumentaryFactSafetySnapshotReaderPort {
  if (typeof readCurrentByServerOwnedLocator !== 'function') {
    throw invalid('reader_invalid', '$.reader')
  }
  const reader:
    LivingFrameSelectedSceneDocumentaryFactSafetySnapshotReaderPort =
    Object.freeze({
      readerClass:
        'process_bound_server_owned_approved_snapshot_documentary_fact_safety_reader_v1',
      sourceAuthority:
        'current_immutable_approved_snapshot_documentary_fact_safety_repository',
      callerPacketAccepted: false,
      callerPlanAccepted: false,
      callerClaimBindingAccepted: false,
      factVerificationAuthority: false,
      approvalAuthority: false,
      snapshotMutationAuthority: false,
      promptAuthority: false,
      dispatchAuthority: false,
      runtimeAuthority: false,
      productionReady: false,
      readCurrentByServerOwnedLocator:
        readCurrentByServerOwnedLocator.bind(undefined),
    })
  factSafetyReaders.add(reader)
  return reader
}

export async function compileLivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBinding(
  input:
    CreateLivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingInput,
): Promise<
  LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingResult
> {
  assertInput(input)
  if (!verifyLivingFrameControlledImageSelectedSceneRequest(
    input.selectedSceneRequest,
    input.selectedSceneRequestInput,
  )) {
    throw invalid(
      'selected_scene_request_invalid',
      '$.selectedSceneRequest',
    )
  }
  let rawPacket: unknown
  try {
    rawPacket =
      await input.reader.readCurrentByServerOwnedLocator(
        input.serverOwnedFactSafetyLocatorId,
      )
  } catch {
    throw invalid('reader_failed', '$.reader')
  }
  const packet = assertSnapshotPacket(rawPacket)
  const request = input.selectedSceneRequest
  const selectedComponent =
    input.selectedSceneRequestInput.publication.binding
      .selectedComponent
  const selectedScene =
    selectedComponent.scenePlans.find(
      (scene) =>
        scene.sceneId === request.canonicalScope.sceneId,
    )
  if (!selectedScene) {
    throw invalid(
      'selected_scene_mismatch',
      '$.selectedSceneRequest.canonicalScope.sceneId',
    )
  }
  assertPacketLineage({
    packet,
    request,
    selectedSceneBindingDigestSha256:
      input.selectedSceneRequestInput.publication.binding
        .bindingDigestSha256,
  })
  const expectedFactSafetyExpectationRefIds =
    selectedComponent.inputBindings.factSafetyRefs
      .map((reference) => reference.expectationRefId)
      .sort()
  const matchingSceneBindings =
    packet.sceneClaimBindings.filter(
      (binding) => binding.sceneId === selectedScene.sceneId,
    )
  if (matchingSceneBindings.length !== 1) {
    throw invalid(
      'selected_scene_mismatch',
      '$.snapshotPacket.sceneClaimBindings',
    )
  }
  const sceneClaimBinding = matchingSceneBindings[0]!
  if (
    sceneClaimBinding.sourceTruthMode !==
      request.selectedSceneSummary.sourceTruthMode
    || !sameStrings(
      sceneClaimBinding.factSafetyExpectationRefIds,
      expectedFactSafetyExpectationRefIds,
    )
  ) {
    throw invalid(
      sceneClaimBinding.sourceTruthMode !==
          request.selectedSceneSummary.sourceTruthMode
        ? 'source_truth_mismatch'
        : 'fact_safety_expectation_mismatch',
      '$.snapshotPacket.sceneClaimBindings',
    )
  }
  const claimItems = resolveClaims(
    packet,
    sceneClaimBinding.claimItemIds,
    expectedFactSafetyExpectationRefIds,
    request.selectedSceneSummary.sourceTruthMode,
  )
  const disposition = dispositionFor(
    request.selectedSceneSummary.sourceTruthMode,
  )
  assertClaimsResolved({
    claimItems,
    sourceTruthMode:
      request.selectedSceneSummary.sourceTruthMode,
    factSafetyExpectationRefCount:
      expectedFactSafetyExpectationRefIds.length,
    planActive:
      packet.documentaryFactSafetyPlan.active,
  })

  const compiled = request.requestUnits.map(
    (requestUnit, order) =>
      compileBindingUnit({
        requestUnit,
        order,
        sourceTruthMode:
          request.selectedSceneSummary.sourceTruthMode,
        disposition,
        claimItems,
        factSafetyExpectationRefCount:
          expectedFactSafetyExpectationRefIds.length,
      }),
  )
  const bindingUnits = compiled.map((entry) => entry.unit)
  const claimBindingDigestSha256 =
    digest(sceneClaimBinding)
  const planDigestSha256 =
    digest(packet.documentaryFactSafetyPlan)
  const draft:
    LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingDraft =
    {
      contractVersion:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_DOCUMENTARY_FACT_SAFETY_BINDING_VERSION,
      resultClass:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_DOCUMENTARY_FACT_SAFETY_BINDING_CLASS,
      bindingState:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_DOCUMENTARY_FACT_SAFETY_BINDING_STATE,
      bindingId: input.bindingId,
      canonicalScope: {
        ...request.canonicalScope,
      },
      sourceBindings: {
        selectedSceneRequestBindingDigestSha256:
          request.requestBindingDigestSha256,
        selectedSceneBindingDigestSha256:
          request.sourceBindings
            .selectedSceneBindingDigestSha256,
        approvedSnapshotId:
          request.sourceBindings.approvedSnapshotId,
        approvedSnapshotHashSha256:
          request.sourceBindings.approvedSnapshotHashSha256,
        snapshotFactSafetyPacketDigestSha256:
          packet.packetDigestSha256,
        documentaryFactSafetyPlanDigestSha256:
          planDigestSha256,
        selectedSceneClaimBindingDigestSha256:
          claimBindingDigestSha256,
      },
      factSafetyPlanSummary: {
        planId: packet.documentaryFactSafetyPlan.id,
        active: packet.documentaryFactSafetyPlan.active,
        totalClaimCount:
          packet.documentaryFactSafetyPlan.claimItems.length,
        selectedSceneBoundClaimCount: claimItems.length,
        selectedSceneFactSafetyExpectationRefCount:
          expectedFactSafetyExpectationRefIds.length,
        blockingClaimCount: 0,
        unresolvedSourceRequiredClaimCount: 0,
        rawPlanIncludedInReceipt: false,
        rawClaimTextIncludedInReceipt: false,
        rawSafeWordingIncludedInReceipt: false,
        rawSourceLabelIncludedInReceipt: false,
      },
      bindingUnits,
      metrics: {
        bindingUnitCount: bindingUnits.length,
        verifiedOrAttributedGuardUnitCount:
          countDisposition(
            bindingUnits,
            'approved_verified_or_attributed_claim_guard',
          ),
        illustrativeGuardUnitCount:
          countDisposition(
            bindingUnits,
            'approved_illustrative_interpretation_guard',
          ),
        fictionalGuardUnitCount:
          countDisposition(
            bindingUnits,
            'approved_fictional_or_stylized_guard',
          ),
        totalBoundClaimCount:
          bindingUnits.reduce(
            (sum, unit) => sum + unit.boundClaimCount,
            0,
          ),
        sourceResolvedClaimCount:
          bindingUnits.reduce(
            (sum, unit) =>
              sum + unit.sourceResolvedClaimCount,
            0,
          ),
      },
      openGateCodes:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_DOCUMENTARY_FACT_SAFETY_OPEN_GATES,
      authorityBoundary: AUTHORITY_BOUNDARY,
      selectedSceneRequestRevalidated: true,
      immutableApprovedSnapshotFactSafetyPacketRevalidated:
        true,
      exactSceneFactSafetyExpectationAndClaimBindingRevalidated:
        true,
      sourceTruthDispositionRevalidated: true,
      documentaryFactSafetyPlanCopiedIntoReceipt: false,
      documentaryFactsVerifiedByThisBinding: false,
      rawClaimTextPassedToImageGenerator: false,
      promptPacketMerged: false,
      operationRegistered: false,
      dispatchGranted: false,
      workerLeaseCreated: false,
      runtimeExecuted: false,
      gpuAttemptCreated: false,
      actualCostReceiptCreated: false,
      artifactPersisted: false,
      assetManifestMutated: false,
      artifactQaExecuted: false,
      privateReviewApproved: false,
      renderAuthorized: false,
      finalCanvasCreatedByComfyUi: false,
      containsBytesPathUrlCredentialPromptSeedDimensionModelCommandOrEnvironment:
        false,
      containsPriceCreditServiceFeeReservationWalletOrLedgerData:
        false,
      productionReady: false,
    }
  assertReceipt(draft, compiled.map((entry) => entry.brief))
  const receipt = deepFreeze({
    ...draft,
    bindingDigestSha256: digest(draft),
  } satisfies
    LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBinding)
  const privateFactSafetyBriefLeases =
    compiled.map(({ leaseDraft, brief }) => {
      const lease = deepFreeze({
        ...leaseDraft,
        bindingDigestSha256:
          receipt.bindingDigestSha256,
      } satisfies
        LivingFrameSelectedSceneDocumentaryFactSafetyPrivateBriefLease)
      factSafetyLeases.add(lease)
      privateBriefs.set(lease, brief)
      return lease
    })
  return deepFreeze({
    receipt,
    privateFactSafetyBriefLeases,
  })
}

export function verifyLivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBinding(
  value: unknown,
  input:
    CreateLivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingInput,
): Promise<boolean> {
  return verifyBinding(value, input)
}

export function consumeLivingFrameSelectedSceneDocumentaryFactSafetyPrivateBriefLease(
  lease:
    LivingFrameSelectedSceneDocumentaryFactSafetyPrivateBriefLease,
): LivingFrameSelectedSceneDocumentaryFactSafetyPrivateBrief {
  if (
    !factSafetyLeases.has(lease)
    || consumedFactSafetyLeases.has(lease)
    || lease.leaseClass !==
      'process_bound_single_use_selected_scene_documentary_fact_safety_brief_lease_v1'
    || !SHA256.test(lease.bindingDigestSha256)
    || lease.callerSerializable !== false
    || lease.promptMergeAuthority !== false
    || lease.factVerificationAuthority !== false
    || lease.dispatchAuthority !== false
    || lease.runtimeAuthority !== false
    || lease.productionReady !== false
  ) {
    throw invalid(
      consumedFactSafetyLeases.has(lease)
        ? 'lease_reused'
        : 'lease_invalid',
      '$.lease',
    )
  }
  const brief = privateBriefs.get(lease)
  if (!brief) throw invalid('lease_invalid', '$.lease')
  consumedFactSafetyLeases.add(lease)
  privateBriefs.delete(lease)
  return brief
}

export function createLivingFrameSelectedSceneDocumentaryFactSafePrivatePromptReader(
  input: {
    readonly factSafetyBinding:
      LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBinding
    readonly privateFactSafetyBriefLeases:
      readonly LivingFrameSelectedSceneDocumentaryFactSafetyPrivateBriefLease[]
    readonly baseReader:
      LivingFrameControlledImageSelectedScenePrivatePromptReaderPort
  },
): LivingFrameControlledImageSelectedScenePrivatePromptReaderPort {
  assertFactSafeReaderInput(input)
  return createLivingFrameControlledImageSelectedScenePrivatePromptReader(
    async (serverOwnedMaterializationLocatorId) => {
      let raw: unknown
      try {
        raw = await input.baseReader
          .readCurrentByServerOwnedLocator(
            serverOwnedMaterializationLocatorId,
          )
      } catch {
        throw invalid('reader_failed', '$.baseReader')
      }
      return mergeFactSafetyIntoPrivatePromptPacket({
        raw,
        factSafetyBinding: input.factSafetyBinding,
        privateFactSafetyBriefLeases:
          input.privateFactSafetyBriefLeases,
      })
    },
  )
}

async function verifyBinding(
  value: unknown,
  input:
    CreateLivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingInput,
): Promise<boolean> {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'contractVersion',
      'resultClass',
      'bindingState',
      'bindingId',
      'canonicalScope',
      'sourceBindings',
      'factSafetyPlanSummary',
      'bindingUnits',
      'metrics',
      'openGateCodes',
      'authorityBoundary',
      'selectedSceneRequestRevalidated',
      'immutableApprovedSnapshotFactSafetyPacketRevalidated',
      'exactSceneFactSafetyExpectationAndClaimBindingRevalidated',
      'sourceTruthDispositionRevalidated',
      'documentaryFactSafetyPlanCopiedIntoReceipt',
      'documentaryFactsVerifiedByThisBinding',
      'rawClaimTextPassedToImageGenerator',
      'promptPacketMerged',
      'operationRegistered',
      'dispatchGranted',
      'workerLeaseCreated',
      'runtimeExecuted',
      'gpuAttemptCreated',
      'actualCostReceiptCreated',
      'artifactPersisted',
      'assetManifestMutated',
      'artifactQaExecuted',
      'privateReviewApproved',
      'renderAuthorized',
      'finalCanvasCreatedByComfyUi',
      'containsBytesPathUrlCredentialPromptSeedDimensionModelCommandOrEnvironment',
      'containsPriceCreditServiceFeeReservationWalletOrLedgerData',
      'productionReady',
      'bindingDigestSha256',
    ])
    || value.contractVersion !==
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_DOCUMENTARY_FACT_SAFETY_BINDING_VERSION
    || value.resultClass !==
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_DOCUMENTARY_FACT_SAFETY_BINDING_CLASS
    || value.bindingState !==
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_DOCUMENTARY_FACT_SAFETY_BINDING_STATE
    || !SHA256.test(String(value.bindingDigestSha256))
    || value.bindingDigestSha256 !==
      digest(withoutDigest(value))
  ) return false
  try {
    const recompilation =
      await compileLivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBinding(
        input,
      )
    return stableAuthorityStringify(
      recompilation.receipt,
    ) === stableAuthorityStringify(value)
  } catch {
    return false
  }
}

function assertInput(
  input:
    CreateLivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'bindingId',
      'serverOwnedFactSafetyLocatorId',
      'selectedSceneRequest',
      'selectedSceneRequestInput',
      'reader',
    ])
    || !SAFE_ID.test(String(input.bindingId))
    || !SAFE_ID.test(
      String(input.serverOwnedFactSafetyLocatorId),
    )
    || !isFactSafetyReader(input.reader)
  ) {
    throw invalid('input_invalid', '$')
  }
}

function isFactSafetyReader(
  value: unknown,
): value is
  LivingFrameSelectedSceneDocumentaryFactSafetySnapshotReaderPort {
  if (
    !isRecord(value)
    || !factSafetyReaders.has(value)
    || !hasExactKeys(value, [
      'readerClass',
      'sourceAuthority',
      'callerPacketAccepted',
      'callerPlanAccepted',
      'callerClaimBindingAccepted',
      'factVerificationAuthority',
      'approvalAuthority',
      'snapshotMutationAuthority',
      'promptAuthority',
      'dispatchAuthority',
      'runtimeAuthority',
      'productionReady',
      'readCurrentByServerOwnedLocator',
    ])
  ) return false
  return value.readerClass ===
      'process_bound_server_owned_approved_snapshot_documentary_fact_safety_reader_v1'
    && value.sourceAuthority ===
      'current_immutable_approved_snapshot_documentary_fact_safety_repository'
    && value.callerPacketAccepted === false
    && value.callerPlanAccepted === false
    && value.callerClaimBindingAccepted === false
    && value.factVerificationAuthority === false
    && value.approvalAuthority === false
    && value.snapshotMutationAuthority === false
    && value.promptAuthority === false
    && value.dispatchAuthority === false
    && value.runtimeAuthority === false
    && value.productionReady === false
    && typeof value.readCurrentByServerOwnedLocator ===
      'function'
}

function assertSnapshotPacket(
  value: unknown,
): LivingFrameSelectedSceneDocumentaryFactSafetySnapshotPacket {
  if (!isSnapshotPacket(value)) {
    throw invalid(
      'snapshot_packet_invalid',
      '$.snapshotPacket',
    )
  }
  const {
    packetDigestSha256,
    ...draft
  } = value
  if (
    packetDigestSha256 !== digest(draft)
    || value.callerSuppliedPacket !== false
    || value
      .packetContainsProviderPromptModelPathUrlBytesCredentialCommandOrEnvironment !==
        false
    || value.factVerificationAuthority !== false
    || value.approvalAuthority !== false
    || value.snapshotMutationAuthority !== false
    || value.productionReady !== false
  ) {
    throw invalid(
      'snapshot_packet_invalid',
      '$.snapshotPacket',
    )
  }
  return value
}

function isSnapshotPacket(
  value: unknown,
): value is
  LivingFrameSelectedSceneDocumentaryFactSafetySnapshotPacket {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'packetVersion',
      'approvedSnapshotId',
      'approvedSnapshotHashSha256',
      'selectedSceneBindingDigestSha256',
      'documentaryFactSafetyPlan',
      'sceneClaimBindings',
      'callerSuppliedPacket',
      'packetContainsProviderPromptModelPathUrlBytesCredentialCommandOrEnvironment',
      'factVerificationAuthority',
      'approvalAuthority',
      'snapshotMutationAuthority',
      'productionReady',
      'packetDigestSha256',
    ])
    || value.packetVersion !==
      'canonical-approved-snapshot-documentary-fact-safety-packet-v1'
    || !SAFE_ID.test(String(value.approvedSnapshotId))
    || !SHA256.test(
      String(value.approvedSnapshotHashSha256),
    )
    || !SHA256.test(
      String(value.selectedSceneBindingDigestSha256),
    )
    || !SHA256.test(String(value.packetDigestSha256))
    || !isDocumentaryFactSafetyPlan(
      value.documentaryFactSafetyPlan,
    )
    || !Array.isArray(value.sceneClaimBindings)
    || value.sceneClaimBindings.length < 1
    || value.sceneClaimBindings.length > 64
  ) return false
  return value.sceneClaimBindings.every((binding) =>
    isSceneClaimBinding(binding))
}

function isDocumentaryFactSafetyPlan(
  value: unknown,
): value is
  LivingFrameSelectedSceneDocumentaryFactSafetySnapshotPacket[
    'documentaryFactSafetyPlan'
  ] {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'id',
      'active',
      'claimItems',
      'globalRules',
      'clarifyingQuestions',
      'qaChecks',
      'notes',
    ])
    || !SAFE_ID.test(String(value.id))
    || typeof value.active !== 'boolean'
    || !Array.isArray(value.claimItems)
    || value.claimItems.length > 64
    || !value.claimItems.every((item) =>
      isFactSafetyPlanItem(item))
    || !isStringArray(value.globalRules, 128)
    || !Array.isArray(value.clarifyingQuestions)
    || value.clarifyingQuestions.length > 64
    || !isStringArray(value.qaChecks, 128)
    || !isStringArray(value.notes, 128)
  ) return false
  if (
    !value.active
    && (
      value.claimItems.length !== 0
      || value.clarifyingQuestions.length !== 0
    )
  ) return false
  return new Set(
    value.claimItems.map((item) => item.id),
  ).size === value.claimItems.length
}

function isFactSafetyPlanItem(
  value: unknown,
): value is FactSafetyPlanItem {
  if (
    !isRecord(value)
    || Object.keys(value).length < 11
    || Object.keys(value).length > 13
    || ![
      'id',
      'claimText',
      'peopleMentioned',
      'organizationsMentioned',
      'claimStatus',
      'sourceNeeded',
      'safeWording',
      'visualTreatment',
      'avoidRules',
      'qaChecks',
      'severity',
    ].every((key) => key in value)
    || !SAFE_ID.test(String(value.id))
    || typeof value.claimText !== 'string'
    || value.claimText.length < 1
    || value.claimText.length > 8_192
    || !isStringArray(value.peopleMentioned, 64)
    || !isStringArray(value.organizationsMentioned, 64)
    || !CLAIM_STATUSES.has(
      value.claimStatus as FactClaimStatus,
    )
    || typeof value.sourceNeeded !== 'boolean'
    || (
      'sourceLabel' in value
      && value.sourceLabel !== undefined
      && (
        typeof value.sourceLabel !== 'string'
        || value.sourceLabel.trim().length < 1
        || value.sourceLabel.length > 2_048
      )
    )
    || typeof value.safeWording !== 'string'
    || value.safeWording.length < 1
    || value.safeWording.length > 8_192
    || !VISUAL_TREATMENTS.has(
      value.visualTreatment as
        FactSafetyVisualTreatment,
    )
    || !isStringArray(value.avoidRules, 128)
    || !isStringArray(value.qaChecks, 128)
    || ![
      'low',
      'medium',
      'high',
      'blocking',
    ].includes(String(value.severity))
    || (
      'clarifyingQuestion' in value
      && value.clarifyingQuestion !== undefined
      && !isClarifyingQuestion(
        value.clarifyingQuestion,
      )
    )
  ) return false
  return true
}

function isClarifyingQuestion(value: unknown): boolean {
  if (!isRecord(value)) return false
  const allowed = new Set([
    'id',
    'question',
    'reason',
    'priority',
    'blocksPlanning',
    'suggestedAnswers',
    'resolved',
    'answer',
  ])
  if (
    Object.keys(value).some((key) => !allowed.has(key))
  ) return false
  return typeof value.id === 'string'
    && typeof value.question === 'string'
    && typeof value.reason === 'string'
    && ['blocking', 'recommended', 'optional'].includes(
      String(value.priority),
    )
    && typeof value.blocksPlanning === 'boolean'
    && (
      value.suggestedAnswers === undefined
      || isStringArray(value.suggestedAnswers, 32)
    )
    && (
      value.resolved === undefined
      || typeof value.resolved === 'boolean'
    )
    && (
      value.answer === undefined
      || typeof value.answer === 'string'
    )
}

function isSceneClaimBinding(value: unknown): boolean {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'sceneId',
      'sourceTruthMode',
      'factSafetyExpectationRefIds',
      'claimItemIds',
      'bindingSource',
    ])
    || !SAFE_ID.test(String(value.sceneId))
    || !isSourceTruthMode(value.sourceTruthMode)
    || !isSafeUniqueIdArray(
      value.factSafetyExpectationRefIds,
      64,
    )
    || !isSafeUniqueIdArray(value.claimItemIds, 64)
    || value.bindingSource !==
      'canonical_approved_snapshot_scene_claim_binding'
  ) return false
  return true
}

function assertPacketLineage(input: {
  readonly packet:
    LivingFrameSelectedSceneDocumentaryFactSafetySnapshotPacket
  readonly request:
    LivingFrameControlledImageSelectedSceneRequest
  readonly selectedSceneBindingDigestSha256: string
}): void {
  const { packet, request } = input
  if (
    packet.approvedSnapshotId !==
      request.sourceBindings.approvedSnapshotId
    || packet.approvedSnapshotHashSha256 !==
      request.sourceBindings.approvedSnapshotHashSha256
  ) {
    throw invalid(
      'approved_snapshot_mismatch',
      '$.snapshotPacket',
    )
  }
  if (
    packet.selectedSceneBindingDigestSha256 !==
      request.sourceBindings.selectedSceneBindingDigestSha256
    || packet.selectedSceneBindingDigestSha256 !==
      input.selectedSceneBindingDigestSha256
  ) {
    throw invalid(
      'selected_scene_mismatch',
      '$.snapshotPacket.selectedSceneBindingDigestSha256',
    )
  }
}

function resolveClaims(
  packet:
    LivingFrameSelectedSceneDocumentaryFactSafetySnapshotPacket,
  claimItemIds: readonly string[],
  factSafetyExpectationRefIds: readonly string[],
  sourceTruthMode: LivingFrameSourceTruthMode,
): FactSafetyPlanItem[] {
  if (
    factSafetyExpectationRefIds.length === 0
    && claimItemIds.length !== 0
  ) {
    throw invalid(
      'fact_safety_expectation_mismatch',
      '$.snapshotPacket.sceneClaimBindings.claimItemIds',
    )
  }
  const claims = claimItemIds.map((claimItemId) => {
    const matches =
      packet.documentaryFactSafetyPlan.claimItems.filter(
        (claim) => claim.id === claimItemId,
      )
    if (matches.length !== 1) {
      throw invalid(
        'claim_binding_incomplete',
        '$.snapshotPacket.sceneClaimBindings.claimItemIds',
      )
    }
    return matches[0]!
  })
  if (
    (
      factSafetyExpectationRefIds.length > 0
      || EXACT_FACT_SAFETY_MODES.has(sourceTruthMode)
    )
    && claims.length < 1
  ) {
    throw invalid(
      'claim_binding_incomplete',
      '$.snapshotPacket.sceneClaimBindings.claimItemIds',
    )
  }
  return claims
}

function assertClaimsResolved(input: {
  readonly claimItems: readonly FactSafetyPlanItem[]
  readonly sourceTruthMode: LivingFrameSourceTruthMode
  readonly factSafetyExpectationRefCount: number
  readonly planActive: boolean
}): void {
  if (
    input.sourceTruthMode === 'unknown_blocked'
    || input.sourceTruthMode ===
      'controlled_source_expectation'
  ) {
    throw invalid(
      'source_truth_mismatch',
      '$.snapshotPacket.sceneClaimBindings.sourceTruthMode',
    )
  }
  if (
    (
      input.factSafetyExpectationRefCount > 0
      || EXACT_FACT_SAFETY_MODES.has(
        input.sourceTruthMode,
      )
    )
    && !input.planActive
  ) {
    throw invalid(
      'claim_binding_incomplete',
      '$.snapshotPacket.documentaryFactSafetyPlan.active',
    )
  }
  if (
    input.claimItems.some((claim) =>
      claim.severity === 'blocking'
      || claim.claimStatus === 'unknown'
      || claim.visualTreatment ===
        'needs_user_confirmation'
      || (
        claim.sourceNeeded
        && !hasResolvedSourceLabel(claim)
      )
      || (
        claim.clarifyingQuestion?.blocksPlanning === true
      )
      || (
        EXACT_FACT_SAFETY_MODES.has(
          input.sourceTruthMode,
        )
        && claim.claimStatus === 'fictional'
      ))
  ) {
    throw invalid(
      'blocking_claim_unresolved',
      '$.snapshotPacket.documentaryFactSafetyPlan.claimItems',
    )
  }
}

function compileBindingUnit(input: {
  readonly requestUnit:
    LivingFrameControlledImageSelectedSceneRequestUnit
  readonly order: number
  readonly sourceTruthMode: LivingFrameSourceTruthMode
  readonly disposition:
    LivingFrameSelectedSceneDocumentaryFactSafetyDisposition
  readonly claimItems: readonly FactSafetyPlanItem[]
  readonly factSafetyExpectationRefCount: number
}): {
  readonly unit:
    LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingUnit
  readonly leaseDraft:
    Omit<
      LivingFrameSelectedSceneDocumentaryFactSafetyPrivateBriefLease,
      'bindingDigestSha256'
    >
  readonly brief:
    LivingFrameSelectedSceneDocumentaryFactSafetyPrivateBrief
} {
  const claimStatusCodes = uniqueSorted(
    input.claimItems.map((claim) => claim.claimStatus),
  ) as FactClaimStatus[]
  const approvedVisualTreatmentCodes = uniqueSorted(
    input.claimItems.map((claim) =>
      claim.visualTreatment),
  ) as FactSafetyVisualTreatment[]
  const sourceRequiredClaimCount =
    input.claimItems.filter((claim) =>
      claim.sourceNeeded).length
  const sourceResolvedClaimCount =
    input.claimItems.filter((claim) =>
      claim.sourceNeeded
      && hasResolvedSourceLabel(claim)).length
  const highestSeverity =
    highestSeverityOf(input.claimItems)
  const bindingUnitId =
    `lf-selected-fact-safety-unit.${
      digest({
        requestUnitDigestSha256:
          input.requestUnit.requestUnitDigestSha256,
        disposition: input.disposition,
        claimStatusCodes,
        approvedVisualTreatmentCodes,
      }).slice(0, 40)
    }`
  const leaseId =
    `lf-selected-fact-safety-lease.${
      digest({
        bindingUnitId,
        requestUnitId: input.requestUnit.requestUnitId,
      }).slice(0, 40)
    }`
  const positiveFactSafetyConditioningText =
    buildPositiveFactSafetyConditioning({
      sourceTruthMode: input.sourceTruthMode,
      disposition: input.disposition,
      claimStatusCodes,
      approvedVisualTreatmentCodes,
    })
  const negativeFactSafetyConditioningText =
    buildNegativeFactSafetyConditioning({
      sourceTruthMode: input.sourceTruthMode,
      claimStatusCodes,
    })
  assertFactSafetyText(
    positiveFactSafetyConditioningText,
    '$.positiveFactSafetyConditioningText',
  )
  assertFactSafetyText(
    negativeFactSafetyConditioningText,
    '$.negativeFactSafetyConditioningText',
  )
  const brief = deepFreeze({
    bindingUnitId,
    requestUnitId: input.requestUnit.requestUnitId,
    sceneId: input.requestUnit.sceneId,
    componentId: input.requestUnit.componentId,
    outputKey: input.requestUnit.outputKey,
    approvedWorkItemId:
      input.requestUnit.approvedWorkItemId,
    approvedWorkItemKey:
      input.requestUnit.approvedWorkItemKey,
    approvedPlannedAssetManifestEntryId:
      input.requestUnit
        .approvedPlannedAssetManifestEntryId,
    serverOwnedConditioningLocatorId:
      input.requestUnit.serverOwnedConditioningLocatorId,
    sourceTruthMode: input.sourceTruthMode,
    disposition: input.disposition,
    claimStatusCodes,
    approvedVisualTreatmentCodes,
    positiveFactSafetyConditioningText,
    negativeFactSafetyConditioningText,
    rawClaimTextIncluded: false,
    rawSafeWordingIncluded: false,
    rawSourceLabelIncluded: false,
    authenticArchiveOrVerifiedEvidenceClaimAllowed: false,
    unsupportedSpecificActDepictionAllowed: false,
    finalTextOrSourceAttributionOwnedByImageGenerator:
      false,
  } satisfies
    LivingFrameSelectedSceneDocumentaryFactSafetyPrivateBrief)
  const unitDraft = {
    order: input.order,
    bindingUnitId,
    requestUnitId: input.requestUnit.requestUnitId,
    requestUnitDigestSha256:
      input.requestUnit.requestUnitDigestSha256,
    sceneId: input.requestUnit.sceneId,
    componentId: input.requestUnit.componentId,
    outputKey: input.requestUnit.outputKey,
    approvedWorkItemId:
      input.requestUnit.approvedWorkItemId,
    approvedWorkItemKey:
      input.requestUnit.approvedWorkItemKey,
    approvedPlannedAssetManifestEntryId:
      input.requestUnit
        .approvedPlannedAssetManifestEntryId,
    sourceTruthMode: input.sourceTruthMode,
    disposition: input.disposition,
    factSafetyExpectationRefCount:
      input.factSafetyExpectationRefCount,
    boundClaimCount: input.claimItems.length,
    sourceRequiredClaimCount,
    sourceResolvedClaimCount,
    highestSeverity,
    claimBindingDigestSha256:
      digest(input.claimItems.map((claim) => ({
        id: claim.id,
        claimStatus: claim.claimStatus,
        sourceNeeded: claim.sourceNeeded,
        sourceResolved: hasResolvedSourceLabel(claim),
        visualTreatment: claim.visualTreatment,
        severity: claim.severity,
      }))),
    approvedVisualTreatmentCodes,
    privateBriefReceipt: {
      leaseId,
      positiveFactSafetyConditioningDigestSha256:
        digest(positiveFactSafetyConditioningText),
      positiveFactSafetyConditioningByteLength:
        byteLength(positiveFactSafetyConditioningText),
      negativeFactSafetyConditioningDigestSha256:
        digest(negativeFactSafetyConditioningText),
      negativeFactSafetyConditioningByteLength:
        byteLength(negativeFactSafetyConditioningText),
      rawClaimTextIncludedInReceipt: false,
      rawSafeWordingIncludedInReceipt: false,
      rawSourceLabelIncludedInReceipt: false,
      rawFactSafetyPlanIncludedInReceipt: false,
      privateBytesPathUrlCredentialPromptSeedDimensionModelCommandOrEnvironmentIncludedInReceipt:
        false,
      leaseConsumed: false,
    },
    authenticArchiveOrVerifiedEvidenceClaimAllowed: false,
    unsupportedSpecificActDepictionAllowed: false,
    promptPacketMerged: false,
    documentaryFactsVerifiedByThisBinding: false,
  } as const
  const unit = deepFreeze({
    ...unitDraft,
    bindingUnitDigestSha256: digest(unitDraft),
  } satisfies
    LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingUnit)
  return {
    unit,
    leaseDraft: {
      leaseClass:
        'process_bound_single_use_selected_scene_documentary_fact_safety_brief_lease_v1',
      leaseId,
      bindingUnitId,
      requestUnitId: input.requestUnit.requestUnitId,
      callerSerializable: false,
      promptMergeAuthority: false,
      factVerificationAuthority: false,
      dispatchAuthority: false,
      runtimeAuthority: false,
      productionReady: false,
    },
    brief,
  }
}

function dispositionFor(
  sourceTruthMode: LivingFrameSourceTruthMode,
): LivingFrameSelectedSceneDocumentaryFactSafetyDisposition {
  if (EXACT_FACT_SAFETY_MODES.has(sourceTruthMode)) {
    return 'approved_verified_or_attributed_claim_guard'
  }
  if (
    sourceTruthMode ===
      'canonical_illustrative_interpretation'
  ) {
    return 'approved_illustrative_interpretation_guard'
  }
  if (sourceTruthMode === 'fictional_or_stylized') {
    return 'approved_fictional_or_stylized_guard'
  }
  throw invalid(
    'source_truth_mismatch',
    '$.sourceTruthMode',
  )
}

function buildPositiveFactSafetyConditioning(input: {
  readonly sourceTruthMode: LivingFrameSourceTruthMode
  readonly disposition:
    LivingFrameSelectedSceneDocumentaryFactSafetyDisposition
  readonly claimStatusCodes: readonly FactClaimStatus[]
  readonly approvedVisualTreatmentCodes:
    readonly FactSafetyVisualTreatment[]
}): string {
  const parts = [
    'Documentary fact-safety constraint: create an illustrative still source only, never authentic archive, verified evidence, or a factual record.',
    'Do not invent, strengthen, or visually prove any claim; downstream canonical text, labels, citations, maps, data, and source attribution remain separate.',
    'Do not depict a real or named person performing an unsupported specific act, suffering invented injury, admitting guilt, or appearing in fabricated evidence.',
  ]
  if (
    input.disposition ===
      'approved_verified_or_attributed_claim_guard'
  ) {
    parts.push(
      'Use only neutral context consistent with the approved verified-or-attributed claim status; exact geography, data, documents, quotations, dates, insignia, and events remain deterministic or evidence-bound downstream.',
    )
  } else if (
    input.disposition ===
      'approved_illustrative_interpretation_guard'
  ) {
    parts.push(
      'Use a clearly stylized canonical illustrative interpretation, preserve narrative restraint, and avoid implying verified likeness, documented action, or witnessed historical reconstruction.',
    )
  } else {
    parts.push(
      'Keep the scene visibly fictional or stylized and avoid presenting invented action as documentary reconstruction.',
    )
  }
  if (
    input.claimStatusCodes.some((status) =>
      status === 'allegation'
      || status === 'charge'
      || status === 'claim_by_source')
  ) {
    parts.push(
      'Use neutral, non-guilt-implying visual treatment; do not stage the alleged or attributed act.',
    )
  }
  if (input.claimStatusCodes.includes('opinion')) {
    parts.push(
      'Treat opinion as interpretation rather than proof.',
    )
  }
  if (input.approvedVisualTreatmentCodes.length > 0) {
    parts.push(
      `Approved downstream visual-treatment classes only: ${
        input.approvedVisualTreatmentCodes.join(', ')
      }. The image generator must not render their text or labels.`,
    )
  }
  if (
    input.sourceTruthMode ===
      'exact_geography_verification_required'
  ) {
    parts.push(
      'Generated scenery may provide atmosphere only; exact geography belongs to the canonical map owner.',
    )
  } else if (
    input.sourceTruthMode ===
      'exact_data_verification_required'
  ) {
    parts.push(
      'Generated scenery may provide atmosphere only; exact values and proportions belong to the canonical data-visualization owner.',
    )
  }
  return parts.join(' ')
}

function buildNegativeFactSafetyConditioning(input: {
  readonly sourceTruthMode: LivingFrameSourceTruthMode
  readonly claimStatusCodes: readonly FactClaimStatus[]
}): string {
  const parts = [
    'no authentic archive claim',
    'no verified-evidence claim',
    'no fake document, quotation, citation, headline, source label, date, map label, chart value, insignia, seal, screenshot, mugshot, or police record',
    'no depiction of a named person committing an unsupported act',
    'no guilt symbolism, demonizing treatment, fabricated injury, invented victim, fake arrest, handcuffs, jail bars, blood, decapitation, or staged criminal act',
    'no unapproved likeness reconstruction, FaceID, InsightFace, or identity-match claim',
    'no text, captions, labels, attribution, watermark, signature, or final evidence card',
  ]
  if (
    input.claimStatusCodes.some((status) =>
      status === 'allegation'
      || status === 'charge'
      || status === 'claim_by_source')
  ) {
    parts.push(
      'no visual treatment that converts an allegation, charge, or attributed claim into a proven fact',
    )
  }
  if (EXACT_FACT_SAFETY_MODES.has(input.sourceTruthMode)) {
    parts.push(
      'no fabricated exact geography, data, document, timeline, event, or source evidence',
    )
  }
  return parts.join('; ')
}

function mergeFactSafetyIntoPrivatePromptPacket(input: {
  readonly raw: unknown
  readonly factSafetyBinding:
    LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBinding
  readonly privateFactSafetyBriefLeases:
    readonly LivingFrameSelectedSceneDocumentaryFactSafetyPrivateBriefLease[]
}): LivingFrameControlledImageSelectedScenePrivatePromptPacket {
  if (!isPrivatePromptPacketShape(input.raw)) {
    throw invalid(
      'reader_failed',
      '$.baseReader.packet',
    )
  }
  const packet = input.raw
  const binding = input.factSafetyBinding
  if (
    packet.selectedSceneRequestBindingDigestSha256 !==
      binding.sourceBindings
        .selectedSceneRequestBindingDigestSha256
    || packet.approvedSnapshotId !==
      binding.sourceBindings.approvedSnapshotId
    || packet.approvedSnapshotHashSha256 !==
      binding.sourceBindings.approvedSnapshotHashSha256
    || packet.sceneId !== binding.canonicalScope.sceneId
    || packet.units.length !== binding.bindingUnits.length
  ) {
    throw invalid(
      'cross_scene_work_item_or_output_substitution',
      '$.baseReader.packet',
    )
  }
  const leaseByBindingUnitId = new Map(
    input.privateFactSafetyBriefLeases.map((lease) => [
      lease.bindingUnitId,
      lease,
    ]),
  )
  if (
    leaseByBindingUnitId.size !==
      binding.bindingUnits.length
    || input.privateFactSafetyBriefLeases.some((lease) =>
      lease.bindingDigestSha256 !==
        binding.bindingDigestSha256)
  ) {
    throw invalid(
      'lease_invalid',
      '$.privateFactSafetyBriefLeases',
    )
  }
  return {
    ...packet,
    units: binding.bindingUnits.map(
      (bindingUnit, order) => {
        const packetUnit = packet.units[order]
        const lease =
          leaseByBindingUnitId.get(
            bindingUnit.bindingUnitId,
          )
        if (
          !packetUnit
          || !lease
          || packetUnit.order !== order
          || packetUnit.requestUnitId !==
            bindingUnit.requestUnitId
          || packetUnit.requestUnitDigestSha256 !==
            bindingUnit.requestUnitDigestSha256
          || packetUnit.sceneId !== bindingUnit.sceneId
          || packetUnit.outputKey !== bindingUnit.outputKey
          || packetUnit.approvedWorkItemId !==
            bindingUnit.approvedWorkItemId
          || packetUnit.approvedWorkItemKey !==
            bindingUnit.approvedWorkItemKey
          || packetUnit
            .approvedPlannedAssetManifestEntryId !==
              bindingUnit
                .approvedPlannedAssetManifestEntryId
          || lease.requestUnitId !==
            bindingUnit.requestUnitId
        ) {
          throw invalid(
            'cross_scene_work_item_or_output_substitution',
            `$.baseReader.packet.units.${order}`,
          )
        }
        const conditioningSlots =
          packetUnit.resolvedSlots.filter((slot) =>
            slot.slotKind === 'positive_conditioning_text'
            || slot.slotKind ===
              'negative_conditioning_text')
        if (
          conditioningSlots.length !== 2
          || conditioningSlots.some((slot) =>
            slot.valueClass !==
              'private_conditioning_text'
            || typeof slot.value !== 'string'
            || slot.value.trim().length < 1)
        ) {
          throw invalid(
            'fact_safety_text_unsafe',
            `$.baseReader.packet.units.${order}.resolvedSlots`,
          )
        }
        const brief =
          consumeLivingFrameSelectedSceneDocumentaryFactSafetyPrivateBriefLease(
            lease,
          )
        assertPrivateBriefMatchesUnit(
          brief,
          bindingUnit,
        )
        return {
          ...packetUnit,
          resolvedSlots: packetUnit.resolvedSlots.map(
            (slot) => {
              if (
                slot.slotKind ===
                  'positive_conditioning_text'
              ) {
                const value =
                  `${slot.value} ${
                    brief.positiveFactSafetyConditioningText
                  }`
                assertFactSafetyText(
                  value,
                  '$.mergedPositiveConditioningText',
                )
                return { ...slot, value }
              }
              if (
                slot.slotKind ===
                  'negative_conditioning_text'
              ) {
                const value =
                  `${slot.value}; ${
                    brief.negativeFactSafetyConditioningText
                  }`
                assertFactSafetyText(
                  value,
                  '$.mergedNegativeConditioningText',
                )
                return { ...slot, value }
              }
              return { ...slot }
            },
          ),
        }
      },
    ),
  }
}

function assertFactSafeReaderInput(input: {
  readonly factSafetyBinding:
    LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBinding
  readonly privateFactSafetyBriefLeases:
    readonly LivingFrameSelectedSceneDocumentaryFactSafetyPrivateBriefLease[]
  readonly baseReader:
    LivingFrameControlledImageSelectedScenePrivatePromptReaderPort
}): void {
  const binding = input.factSafetyBinding
  if (
    binding.contractVersion !==
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_DOCUMENTARY_FACT_SAFETY_BINDING_VERSION
    || binding.resultClass !==
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_DOCUMENTARY_FACT_SAFETY_BINDING_CLASS
    || binding.bindingState !==
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_DOCUMENTARY_FACT_SAFETY_BINDING_STATE
    || !SHA256.test(binding.bindingDigestSha256)
    || binding.bindingDigestSha256 !==
      digest(withoutDigest(
        binding as unknown as Record<string, unknown>,
      ))
    || !isPrivatePromptReader(input.baseReader)
    || input.privateFactSafetyBriefLeases.length !==
      binding.bindingUnits.length
  ) {
    throw invalid(
      'input_invalid',
      '$.factSafePromptReader',
    )
  }
}

function isPrivatePromptReader(
  value: unknown,
): value is
  LivingFrameControlledImageSelectedScenePrivatePromptReaderPort {
  return isRecord(value)
    && value.readerClass ===
      'process_bound_server_owned_selected_scene_private_prompt_reader_v1'
    && value.sourceAuthority ===
      'current_selected_scene_conditioning_and_private_alias_repository'
    && value.callerPacketAccepted === false
    && value.callerPromptAccepted === false
    && value.callerSlotValueAccepted === false
    && value
      .callerSeedDimensionsModelPathUrlBytesCredentialCommandOrEnvironmentAccepted ===
        false
    && value.operationAuthority === false
    && value.dispatchAuthority === false
    && value.runtimeAuthority === false
    && value.productionReady === false
    && typeof value.readCurrentByServerOwnedLocator ===
      'function'
}

function isPrivatePromptPacketShape(
  value: unknown,
): value is
  LivingFrameControlledImageSelectedScenePrivatePromptPacket {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'selectedSceneRequestBindingDigestSha256',
      'fullFrameRatioExtensionDigestSha256',
      'approvedSnapshotId',
      'approvedSnapshotHashSha256',
      'sceneId',
      'units',
    ])
    || !SHA256.test(
      String(
        value.selectedSceneRequestBindingDigestSha256,
      ),
    )
    || !SHA256.test(
      String(value.fullFrameRatioExtensionDigestSha256),
    )
    || !SAFE_ID.test(String(value.approvedSnapshotId))
    || !SHA256.test(
      String(value.approvedSnapshotHashSha256),
    )
    || !SAFE_ID.test(String(value.sceneId))
    || !Array.isArray(value.units)
  ) return false
  return value.units.every((unit) =>
    isRecord(unit)
    && hasExactKeys(unit, [
      'order',
      'requestUnitId',
      'requestUnitDigestSha256',
      'sceneId',
      'outputKey',
      'approvedWorkItemId',
      'approvedWorkItemKey',
      'approvedPlannedAssetManifestEntryId',
      'serverOwnedConditioningLocatorId',
      'resolvedSlots',
    ])
    && Array.isArray(unit.resolvedSlots)
    && unit.resolvedSlots.every((slot) =>
      isRecord(slot)
      && hasExactKeys(slot, [
        'order',
        'slotKind',
        'valueClass',
        'value',
      ])
      && typeof slot.value === 'string'))
}

function assertPrivateBriefMatchesUnit(
  brief:
    LivingFrameSelectedSceneDocumentaryFactSafetyPrivateBrief,
  unit:
    LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingUnit,
): void {
  if (
    brief.bindingUnitId !== unit.bindingUnitId
    || brief.requestUnitId !== unit.requestUnitId
    || brief.sceneId !== unit.sceneId
    || brief.componentId !== unit.componentId
    || brief.outputKey !== unit.outputKey
    || brief.approvedWorkItemId !==
      unit.approvedWorkItemId
    || brief.approvedWorkItemKey !==
      unit.approvedWorkItemKey
    || brief.approvedPlannedAssetManifestEntryId !==
      unit.approvedPlannedAssetManifestEntryId
    || brief.sourceTruthMode !== unit.sourceTruthMode
    || brief.disposition !== unit.disposition
    || brief.rawClaimTextIncluded !== false
    || brief.rawSafeWordingIncluded !== false
    || brief.rawSourceLabelIncluded !== false
    || brief
      .authenticArchiveOrVerifiedEvidenceClaimAllowed !==
        false
    || brief.unsupportedSpecificActDepictionAllowed !==
      false
    || brief
      .finalTextOrSourceAttributionOwnedByImageGenerator !==
        false
  ) {
    throw invalid(
      'cross_scene_work_item_or_output_substitution',
      '$.privateFactSafetyBrief',
    )
  }
}

function assertReceipt(
  draft:
    LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingDraft,
  privateBriefValues:
    readonly LivingFrameSelectedSceneDocumentaryFactSafetyPrivateBrief[],
): void {
  const {
    serverDerivedPrivateFactSafetyBindingAuthority,
    privateFactSafetyConstraintMergeAuthority,
    ...delegatedAuthorities
  } = draft.authorityBoundary
  const serialized = stableAuthorityStringify(draft)
  if (
    serverDerivedPrivateFactSafetyBindingAuthority !==
      true
    || privateFactSafetyConstraintMergeAuthority !== true
    || Object.values(delegatedAuthorities).some(
      (value) => value !== false,
    )
    || draft.bindingUnits.length < 1
    || draft.metrics.bindingUnitCount !==
      draft.bindingUnits.length
    || new Set(
      draft.bindingUnits.map((unit) =>
        unit.requestUnitId),
    ).size !== draft.bindingUnits.length
    || privateBriefValues.some((brief) =>
      serialized.includes(
        brief.positiveFactSafetyConditioningText,
      )
      || serialized.includes(
        brief.negativeFactSafetyConditioningText,
      ))
    || stableAuthorityStringify(
      draft.openGateCodes,
    ) !== stableAuthorityStringify(
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_DOCUMENTARY_FACT_SAFETY_OPEN_GATES,
    )
    || draft.documentaryFactSafetyPlanCopiedIntoReceipt
    || draft.documentaryFactsVerifiedByThisBinding
    || draft.rawClaimTextPassedToImageGenerator
    || draft.promptPacketMerged
    || draft.operationRegistered
    || draft.dispatchGranted
    || draft.workerLeaseCreated
    || draft.runtimeExecuted
    || draft.gpuAttemptCreated
    || draft.actualCostReceiptCreated
    || draft.artifactPersisted
    || draft.assetManifestMutated
    || draft.artifactQaExecuted
    || draft.privateReviewApproved
    || draft.renderAuthorized
    || draft.finalCanvasCreatedByComfyUi
    || draft.productionReady
  ) {
    throw invalid(
      'authority_promotion_forbidden',
      '$',
    )
  }
}

function highestSeverityOf(
  claims: readonly FactSafetyPlanItem[],
): LivingFrameSelectedSceneDocumentaryFactSafetySeverity {
  if (claims.length === 0) return 'none'
  let highest:
    LivingFrameSelectedSceneDocumentaryFactSafetySeverity =
    'low'
  let rank = 1
  for (const claim of claims) {
    const candidateRank = SEVERITY_RANK[claim.severity]
    if (candidateRank > rank) {
      rank = candidateRank
      highest = claim.severity === 'blocking'
        ? 'high'
        : claim.severity
    }
  }
  return highest
}

function hasResolvedSourceLabel(
  claim: FactSafetyPlanItem,
): boolean {
  return typeof claim.sourceLabel === 'string'
    && claim.sourceLabel.trim().length > 0
}

function countDisposition(
  units:
    readonly LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingUnit[],
  disposition:
    LivingFrameSelectedSceneDocumentaryFactSafetyDisposition,
): number {
  return units.filter((unit) =>
    unit.disposition === disposition).length
}

function assertFactSafetyText(
  value: string,
  path: string,
): void {
  if (
    typeof value !== 'string'
    || value.trim() !== value
    || value.length < 24
    || byteLength(value) >
      MAX_FACT_SAFETY_TEXT_BYTES
    || containsForbiddenControlCharacter(value)
  ) {
    throw invalid('fact_safety_text_unsafe', path)
  }
}

function containsForbiddenControlCharacter(
  value: string,
): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const codePoint = value.charCodeAt(index)
    if (
      (codePoint >= 0 && codePoint <= 8)
      || codePoint === 11
      || codePoint === 12
      || (codePoint >= 14 && codePoint <= 31)
      || codePoint === 127
    ) return true
  }
  return false
}

function isSourceTruthMode(
  value: unknown,
): value is LivingFrameSourceTruthMode {
  return [
    'canonical_illustrative_interpretation',
    'controlled_source_expectation',
    'exact_geography_verification_required',
    'exact_data_verification_required',
    'documentary_source_verification_required',
    'fictional_or_stylized',
    'unknown_blocked',
  ].includes(String(value))
}

function isStringArray(
  value: unknown,
  maximumLength: number,
): value is string[] {
  return Array.isArray(value)
    && value.length <= maximumLength
    && value.every((item) =>
      typeof item === 'string'
      && item.length <= 8_192)
}

function isSafeUniqueIdArray(
  value: unknown,
  maximumLength: number,
): value is string[] {
  return Array.isArray(value)
    && value.length <= maximumLength
    && value.every((item) =>
      typeof item === 'string'
      && SAFE_ID.test(item))
    && new Set(value).size === value.length
}

function sameStrings(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return stableAuthorityStringify([...left].sort()) ===
    stableAuthorityStringify([...right].sort())
}

function uniqueSorted<T extends string>(
  values: readonly T[],
): T[] {
  return [...new Set(values)].sort()
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength
}

function digest(value: unknown): string {
  return sha256AuthorityValue(value)
}

function withoutDigest(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const {
    bindingDigestSha256: _bindingDigestSha256,
    ...rest
  } = value
  void _bindingDigestSha256
  return rest
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  return stableAuthorityStringify(actual) ===
    stableAuthorityStringify(wanted)
}

function stableAuthorityStringify(
  value: unknown,
): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableAuthorityStringify).join(',')}]`
  }
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) =>
    `${JSON.stringify(key)}:${stableAuthorityStringify(record[key])}`)
    .join(',')}}`
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return Boolean(
    value
    && typeof value === 'object'
    && !Array.isArray(value),
  )
}

function deepFreeze<T>(value: T): T {
  if (
    !value
    || typeof value !== 'object'
    || Object.isFrozen(value)
  ) return value
  Object.freeze(value)
  for (const entry of Object.values(value)) {
    deepFreeze(entry)
  }
  return value
}

function invalid(
  code:
    LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyIssueCode,
  path: string,
): LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingError {
  if (
    !LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_DOCUMENTARY_FACT_SAFETY_ISSUE_CODES.includes(
      code,
    )
  ) {
    throw new Error(
      `Unknown Living Frame documentary fact-safety issue: ${code}`,
    )
  }
  return new LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingError([
    { code, path },
  ])
}
