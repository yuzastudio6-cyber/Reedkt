# Gate 8.1 Edit Reference Application Entry Points

Status: `passed_backend_local`

Gate 8.1 adds two user entry points without adding a second application store:

```text
New Edit approved-reference selector ─┐
                                      ├─ one canonical PreferenceApplication service
Edit Chat @reference command service ─┘
```

## New Edit

The real Project Home `+ New Edit` flow lists only active references with an exact approved Preference DNA version and non-blocking QA result. The bounded selector exposes name, DNA version, QA status, confidence, do-not-copy boundary count, applicable layers, inspection, target direction, and `No Edit Reference`. The chosen ID is submitted through the create-flow adapter. After the target session exists, the adapter prepares and connects a canonical application with `applicationSource = setup_selector`.

The selected reference is not authoritative component state or localStorage. Reload recovery reads the backend-local application and reconstructs only a minimal mock target-session shell when the current browser loses its in-memory session. It then activates the exact connected application by ID and context hash.

## Edit Chat Commands

The shared command service parses and executes:

- `Use @TravelDocumentary for this edit.`
- `Apply @CleanTeaching but make captions stronger.`
- `Compare @ProductCommercial and @MinimalCreator.`
- `Replace the current reference with @MinimalCreator.`
- `Remove the current edit reference.`

Matching is Unicode-aware, normalized, exact-first, and safely clarifies ambiguous or missing handles. Compare is read-only. Same-reference apply is idempotent. A successful chat mutation records `applicationSource = chat_tag` in the same canonical application history used by `setup_selector`. Replacement and removal require an explicit confirmation turn. Override instructions enter the target snapshot and remain lower priority than safety, approved constraints, current target instructions, and confirmed Brief markers.

## UI Authority

`design.md`, `design-system/`, and the current ReEditPro product architecture remain authoritative. UI UX Pro Max supplied only supporting accessibility/craft checks. The selector uses progressive disclosure, visible focus, 44px controls, reduced-motion-safe behavior, and verified 375/768/1024/1440 layouts without a dropdown wall.

Behavior proof:

```text
npm run smoke:edit-reference-gate-8-1-closure
npx playwright test tests/e2e/edit-reference-gate-8-1-entrypoints.spec.ts
```

No provider, remote Supabase, worker, render, billing, credit, deployment, push, or PR action is enabled.
