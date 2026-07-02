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
import type {
  SyntheticFixtureDryRunArtifact,
  SyntheticFixtureDryRunPayloadKind,
  SyntheticFixtureDryRunResult,
} from './synthetic-fixture-dry-run-types'

export type BinaryFixtureGenerationMode =
  | 'in_process_node_only'
  | 'descriptor_only_video_deferred'

export type BinaryFixtureGeneratorName =
  | 'json_buffer_generator'
  | 'wav_pcm_generator'
  | 'png_rgba_generator'
  | 'video_descriptor_json_generator'

export type BinaryFixtureContentType =
  | 'application/json'
  | 'audio/wav'
  | 'image/png'

export type BinaryFixtureGeneratedBy = 'node_standard_library'

export interface BinaryFixtureGenerationOptions {
  cleanup?: boolean
  tempRoot?: string
  allowPersistForDebug?: boolean
  allowExternalTools?: false
  allowShellExecution?: false
}

export interface BinaryFixtureGenerationPlan {
  generationPlanId: string
  sourceDryRunId: string
  sourceFixturePlanId: string
  toolId: ProductionToolId
  operationId: ToolCallingOperationId
  commandIntentId: string
  fixtureIds: readonly string[]
  sourceDryRunArtifacts: readonly SyntheticFixtureDryRunArtifact[]
  generationMode: BinaryFixtureGenerationMode
  allowedGenerators: readonly BinaryFixtureGeneratorName[]
  expectedArtifactTypes: readonly ToolCallingArtifactType[]
  expectedStorageBucketPurposes: readonly ProductionStorageBucketPurpose[]
  tempWorkspaceRequired: true
  cleanupRequired: true
  committedArtifactsAllowed: false
  externalToolExecutionAllowed: false
  shellExecutionAllowed: false
  workerExecutionAllowed: false
  mediaProcessingAllowed: false
  providerCallsAllowed: false
  supabaseMutationAllowed: false
  sqlAllowed: false
  signedUrlsAllowed: false
  packageLockMutationAllowed: false
  executesTools: false
}

export interface BinaryFixtureGeneratedArtifactBuffer {
  contentBuffer: Buffer
  contentType: BinaryFixtureContentType
  generatorName: BinaryFixtureGeneratorName
  payloadKind: SyntheticFixtureDryRunPayloadKind
  generatedBy: BinaryFixtureGeneratedBy
  generatedBinary: boolean
  descriptorOnly: boolean
  videoBinaryDeferred: boolean
  binaryMediaGenerated: boolean
}

export interface BinaryFixtureArtifactSummary {
  artifactSummaryId: string
  sourceDryRunArtifactId: string
  fixtureId: string
  fixtureKind: SyntheticFixtureKind
  artifactType: ToolCallingArtifactType
  storageBucketPurpose: ProductionStorageBucketPurpose
  toolId: ProductionToolId
  operationId: ToolCallingOperationId
  commandIntentId: string
  contentType: BinaryFixtureContentType
  generatorName: BinaryFixtureGeneratorName
  payloadKind: SyntheticFixtureDryRunPayloadKind
  checksum: string
  sizeBytes: number
  generatedBy: BinaryFixtureGeneratedBy
  generatedBinary: boolean
  descriptorOnly: boolean
  videoBinaryDeferred: boolean
  binaryMediaGenerated: boolean
  privateByDefault: true
  sourceOfTruth: true
  signedUrlAllowed: false
  tempPathExposed: false
  committedToRepo: false
  externalToolExecutionPerformed: false
  shellExecutionPerformed: false
  workerExecutionPerformed: false
  mediaProcessingPerformed: false
}

export interface BinaryFixtureGenerationResult {
  generationResultId: string
  generationPlanId: string
  sourceDryRunId: string
  sourceFixturePlanId: string
  toolId: ProductionToolId
  operationId: ToolCallingOperationId
  commandIntentId: string
  fixtureIds: readonly string[]
  artifactSummaries: readonly BinaryFixtureArtifactSummary[]
  tempWorkspaceCreated: true
  tempWorkspaceCleanedUp: boolean
  tempPathExposed: false
  generatedFileCount: number
  generatedBinaryCount: number
  generatedJsonCount: number
  descriptorOnlyCount: number
  videoBinaryDeferredCount: number
  writesCommittedArtifacts: false
  externalToolExecutionPerformed: false
  shellExecutionPerformed: false
  workerExecutionPerformed: false
  mediaProcessingPerformed: false
  providerCallsPerformed: false
  supabaseMutationPerformed: false
  sqlExecuted: false
  signedUrlsCreated: false
  packageLockMutated: false
  executesTools: false
}

export interface BinaryFixtureGenerationValidationSummary {
  ok: boolean
  generationPlanCount: number
  generationResultCount: number
  artifactSummaryCount: number
  generatedFileCount: number
  generatedBinaryCount: number
  generatedJsonCount: number
  descriptorOnlyCount: number
  videoBinaryDeferredCount: number
  forbiddenFieldsFound: readonly string[]
  unsafeStringValues: readonly string[]
  missingArtifactFields: readonly string[]
  invalidArtifactFindings: readonly string[]
  nonFirstClassToolIds: readonly string[]
  pendingExternalToolsUsed: boolean
  uncleanedTempWorkspaces: readonly string[]
  packageLockStaged: boolean
  packageLockMutated: boolean
  allTempWorkspacesCleanedUp: boolean
  videoBinaryOutputGenerated: boolean
  externalToolExecutionPerformed: false
  shellExecutionPerformed: false
  workerExecutionPerformed: false
  mediaProcessingPerformed: false
  providerCallsPerformed: false
  supabaseMutationPerformed: false
  sqlExecuted: false
  signedUrlsCreated: false
  executesTools: false
}

export interface BinaryFixtureGenerationRunSummary {
  generationPlans: readonly BinaryFixtureGenerationPlan[]
  generationResults: readonly BinaryFixtureGenerationResult[]
  validationSummary: BinaryFixtureGenerationValidationSummary
  sourceDryRunResults: readonly SyntheticFixtureDryRunResult[]
  executesTools: false
}
