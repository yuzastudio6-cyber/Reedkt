export const toolExecutionSecurityPolicy = {
  approvedSnapshotRequired: true,
  toolExecutionPlanRequired: true,
  idempotencyRequired: true,
  rawPromptExecutionBlocked: true,
  frontendHeavyToolExecutionBlocked: true,
  providerCallsBlockedByDefault: true,
  revideoProductionBlocked: true,
  arbitraryArgsBlocked: true,
} as const
