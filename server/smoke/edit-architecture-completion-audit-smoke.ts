import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

type RequiredEvidence = {
  file: string
  evidence: string[]
  requirement: string
}

const requiredEvidence: RequiredEvidence[] = [
  {
    file: 'server/smoke/large-media-ingest-readiness-smoke.ts',
    requirement: 'Large professional source media must use one high bounded policy, recoverable direct storage transport, browser-memory-safe upload behavior, and an immutable-original proxy strategy.',
    evidence: [
      'high_source_ceiling_is_below_provider_hard_limit',
      'source_and_reference_limits_match_browser_and_backend',
      'professional_container_and_audio_limits_are_consistent',
      'high_media_limits_are_source_and_reference_scoped',
      'user_source_upload_requires_exact_declared_size',
      'large_gcs_target_is_create_only_resumable',
      'upload_service_preserves_large_size_and_session_lifetime',
      'resumable_browser_upload_recovers_exact_committed_offset',
      'resumable_offset_query_is_itself_retryable',
      'resumable_no_progress_ack_retries_without_restarting',
      'provider_session_uri_receives_no_backend_authorization',
      'browser_upload_does_not_require_whole_file_checksum',
      'professional_proxy_is_bounded_1080p_and_preserves_original_for_final',
      'media_task_timeouts_scale_for_large_duration_and_size',
      'local_raw_route_remains_small_and_non_production',
    ],
  },
  {
    file: 'server/smoke/large-media-background-finalization-smoke.ts',
    requirement: 'Large resumable sources must fail closed on inline finalization and use restart-safe private enqueue, lease, retry, recovery, polling, and canonical-read authority.',
    evidence: [
      'large_inline_finalize_fails_closed_before_object_read',
      'authenticated_enqueue_and_poll_routes_are_registered_and_mounted',
      'durable_domain_idempotency_replay_and_conflict',
      'restart_read_from_checksum_protected_private_authority',
      'one_active_lease_prevents_duplicate_execution',
      'bounded_retry_can_complete_on_second_attempt',
      'operational_verification_failure_preserves_retry_eligible_upload_authority',
      'expired_lease_is_reclaimable_without_reusing_credential',
      'browser_resumable_path_enqueues_polls_and_reads_canonical_finalization',
      'no_live_gcs_provider_supabase_render_credit_or_editing_execution',
    ],
  },
  {
    file: 'server/smoke/source-upload-planning-backend-smoke.ts',
    requirement: 'Source uploads must create private upload targets, promote source metadata, and preserve upload order before planning.',
    evidence: [
      'backend_upload_intent_created',
      'source_file_bytes_uploaded_to_backend_target',
      'backend_upload_finalized_to_media_asset',
      'source_sequence_created_from_backend_media_asset',
      'idempotency_keys_sent_for_backend_upload_writes',
    ],
  },
  {
    file: 'server/smoke/approved-snapshot-smoke.ts',
    requirement: 'Legacy caller-authored approval mutations must fail closed in favor of canonical authority.',
    evidence: [
      'caller_authored_snapshot_service_disabled',
      'standalone_credit_approval_service_disabled',
      'standalone_credit_reservation_service_disabled',
      'canonical_authority_is_only_mutation_path',
    ],
  },
  {
    file: 'server/smoke/canonical-private-tool-dispatch-authority-smoke.ts',
    requirement: 'Canonical private execution must bind approved authority, leases, exact tool operations, private artifacts, QA, and replay without production promotion.',
    evidence: [
      'strict_identity_only_request_and_server_injected_lease',
      'exact_snapshot_job_work_item_output_tool_operation_binding',
      'atomic_dispatch_consumption_authorizes_one_execution_start_only',
      'same_idempotent_coordinator_attempt_resumes_after_completed_execution_fence',
      'remotion_source_caption_private_final_mp4_canonical_lifecycle_verified',
      'private_final_composition_consumes_exact_source_trim_authority_and_caption_with_h264_aac_final_qa_while_public_delivery_and_settlement_remain_false',
    ],
  },
  {
    file: 'server/smoke/private-edit-decision-manifest-verification-smoke.ts',
    requirement: 'Private edit decision manifest verification must preserve the approved professional skill trace while hiding internal adapter/tool names.',
    evidence: [
      'professional_skill_trace_preserved',
      'professional_skill_trace_hides_internal_tool_names',
      'Verified professional skill trace must not expose internal adapter/tool names.',
      'model_role_trace_preserved',
      'missing_model_role_trace_rejected',
      'invalid_deepseek_visual_understanding_trace_rejected',
      'Private manifest verification must preserve Kimi K3 as the primary edit reasoning/planning/coding role.',
      'Private manifest verification must preserve Qwen 3.7 as the first full-capability fallback.',
      'Private manifest verification must preserve Qwen2.5-VL as visual-understanding only.',
      'Private manifest verification must preserve DeepSeek V4 Pro as the final full-capability fallback.',
    ],
  },
  {
    file: 'server/smoke/professional-skill-planner-smoke.ts',
    requirement: 'Professional skill planning must support prompt-first edits when no Edit Brief is provided, while preserving optional brief guidance and model-role boundaries.',
    evidence: [
      'Skill planning must support prompt-first planning.',
      'Edit Brief must remain optional.',
      'Prompt plus uploaded source must be enough for a plan-ready skill plan.',
      'Prompt-first plan should not block only because the Edit Brief is absent.',
      'Absent brief should be recorded as optional guidance, not a blocker.',
      'Professional skill planning must carry the canonical Kimi K3 primary edit-agent intent.',
      'Professional skill planning must carry the canonical Qwen 3.7 first-fallback intent.',
      'Professional skill planning must carry the canonical DeepSeek V4 Pro final-fallback intent.',
      'Professional skill planning must carry the canonical Qwen2.5-VL visual-understanding intent for source review.',
    ],
  },
  {
    file: 'server/smoke/editor-user-facing-copy-boundary-smoke.ts',
    requirement: 'User-facing planning, adapter, and edit-level copy must summarize editing activity without exposing internal package names, provider/model-role names, backend terms, or source-truth wording.',
    evidence: [
      'sanitizer_covers_ready_adapter_names',
      'professional_skill_plan_user_copy_hides_internal_names',
      'adapter_plan_user_copy_hides_internal_names',
      'edit_level_ui_models_hide_model_provider_names',
      'advanced_capability_copy_uses_product_language',
    ],
  },
  {
    file: 'server/smoke/professional-tool-architecture-program-smoke.ts',
    requirement: 'Professional tool architecture must preserve accepted owner-lane source truth, bounded adapter counts, registry-only backlog buckets, and hard product/frontend execution boundaries.',
    evidence: [
      'ownerLaneSourceTruthAcceptedToolCount',
      'Owner-lane launch-core and support tools must be accepted as source truth instead of re-approved by this lane.',
      'Only genuinely ambiguous registry-named tools should remain in the promotion backlog.',
      'Registry-only model/checkpoint lanes must stay explicit.',
      'Owner-lane support tools must not remain as this lane scope-decision backlog.',
      'Registry-only evaluation/not-selected lanes must stay explicit.',
      'productReadyToolCount',
      'frontendExecutableToolCount',
    ],
  },
  {
    file: 'server/smoke/edit-execution-boundary-security-smoke.ts',
    requirement: 'Legacy caller-authored execution and worker mutation routes must remain fail closed after canonical authority cutover.',
    evidence: [
      'canonical_identity_only_execution_package_schema',
      'production_and_cloud_browser_package_preparation_review_media_and_decision_routes_unmounted',
      'local_private_browser_review_media_requires_user_auth_and_strict_exact_review_query',
      'local_private_browser_review_decision_requires_user_auth_and_strict_exact_review_body',
      'caller_authored_worker_claim_and_run_routes_disabled',
      'caller_authored_tool_runtime_evidence_write_disabled',
      'caller_authored_render_job_creation_disabled',
    ],
  },
  {
    file: 'tests/e2e/editor.spec.ts',
    requirement: 'The visible editor flow must start from project creation, upload video, support prompt-first planning without requiring Edit Brief, reach private review, and avoid showing generic mock preview art after the private artifact exists.',
    evidence: [
      'creates an edit plan from uploaded source and chat prompt without requiring Edit Brief',
      'creates a project, opens its edit, uploads video, and reaches private review',
      'Private review is ready',
      'not.toContainText(/Property details/i)',
      'Download MP4',
      'Download review record',
      'Sharing and billing remain off',
    ],
  },
  {
    file: 'tests/e2e/editor-expanded-flows.spec.ts',
    requirement: 'Expanded editor planning details must stay bounded, readable above the composer, and free of internal tool/model/provider names.',
    evidence: [
      'expands editor detail cards without taking over the layout',
      'keeps expanded planning details free of internal tool names',
      'keeps developer-level planning details free of internal tool names',
      'opens SFX descriptor flow and keeps advanced details bounded',
      'opens Music descriptor flow and keeps cue details bounded',
      'expectNoInternalToolNamesInEditor',
      'expectChatCardsFitUnderComposer',
      'expectLastContentReachableAboveComposer',
    ],
  },
  {
    file: 'tests/e2e/editor-keyboard.spec.ts',
    requirement: 'Keyboard editor QA must prove the composer, source/reference controls, approval, timeline, and soundflow disclosures remain accessible and do not expose internal implementation names.',
    evidence: [
      'keeps compact composer controls labelled, focusable, and keyboard-send safe',
      'keeps source and reference controls keyboard reachable with clear focus treatment',
      'keeps approval, timeline, and soundflow disclosures keyboard safe',
      'expectIconButtonsHaveAccessibleTitles',
      'expectDetailsSummaryKeyboardToggle',
      'No sound preparation starts here',
      'expectNoGenerationBeforeApproval',
    ],
  },
  {
    file: 'tests/e2e/viewport.spec.ts',
    requirement: 'Viewport route QA must cover only the clean active app routes, prove retired app surfaces redirect, and preserve the Home/Projects/Preferences-only sidebar.',
    evidence: [
      'legacy app route redirects',
      'legacyRedirectRoutes',
      'retiredAppSurfacePattern',
      'Home',
      'Projects',
      'Preferences',
      'wallet|pricing|brand kit|exports|upload',
      'expectedPath',
    ],
  },
  {
    file: 'tests/e2e/canonical-journey-ui.spec.ts',
    requirement: 'The named-edit browser must request one exact approved-snapshot private handoff without receiving raw execution authority or starting browser-owned editing work.',
    evidence: [
      'requests one exact private handoff without starting browser-owned edit work',
      'canonical-execution-package-request-submit',
      'expectedSnapshotHash',
      'request_canonical_execution_package',
      'internalExecutionRequestCount',
      'Editing tools and rendering remain stopped',
      'Backend preparation has not reported progress yet',
    ],
  },
  {
    file: 'tests/e2e/canonical-journey-ui.spec.ts',
    requirement: 'The named-edit browser must start backend-owned private preparation from exact approved package authority without supplying or receiving jobs, tools, commands, paths, credentials, providers, or prices.',
    evidence: [
      'starts exact private edit preparation without exposing browser-owned jobs or tools',
      'canonical-private-edit-preparation-submit',
      'expectedPackageHash',
      'prepare_canonical_private_edit_review',
      'rawInternalRequestCount',
      'Start private edit',
      'Private review ready',
    ],
  },
  {
    file: 'tests/e2e/canonical-journey-ui.spec.ts',
    requirement: 'The named-edit browser must integrity-check exact private review media, record a structured revision against that review, and reopen immutable review history without receiving internal execution authority.',
    evidence: [
      'plays the exact private review, records structured changes, and reopens immutable history',
      'canonical-private-review-load',
      'canonical-private-review-player',
      'expectedFinalArtifactSha256',
      'record_canonical_private_review_decision',
      'revisionIntent',
      'requiresFreshEstimateAndApproval',
      'download_canonical_private_review_history_artifact',
      'historyRequests',
    ],
  },
  {
    file: 'src/components/editor/PreviewReadyCard.tsx',
    requirement: 'The preview card must switch into a truthful private-review state once the private artifact exists.',
    evidence: [
      'privateReviewReady',
      'Private review is ready',
      'A private review video has been prepared from your approved plan and uploaded sources.',
      'Sharing, billing, and external release stay off.',
    ],
  },
  {
    file: 'server/smoke/edit-architecture-internal-review-smoke.ts',
    requirement: 'The aggregate internal review must include current source, canonical authority, cost, runtime, worker, private artifact, Playwright, and fail-closed legacy boundary checks.',
    evidence: [
      'source_upload_planning',
      'approved_snapshot',
      'cost_controls',
      'runtime_contracts',
      'professional_tool_architecture_program',
      'bounded_adapter_source_truth',
      'private_source_media_authority',
      'canonical_execution_readiness',
      'canonical_worker_lease_verification',
      'private_canonical_worker_sandbox',
      'playwright_editor_flow',
      'playwright_expanded_editor_flow',
      'playwright_editor_keyboard_flow',
      'playwright_route_viewport_flow',
      'canonical_execution_package_request_client',
      'canonical_private_edit_preparation_client',
      'canonical_private_review_client',
      'playwright_canonical_journey_flow',
      'legacy_execution_routes_fail_closed',
    ],
  },
]

const results = []

for (const item of requiredEvidence) {
  const contents = await readFile(item.file, 'utf8')
  for (const evidence of item.evidence) {
    assert.ok(
      contents.includes(evidence),
      `${item.file} is missing required evidence "${evidence}" for requirement: ${item.requirement}`,
    )
  }
  results.push({
    file: item.file,
    requirement: item.requirement,
    evidenceCount: item.evidence.length,
    status: 'covered',
  })
}

console.log(JSON.stringify({
  ok: true,
  suite: 'edit_architecture_completion_audit',
  checkedAt: new Date().toISOString(),
  requirementCount: results.length,
  evidenceCount: results.reduce((sum, item) => sum + item.evidenceCount, 0),
  checks: [
    'source_upload_to_private_storage_coverage_present',
    'approval_snapshot_credit_idempotency_coverage_present',
    'professional_private_render_qa_coverage_present',
    'professional_skill_trace_manifest_verification_coverage_present',
    'prompt_first_optional_edit_brief_skill_planning_coverage_present',
    'user_facing_copy_boundary_coverage_present',
    'professional_tool_architecture_program_coverage_present',
    'browser_project_upload_review_revision_recovery_coverage_present',
    'expanded_and_keyboard_editor_qa_coverage_present',
    'clean_route_shell_and_legacy_redirect_qa_coverage_present',
    'canonical_named_edit_private_handoff_coverage_present',
    'canonical_named_edit_private_preparation_coverage_present',
    'canonical_named_edit_private_review_decision_and_history_coverage_present',
    'visible_private_review_card_coverage_present',
    'aggregate_internal_review_coverage_present',
  ],
  results,
}, null, 2))
