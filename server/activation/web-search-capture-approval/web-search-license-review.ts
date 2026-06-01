import { buildWebSearchToolEvidence } from './web-search-tool-evidence'
import type { WebSearchLicenseReview } from './web-search-capture-approval-types'

export function buildWebSearchLicenseReviews(): WebSearchLicenseReview[] {
  return buildWebSearchToolEvidence().map((tool) => ({
    toolId: tool.toolId,
    license: tool.license,
    sourceEvidenceUrl: tool.sourceUrls[0],
    planningDecision: tool.defaultStack ? 'approved_for_staging_planning' : 'disabled_pending_future_approval',
    runtimeDecision: 'blocked_in_phase49a',
    notes: [
      tool.defaultStack
        ? `${tool.displayName} is clear for static staging planning in Phase 49A.`
        : `${tool.displayName} remains optional and disabled by default.`,
      'Phase 49A does not install packages, launch runtimes, crawl the web, capture screenshots, call providers, or add secrets.',
      ...(tool.license === 'AGPL-3.0-or-later' ? ['AGPL hosting/distribution obligations must be reviewed again before any self-hosted runtime is exposed beyond private staging.'] : []),
    ],
  }))
}
