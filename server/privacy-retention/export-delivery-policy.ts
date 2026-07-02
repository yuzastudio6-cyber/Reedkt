import type { ExportDeliveryPolicy } from './privacy-retention-types'

export const exportDeliveryPolicy: ExportDeliveryPolicy = {
  finalExportsPrivateByDefault: true,
  temporarySignedUrlsOnly: true,
  persistSignedUrlAsSourceOfTruth: false,
  deliveryShareRequiresFutureApproval: true,
}

export function finalExportPublicDeliveryAllowed(): false {
  return false
}
