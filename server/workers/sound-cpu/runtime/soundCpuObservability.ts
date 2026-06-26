export type SoundCpuAuditEvent = Readonly<{
  eventName: 'sound_cpu_runtime_source_created_execution_blocked'
  jobId: string
  idempotencyKey: string
  ownerGateRequired: 'WORKER_RUNTIME_JOBS'
  noWorkerExecution: true
  noMediaProcessing: true
  noSupabaseMutation: true
  noArtifactCreated: true
}>

export function createSoundCpuBlockedAuditEvent(input: {
  jobId: string
  idempotencyKey: string
}): SoundCpuAuditEvent {
  return {
    eventName: 'sound_cpu_runtime_source_created_execution_blocked',
    jobId: input.jobId,
    idempotencyKey: input.idempotencyKey,
    ownerGateRequired: 'WORKER_RUNTIME_JOBS',
    noWorkerExecution: true,
    noMediaProcessing: true,
    noSupabaseMutation: true,
    noArtifactCreated: true,
  }
}

export function sanitizeSoundCpuAuditText(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+/g, 'Bearer [redacted]')
    .replace(/postgres(?:ql)?:\/\/\S+/gi, '[redacted-db-url]')
    .replace(/https?:\/\/[^\s]+\.supabase\.co\S*/gi, '[redacted-supabase-url]')
    .replace(/X-(?:Amz|Goog)-(?:Algorithm|Credential|Signature|Expires)=[^\s]+/gi, '[redacted-signed-url]')
}
