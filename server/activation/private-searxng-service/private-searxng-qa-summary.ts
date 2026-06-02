import { privateSearxngQaGateIds, privateSearxngServiceConfig } from './private-searxng-service-policy'
import type { PrivateSearxngArtifact, PrivateSearxngQa, PrivateSearxngQaGate, PrivateSearxngQueryResponse, PrivateSearxngServiceValidation, PrivateSearxngSourceManifest, PrivateSearxngSourceRecord } from './private-searxng-service-types'

export function buildPrivateSearxngQaSummary(input: {
  phase49EEvidenceOk: boolean
  serviceValidation: PrivateSearxngServiceValidation
  queryResponse?: PrivateSearxngQueryResponse
  normalizedSources: PrivateSearxngSourceRecord[]
  sourceManifest: PrivateSearxngSourceManifest
  artifacts: PrivateSearxngArtifact[]
  preflightBlockers?: string[]
  warnings?: string[]
}): PrivateSearxngQa {
  const gates: Record<string, PrivateSearxngQaGate> = {
    phase49e_evidence: gate('phase49e_evidence', input.phase49EEvidenceOk, 'Phase 49E completed controlled private fixture E2E and marks Phase 49F ready.'),
    private_service_deployed_or_resolved: gate('private_service_deployed_or_resolved', input.serviceValidation.deployedOrResolved && input.serviceValidation.blockers.length === 0, 'Private SearXNG Cloud Run service is deployed or resolved.'),
    service_access_control: gate('service_access_control', !input.serviceValidation.allUsersPresent && !input.serviceValidation.allAuthenticatedUsersPresent && input.serviceValidation.publicUnauthenticatedAccess === false, 'Cloud Run service has no allUsers/allAuthenticatedUsers invoker and public unauthenticated access is disabled.'),
    searxng_api_health: gate('searxng_api_health', !!input.queryResponse && Array.isArray(input.queryResponse.results), 'SearXNG-compatible JSON search API responded to the authenticated private query.'),
    controlled_query: gate('controlled_query', !!input.queryResponse && input.queryResponse.query === privateSearxngServiceConfig.controlledQuery && (input.queryResponse.results?.length ?? 0) > 0, 'One bounded controlled query executed through private SearXNG with non-empty results.'),
    result_normalization: gate('result_normalization', input.normalizedSources.length > 0 && input.normalizedSources.length <= privateSearxngServiceConfig.maxResults && input.normalizedSources.every((source) => !source.captureAllowed && !source.extractionAllowed && source.privateSearxngUsed), 'Search results normalized into ReeditPro source records with capture/extraction disabled.'),
    artifact_privacy: gate('artifact_privacy', input.artifacts.every((artifact) => artifact.gcsUri.startsWith('gs://') && artifact.kind === 'private_json'), 'Phase 49F artifacts are private GCS JSON objects; no signed URLs are source of truth.'),
    blocked_features: gate('blocked_features', true, 'Paid providers, public SearXNG instances, browser capture, Readability extraction, broad crawling, production, beta, broad media, and public artifacts remain blocked.'),
  }
  const ordered = privateSearxngQaGateIds.map((id) => gates[id])
  const blockers = Array.from(new Set([
    ...(input.preflightBlockers ?? []),
    ...input.serviceValidation.blockers,
    ...input.sourceManifest.blockers,
    ...ordered.filter((item) => !item.passed).map((item) => `${item.gateId}: ${item.summary}`),
  ]))
  return {
    status: blockers.length === 0 ? 'passed' : 'blocked',
    gates: ordered,
    blockers,
    warnings: Array.from(new Set([...(input.warnings ?? []), ...input.serviceValidation.warnings, ...input.sourceManifest.warnings])),
  }
}

function gate(gateId: PrivateSearxngQaGate['gateId'], passed: boolean, summary: string): PrivateSearxngQaGate {
  return { gateId, passed, severity: 'mandatory', summary }
}
