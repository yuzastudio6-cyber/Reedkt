import type {
  MediaAssetStorageRecordResult,
  SourceUploadFlowResult,
  UploadPlan,
  UploadPlanResult,
  UploadValidationResult,
} from '../../types/upload'
import {
  getDefaultMockUploadScenario,
  getMockUploadPlanInput,
  getMockUploadScenarioById,
  mockUploadScenarios,
  MOCK_UPLOAD_PROJECT_ID,
} from '../mock/mock-upload-scenarios'
import { MOCK_USER_ID, MOCK_WORKSPACE_ID } from '../mock/mock-service-data'
import {
  createGeneratedAssetRecordFromStorage,
  createMediaAssetRecordFromUploadPlan,
  createReferenceAssetRecordFromUploadPlan,
} from '../storage/media-asset-service'
import { createSourceUploadFlow } from '../storage/source-upload-flow-service'
import { createUploadPlan } from '../storage/upload-plan-service'

export interface MockUploadReadinessFlowResult {
  uploadPlan?: UploadPlan
  validation: UploadValidationResult
  mediaAssetRecord?: MediaAssetStorageRecordResult
  sourceSequenceRecords?: SourceUploadFlowResult
  nextStep: UploadPlanResult['nextStep']
  warnings: string[]
}

export function runMockUploadReadinessFlow(): MockUploadReadinessFlowResult {
  return runMockSourceMediaUploadFlow()
}

export function runMockSourceMediaUploadFlow(): MockUploadReadinessFlowResult {
  const scenario = getDefaultMockUploadScenario()
  const planResult = createUploadPlan(getMockUploadPlanInput(scenario))
  const mediaAssetRecord = planResult.uploadPlan
    ? createMediaAssetRecordFromUploadPlan(planResult.uploadPlan)
    : undefined

  return {
    uploadPlan: planResult.uploadPlan,
    validation: planResult.validation,
    mediaAssetRecord,
    nextStep: planResult.nextStep,
    warnings: mergeWarnings(planResult.warnings, mediaAssetRecord?.warnings),
  }
}

export function runMockReferenceMediaUploadFlow(): MockUploadReadinessFlowResult {
  const scenario = getMockUploadScenarioById('reference-video-upload') ?? getDefaultMockUploadScenario()
  const planResult = createUploadPlan(getMockUploadPlanInput(scenario))
  const mediaAssetRecord = planResult.uploadPlan
    ? createReferenceAssetRecordFromUploadPlan(planResult.uploadPlan)
    : undefined

  return {
    uploadPlan: planResult.uploadPlan,
    validation: planResult.validation,
    mediaAssetRecord,
    nextStep: planResult.nextStep,
    warnings: mergeWarnings(planResult.warnings, mediaAssetRecord?.warnings),
  }
}

export function runMockSourceSequenceUploadFlow(): MockUploadReadinessFlowResult {
  const sourceScenarios = mockUploadScenarios.filter((scenario) =>
    scenario.id === 'source-clip-one' || scenario.id === 'source-clip-two',
  )
  const planResults = sourceScenarios.map((scenario) => createUploadPlan(getMockUploadPlanInput(scenario)))
  const uploadPlans = planResults.flatMap((result) => result.uploadPlan ? [result.uploadPlan] : [])
  const sourceSequenceRecords = createSourceUploadFlow({
    workspaceId: MOCK_WORKSPACE_ID,
    projectId: MOCK_UPLOAD_PROJECT_ID,
    chatSessionId: 'mock-upload-chat-session',
    uploads: uploadPlans.map((uploadPlan) => ({
      uploadPlan,
      uploadedOrder: uploadPlan.uploadedOrder,
    })),
  })

  return {
    uploadPlan: uploadPlans[0],
    validation: planResults[0].validation,
    sourceSequenceRecords,
    nextStep: sourceSequenceRecords.nextStep,
    warnings: mergeWarnings(
      ...planResults.map((result) => result.warnings),
      sourceSequenceRecords.warnings,
    ),
  }
}

export function runMockUploadValidationFailureFlow(): MockUploadReadinessFlowResult {
  const scenario = getMockUploadScenarioById('unsupported-file-type-rejected') ?? getDefaultMockUploadScenario()
  const planResult = createUploadPlan(getMockUploadPlanInput(scenario))

  return {
    uploadPlan: planResult.uploadPlan,
    validation: planResult.validation,
    nextStep: planResult.nextStep,
    warnings: planResult.warnings,
  }
}

export function runMockGeneratedAssetStorageFlow(): MockUploadReadinessFlowResult {
  const scenario = getMockUploadScenarioById('generated-asset-placeholder') ?? getDefaultMockUploadScenario()
  const planResult = createUploadPlan(getMockUploadPlanInput(scenario))
  const mediaAssetRecord = planResult.uploadPlan
    ? createGeneratedAssetRecordFromStorage(planResult.uploadPlan)
    : undefined

  return {
    uploadPlan: planResult.uploadPlan,
    validation: planResult.validation,
    mediaAssetRecord,
    nextStep: planResult.nextStep,
    warnings: mergeWarnings(planResult.warnings, mediaAssetRecord?.warnings),
  }
}

export function runMockMissingWorkspaceUploadFlow(): MockUploadReadinessFlowResult {
  const scenario = getMockUploadScenarioById('missing-workspace-blocked') ?? getDefaultMockUploadScenario()
  const planResult = createUploadPlan(getMockUploadPlanInput(scenario))

  return {
    uploadPlan: planResult.uploadPlan,
    validation: planResult.validation,
    nextStep: planResult.nextStep,
    warnings: planResult.warnings,
  }
}

export function runMockProfileAssetUploadPlanFlow(): MockUploadReadinessFlowResult {
  const scenario = getMockUploadScenarioById('supabase-not-configured-mock-mode') ?? getDefaultMockUploadScenario()
  const planResult = createUploadPlan({
    ...getMockUploadPlanInput(scenario),
    userId: MOCK_USER_ID,
  })

  return {
    uploadPlan: planResult.uploadPlan,
    validation: planResult.validation,
    nextStep: planResult.nextStep,
    warnings: planResult.warnings,
  }
}

function mergeWarnings(...groups: Array<string[] | undefined>): string[] {
  return groups.flatMap((group) => group ?? [])
}
