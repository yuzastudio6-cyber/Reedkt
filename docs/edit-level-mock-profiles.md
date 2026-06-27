# Edit Level Mock Profiles

RP-EDITLEVEL-02 defines exactly three deterministic mock profiles:

| Canonical level | Display | Legacy alias | Promise |
| --- | --- | --- | --- |
| `normal` | Normal | `basic` | Clean professional edit. |
| `premium` | Premium | `pro` | Enhanced creative edit. |
| `ultra_premium` | Ultra Premium | `premium` | Studio-level creative treatment. |

Every profile is `mockOnly: true`, `betaReady: true`, and `productionReady: false`.

## Estimate Fixtures

The mock values are architecture fixtures only:

- Normal: 1.0x credit estimate only, render budget future 1, revision budget future 1.
- Premium: 2.0x credit estimate only, render budget future 2, revision budget future 2.
- Ultra Premium: 4.0x credit estimate only, render budget future 3, revision budget future 3.

All profiles keep `creditsReservedOrSpent: false` and `needsProductValue: true`.
