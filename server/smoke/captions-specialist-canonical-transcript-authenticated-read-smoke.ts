import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  CaptionCanonicalTranscriptAuthenticatedReadBinding,
} from '../../src/types/caption-canonical-transcript-authenticated-read'
import type { CaptionCanonicalTranscript } from
  '../../src/types/caption-transcript-lineage'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import {
  CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_ADAPTER_RECEIPT,
  admitCaptionCanonicalTranscriptFromAuthenticatedRead,
  parseCaptionCanonicalTranscriptAuthenticatedReadAdapterReceipt,
  parseCaptionCanonicalTranscriptAuthenticatedReadBinding,
} from '../captions-specialist/caption-canonical-transcript-authenticated-read'
import { parseCaptionCanonicalTranscript } from
  '../captions-specialist/caption-transcript-lineage'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import { parseOrchestraSkillCall } from
  '../orchestra/orchestra-skill-contracts'
import { runCaptionsSpecialistJob } from
  '../captions-specialist/captions-specialist-runtime'
import { createCaptionsHarnessCall } from
  '../internal-testing/captions-specialist-harness'

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}
function expectThrow(action: () => unknown): void {
  assert.throws(action)
  assertions += 1
}
function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
function ref(id: string, version = `${id}.v1`): CaptionDomainRef {
  return { id, version, contentHash: hash(id) }
}
function redigest<T extends Record<string, unknown>>(
  value: T,
  digestField: string,
): T {
  const clone = structuredClone(value)
  clone[digestField as keyof T] = calculateSkillContractDigest(
    clone, digestField) as T[keyof T]
  return clone
}

const sourcePackageRef = ref(
  'speech.package.authenticated.1',
  'canonical-source-speech-evidence-package-v1')
const alignmentRef = ref(
  'alignment.qualification.authenticated.1',
  'caption-alignment-qualification-v1')
const wordTimingRef = ref(
  'word.timing.authenticated.1', 'canonical-word-timestamp-artifact-v1')
const sourceRecordRef = ref(
  'source.speech.authenticated.1',
  'canonical-source-speech-evidence-record-v1')
const transcriptWithoutDigest: Omit<CaptionCanonicalTranscript,
  'transcriptDigestSha256'> = {
  schemaVersion: 'caption-canonical-transcript-v1',
  transcriptId: 'caption.transcript.authenticated.1',
  workspaceId: 'workspace.transcript.1',
  projectId: 'project.transcript.1',
  editSessionId: 'edit.transcript.1',
  languageCode: 'en-US',
  sourceSpeechEvidencePackageRef: sourcePackageRef,
  alignmentQualificationRef: alignmentRef,
  segments: [{
    sourceSegmentId: 'segment.transcript.1',
    sourceSequenceItemId: 'source.transcript.1',
    order: 1,
    startMilliseconds: 0,
    endMillisecondsExclusive: 1_200,
    text: 'Clear captions matter',
    confidenceBasisPoints: 9_800,
    exactSourceWordIds: [
      'word.transcript.clear',
      'word.transcript.captions',
      'word.transcript.matter',
    ],
    sourceRecordRef,
  }],
  words: [
    ['word.transcript.clear', 'Clear', 0, 300],
    ['word.transcript.captions', 'captions', 340, 720],
    ['word.transcript.matter', 'matter', 760, 1_100],
  ].map(([sourceWordId, text, start, end], index) => ({
    sourceWordId: String(sourceWordId),
    sourceSegmentId: 'segment.transcript.1',
    sourceSequenceItemId: 'source.transcript.1',
    orderInSegment: index + 1,
    text: String(text),
    startMilliseconds: Number(start),
    endMillisecondsExclusive: Number(end),
    confidenceBasisPoints: 9_800,
    timestampProvenance: 'asr_native' as const,
    wordTimingArtifactRef: wordTimingRef,
    timestampEvidenceRef: wordTimingRef,
    speakerId: null,
    diarizationArtifactRef: null,
  })),
  immutable: true,
  singleCanonicalTranscript: true,
  rawChatIncluded: false,
  browserShareable: false,
  privateArtifact: true,
  timingAuthorityClaimed: false,
}
const transcript: CaptionCanonicalTranscript = parseCaptionCanonicalTranscript({
  ...transcriptWithoutDigest,
  transcriptDigestSha256: calculateSkillContractDigest({
    ...transcriptWithoutDigest,
    transcriptDigestSha256: '',
  }, 'transcriptDigestSha256'),
})
const approvedSnapshotRef = ref(
  'snapshot.transcript.1', 'approved-plan-snapshot-v1')
const expectedCanonicalScope = {
  ownerUserId: 'owner.transcript.1',
  workspaceId: transcript.workspaceId,
  projectId: transcript.projectId,
  editSessionId: transcript.editSessionId,
  planVersionId: 'plan.transcript.1',
  approvedSnapshotRef,
  outputId: 'output.transcript.1',
  sceneId: 'scene.transcript.1',
  authorizedFrameRanges: [{ startFrame: 0, endFrameExclusive: 180 }],
}
const bindingWithoutDigest: Omit<
  CaptionCanonicalTranscriptAuthenticatedReadBinding,
  'bindingDigestSha256'
> = {
  schemaVersion:
    'caption-canonical-transcript-authenticated-read-binding-v1',
  bindingId: 'binding.transcript.authenticated.1',
  ownerKey: 'canonical_transcript',
  consumerSkillKey: 'captions',
  artifactType: 'canonical_transcript',
  canonicalReadScope: {
    ownerUserId: expectedCanonicalScope.ownerUserId,
    workspaceId: expectedCanonicalScope.workspaceId,
    projectId: expectedCanonicalScope.projectId,
    editSessionId: expectedCanonicalScope.editSessionId,
    planVersionId: expectedCanonicalScope.planVersionId,
    approvedSnapshotRef,
  },
  canonicalTranscriptRef: {
    id: transcript.transcriptId,
    version: transcript.schemaVersion,
    contentHash: transcript.transcriptDigestSha256,
  },
  sourceSpeechEvidencePackageRef: sourcePackageRef,
  alignmentQualificationRef: alignmentRef,
  diarizationArtifactRefs: [],
  speakerDiarizationState: 'not_present',
  persistenceReadReceiptRef: ref(
    'read.transcript.authenticated.1',
    'canonical-transcript-authenticated-read-record-v1'),
  authenticatedOwnerEvidenceRef: ref(
    'evidence.transcript.authenticated.1',
    'canonical-transcript-authenticated-owner-evidence-v1'),
  exactPrivateArtifactRereadVerified: true,
  exactTranscriptDigestRecomputed: true,
  exactTenantScopeVerified: true,
  exactApprovedSnapshotVerified: true,
  exactSourceAndAlignmentLineageVerified: true,
  exactDiarizationLineageVerified: true,
  immutableTranscriptVerified: true,
  singleCanonicalTranscriptVerified: true,
  privateArtifact: true,
  byteFreeBinding: true,
  canonicalTranscriptPayloadEmbedded: false,
  transcriptTextIncluded: false,
  mediaBytesIncluded: false,
  mediaLocatorIncluded: false,
  rawChatIncluded: false,
  credentialsIncluded: false,
  browserLocalCompletionAccepted: false,
  transcriptMutationAuthorityGranted: false,
  timingAuthorityGranted: false,
  runtimeOrDispatchAuthorityGranted: false,
  assetMutationAuthorityGranted: false,
  finalQaApprovalGranted: false,
  billingAuthorityGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}
const binding: CaptionCanonicalTranscriptAuthenticatedReadBinding = {
  ...bindingWithoutDigest,
  bindingDigestSha256: calculateSkillContractDigest({
    ...bindingWithoutDigest,
    bindingDigestSha256: '',
  }, 'bindingDigestSha256'),
}

check(parseCaptionCanonicalTranscriptAuthenticatedReadBinding(binding)
  .bindingDigestSha256 === binding.bindingDigestSha256,
'The byte-free authenticated-read binding parses with its exact digest.')
check(admitCaptionCanonicalTranscriptFromAuthenticatedRead({
  binding,
  canonicalTranscript: transcript,
  expectedCanonicalScope,
}).transcriptDigestSha256 === transcript.transcriptDigestSha256,
'The exact persisted transcript is admitted for its approved Caption scope.')
check(binding.speakerDiarizationState === 'not_present'
  && binding.diarizationArtifactRefs.length === 0,
'A non-diarized transcript must state that no diarization lineage is present.')
check(!binding.transcriptTextIncluded && !binding.mediaBytesIncluded
  && !binding.mediaLocatorIncluded && !binding.rawChatIncluded
  && !binding.browserLocalCompletionAccepted,
'The coordination binding contains no transcript text, media, locator, or browser completion.')
check(!binding.transcriptMutationAuthorityGranted
  && !binding.timingAuthorityGranted
  && !binding.runtimeOrDispatchAuthorityGranted
  && !binding.assetMutationAuthorityGranted
  && !binding.finalQaApprovalGranted
  && !binding.productionAuthorityGranted,
'Authenticated reread grants no mutation, timing, runtime, QA, or production authority.')

const runtimeCallCandidate = createCaptionsHarnessCall({
  callId: 'caption.transcript.runtime.1',
  jobType: 'resolve_multi_track_caption_scene',
  scopeLevel: 'scene',
  runtimeProfile: 'post_cap20_integration',
  approvedSnapshotRef,
  outputId: expectedCanonicalScope.outputId,
  sceneId: expectedCanonicalScope.sceneId,
  inputArtifactTypes: [
    'canonical_transcript',
    'canonical_transcript_authenticated_read_binding',
    'confirmed_output_frame',
    'master_timing_or_planning_timing',
    'visual_intelligence_report',
  ],
})
runtimeCallCandidate.canonicalScope = {
  ...runtimeCallCandidate.canonicalScope,
  ownerUserId: expectedCanonicalScope.ownerUserId,
  workspaceId: expectedCanonicalScope.workspaceId,
  projectId: expectedCanonicalScope.projectId,
  editSessionId: expectedCanonicalScope.editSessionId,
  approvedSnapshotRef,
  outputId: expectedCanonicalScope.outputId,
  sceneId: expectedCanonicalScope.sceneId,
  authorizedFrameRanges: structuredClone(
    expectedCanonicalScope.authorizedFrameRanges),
}
runtimeCallCandidate.inputArtifactRefs =
  runtimeCallCandidate.inputArtifactRefs.map((artifact) => {
    if (artifact.artifactType === 'canonical_transcript') {
      return {
        ...artifact,
        id: transcript.transcriptId,
        version: transcript.schemaVersion,
        contentHash: transcript.transcriptDigestSha256,
      }
    }
    if (artifact.artifactType
      === 'canonical_transcript_authenticated_read_binding') {
      return {
        ...artifact,
        id: binding.bindingId,
        version: binding.schemaVersion,
        contentHash: binding.bindingDigestSha256,
      }
    }
    return artifact
  })
const runtimeCall = parseOrchestraSkillCall(redigest(
  runtimeCallCandidate as unknown as Record<string, unknown>,
  'callDigestSha256'))
const runtimeAdmission = runCaptionsSpecialistJob({
  call: runtimeCall,
  canonicalTranscript: transcript,
  canonicalTranscriptAuthenticatedReadBinding: binding,
})
check(runtimeAdmission.disposition === 'completed'
  && runtimeAdmission.reasonCodes.includes(
    'canonical_transcript.contract_admission.accepted'),
'The specialist runtime admits the exact transcript payload and reread binding.')
const referenceOnlyRuntime = runCaptionsSpecialistJob({ call: runtimeCall })
check(referenceOnlyRuntime.disposition === 'blocked'
  && referenceOnlyRuntime.reasonCodes.join('|')
    === 'input.canonical_transcript.authenticated_payload.missing',
'Transcript and binding references alone cannot impersonate persisted content.')
const incompleteRuntimeInput = runCaptionsSpecialistJob({
  call: runtimeCall,
  canonicalTranscript: transcript,
})
check(incompleteRuntimeInput.disposition === 'blocked'
  && incompleteRuntimeInput.reasonCodes.join('|')
    === 'input.canonical_transcript.payload_or_binding.missing',
'Runtime admission requires the transcript payload and binding together.')
const crossedRuntimeBinding = redigest({
  ...binding,
  canonicalReadScope: {
    ...binding.canonicalReadScope,
    workspaceId: 'workspace.transcript.crossed',
  },
} as unknown as Record<string, unknown>, 'bindingDigestSha256')
const crossedRuntimeAdmission = runCaptionsSpecialistJob({
  call: runtimeCall,
  canonicalTranscript: transcript,
  canonicalTranscriptAuthenticatedReadBinding: crossedRuntimeBinding,
})
check(crossedRuntimeAdmission.disposition === 'blocked'
  && crossedRuntimeAdmission.reasonCodes.join('|')
    === 'input.canonical_transcript.admission.failed',
'A digest-valid cross-workspace transcript binding fails runtime admission.')
const crossedRuntimeCallCandidate = structuredClone(runtimeCall)
const transcriptArtifact = crossedRuntimeCallCandidate.inputArtifactRefs.find(
  (artifact) => artifact.artifactType === 'canonical_transcript')
assert.ok(transcriptArtifact)
transcriptArtifact.contentHash = hash('transcript.runtime.crossed')
const crossedRuntimeCall = parseOrchestraSkillCall(redigest(
  crossedRuntimeCallCandidate as unknown as Record<string, unknown>,
  'callDigestSha256'))
check(runCaptionsSpecialistJob({
  call: crossedRuntimeCall,
  canonicalTranscript: transcript,
  canonicalTranscriptAuthenticatedReadBinding: binding,
}).reasonCodes.join('|') === 'input.canonical_transcript.admission.failed',
'A crossed transcript artifact reference cannot satisfy runtime admission.')

const diarizationRef = ref(
  'diarization.transcript.1', 'canonical-speaker-diarization-artifact-v1')
const diarizedTranscript = structuredClone(transcript)
diarizedTranscript.words = diarizedTranscript.words.map((word) => ({
  ...word,
  speakerId: 'speaker.primary',
  diarizationArtifactRef: diarizationRef,
}))
const diarizedTranscriptRecord = redigest(
  diarizedTranscript as unknown as Record<string, unknown>,
  'transcriptDigestSha256') as unknown as CaptionCanonicalTranscript
const diarizedBinding = structuredClone(binding)
diarizedBinding.bindingId = 'binding.transcript.authenticated.diarized'
diarizedBinding.canonicalTranscriptRef.contentHash =
  diarizedTranscriptRecord.transcriptDigestSha256
diarizedBinding.diarizationArtifactRefs = [diarizationRef]
diarizedBinding.speakerDiarizationState = 'complete'
const validDiarizedBinding = redigest(
  diarizedBinding as unknown as Record<string, unknown>,
  'bindingDigestSha256')
check(admitCaptionCanonicalTranscriptFromAuthenticatedRead({
  binding: validDiarizedBinding,
  canonicalTranscript: diarizedTranscriptRecord,
  expectedCanonicalScope,
}).words.every((word) => word.speakerId === 'speaker.primary'),
'Complete speaker lineage is admitted only when every word is diarized.')

const receipt = parseCaptionCanonicalTranscriptAuthenticatedReadAdapterReceipt(
  CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_ADAPTER_RECEIPT)
check(receipt.initialCallArtifactType === 'canonical_transcript'
  && receipt.authenticatedReadEvidenceArtifactType
    === 'canonical_transcript_authenticated_read_binding'
  && receipt.initialCallPrerequisite
  && !receipt.directPeerDispatchAllowed,
'The receipt freezes transcript plus authenticated-read evidence as initial inputs.')
check(!receipt.transcriptOwnerImplementedByCaption
  && !receipt.persistenceReaderImplementedByCaption
  && !receipt.authenticatedPrivateResultIntegrated
  && !receipt.productionAuthorityGranted,
'The Caption adapter does not claim transcript ownership or mounted runtime.')

const staleBinding = structuredClone(binding)
staleBinding.canonicalReadScope.workspaceId = 'workspace.other'
expectThrow(() => parseCaptionCanonicalTranscriptAuthenticatedReadBinding(
  staleBinding))
const crossedScopeBinding = redigest({
  ...binding,
  canonicalReadScope: {
    ...binding.canonicalReadScope,
    workspaceId: 'workspace.other',
  },
} as unknown as Record<string, unknown>, 'bindingDigestSha256')
expectThrow(() => admitCaptionCanonicalTranscriptFromAuthenticatedRead({
  binding: crossedScopeBinding,
  canonicalTranscript: transcript,
  expectedCanonicalScope,
}))
const crossedSnapshotBinding = redigest({
  ...binding,
  canonicalReadScope: {
    ...binding.canonicalReadScope,
    approvedSnapshotRef: ref(
      'snapshot.other', 'approved-plan-snapshot-v1'),
  },
} as unknown as Record<string, unknown>, 'bindingDigestSha256')
expectThrow(() => admitCaptionCanonicalTranscriptFromAuthenticatedRead({
  binding: crossedSnapshotBinding,
  canonicalTranscript: transcript,
  expectedCanonicalScope,
}))
const crossedTranscriptBinding = redigest({
  ...binding,
  canonicalTranscriptRef: {
    ...binding.canonicalTranscriptRef,
    contentHash: hash('transcript.other'),
  },
} as unknown as Record<string, unknown>, 'bindingDigestSha256')
expectThrow(() => admitCaptionCanonicalTranscriptFromAuthenticatedRead({
  binding: crossedTranscriptBinding,
  canonicalTranscript: transcript,
  expectedCanonicalScope,
}))
const wrongSourceBinding = redigest({
  ...binding,
  sourceSpeechEvidencePackageRef: ref(
    'speech.package.other',
    'canonical-source-speech-evidence-package-v1'),
} as unknown as Record<string, unknown>, 'bindingDigestSha256')
expectThrow(() => admitCaptionCanonicalTranscriptFromAuthenticatedRead({
  binding: wrongSourceBinding,
  canonicalTranscript: transcript,
  expectedCanonicalScope,
}))

const partialDiarizedTranscript = structuredClone(diarizedTranscriptRecord)
partialDiarizedTranscript.words[0].speakerId = null
partialDiarizedTranscript.words[0].diarizationArtifactRef = null
const validPartialTranscript = redigest(
  partialDiarizedTranscript as unknown as Record<string, unknown>,
  'transcriptDigestSha256')
const partialBinding = structuredClone(diarizedBinding)
partialBinding.canonicalTranscriptRef.contentHash =
  validPartialTranscript.transcriptDigestSha256 as string
expectThrow(() => admitCaptionCanonicalTranscriptFromAuthenticatedRead({
  binding: redigest(partialBinding as unknown as Record<string, unknown>,
    'bindingDigestSha256'),
  canonicalTranscript: validPartialTranscript,
  expectedCanonicalScope,
}))

const overclaim = structuredClone(binding) as unknown as Record<string, unknown>
overclaim.runtimeOrDispatchAuthorityGranted = true
expectThrow(() => parseCaptionCanonicalTranscriptAuthenticatedReadBinding(
  redigest(overclaim, 'bindingDigestSha256')))
const unsafe = structuredClone(binding) as unknown as Record<string, unknown>
unsafe.bindingId = '/tmp/transcript-binding'
expectThrow(() => parseCaptionCanonicalTranscriptAuthenticatedReadBinding(
  redigest(unsafe, 'bindingDigestSha256')))
expectThrow(() => parseCaptionCanonicalTranscriptAuthenticatedReadBinding({
  ...binding,
  transcriptText: 'forbidden',
}))
const inherited = Object.create({ productionAuthorityGranted: true })
Object.assign(inherited, structuredClone(binding))
expectThrow(() => parseCaptionCanonicalTranscriptAuthenticatedReadBinding(
  inherited))
const cyclic = structuredClone(binding) as unknown as Record<string, unknown>
cyclic.cycle = cyclic
expectThrow(() => parseCaptionCanonicalTranscriptAuthenticatedReadBinding(
  cyclic))

console.log(JSON.stringify({
  smoke: 'captions_specialist_canonical_transcript_authenticated_read',
  assertions,
  transcriptVersion: transcript.schemaVersion,
  bindingVersion: binding.schemaVersion,
  adapterVersion: receipt.schemaVersion,
  adapterDigestSha256: receipt.adapterDigestSha256,
  authenticatedPrivateResultIntegrated: false,
  directPeerDispatchAllowed: false,
  productionAuthorityGranted: false,
  result: 'passed',
}, null, 2))
