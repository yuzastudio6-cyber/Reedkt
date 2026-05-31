import { proColorImageApprovalPolicy } from './pro-color-image-approval-policy'
import type { ProColorImageLicenseReview } from './pro-color-image-approval-types'

export const proColorImageLicenseReviews: ProColorImageLicenseReview[] = [
  {
    toolId: 'opencolorio',
    licenseIdentified: true,
    licenseName: 'BSD-3-Clause',
    officialLicenseUrl: proColorImageApprovalPolicy.openColorIOLicenseUrl,
    commercialUseAllowed: true,
    redistributionAllowed: true,
    runtimeUseAllowed: true,
    requiresHumanLegalReview: false,
    codexDecision: 'staging_planning_approved',
    decisionReason: 'Official OpenColorIO ASWF source/license evidence identifies a permissive BSD-3-Clause license. Phase 40A approves planning only; install/runtime/media execution remains blocked.',
  },
  {
    toolId: 'openimageio',
    licenseIdentified: true,
    licenseName: 'Apache-2.0',
    officialLicenseUrl: proColorImageApprovalPolicy.openImageIOLicenseUrl,
    commercialUseAllowed: true,
    redistributionAllowed: true,
    runtimeUseAllowed: true,
    requiresHumanLegalReview: false,
    codexDecision: 'staging_planning_approved',
    decisionReason: 'Official OpenImageIO ASWF source/license evidence identifies Apache-2.0 licensing for original code. Phase 40A approves planning only; install/runtime/media execution remains blocked.',
  },
  {
    toolId: 'kornia',
    licenseIdentified: true,
    licenseName: 'Apache-2.0',
    officialLicenseUrl: proColorImageApprovalPolicy.korniaLicenseUrl,
    commercialUseAllowed: true,
    redistributionAllowed: true,
    runtimeUseAllowed: true,
    requiresHumanLegalReview: false,
    codexDecision: 'staging_planning_approved',
    decisionReason: 'Official Kornia source/license evidence identifies Apache-2.0 licensing. Phase 40A approves generated-fixture planning only; model/provider-style features and runtime execution remain blocked.',
  },
]
