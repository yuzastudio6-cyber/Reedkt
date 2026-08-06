import type { JSONObject } from '../../src/types'
import type {
  ProductionRegistryWorkerType,
  ProductionToolId,
  ProductionToolInputType,
  ProductionToolOutputType,
} from './production-tool-types'
import type { ProfessionalToolAdapterBoundedExecutionGate } from './professional-tool-adapter-plan'

export interface ProfessionalToolAdapterExecutionActivityResult {
  activityResultId: string
  canonicalToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  userFacingActivity: string
  status: 'completed_private_manifest_handoff'
  privateInputManifestKinds: ProductionToolInputType[]
  privateOutputManifestKinds: ProductionToolOutputType[]
  qaGates: string[]
  privateResultManifest: {
    artifactId: string
    storageProvider: 'local_private'
    storageObjectPath: string
    mimeType: 'application/json'
    sourceOfTruth: true
    sourceOfTruthScope: 'bounded_adapter_execution_private_result_manifest'
    privateArtifact: true
    publicArtifact: false
    signedUrl: null
  }
  runnerBinding: {
    registeredToolRunnerRequired: true
    actualToolPackageExecuted: false
    summary: string
  }
}

export interface ProfessionalToolAdapterBoundedExecutionRun {
  id: string
  packageRecordId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  status: 'completed_private_manifest_handoff' | 'blocked'
  executionMode: 'backend_bounded_adapter_private_manifest_handoff'
  requestedToolCount: number
  readyToolCount: number
  blockedToolCount: number
  preparedActivityCount: number
  completedActivityCount: number
  actualToolPackageExecutionCount: 0
  privateResultManifestCount: number
  sourceTruthReviewRequired: true
  sourceTruthReviewReady: boolean
  frontendExecutionAllowed: false
  productReady: false
  blockers: string[]
  activityResults: ProfessionalToolAdapterExecutionActivityResult[]
  privateArtifactManifest: JSONObject
  nextRequiredGate: 'registered_tool_runner_execution_with_private_artifact_outputs'
  userFacingSummary: string
  internalExecutionSummary: string
  noRuntimeSideEffects: string[]
}

export function createProfessionalToolAdapterBoundedExecutionRun(input: {
  packageRecordId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  sourceTruthReviewReady: boolean
  boundedAdapterExecutionGate?: ProfessionalToolAdapterBoundedExecutionGate | null
}): ProfessionalToolAdapterBoundedExecutionRun {
  const gate = input.boundedAdapterExecutionGate
  const blockers = [
    ...(!input.sourceTruthReviewReady ? ['Backend source-truth readiness review is required before bounded adapter execution handoff.'] : []),
    ...(!gate ? ['Bounded adapter execution gate is missing.'] : []),
    ...(gate && gate.status !== 'ready_for_bounded_execution' ? gate.blockers : []),
  ]
  const readyTools = gate?.boundedExecutionPlan.tools.filter((tool) => tool.status === 'ready') ?? []
  const activityResults: ProfessionalToolAdapterExecutionActivityResult[] = blockers.length
    ? []
    : readyTools.map((tool) => {
      const storageObjectPath = `edit-execution/${input.packageRecordId}/bounded-adapter-results/${tool.canonicalToolId}.json`
      return {
        activityResultId: `bounded-adapter-activity-${input.packageRecordId}-${tool.canonicalToolId}`,
        canonicalToolId: tool.canonicalToolId,
        workerType: tool.workerType,
        userFacingActivity: tool.userFacingActivity,
        status: 'completed_private_manifest_handoff',
        privateInputManifestKinds: tool.privateInputManifestKinds,
        privateOutputManifestKinds: tool.privateOutputManifestKinds,
        qaGates: tool.qaGates,
        privateResultManifest: {
          artifactId: `bounded-adapter-result-manifest-${input.packageRecordId}-${tool.canonicalToolId}`,
          storageProvider: 'local_private',
          storageObjectPath,
          mimeType: 'application/json',
          sourceOfTruth: true,
          sourceOfTruthScope: 'bounded_adapter_execution_private_result_manifest',
          privateArtifact: true,
          publicArtifact: false,
          signedUrl: null,
        },
        runnerBinding: {
          registeredToolRunnerRequired: true,
          actualToolPackageExecuted: false,
          summary: 'Private result manifest handoff is ready; a registered backend tool runner must execute the actual package/library in the next gate.',
        },
      }
    })
  const status = blockers.length ? 'blocked' : 'completed_private_manifest_handoff'

  return {
    id: `bounded-adapter-execution-run-${input.packageRecordId}`,
    packageRecordId: input.packageRecordId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    creditReservationId: input.creditReservationId,
    status,
    executionMode: 'backend_bounded_adapter_private_manifest_handoff',
    requestedToolCount: gate?.requestedToolCount ?? 0,
    readyToolCount: gate?.readyToolCount ?? 0,
    blockedToolCount: gate?.blockedToolCount ?? 0,
    preparedActivityCount: activityResults.length,
    completedActivityCount: activityResults.length,
    actualToolPackageExecutionCount: 0,
    privateResultManifestCount: activityResults.length,
    sourceTruthReviewRequired: true,
    sourceTruthReviewReady: input.sourceTruthReviewReady,
    frontendExecutionAllowed: false,
    productReady: false,
    blockers,
    activityResults,
    privateArtifactManifest: {
      manifestVersion: 'bounded-adapter-execution-private-result-manifest-v1',
      packageRecordId: input.packageRecordId,
      approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      creditReservationId: input.creditReservationId,
      privateArtifact: true,
      publicArtifact: false,
      signedUrl: null,
      activityResultCount: activityResults.length,
      artifacts: activityResults.map((activity) => activity.privateResultManifest),
    },
    nextRequiredGate: 'registered_tool_runner_execution_with_private_artifact_outputs',
    userFacingSummary: status === 'completed_private_manifest_handoff'
      ? `Prepared ${activityResults.length} approved edit activit${activityResults.length === 1 ? 'y' : 'ies'} for backend runner execution.`
      : 'Bounded edit activity execution is still blocked until backend source-truth readiness and package/model gates pass.',
    internalExecutionSummary: [
      `Bounded adapter execution package ${input.packageRecordId}.`,
      `Private manifest handoff activities: ${activityResults.length}.`,
      'Actual tool package execution is intentionally deferred to registered backend runners.',
    ].join(' '),
    noRuntimeSideEffects: [
      'Bounded adapter execution handoff does not import packages, execute binaries, load model weights, process media, render, call providers, write Supabase/GCS, create signed URLs, create public artifacts, or bill users.',
      'Frontend execution remains disabled; only backend-owned source-truth evidence can unlock this handoff.',
      'The next gate must bind registered backend tool runners before any actual package/library execution occurs.',
    ],
  }
}
