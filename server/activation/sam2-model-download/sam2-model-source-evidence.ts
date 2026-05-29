import {
  SAM2_CHECKPOINT_FILE_NAME,
  SAM2_CHECKPOINT_SOURCE_URL,
  SAM2_CONFIG_FILE_NAME,
  SAM2_CONFIG_SOURCE_URL,
  SAM2_LICENSE_NAME,
  SAM2_SOURCE_REPO,
  SAM2_SOURCE_REPO_URL,
} from './sam2-model-download-policy'
import type { Sam2SourceEvidence } from './sam2-model-download-types'

const README_URL = 'https://raw.githubusercontent.com/facebookresearch/sam2/main/README.md'
const LICENSE_URL = 'https://raw.githubusercontent.com/facebookresearch/sam2/main/LICENSE'
const DOWNLOAD_SCRIPT_URL = 'https://raw.githubusercontent.com/facebookresearch/sam2/main/checkpoints/download_ckpts.sh'

export function buildStaticSam2SourceEvidence(): Sam2SourceEvidence {
  return {
    collectedAt: '2026-05-29T13:25:02.408Z',
    sourceRepo: SAM2_SOURCE_REPO,
    sourceRepoUrl: SAM2_SOURCE_REPO_URL,
    checkpointSourceUrl: SAM2_CHECKPOINT_SOURCE_URL,
    configSourceUrl: SAM2_CONFIG_SOURCE_URL,
    licenseName: SAM2_LICENSE_NAME,
    licenseEvidenceSummary: 'Official SAM2 repository README states SAM 2 model checkpoints are licensed under Apache 2.0; LICENSE contains Apache License Version 2.0.',
    modelCardOrReadmeEvidenceSummary: 'Official SAM2 README lists SAM 2.1 improved checkpoints released September 2024 and includes sam2.1_hiera_tiny config/checkpoint links.',
    sourceUrls: [SAM2_SOURCE_REPO_URL, README_URL, LICENSE_URL, DOWNLOAD_SCRIPT_URL, SAM2_CHECKPOINT_SOURCE_URL, SAM2_CONFIG_SOURCE_URL],
    codexLicenseDecision: 'staging_download_approved_by_codex',
    humanLicenseApprovalRequired: false,
    blockers: [],
    warnings: [],
  }
}

export async function collectSam2SourceEvidence(): Promise<Sam2SourceEvidence> {
  const collectedAt = new Date().toISOString()
  const blockers: string[] = []
  const warnings: string[] = []
  const [readme, license, downloadScript, config] = await Promise.all([
    fetchText(README_URL),
    fetchText(LICENSE_URL),
    fetchText(DOWNLOAD_SCRIPT_URL),
    fetchText(SAM2_CONFIG_SOURCE_URL),
  ])

  if (!readme.includes(SAM2_CHECKPOINT_FILE_NAME)) blockers.push('Official SAM2 README does not list sam2.1_hiera_tiny.pt.')
  if (!readme.includes(SAM2_CONFIG_FILE_NAME)) blockers.push('Official SAM2 README does not list sam2.1_hiera_t.yaml.')
  if (!readme.includes(SAM2_CHECKPOINT_SOURCE_URL)) blockers.push('Official SAM2 README does not link the approved checkpoint URL.')
  if (!readme.includes('The SAM 2 model checkpoints') || !readme.includes('Apache 2.0')) blockers.push('Official SAM2 README does not clearly state checkpoint Apache 2.0 licensing.')
  if (!license.includes('Apache License') || !license.includes('Version 2.0')) blockers.push('Official SAM2 LICENSE text is not Apache 2.0.')
  if (!downloadScript.includes('https://dl.fbaipublicfiles.com/segment_anything_2/092824') || !downloadScript.includes(SAM2_CHECKPOINT_FILE_NAME)) {
    blockers.push('Official SAM2 checkpoint download script does not include the approved SAM2.1 tiny base URL and file name.')
  }
  if (!config.includes('sam2.modeling.sam2_base.SAM2Base') || !config.includes('embed_dim: 96')) blockers.push('Official SAM2.1 tiny config does not match expected tiny model config evidence.')
  if (/sam2\.1_hiera_(small|base_plus|large)\.pt/.test(SAM2_CHECKPOINT_SOURCE_URL)) blockers.push('Approved checkpoint URL unexpectedly targets a non-tiny checkpoint.')

  return {
    collectedAt,
    sourceRepo: SAM2_SOURCE_REPO,
    sourceRepoUrl: SAM2_SOURCE_REPO_URL,
    checkpointSourceUrl: SAM2_CHECKPOINT_SOURCE_URL,
    configSourceUrl: SAM2_CONFIG_SOURCE_URL,
    licenseName: SAM2_LICENSE_NAME,
    licenseEvidenceSummary: 'Official SAM2 repository README states SAM 2 model checkpoints are licensed under Apache 2.0; LICENSE contains Apache License Version 2.0.',
    modelCardOrReadmeEvidenceSummary: 'Official SAM2 README lists SAM 2.1 improved checkpoints released September 2024 and includes sam2.1_hiera_tiny config/checkpoint links.',
    sourceUrls: [SAM2_SOURCE_REPO_URL, README_URL, LICENSE_URL, DOWNLOAD_SCRIPT_URL, SAM2_CHECKPOINT_SOURCE_URL, SAM2_CONFIG_SOURCE_URL],
    codexLicenseDecision: 'staging_download_approved_by_codex',
    humanLicenseApprovalRequired: false,
    blockers,
    warnings,
  }
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`)
  return response.text()
}
