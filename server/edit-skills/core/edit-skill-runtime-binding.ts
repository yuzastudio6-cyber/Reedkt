import { z } from 'zod'

import type { EditSkillArtifactSchemaRegistry } from './edit-skill-artifact-store'
import { EDIT_SKILL_KEYS, type SkillQualificationStatus } from './edit-skill-ids'
import { hashSkillValue } from './skill-capability-manifest-hash'
import {
  skillIdentitySchema,
  skillSha256Schema,
  skillSemverSchema,
} from './skill-capability-manifest-schema'
import type { SkillCapabilityManifest, SkillManifestReference } from './skill-capability-manifest-types'

export interface SkillJobRuntimeInvocation {
  mode: 'internal_fixture'
  binding: SkillJobRuntimeBindingDefinition
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
  failureCode?: string
}

export type SkillJobRuntimeAdapter = (
  input: SkillJobRuntimeInvocation,
) => Promise<SkillJobRuntimeAdapterResult>

const skillJobRuntimeBindingCoreSchema = z.object({
  schemaVersion: z.literal('edit-skill-runtime-binding-v1'),
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
  qualificationRequirement: z.enum([
    'declared',
    'implementation_pending',
    'planning_qualified',
    'internal_execution_qualified',
    'production_qualified',
  ]),
  runtimeAdapterId: skillIdentitySchema,
  bindingKind: z.enum(['executable', 'no_action']),
  approvalRequired: z.boolean(),
  qualificationRequired: z.literal(true),
  callerSelectedExecutableAllowed: z.literal(false),
  mutatesOnlyAssignmentRange: z.literal(true),
  createsMedia: z.boolean(),
  providerRouteKey: skillIdentitySchema.optional(),
}).strict().superRefine((value, context) => {
  if ((value.operationKind === 'provider') !== Boolean(value.providerRouteKey)) {
    context.addIssue({ code: 'custom', message: 'Only provider runtime bindings carry a provider route key.' })
  }
  if (value.bindingKind === 'no_action' && (value.operationKind !== 'no_action' || value.createsMedia)) {
    context.addIssue({ code: 'custom', message: 'A no-action runtime binding cannot create media or invoke another operation kind.' })
  }
  if (value.bindingKind === 'executable' && !value.approvalRequired) {
    context.addIssue({ code: 'custom', message: 'Executable runtime bindings cannot bypass exact plan approval.' })
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

const ACTIVE_QUALIFICATION_RANK: Readonly<Partial<Record<SkillQualificationStatus, number>>> = {
  declared: 0,
  implementation_pending: 1,
  planning_qualified: 2,
  internal_execution_qualified: 3,
  production_qualified: 4,
}

function bindingKey(input: {
  skillKey: string
  skillVersion: string
  contractVersion: string
  jobType: string
}): string {
  return `${input.skillKey}@${input.skillVersion}:${input.contractVersion}:${input.jobType}`
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
  }): SkillJobRuntimeBinding {
    const binding = this.#bindings.get(bindingKey({ ...input.manifestRef, jobType: input.jobType }))
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
    const manifestJobs = new Set(manifest.supportedJobTypes)
    const bindingJobs = new Set(bindings.map((binding) => binding.definition.jobType))
    if (bindings.length !== bindingJobs.size) {
      throw new Error(`Manifest ${manifest.skillKey} has duplicate runtime bindings.`)
    }
    for (const jobType of manifestJobs) {
      if (!bindingJobs.has(jobType)) {
        throw new Error(`Manifest supported job ${jobType} has no runtime binding.`)
      }
    }
    for (const jobType of bindingJobs) {
      if (!manifestJobs.has(jobType)) {
        throw new Error(`Runtime binding ${jobType} has no manifest-supported job.`)
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
    const allowedPhases = new Set(manifest.allowedExecutionPhases)
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
      const requiredRank = ACTIVE_QUALIFICATION_RANK[definition.qualificationRequirement]
      if (requiredRank === undefined || requiredRank > manifestQualificationRank) {
        throw new Error(`Runtime binding ${definition.jobType} exceeds the manifest qualification.`)
      }
      if (!definition.approvalRequired || !definition.qualificationRequired) {
        throw new Error(`Runtime binding ${definition.jobType} bypasses approval or qualification.`)
      }
      if (definition.callerSelectedExecutableAllowed) {
        throw new Error(`Runtime binding ${definition.jobType} permits a caller-selected executable.`)
      }
      if (!definition.mutatesOnlyAssignmentRange) {
        throw new Error(`Runtime binding ${definition.jobType} can mutate outside the assignment.`)
      }
      if (definition.bindingKind === 'no_action' && definition.createsMedia) {
        throw new Error(`No-action runtime binding ${definition.jobType} creates media.`)
      }
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
