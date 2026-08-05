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

function exactScopeForVisualPayload(
  call: OrchestraSkillCall,
  payload: CaptionVisualIntelligenceSupportPayload,
): boolean {
  const callSnapshot = call.canonicalScope.approvedSnapshotRef
  const payloadSnapshot = payload.canonicalScope.approvedSnapshotRef
  return call.job.scopeLevel === 'scene'
    && call.canonicalScope.boundaryId === null
    && call.canonicalScope.ownerUserId === payload.canonicalScope.ownerUserId
    && call.canonicalScope.workspaceId === payload.canonicalScope.workspaceId
    && call.canonicalScope.projectId === payload.canonicalScope.projectId
    && call.canonicalScope.editSessionId === payload.canonicalScope.editSessionId
    && call.canonicalScope.outputId === payload.canonicalScope.outputId
    && call.canonicalScope.sceneId === payload.canonicalScope.sceneId
    && JSON.stringify(call.canonicalScope.authorizedFrameRanges)
      === JSON.stringify(payload.canonicalScope.authorizedFrameRanges)
    && ((callSnapshot === null && payloadSnapshot === null)
      || (callSnapshot !== null && payloadSnapshot !== null
        && exactRef(callSnapshot, payloadSnapshot)))
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
      || !exactScopeForVisualPayload(call, visualPayload)) {
      return makeResult(profile,
        call, 'blocked', ['input.visual_intelligence.payload.scope.mismatch'],
        'The Caption Visual Intelligence payload does not match the assigned scene.',
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
    admittedVisualPacket === null
      ? ['planning.contract.completed']
      : [
          'planning.contract.completed',
          'visual_intelligence.authenticated_admission.accepted',
        ],
    'Caption planning completed within the assigned scope.',
    [],
    producedArtifactRefs,
  )
}
