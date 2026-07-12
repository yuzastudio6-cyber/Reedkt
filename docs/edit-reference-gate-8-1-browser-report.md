# Gate 8.1 Browser Report

Status: `passed_60_of_60_backend_local`

## New Coverage

`tests/e2e/edit-reference-gate-8-1-entrypoints.spec.ts` adds two Chromium tests:

1. A controlled rights-safe MP4 is privately uploaded, studied locally, surfaced with local/degraded/mock provenance, synthesized into DNA, quality-reviewed, approved, selected during New Edit, consumed by Brief/Marker Context/Plan Hints/QA, recovered after reload, compared/replaced/removed through Edit Chat, and verified in immutable Applied Edits history.
2. The approved-reference selector is keyboard-operated under reduced motion and checked at 1440, 1024, 768, and 375 CSS pixels for horizontal overflow and 44px choice/inspection targets.

The focused result is `2 passed`. The final full result is `60/60 Chromium tests passed with five workers in 1.6 minutes`; the Gate 8 baseline was 58/58 and no test was removed. Compatibility-preference regression tests now explicitly open the intended progressive-disclosure section before choosing legacy profiles.

Observed and repaired during browser testing:

- fractional video durations needed `step="0.01"`;
- a new target needed an explicit bounded Open Edit Brief action;
- a reloaded dynamic target needed canonical-application-driven session-shell recovery;
- replacement needed active-application ID refresh instead of retaining the panel’s old context;
- cleared history needed an empty shell on reload without reactivation.
- parallel browser workers exposed deterministic mock Edit Session ID collisions; New Edit now supplies a collision-resistant session ID before any canonical application is created.

Production behavior remains disabled. Browser proof is mock/backend-local and does not prove remote Supabase, cross-device, distributed-worker, provider, billing, or deployment readiness.
