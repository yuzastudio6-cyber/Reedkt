import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

type RequiredEvidence = {
  file: string
  evidence: string[]
  requirement: string
}

const requiredEvidence: RequiredEvidence[] = [
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
    requirement: 'Approval must freeze an approved snapshot and require credit approval/reservation, idempotency, owner isolation, and secret rejection.',
    evidence: [
      'valid_approved_plan_estimate_reservation_creates_snapshot',
      'credit_approval_and_reservation_owner_metadata_recorded',
      'same_idempotency_key_different_body_conflicts',
      'secret_like_snapshot_payload_rejected',
    ],
  },
  {
    file: 'server/smoke/private-internal-edit-upload-e2e-smoke.ts',
    requirement: 'Uploaded private media must become a professional private review render with source order, captions, overlays, timing, audio, manifest, and blocked release gates.',
    evidence: [
      'approved_private_internal_test_run_consumes_uploaded_source_media',
      'private_final_render_preserves_uploaded_source_order_trace',
      'approved_caption_timing_overlays_burned_into_private_render',
      'approved_transition_timing_polish_applied_to_private_render',
      'approved_color_pipeline_visual_polish_applied_to_private_render',
      'approved_master_timing_final_ranges_applied_to_private_render',
      'voice_first_audio_loudness_polish_applied_to_private_render',
      'private_internal_download_streams_mp4_bytes',
      'private_internal_download_streams_edit_decision_manifest',
      'public_beta_production_and_billing_remain_blocked',
    ],
  },
  {
    file: 'server/smoke/editor-full-stack-private-review-smoke.ts',
    requirement: 'The browser-backed flow must create a project, upload real synthetic videos, approve a plan, download a private MP4, verify manifest/frame/audio evidence, support revision, and recover accepted edits.',
    evidence: [
      'project_create_page_handoff_opened_editor_with_project_identity',
      'browser_uploaded_two_real_synthetic_mp4s_through_backend_intent',
      'approved_plan_created_private_internal_test_run',
      'private_review_card_shows_professional_edit_decision_trace',
      'private_review_download_matches_recorded_final_render_sha',
      'Private review edit trace download should preserve the private edit-decision manifest.',
      'private_review_download_is_new_render_not_source_passthrough',
      'private_review_download_preserves_visual_source_order',
      'private_review_download_preserves_uploaded_source_audio',
      'Verified private review should preserve a valid model-role trace from the approved professional skill plan.',
      'Verified private review should preserve Qwen 3.7 as the main edit planning role.',
      'Verified private review should preserve Qwen2.5-VL as visual-understanding only.',
      'revision_private_review_download_matches_recorded_final_render_sha',
      'direct_editor_recovery_downloads_accepted_final_edit_mp4',
      'public_beta_production_and_billing_remain_blocked',
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
      'invalid_deepseek_user_reasoning_trace_rejected',
      'Private manifest verification must preserve Qwen 3.7 as the main edit planning role.',
      'Private manifest verification must preserve Qwen2.5-VL as visual-understanding only.',
      'Private manifest verification must preserve DeepSeek only as tool-code or Remotion draft support when present.',
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
      'Professional skill planning must carry the canonical Qwen main edit agent intent.',
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
      'Owner-lane launch-core tools must be accepted as source truth instead of re-approved by this lane.',
      'Only genuinely ambiguous registry-named tools should remain in the promotion backlog.',
      'Registry-only model/checkpoint lanes must stay explicit.',
      'Registry-only owner scope-decision lanes must stay explicit.',
      'Registry-only evaluation/not-selected lanes must stay explicit.',
      'productReadyToolCount',
      'frontendExecutableToolCount',
    ],
  },
  {
    file: 'server/smoke/edit-architecture-e2e-smoke.ts',
    requirement: 'The architecture smoke must prove compiled intent, execution graph, asset manifest, private final render, delivery QA, and private download readiness.',
    evidence: [
      'compiled_intent_before_approval',
      'execution_graph_bound_to_snapshot',
      'asset_manifest_bound_to_snapshot',
      'professional_skill_trace_bound_to_execution_package',
      'private_uploaded_media_processing_completed',
      'private_final_render_completed',
      'private_delivery_qa_passed',
      'private_internal_download_ready',
      'private_manifest_stream_ready',
    ],
  },
  {
    file: 'tests/e2e/editor.spec.ts',
    requirement: 'The visible editor flow must start from project creation, upload video, support prompt-first planning without requiring Edit Brief, reach private review, and avoid showing generic mock preview art after the private artifact exists.',
    evidence: [
      'creates an edit plan from uploaded source and chat prompt without requiring Edit Brief',
      'No Edit Brief was provided; planning continues from prompt and source context',
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
    requirement: 'The aggregate internal review must include source upload, snapshot, cost, runtime, adapter, private download, full-stack browser, Playwright, and architecture E2E checks.',
    evidence: [
      'source_upload_planning',
      'approved_snapshot',
      'cost_controls',
      'runtime_contracts',
      'professional_tool_architecture_program',
      'bounded_adapter_source_truth',
      'private_internal_upload_e2e',
      'browser_full_stack_private_review',
      'playwright_editor_flow',
      'playwright_expanded_editor_flow',
      'playwright_editor_keyboard_flow',
      'playwright_route_viewport_flow',
      'edit_architecture_e2e',
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
    'visible_private_review_card_coverage_present',
    'aggregate_internal_review_coverage_present',
  ],
  results,
}, null, 2))
