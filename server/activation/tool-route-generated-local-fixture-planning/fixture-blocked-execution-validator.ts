import { TOOL_ROUTE_FIXTURE_NO_SCOPE_STATEMENT, TOOL_ROUTE_FIXTURE_SAFETY_FLAGS } from './tool-route-fixture-planning-policy'
import type {
  FixtureBlockedExecutionValidation,
  FixtureInputOutputContractMap,
  GeneratedLocalFixtureCatalog,
  OwnerFixtureHandoffMap,
} from './tool-route-fixture-planning-types'

const BLOCKED_CATEGORIES = [
  'provider calls',
  'model calls',
  'tool execution',
  'worker execution',
  'route execution',
  'runtime execution',
  'web search',
  'browser capture',
  'map rendering',
  'media processing',
  'audio/SFX/music generation',
  'Track A render/export',
  'Supabase mutation',
  'SQL/migrations/schema/RLS',
  'Google Cloud API calls',
  'Secret Manager API calls',
  'GCS upload/storage transfer',
  'public artifacts',
  'signed URLs and signed URL source-of-truth',
  'raw prompt execution',
  'credit mutation',
  'Stripe checkout/webhook/payment processing',
  'dependency mutation',
  'internal beta unlock',
  'external beta unlock',
  'production unlock',
  'broad service-role handler',
]

export function validateFixtureBlockedExecution(input: {
  catalog: GeneratedLocalFixtureCatalog
  inputOutputContractMap: FixtureInputOutputContractMap
  ownerFixtureHandoffMap: OwnerFixtureHandoffMap
}): FixtureBlockedExecutionValidation {
  const activeBlockers = [
    ...input.catalog.activeBlockers,
    ...input.inputOutputContractMap.activeBlockers,
    ...input.ownerFixtureHandoffMap.activeBlockers,
    ...(input.catalog.fixtures.every((fixture) => Object.values(fixture.executionFlags).every((value) => value === false))
      ? []
      : ['unsafe_fixture_execution_flag_detected']),
    ...(input.inputOutputContractMap.contracts.every((contract) =>
      !contract.publicArtifactAllowed &&
      !contract.signedUrlSourceOfTruthAllowed &&
      !contract.rawPromptAllowed,
    )
      ? []
      : ['unsafe_contract_execution_or_public_flag_detected']),
    ...(input.ownerFixtureHandoffMap.handoffs.every((handoff) => !handoff.executionAuthorized)
      ? []
      : ['unsafe_handoff_execution_authorized']),
  ]

  return {
    phase: 'TOOL_ROUTE_2',
    status: activeBlockers.length > 0 ? 'blocked' : 'passed',
    blockedCategories: BLOCKED_CATEGORIES,
    safetyFlags: TOOL_ROUTE_FIXTURE_SAFETY_FLAGS,
    allExecutionBlocked: true,
    noScopeStatement: TOOL_ROUTE_FIXTURE_NO_SCOPE_STATEMENT,
    activeBlockers,
  }
}
