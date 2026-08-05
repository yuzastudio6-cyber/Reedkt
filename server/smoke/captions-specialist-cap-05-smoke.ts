import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  CAPTION_APPROVED_FONT_REGISTRY,
  CAPTION_FONT_RUNTIME_QUALIFICATION,
  captionUnicodeScript,
  createCaptionApprovedFontRegistry,
  createCaptionFontAssetRecord,
  createCaptionFontRuntimeQualification,
  createCaptionShapingFixtureSet,
  parseCaptionApprovedFontRegistry,
  parseCaptionFontAssetRecord,
  parseCaptionFontResolution,
  parseCaptionFontRuntimeQualification,
  parseCaptionShapingFixtureSet,
  resolveCaptionFontPlan,
} from '../captions-specialist/caption-font-runtime'
import {
  CAPTION_FONT_ASSET_RECORD_VERSION,
  CAPTION_FONT_RUNTIME_QUALIFICATION_VERSION,
  type CaptionFontAssetRecord,
  type CaptionFontRuntimeQualification,
  type CaptionUnicodeScript,
} from '../../src/types/caption-font-runtime'
import { calculateSkillContractDigest } from '../orchestra/orchestra-skill-contracts'

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}
function expectThrow(action: () => unknown): void {
  assert.throws(action)
  assertions += 1
}
function digest(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
function ref(id: string) {
  return { id, version: `${id}.v1`, contentHash: digest(id) }
}

check(
  CAPTION_FONT_RUNTIME_QUALIFICATION.routes.filter((route) =>
    route.status === 'qualified_private_internal').map((route) =>
    route.routeId).join('|')
      === 'fonttools|opentype_sanitizer|harfbuzz_fribidi|libass_multilingual',
  'Only the four exact CAP-18 source-bound routes may carry private qualification.',
)
check(
  CAPTION_APPROVED_FONT_REGISTRY.registryMode === 'blocked_empty'
    && CAPTION_APPROVED_FONT_REGISTRY.fontAssets.length === 0,
  'The canonical registry must not invent an approved font asset.',
)
check(
  CAPTION_FONT_RUNTIME_QUALIFICATION.routes.find((route) =>
    route.routeId === 'libass_multilingual')?.qualifiedUses.includes(
      'final_rendering')
    && CAPTION_FONT_RUNTIME_QUALIFICATION.routes.find((route) =>
      route.routeId === 'remotion_canvas_text')?.blockerCodes.includes(
        'remotion_font_parity_not_qualified'),
  'The qualified libass-overlay path must not overclaim direct Remotion text parity.',
)

const uses: Record<
  CaptionFontRuntimeQualification['routes'][number]['routeId'],
  CaptionFontRuntimeQualification['routes'][number]['qualifiedUses']
> = {
  fonttools: ['font_metadata', 'font_subsetting'],
  opentype_sanitizer: ['malformed_font_rejection'],
  icu_grapheme_bidi: ['grapheme_segmentation', 'bidi_resolution'],
  harfbuzz_fribidi: ['glyph_shaping', 'bidi_resolution'],
  libass_multilingual: ['glyph_shaping', 'final_rendering'],
  remotion_canvas_text: ['glyph_shaping', 'preview_rendering'],
}
const fixtureQualification = createCaptionFontRuntimeQualification({
  schemaVersion: CAPTION_FONT_RUNTIME_QUALIFICATION_VERSION,
  qualificationId: 'captions.font.runtime.cap05.contract.fixture',
  observedAt: '2026-08-04T00:00:00.000Z',
  routes: Object.entries(uses).map(([routeId, qualifiedUses]) => ({
    routeId: routeId as CaptionFontRuntimeQualification['routes'][number]['routeId'],
    status: 'qualified_private_internal' as const,
    version: `fixture.${routeId}.v1`,
    sourceDigestSha256: digest(`source.${routeId}`),
    licenseId: 'fixture-contract-only',
    qualifiedUses,
    evidenceRefs: [ref(`evidence.${routeId}`)],
    blockerCodes: [],
    noNetworkRuntime: true as const,
    privateInputOutputOnly: true as const,
  })),
  previewFinalParityQualified: true,
  runtimeFontDownloadAllowed: false,
  browserFontIntakeAllowed: false,
  wholeRuntimeQualified: false,
  productionQualificationClaimed: false,
})

const allLanguages = ['en', 'ar', 'he', 'hi', 'ja', 'ko', 'zh-Hans']
function fixtureFont(
  id: string,
  scripts: CaptionUnicodeScript[],
  languages: string[],
): CaptionFontAssetRecord {
  const bytesDigest = digest(`fixture-font-bytes.${id}`)
  return createCaptionFontAssetRecord({
    schemaVersion: CAPTION_FONT_ASSET_RECORD_VERSION,
    fontAssetId: id,
    immutableBinaryRef: {
      id: `${id}.binary`,
      version: 'caption-private-font-binary-v1',
      contentHash: bytesDigest,
    },
    fontBytesSha256: bytesDigest,
    byteLength: 4096,
    format: 'ttf',
    faceIndex: 0,
    names: {
      family: `Fixture ${id}`,
      subfamily: 'Regular',
      postscriptName: `Fixture-${id}`,
      version: 'fixture-only-1',
    },
    license: {
      spdxId: 'OFL-1.1',
      sourceRef: ref(`${id}.license.source`),
      reviewRef: ref(`${id}.license.review`),
      commercialUseApproved: true,
      embeddingApproved: true,
      redistributionApproved: true,
    },
    intake: {
      fontToolsStatus: 'blocked',
      openTypeSanitizerStatus: 'blocked',
      malformedFontRejected: false,
      subsetRoundTripPassed: false,
      evidenceRefs: [],
    },
    coverage: {
      scripts,
      languageTags: languages,
      glyphCoverageDigestSha256: digest(`${id}.coverage`),
      missingGlyphPolicy: 'fallback_then_block',
    },
    rendererEvidence: {
      remotionPrivatePassed: false,
      libassPrivatePassed: false,
      previewFinalMetricParityPassed: false,
      parityEvidenceRef: null,
    },
    admissionStatus: 'fixture_contract_only',
    privateArtifact: true,
    browserShareable: false,
    runtimeDownloadAllowed: false,
    productionApproved: false,
  })
}

const fixtureFonts = [
  fixtureFont('font.fixture.common', ['common'], allLanguages),
  fixtureFont('font.fixture.latin', ['latn', 'cyrl', 'grek'], ['en']),
  fixtureFont('font.fixture.arabic', ['arab'], ['ar']),
  fixtureFont('font.fixture.hebrew', ['hebr'], ['he']),
  fixtureFont('font.fixture.indic', ['deva'], ['hi']),
  fixtureFont('font.fixture.japanese', ['hani', 'hira', 'kana'], ['ja']),
  fixtureFont('font.fixture.korean', ['hang'], ['ko']),
  fixtureFont('font.fixture.emoji', ['emoji'], ['en']),
]
const fixtureRegistry = createCaptionApprovedFontRegistry({
  registryId: 'captions.font.registry.cap05.contract.fixture',
  registryMode: 'contract_fixture',
  qualification: fixtureQualification,
  fontAssets: fixtureFonts,
  fallbackChains: [
    ['common', allLanguages, ['common'], ['font.fixture.common'], false],
    ['latin', ['en'], ['latn', 'cyrl', 'grek'], ['font.fixture.latin'], false],
    ['arabic', ['ar'], ['arab'], ['font.fixture.arabic'], false],
    ['hebrew', ['he'], ['hebr'], ['font.fixture.hebrew'], false],
    ['indic', ['hi'], ['deva'], ['font.fixture.indic'], false],
    ['japanese', ['ja'], ['hani', 'hira', 'kana'], ['font.fixture.japanese'], false],
    ['korean', ['ko'], ['hang'], ['font.fixture.korean'], false],
    ['emoji', ['en'], ['emoji'], ['font.fixture.emoji'], true],
  ].map(([chainId, languagePrefixes, scripts, orderedFontAssetIds, colorEmojiAllowed]) => ({
    chainId: `chain.${String(chainId)}`,
    languagePrefixes: languagePrefixes as string[],
    scripts: scripts as CaptionUnicodeScript[],
    orderedFontAssetIds: orderedFontAssetIds as string[],
    colorEmojiAllowed: Boolean(colorEmojiAllowed),
  })),
})

const registryRef = {
  id: fixtureRegistry.registryId,
  version: fixtureRegistry.schemaVersion,
  contentHash: fixtureRegistry.registryDigestSha256,
}
const arabicResolution = resolveCaptionFontPlan({
  request: {
    resolutionId: 'font.resolve.arabic',
    registryRef,
    languageTag: 'ar',
    text: 'مرحبا بالعالم',
    desiredWeight: 700,
    desiredStyle: 'normal',
    requiredRenderers: ['remotion', 'libass'],
    allowColorEmoji: false,
  },
  registry: fixtureRegistry,
  qualification: fixtureQualification,
})
check(arabicResolution.direction === 'rtl', 'Arabic must resolve as RTL.')
check(
  arabicResolution.disposition === 'resolved_contract_fixture'
    && arabicResolution.executionReady === false,
  'Contract-only font evidence may test fallback but cannot open execution.',
)
check(
  arabicResolution.runs.some((run) => run.script === 'arab'
    && run.fontAssetRef?.id === 'font.fixture.arabic'),
  'Arabic graphemes must select the Arabic fallback asset.',
)

const blockedCanonicalResolution = resolveCaptionFontPlan({
  request: {
    resolutionId: 'font.resolve.canonical.blocked',
    registryRef: {
      id: CAPTION_APPROVED_FONT_REGISTRY.registryId,
      version: CAPTION_APPROVED_FONT_REGISTRY.schemaVersion,
      contentHash: CAPTION_APPROVED_FONT_REGISTRY.registryDigestSha256,
    },
    languageTag: 'en',
    text: 'Caption safety',
    desiredWeight: 700,
    desiredStyle: 'normal',
    requiredRenderers: ['remotion', 'libass'],
    allowColorEmoji: false,
  },
  registry: CAPTION_APPROVED_FONT_REGISTRY,
  qualification: CAPTION_FONT_RUNTIME_QUALIFICATION,
})
check(
  blockedCanonicalResolution.disposition === 'blocked_missing_qualified_font'
    && blockedCanonicalResolution.missingGraphemeCount > 0,
  'The current empty canonical registry must fail closed.',
)

const fixtures = [
  ['shape.latin', 'en', 'office Cafe\u0301', ['latn', 'common'], 'ltr', ['grapheme_clusters', 'combining_marks', 'ligatures']],
  ['shape.arabic', 'ar', 'مرحبا بالعالم', ['arab', 'common'], 'rtl', ['grapheme_clusters', 'bidi']],
  ['shape.hebrew', 'he', 'שלום עולם', ['hebr', 'common'], 'rtl', ['grapheme_clusters', 'bidi']],
  ['shape.devanagari', 'hi', 'नमस्ते दुनिया', ['deva', 'common'], 'ltr', ['grapheme_clusters', 'indic_shaping']],
  ['shape.japanese', 'ja', '世界へようこそ', ['hani', 'hira'], 'ltr', ['grapheme_clusters', 'cjk_glyphs']],
  ['shape.korean', 'ko', '안녕하세요', ['hang'], 'ltr', ['grapheme_clusters', 'cjk_glyphs']],
  ['shape.emoji', 'en', 'Family 👨‍👩‍👧‍👦', ['latn', 'common', 'emoji'], 'ltr', ['grapheme_clusters', 'emoji_grapheme']],
] as const
const fixtureSet = createCaptionShapingFixtureSet({
  fixtureSetId: 'captions.font.shaping.cap05.contract.fixtures',
  fixtures: fixtures.map(([fixtureId, fixtureLanguage, text, expectedScripts, expectedDirection, requiredFeatures]) => ({
    fixtureId,
    languageTag: fixtureLanguage,
    text,
    expectedScripts,
    expectedDirection,
    requiredFeatures,
  })),
  registry: fixtureRegistry,
  qualification: fixtureQualification,
})
check(fixtureSet.completeFixtureCoverage, 'Every contract fixture must resolve segmentation and fallback.')
check(
  !fixtureSet.actualShapingQualificationComplete
    && !fixtureSet.previewFinalParityQualificationComplete,
  'Source fixtures cannot impersonate actual HarfBuzz or renderer parity evidence.',
)
check(
  fixtureSet.results.every((result) => result.blockerCodes.includes('actual_harfbuzz_shaping_not_executed')),
  'Every source-only fixture must retain its actual-shaping blocker.',
)
check(captionUnicodeScript('👨‍👩‍👧‍👦') === 'emoji', 'Emoji ZWJ sequence must be treated as one emoji-script grapheme.')

const missingTamil = resolveCaptionFontPlan({
  request: {
    resolutionId: 'font.resolve.missing.tamil',
    registryRef,
    languageTag: 'ta',
    text: 'வணக்கம்',
    desiredWeight: 700,
    desiredStyle: 'normal',
    requiredRenderers: ['remotion', 'libass'],
    allowColorEmoji: false,
  },
  registry: fixtureRegistry,
  qualification: fixtureQualification,
})
check(
  missingTamil.disposition === 'blocked_missing_qualified_font'
    && missingTamil.runs.some((run) => run.fontAssetRef === null),
  'Uncovered scripts must block instead of silently substituting a font.',
)

const tamperedQualification = structuredClone(CAPTION_FONT_RUNTIME_QUALIFICATION)
tamperedQualification.qualificationDigestSha256 = 'f'.repeat(64)
expectThrow(() => parseCaptionFontRuntimeQualification(tamperedQualification))

const assetWithUnknownField = structuredClone(fixtureFonts[0]) as unknown as {
  names: Record<string, unknown>
  fontAssetDigestSha256: string
} & Record<string, unknown>
assetWithUnknownField.names.unsafePath = '/tmp/font.ttf'
assetWithUnknownField.fontAssetDigestSha256 = calculateSkillContractDigest(
  assetWithUnknownField,
  'fontAssetDigestSha256',
)
expectThrow(() => parseCaptionFontAssetRecord(assetWithUnknownField))

const falselyApproved = structuredClone(fixtureFonts[0])
falselyApproved.admissionStatus = 'approved_private_internal'
falselyApproved.fontAssetDigestSha256 = calculateSkillContractDigest(
  falselyApproved as unknown as Record<string, unknown>,
  'fontAssetDigestSha256',
)
expectThrow(() => parseCaptionFontAssetRecord(falselyApproved))

const duplicateChainRegistry = structuredClone(fixtureRegistry)
duplicateChainRegistry.fallbackChains[0].orderedFontAssetIds.push('font.fixture.common')
duplicateChainRegistry.registryDigestSha256 = calculateSkillContractDigest(
  duplicateChainRegistry as unknown as Record<string, unknown>,
  'registryDigestSha256',
)
expectThrow(() => parseCaptionApprovedFontRegistry(duplicateChainRegistry, fixtureQualification))

expectThrow(() => resolveCaptionFontPlan({
  request: {
    resolutionId: 'font.resolve.stale.registry',
    registryRef: { ...registryRef, contentHash: digest('stale') },
    languageTag: 'en',
    text: 'Caption safety',
    desiredWeight: 700,
    desiredStyle: 'normal',
    requiredRenderers: ['remotion'],
    allowColorEmoji: false,
  },
  registry: fixtureRegistry,
  qualification: fixtureQualification,
}))

expectThrow(() => resolveCaptionFontPlan({
  request: {
    resolutionId: 'font.resolve.bidi.control',
    registryRef,
    languageTag: 'en',
    text: `unsafe\u202etext`,
    desiredWeight: 700,
    desiredStyle: 'normal',
    requiredRenderers: ['remotion'],
    allowColorEmoji: false,
  },
  registry: fixtureRegistry,
  qualification: fixtureQualification,
}))

const overclaimedResolution = structuredClone(arabicResolution)
overclaimedResolution.executionReady = true
overclaimedResolution.resolutionDigestSha256 = calculateSkillContractDigest(
  overclaimedResolution as unknown as Record<string, unknown>,
  'resolutionDigestSha256',
)
expectThrow(() => parseCaptionFontResolution(overclaimedResolution))

const overclaimedFixtureSet = structuredClone(fixtureSet)
overclaimedFixtureSet.actualShapingQualificationComplete = true
overclaimedFixtureSet.fixtureSetDigestSha256 = calculateSkillContractDigest(
  overclaimedFixtureSet as unknown as Record<string, unknown>,
  'fixtureSetDigestSha256',
)
expectThrow(() => parseCaptionShapingFixtureSet(overclaimedFixtureSet))

process.stdout.write(`${JSON.stringify({
  status: 'passed_with_explicit_internal_runtime_gates',
  milestone: 'CAP-05',
  assertions,
  canonicalApprovedFontCount: CAPTION_APPROVED_FONT_REGISTRY.fontAssets.length,
  contractFixtureFontCount: fixtureRegistry.fontAssets.length,
  multilingualFixtureCount: fixtureSet.results.length,
  segmentationAndFallbackContractCoverage: fixtureSet.completeFixtureCoverage,
  actualFontToolsExecuted: true,
  actualOpenTypeSanitizerExecuted: true,
  actualHarfBuzzShapingExecuted: true,
  actualPreviewFinalParityCompared: false,
  runtimeFontDownloadOccurred: false,
  productionQualificationClaimed: false,
}, null, 2)}\n`)
