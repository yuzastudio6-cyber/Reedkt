import { z } from 'zod'

import {
  CAPTION_TERMINAL_QUALIFICATION_INPUT_VERSION_V2,
  CAPTION_TERMINAL_QUALIFICATION_INPUT_VERSION_V3,
  CAPTION_TERMINAL_QUALIFICATION_PREFLIGHT_VERSION_V2,
  CAPTION_TERMINAL_QUALIFICATION_PREFLIGHT_VERSION_V3,
  CAPTION_TERMINAL_QUALIFICATION_PROJECTION_VERSION_V2,
  CAPTION_TERMINAL_QUALIFICATION_PROJECTION_VERSION_V3,
  type CaptionTerminalQualificationEvidenceInputV2,
  type CaptionTerminalQualificationEvidenceInputV3,
  type CaptionTerminalQualificationPreflightV3,
  type CaptionTerminalQualificationProjectionV3,
} from '../../src/types/caption-terminal-qualification'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import {
  CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_BINDING_VERSION,
} from '../../src/types/caption-canonical-transcript-authenticated-read'
import {
  CANONICAL_CAPTION_VISUAL_INTELLIGENCE_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
} from '../../src/types/canonical-caption-visual-intelligence-support'
import {
  CANONICAL_CAPTION_TRACK_ALL_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
} from '../../src/types/canonical-caption-track-all-support'
import { CAPTION_SOUND_SUPPORT_RESULT_VERSION } from
  '../../src/types/caption-sound-support'
import { CAPTION_BROLL_OWNER_READ_BINDING_VERSION } from
  '../../src/types/caption-multi-track-scene-graph'
import type { CaptionSharedOwnerKey } from
  '../../src/types/caption-shared-owner-integration'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  CAPTION_CAP20_SHARED_OWNER_INTEGRATION_HANDOFF,
} from './caption-shared-owner-integration'
import {
  createCaptionTerminalQualificationPreflightV2,
  createCaptionTerminalQualificationProjectionV2,
  parseCaptionTerminalQualificationEvidenceInputV2,
  parseCaptionTerminalQualificationPreflightV2,
  parseCaptionTerminalQualificationProjectionV2,
} from './caption-terminal-qualification-v2'
import type {
  CanonicalCaptionPrivateReviewEvidenceProjectionAny,
} from '../../src/types/canonical-caption-private-review-evidence-projection'

const safeKey = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema: z.ZodType<CaptionDomainRef> = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const evidenceSetSchema = z.object({
  canonicalTranscriptReadRefs: z.array(refSchema).length(1),
  visualIntelligenceEvidenceRefs: z.array(refSchema).min(1).max(256),
  trackAllEvidenceRefs: z.array(refSchema).min(1).max(256),
  soundSyncEvidenceRefs: z.array(refSchema).min(1).max(256),
  brollOwnerEvidenceRefs: z.array(refSchema).min(1).max(256),
  actualCanonicalRecordsReread: z.literal(true),
  sourceFixtureUsedAsRuntimeEvidence: z.literal(false),
  referenceOnlyEvidenceAccepted: z.literal(false),
}).strict()

const ownerVersions: Record<CaptionSharedOwnerKey, string> = {
  canonical_transcript:
    CAPTION_CANONICAL_TRANSCRIPT_AUTHENTICATED_READ_BINDING_VERSION,
  visual_intelligence:
    CANONICAL_CAPTION_VISUAL_INTELLIGENCE_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
  track_all:
    CANONICAL_CAPTION_TRACK_ALL_AUTHENTICATED_EVIDENCE_RECORD_VERSION,
  soundsync: CAPTION_SOUND_SUPPORT_RESULT_VERSION,
  broll_owner: CAPTION_BROLL_OWNER_READ_BINDING_VERSION,
}

type EvidenceSets = CaptionTerminalQualificationEvidenceInputV3[
  'canonicalSharedOwnerEvidence']

export function parseCaptionTerminalQualificationEvidenceInputV3(
  value: unknown,
): CaptionTerminalQualificationEvidenceInputV3 {
  assertClosedContractTree(value, 'Caption terminal qualification input V3')
  const input = structuredClone(value) as
    CaptionTerminalQualificationEvidenceInputV3
  if (input?.schemaVersion !==
    CAPTION_TERMINAL_QUALIFICATION_INPUT_VERSION_V3) {
    throw new Error('Caption terminal qualification input V3 is required.')
  }
  const evidenceSets = evidenceSetSchema.parse(
    input.canonicalSharedOwnerEvidence)
  if (input.inputDigestSha256 !== calculateSkillContractDigest(
    input as unknown as Record<string, unknown>, 'inputDigestSha256')) {
    throw new Error('Caption terminal qualification input V3 digest failed.')
  }
  assertEvidenceSetsAndJobs(input, evidenceSets)
  parseCaptionTerminalQualificationEvidenceInputV2(toV2Shadow(input))
  return structuredClone(input)
}

export function createCaptionTerminalQualificationProjectionV3(
  sourceEvidenceInput: unknown,
  privateReviewEvidenceProjections:
    readonly CanonicalCaptionPrivateReviewEvidenceProjectionAny[],
): CaptionTerminalQualificationProjectionV3 {
  const input = parseCaptionTerminalQualificationEvidenceInputV3(
    sourceEvidenceInput)
  createCaptionTerminalQualificationProjectionV2(
    toV2Shadow(input), privateReviewEvidenceProjections)
  const withoutDigest = {
    schemaVersion: CAPTION_TERMINAL_QUALIFICATION_PROJECTION_VERSION_V3,
    projectionId: `captions.terminal.v3.projection.${input.inputDigestSha256}`,
    observedAt: input.observedAt,
    canonicalScope: structuredClone(input.canonicalScope),
    sourceInputRef: inputRef(input),
    sourceCurrentReadinessRef: structuredClone(
      input.sourceCurrentReadinessRef),
    sourcePrivateReleaseRef: structuredClone(input.sourcePrivateReleaseRef),
    jobs: input.jobEvidence.map((job) => ({
      jobType: job.jobType,
      outputIds: [...job.outputIds],
      qualificationStatus: 'qualified_private_internal' as const,
      sourceJobResultRef: structuredClone(job.persistedCaptionJobResultRef),
      evidenceRefs: projectionEvidenceRefs(job),
      blockerCodes: [] as [],
      captionOwnedImplementationComplete: true as const,
      requiredCanonicalEvidenceComplete: true as const,
      runtimeOwnershipTransferredToCaption: false as const,
      duplicateSharedOwnerCreated: false as const,
    })),
    outputs: input.outputEvidence.map((output) => ({
      outputId: output.outputId,
      confirmedOutputFrameRef: structuredClone(output.confirmedOutputFrameRef),
      renderedArtifactRef: structuredClone(output.renderedArtifactRef),
      deterministicQaRef: structuredClone(output.deterministicQaRef),
      qualifiedCompleteTimeVisualReviewRef:
        structuredClone(output.qualifiedCompleteTimeVisualReviewRef),
      independentFinalQaRef: structuredClone(output.independentFinalQaRef),
      privateReviewDecisionRef:
        structuredClone(output.privateReviewDecisionRef),
      repairGeneration: output.repairGeneration,
      qualificationStatus: 'qualified_private_internal' as const,
      unresolvedBlockerCodes: [] as [],
    })),
    counts: {
      declaredCaptionJobs: 41 as const,
      qualifiedPrivateInternalJobs: 41 as const,
      blockedJobs: 0 as const,
      confirmedOutputs: input.outputEvidence.length,
      qualifiedOutputs: input.outputEvidence.length,
    },
    allCaptionJobsQualified: true as const,
    allConfirmedOutputsQualified: true as const,
    canonicalBackendPrivateExecutionMounted: true as const,
    authenticatedPrivateSharedOwnerEvidenceIntegrated: true as const,
    qualifiedAiCompleteTimeVisualReviewIntegrated: true as const,
    independentFinalQaRereadIntegrated: true as const,
    actualCanonicalEvidenceConsumed: true as const,
    currentStatus: 'caption_specialist_private_internal_qualified' as const,
    terminalStatusClaimed: true as const,
    privateInternalOnly: true as const,
    publicProductionRequiredForTerminalStatus: false as const,
    centralOrchestraRequiredForTerminalStatus: false as const,
    centralOrchestraImplemented: false as const,
    browserLocalCompletionAccepted: false as const,
    sourceFixtureRelabeledAsActualOwnerRuntime: false as const,
    directPeerDispatchPerformedByCaption: false as const,
    operationDispatchAuthority: false as const,
    providerOrModelRuntimeAuthority: false as const,
    assetMutationAuthority: false as const,
    finalQaApprovalAuthority: false as const,
    creditOrBillingAuthority: false as const,
    publicDeliveryAuthority: false as const,
    productionAuthority: false as const,
  }
  return parseCaptionTerminalQualificationProjectionV3({
    ...withoutDigest,
    projectionDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      projectionDigestSha256: '',
    }, 'projectionDigestSha256'),
  }, input)
}

export function parseCaptionTerminalQualificationProjectionV3(
  value: unknown,
  sourceEvidenceInput: unknown,
): CaptionTerminalQualificationProjectionV3 {
  const input = parseCaptionTerminalQualificationEvidenceInputV3(
    sourceEvidenceInput)
  assertClosedContractTree(value, 'Caption terminal qualification projection V3')
  const projection = structuredClone(value) as
    CaptionTerminalQualificationProjectionV3
  if (projection?.schemaVersion !==
    CAPTION_TERMINAL_QUALIFICATION_PROJECTION_VERSION_V3
    || projection.projectionDigestSha256 !== calculateSkillContractDigest(
      projection as unknown as Record<string, unknown>,
      'projectionDigestSha256')) {
    throw new Error('Caption terminal qualification projection V3 is invalid.')
  }
  const expectedJobs = input.jobEvidence.map((job) => ({
    jobType: job.jobType,
    outputIds: [...job.outputIds],
    qualificationStatus: 'qualified_private_internal' as const,
    sourceJobResultRef: structuredClone(job.persistedCaptionJobResultRef),
    evidenceRefs: projectionEvidenceRefs(job),
    blockerCodes: [] as [],
    captionOwnedImplementationComplete: true as const,
    requiredCanonicalEvidenceComplete: true as const,
    runtimeOwnershipTransferredToCaption: false as const,
    duplicateSharedOwnerCreated: false as const,
  }))
  if (JSON.stringify(projection.jobs) !== JSON.stringify(expectedJobs)
    || refKey(projection.sourceInputRef) !== refKey(inputRef(input))) {
    throw new Error('Caption terminal qualification projection V3 is stale.')
  }
  parseCaptionTerminalQualificationProjectionV2(
    toV2ProjectionShadow(projection, input), toV2Shadow(input))
  return structuredClone(projection)
}

export function createCaptionTerminalQualificationPreflightV3(
  sourceEvidenceInput?: unknown,
  privateReviewEvidenceProjections?:
    readonly CanonicalCaptionPrivateReviewEvidenceProjectionAny[],
): CaptionTerminalQualificationPreflightV3 {
  const input = sourceEvidenceInput === undefined ? null
    : parseCaptionTerminalQualificationEvidenceInputV3(sourceEvidenceInput)
  const shadow = createCaptionTerminalQualificationPreflightV2(
    input === null ? undefined : toV2Shadow(input),
    privateReviewEvidenceProjections)
  const withoutDigest = {
    ...shadow,
    schemaVersion: CAPTION_TERMINAL_QUALIFICATION_PREFLIGHT_VERSION_V3,
    preflightId: input === null
      ? 'captions.terminal.qualification.evidence-set-preflight'
      : `captions.terminal.v3.preflight.${input.inputDigestSha256}`,
    sourceQualificationInputRef: shadow.sourceQualificationInputRef === null
      || input === null ? null : inputRef(input),
  }
  return parseCaptionTerminalQualificationPreflightV3({
    ...withoutDigest,
    preflightDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      preflightDigestSha256: '',
    }, 'preflightDigestSha256'),
  }, input ?? undefined)
}

export function parseCaptionTerminalQualificationPreflightV3(
  value: unknown,
  sourceEvidenceInput?: unknown,
): CaptionTerminalQualificationPreflightV3 {
  const input = sourceEvidenceInput === undefined ? null
    : parseCaptionTerminalQualificationEvidenceInputV3(sourceEvidenceInput)
  assertClosedContractTree(value, 'Caption terminal qualification preflight V3')
  const preflight = structuredClone(value) as
    CaptionTerminalQualificationPreflightV3
  if (preflight?.schemaVersion !==
    CAPTION_TERMINAL_QUALIFICATION_PREFLIGHT_VERSION_V3
    || preflight.preflightDigestSha256 !== calculateSkillContractDigest(
      preflight as unknown as Record<string, unknown>,
      'preflightDigestSha256')
    || (preflight.sourceQualificationInputRef !== null
      && (input === null || refKey(preflight.sourceQualificationInputRef)
        !== refKey(inputRef(input))))) {
    throw new Error('Caption terminal qualification preflight V3 is invalid.')
  }
  parseCaptionTerminalQualificationPreflightV2(
    toV2PreflightShadow(preflight, input),
    input === null ? undefined : toV2Shadow(input))
  return structuredClone(preflight)
}

function assertEvidenceSetsAndJobs(
  input: CaptionTerminalQualificationEvidenceInputV3,
  sets: EvidenceSets,
): void {
  const byOwner = ownerRefs(sets)
  const allEntries = (Object.entries(byOwner) as Array<[
    CaptionSharedOwnerKey, CaptionDomainRef[]]>).flatMap(([owner, refs]) =>
    refs.map((ref) => ({ owner, ref })))
  const allKeys = allEntries.map((entry) => refKey(entry.ref))
  if (new Set(allKeys).size !== allKeys.length
    || allEntries.some((entry) =>
      entry.ref.version !== ownerVersions[entry.owner])) {
    throw new Error('Caption terminal V3 owner evidence set is invalid.')
  }
  const ownerByRef = new Map(allEntries.map((entry) =>
    [refKey(entry.ref), entry.owner]))
  const used = new Set<string>()
  for (const job of input.jobEvidence) {
    const expectedOwners = CAPTION_CAP20_SHARED_OWNER_INTEGRATION_HANDOFF
      .conditionalJobBindings.find((binding) =>
        binding.jobType === job.jobType)?.requiredOwnerKeys ?? []
    const actualOwners: CaptionSharedOwnerKey[] = []
    const jobRefKeys = job.sharedOwnerEvidenceRefs.map(refKey)
    if (new Set(jobRefKeys).size !== jobRefKeys.length) {
      throw new Error(
        `Caption terminal V3 job ${job.jobType} repeats owner evidence.`)
    }
    for (const ref of job.sharedOwnerEvidenceRefs) {
      const key = refKey(ref)
      const owner = ownerByRef.get(key)
      if (!owner) {
        throw new Error(
          `Caption terminal V3 job ${job.jobType} has foreign owner evidence.`)
      }
      actualOwners.push(owner)
      used.add(key)
    }
    if (actualOwners.join('|') !== expectedOwners.join('|')) {
      throw new Error(
        `Caption terminal V3 job ${job.jobType} owner coverage is incomplete.`)
    }
  }
  if (used.size !== allKeys.length) {
    throw new Error('Caption terminal V3 contains unused owner evidence.')
  }
}

function ownerRefs(sets: EvidenceSets): Record<
  CaptionSharedOwnerKey, CaptionDomainRef[]> {
  return {
    canonical_transcript: sets.canonicalTranscriptReadRefs,
    visual_intelligence: sets.visualIntelligenceEvidenceRefs,
    track_all: sets.trackAllEvidenceRefs,
    soundsync: sets.soundSyncEvidenceRefs,
    broll_owner: sets.brollOwnerEvidenceRefs,
  }
}

function toV2Shadow(
  input: CaptionTerminalQualificationEvidenceInputV3,
): CaptionTerminalQualificationEvidenceInputV2 {
  const refs = ownerRefs(input.canonicalSharedOwnerEvidence)
  const first = Object.fromEntries((Object.entries(refs) as Array<[
    CaptionSharedOwnerKey, CaptionDomainRef[]]>).map(([owner, values]) =>
    [owner, values[0]!])) as Record<CaptionSharedOwnerKey, CaptionDomainRef>
  const withoutDigest = {
    ...structuredClone(input),
    schemaVersion: CAPTION_TERMINAL_QUALIFICATION_INPUT_VERSION_V2,
    canonicalSharedOwnerEvidence: {
      canonicalTranscriptReadRef: first.canonical_transcript,
      visualIntelligenceEvidenceRef: first.visual_intelligence,
      trackAllEvidenceRef: first.track_all,
      soundSyncEvidenceRef: first.soundsync,
      brollOwnerEvidenceRef: first.broll_owner,
      actualCanonicalRecordsReread: true as const,
      sourceFixtureUsedAsRuntimeEvidence: false as const,
      referenceOnlyEvidenceAccepted: false as const,
    },
    jobEvidence: input.jobEvidence.map((job) => {
      const owners = CAPTION_CAP20_SHARED_OWNER_INTEGRATION_HANDOFF
        .conditionalJobBindings.find((binding) =>
          binding.jobType === job.jobType)?.requiredOwnerKeys ?? []
      return {
        ...structuredClone(job),
        sharedOwnerEvidenceRefs: owners.map((owner) => first[owner]),
      }
    }),
  }
  return {
    ...withoutDigest,
    inputDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      inputDigestSha256: '',
    } as unknown as Record<string, unknown>, 'inputDigestSha256'),
  }
}

function toV2ProjectionShadow(
  projection: CaptionTerminalQualificationProjectionV3,
  input: CaptionTerminalQualificationEvidenceInputV3,
) {
  const shadowInput = toV2Shadow(input)
  const withoutDigest = {
    ...structuredClone(projection),
    schemaVersion: CAPTION_TERMINAL_QUALIFICATION_PROJECTION_VERSION_V2,
    projectionId:
      `captions.terminal.v2.projection.${shadowInput.inputDigestSha256}`,
    sourceInputRef: {
      id: shadowInput.inputId,
      version: shadowInput.schemaVersion,
      contentHash: shadowInput.inputDigestSha256,
    },
    jobs: shadowInput.jobEvidence.map((job) => ({
      jobType: job.jobType,
      outputIds: [...job.outputIds],
      qualificationStatus: 'qualified_private_internal' as const,
      sourceJobResultRef: structuredClone(job.persistedCaptionJobResultRef),
      evidenceRefs: projectionEvidenceRefs(job),
      blockerCodes: [] as [],
      captionOwnedImplementationComplete: true as const,
      requiredCanonicalEvidenceComplete: true as const,
      runtimeOwnershipTransferredToCaption: false as const,
      duplicateSharedOwnerCreated: false as const,
    })),
  }
  return {
    ...withoutDigest,
    projectionDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      projectionDigestSha256: '',
    }, 'projectionDigestSha256'),
  }
}

function toV2PreflightShadow(
  preflight: CaptionTerminalQualificationPreflightV3,
  input: CaptionTerminalQualificationEvidenceInputV3 | null,
) {
  const shadowInput = input === null ? null : toV2Shadow(input)
  const withoutDigest = {
    ...structuredClone(preflight),
    schemaVersion: CAPTION_TERMINAL_QUALIFICATION_PREFLIGHT_VERSION_V2,
    preflightId: shadowInput === null
      ? 'captions.terminal.qualification.mount-audited-preflight'
      : `captions.terminal.v2.preflight.${shadowInput.inputDigestSha256}`,
    sourceQualificationInputRef:
      preflight.sourceQualificationInputRef === null || shadowInput === null
        ? null : {
            id: shadowInput.inputId,
            version: shadowInput.schemaVersion,
            contentHash: shadowInput.inputDigestSha256,
          },
  }
  return {
    ...withoutDigest,
    preflightDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      preflightDigestSha256: '',
    }, 'preflightDigestSha256'),
  }
}

function projectionEvidenceRefs(
  job: CaptionTerminalQualificationEvidenceInputV3['jobEvidence'][number],
): CaptionDomainRef[] {
  return [
    job.executionBundleRef,
    job.workItemRef,
    ...job.plannedAssetManifestEntryRefs,
    ...job.estimateCostBindingRefs,
    ...job.producedArtifactRefs,
    ...job.sharedOwnerEvidenceRefs,
    ...job.deterministicQaEvidenceRefs,
    ...job.renderedVisualReviewEvidenceRefs,
    ...job.independentFinalQaEvidenceRefs,
  ].map((ref) => structuredClone(ref))
}

function inputRef(
  input: CaptionTerminalQualificationEvidenceInputV3,
): CaptionDomainRef {
  return {
    id: input.inputId,
    version: input.schemaVersion,
    contentHash: input.inputDigestSha256,
  }
}

function refKey(ref: CaptionDomainRef): string {
  return `${ref.id}|${ref.version}|${ref.contentHash}`
}
