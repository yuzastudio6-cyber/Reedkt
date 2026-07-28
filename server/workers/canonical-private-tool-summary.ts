import {
  CANONICAL_PRIVATE_E2E_TOOL_IDS,
  NON_E2E_TOOL_CAPABILITY_IDS,
} from '../tool-registry'
import {
  listProvenToolIdentityCatalog,
  summarizeProvenToolIdentityCatalog,
} from '../tool-execution/proven-tool-identity-catalog'

export const CANONICAL_PRIVATE_TOOL_SUMMARY_VERSION =
  'canonical-private-tool-summary-v1' as const
export const EXACT_CANONICAL_PRIVATE_TOOL_COUNT = 50 as const

/**
 * Returns the one authoritative tool count for the canonical private execution
 * surface. Developer-host probes and non-E2E capability records are deliberately
 * excluded because neither one changes the production-tool registry.
 */
export function createCanonicalPrivateToolSummary() {
  const records = listProvenToolIdentityCatalog()
  const evidence = summarizeProvenToolIdentityCatalog()
  const exactToolIds = records.map((record) => record.canonicalToolId)

  assertExactCanonicalToolScope({
    exactToolIds,
    totalRegistryProfiles: evidence.totalRegistryProfiles,
    confinedRunnerVerifiedCount: evidence.confinedRunnerVerifiedCount,
    canonicalEndToEndVerifiedCount: evidence.canonicalEndToEndVerifiedCount,
    canonicalJobAdapterVerifiedCount: evidence.canonicalJobAdapterVerifiedCount,
  })

  return {
    schemaVersion: CANONICAL_PRIVATE_TOOL_SUMMARY_VERSION,
    registryScope: 'canonical_private_end_to_end' as const,
    authoritativeToolCount: EXACT_CANONICAL_PRIVATE_TOOL_COUNT,
    canonicalToolIds: exactToolIds,
    evidence: {
      evidenceRevision: evidence.evidenceRevision,
      confinedRunnerVerifiedCount: evidence.confinedRunnerVerifiedCount,
      canonicalPrivateLifecycleVerifiedCount:
        evidence.canonicalEndToEndVerifiedCount,
      canonicalJobAdapterVerifiedCount:
        evidence.canonicalJobAdapterVerifiedCount,
      allCanonicalToolsIndividuallyVerified: true,
      oneEditInvokedAllTools: false,
    },
    countPolicy: {
      historicalExploratoryCatalogIsAuthoritative: false,
      nonEndToEndCapabilitiesIncluded: false,
      runnerFoundationsIncluded: false,
      developerHostProbeChangesCanonicalCount: false,
      unprovenAdditionsAllowed: false,
    },
    releaseReadiness: {
      privateInternalEvidenceReady: true,
      productReady: false,
      externalBetaReady: false,
      productionReady: false,
    },
    tools: records.map((record) => ({
      toolId: record.canonicalToolId,
      displayName: record.displayName,
      operationId: record.operationId,
      runnerClass: record.runtime.runnerClass,
      privateInternalRunnerReady:
        record.readiness.privateInternalRunnerReady,
      privateInternalEndToEndReady:
        record.readiness.privateInternalEndToEndReady,
      privateInternalJobAdapterReady:
        record.readiness.privateInternalJobAdapterReady,
      productReady: record.readiness.productReady,
      externalBetaReady: record.readiness.externalBetaReady,
      productionReady: record.readiness.productionReady,
    })),
    blockers: [...new Set(records.flatMap((record) => record.blockers))],
    notes: [
      'This is the only authoritative ReeditPro tool count: exactly 50 canonical private end-to-end tools.',
      'Historical exploratory names, non-end-to-end capability candidates, and runner foundations are not tools in this count.',
      'Each tool has individual confined-runner, canonical lifecycle, and server-derived job-adapter evidence; a single edit does not invoke all 50 tools.',
      'Use npm run tools:host-summary only for developer-machine convenience probes; host availability does not change canonical evidence.',
      'Private internal evidence does not imply product, external-beta, deployed-worker, or paid-production readiness.',
    ],
  }
}

function assertExactCanonicalToolScope(input: {
  exactToolIds: readonly string[]
  totalRegistryProfiles: number
  confinedRunnerVerifiedCount: number
  canonicalEndToEndVerifiedCount: number
  canonicalJobAdapterVerifiedCount: number
}): void {
  const expectedToolIds = [...CANONICAL_PRIVATE_E2E_TOOL_IDS]
  const exactOrderMatches =
    input.exactToolIds.length === expectedToolIds.length &&
    input.exactToolIds.every(
      (toolId, index) => toolId === expectedToolIds[index],
    )

  if (
    expectedToolIds.length !== EXACT_CANONICAL_PRIVATE_TOOL_COUNT ||
    input.totalRegistryProfiles !== EXACT_CANONICAL_PRIVATE_TOOL_COUNT ||
    input.confinedRunnerVerifiedCount !== EXACT_CANONICAL_PRIVATE_TOOL_COUNT ||
    input.canonicalEndToEndVerifiedCount !==
      EXACT_CANONICAL_PRIVATE_TOOL_COUNT ||
    input.canonicalJobAdapterVerifiedCount !==
      EXACT_CANONICAL_PRIVATE_TOOL_COUNT ||
    !exactOrderMatches
  ) {
    throw new Error(
      'Canonical private tool summary refused registry or evidence drift from the exact 50-tool contract.',
    )
  }

  const excludedCapabilitySet = new Set<string>(NON_E2E_TOOL_CAPABILITY_IDS)
  if (input.exactToolIds.some((toolId) => excludedCapabilitySet.has(toolId))) {
    throw new Error(
      'Canonical private tool summary refused a non-end-to-end capability candidate.',
    )
  }
}
