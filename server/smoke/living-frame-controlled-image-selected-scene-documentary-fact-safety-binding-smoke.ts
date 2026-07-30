import assert from 'node:assert/strict'

import type {
  LivingFrameSelectedSceneDocumentaryFactSafetySnapshotPacket,
} from '../../src/types/living-frame-controlled-image-selected-scene-documentary-fact-safety-binding'
import type {
  LivingFrameControlledImageSelectedScenePrivatePromptPacket,
} from '../living-frame/living-frame-controlled-image-selected-scene-private-prompt-materialization'
import {
  LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingError,
  compileLivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBinding,
  consumeLivingFrameSelectedSceneDocumentaryFactSafetyPrivateBriefLease,
  createLivingFrameSelectedSceneDocumentaryFactSafePrivatePromptReader,
  createLivingFrameSelectedSceneDocumentaryFactSafetySnapshotReader,
  verifyLivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBinding,
} from '../living-frame/living-frame-controlled-image-selected-scene-documentary-fact-safety-binding'
import {
  createLivingFrameControlledImageSelectedSceneAnimationAwarePrivatePromptReader,
} from '../living-frame/living-frame-controlled-image-selected-scene-private-conditioning-binding'
import {
  consumeLivingFrameControlledImageSelectedScenePrivatePromptRequestLease,
  materializeLivingFrameControlledImageSelectedScenePrivatePrompt,
} from '../living-frame/living-frame-controlled-image-selected-scene-private-prompt-materialization'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  createLivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingSmokeFixture,
} from './fixtures/living-frame-controlled-image-selected-scene-documentary-fact-safety-binding-fixture'

const illustrativeFixture =
  await createLivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingSmokeFixture({
    scenario: 'musashi',
  })
assert.equal(
  await verifyLivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBinding(
    illustrativeFixture.result.receipt,
    illustrativeFixture.input,
  ),
  true,
)
assert.equal(
  illustrativeFixture.result.receipt.bindingUnits.length,
  3,
)
assert.equal(
  illustrativeFixture.result.receipt.metrics
    .illustrativeGuardUnitCount,
  3,
)
assert.equal(
  illustrativeFixture.result.receipt.factSafetyPlanSummary
    .selectedSceneBoundClaimCount,
  0,
)
for (
  const unit of
    illustrativeFixture.result.receipt.bindingUnits
) {
  assert.equal(
    unit.disposition,
    'approved_illustrative_interpretation_guard',
  )
  assert.equal(
    unit.authenticArchiveOrVerifiedEvidenceClaimAllowed,
    false,
  )
  assert.equal(
    unit.unsupportedSpecificActDepictionAllowed,
    false,
  )
  assert.equal(unit.promptPacketMerged, false)
  assert.equal(
    unit.documentaryFactsVerifiedByThisBinding,
    false,
  )
}
const serializedIllustrativeReceipt = JSON.stringify(
  illustrativeFixture.result.receipt,
)
assert.equal(
  serializedIllustrativeReceipt.includes('Musashi'),
  false,
)
assert.equal(
  serializedIllustrativeReceipt.includes('claimText'),
  false,
)
assert.equal(
  serializedIllustrativeReceipt.includes('safeWording'),
  false,
)
assert.equal(
  serializedIllustrativeReceipt.includes('sourceLabel'),
  false,
)
assert.equal(
  serializedIllustrativeReceipt.includes('http://'),
  false,
)
assert.equal(
  serializedIllustrativeReceipt.includes('https://'),
  false,
)

const directLeaseFixture =
  await createLivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingSmokeFixture({
    scenario: 'musashi',
  })
const directBrief =
  consumeLivingFrameSelectedSceneDocumentaryFactSafetyPrivateBriefLease(
    directLeaseFixture.result
      .privateFactSafetyBriefLeases[0]!,
  )
assert.match(
  directBrief.positiveFactSafetyConditioningText,
  /illustrative still source only/u,
)
assert.match(
  directBrief.positiveFactSafetyConditioningText,
  /unsupported specific act/u,
)
assert.match(
  directBrief.negativeFactSafetyConditioningText,
  /no authentic archive claim/u,
)
assert.equal(directBrief.rawClaimTextIncluded, false)
assert.equal(directBrief.rawSafeWordingIncluded, false)
assert.equal(directBrief.rawSourceLabelIncluded, false)
await assert.rejects(
  async () =>
    consumeLivingFrameSelectedSceneDocumentaryFactSafetyPrivateBriefLease(
      directLeaseFixture.result
        .privateFactSafetyBriefLeases[0]!,
    ),
  (error: unknown) =>
    hasIssue(error, 'lease_reused'),
)

const exactFixture =
  await createLivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingSmokeFixture({
    scenario: 'hormuz',
  })
assert.equal(
  exactFixture.input.selectedSceneRequest
    .selectedSceneSummary.sourceTruthMode,
  'exact_geography_verification_required',
)
assert.equal(
  exactFixture.result.receipt.bindingUnits.length,
  1,
)
assert.equal(
  exactFixture.result.receipt.metrics
    .verifiedOrAttributedGuardUnitCount,
  1,
)
assert.equal(
  exactFixture.result.receipt.factSafetyPlanSummary
    .selectedSceneBoundClaimCount,
  1,
)
assert.equal(
  exactFixture.result.receipt.factSafetyPlanSummary
    .selectedSceneFactSafetyExpectationRefCount,
  1,
)
assert.equal(
  exactFixture.result.receipt.factSafetyPlanSummary
    .blockingClaimCount,
  0,
)
assert.equal(
  exactFixture.result.receipt.factSafetyPlanSummary
    .unresolvedSourceRequiredClaimCount,
  0,
)
assert.deepEqual(
  exactFixture.result.receipt.bindingUnits[0]!
    .approvedVisualTreatmentCodes,
  ['source_attribution_card'],
)

await assertPacketMutationRejected(
  exactFixture,
  (packet) => {
    packet.approvedSnapshotHashSha256 =
      sha256AuthorityValue('wrong-snapshot')
  },
  'approved_snapshot_mismatch',
)
await assertPacketMutationRejected(
  exactFixture,
  (packet) => {
    packet.sceneClaimBindings[0]!.sceneId =
      'cross-scene-substitution'
  },
  'selected_scene_mismatch',
)
await assertPacketMutationRejected(
  exactFixture,
  (packet) => {
    packet.sceneClaimBindings[0]!.sourceTruthMode =
      'canonical_illustrative_interpretation'
  },
  'source_truth_mismatch',
)
await assertPacketMutationRejected(
  exactFixture,
  (packet) => {
    packet.sceneClaimBindings[0]!
      .factSafetyExpectationRefIds = []
  },
  'fact_safety_expectation_mismatch',
)
await assertPacketMutationRejected(
  exactFixture,
  (packet) => {
    packet.sceneClaimBindings[0]!.claimItemIds = []
  },
  'claim_binding_incomplete',
)
await assertPacketMutationRejected(
  exactFixture,
  (packet) => {
    const claim =
      packet.documentaryFactSafetyPlan.claimItems[0]!
    claim.claimStatus = 'unknown'
    claim.severity = 'blocking'
    claim.visualTreatment = 'needs_user_confirmation'
  },
  'blocking_claim_unresolved',
)
await assertPacketMutationRejected(
  exactFixture,
  (packet) => {
    const claim =
      packet.documentaryFactSafetyPlan.claimItems[0]!
    claim.claimStatus = 'claim_by_source'
    claim.sourceNeeded = true
    delete claim.sourceLabel
    claim.severity = 'medium'
  },
  'blocking_claim_unresolved',
)
await assertPacketMutationRejected(
  exactFixture,
  (packet) => {
    packet.factVerificationAuthority = true
  },
  'snapshot_packet_invalid',
)

const forgedReceipt = structuredClone(
  exactFixture.result.receipt,
) as {
  factSafetyPlanSummary: {
    blockingClaimCount: number
  }
}
forgedReceipt.factSafetyPlanSummary.blockingClaimCount = 1
assert.equal(
  await verifyLivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBinding(
    forgedReceipt,
    exactFixture.input,
  ),
  false,
)

await assert.rejects(
  compileLivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBinding({
    ...exactFixture.input,
    reader: {
      ...exactFixture.input.reader,
      readCurrentByServerOwnedLocator: async () =>
        exactFixture.packet,
    },
  }),
  (error: unknown) => hasIssue(error, 'input_invalid'),
)

const integrationFixture =
  await createLivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingSmokeFixture({
    scenario: 'hormuz',
  })
const conditioning =
  integrationFixture.conditioningFixture
const animationAwareReader =
  createLivingFrameControlledImageSelectedSceneAnimationAwarePrivatePromptReader({
    conditioningBinding:
      conditioning.result.receipt,
    privateConditioningBriefLeases:
      conditioning.result.privateConditioningBriefLeases,
    readCurrentServerOwnedAliasPacketByLocator:
      async () => createAliasOnlyPromptPacket(
        conditioning.input.selectedSceneRequest,
        conditioning.input.fullFrameRatioExtension
          .extensionDigestSha256,
      ),
  })
const factSafeReader =
  createLivingFrameSelectedSceneDocumentaryFactSafePrivatePromptReader({
    factSafetyBinding:
      integrationFixture.result.receipt,
    privateFactSafetyBriefLeases:
      integrationFixture.result
        .privateFactSafetyBriefLeases,
    baseReader: animationAwareReader,
  })
const materialization =
  await materializeLivingFrameControlledImageSelectedScenePrivatePrompt({
    materializationBatchId:
      'living-frame.fact-safe-prompt-materialization.001',
    serverOwnedMaterializationLocatorId:
      'living-frame.fact-safe-prompt-locator.001',
    selectedSceneRequest:
      conditioning.input.selectedSceneRequest,
    selectedSceneRequestInput:
      conditioning.input.selectedSceneRequestInput,
    fullFrameRatioExtension:
      conditioning.input.fullFrameRatioExtension,
    fullFrameRatioExtensionInput:
      conditioning.input.fullFrameRatioExtensionInput,
    admissionCandidate:
      conditioning.input.fullFrameRatioExtensionInput
        .admissionCandidate,
    reader: factSafeReader,
  })
assert.equal(
  materialization.receipt.materializationUnits.length,
  1,
)
const materialized =
  materialization.receipt.materializationUnits[0]!
const baseConditioningUnit =
  conditioning.result.receipt.conditioningUnits[0]!
const positiveReceipt =
  materialized.privatePromptRequest.slotReceipts.find(
    (slot) =>
      slot.slotKind === 'positive_conditioning_text',
  )
const negativeReceipt =
  materialized.privatePromptRequest.slotReceipts.find(
    (slot) =>
      slot.slotKind === 'negative_conditioning_text',
  )
assert.ok(positiveReceipt)
assert.ok(negativeReceipt)
assert.notEqual(
  positiveReceipt.valueDigestSha256,
  baseConditioningUnit.privateConditioningReceipt
    .positiveConditioningDigestSha256,
)
assert.notEqual(
  negativeReceipt.valueDigestSha256,
  baseConditioningUnit.privateConditioningReceipt
    .negativeConditioningDigestSha256,
)
const privateRequest =
  consumeLivingFrameControlledImageSelectedScenePrivatePromptRequestLease(
    materialization.privatePromptRequestLeases[0]!,
  )
const privatePromptText = JSON.stringify(
  privateRequest.prompt,
)
assert.match(
  privatePromptText,
  /Documentary fact-safety constraint/u,
)
assert.match(
  privatePromptText,
  /exact geography belongs to the canonical map owner/u,
)
assert.match(
  privatePromptText,
  /no authentic archive claim/u,
)
assert.doesNotMatch(
  privatePromptText,
  /The selected scene explains an exact geographic relationship/u,
)
assert.doesNotMatch(
  privatePromptText,
  /Approved documentary geography evidence/u,
)
assert.equal(privateRequest.dispatchAuthority, false)
assert.equal(privateRequest.runtimeAuthority, false)
assert.equal(privateRequest.finalCanvasAuthority, false)
assert.equal(privateRequest.productionReady, false)

console.log(
  JSON.stringify({
    smoke:
      'living-frame-selected-scene-documentary-fact-safety-binding',
    controlledCases: 3,
    adversarialCases: 9,
    status: 'passed',
  }),
)

type MutablePacket = {
  -readonly [K in keyof LivingFrameSelectedSceneDocumentaryFactSafetySnapshotPacket]:
    K extends 'factVerificationAuthority'
      ? boolean
      : K extends 'sceneClaimBindings'
      ? Array<{
          -readonly [P in keyof LivingFrameSelectedSceneDocumentaryFactSafetySnapshotPacket[
            'sceneClaimBindings'
          ][number]]:
            LivingFrameSelectedSceneDocumentaryFactSafetySnapshotPacket[
              'sceneClaimBindings'
            ][number][P]
        }>
      : K extends 'documentaryFactSafetyPlan'
        ? {
            -readonly [P in keyof LivingFrameSelectedSceneDocumentaryFactSafetySnapshotPacket[
              'documentaryFactSafetyPlan'
            ]]:
              P extends 'claimItems'
                ? Array<Record<string, unknown>>
                : LivingFrameSelectedSceneDocumentaryFactSafetySnapshotPacket[
                  'documentaryFactSafetyPlan'
                ][P]
          }
        : LivingFrameSelectedSceneDocumentaryFactSafetySnapshotPacket[K]
}

async function assertPacketMutationRejected(
  fixture:
    Awaited<
      ReturnType<
        typeof createLivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingSmokeFixture
      >
    >,
  mutate: (packet: MutablePacket) => void,
  issueCode: string,
): Promise<void> {
  const packet =
    structuredClone(fixture.packet) as unknown as
      MutablePacket
  mutate(packet)
  const {
    packetDigestSha256: _packetDigestSha256,
    ...packetDraft
  } = packet
  void _packetDigestSha256
  packet.packetDigestSha256 =
    sha256AuthorityValue(packetDraft)
  const reader =
    createLivingFrameSelectedSceneDocumentaryFactSafetySnapshotReader(
      async () => structuredClone(packet),
    )
  await assert.rejects(
    compileLivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBinding({
      ...fixture.input,
      reader,
    }),
    (error: unknown) => hasIssue(error, issueCode),
  )
}

function hasIssue(
  error: unknown,
  issueCode: string,
): boolean {
  return error instanceof
      LivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingError
    && error.issues.some((issue) =>
      issue.code === issueCode)
}

function createAliasOnlyPromptPacket(
  selectedSceneRequest:
    typeof integrationFixture.conditioningFixture.input.selectedSceneRequest,
  fullFrameRatioExtensionDigestSha256: string,
): LivingFrameControlledImageSelectedScenePrivatePromptPacket {
  return {
    selectedSceneRequestBindingDigestSha256:
      selectedSceneRequest.requestBindingDigestSha256,
    fullFrameRatioExtensionDigestSha256,
    approvedSnapshotId:
      selectedSceneRequest.sourceBindings.approvedSnapshotId,
    approvedSnapshotHashSha256:
      selectedSceneRequest.sourceBindings
        .approvedSnapshotHashSha256,
    sceneId: selectedSceneRequest.canonicalScope.sceneId,
    units: selectedSceneRequest.requestUnits.map((unit) => ({
      order: unit.order,
      requestUnitId: unit.requestUnitId,
      requestUnitDigestSha256:
        unit.requestUnitDigestSha256,
      sceneId: unit.sceneId,
      outputKey: unit.outputKey,
      approvedWorkItemId: unit.approvedWorkItemId,
      approvedWorkItemKey: unit.approvedWorkItemKey,
      approvedPlannedAssetManifestEntryId:
        unit.approvedPlannedAssetManifestEntryId,
      serverOwnedConditioningLocatorId:
        unit.serverOwnedConditioningLocatorId,
      resolvedSlots: unit.privateSlotKinds.map(
        (slotKind, order) => ({
          order,
          slotKind,
          valueClass: slotKind ===
              'positive_conditioning_text'
              || slotKind === 'negative_conditioning_text'
            ? 'private_conditioning_text' as const
            : slotKind === 'control_image_artifact'
                || slotKind === 'reference_image_artifact'
              ? 'private_image_alias' as const
              : 'private_model_alias' as const,
          value: slotKind ===
              'positive_conditioning_text'
              || slotKind === 'negative_conditioning_text'
            ? 'server-owned-conditioning-pending'
            : aliasFor(slotKind),
        }),
      ),
    })),
  }
}

function aliasFor(slotKind: string): string {
  const aliases: Record<string, string> = {
    base_checkpoint_artifact: 'private-base.safetensors',
    controlnet_checkpoint_artifact:
      'private-controlnet.safetensors',
    lora_adapter_artifact: 'private-lora.safetensors',
    generic_ipadapter_checkpoint_artifact:
      'private-ipadapter.safetensors',
    clip_vision_checkpoint_artifact:
      'private-clipvision.safetensors',
    control_image_artifact: 'private-control.png',
    reference_image_artifact: 'private-reference.png',
  }
  const value = aliases[slotKind]
  if (!value) {
    throw new Error(`Missing private alias for ${slotKind}.`)
  }
  return value
}
