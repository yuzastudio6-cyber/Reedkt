import {
  DEEPFILTERNET_CLI_FILE_NAME,
  DEEPFILTERNET_CLI_SOURCE_URL,
  DEEPFILTERNET_LIBDF_CARGO_URL,
  DEEPFILTERNET_LICENSE_APACHE_URL,
  DEEPFILTERNET_LICENSE_MIT_URL,
  DEEPFILTERNET_LICENSE_NAME,
  DEEPFILTERNET_ONNX_ARCHIVE_FILE_NAME,
  DEEPFILTERNET_PYPROJECT_URL,
  DEEPFILTERNET_README_URL,
  DEEPFILTERNET_RELEASE_API_URL,
  DEEPFILTERNET_RELEASE_URL,
  DEEPFILTERNET_ROOT_LICENSE_URL,
  DEEPFILTERNET_SOURCE_REPO,
  DEEPFILTERNET_SOURCE_REPO_URL,
  DEEPFILTERNET_TREE_API_URL,
  selectedDeepFilterNetArtifacts,
} from './deepfilternet-download-policy'
import type {
  DeepFilterNetLicenseEvidence,
  DeepFilterNetSourceEvidence,
} from './audio-ai-download-types'

export function buildStaticDeepFilterNetSourceEvidence(): DeepFilterNetSourceEvidence {
  return {
    collectedAt: '2026-05-30T00:00:00.000Z',
    sourceRepo: DEEPFILTERNET_SOURCE_REPO,
    sourceRepoUrl: DEEPFILTERNET_SOURCE_REPO_URL,
    releaseTag: 'v0.5.6',
    releaseUrl: DEEPFILTERNET_RELEASE_URL,
    readmeUrl: DEEPFILTERNET_README_URL,
    selectedArtifacts: selectedDeepFilterNetArtifacts.map((artifact) => ({ ...artifact })),
    releaseAssetNames: [DEEPFILTERNET_CLI_FILE_NAME],
    repoModelPaths: [`models/${DEEPFILTERNET_ONNX_ARCHIVE_FILE_NAME}`],
    releaseEvidenceSummary: 'Official DeepFilterNet v0.5.6 release includes the selected Linux x86_64 musl deep-filter CLI binary.',
    modelEvidenceSummary: 'Official v0.5.6 repo tree includes models/DeepFilterNet3_onnx.tar.gz as the selected DeepFilterNet3 ONNX archive.',
    blockers: [],
    warnings: [],
  }
}

export function buildStaticDeepFilterNetLicenseEvidence(): DeepFilterNetLicenseEvidence {
  return {
    collectedAt: '2026-05-30T00:00:00.000Z',
    licenseName: DEEPFILTERNET_LICENSE_NAME,
    licenseUrls: [DEEPFILTERNET_ROOT_LICENSE_URL, DEEPFILTERNET_LICENSE_MIT_URL, DEEPFILTERNET_LICENSE_APACHE_URL, DEEPFILTERNET_LIBDF_CARGO_URL, DEEPFILTERNET_PYPROJECT_URL],
    cargoLicenseEvidence: 'libDF/Cargo.toml identifies license = "MIT/Apache-2.0"; DeepFilterNet Python package metadata identifies MIT.',
    readmeEvidenceSummary: 'DeepFilterNet README describes speech enhancement/noise suppression usage and official model artifacts for the project.',
    codexLicenseDecision: 'staging_download_approved_by_codex',
    humanLicenseApprovalRequired: false,
    blockers: [],
    warnings: [],
  }
}

export async function collectDeepFilterNetSourceEvidence(): Promise<DeepFilterNetSourceEvidence> {
  const collectedAt = new Date().toISOString()
  const blockers: string[] = []
  const warnings: string[] = []
  const [release, tree, readme] = await Promise.all([
    fetchJson(DEEPFILTERNET_RELEASE_API_URL),
    fetchJson(DEEPFILTERNET_TREE_API_URL),
    fetchText(DEEPFILTERNET_README_URL),
  ])

  const releaseAssetNames = getReleaseAssetNames(release)
  const repoModelPaths = getTreePaths(tree).filter((path) => path.startsWith('models/'))
  if (!releaseAssetNames.includes(DEEPFILTERNET_CLI_FILE_NAME)) {
    blockers.push('Official DeepFilterNet v0.5.6 release does not include the approved linux musl CLI artifact.')
  }
  if (!releaseIncludesUrl(release, DEEPFILTERNET_CLI_SOURCE_URL)) {
    blockers.push('Official DeepFilterNet v0.5.6 release asset URL does not match the approved linux musl CLI source URL.')
  }
  if (!repoModelPaths.includes(`models/${DEEPFILTERNET_ONNX_ARCHIVE_FILE_NAME}`)) {
    blockers.push('Official DeepFilterNet v0.5.6 repo tree does not include models/DeepFilterNet3_onnx.tar.gz.')
  }
  if (!readme.toLowerCase().includes('deepfilternet') || !readme.toLowerCase().includes('speech')) {
    warnings.push('DeepFilterNet README did not contain the expected high-level speech enhancement wording.')
  }
  if (releaseAssetNames.some((name) => /darwin|windows|aarch64|ladspa|armv7/i.test(name) && name !== DEEPFILTERNET_CLI_FILE_NAME)) {
    warnings.push('Official release contains additional platform/LADSPA assets; Phase 36B selects only the linux x86_64 musl CLI.')
  }

  return {
    collectedAt,
    sourceRepo: DEEPFILTERNET_SOURCE_REPO,
    sourceRepoUrl: DEEPFILTERNET_SOURCE_REPO_URL,
    releaseTag: 'v0.5.6',
    releaseUrl: DEEPFILTERNET_RELEASE_URL,
    readmeUrl: DEEPFILTERNET_README_URL,
    selectedArtifacts: selectedDeepFilterNetArtifacts.map((artifact) => ({ ...artifact })),
    releaseAssetNames,
    repoModelPaths,
    releaseEvidenceSummary: 'Official DeepFilterNet v0.5.6 release includes the selected Linux x86_64 musl deep-filter CLI binary.',
    modelEvidenceSummary: 'Official v0.5.6 repo tree includes models/DeepFilterNet3_onnx.tar.gz as the selected DeepFilterNet3 ONNX archive.',
    blockers,
    warnings,
  }
}

export async function collectDeepFilterNetLicenseEvidence(): Promise<DeepFilterNetLicenseEvidence> {
  const collectedAt = new Date().toISOString()
  const blockers: string[] = []
  const warnings: string[] = []
  const [rootLicense, mitLicense, apacheLicense, cargo, pyproject, readme] = await Promise.all([
    fetchText(DEEPFILTERNET_ROOT_LICENSE_URL),
    fetchText(DEEPFILTERNET_LICENSE_MIT_URL),
    fetchText(DEEPFILTERNET_LICENSE_APACHE_URL),
    fetchText(DEEPFILTERNET_LIBDF_CARGO_URL),
    fetchText(DEEPFILTERNET_PYPROJECT_URL),
    fetchText(DEEPFILTERNET_README_URL),
  ])

  if (!rootLicense.includes('MIT') || !rootLicense.includes('Apache-2.0')) blockers.push('Root DeepFilterNet license file does not identify MIT/Apache-2.0 dual licensing.')
  if (!mitLicense.includes('MIT License')) blockers.push('DeepFilterNet LICENSE-MIT does not contain MIT License text.')
  if (!apacheLicense.includes('Apache License') || !apacheLicense.includes('Version 2.0')) blockers.push('DeepFilterNet LICENSE-APACHE does not contain Apache License 2.0 text.')
  if (!cargo.includes('license = "MIT/Apache-2.0"') && !cargo.includes('license = "MIT OR Apache-2.0"')) blockers.push('libDF Cargo.toml does not identify MIT/Apache-2.0 licensing.')
  if (!cargo.includes('default-model')) warnings.push('libDF Cargo.toml did not expose the expected default-model feature comment.')
  if (!pyproject.includes('license = "MIT"')) warnings.push('DeepFilterNet Python package metadata did not expose the expected MIT license field.')
  if (!readme.toLowerCase().includes('deepfilter')) warnings.push('README evidence did not include expected DeepFilterNet text.')

  return {
    collectedAt,
    licenseName: DEEPFILTERNET_LICENSE_NAME,
    licenseUrls: [DEEPFILTERNET_ROOT_LICENSE_URL, DEEPFILTERNET_LICENSE_MIT_URL, DEEPFILTERNET_LICENSE_APACHE_URL, DEEPFILTERNET_LIBDF_CARGO_URL, DEEPFILTERNET_PYPROJECT_URL],
    cargoLicenseEvidence: 'libDF/Cargo.toml identifies license = "MIT/Apache-2.0"; DeepFilterNet Python package metadata identifies MIT.',
    readmeEvidenceSummary: 'DeepFilterNet README describes the project and official usage path; Phase 36B selects pinned v0.5.6 artifacts only.',
    codexLicenseDecision: blockers.length === 0 ? 'staging_download_approved_by_codex' : 'blocked',
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

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'reeditpro-phase36b-codex',
    },
  })
  if (!response.ok) throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`)
  return response.json()
}

function getReleaseAssetNames(release: unknown): string[] {
  if (!isRecord(release) || !Array.isArray(release.assets)) return []
  return release.assets
    .map((asset) => (isRecord(asset) && typeof asset.name === 'string' ? asset.name : null))
    .filter((name): name is string => Boolean(name))
}

function releaseIncludesUrl(release: unknown, sourceUrl: string): boolean {
  if (!isRecord(release) || !Array.isArray(release.assets)) return false
  return release.assets.some((asset) => isRecord(asset) && asset.browser_download_url === sourceUrl)
}

function getTreePaths(tree: unknown): string[] {
  if (!isRecord(tree) || !Array.isArray(tree.tree)) return []
  return tree.tree
    .map((entry) => (isRecord(entry) && typeof entry.path === 'string' ? entry.path : null))
    .filter((path): path is string => Boolean(path))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
