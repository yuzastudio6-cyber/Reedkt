import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { VLM_MODEL_DOWNLOAD_EXPECTED_ARTIFACTS } from './vlm-model-download-blocker-policy'
import { buildVlmChecksumText } from './vlm-model-checksum-manifest'
import type {
  VlmAssetSelectionManifest,
  VlmChecksumManifest,
  VlmCostRiskUpdate,
  VlmExactRevisionManifest,
  VlmLicenseEvidence,
  VlmModelDownloadReport,
  VlmModelTreeManifest,
  VlmPrivateGcsUploadReport,
  VlmRuntimeHandoffManifest,
  VlmSourceEvidence,
} from './vlm-model-download-types'

export interface VlmModelDownloadArtifactMapInput {
  modelDownloadPlan: unknown
  exactRevisionManifest: VlmExactRevisionManifest
  sourceEvidence: VlmSourceEvidence
  licenseEvidence: VlmLicenseEvidence
  assetSelectionManifest: VlmAssetSelectionManifest
  downloadCommandPlan: unknown
  checksumManifest: VlmChecksumManifest
  modelTreeManifest: VlmModelTreeManifest
  privateGcsUploadReport: VlmPrivateGcsUploadReport
  runtimeHandoffManifest: VlmRuntimeHandoffManifest
  costRiskUpdate: VlmCostRiskUpdate
  blockerReport: unknown
  phaseReport: VlmModelDownloadReport
}

export function buildVlmModelDownloadArtifactMap(input: VlmModelDownloadArtifactMapInput): Record<typeof VLM_MODEL_DOWNLOAD_EXPECTED_ARTIFACTS[number], string> {
  const jsonByName: Record<Exclude<typeof VLM_MODEL_DOWNLOAD_EXPECTED_ARTIFACTS[number], 'phase_39b_vlm_file_checksums_sha256.txt'>, unknown> = {
    'phase_39b_vlm_model_download_plan.json': input.modelDownloadPlan,
    'phase_39b_vlm_exact_revision_manifest.json': input.exactRevisionManifest,
    'phase_39b_vlm_source_evidence.json': input.sourceEvidence,
    'phase_39b_vlm_license_evidence.json': input.licenseEvidence,
    'phase_39b_vlm_asset_selection_manifest.json': input.assetSelectionManifest,
    'phase_39b_vlm_download_command_plan.json': input.downloadCommandPlan,
    'phase_39b_vlm_checksum_manifest.json': input.checksumManifest,
    'phase_39b_vlm_model_tree_manifest.json': input.modelTreeManifest,
    'phase_39b_vlm_private_gcs_upload_report.json': input.privateGcsUploadReport,
    'phase_39b_vlm_runtime_handoff_manifest.json': input.runtimeHandoffManifest,
    'phase_39b_vlm_cost_risk_update.json': input.costRiskUpdate,
    'phase_39b_vlm_blocker_report.json': input.blockerReport,
    'phase_39b_vlm_model_download_report.json': input.phaseReport,
  }
  const content = Object.fromEntries(
    Object.entries(jsonByName).map(([artifactName, value]) => [artifactName, `${JSON.stringify(value, null, 2)}\n`]),
  ) as Record<typeof VLM_MODEL_DOWNLOAD_EXPECTED_ARTIFACTS[number], string>
  content['phase_39b_vlm_file_checksums_sha256.txt'] = buildVlmChecksumText(input.checksumManifest.entries)
  return content
}

export async function writeVlmModelDownloadArtifacts(reportDir: string, artifactMap: Record<typeof VLM_MODEL_DOWNLOAD_EXPECTED_ARTIFACTS[number], string>): Promise<string[]> {
  await mkdir(reportDir, { recursive: true })
  const written: string[] = []
  for (const artifactName of VLM_MODEL_DOWNLOAD_EXPECTED_ARTIFACTS) {
    const target = path.join(reportDir, artifactName)
    await writeFile(target, artifactMap[artifactName], 'utf8')
    written.push(target)
  }
  return written
}

export async function copyVlmModelDownloadSafeArtifacts(input: {
  fromReportDir: string
  toArtifactDir: string
}): Promise<string[]> {
  await mkdir(input.toArtifactDir, { recursive: true })
  const copied: string[] = []
  for (const artifactName of VLM_MODEL_DOWNLOAD_EXPECTED_ARTIFACTS) {
    const source = path.join(input.fromReportDir, artifactName)
    const target = path.join(input.toArtifactDir, artifactName)
    await copyFile(source, target)
    copied.push(target)
  }
  return copied
}
