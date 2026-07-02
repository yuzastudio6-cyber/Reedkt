export interface TraceCorrelationPolicy {
  requiredCorrelationIds: string[]
  forbiddenTraceFields: string[]
  notes: string[]
}

export const traceCorrelationPolicy: TraceCorrelationPolicy = {
  requiredCorrelationIds: ['workspaceId', 'projectId', 'mediaAssetId', 'approvedSnapshotId', 'toolExecutionPlanId', 'jobId', 'idempotencyKey'],
  forbiddenTraceFields: ['serviceRoleKey', 'providerApiKey', 'signedUrl', 'rawPrompt', 'rawUserChat', 'authorization', 'cookie'],
  notes: ['Trace correlation is metadata-only in M17 and must be sanitized before persistence.'],
}
