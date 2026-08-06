import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { ApiError } from '../errors/api-error'
import {
  assertCanonicalDistributedMediaIngestConformanceEvidence,
  runCanonicalDistributedMediaIngestConformance,
} from '../distributed-media-ingest/canonical-distributed-media-ingest-state-conformance'

const evidence = await runCanonicalDistributedMediaIngestConformance()
assertCanonicalDistributedMediaIngestConformanceEvidence(evidence)

assert.throws(
  () => assertCanonicalDistributedMediaIngestConformanceEvidence(structuredClone(evidence)),
  (error: unknown) => error instanceof ApiError &&
    error.code === 'IDEMPOTENCY_ATOMICITY_REQUIRED',
)

const boundedSources = await Promise.all([
  '../distributed-media-ingest/canonical-distributed-media-ingest-state-port.ts',
  '../distributed-media-ingest/in-memory-canonical-distributed-media-ingest-fixture.ts',
  '../distributed-media-ingest/canonical-distributed-media-ingest-state-conformance.ts',
  '../services/canonical-distributed-large-media-finalization-contract-service.ts',
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
    `Distributed media-ingest contract imported forbidden runtime boundary: ${forbiddenRuntimeBoundary}`,
  )
}

console.log(JSON.stringify({
  ok: true,
  schemaVersion: evidence.schemaVersion,
  status: 'pre_plan_distributed_ingest_contract_verified_runtime_activation_blocked',
  checkCount: evidence.checkCount,
  checks: evidence.checks,
  evidenceHash: evidence.evidenceHash,
  sourceSeparationVerified: true,
  boundaries: {
    approvedPackageAuthorityReusedOrFabricated:
      evidence.approvedPackageAuthorityReusedOrFabricated,
    databaseBackendUsed: evidence.databaseBackendUsed,
    distributedDatabaseTransactionVerified:
      evidence.distributedDatabaseTransactionVerified,
    multiReplicaDurabilityVerified: evidence.multiReplicaDurabilityVerified,
    cloudDispatchVerified: evidence.cloudDispatchVerified,
    liveGcsObjectBytesRead: evidence.liveGcsObjectBytesRead,
    hostedUploadsAboveInlineCeilingAllowed:
      evidence.hostedUploadsAboveInlineCeilingAllowed,
    customerCommercialAuthorityIncluded:
      evidence.customerCommercialAuthorityIncluded,
    productionAuthority: evidence.productionAuthority,
  },
}, null, 2))
