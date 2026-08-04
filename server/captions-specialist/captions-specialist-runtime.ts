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
  type SkillClosedAuthorityBoundary,
  type SkillContractRef,
  type SkillQualificationSnapshot,
  type SkillSupportRequest,
  type SkillSupportTarget,
} from '../../src/types/orchestra-skill-contracts'
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

export const CAPTIONS_CLOSED_AUTHORITY_BOUNDARY:
Readonly<SkillClosedAuthorityBoundary> = Object.freeze({
  scopeExpansionGranted: false,
  timelineMutationGranted: false,
  directPeerDispatchGranted: false,
  providerCallGranted: false,
  runtimeExecutionGranted: false,
  assetCreationGranted: false,
  costAuthorityGranted: false,
  billingAuthorityGranted: false,
  qaApprovalGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
})

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

function manifestRef(): SkillContractRef {
  return {
    id: CAPTIONS_SPECIALIST_MANIFEST.manifestId,
    version: CAPTIONS_SPECIALIST_MANIFEST.manifestSchemaVersion,
    contentHash: CAPTIONS_SPECIALIST_MANIFEST.manifestHash,
  }
}

function qualificationRef(): SkillContractRef {
  return {
    id: CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT.snapshotId,
    version: CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT.schemaVersion,
    contentHash:
      CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT.snapshotDigestSha256,
  }
}

function supportTargetForArtifact(artifactType: string): SkillSupportTarget {
  if (artifactType === 'visual_intelligence_report') return 'visual_intelligence'
  if (artifactType === 'track_all_mask_binding') return 'track_all'
  if (artifactType === 'caption_living_frame_handoff_binding') return 'living_frame'
  if (artifactType === 'confirmed_output_frame') return 'canonical_layout_owner'
  return 'canonical_timing_owner'
}

function makeSupportRequest(
  call: OrchestraSkillCall,
  missingArtifactTypes: string[],
): SkillSupportRequest {
  const targetSkillKey = supportTargetForArtifact(missingArtifactTypes[0])
  const typedPayloadType = targetSkillKey === 'living_frame'
    ? 'caption-direction-living-frame-request-ref-v1'
    : `captions-${targetSkillKey}-support-request-v1`
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
      : {
          exactArtifactTypes: missingArtifactTypes,
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
    manifestRef: manifestRef(),
    qualificationSnapshotRef: qualificationRef(),
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

function requiredArtifactTypes(jobType: string): string[] {
  return CAPTIONS_SPECIALIST_MANIFEST.capabilityEntries.find(
    (entry) => entry.supportedJobType === jobType,
  )?.requiredEvidence ?? []
}

function missingArtifacts(call: OrchestraSkillCall): string[] {
  const present = new Set([
    ...call.inputArtifactRefs,
    ...call.injectedSupportArtifactRefs,
  ].map((ref) => ref.artifactType))
  return requiredArtifactTypes(call.job.jobType)
    .filter((artifactType) => !present.has(artifactType))
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
}): OrchestraSkillJobResult {
  const call = parseOrchestraSkillCall(input.call)
  const manifest = parseSkillCapabilityManifestV2(
    input.manifest ?? CAPTIONS_SPECIALIST_MANIFEST,
  )
  const snapshot = parseSkillQualificationSnapshot(
    input.qualificationSnapshot ?? CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT,
  )

  if (call.assigneeSkillKey !== CAPTIONS_SPECIALIST_SKILL_KEY) {
    return makeResult(
      call, 'blocked', ['wrong.assignee'],
      'The assignment does not target the Caption specialist.',
    )
  }
  if (!exactRef(call.manifestRef, manifestRef())
    || manifest.manifestHash !== CAPTIONS_SPECIALIST_MANIFEST.manifestHash) {
    return makeResult(
      call, 'blocked', ['stale.manifest'],
      'The Caption manifest binding is stale or mismatched.',
    )
  }
  if (!exactRef(call.qualificationSnapshotRef, qualificationRef())
    || snapshot.snapshotDigestSha256
      !== CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT.snapshotDigestSha256) {
    return makeResult(
      call, 'blocked', ['stale.qualification'],
      'The Caption qualification binding is stale or mismatched.',
    )
  }
  if ((CAPTIONS_UNSUPPORTED_JOB_TYPES as readonly string[])
    .includes(call.job.jobType)
    || !(CAPTIONS_SUPPORTED_JOB_TYPES as readonly string[])
      .includes(call.job.jobType)) {
    return makeResult(
      call, 'unsupported', ['unsupported.job'],
      'The requested job is outside Caption specialist ownership.',
    )
  }

  const entry = qualificationEntry(snapshot, call.job.jobType)
  if (!entry || entry.status === 'disabled') {
    return makeResult(
      call, 'blocked', ['qualification.disabled'],
      'The requested Caption job is disabled in this qualification snapshot.',
    )
  }
  if (entry.status === 'blocked'
    || !entry.qualifiedModes.includes(call.job.requestedMode)) {
    return makeResult(
      call, 'blocked', ['qualification.mode.blocked'],
      'The requested Caption job mode is not qualified by current evidence.',
    )
  }

  if (call.resumeOfSupportRequestRef !== null) {
    let request: SkillSupportRequest
    try {
      request = parseSkillSupportRequest(input.resumeSupportRequest)
    } catch {
      return makeResult(
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
      return makeResult(
        call, 'blocked', ['resume.binding.mismatch'],
        'Injected support evidence does not match the approved follow-up request.',
      )
    }
  } else if (input.resumeSupportRequest !== undefined) {
    return makeResult(
      call, 'blocked', ['resume.request.unexpected'],
      'A follow-up request was supplied for a non-resumed Caption call.',
    )
  }

  const missing = missingArtifacts(call)
  if (missing.length > 0) {
    const grouped = new Map<SkillSupportTarget, string[]>()
    for (const artifactType of missing) {
      const target = supportTargetForArtifact(artifactType)
      grouped.set(target, [...(grouped.get(target) ?? []), artifactType])
    }
    const requests = [...grouped.values()].map((items) =>
      makeSupportRequest(call, items))
    return makeResult(
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
    ].join(':')),
    artifactType: CAPTIONS_CAP_01_ARTIFACT_TYPE,
    producerSkillKey: CAPTIONS_SPECIALIST_SKILL_KEY,
    privateArtifact: true,
    byteFreeRef: true,
    sourceSupportRequestRef: null,
  }]
  return makeResult(
    call,
    'completed',
    ['planning.contract.completed'],
    'Caption planning completed within the assigned scope.',
    [],
    producedArtifactRefs,
  )
}
