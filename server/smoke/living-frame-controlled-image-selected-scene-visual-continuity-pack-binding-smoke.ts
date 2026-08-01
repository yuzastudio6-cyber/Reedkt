import assert from 'node:assert/strict'

import type {
  LivingFrameControlledImageSelectedSceneVisualContinuityPackBinding,
} from '../../src/types/living-frame-controlled-image-selected-scene-visual-continuity-pack-binding'
import {
  LIVING_FRAME_COMFYUI_RUNTIME_CONFINEMENT_REQUIREMENT_DIGEST_SHA256,
} from '../living-frame/living-frame-controlled-sdxl-comfyui-canonical-mount-host-session'
import {
  LivingFrameControlledImageSelectedSceneVisualContinuityPackBindingError,
  compileLivingFrameControlledImageSelectedSceneVisualContinuityPackBinding,
  type CreateLivingFrameControlledImageSelectedSceneVisualContinuityPackBindingInput,
  verifyLivingFrameControlledImageSelectedSceneVisualContinuityPackBinding,
} from '../living-frame/living-frame-controlled-image-selected-scene-visual-continuity-pack-binding'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  createLivingFrameSelectedSceneVisualContinuityPackBindingSmokeFixture,
} from './fixtures/living-frame-selected-scene-visual-continuity-pack-binding-fixture'

const fixture =
  await createLivingFrameSelectedSceneVisualContinuityPackBindingSmokeFixture()
const input = fixture.input
const binding =
  await compileLivingFrameControlledImageSelectedSceneVisualContinuityPackBinding(
    input,
  )

assert.equal(
  await verifyLivingFrameControlledImageSelectedSceneVisualContinuityPackBinding(
    binding,
    input,
  ),
  true,
)
assert.equal(
  binding.bindingState,
  'validated_pack_payload_bound_read_only_pending_canonical_owner_integration',
)
assert.equal(
  binding.sourceBindings.visualContinuityPackDigestSha256,
  input.semanticProposalBinding.continuityPackDigestSha256,
)
assert.equal(
  binding.sourceBindings.selectedSceneBindingDigestSha256,
  input.selectedSceneBinding.bindingDigestSha256,
)
assert.equal(
  binding.packBinding.packPayloadFullyRevalidated,
  true,
)
assert.equal(binding.packBinding.packPayloadEmbeddedInReceipt, false)
assert.equal(binding.packBinding.immutablePackArtifactCreated, false)
assert.equal(
  binding.packBinding.selectedSceneBindingCount,
  input.selectedSceneBinding.selectedSceneCount,
)
assert.equal(
  binding.selectedSceneContinuityBindings.length,
  input.selectedSceneBinding.selectedSceneCount,
)
assert.ok(
  binding.selectedSceneContinuityBindings.every(
    (scene) =>
      scene.requiredContinuityExpectationKinds.length > 0
      && JSON.stringify(scene.requiredContinuityExpectationKinds) ===
        JSON.stringify(scene.boundContinuityExpectationKinds),
  ),
)
assert.ok(
  binding.selectedSceneContinuityBindings.every(
    (scene) =>
      scene.referenceViewsAreControlledUnverifiedExpectations
      && !scene.referenceViewsArePersistedReferenceArtifacts
      && !scene.referenceArtifactRequirementResolvedByThisBinding,
  ),
)
assert.equal(
  binding.selectedSceneContinuityBindings[0]
    ?.exactDocumentaryFactSafetyBindingRequired,
  false,
)
assert.equal(
  binding.fixedRuntimeAndRegistryPolicy.expectedCanonicalToolId,
  'comfyui',
)
assert.equal(
  binding.fixedRuntimeAndRegistryPolicy.expectedCanonicalOperationId,
  'tool.comfyui.generate_controlled_image.v1',
)
assert.equal(
  binding.fixedRuntimeAndRegistryPolicy
    .runtimeConfinementRequirementDigestSha256,
  LIVING_FRAME_COMFYUI_RUNTIME_CONFINEMENT_REQUIREMENT_DIGEST_SHA256,
)
assert.deepEqual(
  binding.fixedRuntimeAndRegistryPolicy.deniedTopLevelImports,
  ['sam2'],
)
assert.equal(
  binding.fixedRuntimeAndRegistryPolicy.exactModelArtifactByteLength,
  11_700_367_157,
)
assert.equal(
  binding.fixedRuntimeAndRegistryPolicy
    .fiveGpuCapabilityRolesCreateOneCostEvent,
  true,
)
assert.equal(
  binding.fixedRuntimeAndRegistryPolicy
    .registryExpansionPermittedForReleasedDistinctExecutables,
  true,
)
assert.equal(
  binding.validatedPackPayloadAvailableForReadOnlyDownstreamBinding,
  true,
)
assert.equal(binding.canonicalSelectedSceneInterfaceMutated, false)
assert.equal(binding.immutablePackArtifactPersisted, false)
assert.equal(binding.canonicalReferenceArtifactResolved, false)
assert.equal(binding.semanticVisualQaExecuted, false)
assert.equal(binding.documentaryFactSafetyRevalidated, false)
assert.equal(binding.promptMaterializationChanged, false)
assert.equal(binding.operationRegistered, false)
assert.equal(binding.dispatchGranted, false)
assert.equal(binding.runtimeExecuted, false)
assert.equal(binding.artifactPersisted, false)
assert.equal(binding.assetManifestMutated, false)
assert.equal(binding.privateReviewApproved, false)
assert.equal(binding.renderAuthorized, false)
assert.equal(binding.finalCanvasCreatedByComfyUi, false)
assert.equal(binding.productionReady, false)

const serialized = JSON.stringify(binding)
for (const forbidden of [
  '"continuityPack":',
  '"displayLabel":',
  '"summary":',
  '"referenceViewId":',
  '"assetExpectationId":',
  '"bytes":',
  '"path":',
  '"url":',
  '"prompt":',
  '"seed":',
  '"modelAlias":',
  '"command":',
  '"environment":',
  'https://',
  'file://',
  '/tmp/',
  'musashi',
  'hormuz',
  'helicopter',
]) {
  assert.equal(serialized.includes(forbidden), false)
}

let adversarialAssertions = 0

await assertRejectsWithIssue(
  {
    ...input,
    rawPrompt: 'forbidden',
  } as unknown as
    CreateLivingFrameControlledImageSelectedSceneVisualContinuityPackBindingInput,
  'input_invalid',
)
adversarialAssertions += 1

const forgedSemanticBinding = structuredClone(
  input.semanticProposalBinding,
)
;(forgedSemanticBinding as {
  continuityPackDigestSha256: string
}).continuityPackDigestSha256 = '0'.repeat(64)
await assertRejectsWithIssue(
  {
    ...input,
    semanticProposalBinding: forgedSemanticBinding,
  },
  'semantic_proposal_binding_invalid',
)
adversarialAssertions += 1

const crossFixture =
  await createLivingFrameSelectedSceneVisualContinuityPackBindingSmokeFixture()
await assertRejectsWithIssue(
  {
    ...input,
    semanticProposalBinding:
      crossFixture.input.semanticProposalBinding,
  },
  'source_lineage_mismatch',
)
adversarialAssertions += 1

assert.equal(
  await verify(
    resign(binding, (draft) => {
      const pack = draft.packBinding as Record<string, unknown>
      pack.controlledReferenceViewExpectationsAreAssetEvidence = true
    }),
  ),
  false,
)
adversarialAssertions += 1

assert.equal(
  await verify(
    resign(binding, (draft) => {
      const scene =
        (draft.selectedSceneContinuityBindings as
          Array<Record<string, unknown>>)[0]!
      scene.documentaryFactSafetyRevalidated = true
    }),
  ),
  false,
)
adversarialAssertions += 1

assert.equal(
  await verify(
    resign(binding, (draft) => {
      draft.canonicalSelectedSceneInterfaceMutated = true
    }),
  ),
  false,
)
adversarialAssertions += 1

assert.equal(
  await verify(
    resign(binding, (draft) => {
      draft.continuityPack = {
        rawPayload: 'forbidden',
      }
    }),
  ),
  false,
)
adversarialAssertions += 1

assert.equal(
  await verify(
    resign(binding, (draft) => {
      const runtime =
        draft.fixedRuntimeAndRegistryPolicy as Record<string, unknown>
      runtime.deniedTopLevelImports = []
      runtime.exactModelArtifactByteLength = 1
    }),
  ),
  false,
)
adversarialAssertions += 1

assert.equal(
  await verify(
    resign(binding, (draft) => {
      draft.finalCanvasCreatedByComfyUi = true
      draft.productionReady = true
    }),
  ),
  false,
)
adversarialAssertions += 1

assert.equal(adversarialAssertions, 9)

process.stdout.write(
  `${JSON.stringify({
    status: 'passed',
    bindingState: binding.bindingState,
    selectedSceneBindingCount:
      binding.packBinding.selectedSceneBindingCount,
    requiredContinuityExpectationCount:
      binding.selectedSceneContinuityBindings.reduce(
        (total, scene) =>
          total + scene.requiredContinuityExpectationKinds.length,
        0,
      ),
    controlledReferenceViewExpectationCount:
      binding.packBinding.controlledReferenceViewExpectationCount,
    rawPackPayloadEmbedded: false,
    canonicalInterfaceMutated: false,
    fixedConfinementAndSam2DenialPreserved: true,
    oneGpuAttemptCostEvent: true,
    productionReady: false,
    adversarialAssertions,
  })}\n`,
)

async function verify(
  value:
    LivingFrameControlledImageSelectedSceneVisualContinuityPackBinding,
): Promise<boolean> {
  return verifyLivingFrameControlledImageSelectedSceneVisualContinuityPackBinding(
    value,
    input,
  )
}

async function assertRejectsWithIssue(
  candidate:
    CreateLivingFrameControlledImageSelectedSceneVisualContinuityPackBindingInput,
  issueCode: string,
): Promise<void> {
  await assert.rejects(
    () =>
      compileLivingFrameControlledImageSelectedSceneVisualContinuityPackBinding(
        candidate,
      ),
    (error) =>
      error instanceof
        LivingFrameControlledImageSelectedSceneVisualContinuityPackBindingError
      && error.issues.some((issue) => issue.code === issueCode),
  )
}

function resign(
  source:
    LivingFrameControlledImageSelectedSceneVisualContinuityPackBinding,
  mutate: (draft: Record<string, unknown>) => void,
): LivingFrameControlledImageSelectedSceneVisualContinuityPackBinding {
  const {
    bindingDigestSha256: omitted,
    ...draft
  } = structuredClone(source) as
    LivingFrameControlledImageSelectedSceneVisualContinuityPackBinding
  void omitted
  mutate(draft)
  return {
    ...draft,
    bindingDigestSha256: sha256AuthorityValue(draft),
  } as unknown as
    LivingFrameControlledImageSelectedSceneVisualContinuityPackBinding
}
