# Brave Search Storage Rights Policy

Phase 49J blocks raw Brave Search API response persistence by default.

## Defaults

- `storeRawBraveResponse=false`
- `storeBraveSnippets=false`
- `storeNormalizedMinimalMetadata=false`

## Rules

- Raw Brave JSON persistence requires explicit storage rights in the selected
  plan or terms.
- Snippet persistence requires explicit storage rights.
- Minimal normalized metadata is future-scoped and must be reviewed before use.
- Captured page content is governed by the source publisher's terms and
  ReeditPro capture policy, not Brave API result rights.
- Search result records must not overclaim rights to third-party webpages.

Phase 49K may use Brave-shaped fixture data only and must not include a real
Brave API response. Phase 49L cannot persist raw Brave responses or real Brave
snippets unless the selected plan/terms and ReeditPro policy explicitly approve
that storage mode.
