import type { JSONObject } from '../../src/types'
import type { ProductionToolId } from './production-tool-types'
import type { ProfessionalToolAdapterBoundedExecutionRun } from './professional-tool-adapter-execution'
import type {
  ProfessionalToolAdapterRegisteredRunnerRun,
  ProfessionalToolAdapterRunnerRuntime,
} from './professional-tool-adapter-registered-runners'

export interface ProfessionalToolAdapterPrivateMediaRunnerActivity {
  activityExecutionId: string
  sourceActivityResultId: string
  canonicalToolId: ProductionToolId
  userFacingActivity: string
  status: 'private_runner_manifest_ready'
  registeredImportProbeReady: true
  runnerRuntime: ProfessionalToolAdapterRunnerRuntime
  packageName?: string
  importName?: string
  runtimeBinary?: string
  privateInputManifestKinds: string[]
  privateOutputManifestKinds: string[]
  qaGates: string[]
  privateRunnerResultManifest: {
    artifactId: string
    storageProvider: 'local_private'
    storageObjectPath: string
    mimeType: 'application/json'
    sourceOfTruth: true
    sourceOfTruthScope: 'registered_adapter_private_media_runner_manifest'
    privateArtifact: true
    publicArtifact: false
    signedUrl: null
  }
  runnerBoundary: {
    backendRegisteredRunnerRequired: true
    importProbeCompleted: true
    packageAvailabilityProven: true
    mediaProcessingExecuted: false
    productRuntimeExecuted: false
    summary: string
  }
}

export interface ProfessionalToolAdapterPrivateMediaRunnerRun {
  id: string
  registeredRunnerRunId: string
  boundedAdapterExecutionRunId: string
  packageRecordId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  status: 'private_runner_manifest_ready' | 'blocked'
  executionMode: 'backend_registered_runner_private_manifest_execution'
  privateMediaExecutionOnly: true
  requestedActivityCount: number
  registeredRunnerReadyCount: number
  blockedRunnerCount: number
  preparedPrivateRunnerManifestCount: number
  mediaProcessingExecuted: false
  productRuntimeExecuted: false
  frontendExecutionAllowed: false
  productReady: false
  blockers: string[]
  activities: ProfessionalToolAdapterPrivateMediaRunnerActivity[]
  privateArtifactManifest: JSONObject
  nextRequiredGate: 'private_adapter_result_qa_review_before_final_render_integration'
  userFacingSummary: string
  internalExecutionSummary: string
  noRuntimeSideEffects: string[]
}

export function createProfessionalToolAdapterPrivateMediaRunnerRun(input: {
  registeredRunnerRun: ProfessionalToolAdapterRegisteredRunnerRun
  boundedAdapterExecutionRun: ProfessionalToolAdapterBoundedExecutionRun
  privateMediaExecutionOnly: true
}): ProfessionalToolAdapterPrivateMediaRunnerRun {
  const { registeredRunnerRun, boundedAdapterExecutionRun } = input
  const structuralBlockers = [
    ...(input.privateMediaExecutionOnly !== true ? ['Private media runner execution must be explicitly privateMediaExecutionOnly=true.'] : []),
    ...(registeredRunnerRun.workspaceId !== boundedAdapterExecutionRun.workspaceId ? ['Registered runner workspace does not match bounded adapter execution run.'] : []),
    ...(registeredRunnerRun.projectId !== boundedAdapterExecutionRun.projectId ? ['Registered runner project does not match bounded adapter execution run.'] : []),
    ...(registeredRunnerRun.approvedPlanSnapshotId !== boundedAdapterExecutionRun.approvedPlanSnapshotId ? ['Registered runner approved snapshot does not match bounded adapter execution run.'] : []),
    ...(registeredRunnerRun.creditReservationId !== boundedAdapterExecutionRun.creditReservationId ? ['Registered runner credit reservation does not match bounded adapter execution run.'] : []),
  ]
  const runnerBlockers = registeredRunnerRun.status !== 'completed_import_probe'
    ? registeredRunnerRun.blockers
    : []

  const completedProbeResultsByToolId = new Map(
    registeredRunnerRun.results
      .filter((result) => result.status === 'completed_import_probe')
      .map((result) => [result.canonicalToolId, result]),
  )
  const activities: ProfessionalToolAdapterPrivateMediaRunnerActivity[] = structuralBlockers.length
    ? []
    : boundedAdapterExecutionRun.activityResults
      .filter((activity) => completedProbeResultsByToolId.has(activity.canonicalToolId))
      .map((activity) => {
        const runnerResult = completedProbeResultsByToolId.get(activity.canonicalToolId)
        const storageObjectPath = `edit-execution/${boundedAdapterExecutionRun.packageRecordId}/registered-adapter-private-runner-results/${activity.canonicalToolId}.json`
        return {
          activityExecutionId: `private-runner-activity-${boundedAdapterExecutionRun.packageRecordId}-${activity.canonicalToolId}`,
          sourceActivityResultId: activity.activityResultId,
          canonicalToolId: activity.canonicalToolId,
          userFacingActivity: activity.userFacingActivity,
          status: 'private_runner_manifest_ready',
          registeredImportProbeReady: true,
          runnerRuntime: runnerResult?.runtime === 'python' || runnerResult?.runtime === 'node' || runnerResult?.runtime === 'binary'
            ? runnerResult.runtime
            : 'node',
          packageName: runnerResult?.packageName,
          importName: runnerResult?.importName,
          runtimeBinary: runnerResult?.runtimeBinary,
          privateInputManifestKinds: activity.privateInputManifestKinds,
          privateOutputManifestKinds: activity.privateOutputManifestKinds,
          qaGates: activity.qaGates,
          privateRunnerResultManifest: {
            artifactId: `registered-adapter-private-runner-manifest-${boundedAdapterExecutionRun.packageRecordId}-${activity.canonicalToolId}`,
            storageProvider: 'local_private',
            storageObjectPath,
            mimeType: 'application/json',
            sourceOfTruth: true,
            sourceOfTruthScope: 'registered_adapter_private_media_runner_manifest',
            privateArtifact: true,
            publicArtifact: false,
            signedUrl: null,
          },
          runnerBoundary: {
            backendRegisteredRunnerRequired: true,
            importProbeCompleted: true,
            packageAvailabilityProven: true,
            mediaProcessingExecuted: false,
            productRuntimeExecuted: false,
            summary: 'Backend registered runner availability is proven and a private result manifest is ready for adapter-specific QA; media-transform execution remains a later worker implementation gate.',
          },
        }
      })

  const blockers = [
    ...structuralBlockers,
    ...(activities.length === 0 ? runnerBlockers : []),
    ...(activities.length === 0 && structuralBlockers.length === 0 ? ['No registered backend runner probes completed for private adapter QA.'] : []),
  ]
  const status = activities.length > 0 && structuralBlockers.length === 0
    ? 'private_runner_manifest_ready'
    : 'blocked'
  const retainedRunnerBlockers = activities.length > 0 ? runnerBlockers : []

  return {
    id: `private-media-runner-run-${registeredRunnerRun.id}`,
    registeredRunnerRunId: registeredRunnerRun.id,
    boundedAdapterExecutionRunId: boundedAdapterExecutionRun.id,
    packageRecordId: boundedAdapterExecutionRun.packageRecordId,
    workspaceId: registeredRunnerRun.workspaceId,
    projectId: registeredRunnerRun.projectId,
    approvedPlanSnapshotId: registeredRunnerRun.approvedPlanSnapshotId,
    creditReservationId: registeredRunnerRun.creditReservationId,
    status,
    executionMode: 'backend_registered_runner_private_manifest_execution',
    privateMediaExecutionOnly: true,
    requestedActivityCount: registeredRunnerRun.requestedActivityCount,
    registeredRunnerReadyCount: registeredRunnerRun.completedImportProbeCount,
    blockedRunnerCount: registeredRunnerRun.blockedRunnerCount,
    preparedPrivateRunnerManifestCount: activities.length,
    mediaProcessingExecuted: false,
    productRuntimeExecuted: false,
    frontendExecutionAllowed: false,
    productReady: false,
    blockers: [...blockers, ...retainedRunnerBlockers],
    activities,
    privateArtifactManifest: {
      manifestVersion: 'registered-adapter-private-media-runner-manifest-v1',
      packageRecordId: boundedAdapterExecutionRun.packageRecordId,
      registeredRunnerRunId: registeredRunnerRun.id,
      boundedAdapterExecutionRunId: boundedAdapterExecutionRun.id,
      approvedPlanSnapshotId: registeredRunnerRun.approvedPlanSnapshotId,
      creditReservationId: registeredRunnerRun.creditReservationId,
      privateArtifact: true,
      publicArtifact: false,
      signedUrl: null,
      activityResultCount: activities.length,
      blockedRunnerCount: registeredRunnerRun.blockedRunnerCount,
      runnerBlockers: retainedRunnerBlockers,
      artifacts: activities.map((activity) => activity.privateRunnerResultManifest),
    },
    nextRequiredGate: 'private_adapter_result_qa_review_before_final_render_integration',
    userFacingSummary: status === 'private_runner_manifest_ready'
      ? `Prepared ${activities.length} verified edit activit${activities.length === 1 ? 'y' : 'ies'} for private adapter QA.`
      : 'Some verified edit activities are still blocked before private adapter QA.',
    internalExecutionSummary: [
      `Registered runner private manifest run ${registeredRunnerRun.id}.`,
      `Completed import probes: ${registeredRunnerRun.completedImportProbeCount}.`,
      `Blocked import probes retained for later hydration: ${registeredRunnerRun.blockedRunnerCount}.`,
      `Private runner manifests prepared: ${activities.length}.`,
      'This gate proves adapter runner binding and private manifest lineage; adapter-specific media transforms remain a later worker implementation gate.',
    ].join(' '),
    noRuntimeSideEffects: [
      'Registered adapter private runner execution records private manifest lineage only; it does not process media, render, call providers, write Supabase/GCS, create signed URLs, create public artifacts, or bill users.',
      'Frontend execution remains disabled; the route requires backend-approved package/model evidence, import probe completion, approved snapshot lineage, and credit reservation evidence.',
      'A later adapter-specific worker must create QA-passed private media/tool artifacts before final render integration or external beta readiness.',
    ],
  }
}
