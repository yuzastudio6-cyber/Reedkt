import assert from 'node:assert/strict'

import {
  assertCanonicalSam31VertexScaleZeroDeploymentProfile,
  createCanonicalSam31VertexScaleZeroDeploymentProfile,
} from '../edit-architecture/canonical-sam3_1-vertex-scale-zero-deployment-profile'

const hash = (character: string) => `sha256:${character.repeat(64)}` as const
const ref = (id: string, character: string) => ({
  id,
  version: 1 as const,
  contentHash: hash(character),
})
const imageDigest = hash('b')
const profile = createCanonicalSam31VertexScaleZeroDeploymentProfile({
  imageSupplyChainReleaseRef: ref('sam31-supply-release', 'a'),
  immutableImageRef: ref('sam31-image', 'b'),
  immutableImageUri:
    `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu@${imageDigest}`,
  immutableImageDigest: imageDigest,
  sourceCheckpointQualificationRef: ref('sam31-source-checkpoint', 'c'),
  servingQuotaPreferenceRef: ref('vertex-serving-a100-quota', 'd'),
  accountEffectiveRateAuthorityRef: ref('vertex-a100-rate', 'e'),
  recordedAt: '2026-08-11T16:00:00.000Z',
})

assert.deepEqual(
  assertCanonicalSam31VertexScaleZeroDeploymentProfile(profile),
  profile,
)
assert.equal(profile.dedicatedResources.minimumReplicaCount, 0)
assert.equal(profile.dedicatedResources.initialReplicaCount, 1)
assert.equal(profile.dedicatedResources.idleScaleDownPeriodSeconds, 300)
assert.equal(profile.endpoint.dedicatedEndpointEnabled, true)
assert.equal(profile.readinessAndAttemptPolicy.firstRequestMayBeCustomerChargeableAttempt, false)
assert.equal(profile.pricingAndSettlement.minimumWarmBillingWindowSeconds, 300)
assert.equal(profile.qualificationGate.minimumRepresentativeRuns, 30)
assert.equal(profile.qualificationGate.customerDispatchAllowed, false)
assert.equal(profile.authority.productionReady, false)

assert.throws(() => assertCanonicalSam31VertexScaleZeroDeploymentProfile({
  ...profile,
  dedicatedResources: {
    ...profile.dedicatedResources,
    minimumReplicaCount: 1,
  },
}))
assert.throws(() => assertCanonicalSam31VertexScaleZeroDeploymentProfile({
  ...profile,
  pricingAndSettlement: {
    ...profile.pricingAndSettlement,
    failedOrUnknownUnsettledAttemptMayChargeCustomerCredits: true,
  },
}))
assert.throws(() => assertCanonicalSam31VertexScaleZeroDeploymentProfile({
  ...profile,
  immutableImageUri:
    `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu@${hash('f')}`,
}))
assert.throws(() => assertCanonicalSam31VertexScaleZeroDeploymentProfile({
  ...profile,
  profileHash: '0'.repeat(64),
}))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-vertex-scale-zero-deployment-profile',
  checks: 13,
  dedicatedA100Endpoint: true,
  minimumReplicaCount: 0,
  accountEffectiveSettlementRequired: true,
  firstScaledDownRequestCustomerChargeable: false,
  customerDispatchAllowed: false,
  productionReady: false,
}, null, 2))
