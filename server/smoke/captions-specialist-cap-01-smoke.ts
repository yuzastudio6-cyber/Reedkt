import assert from 'node:assert/strict'
import {
  CAPTIONS_SPECIALIST_SKILL_KEY,
  CAPTIONS_SUPPORTED_JOB_TYPES,
  CAPTIONS_UNSUPPORTED_JOB_TYPES,
} from '../../src/types/captions-specialist'
import {
  ORCHESTRA_SKILL_CALL_VERSION,
  type OrchestraSkillCall,
} from '../../src/types/orchestra-skill-contracts'
import {
  SKILL_CAPABILITY_MANIFEST_SCHEMA_VERSION,
  SKILL_CAPABILITY_MANIFEST_SCHEMA_VERSION_V2,
  type SkillCapabilityManifest,
} from '../../src/types/skill-capability-manifest'
import {
  calculateSkillContractDigest,
  parseOrchestraSkillCall,
  parseOrchestraSkillJobResult,
  parseSkillQualificationSnapshot,
  parseSkillSupportRequest,
} from '../orchestra/orchestra-skill-contracts'
import {
  calculateSkillCapabilityManifestHash,
  parseSkillCapabilityManifestV2,
  publishSkillCapabilityManifest,
} from '../orchestra/skill-capability-manifest'
import { CAPTIONS_SPECIALIST_MANIFEST } from '../captions-specialist/captions-specialist-manifest'
import { CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT } from '../captions-specialist/captions-specialist-qualification'
import { runCaptionsSpecialistJob } from '../captions-specialist/captions-specialist-runtime'
import {
  createCaptionsHarnessCall,
  runCaptionsInternalHarness,
} from '../internal-testing/captions-specialist-harness'

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}

function expectThrow(action: () => unknown, message: string): void {
  assert.throws(action)
  void message
  assertions += 1
}

function redigestCall(call: OrchestraSkillCall): OrchestraSkillCall {
  const candidate = structuredClone(call)
  candidate.callDigestSha256 = calculateSkillContractDigest(
    candidate as unknown as Record<string, unknown>,
    'callDigestSha256',
  )
  return parseOrchestraSkillCall(candidate)
}

check(
  SKILL_CAPABILITY_MANIFEST_SCHEMA_VERSION === 'skill-capability-manifest-v1',
  'Manifest v1 must remain frozen.',
)
check(
  CAPTIONS_SPECIALIST_MANIFEST.manifestSchemaVersion
    === SKILL_CAPABILITY_MANIFEST_SCHEMA_VERSION_V2,
  'Caption must publish the additive manifest v2.',
)
check(
  CAPTIONS_SPECIALIST_MANIFEST.skillKey === CAPTIONS_SPECIALIST_SKILL_KEY,
  'Caption skill identity must be exact.',
)
check(
  CAPTIONS_SPECIALIST_MANIFEST.supportedJobTypes.length
    === CAPTIONS_SUPPORTED_JOB_TYPES.length,
  'Every required Caption job must be declared.',
)
check(
  CAPTIONS_SPECIALIST_MANIFEST.capabilityEntries.length
    === CAPTIONS_SUPPORTED_JOB_TYPES.length,
  'Every Caption job must have one capability entry.',
)
check(
  CAPTIONS_SPECIALIST_MANIFEST.unsupportedJobTypes.length
    === CAPTIONS_UNSUPPORTED_JOB_TYPES.length,
  'Every forbidden Caption owner action must be declared.',
)
check(
  CAPTIONS_SPECIALIST_MANIFEST.canOwnPrimaryVisual
    && CAPTIONS_SPECIALIST_MANIFEST.canOwnPrimaryAnalysis,
  'Caption must declare its bounded primary typography ownership.',
)
check(
  CAPTIONS_SPECIALIST_MANIFEST.invocationPolicy.hqMediated
    && !CAPTIONS_SPECIALIST_MANIFEST.invocationPolicy.directPeerDispatchAllowed,
  'Calls and support must remain HQ mediated.',
)
check(
  CAPTIONS_SPECIALIST_MANIFEST.qualificationByExecutionMode.preview_execution
    === 'blocked'
    && CAPTIONS_SPECIALIST_MANIFEST.qualificationByExecutionMode.final_execution
      === 'blocked',
  'CAP-01 cannot qualify preview or final media execution.',
)

const v2RoundTrip = parseSkillCapabilityManifestV2(
  structuredClone(CAPTIONS_SPECIALIST_MANIFEST),
)
check(
  v2RoundTrip.manifestHash === CAPTIONS_SPECIALIST_MANIFEST.manifestHash,
  'Manifest v2 must round-trip with its exact hash.',
)

const {
  canOwnPrimaryAnalysis: _analysis,
  invocationPolicy: _invocation,
  resultContract: _result,
  failureSemantics: _failure,
  securityPolicyRef: _security,
  manifestHash: _hash,
  manifestSchemaVersion: _version,
  ...v1Body
} = structuredClone(CAPTIONS_SPECIALIST_MANIFEST)
void _analysis
void _invocation
void _result
void _failure
void _security
void _hash
void _version
const v1Published = publishSkillCapabilityManifest({
  ...v1Body,
  manifestSchemaVersion: SKILL_CAPABILITY_MANIFEST_SCHEMA_VERSION,
} as Omit<SkillCapabilityManifest, 'manifestHash'>)
check(
  v1Published.manifestSchemaVersion === SKILL_CAPABILITY_MANIFEST_SCHEMA_VERSION,
  'Manifest v1 must remain readable after v2 is added.',
)

check(
  CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT.jobEntries.length
    === CAPTIONS_SUPPORTED_JOB_TYPES.length,
  'Qualification must be per job.',
)
check(
  CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT.jobEntries.every(
    (entry) => entry.status === 'qualified'
      && entry.qualifiedModes.length === 1
      && entry.qualifiedModes[0] === 'planning',
  ),
  'CAP-01 qualification must be planning-only per job.',
)
check(
  !CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT.wholeSkillQualificationClaimed
    && !CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT.productionQualificationClaimed,
  'Qualification must not overclaim the whole skill or production.',
)

const videoCall = createCaptionsHarnessCall({
  callId: 'call.video.strategy',
  jobType: 'plan_caption_strategy',
  scopeLevel: 'video',
})
const videoRun = runCaptionsInternalHarness({ call: videoCall })
check(videoRun.initialResult.disposition === 'completed', 'Video planning must complete.')
check(
  videoRun.initialResult.canonicalScope.workspaceId
    === videoCall.canonicalScope.workspaceId,
  'Result must echo exact canonical scope.',
)
check(
  JSON.stringify(videoRun.authorityStateBefore)
    === JSON.stringify(videoRun.authorityStateAfter),
  'Harness authority state must remain unchanged.',
)

const sceneRun = runCaptionsInternalHarness({
  call: createCaptionsHarnessCall({
    callId: 'call.scene.reserve',
    jobType: 'reserve_caption_space',
    scopeLevel: 'scene',
  }),
})
check(sceneRun.initialResult.disposition === 'completed', 'Scene planning must complete.')

const boundaryRun = runCaptionsInternalHarness({
  call: createCaptionsHarnessCall({
    callId: 'call.boundary.timing',
    jobType: 'prepare_caption_boundary_timing_requirements',
    scopeLevel: 'boundary',
  }),
})
check(boundaryRun.initialResult.disposition === 'completed', 'Boundary planning must complete.')

const followupRun = runCaptionsInternalHarness({
  call: createCaptionsHarnessCall({
    callId: 'call.scene.hero',
    jobType: 'resolve_hero_typography',
    scopeLevel: 'scene',
  }),
  autoResumeSingleSupportRequest: true,
})
check(
  followupRun.initialResult.disposition === 'needs_followup',
  'Advanced visual work must wait for Visual Intelligence.',
)
check(
  followupRun.capturedSupportRequests.length === 1
    && followupRun.capturedSupportRequests[0].targetSkillKey
      === 'visual_intelligence',
  'Visual follow-up must target the shared Visual Intelligence owner.',
)
check(
  followupRun.capturedSupportRequests[0].mediationPolicy.hqMediated
    && !followupRun.capturedSupportRequests[0]
      .mediationPolicy.directPeerDispatchAllowed,
  'Support requests cannot execute peers directly.',
)
check(
  followupRun.resumedResult?.disposition === 'blocked'
    && followupRun.resumedResult.reasonCodes.join('|')
      === 'input.visual_intelligence.payload.missing',
  'A reference-only Visual Intelligence injection must fail closed.',
)
check(
  followupRun.resumedCall !== null
    && runCaptionsSpecialistJob({ call: followupRun.resumedCall }).disposition
      === 'blocked',
  'Resume must reread the exact captured support request.',
)

const trackingResult = runCaptionsSpecialistJob({
  call: createCaptionsHarnessCall({
    callId: 'call.scene.occluded',
    jobType: 'resolve_subject_occluded_typography',
    scopeLevel: 'scene',
  }),
})
check(
  trackingResult.disposition === 'needs_followup'
    && trackingResult.supportRequests.some(
      (request) => request.targetSkillKey === 'track_all'),
  'Mask-dependent work must request Track All evidence.',
)
check(
  !(trackingResult.supportRequests.map(
    (request) => request.targetSkillKey,
  ) as string[]).includes('sam3_1'),
  'Caption must never invoke SAM 3.1 directly.',
)

const unsupportedResult = runCaptionsSpecialistJob({
  call: createCaptionsHarnessCall({
    callId: 'call.unsupported.timeline',
    jobType: 'mutate_timeline',
    scopeLevel: 'video',
  }),
})
check(
  unsupportedResult.disposition === 'unsupported',
  'Forbidden owner work must be explicitly unsupported.',
)

const privateCall = createCaptionsHarnessCall({
  callId: 'call.private.blocked',
  jobType: 'plan_caption_strategy',
  scopeLevel: 'video',
  requestedMode: 'private_internal',
})
check(
  runCaptionsSpecialistJob({ call: privateCall }).disposition === 'blocked',
  'Private execution must remain blocked at CAP-01.',
)

const wrongAssignee = structuredClone(videoCall)
wrongAssignee.assigneeSkillKey = 'living_frame'
check(
  runCaptionsSpecialistJob({ call: redigestCall(wrongAssignee) }).disposition
    === 'blocked',
  'Wrong assignee must fail closed.',
)

const staleManifest = structuredClone(videoCall)
staleManifest.manifestRef.contentHash = 'a'.repeat(64)
check(
  runCaptionsSpecialistJob({ call: redigestCall(staleManifest) }).disposition
    === 'blocked',
  'Stale manifest binding must fail closed.',
)

const staleQualification = structuredClone(videoCall)
staleQualification.qualificationSnapshotRef.contentHash = 'b'.repeat(64)
check(
  runCaptionsSpecialistJob({ call: redigestCall(staleQualification) }).disposition
    === 'blocked',
  'Stale qualification binding must fail closed.',
)

const peerCaller = structuredClone(videoCall) as unknown as Record<string, unknown>
;(peerCaller.caller as Record<string, unknown>).callerKind = 'captions'
peerCaller.callDigestSha256 = calculateSkillContractDigest(
  peerCaller,
  'callDigestSha256',
)
expectThrow(
  () => parseOrchestraSkillCall(peerCaller),
  'Caption cannot become a peer caller.',
)

const authorityEscalation = structuredClone(videoCall) as unknown as Record<string, unknown>
;(authorityEscalation.authorityBoundary as Record<string, unknown>)
  .timelineMutationGranted = true
authorityEscalation.callDigestSha256 = calculateSkillContractDigest(
  authorityEscalation,
  'callDigestSha256',
)
expectThrow(
  () => parseOrchestraSkillCall(authorityEscalation),
  'Truthy authority must be refused.',
)

const missingScene = structuredClone(sceneRun.initialCall)
missingScene.canonicalScope.sceneId = null
expectThrow(
  () => redigestCall(missingScene),
  'Scene scope without sceneId must be refused.',
)

const overlap = structuredClone(videoCall)
overlap.canonicalScope.authorizedFrameRanges = [
  { startFrame: 0, endFrameExclusive: 100 },
  { startFrame: 50, endFrameExclusive: 150 },
]
expectThrow(() => redigestCall(overlap), 'Overlapping ranges must be refused.')

const unboundInjection = structuredClone(videoCall)
unboundInjection.injectedSupportArtifactRefs = [{
  ...unboundInjection.inputArtifactRefs[0],
  id: 'artifact.unbound',
  sourceSupportRequestRef: null,
}]
expectThrow(
  () => redigestCall(unboundInjection),
  'Unbound injected support evidence must be refused.',
)

const tamperedDigest = structuredClone(videoCall)
tamperedDigest.callDigestSha256 = 'c'.repeat(64)
expectThrow(
  () => parseOrchestraSkillCall(tamperedDigest),
  'Tampered call digest must be refused.',
)

const inheritedCall = Object.create({ injected: true })
Object.assign(inheritedCall, videoCall)
expectThrow(
  () => parseOrchestraSkillCall(inheritedCall),
  'Inherited contract objects must be refused.',
)

const accessorCall = structuredClone(videoCall)
Object.defineProperty(accessorCall, 'callId', {
  get: () => 'call.accessor',
  enumerable: true,
})
expectThrow(
  () => parseOrchestraSkillCall(accessorCall),
  'Accessor fields must be refused.',
)

const cyclicCall = structuredClone(videoCall) as unknown as Record<string, unknown>
cyclicCall.cycle = cyclicCall
expectThrow(() => parseOrchestraSkillCall(cyclicCall), 'Cycles must be refused.')

const sparseCall = structuredClone(videoCall)
sparseCall.inputArtifactRefs = new Array(2)
expectThrow(
  () => parseOrchestraSkillCall(sparseCall),
  'Sparse arrays must be refused.',
)

const unsafeTextCall = structuredClone(videoCall)
unsafeTextCall.caller.callerId = 'https://unsafe.example'
expectThrow(
  () => redigestCall(unsafeTextCall),
  'URL-shaped text must be refused.',
)

const unknownManifestField = {
  ...structuredClone(CAPTIONS_SPECIALIST_MANIFEST),
  hiddenDispatcher: true,
}
expectThrow(
  () => parseSkillCapabilityManifestV2(unknownManifestField),
  'Unknown manifest fields must be refused.',
)

const duplicateQualification = structuredClone(
  CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT,
)
duplicateQualification.jobEntries.push(
  structuredClone(duplicateQualification.jobEntries[0]),
)
duplicateQualification.snapshotDigestSha256 = calculateSkillContractDigest(
  duplicateQualification as unknown as Record<string, unknown>,
  'snapshotDigestSha256',
)
expectThrow(
  () => parseSkillQualificationSnapshot(duplicateQualification),
  'Duplicate per-job qualification must be refused.',
)

check(
  followupRun.capturedSupportRequests.every((request) => {
    parseSkillSupportRequest(request)
    return true
  }),
  'Every captured support request must pass its public validator.',
)
check(
  [videoRun, sceneRun, boundaryRun, followupRun].every((run) => {
    parseOrchestraSkillJobResult(run.initialResult)
    if (run.resumedResult) parseOrchestraSkillJobResult(run.resumedResult)
    return true
  }),
  'Every harness result must pass its public validator.',
)

const manifestHashRecomputed = calculateSkillCapabilityManifestHash(
  CAPTIONS_SPECIALIST_MANIFEST,
)
check(
  manifestHashRecomputed === CAPTIONS_SPECIALIST_MANIFEST.manifestHash,
  'Published manifest hash must recompute exactly.',
)

process.stdout.write(`${JSON.stringify({
  status: 'passed',
  milestone: 'CAP-01',
  contractVersion: ORCHESTRA_SKILL_CALL_VERSION,
  manifestVersion: SKILL_CAPABILITY_MANIFEST_SCHEMA_VERSION_V2,
  supportedJobCount: CAPTIONS_SUPPORTED_JOB_TYPES.length,
  assertions,
  privateRuntimeStarted: false,
  providerCallMade: false,
  directPeerDispatchCreated: false,
  orchestraImplemented: false,
  authorityPromoted: false,
}, null, 2)}\n`)
