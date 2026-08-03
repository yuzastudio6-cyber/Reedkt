import type {
  EditSkillArtifactSchemaRegistry,
  EditSkillArtifactStore,
} from '../core/edit-skill-artifact-store'
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
import { createBrollPlanningQualificationReceipt } from './b-roll-qualification'
import { BrollSkillService } from './b-roll-skill-service'

export * from './b-roll-artifact-types'
export * from './b-roll-capability-manifest'
export * from './b-roll-canonical-plan-component'
export * from './b-roll-qa-policy'
export * from './b-roll-qualification'
export * from './b-roll-skill-service'
export * from './b-roll-context-loader'
export * from './b-roll-contracts'
export * from './b-roll-existing-source-execution'
export * from './b-roll-plan-compiler'
export * from './b-roll-schemas'
export * from './b-roll-work-graph-compiler'
export * from './mini-skills/index'

export function registerBrollSkill(input: {
  capabilities: SkillCapabilityRegistry
  estimators: SkillEstimatorRegistry
  qa: SkillQaRegistry
  artifacts: EditSkillArtifactSchemaRegistry
  artifactStore: EditSkillArtifactStore
  qualifications: SkillQualificationRegistry
  catalog: SkillReferenceCatalog
}): void {
  registerBrollArtifactSchemas(input.artifacts)
  registerBrollQaPolicies(input.qa)
  input.estimators.registerTime('b_roll.time.v1', (estimateInput) => {
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
  for (const value of BROLL_SOURCE_OPERATIONS) input.catalog.sourceOperations.add(value)
  for (const value of BROLL_NO_ACTION_OPERATIONS) input.catalog.noActionOperations.add(value)
  for (const value of BROLL_PHASES) input.catalog.phases.add(value)
  input.capabilities.registerManifest(BROLL_CAPABILITY_MANIFEST)
  input.capabilities.registerHandler({
    skillKey: 'b_roll',
    skillVersion: '1.0.0',
    handler: new BrollSkillService({
      artifacts: input.artifactStore,
      estimators: input.estimators,
      qa: input.qa,
    }),
  })
  const receipt = createBrollPlanningQualificationReceipt(BROLL_CAPABILITY_MANIFEST)
  input.qualifications.register(receipt)
  input.qualifications.assertClaim(
    input.capabilities.referenceFor('b_roll'),
    BROLL_CAPABILITY_MANIFEST.qualificationStatus,
  )
}
