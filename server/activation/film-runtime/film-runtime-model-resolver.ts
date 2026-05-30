import { filmRuntimeConfig, filmRuntimeExpectedFiles } from './film-runtime-policy'

export function buildFilmRuntimeModelResolverSummary() {
  const expectedFiles = filmRuntimeExpectedFiles.map((relativePath) => ({
    relativePath,
    gcsUri: `${filmRuntimeConfig.artifactGcsPath}${relativePath}`,
    sha256: checksumFor(relativePath),
  }))
  return {
    artifactId: filmRuntimeConfig.artifactId,
    gcsPath: filmRuntimeConfig.artifactGcsPath,
    runtimePath: filmRuntimeConfig.artifactRuntimePath,
    aggregateSha256: filmRuntimeConfig.aggregateSha256,
    expectedFiles,
    blockers: expectedFiles.length === 4 ? [] : ['Expected four FILM SavedModel files.'],
    warnings: [
      'Model resolver is locked to the private Phase 38B film_net/Style/saved_model artifact tree.',
      'Phase 38C does not download FILM artifacts from external hosts at runtime.',
    ],
  }
}

function checksumFor(relativePath: string): string {
  if (relativePath.endsWith('keras_metadata.pb')) return filmRuntimeConfig.kerasMetadataSha256
  if (relativePath.endsWith('saved_model.pb')) return filmRuntimeConfig.savedModelSha256
  if (relativePath.endsWith('variables.data-00000-of-00001')) return filmRuntimeConfig.variablesDataSha256
  if (relativePath.endsWith('variables.index')) return filmRuntimeConfig.variablesIndexSha256
  throw new Error(`No checksum configured for ${relativePath}`)
}
