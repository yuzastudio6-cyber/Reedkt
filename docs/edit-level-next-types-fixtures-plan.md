# Edit Level Next Types And Fixtures Plan

Historical RP-EDITLEVEL-01/RP-EDITLEVEL-02 handoff:

```text
RP-EDITLEVEL-03 - Mock Repository + API/Client Layer
```

RP-EDITLEVEL-03 is now complete as a mock-only repository/API/client boundary. The recommended next milestone is `RP-EDITLEVEL-04 - UI Cards + Recommendation`.

## Goal

RP-EDITLEVEL-02 has turned the RP-EDITLEVEL-01 architecture into mock-safe TypeScript profile definitions and fixtures. The next step is to add a mock repository plus API/client layer while avoiding real routes, migrations, providers, media workers, render/export, progress, and credit execution.

## Completed RP-EDITLEVEL-02 Work

- Add a future-safe `EditLevelProfile` type in the appropriate existing type boundary.
- Add mock profile fixtures for Normal, Premium, and Ultra Premium.
- Add a legacy alias normalizer for `basic`, `pro`, and `premium`.
- Add unit/smoke coverage that profiles resolve deterministically.
- Keep existing runtime edit-level behavior compatible until a later migration milestone.

## Completed RP-EDITLEVEL-03 Work

- Add mock-safe repository helpers over the existing fixtures.
- Add request/response client helpers without creating real route handlers.
- Keep current runtime behavior unchanged.
- Preserve the source-aware `premium` ambiguity contract.

RP-EDITLEVEL-04 UI cards may be pulled earlier if product needs visible level selection first.

## Decisions Still Needed

- Final public label launch timing: `needs_product_value`.
- Final credit estimate multipliers: `needs_product_value`.
- Final render/revision/variant budgets: `needs_product_value`.
- Whether Basic remains a public alias after beta: `needs_product_value`.

## Boundary

RP-EDITLEVEL-03 remains mock-safe. Real production repositories, production API routes, Supabase migrations, worker dispatch, provider/model calls, media processing, rendering, progress, and credit spend remain future milestones.
