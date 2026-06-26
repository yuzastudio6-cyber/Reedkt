# WORKER_RUNTIME_JOBS SOUND CPU Dispatch Contract Evidence Requirements Register

```json worker-runtime-jobs-sound-cpu-dispatch-contract-evidence-requirements-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_dispatch_contract_approval_closure_plan_completed_with_warnings_ready_for_dispatch_contract_approval_closure_owner_review",
  "requiredEvidenceBeforeAnyDispatchApproval": [
    {
      "evidenceId": "schema_owner_review_decision",
      "requiredState": "present",
      "currentStatus": "present_from_pr999",
      "notes": "Schema accepted only for approval-closure planning."
    },
    {
      "evidenceId": "schema_section_registers",
      "requiredState": "six_sections_accepted_for_planning",
      "currentStatus": "present_from_pr995_and_pr999",
      "notes": "Identity, claim/lease, retry/timeout/cancellation, result/observability, payload guardrails, and claim policy sections are represented."
    },
    {
      "evidenceId": "owner_signoff_checklist",
      "requiredState": "planned",
      "currentStatus": "created_in_this_packet",
      "notes": "Checklist is planning-only; no signoff is completed today."
    },
    {
      "evidenceId": "closure_order_register",
      "requiredState": "planned",
      "currentStatus": "created_in_this_packet",
      "notes": "Closure order keeps execution gates last and blocked."
    },
    {
      "evidenceId": "payload_guardrail_owner_evidence",
      "requiredState": "present",
      "currentStatus": "present_from_pr999",
      "notes": "Secrets, service-role keys, signed URLs as source of truth, SQL text, raw prompts, provider blobs, model-weight locations, and artifact write targets remain rejected."
    },
    {
      "evidenceId": "validation_handoff",
      "requiredState": "diagnostics_passed_or_warning_recorded",
      "currentStatus": "planned_for_this_packet",
      "notes": "This packet adds a diagnostics script and preserves unhydrated readiness summary warnings."
    }
  ],
  "evidenceRequirementsCreatedToday": true,
  "evidenceCompleteForExecutionApprovalToday": false,
  "workerDispatchApprovedToday": false,
  "workerExecutionApprovedToday": false
}
```
