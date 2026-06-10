export type SupabaseSupportTicketSubmissionDecision =
  | 'support_ticket_submitted'
  | 'support_ticket_ready_for_manual_operator_submission'
  | 'blocked_pending_support_portal_access'
  | 'blocked_pending_redaction_review'
  | 'blocked_pending_support_owner_approval'
  | 'rejected_due_sensitive_support_payload_risk'

export type SupabaseSupportTicketSubmissionBlocker =
  | 'pr274_approval_decision_missing'
  | 'pr274_not_approved_for_manual_support_submission'
  | 'pr274_redacted_packet_missing'
  | 'support_ticket_redaction_failed'
  | 'manual_support_ticket_submission_not_confirmed'
  | 'support_packet_redaction_review_not_confirmed'
  | 'support_portal_access_unavailable'
  | 'support_ticket_submission_requires_operator_portal_action'
  | 'forbidden_confirmation_set'

export type SupabaseSupportTicketSubmissionMode =
  | 'operator_manual'
  | 'portal_manual_if_available'
  | 'not_available'
