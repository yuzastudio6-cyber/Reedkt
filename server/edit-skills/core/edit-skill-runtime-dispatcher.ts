import { z } from 'zod'

import type { EditSkillPublicWorkItem } from './edit-skill-plugin'
import { hashSkillValue } from './skill-capability-manifest-hash'
import { skillIdentitySchema, skillSha256Schema } from './skill-capability-manifest-schema'
import type { SkillManifestReference } from './skill-capability-manifest-types'
import {
  SkillJobRuntimeBindingRegistry,
  type SkillJobRuntimeAdapterResult,
} from './edit-skill-runtime-binding'

const runtimeDispatchReceiptCoreSchema = z.object({
  schemaVersion: z.literal('edit-skill-runtime-dispatch-receipt-v1'),
  bindingHash: skillSha256Schema,
  runtimeAdapterId: skillIdentitySchema,
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

  async executeInternalFixture(input: {
    manifestRef: SkillManifestReference
    workItem: EditSkillPublicWorkItem
    authorizedPhase: string
    inputArtifactTypes: readonly string[]
  }): Promise<RuntimeDispatchReceipt> {
    const binding = this.#bindings.resolve({
      manifestRef: input.manifestRef,
      jobType: input.workItem.jobType,
    })
    const definition = binding.definition
    if (
      input.workItem.operationId !== definition.operationId ||
      input.workItem.workerClass !== definition.workerClass ||
      input.workItem.expectedOutputType !== definition.outputArtifactTypes[0] ||
      input.workItem.assignmentId.length === 0 ||
      !definition.allowedPhases.includes(input.authorizedPhase) ||
      input.inputArtifactTypes.some((artifactType) =>
        !definition.inputArtifactTypes.includes(artifactType))
    ) throw new Error('Runtime dispatcher rejected work that differs from the exact binding.')
    const adapterResult: SkillJobRuntimeAdapterResult = await binding.handler({
      mode: 'internal_fixture',
      binding: definition,
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
      schemaVersion: 'edit-skill-runtime-dispatch-receipt-v1',
      bindingHash: definition.bindingHash,
      runtimeAdapterId: definition.runtimeAdapterId,
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
