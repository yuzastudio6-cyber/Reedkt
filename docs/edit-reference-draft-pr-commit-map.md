# Edit Reference Draft PR Commit Map

Status date: 2026-07-12

## Selection Rule

The source branch contains 49 commits not present in the selected remote base, while the remote base contains 324 commits not present in the source branch. Their merge base is `84a0eb46c93ca5a200b1e5c9bd7976d28210e0a0`.

Decision B was selected. Only the 21 Edit Reference Gate 0–8.1 commits were replayed. Required dependencies absent from the remote base were reconstructed in bounded reconciliation commits. The first 28 source-only beta-integration commits were not replayed wholesale.

## Replayed Goal Commits

| Source commit | PR commit | Purpose |
| --- | --- | --- |
| `96ea3ef2` | `1c326843` | Establish Edit Reference goal control plane |
| `1e4298cc` | `39941cf2` | Record Gate 0 completion |
| `a46519df` | `e6e73d37` | Add durable Study Session foundation |
| `b14c69f5` | `77411d4c` | Record Gate 1 completion |
| `1af64c45` | `7f4d6440` | Add evidence study orchestration |
| `078e754d` | `8bc881b7` | Record Gate 2 completion |
| `b01b4886` | `469173c1` | Add versioned Preference DNA synthesis |
| `8255ce20` | `a91af9c9` | Record Gate 3 completion |
| `f64aa269` | `2d00e51f` | Add Preference DNA QA and approval |
| `31e1dca4` | `1961a377` | Record Gate 4 completion |
| `17b67a87` | `782ce554` | Add target-aware Preference Applications |
| `b1ab3983` | `f5b4cf84` | Record Gate 5 completion |
| `a09bc3da` | `4d820ae5` | Connect Edit References to edit planning |
| `dc2d6bc4` | `2ede4666` | Record Gate 6 completion |
| `42d34cdc` | `a7f56b02` | Close replacement/removal lifecycle |
| `abb3b954` | `7304e7a8` | Record Gate 7 completion |
| `7ff15993` | `c648f73f` | Close beta-readiness gaps |
| `08a0802d` | `9f39110a` | Record Gate 8 verification |
| `0e12652a` | `6f205ce6` | Close private local media-study wiring |
| `64e61279` | `08834035` | Add New Edit and chat application entry points |
| `dc2f3625` | `6280da09` | Record Gate 8.1 verification |

## PR-Only Reconciliation Commits

| Commit | Purpose |
| --- | --- |
| `7cb122a34b0d3cf9d261aca3273d7574b82ab834` | Reconcile Edit References, Workspace Defaults, deterministic browser hashing, Preference DNA dependencies, and dedicated Chat/Brief routes with the selected remote base |
| `257a64922cbb4f778ebe7ea63dd03a560dcbd8dc` | Align stale remote-base browser expectations with the active route and navigation architecture |
| `8b4921e128fecff14cb30e6e5657849f2bff471a` | Strengthen safe local auth/upload/preview browser verification while preserving live-provider gates |

A final PR-readiness evidence commit and a post-PR status commit are added after verification and draft PR creation.

## Excluded Source-Only Integration Commits

The following commits were inspected but not replayed wholesale because they predate the Edit Reference Goal, overlap newer remote-base product work, or belong to unrelated integration/runtime tracks:

- Repository and core integration: `5d2118ac`, `b941feb6`, `acc8ffb8`, `32204ae0`, `05145602`, `be6b013b`.
- Qwen and visual runtime tracks: `90fe94d4`, `fa3f0e66`, `63d67c5f`, `7ae18bd5`, `29226b63`, `b607df5d`, `00a32eff`, `1e636dcc`, `9f3bb763`, `32c825d5`, `baa810f7`, `4b57d2c7`, `5c227f6f`, `02d99b8c`.
- Earlier preference/beta readiness tracks: `51fecf00`, `49e59ecd`, `4c890839`, `21990607`, `064fea81`, `58ad6e7e`, `cb17e7c4`, `48540ee9`.

Their required stable contracts were either already present in the remote base or were reintroduced narrowly in the reconciliation commits. Their deleted legacy pages, obsolete route shell, unrelated feature stacks, historical migration state, and broad integration history were not restored.

## Required Dependencies Retained

- Preference DNA layer registry, transferability, evidence scoring, and types.
- Current Project Edit Session repository/client and Edit Brief contracts.
- Marker Chat Qwen boundary and deterministic fallback contracts.
- App shell, Button/Card/Badge primitives, current project-first navigation, and Workspace Defaults.
- FFprobe/FFmpeg private media-study path already required by Gate 8.1.
- Existing cost/credit/provider gates only as boundaries; no execution activation.

## Package And Migration Result

- `package.json` adds only Edit Reference validation/smoke commands.
- `package-lock.json` is byte-identical to the selected base.
- No dependency was added.
- No Supabase migration changed.
- Source migration count: 21.
- Selected base and PR branch migration count: 24.
