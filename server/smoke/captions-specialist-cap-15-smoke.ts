import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'

import {
  buildCaptionAccessibleFiles,
  createCaptionLibassPrivateFixtureRequest,
  createCaptionAccessibilityExportBundle,
  formatCaptionFrameTime,
  parseCaptionAccessibilityExportPlan,
  parseCaptionAccessibleArtifactSet,
} from '../captions-specialist/caption-accessibility-export'
import { calculateSkillContractDigest } from '../orchestra/orchestra-skill-contracts'
import { buildAssCaptionText } from '../workers/captions/ass-caption-builder'
import type {
  CaptionDomainCanonicalScope,
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import type { CaptionAccessibilityExportBundle } from
  '../captions-specialist/caption-accessibility-export'
import {
  CAPTION_ACCESSIBILITY_EXPORT_PLAN_VERSION,
  CAPTION_ACCESSIBLE_ARTIFACT_SET_VERSION,
  CAPTION_CANVAS_AWARE_ASS_PROFILE_VERSION,
  CAPTION_EXPORT_PACKAGING_HANDOFF_VERSION,
} from '../../src/types/caption-accessibility-export'
import { CAP_11_SEMANTIC_STYLE_PLAN_FIXTURE } from
  './captions-specialist-cap-11-smoke'
import { CAP_14_SCENE_GROUP_FIXTURE } from
  './captions-specialist-cap-14-smoke'

let assertions = 0
function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
  assertions += 1
}
function expectThrow(action: () => unknown): void {
  assert.throws(action)
  assertions += 1
}
function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
function ref(id: string): CaptionDomainRef {
  return { id, version: `${id}.v1`, contentHash: hash(id) }
}
function redigest<T extends Record<string, unknown>>(value: T, field: keyof T): T {
  value[field] = calculateSkillContractDigest(value, field as string) as T[keyof T]
  return value
}

const sourcePhrases = Object.freeze({
  'phrase.cap11.statement': 'Ideas move through the frame',
  'phrase.cap11.hero.behind': 'MOVE',
  'phrase.cap11.list': 'Keep the main idea visible',
  'phrase.cap11.environment': 'Belongs in the scene',
  'phrase.cap11.anchor': 'Anchored to proof',
  'phrase.cap11.hero.full': 'THE FRAME MOVES',
})

const translations = Object.freeze({
  ja: [
    'アイデアが画面を動く', '動く', '主題を見せ続ける',
    '場面の中にある', '証拠に固定', '画面が動く',
  ],
  ar: [
    'تتحرك الفكرة عبر الإطار', 'تحرك', 'أبق الفكرة واضحة',
    'ينتمي إلى المشهد', 'مثبت بالدليل', 'الإطار يتحرك',
  ],
  hi: [
    'विचार फ़्रेम में चलता है', 'चलो', 'मुख्य विचार साफ़ रखें',
    'दृश्य में मौजूद', 'प्रमाण से जुड़ा', 'फ़्रेम चलता है',
  ],
  fr: [
    'L’idée avance 🎬', 'BOUGE', 'Garde l’idée visible',
    'Présent dans la scène', 'Ancré au récit', 'LE CADRE BOUGE',
  ],
})

function localized(
  language: 'en' | keyof typeof translations,
): Array<{
  phraseId: string
  text: string
  speakerLabel: string
  translationRef: CaptionDomainRef | null
  translationState: 'source_language' | 'approved_private_fixture'
}> {
  const phraseIds = Object.keys(sourcePhrases) as Array<keyof typeof sourcePhrases>
  const values = language === 'en'
    ? Object.values(sourcePhrases) : translations[language]
  return phraseIds.map((phraseId, index) => ({
    phraseId,
    text: values[index]!,
    speakerLabel: language === 'ar' ? 'الراوي' : language === 'ja'
      ? 'ナレーター' : language === 'hi' ? 'वाचक' : 'Narrator',
    translationRef: language === 'en'
      ? null : ref(`translation.cap15.${language}.${phraseId}`),
    translationState: language === 'en'
      ? 'source_language' : 'approved_private_fixture',
  }))
}

function bundleFor(input: {
  suffix: string
  outputId: string
  width: 1_920 | 1_080
  height: 1_080 | 1_920
  ratio: [16, 9] | [9, 16]
  language: 'en' | keyof typeof translations
  direction: 'ltr' | 'rtl' | 'mixed'
  fontAdmission?: 'contract_fixture_only' | 'blocked_canonical_registry'
}): CaptionAccessibilityExportBundle {
  const sourceScope = CAP_14_SCENE_GROUP_FIXTURE.canonicalScope
  const outputScope: CaptionDomainCanonicalScope = {
    ...structuredClone(sourceScope),
    outputId: input.outputId,
  }
  const translated = input.language !== 'en'
  return createCaptionAccessibilityExportBundle({
    planId: `caption.accessibility.plan.cap15.${input.suffix}`,
    artifactSetId: `caption.accessibility.artifacts.cap15.${input.suffix}`,
    handoffId: `caption.accessibility.handoff.cap15.${input.suffix}`,
    sourceSceneGroup: CAP_14_SCENE_GROUP_FIXTURE,
    outputScope,
    confirmedOutputFrame: {
      frameRef: ref(`confirmed.frame.cap15.${input.suffix}`),
      outputId: input.outputId,
      width: input.width,
      height: input.height,
      aspectRatioNumerator: input.ratio[0],
      aspectRatioDenominator: input.ratio[1],
      fpsNumerator: 30,
      fpsDenominator: 1,
    },
    transcriptRef: structuredClone(
      CAP_11_SEMANTIC_STYLE_PLAN_FIXTURE.phraseLineageProjectionRef),
    masterTimingRef: ref('mastertiming.cap15.fixture'),
    sourceLanguageTag: 'en',
    outputLanguageTag: input.language,
    outputDirection: input.direction,
    localizedPhrases: localized(input.language),
    meaningfulSounds: [{
      cueId: `caption.accessibility.sound.cap15.${input.suffix}`,
      sourceEventRef: ref('soundsync.event.cap15.soft-impact'),
      frameRange: { startFrame: 330, endFrameExclusive: 354 },
      description: input.language === 'ja' ? '柔らかな衝撃音'
        : input.language === 'ar' ? 'صوت ارتطام خافت'
          : input.language === 'hi' ? 'हल्की टक्कर की ध्वनि'
            : input.language === 'fr' ? 'impact feutré' : 'soft impact',
      translationRef: translated
        ? ref(`translation.cap15.${input.language}.sound`) : null,
      translationState: translated
        ? 'approved_private_fixture' : 'source_language',
    }],
    fontQualificationRef: ref(`font.qualification.cap15.${input.language}`),
    fontResolutionRef: ref(`font.resolution.cap15.${input.language}`),
    fontAdmission: input.fontAdmission ?? 'contract_fixture_only',
  })
}

export const CAP_15_WIDESCREEN_ACCESSIBILITY_FIXTURE = bundleFor({
  suffix: 'wide.en', outputId: 'output.cap11.widescreen',
  width: 1_920, height: 1_080, ratio: [16, 9], language: 'en', direction: 'ltr',
})
export const CAP_15_VERTICAL_ACCESSIBILITY_FIXTURE = bundleFor({
  suffix: 'vertical.en', outputId: 'output.cap15.vertical',
  width: 1_080, height: 1_920, ratio: [9, 16], language: 'en', direction: 'ltr',
})

export function runCap15Smoke(): void {
  const wide = CAP_15_WIDESCREEN_ACCESSIBILITY_FIXTURE
  const vertical = CAP_15_VERTICAL_ACCESSIBILITY_FIXTURE
  const japanese = bundleFor({
    suffix: 'wide.ja', outputId: 'output.cap15.ja',
    width: 1_920, height: 1_080, ratio: [16, 9], language: 'ja', direction: 'ltr',
  })
  const arabic = bundleFor({
    suffix: 'wide.ar', outputId: 'output.cap15.ar',
    width: 1_920, height: 1_080, ratio: [16, 9], language: 'ar', direction: 'rtl',
  })
  const hindi = bundleFor({
    suffix: 'wide.hi', outputId: 'output.cap15.hi',
    width: 1_920, height: 1_080, ratio: [16, 9], language: 'hi', direction: 'ltr',
  })
  const emoji = bundleFor({
    suffix: 'wide.fr', outputId: 'output.cap15.fr',
    width: 1_920, height: 1_080, ratio: [16, 9], language: 'fr', direction: 'mixed',
  })

  check(wide.plan.schemaVersion === CAPTION_ACCESSIBILITY_EXPORT_PLAN_VERSION
    && wide.artifactSet.schemaVersion === CAPTION_ACCESSIBLE_ARTIFACT_SET_VERSION
    && wide.plan.canvasAwareAssProfileVersion === CAPTION_CANVAS_AWARE_ASS_PROFILE_VERSION
    && wide.artifactSet.packagingHandoff.schemaVersion
      === CAPTION_EXPORT_PACKAGING_HANDOFF_VERSION,
  'CAP-15 contracts must carry explicit, versioned identities.')
  check(wide.plan.cues.filter((cue) => cue.cueKind === 'speech').length === 6
    && wide.plan.cues.filter((cue) => cue.cueKind === 'meaningful_sound').length === 1,
  'The accessible projection must include every stable phrase and meaningful sound.')
  check(wide.plan.cues.filter((cue) => cue.cueKind === 'speech')
    .every((cue) => cue.exactSourceWordIds.length > 0 && cue.sourceNodeId),
  'Every speech cue must preserve exact source-word and scene-node lineage.')
  check(wide.plan.cues.every((cue) => cue.stableReadRange.startFrame
    >= cue.frameRange.startFrame && cue.stableReadRange.endFrameExclusive
      <= cue.frameRange.endFrameExclusive),
  'Every accessible cue must remain inside its StoryTiming range.')
  check(wide.plan.cues.filter((cue) => cue.cueKind === 'speech')
    .every((cue) => cue.speakerLabel === 'Narrator'),
  'Speech cues must preserve an evidence-bound speaker label.')
  check(wide.plan.cues.some((cue) => cue.cueKind === 'meaningful_sound'
    && cue.sourceEventRef !== null && cue.completeText === 'soft impact'),
  'Meaningful sound descriptions must retain exact source-event lineage.')
  check(wide.plan.stableCompleteWordingRetained
    && wide.plan.reducedMotionChangesStableWording === false,
  'Reduced motion must never change stable accessible wording.')
  check(wide.files.map((file) => file.format).join('|') === 'srt|webvtt|ass',
    'SRT, WebVTT, and ASS must be generated in the frozen order.')
  check(wide.files.every((file) => file.byteLength > 0
    && file.contentSha256 === hash(file.text)),
  'Every private accessible file must have exact UTF-8 bytes and SHA-256 lineage.')
  check(wide.files.find((file) => file.format === 'srt')!.text
    .includes('[Narrator] Ideas move through the frame'),
  'SRT must preserve speaker labels and complete wording.')
  check(wide.files.find((file) => file.format === 'webvtt')!.text
    .includes('<v Narrator>Ideas move through the frame'),
  'WebVTT must use its native voice-span form for speaker labels.')
  check(wide.files.find((file) => file.format === 'srt')!.text
    .includes('[soft impact]'),
  'Accessible sidecars must bracket meaningful sound descriptions.')
  check(formatCaptionFrameTime(108_000, 30, 1, 'srt') === '01:00:00,000'
    && formatCaptionFrameTime(31, 30, 1, 'webvtt') === '00:00:01.033',
  'Frame-derived sidecar timecodes must round and roll over deterministically.')
  check(wide.files.find((file) => file.format === 'ass')!.text
    .includes('PlayResX: 1920\nPlayResY: 1080'),
  'Canvas-aware ASS must use the exact confirmed widescreen frame.')
  check(vertical.files.find((file) => file.format === 'ass')!.text
    .includes('PlayResX: 1080\nPlayResY: 1920'),
  'Canvas-aware ASS must use the exact confirmed vertical frame.')
  const wideStatement = wide.plan.cues.find((cue) =>
    cue.phraseId === 'phrase.cap11.statement')!
  const verticalStatement = vertical.plan.cues.find((cue) =>
    cue.phraseId === 'phrase.cap11.statement')!
  check(wideStatement.lines.length === 1 && verticalStatement.lines.length === 2,
    'Each confirmed output must recompose line geometry independently.')
  check(vertical.plan.privateReviewFrame.width === 360
    && vertical.plan.privateReviewFrame.height === 640
    && vertical.plan.privateReviewFrame.finalCustomerCanvasClaimed === false,
  'Vertical review geometry must be an exact one-third private proxy only.')
  const legacyAss = buildAssCaptionText([{
    captionId: 'legacy', startSeconds: 0, endSeconds: 1,
    text: 'Legacy', lines: ['Legacy'], words: [],
    styleHints: { presetId: 'clean_subtitle', placement: 'bottom_safe', emphasisWords: [] },
  }], {
    presetId: 'clean_subtitle', fontFamilyFallback: 'Arial',
    fontSizePolicy: 'legacy', lineHeight: 1.2, maxLines: 2,
    positionPolicy: 'bottom_safe', backgroundPolicy: 'legacy',
    outlinePolicy: 'legacy', shadowPolicy: 'legacy',
    platformSuitability: [], qaNotes: [],
  })
  check(legacyAss.includes('PlayResX: 1080\nPlayResY: 1920'),
    'The legacy fixed-canvas ASS builder must remain byte-behavior compatible.')
  check(wide.plan.libassOperationId === 'tool.libass.render_approved_caption_track.v1'
    && wide.plan.ffmpegOperationId === 'tool.ffmpeg.execute_approved_media_recipe.v1',
  'CAP-15 must reuse the canonical libass and FFmpeg operation identities.')
  const wideRuntimeRequest = createCaptionLibassPrivateFixtureRequest(wide.plan)
  expectThrow(() => createCaptionLibassPrivateFixtureRequest(vertical.plan))
  const verticalFixtureCue = vertical.plan.cues.find((cue) =>
    cue.phraseId === 'phrase.cap11.hero.behind')!
  const verticalRuntimeRequest = createCaptionLibassPrivateFixtureRequest(
    vertical.plan, verticalFixtureCue.cueId,
  )
  check(wideRuntimeRequest.payload.width === 640
    && wideRuntimeRequest.payload.height === 360
    && verticalRuntimeRequest.payload.width === 360
    && verticalRuntimeRequest.payload.height === 640,
  'The bounded libass adapter must derive both exact one-third review canvases.')
  check(wideRuntimeRequest.operationId === wide.plan.libassOperationId
    && wideRuntimeRequest.payload.caption === wideStatement.completeText
    && verticalRuntimeRequest.payload.caption === 'MOVE',
  'The private fixture adapter must retain the canonical operation and an admitted stable cue.')
  check(wide.plan.captionOwnsLibassRuntime === false
    && wide.plan.captionOwnsFfmpegPackaging === false
    && wide.artifactSet.packagingHandoff.operationRegistered === false,
  'Caption must not create a duplicate runtime, packaging, or operation owner.')
  check(wide.artifactSet.artifacts.every((artifact) => artifact.privateArtifact
    && !artifact.textEmbeddedInPublicReceipt && !artifact.localPathIncluded
    && !artifact.signedUrlIncluded && !artifact.persisted && !artifact.qaApproved),
  'Accessible artifact receipts must remain byte-free, private, and unpromoted.')
  check(wide.artifactSet.packagingHandoff.artifactSetLocator.id
    === wide.artifactSet.artifactSetId
    && wide.artifactSet.packagingHandoff.artifactSetLocator.version
      === wide.artifactSet.schemaVersion,
  'The packaging handoff must use a non-circular exact artifact-set locator.')
  check(wide.artifactSet.packagingHandoff.requestedPackaging
    === 'private_ass_fallback_overlay_and_sidecars',
  'The admitted ASCII fixture may request the existing private ASS fallback lane.')
  check([japanese, arabic, hindi, emoji].every((bundle) =>
    bundle.plan.assDisposition === 'blocked_missing_qualified_font_or_shaping'
      && bundle.artifactSet.packagingHandoff.requestedPackaging
        === 'private_sidecars_only'),
  'Unqualified multilingual shaping must fail closed while sidecars remain planned.')
  check(japanese.files.some((file) => file.text.includes('アイデアが画面を動く'))
    && arabic.files.some((file) => file.text.includes('تتحرك الفكرة عبر الإطار'))
    && hindi.files.some((file) => file.text.includes('विचार फ़्रेम में चलता है'))
    && emoji.files.some((file) => file.text.includes('L’idée avance 🎬')),
  'CJK, RTL, Indic, combining-mark, and emoji text must remain Unicode intact.')
  check(arabic.plan.outputDirection === 'rtl'
    && emoji.plan.outputDirection === 'mixed',
  'Localized outputs must preserve their explicit direction policy.')
  check([japanese, arabic, hindi, emoji].every((bundle) =>
    bundle.plan.cues.every((cue) => cue.translationRef !== null
      && cue.translationState === 'approved_private_fixture')),
  'Localized speech and sound descriptions must carry approved translation lineage.')
  check(wide.artifactSet.runtimeExecutionGranted === false
    && wide.artifactSet.assetCreationGranted === false
    && wide.artifactSet.finalQaApprovalGranted === false
    && wide.artifactSet.publicDeliveryGranted === false
    && wide.artifactSet.productionAuthorityGranted === false,
  'Every execution, asset, QA, public, and production authority must stay closed.')

  const stalePlan = structuredClone(wide.plan)
  stalePlan.cues[0]!.completeText = 'stale'
  expectThrow(() => parseCaptionAccessibilityExportPlan(
    stalePlan, CAP_14_SCENE_GROUP_FIXTURE))

  const wrongFrame = structuredClone(wide.plan)
  wrongFrame.confirmedOutputFrame.width = 1_080
  redigest(wrongFrame as unknown as Record<string, unknown>, 'planDigestSha256')
  expectThrow(() => parseCaptionAccessibilityExportPlan(
    wrongFrame, CAP_14_SCENE_GROUP_FIXTURE))

  const missingLineage = structuredClone(wide.plan)
  missingLineage.cues[0]!.exactSourceWordIds = ['word.counterfeit']
  redigest(missingLineage as unknown as Record<string, unknown>, 'planDigestSha256')
  expectThrow(() => parseCaptionAccessibilityExportPlan(
    missingLineage, CAP_14_SCENE_GROUP_FIXTURE))

  const reusedGeometry = structuredClone(vertical.plan)
  reusedGeometry.cues[0]!.lines = [reusedGeometry.cues[0]!.completeText]
  redigest(reusedGeometry as unknown as Record<string, unknown>, 'planDigestSha256')
  expectThrow(() => parseCaptionAccessibilityExportPlan(
    reusedGeometry, CAP_14_SCENE_GROUP_FIXTURE))

  const fakeTranslation = structuredClone(japanese.plan)
  fakeTranslation.cues[0]!.translationRef = null
  redigest(fakeTranslation as unknown as Record<string, unknown>, 'planDigestSha256')
  expectThrow(() => parseCaptionAccessibilityExportPlan(
    fakeTranslation, CAP_14_SCENE_GROUP_FIXTURE))
  expectThrow(() => createCaptionLibassPrivateFixtureRequest(japanese.plan))

  const pendingTranslation = structuredClone(japanese.plan)
  pendingTranslation.cues[0]!.translationState = 'pending_review'
  redigest(pendingTranslation as unknown as Record<string, unknown>, 'planDigestSha256')
  expectThrow(() => parseCaptionAccessibilityExportPlan(
    pendingTranslation, CAP_14_SCENE_GROUP_FIXTURE))

  const counterfeitFont = structuredClone(wide.plan)
  counterfeitFont.cues[0]!.fontResolutionRef = ref('font.resolution.counterfeit')
  redigest(counterfeitFont as unknown as Record<string, unknown>, 'planDigestSha256')
  expectThrow(() => parseCaptionAccessibilityExportPlan(
    counterfeitFont, CAP_14_SCENE_GROUP_FIXTURE))

  const authorityOverclaim = structuredClone(wide.plan)
  authorityOverclaim.runtimeExecutionGranted = true as false
  redigest(authorityOverclaim as unknown as Record<string, unknown>, 'planDigestSha256')
  expectThrow(() => parseCaptionAccessibilityExportPlan(
    authorityOverclaim, CAP_14_SCENE_GROUP_FIXTURE))

  const unsafeAss = structuredClone(wide.plan)
  unsafeAss.cues[0]!.completeText = '{\\pos(1,1)}unsafe'
  unsafeAss.cues[0]!.lines = ['{\\pos(1,1)}unsafe']
  unsafeAss.cues[0]!.graphemeCount = Array.from(new Intl.Segmenter('en', {
    granularity: 'grapheme',
  }).segment(unsafeAss.cues[0]!.completeText)).length
  redigest(unsafeAss as unknown as Record<string, unknown>, 'planDigestSha256')
  expectThrow(() => buildCaptionAccessibleFiles(unsafeAss))

  const staleArtifact = structuredClone(wide.artifactSet)
  staleArtifact.artifacts[0]!.contentSha256 = hash('counterfeit')
  redigest(staleArtifact as unknown as Record<string, unknown>,
    'artifactSetDigestSha256')
  expectThrow(() => parseCaptionAccessibleArtifactSet(
    staleArtifact, wide.plan, wide.files))

  const crossCanvas = structuredClone(wide.artifactSet)
  crossCanvas.artifacts[2]!.canvasRef = vertical.plan.confirmedOutputFrame.frameRef
  redigest(crossCanvas as unknown as Record<string, unknown>,
    'artifactSetDigestSha256')
  expectThrow(() => parseCaptionAccessibleArtifactSet(
    crossCanvas, wide.plan, wide.files))

  const wrongLocator = structuredClone(wide.artifactSet)
  wrongLocator.packagingHandoff.artifactSetLocator.id = 'artifact.counterfeit'
  redigest(wrongLocator.packagingHandoff as unknown as Record<string, unknown>,
    'handoffDigestSha256')
  redigest(wrongLocator as unknown as Record<string, unknown>,
    'artifactSetDigestSha256')
  expectThrow(() => parseCaptionAccessibleArtifactSet(
    wrongLocator, wide.plan, wide.files))

  const cyclic = structuredClone(wide.plan) as unknown as Record<string, unknown>
  cyclic.self = cyclic
  expectThrow(() => parseCaptionAccessibilityExportPlan(
    cyclic, CAP_14_SCENE_GROUP_FIXTURE))

  const inherited = Object.create({ runtimeExecutionGranted: true }) as Record<string, unknown>
  Object.assign(inherited, wide.plan)
  expectThrow(() => parseCaptionAccessibilityExportPlan(
    inherited, CAP_14_SCENE_GROUP_FIXTURE))

  const unknown = { ...structuredClone(wide.plan), unknownField: false }
  expectThrow(() => parseCaptionAccessibilityExportPlan(
    unknown, CAP_14_SCENE_GROUP_FIXTURE))

  console.log(JSON.stringify({
    status: 'passed_with_private_libass_runtime_and_direct_raster_inspection_pending',
    milestone: 'CAP-15',
    assertions,
    planVersion: wide.plan.schemaVersion,
    artifactSetVersion: wide.artifactSet.schemaVersion,
    canvasAwareAssProfileVersion: wide.plan.canvasAwareAssProfileVersion,
    outputProfiles: [
      `${wide.plan.confirmedOutputFrame.width}x${wide.plan.confirmedOutputFrame.height}`,
      `${vertical.plan.confirmedOutputFrame.width}x${vertical.plan.confirmedOutputFrame.height}`,
    ],
    localizedContractFixtures: ['ja', 'ar', 'hi', 'fr-combining-emoji'],
    canonicalLibassOperationId: wide.plan.libassOperationId,
    canonicalFfmpegOperationId: wide.plan.ffmpegOperationId,
    completeTrackRuntimeExecuted: false,
    multilingualRuntimeExecuted: false,
    finalPackagingExecuted: false,
    productionAuthorityPromoted: false,
  }, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCap15Smoke()
}
