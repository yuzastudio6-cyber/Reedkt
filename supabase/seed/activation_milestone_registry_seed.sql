-- Local-only activation milestone registry fixture.
-- Do not run this seed in staging or production. It contains safe metadata
-- examples only and does not backfill Track B export rows.

insert into public.activation_milestones (
  phase_id,
  track,
  family,
  milestone_name,
  milestone_status,
  readiness_status,
  beta_status,
  branch,
  pr_number,
  pr_url,
  source_report_path,
  export_version,
  summary_json,
  evidence_json
) values
(
  'phase44p',
  'track_b',
  'hybrid_compute',
  'Track B readiness rollup and Supabase milestone export',
  'passed',
  'phase_complete_restricted_scope',
  'internally_beta_ready_candidate_restricted_scope',
  'codex/rp-trackb-readiness-rollup-supabase-milestone-export',
  196,
  'https://github.com/yuzastudio6-cyber/Reedkt/pull/196',
  'docs/activation-track-b-readiness-rollup-reports/track_b_readiness_rollup_final_report.json',
  'track-b-supabase-milestone-export-v1',
  '{"fixture":"passed_milestone","safeMetadataOnly":true}'::jsonb,
  '["docs/activation-track-b-readiness-rollup-reports/track_b_supabase_milestone_export.json"]'::jsonb
),
(
  'phase44n',
  'track_b',
  'hybrid_compute',
  'Metadata route dry-run approval packet',
  'blocked',
  'blocked',
  'blocked',
  'codex/rp-activation-44n-metadata-route-dry-run-approval-packet',
  192,
  'https://github.com/yuzastudio6-cyber/Reedkt/pull/192',
  'docs/activation-phase-44n-metadata-route-dry-run-approval-reports/phase_44n_metadata_route_dry_run_approval_decision.json',
  'track-b-supabase-milestone-export-v1',
  '{"fixture":"blocked_milestone","safeMetadataOnly":true}'::jsonb,
  '["docs/activation-phase-44n-metadata-route-dry-run-approval-reports/phase_44n_metadata_route_dry_run_approval_decision.json"]'::jsonb
)
on conflict (phase_id, track, family, milestone_name) do nothing;

insert into public.activation_tool_readiness (
  track,
  family,
  tool_id,
  phase_id,
  readiness_status,
  internal_ready,
  initial_internal_testing_included,
  allowed_scope,
  blocked_scope,
  next_required_phase,
  source_report_path,
  metadata_json
) values
(
  'track_b',
  'media_data',
  'duckdb',
  'phase44p',
  'phase_complete_restricted_scope',
  true,
  true,
  '["restricted_internal_metadata_reporting"]'::jsonb,
  '["production","external_beta","public_output","broad_media"]'::jsonb,
  'supabase_trackb_staging_backfill_rerun_after_schema',
  'docs/activation-track-b-readiness-rollup-reports/track_b_tool_status_rollup.json',
  '{"fixture":"readiness","safeMetadataOnly":true}'::jsonb
)
on conflict (track, tool_id, phase_id) do nothing;

insert into public.activation_blockers (
  phase_id,
  blocker_code,
  blocked_scope,
  blocker_status,
  severity,
  source_report_path,
  metadata_json
) values
(
  'phase44n',
  'future_phase_required',
  'route_execution',
  'active',
  'blocking',
  'docs/activation-phase-44n-metadata-route-dry-run-approval-reports/phase_44n_metadata_route_dry_run_blocker_report.json',
  '{"fixture":"blocker","safeMetadataOnly":true}'::jsonb
)
on conflict (phase_id, blocker_code, blocked_scope) do nothing;

insert into public.activation_pr_evidence (
  phase_id,
  pr_number,
  pr_url,
  branch,
  evidence_status,
  source_report_path,
  evidence_json
) values
(
  'phase44p',
  196,
  'https://github.com/yuzastudio6-cyber/Reedkt/pull/196',
  'codex/rp-trackb-readiness-rollup-supabase-milestone-export',
  'passed',
  'docs/activation-track-b-readiness-rollup-reports/track_b_pr_evidence_inventory.json',
  '{"fixture":"pr_evidence","safeMetadataOnly":true}'::jsonb
)
on conflict (phase_id, pr_number, source_report_path) do nothing;

insert into public.activation_artifact_manifests (
  phase_id,
  artifact_prefix,
  artifact_storage_class,
  artifact_object_count,
  artifact_total_bytes,
  artifact_manifest_hash,
  source_report_path,
  metadata_json
) values
(
  'phase44p',
  'docs/activation-track-b-readiness-rollup-reports/',
  'committed_safe_metadata',
  12,
  0,
  'local-fixture-hash-redacted',
  'docs/activation-track-b-readiness-rollup-reports/track_b_private_artifact_manifest.json',
  '{"fixture":"artifact_metadata","safeMetadataOnly":true}'::jsonb
)
on conflict (phase_id, artifact_prefix, source_report_path) do nothing;
