import { buildArtifactImageManifest } from './artifact-image-manifest'
import { validateArtifactImageTag } from './artifact-image-tag-policy'
import type {
  ArtifactPushCommandPlan,
  ArtifactPushVerificationCommandPlan,
} from './artifact-push-types'

export interface ArtifactPushCommandPlanInput {
  project?: string
  artifactRegion?: string
  repository?: string
  imageTag?: string
}

export const artifactPushDoesNotDo = [
  'no GPU image push',
  'no Cloud Run deployment',
  'no gcloud run deploy',
  'no Docker build',
  'no provider calls',
  'no model downloads',
  'no media processing',
  'no secret values',
  'no production or external beta unblock',
]

export function buildArtifactPushCommandPlans(input: ArtifactPushCommandPlanInput): ArtifactPushCommandPlan[] {
  if (!validateArtifactPushCommandPlanInput(input).allowed) return []

  return buildArtifactImageManifest(input).map((manifest) => ({
    commandId: `artifact_push_${manifest.imageId}`,
    imageId: manifest.imageId,
    sourceImageNames: manifest.sourceImageNames,
    targetFullImageName: manifest.targetFullImageName,
    commandString: manifest.deferred
      ? 'GPU image deferred for Phase 23B non-GPU image push.'
      : [
          `docker tag <local-source-for-${manifest.imageId}> ${manifest.targetFullImageName}`,
          `REEDITPRO_CONFIRM_ARTIFACT_PUSH=true docker push ${manifest.targetFullImageName}`,
        ].join(' && '),
    safeToRunManually: !manifest.deferred,
    requiresHumanConfirmation: true,
    confirmationEnvVar: 'REEDITPRO_CONFIRM_ARTIFACT_PUSH',
    deferred: manifest.deferred,
    doesNotDo: [...artifactPushDoesNotDo],
    warnings: manifest.deferred
      ? ['GPU image is deferred and must not be pushed in Phase 23B.']
      : ['Plan text only; the CLI does not execute docker tag or docker push.'],
  }))
}

export function buildArtifactPushVerificationCommandPlans(input: ArtifactPushCommandPlanInput): ArtifactPushVerificationCommandPlan[] {
  if (!validateArtifactPushCommandPlanInput(input).allowed) return []

  return buildArtifactImageManifest(input)
    .filter((manifest) => !manifest.deferred)
    .map((manifest) => ({
      commandId: `artifact_digest_${manifest.imageId}`,
      imageId: manifest.imageId,
      targetFullImageName: manifest.targetFullImageName,
      commandString: `gcloud artifacts docker images describe ${manifest.targetFullImageName} --project ${input.project}`,
      safeToRunManually: true,
      doesNotDo: [
        'no deployment',
        'no gcloud run',
        'no Docker push',
        'no provider calls',
        'no model downloads',
        'no media processing',
        'no secret values',
      ],
    }))
}

export function validateArtifactPushCommandPlanInput(input: ArtifactPushCommandPlanInput) {
  const blockers: string[] = []
  const tagCheck = validateArtifactImageTag(input.imageTag)
  if (!tagCheck.allowed) blockers.push(...tagCheck.blockers)
  if (!input.project || !/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(input.project)) blockers.push('GCP project id is missing or invalid.')
  if (input.project && /production/i.test(input.project)) blockers.push('Production-looking project id is forbidden for Phase 23B.')
  if (!input.artifactRegion || !/^[a-z]+-[a-z]+[0-9]$/.test(input.artifactRegion)) blockers.push('Artifact region is missing or invalid.')
  if (!input.repository || !/^[a-z0-9][a-z0-9-]{2,62}$/.test(input.repository)) blockers.push('Artifact repository is missing or invalid.')
  if (input.repository && !input.repository.includes('staging')) blockers.push('Artifact repository must be staging-scoped.')

  return {
    allowed: blockers.length === 0,
    blockers,
  }
}
