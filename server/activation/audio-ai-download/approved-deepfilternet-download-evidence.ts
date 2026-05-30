import {
  DEEPFILTERNET_DOWNLOAD_GCS_PATH,
  DEEPFILTERNET_LICENSE_NAME,
  DEEPFILTERNET_SELECTED_VERSION,
  DEEPFILTERNET_TOOL_FAMILY,
  DEEPFILTERNET_TOOL_ID,
  selectedDeepFilterNetArtifacts,
} from './deepfilternet-download-policy'
import type { ApprovedDeepFilterNetDownloadEvidence } from './audio-ai-download-types'

export const approvedDeepFilterNetDownloadEvidence: ApprovedDeepFilterNetDownloadEvidence = {
  phase: '36B',
  toolFamily: DEEPFILTERNET_TOOL_FAMILY,
  toolId: DEEPFILTERNET_TOOL_ID,
  selectedVersion: DEEPFILTERNET_SELECTED_VERSION,
  status: 'verified',
  selectedArtifacts: selectedDeepFilterNetArtifacts.map((artifact) => ({ ...artifact })),
  licenseName: DEEPFILTERNET_LICENSE_NAME,
  codexLicenseDecision: 'staging_download_approved_by_codex',
  humanLicenseApprovalRequired: false,
  targetGcsPath: DEEPFILTERNET_DOWNLOAD_GCS_PATH,
  cliSha256: '70775e251eee44c0f2451a1e833326cf8bcbbe304d3e7cd12851e6fce72ef7da',
  modelArchiveSha256: 'c94d91f70911001c946e0fabb4aa9adc37045f45a03b56008cb0c8244cb63616',
  aggregateSha256: 'eab42c424fc818938f1b8591f4110318f86284b520e5244e571c2f3f56f5126b',
  cliSizeBytes: 36417296,
  modelArchiveSizeBytes: 7983136,
  fileCount: 2,
  uploadedObjectCount: 7,
  downloadedAt: '2026-05-30T10:22:31.772Z',
  uploadedAt: '2026-05-30T10:22:37.628Z',
  verifiedAt: '2026-05-30T10:22:45.941Z',
  gcsManifestPath: `${DEEPFILTERNET_DOWNLOAD_GCS_PATH}model_tree_manifest.json`,
  gcsChecksumPath: `${DEEPFILTERNET_DOWNLOAD_GCS_PATH}file_checksums_sha256.txt`,
  gcsSourceEvidencePath: `${DEEPFILTERNET_DOWNLOAD_GCS_PATH}source_evidence.json`,
  gcsLicenseEvidencePath: `${DEEPFILTERNET_DOWNLOAD_GCS_PATH}license_evidence.json`,
  gcsDownloadReportPath: `${DEEPFILTERNET_DOWNLOAD_GCS_PATH}download_report.json`,
  sanitizedLocalTempPath: '/tmp/reeditpro-deepfilternet-artifact-download/v0.5.6',
  uploadedObjects: [
    {
      gcsUri: `${DEEPFILTERNET_DOWNLOAD_GCS_PATH}deep-filter-0.5.6-x86_64-unknown-linux-musl`,
      sizeBytes: 36417296,
      generation: '1780136557243970',
      crc32c: '5BDaVA==',
      md5Hash: 'eDYmLnqVRHaN5g1xAsTezg==',
    },
    {
      gcsUri: `${DEEPFILTERNET_DOWNLOAD_GCS_PATH}DeepFilterNet3_onnx.tar.gz`,
      sizeBytes: 7983136,
      generation: '1780136554812438',
      crc32c: 'srtjEw==',
      md5Hash: '83zSAaV1thaFwAL9kV0Rgw==',
    },
    {
      gcsUri: `${DEEPFILTERNET_DOWNLOAD_GCS_PATH}file_checksums_sha256.txt`,
      sizeBytes: 203,
      generation: '1780136553739422',
      crc32c: 'Y3wJsg==',
      md5Hash: 'RdvtymvL2MF1yZ1f+7I0GA==',
    },
    {
      gcsUri: `${DEEPFILTERNET_DOWNLOAD_GCS_PATH}model_tree_manifest.json`,
      sizeBytes: 2201,
      generation: '1780136553683231',
      crc32c: 'tfAY5Q==',
      md5Hash: 'k1YNs2gU5FELAvVF8VSp2Q==',
    },
    {
      gcsUri: `${DEEPFILTERNET_DOWNLOAD_GCS_PATH}source_evidence.json`,
      sizeBytes: 2598,
      generation: '1780136553738547',
      crc32c: '8gJzgw==',
      md5Hash: 'a4Yf4XDOwAthalgutqnv+g==',
    },
    {
      gcsUri: `${DEEPFILTERNET_DOWNLOAD_GCS_PATH}license_evidence.json`,
      sizeBytes: 973,
      generation: '1780136553716637',
      crc32c: 'eU2tmA==',
      md5Hash: 'r64YTQB3/p/gYulfz+Z5Mg==',
    },
    {
      gcsUri: `${DEEPFILTERNET_DOWNLOAD_GCS_PATH}download_report.json`,
      sizeBytes: 9093,
      generation: '1780136562233676',
      crc32c: 'wfJooQ==',
      md5Hash: 'WaaDuhGHBOQh9T4nNIGCTw==',
    },
  ],
  iamChanges: [
    'none; Phase 36C generated-audio runtime service-account objectViewer access is deferred.',
  ],
  blockers: [],
  warnings: [
    'Phase 36B downloaded selected DeepFilterNet v0.5.6 artifacts only; it did not run DeepFilterNet or process audio/media.',
    'Runtime service-account access is deferred to Phase 36C unless generated-audio runtime verification explicitly approves it.',
  ],
}

export function getApprovedDeepFilterNetDownloadEvidence(): ApprovedDeepFilterNetDownloadEvidence {
  return {
    ...approvedDeepFilterNetDownloadEvidence,
    selectedArtifacts: approvedDeepFilterNetDownloadEvidence.selectedArtifacts.map((artifact) => ({ ...artifact })),
    uploadedObjects: approvedDeepFilterNetDownloadEvidence.uploadedObjects.map((object) => ({ ...object })),
    iamChanges: [...approvedDeepFilterNetDownloadEvidence.iamChanges],
    blockers: [...approvedDeepFilterNetDownloadEvidence.blockers],
    warnings: [...approvedDeepFilterNetDownloadEvidence.warnings],
  }
}
