import { z } from 'zod'

import type { EditSkillArtifactStore } from './edit-skill-artifact-store'
import {
  editSkillPlanApprovalSchema,
  type EditSkillPlanApproval,
  type EditSkillPublicWorkItem,
} from './edit-skill-plugin'
import { ACTIVE_QUALIFICATION_RANK, type SkillQualificationStatus } from './edit-skill-ids'
import { hashSkillValue } from './skill-capability-manifest-hash'
import { skillIdentitySchema, skillSha256Schema } from './skill-capability-manifest-schema'
import type { SkillManifestReference } from './skill-capability-manifest-types'
import {
  SkillJobRuntimeBindingRegistry,
  type SkillJobRuntimeAdapterResult,
  type SkillJobRuntimeBindingDefinition,
} from './edit-skill-runtime-binding'

const runtimeDispatchReceiptCoreSchema = z.object({
  schemaVersion: z.literal('edit-skill-runtime-dispatch-receipt-v2'),
  bindingHash: skillSha256Schema,
  runtimeAdapterId: skillIdentitySchema,
  adapterClass: z.enum([
    'internal_qualification_adapter',
    'canonical_private_execution_adapter',
    'production_worker_adapter',
  ]),
  environmentClass: z.enum(['internal_fixture', 'canonical_private', 'production_server']),
  approvalHash: skillSha256Schema,
  assignmentId: z.string().trim().min(1).max(180),
  assignmentHash: skillSha256Schema,
  workItemKey: z.string().trim().min(1).max(180),
  workItemHash: skillSha256Schema,
  authorizedPhase: skillIdentitySchema,
  status: z.enum(['succeeded', 'failed']),
  outputArtifactTypes: z.array(skillIdentitySchema).max(100),
  evidenceHashes: z.array(skillSha256Schema).min(1).max(100),
  providerRequestCount: z.number().int().nonnegative().max(10),
  publicArtifactCount: z.number().int().nonnegative().max(10),
  productionMutationCount: z.number().int().nonnegative().max(10),
  failureCode: skillIdentitySchema.optional(),
}).strict().superRefine((value, context) => {
  if (value.status === 'succeeded' && value.failureCode) {
    context.addIssue({ code: 'custom', message: 'Successful runtime dispatch cannot carry a failure code.' })
  }
  if (value.status === 'failed' && !value.failureCode) {
    context.addIssue({ code: 'custom', message: 'Failed runtime dispatch requires a safe failure code.' })
  }
})

export const runtimeDispatchReceiptSchema = runtimeDispatchReceiptCoreSchema.extend({
  receiptHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { receiptHash, ...core } = value
  if (hashSkillValue(core) !== receiptHash) {
    context.addIssue({ code: 'custom', message: 'Runtime dispatch receipt hash is stale or forged.' })
  }
})

export type RuntimeDispatchReceipt = z.infer<typeof runtimeDispatchReceiptSchema>

export class EditSkillRuntimeDispatcher {
  readonly #bindings: SkillJobRuntimeBindingRegistry

  constructor(bindings: SkillJobRuntimeBindingRegistry) {
    this.#bindings = bindings
  }

  async dispatchApprovedWorkItem(input: {
    manifestRef: SkillManifestReference
    workItem: EditSkillPublicWorkItem
    approval: EditSkillPlanApproval
    authorizedPhase: string
    inputArtifactTypes: readonly string[]
    adapterClass: SkillJobRuntimeBindingDefinition['adapterClass']
    environmentClass: SkillJobRuntimeBindingDefinition['environmentClass']
    runtimeQualification: SkillQualificationStatus
    artifactStorageClass: EditSkillArtifactStore['storageClass']
    privateArtifactAuthority: boolean
    providerAuthorityOperations: ReadonlySet<string>
    toolAuthorityOperations: ReadonlySet<string>
  }): Promise<RuntimeDispatchReceipt> {
    const approval = editSkillPlanApprovalSchema.parse(input.approval)
    const binding = this.#bindings.resolve({
      manifestRef: input.manifestRef,
      jobType: input.workItem.jobType,
      adapterClass: input.adapterClass,
      environmentClass: input.environmentClass,
    })
    const definition = binding.definition
    const requiredRank = ACTIVE_QUALIFICATION_RANK[definition.requiredQualification]
    const actualRank = ACTIVE_QUALIFICATION_RANK[input.runtimeQualification]
    if (
      hashSkillValue(input.workItem.manifestRef) !== hashSkillValue(input.manifestRef) ||
      input.workItem.operationId !== definition.operationId ||
      input.workItem.workerClass !== definition.workerClass ||
      input.workItem.expectedOutputType !== definition.outputArtifactTypes[0] ||
      input.workItem.assignmentId.length === 0 ||
      !definition.allowedPhases.includes(input.authorizedPhase) ||
      hashSkillValue(input.inputArtifactTypes) !== hashSkillValue(definition.inputArtifactTypes) ||
      input.workItem.callerSelectedExecutableAllowed ||
      approval.assignmentId !== input.workItem.assignmentId ||
      approval.assignmentHash !== input.workItem.assignmentHash ||
      hashSkillValue(approval.manifestRef) !== hashSkillValue(input.manifestRef) ||
      hashSkillValue(approval.authorizedRange) !== hashSkillValue(input.workItem.authorizedRange)
    ) throw new Error('Runtime dispatcher rejected work that differs from the exact binding.')
    if (requiredRank === undefined || actualRank === undefined || actualRank < requiredRank) {
      throw new Error('Runtime dispatcher rejected an under-qualified adapter invocation.')
    }
    if (
      definition.adapterClass === 'production_worker_adapter' &&
      input.artifactStorageClass !== 'durable'
    ) throw new Error('Production runtime binding rejects the internal in-memory artifact store.')
    if (definition.privateArtifactRequired && (
      !input.privateArtifactAuthority || input.artifactStorageClass !== 'durable'
    )) throw new Error('Runtime binding requires explicit durable private artifact authority.')
    if (
      definition.providerAuthorityRequired &&
      !input.providerAuthorityOperations.has(definition.operationId)
    ) throw new Error('Runtime dispatcher lacks exact provider authority.')
    if (
      definition.toolAuthorityRequired &&
      !input.toolAuthorityOperations.has(definition.operationId)
    ) throw new Error('Runtime dispatcher lacks exact tool authority.')
    const adapterResult: SkillJobRuntimeAdapterResult = await binding.handler({
      mode: definition.adapterClass,
      environmentClass: definition.environmentClass,
      binding: definition,
      approvalHash: approval.approvalHash,
      assignmentId: input.workItem.assignmentId,
      assignmentHash: input.workItem.assignmentHash,
      workItemKey: input.workItem.workItemKey,
      workItemHash: input.workItem.workItemHash,
      authorizedPhase: input.authorizedPhase,
      inputArtifactTypes: input.inputArtifactTypes,
    })
    if (
      adapterResult.outputArtifactTypes.length !== definition.outputArtifactTypes.length ||
      adapterResult.outputArtifactTypes.some((type, index) =>
        type !== definition.outputArtifactTypes[index])
    ) throw new Error('Runtime adapter returned output types outside its binding.')
    const core = runtimeDispatchReceiptCoreSchema.parse({
      schemaVersion: 'edit-skill-runtime-dispatch-receipt-v2',
      bindingHash: definition.bindingHash,
      runtimeAdapterId: definition.runtimeAdapterId,
      adapterClass: definition.adapterClass,
      environmentClass: definition.environmentClass,
      approvalHash: approval.approvalHash,
      assignmentId: input.workItem.assignmentId,
      assignmentHash: input.workItem.assignmentHash,
      workItemKey: input.workItem.workItemKey,
      workItemHash: input.workItem.workItemHash,
      authorizedPhase: input.authorizedPhase,
      ...adapterResult,
    })
    return runtimeDispatchReceiptSchema.parse({ ...core, receiptHash: hashSkillValue(core) })
  }
}
