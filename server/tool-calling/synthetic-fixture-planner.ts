import type {
  SafeCommandPlan,
} from './safe-command-plan-types'
import {
  findFixtureDefinitionsForCommandIntent,
} from './synthetic-fixture-catalog'
import type {
  SyntheticFixturePlan,
} from './synthetic-fixture-plan-types'
import {
  validateSyntheticFixturePlan,
} from './synthetic-fixture-plan-validator'

function buildFixturePlanId(commandPlan: SafeCommandPlan): string {
  return `${commandPlan.commandPlanId}_synthetic_fixture_plan`
}

export function buildSyntheticFixturePlanForCommandPlan(commandPlan: SafeCommandPlan): SyntheticFixturePlan {
  const fixtureDefinitions = findFixtureDefinitionsForCommandIntent(commandPlan.commandIntentId)
    .filter((definition) => definition.applicableOperationIds.includes(commandPlan.operationId))
  if (fixtureDefinitions.length === 0) {
    throw new Error(`No synthetic fixture definition for ${commandPlan.commandIntentId} ${commandPlan.operationId}.`)
  }

  const plan: SyntheticFixturePlan = {
    fixturePlanId: buildFixturePlanId(commandPlan),
    sourceCommandPlanId: commandPlan.commandPlanId,
    adapterPlanId: commandPlan.adapterPlanId,
    toolId: commandPlan.toolId,
    operationId: commandPlan.operationId,
    commandIntentId: commandPlan.commandIntentId,
    fixtureIds: fixtureDefinitions.map((definition) => definition.fixtureId),
    fixtureDefinitions,
    expectedInputArtifacts: commandPlan.inputArtifactRequirements,
    expectedOutputArtifacts: commandPlan.outputArtifactExpectations,
    requiredQualityGates: commandPlan.requiredQualityGates,
    validationPolicy: fixtureDefinitions[0].validationPolicy,
    resourceLimits: commandPlan.resourceLimits,
    generatedInFutureOnly: true,
    fixtureGenerationAllowedNow: false,
    toolExecutionAllowedNow: false,
    mediaProcessingAllowedNow: false,
    workerExecutionAllowedNow: false,
    privateArtifactRefsOnly: true,
    signedUrlsAllowed: false,
    rawPromptAllowed: false,
    executesTools: false,
  }

  const validation = validateSyntheticFixturePlan(plan)
  if (!validation.ok) {
    throw new Error(`Synthetic fixture plan validation failed for ${plan.fixturePlanId}.`)
  }

  return plan
}

export function buildSyntheticFixturePlansForCommandPlans(
  commandPlans: readonly SafeCommandPlan[],
): SyntheticFixturePlan[] {
  return commandPlans.map(buildSyntheticFixturePlanForCommandPlan)
}
