export const EDIT_REFERENCE_PRODUCTION_LIFECYCLE_API_VERSION =
  'edit-reference-production-lifecycle-api-v1' as const

export const EDIT_REFERENCE_PRODUCTION_LIFECYCLE_COMMAND_VERSION =
  'edit-reference-production-lifecycle-command-v1' as const

export const EDIT_REFERENCE_PRODUCTION_LIFECYCLE_RECEIPT_VERSION =
  'edit-reference-production-lifecycle-api-receipt-v1' as const

export const EDIT_REFERENCE_PRODUCTION_LIFECYCLE_SUBCOMMAND_KEY =
  'editReferenceLifecycle' as const

export const EDIT_REFERENCE_PRODUCTION_LIFECYCLE_MUTATIONS = [
  'apply',
  'replace',
  'remove',
] as const

export type EditReferenceProductionLifecycleMutation =
  typeof EDIT_REFERENCE_PRODUCTION_LIFECYCLE_MUTATIONS[number]

/**
 * Browser-safe compare-and-swap subcommand for the exact-edit Apply
 * coordinator. It must not be mounted as a second standalone preference
 * authority. The browser selects an already prepared application and supplies
 * only integrity expectations. Authenticated actor identity, the complete
 * application record, output-frame authority, server time, and the hashed
 * idempotency key are re-derived server-side.
 */
export interface EditReferenceProductionLifecycleCommand {
  readonly schemaVersion: typeof EDIT_REFERENCE_PRODUCTION_LIFECYCLE_COMMAND_VERSION
  readonly mutation: EditReferenceProductionLifecycleMutation
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly applicationId: string
  readonly expectedCurrentApplicationId: string | null
  readonly expectedReferenceRevision: number
  readonly expectedPlanningInputRevision: number
  readonly expectedApplicationContentDigestSha256: string
  readonly expectedApplicationContextHashSha256: string
  readonly expectedTargetUnderstandingPackageDigestSha256: string | null
  readonly expectedOutputFrameAuthorityDigestSha256: string | null
}

/**
 * Sanitized browser receipt. It deliberately excludes the authenticated actor,
 * raw Preference DNA, target-study evidence, output-frame payload, provider
 * payloads, storage identities, customer price, and credit state.
 */
export interface EditReferenceProductionLifecycleApiReceipt {
  readonly schemaVersion: typeof EDIT_REFERENCE_PRODUCTION_LIFECYCLE_RECEIPT_VERSION
  readonly sourceAuthority: 'canonical_application_lifecycle_rpc'
  readonly canonicalReceiptValidatedServerSide: true
  readonly mutation: EditReferenceProductionLifecycleMutation
  readonly transactionId: string
  readonly applicationId: string
  readonly previousApplicationId: string | null
  readonly committedReferenceRevision: number
  readonly committedPlanningInputRevision: number
  readonly applicationStatusAfter: 'connected' | 'cleared'
  readonly preferenceContextStatusAfter: 'connected' | 'invalidated'
  readonly approvalStatusAfter: 'not_approved' | 'reset_after_revision'
  readonly executionAuthorizationDisposition: 'not_active' | 'revoked'
  readonly freshPlanAndEstimateRequired: true
  readonly approvedSnapshotPreserved: true
  readonly historicalPrivatePreviewPreserved: true
  readonly lifecycleReceiptDigestSha256: string
  readonly committedAt: string
  readonly productionReleaseReadinessEvaluatedSeparately: true
  readonly customerPriceCalculated: false
  readonly customerCreditsMutated: false
  readonly serviceFeeIncluded: false
  readonly providerOrWorkerExecutionStarted: false
}

export interface EditReferenceProductionLifecycleApiData {
  readonly contractVersion: typeof EDIT_REFERENCE_PRODUCTION_LIFECYCLE_API_VERSION
  readonly receipt: EditReferenceProductionLifecycleApiReceipt
}
