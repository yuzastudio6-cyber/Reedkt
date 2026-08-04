import {
  createSkillJobRuntimeBinding,
  type SkillJobRuntimeAdapter,
  type SkillJobRuntimeBinding,
  type SkillJobRuntimeBindingRegistry,
  type SkillWorkGraphJobDefinition,
} from '../core/edit-skill-runtime-binding'
import { hashSkillValue } from '../core/skill-capability-manifest-hash'
import { BROLL_CAPABILITY_MANIFEST } from './b-roll-capability-manifest'
import {
  BROLL_CANONICAL_WORK_DEFINITIONS,
  type BrollCanonicalWorkDefinition,
} from './b-roll-work-graph-compiler'
import type { BrollCanonicalPrivateWorkExecutor } from './b-roll-canonical-private-runtime'

function operationKind(
  definition: BrollCanonicalWorkDefinition,
): 'internal' | 'tool' | 'provider' {
  if (definition.provider) return 'provider'
  if (definition.operationId.startsWith('tool.')) return 'tool'
  return 'internal'
}

function createsMedia(jobType: string): boolean {
  return [
    'prepare_b_roll_source',
    'generate_b_roll_candidate',
    'normalize_b_roll_candidate_with_ffmpeg',
    'render_b_roll_preview',
  ].includes(jobType)
}

function adapterFor(definition: BrollCanonicalWorkDefinition): SkillJobRuntimeAdapter {
  return async (input) => {
    if (
      input.mode !== 'internal_qualification_adapter' ||
      input.environmentClass !== 'internal_fixture' ||
      input.binding.adapterClass !== 'internal_qualification_adapter' ||
      input.binding.jobType !== definition.jobType ||
      input.binding.operationId !== definition.operationId ||
      input.binding.workerClass !== definition.workerClass ||
      input.authorizedPhase !== definition.allowedPhase ||
      input.inputArtifactTypes.some((artifactType) =>
        !definition.inputArtifactTypes.includes(artifactType))
    ) throw new Error(`B-roll runtime adapter ${definition.jobType} rejected unbound fixture work.`)
    return {
      status: 'succeeded',
      outputArtifactTypes: [definition.output],
      evidenceHashes: [hashSkillValue({
        schemaVersion: 'b_roll_runtime_binding_fixture_evidence_v1',
        bindingHash: input.binding.bindingHash,
        assignmentHash: input.assignmentHash,
        workItemHash: input.workItemHash,
        authorizedPhase: input.authorizedPhase,
        inputArtifactTypes: input.inputArtifactTypes,
        providerRequestsExecuted: 0,
        publicArtifactsCreated: 0,
        productionMutations: 0,
      })],
      providerRequestCount: 0,
      publicArtifactCount: 0,
      productionMutationCount: 0,
    }
  }
}

export const BROLL_RUNTIME_BINDINGS: readonly SkillJobRuntimeBinding[] =
  BROLL_CANONICAL_WORK_DEFINITIONS.map((definition) => createSkillJobRuntimeBinding({
    definition: {
      schemaVersion: 'edit-skill-runtime-binding-v2',
      skillKey: BROLL_CAPABILITY_MANIFEST.skillKey,
      skillVersion: BROLL_CAPABILITY_MANIFEST.skillVersion,
      contractVersion: BROLL_CAPABILITY_MANIFEST.contractVersion,
      manifestHash: BROLL_CAPABILITY_MANIFEST.manifestHash,
      jobType: definition.jobType,
      operationId: definition.operationId,
      operationKind: operationKind(definition),
      workerClass: definition.workerClass,
      inputArtifactTypes: [...definition.inputArtifactTypes],
      outputArtifactTypes: [definition.output],
      allowedPhases: [definition.allowedPhase],
      requiredQualification: 'internal_execution_qualified',
      adapterClass: 'internal_qualification_adapter',
      environmentClass: 'internal_fixture',
      runtimeAdapterId: `b_roll.runtime.internal_qualification.${definition.jobType}.v2`,
      approvalRequired: true,
      providerAuthorityRequired: Boolean(definition.provider),
      toolAuthorityRequired: definition.operationId.startsWith('tool.'),
      privateArtifactRequired: false,
      callerSelectedExecutableAllowed: false,
      automaticRetryAllowed: false,
      alternateProviderFallbackAllowed: false,
      mutatesOnlyAssignmentRange: true,
      createsMedia: createsMedia(definition.jobType),
      ...(definition.provider ? { providerRouteKey: 'gemini_omni_flash' } : {}),
    },
    handler: adapterFor(definition),
  }))

export function createBrollCanonicalPrivateRuntimeBindings(
  executor: BrollCanonicalPrivateWorkExecutor,
): readonly SkillJobRuntimeBinding[] {
  return BROLL_CANONICAL_WORK_DEFINITIONS.map((definition) =>
    createSkillJobRuntimeBinding({
      definition: {
        schemaVersion: 'edit-skill-runtime-binding-v2',
        skillKey: BROLL_CAPABILITY_MANIFEST.skillKey,
        skillVersion: BROLL_CAPABILITY_MANIFEST.skillVersion,
        contractVersion: BROLL_CAPABILITY_MANIFEST.contractVersion,
        manifestHash: BROLL_CAPABILITY_MANIFEST.manifestHash,
        jobType: definition.jobType,
        operationId: definition.operationId,
        operationKind: operationKind(definition),
        workerClass: definition.workerClass,
        inputArtifactTypes: [...definition.inputArtifactTypes],
        outputArtifactTypes: [definition.output],
        allowedPhases: [definition.allowedPhase],
        requiredQualification: 'internal_execution_qualified',
        adapterClass: 'canonical_private_execution_adapter',
        environmentClass: 'canonical_private',
        runtimeAdapterId: `b_roll.runtime.canonical_private.${definition.jobType}.v2`,
        approvalRequired: true,
        providerAuthorityRequired: Boolean(definition.provider),
        toolAuthorityRequired: definition.operationId.startsWith('tool.'),
        privateArtifactRequired: true,
        callerSelectedExecutableAllowed: false,
        automaticRetryAllowed: false,
        alternateProviderFallbackAllowed: false,
        mutatesOnlyAssignmentRange: true,
        createsMedia: createsMedia(definition.jobType),
        ...(definition.provider ? { providerRouteKey: 'gemini_omni_flash' } : {}),
      },
      handler: (invocation) => executor.execute(definition, invocation),
    }))
}

export const BROLL_WORK_GRAPH_JOB_DEFINITIONS: readonly SkillWorkGraphJobDefinition[] =
  BROLL_CANONICAL_WORK_DEFINITIONS.map((definition) => ({
    skillKey: BROLL_CAPABILITY_MANIFEST.skillKey,
    skillVersion: BROLL_CAPABILITY_MANIFEST.skillVersion,
    contractVersion: BROLL_CAPABILITY_MANIFEST.contractVersion,
    jobType: definition.jobType,
    operationId: definition.operationId,
    workerClass: definition.workerClass,
    expectedOutputType: definition.output,
  }))

export function registerBrollRuntimeBindings(registry: SkillJobRuntimeBindingRegistry): void {
  for (const binding of BROLL_RUNTIME_BINDINGS) registry.register(binding)
}
