import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  LivingFrameSemanticSoundTimingReconciliationError,
  reconcileLivingFrameSemanticSoundTiming,
  verifyLivingFrameSemanticSoundTimingReconciliation,
} from '../living-frame/living-frame-semantic-sound-timing-reconciliation'
import {
  createLivingFrameSemanticSoundTimingReconciliationSmokeFixture,
} from './fixtures/living-frame-semantic-sound-timing-reconciliation-fixture'

const phaseCompatible =
  await createLivingFrameSemanticSoundTimingReconciliationSmokeFixture(
    'hormuz',
  )
assert.equal(
  verifyLivingFrameSemanticSoundTimingReconciliation(
    phaseCompatible.reconciliation,
    phaseCompatible.input,
  ),
  true,
)
assert.equal(
  phaseCompatible.reconciliation.metrics.soundRequestCount,
  1,
)
assert.equal(
  phaseCompatible.reconciliation.metrics.canonicalCueCount,
  1,
)
assert.equal(
  phaseCompatible.reconciliation.metrics
    .phaseCompatibleCandidateCount,
  1,
)
assert.equal(
  phaseCompatible.reconciliation.metrics
    .semanticTriggerPhaseDivergenceCount,
  0,
)
assert.equal(
  phaseCompatible.reconciliation
    .allCurrentCanonicalCuesPhaseCompatible,
  true,
)
assert.equal(
  phaseCompatible.reconciliation
    .semanticTriggerDivergenceObserved,
  false,
)
const handoffUnit = phaseCompatible.reconciliation.units[0]!
assert.equal(
  handoffUnit.reconciliationStatus,
  'phase_compatible_semantic_trigger_candidate',
)
assert.equal(
  handoffUnit.semanticTrigger.eventType,
  'handoff',
)
assert.equal(
  handoffUnit.semanticTrigger.requiredSemanticPhase,
  'activate',
)
assert.equal(
  handoffUnit.canonicalCueObservation
    .containingSemanticPhase,
  'activate',
)
assert.deepEqual(
  handoffUnit.canonicalCueObservation.frameRange,
  {
    startFrame: 12,
    endFrameExclusive: 18,
    durationFrames: 6,
  },
)
assert.equal(
  handoffUnit.currentCanonicalCueFallsWithinRequiredSemanticPhase,
  true,
)
assert.equal(
  handoffUnit.currentCanonicalCueMayBeUsedAsProfessionalSemanticSoundProof,
  false,
)
assert.equal(
  handoffUnit.downstreamProfessionalSoundAdmissionBlocked,
  true,
)

const orderSpacedDivergence =
  await createLivingFrameSemanticSoundTimingReconciliationSmokeFixture(
    'musashi',
  )
assert.equal(
  verifyLivingFrameSemanticSoundTimingReconciliation(
    orderSpacedDivergence.reconciliation,
    orderSpacedDivergence.input,
  ),
  true,
)
assert.equal(
  orderSpacedDivergence.reconciliation.metrics
    .phaseCompatibleCandidateCount,
  0,
)
assert.equal(
  orderSpacedDivergence.reconciliation.metrics
    .semanticTriggerPhaseDivergenceCount,
  1,
)
assert.equal(
  orderSpacedDivergence.reconciliation
    .allCurrentCanonicalCuesPhaseCompatible,
  false,
)
assert.equal(
  orderSpacedDivergence.reconciliation
    .semanticTriggerDivergenceObserved,
  true,
)
const holdUnit =
  orderSpacedDivergence.reconciliation.units[0]!
assert.equal(
  holdUnit.reconciliationStatus,
  'blocked_semantic_trigger_phase_divergence',
)
assert.equal(holdUnit.semanticTrigger.eventType, 'hold')
assert.equal(
  holdUnit.semanticTrigger.requiredSemanticPhase,
  'demonstrate',
)
assert.equal(
  holdUnit.canonicalCueObservation
    .containingSemanticPhase,
  'activate',
)
assert.equal(
  holdUnit.currentCanonicalCueFallsWithinRequiredSemanticPhase,
  false,
)
assert.equal(
  holdUnit.downstreamProfessionalSoundAdmissionBlocked,
  true,
)

for (
  const reconciliation of [
    phaseCompatible.reconciliation,
    orderSpacedDivergence.reconciliation,
  ]
) {
  assert.equal(
    reconciliation
      .currentCanonicalTimingUsesSemanticTriggerEvidence,
    false,
  )
  assert.equal(
    reconciliation.professionalSemanticSoundTimingReady,
    false,
  )
  assert.equal(
    reconciliation
      .canonicalTimingOrSoundSyncCanProceedByThisReconciliation,
    false,
  )
  assert.equal(
    reconciliation.canonicalTimingOrSoundSyncMutated,
    false,
  )
  assert.equal(reconciliation.operationRegistered, false)
  assert.equal(reconciliation.dispatchGranted, false)
  assert.equal(reconciliation.runtimeExecuted, false)
  assert.equal(
    reconciliation.soundAssetSelectedOrGenerated,
    false,
  )
  assert.equal(reconciliation.artifactPersisted, false)
  assert.equal(reconciliation.assetManifestMutated, false)
  assert.equal(reconciliation.qaApproved, false)
  assert.equal(reconciliation.privateReviewApproved, false)
  assert.equal(reconciliation.renderAuthorized, false)
  assert.equal(reconciliation.actualCostCreated, false)
  assert.equal(reconciliation.customerCharged, false)
  assert.equal(reconciliation.subjectSpecificRouting, false)
  assert.equal(reconciliation.productionReady, false)
}

const serialized = JSON.stringify(
  orderSpacedDivergence.reconciliation,
)
for (
  const forbidden of [
    'Miyamoto',
    'Musashi',
    'Strait of Hormuz',
    'prompt',
    'audioBytes',
    'https://',
    'credential',
  ]
) {
  assert.equal(
    serialized.includes(forbidden),
    false,
  )
}

const forgedChoreography = structuredClone(
  phaseCompatible.input.choreographyBinding,
) as unknown as Record<string, unknown>
const forgedSoundProjections =
  forgedChoreography.soundRequestProjections as
    Array<Record<string, unknown>>
forgedSoundProjections[0]!.priority = 'supporting'
forgedChoreography.bindingDigestSha256 =
  choreographyDigest(forgedChoreography)
assert.throws(
  () => reconcileLivingFrameSemanticSoundTiming({
    ...phaseCompatible.input,
    choreographyBinding:
      forgedChoreography as never,
  }),
  (error: unknown) =>
    hasIssue(
      error,
      'sound_request_cue_metadata_mismatch',
    ),
)

const forgedTiming = structuredClone(
  phaseCompatible.input.canonicalTimingBinding,
) as unknown as {
  timingBindingDigestSha256: string
  scenes: Array<{
    soundCueBindings: Array<{
      frameRange: {
        startFrame: number
        endFrameExclusive: number
        durationFrames: number
      }
    }>
  }>
}
forgedTiming.scenes[0]!.soundCueBindings[0]!
  .frameRange = {
    startFrame: 20,
    endFrameExclusive: 26,
    durationFrames: 6,
  }
forgedTiming.timingBindingDigestSha256 =
  createHash('sha256')
    .update(
      canonicalJson(
        withoutKey(
          forgedTiming as unknown as Record<string, unknown>,
          'timingBindingDigestSha256',
        ),
      ),
      'utf8',
    )
    .digest('hex')
assert.throws(
  () => reconcileLivingFrameSemanticSoundTiming({
    ...phaseCompatible.input,
    canonicalTimingBinding: forgedTiming as never,
  }),
  (error: unknown) =>
    hasIssue(error, 'canonical_timing_binding_invalid'),
)

assert.throws(
  () => reconcileLivingFrameSemanticSoundTiming({
    ...phaseCompatible.input,
    choreographyBinding:
      orderSpacedDivergence.input.choreographyBinding,
  }),
  (error: unknown) =>
    hasIssue(error, 'source_lineage_mismatch')
    || hasIssue(error, 'scene_mismatch'),
)

const forgedReconciliation = structuredClone(
  phaseCompatible.reconciliation,
) as {
  authorityBoundary: {
    soundSyncAuthority: boolean
  }
}
forgedReconciliation.authorityBoundary
  .soundSyncAuthority = true
assert.equal(
  verifyLivingFrameSemanticSoundTimingReconciliation(
    forgedReconciliation,
    phaseCompatible.input,
  ),
  false,
)

const forgedReady = structuredClone(
  phaseCompatible.reconciliation,
) as {
  professionalSemanticSoundTimingReady: boolean
}
forgedReady.professionalSemanticSoundTimingReady = true
assert.equal(
  verifyLivingFrameSemanticSoundTimingReconciliation(
    forgedReady,
    phaseCompatible.input,
  ),
  false,
)

assert.throws(
  () => reconcileLivingFrameSemanticSoundTiming({
    ...phaseCompatible.input,
    callerSelectedHitFrame: 12,
  } as never),
  (error: unknown) =>
    hasIssue(error, 'input_invalid'),
)

console.log(
  JSON.stringify({
    smoke:
      'living-frame-semantic-sound-timing-reconciliation',
    controlledCases: 2,
    adversarialCases: 6,
    phaseCompatibleCandidateCount:
      phaseCompatible.reconciliation.metrics
        .phaseCompatibleCandidateCount,
    semanticTriggerPhaseDivergenceCount:
      orderSpacedDivergence.reconciliation.metrics
        .semanticTriggerPhaseDivergenceCount,
    professionalSemanticSoundTimingReady:
      phaseCompatible.reconciliation
        .professionalSemanticSoundTimingReady,
    status: 'passed',
  }),
)

function hasIssue(
  error: unknown,
  code: string,
): boolean {
  return error instanceof
      LivingFrameSemanticSoundTimingReconciliationError
    && error.issues.some((issue) => issue.code === code)
}

function choreographyDigest(
  value: Record<string, unknown>,
): string {
  return createHash('sha256')
    .update(
      canonicalJson(
        withoutKey(value, 'bindingDigestSha256'),
      ),
      'utf8',
    )
    .digest('hex')
}

function withoutKey(
  value: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  const clone = { ...value }
  delete clone[key]
  return clone
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value))
  ) return value
  if (Array.isArray(value)) return value.map(canonicalize)
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, canonicalize(record[key])]),
    )
  }
  throw new Error('Non-canonical smoke value.')
}
