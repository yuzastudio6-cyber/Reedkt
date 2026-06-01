import type { WebSearchFuturePhase } from './web-search-capture-approval-types'

export function buildWebSearchFutureScope(): WebSearchFuturePhase[] {
  return [
    {
      phaseId: '49B',
      title: 'SearXNG private-instance planning/runtime fixture',
      scope: [
        'Configure a private SearXNG endpoint variable.',
        'Use generated/static mock search fixtures first.',
        'Use a local/private SearXNG container only if separately approved.',
        'Keep paid APIs and public scraping blocked.',
      ],
      allowed: true,
      blockedInPhase49A: true,
    },
    {
      phaseId: '49C',
      title: 'Playwright + Sharp capture generated fixture',
      scope: [
        'Launch browser only against local/static generated pages.',
        'Capture a screenshot fixture.',
        'Process the image with Sharp into private artifacts.',
        'Keep public web access blocked.',
      ],
      allowed: true,
      blockedInPhase49A: true,
    },
    {
      phaseId: '49D',
      title: 'Readability extraction fixture',
      scope: [
        'Use a local/static HTML fixture.',
        'Extract title, text, and metadata.',
        'Sanitize output before storage or display.',
        'Run extraction QA without public web requests.',
      ],
      allowed: true,
      blockedInPhase49A: true,
    },
    {
      phaseId: '49E',
      title: 'Controlled web search/capture private E2E',
      scope: [
        'Use an approved private SearXNG endpoint only.',
        'Limit result count and apply allowlist/domain policy.',
        'Capture only allowed public pages.',
        'Write private screenshots, metadata, citations, and source manifests.',
      ],
      allowed: true,
      blockedInPhase49A: true,
    },
    {
      phaseId: '49F',
      title: 'Web search internal readiness gate',
      scope: [
        'Run regression suite.',
        'Audit failure handling, privacy, IAM, artifacts, UI, and API gating.',
        'Approve internal testing scope only.',
        'Keep production and external beta blocked.',
      ],
      allowed: true,
      blockedInPhase49A: true,
    },
  ]
}
