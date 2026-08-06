import assert from 'node:assert/strict'

import {
  ORCHESTRA_SKILL_QUALIFICATION_SNAPSHOT_VERSION,
} from '../../src/types/orchestra-skill-capability'
import {
  createSkillQualificationSnapshot,
  orchestraDigest,
  orchestraEvidenceRef,
  parseSkillCapabilityManifest,
} from '../orchestra/orchestra-skill-capability-contract'
import {
  CANONICAL_TRACK_ALL_SAM3_1_JOB_TYPE,
} from '../workers/masks/canonical-track-all-sam3_1-orchestra-binding'
import {
  TRACK_ALL_SAM3_1_ORCHESTRA_CONTRACT_VERSION,
  TRACK_ALL_SAM3_1_ORCHESTRA_MANIFEST_ID,
  TRACK_ALL_SAM3_1_ORCHESTRA_QUALIFICATION_SNAPSHOT_ID,
  TRACK_ALL_SAM3_1_ORCHESTRA_ROUTE_IDS,
  TRACK_ALL_SAM3_1_ORCHESTRA_SKILL_VERSION,
  createTrackAllSam31OrchestraCapabilityManifest,
  createTrackAllSam31OrchestraCapabilityManifestForQualification,
  createTrackAllSam31OrchestraQualificationSnapshot,
} from '../workers/masks/track-all-sam3_1-orchestra-capability-manifest'

let checks = 0
const check = (condition: unknown, message?: string) => {
  assert.ok(condition, message)
  checks += 1
}

const candidate = createTrackAllSam31OrchestraQualificationSnapshot()
const blockedManifest = createTrackAllSam31OrchestraCapabilityManifest()

check(candidate.overall === 'blocked')
check(candidate.qualificationOwner === 'canonical_skill_qualification_registry')
check(candidate.callerCanSelfQualify === false)
check(candidate.dispatchAuthorityGranted === false)
check(candidate.providerAuthorityGranted === false)
check(candidate.billingAuthorityGranted === false)
check(candidate.publicDeliveryAuthorityGranted === false)
check(candidate.productionAuthorityGranted === false)
check(blockedManifest.manifestId === TRACK_ALL_SAM3_1_ORCHESTRA_MANIFEST_ID)
check(blockedManifest.skillKey === 'track_all')
check(blockedManifest.skillClass === 'tracking_support')
check(blockedManifest.coordinationCritical)
check(blockedManifest.canOwnPrimaryVisual === false)
check(blockedManifest.canOwnPrimaryAnalysis === false)
check(blockedManifest.canActAsSupport)
check(blockedManifest.canOperateAtSceneLevel)
check(blockedManifest.canOperateAtVideoLevel === false)
check(blockedManifest.canOperateAtBoundaryLevel === false)
check(blockedManifest.supportedJobTypes.length === 1)
check(blockedManifest.supportedJobTypes[0]?.jobType ===
  CANONICAL_TRACK_ALL_SAM3_1_JOB_TYPE)
check(blockedManifest.qualificationStatus.overall === 'blocked')
check(blockedManifest.qualificationStatus.qualifiedJobTypes.length === 0)
check(blockedManifest.qualificationStatus.blockedJobTypes.length === 1)
check(blockedManifest.toolRoutes.length === 3)
check(blockedManifest.toolRoutes.some((route) =>
  route.routeId === TRACK_ALL_SAM3_1_ORCHESTRA_ROUTE_IDS.a100Primary
  && route.executionClass === 'a100_80gb_gpu_heavy'))
check(blockedManifest.toolRoutes.some((route) =>
  route.routeId === TRACK_ALL_SAM3_1_ORCHESTRA_ROUTE_IDS.l4Fallback
  && route.executionClass === 'l4_gpu_standard'))
check(blockedManifest.toolRoutes.some((route) =>
  route.routeId === TRACK_ALL_SAM3_1_ORCHESTRA_ROUTE_IDS.l4TaskQa
  && route.executionClass === 'l4_gpu_standard'))
check(blockedManifest.fallbackRoutes.some((route) =>
  route.routeKind === 'classified_gpu_fallback'
  && route.targetRouteId ===
    TRACK_ALL_SAM3_1_ORCHESTRA_ROUTE_IDS.l4Fallback
  && route.qualityReductionAllowed === false))
check(blockedManifest.knownLimitations.some((limitation) =>
  limitation.includes('separately qualified quality-preserving fallback')))
check(blockedManifest.conflictsWith.some((conflict) =>
  conflict.otherSkillKey === 'legacy_sam2_tracking'))
check(blockedManifest.invocationPolicy.orchestraDispatchRequired)
check(blockedManifest.invocationPolicy.directUserInvocationAllowed === false)
check(blockedManifest.invocationPolicy.directPeerSkillInvocationAllowed ===
  false)
check(blockedManifest.failureSemantics.failClosed)
check(blockedManifest.failureSemantics.hiddenFallbackAllowed === false)
check(blockedManifest.ownershipRequirements.skillOwnsProducedArtifacts)
check(blockedManifest.ownershipRequirements.finalQaOwnedElsewhere)

const qualifiedRouteIds = blockedManifest.toolRoutes
  .map((route) => route.routeId)
  .sort(compare)
const qualificationEvidenceRefs = [
  orchestraEvidenceRef('sam3_1-a100-private-internal-release', refHash('a100')),
  orchestraEvidenceRef('sam3_1-l4-private-internal-release', refHash('l4')),
  orchestraEvidenceRef('track-all-l4-task-qa-release', refHash('qa')),
].sort((left, right) => compare(left.id, right.id))
const qualified = createSkillQualificationSnapshot({
  schemaVersion: ORCHESTRA_SKILL_QUALIFICATION_SNAPSHOT_VERSION,
  snapshotId: TRACK_ALL_SAM3_1_ORCHESTRA_QUALIFICATION_SNAPSHOT_ID,
  skillKey: 'track_all',
  skillVersion: TRACK_ALL_SAM3_1_ORCHESTRA_SKILL_VERSION,
  contractVersion: TRACK_ALL_SAM3_1_ORCHESTRA_CONTRACT_VERSION,
  capabilityDefinitionDigestSha256:
    candidate.capabilityDefinitionDigestSha256,
  observedReleaseRef: orchestraEvidenceRef(
    'track-all-sam3_1-private-internal-release-set',
    refHash('release-set'),
  ),
  observedAt: '2026-08-06T18:00:00.000Z',
  overall: 'qualified',
  jobQualifications: [{
    jobType: CANONICAL_TRACK_ALL_SAM3_1_JOB_TYPE,
    status: 'qualified',
    blockerCodes: [],
    qualifiedRouteIds,
    qualificationEvidenceRefs,
  }],
  callerCanSelfQualify: false,
  qualificationOwner: 'canonical_skill_qualification_registry',
  dispatchAuthorityGranted: false,
  providerAuthorityGranted: false,
  billingAuthorityGranted: false,
  publicDeliveryAuthorityGranted: false,
  productionAuthorityGranted: false,
})
const qualifiedManifest =
  createTrackAllSam31OrchestraCapabilityManifestForQualification(qualified)

check(qualifiedManifest.qualificationStatus.overall === 'qualified')
check(qualifiedManifest.qualificationStatus.qualifiedJobTypes[0] ===
  CANONICAL_TRACK_ALL_SAM3_1_JOB_TYPE)
check(qualifiedManifest.qualificationStatus.blockedJobTypes.length === 0)
check(qualifiedManifest.qualificationStatus.qualificationSnapshotRef
  .contentHash === qualified.snapshotDigestSha256)
check(parseSkillCapabilityManifest({
  value: qualifiedManifest,
  qualificationSnapshot: qualified,
}).manifestDigestSha256 === qualifiedManifest.manifestDigestSha256)

assert.throws(() => createTrackAllSam31OrchestraCapabilityManifestForQualification({
  ...qualified,
  capabilityDefinitionDigestSha256: refHash('wrong-definition'),
}))
checks += 1
assert.throws(() => parseSkillCapabilityManifest({
  value: {
    ...qualifiedManifest,
    qualificationStatus: blockedManifest.qualificationStatus,
  },
  qualificationSnapshot: qualified,
}))
checks += 1
assert.throws(() => createSkillQualificationSnapshot({
  ...qualified,
  jobQualifications: [{
    ...qualified.jobQualifications[0]!,
    qualifiedRouteIds: [],
  }],
  snapshotDigestSha256: undefined,
} as never))
checks += 1

console.log(JSON.stringify({
  ok: true,
  checks,
  schemaVersion: blockedManifest.schemaVersion,
  manifestId: blockedManifest.manifestId,
  candidateQualification: candidate.overall,
  qualifiedRouteIds,
  sam2FreshSelectionAllowed: false,
  callerCanSelfQualify: false,
  directUserOrPeerDispatchAllowed: false,
  substantiveCpuMediaProcessingAllowed: false,
  customerCreditsMutated: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}))

function refHash(label: string): string {
  return orchestraDigest({ label })
}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}
