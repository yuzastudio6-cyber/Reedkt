import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { ApiError } from '../errors/api-error'
import {
  assertCanonicalDistributedPackageStateConformanceEvidence,
  runCanonicalDistributedPackageStateContractConformance,
} from '../distributed-package-state/canonical-distributed-package-state-conformance'

const evidence = await runCanonicalDistributedPackageStateContractConformance()
assertCanonicalDistributedPackageStateConformanceEvidence(evidence)

const clonedEvidence = structuredClone(evidence)
assert.throws(
  () => assertCanonicalDistributedPackageStateConformanceEvidence(clonedEvidence),
  (error: unknown) => error instanceof ApiError &&
    error.code === 'IDEMPOTENCY_ATOMICITY_REQUIRED',
)

const boundedSources = await Promise.all([
  '../distributed-package-state/canonical-distributed-package-state-port.ts',
  '../distributed-package-state/in-memory-canonical-distributed-package-state-fixture.ts',
  '../distributed-package-state/canonical-distributed-package-state-conformance.ts',
].map((relativePath) => readFile(new URL(relativePath, import.meta.url), 'utf8')))
for (const forbiddenRuntimeBoundary of [
  '@supabase/supabase-js',
  '@google-cloud/',
  'CloudTasksClient',
  'JobsClient',
  'node:child_process',
  'createClient(',
  'fetch(',
  'stripe',
]) {
  assert.ok(
    boundedSources.every((source) => !source.includes(forbiddenRuntimeBoundary)),
    `Distributed package-state contract imported forbidden runtime boundary: ${forbiddenRuntimeBoundary}`,
  )
}

console.log(JSON.stringify({
  ok: true,
  schemaVersion: evidence.schemaVersion,
  status: 'database_neutral_contract_conformance_verified_live_database_still_blocked',
  checkCount: evidence.checkCount,
  checks: evidence.checks,
  evidenceHash: evidence.evidenceHash,
  sourceSeparationVerified: true,
  boundaries: {
    databaseBackendUsed: evidence.databaseBackendUsed,
    distributedDatabaseTransactionVerified:
      evidence.distributedDatabaseTransactionVerified,
    multiReplicaDurabilityVerified: evidence.multiReplicaDurabilityVerified,
    liveSupabaseOrPostgresCallPerformed: evidence.liveSupabaseOrPostgresCallPerformed,
    cloudCallPerformed: evidence.cloudCallPerformed,
    customerCommercialAuthorityIncluded: evidence.customerCommercialAuthorityIncluded,
    automaticRetryStarted: evidence.automaticRetryStarted,
    productionAuthority: evidence.productionAuthority,
  },
}, null, 2))
