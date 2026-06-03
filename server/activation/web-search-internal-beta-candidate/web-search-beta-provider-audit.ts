import {
  buildSearchProviderCostAudit,
  buildSearchProviderStoragePolicyAudit,
} from '../search-provider-readiness'
import type {
  SearchProviderSecretAudit,
  SearchProviderServiceAudit,
} from '../search-provider-readiness'
import type { WebSearchInternalBetaEvidenceChain, WebSearchInternalBetaProviderAudit } from './web-search-internal-beta-types'

const disabledProviderIds = ['tavily', 'exa', 'firecrawl', 'browserless', 'browserbase', 'public_searxng']

export function buildWebSearchBetaProviderAudit(input: {
  evidenceChain: WebSearchInternalBetaEvidenceChain
  serviceAudit: SearchProviderServiceAudit
  secretAudit: SearchProviderSecretAudit
}): WebSearchInternalBetaProviderAudit {
  const costAudit = buildSearchProviderCostAudit()
  const storagePolicyAudit = buildSearchProviderStoragePolicyAudit()
  const phaseCompleted = (phaseId: string) => input.evidenceChain.phases.some((phase) => phase.phase === phaseId && phase.status === 'completed')
  const searxngDefaultReady = phaseCompleted('49F')
    && input.serviceAudit.exists
    && !input.serviceAudit.publicUnauthenticatedAccess
    && !input.serviceAudit.gpuDetected
    && !input.serviceAudit.modelWeightsDetected
  const braveOptionalReady = phaseCompleted('49L')
    && input.secretAudit.secretExists
    && input.secretAudit.enabledVersionPresent
    && input.secretAudit.approvedServiceAccountsHaveAccess
    && !input.secretAudit.secretValueAccessed
    && !input.secretAudit.secretValuePrinted
    && !input.secretAudit.broadAccessDetected
  const hybridConsensusReady = phaseCompleted('49M')
  const blockers = [
    ...input.serviceAudit.blockers,
    ...input.secretAudit.blockers,
    ...costAudit.blockers,
    ...storagePolicyAudit.blockers,
    ...(searxngDefaultReady ? [] : ['Private SearXNG default provider readiness failed.']),
    ...(braveOptionalReady ? [] : ['Brave optional fallback readiness failed.']),
    ...(hybridConsensusReady ? [] : ['Hybrid consensus evidence is not complete.']),
  ]
  const warnings = Array.from(new Set([
    ...input.serviceAudit.warnings,
    ...input.secretAudit.warnings,
    ...costAudit.warnings,
    ...storagePolicyAudit.warnings,
    'Brave remains optional, paid, disabled by default, and unavailable without future explicit budget/storage/secret gates.',
  ]))
  return {
    searxngDefaultReady,
    braveOptionalReady,
    hybridConsensusReady,
    disabledProviderIds,
    serviceAudit: input.serviceAudit,
    secretAudit: input.secretAudit,
    costAudit,
    storagePolicyAudit,
    blockers,
    warnings,
  }
}
