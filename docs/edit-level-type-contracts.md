# Edit Level Type Contracts

RP-EDITLEVEL-02 adds mock-safe TypeScript contracts for the future Edit Level system. These types do not replace the current runtime `basic | pro | premium` surface.

## Public Level Types

- `ReEditProCanonicalEditLevel`: `normal`, `premium`, `ultra_premium`.
- `ReEditProLegacyEditLevel`: `basic`, `pro`, `premium`.
- `ReEditProEditLevelInputSource`: `legacy_runtime`, `public_beta`, `explicit_canonical`.
- `ReEditProEditLevelDisplayName`: Normal, Premium, Ultra Premium.

The input source is required because the string `premium` can mean legacy Premium or public beta Premium depending on context.

## Profile Types

`EditLevelProfile` combines professional promise, analysis depth, tool routing, Qwen 3.7 depth, Qwen2.5-VL visual depth, transcript/audio/graphics policy, Edit Brief policy, Edit Preference/DNA policy, QA profile, estimate profile, fallback policy, UI card model, readiness flags, and warnings.

## Boundary

These are types/profiles/fixtures only. No runtime behavior, repository, API route, UI behavior, credit spend, render, or migration is added by RP-EDITLEVEL-02.
