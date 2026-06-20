import type {
  ProductionToolId,
} from '../tool-registry'
import type {
  ProductionStorageBucketPurpose,
} from '../../src/backend/contracts/production-tool-runtime-contracts'
import type {
  ToolCallingArtifactType,
  ToolCallingOperationId,
} from './operation-ontology'
import type {
  SyntheticFixtureKind,
} from './synthetic-fixture-plan-types'

export type SyntheticFixtureDryRunPayloadKind =
  | 'descriptor_json'
  | 'timeline_json'
  | 'transcript_json'
  | 'caption_segments_json'
  | 'render_manifest_json'
  | 'mask_descriptor_json'
  | 'final_delivery_manifest_json'

export type SyntheticFixtureDryRunPayloadJson = Readonly<Record<string, unknown>>

export interface SyntheticFixtureDryRunArtifact {
  dryRunArtifactId: string
  fixtureId: string
  fixtureKind: SyntheticFixtureKind
  artifactType: ToolCallingArtifactType
  storageBucketPurpose: ProductionStorageBucketPurpose
  sourceFixturePlanId: string
  sourceCommandPlanId: string
  sourceToolId: ProductionToolId
  sourceOperationId: ToolCallingOperationId
  sourceCommandIntentId: string
  payloadKind: SyntheticFixtureDryRunPayloadKind
  payloadJson: SyntheticFixtureDryRunPayloadJson
  checksum: string
  sizeBytes: number
  privateByDefault: true
  sourceOfTruth: true
  signedUrlAllowed: false
  localPathAllowed: false
  binaryMediaGenerated: false
  toolExecutionPerformed: false
  mediaProcessingPerformed: false
  workerExecutionPerformed: false
}

export interface SyntheticFixtureDryRunValidationSummary {
  ok: boolean
  dryRunResultCount: number
  dryRunArtifactCount: number
  forbiddenFieldsFound: readonly string[]
  unsafeStringValues: readonly string[]
  missingArtifactFields: readonly string[]
  invalidPayloadKinds: readonly string[]
  pendingExternalToolsUsed: boolean
  generatedJsonOnly: true
  binaryMediaGenerated: false
  fixtureGenerationPerformed: true
  toolExecutionPerformed: false
  shellExecutionPerformed: false
  mediaProcessingPerformed: false
  workerExecutionPerformed: false
  providerCallsPerformed: false
  supabaseMutationPerformed: false
  sqlExecuted: false
  executesTools: false
}

export interface SyntheticFixtureDryRunResult {
  dryRunId: string
  sourceFixturePlanId: string
  toolId: ProductionToolId
  operationId: ToolCallingOperationId
  commandIntentId: string
  fixtureIds: readonly string[]
  artifacts: readonly SyntheticFixtureDryRunArtifact[]
  validationSummary: SyntheticFixtureDryRunValidationSummary
  generatedJsonOnly: true
  binaryMediaGenerated: false
  fixtureGenerationPerformed: true
  toolExecutionPerformed: false
  shellExecutionPerformed: false
  mediaProcessingPerformed: false
  workerExecutionPerformed: false
  providerCallsPerformed: false
  supabaseMutationPerformed: false
  sqlExecuted: false
  executesTools: false
}
