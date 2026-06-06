# Supabase Function Search Path Future Test Matrix

Prompt 26F defines future test requirements only. No tests in this matrix are run by Prompt 26F.

Future test matrix status: `future_tests_planned`.
SQL executed: none.
Migration deployed: no.

| Function | Behavior to preserve | Future local test requirement | Future staging evidence requirement | Risk if changed |
| --- | --- | --- | --- | --- |
| `can_claim_worker_job` | Worker claim eligibility remains unchanged. | Compare expected true/false outcomes using synthetic local worker/job fixtures after a future local candidate exists. | Advisor warning cleared and worker/job gate behavior unchanged. | Job claim authorization or concurrency behavior can change. |
| `can_start_generation` | Generation start gate remains unchanged. | Exercise synthetic approval/credit/project states without provider calls. | Advisor warning cleared and generation gate behavior unchanged. | Generation can start too broadly or become blocked incorrectly. |
| `prevent_approved_plan_snapshot_immutable_update` | Approved snapshot immutability remains enforced. | Validate trigger blocks prohibited updates in local synthetic fixtures. | Advisor warning cleared and immutable snapshot behavior unchanged. | Approved plans could become mutable or legitimate status updates could break. |
| `can_run_job` | Job run eligibility remains unchanged. | Exercise synthetic job states without worker execution. | Advisor warning cleared and job gate behavior unchanged. | Worker/job runtime gates can drift. |
| `can_create_approved_plan_snapshot` | Snapshot creation authorization remains unchanged. | Exercise synthetic workspace/project/member states. | Advisor warning cleared and snapshot authorization unchanged. | Unauthorized approval snapshots or false denials can occur. |
| `active_worker_claim_exists` | Active claim lookup remains unchanged. | Exercise synthetic worker claim rows and stale/active timestamps if columns are known. | Advisor warning cleared and claim lookup behavior unchanged. | Worker lease conflict detection can drift. |
| `e2e_jsonb_has_secret_like_content` | Secret-like JSON detection remains unchanged. | Exercise safe synthetic JSON strings only. | Advisor warning cleared and helper remains test-safe. | Safety diagnostics can miss secret-like data. |
| `e2e_assert_safe_json` | JSON safety assertion remains unchanged. | Exercise safe synthetic JSON values only. | Advisor warning cleared and helper remains test-safe. | E2E safety checks can become weaker or overblocking. |
| `e2e_json_contains_secret_marker` | Secret marker detection remains unchanged. | Exercise safe synthetic marker/no-marker JSON only. | Advisor warning cleared and helper remains test-safe. | Safety diagnostics can miss marker strings. |

## Gate Notes

- Future tests must be local-only first.
- Staging tests require human approval, accepted evidence, GCP Secret Manager reference readiness, approved PR/commit/test set, and rollback/cleanup ownership.
- Production validation is not approved by Prompt 26F.
