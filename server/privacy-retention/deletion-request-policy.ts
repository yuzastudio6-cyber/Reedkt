export interface DeletionRequestPolicy {
  requestIntake: string
  artifactCascadeRequired: boolean
  sourceMediaDeletesDerivedArtifacts: boolean
  auditLogPreservation: string
  workerTempCleanupRequired: boolean
}

export const deletionRequestPolicy: DeletionRequestPolicy = {
  requestIntake: 'User deletion requests must create an auditable deletion workflow before artifact deletion begins.',
  artifactCascadeRequired: true,
  sourceMediaDeletesDerivedArtifacts: true,
  auditLogPreservation: 'Preserve sanitized audit summaries without media, prompts, secrets, or signed URLs.',
  workerTempCleanupRequired: true,
}
