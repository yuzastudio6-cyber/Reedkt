import type {
  ProductionToolId,
} from '../tool-registry'
import type {
  ProductionStorageBucketPurpose,
  QualityGateType,
} from '../../src/backend/contracts/production-tool-runtime-contracts'
import type {
  ToolCallingArtifactType,
  ToolCallingOperationId,
} from './operation-ontology'
import type {
  SafeCommandArtifactExpectation,
  SafeCommandArtifactRequirement,
  SafeCommandResourceLimits,
} from './safe-command-plan-types'

export type SyntheticFixtureKind =
  | 'synthetic_video'
  | 'synthetic_audio'
  | 'synthetic_image'
  | 'synthetic_timeline'
  | 'synthetic_caption_segments'
  | 'synthetic_mask'
  | 'synthetic_json'
  | 'synthetic_render_manifest'

export interface SyntheticFixtureValidationPolicy {
  rejectForbiddenFieldNames: true
  rejectAbsoluteLocalPaths: true
  rejectHttpUrls: true
  rejectShellMetacharacters: true
  requireFutureOnly: true
  requirePrivateArtifactRefs: true
  requireStorageBucketPurposes: true
  requireQualityGates: true
}

export interface SyntheticFixtureDefinition {
  fixtureId: string
  fixtureKind: SyntheticFixtureKind
  description: string
  applicableOperationIds: readonly ToolCallingOperationId[]
  applicableCommandIntentIds: readonly string[]
  applicableToolIds: readonly ProductionToolId[]
  generatedInFutureOnly: true
  fixtureGenerationAllowedNow: false
  toolExecutionAllowedNow: false
  mediaProcessingAllowedNow: false
  workerExecutionAllowedNow: false
  privateArtifactRefsOnly: true
  signedUrlsAllowed: false
  rawPromptAllowed: false
  maxDurationSeconds?: number
  maxWidth?: number
  maxHeight?: number
  maxFrameCount?: number
  maxBytes?: number
  expectedArtifactTypes: readonly ToolCallingArtifactType[]
  expectedStorageBucketPurposes: readonly ProductionStorageBucketPurpose[]
  expectedSignals: readonly string[]
  requiredQualityGates: readonly QualityGateType[]
  validationPolicy: SyntheticFixtureValidationPolicy
  safetyNotes: readonly string[]
}

export interface SyntheticFixturePlan {
  fixturePlanId: string
  sourceCommandPlanId: string
  adapterPlanId: string
  toolId: ProductionToolId
  operationId: ToolCallingOperationId
  commandIntentId: string
  fixtureIds: readonly string[]
  fixtureDefinitions: readonly SyntheticFixtureDefinition[]
  expectedInputArtifacts: readonly SafeCommandArtifactRequirement[]
  expectedOutputArtifacts: readonly SafeCommandArtifactExpectation[]
  requiredQualityGates: readonly QualityGateType[]
  validationPolicy: SyntheticFixtureValidationPolicy
  resourceLimits: SafeCommandResourceLimits
  generatedInFutureOnly: true
  fixtureGenerationAllowedNow: false
  toolExecutionAllowedNow: false
  mediaProcessingAllowedNow: false
  workerExecutionAllowedNow: false
  privateArtifactRefsOnly: true
  signedUrlsAllowed: false
  rawPromptAllowed: false
  executesTools: false
}

export interface SyntheticFixturePlanValidationSummary {
  ok: boolean
  fixtureDefinitionCount: number
  fixturePlanCount: number
  forbiddenFieldsFound: readonly string[]
  unsafeStringValues: readonly string[]
  missingFixtureMappings: readonly string[]
  pendingExternalToolsUsed: boolean
  allFixturesFutureOnly: boolean
  fixtureGenerationAllowedNow: false
  toolExecutionAllowedNow: false
  mediaProcessingAllowedNow: false
  workerExecutionAllowedNow: false
  executesTools: false
}
