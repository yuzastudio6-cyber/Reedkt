import type { BetaReadinessChecklistItem } from './beta-readiness-types'

export const betaReadinessChecklist: BetaReadinessChecklistItem[] = [
  { id: 'architecture_docs_complete', label: 'Architecture docs complete', status: 'passed', requiredForExternalBeta: true, notes: [] },
  { id: 'contracts_schema_complete', label: 'Contracts/schema complete', status: 'passed', requiredForExternalBeta: true, notes: [] },
  { id: 'worker_orchestration_complete', label: 'Worker orchestration complete', status: 'passed', requiredForExternalBeta: true, notes: [] },
  { id: 'readiness_validation_complete', label: 'Readiness validation complete', status: 'warning', requiredForExternalBeta: true, notes: ['Static readiness exists, but production readiness remains blocked.'] },
  { id: 'full_dry_run_e2e_passed', label: 'Full dry-run E2E passed', status: 'passed', requiredForExternalBeta: true, notes: ['M16B dry-run scenarios are the current internal-testing baseline.'] },
  { id: 'cpu_render_install_definitions_complete', label: 'CPU/render install definitions complete', status: 'passed', requiredForExternalBeta: true, notes: [] },
  { id: 'gpu_install_definitions_complete', label: 'GPU install definitions complete', status: 'warning', requiredForExternalBeta: true, notes: ['Definitions exist; production GPU jobs remain disabled.'] },
  { id: 'model_weights_not_approved', label: 'Model weights not approved yet', status: 'blocked', requiredForExternalBeta: true, notes: ['Model weights remain needs_review or missing until human review.'] },
  { id: 'gcp_deployment_not_done', label: 'GCP deployment not done yet', status: 'blocked', requiredForExternalBeta: true, notes: ['No deploy/gcloud action is part of M17.'] },
  { id: 'provider_integration_not_done', label: 'Provider integration not done yet', status: 'blocked', requiredForExternalBeta: false, notes: ['Providers stay blocked unless explicitly approved later.'] },
  { id: 'security_review_pending', label: 'Security review pending/passed', status: 'warning', requiredForExternalBeta: true, notes: ['Static report exists; human review is still required.'] },
  { id: 'cost_controls_pending', label: 'Cost controls pending/passed', status: 'warning', requiredForExternalBeta: true, notes: ['Static cost policy exists; launch budgets need approval.'] },
  { id: 'retention_deletion_policy_pending', label: 'Retention/deletion policy pending/passed', status: 'warning', requiredForExternalBeta: true, notes: ['Policy exists; operations approval is still required.'] },
  { id: 'observability_plan_pending', label: 'Observability plan pending/passed', status: 'warning', requiredForExternalBeta: true, notes: ['Metric and alert templates exist; no alerts are deployed.'] },
  { id: 'incident_runbook_pending', label: 'Incident runbook pending/passed', status: 'warning', requiredForExternalBeta: true, notes: ['Runbook exists as a draft policy artifact.'] },
]
