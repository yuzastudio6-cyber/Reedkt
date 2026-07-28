import assert from 'node:assert/strict'

import type {
  LivingFrameProfessionalSkillComponent,
  LivingFrameProfessionalSkillComponentDraft,
} from '../../src/types/living-frame'
import type {
  LivingFrameSelectedSceneAdmission,
  LivingFrameSelectedSceneAuthorityExpectation,
} from '../../src/types/living-frame-selected-scene-admission'
import {
  LIVING_FRAME_SELECTED_SCENE_AUTHORITY_KINDS,
} from '../../src/types/living-frame-selected-scene-admission'
import type {
  LivingFrameSemanticPlanProjection,
} from '../../src/types/living-frame-semantic-plan-projection'
import {
  createLivingFrameProfessionalSkillComponent,
  deriveLivingFrameEstimateInputs,
} from '../../src/lib/living-frame/living-frame-contract'
import {
  createLivingFrameFixtureDrafts,
} from '../../src/lib/living-frame/living-frame-fixtures'
import {
  createLivingFrameSemanticSceneProposalFixtures,
} from '../../src/lib/living-frame/living-frame-semantic-scene-proposal-fixtures'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  compileLivingFrameSelectedSceneAdmission,
  verifyLivingFrameSelectedSceneAdmission,
} from '../living-frame/living-frame-selected-scene-admission'
import {
  compileLivingFrameSemanticPlanProjection,
} from '../living-frame/living-frame-semantic-plan-projection'

const proposalFixtures =
  await createLivingFrameSemanticSceneProposalFixtures()
const componentDrafts = createLivingFrameFixtureDrafts()
const candidateProjection = await compileLivingFrameSemanticPlanProjection({
  deferredComponent: await createDeferred(
    componentDrafts.helicopterSelectiveMotion,
  ),
  semanticProposalBinding: proposalFixtures.helicopter,
})
const nonUseProjection = await compileLivingFrameSemanticPlanProjection({
  deferredComponent: await createDeferred(
    componentDrafts.emotionalMonologueNonUse,
  ),
  semanticProposalBinding: proposalFixtures.emotionalNonUse,
})
const canonicalScope = {
  workspaceId: 'workspace.lf.generic',
  projectId: 'project.lf.generic',
  editSessionId: 'edit.lf.generic',
  handoffId: 'handoff.lf.generic',
} as const

const currentExpectations = expectationsFor(candidateProjection)
const candidate = await compileLivingFrameSelectedSceneAdmission({
  canonicalScope,
  semanticPlanProjection: candidateProjection,
  authorityExpectations: currentExpectations,
})

assert.equal(
  candidate.admissionState,
  'candidate_ready_for_canonical_owner_decision',
)
assert.equal(candidate.candidateScenes.length, 1)
assert.equal(candidate.candidateScenes[0]?.sourceDecision, 'defer')
assert.equal(candidate.deliberateNonUse, false)
assert.deepEqual(candidate.blockerCodes, [
  'canonical_plan_owner_selection_required',
  'canonical_estimate_required',
  'canonical_approval_required',
  'approved_snapshot_required',
])
assert.equal(candidate.metrics.unresolvedAuthorityExpectationCount, 0)
assert.equal(candidate.authorityBoundary.selectedSceneAuthority, false)
assert.equal(candidate.authorityBoundary.masterTimingAuthority, false)
assert.equal(candidate.authorityBoundary.soundSyncAuthority, false)
assert.equal(candidate.authorityBoundary.estimateAuthority, false)
assert.equal(candidate.authorityBoundary.approvalAuthority, false)
assert.equal(candidate.authorityBoundary.snapshotAuthority, false)
assert.equal(candidate.authorityBoundary.workGraphAuthority, false)
assert.equal(candidate.authorityBoundary.providerAuthority, false)
assert.equal(candidate.authorityBoundary.toolRouteAuthority, false)
assert.equal(candidate.authorityBoundary.rendererAuthority, false)
assert.equal(candidate.authorityBoundary.productionAuthority, false)
assert.equal(candidate.containsSelectedScene, false)
assert.equal(candidate.subjectSpecificRouting, false)
assert.equal(candidate.promotionAllowed, false)
assert.equal(
  await verifyLivingFrameSelectedSceneAdmission({
    admission: candidate,
    semanticPlanProjection: candidateProjection,
  }),
  true,
)

const deterministicReplay =
  await compileLivingFrameSelectedSceneAdmission({
    canonicalScope,
    semanticPlanProjection: candidateProjection,
    authorityExpectations: [...currentExpectations].reverse(),
  })
assert.equal(
  deterministicReplay.admissionDigestSha256,
  candidate.admissionDigestSha256,
)

const nonUse = await compileLivingFrameSelectedSceneAdmission({
  canonicalScope,
  semanticPlanProjection: nonUseProjection,
  authorityExpectations: expectationsFor(nonUseProjection),
})
assert.equal(nonUse.admissionState, 'deliberate_non_use_preserved')
assert.equal(nonUse.deliberateNonUse, true)
assert.equal(nonUse.candidateScenes.length, 0)
assert.equal(
  nonUse.authorityExpectations.find(
    (entry) => entry.authorityKind === 'visual_continuity_pack',
  )?.expectationState,
  'missing',
)
assert.equal(
  await verifyLivingFrameSelectedSceneAdmission({
    admission: nonUse,
    semanticPlanProjection: nonUseProjection,
  }),
  true,
)

const staleReasoning = mutateExpectation(
  currentExpectations,
  'released_reasoning_result',
  {
    expectationState: 'stale_or_mismatched',
    authorityDigestSha256: hash('stale-reasoning'),
  },
)
const blocked = await compileLivingFrameSelectedSceneAdmission({
  canonicalScope,
  semanticPlanProjection: candidateProjection,
  authorityExpectations: staleReasoning,
})
assert.equal(
  blocked.admissionState,
  'blocked_by_upstream_authority_expectation',
)
assert.ok(
  blocked.blockerCodes.includes('released_reasoning_result_required'),
)
assert.equal(blocked.metrics.unresolvedAuthorityExpectationCount, 1)

const staleTiming = mutateExpectation(
  currentExpectations,
  'current_master_timing',
  {
    expectationState: 'stale_or_mismatched',
    authorityDigestSha256: hash('stale-timing'),
  },
)
const timingBlocked = await compileLivingFrameSelectedSceneAdmission({
  canonicalScope,
  semanticPlanProjection: candidateProjection,
  authorityExpectations: staleTiming,
})
assert.ok(
  timingBlocked.blockerCodes.includes('current_master_timing_required'),
)

const wrongCurrentFrame = mutateExpectation(
  currentExpectations,
  'confirmed_output_frame',
  {
    expectationState: 'controlled_current_match',
    authorityDigestSha256: hash('wrong-current-frame'),
  },
)
await assert.rejects(
  () => compileLivingFrameSelectedSceneAdmission({
    canonicalScope,
    semanticPlanProjection: candidateProjection,
    authorityExpectations: wrongCurrentFrame,
  }),
  /does not match its source/,
)

await assert.rejects(
  () => compileLivingFrameSelectedSceneAdmission({
    canonicalScope,
    semanticPlanProjection: candidateProjection,
    authorityExpectations: currentExpectations.slice(1),
  }),
  /incomplete/,
)

await assert.rejects(
  () => compileLivingFrameSelectedSceneAdmission({
    canonicalScope,
    semanticPlanProjection: candidateProjection,
    authorityExpectations: [
      ...currentExpectations,
      currentExpectations[0] as LivingFrameSelectedSceneAuthorityExpectation,
    ],
  }),
  /invalid/,
)

const fakeUnknownExpectation = structuredClone(
  currentExpectations,
) as unknown as Array<Record<string, unknown>>
fakeUnknownExpectation[0]!.providerId = 'not-allowed'
await assert.rejects(
  () => compileLivingFrameSelectedSceneAdmission({
    canonicalScope,
    semanticPlanProjection: candidateProjection,
    authorityExpectations:
      fakeUnknownExpectation as unknown as
        LivingFrameSelectedSceneAuthorityExpectation[],
  }),
  /invalid/,
)

const tamperedDigest = {
  ...candidate,
  admissionDigestSha256: hash('forged'),
}
assert.equal(
  await verifyLivingFrameSelectedSceneAdmission({
    admission: tamperedDigest,
    semanticPlanProjection: candidateProjection,
  }),
  false,
)

const forgedPromotion = signAdmission({
  ...withoutDigest(candidate),
  containsSelectedScene: true,
  promotionAllowed: true,
  authorityBoundary: {
    ...candidate.authorityBoundary,
    selectedSceneAuthority: true,
    approvalAuthority: true,
    snapshotAuthority: true,
    productionAuthority: true,
  },
} as unknown as Omit<
  LivingFrameSelectedSceneAdmission,
  'admissionDigestSha256'
>)
assert.equal(
  await verifyLivingFrameSelectedSceneAdmission({
    admission: forgedPromotion,
    semanticPlanProjection: candidateProjection,
  }),
  false,
)

const unknownTopLevel = {
  ...candidate,
  providerRoute: 'forbidden',
}
assert.equal(
  await verifyLivingFrameSelectedSceneAdmission({
    admission: unknownTopLevel,
    semanticPlanProjection: candidateProjection,
  }),
  false,
)

const differentScope = await compileLivingFrameSelectedSceneAdmission({
  canonicalScope: {
    ...canonicalScope,
    editSessionId: 'edit.lf.other',
  },
  semanticPlanProjection: candidateProjection,
  authorityExpectations: currentExpectations,
})
assert.notEqual(
  differentScope.admissionDigestSha256,
  candidate.admissionDigestSha256,
)

const forgedProjection = {
  ...candidateProjection,
  projectionDigestSha256: hash('wrong-projection'),
}
await assert.rejects(
  () => compileLivingFrameSelectedSceneAdmission({
    canonicalScope,
    semanticPlanProjection: forgedProjection,
    authorityExpectations: currentExpectations,
  }),
  /projection is invalid/,
)

console.log(JSON.stringify({
  suite: 'living-frame-selected-scene-admission',
  controlledCandidateCases: 1,
  deliberateNonUseCases: 1,
  blockedAuthorityCases: 2,
  adversarialAssertions: 8,
  deterministicExpectationOrdering: true,
  subjectNeutralContract: true,
  selectedSceneAuthorityGranted: false,
  masterTimingOrSoundSyncAuthorityGranted: false,
  estimateOrApprovalOrSnapshotAuthorityGranted: false,
  workProviderToolOrRenderAuthorityGranted: false,
  productionAuthorityGranted: false,
}))

function expectationsFor(
  projection: LivingFrameSemanticPlanProjection,
): LivingFrameSelectedSceneAuthorityExpectation[] {
  return LIVING_FRAME_SELECTED_SCENE_AUTHORITY_KINDS.map((kind) => {
    if (
      kind === 'visual_continuity_pack'
      && projection.sourceBindings.visualContinuityPackDigestSha256
        === null
    ) {
      return {
        authorityKind: kind,
        expectationState: 'missing',
        authorityDigestSha256: null,
      }
    }
    return {
      authorityKind: kind,
      expectationState: 'controlled_current_match',
      authorityDigestSha256: digestFor(kind, projection),
    }
  })
}

function digestFor(
  kind: LivingFrameSelectedSceneAuthorityExpectation['authorityKind'],
  projection: LivingFrameSemanticPlanProjection,
): string {
  if (kind === 'confirmed_output_frame') {
    return projection.projectedComponent.inputBindings.outputFrame
      .expectedDigestSha256
  }
  if (kind === 'current_master_timing') {
    return projection.projectedComponent.inputBindings.masterTiming
      .expectedDigestSha256
  }
  if (kind === 'visual_continuity_pack') {
    return projection.sourceBindings.visualContinuityPackDigestSha256
      ?? hash('absent-continuity')
  }
  return hash(`controlled-${kind}`)
}

function mutateExpectation(
  source: readonly LivingFrameSelectedSceneAuthorityExpectation[],
  kind: LivingFrameSelectedSceneAuthorityExpectation['authorityKind'],
  replacement: Pick<
    LivingFrameSelectedSceneAuthorityExpectation,
    'expectationState' | 'authorityDigestSha256'
  >,
): LivingFrameSelectedSceneAuthorityExpectation[] {
  return source.map((entry) => entry.authorityKind === kind
    ? { ...entry, ...replacement }
    : { ...entry })
}

async function createDeferred(
  source: LivingFrameProfessionalSkillComponentDraft,
): Promise<LivingFrameProfessionalSkillComponent> {
  return createLivingFrameProfessionalSkillComponent({
    ...structuredClone(source),
    status: 'deferred',
    decisionSummary: {
      decision: 'deferred',
      reasonCode: 'capability_qualification_required',
      summary:
        'Living Frame awaits current shared planning authorities.',
      selectedMode: null,
      rejectedConcepts: [],
    },
    scenePlans: [],
    continuityPackRefs: [],
    capabilityRequirements: [],
    estimateInputs: deriveLivingFrameEstimateInputs({
      scenePlans: [],
      continuityReferenceCount: 0,
      topLevelQaExpectationCount: 0,
      motionComplexity: 'none',
      cameraComplexity: 'none',
      controlledIllustrationComplexity: 'none',
      generatedVideoExpectation: 'not_required',
    }),
    qaExpectationCodes: [],
  })
}

function signAdmission(
  draft: Omit<
    LivingFrameSelectedSceneAdmission,
    'admissionDigestSha256'
  >,
): LivingFrameSelectedSceneAdmission {
  return {
    ...draft,
    admissionDigestSha256: sha256AuthorityValue(draft),
  }
}

function withoutDigest(
  value: LivingFrameSelectedSceneAdmission,
): Omit<LivingFrameSelectedSceneAdmission, 'admissionDigestSha256'> {
  const { admissionDigestSha256: _ignored, ...draft } = value
  void _ignored
  return draft
}

function hash(value: string): string {
  return sha256AuthorityValue(value)
}
