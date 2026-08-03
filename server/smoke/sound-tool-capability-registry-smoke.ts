import assert from 'node:assert/strict'
import {
  calculateToolCapabilityManifestHash,
  canonicalToolRateCardSnapshotRegistry,
  getToolCapabilityManifest,
  getToolOperationCapability,
  listToolCapabilityManifests,
  publishToolCapabilityManifest,
  registerToolCapabilityManifest,
  toolCapabilityManifestSchema,
  type ToolRuntimeStatus,
} from '../tool-registry'
import {
  inspectSoundAssignmentTools,
  planSkillAssignment,
} from '../orchestra/head-of-orchestra'
import {
  createSoundJobDescriptor,
} from '../sound/sound-controller'
import {
  soundSkillCapabilityManifest,
} from '../sound/sound-manifest'
import { SOUND_MIRELO_RATE_CARD_SNAPSHOT } from '../sound/sound-rate-card'
import {
  probeCanonicalSoundRuntimeStatuses,
} from '../sound/sound-runtime-status'
import {
  evaluateSoundRouteBindingInvalidation,
  getSoundToolRouteManifest,
  listSoundToolRouteManifests,
} from '../sound/sound-tool-route-manifest'
import {
  SOUND_TOOL_ROUTE_MANIFESTS,
} from '../sound/sound-tool-routes'
import {
  admitSoundControllerRoute,
  createPeerSoundCapabilityView,
  createSoundWorkerOperationPackage,
} from '../sound/sound-tool-views'
import { buildSoundRequest } from './sound-test-fixtures'

const manifests = listToolCapabilityManifests()
assert.ok(manifests.length >= 20)
for (const manifest of manifests) {
  assert.deepEqual(toolCapabilityManifestSchema.parse(manifest), manifest)
  assert.equal(calculateToolCapabilityManifestHash(manifest), manifest.toolManifestHash)
  assert.equal(Object.isFrozen(manifest), true)
  assert.equal(Object.isFrozen(manifest.operations), true)
  assert.equal(Object.isFrozen(manifest.operations[0]), true)
  assert.equal(manifest.securityPolicy.callerSelectedExecutableAllowed, false)
  assert.equal(manifest.securityPolicy.callerSelectedArgumentsAllowed, false)
  assert.equal(manifest.securityPolicy.callerSelectedPathsAllowed, false)
  assert.equal(manifest.securityPolicy.callerSelectedProviderRouteAllowed, false)
  assert.equal(manifest.privacyPolicy.secretValuesAllowedInManifest, false)
  const operationPlanningRanks = manifest.operations.map((operation) => ({
    blocked: 0, deprecated: 0, declared: 1, planning_qualified: 2,
    fixture_qualified: 3, private_internal_qualified: 4, production_qualified: 5,
  })[operation.qualificationByMode.planning])
  const manifestRank = ({
    blocked: 0, deprecated: 0, declared: 1, planning_qualified: 2,
    fixture_qualified: 3, private_internal_qualified: 4, production_qualified: 5,
  })[manifest.qualificationStatus]
  assert.ok(manifestRank <= Math.min(...operationPlanningRanks))
}

const ffmpeg = getToolCapabilityManifest('ffmpeg')!
const { toolManifestHash: _ffmpegHash, ...unpublishedFfmpeg } = structuredClone(ffmpeg)
void _ffmpegHash
const changedFfmpeg = publishToolCapabilityManifest({
  ...unpublishedFfmpeg,
  knownLimitations: [...unpublishedFfmpeg.knownLimitations, 'immutable-version-test'],
})
assert.notEqual(changedFfmpeg.toolManifestHash, ffmpeg.toolManifestHash)
assert.throws(() => registerToolCapabilityManifest(changedFfmpeg), /immutable/)

const planningTool = getToolCapabilityManifest('sound_planning_service')!
const privateDnaOperation = planningTool.operations.find((operation) =>
  operation.operationKey === 'derive_reference_sound_dna')!
const planningVisualOperation = planningTool.operations.find((operation) =>
  operation.operationKey === 'study_visual_sound_events')!
assert.equal(privateDnaOperation.qualificationByMode.preview_execution, 'private_internal_qualified')
assert.equal(planningVisualOperation.qualificationByMode.preview_execution, 'blocked')
assert.equal(getToolOperationCapability('sound_planning_service', 'arbitrary_tool_access'), undefined)

const routeByKey = new Map(SOUND_TOOL_ROUTE_MANIFESTS.map((route) => [route.routeKey, route]))
const requiredRouteKeys = [
  'sound.route.study.source_audio.v1',
  'sound.route.acquire.internal_library.v1',
  'sound.route.acquire.project_source.v1',
  'sound.route.generate.video_sfx.mirelo.v1',
  'sound.route.generate.video_sfx.mmaudio.v1',
  'sound.route.generate.text_sfx.v1',
  'sound.route.ambience.generate_or_extend.v1',
  'sound.route.repair.dialogue_gentle.v1',
  'sound.route.edit.deterministic.v1',
  'sound.route.retime.pitch_preserved.v1',
  'sound.route.sync.visual_event.v1',
  'sound.route.mix.scene.v1',
  'sound.route.qa.final_sound.v1',
  'sound.route.no_sound.v1',
]
assert.equal(requiredRouteKeys.every((key) => routeByKey.has(key)), true)
for (const route of listSoundToolRouteManifests()) {
  assert.equal(route.routeHash.length, 64)
  for (const step of route.orderedOrGraphSteps) {
    const resolved = getToolOperationCapability(step.toolKey, step.operationKey, step.toolVersionConstraint)
    assert.ok(resolved, `${route.routeKey}:${step.stepKey} must bind one exact registered operation`)
    assert.equal(step.operationProfileVersion, '1.0.0')
    assert.equal(
      step.outputBindings.every((output) => resolved!.operation.producedArtifactTypes.includes(output)),
      true,
      `${route.routeKey}:${step.stepKey} may claim only operation-declared outputs`,
    )
    assert.equal(
      route.supportedJobTypes.every((jobType) => resolved!.operation.supportedJobTypes.includes(jobType)),
      true,
      `${route.routeKey}:${step.stepKey} must support every admitted route job`,
    )
  }
  const boundOutputs = new Set(route.orderedOrGraphSteps.flatMap((step) => step.outputBindings))
  assert.equal(
    route.producedArtifactTypes.every((output) => boundOutputs.has(output)),
    true,
    `${route.routeKey} may claim only outputs produced by a bound step`,
  )
}

const mireloRoute = getSoundToolRouteManifest('sound.route.generate.video_sfx.mirelo.v1')!
const mmaudioRoute = getSoundToolRouteManifest('sound.route.generate.video_sfx.mmaudio.v1')!
assert.equal(mireloRoute.qualificationStatus, 'fixture_qualified')
assert.equal(mmaudioRoute.qualificationStatus, 'blocked')
assert.equal(mireloRoute.fallbackPolicy.fallbackRouteKeys.includes(mmaudioRoute.routeKey), true)
assert.equal(mireloRoute.qualificationStatus, 'fixture_qualified')
const mireloSteps = mireloRoute.orderedOrGraphSteps.map((step) => step.stepKey)
assert.ok(mireloSteps.indexOf('prepare_visual_proxy') < mireloSteps.indexOf('generate_mirelo'))
assert.ok(mireloSteps.indexOf('generate_mirelo') < mireloSteps.indexOf('ingest_provider_output'))
assert.ok(mireloSteps.indexOf('ingest_provider_output') < mireloSteps.indexOf('qa_candidate'))
assert.ok(mireloSteps.indexOf('qa_candidate') < mireloSteps.indexOf('commit_selected_candidate'))
assert.equal(
  getToolOperationCapability('mirelo_sfx', 'generate_video_conditioned_sfx')!
    .operation.producedArtifactTypes.includes('untrusted_provider_audio_candidate'),
  true,
)
assert.equal(mireloRoute.integrationQa.includes('approved_visual_integrity_qa'), true)

const observedAt = '2026-08-03T12:00:00.000Z'
const runtimeStatuses = await probeCanonicalSoundRuntimeStatuses({ observedAt })
const mireloNotConfigured = runtimeStatuses.find((status) => status.toolKey === 'mirelo_sfx')!
assert.equal(mireloNotConfigured.availabilityStatus, 'not_configured')
assert.equal(mireloNotConfigured.credentialsConfigured, false)
assert.equal(JSON.stringify(mireloNotConfigured).includes('sk-'), false)
assert.equal('credentialValue' in mireloNotConfigured, false)
const mireloRateSnapshot = canonicalToolRateCardSnapshotRegistry.get(
  SOUND_MIRELO_RATE_CARD_SNAPSHOT.rateCardSnapshotId,
)!
assert.equal(mireloRateSnapshot.unitCost, 10)
assert.equal(mireloRateSnapshot.currency, 'provider_credit')
assert.equal(mireloRateSnapshot.usdConversionStatus, 'unknown')
assert.equal('unitCostUsd' in mireloRateSnapshot, false)
assert.equal('currentRateCardSnapshotId' in getToolCapabilityManifest('mirelo_sfx')!, false)

function status(toolKey: string, availabilityStatus: ToolRuntimeStatus['availabilityStatus'] = 'available'): ToolRuntimeStatus {
  const manifest = getToolCapabilityManifest(toolKey)!
  return {
    toolKey,
    toolVersion: manifest.toolVersion,
    observedAt,
    availabilityStatus,
    runtimeVersion: 'fixture-runtime-v1',
    credentialsConfigured: toolKey === 'mirelo_sfx',
    healthProbePassed: availabilityStatus === 'available',
    currentQueueDepth: 0,
    availableConcurrency: availabilityStatus === 'available' ? 1 : 0,
    providerQuotaAvailable: toolKey === 'mirelo_sfx' ? true : null,
    blockingReasons: availabilityStatus === 'available' ? [] : ['fixture_unavailable'],
  }
}

function qaForRoute(route: ReturnType<typeof getSoundToolRouteManifest>): string[] {
  return route ? [...new Set([
    ...route.stepQa, ...route.finalOutputQa, ...route.integrationQa,
  ])] : []
}

const editRoute = getSoundToolRouteManifest('sound.route.edit.deterministic.v1')!
const editRuntime = ['ffmpeg', 'ffprobe', 'sound_private_artifact_store'].map((tool) => status(tool))
const editAdmission = admitSoundControllerRoute({
  routeKey: editRoute.routeKey,
  capabilityKey: 'sound.edit_audio',
  jobType: 'edit_audio',
  mode: 'preview_execution',
  scope: 'range',
  availableInputKeys: [...editRoute.requiredInputs],
  availableQaKeys: qaForRoute(editRoute),
  runtimeStatuses: editRuntime,
  budgetApproved: true,
  rateCardSnapshotIds: {},
  licenseEvidenceRefs: {
    ffmpeg: 'sound.license_evidence.private_local_gpl_development_only.v1',
    ffprobe: 'sound.license_evidence.private_local_gpl_development_only.v1',
  },
})
assert.equal(editAdmission.admitted, true, editAdmission.reasons.join(','))
assert.ok(editAdmission.binding)

const unavailableAdmission = admitSoundControllerRoute({
  routeKey: editRoute.routeKey,
  capabilityKey: 'sound.edit_audio',
  jobType: 'edit_audio',
  mode: 'preview_execution',
  scope: 'range',
  availableInputKeys: [...editRoute.requiredInputs],
  availableQaKeys: qaForRoute(editRoute),
  runtimeStatuses: [status('ffmpeg', 'unavailable'), status('ffprobe'), status('sound_private_artifact_store')],
  budgetApproved: true,
  rateCardSnapshotIds: {},
  licenseEvidenceRefs: {
    ffmpeg: 'sound.license_evidence.private_local_gpl_development_only.v1',
    ffprobe: 'sound.license_evidence.private_local_gpl_development_only.v1',
  },
})
assert.equal(unavailableAdmission.admitted, false)
assert.equal(unavailableAdmission.reasons.includes('runtime_unavailable:ffmpeg'), true)

const visualRoute = getSoundToolRouteManifest('sound.route.study.visual_events.v1')!
const availableButUnqualified = admitSoundControllerRoute({
  routeKey: visualRoute.routeKey,
  capabilityKey: 'sound.study_visual_sound_events',
  jobType: 'study_visual_sound_events',
  mode: 'preview_execution',
  scope: 'scene',
  availableInputKeys: [...visualRoute.requiredInputs],
  availableQaKeys: qaForRoute(visualRoute),
  runtimeStatuses: [status('sound_planning_service')],
  budgetApproved: true,
  rateCardSnapshotIds: {},
  licenseEvidenceRefs: {},
})
assert.equal(availableButUnqualified.admitted, false)
assert.equal(availableButUnqualified.reasons.some((reason) => reason.includes('not_preview_execution_qualified')), true)

const editRequest = buildSoundRequest({ job: 'edit_audio', mode: 'private_internal' })
const editJob = createSoundJobDescriptor(editRequest)
const skillAssignment = planSkillAssignment('sound', editJob)
assert.equal(skillAssignment.ok, true)
const workerPackage = createSoundWorkerOperationPackage({
  skillBinding: skillAssignment.binding!,
  routeBinding: editAdmission.binding!,
  stepKey: 'trim_fade_gain',
  artifactBindings: [{
    artifactId: 'approved-source-audio',
    artifactType: 'approved_source_audio',
    checksumSha256: 'a'.repeat(64),
    version: 1,
    access: 'read_only',
  }],
  inspectRanges: [{ startFrame: 0, endFrameExclusive: 90 }],
  audioWriteRanges: [{ startFrame: 0, endFrameExclusive: 90 }],
  visualWriteRanges: [],
  attemptId: 'sound-worker-attempt-1',
  idempotencyKey: 'sound-worker-idempotency-1',
})
assert.equal(workerPackage.routeBinding.toolOperations.length, 1)
assert.equal(workerPackage.routeBinding.toolOperations[0]?.operationKey, 'trim_fade_gain_audio')
assert.equal(workerPackage.outputContract.sourceOverwriteAllowed, false)
assert.equal(workerPackage.outputContract.providerVisualMayReplaceApprovedVisual, false)
assert.equal(/command|arguments|credential|providerPayload|https?:\/\//i.test(JSON.stringify(workerPackage)), false)

const staleBinding = structuredClone(editAdmission.binding!)
staleBinding.toolOperations[0]!.toolManifestHash = '0'.repeat(64)
const invalidation = evaluateSoundRouteBindingInvalidation({ binding: staleBinding })
assert.equal(invalidation.stale, true)
assert.equal(invalidation.reasons.some((reason) => reason.startsWith('tool_operation_manifest_changed')), true)

const staleProfileBinding = structuredClone(editAdmission.binding!)
staleProfileBinding.toolOperations[0]!.operationProfileVersion = '9.9.9'
assert.equal(
  evaluateSoundRouteBindingInvalidation({ binding: staleProfileBinding }).reasons
    .some((reason) => reason.startsWith('operation_profile_changed')),
  true,
)

const staleEvidenceBinding = structuredClone(editAdmission.binding!)
staleEvidenceBinding.toolOperations[0]!.qualificationEvidenceRefs = ['untrusted.evidence']
assert.equal(
  evaluateSoundRouteBindingInvalidation({ binding: staleEvidenceBinding }).reasons
    .some((reason) => reason.startsWith('tool_operation_qualification_evidence_changed')),
  true,
)

const peerRequest = buildSoundRequest({
  job: 'support_living_frame_sound',
  callerType: 'living_frame',
})
const peerView = createPeerSoundCapabilityView({
  callerType: 'living_frame',
  callerSkillKey: 'living_frame',
  job: createSoundJobDescriptor(peerRequest),
  runtimeStatuses,
})
assert.equal(peerView.acceptedCaller, true)
assert.equal(peerView.requestBoundary.peerMayCallSoundCapability, true)
assert.equal(peerView.requestBoundary.peerMayInvokeSoundToolsDirectly, false)
assert.equal(peerView.requestBoundary.peerMaySupplyProviderPayload, false)
assert.equal(peerView.requestBoundary.peerMaySupplyCredentials, false)
assert.equal(peerView.requestBoundary.peerMayDispatchWorkers, false)
assert.equal(/Authorization|Bearer|operationProfile|commandName/i.test(JSON.stringify(peerView)), false)

const orchestraView = await inspectSoundAssignmentTools({
  job: createSoundJobDescriptor(buildSoundRequest({ job: 'design_scene_sound' })),
  runtimeStatuses,
})
assert.equal(orchestraView.assignment.ok, true)
assert.ok(orchestraView.routes.some((route) => route.routeKey === 'sound.route.design.plan.v1'))
assert.ok(orchestraView.routes[0]?.runtimeAvailability)
assert.ok(orchestraView.estimates.time)
assert.ok(orchestraView.estimates.credits)

const noSoundRoute = getSoundToolRouteManifest('sound.route.no_sound.v1')!
assert.equal(noSoundRoute.routeRole, 'no_sound')
assert.deepEqual(noSoundRoute.producedArtifactTypes, ['no_sound_decision', 'caller_receipt'])

const rank = {
  blocked: 0, deprecated: 0, declared: 1, planning_qualified: 2,
  fixture_qualified: 3, private_internal_qualified: 4, production_qualified: 5,
} as const
for (const capability of soundSkillCapabilityManifest.capabilityEntries) {
  const primaryStatuses = capability.primaryToolRoutes.map((routeKey) =>
    getSoundToolRouteManifest(routeKey)?.qualificationByMode.planning ?? 'blocked')
  const bestPrimary = Math.max(...primaryStatuses.map((statusValue) => rank[statusValue]))
  assert.ok(rank[capability.qualificationStatus] <= bestPrimary,
    `${capability.capabilityKey} must not claim more qualification than its primary route evidence`)
}
const minimumCapabilityQualification = Math.min(...soundSkillCapabilityManifest.capabilityEntries
  .map((capability) => rank[capability.qualificationStatus]))
assert.equal(rank[soundSkillCapabilityManifest.qualificationStatus], minimumCapabilityQualification)

process.stdout.write(`Sound tool capability and route registry smoke passed: ${manifests.length} tools, ${SOUND_TOOL_ROUTE_MANIFESTS.length} routes.\n`)
