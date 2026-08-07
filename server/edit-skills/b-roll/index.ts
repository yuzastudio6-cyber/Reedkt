import type {
  EditSkillArtifactSchemaRegistry,
  EditSkillArtifactStore,
} from '../core/edit-skill-artifact-store'
import type { EditSkillPluginRegistry } from '../core/edit-skill-plugin-registry'
import type {
  SkillJobRuntimeBindingRegistry,
  SkillWorkGraphJobDefinition,
} from '../core/edit-skill-runtime-binding'
import type { SkillCapabilityRegistry } from '../core/skill-capability-registry'
import type { SkillReferenceCatalog } from '../core/skill-capability-validator'
import type { SkillEstimatorRegistry } from '../core/skill-estimator-registry'
import type { SkillQaRegistry } from '../core/skill-qa-registry'
import type { SkillQualificationRegistry } from '../core/skill-qualification-registry'
import { registerBrollArtifactSchemas } from './b-roll-artifact-types'
import {
  BROLL_CAPABILITY_MANIFEST,
  BROLL_JOB_TYPES,
  BROLL_NO_ACTION_OPERATIONS,
  BROLL_PHASES,
  BROLL_PROVIDER_OPERATIONS,
  BROLL_SOURCE_OPERATIONS,
  BROLL_TOOL_OPERATIONS,
} from './b-roll-capability-manifest'
import { registerBrollQaPolicies } from './b-roll-qa-policy'
import {
  BROLL_WORK_GRAPH_JOB_DEFINITIONS,
  registerBrollRuntimeBindings,
} from './b-roll-runtime-bindings'
import { tryLoadBrollGeneratedQualificationArtifact } from './b-roll-qualification-evidence'
import { computeBrollQualificationDependencyAuthorityHashes } from './b-roll-qualification-dependency-authorities'
import { computeBrollRelevantSourceTreeHash } from './b-roll-qualification-source-hash'
import { BrollEditSkillPlugin } from './b-roll-edit-skill-plugin'
import { BrollSkillService } from './b-roll-skill-service'

export * from './b-roll-artifact-types'
export * from './b-roll-active-artifact-contracts'
export * from './b-roll-capability-manifest'
export * from './b-roll-canonical-plan-component'
export * from './b-roll-qa-policy'
export * from './b-roll-planning-qa'
export * from './b-roll-qualification'
export * from './b-roll-qualification-evidence'
export * from './b-roll-qualification-dependency-authorities'
export * from './b-roll-qualification-source-hash'
export * from './b-roll-skill-service'
export * from './b-roll-context-loader'
export * from './b-roll-contracts'
export * from './b-roll-candidate-attempt'
export * from './b-roll-candidate-qa'
export * from './b-roll-candidate-refinement'
export * from './b-roll-caption-public-contract'
export * from './b-roll-canonical-private-runtime'
export * from './b-roll-existing-source-execution'
export * from './b-roll-edit-skill-plugin'
export * from './b-roll-input-authorities'
export * from './b-roll-master-timing-projection-binding'
export * from './b-roll-remotion-integration'
export * from './b-roll-runtime-bindings'
export * from './b-roll-track-graph-dependency'
export * from './b-roll-plan-compiler'
export * from './b-roll-schemas'
export * from './b-roll-work-graph-compiler'
export * from './b-roll-visual-intelligence-dependency'

export function registerBrollSkill(input: {
  capabilities: SkillCapabilityRegistry
  estimators: SkillEstimatorRegistry
  qa: SkillQaRegistry
  artifacts: EditSkillArtifactSchemaRegistry
  artifactStore: EditSkillArtifactStore
  plugins: EditSkillPluginRegistry
  runtimeBindings: SkillJobRuntimeBindingRegistry
  workGraphJobs: SkillWorkGraphJobDefinition[]
  qualifications: SkillQualificationRegistry
  catalog: SkillReferenceCatalog
}): void {
  const qualificationGenerationMode =
    process.env.REEDITPRO_BROLL_QUALIFICATION_GENERATING === '1'
  let generatedQualification
  try {
    generatedQualification = tryLoadBrollGeneratedQualificationArtifact({
      manifest: BROLL_CAPABILITY_MANIFEST,
      expectedRelevantSourceTreeHash: computeBrollRelevantSourceTreeHash(),
      expectedDependencyAuthorityHashes:
        computeBrollQualificationDependencyAuthorityHashes(),
    })
  } catch (error) {
    if (!qualificationGenerationMode) throw error
    generatedQualification = undefined
  }
  if (!generatedQualification && !qualificationGenerationMode) {
    throw new Error(
      'B-roll runtime is unqualified: run npm run qualify:b-roll:internal for this exact source tree.',
    )
  }
  registerBrollArtifactSchemas(input.artifacts)
  registerBrollQaPolicies(input.qa)
  input.estimators.registerTime('b_roll.time.v1', (estimateInput) => {
    if (estimateInput.noAction === true) {
      return {
        minimumSeconds: 0,
        expectedSeconds: 0,
        maximumSeconds: 0,
        evidence: ['validation_and_no_action_only'],
      }
    }
    const durationFrames = typeof estimateInput.durationFrames === 'number' ? estimateInput.durationFrames : 0
    const provider = estimateInput.providerRequired === true
    const expectedSeconds = Math.max(1, Math.ceil(durationFrames / 24)) + (provider ? 120 : 15)
    return {
      minimumSeconds: Math.max(1, Math.floor(expectedSeconds * 0.5)),
      expectedSeconds,
      maximumSeconds: expectedSeconds * 3,
      evidence: ['range_duration', provider ? 'provider_route' : 'source_or_no_action_route'],
    }
  })
  input.estimators.registerCredit('b_roll.credit.v1', (estimateInput) => {
    const provider = estimateInput.providerRequired === true
    const expectedCredits = provider ? 20 : estimateInput.noAction === true ? 0 : 2
    return {
      minimumCredits: expectedCredits === 0 ? 0 : 1,
      expectedCredits,
      maximumCredits: provider ? 40 : expectedCredits,
      internalToolCostOnly: true,
      evidence: [provider ? 'gemini_omni_candidate_plus_normalization' : 'deterministic_source_route'],
    }
  })
  for (const value of BROLL_JOB_TYPES) input.catalog.jobTypes.add(value)
  for (const value of BROLL_TOOL_OPERATIONS) input.catalog.toolOperations.add(value)
  for (const value of BROLL_PROVIDER_OPERATIONS) input.catalog.providerOperations.add(value)
  for (const value of BROLL_PROVIDER_OPERATIONS) {
    input.catalog.providerOperationQualifications.set(value, 'internal_execution_qualified')
  }
  for (const value of BROLL_SOURCE_OPERATIONS) input.catalog.sourceOperations.add(value)
  for (const value of BROLL_NO_ACTION_OPERATIONS) input.catalog.noActionOperations.add(value)
  for (const value of BROLL_PHASES) input.catalog.phases.add(value)
  input.capabilities.registerManifest(BROLL_CAPABILITY_MANIFEST)
  registerBrollRuntimeBindings(input.runtimeBindings)
  input.workGraphJobs.push(...BROLL_WORK_GRAPH_JOB_DEFINITIONS)
  const service = new BrollSkillService({
    artifacts: input.artifactStore,
    estimators: input.estimators,
    qa: input.qa,
  })
  input.capabilities.registerHandler({
    skillKey: 'b_roll',
    skillVersion: '1.0.0',
    handler: service,
  })
  input.plugins.register(new BrollEditSkillPlugin({
    artifacts: input.artifactStore,
    estimators: input.estimators,
    qa: input.qa,
  }))
  if (generatedQualification) {
    input.qualifications.register(generatedQualification.receipt)
    if (generatedQualification.receipt.qualificationStatus === 'internal_execution_qualified') {
      input.qualifications.assertClaim(
        input.capabilities.referenceFor('b_roll'),
        BROLL_CAPABILITY_MANIFEST.qualificationStatus,
      )
    } else if (!qualificationGenerationMode) {
      throw new Error('B-roll runtime is unqualified: generated receipt is planning-only.')
    }
  }
}
