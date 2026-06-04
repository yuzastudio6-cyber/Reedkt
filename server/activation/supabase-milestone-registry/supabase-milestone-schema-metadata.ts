import { supabaseMilestoneRegistryConfig } from './supabase-milestone-registry-policy'
import type { SupabaseRegistrySchemaMetadata } from './supabase-milestone-registry-types'

export function buildSupabaseMilestoneSchemaMetadata(): SupabaseRegistrySchemaMetadata {
  return {
    schemaVersion: 'phase51b_activation_milestone_registry_v1',
    migrationFile: supabaseMilestoneRegistryConfig.migrationFile,
    rlsEnabledRequired: true,
    publicAccessRevokedRequired: true,
    anonAccessRevokedRequired: true,
    authenticatedAccessRevokedRequired: true,
    serviceRoleOnlyRequired: true,
    destructiveChangesAllowed: false,
    tables: [
      {
        tableName: 'activation_runs',
        purpose: 'Canonical per-phase activation run ledger keyed by phase and run id.',
        naturalKey: ['phase_id', 'run_id'],
        rlsRequired: true,
        serviceRoleOnly: true,
        columns: [
          column('phase_id', 'text', true, 'Phase identifier such as 51B.'),
          column('run_id', 'text', true, 'Stable activation run id.'),
          column('status', 'text', true, 'planned, completed, partial, or blocked.'),
          column('track', 'text', true, 'Owning track or subsystem family.'),
          column('summary_json', 'jsonb', true, 'Sanitized summary, blockers, warnings, and flags.'),
        ],
      },
      {
        tableName: 'activation_artifacts',
        purpose: 'Private artifact references for activation evidence; stores GCS paths and metadata only.',
        naturalKey: ['activation_run_id', 'artifact_type', 'gcs_path'],
        rlsRequired: true,
        serviceRoleOnly: true,
        columns: [
          column('activation_run_id', 'uuid', true, 'Parent activation run.'),
          column('artifact_type', 'text', true, 'Evidence artifact category.'),
          column('gcs_path', 'text', true, 'Private gs:// URI only.'),
          column('source_of_truth', 'boolean', true, 'Whether this private artifact is source-of-truth evidence.'),
          column('metadata_json', 'jsonb', true, 'Sanitized metadata only.'),
        ],
      },
      {
        tableName: 'activation_qa_gates',
        purpose: 'Per-run mandatory QA gate outcomes.',
        naturalKey: ['activation_run_id', 'gate_id'],
        rlsRequired: true,
        serviceRoleOnly: true,
        columns: [
          column('activation_run_id', 'uuid', true, 'Parent activation run.'),
          column('gate_id', 'text', true, 'Stable QA gate id.'),
          column('gate_status', 'text', true, 'passed, blocked, or warning.'),
          column('mandatory', 'boolean', true, 'Whether the gate is mandatory for readiness.'),
          column('evidence_json', 'jsonb', true, 'Sanitized evidence summary.'),
        ],
      },
      {
        tableName: 'readiness_snapshots',
        purpose: 'Current readiness values by subsystem and readiness key.',
        naturalKey: ['subsystem', 'readiness_key'],
        rlsRequired: true,
        serviceRoleOnly: true,
        columns: [
          column('subsystem', 'text', true, 'Subsystem such as supabase or map_geospatial.'),
          column('readiness_key', 'text', true, 'Stable readiness key.'),
          column('readiness_status', 'text', true, 'Current sanitized readiness status.'),
          column('scope', 'text', true, 'Allowed readiness scope.'),
          column('evidence_json', 'jsonb', true, 'Private artifact pointers and sanitized rationale.'),
        ],
      },
      {
        tableName: 'tool_capabilities',
        purpose: 'Tool capability readiness records that keep runtime/production gates explicit.',
        naturalKey: ['track', 'tool_id'],
        rlsRequired: true,
        serviceRoleOnly: true,
        columns: [
          column('track', 'text', true, 'Owning track.'),
          column('tool_id', 'text', true, 'Stable tool id.'),
          column('readiness_state', 'text', true, 'Current readiness classification.'),
          column('runtime_allowed', 'boolean', true, 'Runtime allowed flag.'),
          column('production_allowed', 'boolean', true, 'Must remain false in Phase 51B.'),
        ],
      },
      {
        tableName: 'feature_gates',
        purpose: 'Global feature gate ledger with fail-closed defaults.',
        naturalKey: ['gate_key'],
        rlsRequired: true,
        serviceRoleOnly: true,
        columns: [
          column('gate_key', 'text', true, 'Stable gate key.'),
          column('gate_status', 'text', true, 'disabled, blocked, or readiness_only.'),
          column('enabled', 'boolean', true, 'Must be false for production/beta/public paths in Phase 51B.'),
          column('evidence_json', 'jsonb', true, 'Sanitized gate rationale and source evidence.'),
        ],
      },
    ],
  }
}

function column(name: string, type: string, required: boolean, purpose: string) {
  return { name, type, required, purpose }
}
