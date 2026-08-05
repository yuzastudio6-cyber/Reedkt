import { z } from 'zod'
import {
  CANONICAL_PICTURE_LOCK_MANIFEST_VERSION,
  type CanonicalPictureLockManifest,
} from '../../src/types/canonical-picture-lock-manifest'
import { assertClosedContractTree } from '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from '../orchestra/orchestra-skill-contracts'

const safeKey = z.string().min(1).max(240)
  .regex(/^[a-z0-9][a-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({ id: safeKey, version: safeKey, contentHash: sha256 }).strict()
const dependencyCodeSchema = z.enum([
  'timeline', 'source_ranges', 'shot_order', 'shot_durations', 'speed_changes',
  'transitions', 'master_timing', 'confirmed_output_frame', 'crop_reframe',
  'broll_layout', 'living_frame_layout', 'graphics_maps_charts', 'lower_thirds',
  'mask_tracking_anchor', 'occupancy', 'near_final_visual_proxy', 'color_look',
  'source_asset_manifest', 'renderer_plan',
])
const manifestSchema: z.ZodType<CanonicalPictureLockManifest> = z.object({
  schemaVersion: z.literal(CANONICAL_PICTURE_LOCK_MANIFEST_VERSION),
  manifestId: safeKey,
  manifestDigestSha256: sha256,
  canonicalScope: z.object({
    ownerUserId: safeKey,
    workspaceId: safeKey,
    projectId: safeKey,
    editSessionId: safeKey,
    planVersionId: safeKey,
    approvedSnapshotRef: refSchema,
  }).strict(),
  confirmedOutputFrame: z.object({
    outputId: safeKey,
    width: z.number().int().min(320).max(16_384),
    height: z.number().int().min(180).max(16_384),
    aspectRatioNumerator: z.number().int().positive().max(16_384),
    aspectRatioDenominator: z.number().int().positive().max(16_384),
    fpsNumerator: z.number().int().positive().max(240_000),
    fpsDenominator: z.number().int().positive().max(10_000),
    totalFrames: z.number().int().positive().max(24 * 60 * 60 * 240),
    confirmedOutputFrameDigestSha256: sha256,
  }).strict(),
  timelineBindings: z.object({
    timelineVersionRef: refSchema,
    sourceRangesRef: refSchema,
    shotOrderRef: refSchema,
    shotDurationsRef: refSchema,
    speedChangesRef: refSchema,
    transitionsRef: refSchema,
    masterTimingRef: refSchema,
  }).strict(),
  compositionBindings: z.object({
    cropReframeRef: refSchema,
    brollLayoutRef: refSchema,
    livingFrameLayoutRef: refSchema,
    graphicsMapsChartsRef: refSchema,
    lowerThirdsRef: refSchema,
    maskTrackingAnchorRef: refSchema,
    occupancyRef: refSchema,
    nearFinalVisualProxyRef: refSchema,
    colorLookRef: refSchema,
    rendererPlanRef: refSchema,
  }).strict(),
  sourceAssetManifestRef: refSchema,
  lockedSceneIds: z.array(safeKey).min(1).max(10_000),
  lockState: z.enum(['locked', 'locked_with_approved_exceptions']),
  approvedExceptions: z.array(z.object({
    exceptionId: safeKey,
    dependencyCode: dependencyCodeSchema,
    affectedSceneIds: z.array(safeKey).min(1).max(10_000),
    reasonCode: safeKey,
    approvalRef: refSchema,
  }).strict()).max(256),
  lockedAt: z.string().datetime({ offset: true }),
  lockedByRef: refSchema,
  immutable: z.literal(true),
  sharedEditArchitectureOwner: z.literal('canonical_edit_picture_lock'),
  captionOwnsPictureLock: z.literal(false),
  rawChatIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  privateArtifact: z.literal(true),
  publicDeliveryAuthorityClaimed: z.literal(false),
  productionAuthorityClaimed: z.literal(false),
}).strict()

function gcd(left: number, right: number): number {
  let a = left
  let b = right
  while (b !== 0) [a, b] = [b, a % b]
  return a
}

export function parseCanonicalPictureLockManifest(
  value: unknown,
): CanonicalPictureLockManifest {
  assertClosedContractTree(value, 'Canonical PictureLockManifest')
  const parsed = manifestSchema.parse(value)
  const divisor = gcd(parsed.confirmedOutputFrame.width, parsed.confirmedOutputFrame.height)
  if (parsed.confirmedOutputFrame.aspectRatioNumerator
      !== parsed.confirmedOutputFrame.width / divisor
    || parsed.confirmedOutputFrame.aspectRatioDenominator
      !== parsed.confirmedOutputFrame.height / divisor
    || new Set(parsed.lockedSceneIds).size !== parsed.lockedSceneIds.length) {
    throw new Error('Canonical PictureLockManifest frame or scene identity is invalid.')
  }
  const lockedScenes = new Set(parsed.lockedSceneIds)
  const exceptionIds = new Set<string>()
  for (const exception of parsed.approvedExceptions) {
    if (exceptionIds.has(exception.exceptionId)
      || new Set(exception.affectedSceneIds).size !== exception.affectedSceneIds.length
      || exception.affectedSceneIds.some((sceneId) => !lockedScenes.has(sceneId))) {
      throw new Error('Canonical PictureLockManifest exception scope is invalid.')
    }
    exceptionIds.add(exception.exceptionId)
  }
  if ((parsed.lockState === 'locked') !== (parsed.approvedExceptions.length === 0)) {
    throw new Error('Canonical PictureLockManifest exception state is inconsistent.')
  }
  const digest = calculateSkillContractDigest(
    parsed as unknown as Record<string, unknown>,
    'manifestDigestSha256',
  )
  if (digest !== parsed.manifestDigestSha256) {
    throw new Error('Canonical PictureLockManifest digest verification failed.')
  }
  return parsed
}

export function createCanonicalPictureLockManifest(
  input: Omit<CanonicalPictureLockManifest,
    'schemaVersion' | 'manifestDigestSha256'>,
): CanonicalPictureLockManifest {
  assertClosedContractTree(input, 'Canonical PictureLockManifest input')
  const withoutDigest = {
    ...structuredClone(input),
    schemaVersion: CANONICAL_PICTURE_LOCK_MANIFEST_VERSION,
  }
  return parseCanonicalPictureLockManifest({
    ...withoutDigest,
    manifestDigestSha256: calculateSkillContractDigest(
      { ...withoutDigest, manifestDigestSha256: '' },
      'manifestDigestSha256',
    ),
  })
}
