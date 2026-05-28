# Activation Real Video Smart Cut Policy

Phase 29 is limited to metadata/timeline execution for one controlled real
video. It must not broaden real media testing.

Policy:

- use only Phase 28 run `phase28-20260528T01552`
- use only private staging GCS artifacts
- build conservative `talking_head_clean_cut`, `remove_dead_space`, and `preserve_story` metadata
- cut only when word-gap evidence supports safe boundaries
- protect transcript and caption ranges
- allow zero removals when evidence is insufficient
- keep `finalExportAllowed=false`
- keep `productionReadyAllowed=false`
- keep `externalBetaAllowed=false`
- keep `realUserMediaTestingAllowed=false`

Blocked:

- GPU
- provider APIs
- model downloads
- arbitrary media
- public or signed URLs as source of truth
- audio cleanup, color, masks, enhancement, slow motion
- final render/export
- Revideo production use
