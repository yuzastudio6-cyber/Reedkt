export const modelWeightSecurityPolicy = {
  productionRequiresApprovedManifest: true,
  unknownLicenseBlocksProduction: true,
  nonCommercialBlocksProduction: true,
  missingManifestBlocksProduction: true,
  needsReviewBlocksProduction: true,
  automaticDownloadsAllowed: false,
} as const

export function modelWeightsProductionAllowed(manifestStatuses: string[]): boolean {
  return manifestStatuses.length > 0 && manifestStatuses.every((status) => status === 'approved')
}
