import { z } from 'zod'

import {
  GCP_PRODUCTION_API_SERVICE,
  GCP_PRODUCTION_CLOUD_RUN_JOBS,
  getGcpProductionServiceAccountEmail,
} from '../config/gcp-production-config'
import {
  createCanonicalPrivateProvenToolPlacementCatalog,
  type CanonicalPrivateExecutableWorkerType,
} from './canonical-private-resource-placement-authority'
import {
  canonicalPrivatePackageWorkQueueDefinitionSchema,
  type CanonicalPrivatePackageWorkQueueDefinition,
  type CanonicalPrivatePackageWorkQueueJobDefinition,
} from './canonical-private-package-work-queue-authority'
import type { CanonicalApprovedEditExecutionPackage } from
  './canonical-approved-edit-execution-package'
import {
  REEDITPRO_GCP_PRODUCTION_RESOURCE_MAP,
  getReeditProCloudTasksQueuesForRegion,
  type ReeditProRuntimeRegion,
} from '../../src/backend/cloud/reeditpro-gcp-production-resource-map'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

export const CANONICAL_CLOUD_RUNTIME_REGION_AUTHORITY_VERSION =
  'canonical-cloud-runtime-region-authority-v1' as const
export const CANONICAL_PROVEN_TOOL_CLOUD_DISPATCH_CATALOG_VERSION =
  'canonical-proven-tool-cloud-dispatch-catalog-v1' as const
export const CANONICAL_CLOUD_WORKER_DISPATCH_HANDOFF_MANIFEST_VERSION =
  'canonical-cloud-worker-dispatch-handoff-manifest-v1' as const
export const CANONICAL_CLOUD_WORKER_DISPATCH_ATTEMPT_PLAN_VERSION =
  'canonical-cloud-worker-dispatch-attempt-plan-v1' as const

export const CANONICAL_CLOUD_TASK_BODY_LIMIT_BYTES = 8 * 1_024
export const CLOUD_TASKS_SYSTEM_MAX_TASK_BYTES = 1_024 * 1_024
export const CANONICAL_CLOUD_TASK_DISPATCH_DEADLINE_SECONDS = 60
export const CANONICAL_CLOUD_RUN_INTERNAL_MAX_RETRIES = 0
export const CLOUD_RUN_GPU_TASK_TIMEOUT_MAX_SECONDS = 60 * 60
export const CLOUD_RUN_CPU_TASK_TIMEOUT_MAX_SECONDS = 7 * 24 * 60 * 60

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const region = z.enum(['us-east1', 'europe-west1'])
const workerType = z.enum([
  'api_service',
  'cpu_analysis_worker',
  'gpu_ai_worker',
  'render_worker',
  'qa_worker',
  'tool_readiness_worker',
])
const taskQueueKind = z.enum(['none', 'worker_dispatch', 'render_dispatch'])
const handoffMode = z.enum([
  'private_api_service_control_plane',
  'cloud_tasks_oidc_to_private_controller_then_cloud_run_jobs_run',
])

export const canonicalCloudRuntimeRegionAuthoritySchema = z.object({
  schemaVersion: z.literal(CANONICAL_CLOUD_RUNTIME_REGION_AUTHORITY_VERSION),
  source: z.literal('server_owned_project_runtime_region_authority'),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    packageRecordId: identity,
    approvedPlanSnapshotId: identity,
    queueDefinitionHash: sha256,
  }).strict(),
  regionPolicyId: z.literal('project_selected_data_local_region_v1'),
  runtimeRegion: region,
  sourceObjectRegions: z.array(region).min(1).max(256),
  allRequiredObjectsRegionBound: z.boolean(),
  crossRegionMediaTransferAllowed: z.literal(false),
  browserSelectedRegion: z.literal(false),
  liveProjectRegionPersistenceVerified: z.boolean(),
  liveGcsObjectResidencyVerified: z.boolean(),
  authorityHash: sha256,
}).strict().superRefine((authority, context) => {
  if (
    authority.allRequiredObjectsRegionBound &&
    authority.sourceObjectRegions.some((value) => value !== authority.runtimeRegion)
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Region authority cannot claim region-bound inputs across another region.',
    })
  }
})

const cloudTargetSchema = z.object({
  workerType,
  handoffMode,
  cloudTasksQueueKind: taskQueueKind,
  cloudRunTargetKind: z.enum(['service', 'job']),
  cloudRunTargetName: identity,
  workerServiceAccountKey: identity,
  workerServiceAccountEmail: z.string().email(),
  cpu: z.number().int().positive().max(128),
  memory: identity,
  accelerator: z.enum(['none', 'nvidia_l4']),
  parallelism: z.literal(1),
  cloudRunInternalMaxRetries: z.literal(CANONICAL_CLOUD_RUN_INTERNAL_MAX_RETRIES),
  targetResourceExistenceVerified: z.literal(false),
  targetIamVerified: z.literal(false),
  targetHash: sha256,
}).strict().superRefine((target, context) => {
  if (
    (target.workerType === 'api_service') !== (target.cloudRunTargetKind === 'service') ||
    (target.workerType === 'api_service') !== (target.cloudTasksQueueKind === 'none') ||
    (target.workerType === 'api_service') !==
      (target.handoffMode === 'private_api_service_control_plane') ||
    (target.workerType === 'gpu_ai_worker') !== (target.accelerator === 'nvidia_l4')
  ) {
    context.addIssue({ code: 'custom', message: 'Cloud worker target policy is inconsistent.' })
  }
})

const provenToolCloudDispatchEntrySchema = z.object({
  canonicalToolId: identity,
  operationId: identity,
  runnerClass: identity,
  toolIdentityHash: sha256,
  toolProofHash: sha256,
  privatePlacementHash: sha256,
  workerType,
  resourceClassId: identity,
  target: cloudTargetSchema,
  dispatchContractReady: z.literal(true),
  cloudDispatchAuthorized: z.literal(false),
  productionExecutionAuthorized: z.literal(false),
  entryHash: sha256,
}).strict()

export const canonicalProvenToolCloudDispatchCatalogSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PROVEN_TOOL_CLOUD_DISPATCH_CATALOG_VERSION),
  source: z.literal('canonical_proven_tool_placement_and_gcp_target_templates'),
  projectId: z.literal('reeditpro'),
  tools: z.array(provenToolCloudDispatchEntrySchema).length(50),
  summary: z.object({
    totalToolCount: z.literal(50),
    cpuAnalysisToolCount: z.literal(28),
    gpuToolCount: z.literal(3),
    renderToolCount: z.literal(19),
    allToolsHaveExactTargetContract: z.literal(true),
    allCloudRunInternalRetriesDisabled: z.literal(true),
    liveResourceExistenceVerified: z.literal(false),
    liveIamVerified: z.literal(false),
    cloudDispatchAuthorized: z.literal(false),
  }).strict(),
  catalogHash: sha256,
}).strict().superRefine((catalog, context) => {
  if (
    new Set(catalog.tools.map((tool) => tool.canonicalToolId)).size !== 50 ||
    catalog.tools.filter((tool) => tool.workerType === 'cpu_analysis_worker').length !== 28 ||
    catalog.tools.filter((tool) => tool.workerType === 'gpu_ai_worker').length !== 3 ||
    catalog.tools.filter((tool) => tool.workerType === 'render_worker').length !== 19
  ) {
    context.addIssue({ code: 'custom', message: 'Proven-tool cloud target coverage is inconsistent.' })
  }
})

const dispatchManifestEntrySchema = z.object({
  canonicalOrder: z.number().int().nonnegative().max(255),
  jobId: identity,
  approvedWorkItemId: identity,
  workItemKey: identity,
  required: z.boolean(),
  dependencyJobIds: z.array(identity).max(128),
  scheduledFor: z.string().datetime({ offset: true }),
  maxAttempts: z.number().int().positive().max(10),
  approvedToolId: identity.nullable(),
  approvedToolOperationIds: z.array(identity).max(1),
  queueJobDefinitionHash: sha256,
  placementHash: sha256,
  workerType,
  resourceClassId: identity,
  runtimeRegion: region,
  target: cloudTargetSchema,
  queueResourceName: z.string().min(1).max(512).nullable(),
  privateDispatchControllerServiceName: identity,
  privateDispatchControllerPath: z.literal('/internal/v1/canonical-cloud-dispatch'),
  taskOidcServiceAccountEmail: z.string().email().nullable(),
  taskOidcAudienceState: z.enum([
    'not_applicable',
    'deployed_private_controller_url_required',
  ]),
  cloudRunTaskTimeoutSeconds: z.number().int().positive().max(604_800),
  cloudRunTaskTimeoutLimitSeconds: z.number().int().positive().max(604_800),
  packageQueueOwnsApprovedAttempts: z.literal(true),
  cloudTasksDeliveryRetryDoesNotAuthorizeAnotherExecutionAttempt: z.literal(true),
  workerLoadsAuthorityByOpaqueDispatchIntent: z.literal(true),
  taskBodyCarriesRawMediaOrSecrets: z.literal(false),
  blockers: z.array(identity).min(1).max(32),
  cloudDispatchAuthorized: z.literal(false),
  productionExecutionAuthorized: z.literal(false),
  entryHash: sha256,
}).strict().superRefine((entry, context) => {
  const asyncHandoff = entry.target.handoffMode ===
    'cloud_tasks_oidc_to_private_controller_then_cloud_run_jobs_run'
  if (
    asyncHandoff !== (entry.queueResourceName !== null) ||
    asyncHandoff !== (entry.taskOidcServiceAccountEmail !== null) ||
    asyncHandoff !==
      (entry.taskOidcAudienceState === 'deployed_private_controller_url_required') ||
    entry.target.workerType !== entry.workerType ||
    entry.cloudRunTaskTimeoutSeconds > entry.cloudRunTaskTimeoutLimitSeconds
  ) {
    context.addIssue({ code: 'custom', message: 'Cloud dispatch manifest entry is inconsistent.' })
  }
})

export const canonicalCloudWorkerDispatchHandoffManifestSchema = z.object({
  schemaVersion: z.literal(CANONICAL_CLOUD_WORKER_DISPATCH_HANDOFF_MANIFEST_VERSION),
  source: z.literal('approved_package_queue_region_and_cloud_target_authority'),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    packageRecordId: identity,
    approvedPlanSnapshotId: identity,
    packageHash: sha256,
    snapshotHash: sha256,
    workGraphHash: sha256,
    queueDefinitionHash: sha256,
    regionAuthorityHash: sha256,
    toolTargetCatalogHash: sha256,
  }).strict(),
  runtimeRegion: region,
  entries: z.array(dispatchManifestEntrySchema).min(1).max(256),
  summary: z.object({
    totalJobCount: z.number().int().positive().max(256),
    controlPlaneJobCount: z.number().int().nonnegative().max(256),
    cloudTaskHandoffJobCount: z.number().int().nonnegative().max(256),
    cpuAnalysisJobCount: z.number().int().nonnegative().max(256),
    gpuJobCount: z.number().int().nonnegative().max(256),
    renderJobCount: z.number().int().nonnegative().max(256),
    allJobsHaveExactCloudTargetContract: z.literal(true),
    cloudRunHiddenRetryCount: z.literal(0),
    allTaskBodiesOpaque: z.literal(true),
  }).strict(),
  boundaries: z.object({
    browserDispatchAllowed: z.literal(false),
    rawChatPromptMediaBytesOrSignedUrlsAllowed: z.literal(false),
    providerActivationAuthorized: z.literal(false),
    customerBillingAuthorized: z.literal(false),
    walletMutationAuthorized: z.literal(false),
    remoteSupabaseAuthorized: z.literal(false),
    distributedOutboxTransactionVerified: z.literal(false),
    cloudTasksOidcAndIamVerified: z.literal(false),
    cloudRunJobDeploymentVerified: z.literal(false),
    workerServiceIdentityVerified: z.literal(false),
    privateGcsObjectTransportVerified: z.literal(false),
    cloudDispatchAuthorized: z.literal(false),
    productionExecutionAuthorized: z.literal(false),
  }).strict(),
  manifestHash: sha256,
}).strict().superRefine((manifest, context) => {
  const summary = manifest.summary
  if (
    manifest.entries.length !== summary.totalJobCount ||
    manifest.entries.filter((entry) => entry.workerType === 'api_service').length !==
      summary.controlPlaneJobCount ||
    manifest.entries.filter((entry) => entry.target.cloudTasksQueueKind !== 'none').length !==
      summary.cloudTaskHandoffJobCount ||
    manifest.entries.filter((entry) => entry.workerType === 'cpu_analysis_worker').length !==
      summary.cpuAnalysisJobCount ||
    manifest.entries.filter((entry) => entry.workerType === 'gpu_ai_worker').length !==
      summary.gpuJobCount ||
    manifest.entries.filter((entry) => entry.workerType === 'render_worker').length !==
      summary.renderJobCount ||
    manifest.entries.some((entry, index) => entry.canonicalOrder !== index)
  ) {
    context.addIssue({ code: 'custom', message: 'Cloud dispatch manifest summary is inconsistent.' })
  }
})

const cloudTaskAttemptSchema = z.object({
  queueResourceName: z.string().min(1).max(512),
  taskId: z.string().regex(/^rp-[a-f0-9]{40}$/u),
  taskResourceName: z.string().min(1).max(768),
  scheduleTime: z.string().datetime({ offset: true }),
  dispatchDeadlineSeconds: z.literal(CANONICAL_CLOUD_TASK_DISPATCH_DEADLINE_SECONDS),
  httpMethod: z.literal('POST'),
  targetServiceName: identity,
  targetPath: z.literal('/internal/v1/canonical-cloud-dispatch'),
  oidcServiceAccountEmail: z.string().email(),
  oidcAudienceState: z.literal('deployed_private_controller_url_required'),
  bodyBase64EncodingRequiredByApi: z.literal(true),
  bodyUtf8ByteLength: z.number().int().positive().max(CANONICAL_CLOUD_TASK_BODY_LIMIT_BYTES),
  taskBody: z.object({
    schemaVersion: z.literal(CANONICAL_CLOUD_WORKER_DISPATCH_ATTEMPT_PLAN_VERSION),
    purpose: z.literal('canonical_cloud_worker_dispatch_attempt'),
    dispatchIntentId: identity,
    handoffManifestHash: sha256,
    manifestEntryHash: sha256,
    queueDefinitionHash: sha256,
    regionAuthorityHash: sha256,
    jobId: identity,
    deliveryAttempt: z.number().int().positive().max(10),
    dispatchBindingHash: sha256,
  }).strict(),
  bodySha256: sha256,
  deterministicTaskNameIsOnlyShortWindowDeduplication: z.literal(true),
}).strict()

const cloudRunJobAttemptSchema = z.object({
  apiMethod: z.literal('run.googleapis.com/v2.projects.locations.jobs.run'),
  jobResourceName: z.string().min(1).max(512),
  startExecutionToken: z.string().regex(/^rp[a-f0-9]{20}$/u),
  taskCount: z.literal(1),
  parallelism: z.literal(1),
  taskTimeoutSeconds: z.number().int().positive().max(604_800),
  taskMaxRetries: z.literal(0),
  serviceAccountEmail: z.string().email(),
  environmentOverrides: z.object({
    REEDITPRO_DISPATCH_INTENT_ID: identity,
    REEDITPRO_DISPATCH_BINDING_HASH: sha256,
  }).strict(),
  usesApplicationDefaultCredentials: z.literal(true),
  embeddedCredentialOrSignedUrl: z.literal(false),
}).strict()

export const canonicalCloudWorkerDispatchAttemptPlanSchema = z.object({
  schemaVersion: z.literal(CANONICAL_CLOUD_WORKER_DISPATCH_ATTEMPT_PLAN_VERSION),
  source: z.literal('canonical_cloud_worker_dispatch_handoff_manifest'),
  dispatchIntentId: identity,
  handoffManifestHash: sha256,
  manifestEntryHash: sha256,
  queueDefinitionHash: sha256,
  regionAuthorityHash: sha256,
  jobId: identity,
  deliveryAttempt: z.number().int().positive().max(10),
  runtimeRegion: region,
  dispatchBindingHash: sha256,
  cloudTask: cloudTaskAttemptSchema.nullable(),
  cloudRunJob: cloudRunJobAttemptSchema.nullable(),
  blockers: z.array(identity).min(1).max(32),
  boundaries: z.object({
    requestShapeOnly: z.literal(true),
    networkCallPerformed: z.literal(false),
    credentialResolved: z.literal(false),
    cloudTaskCreated: z.literal(false),
    cloudRunJobExecuted: z.literal(false),
    cloudDispatchAuthorized: z.literal(false),
    productionExecutionAuthorized: z.literal(false),
  }).strict(),
  attemptPlanHash: sha256,
}).strict().superRefine((plan, context) => {
  if ((plan.cloudTask === null) !== (plan.cloudRunJob === null)) {
    context.addIssue({ code: 'custom', message: 'Cloud task and run-job request must be paired.' })
  }
})

export type CanonicalCloudRuntimeRegionAuthority = z.infer<
  typeof canonicalCloudRuntimeRegionAuthoritySchema
>
export type CanonicalProvenToolCloudDispatchCatalog = z.infer<
  typeof canonicalProvenToolCloudDispatchCatalogSchema
>
export type CanonicalCloudWorkerDispatchHandoffManifest = z.infer<
  typeof canonicalCloudWorkerDispatchHandoffManifestSchema
>
export type CanonicalCloudWorkerDispatchAttemptPlan = z.infer<
  typeof canonicalCloudWorkerDispatchAttemptPlanSchema
>

export function createCanonicalCloudRuntimeRegionAuthority(input: {
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  runtimeRegion: ReeditProRuntimeRegion
  sourceObjectRegions: ReeditProRuntimeRegion[]
  allRequiredObjectsRegionBound: boolean
  liveProjectRegionPersistenceVerified: boolean
  liveGcsObjectResidencyVerified: boolean
}): CanonicalCloudRuntimeRegionAuthority {
  assertQueueDefinitionIntegrity(input.queueDefinition)
  const payload = {
    schemaVersion: CANONICAL_CLOUD_RUNTIME_REGION_AUTHORITY_VERSION,
    source: 'server_owned_project_runtime_region_authority' as const,
    identity: {
      workspaceId: input.queueDefinition.identity.workspaceId,
      projectId: input.queueDefinition.identity.projectId,
      editSessionId: input.queueDefinition.identity.editSessionId,
      packageRecordId: input.queueDefinition.identity.packageRecordId,
      approvedPlanSnapshotId: input.queueDefinition.identity.approvedPlanSnapshotId,
      queueDefinitionHash: input.queueDefinition.definitionHash,
    },
    regionPolicyId: 'project_selected_data_local_region_v1' as const,
    runtimeRegion: input.runtimeRegion,
    sourceObjectRegions: [...input.sourceObjectRegions],
    allRequiredObjectsRegionBound: input.allRequiredObjectsRegionBound,
    crossRegionMediaTransferAllowed: false as const,
    browserSelectedRegion: false as const,
    liveProjectRegionPersistenceVerified: input.liveProjectRegionPersistenceVerified,
    liveGcsObjectResidencyVerified: input.liveGcsObjectResidencyVerified,
  }
  return canonicalCloudRuntimeRegionAuthoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalCloudRuntimeRegionAuthority(input: {
  value: unknown
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
}): CanonicalCloudRuntimeRegionAuthority {
  const parsed = canonicalCloudRuntimeRegionAuthoritySchema.parse(input.value)
  const { authorityHash, ...payload } = parsed
  if (
    authorityHash !== sha256AuthorityValue(payload) ||
    parsed.identity.workspaceId !== input.queueDefinition.identity.workspaceId ||
    parsed.identity.projectId !== input.queueDefinition.identity.projectId ||
    parsed.identity.editSessionId !== input.queueDefinition.identity.editSessionId ||
    parsed.identity.packageRecordId !== input.queueDefinition.identity.packageRecordId ||
    parsed.identity.approvedPlanSnapshotId !==
      input.queueDefinition.identity.approvedPlanSnapshotId ||
    parsed.identity.queueDefinitionHash !== input.queueDefinition.definitionHash
  ) {
    throw new Error('Cloud runtime region authority does not match the exact package queue.')
  }
  return parsed
}

export function createCanonicalProvenToolCloudDispatchCatalog():
CanonicalProvenToolCloudDispatchCatalog {
  const privateCatalog = createCanonicalPrivateProvenToolPlacementCatalog()
  const tools = privateCatalog.tools.map((tool) => {
    const target = cloudTargetForWorkerType(tool.workerType)
    const payload = {
      canonicalToolId: tool.canonicalToolId,
      operationId: tool.operationId,
      runnerClass: tool.runnerClass,
      toolIdentityHash: tool.toolIdentityHash,
      toolProofHash: tool.toolProofHash,
      privatePlacementHash: tool.placementHash,
      workerType: tool.workerType,
      resourceClassId: tool.resourceClassId,
      target,
      dispatchContractReady: true as const,
      cloudDispatchAuthorized: false as const,
      productionExecutionAuthorized: false as const,
    }
    return provenToolCloudDispatchEntrySchema.parse({
      ...payload,
      entryHash: sha256AuthorityValue(payload),
    })
  })
  const payload = {
    schemaVersion: CANONICAL_PROVEN_TOOL_CLOUD_DISPATCH_CATALOG_VERSION,
    source: 'canonical_proven_tool_placement_and_gcp_target_templates' as const,
    projectId: 'reeditpro' as const,
    tools,
    summary: {
      totalToolCount: 50 as const,
      cpuAnalysisToolCount: 28 as const,
      gpuToolCount: 3 as const,
      renderToolCount: 19 as const,
      allToolsHaveExactTargetContract: true as const,
      allCloudRunInternalRetriesDisabled: true as const,
      liveResourceExistenceVerified: false as const,
      liveIamVerified: false as const,
      cloudDispatchAuthorized: false as const,
    },
  }
  return canonicalProvenToolCloudDispatchCatalogSchema.parse({
    ...payload,
    catalogHash: sha256AuthorityValue(payload),
  })
}

export function createCanonicalCloudWorkerDispatchHandoffManifest(input: {
  executionPackage: CanonicalApprovedEditExecutionPackage
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition
  regionAuthority: CanonicalCloudRuntimeRegionAuthority
}): CanonicalCloudWorkerDispatchHandoffManifest {
  const { executionPackage, queueDefinition } = input
  assertQueueDefinitionIntegrity(queueDefinition)
  const regionAuthority = assertCanonicalCloudRuntimeRegionAuthority({
    value: input.regionAuthority,
    queueDefinition,
  })
  assertPackageQueueBinding(executionPackage, queueDefinition)
  const toolCatalog = createCanonicalProvenToolCloudDispatchCatalog()
  const toolTargets = new Map(toolCatalog.tools.map((tool) => [tool.canonicalToolId, tool]))
  const workItems = new Map(executionPackage.approvedWorkItems.map((workItem) =>
    [workItem.id, workItem]))
  const packageJobs = new Map(executionPackage.jobs.map((job) => [job.id, job]))
  const entries = queueDefinition.jobs.map((job) => {
    const packageJob = packageJobs.get(job.jobId)
    const workItem = workItems.get(job.approvedWorkItemId)
    if (!packageJob || !workItem) {
      throw new Error('Cloud dispatch manifest cannot resolve the exact package job and work item.')
    }
    if (workItem.approvedToolIds.length > 1 || workItem.approvedToolOperationIds.length > 1) {
      throw new Error('Cloud dispatch requires one atomic tool operation per package job.')
    }
    const approvedToolId = workItem.approvedToolIds[0] ?? null
    const target = cloudTargetForWorkerType(job.workerType)
    if (approvedToolId) {
      const toolTarget = toolTargets.get(approvedToolId)
      if (
        !toolTarget || toolTarget.workerType !== job.workerType ||
        toolTarget.resourceClassId !== job.resourceClassId ||
        toolTarget.target.targetHash !== target.targetHash
      ) {
        throw new Error('Cloud dispatch target does not match proven tool placement authority.')
      }
    }
    const asyncHandoff = target.handoffMode ===
      'cloud_tasks_oidc_to_private_controller_then_cloud_run_jobs_run'
    if (asyncHandoff && target.cloudTasksQueueKind === 'none') {
      throw new Error('Asynchronous cloud dispatch target is missing its queue kind.')
    }
    const queueResourceName = asyncHandoff
      ? cloudTasksQueueResourceName(
          target.cloudTasksQueueKind as 'worker_dispatch' | 'render_dispatch',
          regionAuthority.runtimeRegion,
        )
      : null
    const timeoutLimit = job.workerType === 'gpu_ai_worker'
      ? CLOUD_RUN_GPU_TASK_TIMEOUT_MAX_SECONDS
      : CLOUD_RUN_CPU_TASK_TIMEOUT_MAX_SECONDS
    const blockers = dispatchBlockers({
      job,
      regionAuthority,
      timeoutLimit,
    })
    const payload = {
      canonicalOrder: job.canonicalOrder,
      jobId: job.jobId,
      approvedWorkItemId: job.approvedWorkItemId,
      workItemKey: job.workItemKey,
      required: job.required,
      dependencyJobIds: [...job.dependencyJobIds],
      scheduledFor: job.scheduledFor,
      maxAttempts: job.maxAttempts,
      approvedToolId,
      approvedToolOperationIds: [...workItem.approvedToolOperationIds],
      queueJobDefinitionHash: job.definitionHash,
      placementHash: job.placementHash,
      workerType: job.workerType,
      resourceClassId: job.resourceClassId,
      runtimeRegion: regionAuthority.runtimeRegion,
      target,
      queueResourceName,
      privateDispatchControllerServiceName: GCP_PRODUCTION_API_SERVICE.name,
      privateDispatchControllerPath: '/internal/v1/canonical-cloud-dispatch' as const,
      taskOidcServiceAccountEmail: asyncHandoff
        ? REEDITPRO_GCP_PRODUCTION_RESOURCE_MAP.serviceAccounts.apiOrchestrator
        : null,
      taskOidcAudienceState: asyncHandoff
        ? 'deployed_private_controller_url_required' as const
        : 'not_applicable' as const,
      cloudRunTaskTimeoutSeconds: job.attemptTimeoutSeconds,
      cloudRunTaskTimeoutLimitSeconds: timeoutLimit,
      packageQueueOwnsApprovedAttempts: true as const,
      cloudTasksDeliveryRetryDoesNotAuthorizeAnotherExecutionAttempt: true as const,
      workerLoadsAuthorityByOpaqueDispatchIntent: true as const,
      taskBodyCarriesRawMediaOrSecrets: false as const,
      blockers,
      cloudDispatchAuthorized: false as const,
      productionExecutionAuthorized: false as const,
    }
    return dispatchManifestEntrySchema.parse({
      ...payload,
      entryHash: sha256AuthorityValue(payload),
    })
  })
  const payload = {
    schemaVersion: CANONICAL_CLOUD_WORKER_DISPATCH_HANDOFF_MANIFEST_VERSION,
    source: 'approved_package_queue_region_and_cloud_target_authority' as const,
    identity: {
      workspaceId: queueDefinition.identity.workspaceId,
      projectId: queueDefinition.identity.projectId,
      editSessionId: queueDefinition.identity.editSessionId,
      packageRecordId: queueDefinition.identity.packageRecordId,
      approvedPlanSnapshotId: queueDefinition.identity.approvedPlanSnapshotId,
      packageHash: queueDefinition.identity.packageHash,
      snapshotHash: queueDefinition.identity.snapshotHash,
      workGraphHash: queueDefinition.identity.workGraphHash,
      queueDefinitionHash: queueDefinition.definitionHash,
      regionAuthorityHash: regionAuthority.authorityHash,
      toolTargetCatalogHash: toolCatalog.catalogHash,
    },
    runtimeRegion: regionAuthority.runtimeRegion,
    entries,
    summary: {
      totalJobCount: entries.length,
      controlPlaneJobCount: entries.filter((entry) => entry.workerType === 'api_service').length,
      cloudTaskHandoffJobCount: entries.filter((entry) =>
        entry.target.cloudTasksQueueKind !== 'none').length,
      cpuAnalysisJobCount: entries.filter((entry) =>
        entry.workerType === 'cpu_analysis_worker').length,
      gpuJobCount: entries.filter((entry) => entry.workerType === 'gpu_ai_worker').length,
      renderJobCount: entries.filter((entry) => entry.workerType === 'render_worker').length,
      allJobsHaveExactCloudTargetContract: true as const,
      cloudRunHiddenRetryCount: 0 as const,
      allTaskBodiesOpaque: true as const,
    },
    boundaries: {
      browserDispatchAllowed: false as const,
      rawChatPromptMediaBytesOrSignedUrlsAllowed: false as const,
      providerActivationAuthorized: false as const,
      customerBillingAuthorized: false as const,
      walletMutationAuthorized: false as const,
      remoteSupabaseAuthorized: false as const,
      distributedOutboxTransactionVerified: false as const,
      cloudTasksOidcAndIamVerified: false as const,
      cloudRunJobDeploymentVerified: false as const,
      workerServiceIdentityVerified: false as const,
      privateGcsObjectTransportVerified: false as const,
      cloudDispatchAuthorized: false as const,
      productionExecutionAuthorized: false as const,
    },
  }
  return canonicalCloudWorkerDispatchHandoffManifestSchema.parse({
    ...payload,
    manifestHash: sha256AuthorityValue(payload),
  })
}

export function createCanonicalCloudWorkerDispatchAttemptPlan(input: {
  manifest: CanonicalCloudWorkerDispatchHandoffManifest
  jobId: string
  deliveryAttempt: number
}): CanonicalCloudWorkerDispatchAttemptPlan {
  assertManifestIntegrity(input.manifest)
  const entry = input.manifest.entries.find((candidate) => candidate.jobId === input.jobId)
  if (!entry) throw new Error('Cloud dispatch attempt job is not in the handoff manifest.')
  if (
    !Number.isSafeInteger(input.deliveryAttempt) || input.deliveryAttempt < 1 ||
    input.deliveryAttempt > entry.maxAttempts
  ) throw new Error('Cloud dispatch attempt number is invalid.')
  const dispatchBinding = {
    handoffManifestHash: input.manifest.manifestHash,
    manifestEntryHash: entry.entryHash,
    queueDefinitionHash: input.manifest.identity.queueDefinitionHash,
    regionAuthorityHash: input.manifest.identity.regionAuthorityHash,
    jobId: entry.jobId,
    deliveryAttempt: input.deliveryAttempt,
    runtimeRegion: entry.runtimeRegion,
    targetHash: entry.target.targetHash,
  }
  const dispatchBindingHash = sha256AuthorityValue(dispatchBinding)
  const dispatchIntentId = `cloud_dispatch_${dispatchBindingHash.slice(0, 32)}`
  const taskBody = {
    schemaVersion: CANONICAL_CLOUD_WORKER_DISPATCH_ATTEMPT_PLAN_VERSION,
    purpose: 'canonical_cloud_worker_dispatch_attempt' as const,
    dispatchIntentId,
    handoffManifestHash: input.manifest.manifestHash,
    manifestEntryHash: entry.entryHash,
    queueDefinitionHash: input.manifest.identity.queueDefinitionHash,
    regionAuthorityHash: input.manifest.identity.regionAuthorityHash,
    jobId: entry.jobId,
    deliveryAttempt: input.deliveryAttempt,
    dispatchBindingHash,
  }
  const bodyText = stableAuthorityStringify(taskBody)
  const bodyUtf8ByteLength = Buffer.byteLength(bodyText, 'utf8')
  if (
    bodyUtf8ByteLength > CANONICAL_CLOUD_TASK_BODY_LIMIT_BYTES ||
    bodyUtf8ByteLength >= CLOUD_TASKS_SYSTEM_MAX_TASK_BYTES
  ) throw new Error('Canonical Cloud Tasks handoff body exceeds its private limit.')
  const taskId = `rp-${sha256AuthorityValue(taskBody).slice(0, 40)}`
  const isAsync = entry.queueResourceName !== null
  const cloudTask = isAsync ? {
    queueResourceName: entry.queueResourceName!,
    taskId,
    taskResourceName: `${entry.queueResourceName}/tasks/${taskId}`,
    scheduleTime: entry.scheduledFor,
    dispatchDeadlineSeconds: CANONICAL_CLOUD_TASK_DISPATCH_DEADLINE_SECONDS,
    httpMethod: 'POST' as const,
    targetServiceName: entry.privateDispatchControllerServiceName,
    targetPath: entry.privateDispatchControllerPath,
    oidcServiceAccountEmail: entry.taskOidcServiceAccountEmail!,
    oidcAudienceState: 'deployed_private_controller_url_required' as const,
    bodyBase64EncodingRequiredByApi: true as const,
    bodyUtf8ByteLength,
    taskBody,
    bodySha256: sha256AuthorityValue(taskBody),
    deterministicTaskNameIsOnlyShortWindowDeduplication: true as const,
  } : null
  const cloudRunJob = isAsync ? {
    apiMethod: 'run.googleapis.com/v2.projects.locations.jobs.run' as const,
    jobResourceName: `projects/${REEDITPRO_GCP_PRODUCTION_RESOURCE_MAP.projectId}` +
      `/locations/${entry.runtimeRegion}/jobs/${entry.target.cloudRunTargetName}`,
    startExecutionToken: `rp${dispatchBindingHash.slice(0, 20)}`,
    taskCount: 1 as const,
    parallelism: 1 as const,
    taskTimeoutSeconds: entry.cloudRunTaskTimeoutSeconds,
    taskMaxRetries: 0 as const,
    serviceAccountEmail: entry.target.workerServiceAccountEmail,
    environmentOverrides: {
      REEDITPRO_DISPATCH_INTENT_ID: dispatchIntentId,
      REEDITPRO_DISPATCH_BINDING_HASH: dispatchBindingHash,
    },
    usesApplicationDefaultCredentials: true as const,
    embeddedCredentialOrSignedUrl: false as const,
  } : null
  const payload = {
    schemaVersion: CANONICAL_CLOUD_WORKER_DISPATCH_ATTEMPT_PLAN_VERSION,
    source: 'canonical_cloud_worker_dispatch_handoff_manifest' as const,
    dispatchIntentId,
    handoffManifestHash: input.manifest.manifestHash,
    manifestEntryHash: entry.entryHash,
    queueDefinitionHash: input.manifest.identity.queueDefinitionHash,
    regionAuthorityHash: input.manifest.identity.regionAuthorityHash,
    jobId: entry.jobId,
    deliveryAttempt: input.deliveryAttempt,
    runtimeRegion: entry.runtimeRegion,
    dispatchBindingHash,
    cloudTask,
    cloudRunJob,
    blockers: [...entry.blockers],
    boundaries: {
      requestShapeOnly: true as const,
      networkCallPerformed: false as const,
      credentialResolved: false as const,
      cloudTaskCreated: false as const,
      cloudRunJobExecuted: false as const,
      cloudDispatchAuthorized: false as const,
      productionExecutionAuthorized: false as const,
    },
  }
  return canonicalCloudWorkerDispatchAttemptPlanSchema.parse({
    ...payload,
    attemptPlanHash: sha256AuthorityValue(payload),
  })
}

function cloudTargetForWorkerType(
  value: CanonicalPrivateExecutableWorkerType,
) {
  const projectId = REEDITPRO_GCP_PRODUCTION_RESOURCE_MAP.projectId
  if (value === 'api_service') {
    const payload = {
      workerType: value,
      handoffMode: 'private_api_service_control_plane' as const,
      cloudTasksQueueKind: 'none' as const,
      cloudRunTargetKind: 'service' as const,
      cloudRunTargetName: GCP_PRODUCTION_API_SERVICE.name,
      workerServiceAccountKey: GCP_PRODUCTION_API_SERVICE.serviceAccountKey,
      workerServiceAccountEmail: getGcpProductionServiceAccountEmail(
        GCP_PRODUCTION_API_SERVICE.serviceAccountKey,
        projectId,
      ),
      cpu: GCP_PRODUCTION_API_SERVICE.cpu,
      memory: GCP_PRODUCTION_API_SERVICE.memory,
      accelerator: 'none' as const,
      parallelism: 1 as const,
      cloudRunInternalMaxRetries: 0 as const,
      targetResourceExistenceVerified: false as const,
      targetIamVerified: false as const,
    }
    return cloudTargetSchema.parse({ ...payload, targetHash: sha256AuthorityValue(payload) })
  }
  const targetNames: Record<Exclude<CanonicalPrivateExecutableWorkerType, 'api_service'>, string> = {
    cpu_analysis_worker: 'reeditpro-cpu-analysis-worker',
    gpu_ai_worker: 'reeditpro-gpu-ai-worker',
    render_worker: 'reeditpro-render-worker',
    qa_worker: 'reeditpro-qa-worker',
    tool_readiness_worker: 'reeditpro-tool-readiness-worker',
  }
  const target = GCP_PRODUCTION_CLOUD_RUN_JOBS.find((candidate) =>
    candidate.name === targetNames[value])
  if (!target || target.maxRetries !== 0 || target.parallelism !== 1) {
    throw new Error(`Cloud Run target template is not queue-attempt safe for ${value}.`)
  }
  const payload = {
    workerType: value,
    handoffMode: 'cloud_tasks_oidc_to_private_controller_then_cloud_run_jobs_run' as const,
    cloudTasksQueueKind: value === 'render_worker'
      ? 'render_dispatch' as const
      : 'worker_dispatch' as const,
    cloudRunTargetKind: 'job' as const,
    cloudRunTargetName: target.name,
    workerServiceAccountKey: target.serviceAccountKey,
    workerServiceAccountEmail: getGcpProductionServiceAccountEmail(
      target.serviceAccountKey,
      projectId,
    ),
    cpu: target.cpu,
    memory: target.memory,
    accelerator: target.gpuType === 'nvidia-l4' ? 'nvidia_l4' as const : 'none' as const,
    parallelism: 1 as const,
    cloudRunInternalMaxRetries: 0 as const,
    targetResourceExistenceVerified: false as const,
    targetIamVerified: false as const,
  }
  return cloudTargetSchema.parse({ ...payload, targetHash: sha256AuthorityValue(payload) })
}

function cloudTasksQueueResourceName(
  kind: 'worker_dispatch' | 'render_dispatch',
  runtimeRegion: ReeditProRuntimeRegion,
): string {
  const queues = getReeditProCloudTasksQueuesForRegion(runtimeRegion)
  const queue = kind === 'render_dispatch' ? queues.renderDispatch : queues.workerDispatch
  return `projects/${REEDITPRO_GCP_PRODUCTION_RESOURCE_MAP.projectId}` +
    `/locations/${runtimeRegion}/queues/${queue}`
}

function dispatchBlockers(input: {
  job: CanonicalPrivatePackageWorkQueueJobDefinition
  regionAuthority: CanonicalCloudRuntimeRegionAuthority
  timeoutLimit: number
}): string[] {
  const blockers = [
    'distributed_dispatch_outbox_transaction_not_verified',
    'private_dispatch_controller_deployment_and_oidc_audience_not_verified',
    'cloud_tasks_oidc_invoker_and_queue_iam_not_verified',
    'cloud_run_job_resource_and_worker_service_identity_not_verified',
    'gcp_foundation_region_resource_and_service_identity_reconciliation_not_verified',
    'worker_receiver_identity_and_dispatch_intent_exchange_not_verified',
    'private_gcs_generation_bound_object_transport_not_verified',
    'deployed_dead_letter_reconciliation_observability_and_concurrency_not_verified',
  ]
  if (!input.regionAuthority.liveProjectRegionPersistenceVerified) {
    blockers.push('live_project_runtime_region_persistence_not_verified')
  }
  if (
    !input.regionAuthority.liveGcsObjectResidencyVerified ||
    !input.regionAuthority.allRequiredObjectsRegionBound
  ) blockers.push('live_required_object_region_residency_not_verified')
  if (!input.job.privateExecutionReady) {
    blockers.push(input.job.requiredGate ?? 'private_job_capability_not_ready')
  }
  if (input.job.providerExecutionMode !== 'none') {
    blockers.push('provider_execution_activation_not_authorized')
  }
  if (input.job.attemptTimeoutSeconds > input.timeoutLimit) {
    blockers.push('cloud_run_task_timeout_exceeds_runtime_limit')
  }
  return Array.from(new Set(blockers)).sort()
}

function assertQueueDefinitionIntegrity(
  definition: CanonicalPrivatePackageWorkQueueDefinition,
): void {
  const parsed = canonicalPrivatePackageWorkQueueDefinitionSchema.parse(definition)
  const { definitionHash, ...payload } = parsed
  if (
    definitionHash !== sha256AuthorityValue(payload) ||
    parsed.jobs.some((job) => {
      const { definitionHash: jobHash, ...jobPayload } = job
      return jobHash !== sha256AuthorityValue(jobPayload)
    })
  ) throw new Error('Canonical package queue definition integrity failed.')
}

function assertPackageQueueBinding(
  executionPackage: CanonicalApprovedEditExecutionPackage,
  queueDefinition: CanonicalPrivatePackageWorkQueueDefinition,
): void {
  if (
    executionPackage.packageRecordId !== queueDefinition.identity.packageRecordId ||
    executionPackage.workspaceId !== queueDefinition.identity.workspaceId ||
    executionPackage.projectId !== queueDefinition.identity.projectId ||
    executionPackage.editSessionId !== queueDefinition.identity.editSessionId ||
    executionPackage.approvedPlanSnapshotId !==
      queueDefinition.identity.approvedPlanSnapshotId ||
    executionPackage.packageHash !== queueDefinition.identity.packageHash ||
    executionPackage.snapshotHash !== queueDefinition.identity.snapshotHash ||
    executionPackage.workGraphHash !== queueDefinition.identity.workGraphHash ||
    executionPackage.jobs.length !== queueDefinition.jobs.length ||
    executionPackage.reservationStatus !== 'reserved' ||
    executionPackage.remainingReservedCredits <= 0
  ) throw new Error('Cloud dispatch handoff requires the exact funded package queue.')
  for (const [index, job] of executionPackage.jobs.entries()) {
    const queueJob = queueDefinition.jobs[index]
    if (
      !queueJob || queueJob.jobId !== job.id ||
      queueJob.approvedWorkItemId !== job.approvedWorkItemId ||
      queueJob.workItemKey !== job.workItemKey ||
      queueJob.maxAttempts !== job.maxAttempts ||
      queueJob.attemptTimeoutSeconds !== job.attemptTimeoutSeconds ||
      queueJob.scheduledFor !== job.scheduledFor
    ) throw new Error('Cloud dispatch package job order or execution policy changed.')
  }
}

function assertManifestIntegrity(
  manifest: CanonicalCloudWorkerDispatchHandoffManifest,
): void {
  const parsed = canonicalCloudWorkerDispatchHandoffManifestSchema.parse(manifest)
  const { manifestHash, ...payload } = parsed
  if (
    manifestHash !== sha256AuthorityValue(payload) ||
    parsed.entries.some((entry) => {
      const { entryHash, ...entryPayload } = entry
      return entryHash !== sha256AuthorityValue(entryPayload)
    })
  ) throw new Error('Canonical cloud dispatch handoff manifest integrity failed.')
}
