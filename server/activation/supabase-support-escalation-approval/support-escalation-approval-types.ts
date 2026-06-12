export type SupabaseSupportEscalationApprovalDecision =
  | 'approved_for_future_manual_supabase_support_ticket'
  | 'approved_for_future_cli_create_ticket'
  | 'blocked_pending_redaction_review'
  | 'blocked_pending_support_owner_approval'
  | 'blocked_pending_human_review'
  | 'rejected_due_sensitive_support_payload_risk'

export type SupabaseSupportEscalationApprovalBlocker =
  | 'pr271_support_packet_missing'
  | 'pr271_recovery_decision_missing'
  | 'support_packet_not_recommended'
  | 'support_packet_redaction_review_failed'
  | 'support_escalation_approval_packet_not_confirmed'
  | 'support_packet_redaction_review_not_confirmed'
  | 'support_owner_approval_missing'
  | 'cli_create_ticket_not_approved_in_this_phase'
  | 'support_ticket_submission_requires_separate_phase'
  | 'forbidden_confirmation_set'

export type SupabaseSupportSubmissionOption =
  | 'manual_supabase_dashboard_support_ticket'
  | 'supabase_cli_create_ticket'
  | 'supabase_cli_github_issue'
  | 'internal_manual_review_only'
