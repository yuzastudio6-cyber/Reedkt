import type { PrivateSearxngResponse } from './private-web-search-capture-e2e-types'

export function validatePrivateSearxngContract(response: PrivateSearxngResponse): string[] {
  const blockers: string[] = []
  if (response.provider !== 'searxng') blockers.push('Private search provider contract must identify provider=searxng.')
  if (response.liveSearchUsed) blockers.push('Private search provider contract must not use live public search.')
  if (response.paidProviderUsed) blockers.push('Private search provider contract must not use paid providers.')
  if (response.results.length !== 3) blockers.push('Phase 49E private provider must return exactly 3 fixture results.')
  for (const result of response.results) {
    if (!result.title || !result.url || !result.content) blockers.push(`Private provider result ${result.rank} is missing title, URL, or content.`)
  }
  return blockers
}
