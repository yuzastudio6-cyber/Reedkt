import { z } from 'zod'

import type { EditSkillArtifactSchemaRegistry } from './edit-skill-artifact-store'
import {
  ACTIVE_QUALIFICATION_RANK,
  EDIT_SKILL_KEYS,
  type SkillQualificationStatus,
} from './edit-skill-ids'
import { hashSkillValue } from './skill-capability-manifest-hash'
import {
  skillIdentitySchema,
  skillSha256Schema,
  skillSemverSchema,
} from './skill-capability-manifest-schema'
import type { SkillCapabilityManifest, SkillManifestReference } from './skill-capability-manifest-types'
import {
  manifestAllowedExecutionPhaseIds,
  manifestSupportedJobTypeIds,
} from './skill-capability-manifest-normalization'

export interface SkillJobRuntimeInvocation {
  mode:
    | 'internal_qualification_adapter'
    | 'canonical_private_execution_adapter'
    | 'production_worker_adapter'
  environmentClass: 'internal_fixture' | 'canonical_private' | 'production_server'
  binding: SkillJobRuntimeBindingDefinition
  approvalHash: string
  assignmentId: string
  assignmentHash: string
  workItemKey: string
  workItemHash: string
  authorizedPhase: string
  inputArtifactTypes: readonly string[]
}

export interface SkillJobRuntimeAdapterResult {
  status: 'succeeded' | 'failed'
  outputArtifactTypes: readonly string[]
  evidenceHashes: readonly string[]
  providerRequestCount: number
  publicArtifactCount: number
  productionMutationCount: number
  outputArtifacts?: readonly {
    artifactType: string
    value: unknown
  }[]
  failureCode?: string
}

export type SkillJobRuntimeAdapter = (
  input: SkillJobRuntimeInvocation,
) => Promise<SkillJobRuntimeAdapterResult>

const skillJobRuntimeBindingCoreSchema = z.object({
  schemaVersion: z.literal('edit-skill-runtime-binding-v2'),
  skillKey: z.enum(EDIT_SKILL_KEYS),
  skillVersion: skillSemverSchema,
  contractVersion: skillIdentitySchema,
  manifestHash: skillSha256Schema,
  jobType: skillIdentitySchema,
  operationId: skillIdentitySchema,
  operationKind: z.enum(['internal', 'tool', 'provider', 'source', 'no_action']),
  workerClass: skillIdentitySchema,
  inputArtifactTypes: z.array(skillIdentitySchema).max(100),
  outputArtifactTypes: z.array(skillIdentitySchema).min(1).max(100),
  allowedPhases: z.array(skillIdentitySchema).min(1).max(100),
  requiredQualification: z.enum([
    'declared',
    'implementation_pending',
    'planning_qualified',
    'internal_execution_qualified',
    'production_qualified',
  ]),
  adapterClass: z.enum([
    'internal_qualification_adapter',
    'canonical_private_execution_adapter',
    'production_worker_adapter',
  ]),
  environmentClass: z.enum(['internal_fixture', 'canonical_private', 'production_server']),
  runtimeAdapterId: skillIdentitySchema,
  approvalRequired: z.boolean(),
  providerAuthorityRequired: z.boolean(),
  toolAuthorityRequired: z.boolean(),
  privateArtifactRequired: z.boolean(),
  callerSelectedExecutableAllowed: z.literal(false),
  automaticRetryAllowed: z.literal(false),
  alternateProviderFallbackAllowed: z.literal(false),
  mutatesOnlyAssignmentRange: z.literal(true),
  createsMedia: z.boolean(),
  providerRouteKey: skillIdentitySchema.optional(),
}).strict().superRefine((value, context) => {
  if ((value.operationKind === 'provider') !== Boolean(value.providerRouteKey)) {
    context.addIssue({ code: 'custom', message: 'Only provider runtime bindings carry a provider route key.' })
  }
  if (value.providerAuthorityRequired !== (value.operationKind === 'provider')) {
    context.addIssue({ code: 'custom', message: 'Provider runtime bindings require explicit provider authority.' })
  }
  if (value.toolAuthorityRequired !== (value.operationKind === 'tool')) {
    context.addIssue({ code: 'custom', message: 'Tool runtime bindings require explicit tool authority.' })
  }
  if (value.operationKind === 'no_action' && value.createsMedia) {
    context.addIssue({ code: 'custom', message: 'A no-action runtime binding cannot create media.' })
  }
  if (!value.approvalRequired) {
    context.addIssue({ code: 'custom', message: 'Runtime bindings cannot bypass exact plan approval.' })
  }
  const expectedEnvironment = value.adapterClass === 'internal_qualification_adapter'
    ? 'internal_fixture'
    : value.adapterClass === 'canonical_private_execution_adapter'
      ? 'canonical_private'
      : 'production_server'
  if (value.environmentClass !== expectedEnvironment) {
    context.addIssue({ code: 'custom', message: 'Runtime adapter class is registered for the wrong environment.' })
  }
  if (
    value.adapterClass !== 'internal_qualification_adapter' &&
    !value.privateArtifactRequired
  ) {
    context.addIssue({ code: 'custom', message: 'Canonical and production adapters require private artifact authority.' })
  }
  if (
    value.adapterClass === 'production_worker_adapter' &&
    value.requiredQualification !== 'production_qualified'
  ) {
    context.addIssue({ code: 'custom', message: 'Production worker adapters require production qualification.' })
  }
})

export const skillJobRuntimeBindingDefinitionSchema = skillJobRuntimeBindingCoreSchema.extend({
  bindingHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { bindingHash, ...core } = value
  if (hashSkillValue(core) !== bindingHash) {
    context.addIssue({ code: 'custom', message: 'Edit-skill runtime binding hash is stale or forged.' })
  }
})

export type SkillJobRuntimeBindingDefinition = z.infer<
  typeof skillJobRuntimeBindingDefinitionSchema
>

export interface SkillJobRuntimeBinding {
  definition: SkillJobRuntimeBindingDefinition
  handler: SkillJobRuntimeAdapter
}

export interface SkillWorkGraphJobDefinition {
  skillKey: SkillCapabilityManifest['skillKey']
  skillVersion: string
  contractVersion: string
  jobType: string
  operationId: string
  workerClass: string
  expectedOutputType: string
}

export interface SkillRuntimeOperationCatalog {
  toolOperations: ReadonlySet<string>
  providerOperations: ReadonlySet<string>
  sourceOperations: ReadonlySet<string>
  noActionOperations: ReadonlySet<string>
  providerOperationQualifications: ReadonlyMap<string, SkillQualificationStatus>
}

function bindingKey(input: {
  skillKey: string
  skillVersion: string
  contractVersion: string
  jobType: string
  adapterClass: SkillJobRuntimeBindingDefinition['adapterClass']
  environmentClass: SkillJobRuntimeBindingDefinition['environmentClass']
}): string {
  return `${input.skillKey}@${input.skillVersion}:${input.contractVersion}:${input.jobType}:` +
    `${input.adapterClass}:${input.environmentClass}`
}

function manifestKey(input: Pick<SkillCapabilityManifest, 'skillKey' | 'skillVersion' | 'contractVersion'>): string {
  return `${input.skillKey}@${input.skillVersion}:${input.contractVersion}`
}

export function createSkillJobRuntimeBinding(input: {
  definition: z.input<typeof skillJobRuntimeBindingCoreSchema>
  handler: SkillJobRuntimeAdapter
}): SkillJobRuntimeBinding {
  if (typeof input.handler !== 'function') throw new Error('Runtime binding requires an executable adapter.')
  const core = skillJobRuntimeBindingCoreSchema.parse(input.definition)
  return {
    definition: skillJobRuntimeBindingDefinitionSchema.parse({
      ...core,
      bindingHash: hashSkillValue(core),
    }),
    handler: input.handler,
  }
}

export class SkillJobRuntimeBindingRegistry {
  readonly #bindings = new Map<string, SkillJobRuntimeBinding>()

  register(bindingInput: SkillJobRuntimeBinding): void {
    if (typeof bindingInput.handler !== 'function') {
      throw new Error('Runtime binding requires an executable adapter.')
    }
    const definition = skillJobRuntimeBindingDefinitionSchema.parse(bindingInput.definition)
    const key = bindingKey(definition)
    if (this.#bindings.has(key)) throw new Error(`Duplicate runtime binding for ${key}.`)
    if ([...this.#bindings.values()].some((binding) =>
      manifestKey(binding.definition) === manifestKey(definition) &&
      binding.definition.runtimeAdapterId === definition.runtimeAdapterId)) {
      throw new Error(`Duplicate runtime adapter identity ${definition.runtimeAdapterId}.`)
    }
    this.#bindings.set(key, { definition, handler: bindingInput.handler })
  }

  resolve(input: {
    manifestRef: SkillManifestReference
    jobType: string
    adapterClass: SkillJobRuntimeBindingDefinition['adapterClass']
    environmentClass: SkillJobRuntimeBindingDefinition['environmentClass']
  }): SkillJobRuntimeBinding {
    const binding = this.#bindings.get(bindingKey({
      ...input.manifestRef,
      jobType: input.jobType,
      adapterClass: input.adapterClass,
      environmentClass: input.environmentClass,
    }))
    if (!binding || binding.definition.manifestHash !== input.manifestRef.manifestHash) {
      throw new Error('Exact manifest job runtime binding is unavailable or stale.')
    }
    return binding
  }

  list(): readonly SkillJobRuntimeBinding[] {
    return [...this.#bindings.values()]
  }

  validateManifest(input: {
    manifest: Readonly<SkillCapabilityManifest>
    artifacts: EditSkillArtifactSchemaRegistry
    operations: SkillRuntimeOperationCatalog
    workGraphJobs: readonly SkillWorkGraphJobDefinition[]
  }): void {
    const manifest = input.manifest
    const bindings = this.list().filter((binding) =>
      manifestKey(binding.definition) === manifestKey(manifest))
    const manifestJobTypes = manifestSupportedJobTypeIds(manifest)
    const manifestJobs = new Set(manifestJobTypes)
    const bindingGroups = new Map<string, SkillJobRuntimeBinding[]>()
    for (const binding of bindings) {
      const groupKey = `${binding.definition.adapterClass}:${binding.definition.environmentClass}`
      const group = bindingGroups.get(groupKey) ?? []
      group.push(binding)
      bindingGroups.set(groupKey, group)
    }
    if (bindingGroups.size === 0) {
      throw new Error(`Manifest ${manifest.skillKey} has no runtime binding class.`)
    }
    for (const [groupKey, group] of bindingGroups) {
      const bindingJobs = new Set(group.map((binding) => binding.definition.jobType))
      if (group.length !== bindingJobs.size) {
        throw new Error(`Manifest ${manifest.skillKey} has duplicate runtime bindings in ${groupKey}.`)
      }
      for (const jobType of manifestJobs) {
        if (!bindingJobs.has(jobType)) {
          throw new Error(`Manifest supported job ${jobType} has no runtime binding in ${groupKey}.`)
        }
      }
      for (const jobType of bindingJobs) {
        if (!manifestJobs.has(jobType)) {
          throw new Error(`Runtime binding ${jobType} has no manifest-supported job.`)
        }
      }
    }
    const graphJobs = input.workGraphJobs.filter((job) => manifestKey(job) === manifestKey(manifest))
    if (new Set(graphJobs.map((job) => job.jobType)).size !== graphJobs.length) {
      throw new Error(`Manifest ${manifest.skillKey} has duplicate canonical work-graph jobs.`)
    }
    const graphByJob = new Map(graphJobs.map((job) => [job.jobType, job]))
    if (graphByJob.size !== manifestJobs.size) {
      throw new Error(`Manifest ${manifest.skillKey} work graph does not cover every supported job.`)
    }
    const manifestArtifactTypes = new Set([
      ...manifest.acceptedArtifactTypes,
      ...manifest.producedArtifactTypes,
    ])
    const allowedPhases = new Set(manifestAllowedExecutionPhaseIds(manifest))
    const manifestQualificationRank = ACTIVE_QUALIFICATION_RANK[manifest.qualificationStatus]
    if (manifestQualificationRank === undefined) {
      throw new Error(`Manifest ${manifest.skillKey} cannot expose runtime bindings at ${manifest.qualificationStatus}.`)
    }
    for (const binding of bindings) {
      const definition = binding.definition
      if (
        definition.manifestHash !== manifest.manifestHash ||
        definition.skillKey !== manifest.skillKey ||
        definition.skillVersion !== manifest.skillVersion ||
        definition.contractVersion !== manifest.contractVersion
      ) throw new Error(`Runtime binding ${definition.jobType} is bound to a stale manifest.`)
      if (typeof binding.handler !== 'function') {
        throw new Error(`Runtime binding ${definition.jobType} has no executable adapter.`)
      }
      const graphJob = graphByJob.get(definition.jobType)
      if (!graphJob) throw new Error(`Runtime binding ${definition.jobType} has no canonical work-graph job.`)
      if (definition.operationId !== graphJob.operationId) {
        throw new Error(`Runtime binding ${definition.jobType} operation differs from the work graph.`)
      }
      if (definition.workerClass !== graphJob.workerClass) {
        throw new Error(`Runtime binding ${definition.jobType} worker class differs from the work graph.`)
      }
      if (
        definition.outputArtifactTypes.length !== 1 ||
        definition.outputArtifactTypes[0] !== graphJob.expectedOutputType
      ) throw new Error(`Runtime binding ${definition.jobType} output differs from the work graph.`)
      for (const artifactType of [
        ...definition.inputArtifactTypes,
        ...definition.outputArtifactTypes,
      ]) {
        if (!manifestArtifactTypes.has(artifactType) || !input.artifacts.has(artifactType)) {
          throw new Error(`Runtime binding ${definition.jobType} references unknown artifact ${artifactType}.`)
        }
      }
      if (definition.allowedPhases.some((phase) => !allowedPhases.has(phase))) {
        throw new Error(`Runtime binding ${definition.jobType} references a disallowed phase.`)
      }
      if (manifest.schemaVersion === 'skill-capability-manifest-v2') {
        const jobCapability = manifest.supportedJobTypes.find((job) =>
          job.jobType === definition.jobType)
        if (
          !jobCapability ||
          !jobCapability.executionAllowed ||
          !jobCapability.runtimeBindingRequired ||
          hashSkillValue(jobCapability.requiredArtifactTypes) !== hashSkillValue(definition.inputArtifactTypes) ||
          hashSkillValue(jobCapability.producedArtifactTypes) !== hashSkillValue(definition.outputArtifactTypes) ||
          hashSkillValue(jobCapability.allowedPhases) !== hashSkillValue(definition.allowedPhases) ||
          jobCapability.minimumQualificationStatus !== definition.requiredQualification ||
          jobCapability.primaryVisualOwnershipPossible !== definition.createsMedia
        ) throw new Error(`Runtime binding ${definition.jobType} differs from its manifest job capability.`)
      }
      const requiredRank = ACTIVE_QUALIFICATION_RANK[definition.requiredQualification]
      if (requiredRank === undefined || requiredRank > manifestQualificationRank) {
        throw new Error(`Runtime binding ${definition.jobType} exceeds the manifest qualification.`)
      }
      if (!definition.approvalRequired) {
        throw new Error(`Runtime binding ${definition.jobType} bypasses approval.`)
      }
      if (definition.callerSelectedExecutableAllowed) {
        throw new Error(`Runtime binding ${definition.jobType} permits a caller-selected executable.`)
      }
      if (!definition.mutatesOnlyAssignmentRange) {
        throw new Error(`Runtime binding ${definition.jobType} can mutate outside the assignment.`)
      }
      if (definition.operationKind === 'no_action' && definition.createsMedia) {
        throw new Error(`No-action runtime binding ${definition.jobType} creates media.`)
      }
      if (definition.providerAuthorityRequired !== (definition.operationKind === 'provider')) {
        throw new Error(`Runtime binding ${definition.jobType} has invalid provider authority requirements.`)
      }
      if (definition.toolAuthorityRequired !== (definition.operationKind === 'tool')) {
        throw new Error(`Runtime binding ${definition.jobType} has invalid tool authority requirements.`)
      }
      if (
        definition.adapterClass !== 'internal_qualification_adapter' &&
        !definition.privateArtifactRequired
      ) throw new Error(`Runtime binding ${definition.jobType} lacks private artifact authority.`)
      if (
        definition.operationKind === 'tool' &&
        !input.operations.toolOperations.has(definition.operationId)
      ) throw new Error(`Runtime binding ${definition.jobType} references an unknown tool operation.`)
      if (definition.operationKind === 'source' && !input.operations.sourceOperations.has(definition.operationId)) {
        throw new Error(`Runtime binding ${definition.jobType} references an unknown source operation.`)
      }
      if (definition.operationKind === 'no_action' && !input.operations.noActionOperations.has(definition.operationId)) {
        throw new Error(`Runtime binding ${definition.jobType} references an unknown no-action operation.`)
      }
      if (definition.operationKind === 'provider') {
        const providerQualification = input.operations.providerOperationQualifications.get(
          definition.operationId,
        )
        const providerRank = providerQualification
          ? ACTIVE_QUALIFICATION_RANK[providerQualification]
          : undefined
        if (
          !input.operations.providerOperations.has(definition.operationId) ||
          providerRank === undefined ||
          requiredRank === undefined ||
          providerRank < requiredRank
        ) throw new Error(`Runtime binding ${definition.jobType} references an unqualified provider route.`)
      }
    }
  }
}
