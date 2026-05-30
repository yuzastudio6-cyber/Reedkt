import { resolveOfficialFilmDriveTree } from './film-artifact-resolver'
import {
  FILM_CHECKPOINT_SOURCE_URL,
  FILM_LICENSE_NAME,
  FILM_LICENSE_URL,
  FILM_PROJECT_PAGE_URL,
  FILM_README_URL,
  FILM_SELECTED_ARTIFACT_ROOT,
  FILM_SOURCE_REPO,
  FILM_SOURCE_REPO_URL,
} from './film-model-download-policy'
import type { FilmLicenseEvidence, FilmSourceEvidence } from './film-model-download-types'

export function buildStaticFilmSourceEvidence(): FilmSourceEvidence {
  return {
    collectedAt: 'static-phase38b-plan',
    sourceRepo: FILM_SOURCE_REPO,
    sourceRepoUrl: FILM_SOURCE_REPO_URL,
    projectPageUrl: FILM_PROJECT_PAGE_URL,
    readmeUrl: FILM_README_URL,
    licenseUrl: FILM_LICENSE_URL,
    checkpointSourceUrl: FILM_CHECKPOINT_SOURCE_URL,
    selectedArtifactRoot: FILM_SELECTED_ARTIFACT_ROOT,
    licenseName: FILM_LICENSE_NAME,
    licenseEvidenceSummary: 'Official google-research/frame-interpolation LICENSE is Apache-2.0.',
    readmeEvidenceSummary: 'Official README documents pre-trained TF2 Saved Models in the Google Drive folder and examples using film_net/Style/saved_model.',
    driveEvidenceSummary: 'Phase 38B execution must resolve the public Google Drive tree and accept only film_net/Style/saved_model.',
    sourceUrls: [FILM_SOURCE_REPO_URL, FILM_PROJECT_PAGE_URL, FILM_README_URL, FILM_LICENSE_URL, FILM_CHECKPOINT_SOURCE_URL],
    codexLicenseDecision: 'staging_download_approved_by_codex',
    humanLicenseApprovalRequired: false,
    blockers: [],
    warnings: [
      'Static report mode does not verify Google Drive public listing availability.',
      'Repository archive/read-only status remains a runtime maintenance risk for Phase 38C.',
    ],
  }
}

export function buildStaticFilmLicenseEvidence(): FilmLicenseEvidence {
  return {
    collectedAt: 'static-phase38b-plan',
    licenseName: FILM_LICENSE_NAME,
    officialLicenseUrl: FILM_LICENSE_URL,
    sourceRepoUrl: FILM_SOURCE_REPO_URL,
    checkpointSourceUrl: FILM_CHECKPOINT_SOURCE_URL,
    codexLicenseDecision: 'staging_download_approved_by_codex',
    humanLicenseApprovalRequired: false,
    summary: 'Apache-2.0 evidence from the official Google Research repository is sufficient for the bounded private staging download/load phase.',
    blockers: [],
    warnings: ['Phase 38C must separately validate runtime dependency licenses before running FILM.'],
  }
}

export async function collectFilmSourceEvidence(): Promise<{
  sourceEvidence: FilmSourceEvidence
  licenseEvidence: FilmLicenseEvidence
}> {
  const collectedAt = new Date().toISOString()
  const blockers: string[] = []
  const warnings: string[] = [
    'Repository archive/read-only status remains a runtime maintenance risk for Phase 38C.',
    'Phase 38B verifies source/provenance and stores artifacts only; no FILM runtime is allowed.',
  ]

  const [readmeResult, licenseResult] = await Promise.allSettled([
    fetchText(FILM_README_URL),
    fetchText(FILM_LICENSE_URL),
  ])

  const readme = readmeResult.status === 'fulfilled' ? readmeResult.value : ''
  const license = licenseResult.status === 'fulfilled' ? licenseResult.value : ''

  if (readmeResult.status === 'rejected') blockers.push(`Could not fetch official FILM README: ${String(readmeResult.reason)}`)
  if (licenseResult.status === 'rejected') blockers.push(`Could not fetch official FILM LICENSE: ${String(licenseResult.reason)}`)
  if (!readme.includes('Pre-trained Models')) blockers.push('Official README did not contain the expected Pre-trained Models section.')
  if (!readme.includes(FILM_CHECKPOINT_SOURCE_URL) && !readme.includes('drive.google.com/drive/folders/1q8110-qp225asX3DQvZnfLfJPkCHmDpy')) {
    blockers.push('Official README did not contain the approved Google Drive checkpoint folder.')
  }
  if (!readme.includes('film_net/Style/saved_model')) blockers.push('Official README did not contain the selected film_net/Style/saved_model example path.')
  if (!license.includes('Apache License') || !license.includes('Version 2.0')) blockers.push('Official LICENSE did not contain Apache-2.0 evidence.')

  let resolvedDriveTree
  if (blockers.length === 0) {
    try {
      resolvedDriveTree = await resolveOfficialFilmDriveTree()
    } catch (error) {
      blockers.push(`Could not safely resolve official Google Drive artifact tree: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const codexLicenseDecision = blockers.length === 0 ? 'staging_download_approved_by_codex' : 'blocked'
  const sourceEvidence: FilmSourceEvidence = {
    collectedAt,
    sourceRepo: FILM_SOURCE_REPO,
    sourceRepoUrl: FILM_SOURCE_REPO_URL,
    projectPageUrl: FILM_PROJECT_PAGE_URL,
    readmeUrl: FILM_README_URL,
    licenseUrl: FILM_LICENSE_URL,
    checkpointSourceUrl: FILM_CHECKPOINT_SOURCE_URL,
    selectedArtifactRoot: FILM_SELECTED_ARTIFACT_ROOT,
    licenseName: FILM_LICENSE_NAME,
    licenseEvidenceSummary: 'Official google-research/frame-interpolation LICENSE identifies Apache-2.0 licensing.',
    readmeEvidenceSummary: 'Official README documents pre-trained TF2 Saved Models in the approved Google Drive folder and uses film_net/Style/saved_model in example interpolation commands.',
    driveEvidenceSummary: resolvedDriveTree
      ? 'Official Google Drive folder resolved publicly and selected only film_net/Style/saved_model files.'
      : 'Official Google Drive folder was not resolved during static/blocking evidence collection.',
    sourceUrls: [FILM_SOURCE_REPO_URL, FILM_PROJECT_PAGE_URL, FILM_README_URL, FILM_LICENSE_URL, FILM_CHECKPOINT_SOURCE_URL],
    codexLicenseDecision,
    humanLicenseApprovalRequired: false,
    blockers,
    warnings,
    resolvedDriveTree,
  }

  const licenseEvidence: FilmLicenseEvidence = {
    collectedAt,
    licenseName: FILM_LICENSE_NAME,
    officialLicenseUrl: FILM_LICENSE_URL,
    sourceRepoUrl: FILM_SOURCE_REPO_URL,
    checkpointSourceUrl: FILM_CHECKPOINT_SOURCE_URL,
    codexLicenseDecision,
    humanLicenseApprovalRequired: false,
    summary: blockers.length === 0
      ? 'Apache-2.0 official repository evidence is clear enough for this bounded private staging download/load phase.'
      : 'License/source evidence is blocked; FILM artifacts must not be downloaded or uploaded.',
    blockers,
    warnings,
  }

  return { sourceEvidence, licenseEvidence }
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.text()
}
