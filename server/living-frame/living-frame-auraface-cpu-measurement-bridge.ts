import type {
  LivingFrameAuraFaceContinuityMeasurement,
  LivingFrameAuraFaceContinuityMeasurementEvidenceClass,
} from '../../src/types/living-frame-auraface-continuity-measurement'
import type {
  LivingFrameAuraFaceCpuEmbeddingOutputLease,
} from '../../src/types/living-frame-auraface-cpu-runtime'
import type {
  LivingFrameAuraFaceArtifactRequirements,
} from '../../src/types/living-frame-auraface-artifact-requirements'
import {
  createLivingFrameAuraFaceContinuityMeasurement,
  createLivingFrameAuraFacePrivateEmbeddingReader,
  type LivingFrameAuraFacePrivateEmbeddingPacket,
} from './living-frame-auraface-continuity-measurement'
import {
  consumeLivingFrameAuraFaceCpuEmbeddingOutputLease,
} from './living-frame-auraface-cpu-runtime'

export async function createLivingFrameAuraFaceContinuityMeasurementFromCpuRuntime(
  input: {
    readonly artifactRequirements:
      LivingFrameAuraFaceArtifactRequirements
    readonly embeddingOutputLease:
      LivingFrameAuraFaceCpuEmbeddingOutputLease
  },
): Promise<LivingFrameAuraFaceContinuityMeasurement> {
  const packet =
    consumeLivingFrameAuraFaceCpuEmbeddingOutputLease(
      input.embeddingOutputLease,
    )
  const controlledFixture =
    packet.evidenceClass
      === 'controlled_non_promotable_auraface_cpu_runtime_fixture'
  const evidenceClass:
    LivingFrameAuraFaceContinuityMeasurementEvidenceClass =
    controlledFixture
      ? 'controlled_non_promotable_embedding_fixture'
    : 'private_internal_auraface_cpu_embedding_observation_unreleased'
  const measurementPacket:
    LivingFrameAuraFacePrivateEmbeddingPacket = {
      packetClass: controlledFixture
        ? 'server_owned_controlled_auraface_embedding_fixture_packet_v1'
        : 'process_bound_private_auraface_cpu_embedding_packet_v1',
      evidenceClass,
      artifactRequirementSetDigestSha256:
        packet.artifactRequirementSetDigestSha256,
      referenceArtifactDigestSha256:
        packet.referenceArtifactDigestSha256,
      candidateArtifactDigestSha256:
        packet.candidateArtifactDigestSha256,
      referenceContinuityEntryDigestSha256:
        packet.referenceContinuityEntryDigestSha256,
      candidateContinuityEntryDigestSha256:
        packet.candidateContinuityEntryDigestSha256,
      preprocessingSpecDigestSha256:
        packet.preprocessingSpecDigestSha256,
      referenceInferenceOutputDigestSha256:
        packet.referenceInferenceOutputDigestSha256,
      candidateInferenceOutputDigestSha256:
        packet.candidateInferenceOutputDigestSha256,
      referenceFaceCount: 1,
      candidateFaceCount: 1,
      embeddingDimension: 512,
      referenceEmbedding: packet.referenceEmbedding,
      candidateEmbedding: packet.candidateEmbedding,
      controlledFixtureOnly: controlledFixture,
      callerThresholdAccepted: false,
      callerBytesPathUrlOrCredentialAccepted: false,
      liveInferenceAuthority: false,
      identityApprovalAuthority: false,
      actualCostAuthority: false,
      productionReady: false,
    }
  const reader =
    createLivingFrameAuraFacePrivateEmbeddingReader({
      artifactRequirements: input.artifactRequirements,
      evidenceClass,
      referenceArtifactDigestSha256:
        packet.referenceArtifactDigestSha256,
      candidateArtifactDigestSha256:
        packet.candidateArtifactDigestSha256,
      referenceContinuityEntryDigestSha256:
        packet.referenceContinuityEntryDigestSha256,
      candidateContinuityEntryDigestSha256:
        packet.candidateContinuityEntryDigestSha256,
      preprocessingSpecDigestSha256:
        packet.preprocessingSpecDigestSha256,
      referenceInferenceOutputDigestSha256:
        packet.referenceInferenceOutputDigestSha256,
      candidateInferenceOutputDigestSha256:
        packet.candidateInferenceOutputDigestSha256,
      readServerOwnedEmbeddingFixture:
        async () => measurementPacket,
    })
  return createLivingFrameAuraFaceContinuityMeasurement({
    artifactRequirements: input.artifactRequirements,
    embeddingReader: reader,
  })
}
