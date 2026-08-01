import assert from 'node:assert/strict'

import {
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
} from '../../src/types/living-frame-active-non-illustration-aggregate'
import {
  compileLivingFrameActiveNonIllustrationAggregate,
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_EVIDENCE_PACKET_VERSION,
  verifyLivingFrameActiveNonIllustrationAggregate,
  type CompileLivingFrameActiveNonIllustrationAggregateInput,
} from '../living-frame/living-frame-active-non-illustration-aggregate'
import {
  compileLivingFrameNonIllustrationReadinessAudit,
} from '../living-frame/living-frame-non-illustration-readiness-audit'
import {
  compileLivingFrameOwnerScopeAmendment,
} from '../living-frame/living-frame-owner-scope-amendment'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

type DeepMutable<T> =
  T extends readonly (infer Item)[]
    ? DeepMutable<Item>[]
    : T extends object
      ? { -readonly [Key in keyof T]: DeepMutable<T[Key]> }
      : T

const cloneMutable = <T>(value: T): DeepMutable<T> =>
  structuredClone(value) as DeepMutable<T>

const ownerScopeAmendment =
  compileLivingFrameOwnerScopeAmendment()
const readinessAudit =
  compileLivingFrameNonIllustrationReadinessAudit({
    ownerScopeAmendment,
  })

const baseInput: CompileLivingFrameActiveNonIllustrationAggregateInput = {
  ownerScopeAmendment,
  readinessAudit,
  evidencePackets:
    LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS.map(
      (caseId) => ({
        packetId: `living-frame.active-scope.${caseId}.v1`,
        packetVersion:
          LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_EVIDENCE_PACKET_VERSION,
        packetDigestSha256:
          sha256AuthorityValue({ caseId, sourceOnly: true }),
        canonicalRereadRequired: true,
        runtimeEvidenceIncluded: false,
        pausedEvidenceIncluded: false,
      }),
    ),
}

const aggregate =
  compileLivingFrameActiveNonIllustrationAggregate(baseInput)

assert.equal(
  verifyLivingFrameActiveNonIllustrationAggregate(
    aggregate,
    baseInput,
  ),
  true,
)
assert.equal(
  aggregate.contractVersion,
  'living-frame-active-non-illustration-aggregate-v1',
)
assert.equal(aggregate.activeCaseCount, 12)
assert.equal(aggregate.activeScopeCount, 12)
assert.equal(aggregate.pausedScopeCount, 7)
assert.equal(aggregate.cases.length, 12)
assert.deepEqual(
  aggregate.cases.map((entry) => entry.caseId),
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
)
assert.deepEqual(
  aggregate.cases.map((entry) => entry.activeScope),
  ownerScopeAmendment.activeScope,
)
assert.deepEqual(
  aggregate.pausedScopesRejected,
  ownerScopeAmendment.pausedScope,
)
assert.equal(
  aggregate.cases.every((entry, order) =>
    entry.order === order
    && entry.canonicalOwnersPreserved
    && !entry.historicalAggregateEvidenceAccepted
    && !entry.pausedEvidenceMaySatisfyCase
    && entry.canonicalRereadRequired
    && !entry.runtimeExecutionClaimed
    && entry.deterministicQaRequired
    && entry.postrenderAiVisualInspectionRequired
    && entry.completeTimeCoverageRequired
    && entry.separateVerifiedAudioEvidenceRequired
    && entry.headQaRecommendationRequired
    && entry.nPlusOneRepairAndReinspectionRequiredOnFailure
    && entry.canonicalPrivateReviewRequired
    && entry.requiredDependencyIds.length >= 2),
  true,
)
assert.equal(
  ownerScopeAmendment.pausedScope.every((pausedScope) =>
    !new Set<string>(
      aggregate.cases.map((entry) => entry.activeScope),
    ).has(pausedScope)),
  true,
)
assert.equal(aggregate.historicalAggregateImported, false)
assert.equal(aggregate.historicalAggregateCaseCountUsed, false)
assert.equal(
  aggregate.historicalCharacterOrRiggingEvidenceAccepted,
  false,
)
assert.equal(aggregate.activePrivateInternalReady, false)
assert.equal(aggregate.aggregateRuntimeReady, false)
assert.equal(aggregate.authorityBoundary.sourceManifestOnly, true)
assert.equal(aggregate.authorityBoundary.masterTimingAuthority, false)
assert.equal(aggregate.authorityBoundary.rendererAuthority, false)
assert.equal(aggregate.authorityBoundary.runtimeAuthority, false)
assert.equal(aggregate.operationRegistered, false)
assert.equal(aggregate.dispatchGranted, false)
assert.equal(aggregate.runtimeExecuted, false)
assert.equal(aggregate.productionReady, false)

let adversarialChecks = 0
const reject = (
  mutate: (
    candidate:
      DeepMutable<CompileLivingFrameActiveNonIllustrationAggregateInput>,
  ) => void,
) => {
  const candidate = cloneMutable(baseInput)
  mutate(candidate)
  assert.throws(() =>
    compileLivingFrameActiveNonIllustrationAggregate(candidate))
  adversarialChecks += 1
}

reject((candidate) => {
  Object.assign(candidate.evidencePackets[0]!, {
    runtimeEvidenceIncluded: true,
  })
})
reject((candidate) => {
  Object.assign(candidate.evidencePackets[1]!, {
    pausedEvidenceIncluded: true,
  })
})
reject((candidate) => {
  Object.assign(candidate.evidencePackets[2]!, {
    canonicalRereadRequired: false,
  })
})
reject((candidate) => {
  candidate.evidencePackets[3]!.packetId =
    'living-frame.active-scope.character-keypose.v1'
})
reject((candidate) => {
  candidate.evidencePackets[4]!.packetVersion =
    'living-frame-active-scope-evidence-packet-v2'
})
reject((candidate) => {
  candidate.evidencePackets[5]!.packetDigestSha256 = 'forged'
})
reject((candidate) => {
  candidate.evidencePackets[6]!.packetDigestSha256 =
    candidate.evidencePackets[5]!.packetDigestSha256
})
reject((candidate) => {
  candidate.evidencePackets.reverse()
})
reject((candidate) => {
  candidate.evidencePackets.pop()
})
reject((candidate) => {
  Object.assign(candidate.evidencePackets[6]!, {
    rawTranscript: 'smuggled text',
  })
})
reject((candidate) => {
  candidate.ownerScopeAmendment.activeScope[0] =
    'living_archive'
})
reject((candidate) => {
  candidate.ownerScopeAmendment.pausedScope.pop()
})
reject((candidate) => {
  Object.assign(candidate.readinessAudit, {
    activePrivateInternalReady: true,
  })
})
reject((candidate) => {
  Object.assign(candidate.readinessAudit.sourceBindings, {
    historicalAggregateCaseCountMayDefineActiveCompletion: true,
  })
})
reject((candidate) => {
  candidate.readinessAudit.metrics.activeBlockingRequirementCount = 0
})
reject((candidate) => {
  Object.assign(candidate, { historicalAggregate: {} })
})

assert.equal(adversarialChecks, 16)
assert.equal(
  verifyLivingFrameActiveNonIllustrationAggregate({
    ...aggregate,
    activePrivateInternalReady: true,
  }, baseInput),
  false,
)

console.log(JSON.stringify({
  smoke: 'living_frame_active_non_illustration_aggregate',
  status: 'passed_source_only',
  contractVersion: aggregate.contractVersion,
  aggregateDigestSha256: aggregate.aggregateDigestSha256,
  activeCaseCount: aggregate.activeCaseCount,
  activeScopeCount: aggregate.activeScopeCount,
  pausedScopeCount: aggregate.pausedScopeCount,
  activeBlockingRequirementCount:
    aggregate.activeBlockingRequirementCount,
  adversarialChecks,
  historicalAggregateImported: false,
  historicalCharacterOrRiggingEvidenceAccepted: false,
  postrenderAiVisualInspectionRequiredForEveryCase: true,
  completeTimeCoverageRequiredForEveryCase: true,
  separateVerifiedAudioEvidenceRequiredForEveryCase: true,
  headQaRecommendationRequiredForEveryCase: true,
  nPlusOneRepairAndReinspectionRequiredOnFailure: true,
  canonicalPrivateReviewRequiredForEveryCase: true,
  canonicalRereadPending: true,
  runtimeExecuted: false,
  productionReady: false,
}, null, 2))
