export function buildBraveLiveStorageGuard(input: {
  rawResponseStorage?: string
  snippetStorage?: string
  normalizedSourceCount: number
}) {
  const blockers: string[] = []
  const warnings: string[] = []
  const rawResponseStored = false as const
  const snippetsStored = false as const
  const storageRightsApproved = false as const

  if ((input.rawResponseStorage ?? process.env.BRAVE_SEARCH_STORE_RAW_RESULTS ?? 'true') !== 'false') blockers.push('Raw Brave response storage must remain disabled.')
  if ((input.snippetStorage ?? process.env.BRAVE_SEARCH_STORE_SNIPPETS ?? 'true') !== 'false') blockers.push('Brave snippet storage must remain disabled.')
  if (input.normalizedSourceCount < 1) blockers.push('At least one normalized source is required before writing the source manifest.')

  warnings.push('Phase 49L persists minimal normalized metadata only; raw Brave JSON and snippets are blocked.')
  return {
    passed: blockers.length === 0,
    rawResponseStored,
    snippetsStored,
    storageRightsApproved,
    blockers,
    warnings,
  }
}
