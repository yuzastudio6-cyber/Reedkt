export interface ArtifactImageTagPolicyResult {
  allowed: boolean
  blockers: string[]
}

const forbiddenTags = new Set(['latest', 'prod', 'production', 'manual-not-set'])

export function validateArtifactImageTag(imageTag?: string): ArtifactImageTagPolicyResult {
  const blockers: string[] = []
  const tag = imageTag?.trim() ?? ''

  if (!tag) blockers.push('Image tag is required.')
  if (forbiddenTags.has(tag.toLowerCase())) blockers.push(`Image tag "${tag}" is forbidden for Artifact Registry push.`)
  if (/[;&|`$<>(){}[\]\\'"!\s]/.test(tag)) blockers.push('Image tag contains unsafe shell characters.')
  if (tag.length > 128) blockers.push('Image tag is too long.')
  if (tag && !/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(tag)) blockers.push('Image tag must use only letters, numbers, underscores, periods, and dashes.')

  return {
    allowed: blockers.length === 0,
    blockers,
  }
}
