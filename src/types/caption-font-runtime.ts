import type { CaptionDomainRef } from './caption-domain-contracts'

export const CAPTION_FONT_RUNTIME_QUALIFICATION_VERSION =
  'caption-font-runtime-qualification-v1' as const
export const CAPTION_FONT_ASSET_RECORD_VERSION =
  'caption-font-asset-record-v1' as const
export const CAPTION_APPROVED_FONT_REGISTRY_VERSION =
  'caption-approved-font-registry-v1' as const
export const CAPTION_FONT_RESOLUTION_VERSION =
  'caption-font-resolution-v1' as const
export const CAPTION_SHAPING_FIXTURE_SET_VERSION =
  'caption-shaping-fixture-set-v1' as const

export const CAPTION_UNICODE_SCRIPTS = [
  'latn', 'cyrl', 'grek', 'arab', 'hebr', 'deva', 'beng', 'guru',
  'gujr', 'orya', 'taml', 'telu', 'knda', 'mlym', 'thai', 'laoo',
  'mymr', 'hang', 'hani', 'hira', 'kana', 'emoji', 'common',
] as const

export type CaptionUnicodeScript = typeof CAPTION_UNICODE_SCRIPTS[number]
export type CaptionTextDirection = 'ltr' | 'rtl' | 'mixed'

export type CaptionFontRuntimeRouteId =
  | 'fonttools'
  | 'opentype_sanitizer'
  | 'icu_grapheme_bidi'
  | 'harfbuzz_fribidi'
  | 'libass_multilingual'
  | 'remotion_canvas_text'

export interface CaptionFontRuntimeRouteQualification {
  routeId: CaptionFontRuntimeRouteId
  status: 'qualified_private_internal' | 'blocked' | 'disabled'
  version: string | null
  sourceDigestSha256: string | null
  licenseId: string | null
  qualifiedUses: Array<
    | 'font_metadata'
    | 'font_subsetting'
    | 'malformed_font_rejection'
    | 'grapheme_segmentation'
    | 'bidi_resolution'
    | 'glyph_shaping'
    | 'preview_rendering'
    | 'final_rendering'
  >
  evidenceRefs: CaptionDomainRef[]
  blockerCodes: string[]
  noNetworkRuntime: true
  privateInputOutputOnly: true
}

export interface CaptionFontRuntimeQualification {
  schemaVersion: typeof CAPTION_FONT_RUNTIME_QUALIFICATION_VERSION
  qualificationId: string
  qualificationDigestSha256: string
  observedAt: string
  routes: CaptionFontRuntimeRouteQualification[]
  previewFinalParityQualified: boolean
  runtimeFontDownloadAllowed: false
  browserFontIntakeAllowed: false
  wholeRuntimeQualified: boolean
  productionQualificationClaimed: false
}

export interface CaptionFontAssetRecord {
  schemaVersion: typeof CAPTION_FONT_ASSET_RECORD_VERSION
  fontAssetId: string
  fontAssetDigestSha256: string
  immutableBinaryRef: CaptionDomainRef
  fontBytesSha256: string
  byteLength: number
  format: 'ttf' | 'otf' | 'ttc'
  faceIndex: number
  names: {
    family: string
    subfamily: string
    postscriptName: string
    version: string
  }
  license: {
    spdxId: string
    sourceRef: CaptionDomainRef
    reviewRef: CaptionDomainRef
    commercialUseApproved: boolean
    embeddingApproved: boolean
    redistributionApproved: boolean
  }
  intake: {
    fontToolsStatus: 'passed' | 'blocked'
    openTypeSanitizerStatus: 'passed' | 'blocked'
    malformedFontRejected: boolean
    subsetRoundTripPassed: boolean
    evidenceRefs: CaptionDomainRef[]
  }
  coverage: {
    scripts: CaptionUnicodeScript[]
    languageTags: string[]
    glyphCoverageDigestSha256: string
    missingGlyphPolicy: 'fallback_then_block'
  }
  rendererEvidence: {
    remotionPrivatePassed: boolean
    libassPrivatePassed: boolean
    previewFinalMetricParityPassed: boolean
    parityEvidenceRef: CaptionDomainRef | null
  }
  admissionStatus:
    | 'approved_private_internal'
    | 'fixture_contract_only'
    | 'blocked_pending_intake'
  privateArtifact: true
  browserShareable: false
  runtimeDownloadAllowed: false
  productionApproved: false
}

export interface CaptionFontFallbackChain {
  chainId: string
  languagePrefixes: string[]
  scripts: CaptionUnicodeScript[]
  orderedFontAssetIds: string[]
  colorEmojiAllowed: boolean
}

export interface CaptionApprovedFontRegistry {
  schemaVersion: typeof CAPTION_APPROVED_FONT_REGISTRY_VERSION
  registryId: string
  registryDigestSha256: string
  registryMode: 'private_internal' | 'contract_fixture' | 'blocked_empty'
  qualificationRef: CaptionDomainRef
  fontAssets: CaptionFontAssetRecord[]
  fallbackChains: CaptionFontFallbackChain[]
  customFontGlobalReuseAllowed: false
  localPathResolutionAllowed: false
  runtimeDownloadAllowed: false
  previewFinalParityRequired: true
  productionApproved: false
}

export interface CaptionFontResolutionRequest {
  resolutionId: string
  registryRef: CaptionDomainRef
  languageTag: string
  text: string
  desiredWeight: number
  desiredStyle: 'normal' | 'italic'
  requiredRenderers: Array<'remotion' | 'libass'>
  allowColorEmoji: boolean
}

export interface CaptionFontResolutionRun {
  runId: string
  script: CaptionUnicodeScript
  direction: 'ltr' | 'rtl'
  sourceGraphemeStart: number
  sourceGraphemeEndExclusive: number
  fontAssetRef: CaptionDomainRef | null
}

export interface CaptionFontResolution {
  schemaVersion: typeof CAPTION_FONT_RESOLUTION_VERSION
  resolutionId: string
  resolutionDigestSha256: string
  registryRef: CaptionDomainRef
  qualificationRef: CaptionDomainRef
  languageTag: string
  textDigestSha256: string
  graphemeCount: number
  direction: CaptionTextDirection
  runs: CaptionFontResolutionRun[]
  disposition:
    | 'resolved_private_internal'
    | 'resolved_contract_fixture'
    | 'blocked_missing_qualified_font'
    | 'blocked_unqualified_runtime'
  blockerCodes: string[]
  missingGraphemeCount: number
  missingGraphemeDigestSha256: string | null
  previewFinalParitySatisfied: boolean
  executionReady: boolean
  rawTextPersisted: false
  fontBytesIncluded: false
  runtimeDownloadAllowed: false
  executionAuthorityClaimed: false
  productionReady: false
}

export interface CaptionShapingFixture {
  fixtureId: string
  languageTag: string
  text: string
  expectedScripts: CaptionUnicodeScript[]
  expectedDirection: CaptionTextDirection
  requiredFeatures: Array<
    | 'grapheme_clusters'
    | 'combining_marks'
    | 'ligatures'
    | 'bidi'
    | 'indic_shaping'
    | 'cjk_glyphs'
    | 'emoji_grapheme'
  >
}

export interface CaptionShapingFixtureResult {
  fixtureId: string
  textDigestSha256: string
  observedScripts: CaptionUnicodeScript[]
  observedDirection: CaptionTextDirection
  graphemeCount: number
  segmentationPassed: boolean
  fontFallbackResolved: boolean
  actualHarfBuzzShapingExecuted: boolean
  actualPreviewFinalParityCompared: boolean
  blockerCodes: string[]
}

export interface CaptionShapingFixtureSet {
  schemaVersion: typeof CAPTION_SHAPING_FIXTURE_SET_VERSION
  fixtureSetId: string
  fixtureSetDigestSha256: string
  qualificationRef: CaptionDomainRef
  registryRef: CaptionDomainRef
  results: CaptionShapingFixtureResult[]
  requiredFixtureIds: string[]
  completeFixtureCoverage: boolean
  actualShapingQualificationComplete: boolean
  previewFinalParityQualificationComplete: boolean
  runtimeDownloadOccurred: false
  productionQualificationClaimed: false
}
