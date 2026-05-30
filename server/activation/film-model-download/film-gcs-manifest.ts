import { buildFilmAggregateChecksum } from './film-checksum'
import {
  FILM_CHECKPOINT_SOURCE_URL,
  FILM_LICENSE_NAME,
  FILM_MODEL_DOWNLOAD_GCS_PATH,
  FILM_MODEL_ID,
  FILM_PROJECT_PAGE_URL,
  FILM_SELECTED_ARTIFACT_ROOT,
  FILM_SOURCE_REPO_URL,
  FILM_TOOL_FAMILY,
} from './film-model-download-policy'
import type { FilmChecksumEntry, FilmModelTreeManifest } from './film-model-download-types'

export function buildFilmModelTreeManifest(input: {
  files: FilmChecksumEntry[]
  createdAt: string
}): FilmModelTreeManifest {
  const fileSha256 = Object.fromEntries(input.files.map((entry) => [entry.relativePath, entry.sha256]))
  const fileSizes = Object.fromEntries(input.files.map((entry) => [entry.relativePath, entry.sizeBytes]))
  return {
    phase: '38B',
    track: 'A visual/video',
    toolFamily: FILM_TOOL_FAMILY,
    modelId: FILM_MODEL_ID,
    selectedArtifactRoot: FILM_SELECTED_ARTIFACT_ROOT,
    checkpointSourceUrl: FILM_CHECKPOINT_SOURCE_URL,
    sourceRepoUrl: FILM_SOURCE_REPO_URL,
    projectPageUrl: FILM_PROJECT_PAGE_URL,
    licenseName: FILM_LICENSE_NAME,
    fileSha256,
    aggregateSha256: buildFilmAggregateChecksum(input.files),
    fileSizes,
    fileCount: input.files.length,
    createdAt: input.createdAt,
    targetGcsPath: FILM_MODEL_DOWNLOAD_GCS_PATH,
    downloadAllowedInPhase38B: true,
    filmRuntimeAllowed: false,
    slowMotionAllowed: false,
    realVideoSlowMotionAllowed: false,
    fullVideoInterpolationAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
  }
}
