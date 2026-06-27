# Edit Level Legacy Alias Compatibility

The active runtime surface still uses:

```text
basic | pro | premium
```

RP-EDITLEVEL-01 documents future public labels without changing runtime behavior.

## Compatibility Mapping

```text
basic -> Normal
pro -> Premium
premium -> Ultra Premium
```

| Current runtime value | Future public label | Compatibility note |
| --- | --- | --- |
| `basic` | Normal | Clean professional edit. Legacy basic/pro/premium compatibility should treat `basic` as the Normal alias until a migration milestone changes storage and UI behavior. |
| `pro` | Premium | Enhanced creative edit. Compatibility should treat `pro` as the Premium alias until a migration milestone changes storage and UI behavior. |
| `premium` | Ultra Premium | Studio-level creative treatment. Compatibility should treat `premium` as the Ultra Premium alias until a migration milestone changes storage and UI behavior. |

## Migration Architecture

- The current internal enum stays compatible until a runtime migration milestone.
- Future public labels may show Normal / Premium / Ultra Premium after product copy, UI, analytics, and approved snapshot compatibility are ready.
- A future backend profile resolver should normalize legacy aliases into public profiles.
- Analytics and docs should distinguish legacy runtime names from future product labels.
- Approved snapshots must preserve the exact legacy runtime value and resolved public profile used at approval time once runtime profiles exist.

## Boundary

No runtime rename in RP-EDITLEVEL-01. No database migration, API change, UI behavior, repository, or type implementation is created.
