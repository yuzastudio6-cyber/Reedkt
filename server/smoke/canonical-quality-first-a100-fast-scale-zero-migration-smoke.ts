import assert from 'node:assert/strict'

import {
  assertCanonicalFreshA100CustomerDispatchAllowed,
  assertCanonicalQualityFirstA100FastScaleZeroMigration,
  createCanonicalQualityFirstA100FastScaleZeroMigration,
} from '../edit-architecture/canonical-quality-first-a100-fast-scale-zero-migration'

const migration = createCanonicalQualityFirstA100FastScaleZeroMigration()
assert.deepEqual(
  assertCanonicalQualityFirstA100FastScaleZeroMigration(migration),
  migration,
)
assert.equal(
  migration.historicalVertexCustomJobObservation
    .coldProvisioningMilliseconds,
  3_199_367,
)
assert.ok(
  migration.historicalVertexCustomJobObservation
    .coldProvisioningMilliseconds
    > migration.historicalVertexCustomJobObservation
      .targetEndToEndMilliseconds,
)
assert.equal(
  migration.historicalVertexCustomJobObservation
    .newCustomerAttemptAdmissionAllowed,
  false,
)
assert.equal(migration.candidateRoutes.length, 2)
assert.equal(migration.candidateRoutes[0].minimumReplicaCount, 0)
assert.equal(migration.candidateRoutes[0].idleScaleDownPeriodSeconds, 300)
assert.equal(migration.candidateRoutes[1].minimumNodeCount, 0)
assert.equal(migration.candidateRoutes[1].jobBackoffLimit, 0)
assert.equal(migration.selectionGate.minimumRepresentativeRunsPerCandidate, 30)
assert.equal(migration.selectionGate.selectedCandidateId, null)
assert.equal(migration.authority.productionRouteSelected, false)
assert.equal(migration.authority.productionReady, false)
assert.throws(
  () => assertCanonicalFreshA100CustomerDispatchAllowed(migration),
  /blocked pending a qualified fast scale-zero route/u,
)

assert.throws(() => assertCanonicalQualityFirstA100FastScaleZeroMigration({
  ...migration,
  migrationHash: '0'.repeat(64),
}))
assert.throws(() => assertCanonicalQualityFirstA100FastScaleZeroMigration({
  ...migration,
  historicalVertexCustomJobObservation: {
    ...migration.historicalVertexCustomJobObservation,
    newCustomerAttemptAdmissionAllowed: true,
  },
}))
assert.throws(() => assertCanonicalQualityFirstA100FastScaleZeroMigration({
  ...migration,
  selectionGate: {
    ...migration.selectionGate,
    minimumRepresentativeRunsPerCandidate: 5,
  },
}))
assert.throws(() => assertCanonicalQualityFirstA100FastScaleZeroMigration({
  ...migration,
  candidateRoutes: [migration.candidateRoutes[1], migration.candidateRoutes[0]],
}))
assert.throws(() => assertCanonicalQualityFirstA100FastScaleZeroMigration({
  ...migration,
  authority: {
    ...migration.authority,
    productionReady: true,
  },
}))

const serialized = JSON.stringify(migration)
assert.doesNotMatch(serialized, /https?:|credentials?|tokens?|passwords?/iu)

console.log(JSON.stringify({
  smoke: 'canonical-quality-first-a100-fast-scale-zero-migration',
  checks: 21,
  observedCustomJobColdProvisioningMilliseconds:
    migration.historicalVertexCustomJobObservation
      .coldProvisioningMilliseconds,
  customJobNewCustomerAdmissionAllowed:
    migration.historicalVertexCustomJobObservation
      .newCustomerAttemptAdmissionAllowed,
  candidateCount: migration.candidateRoutes.length,
  representativeRunsPerCandidate:
    migration.selectionGate.minimumRepresentativeRunsPerCandidate,
  selectedCandidateId: migration.selectionGate.selectedCandidateId,
  productionReady: migration.authority.productionReady,
}, null, 2))
