import { createHash } from 'node:crypto'
import { z } from 'zod'
import {
  CAPTION_APPROVED_FONT_REGISTRY_VERSION,
  CAPTION_FONT_ASSET_RECORD_VERSION,
  CAPTION_FONT_RESOLUTION_VERSION,
  CAPTION_FONT_RUNTIME_QUALIFICATION_VERSION,
  CAPTION_SHAPING_FIXTURE_SET_VERSION,
  CAPTION_UNICODE_SCRIPTS,
  type CaptionApprovedFontRegistry,
  type CaptionFontAssetRecord,
  type CaptionFontResolution,
  type CaptionFontResolutionRequest,
  type CaptionFontRuntimeQualification,
  type CaptionShapingFixture,
  type CaptionShapingFixtureSet,
  type CaptionTextDirection,
  type CaptionUnicodeScript,
} from '../../src/types/caption-font-runtime'
import type { CaptionDomainRef } from '../../src/types/caption-domain-contracts'
import { assertClosedContractTree } from '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from '../orchestra/orchestra-skill-contracts'

function containsControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0
    return codePoint < 32 || codePoint === 127
  })
}

const safeKey = z.string().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const safeLabel = z.string().min(1).max(256)
  .refine((value) => !containsControlCharacter(value))
  .refine((value) => !/(?:https?:\/\/|file:\/\/|gs:\/\/|s3:\/\/|\/Users\/|\/tmp\/|\.\.\/)/iu.test(value))
const languageTag = z.string().min(2).max(64)
  .regex(/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/u)
const refSchema = z.object({ id: safeKey, version: safeKey, contentHash: sha256 }).strict()
const scriptSchema = z.enum(CAPTION_UNICODE_SCRIPTS)
const routeIdSchema = z.enum([
  'fonttools', 'opentype_sanitizer', 'icu_grapheme_bidi',
  'harfbuzz_fribidi', 'libass_multilingual', 'remotion_canvas_text',
])
const useSchema = z.enum([
  'font_metadata', 'font_subsetting', 'malformed_font_rejection',
  'grapheme_segmentation', 'bidi_resolution', 'glyph_shaping',
  'preview_rendering', 'final_rendering',
])

const routeSchema = z.object({
  routeId: routeIdSchema,
  status: z.enum(['qualified_private_internal', 'blocked', 'disabled']),
  version: safeKey.nullable(),
  sourceDigestSha256: sha256.nullable(),
  licenseId: safeKey.nullable(),
  qualifiedUses: z.array(useSchema).max(8),
  evidenceRefs: z.array(refSchema).max(128),
  blockerCodes: z.array(safeKey).max(64),
  noNetworkRuntime: z.literal(true),
  privateInputOutputOnly: z.literal(true),
}).strict()

const qualificationSchema: z.ZodType<CaptionFontRuntimeQualification> = z.object({
  schemaVersion: z.literal(CAPTION_FONT_RUNTIME_QUALIFICATION_VERSION),
  qualificationId: safeKey,
  qualificationDigestSha256: sha256,
  observedAt: z.string().datetime({ offset: true }),
  routes: z.array(routeSchema).length(6),
  previewFinalParityQualified: z.boolean(),
  runtimeFontDownloadAllowed: z.literal(false),
  browserFontIntakeAllowed: z.literal(false),
  wholeRuntimeQualified: z.boolean(),
  productionQualificationClaimed: z.literal(false),
}).strict().superRefine((qualification, context) => {
  const routeIds = new Set(qualification.routes.map((route) => route.routeId))
  if (routeIds.size !== 6) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Font routes must be exact and unique.' })
  }
  for (const routeId of routeIdSchema.options) {
    if (!routeIds.has(routeId)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `Missing font route ${routeId}.` })
    }
  }
  for (const route of qualification.routes) {
    if (route.status === 'qualified_private_internal'
      && (route.version === null || route.sourceDigestSha256 === null
        || route.licenseId === null || route.qualifiedUses.length === 0
        || route.evidenceRefs.length === 0 || route.blockerCodes.length > 0)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `Qualified route ${route.routeId} lacks evidence.` })
    }
    if (route.status !== 'qualified_private_internal'
      && (route.qualifiedUses.length > 0 || route.blockerCodes.length === 0)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `Blocked route ${route.routeId} overclaims readiness.` })
    }
  }
  if (qualification.previewFinalParityQualified) {
    const required = ['harfbuzz_fribidi', 'libass_multilingual', 'remotion_canvas_text']
    if (required.some((routeId) =>
      qualification.routes.find((route) => route.routeId === routeId)?.status
        !== 'qualified_private_internal')) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Preview/final parity lacks qualified renderer routes.' })
    }
  }
  if (qualification.wholeRuntimeQualified
    && (!qualification.previewFinalParityQualified
      || qualification.routes.some((route) => route.status !== 'qualified_private_internal'))) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Whole font runtime qualification is incomplete.' })
  }
})

const fontAssetSchema: z.ZodType<CaptionFontAssetRecord> = z.object({
  schemaVersion: z.literal(CAPTION_FONT_ASSET_RECORD_VERSION),
  fontAssetId: safeKey,
  fontAssetDigestSha256: sha256,
  immutableBinaryRef: refSchema,
  fontBytesSha256: sha256,
  byteLength: z.number().int().min(256).max(64 * 1024 * 1024),
  format: z.enum(['ttf', 'otf', 'ttc']),
  faceIndex: z.number().int().nonnegative().max(1_024),
  names: z.object({
    family: safeLabel,
    subfamily: safeLabel,
    postscriptName: safeLabel,
    version: safeLabel,
  }).strict(),
  license: z.object({
    spdxId: safeKey,
    sourceRef: refSchema,
    reviewRef: refSchema,
    commercialUseApproved: z.boolean(),
    embeddingApproved: z.boolean(),
    redistributionApproved: z.boolean(),
  }).strict(),
  intake: z.object({
    fontToolsStatus: z.enum(['passed', 'blocked']),
    openTypeSanitizerStatus: z.enum(['passed', 'blocked']),
    malformedFontRejected: z.boolean(),
    subsetRoundTripPassed: z.boolean(),
    evidenceRefs: z.array(refSchema).max(128),
  }).strict(),
  coverage: z.object({
    scripts: z.array(scriptSchema).min(1).max(CAPTION_UNICODE_SCRIPTS.length),
    languageTags: z.array(languageTag).min(1).max(256),
    glyphCoverageDigestSha256: sha256,
    missingGlyphPolicy: z.literal('fallback_then_block'),
  }).strict(),
  rendererEvidence: z.object({
    remotionPrivatePassed: z.boolean(),
    libassPrivatePassed: z.boolean(),
    previewFinalMetricParityPassed: z.boolean(),
    parityEvidenceRef: refSchema.nullable(),
  }).strict(),
  admissionStatus: z.enum([
    'approved_private_internal', 'fixture_contract_only', 'blocked_pending_intake',
  ]),
  privateArtifact: z.literal(true),
  browserShareable: z.literal(false),
  runtimeDownloadAllowed: z.literal(false),
  productionApproved: z.literal(false),
}).strict().superRefine((asset, context) => {
  if (asset.immutableBinaryRef.contentHash !== asset.fontBytesSha256) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Font byte lineage is stale.' })
  }
  if (new Set(asset.coverage.scripts).size !== asset.coverage.scripts.length
    || new Set(asset.coverage.languageTags).size !== asset.coverage.languageTags.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Font coverage must be unique.' })
  }
  const intakePassed = asset.intake.fontToolsStatus === 'passed'
    && asset.intake.openTypeSanitizerStatus === 'passed'
    && asset.intake.malformedFontRejected
    && asset.intake.subsetRoundTripPassed
    && asset.intake.evidenceRefs.length > 0
  const parityPassed = asset.rendererEvidence.remotionPrivatePassed
    && asset.rendererEvidence.libassPrivatePassed
    && asset.rendererEvidence.previewFinalMetricParityPassed
    && asset.rendererEvidence.parityEvidenceRef !== null
  if (asset.admissionStatus === 'approved_private_internal'
    && (!intakePassed || !parityPassed
      || !asset.license.commercialUseApproved || !asset.license.embeddingApproved)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Approved font lacks intake, license, or parity evidence.' })
  }
  if (asset.admissionStatus !== 'approved_private_internal'
    && asset.rendererEvidence.previewFinalMetricParityPassed) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Unapproved font cannot claim renderer parity.' })
  }
})

const fallbackChainSchema = z.object({
  chainId: safeKey,
  languagePrefixes: z.array(languageTag).min(1).max(64),
  scripts: z.array(scriptSchema).min(1).max(CAPTION_UNICODE_SCRIPTS.length),
  orderedFontAssetIds: z.array(safeKey).min(1).max(64),
  colorEmojiAllowed: z.boolean(),
}).strict()

const registrySchema: z.ZodType<CaptionApprovedFontRegistry> = z.object({
  schemaVersion: z.literal(CAPTION_APPROVED_FONT_REGISTRY_VERSION),
  registryId: safeKey,
  registryDigestSha256: sha256,
  registryMode: z.enum(['private_internal', 'contract_fixture', 'blocked_empty']),
  qualificationRef: refSchema,
  fontAssets: z.array(fontAssetSchema).max(256),
  fallbackChains: z.array(fallbackChainSchema).max(256),
  customFontGlobalReuseAllowed: z.literal(false),
  localPathResolutionAllowed: z.literal(false),
  runtimeDownloadAllowed: z.literal(false),
  previewFinalParityRequired: z.literal(true),
  productionApproved: z.literal(false),
}).strict()

const captionTextSchema = z.string().min(1).max(4_000)
  .refine((value) => !containsControlCharacter(value))
  .refine((value) => !/[\u202a-\u202e\u2066-\u2069]/u.test(value))

const resolutionRequestSchema: z.ZodType<CaptionFontResolutionRequest> = z.object({
  resolutionId: safeKey,
  registryRef: refSchema,
  languageTag,
  text: captionTextSchema,
  desiredWeight: z.number().int().min(100).max(900),
  desiredStyle: z.enum(['normal', 'italic']),
  requiredRenderers: z.array(z.enum(['remotion', 'libass'])).min(1).max(2),
  allowColorEmoji: z.boolean(),
}).strict()

const resolutionRunSchema = z.object({
  runId: safeKey,
  script: scriptSchema,
  direction: z.enum(['ltr', 'rtl']),
  sourceGraphemeStart: z.number().int().nonnegative(),
  sourceGraphemeEndExclusive: z.number().int().positive(),
  fontAssetRef: refSchema.nullable(),
}).strict()

const resolutionSchema: z.ZodType<CaptionFontResolution> = z.object({
  schemaVersion: z.literal(CAPTION_FONT_RESOLUTION_VERSION),
  resolutionId: safeKey,
  resolutionDigestSha256: sha256,
  registryRef: refSchema,
  qualificationRef: refSchema,
  languageTag,
  textDigestSha256: sha256,
  graphemeCount: z.number().int().positive().max(4_000),
  direction: z.enum(['ltr', 'rtl', 'mixed']),
  runs: z.array(resolutionRunSchema).min(1).max(4_000),
  disposition: z.enum([
    'resolved_private_internal', 'resolved_contract_fixture',
    'blocked_missing_qualified_font', 'blocked_unqualified_runtime',
  ]),
  blockerCodes: z.array(safeKey).max(64),
  missingGraphemeCount: z.number().int().nonnegative().max(4_000),
  missingGraphemeDigestSha256: sha256.nullable(),
  previewFinalParitySatisfied: z.boolean(),
  executionReady: z.boolean(),
  rawTextPersisted: z.literal(false),
  fontBytesIncluded: z.literal(false),
  runtimeDownloadAllowed: z.literal(false),
  executionAuthorityClaimed: z.literal(false),
  productionReady: z.literal(false),
}).strict()

const fixtureSchema: z.ZodType<CaptionShapingFixture> = z.object({
  fixtureId: safeKey,
  languageTag,
  text: captionTextSchema,
  expectedScripts: z.array(scriptSchema).min(1).max(CAPTION_UNICODE_SCRIPTS.length),
  expectedDirection: z.enum(['ltr', 'rtl', 'mixed']),
  requiredFeatures: z.array(z.enum([
    'grapheme_clusters', 'combining_marks', 'ligatures', 'bidi',
    'indic_shaping', 'cjk_glyphs', 'emoji_grapheme',
  ])).min(1).max(7),
}).strict()

const fixtureResultSchema = z.object({
  fixtureId: safeKey,
  textDigestSha256: sha256,
  observedScripts: z.array(scriptSchema).min(1),
  observedDirection: z.enum(['ltr', 'rtl', 'mixed']),
  graphemeCount: z.number().int().positive(),
  segmentationPassed: z.boolean(),
  fontFallbackResolved: z.boolean(),
  actualHarfBuzzShapingExecuted: z.boolean(),
  actualPreviewFinalParityCompared: z.boolean(),
  blockerCodes: z.array(safeKey).max(64),
}).strict()

const fixtureSetSchema: z.ZodType<CaptionShapingFixtureSet> = z.object({
  schemaVersion: z.literal(CAPTION_SHAPING_FIXTURE_SET_VERSION),
  fixtureSetId: safeKey,
  fixtureSetDigestSha256: sha256,
  qualificationRef: refSchema,
  registryRef: refSchema,
  results: z.array(fixtureResultSchema).min(1).max(256),
  requiredFixtureIds: z.array(safeKey).min(1).max(256),
  completeFixtureCoverage: z.boolean(),
  actualShapingQualificationComplete: z.boolean(),
  previewFinalParityQualificationComplete: z.boolean(),
  runtimeDownloadOccurred: z.literal(false),
  productionQualificationClaimed: z.literal(false),
}).strict()

function sha256Text(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function refKey(ref: CaptionDomainRef): string {
  return `${ref.id}:${ref.version}:${ref.contentHash}`
}

function qualificationRef(value: CaptionFontRuntimeQualification): CaptionDomainRef {
  return {
    id: value.qualificationId,
    version: value.schemaVersion,
    contentHash: value.qualificationDigestSha256,
  }
}

function registryRef(value: CaptionApprovedFontRegistry): CaptionDomainRef {
  return {
    id: value.registryId,
    version: value.schemaVersion,
    contentHash: value.registryDigestSha256,
  }
}

function assetRef(value: CaptionFontAssetRecord): CaptionDomainRef {
  return {
    id: value.fontAssetId,
    version: value.schemaVersion,
    contentHash: value.fontAssetDigestSha256,
  }
}

function exactRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return refKey(left) === refKey(right)
}

export function parseCaptionFontRuntimeQualification(
  value: unknown,
): CaptionFontRuntimeQualification {
  assertClosedContractTree(value, 'Caption font runtime qualification')
  const parsed = qualificationSchema.parse(value)
  const digest = calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>,
    'qualificationDigestSha256',
  )
  if (digest !== parsed.qualificationDigestSha256) {
    throw new Error('Caption font qualification digest verification failed.')
  }
  return parsed
}

export function createCaptionFontRuntimeQualification(
  input: Omit<CaptionFontRuntimeQualification, 'qualificationDigestSha256'>,
): CaptionFontRuntimeQualification {
  assertClosedContractTree(input, 'Caption font runtime qualification input')
  return parseCaptionFontRuntimeQualification({
    ...input,
    qualificationDigestSha256: calculateSkillContractDigest(
      { ...input, qualificationDigestSha256: '' },
      'qualificationDigestSha256',
    ),
  })
}

const blockedRoute = (
  routeId: CaptionFontRuntimeQualification['routes'][number]['routeId'],
  blockerCode: string,
): CaptionFontRuntimeQualification['routes'][number] => ({
  routeId,
  status: 'blocked',
  version: null,
  sourceDigestSha256: null,
  licenseId: null,
  qualifiedUses: [],
  evidenceRefs: [],
  blockerCodes: [blockerCode],
  noNetworkRuntime: true,
  privateInputOutputOnly: true,
})

export const CAPTION_FONT_RUNTIME_QUALIFICATION =
  createCaptionFontRuntimeQualification({
    schemaVersion: CAPTION_FONT_RUNTIME_QUALIFICATION_VERSION,
    qualificationId: 'captions.font.runtime.qualification.cap05',
    observedAt: '2026-08-04T00:00:00.000Z',
    routes: [
      blockedRoute('fonttools', 'fonttools_operation_not_released'),
      blockedRoute('opentype_sanitizer', 'ots_runtime_not_released'),
      blockedRoute('icu_grapheme_bidi', 'pinned_icu_runtime_not_qualified'),
      blockedRoute('harfbuzz_fribidi', 'multilingual_shaping_runtime_not_qualified'),
      blockedRoute('libass_multilingual', 'libass_protocol_is_ascii_only'),
      blockedRoute('remotion_canvas_text', 'remotion_font_parity_not_qualified'),
    ],
    previewFinalParityQualified: false,
    runtimeFontDownloadAllowed: false,
    browserFontIntakeAllowed: false,
    wholeRuntimeQualified: false,
    productionQualificationClaimed: false,
  })

export function parseCaptionFontAssetRecord(value: unknown): CaptionFontAssetRecord {
  assertClosedContractTree(value, 'Caption font asset record')
  const parsed = fontAssetSchema.parse(value)
  const digest = calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>,
    'fontAssetDigestSha256',
  )
  if (digest !== parsed.fontAssetDigestSha256) {
    throw new Error('Caption font asset digest verification failed.')
  }
  return parsed
}

export function createCaptionFontAssetRecord(
  input: Omit<CaptionFontAssetRecord, 'fontAssetDigestSha256'>,
): CaptionFontAssetRecord {
  assertClosedContractTree(input, 'Caption font asset record input')
  return parseCaptionFontAssetRecord({
    ...input,
    fontAssetDigestSha256: calculateSkillContractDigest(
      { ...input, fontAssetDigestSha256: '' },
      'fontAssetDigestSha256',
    ),
  })
}

function assertRegistrySemantics(
  registry: CaptionApprovedFontRegistry,
  qualification: CaptionFontRuntimeQualification,
): void {
  if (!exactRef(registry.qualificationRef, qualificationRef(qualification))) {
    throw new Error('Caption font registry qualification lineage is stale.')
  }
  const fonts = new Map(registry.fontAssets.map((asset) => [asset.fontAssetId, asset]))
  if (fonts.size !== registry.fontAssets.length) throw new Error('Duplicate font asset ID.')
  const chains = new Set<string>()
  for (const chain of registry.fallbackChains) {
    if (chains.has(chain.chainId)
      || new Set(chain.orderedFontAssetIds).size !== chain.orderedFontAssetIds.length
      || chain.orderedFontAssetIds.some((fontId) => !fonts.has(fontId))) {
      throw new Error('Caption font fallback chain is invalid.')
    }
    chains.add(chain.chainId)
  }
  if (registry.registryMode === 'blocked_empty'
    && (registry.fontAssets.length !== 0 || registry.fallbackChains.length !== 0)) {
    throw new Error('Blocked font registry must be empty.')
  }
  if (registry.registryMode === 'contract_fixture'
    && (registry.fontAssets.length === 0
      || registry.fontAssets.some((asset) => asset.admissionStatus !== 'fixture_contract_only'))) {
    throw new Error('Contract fixture registry contains a non-fixture font.')
  }
  if (registry.registryMode === 'private_internal') {
    const requiredRoutes = [
      'fonttools', 'opentype_sanitizer', 'icu_grapheme_bidi',
      'harfbuzz_fribidi', 'libass_multilingual', 'remotion_canvas_text',
    ]
    if (!qualification.previewFinalParityQualified
      || registry.fontAssets.length === 0
      || registry.fontAssets.some((asset) => asset.admissionStatus !== 'approved_private_internal')
      || requiredRoutes.some((routeId) =>
        qualification.routes.find((route) => route.routeId === routeId)?.status
          !== 'qualified_private_internal')) {
      throw new Error('Private font registry lacks exact qualification evidence.')
    }
  }
}

export function parseCaptionApprovedFontRegistry(
  value: unknown,
  qualificationValue: unknown,
): CaptionApprovedFontRegistry {
  assertClosedContractTree(value, 'Caption approved font registry')
  const qualification = parseCaptionFontRuntimeQualification(qualificationValue)
  const parsed = registrySchema.parse(value)
  for (const asset of parsed.fontAssets) parseCaptionFontAssetRecord(asset)
  assertRegistrySemantics(parsed, qualification)
  const digest = calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>,
    'registryDigestSha256',
  )
  if (digest !== parsed.registryDigestSha256) {
    throw new Error('Caption font registry digest verification failed.')
  }
  return parsed
}

export function createCaptionApprovedFontRegistry(input: {
  registryId: string
  registryMode: CaptionApprovedFontRegistry['registryMode']
  qualification: unknown
  fontAssets: unknown[]
  fallbackChains: unknown[]
}): CaptionApprovedFontRegistry {
  assertClosedContractTree(input, 'Caption approved font registry input')
  const qualification = parseCaptionFontRuntimeQualification(input.qualification)
  const withoutDigest: Omit<CaptionApprovedFontRegistry, 'registryDigestSha256'> = {
    schemaVersion: CAPTION_APPROVED_FONT_REGISTRY_VERSION,
    registryId: safeKey.parse(input.registryId),
    registryMode: input.registryMode,
    qualificationRef: qualificationRef(qualification),
    fontAssets: input.fontAssets.map(parseCaptionFontAssetRecord),
    fallbackChains: input.fallbackChains.map((chain) => fallbackChainSchema.parse(chain)),
    customFontGlobalReuseAllowed: false,
    localPathResolutionAllowed: false,
    runtimeDownloadAllowed: false,
    previewFinalParityRequired: true,
    productionApproved: false,
  }
  return parseCaptionApprovedFontRegistry({
    ...withoutDigest,
    registryDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, registryDigestSha256: '' },
      'registryDigestSha256',
    ),
  }, qualification)
}

export const CAPTION_APPROVED_FONT_REGISTRY =
  createCaptionApprovedFontRegistry({
    registryId: 'captions.font.registry.cap05.blocked',
    registryMode: 'blocked_empty',
    qualification: CAPTION_FONT_RUNTIME_QUALIFICATION,
    fontAssets: [],
    fallbackChains: [],
  })

const scriptChecks: Array<[CaptionUnicodeScript, RegExp]> = [
  ['arab', /\p{Script=Arabic}/u], ['hebr', /\p{Script=Hebrew}/u],
  ['deva', /\p{Script=Devanagari}/u], ['beng', /\p{Script=Bengali}/u],
  ['guru', /\p{Script=Gurmukhi}/u], ['gujr', /\p{Script=Gujarati}/u],
  ['orya', /\p{Script=Oriya}/u], ['taml', /\p{Script=Tamil}/u],
  ['telu', /\p{Script=Telugu}/u], ['knda', /\p{Script=Kannada}/u],
  ['mlym', /\p{Script=Malayalam}/u], ['thai', /\p{Script=Thai}/u],
  ['laoo', /\p{Script=Lao}/u], ['mymr', /\p{Script=Myanmar}/u],
  ['hang', /\p{Script=Hangul}/u], ['hira', /\p{Script=Hiragana}/u],
  ['kana', /\p{Script=Katakana}/u], ['hani', /\p{Script=Han}/u],
  ['cyrl', /\p{Script=Cyrillic}/u], ['grek', /\p{Script=Greek}/u],
  ['latn', /\p{Script=Latin}/u],
]

export function captionUnicodeScript(grapheme: string): CaptionUnicodeScript {
  if (/\p{Extended_Pictographic}/u.test(grapheme)) return 'emoji'
  for (const [script, pattern] of scriptChecks) {
    if (pattern.test(grapheme)) return script
  }
  return 'common'
}

function scriptDirection(script: CaptionUnicodeScript): 'ltr' | 'rtl' {
  return script === 'arab' || script === 'hebr' ? 'rtl' : 'ltr'
}

function overallDirection(scripts: CaptionUnicodeScript[]): CaptionTextDirection {
  const directions = new Set(scripts
    .filter((script) => script !== 'common' && script !== 'emoji')
    .map(scriptDirection))
  if (directions.size > 1) return 'mixed'
  return directions.has('rtl') ? 'rtl' : 'ltr'
}

function segmentGraphemes(text: string, locale: string): string[] {
  const segmenter = new Intl.Segmenter(locale, { granularity: 'grapheme' })
  return Array.from(segmenter.segment(text), (entry) => entry.segment)
}

function matchingChain(
  registry: CaptionApprovedFontRegistry,
  language: string,
  script: CaptionUnicodeScript,
) {
  const prefix = language.toLowerCase()
  return registry.fallbackChains.find((chain) =>
    chain.scripts.includes(script)
    && chain.languagePrefixes.some((candidate) =>
      prefix === candidate.toLowerCase()
      || prefix.startsWith(`${candidate.toLowerCase()}-`)))
    ?? registry.fallbackChains.find((chain) => chain.scripts.includes(script))
}

function chooseFont(
  registry: CaptionApprovedFontRegistry,
  language: string,
  script: CaptionUnicodeScript,
  allowColorEmoji: boolean,
): CaptionFontAssetRecord | null {
  const chain = matchingChain(registry, language, script)
  if (!chain || (script === 'emoji' && !allowColorEmoji && chain.colorEmojiAllowed)) return null
  for (const fontId of chain.orderedFontAssetIds) {
    const font = registry.fontAssets.find((candidate) => candidate.fontAssetId === fontId)
    if (font?.coverage.scripts.includes(script)
      && font.coverage.languageTags.some((tag) =>
        language.toLowerCase() === tag.toLowerCase()
        || language.toLowerCase().startsWith(`${tag.toLowerCase()}-`))) return font
  }
  return null
}

export function parseCaptionFontResolution(value: unknown): CaptionFontResolution {
  assertClosedContractTree(value, 'Caption font resolution')
  const parsed = resolutionSchema.parse(value)
  let priorEnd = 0
  for (const run of parsed.runs) {
    if (run.sourceGraphemeStart !== priorEnd
      || run.sourceGraphemeEndExclusive <= run.sourceGraphemeStart) {
      throw new Error('Caption font resolution runs are not contiguous.')
    }
    priorEnd = run.sourceGraphemeEndExclusive
  }
  if (priorEnd !== parsed.graphemeCount
    || (parsed.missingGraphemeCount === 0) !== (parsed.missingGraphemeDigestSha256 === null)
    || (parsed.executionReady && parsed.disposition !== 'resolved_private_internal')
    || (parsed.executionReady && !parsed.previewFinalParitySatisfied)
    || (parsed.disposition.startsWith('resolved_') && parsed.blockerCodes.length > 0)
    || (parsed.disposition.startsWith('blocked_') && parsed.blockerCodes.length === 0)) {
    throw new Error('Caption font resolution readiness semantics are invalid.')
  }
  const digest = calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>,
    'resolutionDigestSha256',
  )
  if (digest !== parsed.resolutionDigestSha256) {
    throw new Error('Caption font resolution digest verification failed.')
  }
  return parsed
}

export function resolveCaptionFontPlan(input: {
  request: unknown
  registry: unknown
  qualification: unknown
}): CaptionFontResolution {
  assertClosedContractTree(input, 'Caption font resolution input')
  const qualification = parseCaptionFontRuntimeQualification(input.qualification)
  const registry = parseCaptionApprovedFontRegistry(input.registry, qualification)
  const request = resolutionRequestSchema.parse(input.request)
  if (!exactRef(request.registryRef, registryRef(registry))) {
    throw new Error('Caption font resolution registry lineage is stale.')
  }
  const graphemes = segmentGraphemes(request.text, request.languageTag)
  const scripts = graphemes.map(captionUnicodeScript)
  const fonts = scripts.map((script) =>
    chooseFont(registry, request.languageTag, script, request.allowColorEmoji))
  const missing = graphemes.filter((_, index) => fonts[index] === null)
  const runs: CaptionFontResolution['runs'] = []
  for (let index = 0; index < graphemes.length; index += 1) {
    const font = fonts[index]
    const script = scripts[index]
    const prior = runs.at(-1)
    const currentRef = font ? assetRef(font) : null
    if (prior && prior.script === script && prior.direction === scriptDirection(script)
      && ((prior.fontAssetRef === null && currentRef === null)
        || (prior.fontAssetRef !== null && currentRef !== null
          && exactRef(prior.fontAssetRef, currentRef)))) {
      prior.sourceGraphemeEndExclusive = index + 1
    } else {
      runs.push({
        runId: `${request.resolutionId}.run.${runs.length + 1}`,
        script,
        direction: scriptDirection(script),
        sourceGraphemeStart: index,
        sourceGraphemeEndExclusive: index + 1,
        fontAssetRef: currentRef,
      })
    }
  }
  const requiredRuntimeRoutes = [
    'fonttools', 'opentype_sanitizer', 'icu_grapheme_bidi', 'harfbuzz_fribidi',
    ...(request.requiredRenderers.includes('libass') ? ['libass_multilingual'] : []),
    ...(request.requiredRenderers.includes('remotion') ? ['remotion_canvas_text'] : []),
  ]
  const runtimeReady = requiredRuntimeRoutes.every((routeId) =>
    qualification.routes.find((route) => route.routeId === routeId)?.status
      === 'qualified_private_internal')
  const parity = registry.registryMode === 'private_internal'
    && qualification.previewFinalParityQualified
    && fonts.every((font) => font?.rendererEvidence.previewFinalMetricParityPassed)
  const blockers = missing.length > 0
    ? ['missing_qualified_font_for_grapheme']
    : !runtimeReady && registry.registryMode !== 'contract_fixture'
      ? ['font_runtime_routes_not_qualified']
      : []
  const disposition: CaptionFontResolution['disposition'] = missing.length > 0
    ? 'blocked_missing_qualified_font'
    : registry.registryMode === 'contract_fixture'
      ? 'resolved_contract_fixture'
      : runtimeReady && parity
        ? 'resolved_private_internal'
        : 'blocked_unqualified_runtime'
  const withoutDigest: Omit<CaptionFontResolution, 'resolutionDigestSha256'> = {
    schemaVersion: CAPTION_FONT_RESOLUTION_VERSION,
    resolutionId: request.resolutionId,
    registryRef: registryRef(registry),
    qualificationRef: qualificationRef(qualification),
    languageTag: request.languageTag,
    textDigestSha256: sha256Text(request.text),
    graphemeCount: graphemes.length,
    direction: overallDirection(scripts),
    runs,
    disposition,
    blockerCodes: blockers,
    missingGraphemeCount: missing.length,
    missingGraphemeDigestSha256: missing.length > 0 ? sha256Text(missing.join('')) : null,
    previewFinalParitySatisfied: parity,
    executionReady: disposition === 'resolved_private_internal',
    rawTextPersisted: false,
    fontBytesIncluded: false,
    runtimeDownloadAllowed: false,
    executionAuthorityClaimed: false,
    productionReady: false,
  }
  return parseCaptionFontResolution({
    ...withoutDigest,
    resolutionDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, resolutionDigestSha256: '' },
      'resolutionDigestSha256',
    ),
  })
}

export function parseCaptionShapingFixtureSet(value: unknown): CaptionShapingFixtureSet {
  assertClosedContractTree(value, 'Caption shaping fixture set')
  const parsed = fixtureSetSchema.parse(value)
  if (new Set(parsed.requiredFixtureIds).size !== parsed.requiredFixtureIds.length
    || new Set(parsed.results.map((result) => result.fixtureId)).size !== parsed.results.length
    || parsed.completeFixtureCoverage !== parsed.requiredFixtureIds.every((fixtureId) =>
      parsed.results.some((result) => result.fixtureId === fixtureId
        && result.segmentationPassed && result.fontFallbackResolved))
    || parsed.actualShapingQualificationComplete !== parsed.results.every((result) =>
      result.actualHarfBuzzShapingExecuted && result.blockerCodes.length === 0)
    || parsed.previewFinalParityQualificationComplete !== parsed.results.every((result) =>
      result.actualPreviewFinalParityCompared && result.blockerCodes.length === 0)) {
    throw new Error('Caption shaping fixture coverage semantics are invalid.')
  }
  const digest = calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>,
    'fixtureSetDigestSha256',
  )
  if (digest !== parsed.fixtureSetDigestSha256) {
    throw new Error('Caption shaping fixture digest verification failed.')
  }
  return parsed
}

export function createCaptionShapingFixtureSet(input: {
  fixtureSetId: string
  fixtures: unknown[]
  registry: unknown
  qualification: unknown
}): CaptionShapingFixtureSet {
  assertClosedContractTree(input, 'Caption shaping fixture input')
  const qualification = parseCaptionFontRuntimeQualification(input.qualification)
  const registry = parseCaptionApprovedFontRegistry(input.registry, qualification)
  const fixtures = input.fixtures.map((fixture) => fixtureSchema.parse(fixture))
  if (new Set(fixtures.map((fixture) => fixture.fixtureId)).size !== fixtures.length) {
    throw new Error('Caption shaping fixture IDs must be unique.')
  }
  const results = fixtures.map((fixture) => {
    const graphemes = segmentGraphemes(fixture.text, fixture.languageTag)
    const scripts = Array.from(new Set(graphemes.map(captionUnicodeScript)))
    const direction = overallDirection(scripts)
    const resolution = resolveCaptionFontPlan({
      request: {
        resolutionId: `${input.fixtureSetId}.${fixture.fixtureId}`,
        registryRef: registryRef(registry),
        languageTag: fixture.languageTag,
        text: fixture.text,
        desiredWeight: 700,
        desiredStyle: 'normal',
        requiredRenderers: ['remotion', 'libass'],
        allowColorEmoji: true,
      },
      registry,
      qualification,
    })
    const segmentationPassed = direction === fixture.expectedDirection
      && fixture.expectedScripts.every((script) => scripts.includes(script))
    const fontFallbackResolved = resolution.disposition.startsWith('resolved_')
    const blockerCodes = [
      ...(!segmentationPassed ? ['unicode_segmentation_fixture_failed'] : []),
      ...(!fontFallbackResolved ? ['font_fallback_fixture_failed'] : []),
      'actual_harfbuzz_shaping_not_executed',
      'actual_preview_final_parity_not_compared',
    ]
    return {
      fixtureId: fixture.fixtureId,
      textDigestSha256: sha256Text(fixture.text),
      observedScripts: scripts,
      observedDirection: direction,
      graphemeCount: graphemes.length,
      segmentationPassed,
      fontFallbackResolved,
      actualHarfBuzzShapingExecuted: false,
      actualPreviewFinalParityCompared: false,
      blockerCodes,
    }
  })
  const withoutDigest: Omit<CaptionShapingFixtureSet, 'fixtureSetDigestSha256'> = {
    schemaVersion: CAPTION_SHAPING_FIXTURE_SET_VERSION,
    fixtureSetId: safeKey.parse(input.fixtureSetId),
    qualificationRef: qualificationRef(qualification),
    registryRef: registryRef(registry),
    results,
    requiredFixtureIds: fixtures.map((fixture) => fixture.fixtureId),
    completeFixtureCoverage: results.every((result) =>
      result.segmentationPassed && result.fontFallbackResolved),
    actualShapingQualificationComplete: false,
    previewFinalParityQualificationComplete: false,
    runtimeDownloadOccurred: false,
    productionQualificationClaimed: false,
  }
  return parseCaptionShapingFixtureSet({
    ...withoutDigest,
    fixtureSetDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, fixtureSetDigestSha256: '' },
      'fixtureSetDigestSha256',
    ),
  })
}
