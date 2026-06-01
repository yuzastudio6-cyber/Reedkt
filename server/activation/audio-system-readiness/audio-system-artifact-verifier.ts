import type { DeepFilterNetFeatureE2EExecutionReport } from '../deepfilternet-feature-e2e'
import type { AudioSystemArtifactVerification } from './audio-system-readiness-types'

export const requiredPhase36EArtifactIds = [
  'approved-plan-snapshot-json',
  'source-validation-json',
  'deepfilternet-cleaned-wav',
  'model-checksum-verification-json',
  'input-metrics-json',
  'output-metrics-json',
  'comparison-metrics-json',
  'loudness-report-json',
  'deepfilternet-audio-feature-review-mp4',
  'private-review-manifest-json',
  'deepfilternet-feature-e2e-qa-json',
] as const

export function requiredPhase36EArtifactUris(report: DeepFilterNetFeatureE2EExecutionReport): string[] {
  const byId = new Map(report.artifacts.map((artifact) => [artifact.id, artifact.gcsUri]))
  return requiredPhase36EArtifactIds
    .map((artifactId) => byId.get(artifactId))
    .filter((uri): uri is string => Boolean(uri))
}

export function buildStaticPhase36EArtifactRequirements(report?: DeepFilterNetFeatureE2EExecutionReport): AudioSystemArtifactVerification[] {
  if (!report) {
    return requiredPhase36EArtifactIds.map((artifactId) => ({
      artifactId,
      gcsUri: '(requires Phase 36E report fetch)',
      required: true,
      exists: false,
      private: false,
      blocker: 'Phase 36E report has not been fetched yet.',
    }))
  }
  const byId = new Map(report.artifacts.map((artifact) => [artifact.id, artifact]))
  return requiredPhase36EArtifactIds.map((artifactId) => {
    const artifact = byId.get(artifactId)
    return {
      artifactId,
      gcsUri: artifact?.gcsUri ?? '(missing from Phase 36E report)',
      required: true,
      exists: Boolean(artifact),
      private: artifact ? !artifact.gcsUri.includes('http') : false,
      sizeBytes: artifact?.sizeBytes,
      blocker: artifact ? undefined : `Required Phase 36E artifact ${artifactId} is missing from the report.`,
    }
  })
}

export function phase36EArtifactBlockers(verifications: AudioSystemArtifactVerification[]): string[] {
  return verifications
    .filter((verification) => verification.required && (!verification.exists || !verification.private || Number(verification.sizeBytes ?? 0) <= 0 || verification.blocker))
    .map((verification) => verification.blocker ?? `${verification.artifactId} failed artifact verification.`)
}
