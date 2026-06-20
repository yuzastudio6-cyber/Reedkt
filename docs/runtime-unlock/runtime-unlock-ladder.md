# Runtime Unlock Ladder

The ladder is ordered and non-skippable by default:

| Stage | Meaning |
| --- | --- |
| `blocked` | Scope has no owner acceptance or audit evidence. |
| `owner_accepted` | Owner has accepted scope and blockers. |
| `repo_audit_passed` | Owner repo audit passed without implementation. |
| `dry_run_passed` | Deterministic dry-run passed. |
| `generated_local_fixture_passed` | Generated/local fixture passed without real user data. |
| `staging_fixture_passed` | Private staging fixture passed. |
| `controlled_private_sample_passed` | One bounded private sample passed. |
| `internal_beta_candidate` | Internal beta candidate gates passed. |
| `external_beta_candidate` | External beta candidate gates passed. |
| `production_candidate` | Production candidate gates passed. |

Runtime unlocks require owner evidence, QA, private artifacts, and Supabase
milestone metadata at each later stage.
