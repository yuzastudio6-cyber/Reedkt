import type { ApprovedPrivateSearxngServiceEvidence } from './private-searxng-service-types'

export const approvedPrivateSearxngServiceEvidence: ApprovedPrivateSearxngServiceEvidence = {
  phase: '49F',
  status: 'planned',
  serviceName: 'reeditpro-staging-private-searxng',
  serviceMode: 'private_controlled_searxng',
  controlledQuery: 'ReeditPro open source video editing planning',
  phase49GReadiness: 'blocked',
  blockers: [
    'Phase 49F private SearXNG service validation has not executed yet.',
  ],
  warnings: [
    'Phase 49F must keep public SearXNG instances, paid providers, browser capture, Readability extraction, production, external beta, and broad media blocked.',
  ],
}

export function getApprovedPrivateSearxngServiceEvidence(): ApprovedPrivateSearxngServiceEvidence {
  return {
    ...approvedPrivateSearxngServiceEvidence,
    blockers: [...approvedPrivateSearxngServiceEvidence.blockers],
    warnings: [...approvedPrivateSearxngServiceEvidence.warnings],
  }
}
