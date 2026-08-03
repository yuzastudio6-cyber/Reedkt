import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { inspectSoundAssignmentTools } from '../orchestra/head-of-orchestra'
import {
  createSoundJobDescriptor,
  runCanonicalSoundController,
} from '../sound/sound-controller'
import {
  runSoundLocalAudioExecution,
  validateSoundAudioFile,
} from '../sound/sound-local-audio-processor'
import { soundSkillCapabilityManifest } from '../sound/sound-manifest'
import { probeCanonicalSoundRuntimeStatuses } from '../sound/sound-runtime-status'
import { validateSoundResultAuthority } from '../sound/sound-scope-guard'
import { getSoundToolRouteManifest } from '../sound/sound-tool-route-manifest'
import {
  admitSoundControllerRoute,
  createSoundWorkerOperationPackage,
} from '../sound/sound-tool-views'
import { buildSoundRequest } from './sound-test-fixtures'

const execFileAsync = promisify(execFile)
const root = await mkdtemp(join(tmpdir(), 'reeditpro-canonical-sound-e2e-'))
const inputRoot = join(root, 'private-input')
const outputRoot = join(root, 'private-output')
await mkdir(inputRoot, { recursive: true, mode: 0o700 })
await mkdir(outputRoot, { recursive: true, mode: 0o700 })

try {
  const sourcePath = join(inputRoot, 'approved-project-source.wav')
  await execFileAsync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
    '-f', 'lavfi', '-i', 'sine=frequency=520:duration=2:sample_rate=48000',
    '-ac', '2', '-c:a', 'pcm_s24le', sourcePath,
  ], { timeout: 30_000 })
  const sourceBytes = await readFile(sourcePath)
  const sourceChecksum = createHash('sha256').update(sourceBytes).digest('hex')
  const sourceArtifact = {
    artifactId: 'e2e-approved-source',
    artifactType: 'approved_source_audio',
    version: 1,
    checksumSha256: sourceChecksum,
    storageObjectId: 'private:e2e-approved-source:v1',
    private: true as const,
    contentType: 'audio/wav',
    durationFrames: 60,
  }

  const request = buildSoundRequest({
    job: 'design_scene_sound',
    eventFrames: [30],
    allowProviderGeneration: false,
  })
  const runtimeStatuses = await probeCanonicalSoundRuntimeStatuses()

  const orchestraView = await inspectSoundAssignmentTools({
    job: createSoundJobDescriptor(request),
    runtimeStatuses,
  })
  assert.equal(orchestraView.assignment.ok, true)
  assert.equal(orchestraView.manifestHash, soundSkillCapabilityManifest.manifestHash)
  assert.ok(orchestraView.routes.some((route) => route.routeKey === 'sound.route.design.plan.v1'))

  const planned = runCanonicalSoundController(request, {
    sourceMatches: [{
      anchorId: 'event-1',
      artifact: sourceArtifact,
      usable: true,
      requiresRepair: false,
    }],
  })
  assert.equal(planned.result.status, 'planned')
  assert.equal(planned.result.cueManifest.cues[0]?.acquisitionDecision, 'preserve_project_source')
  assert.equal(validateSoundResultAuthority(request, planned.result).ok, true)

  const plannedWork = planned.childWorkItems[0]
  assert.ok(plannedWork)
  assert.equal(plannedWork!.routeBinding.routeKey, 'sound.route.acquire.project_source.v1')
  const route = getSoundToolRouteManifest(plannedWork!.routeBinding.routeKey)!
  const executionAdmission = admitSoundControllerRoute({
    routeKey: route.routeKey,
    capabilityKey: 'sound.extract_project_owned_sound',
    jobType: 'extract_project_owned_sound',
    mode: 'preview_execution',
    scope: 'range',
    availableInputKeys: [...route.requiredInputs],
    availableQaKeys: [...new Set([
      ...route.stepQa,
      ...route.finalOutputQa,
      ...route.integrationQa,
    ])],
    runtimeStatuses,
    budgetApproved: true,
    rateCardSnapshotIds: {},
    licenseEvidenceRefs: {
      ffmpeg: 'sound.license_evidence.private_local_gpl_development_only.v1',
      ffprobe: 'sound.license_evidence.private_local_gpl_development_only.v1',
    },
  })
  assert.equal(executionAdmission.admitted, true, executionAdmission.reasons.join(','))
  assert.ok(executionAdmission.binding)

  const workerPackage = createSoundWorkerOperationPackage({
    skillBinding: planned.assignment.binding!,
    routeBinding: executionAdmission.binding!,
    stepKey: 'extract_project_audio',
    artifactBindings: [{
      artifactId: sourceArtifact.artifactId,
      artifactType: sourceArtifact.artifactType,
      checksumSha256: sourceArtifact.checksumSha256,
      version: sourceArtifact.version,
      access: 'read_only',
    }],
    inspectRanges: [{ startFrame: 0, endFrameExclusive: 60 }],
    audioWriteRanges: [{ startFrame: 0, endFrameExclusive: 60 }],
    visualWriteRanges: [],
    attemptId: request.attemptId,
    idempotencyKey: request.idempotencyKey,
  })
  assert.equal(workerPackage.routeBinding.toolOperations.length, 1)
  assert.equal(workerPackage.routeBinding.toolOperations[0]?.operationKey, 'extract_audio_pcm')

  const outputRelativePath = 'sound/e2e-selected-source.wav'
  const executed = await runSoundLocalAudioExecution({
    schemaVersion: 'sound-local-audio-execution-v1',
    executionId: 'canonical-sound-e2e-extract',
    binding: {
      soundSkillVersion: soundSkillCapabilityManifest.skillVersion,
      soundManifestHash: soundSkillCapabilityManifest.manifestHash,
      capabilityKey: 'sound.extract_project_owned_sound',
      approvedPlanSnapshotId: request.executionAuthority.approvedPlanSnapshotId!,
      approvedPlanSnapshotHash: request.executionAuthority.approvedPlanSnapshotHash!,
      approvedWorkItemId: plannedWork!.workItemId,
      privateOutputScopeId: request.executionAuthority.privateOutputScopeId!,
      idempotencyKey: request.idempotencyKey,
      routeBinding: executionAdmission.binding!,
    },
    operation: 'extract',
    operationProfileKey: 'sound.extract.pcm.v1',
    sources: [{ artifact: sourceArtifact, absolutePath: sourcePath }],
    approvedInputRoot: inputRoot,
    privateOutputRoot: outputRoot,
    outputRelativePath,
    outputArtifactId: 'e2e-private-selected-sound',
    outputArtifactType: 'edited_audio_asset_version',
    outputContentType: 'audio/wav',
    parameters: { sampleRate: 48_000, channels: 2 },
  })
  assert.equal(executed.status, 'completed')
  assert.equal(executed.outputArtifact?.private, true)
  assert.equal(executed.qaEvidence.inputMediaValidated, true)
  assert.equal(executed.qaEvidence.outputMediaValidated, true)
  assert.equal(executed.qaEvidence.sourceOverwritePrevented, true)
  assert.equal(createHash('sha256').update(await readFile(sourcePath)).digest('hex'), sourceChecksum)
  assert.equal((await stat(join(outputRoot, outputRelativePath))).mode & 0o777, 0o600)
  const outputMedia = await validateSoundAudioFile(join(outputRoot, outputRelativePath))
  assert.equal(outputMedia.sampleRate, 48_000)
  assert.equal(outputMedia.channels, 2)
  assert.deepEqual(planned.result.finalHandoffTargets, ['head_of_orchestra'])

  process.stdout.write('Canonical Sound E2E smoke passed: Orchestra -> Sound -> route admission -> bounded worker -> real private audio -> QA -> handoff.\n')
} finally {
  await rm(root, { recursive: true, force: true })
}
