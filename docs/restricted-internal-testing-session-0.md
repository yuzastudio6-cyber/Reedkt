# Restricted Internal Testing Session 0 Instructions

Session 0 is the next separate phase after this start gate. It must stay inside the frozen restricted internal testing scope unless a later owner-approved prompt changes that scope.

May do:
- `review_readiness_dashboards_and_reports`
- `review_clean_staging_milestone_registry_metadata`
- `review_track_b_capability_and_route_metadata`
- `review_completed_evidence_artifacts`
- `submit_issues_through_approved_issue_intake`
- `stop_and_escalate_on_any_blocked_scope_attempt`

Must not do:
- `start_internal_testing_session_0_in_this_phase`
- `execute_tools_workers_routes_or_providers`
- `process_broad_or_arbitrary_media`
- `create_public_artifacts_or_public_output`
- `use_signed_urls_as_source_of_truth`
- `execute_raw_prompts_as_worker_input`
- `mutate_supabase_or_production`
- `unlock_external_beta_paid_production_or_production`

Stop immediately on any secret exposure, production write, external beta exposure, public artifact, signed URL source-of-truth use, raw prompt execution, provider call, worker/tool/runtime execution outside scope, Supabase production mutation, or broad media processing.
