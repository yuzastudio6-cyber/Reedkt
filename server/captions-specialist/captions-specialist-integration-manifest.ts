import {
  type SkillCapabilityEntry,
  type SkillCapabilityManifestV2,
  type UnpublishedSkillCapabilityManifestV2,
} from '../../src/types/skill-capability-manifest'
import type { CaptionsSupportedJobType } from
  '../../src/types/captions-specialist'
import { publishSkillCapabilityManifestV2 } from
  '../orchestra/skill-capability-manifest'
import { CAPTION_CAP20_SHARED_OWNER_INTEGRATION_HANDOFF } from
  './caption-shared-owner-integration'
import { CAPTIONS_SPECIALIST_MANIFEST } from
  './captions-specialist-manifest'

export const CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST_ID =
  'captions.specialist.integration.manifest' as const
export const CAPTIONS_SPECIALIST_INTEGRATION_VERSION =
  'captions-specialist-integration-v1' as const
export const CAPTIONS_SPECIALIST_INTEGRATION_EVIDENCE_ID =
  'captions.post-cap20.integration-policy' as const
export const CAPTIONS_BROLL_OWNER_READ_ADAPTER_EVIDENCE_ID =
  'captions.broll.owner-read.public-adapter' as const
export const CAPTIONS_CANONICAL_TRANSCRIPT_READ_ADAPTER_EVIDENCE_ID =
  'captions.canonical-transcript.authenticated-read-adapter' as const

const conditionalByJob = new Map(
  CAPTION_CAP20_SHARED_OWNER_INTEGRATION_HANDOFF.conditionalJobBindings.map(
    (binding) => [binding.jobType, binding]),
)

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

function integrateEntry(entry: SkillCapabilityEntry): SkillCapabilityEntry {
  const binding = conditionalByJob.get(
    entry.supportedJobType as CaptionsSupportedJobType)
  if (!binding) return structuredClone(entry)
  const transcriptReadRequired = entry.supportedJobType
    === 'resolve_multi_track_caption_scene'
    || entry.supportedJobType === 'resolve_spatial_typography'
  const requiredEvidence = unique([
    ...entry.requiredEvidence,
    ...binding.requiredArtifactTypes,
    ...(transcriptReadRequired
      ? ['canonical_transcript_authenticated_read_binding'] : []),
  ])
  return {
    ...structuredClone(entry),
    capabilityVersion: 'captions-capability-integration-v1',
    qualificationEvidenceRefs: unique([
      ...entry.qualificationEvidenceRefs,
      CAPTIONS_SPECIALIST_INTEGRATION_EVIDENCE_ID,
      ...(transcriptReadRequired
        ? [CAPTIONS_CANONICAL_TRANSCRIPT_READ_ADAPTER_EVIDENCE_ID] : []),
    ]),
    requiredEvidence,
    acceptedArtifactTypes: unique([
      ...entry.acceptedArtifactTypes,
      ...binding.requiredArtifactTypes,
    ]),
    integrationQa: unique([
      ...entry.integrationQa,
      'exact_post_cap20_shared_owner_requirement_set',
      'authenticated_owner_result_required_before_completion',
      ...(transcriptReadRequired
        ? ['exact_canonical_transcript_authenticated_reread_required'] : []),
    ]),
    qualificationFixtures: unique([
      ...entry.qualificationFixtures,
      'captions.post-cap20.integration-routing',
    ]),
    knownLimitations: [
      ...entry.knownLimitations,
      'This integration manifest qualifies mediated dependency routing only; authenticated owner runtime evidence remains required.',
    ],
  }
}

const {
  manifestHash: _legacyManifestHash,
  ...legacyBody
} = structuredClone(CAPTIONS_SPECIALIST_MANIFEST) as SkillCapabilityManifestV2
void _legacyManifestHash

const capabilityEntries = legacyBody.capabilityEntries.map(integrateEntry)
const acceptedArtifactTypes = unique(capabilityEntries.flatMap((entry) =>
  entry.acceptedArtifactTypes))

const unpublishedIntegrationManifest:
UnpublishedSkillCapabilityManifestV2 = {
  ...legacyBody,
  manifestId: CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST_ID,
  skillVersion: CAPTIONS_SPECIALIST_INTEGRATION_VERSION,
  qualificationEvidenceRefs: [
    ...legacyBody.qualificationEvidenceRefs,
    {
      evidenceId: CAPTIONS_SPECIALIST_INTEGRATION_EVIDENCE_ID,
      evidenceType: 'smoke_test',
      location:
        'server/smoke/captions-specialist-integration-routing-smoke.ts',
      assertion:
        'Every CAP-20 conditional job requests its exact authenticated shared-owner evidence through the bounded support/resume protocol.',
    },
    {
      evidenceId: CAPTIONS_BROLL_OWNER_READ_ADAPTER_EVIDENCE_ID,
      evidenceType: 'fixture',
      location:
        'server/smoke/captions-specialist-broll-owner-read-adapter-smoke.ts',
      assertion:
        'The Caption-owned caption-broll-owner-read-adapter-v1 validates the exact frozen owner request/result and projects only opaque refs.',
    },
    {
      evidenceId:
        CAPTIONS_CANONICAL_TRANSCRIPT_READ_ADAPTER_EVIDENCE_ID,
      evidenceType: 'fixture',
      location:
        'server/smoke/captions-specialist-canonical-transcript-authenticated-read-smoke.ts',
      assertion:
        'The Caption-owned authenticated-read adapter admits an immutable canonical transcript only after exact private scope, digest, source, alignment, and complete diarization reread.',
    },
  ],
  acceptedArtifactTypes,
  integrationQa: unique([
    ...legacyBody.integrationQa,
    'post_cap20_shared_owner_handoff_exactly_bound',
    'canonical_transcript_is_authenticated_initial_input',
    'canonical_transcript_authenticated_read_adapter_frozen',
    'sound_and_broll_may_not_silently_complete_without_owner_evidence',
    'broll_owner_read_public_adapter_frozen',
    'backend_wire_projection_must_be_distinctly_versioned',
  ]),
  qualificationFixtures: unique([
    ...legacyBody.qualificationFixtures,
    'captions.post-cap20.integration-routing',
  ]),
  knownLimitations: [
    ...legacyBody.knownLimitations,
    'This additive manifest does not supersede or mutate the frozen CAP-01 planning manifest.',
    'It qualifies dependency routing, not private execution, final QA, or terminal specialist status.',
    'The B-roll public adapter is frozen, but no authenticated owner result has been persisted, reread, or injected in this checkout.',
    'The canonical transcript authenticated-read adapter is frozen, but no canonical persistence reader is mounted in this checkout.',
    'The canonical backend publishes materially different V1 call, support, and result shapes; integration requires an additive digest-recomputed bridge and forbids cast or relabel behavior.',
  ],
  capabilityEntries,
}

export const CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST =
  publishSkillCapabilityManifestV2(unpublishedIntegrationManifest)
