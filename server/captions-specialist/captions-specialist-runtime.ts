import { createHash } from 'node:crypto'
import {
  CAPTIONS_CAP_01_ARTIFACT_TYPE,
  CAPTIONS_SPECIALIST_SKILL_KEY,
  CAPTIONS_SUPPORTED_JOB_TYPES,
  CAPTIONS_UNSUPPORTED_JOB_TYPES,
} from '../../src/types/captions-specialist'
import {
  ORCHESTRA_SKILL_CALL_VERSION,
  ORCHESTRA_SKILL_JOB_RESULT_VERSION,
  SKILL_SUPPORT_REQUEST_VERSION,
  type OrchestraSkillCall,
  type OrchestraSkillJobResult,
  type SkillArtifactRef,
  type SkillContractRef,
  type SkillQualificationSnapshot,
  type SkillSupportRequest,
  type SkillSupportTarget,
} from '../../src/types/orchestra-skill-contracts'
import type {
  CaptionVisualIntelligenceEvidencePacket,
  CaptionVisualIntelligenceSupportPayload,
} from '../../src/types/caption-visual-intelligence-support'
import type {
  CanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord,
} from '../../src/types/canonical-caption-visual-intelligence-support'
import type {
  CaptionTrackAllEvidencePacket,
  CaptionTrackAllPurpose,
  CaptionTrackAllSupportPayload,
} from '../../src/types/caption-track-all-support'
import type {
  CanonicalCaptionTrackAllAuthenticatedEvidenceRecord,
} from '../../src/types/canonical-caption-track-all-support'
import type { CaptionDomainCanonicalScope } from
  '../../src/types/caption-domain-contracts'
import type {
  CaptionSoundCueRequest,
  CaptionSoundSupportResult,
} from '../../src/types/caption-sound-support'
import {
  calculateSkillContractDigest,
  parseOrchestraSkillCall,
  parseOrchestraSkillJobResult,
  parseSkillQualificationSnapshot,
  parseSkillSupportRequest,
} from '../orchestra/orchestra-skill-contracts'
import { parseSkillCapabilityManifestV2 } from '../orchestra/skill-capability-manifest'
import { CAPTIONS_SPECIALIST_MANIFEST } from './captions-specialist-manifest'
import { CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT } from './captions-specialist-qualification'
import { CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST } from
  './captions-specialist-integration-manifest'
import { CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT } from
  './captions-specialist-integration-qualification'
import {
  BROLL_CAPTION_PUBLIC_RECEIPT_DIGEST,
  CAPTION_BROLL_OWNER_READ_ADAPTER_RECEIPT,
} from './caption-broll-owner-read-adapter'
import { BROLL_CAPTION_OWNER_READ_REQUEST_VERSION } from
  '../../src/types/caption-broll-owner-read-adapter'
import { CAPTIONS_CLOSED_AUTHORITY_BOUNDARY } from './caption-authority-boundary'
import {
  createCaptionVisualIntelligenceSupportRequest,
  parseCaptionVisualIntelligenceEvidencePacket,
  parseCaptionVisualIntelligenceSupportPayload,
} from './caption-visual-intelligence-support'
import {
  parseCaptionCanonicalVisualIntelligenceEvidenceRecord,
} from './caption-canonical-visual-intelligence-evidence-read'
import {
  createCaptionTrackAllSupportRequest,
  parseCaptionTrackAllEvidencePacket,
  parseCaptionTrackAllSupportPayload,
} from './caption-track-all-support'
import {
  parseCaptionCanonicalTrackAllEvidenceRecord,
} from './caption-canonical-track-all-evidence-read'
import {
  createCaptionSoundSupportRequest,
  parseCaptionSoundContext,
  parseCaptionSoundCueRequest,
  parseCaptionSoundSupportResult,
  type CaptionSoundContext,
} from './caption-sound-support'

interface CaptionRuntimeProfile {
  manifest: typeof CAPTIONS_SPECIALIST_MANIFEST
  qualification: SkillQualificationSnapshot
}

export { CAPTIONS_CLOSED_AUTHORITY_BOUNDARY } from './caption-authority-boundary'

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function exactRef(
  actual: SkillContractRef,
  expected: SkillContractRef,
): boolean {
  return actual.id === expected.id
    && actual.version === expected.version
    && actual.contentHash === expected.contentHash
}

function callRef(call: OrchestraSkillCall): SkillContractRef {
  return {
    id: call.callId,
    version: ORCHESTRA_SKILL_CALL_VERSION,
    contentHash: call.callDigestSha256,
  }
}

function manifestRef(profile: CaptionRuntimeProfile): SkillContractRef {
  return {
    id: profile.manifest.manifestId,
    version: profile.manifest.manifestSchemaVersion,
    contentHash: profile.manifest.manifestHash,
  }
}

function qualificationRef(profile: CaptionRuntimeProfile): SkillContractRef {
  return {
    id: profile.qualification.snapshotId,
    version: profile.qualification.schemaVersion,
    contentHash: profile.qualification.snapshotDigestSha256,
  }
}

function supportTargetForArtifact(
  artifactType: string,
): SkillSupportTarget | null {
  if (artifactType === 'visual_intelligence_report') return 'visual_intelligence'
  if (artifactType === 'track_all_mask_binding') return 'track_all'
  if (artifactType === 'caption_living_frame_handoff_binding') return 'living_frame'
  if (artifactType === 'caption_sound_support_result') return 'soundsync'
  if (artifactType === 'caption_broll_owner_read_binding') return 'broll_owner'
  if (artifactType === 'confirmed_output_frame') return 'canonical_layout_owner'
  if (artifactType === 'master_timing_or_planning_timing') {
    return 'canonical_timing_owner'
  }
  return null
}

function typedPayloadTypeForTarget(target: SkillSupportTarget): string {
  if (target === 'living_frame') {
    return 'caption-direction-living-frame-request-ref-v1'
  }
  if (target === 'visual_intelligence') {
    return 'caption-visual-intelligence-support-payload-ref-v1'
  }
  if (target === 'track_all') {
    return 'caption-track-all-support-payload-ref-v1'
  }
  if (target === 'soundsync') return 'caption-sound-cue-request-ref-v1'
  if (target === 'broll_owner') {
    return BROLL_CAPTION_OWNER_READ_REQUEST_VERSION
  }
  return `captions-${target}-support-request-v1`
}

function makeSupportRequest(
  call: OrchestraSkillCall,
  targetSkillKey: SkillSupportTarget,
  missingArtifactTypes: string[],
): SkillSupportRequest {
  const typedPayloadType = typedPayloadTypeForTarget(targetSkillKey)
  const requestWithoutDigest: Omit<SkillSupportRequest, 'requestDigestSha256'> = {
    schemaVersion: SKILL_SUPPORT_REQUEST_VERSION,
    requestId: `${call.callId}.support.${targetSkillKey}`,
    originalCallRef: callRef(call),
    requestingSkillKey: CAPTIONS_SPECIALIST_SKILL_KEY,
    targetSkillKey,
    reasonCode: `missing.${missingArtifactTypes.join('.')}`,
    requestedArtifactTypes: missingArtifactTypes,
    canonicalScope: structuredClone(call.canonicalScope),
    typedPayloadType,
    typedPayload: targetSkillKey === 'living_frame'
      ? {
          cap11ContractVersion: 'caption-direction-living-frame-adapter-v1',
          requestArtifactRequired: true,
          requestPayloadEmbedded: false,
          requestRemainsCaptionOwned: true,
        }
      : targetSkillKey === 'broll_owner'
        ? {
            publicContractReceiptRef: {
              id: 'broll.caption.public-contract.receipt',
              version: 'b_roll_caption_public_contract_receipt_v1',
              contentHash: BROLL_CAPTION_PUBLIC_RECEIPT_DIGEST,
            },
            captionAdapterRef: {
              id: CAPTION_BROLL_OWNER_READ_ADAPTER_RECEIPT.adapterId,
              version: CAPTION_BROLL_OWNER_READ_ADAPTER_RECEIPT.schemaVersion,
              contentHash:
                CAPTION_BROLL_OWNER_READ_ADAPTER_RECEIPT.adapterDigestSha256,
            },
            requestPayloadEmbedded: false,
            canonicalOwnerReadMustConstructExactRequest: true,
            exactScopeFrameTimingRereadRequired: true,
            requestIsByteFree: true,
            rawMediaOrChatIncluded: false,
          }
      : {
          exactArtifactTypes: missingArtifactTypes,
          typedPayloadRefRequired: true,
          typedPayloadEmbedded: false,
          requestIsByteFree: true,
          rawMediaOrChatIncluded: false,
        },
    mediationPolicy: {
      hqMediated: true,
      directPeerDispatchAllowed: false,
      assigneeMayOnlyResumeAfterInjection: true,
    },
    authorityBoundary: { ...CAPTIONS_CLOSED_AUTHORITY_BOUNDARY },
  }
  return parseSkillSupportRequest({
    ...requestWithoutDigest,
    requestDigestSha256: calculateSkillContractDigest(
      { ...requestWithoutDigest, requestDigestSha256: '' },
      'requestDigestSha256',
    ),
  })
}

function makeResult(
  profile: CaptionRuntimeProfile,
  call: OrchestraSkillCall,
  disposition: OrchestraSkillJobResult['disposition'],
  reasonCodes: string[],
  safeUserSummary: string,
  supportRequests: SkillSupportRequest[] = [],
  producedArtifactRefs: SkillArtifactRef[] = [],
): OrchestraSkillJobResult {
  const resultWithoutDigest: Omit<OrchestraSkillJobResult, 'resultDigestSha256'> = {
    schemaVersion: ORCHESTRA_SKILL_JOB_RESULT_VERSION,
    resultId: `${call.callId}.result`,
    disposition,
    originalCallRef: callRef(call),
    producerSkillKey: CAPTIONS_SPECIALIST_SKILL_KEY,
    jobType: call.job.jobType,
    manifestRef: manifestRef(profile),
    qualificationSnapshotRef: qualificationRef(profile),
    canonicalScope: structuredClone(call.canonicalScope),
    producedArtifactRefs,
    supportRequests,
    reasonCodes,
    safeUserSummary,
    replayBinding: {
      idempotencyKey: call.idempotencyKey,
      resumedFromSupportRequestRef:
        call.resumeOfSupportRequestRef === null
          ? null
          : structuredClone(call.resumeOfSupportRequestRef),
      resumeOriginCallRef:
        call.resumeOriginCallRef === null
          ? null
          : structuredClone(call.resumeOriginCallRef),
    },
    authorityBoundary: { ...CAPTIONS_CLOSED_AUTHORITY_BOUNDARY },
  }
  return parseOrchestraSkillJobResult({
    ...resultWithoutDigest,
    resultDigestSha256: calculateSkillContractDigest(
      { ...resultWithoutDigest, resultDigestSha256: '' },
      'resultDigestSha256',
    ),
  })
}

function requiredArtifactTypes(
  profile: CaptionRuntimeProfile,
  jobType: string,
): string[] {
  return profile.manifest.capabilityEntries.find(
    (entry) => entry.supportedJobType === jobType,
  )?.requiredEvidence ?? []
}

function missingArtifacts(
  profile: CaptionRuntimeProfile,
  call: OrchestraSkillCall,
  additionallySatisfied: readonly string[] = [],
): string[] {
  const present = new Set([
    ...call.inputArtifactRefs,
    ...call.injectedSupportArtifactRefs,
  ].map((ref) => ref.artifactType))
  for (const artifactType of additionallySatisfied) present.add(artifactType)
  return requiredArtifactTypes(profile, call.job.jobType)
    .filter((artifactType) => !present.has(artifactType))
}

function exactDomainScopeFields(
  call: OrchestraSkillCall,
  scope: CaptionDomainCanonicalScope,
): boolean {
  const callSnapshot = call.canonicalScope.approvedSnapshotRef
  const payloadSnapshot = scope.approvedSnapshotRef
  return call.canonicalScope.ownerUserId === scope.ownerUserId
    && call.canonicalScope.workspaceId === scope.workspaceId
    && call.canonicalScope.projectId === scope.projectId
    && call.canonicalScope.editSessionId === scope.editSessionId
    && call.canonicalScope.outputId === scope.outputId
    && call.canonicalScope.sceneId === scope.sceneId
    && JSON.stringify(call.canonicalScope.authorizedFrameRanges)
      === JSON.stringify(scope.authorizedFrameRanges)
    && ((callSnapshot === null && payloadSnapshot === null)
      || (callSnapshot !== null && payloadSnapshot !== null
        && exactRef(callSnapshot, payloadSnapshot)))
}

function exactScopeForDomainPayload(
  call: OrchestraSkillCall,
  scope: CaptionDomainCanonicalScope,
): boolean {
  return call.job.scopeLevel === 'scene'
    && call.canonicalScope.boundaryId === null
    && exactDomainScopeFields(call, scope)
}

function exactSoundScopeForPayload(
  call: OrchestraSkillCall,
  scope: CaptionDomainCanonicalScope,
): boolean {
  return exactDomainScopeFields(call, scope)
    && ((call.job.scopeLevel === 'scene'
      && call.canonicalScope.boundaryId === null)
      || (call.job.scopeLevel === 'boundary'
        && call.canonicalScope.boundaryId !== null))
}

function packetArtifactMatches(
  call: OrchestraSkillCall,
  request: SkillSupportRequest,
  packet: CaptionVisualIntelligenceEvidencePacket,
): boolean {
  const injected = call.injectedSupportArtifactRefs
  if (injected.length !== 1) return false
  const artifact = injected[0]
  const requestRef: SkillContractRef = {
    id: request.requestId,
    version: request.schemaVersion,
    contentHash: request.requestDigestSha256,
  }
  return artifact.id === packet.packetId
    && artifact.version === packet.schemaVersion
    && artifact.contentHash === packet.packetDigestSha256
    && artifact.artifactType
      === 'caption_visual_intelligence_occupancy_evidence'
    && artifact.producerSkillKey === 'visual_intelligence'
    && artifact.sourceSupportRequestRef !== null
    && exactRef(artifact.sourceSupportRequestRef, requestRef)
}

function trackAllPacketArtifactMatches(
  call: OrchestraSkillCall,
  request: SkillSupportRequest,
  packet: CaptionTrackAllEvidencePacket,
): boolean {
  const injected = call.injectedSupportArtifactRefs
  if (injected.length !== 1) return false
  const artifact = injected[0]
  const requestRef: SkillContractRef = {
    id: request.requestId,
    version: request.schemaVersion,
    contentHash: request.requestDigestSha256,
  }
  return artifact.id === packet.packetId
    && artifact.version === packet.schemaVersion
    && artifact.contentHash === packet.packetDigestSha256
    && artifact.artifactType === 'track_all_mask_binding'
    && artifact.producerSkillKey === 'track_all'
    && artifact.sourceSupportRequestRef !== null
    && exactRef(artifact.sourceSupportRequestRef, requestRef)
}

function expectedTrackAllPurpose(jobType: string): CaptionTrackAllPurpose | null {
  if (jobType === 'resolve_subject_occluded_typography') {
    return 'subject_occlusion'
  }
  if (jobType === 'resolve_object_anchored_typography') return 'object_anchor'
  if (jobType === 'resolve_environmental_typography') {
    return 'environmental_anchor'
  }
  return null
}

function isSoundSupportJob(jobType: string): boolean {
  return [
    'provide_typographic_transition_support',
    'prepare_caption_boundary_timing_requirements',
    'provide_typographic_transition_component',
  ].includes(jobType)
}

function soundResultArtifactMatches(
  call: OrchestraSkillCall,
  request: SkillSupportRequest,
  result: CaptionSoundSupportResult,
): boolean {
  const injected = call.injectedSupportArtifactRefs
  if (injected.length !== 1) return false
  const artifact = injected[0]
  const requestRef: SkillContractRef = {
    id: request.requestId,
    version: request.schemaVersion,
    contentHash: request.requestDigestSha256,
  }
  return artifact.id === result.resultId
    && artifact.version === result.schemaVersion
    && artifact.contentHash === result.resultDigestSha256
    && artifact.artifactType === 'caption_sound_support_result'
    && artifact.producerSkillKey === 'soundsync'
    && artifact.sourceSupportRequestRef !== null
    && exactRef(artifact.sourceSupportRequestRef, requestRef)
}

function qualificationEntry(
  snapshot: SkillQualificationSnapshot,
  jobType: string,
) {
  return snapshot.jobEntries.find((entry) => entry.jobType === jobType)
}

export function runCaptionsSpecialistJob(input: {
  call: unknown
  qualificationSnapshot?: unknown
  manifest?: unknown
  resumeSupportRequest?: unknown
  visualIntelligenceSupportPayload?: unknown
  visualIntelligenceEvidencePacket?: unknown
  canonicalVisualIntelligenceEvidenceRecord?: unknown
  trackAllSupportPayload?: unknown
  trackAllEvidencePacket?: unknown
  canonicalTrackAllEvidenceRecord?: unknown
  soundSupportContext?: unknown
  soundSupportPayload?: unknown
  soundSupportResult?: unknown
}): OrchestraSkillJobResult {
  const call = parseOrchestraSkillCall(input.call)
  const integrationProfile = call.manifestRef.id
    === CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestId
  const profile: CaptionRuntimeProfile = integrationProfile
    ? {
        manifest: CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST,
        qualification:
          CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT,
      }
    : {
        manifest: CAPTIONS_SPECIALIST_MANIFEST,
        qualification: CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT,
      }
  const manifest = parseSkillCapabilityManifestV2(
    input.manifest ?? profile.manifest,
  )
  const snapshot = parseSkillQualificationSnapshot(
    input.qualificationSnapshot ?? profile.qualification,
  )

  if (call.assigneeSkillKey !== CAPTIONS_SPECIALIST_SKILL_KEY) {
    return makeResult(profile,
      call, 'blocked', ['wrong.assignee'],
      'The assignment does not target the Caption specialist.',
    )
  }
  if (!exactRef(call.manifestRef, manifestRef(profile))
    || manifest.manifestHash !== profile.manifest.manifestHash) {
    return makeResult(profile,
      call, 'blocked', ['stale.manifest'],
      'The Caption manifest binding is stale or mismatched.',
    )
  }
  if (!exactRef(call.qualificationSnapshotRef, qualificationRef(profile))
    || snapshot.snapshotDigestSha256
      !== profile.qualification.snapshotDigestSha256) {
    return makeResult(profile,
      call, 'blocked', ['stale.qualification'],
      'The Caption qualification binding is stale or mismatched.',
    )
  }
  if ((CAPTIONS_UNSUPPORTED_JOB_TYPES as readonly string[])
    .includes(call.job.jobType)
    || !(CAPTIONS_SUPPORTED_JOB_TYPES as readonly string[])
      .includes(call.job.jobType)) {
    return makeResult(profile,
      call, 'unsupported', ['unsupported.job'],
      'The requested job is outside Caption specialist ownership.',
    )
  }

  const entry = qualificationEntry(snapshot, call.job.jobType)
  if (!entry || entry.status === 'disabled') {
    return makeResult(profile,
      call, 'blocked', ['qualification.disabled'],
      'The requested Caption job is disabled in this qualification snapshot.',
    )
  }
  if (entry.status === 'blocked'
    || !entry.qualifiedModes.includes(call.job.requestedMode)) {
    return makeResult(profile,
      call, 'blocked', ['qualification.mode.blocked'],
      'The requested Caption job mode is not qualified by current evidence.',
    )
  }

  let admittedVisualPacket: CaptionVisualIntelligenceEvidencePacket | null = null
  let visualPayload: CaptionVisualIntelligenceSupportPayload | null = null
  let canonicalVisualRecord:
  CanonicalCaptionVisualIntelligenceAuthenticatedEvidenceRecord | null = null
  let trackAllPayload: CaptionTrackAllSupportPayload | null = null
  let admittedTrackAllPacket: CaptionTrackAllEvidencePacket | null = null
  let canonicalTrackAllRecord:
  CanonicalCaptionTrackAllAuthenticatedEvidenceRecord | null = null
  let soundContext: CaptionSoundContext | null = null
  let soundPayload: CaptionSoundCueRequest | null = null
  let admittedSoundResult: CaptionSoundSupportResult | null = null
  if (input.canonicalVisualIntelligenceEvidenceRecord !== undefined) {
    if (input.visualIntelligenceSupportPayload !== undefined
      || input.visualIntelligenceEvidencePacket !== undefined) {
      return makeResult(profile,
        call, 'blocked', ['input.visual_intelligence.evidence.ambiguous'],
        'Canonical and unbound Visual Intelligence evidence cannot be mixed.',
      )
    }
    try {
      canonicalVisualRecord =
        parseCaptionCanonicalVisualIntelligenceEvidenceRecord(
          input.canonicalVisualIntelligenceEvidenceRecord)
      visualPayload = canonicalVisualRecord.supportPayload
    } catch {
      return makeResult(profile,
        call, 'blocked', ['input.visual_intelligence.canonical_record.invalid'],
        'The canonical Visual Intelligence evidence record was rejected.',
      )
    }
  } else if (input.visualIntelligenceSupportPayload !== undefined) {
    try {
      visualPayload = parseCaptionVisualIntelligenceSupportPayload(
        input.visualIntelligenceSupportPayload)
    } catch {
      return makeResult(profile,
        call, 'blocked', ['input.visual_intelligence.payload.invalid'],
        'The Caption Visual Intelligence support payload is invalid.',
      )
    }
    if (visualPayload.purpose !== 'final_frame_occupancy'
      || !exactScopeForDomainPayload(call, visualPayload.canonicalScope)) {
      return makeResult(profile,
        call, 'blocked', ['input.visual_intelligence.payload.scope.mismatch'],
        'The Caption Visual Intelligence payload does not match the assigned scene.',
      )
    }
  }
  if (input.canonicalTrackAllEvidenceRecord !== undefined) {
    if (input.trackAllSupportPayload !== undefined
      || input.trackAllEvidencePacket !== undefined) {
      return makeResult(profile,
        call, 'blocked', ['input.track_all.evidence.ambiguous'],
        'Canonical and unbound Track All evidence cannot be mixed.',
      )
    }
    try {
      canonicalTrackAllRecord = parseCaptionCanonicalTrackAllEvidenceRecord(
        input.canonicalTrackAllEvidenceRecord)
      trackAllPayload = canonicalTrackAllRecord.supportPayload
    } catch {
      return makeResult(profile,
        call, 'blocked', ['input.track_all.canonical_record.invalid'],
        'The canonical Track All evidence record was rejected.',
      )
    }
  } else if (input.trackAllSupportPayload !== undefined) {
    try {
      trackAllPayload = parseCaptionTrackAllSupportPayload(
        input.trackAllSupportPayload)
    } catch {
      return makeResult(profile,
        call, 'blocked', ['input.track_all.payload.invalid'],
        'The Caption Track All support payload is invalid.',
      )
    }
    if (!exactScopeForDomainPayload(call, trackAllPayload.canonicalScope)
      || expectedTrackAllPurpose(call.job.jobType) !== trackAllPayload.purpose) {
      return makeResult(profile,
        call, 'blocked', ['input.track_all.payload.scope_or_job.mismatch'],
        'The Caption Track All payload does not match the assigned scene job.',
      )
    }
  }
  if (input.soundSupportContext !== undefined
    || input.soundSupportPayload !== undefined) {
    if (input.soundSupportContext === undefined
      || input.soundSupportPayload === undefined) {
      return makeResult(profile,
        call, 'blocked', ['input.soundsync.context_or_payload.missing'],
        'The Caption SoundSync request requires its exact context and payload.',
      )
    }
    try {
      soundContext = parseCaptionSoundContext(input.soundSupportContext)
      soundPayload = parseCaptionSoundCueRequest(
        input.soundSupportPayload, soundContext)
    } catch {
      return makeResult(profile,
        call, 'blocked', ['input.soundsync.payload.invalid'],
        'The Caption SoundSync context or payload is invalid.',
      )
    }
    if (!isSoundSupportJob(call.job.jobType)
      || !exactSoundScopeForPayload(call, soundPayload.canonicalScope)) {
      return makeResult(profile,
        call, 'blocked', ['input.soundsync.payload.scope_or_job.mismatch'],
        'The Caption SoundSync payload does not match the assigned job scope.',
      )
    }
  }

  if (call.resumeOfSupportRequestRef !== null) {
    let request: SkillSupportRequest
    try {
      request = parseSkillSupportRequest(input.resumeSupportRequest)
    } catch {
      return makeResult(profile,
        call, 'blocked', ['resume.request.reread.failed'],
        'The exact follow-up request could not be reread and validated.',
      )
    }
    const requestRef: SkillContractRef = {
      id: request.requestId,
      version: request.schemaVersion,
      contentHash: request.requestDigestSha256,
    }
    const scopeMatches = JSON.stringify(request.canonicalScope)
      === JSON.stringify(call.canonicalScope)
    const injectedTypes = [...call.injectedSupportArtifactRefs]
      .map((artifact) => artifact.artifactType)
      .sort()
    const requestedTypes = [...request.requestedArtifactTypes].sort()
    const producerMatches = call.injectedSupportArtifactRefs.every(
      (artifact) => artifact.producerSkillKey === request.targetSkillKey,
    )
    if (!exactRef(call.resumeOfSupportRequestRef, requestRef)
      || call.resumeOriginCallRef === null
      || !exactRef(call.resumeOriginCallRef, request.originalCallRef)
      || request.requestingSkillKey !== CAPTIONS_SPECIALIST_SKILL_KEY
      || !scopeMatches
      || JSON.stringify(injectedTypes) !== JSON.stringify(requestedTypes)
      || !producerMatches) {
      return makeResult(profile,
        call, 'blocked', ['resume.binding.mismatch'],
        'Injected support evidence does not match the approved follow-up request.',
      )
    }
    if (request.targetSkillKey === 'visual_intelligence'
      && visualPayload !== null) {
      if (canonicalVisualRecord !== null) {
        if (!exactRef(canonicalVisualRecord.supportRequestRef, {
          id: request.requestId,
          version: request.schemaVersion,
          contentHash: request.requestDigestSha256,
        })) {
          return makeResult(profile,
            call, 'blocked', [
              'input.visual_intelligence.canonical_record.request.mismatch',
            ], 'The canonical evidence does not match the current follow-up.',
          )
        }
        admittedVisualPacket = canonicalVisualRecord.captionEvidencePacket
      } else {
        try {
          admittedVisualPacket = parseCaptionVisualIntelligenceEvidencePacket(
            input.visualIntelligenceEvidencePacket,
            { payload: visualPayload, supportRequest: request },
          )
        } catch {
          return makeResult(profile,
            call, 'blocked', [
              'input.visual_intelligence.authenticated_admission.failed',
            ], 'The authenticated Visual Intelligence evidence was rejected.',
          )
        }
      }
      if (admittedVisualPacket.evidenceMode !== 'authenticated_private_runtime'
        || admittedVisualPacket.authenticatedReadResultRef === null
        || !packetArtifactMatches(call, request, admittedVisualPacket)) {
        return makeResult(profile,
          call, 'blocked', [
            'input.visual_intelligence.authenticated_admission.mismatch',
          ], 'The Visual Intelligence packet does not match its injected artifact.',
        )
      }
    } else if (request.targetSkillKey === 'visual_intelligence'
      && input.visualIntelligenceEvidencePacket !== undefined) {
      return makeResult(profile,
        call, 'blocked', ['input.visual_intelligence.payload.missing'],
        'Visual Intelligence evidence requires its exact Caption payload.',
      )
    } else if (input.visualIntelligenceEvidencePacket !== undefined) {
      return makeResult(profile,
        call, 'blocked', ['input.visual_intelligence.evidence.unexpected'],
        'Visual Intelligence evidence does not match the current follow-up owner.',
      )
    }
    if (request.targetSkillKey === 'track_all' && trackAllPayload !== null) {
      if (canonicalTrackAllRecord !== null) {
        if (!exactRef(canonicalTrackAllRecord.supportRequestRef, {
          id: request.requestId,
          version: request.schemaVersion,
          contentHash: request.requestDigestSha256,
        })) {
          return makeResult(profile,
            call, 'blocked', ['input.track_all.canonical_record.request.mismatch'],
            'The canonical Track All record does not match the follow-up.',
          )
        }
        admittedTrackAllPacket = canonicalTrackAllRecord.captionEvidencePacket
      } else {
        try {
          admittedTrackAllPacket = parseCaptionTrackAllEvidencePacket(
            input.trackAllEvidencePacket,
            { payload: trackAllPayload, supportRequest: request },
          )
        } catch {
          return makeResult(profile,
            call, 'blocked', ['input.track_all.authenticated_admission.failed'],
            'The authenticated Track All evidence was rejected.',
          )
        }
      }
      if (admittedTrackAllPacket.evidenceMode
          !== 'authenticated_private_runtime'
        || admittedTrackAllPacket.authenticatedReadResultRef === null
        || admittedTrackAllPacket.canonicalSam31RuntimeResultAdmissionRef
          === null
        || !trackAllPacketArtifactMatches(
          call, request, admittedTrackAllPacket)) {
        return makeResult(profile,
          call, 'blocked', ['input.track_all.authenticated_admission.mismatch'],
          'The Track All packet is not authenticated or does not match its artifact.',
        )
      }
    } else if (request.targetSkillKey === 'track_all'
      && request.typedPayloadType === 'caption-track-all-support-payload-v1') {
      return makeResult(profile,
        call, 'blocked', ['input.track_all.payload.missing'],
        'Typed Track All resume requires its exact Caption payload and packet.',
      )
    } else if (input.trackAllEvidencePacket !== undefined) {
      return makeResult(profile,
        call, 'blocked', ['input.track_all.evidence.unexpected'],
        'Track All evidence does not match the current follow-up owner.',
      )
    }
    if (request.targetSkillKey === 'soundsync'
      && soundPayload !== null && soundContext !== null) {
      try {
        admittedSoundResult = parseCaptionSoundSupportResult(
          input.soundSupportResult,
          { payload: soundPayload, supportRequest: request },
          soundContext,
        )
      } catch {
        return makeResult(profile,
          call, 'blocked', ['input.soundsync.authenticated_admission.failed'],
          'The authenticated SoundSync result was rejected.',
        )
      }
      if (admittedSoundResult.evidenceMode !== 'authenticated_private_runtime'
        || !soundResultArtifactMatches(call, request, admittedSoundResult)) {
        return makeResult(profile,
          call, 'blocked', ['input.soundsync.authenticated_admission.mismatch'],
          'The SoundSync result is not authenticated or does not match its artifact.',
        )
      }
    } else if (request.targetSkillKey === 'soundsync'
      && request.typedPayloadType === 'caption-sound-cue-request-v1') {
      return makeResult(profile,
        call, 'blocked', ['input.soundsync.payload.missing'],
        'Typed SoundSync resume requires its exact context, payload, and result.',
      )
    } else if (input.soundSupportResult !== undefined) {
      return makeResult(profile,
        call, 'blocked', ['input.soundsync.result.unexpected'],
        'SoundSync evidence does not match the current follow-up owner.',
      )
    }
  } else if (input.resumeSupportRequest !== undefined) {
    return makeResult(profile,
      call, 'blocked', ['resume.request.unexpected'],
      'A follow-up request was supplied for a non-resumed Caption call.',
    )
  } else if (input.visualIntelligenceEvidencePacket !== undefined) {
    return makeResult(profile,
      call, 'blocked', ['input.visual_intelligence.evidence.unexpected'],
      'Visual Intelligence evidence was supplied outside an exact resume.',
    )
  } else if (input.canonicalVisualIntelligenceEvidenceRecord !== undefined) {
    return makeResult(profile,
      call, 'blocked', ['input.visual_intelligence.canonical_record.unexpected'],
      'Canonical Visual Intelligence evidence was supplied outside a resume.',
    )
  } else if (input.trackAllEvidencePacket !== undefined) {
    return makeResult(profile,
      call, 'blocked', ['input.track_all.evidence.unexpected'],
      'Track All evidence was supplied outside an exact resume.',
    )
  } else if (input.canonicalTrackAllEvidenceRecord !== undefined) {
    return makeResult(profile,
      call, 'blocked', ['input.track_all.canonical_record.unexpected'],
      'Canonical Track All evidence was supplied outside an exact resume.',
    )
  } else if (input.soundSupportResult !== undefined) {
    return makeResult(profile,
      call, 'blocked', ['input.soundsync.result.unexpected'],
      'SoundSync evidence was supplied outside an exact resume.',
    )
  }

  const missing = missingArtifacts(profile, call,
    admittedVisualPacket === null ? [] : ['visual_intelligence_report'])
  if (missing.includes('canonical_transcript')) {
    return makeResult(profile, call, 'blocked', [
      'input.canonical_transcript.authenticated_read.missing',
    ], 'Caption planning requires an authenticated canonical transcript input.')
  }
  if (missing.includes('canonical_transcript_authenticated_read_binding')) {
    return makeResult(profile, call, 'blocked', [
      'input.canonical_transcript.authenticated_read.binding.missing',
    ], 'Caption planning requires the exact canonical transcript reread binding.')
  }
  if (missing.length > 0) {
    const grouped = new Map<SkillSupportTarget, string[]>()
    for (const artifactType of missing) {
      const target = supportTargetForArtifact(artifactType)
      if (target === null) {
        return makeResult(profile, call, 'blocked', [
          'dependency.evidence.owner.unmapped',
        ], 'Caption planning found an unmapped dependency owner.')
      }
      grouped.set(target, [...(grouped.get(target) ?? []), artifactType])
    }
    const requests = [...grouped.entries()].map(([target, items]) => {
      if (target === 'visual_intelligence' && visualPayload !== null) {
        return createCaptionVisualIntelligenceSupportRequest({
          requestId: `${call.callId}.support.visual_intelligence`,
          originalCallRef: callRef(call),
          payload: visualPayload,
        })
      }
      if (target === 'track_all' && trackAllPayload !== null) {
        return createCaptionTrackAllSupportRequest({
          requestId: `${call.callId}.support.track_all`,
          originalCallRef: callRef(call),
          payload: trackAllPayload,
        })
      }
      if (target === 'soundsync'
        && soundPayload !== null && soundContext !== null) {
        return createCaptionSoundSupportRequest({
          originalCallRef: callRef(call),
          payload: soundPayload,
          context: soundContext,
          canonicalSkillScope: call.canonicalScope,
        })
      }
      return makeSupportRequest(call, target, items)
    })
    return makeResult(profile,
      call,
      'needs_followup',
      ['dependency.evidence.missing'],
      'Caption planning is waiting for approved dependency evidence.',
      requests,
    )
  }

  const producedArtifactRefs: SkillArtifactRef[] = [{
    id: `${call.callId}.caption-receipt`,
    version: 'caption-specialist-job-receipt-v1',
    contentHash: sha256([
      call.callDigestSha256,
      call.job.jobType,
      call.canonicalScope.outputId ?? 'no-output',
      call.canonicalScope.sceneId ?? 'no-scene',
      call.canonicalScope.boundaryId ?? 'no-boundary',
      admittedVisualPacket?.packetDigestSha256 ?? 'no-visual-packet',
      admittedTrackAllPacket?.packetDigestSha256 ?? 'no-track-all-packet',
      admittedSoundResult?.resultDigestSha256 ?? 'no-sound-result',
    ].join(':')),
    artifactType: CAPTIONS_CAP_01_ARTIFACT_TYPE,
    producerSkillKey: CAPTIONS_SPECIALIST_SKILL_KEY,
    privateArtifact: true,
    byteFreeRef: true,
    sourceSupportRequestRef: null,
  }]
  return makeResult(profile,
    call,
    'completed',
    [
      'planning.contract.completed',
      ...(admittedVisualPacket === null ? []
        : ['visual_intelligence.authenticated_admission.accepted']),
      ...(admittedTrackAllPacket === null ? []
        : ['track_all.authenticated_admission.accepted']),
      ...(admittedSoundResult === null ? []
        : ['soundsync.authenticated_admission.accepted']),
    ],
    'Caption planning completed within the assigned scope.',
    [],
    producedArtifactRefs,
  )
}
