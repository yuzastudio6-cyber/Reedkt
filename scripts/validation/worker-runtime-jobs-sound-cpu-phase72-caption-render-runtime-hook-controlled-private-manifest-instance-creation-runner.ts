import {
  SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS,
  validateSoundCpuPrivateMediaManifest,
  type SoundCpuPrivateMediaManifestInput,
} from '../../server/workers/sound-cpu/runtime/privateManifest'

const decision =
  'worker_runtime_jobs_sound_cpu_phase72_caption_render_runtime_hook_controlled_private_manifest_instance_created_with_warnings_ready_for_instance_creation_owner_review_no_media_no_artifacts'

const controlledInput: SoundCpuPrivateMediaManifestInput = {
  approvedPlanSnapshotId: 'approved-plan-snapshot-sound-cpu-phase72-controlled',
  workspaceId: 'workspace-sound-cpu-phase72-controlled',
  projectId: 'project-sound-cpu-phase72-controlled',
  jobId: 'job-sound-cpu-phase72-controlled',
  idempotencyKey: 'idempotency-sound-cpu-phase72-controlled',
  workerName: 'sound-cpu-analysis-worker',
  jobType: 'sound.package_import_smoke',
  privateMediaAssetIds: ['private-media-asset-sound-cpu-phase72-synthetic'],
  plannedPrivateArtifactIds: ['planned-private-artifact-sound-cpu-phase72-synthetic'],
  runtimeDefaults: SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS,
}

const validation = validateSoundCpuPrivateMediaManifest(controlledInput)
const runtimeFlagsAllFalse = Object.values(validation.runtimeDefaults).every((value) => value === false)

const proof = {
  ok: validation.ok && runtimeFlagsAllFalse,
  decision,
  proofKind: 'controlled_private_manifest_instance_creation_no_media_no_artifacts',
  sourcePath: 'server/workers/sound-cpu/runtime/privateManifest.ts',
  validationFunction: 'validateSoundCpuPrivateMediaManifest',
  controlledPrivateManifestInstanceCreated: true,
  persistedManifestInstance: false,
  realMediaUsed: false,
  artifactCreated: false,
  workerDispatched: false,
  routeToolProviderCalled: false,
  supabaseSqlTouched: false,
  externalBetaUnlocked: false,
  productionUnlocked: false,
  validationOk: validation.ok,
  issueCount: validation.issues.length,
  runtimeFlagsAllFalse,
  acceptedForManifestInstanceCreationToday: validation.acceptedForManifestInstanceCreationToday,
  acceptedForMediaProcessingToday: validation.acceptedForMediaProcessingToday,
  acceptedForArtifactCreationToday: validation.acceptedForArtifactCreationToday,
  acceptedForWorkerDispatchToday: validation.acceptedForWorkerDispatchToday,
  sanitizedInstance: {
    schemaVersion: 'sound-cpu-private-media-manifest-v1',
    approvedPlanSnapshotId: controlledInput.approvedPlanSnapshotId,
    workspaceId: controlledInput.workspaceId,
    projectId: controlledInput.projectId,
    jobId: controlledInput.jobId,
    idempotencyKey: controlledInput.idempotencyKey,
    workerName: controlledInput.workerName,
    jobType: controlledInput.jobType,
    privateMediaAssetIdCount: controlledInput.privateMediaAssetIds?.length ?? 0,
    plannedPrivateArtifactIdCount: controlledInput.plannedPrivateArtifactIds?.length ?? 0,
  },
  sanitizedErrors: validation.issues.map((issue) => ({
    code: issue.code,
    field: issue.field,
  })),
}

console.log(JSON.stringify(proof, null, 2))

if (!proof.ok) {
  process.exitCode = 1
}
