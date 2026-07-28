import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  CANONICAL_PRIVATE_E2E_TOOL_IDS,
  NON_E2E_TOOL_CAPABILITY_IDS,
} from '../tool-registry'
import {
  createCanonicalPrivateToolSummary,
  EXACT_CANONICAL_PRIVATE_TOOL_COUNT,
} from '../workers/canonical-private-tool-summary'

const summary = createCanonicalPrivateToolSummary()

assert.equal(summary.schemaVersion, 'canonical-private-tool-summary-v1')
assert.equal(summary.registryScope, 'canonical_private_end_to_end')
assert.equal(summary.authoritativeToolCount, 50)
assert.equal(EXACT_CANONICAL_PRIVATE_TOOL_COUNT, 50)
assert.deepEqual(summary.canonicalToolIds, CANONICAL_PRIVATE_E2E_TOOL_IDS)
assert.equal(summary.tools.length, 50)
assert.equal(new Set(summary.canonicalToolIds).size, 50)
assert.equal(summary.evidence.confinedRunnerVerifiedCount, 50)
assert.equal(summary.evidence.canonicalPrivateLifecycleVerifiedCount, 50)
assert.equal(summary.evidence.canonicalJobAdapterVerifiedCount, 50)
assert.equal(summary.evidence.allCanonicalToolsIndividuallyVerified, true)
assert.equal(summary.evidence.oneEditInvokedAllTools, false)
assert.equal(summary.countPolicy.historicalExploratoryCatalogIsAuthoritative, false)
assert.equal(summary.countPolicy.nonEndToEndCapabilitiesIncluded, false)
assert.equal(summary.countPolicy.runnerFoundationsIncluded, false)
assert.equal(summary.countPolicy.developerHostProbeChangesCanonicalCount, false)
assert.equal(summary.countPolicy.unprovenAdditionsAllowed, false)
assert.equal(summary.releaseReadiness.privateInternalEvidenceReady, true)
assert.equal(summary.releaseReadiness.productReady, false)
assert.equal(summary.releaseReadiness.externalBetaReady, false)
assert.equal(summary.releaseReadiness.productionReady, false)
assert.ok(summary.tools.every((tool) => tool.privateInternalRunnerReady))
assert.ok(summary.tools.every((tool) => tool.privateInternalEndToEndReady))
assert.ok(summary.tools.every((tool) => tool.privateInternalJobAdapterReady))
assert.ok(summary.tools.every((tool) => !tool.productReady))
assert.ok(summary.tools.every((tool) => !tool.externalBetaReady))
assert.ok(summary.tools.every((tool) => !tool.productionReady))
assert.ok(summary.tools.every((tool) => tool.runnerClass !== null))

const excludedCapabilities = new Set<string>(NON_E2E_TOOL_CAPABILITY_IDS)
assert.ok(
  summary.canonicalToolIds.every(
    (toolId) => !excludedCapabilities.has(toolId),
  ),
)

assert.deepEqual(summary.blockers, [
  'distributed_worker_and_service_identity_not_verified',
  'deployed_private_storage_and_observability_not_verified',
  'product_external_beta_and_production_promotion_not_verified',
])

const serialized = JSON.stringify(summary)
assert.equal(serialized.includes('"prompt6Ready"'), false)
assert.equal(serialized.includes('"required"'), false)
assert.equal(serialized.includes('"optional"'), false)
assert.equal(serialized.includes('"authoritativeToolCount":72'), false)

const packageJson = JSON.parse(
  await readFile(resolve('package.json'), 'utf8'),
) as { scripts: Record<string, string> }
assert.equal(
  packageJson.scripts['tools:summary'],
  'tsx server/cli/e2e-tool-summary.ts',
)
assert.equal(
  packageJson.scripts['tools:host-summary'],
  'tsx server/cli/developer-host-tool-summary.ts',
)

console.log(JSON.stringify({
  ok: true,
  authoritativeToolCount: summary.authoritativeToolCount,
  canonicalToolIds: summary.canonicalToolIds,
  checks: [
    'default_tool_summary_reports_only_exact_50_canonical_tools',
    'all_50_have_confined_runner_canonical_lifecycle_and_job_adapter_evidence',
    'historical_candidates_and_runner_foundations_are_excluded',
    'developer_host_probe_is_separate_and_non_authoritative',
    'private_internal_evidence_does_not_promote_product_beta_or_production',
  ],
}))
