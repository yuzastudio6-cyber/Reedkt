import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'

import {
  CAPTION_PRIVATE_QUALIFICATION_CATALOG,
  createCaptionPrivateMultilingualInspectionReceipt,
  createCaptionPrivateVisualInspectionReceipt,
  createCaptionPrivateQualificationReport,
  parseCaptionPrivateQualificationFixtureResult,
  parseCaptionPrivateQualificationReport,
  parseCaptionPrivateMultilingualInspectionReceipt,
  parseCaptionPrivateVisualInspectionReceipt,
} from '../captions-specialist/caption-private-qualification'
import { CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT } from
  '../captions-specialist/captions-specialist-qualification'
import {
  calculateSkillContractDigest,
} from '../orchestra/orchestra-skill-contracts'
import {
  CAPTION_PRIVATE_QUALIFICATION_FIXTURE_IDS,
  type CaptionPrivateMediaEvidence,
  type CaptionPrivateQualificationDisposition,
  type CaptionPrivateQualificationFixtureId,
  type CaptionPrivateQualificationFixtureResult,
} from '../../src/types/caption-private-qualification'
import type { CaptionDomainRef } from '../../src/types/caption-domain-contracts'
import { CAPTIONS_SUPPORTED_JOB_TYPES } from '../../src/types/captions-specialist'
import {
  CAP_16_WIDESCREEN_INSPECTION_RECEIPT_FIXTURE,
} from './captions-specialist-cap-16-smoke'
import {
  validateOfflineLibassCaptionRequest,
} from '../tool-execution/libass-caption-execution'

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
function ref(id: string, version: string, contentHash = hash(id)):
CaptionDomainRef {
  return { id, version, contentHash }
}
function redigest<T extends Record<string, unknown>>(
  value: T,
  field: keyof T,
): T {
  value[field] = calculateSkillContractDigest(
    value, field as string,
  ) as T[keyof T]
  return value
}

const cap14FullMotionSha256 =
  '9f703008b429a60c31d7139d364b128312c7c297a5314600fb739ab9d9b039f5'
const cap14ReducedMotionSha256 =
  'f201ec3683dc068534743e4ed86089697b2511c9394619668cb39a37aabb914f'
const inspectedFrameNumbers = [0, 29, 89, 149, 209, 269, 329, 359]
const inspectionReceiptRef = ref(
  CAP_16_WIDESCREEN_INSPECTION_RECEIPT_FIXTURE.receiptId,
  CAP_16_WIDESCREEN_INSPECTION_RECEIPT_FIXTURE.schemaVersion,
  CAP_16_WIDESCREEN_INSPECTION_RECEIPT_FIXTURE.receiptDigestSha256,
)

const sourceOutputFrameHashes = {
  'caption-cap18-output-wide': [
    'a31e2a3e1e5fbe879851a74ecfa600ea8b19930ec5d387a0090ecf855228db79',
    '110617a57ed9a59c896270e403b684399e47377b6f0b61a05377ff15e9e95989',
    '8c4ab9714c565dee76deffa863fb50b5e5a16eb16976ceaccbd0ca348404a1c1',
    '3266505079918caa244c96a8ce6dfaf5bd73e930908fc19fa85d62ef5aa85900',
    '4ad38fc864a0acf720f9655cf6b541b5840c813d2944405917a1daf930a263f6',
  ],
  'caption-cap18-output-vertical': [
    '7be9e395c414963825ea0d47c7063b39cb8b1e5f740e2197e35d6a68a3461838',
    'aca201a25f32a69aabe707c4fa88348a66e14ebceab281805b490798b37bec04',
    '7e03db2c0b90b7b981555007fecbd0945b2cab3836c3a1a8bae450c82568178b',
    '29e34aba57077ff8b5b2b14598898110dcdff3d1fbdf7433cfe90b4d25430385',
    '5ea0e866df5a415e50375d9034a69a481e91d2cf9683e8dfe82f46c11097e5d6',
  ],
  'caption-cap18-output-square': [
    'ca18dcb4c16c18b1de77de7039de016b4b230106b10e87a9f9c5ba69e4378006',
    'a6b50c7bbd85e28f3da5c43269170fcb82b9252be9b721b4876194a2a8e3ce1f',
    '69951efbd9eeffb693a1985cd56583ade6ed8daea7bdaf19c54de9c88a42b2fb',
    '64c2f629fa28e2f5bbe4c887e9e6274f599378150fb6b67286d6db29f6e9522a',
    '77991840fd5f5ac04fcacd5a6dcae0a4dd7fcbdeda5b4cd03cfec0bda55e5abe',
  ],
} as const
const creativeFrameHashes = [
  '9386add1b0364e0372676fad4d16fa9649a5e187afc36a07bcf975d89002e02c',
  '06a04c14b7e9e2d80866de83db2bc3934a1e35e7ee3a6435c98d7aea713dd649',
  'd586e0becf66f17ed47d6f88793be66bcb5b5594d5edd6610144ca4ee33696de',
  'ef7ae4a0af6643c07fc2f896ca9a298b86f3380b819b03152c7a545fee675e18',
  '0e511006506d88aa87c351d3b48da9df13da92db9cb2efb03004528576ca9283',
  'b948428c2f9d0c46f2f46d190b9c281882b7bb5811c815bf04f3c0269a8df0e6',
  'd37ea1bf7ae49f783bdc570d6020f219ce91ad968993c0bed89ece602e6912ea',
  'da8b1f0cdfc276f894acf4ef4204e148ac0a04ebdbf8e1e350abb34a5a44412b',
] as const
const sourceFrames = [0, 23, 47, 71, 95]
const creativeFrames = [0, 29, 89, 149, 209, 269, 329, 359]

function inspectedFrames(
  frames: readonly number[],
  hashes: readonly string[],
  creative = false,
) {
  return frames.map((frameNumber, index) => ({
    frameNumber,
    rasterSha256: hashes[index]!,
    actualRasterOpenedAndInspected: true as const,
    disposition: 'passed' as const,
    findingCodes: creative
      ? [
        'creative_hierarchy_readable_no_collision',
        ...(frameNumber === 269
          ? ['repaired_anchor_frame_remains_accepted'] : []),
      ]
      : [
        'caption_readable_safe_canvas_no_clipping',
        'controlled_motion_background_not_representative',
      ],
  }))
}

export const CAP_18_PRIVATE_VISUAL_INSPECTION_RECEIPT_FIXTURE =
createCaptionPrivateVisualInspectionReceipt({
  receiptId: 'caption.private.visual.inspection.cap18',
  observedAt: '2026-08-04T23:30:00.000Z',
  sourceManifestCandidateRef: ref(
    'caption.cap18.source.manifest.candidate',
    'private-source-binding-manifest-candidate-v1',
    'c978fb117957ea579723ac8a86cb1879fa71c783b7eddf3f303a980afe9ad045'),
  referenceManifestCandidateRef: ref(
    'caption.cap18.reference.manifest.candidate',
    'private-source-binding-manifest-candidate-v1',
    'be18bb81be223bd51a6838c30faefc69f7325f23c78350613bc728f9a9282852'),
  inspectedOutputs: [{
    outputId: 'caption-cap18-output-wide',
    sourceClass: 'canonical_uploaded_source_composition',
    artifactRef: ref('caption.cap18.output.wide',
      'caption-private-remotion-output-v1',
      'af06f491e3e70364a43e702dd47a2a1166d79a8e5fec48e2a1cbc43c3bdf69f3'),
    width: 640, height: 360, fps: 24, durationFrames: 96,
    aspectRatio: '16:9',
    contactSheetRasterSha256:
      'cdcf5881436f6741fed5c94fb4500a898a14687827a1a4507a82df9e65f38b46',
    requestedFrameNumbers: sourceFrames,
    inspectedFrames: inspectedFrames(sourceFrames,
      sourceOutputFrameHashes['caption-cap18-output-wide']),
    directInspectionDisposition: 'accepted_controlled_private_fixture',
  }, {
    outputId: 'caption-cap18-output-vertical',
    sourceClass: 'canonical_uploaded_source_composition',
    artifactRef: ref('caption.cap18.output.vertical',
      'caption-private-remotion-output-v1',
      'a3bad142cb8d91eaef48b83a51f2153ac1698a68b26f989a6cb759a29043c1d1'),
    width: 360, height: 640, fps: 24, durationFrames: 96,
    aspectRatio: '9:16',
    contactSheetRasterSha256:
      '19e5ebe5c18ef6f9e72693b4a72c08c8141fc90a784f9749aac82e3f95b245a8',
    requestedFrameNumbers: sourceFrames,
    inspectedFrames: inspectedFrames(sourceFrames,
      sourceOutputFrameHashes['caption-cap18-output-vertical']),
    directInspectionDisposition: 'accepted_controlled_private_fixture',
  }, {
    outputId: 'caption-cap18-output-square',
    sourceClass: 'canonical_uploaded_source_composition',
    artifactRef: ref('caption.cap18.output.square',
      'caption-private-remotion-output-v1',
      'd2ebf6ad056a41aef13440c7b1e7120a92ac3e95f78b39de030eabfff7942973'),
    width: 480, height: 480, fps: 24, durationFrames: 96,
    aspectRatio: '1:1',
    contactSheetRasterSha256:
      '33b7832dae361996d62e815937b6c8716db578f19fd8f02294abed37ef9417e3',
    requestedFrameNumbers: sourceFrames,
    inspectedFrames: inspectedFrames(sourceFrames,
      sourceOutputFrameHashes['caption-cap18-output-square']),
    directInspectionDisposition: 'accepted_controlled_private_fixture',
  }, {
    outputId: 'caption-cap18-output-creative-full',
    sourceClass: 'caption_creative_scene_group_proxy',
    artifactRef: ref('caption.cap18.output.creative.full',
      'caption-private-remotion-output-v1', cap14FullMotionSha256),
    width: 640, height: 360, fps: 30, durationFrames: 360,
    aspectRatio: '16:9',
    contactSheetRasterSha256:
      'f07c37e2dcefd461423c6e041d190c2121598eb010b6e2df9f22363d664261e4',
    requestedFrameNumbers: creativeFrames,
    inspectedFrames: inspectedFrames(creativeFrames, creativeFrameHashes, true),
    directInspectionDisposition: 'accepted_controlled_private_fixture',
  }, {
    outputId: 'caption-cap18-output-creative-reduced',
    sourceClass: 'caption_creative_scene_group_proxy',
    artifactRef: ref('caption.cap18.output.creative.reduced',
      'caption-private-remotion-output-v1', cap14ReducedMotionSha256),
    width: 640, height: 360, fps: 30, durationFrames: 360,
    aspectRatio: '16:9',
    contactSheetRasterSha256:
      'f07c37e2dcefd461423c6e041d190c2121598eb010b6e2df9f22363d664261e4',
    requestedFrameNumbers: creativeFrames,
    inspectedFrames: inspectedFrames(creativeFrames, creativeFrameHashes, true),
    directInspectionDisposition: 'accepted_controlled_private_fixture',
  }],
  exactOutputSetComplete: true,
  actualRenderedPixelsOpenedAndInspected: true,
  everyRequestedFrameInspected: true,
  completePlaybackInspectionPerformed: false,
  qualifiedAiCompleteTimeReviewPerformed: false,
  controlledFixtureOnly: true,
  customerMediaClaimed: false,
  representativeProductionFootageClaimed: false,
  technicalQaReplaced: false,
  browserLocalCompletionAccepted: false,
  pathsOrUrlsSerialized: false,
  mediaBytesSerialized: false,
  providerOrModelCallMade: false,
  finalQaApprovalGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
})

export const CAP_18_PRIVATE_MULTILINGUAL_INSPECTION_RECEIPT_FIXTURE =
createCaptionPrivateMultilingualInspectionReceipt({
  receiptId: 'caption.private.multilingual.inspection.cap18',
  observedAt: '2026-08-04T20:17:46.000-04:00',
  controlledSourceArtifactRef: ref(
    'caption.cap18.multilingual.controlled-source',
    'caption-controlled-source-media-v1',
    '2adf3685b148bd5cb8285a3a7f2410e0916a340b39c6b415ece6944d0cf05d52'),
  libassImageRef: ref('caption.cap18.multilingual.libass-image',
    'offline-libass-caption-image-v2',
    '7acfa08ec12385be02caa61039bbfd97fbd38249f508541a3a4f16d7ffa10e17'),
  remotionImageRef: ref('caption.cap18.multilingual.remotion-image',
    'offline-remotion-image-v1',
    'cce5c181a952e507db381e48432b1353673c5189da5a05c2ed912b35ccc4124e'),
  fontPackRef: ref('caption.font.pack.noto.reviewed.cap18',
    'reeditpro-reviewed-font-pack-v2',
    '43bf35b675482f3aeaf9422eb7921f4960ce98d71b33318335b454f2c8887b13'),
  fontAssetRefs: [
    ref('caption.font.noto-sans.regular', 'noto-sans-v2.015',
      '478c558ea716033cd60c03438f628dfa75694dcf6b5f6d505a2f05fd2b4f3823'),
    ref('caption.font.noto-sans-arabic.regular',
      'noto-sans-arabic-v2.013',
      'bdff3e5659d67e67def05b33f749683b9376ae819d65d3dd62ac4640b3aaef48'),
    ref('caption.font.noto-sans-devanagari.regular',
      'noto-sans-devanagari-v2.006',
      'da2d2135e978c6f68852cfd8201c3a067df1acf73232fe80c58f89e6302ee6e8'),
    ref('caption.font.noto-sans-jp.regular', 'noto-sans-jp-v2.004',
      'dff723ba59d57d136764a04b9b2d03205544f7cd785a711442d6d2d085ac5073'),
  ],
  contactSheetRasterRef: ref('caption.cap18.multilingual.contact-sheet',
    'caption-direct-inspection-contact-sheet-v1',
    '32c838f136acdb3fe99c3ce7d41eb84221fa2b32df43ce56e999c7ba0e31f587'),
  fontToolsVersion: '4.38.0',
  openTypeSanitizerVersion: '8.2.1',
  libassVersion: '0.17.5',
  outputs: [{
    outputId: 'fr-combining', languageTag: 'fr',
    captionDigestSha256:
      '165c4b228fddce247f4e42599266efd572dbd22473ac060475e58be1461d2b54',
    overlayArtifactRef: ref('caption.cap18.multilingual.overlay.fr',
      'offline-libass-caption-overlay-v2',
      '7e00ad4e63bb01fbdc8b7e7a7a4fedd40bfe6497eb1b602b462d389e193081fc'),
    compositeArtifactRef: ref('caption.cap18.multilingual.composite.fr',
      'offline-remotion-caption-composite-v1',
      '48d60f2f8a96ab7322b50674eea92a3e6af5349edc098622b39944203f3d82f5'),
    inspectedFrameRef: ref('caption.cap18.multilingual.frame.fr.24',
      'caption-direct-inspection-frame-v1',
      '986904c0659f7100d40c23eae30ae19ce76ea0326f4223d6a233cb58a212f1c9'),
    width: 640, height: 360, fps: 24, durationFrames: 48,
    inspectedFrameNumber: 24,
    alphaBoundingBox: { left: 219, top: 276, width: 203, height: 35 },
    nonTransparentPixelCount: 4_693,
    actualRasterOpenedAndInspected: true,
    shapingDisposition: 'accepted_reviewed_script_fixture',
    findingCodes: ['direct_raster_visual_inspection_passed',
      'combining_marks_visually_attached',
      'readable_busy_background_no_clipping'],
  }, {
    outputId: 'ja', languageTag: 'ja',
    captionDigestSha256:
      '03664acbc51b4829af0f5f60a5140accabd1dea52c3c516ad02d10853cf5c39e',
    overlayArtifactRef: ref('caption.cap18.multilingual.overlay.ja',
      'offline-libass-caption-overlay-v2',
      '926882664c5bbcca2aa34f810d9d810c058be48dee77f84fc39c1a06d089a513'),
    compositeArtifactRef: ref('caption.cap18.multilingual.composite.ja',
      'offline-remotion-caption-composite-v1',
      'b7c432550f350c080603a366b683cfef5951270d4f74dfb2f2f4d71d193b8142'),
    inspectedFrameRef: ref('caption.cap18.multilingual.frame.ja.24',
      'caption-direct-inspection-frame-v1',
      '280e5ad641c11fb70c87b9a7a2d02afc5bc721beaa14994637cb32af70e909ba'),
    width: 640, height: 360, fps: 24, durationFrames: 48,
    inspectedFrameNumber: 24,
    alphaBoundingBox: { left: 201, top: 275, width: 231, height: 35 },
    nonTransparentPixelCount: 6_051,
    actualRasterOpenedAndInspected: true,
    shapingDisposition: 'accepted_reviewed_script_fixture',
    findingCodes: ['direct_raster_visual_inspection_passed',
      'japanese_glyphs_present', 'readable_busy_background_no_clipping'],
  }, {
    outputId: 'ar', languageTag: 'ar',
    captionDigestSha256:
      '76300ab6fe24832ba43098bd5986690a5cfb3d867a296f0ac9d6424752e4d9cd',
    overlayArtifactRef: ref('caption.cap18.multilingual.overlay.ar',
      'offline-libass-caption-overlay-v2',
      'bceca9c9d9c2943d3a6c25b518197062638a777419f6ac65340b2ad630352a1a'),
    compositeArtifactRef: ref('caption.cap18.multilingual.composite.ar',
      'offline-remotion-caption-composite-v1',
      'fe1a25fa9b73e9bf865784db6c421a832436e1325e7c754fb60c4f89052584fc'),
    inspectedFrameRef: ref('caption.cap18.multilingual.frame.ar.24',
      'caption-direct-inspection-frame-v1',
      '45ab9b6226470bb2a38ddf3627b6120ba3d3096fd855e9d67a90c7a8b0b88a30'),
    width: 640, height: 360, fps: 24, durationFrames: 48,
    inspectedFrameNumber: 24,
    alphaBoundingBox: { left: 154, top: 270, width: 331, height: 43 },
    nonTransparentPixelCount: 7_970,
    actualRasterOpenedAndInspected: true,
    shapingDisposition: 'accepted_reviewed_script_fixture',
    findingCodes: ['direct_raster_visual_inspection_passed',
      'arabic_rtl_joining_visually_coherent',
      'readable_busy_background_no_clipping'],
  }, {
    outputId: 'hi', languageTag: 'hi',
    captionDigestSha256:
      'fe5665bd2ca8576544ab4254aa7f14135bfdb53c2d40ec174e3f53037688ece7',
    overlayArtifactRef: ref('caption.cap18.multilingual.overlay.hi',
      'offline-libass-caption-overlay-v2',
      '2cf2cf322248baab80371b1fb0a13eb50277135e6d9f7c362f3b2cab0e829bf1'),
    compositeArtifactRef: ref('caption.cap18.multilingual.composite.hi',
      'offline-remotion-caption-composite-v1',
      '41e852dd04041d6f057ad0c2f03128540a126f991b679938b771bdb85fe067f2'),
    inspectedFrameRef: ref('caption.cap18.multilingual.frame.hi.24',
      'caption-direct-inspection-frame-v1',
      'c06e24978731f186c30d8ecb1096b3b459ebf7154fd0e061659836d53df1260e'),
    width: 640, height: 360, fps: 24, durationFrames: 48,
    inspectedFrameNumber: 24,
    alphaBoundingBox: { left: 212, top: 276, width: 217, height: 30 },
    nonTransparentPixelCount: 4_700,
    actualRasterOpenedAndInspected: true,
    shapingDisposition: 'accepted_reviewed_script_fixture',
    findingCodes: ['direct_raster_visual_inspection_passed',
      'devanagari_conjuncts_visually_coherent',
      'readable_busy_background_no_clipping'],
  }],
  exactOutputSetComplete: true,
  actualFontToolsBuildValidationExecuted: true,
  fontToolsSubsetRoundTripPassed: true,
  actualOpenTypeSanitizerBuildValidationExecuted: true,
  malformedFontRejectedByOpenTypeSanitizer: true,
  actualLibassHarfBuzzFribidiRenderingExecuted: true,
  actualRemotionFinalCompositionExecuted: true,
  actualPinnedFfprobeQaExecuted: true,
  directRenderedFrameInspectionExecuted: true,
  completePlaybackInspectionPerformed: false,
  remotionBrowserTextShapingClaimed: false,
  colorEmojiIncluded: false,
  runtimeFontDownloadOccurred: false,
  callerFontPathAccepted: false,
  controlledFixtureOnly: true,
  customerMediaClaimed: false,
  representativeProductionFootageClaimed: false,
  pathsOrUrlsSerialized: false,
  mediaBytesSerialized: false,
  providerOrModelCallMade: false,
  fullTrackOrVideoBurnInReady: false,
  finalQaApprovalGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
})

const privateFixtureIds = new Set<CaptionPrivateQualificationFixtureId>([
  'small_transcript_hero_track',
  'persistent_list',
  'reduced_motion',
  'remotion_failure',
])
const contractFixtureIds = new Set<CaptionPrivateQualificationFixtureId>([
  'caption_to_visual',
  'caption_to_living_frame',
  'mask_failure',
  'alignment_failure',
  'visual_intelligence_failure',
  'old_snapshot_compatibility',
])
const captionOwnedGapIds = new Set<CaptionPrivateQualificationFixtureId>([
  'uploaded_reference_video',
  'clean_documentary',
  'dynamic_short',
  'dark_light_change',
  'multilingual',
  'multiple_output_ratios',
])

function priorMedia(
  fixtureId: CaptionPrivateQualificationFixtureId,
): CaptionPrivateMediaEvidence {
  const reduced = fixtureId === 'reduced_motion'
  const contentHash = reduced
    ? cap14ReducedMotionSha256 : cap14FullMotionSha256
  return {
    evidenceId: `caption.private.media.cap18.prior.${fixtureId}`,
    artifactRef: ref(
      `caption.cap14.private.${reduced ? 'reduced' : 'full'}.mp4`,
      'caption-remotion-private-proxy-v1', contentHash),
    sourceMediaRef: ref(
      `caption.cap14.private.${reduced ? 'reduced' : 'full'}.mp4`,
      'caption-remotion-private-proxy-v1', contentHash),
    canonicalUploadManifestRef: null,
    canonicalUploadRereadVerified: false,
    contentType: 'video/mp4',
    width: 640,
    height: 360,
    fps: 30,
    durationFrames: 360,
    aspectRatio: '16:9',
    languageTags: ['en'],
    sourceClass: 'prior_caption_private_runtime',
    actualFileBytesProcessed: true,
    actualPackageRuntimeExecuted: true,
    deterministicTechnicalQaPassed: true,
    deterministicReplayMatched: false,
    directVisualInspectionRequired: true,
    directVisualInspectionReceiptRef: inspectionReceiptRef,
    completePlaybackInspected: false,
    inspectedFrameNumbers,
    privateInternalOnly: true,
    customerMediaClaimed: false,
    representativeProductionFootageClaimed: false,
    pathsOrUrlsSerialized: false,
    mediaBytesSerialized: false,
    providerOrModelCallMade: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
}

function fixtureResult(
  fixtureId: CaptionPrivateQualificationFixtureId,
): CaptionPrivateQualificationFixtureResult {
  const definition = CAPTION_PRIVATE_QUALIFICATION_CATALOG.find((item) =>
    item.fixtureId === fixtureId)!
  const disposition: CaptionPrivateQualificationDisposition =
    privateFixtureIds.has(fixtureId)
      ? 'verified_private'
      : contractFixtureIds.has(fixtureId)
        ? 'verified_contract'
        : 'missing_integration'
  const verified = disposition === 'verified_private'
    || disposition === 'verified_contract'
  const blockerClass = verified
    ? 'none'
    : captionOwnedGapIds.has(fixtureId)
      ? 'caption_owned'
      : 'shared_owner'
  const mediaEvidence = disposition === 'verified_private'
    ? [priorMedia(fixtureId)] : []
  return {
    fixtureId,
    disposition,
    blockerClass,
    requiredJobTypes: [...definition.requiredJobTypes],
    ownerIds: [...definition.ownerIds],
    evidenceRefs: [ref(
      `caption.cap18.source-evidence.${fixtureId}`,
      `caption-cap18-${disposition}-evidence-v1`,
    )],
    mediaEvidence,
    blockerCodes: verified ? [] : [
      captionOwnedGapIds.has(fixtureId)
        ? `caption_cap18_${fixtureId}_runtime_evidence_missing`
        : `caption_cap18_${fixtureId}_shared_owner_integration_missing`,
    ],
    fallbackOrRepairCodes: fixtureId === 'remotion_failure'
      ? ['caption_remotion_failure_repaired_and_reinspected']
      : disposition === 'missing_integration'
        ? ['caption_fail_closed_without_required_integration'] : [],
    directVisualInspectionSatisfied: mediaEvidence.length > 0,
    exactConfirmedOutputFrameBound:
      verified && definition.exactConfirmedOutputFrameRequired,
    exactMasterTimingOrStoryTimingBound:
      verified && definition.exactTimingRequired,
    privateArtifactPolicySatisfied: true,
    noDuplicateOwnerCreated: true,
  }
}

const sourcePlanningQualificationSnapshotRef = ref(
  CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT.snapshotId,
  CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT.schemaVersion,
  CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT.snapshotDigestSha256,
)

const cap18InspectionReceiptRef = ref(
  CAP_18_PRIVATE_VISUAL_INSPECTION_RECEIPT_FIXTURE.receiptId,
  CAP_18_PRIVATE_VISUAL_INSPECTION_RECEIPT_FIXTURE.schemaVersion,
  CAP_18_PRIVATE_VISUAL_INSPECTION_RECEIPT_FIXTURE.receiptDigestSha256,
)
const cap18MultilingualInspectionReceiptRef = ref(
  CAP_18_PRIVATE_MULTILINGUAL_INSPECTION_RECEIPT_FIXTURE.receiptId,
  CAP_18_PRIVATE_MULTILINGUAL_INSPECTION_RECEIPT_FIXTURE.schemaVersion,
  CAP_18_PRIVATE_MULTILINGUAL_INSPECTION_RECEIPT_FIXTURE
    .receiptDigestSha256,
)
const sourceManifestRef =
  CAP_18_PRIVATE_VISUAL_INSPECTION_RECEIPT_FIXTURE.sourceManifestCandidateRef
const referenceManifestRef =
  CAP_18_PRIVATE_VISUAL_INSPECTION_RECEIPT_FIXTURE.referenceManifestCandidateRef
const freshPrivateFixtureIds = new Set<CaptionPrivateQualificationFixtureId>([
  'uploaded_reference_video',
  'clean_documentary',
  'dynamic_short',
  'small_transcript_hero_track',
  'persistent_list',
  'dark_light_change',
  'reduced_motion',
  'remotion_failure',
  'multilingual',
  'multiple_output_ratios',
])
const outputIdsByFixture:
Partial<Record<CaptionPrivateQualificationFixtureId, string[]>> = {
  uploaded_reference_video: ['caption-cap18-output-wide'],
  clean_documentary: ['caption-cap18-output-wide'],
  dynamic_short: ['caption-cap18-output-vertical',
    'caption-cap18-output-creative-full'],
  small_transcript_hero_track: ['caption-cap18-output-creative-full'],
  text_behind_subject: ['caption-cap18-output-creative-full'],
  text_in_front_of_subject: ['caption-cap18-output-creative-full'],
  object_anchor: ['caption-cap18-output-creative-full'],
  persistent_list: ['caption-cap18-output-creative-full'],
  busy_background: ['caption-cap18-output-wide'],
  dark_light_change: ['caption-cap18-output-wide'],
  reduced_motion: ['caption-cap18-output-creative-reduced'],
  remotion_failure: ['caption-cap18-output-creative-full'],
  multiple_output_ratios: [
    'caption-cap18-output-wide',
    'caption-cap18-output-vertical',
    'caption-cap18-output-square',
  ],
}
const sourceMediaRefsByOutputId: Record<string, CaptionDomainRef> = {
  'caption-cap18-output-wide': ref('caption.cap18.source.wide',
    'private-upload-media-asset-v1',
    '1a4ee4d877f872e903e622686139a5738877eb1a839ab433b07977b663f29cc9'),
  'caption-cap18-output-vertical': ref('caption.cap18.source.vertical',
    'private-upload-media-asset-v1',
    'fc95437ef88399b606ebb76e0748e7657b59f151396794ee50a6609ff7eff287'),
  'caption-cap18-output-square': ref('caption.cap18.source.square',
    'private-upload-media-asset-v1',
    '6839dbcc7ce6739780c47dac77a2058ba9d833cb47c70d09c06007ec69d03872'),
}

function freshMedia(
  outputId: string,
  fixtureId: CaptionPrivateQualificationFixtureId,
): CaptionPrivateMediaEvidence {
  const output = CAP_18_PRIVATE_VISUAL_INSPECTION_RECEIPT_FIXTURE
    .inspectedOutputs.find((item) => item.outputId === outputId)!
  const uploaded = output.sourceClass === 'canonical_uploaded_source_composition'
  const referenceFixture = fixtureId === 'uploaded_reference_video'
  return {
    evidenceId: `caption.private.media.cap18.${fixtureId}.${outputId}`,
    artifactRef: output.artifactRef,
    sourceMediaRef: referenceFixture
      ? ref('caption.cap18.reference.video', 'private-upload-media-asset-v1',
        '1a4ee4d877f872e903e622686139a5738877eb1a839ab433b07977b663f29cc9')
      : sourceMediaRefsByOutputId[outputId] ?? output.artifactRef,
    canonicalUploadManifestRef: uploaded
      ? referenceFixture ? referenceManifestRef : sourceManifestRef
      : null,
    canonicalUploadRereadVerified: uploaded,
    contentType: 'video/mp4',
    width: output.width,
    height: output.height,
    fps: output.fps,
    durationFrames: output.durationFrames,
    aspectRatio: output.aspectRatio,
    languageTags: ['en'],
    sourceClass: 'controlled_private_actual_media',
    actualFileBytesProcessed: true,
    actualPackageRuntimeExecuted: true,
    deterministicTechnicalQaPassed: true,
    deterministicReplayMatched: outputId === 'caption-cap18-output-wide',
    directVisualInspectionRequired: true,
    directVisualInspectionReceiptRef: cap18InspectionReceiptRef,
    completePlaybackInspected: false,
    inspectedFrameNumbers: output.requestedFrameNumbers,
    privateInternalOnly: true,
    customerMediaClaimed: false,
    representativeProductionFootageClaimed: false,
    pathsOrUrlsSerialized: false,
    mediaBytesSerialized: false,
    providerOrModelCallMade: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
}

function multilingualMedia(): CaptionPrivateMediaEvidence[] {
  const receipt = CAP_18_PRIVATE_MULTILINGUAL_INSPECTION_RECEIPT_FIXTURE
  return receipt.outputs.map((output) => ({
    evidenceId: `caption.private.media.cap18.multilingual.${output.outputId}`,
    artifactRef: output.compositeArtifactRef,
    sourceMediaRef: receipt.controlledSourceArtifactRef,
    canonicalUploadManifestRef: null,
    canonicalUploadRereadVerified: false,
    contentType: 'video/mp4',
    width: output.width,
    height: output.height,
    fps: output.fps,
    durationFrames: output.durationFrames,
    aspectRatio: '16:9',
    languageTags: [output.languageTag],
    sourceClass: 'controlled_private_actual_media',
    actualFileBytesProcessed: true,
    actualPackageRuntimeExecuted: true,
    deterministicTechnicalQaPassed: true,
    deterministicReplayMatched: false,
    directVisualInspectionRequired: true,
    directVisualInspectionReceiptRef: cap18MultilingualInspectionReceiptRef,
    completePlaybackInspected: false,
    inspectedFrameNumbers: [output.inspectedFrameNumber],
    privateInternalOnly: true,
    customerMediaClaimed: false,
    representativeProductionFootageClaimed: false,
    pathsOrUrlsSerialized: false,
    mediaBytesSerialized: false,
    providerOrModelCallMade: false,
    finalQaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }))
}

function finalFixtureResult(
  fixtureId: CaptionPrivateQualificationFixtureId,
): CaptionPrivateQualificationFixtureResult {
  const definition = CAPTION_PRIVATE_QUALIFICATION_CATALOG.find((item) =>
    item.fixtureId === fixtureId)!
  const disposition: CaptionPrivateQualificationDisposition =
    freshPrivateFixtureIds.has(fixtureId)
      ? 'verified_private'
      : contractFixtureIds.has(fixtureId)
        ? 'verified_contract' : 'missing_integration'
  const verified = disposition !== 'missing_integration'
  const blockerClass = verified ? 'none' : 'shared_owner'
  const mediaEvidence = fixtureId === 'multilingual'
    ? multilingualMedia()
    : (outputIdsByFixture[fixtureId] ?? []).map((outputId) =>
      freshMedia(outputId, fixtureId))
  return {
    fixtureId,
    disposition,
    blockerClass,
    requiredJobTypes: [...definition.requiredJobTypes],
    ownerIds: [...definition.ownerIds],
    evidenceRefs: [
      ref(`caption.cap18.final-evidence.${fixtureId}`,
        `caption-cap18-${disposition}-evidence-v1`),
      ...(mediaEvidence.length > 0
        ? [fixtureId === 'multilingual'
          ? cap18MultilingualInspectionReceiptRef
          : cap18InspectionReceiptRef]
        : []),
    ],
    mediaEvidence,
    blockerCodes: verified ? [] : [
      `caption_cap18_${fixtureId}_canonical_shared_owner_integration_missing`],
    fallbackOrRepairCodes: fixtureId === 'remotion_failure'
      ? ['caption_remotion_failure_repaired_and_reinspected']
      : disposition === 'missing_integration'
        ? ['caption_fail_closed_without_required_integration'] : [],
    directVisualInspectionSatisfied: mediaEvidence.length > 0,
    exactConfirmedOutputFrameBound: verified
      ? definition.exactConfirmedOutputFrameRequired
      : mediaEvidence.length > 0,
    exactMasterTimingOrStoryTimingBound: verified
      ? definition.exactTimingRequired
      : mediaEvidence.length > 0,
    privateArtifactPolicySatisfied: true,
    noDuplicateOwnerCreated: true,
  }
}

export const CAP_18_SOURCE_QUALIFICATION_REPORT_FIXTURE =
createCaptionPrivateQualificationReport({
  reportId: 'caption.private.qualification.cap18.source',
  observedAt: '2026-08-04T12:00:00.000Z',
  sourceReleaseRef: ref(
    'captions.specialist.release.cap17.8fa3a9e829c95a2a401a9d8b77cd51cbad23f26e',
    'captions-specialist-v1'),
  sourcePlanningQualificationSnapshotRef,
  fixtureResults: CAPTION_PRIVATE_QUALIFICATION_FIXTURE_IDS.map(fixtureResult),
})

export const CAP_18_POST_RUNTIME_QUALIFICATION_REPORT_FIXTURE =
createCaptionPrivateQualificationReport({
  reportId: 'caption.private.qualification.cap18.post-runtime',
  observedAt: '2026-08-04T23:35:00.000Z',
  sourceReleaseRef: ref(
    'captions.specialist.release.cap17.8fa3a9e829c95a2a401a9d8b77cd51cbad23f26e',
    'captions-specialist-v1'),
  sourcePlanningQualificationSnapshotRef,
  fixtureResults:
    CAPTION_PRIVATE_QUALIFICATION_FIXTURE_IDS.map(finalFixtureResult),
})

export function runCap18Smoke(): void {
  const report = parseCaptionPrivateQualificationReport(
    CAP_18_SOURCE_QUALIFICATION_REPORT_FIXTURE)
  const postRuntime = parseCaptionPrivateQualificationReport(
    CAP_18_POST_RUNTIME_QUALIFICATION_REPORT_FIXTURE)
  const visualReceipt = parseCaptionPrivateVisualInspectionReceipt(
    CAP_18_PRIVATE_VISUAL_INSPECTION_RECEIPT_FIXTURE)
  const multilingualReceipt =
    parseCaptionPrivateMultilingualInspectionReceipt(
      CAP_18_PRIVATE_MULTILINGUAL_INSPECTION_RECEIPT_FIXTURE)
  check(visualReceipt.inspectedOutputs.length === 5
    && visualReceipt.inspectedOutputs.reduce((total, output) =>
      total + output.inspectedFrames.length, 0) === 31,
  'CAP-18 must freeze all five output variants and all 31 directly opened frames.')
  check(visualReceipt.actualRenderedPixelsOpenedAndInspected
    && !visualReceipt.completePlaybackInspectionPerformed
    && !visualReceipt.qualifiedAiCompleteTimeReviewPerformed
    && !visualReceipt.finalQaApprovalGranted,
  'Direct sampled-raster inspection must remain distinct from complete playback, qualified AI review, and final QA.')
  check(multilingualReceipt.outputs.length === 4
    && multilingualReceipt.actualFontToolsBuildValidationExecuted
    && multilingualReceipt.fontToolsSubsetRoundTripPassed
    && multilingualReceipt.actualOpenTypeSanitizerBuildValidationExecuted
    && multilingualReceipt.malformedFontRejectedByOpenTypeSanitizer
    && multilingualReceipt.actualLibassHarfBuzzFribidiRenderingExecuted
    && multilingualReceipt.actualRemotionFinalCompositionExecuted
    && multilingualReceipt.actualPinnedFfprobeQaExecuted
    && multilingualReceipt.directRenderedFrameInspectionExecuted,
  'The multilingual receipt must bind all four actual font-validation, shaping, composition, technical-QA, and raster-inspection paths.')
  check(!multilingualReceipt.remotionBrowserTextShapingClaimed
    && !multilingualReceipt.colorEmojiIncluded
    && !multilingualReceipt.runtimeFontDownloadOccurred
    && !multilingualReceipt.completePlaybackInspectionPerformed
    && !multilingualReceipt.fullTrackOrVideoBurnInReady,
  'The qualified overlay route must not overclaim browser shaping, emoji, runtime downloads, complete playback, or full-track readiness.')
  check(report.fixtureResults.length === 23
    && report.counts.totalFixtures === 23,
  'CAP-18 must cover the exact 23-fixture internal qualification catalog.')
  check(report.jobEvidenceSet.jobs.length === CAPTIONS_SUPPORTED_JOB_TYPES.length
    && report.counts.totalJobs === 41,
  'CAP-18 must preserve per-job evidence for all 41 Caption job types.')
  check(report.counts.verifiedPrivate === 4
    && report.counts.verifiedContract === 6
    && report.counts.missingIntegration === 13
    && report.counts.blockedExternal === 0,
  'The source receipt must report 4 private, 6 contract, and 13 open integration fixtures without inventing external failures.')
  check(!report.captionOwnedRequirementsComplete
    && !report.sharedOwnerIntegrationComplete
    && report.externalEvidenceComplete
    && !report.readyForCanonicalBackendWorkflowIntegration
    && !report.privateInternalSpecialistQualified,
  'The source-only audit must remain incomplete until the bounded CAP-18 runtime and shared-owner integrations exist.')
  check(postRuntime.counts.verifiedPrivate === 10
    && postRuntime.counts.verifiedContract === 6
    && postRuntime.counts.missingIntegration === 7
    && postRuntime.counts.blockedExternal === 0,
  'Fresh private evidence must close six source-audit gaps without hiding seven shared-owner integrations.')
  check(postRuntime.captionOwnedRequirementsComplete
    && !postRuntime.sharedOwnerIntegrationComplete
    && postRuntime.readyForCanonicalBackendWorkflowIntegration
    && !postRuntime.privateInternalSpecialistQualified,
  'Caption-owned CAP-18 requirements may enter canonical backend integration while shared-owner completion remains fail closed.')
  check(postRuntime.fixtureResults.find((item) =>
    item.fixtureId === 'multiple_output_ratios')?.mediaEvidence
      .map((item) => item.aspectRatio).join('|') === '16:9|9:16|1:1',
  'The multiple-output fixture must bind the exact inspected wide, vertical, and square artifacts.')
  check(postRuntime.fixtureResults.find((item) =>
    item.fixtureId === 'uploaded_reference_video')?.mediaEvidence[0]
      ?.canonicalUploadManifestRef?.contentHash
      === referenceManifestRef.contentHash,
  'Reference-video qualification must bind the exact purpose-specific manifest candidate and reread evidence.')
  check(postRuntime.fixtureResults.filter((item) =>
    item.mediaEvidence.length > 0).every((item) =>
      item.directVisualInspectionSatisfied
      && item.mediaEvidence.every((media) => {
        const expectedReceipt = item.fixtureId === 'multilingual'
          ? cap18MultilingualInspectionReceiptRef
          : cap18InspectionReceiptRef
        return media.directVisualInspectionReceiptRef?.contentHash
          === expectedReceipt.contentHash && !media.completePlaybackInspected
      })),
  'Every newly claimed private artifact must bind the exact direct-inspection receipt without claiming complete playback.')
  check(postRuntime.fixtureResults.find((item) =>
    item.fixtureId === 'multilingual')?.disposition === 'verified_private'
    && postRuntime.fixtureResults.find((item) =>
      item.fixtureId === 'multilingual')?.mediaEvidence.length === 4
    && postRuntime.fixtureResults.find((item) =>
      item.fixtureId === 'text_behind_subject')?.blockerClass === 'shared_owner',
  'The closed Caption-owned multilingual route must stay separate from shared Track All integration.')
  check(report.fixtureResults.find((item) =>
    item.fixtureId === 'caption_to_living_frame')?.disposition
      === 'verified_contract'
    && report.fixtureResults.find((item) =>
      item.fixtureId === 'caption_to_living_frame')?.mediaEvidence.length === 0,
  'Frozen CAP-11/CAP-12 handoff evidence must remain contract evidence, never Living Frame execution evidence.')
  check(report.fixtureResults.find((item) =>
    item.fixtureId === 'text_behind_subject')?.blockerClass === 'shared_owner'
    && report.fixtureResults.find((item) =>
      item.fixtureId === 'broll_co_composition')?.blockerClass === 'shared_owner',
  'Track All and B-roll gaps must remain attached to their canonical shared owners.')
  check(report.fixtureResults.filter((item) =>
    item.disposition === 'verified_private').every((item) =>
      item.mediaEvidence.every((media) =>
        media.sourceClass === 'prior_caption_private_runtime'
        && !media.canonicalUploadRereadVerified
        && !media.completePlaybackInspected)),
  'Prior CAP-14 media must preserve historical provenance instead of being relabeled as fresh canonical CAP-18 runtime.')
  check(report.fixtureResults.find((item) =>
    item.fixtureId === 'reduced_motion')?.mediaEvidence[0]?.artifactRef.contentHash
      === cap14ReducedMotionSha256,
  'Reduced-motion evidence must retain its exact inspected CAP-14 artifact digest.')
  check(report.jobEvidenceSet.jobs.every((job) =>
    job.planningModeQualified && !job.privateRuntimeOwnedByCaptions),
  'Per-job evidence must preserve planning qualification without transferring tool runtime ownership to Captions.')
  check(!report.operationDispatchAuthority
    && !report.providerRuntimeAuthority
    && !report.assetMutationAuthority
    && !report.creditOrBillingAuthority
    && !report.finalQaApprovalAuthority
    && !report.publicDeliveryAuthority
    && !report.productionAuthority,
  'CAP-18 evidence must not promote dispatch, provider, asset, billing, QA, delivery, or production authority.')
  const squareOverlayRequest = validateOfflineLibassCaptionRequest({
    schemaVersion: 'offline-libass-caption-execution-v1',
    toolId: 'libass',
    operationId: 'tool.libass.render_approved_caption_track.v1',
    payload: {
      captionProfileId: 'approved_ass_track_render_v1',
      fontPackProfileId: 'reeditpro_reviewed_fonts_v1',
      collisionPolicy: 'fail_on_reserved_zone_collision',
      preserveSpeechTiming: true,
      width: 480,
      height: 480,
      timestampMs: 1_000,
      fontSize: 40,
      marginV: 58,
      alignment: 2,
      caption: 'STAY CLEAR',
    },
  })
  check(squareOverlayRequest.payload.width === 480
    && squareOverlayRequest.payload.height === 480,
  'The existing libass-v1 owner must admit the bounded 1:1 private review canvas without creating a duplicate operation.')
  const multilingualCaptions = [
    'L’e\u0301lan cre\u0301e de\u0301ja\u0300',
    '考えが動きを導く',
    'الفكرة تقود الحركة',
    'विचार गति को दिशा देते हैं',
  ] as const
  check(multilingualCaptions.every((caption) =>
    validateOfflineLibassCaptionRequest({
      ...squareOverlayRequest,
      payload: {
        ...squareOverlayRequest.payload,
        fontPackProfileId: 'reeditpro_reviewed_fonts_v2',
        caption,
      },
    }).payload.caption === caption),
  'The existing libass-v1 operation must admit exact safe UTF-8 through only the reviewed v2 font profile.')
  check(() => {
    try {
      validateOfflineLibassCaptionRequest({
        ...squareOverlayRequest,
        payload: {
          ...squareOverlayRequest.payload,
          caption: multilingualCaptions[1],
        },
      })
      return false
    } catch { return true }
  }, 'The reviewed-fonts-v1 ASCII lane must remain unchanged.')
  check([
    'bad\ud800text',
    'unsafe\u202Econtrol',
    'emoji 😀',
    'https://example.test/caption',
    '{\\pos(1,1)}unsafe',
    'line\nbreak',
  ].every((caption) => {
    try {
      validateOfflineLibassCaptionRequest({
        ...squareOverlayRequest,
        payload: {
          ...squareOverlayRequest.payload,
          fontPackProfileId: 'reeditpro_reviewed_fonts_v2',
          caption,
        },
      })
      return false
    } catch { return true }
  }),
  'Malformed Unicode, bidi controls, emoji, paths, ASS overrides, and control characters must fail closed.')

  const reordered = structuredClone(report)
  ;[reordered.fixtureResults[0], reordered.fixtureResults[1]] =
    [reordered.fixtureResults[1]!, reordered.fixtureResults[0]!]
  expectThrow(() => parseCaptionPrivateQualificationReport(
    redigest(reordered as unknown as Record<string, unknown>,
      'reportDigestSha256')))

  const staleMedia = structuredClone(report.fixtureResults.find((item) =>
    item.fixtureId === 'small_transcript_hero_track')!)
  staleMedia.mediaEvidence[0]!.artifactRef.contentHash = 'a'.repeat(64)
  expectThrow(() => parseCaptionPrivateQualificationFixtureResult(staleMedia))

  const fakeInspection = structuredClone(report.fixtureResults.find((item) =>
    item.fixtureId === 'persistent_list')!)
  fakeInspection.mediaEvidence[0]!.directVisualInspectionReceiptRef = null
  expectThrow(() => parseCaptionPrivateQualificationFixtureResult(fakeInspection))

  const contractAsRuntime = structuredClone(report.fixtureResults.find((item) =>
    item.fixtureId === 'caption_to_living_frame')!)
  contractAsRuntime.disposition = 'verified_private'
  expectThrow(() => parseCaptionPrivateQualificationFixtureResult(
    contractAsRuntime))

  const ownerDrift = structuredClone(report.fixtureResults.find((item) =>
    item.fixtureId === 'text_behind_subject')!)
  ownerDrift.ownerIds = ['captions', 'caption_private_tracker']
  expectThrow(() => parseCaptionPrivateQualificationFixtureResult(ownerDrift))

  const missingBlocker = structuredClone(report.fixtureResults.find((item) =>
    item.fixtureId === 'multilingual')!)
  missingBlocker.blockerCodes = []
  expectThrow(() => parseCaptionPrivateQualificationFixtureResult(missingBlocker))

  const historicalOverclaim = structuredClone(report)
  ;(historicalOverclaim as unknown as Record<string, unknown>).
    historicalEvidenceRelabeledAsFreshRuntime = true
  expectThrow(() => parseCaptionPrivateQualificationReport(
    redigest(historicalOverclaim as unknown as Record<string, unknown>,
      'reportDigestSha256')))

  const runtimeOwnerOverclaim = structuredClone(report)
  ;(runtimeOwnerOverclaim.jobEvidenceSet.jobs[0] as unknown as
    Record<string, unknown>).privateRuntimeOwnedByCaptions = true
  expectThrow(() => parseCaptionPrivateQualificationReport(
    redigest(runtimeOwnerOverclaim as unknown as Record<string, unknown>,
      'reportDigestSha256')))

  const inherited = Object.create(report) as unknown
  expectThrow(() => parseCaptionPrivateQualificationReport(inherited))

  const reorderedVisualOutputs = structuredClone(visualReceipt)
  ;[
    reorderedVisualOutputs.inspectedOutputs[0],
    reorderedVisualOutputs.inspectedOutputs[1],
  ] = [
    reorderedVisualOutputs.inspectedOutputs[1]!,
    reorderedVisualOutputs.inspectedOutputs[0]!,
  ]
  expectThrow(() => parseCaptionPrivateVisualInspectionReceipt(redigest(
    reorderedVisualOutputs as unknown as Record<string, unknown>,
    'receiptDigestSha256')))

  const uninspectedFrame = structuredClone(visualReceipt)
  uninspectedFrame.inspectedOutputs[0]!.inspectedFrames[0]!
    .actualRasterOpenedAndInspected = false as true
  expectThrow(() => parseCaptionPrivateVisualInspectionReceipt(redigest(
    uninspectedFrame as unknown as Record<string, unknown>,
    'receiptDigestSha256')))

  const reorderedMultilingual = structuredClone(multilingualReceipt)
  ;[reorderedMultilingual.outputs[0], reorderedMultilingual.outputs[1]] =
    [reorderedMultilingual.outputs[1]!, reorderedMultilingual.outputs[0]!]
  expectThrow(() => parseCaptionPrivateMultilingualInspectionReceipt(redigest(
    reorderedMultilingual as unknown as Record<string, unknown>,
    'receiptDigestSha256')))

  const browserShapingOverclaim = structuredClone(multilingualReceipt)
  browserShapingOverclaim.remotionBrowserTextShapingClaimed = true as false
  expectThrow(() => parseCaptionPrivateMultilingualInspectionReceipt(redigest(
    browserShapingOverclaim as unknown as Record<string, unknown>,
    'receiptDigestSha256')))

  check(report.fixtureResults.every((item) =>
    new Set(item.evidenceRefs.map((evidenceRef) =>
      `${evidenceRef.id}:${evidenceRef.version}:${evidenceRef.contentHash}`)).size
      === item.evidenceRefs.length),
  'Each fixture must retain exact unique evidence lineage.')

  console.log(JSON.stringify({
    test: 'captions_specialist_cap_18',
    status: 'passed_caption_owned_internal_evidence_ready_for_backend_integration_with_shared_gaps',
    assertions,
    fixtures: report.counts.totalFixtures,
    jobs: report.counts.totalJobs,
    verifiedPrivate: report.counts.verifiedPrivate,
    verifiedContract: report.counts.verifiedContract,
    missingIntegration: report.counts.missingIntegration,
    postRuntimeVerifiedPrivate: postRuntime.counts.verifiedPrivate,
    postRuntimeMissingIntegration: postRuntime.counts.missingIntegration,
    readyForRuntime: true,
    providerRuntimeAuthority: report.providerRuntimeAuthority,
    productionAuthority: report.productionAuthority,
  }, null, 2))
}

const invokedPath = process.argv[1]
if (invokedPath && import.meta.url === pathToFileURL(invokedPath).href) {
  runCap18Smoke()
}
