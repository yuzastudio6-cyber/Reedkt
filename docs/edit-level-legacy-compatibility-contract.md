# Edit Level Legacy Compatibility Contract

The current runtime still uses:

```text
basic | pro | premium
```

RP-EDITLEVEL-02 adds source-aware compatibility helpers without renaming runtime fields.

## Source-Aware Mapping

| Input source | Input | Canonical result |
| --- | --- | --- |
| `legacy_runtime` | `basic` | `normal` |
| `legacy_runtime` | `pro` | `premium` |
| `legacy_runtime` | `premium` | `ultra_premium` |
| `public_beta` | `premium` | `premium` |
| `explicit_canonical` | `premium` | `premium` |

The string `premium` is ambiguous without source context. Helpers must not blindly normalize every `premium` string to Ultra Premium.

## Boundary

No runtime level rename, migration, repository, API route, UI behavior, or approved snapshot change is implemented.
