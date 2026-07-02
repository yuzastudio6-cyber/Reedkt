import type {
  ProductionStorageBucketPurpose,
} from '../../src/backend/contracts/production-tool-runtime-contracts'
import type {
  ToolCallingArtifactType,
} from './operation-ontology'
import type {
  ToolAdapterPlan,
} from './adapter-contract-types'
import {
  findCommandIntentPolicyForToolOperation,
  getCommandIntentPolicy,
  listCommandIntentPolicies,
} from './safe-command-plan-policy'
import type {
  CommandIntentPolicy,
  SafeCommandArtifactExpectation,
  SafeCommandArtifactRequirement,
  SafeCommandPlan,
} from './safe-command-plan-types'

function bucketPurposeForArtifact(artifactType: ToolCallingArtifactType): ProductionStorageBucketPurpose {
  switch (artifactType) {
    case 'source_media':
      return 'source_media'
    case 'proxy_media':
    case 'proxy_video':
      return 'proxy_media'
    case 'transcript_json':
    case 'word_timestamps_json':
    case 'caption_segments_json':
      return 'transcripts'
    case 'mask':
    case 'mask_image':
    case 'mask_sequence':
    case 'rgba_cutout':
      return 'masks'
    case 'image':
    case 'image_asset':
    case 'keyframe_image':
    case 'representative_frame':
    case 'enhanced_video':
    case 'interpolated_video':
    case 'processed_video':
    case 'render_manifest':
      return 'generated_assets'
    case 'preview_video':
      return 'previews'
    case 'final_export':
      return 'final_exports'
    case 'qa_report':
      return 'qa_artifacts'
    case 'temp_file':
      return 'worker_temp'
    default:
      return 'analysis_artifacts'
  }
}

function inputRequirementForArtifactRef(input: ToolAdapterPlan['inputArtifactRefs'][number]): SafeCommandArtifactRequirement {
  return {
    artifactType: input.artifactType,
    artifactRefId: input.refId,
    source: input.source,
    storageReferenceRequired: true,
    privateArtifactRefsOnly: true,
  }
}

function outputExpectationForArtifact(artifactType: ToolCallingArtifactType): SafeCommandArtifactExpectation {
  return {
    artifactType,
    storageBucketPurpose: bucketPurposeForArtifact(artifactType),
    storageReferenceRequired: true,
  }
}

function buildCommandPlanId(adapterPlan: ToolAdapterPlan, intentPolicy: CommandIntentPolicy): string {
  return `${adapterPlan.adapterPlanId}_${intentPolicy.commandIntentId}`
}

export function buildSafeCommandPlanForAdapterPlan(adapterPlan: ToolAdapterPlan): SafeCommandPlan {
  const intentPolicy = findCommandIntentPolicyForToolOperation(adapterPlan.toolId, adapterPlan.operationId)
  if (!intentPolicy) {
    throw new Error(`No safe command intent policy for ${adapterPlan.toolId} ${adapterPlan.operationId}.`)
  }

  return {
    commandPlanId: buildCommandPlanId(adapterPlan, intentPolicy),
    adapterPlanId: adapterPlan.adapterPlanId,
    toolId: adapterPlan.toolId,
    operationId: adapterPlan.operationId,
    commandIntentId: intentPolicy.commandIntentId,
    workerType: adapterPlan.workerType,
    executionMode: 'planning_only',
    allowedParameterSchema: intentPolicy.allowedParameterSchema,
    parameterDefaults: intentPolicy.parameterDefaults,
    inputArtifactRequirements: adapterPlan.inputArtifactRefs.map(inputRequirementForArtifactRef),
    outputArtifactExpectations: adapterPlan.expectedOutputArtifacts.map(outputExpectationForArtifact),
    requiredQualityGates: adapterPlan.requiredQualityGates,
    fallbackToolIds: adapterPlan.fallbackToolIds,
    resourceLimits: intentPolicy.resourceLimits,
    sandboxProfile: intentPolicy.sandboxProfile,
    validationPolicy: intentPolicy.validationPolicy,
    approvedSnapshotRequired: true,
    privateArtifactRefsOnly: true,
    rawPromptAllowed: false,
    signedUrlAllowed: false,
    arbitraryArgsAllowed: false,
    commandExecutionAllowed: false,
    mediaProcessingAllowed: false,
    executesTools: false,
  }
}

export function buildSafeCommandPlansForAdapterPlans(adapterPlans: readonly ToolAdapterPlan[]): SafeCommandPlan[] {
  return adapterPlans.map(buildSafeCommandPlanForAdapterPlan)
}

export {
  getCommandIntentPolicy,
  listCommandIntentPolicies,
}
