import {
  type SkillCapabilityEntry,
  type SkillCapabilityManifestV2,
  type UnpublishedSkillCapabilityManifestV2,
} from '../../src/types/skill-capability-manifest'
import {
  CAPTIONS_CROSS_SYSTEM_COORDINATION_JOB_TYPE,
  CAPTIONS_CROSS_SYSTEM_OUTPUT_JOB_TYPES,
  CAPTIONS_SUPPORT_JOB_OUTPUT_ARTIFACT_TYPES,
  CAPTIONS_SUPPORT_JOB_TYPES,
  type CaptionsSupportJobType,
  type CaptionsSupportedJobType,
} from '../../src/types/captions-specialist'
import {
  CAPTION_CROSS_SYSTEM_COORDINATION_PLAN_ARTIFACT_TYPE,
  CAPTION_CROSS_SYSTEM_HANDOFF_ARTIFACT_TYPE,
  CAPTION_CROSS_SYSTEM_OUTBOUND_PAYLOAD_ARTIFACT_TYPE,
} from '../../src/types/caption-cross-system-coordination'
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
export const CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST_V2_ID =
  'captions.specialist.integration.manifest.v2' as const
export const CAPTIONS_SPECIALIST_INTEGRATION_V2_VERSION =
  'captions-specialist-integration-v2' as const
export const CAPTIONS_INCOMING_SUPPORT_REQUEST_V2_EVIDENCE_ID =
  'captions.incoming-support-request-v2-reread' as const
export const CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST_V3_ID =
  'captions.specialist.integration.manifest.v3' as const
export const CAPTIONS_SPECIALIST_INTEGRATION_V3_VERSION =
  'captions-specialist-integration-v3' as const
export const CAPTIONS_CROSS_SYSTEM_MANIFEST_EVIDENCE_ID =
  'captions.cross-system.manifest-v3' as const
export const CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST_V4_ID =
  'captions.specialist.integration.manifest.v4' as const
export const CAPTIONS_SPECIALIST_INTEGRATION_V4_VERSION =
  'captions-specialist-integration-v4' as const
export const CAPTIONS_CROSS_SYSTEM_PLANNING_LIFECYCLE_EVIDENCE_ID =
  'captions.cross-system.planning-lifecycle-v4' as const

const CAPTION_INCOMING_TYPOGRAPHY_JOB_TYPES = [
  'provide_speech_derived_typography_spec',
  'provide_typographic_transition_component',
] as const satisfies readonly CaptionsSupportedJobType[]

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

function integrateEntryV2(entry: SkillCapabilityEntry): SkillCapabilityEntry {
  if (!(CAPTIONS_SUPPORT_JOB_TYPES as readonly string[])
    .includes(entry.supportedJobType)) return structuredClone(entry)
  const supportOutput = CAPTIONS_SUPPORT_JOB_OUTPUT_ARTIFACT_TYPES[
    entry.supportedJobType as CaptionsSupportJobType]
  return {
    ...structuredClone(entry),
    capabilityVersion: 'captions-capability-integration-v2',
    qualificationEvidenceRefs: unique([
      ...entry.qualificationEvidenceRefs,
      CAPTIONS_INCOMING_SUPPORT_REQUEST_V2_EVIDENCE_ID,
    ]),
    producedArtifactTypes: unique([
      ...entry.producedArtifactTypes,
      supportOutput,
    ]),
    integrationQa: unique([
      ...entry.integrationQa,
      'incoming_support_request_v2_exact_reread_and_result_binding',
    ]),
    qualificationFixtures: unique([
      ...entry.qualificationFixtures,
      'captions.incoming-support-request-v2',
    ]),
  }
}

const {
  manifestHash: _integrationV1Hash,
  ...integrationV1Body
} = structuredClone(
  CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST) as SkillCapabilityManifestV2
void _integrationV1Hash

const unpublishedIntegrationManifestV2:
UnpublishedSkillCapabilityManifestV2 = {
  ...integrationV1Body,
  manifestId: CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST_V2_ID,
  skillVersion: CAPTIONS_SPECIALIST_INTEGRATION_V2_VERSION,
  qualificationEvidenceRefs: [
    ...integrationV1Body.qualificationEvidenceRefs,
    {
      evidenceId: CAPTIONS_INCOMING_SUPPORT_REQUEST_V2_EVIDENCE_ID,
      evidenceType: 'smoke_test',
      location:
        'server/smoke/canonical-caption-specialist-execution-service-smoke.ts',
      assertion:
        'Caption exact-rereads a persisted skill-support-request-v2 targeted to its assigned job and returns the requested byte-free artifact bound to that request.',
    },
  ],
  integrationQa: unique([
    ...integrationV1Body.integrationQa,
    'incoming_support_target_caption_requires_versioned_v2_request',
    'incoming_support_request_reread_before_caption_execution',
  ]),
  qualificationFixtures: unique([
    ...integrationV1Body.qualificationFixtures,
    'captions.incoming-support-request-v2',
  ]),
  knownLimitations: [
    ...integrationV1Body.knownLimitations,
    'skill-support-request-v1 remains frozen and cannot target Caption; incoming Caption support assignments use only the additive V2 request.',
  ],
  capabilityEntries: integrationV1Body.capabilityEntries.map(integrateEntryV2),
}

export const CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST_V2 =
  publishSkillCapabilityManifestV2(unpublishedIntegrationManifestV2)

function integrateEntryV3(entry: SkillCapabilityEntry): SkillCapabilityEntry {
  const supportJob = (CAPTIONS_SUPPORT_JOB_TYPES as readonly string[])
    .includes(entry.supportedJobType)
  const crossSystemHandoff = (
    CAPTIONS_CROSS_SYSTEM_OUTPUT_JOB_TYPES as readonly string[])
    .includes(entry.supportedJobType)
  const coordinationPlan = entry.supportedJobType
    === CAPTIONS_CROSS_SYSTEM_COORDINATION_JOB_TYPE
  const incomingTypography = (
    CAPTION_INCOMING_TYPOGRAPHY_JOB_TYPES as readonly string[])
    .includes(entry.supportedJobType)
  return {
    ...structuredClone(entry),
    capabilityVersion: 'captions-capability-integration-v3',
    qualificationEvidenceRefs: unique([
      ...entry.qualificationEvidenceRefs,
      CAPTIONS_CROSS_SYSTEM_MANIFEST_EVIDENCE_ID,
    ]),
    requiredInputs: unique([
      ...entry.requiredInputs,
      ...(supportJob ? ['source_skill_support_request'] : []),
    ]),
    requiredEvidence: unique([
      ...entry.requiredEvidence,
      ...(supportJob ? ['source_skill_support_request'] : []),
    ]),
    acceptedArtifactTypes: unique([
      ...entry.acceptedArtifactTypes,
      ...entry.requiredEvidence,
      ...(supportJob ? ['source_skill_support_request'] : []),
    ]),
    producedArtifactTypes: unique([
      ...entry.producedArtifactTypes,
      ...(crossSystemHandoff ? [
        CAPTION_CROSS_SYSTEM_OUTBOUND_PAYLOAD_ARTIFACT_TYPE,
        CAPTION_CROSS_SYSTEM_HANDOFF_ARTIFACT_TYPE,
      ] : []),
      ...(coordinationPlan
        ? [CAPTION_CROSS_SYSTEM_COORDINATION_PLAN_ARTIFACT_TYPE] : []),
    ]),
    integrationQa: unique([
      ...entry.integrationQa,
      ...(supportJob
        ? ['source_support_request_declared_and_exactly_reread'] : []),
      ...(crossSystemHandoff
        ? ['cross_system_payload_and_handoff_declared_without_receiver_execution']
        : []),
      ...(incomingTypography
        ? ['incoming_typography_typed_payload_closed_and_source_bound'] : []),
    ]),
    qualificationFixtures: unique([
      ...entry.qualificationFixtures,
      'captions.cross-system.manifest-v3',
    ]),
  }
}

const {
  manifestHash: _integrationV2HashForV3,
  ...integrationV2BodyForV3
} = structuredClone(
  CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST_V2) as SkillCapabilityManifestV2
void _integrationV2HashForV3

const capabilityEntriesV3 = integrationV2BodyForV3.capabilityEntries.map(
  integrateEntryV3)

const unpublishedIntegrationManifestV3:
UnpublishedSkillCapabilityManifestV2 = {
  ...integrationV2BodyForV3,
  manifestId: CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST_V3_ID,
  skillVersion: CAPTIONS_SPECIALIST_INTEGRATION_V3_VERSION,
  qualificationEvidenceRefs: [
    ...integrationV2BodyForV3.qualificationEvidenceRefs,
    {
      evidenceId: CAPTIONS_CROSS_SYSTEM_MANIFEST_EVIDENCE_ID,
      evidenceType: 'smoke_test',
      location: 'server/smoke/captions-specialist-cap-12-smoke.ts',
      assertion:
        'The manifest exposes the closed Caption cross-system payload, handoff, coordination, and mediated incoming-support surfaces without granting receiver execution.',
    },
  ],
  optionalInputs: unique([
    ...integrationV2BodyForV3.optionalInputs,
    'source_skill_support_request',
  ]),
  acceptedArtifactTypes: unique(capabilityEntriesV3.flatMap((entry) =>
    entry.acceptedArtifactTypes)),
  producedArtifactTypes: unique(capabilityEntriesV3.flatMap((entry) =>
    entry.producedArtifactTypes)),
  integrationQa: unique([
    ...integrationV2BodyForV3.integrationQa,
    'global_artifact_catalog_equals_per_job_artifact_union',
    'cross_system_artifacts_remain_caption_owned_coordination_only',
  ]),
  qualificationFixtures: unique([
    ...integrationV2BodyForV3.qualificationFixtures,
    'captions.cross-system.manifest-v3',
  ]),
  knownLimitations: [
    ...integrationV2BodyForV3.knownLimitations,
    'Cross-system artifact declarations prove Caption-owned planning and coordination output only; they do not claim receiver execution or result evidence.',
  ],
  capabilityEntries: capabilityEntriesV3,
}

export const CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST_V3 =
  publishSkillCapabilityManifestV2(unpublishedIntegrationManifestV3)

function integrateEntryV4(entry: SkillCapabilityEntry): SkillCapabilityEntry {
  const planningOnlyCrossSystem = entry.supportedJobType
    === CAPTIONS_CROSS_SYSTEM_COORDINATION_JOB_TYPE
    || entry.supportedJobType === 'provide_caption_to_visual_handoff_spec'
  if (!planningOnlyCrossSystem) return structuredClone(entry)
  return {
    ...structuredClone(entry),
    capabilityVersion: 'captions-capability-integration-v4',
    qualificationEvidenceRefs: unique([
      ...entry.qualificationEvidenceRefs,
      CAPTIONS_CROSS_SYSTEM_PLANNING_LIFECYCLE_EVIDENCE_ID,
    ]),
    requiredEvidence: entry.requiredEvidence.filter((artifactType) =>
      artifactType !== 'caption_living_frame_handoff_binding'),
    integrationQa: unique([
      ...entry.integrationQa,
      'coordination_planning_must_precede_receiver_result_admission',
      'living_frame_result_required_only_by_dedicated_constraints_job',
    ]),
    qualificationFixtures: unique([
      ...entry.qualificationFixtures,
      'captions.cross-system.planning-lifecycle-v4',
    ]),
  }
}

const {
  manifestHash: _integrationV3HashForV4,
  ...integrationV3BodyForV4
} = structuredClone(
  CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST_V3) as SkillCapabilityManifestV2
void _integrationV3HashForV4

const capabilityEntriesV4 = integrationV3BodyForV4.capabilityEntries.map(
  integrateEntryV4)

const unpublishedIntegrationManifestV4:
UnpublishedSkillCapabilityManifestV2 = {
  ...integrationV3BodyForV4,
  manifestId: CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST_V4_ID,
  skillVersion: CAPTIONS_SPECIALIST_INTEGRATION_V4_VERSION,
  qualificationEvidenceRefs: [
    ...integrationV3BodyForV4.qualificationEvidenceRefs,
    {
      evidenceId: CAPTIONS_CROSS_SYSTEM_PLANNING_LIFECYCLE_EVIDENCE_ID,
      evidenceType: 'smoke_test',
      location:
        'server/smoke/canonical-caption-broll-approved-run-harness-smoke.ts',
      assertion:
        'The aggregate Caption coordination plan creates only mediated handoff artifacts and does not require a receiver result before planning completes.',
    },
  ],
  acceptedArtifactTypes: unique(capabilityEntriesV4.flatMap((entry) =>
    entry.acceptedArtifactTypes)),
  integrationQa: unique([
    ...integrationV3BodyForV4.integrationQa,
    'cross_system_planning_precedes_receiver_result_admission',
  ]),
  qualificationFixtures: unique([
    ...integrationV3BodyForV4.qualificationFixtures,
    'captions.cross-system.planning-lifecycle-v4',
  ]),
  knownLimitations: [
    ...integrationV3BodyForV4.knownLimitations,
    'The aggregate coordination artifact does not claim that Living Frame or any other receiver executed or returned evidence.',
  ],
  capabilityEntries: capabilityEntriesV4,
}

export const CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST_V4 =
  publishSkillCapabilityManifestV2(unpublishedIntegrationManifestV4)
