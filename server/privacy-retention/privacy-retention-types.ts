export type ArtifactRetentionClass =
  | 'source_media'
  | 'proxy_media'
  | 'analysis_artifacts'
  | 'transcripts'
  | 'masks'
  | 'generated_assets'
  | 'previews'
  | 'final_exports'
  | 'worker_temp'
  | 'qa_artifacts'

export interface ArtifactRetentionRule {
  retentionClass: ArtifactRetentionClass
  defaultPrivate: true
  retentionDays: number
  deletionEligible: boolean
  userDeletionRequired: 'cascade' | 'preserve_audit_summary' | 'temp_cleanup_only'
  tempCleanupBehavior: string
}

export interface PrivateMediaPolicy {
  publicBucketsAllowed: false
  persistentSignedUrlsAllowed: false
  privateStorageRefsRequired: true
  explicitDeliverySharePolicyRequired: true
}

export interface ExportDeliveryPolicy {
  finalExportsPrivateByDefault: true
  temporarySignedUrlsOnly: true
  persistSignedUrlAsSourceOfTruth: false
  deliveryShareRequiresFutureApproval: true
}

export type AuditEventType =
  | 'approved_snapshot_created'
  | 'worker_job_created'
  | 'worker_job_executed'
  | 'tool_run_recorded'
  | 'artifact_created'
  | 'qa_gate_failed'
  | 'final_export_created'
  | 'signed_url_generated'
  | 'deletion_requested'
  | 'model_weight_approved'
  | 'license_reviewed'
  | 'cost_limit_hit'
  | 'kill_switch_toggled'

export interface ProductionAuditEvent {
  eventType: AuditEventType
  occurredAt: string
  actorType: 'system' | 'worker' | 'user' | 'admin'
  workspaceId?: string
  projectId?: string
  sanitizedSummary: Record<string, unknown>
}
