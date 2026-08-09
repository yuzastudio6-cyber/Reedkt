import { createHash } from 'node:crypto'
import { z } from 'zod'

import {
  CAPTION_LEGACY_MIGRATION_PROJECTION_VERSION,
  CAPTION_LEGACY_PLAN_ENVELOPE_VERSION,
  CAPTION_LEGACY_SNAPSHOT_ENVELOPE_VERSION,
  CAPTION_LEGACY_STYLE_IDS,
  CAPTION_MIGRATION_RETIREMENT_RELEASE_VERSION,
  CAPTION_RETIRED_OWNER_IDS,
  CAPTION_RETIREMENT_REGISTRY_VERSION,
  CAPTION_ROLLBACK_MANIFEST_VERSION,
  type CaptionLegacyMigrationProjection,
  type CaptionLegacyPlanEnvelope,
  type CaptionLegacySnapshotEnvelope,
  type CaptionLegacyStableOverlayRoute,
  type CaptionMigrationRetirementRelease,
  type CaptionRetiredOwnerId,
  type CaptionRetirementEntry,
  type CaptionRetirementRegistry,
  type CaptionRollbackManifest,
} from '../../src/types/caption-migration-retirement'
import type { CaptionDomainRef } from '../../src/types/caption-domain-contracts'
import type {
  CaptionLegacyStyleAdapter,
  CaptionLegacyStyleId,
} from '../../src/types/caption-semantic-style'
import {
  CAPTION_DESIGN_COMPOSITE,
  CAPTION_MINI_SKILL_IDS,
} from './caption-design-composite'
import {
  adaptLegacyCaptionStyle,
  parseCaptionLegacyStyleAdapter,
} from './caption-semantic-style'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'

const safeKey = z.string().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const scopeSchema = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  legacyPlanVersionId: safeKey,
}).strict()

const planEnvelopeSchema = z.object({
  schemaVersion: z.literal(CAPTION_LEGACY_PLAN_ENVELOPE_VERSION),
  envelopeId: safeKey,
  envelopeDigestSha256: sha256,
  canonicalScope: scopeSchema,
  sourcePlanRecordRef: refSchema,
  captionNeeded: z.boolean(),
  legacySkillIds: z.array(safeKey).max(32),
  legacyStyleId: safeKey.nullable(),
  customStyleApprovalRef: refSchema.nullable(),
  placementClass: z.enum([
    'bottom_safe', 'middle_safe', 'top_safe', 'lower_third', 'side_panel',
    'custom',
  ]),
  maxLines: z.number().int().min(1).max(3),
  keywordEmphasis: z.boolean(),
  faceSafe: z.boolean(),
  animationClass: z.enum([
    'none', 'fade', 'simple_pop', 'word_highlight', 'custom',
  ]),
  sourcePlanImmutable: z.literal(true),
  rawChatIncluded: z.literal(false),
  rawTranscriptIncluded: z.literal(false),
  mediaBytesIncluded: z.literal(false),
  pathsOrUrlsIncluded: z.literal(false),
}).strict()

const snapshotEnvelopeSchema = z.object({
  schemaVersion: z.literal(CAPTION_LEGACY_SNAPSHOT_ENVELOPE_VERSION),
  envelopeId: safeKey,
  envelopeDigestSha256: sha256,
  canonicalScope: scopeSchema,
  legacyPlanEnvelopeRef: refSchema,
  legacyApprovedSnapshotRef: refSchema,
  currentApprovedSnapshotRef: refSchema.nullable(),
  currentConfirmedOutputFrameRef: refSchema.nullable(),
  currentMasterTimingRef: refSchema.nullable(),
  exactTenantScopeRereadVerified: z.boolean(),
  exactCurrentSnapshotRereadVerified: z.boolean(),
  legacySnapshotImmutable: z.literal(true),
  currentSnapshotMutationAllowed: z.literal(false),
  browserLocalAuthorityAccepted: z.literal(false),
}).strict()

const stableOverlayRouteSchema = z.object({
  routeId: z.literal('caption_legacy_simple_stable_overlay_v1'),
  rendererOperationId:
    z.literal('tool.libass.render_approved_caption_track.v1'),
  packageOperationId:
    z.literal('tool.ffmpeg.execute_approved_media_recipe.v1'),
  outputKinds: z.tuple([
    z.literal('srt'), z.literal('webvtt'), z.literal('ass'),
    z.literal('stable_burn_in'),
  ]),
  oneStableTopLayerTrackOnly: z.literal(true),
  intentionalOcclusionDisabled: z.literal(true),
  crossSystemTransformsDisabled: z.literal(true),
  canvasPolicy: z.literal('exact_confirmed_output_frame_only'),
  fixed1080x1920CanvasAccepted: z.literal(false),
  approvedFontRegistryRequired: z.literal(true),
  mutableSystemFontAuthorityAccepted: z.literal(false),
  basicWorkerCreativeDecisionsAccepted: z.literal(false),
  finalCanvasOwner: z.literal('remotion'),
}).strict()

const projectionSchema = z.object({
  schemaVersion: z.literal(CAPTION_LEGACY_MIGRATION_PROJECTION_VERSION),
  projectionId: safeKey,
  projectionDigestSha256: sha256,
  canonicalScope: scopeSchema,
  sourcePlanEnvelopeRef: refSchema,
  sourceSnapshotEnvelopeRef: refSchema.nullable(),
  disposition: z.enum([
    'decoded_read_only_requires_current_authority',
    'decoded_current_simple_overlay_candidate',
    'decoded_no_captions_restraint',
    'blocked_custom_style_requires_approval',
  ]),
  canonicalSpecialistKey: z.literal('captions'),
  compositeSkillId: z.literal('caption_design').nullable(),
  restraintSkillId: z.literal('no_captions').nullable(),
  appliedLegacySkillIds: z.array(safeKey).max(32),
  mappedComponentSkillIds: z.array(safeKey).max(64),
  sourceLegacyStyleIdDigestSha256: sha256.nullable(),
  legacyStyleAdapter: z.unknown().nullable(),
  stableOverlayRoute: stableOverlayRouteSchema.nullable(),
  currentAuthority: z.object({
    currentApprovedSnapshotRef: refSchema.nullable(),
    currentConfirmedOutputFrameRef: refSchema.nullable(),
    currentMasterTimingRef: refSchema.nullable(),
    exactTenantScopeRereadVerified: z.boolean(),
    exactCurrentSnapshotRereadVerified: z.boolean(),
  }).strict(),
  syntheticTimingDisposition: z.literal('blocking_preview_only'),
  syntheticFinalWordMotionAllowed: z.literal(false),
  directQwenCaptionOwnerAllowed: z.literal(false),
  directCaptionSamAllowed: z.literal(false),
  directPeerExecutionAllowed: z.literal(false),
  requiresFreshPlanEstimateAndApproval: z.literal(true),
  executionReady: z.literal(false),
  operationDispatchAuthority: z.literal(false),
  providerRuntimeAuthority: z.literal(false),
  assetMutationAuthority: z.literal(false),
  creditOrBillingAuthority: z.literal(false),
  finalQaApprovalAuthority: z.literal(false),
  publicDeliveryAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

const retirementEntrySchema = z.object({
  retiredOwnerId: z.enum(CAPTION_RETIRED_OWNER_IDS),
  historicalImplementationIds: z.array(safeKey).min(1).max(16),
  disposition: z.enum(['retired_historical_read_only', 'prohibited']),
  replacementOwnerKey: z.enum([
    'captions', 'visual_intelligence', 'track_all', 'story_timing',
    'confirmed_frame_owner', 'canonical_font_runtime',
  ]),
  historicalReadAllowed: z.literal(true),
  freshWorkAllowed: z.literal(false),
  rollbackMayReactivateOwner: z.literal(false),
  evidenceRefs: z.array(refSchema).min(1).max(32),
}).strict()

const retirementRegistrySchema = z.object({
  schemaVersion: z.literal(CAPTION_RETIREMENT_REGISTRY_VERSION),
  registryId: safeKey,
  registryDigestSha256: sha256,
  entries: z.array(retirementEntrySchema).length(
    CAPTION_RETIRED_OWNER_IDS.length),
  exactRetiredOwnerCoverage: z.literal(true),
  captionSpecialistImportsRetiredImplementation: z.literal(false),
  destructiveCodeDeletionPerformed: z.literal(false),
  historicalReadabilityPreserved: z.literal(true),
  productionAuthority: z.literal(false),
}).strict()

const rollbackManifestSchema = z.object({
  schemaVersion: z.literal(CAPTION_ROLLBACK_MANIFEST_VERSION),
  manifestId: safeKey,
  manifestDigestSha256: sha256,
  sourceReleaseRef: refSchema,
  rollbackTarget: z.literal('legacy_simple_stable_overlay'),
  stableOverlayRoute: stableOverlayRouteSchema,
  permittedLegacyStyleIds: z.tuple([
    z.literal('clean_subtitle'),
    z.literal('minimal_accessibility_captions'),
  ]),
  activationRequirements: z.tuple([
    z.literal('fresh_plan'), z.literal('fresh_estimate'),
    z.literal('user_approval'), z.literal('immutable_current_snapshot'),
    z.literal('exact_confirmed_output_frame'),
    z.literal('current_master_timing'), z.literal('approved_font_pack'),
    z.literal('deterministic_caption_qa'),
    z.literal('direct_visual_inspection'), z.literal('private_review'),
  ]),
  automaticRollbackAllowed: z.literal(false),
  priorApprovedSnapshotMutated: z.literal(false),
  directQwenOrSamReactivated: z.literal(false),
  fixedCanvasOrSystemFontReactivated: z.literal(false),
  syntheticFinalTimingReactivated: z.literal(false),
  operationDispatchAuthority: z.literal(false),
  creditOrBillingAuthority: z.literal(false),
  publicDeliveryAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

const releaseSchema = z.object({
  schemaVersion: z.literal(CAPTION_MIGRATION_RETIREMENT_RELEASE_VERSION),
  releaseId: safeKey,
  releaseDigestSha256: sha256,
  sourceCaptionPrivateQualificationRef: refSchema,
  captionCompositeRef: refSchema,
  legacySkillMappings: z.array(z.unknown()).length(
    CAPTION_DESIGN_COMPOSITE.legacyMappings.length),
  legacyStyleIds: z.array(z.enum(CAPTION_LEGACY_STYLE_IDS)).length(
    CAPTION_LEGACY_STYLE_IDS.length),
  retirementRegistry: retirementRegistrySchema,
  rollbackManifest: rollbackManifestSchema,
  oldPlanAndSnapshotDecodersPublished: z.literal(true),
  simpleOverlayCompatibilityPreserved: z.literal(true),
  branchRetirementDocumented: z.literal(true),
  noCentralOrchestraImplemented: z.literal(true),
  providerOrModelRuntimeAuthority: z.literal(false),
  operationDispatchAuthority: z.literal(false),
  creditOrBillingAuthority: z.literal(false),
  publicDeliveryAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

const RETIREMENT_EXPECTATIONS: Record<CaptionRetiredOwnerId, {
  historicalImplementationIds: readonly string[]
  disposition: CaptionRetirementEntry['disposition']
  replacementOwnerKey: CaptionRetirementEntry['replacementOwnerKey']
}> = {
  flat_captions_primary_owner: {
    historicalImplementationIds: ['captions.legacy.flat.skill.registry'],
    disposition: 'retired_historical_read_only',
    replacementOwnerKey: 'captions',
  },
  direct_qwen_caption_owner: {
    historicalImplementationIds: [
      'edit_reference_qwen_caption_design_adapter',
      'reeditpro_reviewed_local_qwen25vl_mlx_caption_design',
    ],
    disposition: 'retired_historical_read_only',
    replacementOwnerKey: 'visual_intelligence',
  },
  basic_caption_worker_creative_owner: {
    historicalImplementationIds: [
      'server.workers.captions.caption_execution_runner',
    ],
    disposition: 'retired_historical_read_only',
    replacementOwnerKey: 'captions',
  },
  fixed_ass_canvas_authority: {
    historicalImplementationIds: [
      'server.workers.captions.ass_caption_builder',
    ],
    disposition: 'retired_historical_read_only',
    replacementOwnerKey: 'confirmed_frame_owner',
  },
  mutable_system_font_authority: {
    historicalImplementationIds: [
      'server.workers.captions.caption_style_policy',
    ],
    disposition: 'retired_historical_read_only',
    replacementOwnerKey: 'canonical_font_runtime',
  },
  synthetic_final_word_motion_authority: {
    historicalImplementationIds: ['captions.synthetic.word.motion'],
    disposition: 'prohibited',
    replacementOwnerKey: 'story_timing',
  },
  direct_caption_sam_authority: {
    historicalImplementationIds: [
      'captions.direct.sam2', 'captions.direct.sam3_1',
    ],
    disposition: 'prohibited',
    replacementOwnerKey: 'track_all',
  },
}

const STABLE_OVERLAY_ROUTE: CaptionLegacyStableOverlayRoute = Object.freeze({
  routeId: 'caption_legacy_simple_stable_overlay_v1',
  rendererOperationId: 'tool.libass.render_approved_caption_track.v1',
  packageOperationId: 'tool.ffmpeg.execute_approved_media_recipe.v1',
  outputKinds: ['srt', 'webvtt', 'ass', 'stable_burn_in'] as [
    'srt', 'webvtt', 'ass', 'stable_burn_in',
  ],
  oneStableTopLayerTrackOnly: true,
  intentionalOcclusionDisabled: true,
  crossSystemTransformsDisabled: true,
  canvasPolicy: 'exact_confirmed_output_frame_only',
  fixed1080x1920CanvasAccepted: false,
  approvedFontRegistryRequired: true,
  mutableSystemFontAuthorityAccepted: false,
  basicWorkerCreativeDecisionsAccepted: false,
  finalCanvasOwner: 'remotion',
})

export function createCaptionLegacyPlanEnvelope(
  input: Omit<CaptionLegacyPlanEnvelope,
    'schemaVersion' | 'envelopeDigestSha256'>,
): CaptionLegacyPlanEnvelope {
  assertClosedContractTree(input, 'Caption legacy plan envelope input')
  return parseCaptionLegacyPlanEnvelope(withDigest({
    schemaVersion: CAPTION_LEGACY_PLAN_ENVELOPE_VERSION,
    ...structuredClone(input),
  }, 'envelopeDigestSha256'))
}

export function parseCaptionLegacyPlanEnvelope(
  value: unknown,
): CaptionLegacyPlanEnvelope {
  assertClosedContractTree(value, 'Caption legacy plan envelope')
  const envelope = planEnvelopeSchema.parse(value)
  verifyDigest(envelope as Record<string, unknown>,
    'envelopeDigestSha256', 'Caption legacy plan envelope')
  const skillIds = new Set(envelope.legacySkillIds)
  const knownSkillIds = new Set(CAPTION_DESIGN_COMPOSITE.legacyMappings.map(
    (mapping) => mapping.legacySkillId))
  const noCaptionSkill = 'captions.no_caption_policy'
  const styleIsKnown = envelope.legacyStyleId !== null
    && CAPTION_LEGACY_STYLE_IDS.includes(
      envelope.legacyStyleId as CaptionLegacyStyleId)
  const customLikeStyle = envelope.legacyStyleId !== null
    && (!styleIsKnown || envelope.legacyStyleId === 'custom')
  if (skillIds.size !== envelope.legacySkillIds.length
    || envelope.legacySkillIds.some((id) => !knownSkillIds.has(id))
    || (envelope.captionNeeded
      && (envelope.legacyStyleId === null || skillIds.has(noCaptionSkill)))
    || (!envelope.captionNeeded
      && envelope.legacySkillIds.some((id) => id !== noCaptionSkill))
    || (envelope.customStyleApprovalRef !== null
      && (!customLikeStyle || envelope.customStyleApprovalRef.version
        !== 'caption-custom-style-approval-v1'))) {
    throw new Error('Caption legacy plan semantics are inconsistent.')
  }
  return structuredClone(envelope)
}

export function createCaptionLegacySnapshotEnvelope(
  input: Omit<CaptionLegacySnapshotEnvelope,
    'schemaVersion' | 'envelopeDigestSha256'>,
): CaptionLegacySnapshotEnvelope {
  assertClosedContractTree(input, 'Caption legacy snapshot envelope input')
  return parseCaptionLegacySnapshotEnvelope(withDigest({
    schemaVersion: CAPTION_LEGACY_SNAPSHOT_ENVELOPE_VERSION,
    ...structuredClone(input),
  }, 'envelopeDigestSha256'))
}

export function parseCaptionLegacySnapshotEnvelope(
  value: unknown,
): CaptionLegacySnapshotEnvelope {
  assertClosedContractTree(value, 'Caption legacy snapshot envelope')
  const envelope = snapshotEnvelopeSchema.parse(value)
  verifyDigest(envelope as Record<string, unknown>,
    'envelopeDigestSha256', 'Caption legacy snapshot envelope')
  const currentRefs = [envelope.currentApprovedSnapshotRef,
    envelope.currentConfirmedOutputFrameRef, envelope.currentMasterTimingRef]
  const complete = currentRefs.every((item) => item !== null)
    && envelope.exactTenantScopeRereadVerified
    && envelope.exactCurrentSnapshotRereadVerified
  if (envelope.legacyPlanEnvelopeRef.version
      !== CAPTION_LEGACY_PLAN_ENVELOPE_VERSION
    || (envelope.exactCurrentSnapshotRereadVerified && !complete)
    || (envelope.exactTenantScopeRereadVerified && !complete)) {
    throw new Error('Caption legacy snapshot authority is inconsistent.')
  }
  return structuredClone(envelope)
}

export function decodeLegacyCaptionPlan(input: {
  projectionId: string
  planEnvelope: unknown
  snapshotEnvelope?: unknown
}): CaptionLegacyMigrationProjection {
  assertClosedContractTree(input, 'Caption legacy migration input')
  const plan = parseCaptionLegacyPlanEnvelope(input.planEnvelope)
  const snapshot = input.snapshotEnvelope === undefined
    ? null : parseCaptionLegacySnapshotEnvelope(input.snapshotEnvelope)
  const planRef = envelopeRef(plan)
  if (snapshot && (!sameScope(plan.canonicalScope, snapshot.canonicalScope)
    || !sameRef(planRef, snapshot.legacyPlanEnvelopeRef))) {
    throw new Error('Caption legacy plan/snapshot lineage is stale.')
  }
  const appliedMappings = plan.legacySkillIds.map((id) =>
    CAPTION_DESIGN_COMPOSITE.legacyMappings.find((mapping) =>
      mapping.legacySkillId === id)!)
  const mapped = new Set(appliedMappings.flatMap((mapping) =>
    mapping.componentSkillIds))
  const mappedComponentSkillIds = CAPTION_MINI_SKILL_IDS.filter((id) =>
    mapped.has(id))
  const currentAuthority = snapshot ? {
    currentApprovedSnapshotRef: snapshot.currentApprovedSnapshotRef,
    currentConfirmedOutputFrameRef: snapshot.currentConfirmedOutputFrameRef,
    currentMasterTimingRef: snapshot.currentMasterTimingRef,
    exactTenantScopeRereadVerified: snapshot.exactTenantScopeRereadVerified,
    exactCurrentSnapshotRereadVerified:
      snapshot.exactCurrentSnapshotRereadVerified,
  } : {
    currentApprovedSnapshotRef: null,
    currentConfirmedOutputFrameRef: null,
    currentMasterTimingRef: null,
    exactTenantScopeRereadVerified: false,
    exactCurrentSnapshotRereadVerified: false,
  }
  const currentAuthorityComplete = Object.values(currentAuthority)
    .every((value) => value !== null && value !== false)
  const styleAdapter = plan.captionNeeded
    ? adaptPlanStyle(plan) : null
  const blockedStyle = styleAdapter?.disposition
    === 'blocked_custom_style_requires_approval'
  const disposition: CaptionLegacyMigrationProjection['disposition'] =
    !plan.captionNeeded
      ? 'decoded_no_captions_restraint'
      : blockedStyle
        ? 'blocked_custom_style_requires_approval'
        : currentAuthorityComplete
          ? 'decoded_current_simple_overlay_candidate'
          : 'decoded_read_only_requires_current_authority'
  const withoutDigest: Omit<CaptionLegacyMigrationProjection,
    'projectionDigestSha256'> = {
    schemaVersion: CAPTION_LEGACY_MIGRATION_PROJECTION_VERSION,
    projectionId: safeKey.parse(input.projectionId),
    canonicalScope: structuredClone(plan.canonicalScope),
    sourcePlanEnvelopeRef: planRef,
    sourceSnapshotEnvelopeRef: snapshot ? envelopeRef(snapshot) : null,
    disposition,
    canonicalSpecialistKey: 'captions',
    compositeSkillId: plan.captionNeeded ? 'caption_design' : null,
    restraintSkillId: plan.captionNeeded ? null : 'no_captions',
    appliedLegacySkillIds: [...plan.legacySkillIds],
    mappedComponentSkillIds: plan.captionNeeded
      ? mappedComponentSkillIds : ['caption_restraint'],
    sourceLegacyStyleIdDigestSha256: plan.legacyStyleId === null
      ? null : hashText(plan.legacyStyleId),
    legacyStyleAdapter: styleAdapter,
    stableOverlayRoute: plan.captionNeeded && !blockedStyle
      ? structuredClone(STABLE_OVERLAY_ROUTE) : null,
    currentAuthority,
    syntheticTimingDisposition: 'blocking_preview_only',
    syntheticFinalWordMotionAllowed: false,
    directQwenCaptionOwnerAllowed: false,
    directCaptionSamAllowed: false,
    directPeerExecutionAllowed: false,
    requiresFreshPlanEstimateAndApproval: true,
    executionReady: false,
    operationDispatchAuthority: false,
    providerRuntimeAuthority: false,
    assetMutationAuthority: false,
    creditOrBillingAuthority: false,
    finalQaApprovalAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  }
  return parseCaptionLegacyMigrationProjection(withDigest(withoutDigest,
    'projectionDigestSha256'))
}

export function parseCaptionLegacyMigrationProjection(
  value: unknown,
): CaptionLegacyMigrationProjection {
  assertClosedContractTree(value, 'Caption legacy migration projection')
  const parsed = projectionSchema.parse(value)
  verifyDigest(parsed as Record<string, unknown>,
    'projectionDigestSha256', 'Caption legacy migration projection')
  const styleAdapter = parsed.legacyStyleAdapter === null
    ? null : parseCaptionLegacyStyleAdapter(parsed.legacyStyleAdapter)
  const knownMappings = new Map(CAPTION_DESIGN_COMPOSITE.legacyMappings.map(
    (mapping) => [mapping.legacySkillId, mapping]))
  const appliedMappings = parsed.appliedLegacySkillIds.map((id) =>
    knownMappings.get(id))
  const expectedMappedSet = new Set(appliedMappings.flatMap((mapping) =>
    mapping?.componentSkillIds ?? []))
  const expectedMappedComponentIds = CAPTION_MINI_SKILL_IDS.filter((id) =>
    expectedMappedSet.has(id))
  const exactMappedOrder = parsed.mappedComponentSkillIds.every((id, index) => {
    if (id === 'caption_restraint') {
      return parsed.mappedComponentSkillIds.length === 1
    }
    const currentIndex = CAPTION_MINI_SKILL_IDS.indexOf(id)
    const priorId = parsed.mappedComponentSkillIds[index - 1]
    const priorIndex = priorId === undefined
      ? -1 : CAPTION_MINI_SKILL_IDS.indexOf(priorId)
    return currentIndex >= 0 && currentIndex > priorIndex
  })
  const currentComplete = parsed.currentAuthority.currentApprovedSnapshotRef !== null
    && parsed.currentAuthority.currentConfirmedOutputFrameRef !== null
    && parsed.currentAuthority.currentMasterTimingRef !== null
    && parsed.currentAuthority.exactTenantScopeRereadVerified
    && parsed.currentAuthority.exactCurrentSnapshotRereadVerified
  const captionCandidate = parsed.compositeSkillId === 'caption_design'
    && parsed.restraintSkillId === null
  const noCaptions = parsed.disposition === 'decoded_no_captions_restraint'
  const exactAppliedMapping = appliedMappings.every((mapping) =>
    mapping !== undefined)
    && (noCaptions
      ? parsed.appliedLegacySkillIds.every((id) =>
        id === 'captions.no_caption_policy')
        && parsed.mappedComponentSkillIds.join('|') === 'caption_restraint'
      : !parsed.appliedLegacySkillIds.includes('captions.no_caption_policy')
        && parsed.mappedComponentSkillIds.join('|')
          === expectedMappedComponentIds.join('|'))
  const exactSourceRefVersions = parsed.sourcePlanEnvelopeRef.version
      === CAPTION_LEGACY_PLAN_ENVELOPE_VERSION
    && (parsed.sourceSnapshotEnvelopeRef === null
      || parsed.sourceSnapshotEnvelopeRef.version
        === CAPTION_LEGACY_SNAPSHOT_ENVELOPE_VERSION)
    && (parsed.sourceSnapshotEnvelopeRef !== null || !currentComplete)
  if (!exactMappedOrder || !exactAppliedMapping || !exactSourceRefVersions
    || new Set(parsed.appliedLegacySkillIds).size
      !== parsed.appliedLegacySkillIds.length
    || new Set(parsed.mappedComponentSkillIds).size
      !== parsed.mappedComponentSkillIds.length
    || (parsed.disposition === 'decoded_no_captions_restraint'
      && (parsed.compositeSkillId !== null
        || parsed.restraintSkillId !== 'no_captions'
        || parsed.stableOverlayRoute !== null || styleAdapter !== null
        || parsed.sourceLegacyStyleIdDigestSha256 !== null))
    || (parsed.disposition === 'blocked_custom_style_requires_approval'
      && (!captionCandidate || styleAdapter?.disposition
        !== 'blocked_custom_style_requires_approval'
        || parsed.sourceLegacyStyleIdDigestSha256 === null
        || parsed.stableOverlayRoute !== null))
    || (parsed.disposition === 'decoded_current_simple_overlay_candidate'
      && (!captionCandidate || !currentComplete
        || parsed.stableOverlayRoute === null
        || parsed.sourceLegacyStyleIdDigestSha256 === null
        || styleAdapter?.disposition !== 'adapted'))
    || (parsed.disposition === 'decoded_read_only_requires_current_authority'
      && (!captionCandidate || currentComplete
        || parsed.stableOverlayRoute === null
        || parsed.sourceLegacyStyleIdDigestSha256 === null
        || styleAdapter?.disposition !== 'adapted'))) {
    throw new Error('Caption legacy migration semantics are inconsistent.')
  }
  return structuredClone({
    ...parsed,
    legacyStyleAdapter: styleAdapter,
  }) as CaptionLegacyMigrationProjection
}

export function parseCaptionRetirementRegistry(
  value: unknown,
): CaptionRetirementRegistry {
  assertClosedContractTree(value, 'Caption retirement registry')
  const registry = retirementRegistrySchema.parse(value)
  verifyDigest(registry as Record<string, unknown>,
    'registryDigestSha256', 'Caption retirement registry')
  if (registry.entries.map((entry) => entry.retiredOwnerId).join('|')
      !== CAPTION_RETIRED_OWNER_IDS.join('|')
    || registry.entries.some((entry) => {
      const expected = RETIREMENT_EXPECTATIONS[entry.retiredOwnerId]
      return entry.historicalImplementationIds.join('|')
          !== expected.historicalImplementationIds.join('|')
        || entry.disposition !== expected.disposition
        || entry.replacementOwnerKey !== expected.replacementOwnerKey
        || new Set(entry.historicalImplementationIds).size
          !== entry.historicalImplementationIds.length
        || new Set(entry.evidenceRefs.map(refKey)).size
          !== entry.evidenceRefs.length
    })) {
    throw new Error('Caption retirement coverage is incomplete.')
  }
  return structuredClone(registry)
}

export function parseCaptionRollbackManifest(
  value: unknown,
): CaptionRollbackManifest {
  assertClosedContractTree(value, 'Caption rollback manifest')
  const manifest = rollbackManifestSchema.parse(value)
  verifyDigest(manifest as Record<string, unknown>,
    'manifestDigestSha256', 'Caption rollback manifest')
  return structuredClone(manifest)
}

export function parseCaptionMigrationRetirementRelease(
  value: unknown,
): CaptionMigrationRetirementRelease {
  assertClosedContractTree(value, 'Caption migration retirement release')
  const parsed = releaseSchema.parse(value)
  verifyDigest(parsed as Record<string, unknown>,
    'releaseDigestSha256', 'Caption migration retirement release')
  const registry = parseCaptionRetirementRegistry(parsed.retirementRegistry)
  const rollback = parseCaptionRollbackManifest(parsed.rollbackManifest)
  if (JSON.stringify(parsed.legacySkillMappings)
      !== JSON.stringify(CAPTION_DESIGN_COMPOSITE.legacyMappings)
    || parsed.legacyStyleIds.join('|') !== CAPTION_LEGACY_STYLE_IDS.join('|')
    || !sameRef(parsed.captionCompositeRef, compositeRef())
    || !sameRef(rollback.sourceReleaseRef,
      parsed.sourceCaptionPrivateQualificationRef)) {
    throw new Error('Caption migration release lineage is inconsistent.')
  }
  return structuredClone({
    ...parsed,
    legacySkillMappings: structuredClone(
      CAPTION_DESIGN_COMPOSITE.legacyMappings),
    retirementRegistry: registry,
    rollbackManifest: rollback,
  }) as CaptionMigrationRetirementRelease
}

const privateQualificationRef: CaptionDomainRef = {
  id: 'captions.private.qualification.cap18.post-runtime',
  version: 'caption-private-qualification-report-v1',
  contentHash:
    '7fe4aa4266d45ddd1cf689e0bc7fbc83b19ace28230fd079c25afe27fe26649e',
}

const generalEvidenceRefs: CaptionDomainRef[] = [privateQualificationRef,
  compositeRef(), {
    id: 'captions.font.runtime.qualification.cap05',
    version: 'caption-font-runtime-qualification-v1',
    contentHash: hashText('captions.font.runtime.qualification.cap05.cap18'),
  }]

function retirementEntry(
  retiredOwnerId: CaptionRetiredOwnerId,
  historicalImplementationIds: string[],
  disposition: CaptionRetirementEntry['disposition'],
  replacementOwnerKey: CaptionRetirementEntry['replacementOwnerKey'],
): CaptionRetirementEntry {
  return {
    retiredOwnerId,
    historicalImplementationIds,
    disposition,
    replacementOwnerKey,
    historicalReadAllowed: true,
    freshWorkAllowed: false,
    rollbackMayReactivateOwner: false,
    evidenceRefs: structuredClone(generalEvidenceRefs),
  }
}

const retirementRegistryWithoutDigest: Omit<CaptionRetirementRegistry,
  'registryDigestSha256'> = {
  schemaVersion: CAPTION_RETIREMENT_REGISTRY_VERSION,
  registryId: 'captions.migration.retirement.registry.cap19',
  entries: CAPTION_RETIRED_OWNER_IDS.map((id) => {
    const expected = RETIREMENT_EXPECTATIONS[id]
    return retirementEntry(id, [...expected.historicalImplementationIds],
      expected.disposition, expected.replacementOwnerKey)
  }),
  exactRetiredOwnerCoverage: true,
  captionSpecialistImportsRetiredImplementation: false,
  destructiveCodeDeletionPerformed: false,
  historicalReadabilityPreserved: true,
  productionAuthority: false,
}

export const CAPTION_RETIREMENT_REGISTRY =
  parseCaptionRetirementRegistry(withDigest(
    retirementRegistryWithoutDigest, 'registryDigestSha256'))

const rollbackWithoutDigest: Omit<CaptionRollbackManifest,
  'manifestDigestSha256'> = {
  schemaVersion: CAPTION_ROLLBACK_MANIFEST_VERSION,
  manifestId: 'captions.migration.rollback.cap19',
  sourceReleaseRef: privateQualificationRef,
  rollbackTarget: 'legacy_simple_stable_overlay',
  stableOverlayRoute: structuredClone(STABLE_OVERLAY_ROUTE),
  permittedLegacyStyleIds: [
    'clean_subtitle', 'minimal_accessibility_captions',
  ],
  activationRequirements: [
    'fresh_plan', 'fresh_estimate', 'user_approval',
    'immutable_current_snapshot', 'exact_confirmed_output_frame',
    'current_master_timing', 'approved_font_pack',
    'deterministic_caption_qa', 'direct_visual_inspection', 'private_review',
  ],
  automaticRollbackAllowed: false,
  priorApprovedSnapshotMutated: false,
  directQwenOrSamReactivated: false,
  fixedCanvasOrSystemFontReactivated: false,
  syntheticFinalTimingReactivated: false,
  operationDispatchAuthority: false,
  creditOrBillingAuthority: false,
  publicDeliveryAuthority: false,
  productionAuthority: false,
}

export const CAPTION_ROLLBACK_MANIFEST = parseCaptionRollbackManifest(
  withDigest(rollbackWithoutDigest, 'manifestDigestSha256'))

const releaseWithoutDigest: Omit<CaptionMigrationRetirementRelease,
  'releaseDigestSha256'> = {
  schemaVersion: CAPTION_MIGRATION_RETIREMENT_RELEASE_VERSION,
  releaseId: 'captions.migration.retirement.release.cap19',
  sourceCaptionPrivateQualificationRef: privateQualificationRef,
  captionCompositeRef: compositeRef(),
  legacySkillMappings: structuredClone(CAPTION_DESIGN_COMPOSITE.legacyMappings),
  legacyStyleIds: [...CAPTION_LEGACY_STYLE_IDS],
  retirementRegistry: CAPTION_RETIREMENT_REGISTRY,
  rollbackManifest: CAPTION_ROLLBACK_MANIFEST,
  oldPlanAndSnapshotDecodersPublished: true,
  simpleOverlayCompatibilityPreserved: true,
  branchRetirementDocumented: true,
  noCentralOrchestraImplemented: true,
  providerOrModelRuntimeAuthority: false,
  operationDispatchAuthority: false,
  creditOrBillingAuthority: false,
  publicDeliveryAuthority: false,
  productionAuthority: false,
}

export const CAPTION_MIGRATION_RETIREMENT_RELEASE =
  parseCaptionMigrationRetirementRelease(withDigest(
    releaseWithoutDigest, 'releaseDigestSha256'))

function adaptPlanStyle(
  plan: CaptionLegacyPlanEnvelope,
): CaptionLegacyStyleAdapter {
  const sourceStyle = plan.legacyStyleId!
  const known = CAPTION_LEGACY_STYLE_IDS.includes(
    sourceStyle as CaptionLegacyStyleId)
  return adaptLegacyCaptionStyle({
    adapterId: `${plan.envelopeId}.style`,
    legacyStyleId: known ? sourceStyle as CaptionLegacyStyleId : 'custom',
    ...(plan.customStyleApprovalRef
      ? { customStyleApprovalRef: plan.customStyleApprovalRef } : {}),
  })
}

function compositeRef(): CaptionDomainRef {
  return {
    id: CAPTION_DESIGN_COMPOSITE.compositeId,
    version: CAPTION_DESIGN_COMPOSITE.compositeVersion,
    contentHash: CAPTION_DESIGN_COMPOSITE.compositeDigestSha256,
  }
}

function envelopeRef(value: CaptionLegacyPlanEnvelope
  | CaptionLegacySnapshotEnvelope): CaptionDomainRef {
  return {
    id: value.envelopeId,
    version: value.schemaVersion,
    contentHash: value.envelopeDigestSha256,
  }
}

function sameScope(
  left: CaptionLegacyPlanEnvelope['canonicalScope'],
  right: CaptionLegacyPlanEnvelope['canonicalScope'],
): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function sameRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return refKey(left) === refKey(right)
}

function refKey(ref: CaptionDomainRef): string {
  return `${ref.id}:${ref.version}:${ref.contentHash}`
}

function hashText(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function withDigest<T extends Record<string, unknown>>(
  value: T,
  field: string,
): T & Record<string, string> {
  return {
    ...value,
    [field]: calculateSkillContractDigest({ ...value, [field]: '' }, field),
  }
}

function verifyDigest(
  value: Record<string, unknown>,
  field: string,
  label: string,
): void {
  if (calculateSkillContractDigest(value, field) !== value[field]) {
    throw new Error(`${label} digest verification failed.`)
  }
}
