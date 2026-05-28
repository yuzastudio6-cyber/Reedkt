import type { StagingDeployTargetId, StagingImageArchitectureResult } from './staging-deploy-types'

export function parseImageArchitectureEvidence(input: {
  targetId: StagingDeployTargetId
  imageRef: string
  evidenceText: string
  rawEvidencePath?: string
}): StagingImageArchitectureResult {
  const platformMatches = Array.from(input.evidenceText.matchAll(/Platform:\s+([^\n\r]+)/gi))
    .map((match) => match[1].trim())
  const platforms = Array.from(new Set(platformMatches))
  const hasLinuxAmd64 = platforms.includes('linux/amd64')
  const hasLinuxArm64 = platforms.includes('linux/arm64')
  const blockers: string[] = []
  const warnings: string[] = []

  if (!hasLinuxAmd64) {
    blockers.push(`${input.targetId} image does not include linux/amd64, which is required for Cloud Run deployment.`)
  }
  if (hasLinuxArm64 && !hasLinuxAmd64) {
    warnings.push(`${input.targetId} image appears to be Apple Silicon/linux arm64 only.`)
  }
  if (platforms.some((platform) => platform === 'unknown/unknown')) {
    warnings.push(`${input.targetId} image includes an unknown/unknown attestation manifest; this is not itself deployable.`)
  }

  return {
    targetId: input.targetId,
    imageRef: input.imageRef,
    platforms,
    hasLinuxAmd64,
    hasLinuxArm64,
    compatibleWithCloudRun: hasLinuxAmd64,
    rawEvidencePath: input.rawEvidencePath,
    warnings,
    blockers,
  }
}

export function missingArchitectureEvidence(targetId: StagingDeployTargetId, imageRef: string): StagingImageArchitectureResult {
  return {
    targetId,
    imageRef,
    platforms: [],
    hasLinuxAmd64: false,
    hasLinuxArm64: false,
    compatibleWithCloudRun: false,
    blockers: [`${targetId} image architecture evidence is missing.`],
    warnings: [],
  }
}
