import type {
  ApprovedToolOperationEvidence,
  ApprovedToolWorkManifestRef,
} from '../../edit-architecture/approved-tool-work-manifest'

export const PRIVATE_PLAYWRIGHT_CAPTURE_TEMPLATE_ID = 'reeditpro_private_capture_card_v1' as const
export const PRIVATE_PLAYWRIGHT_CAPTURE_SOURCE_KIND = 'approved_internal_html_v1' as const

export interface ApprovedPrivateBrowserCaptureTextTokens {
  eyebrow: string
  title: string
  body: string
  callout: string
}

export interface ApprovedPrivateBrowserCaptureSpec {
  sourceKind: typeof PRIVATE_PLAYWRIGHT_CAPTURE_SOURCE_KIND
  templateId: typeof PRIVATE_PLAYWRIGHT_CAPTURE_TEMPLATE_ID
  authorizationConfirmed: true
  viewportWidth: 640
  viewportHeight: 360
  deviceScaleFactor: 1
  textTokens: ApprovedPrivateBrowserCaptureTextTokens
}

export interface PrivatePlaywrightCaptureImageProbe {
  mimeType: 'image/png'
  pngSignatureValid: true
  width: number
  height: number
  sourceSpecSha256: string
  networkRequestCount: 0
}

export interface PrivatePlaywrightCaptureArtifact {
  artifactId: string
  operationId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  storageProvider: 'local_private'
  storageObjectPath: string
  localFilePath: string
  mimeType: 'image/png'
  privateArtifact: true
  publicArtifact: false
  signedUrl: null
  sourceOfTruth: true
  sourceOfTruthScope: 'approved_playwright_private_capture'
  sha256: string
  byteSize: number
  width: number
  height: number
  sourceSpecSha256: string
  networkRequestCount: 0
  rendererLayerIds: string[]
  segmentIds: string[]
  assetPlanItemIds: string[]
  workItemIds: string[]
  reusedExistingArtifact: boolean
  toolWorkManifestRef: ApprovedToolWorkManifestRef
  toolOperationEvidence: ApprovedToolOperationEvidence
  createdAt: string
}
