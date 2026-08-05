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
export const CAPTIONS_CANONICAL_RESUME_READ_ADAPTER_EVIDENCE_ID =
  'captions.canonical-specialist.resume-read-adapter' as const
export const CAPTIONS_VISUAL_INTELLIGENCE_SPATIAL_ADAPTER_EVIDENCE_ID =
  'captions.visual-intelligence.spatial-evidence-adapter' as const
export const CAPTIONS_CANONICAL_TRACK_ALL_EVIDENCE_ADAPTER_EVIDENCE_ID =
  'captions.track-all.canonical-evidence-read-adapter' as const

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
    {
      evidenceId: CAPTIONS_CANONICAL_RESUME_READ_ADAPTER_EVIDENCE_ID,
      evidenceType: 'fixture',
      location:
        'server/smoke/captions-specialist-canonical-resume-read-smoke.ts',
      assertion:
        'The Caption consumer validates the canonical backend sequential-resume record, exact current-owner injection, prior-owner promotion, and complete immediate lineage without importing backend implementation.',
    },
    {
      evidenceId: CAPTIONS_VISUAL_INTELLIGENCE_SPATIAL_ADAPTER_EVIDENCE_ID,
      evidenceType: 'fixture',
      location:
        'server/smoke/captions-specialist-visual-intelligence-spatial-adapter-smoke.ts',
      assertion:
        'The Caption consumer exact-rereads the authenticated Visual Intelligence report and immutable spatial companion, projects provider-neutral occupancy observations, and refuses pixel, contrast, rendered-inspection, provider, or QA authority overclaims.',
    },
    {
      evidenceId:
        CAPTIONS_CANONICAL_TRACK_ALL_EVIDENCE_ADAPTER_EVIDENCE_ID,
      evidenceType: 'fixture',
      location:
        'server/smoke/captions-specialist-canonical-track-all-evidence-read-smoke.ts',
      assertion:
        'The Caption consumer exact-rereads the canonical Track All/SAM 3.1 record and admits only its exact request, payload, runtime result, independent scene evidence, packet, admission, and owner projection lineage.',
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
    'canonical_backend_sequential_resume_consumer_frozen',
    'visual_intelligence_spatial_evidence_adapter_frozen',
    'canonical_track_all_evidence_read_adapter_frozen',
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
    'The canonical backend sequential-resume consumer is frozen, but no actual persisted resume record has been supplied to Caption.',
    'The Visual Intelligence spatial adapter is frozen, but no actual owner result has been injected; spatial v1 semantic geometry carries no deterministic regional contrast and cannot alone select final Caption placement.',
    'The canonical Track All evidence-read adapter is frozen, but this checkout has consumed only a source fixture; an actual persisted canonical record and resume record have not been supplied.',
    'The canonical backend publishes materially different V1 call, support, and result shapes; integration requires an additive digest-recomputed bridge and forbids cast or relabel behavior.',
  ],
  capabilityEntries,
}

export const CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST =
  publishSkillCapabilityManifestV2(unpublishedIntegrationManifest)
