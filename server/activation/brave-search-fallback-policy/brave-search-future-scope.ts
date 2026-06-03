import type { BraveSearchFuturePhase } from './brave-search-fallback-types'

export function buildBraveSearchFuturePhases(): BraveSearchFuturePhase[] {
  return [
    {
      phaseId: '49K',
      title: 'Brave-shaped fixture and normalizer',
      summary: 'Use generated Brave-shaped fixture responses only; no live API, no secret, no paid provider execution.',
      liveBraveApiAllowed: false,
    },
    {
      phaseId: '49L',
      title: 'Brave controlled live API validation',
      summary: 'Future secret-backed bounded live validation with one query, at most five results, private QA, and storage-rights controls.',
      liveBraveApiAllowed: true,
    },
    {
      phaseId: '49M',
      title: 'SearXNG plus Brave hybrid consensus E2E',
      summary: 'Future compare/dedupe/rank workflow after controlled Brave validation passes.',
      liveBraveApiAllowed: true,
    },
    {
      phaseId: '49N',
      title: 'Search provider readiness gate',
      summary: 'Readiness closure where SearXNG remains default and Brave can be optional premium fallback only if configured.',
      liveBraveApiAllowed: false,
    },
  ]
}
