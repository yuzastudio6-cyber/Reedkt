# RP-EXPORTLOCK-01 Credit Export Lock

RP-EXPORTLOCK-01 adds a mock-safe export credit gate after final settlement and before any future export unlock. The gate reads existing mock settlement and reservation state; it does not run settlement, checkout/top-up, render/export, provider calls, Supabase writes, production persistence, production wallet mutation, or ledger writes.

Export readiness is settlement-state driven:

- `settled`: export is allowed with `Export ready`.
- `settled_with_absorbed_overage`: export is allowed because ReEditPro absorbed unapproved overage and the user was not charged above the approved hold.
- `requires_top_up_before_export`: export is locked with `Action required: add credits to export` and a local mock export lock record.
- missing, draft, previewed, pending, revised-estimate, failed, or cancelled settlement states block export with typed readiness status.

The mock lock record is created only for approved-but-unfunded settlement state. It stores the settlement/reservation IDs, outstanding credits, final charge, reserved credits, and action copy. It never performs checkout/top-up and never unlocks export.

Render/export boundary wiring is deferred. Future export routes must call this gate before marking export-ready or unlocking delivery, but this milestone adds only the readiness contract, routes, validation, docs, and `smoke:credit-export-lock`.

RP-CREDITPURCHASE-01 adds the mock purchased-credit top-up path for `requires_top_up_before_export`. Top-up only increases local mock available credits; it does not unlock export, run render/export, or silently recover the gate. The caller must retry the export gate explicitly after top-up.
