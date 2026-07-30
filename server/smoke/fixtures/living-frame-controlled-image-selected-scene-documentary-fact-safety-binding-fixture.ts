import type {
  DocumentaryFactSafetyPlan,
} from '../../../src/types/reeditpro'
import type {
  LivingFrameSelectedSceneDocumentaryFactSafetySnapshotPacket,
  LivingFrameSelectedSceneDocumentaryFactSafetySnapshotPacketDraft,
} from '../../../src/types/living-frame-controlled-image-selected-scene-documentary-fact-safety-binding'
import {
  compileLivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBinding,
  createLivingFrameSelectedSceneDocumentaryFactSafetySnapshotReader,
} from '../../living-frame/living-frame-controlled-image-selected-scene-documentary-fact-safety-binding'
import {
  sha256AuthorityValue,
} from '../../services/private-edit-authority-store'
import {
  createLivingFrameControlledImageSelectedScenePrivateConditioningBindingSmokeFixture,
} from './living-frame-controlled-image-selected-scene-private-conditioning-binding-fixture'
import type {
  LivingFrameSelectedSceneFixtureScenario,
} from './living-frame-selected-scene-visual-continuity-pack-binding-fixture'

let sequence = 0

export async function createLivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBindingSmokeFixture(
  options?: {
    readonly scenario?:
      LivingFrameSelectedSceneFixtureScenario
  },
) {
  const suffix = nextId()
  const scenario = options?.scenario ?? 'musashi'
  const conditioningFixture =
    await createLivingFrameControlledImageSelectedScenePrivateConditioningBindingSmokeFixture({
      scenario,
    })
  const request =
    conditioningFixture.input.selectedSceneRequest
  const selectedComponent =
    conditioningFixture.input.selectedSceneRequestInput
      .publication.binding.selectedComponent
  const factSafetyExpectationRefIds =
    selectedComponent.inputBindings.factSafetyRefs
      .map((reference) => reference.expectationRefId)
      .sort()
  const plan = createFactSafetyPlan({
    scenario,
    suffix,
  })
  const claimItemIds =
    factSafetyExpectationRefIds.length > 0
      ? plan.claimItems.map((claim) => claim.id)
      : []
  const packetDraft:
    LivingFrameSelectedSceneDocumentaryFactSafetySnapshotPacketDraft =
    {
      packetVersion:
        'canonical-approved-snapshot-documentary-fact-safety-packet-v1',
      approvedSnapshotId:
        request.sourceBindings.approvedSnapshotId,
      approvedSnapshotHashSha256:
        request.sourceBindings.approvedSnapshotHashSha256,
      selectedSceneBindingDigestSha256:
        request.sourceBindings
          .selectedSceneBindingDigestSha256,
      documentaryFactSafetyPlan: plan,
      sceneClaimBindings: [{
        sceneId: request.canonicalScope.sceneId,
        sourceTruthMode:
          request.selectedSceneSummary.sourceTruthMode,
        factSafetyExpectationRefIds,
        claimItemIds,
        bindingSource:
          'canonical_approved_snapshot_scene_claim_binding',
      }],
      callerSuppliedPacket: false,
      packetContainsProviderPromptModelPathUrlBytesCredentialCommandOrEnvironment:
        false,
      factVerificationAuthority: false,
      approvalAuthority: false,
      snapshotMutationAuthority: false,
      productionReady: false,
    }
  const packet:
    LivingFrameSelectedSceneDocumentaryFactSafetySnapshotPacket =
    {
      ...packetDraft,
      packetDigestSha256:
        sha256AuthorityValue(packetDraft),
    }
  const reader =
    createLivingFrameSelectedSceneDocumentaryFactSafetySnapshotReader(
      async () => structuredClone(packet),
    )
  const input = {
    bindingId:
      `living-frame.selected-fact-safety.${scenario}.${suffix}`,
    serverOwnedFactSafetyLocatorId:
      `living-frame.selected-fact-safety-locator.${scenario}.${suffix}`,
    selectedSceneRequest: request,
    selectedSceneRequestInput:
      conditioningFixture.input.selectedSceneRequestInput,
    reader,
  } as const
  const result =
    await compileLivingFrameControlledImageSelectedSceneDocumentaryFactSafetyBinding(
      input,
    )
  return {
    scenario,
    conditioningFixture,
    packet,
    input,
    result,
  }
}

function createFactSafetyPlan(input: {
  readonly scenario:
    LivingFrameSelectedSceneFixtureScenario
  readonly suffix: string
}): DocumentaryFactSafetyPlan {
  if (input.scenario === 'musashi') {
    return {
      id:
        `documentary-fact-safety-illustrative-${input.suffix}`,
      active: false,
      claimItems: [],
      globalRules: [
        'Generated historical illustration remains illustrative.',
      ],
      clarifyingQuestions: [],
      qaChecks: [
        'Do not present generated illustration as archive.',
      ],
      notes: [
        'No exact documentary claim is bound to this illustrative fixture.',
      ],
    }
  }
  return {
    id:
      `documentary-fact-safety-geography-${input.suffix}`,
    active: true,
    claimItems: [{
      id: `fact-safety-hormuz-geography-${input.suffix}`,
      claimText:
        'The selected scene explains an exact geographic relationship.',
      peopleMentioned: [],
      organizationsMentioned: [],
      claimStatus: 'verified_fact',
      sourceNeeded: false,
      sourceLabel:
        'Approved documentary geography evidence',
      safeWording:
        'Verified by the approved documentary geography source.',
      visualTreatment: 'source_attribution_card',
      avoidRules: [
        'Do not fabricate map geometry or evidence.',
      ],
      qaChecks: [
        'Exact geography remains owned by the canonical map system.',
      ],
      severity: 'low',
    }],
    globalRules: [
      'Generated atmosphere cannot replace exact geography.',
    ],
    clarifyingQuestions: [],
    qaChecks: [
      'Exact map geometry and labels remain deterministic.',
    ],
    notes: [
      'The full-frame generated plate is atmosphere only.',
    ],
  }
}

function nextId(): string {
  sequence += 1
  return String(sequence).padStart(3, '0')
}
