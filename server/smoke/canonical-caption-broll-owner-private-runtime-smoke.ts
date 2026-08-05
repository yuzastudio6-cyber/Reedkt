const evidenceRoot =
  process.env.REEDITPRO_CAPTION_BROLL_PRIVATE_EVIDENCE_ROOT?.trim() ?? ''

if (evidenceRoot.length === 0) {
  throw new Error(
    'Caption B-roll private evidence requires an explicit private evidence root.',
  )
}

process.env.REEDITPRO_CAPTION_BROLL_REQUIRE_EVIDENCE = '1'

await import('./b-roll-public-canonical-lifecycle-smoke')
