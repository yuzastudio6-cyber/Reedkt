export function buildStagingFixtureCleanupPolicy(): {
  localTempCleanupRequired: true
  gcsFixtureRetention: 'retain_for_debugging'
  notes: string[]
} {
  return {
    localTempCleanupRequired: true,
    gcsFixtureRetention: 'retain_for_debugging',
    notes: [
      'Local generated fixture files should be removed after execution.',
      'Private GCS fixture artifacts are retained under activation-fixtures/phase25 for debugging evidence.',
      'No buckets, service accounts, or logs are deleted in Phase 25.',
    ],
  }
}
