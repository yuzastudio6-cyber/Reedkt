import { z } from 'zod'

const identity = z.string()
  .min(1)
  .max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => value === value.trim() && !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/)

export const requestCanonicalExecutionPackageSchema = z.object({
  workspaceId: identity,
  expectedProjectId: identity,
  expectedEditSessionId: identity,
  expectedSnapshotHash: sha256,
  purpose: z.literal('request_canonical_execution_package'),
}).strict()

export const canonicalExecutionPackageRequestReceiptSchema = z.object({
  schemaVersion: z.literal('canonical-execution-package-request-receipt-v1'),
  source: z.literal('canonical_execution_package_request_coordinator_service'),
  purpose: z.literal('request_canonical_execution_package'),
  disposition: z.literal('package_available'),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
  }).strict(),
  executionPackage: z.object({
    packageRecordId: identity,
    packageHash: sha256,
    approvedPlanSnapshotId: identity,
    snapshotHash: sha256,
    status: z.literal('canonical_authority_packaged_runtime_blocked'),
    createdAt: z.string().datetime({ offset: true }),
  }).strict(),
  boundaries: z.object({
    executionPackageAvailable: z.literal(true),
    approvedSnapshotMutated: z.literal(false),
    creditReservationMutated: z.literal(false),
    workGraphStarted: z.literal(false),
    workerDispatchStarted: z.literal(false),
    jobExecutionStarted: z.literal(false),
    toolExecutionStarted: z.literal(false),
    providerCallStarted: z.literal(false),
    renderStarted: z.literal(false),
    paidBillingExecuted: z.literal(false),
    customerWalletMutation: z.literal(false),
    publicDeliveryStarted: z.literal(false),
  }).strict(),
  persistence: z.object({
    privateLocal: z.literal(true),
    tenantScoped: z.literal(true),
    distributed: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
  rawAuthorityReturned: z.literal(false),
  jobOrToolDetailsReturned: z.literal(false),
  pathOrCredentialReturned: z.literal(false),
  testOnly: z.literal(true),
}).strict()

export type RequestCanonicalExecutionPackageBody = z.infer<
  typeof requestCanonicalExecutionPackageSchema
>
export type CanonicalExecutionPackageRequestReceipt = z.infer<
  typeof canonicalExecutionPackageRequestReceiptSchema
>
