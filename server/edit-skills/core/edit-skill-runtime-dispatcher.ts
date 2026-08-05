import { z } from 'zod'

import type { EditSkillArtifactStore } from './edit-skill-artifact-store'
import type { EditSkillArtifactReference } from './edit-skill-artifact-store'
import {
  editSkillPlanApprovalSchema,
  type EditSkillPlanApproval,
  type EditSkillPublicWorkItem,
} from './edit-skill-plugin'
import {
  createEditSkillWorkResult,
  type EditSkillWorkResult,
} from './edit-skill-work-result'
import type { SkillFrameRange } from './skill-assignment-types'
import { ACTIVE_QUALIFICATION_RANK, type SkillQualificationStatus } from './edit-skill-ids'
import { canonicalSkillJson, hashSkillValue } from './skill-capability-manifest-hash'
import { skillIdentitySchema, skillSha256Schema } from './skill-capability-manifest-schema'
import type { SkillManifestReference } from './skill-capability-manifest-types'
import type { SkillQualificationRegistry } from './skill-qualification-registry'
import type { SkillRouteQualificationRegistry } from './skill-route-qualification'
import {
  SkillJobRuntimeBindingRegistry,
  type SkillJobRuntimeAdapterResult,
  type SkillJobRuntimeBindingDefinition,
} from './edit-skill-runtime-binding'

const runtimeDispatchReceiptCoreSchema = z.object({
  schemaVersion: z.literal('edit-skill-runtime-dispatch-receipt-v3'),
  bindingHash: skillSha256Schema,
  runtimeAdapterId: skillIdentitySchema,
  adapterClass: z.enum([
    'internal_qualification_adapter',
    'canonical_private_execution_adapter',
    'production_worker_adapter',
  ]),
  environmentClass: z.enum(['internal_fixture', 'canonical_private', 'production_server']),
  routeQualificationReceiptHash: skillSha256Schema,
  resolvedQualificationStatus: z.enum([
    'planning_qualified',
    'internal_execution_qualified',
    'production_qualified',
  ]),
  approvalHash: skillSha256Schema,
  assignmentId: z.string().trim().min(1).max(180),
  assignmentHash: skillSha256Schema,
  workItemKey: z.string().trim().min(1).max(180),
  workItemHash: skillSha256Schema,
  authorizedPhase: skillIdentitySchema,
  status: z.enum(['succeeded', 'failed']),
  outputArtifactTypes: z.array(skillIdentitySchema).max(100),
  inputArtifactReferenceHashes: z.array(skillSha256Schema).max(100),
  dependencyOutputReferenceHashes: z.array(skillSha256Schema).max(100),
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

export interface RuntimeDispatchInput {
  manifestRef: SkillManifestReference
  workItem: EditSkillPublicWorkItem
  approval: EditSkillPlanApproval
  authorizedPhase: string
  expectedQualification?: SkillQualificationStatus
  exactInputArtifactRefs?: readonly EditSkillArtifactReference[]
  dependencyOutputRefs?: readonly {
    reference: EditSkillArtifactReference
    producerWorkItemKey: string
    producerWorkItemHash: string
  }[]
  artifactScope?: {
    ownerUserId: string
    workspaceId: string
    projectId: string
  }
}

export interface RuntimeDispatchOutcome {
  receipt: RuntimeDispatchReceipt
  adapterResult: SkillJobRuntimeAdapterResult
}

export interface RuntimeDispatchToWorkResultInput extends RuntimeDispatchInput {
  artifactStore: EditSkillArtifactStore
  artifactScope: {
    ownerUserId: string
    workspaceId: string
    projectId: string
  }
  planId: string
  planHash: string
  qaEvidenceArtifactRefs: readonly EditSkillArtifactReference[]
  mutationRanges?: readonly SkillFrameRange[]
}

export interface RuntimeDispatchWorkResultOutcome extends RuntimeDispatchOutcome {
  outputArtifactRefs: readonly EditSkillArtifactReference[]
  workResult: EditSkillWorkResult
}

export class EditSkillRuntimeDispatcher {
  readonly #bindings: SkillJobRuntimeBindingRegistry
  readonly #environmentClass: SkillJobRuntimeBindingDefinition['environmentClass']
  readonly #routeQualifications: SkillRouteQualificationRegistry
  readonly #skillQualifications: SkillQualificationRegistry
  readonly #artifactStore: EditSkillArtifactStore
  readonly #privateArtifactAuthority: boolean
  readonly #providerAuthorityOperations: ReadonlyMap<string, SkillQualificationStatus>
  readonly #toolAuthorityOperations: ReadonlyMap<string, SkillQualificationStatus>

  constructor(input: {
    bindings: SkillJobRuntimeBindingRegistry
    environmentClass: SkillJobRuntimeBindingDefinition['environmentClass']
    routeQualifications: SkillRouteQualificationRegistry
    skillQualifications: SkillQualificationRegistry
    artifactStore: EditSkillArtifactStore
    privateArtifactAuthority: boolean
    providerAuthorityOperations: ReadonlyMap<string, SkillQualificationStatus>
    toolAuthorityOperations: ReadonlyMap<string, SkillQualificationStatus>
  }) {
    this.#bindings = input.bindings
    this.#environmentClass = input.environmentClass
    this.#routeQualifications = input.routeQualifications
    this.#skillQualifications = input.skillQualifications
    this.#artifactStore = input.artifactStore
    this.#privateArtifactAuthority = input.privateArtifactAuthority
    this.#providerAuthorityOperations = input.providerAuthorityOperations
    this.#toolAuthorityOperations = input.toolAuthorityOperations
  }

  async dispatchApprovedWorkItem(input: RuntimeDispatchInput): Promise<RuntimeDispatchReceipt> {
    return (await this.dispatchApprovedWorkItemOutcome(input)).receipt
  }

  async dispatchApprovedWorkItemOutcome(
    input: RuntimeDispatchInput,
  ): Promise<RuntimeDispatchOutcome> {
    const approval = editSkillPlanApprovalSchema.parse(input.approval)
    const adapterClass = this.#environmentClass === 'internal_fixture'
      ? 'internal_qualification_adapter' as const
      : this.#environmentClass === 'canonical_private'
        ? 'canonical_private_execution_adapter' as const
        : 'production_worker_adapter' as const
    const binding = this.#bindings.resolve({
      manifestRef: input.manifestRef,
      jobType: input.workItem.jobType,
      adapterClass,
      environmentClass: this.#environmentClass,
    })
    const definition = binding.definition
    const routeQualification = this.#routeQualifications.resolve({
      binding: definition,
      expectedQualification: input.expectedQualification,
    })
    // Existence and integrity of the skill receipt are checked independently
    // from route status. Qualification-candidate receipts are usable only by
    // a registry explicitly constructed in aggregate receipt-issuance mode.
    if (routeQualification.skillQualificationReceiptHash) {
      this.#skillQualifications.resolve(input.manifestRef)
    }
    if (routeQualification.qualificationStatus === 'blocked') {
      throw new Error('Runtime route is blocked by independently verified qualification gates.')
    }
    const resolvedQualificationStatus = routeQualification.qualificationStatus
    if (
      hashSkillValue(input.workItem.manifestRef) !== hashSkillValue(input.manifestRef) ||
      input.workItem.operationId !== definition.operationId ||
      input.workItem.workerClass !== definition.workerClass ||
      input.workItem.expectedOutputType !== definition.outputArtifactTypes[0] ||
      input.workItem.assignmentId.length === 0 ||
      !definition.allowedPhases.includes(input.authorizedPhase) ||
      input.workItem.callerSelectedExecutableAllowed ||
      approval.assignmentId !== input.workItem.assignmentId ||
      approval.assignmentHash !== input.workItem.assignmentHash ||
      hashSkillValue(approval.manifestRef) !== hashSkillValue(input.manifestRef) ||
      hashSkillValue(approval.authorizedRange) !== hashSkillValue(input.workItem.authorizedRange)
    ) throw new Error('Runtime dispatcher rejected work that differs from the exact binding.')
    if (
      definition.adapterClass === 'production_worker_adapter' &&
      this.#artifactStore.storageClass !== 'durable'
    ) throw new Error('Production runtime binding rejects the internal in-memory artifact store.')
    if (definition.privateArtifactRequired && (
      !this.#privateArtifactAuthority || this.#artifactStore.storageClass !== 'durable'
    )) throw new Error('Runtime binding requires explicit durable private artifact authority.')
    if (
      definition.providerAuthorityRequired &&
      (ACTIVE_QUALIFICATION_RANK[
        this.#providerAuthorityOperations.get(definition.operationId) ?? 'blocked'
      ] ?? -1) < (ACTIVE_QUALIFICATION_RANK[resolvedQualificationStatus] ?? Number.MAX_SAFE_INTEGER)
    ) throw new Error('Runtime dispatcher lacks exact provider authority.')
    if (
      definition.toolAuthorityRequired &&
      (ACTIVE_QUALIFICATION_RANK[
        this.#toolAuthorityOperations.get(definition.operationId) ?? 'blocked'
      ] ?? -1) < (ACTIVE_QUALIFICATION_RANK[resolvedQualificationStatus] ?? Number.MAX_SAFE_INTEGER)
    ) throw new Error('Runtime dispatcher lacks exact tool authority.')
    const exactInputArtifactRefs = [...(input.exactInputArtifactRefs ?? [])]
    const dependencyOutputRefs = [...(input.dependencyOutputRefs ?? [])]
    if (this.#environmentClass !== 'internal_fixture') {
      if (!input.artifactScope) {
        throw new Error('Canonical runtime dispatch requires exact artifact scope authority.')
      }
      const artifactScope = input.artifactScope
      if (
        exactInputArtifactRefs.length !== definition.inputArtifactTypes.length ||
        exactInputArtifactRefs.some((reference, index) =>
          reference.artifactType !== definition.inputArtifactTypes[index])
      ) throw new Error('Canonical runtime dispatch is missing exact ordered input artifact references.')
      const referenceKeys = exactInputArtifactRefs.map((reference) =>
        canonicalSkillJson(reference))
      if (new Set(referenceKeys).size !== referenceKeys.length) {
        throw new Error('Canonical runtime dispatch contains duplicate input artifact roles.')
      }
      if (
        new Set(input.workItem.dependencyKeys).size !==
          input.workItem.dependencyKeys.length ||
        dependencyOutputRefs.length !== input.workItem.dependencyKeys.length ||
        new Set(dependencyOutputRefs.map((dependency) =>
          dependency.producerWorkItemKey)).size !== dependencyOutputRefs.length ||
        input.workItem.dependencyKeys.some((dependencyKey) =>
          !dependencyOutputRefs.some((dependency) =>
            dependency.producerWorkItemKey === dependencyKey))
      ) throw new Error(
        'Canonical runtime dispatch requires one exact predecessor output reference per dependency.',
      )
      const validateStoredReference = async (
        reference: EditSkillArtifactReference,
      ): Promise<void> => {
        if (
          reference.ownerUserId !== artifactScope.ownerUserId ||
          reference.workspaceId !== artifactScope.workspaceId ||
          reference.projectId !== artifactScope.projectId
        ) throw new Error('Canonical runtime dispatch rejected a cross-workspace input artifact.')
        const value = await this.#artifactStore.readJson({
          reference,
          ...artifactScope,
        })
        if (
          hashSkillValue(value) !== reference.sha256 ||
          Buffer.byteLength(canonicalSkillJson(value), 'utf8') !== reference.byteLength
        ) throw new Error('Canonical runtime dispatch rejected a stale or substituted input artifact.')
      }
      for (const reference of exactInputArtifactRefs) {
        await validateStoredReference(reference)
      }
      for (const dependency of dependencyOutputRefs) {
        if (
          !input.workItem.dependencyKeys.includes(dependency.producerWorkItemKey) ||
          !skillSha256Schema.safeParse(dependency.producerWorkItemHash).success
        ) throw new Error('Canonical runtime dependency output lacks approved predecessor lineage.')
        await validateStoredReference(dependency.reference)
      }
    } else if (exactInputArtifactRefs.length > 0 || dependencyOutputRefs.length > 0) {
      throw new Error('Internal fixture adapters cannot present exact canonical-private artifact lineage.')
    }
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
      inputArtifactTypes: definition.inputArtifactTypes,
      exactInputArtifactRefs,
      dependencyOutputRefs,
      routeQualificationReceiptHash: routeQualification.receiptHash,
      resolvedQualificationStatus,
      artifactStore: this.#artifactStore,
    })
    if (
      adapterResult.outputArtifactTypes.length !== definition.outputArtifactTypes.length ||
      adapterResult.outputArtifactTypes.some((type, index) =>
        type !== definition.outputArtifactTypes[index])
    ) throw new Error('Runtime adapter returned output types outside its binding.')
    if (adapterResult.outputArtifacts) {
      const artifactTypes = adapterResult.outputArtifacts.map((artifact) => artifact.artifactType)
      if (
        artifactTypes.length !== definition.outputArtifactTypes.length ||
        new Set(artifactTypes).size !== artifactTypes.length ||
        artifactTypes.some((type, index) => type !== definition.outputArtifactTypes[index])
      ) throw new Error('Runtime adapter returned artifact values outside its exact binding.')
    }
    const { outputArtifacts: _outputArtifacts, ...receiptAdapterResult } = adapterResult
    void _outputArtifacts
    const core = runtimeDispatchReceiptCoreSchema.parse({
      schemaVersion: 'edit-skill-runtime-dispatch-receipt-v3',
      bindingHash: definition.bindingHash,
      runtimeAdapterId: definition.runtimeAdapterId,
      adapterClass: definition.adapterClass,
      environmentClass: definition.environmentClass,
      routeQualificationReceiptHash: routeQualification.receiptHash,
      resolvedQualificationStatus,
      approvalHash: approval.approvalHash,
      assignmentId: input.workItem.assignmentId,
      assignmentHash: input.workItem.assignmentHash,
      workItemKey: input.workItem.workItemKey,
      workItemHash: input.workItem.workItemHash,
      authorizedPhase: input.authorizedPhase,
      ...receiptAdapterResult,
      inputArtifactReferenceHashes: exactInputArtifactRefs.map((reference) =>
        hashSkillValue(reference)),
      dependencyOutputReferenceHashes: dependencyOutputRefs.map((dependency) =>
        hashSkillValue(dependency)),
    })
    const receipt = runtimeDispatchReceiptSchema.parse({
      ...core,
      receiptHash: hashSkillValue(core),
    })
    return { receipt, adapterResult }
  }

  async dispatchApprovedWorkItemToResult(
    input: RuntimeDispatchToWorkResultInput,
  ): Promise<RuntimeDispatchWorkResultOutcome> {
    if (input.artifactStore !== this.#artifactStore) {
      throw new Error('Runtime dispatcher artifact-store declaration does not match the injected store.')
    }
    const outcome = await this.dispatchApprovedWorkItemOutcome(input)
    if (outcome.adapterResult.status === 'succeeded' && !outcome.adapterResult.outputArtifacts) {
      throw new Error('Successful canonical runtime dispatch did not return strict artifact values.')
    }
    const outputArtifactRefs: EditSkillArtifactReference[] = []
    for (const artifact of outcome.adapterResult.outputArtifacts ?? []) {
      outputArtifactRefs.push(await input.artifactStore.putJson({
        artifactType: artifact.artifactType,
        ownerUserId: input.artifactScope.ownerUserId,
        workspaceId: input.artifactScope.workspaceId,
        projectId: input.artifactScope.projectId,
        value: artifact.value,
      }))
    }
    const workResult = createEditSkillWorkResult({
      schemaVersion: 'edit-skill-work-result-v1',
      workItemKey: input.workItem.workItemKey,
      workItemHash: input.workItem.workItemHash,
      assignmentId: input.workItem.assignmentId,
      assignmentHash: input.workItem.assignmentHash,
      planId: input.planId,
      planHash: input.planHash,
      manifestRef: input.manifestRef,
      authorizedRange: input.workItem.authorizedRange,
      operationId: input.workItem.operationId,
      workerClass: input.workItem.workerClass,
      status: outcome.adapterResult.status,
      outputArtifactRefs,
      qaLineageKeys: input.workItem.qaLineageKeys,
      qaEvidenceArtifactRefs: [...input.qaEvidenceArtifactRefs],
      mutationRanges: [...(input.mutationRanges ?? [])],
      callerSelectedExecutable: false,
      outsideAuthorizedRangeModified: false,
      ...(outcome.adapterResult.failureCode
        ? { failureCode: outcome.adapterResult.failureCode }
        : {}),
    })
    return { ...outcome, outputArtifactRefs, workResult }
  }
}
