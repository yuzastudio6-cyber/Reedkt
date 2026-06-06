# Supabase FK Index Future Test Matrix

Future test matrix status: `fk_index_future_tests_planned`.
Local SQL run: no.
Staging SQL run: no.
Supabase update status: docs_only.
Supabase environment touched: none.
SQL executed: none.
Migration deployed: no.

## Future Validation Matrix

| Gate | Purpose | Required evidence | Prompt 26H status |
| --- | --- | --- | --- |
| Static draft review | Confirm target list, names, and duplicate-review contract | Reviewer notes and no active migration changes | Planned only |
| Local migration candidate | Create guarded additive index candidate in a future prompt | Local migration file diff and dry-run/static diagnostics | Not created |
| Local advisor/query check | Confirm local advisor state and query/index shape | Sanitized local evidence only | Not run |
| Staging preflight | Confirm human approval, accepted evidence, PR, commit, rollback owner, and Secret Manager references | Gate checklist | Blocked |
| Staging migration candidate | Apply only after approval path is complete | Sanitized staging migration output | Blocked |
| Advisor recheck | Confirm unindexed FK findings changed or documented exceptions | Sanitized advisor evidence | Blocked |
| Write-amplification review | Confirm no unacceptable write overhead | Query/write evidence | Planned only |
| Rollback rehearsal | Confirm future index drops are named and scoped | Rollback checklist | Planned only |

## Candidate Test Coverage

Future tests must include all fifteen FK findings from `docs/supabase-fk-index-priority-matrix.md`. The deferred `ambient_sound_plans.audio_environment_analysis_id` candidate may remain excluded from an active migration until Sound/Music ownership evidence exists, but its defer reason must stay explicit.

