import { z } from 'zod'
import { betaReadinessChecklist } from '../beta-readiness'
import { PRODUCTION_TOOL_IDS } from '../tool-registry'
import { idSchema } from './common-schemas'

const knownToolIds = new Set<string>(PRODUCTION_TOOL_IDS)
const knownChecklistItemIds = new Set<string>(betaReadinessChecklist.map((item) => item.id))
const sourceShaSchema = z.string().regex(/^[0-9a-f]{7,40}$/i).optional()
const noteSchema = z.string().trim().min(1).max(1_000)
const sourceIdSchema = z.string().trim().min(1).max(200)

const checklistEvidenceSchema = z.object({
  itemId: z.string().min(1).refine((value) => knownChecklistItemIds.has(value), 'Unknown beta checklist item.'),
  sourceId: sourceIdSchema,
  sourceSha: sourceShaSchema,
  status: z.enum(['passed', 'warning']),
  notes: z.array(noteSchema).min(1).max(20),
}).strict()

const acceptedToolEvidenceSchema = z.object({
  toolId: z.string().min(1).refine((value) => knownToolIds.has(value), 'Unknown production tool ID.'),
  sourceId: sourceIdSchema,
  sourceSha: sourceShaSchema,
  readinessStatus: z.enum(['passed', 'warning']),
  realExecutionVerified: z.boolean(),
  productionReadinessAccepted: z.boolean(),
  productReadyLocalOss: z.boolean(),
  modelWeightsApproved: z.boolean().optional(),
  notes: z.array(noteSchema).min(1).max(20),
}).strict()

const platformEvidenceSchema = z.object({
  sourceId: sourceIdSchema,
  sourceSha: sourceShaSchema,
  environment: z.enum(['staging', 'production']),
  toolCostEventsMigrationDeployed: z.boolean(),
  serviceRoleWritePathVerified: z.boolean(),
  rlsMemberReadPathVerified: z.boolean(),
  idempotentReplayVerified: z.boolean(),
  walletSettlementVerified: z.boolean(),
  stripeBoundaryVerified: z.boolean(),
  monitoringVerified: z.boolean(),
  billingQaVerified: z.boolean(),
  deploymentApproved: z.boolean(),
  securityApproved: z.boolean(),
  storageApproved: z.boolean(),
  legalApproved: z.boolean(),
  supportApproved: z.boolean(),
  notes: z.array(noteSchema).min(1).max(20),
}).strict()

const approvalsSchema = z.object({
  deploymentApproved: z.boolean().optional(),
  securityApproved: z.boolean().optional(),
  storageApproved: z.boolean().optional(),
  modelLicensesApproved: z.boolean().optional(),
  legalApproved: z.boolean().optional(),
  monitoringApproved: z.boolean().optional(),
  supportApproved: z.boolean().optional(),
  realUserMediaBetaApproved: z.boolean().optional(),
  paidProductionApproved: z.boolean().optional(),
}).strict()

const baselineSchema = z.object({
  e2eDryRunPassed: z.boolean().optional(),
  safetyDocsExist: z.boolean().optional(),
  costDocsExist: z.boolean().optional(),
}).strict()

export const betaReadinessEvidenceEvaluationSchema = z.object({
  baseline: baselineSchema.optional(),
  checklistEvidence: z.array(checklistEvidenceSchema).max(betaReadinessChecklist.length).optional(),
  acceptedToolEvidence: z.array(acceptedToolEvidenceSchema).max(PRODUCTION_TOOL_IDS.length).optional(),
  platformEvidence: platformEvidenceSchema.optional(),
  approvals: approvalsSchema.optional(),
}).strict()

export const betaReadinessEvidencePacketSchema = betaReadinessEvidenceEvaluationSchema.extend({
  workspaceId: idSchema,
  projectId: idSchema.optional(),
}).strict()

export const betaReadinessCoreRealCheckEvidenceSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema.optional(),
  sourceId: sourceIdSchema,
  sourceSha: sourceShaSchema,
  notes: z.array(noteSchema).min(1).max(20),
  acceptProductionReadiness: z.boolean().optional(),
  acceptProductReadyLocalOss: z.boolean().optional(),
  includeWarnings: z.boolean().optional(),
  toolIds: z.array(z.enum(PRODUCTION_TOOL_IDS)).min(1).max(PRODUCTION_TOOL_IDS.length).optional(),
}).strict()

export const betaReadinessPlatformBillingQaSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  sourceId: sourceIdSchema,
  sourceSha: sourceShaSchema,
  environment: z.enum(['local_mock', 'staging_persistent', 'production_persistent']).optional(),
  allowPersistentStoreQa: z.boolean().optional(),
  notes: z.array(noteSchema).min(1).max(20).optional(),
}).strict()

const deployedPlatformProbeIdSchema = z.enum([
  'tool_cost_events_migration_deployed',
  'beta_readiness_evidence_migration_deployed',
  'service_role_write_path_verified',
  'authenticated_rls_member_readback_verified',
  'idempotent_replay_verified',
  'wallet_settlement_verified',
  'stripe_boundary_owner_verified',
  'monitoring_deployment_verified',
  'staging_billing_qa_verified',
])

const deployedPlatformProbeObservationSchema = z.object({
  id: deployedPlatformProbeIdSchema,
  status: z.enum(['passed', 'failed', 'not_run']),
  evidence: z.array(noteSchema).max(20),
  nextAction: noteSchema,
}).strict()

const deployedPlatformOwnerApprovalsSchema = z.object({
  billingOwnerStripeBoundaryApproved: z.boolean(),
  deploymentApproved: z.boolean(),
  securityApproved: z.boolean(),
  storageApproved: z.boolean(),
  legalApproved: z.boolean(),
  monitoringApproved: z.boolean(),
  supportApproved: z.boolean(),
}).strict()

export const betaReadinessPlatformDeployedEvidenceSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema.optional(),
  sourceId: sourceIdSchema,
  sourceSha: sourceShaSchema,
  environment: z.enum(['staging', 'production']),
  ownerApprovals: deployedPlatformOwnerApprovalsSchema,
  notes: z.array(noteSchema).min(1).max(20),
  probes: z.array(deployedPlatformProbeObservationSchema).min(1).max(9),
  recordEvidence: z.boolean().optional(),
  confirmRecordEvidence: z.boolean().optional(),
}).strict()

export type BetaReadinessEvidenceEvaluationBody = z.infer<typeof betaReadinessEvidenceEvaluationSchema>
export type BetaReadinessEvidencePacketBody = z.infer<typeof betaReadinessEvidencePacketSchema>
export type BetaReadinessCoreRealCheckEvidenceBody = z.infer<typeof betaReadinessCoreRealCheckEvidenceSchema>
export type BetaReadinessPlatformBillingQaBody = z.infer<typeof betaReadinessPlatformBillingQaSchema>
export type BetaReadinessPlatformDeployedEvidenceBody = z.infer<typeof betaReadinessPlatformDeployedEvidenceSchema>
