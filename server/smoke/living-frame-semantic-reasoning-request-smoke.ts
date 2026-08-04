import assert from 'node:assert/strict'

import {
  LivingFrameSemanticRequestContractError,
  calculateLivingFrameSemanticPayloadDigest,
  calculateLivingFrameSemanticReasoningRequestDigest,
  calculateLivingFrameSemanticSceneProposalSchemaDigest,
  createLivingFrameSemanticReasoningRequest,
  validateLivingFrameSemanticReasoningRequest,
} from '../../src/lib/living-frame/living-frame-semantic-reasoning-request-contract'
import {
  createLivingFrameSemanticReasoningRequestAdversarialFixtures,
  createLivingFrameSemanticReasoningRequestFixtureDrafts,
  createLivingFrameSemanticReasoningRequestFixtures,
} from '../../src/lib/living-frame/living-frame-semantic-reasoning-request-fixtures'
import type {
  LivingFrameSemanticReasoningRequest,
  LivingFrameSemanticReasoningRequestDraft,
  LivingFrameSemanticSceneProposalResult,
} from '../../src/types/living-frame-semantic-reasoning-request'
import {
  canonicalLivingFrameSemanticReasoningRequestSchema,
  canonicalLivingFrameSemanticSceneProposalJsonSchema,
  canonicalLivingFrameSemanticSceneProposalResultSchema,
  canonicalLivingFrameSemanticSceneProposalSchemaDigest,
  validateCanonicalLivingFrameSemanticReasoningRequest,
} from '../validation/canonical-living-frame-semantic-reasoning-request-schemas'

async function expectDraftRejection(
  payload: unknown,
  expectedCode: string,
  fixtureId: string,
): Promise<void> {
  let caught: unknown
  try {
    await createLivingFrameSemanticReasoningRequest(
      payload as LivingFrameSemanticReasoningRequestDraft,
    )
  } catch (error) {
    caught = error
  }
  assert.ok(
    caught instanceof LivingFrameSemanticRequestContractError,
    `${fixtureId} must fail through the Living Frame contract error.`,
  )
  assert.ok(
    caught.issues.some((entry) => entry.code === expectedCode),
    `${fixtureId} must report ${expectedCode}; got ${
      caught.issues.map((entry) => entry.code).join(', ')
    }.`,
  )
}

function assertAllAuthorityClosed(
  request: LivingFrameSemanticReasoningRequest,
): void {
  assert.equal(request.authorityBoundary.controlledSourceContractOnly, true)
  for (const [key, value] of Object.entries(request.authorityBoundary)) {
    if (key === 'controlledSourceContractOnly') continue
    assert.equal(value, false, `${key} must remain literal false.`)
  }
  assert.equal(request.routeAssurance.providerTransportAuthorized, false)
  assert.equal(request.routeAssurance.providerCallMade, false)
  assert.equal(request.routeAssurance.oldKimiToGptFallbackAllowed, false)
  assert.equal(request.routeAssurance.qwen25VlReasoningRouteAllowed, false)
  assert.equal(request.routeAssurance.mediaProviderOperationAllowed, false)
  assert.equal(
    request.routeAssurance.sharedRouteDataAssuranceDigestSha256,
    null,
  )
  assert.equal(request.routeAssurance.providerEnvelopeState, 'unbound')
  assert.equal(request.routeAssurance.providerEnvelopeDigestSha256, null)
}

const fixtures =
  await createLivingFrameSemanticReasoningRequestFixtures()
for (const [fixtureName, request] of Object.entries(fixtures)) {
  const validation =
    await validateLivingFrameSemanticReasoningRequest(request)
  assert.equal(validation.ok, true, `${fixtureName} must validate.`)
  const serverValidation =
    await validateCanonicalLivingFrameSemanticReasoningRequest(request)
  assert.equal(
    serverValidation.ok,
    true,
    `${fixtureName} must pass the server schema boundary.`,
  )
  assert.equal(
    canonicalLivingFrameSemanticReasoningRequestSchema.safeParse(request)
      .success,
    true,
  )
  assertAllAuthorityClosed(request)
  assert.notEqual(
    request.semanticPayloadDigestSha256,
    request.canonicalBindings.preapprovalInputAuthorityDigestSha256,
  )
  assert.notEqual(
    request.semanticPayloadDigestSha256,
    request.canonicalBindings.visualEvidenceBindingDigestSha256,
  )
  assert.notEqual(
    request.semanticPayloadDigestSha256,
    request.outputContract.outputJsonSchemaDigestSha256,
  )
  assert.notEqual(
    request.contractDigestSha256,
    request.semanticPayloadDigestSha256,
  )
  assert.ok(
    request.blockingReasonCodes.includes(
      'shared_route_data_assurance_required',
    ),
  )
}

for (const fixture of [
  fixtures.musashi,
  fixtures.hormuz,
  fixtures.emotionalNonUse,
]) {
  assert.equal(
    fixture.semanticPayload.evidence.speechExpectation.state,
    'generic_source_speech_evidence_required',
  )
  assert.equal(
    fixture.semanticPayload.evidence.speechExpectation
      .genericSourceSpeechEvidenceDigestSha256,
    null,
  )
  assert.ok(
    fixture.blockingReasonCodes.includes(
      'generic_source_speech_evidence_required',
    ),
  )
}
assert.equal(
  fixtures.helicopter.semanticPayload.evidence.speechExpectation.state,
  'not_applicable_no_source_speech',
)
assert.equal(
  fixtures.helicopter.blockingReasonCodes.includes(
    'generic_source_speech_evidence_required',
  ),
  false,
)
assert.deepEqual(
  fixtures.emotionalNonUse.semanticPayload.allowedModes,
  [],
)
assert.equal(
  fixtures.emotionalNonUse.semanticPayload.requestedDecisionKinds.includes(
    'semantic_candidate',
  ),
  false,
)

const drafts = createLivingFrameSemanticReasoningRequestFixtureDrafts()
for (const fixture of
  createLivingFrameSemanticReasoningRequestAdversarialFixtures(drafts)) {
  await expectDraftRejection(
    fixture.payload,
    fixture.expectedIssueCode,
    fixture.fixtureId,
  )
}

const expectedOutputSchemaDigest =
  await calculateLivingFrameSemanticSceneProposalSchemaDigest()
assert.equal(
  await canonicalLivingFrameSemanticSceneProposalSchemaDigest(),
  expectedOutputSchemaDigest,
)
for (const request of Object.values(fixtures)) {
  assert.equal(
    request.outputContract.outputJsonSchemaDigestSha256,
    expectedOutputSchemaDigest,
  )
}
const outputJsonSchema =
  await canonicalLivingFrameSemanticSceneProposalJsonSchema()
assert.equal(outputJsonSchema.type, 'object')
assert.equal(outputJsonSchema.additionalProperties, false)

const setPermutation = cloneJson(drafts.hormuz)
setPermutation.semanticPayload.intentSignals =
  [...setPermutation.semanticPayload.intentSignals].reverse()
setPermutation.semanticPayload.allowedModes =
  [...setPermutation.semanticPayload.allowedModes].reverse()
setPermutation.semanticPayload.segmentContexts[0].evidenceRefIds =
  [...setPermutation.semanticPayload.segmentContexts[0].evidenceRefIds]
    .reverse()
setPermutation.semanticPayload.segmentContexts[0].candidateModeHints =
  [...setPermutation.semanticPayload.segmentContexts[0].candidateModeHints]
    .reverse()
assert.equal(
  (
    await createLivingFrameSemanticReasoningRequest(
      setPermutation as unknown as LivingFrameSemanticReasoningRequestDraft,
    )
  ).contractDigestSha256,
  fixtures.hormuz.contractDigestSha256,
  'Set-like permutations must canonicalize to the same digest.',
)

const semanticOrderChange = cloneJson(drafts.helicopter)
semanticOrderChange.semanticPayload.semanticConstraints[0].order = 2
semanticOrderChange.semanticPayload.semanticConstraints[2].order = 0
assert.notEqual(
  (
    await createLivingFrameSemanticReasoningRequest(
      semanticOrderChange as unknown as
        LivingFrameSemanticReasoningRequestDraft,
    )
  ).contractDigestSha256,
  fixtures.helicopter.contractDigestSha256,
  'Changing ordered semantic constraints must change the digest.',
)

const payloadDigest = await calculateLivingFrameSemanticPayloadDigest(
  drafts.musashi.semanticPayload,
)
assert.equal(payloadDigest, fixtures.musashi.semanticPayloadDigestSha256)
assert.equal(
  await calculateLivingFrameSemanticReasoningRequestDigest(drafts.musashi),
  fixtures.musashi.contractDigestSha256,
)

const outputSchemaTamper = cloneJson(fixtures.helicopter)
outputSchemaTamper.outputContract.outputJsonSchemaDigestSha256 =
  digest('a')
const outputSchemaTamperValidation =
  await validateLivingFrameSemanticReasoningRequest(outputSchemaTamper)
assert.equal(outputSchemaTamperValidation.ok, false)
assert.ok(
  !outputSchemaTamperValidation.ok
  && outputSchemaTamperValidation.issues.some(
    (entry) => entry.code === 'output_schema_digest_mismatch',
  ),
)

const payloadTamper = cloneJson(fixtures.helicopter)
payloadTamper.semanticPayload.semanticConstraints[0].derivedSummary =
  'The primary motion changed after the payload was digested.'
const payloadTamperValidation =
  await validateLivingFrameSemanticReasoningRequest(payloadTamper)
assert.equal(payloadTamperValidation.ok, false)
assert.ok(
  !payloadTamperValidation.ok
  && payloadTamperValidation.issues.some(
    (entry) => entry.code === 'semantic_payload_digest_mismatch',
  ),
)

const contractDigestTamper = cloneJson(fixtures.helicopter)
contractDigestTamper.contractDigestSha256 = digest('b')
const contractDigestTamperValidation =
  await validateLivingFrameSemanticReasoningRequest(contractDigestTamper)
assert.equal(contractDigestTamperValidation.ok, false)
assert.ok(
  !contractDigestTamperValidation.ok
  && contractDigestTamperValidation.issues.some(
    (entry) => entry.code === 'digest_mismatch',
  ),
)

const conflatedAuthorityDraft = cloneJson(drafts.helicopter)
conflatedAuthorityDraft.canonicalBindings
  .preapprovalInputAuthorityDigestSha256 =
    fixtures.helicopter.semanticPayloadDigestSha256
await expectDraftRejection(
  conflatedAuthorityDraft,
  'authority_digest_not_separated',
  'conflated_authority_and_payload_digest',
)

const sceneProposal = validSceneProposalResult()
assert.equal(
  canonicalLivingFrameSemanticSceneProposalResultSchema.safeParse(
    sceneProposal,
  ).success,
  true,
)
const sceneProposalUnknownKey = {
  ...sceneProposal,
  providerId: 'forbidden-provider',
}
assert.equal(
  canonicalLivingFrameSemanticSceneProposalResultSchema.safeParse(
    sceneProposalUnknownKey,
  ).success,
  false,
)
const sceneProposalPromotion = cloneJson(sceneProposal)
const mutableSceneProposalPromotion =
  sceneProposalPromotion as unknown as {
  selectedSceneAuthority: boolean
}
mutableSceneProposalPromotion.selectedSceneAuthority = true
assert.equal(
  canonicalLivingFrameSemanticSceneProposalResultSchema.safeParse(
    sceneProposalPromotion,
  ).success,
  false,
)
const exactFramePromotion = cloneJson(sceneProposal)
const mutableExactFramePromotion =
  exactFramePromotion as unknown as {
  sceneProposals: Array<{
    semanticTimingConstraints: Array<{ exactFramesProvided: boolean }>
  }>
}
mutableExactFramePromotion.sceneProposals[0]
  .semanticTimingConstraints[0].exactFramesProvided = true
assert.equal(
  canonicalLivingFrameSemanticSceneProposalResultSchema.safeParse(
    exactFramePromotion,
  ).success,
  false,
)

const nonJson = cloneJson(drafts.helicopter) as unknown as {
  semanticPayload: { unsafe?: unknown }
}
nonJson.semanticPayload.unsafe = undefined
await expectDraftRejection(nonJson, 'non_json_input', 'undefined_payload')

console.log(
  `Living Frame semantic request smoke passed: ${
    Object.keys(fixtures).length
  } controlled requests, ${
    createLivingFrameSemanticReasoningRequestAdversarialFixtures(drafts)
      .length
  } adversarial cases, strict output schema, separated digests, closed speech/data/provider/runtime gates.`,
)

function validSceneProposalResult():
LivingFrameSemanticSceneProposalResult {
  return {
    schemaVersion: 'living-frame-semantic-scene-proposal-result-v1',
    resultClass: 'living_frame_semantic_scene_proposal_content_only',
    overallDecision: 'candidates_proposed',
    decisions: [{
      semanticDecisionKey: 'decision.helicopter',
      order: 0,
      decisionKind: 'semantic_candidate',
      reasonCode: 'selective_motion_improves_comprehension',
      derivedSummary:
        'A controlled Living Still candidate can demonstrate rotor operation.',
      evidenceCitations: [{
        evidenceRefId: 'evidence.helicopter.visual',
      }],
      sceneProposalKeys: ['scene.helicopter'],
    }],
    sceneProposals: [{
      sceneProposalKey: 'scene.helicopter',
      order: 0,
      semanticDecisionKey: 'decision.helicopter',
      segmentContextIds: ['segment.helicopter'],
      mode: 'living_still',
      sourceTruthMode: 'controlled_source_expectation',
      narrativePurposeCode: 'explain_mechanical_operation',
      visualVerb: 'rotate',
      importance: 'important',
      derivedSummary:
        'Keep the helicopter body anchored while the rotor demonstrates operation.',
      focalPrimaryComponentKey: 'component.rotor',
      components: [{
        componentKey: 'component.rotor',
        order: 0,
        role: 'mechanical_component',
        focalRole: 'primary',
        derivedSummary:
          'The isolated main rotor is the only focal-primary motion.',
        parentComponentKey: null,
        anchorComponentKey: null,
        depthBand: 'subject_plane',
        transparencyExpectation: 'still_alpha_required',
        alphaSourceExpectation:
          'postprocessed_still_mask_requires_qa',
        provenanceExpectation:
          'approved_source_asset_expectation',
        capabilityKeys: [
          'foreground_component_extraction',
          'deterministic_scene_composition',
        ],
        evidenceCitations: [{
          evidenceRefId: 'evidence.helicopter.visual',
        }],
      }],
      componentDependencies: [],
      miniSkillProposals: [{
        activationKey: 'activation.rotor',
        order: 0,
        miniSkillKey: 'mechanical_part_motion',
        role: 'required',
        decision: 'use_full',
        intensity: 'standard',
        reasonCode: 'selective_motion_improves_comprehension',
        derivedSummary:
          'Rotate around the approved pivot with physical easing.',
        linkedComponentKeys: ['component.rotor'],
        linkedTimingConstraintKeys: ['timing.rotor'],
        dependsOnActivationKeys: [],
        conflictsWithActivationKeys: [],
      }],
      semanticTimingConstraints: [{
        timingConstraintKey: 'timing.rotor',
        order: 0,
        phase: 'activate',
        cueCode: 'primary_motion_requested',
        derivedSummary:
          'Begin rotor motion only when the mechanical idea is introduced.',
        exactFramesProvided: false,
      }],
      attentionConstraints: [{
        attentionConstraintKey: 'attention.rotor',
        order: 0,
        eventType: 'hold',
        target: 'visual',
        methods: ['motion_emphasis_expectation'],
        derivedSummary:
          'Hold attention on the rotor while the operation is explained.',
        exactFramesProvided: false,
      }],
      semanticScaleConstraints: [],
      soundConstraints: [{
        soundConstraintKey: 'sound.rotor',
        order: 0,
        linkedComponentKey: 'component.rotor',
        purpose: 'mechanical_presence',
        priority: 'supporting',
        narrationProtection: 'strict',
        duckingExpectation: 'downstream_soundsync_required',
        derivedSummary:
          'Use a restrained rotor bed only after SoundSync placement.',
        exactCuePlacementProvided: false,
        exactMixProvided: false,
      }],
      regionSafety: {
        captions: 'requires_downstream_verification',
        face: 'requires_downstream_verification',
        gestures: 'requires_downstream_verification',
      },
      fallbackLadder: [
        'full_living_frame',
        'simplified_depth_composition',
        'static_card',
        'no_extra_visual',
      ],
      continuityExpectationKinds: [
        'style_bible',
        'object_identity_sheet',
        'scene_design_sheet',
        'motion_language_sheet',
        'sound_language_sheet',
        'alpha_edge_rules',
      ],
      qaExpectationCodes: [
        'one_focal_primary_expected',
        'pivot_physics_qa_required',
        'semantic_timing_binding_required',
        'narration_protection_required',
      ],
    }],
    selectedSceneAuthority: false,
    exactFrameAuthority: false,
    exactSoundCueAuthority: false,
    estimateAuthority: false,
    approvalAuthority: false,
    providerOrToolSelectionAuthority: false,
    workOrRuntimeAuthority: false,
  }
}

function digest(character: string): string {
  return character.repeat(64)
}

type DeepMutable<T> =
  T extends readonly (infer Item)[]
    ? DeepMutable<Item>[]
    : T extends object
      ? { -readonly [Key in keyof T]: DeepMutable<T[Key]> }
      : T

function cloneJson<T>(value: T): DeepMutable<T> {
  return JSON.parse(JSON.stringify(value)) as DeepMutable<T>
}
