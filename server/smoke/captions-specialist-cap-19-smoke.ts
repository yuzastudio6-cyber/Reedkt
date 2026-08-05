import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import {
  CAPTION_MIGRATION_RETIREMENT_RELEASE,
  CAPTION_RETIREMENT_REGISTRY,
  CAPTION_ROLLBACK_MANIFEST,
  createCaptionLegacyPlanEnvelope,
  createCaptionLegacySnapshotEnvelope,
  decodeLegacyCaptionPlan,
  parseCaptionLegacyMigrationProjection,
  parseCaptionLegacyPlanEnvelope,
  parseCaptionLegacySnapshotEnvelope,
  parseCaptionMigrationRetirementRelease,
  parseCaptionRetirementRegistry,
  parseCaptionRollbackManifest,
} from '../captions-specialist/caption-migration-retirement'
import {
  CAPTION_DESIGN_COMPOSITE,
  CAPTION_MINI_SKILL_IDS,
} from '../captions-specialist/caption-design-composite'
import {
  calculateSkillContractDigest,
} from '../orchestra/orchestra-skill-contracts'
import {
  getReEditProModelRoleContract,
} from '../../src/lib/model-role-routing-contract'
import {
  CAPTION_LEGACY_PLAN_ENVELOPE_VERSION,
  CAPTION_LEGACY_SNAPSHOT_ENVELOPE_VERSION,
  CAPTION_LEGACY_STYLE_IDS,
  CAPTION_RETIRED_OWNER_IDS,
  type CaptionLegacyPlanEnvelope,
} from '../../src/types/caption-migration-retirement'
import type {
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'

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
function ref(id: string, version = `${id}.v1`): CaptionDomainRef {
  return { id, version, contentHash: hash(id) }
}
function redigest(value: unknown, field: string): Record<string, unknown> {
  const record = structuredClone(value) as Record<string, unknown>
  record[field] = calculateSkillContractDigest(record, field)
  return record
}
function changed(value: unknown, edit: (record: Record<string, unknown>) => void):
Record<string, unknown> {
  const record = structuredClone(value) as Record<string, unknown>
  edit(record)
  return record
}
function envelopeRef(value: CaptionLegacyPlanEnvelope): CaptionDomainRef {
  return {
    id: value.envelopeId,
    version: value.schemaVersion,
    contentHash: value.envelopeDigestSha256,
  }
}

const canonicalScope = {
  ownerUserId: 'owner.cap19',
  workspaceId: 'workspace.cap19',
  projectId: 'project.cap19',
  editSessionId: 'edit.cap19',
  legacyPlanVersionId: 'legacy.plan.cap19.v1',
}

const commonPlanInput = {
  envelopeId: 'caption.legacy.plan.cap19.standard',
  canonicalScope,
  sourcePlanRecordRef: ref('caption.legacy.source.plan.cap19'),
  captionNeeded: true,
  legacySkillIds: [
    'captions.bold_social_captions',
    'captions.keyword_emphasis',
  ],
  legacyStyleId: 'bold_social_captions',
  customStyleApprovalRef: null,
  placementClass: 'bottom_safe' as const,
  maxLines: 2,
  keywordEmphasis: true,
  faceSafe: true,
  animationClass: 'simple_pop' as const,
  sourcePlanImmutable: true as const,
  rawChatIncluded: false as const,
  rawTranscriptIncluded: false as const,
  mediaBytesIncluded: false as const,
  pathsOrUrlsIncluded: false as const,
}

const plan = createCaptionLegacyPlanEnvelope(commonPlanInput)
const readOnlyProjection = decodeLegacyCaptionPlan({
  projectionId: 'caption.legacy.projection.cap19.read-only',
  planEnvelope: plan,
})

check(plan.schemaVersion === CAPTION_LEGACY_PLAN_ENVELOPE_VERSION,
  'Legacy plan schema must remain versioned and readable.')
check(readOnlyProjection.disposition
  === 'decoded_read_only_requires_current_authority',
'A legacy plan without current canonical authority must remain read-only.')
check(readOnlyProjection.stableOverlayRoute?.rendererOperationId
  === 'tool.libass.render_approved_caption_track.v1'
  && readOnlyProjection.stableOverlayRoute.packageOperationId
    === 'tool.ffmpeg.execute_approved_media_recipe.v1'
  && readOnlyProjection.stableOverlayRoute.finalCanvasOwner === 'remotion',
'The compatibility lane must reuse canonical libass/FFmpeg operations and Remotion.')
check(readOnlyProjection.stableOverlayRoute.fixed1080x1920CanvasAccepted === false
  && readOnlyProjection.stableOverlayRoute.approvedFontRegistryRequired
  && !readOnlyProjection.stableOverlayRoute.mutableSystemFontAuthorityAccepted,
'The compatibility lane must use the exact confirmed frame and approved fonts.')
check(!readOnlyProjection.executionReady
  && readOnlyProjection.requiresFreshPlanEstimateAndApproval
  && !readOnlyProjection.syntheticFinalWordMotionAllowed
  && !readOnlyProjection.directQwenCaptionOwnerAllowed
  && !readOnlyProjection.directCaptionSamAllowed
  && !readOnlyProjection.directPeerExecutionAllowed,
'Legacy decoding must not grant execution or retired ownership.')

const expectedMappedComponents = CAPTION_MINI_SKILL_IDS.filter((id) =>
  CAPTION_DESIGN_COMPOSITE.legacyMappings
    .filter((mapping) => commonPlanInput.legacySkillIds.includes(
      mapping.legacySkillId))
    .flatMap((mapping) => mapping.componentSkillIds)
    .includes(id))
check(readOnlyProjection.mappedComponentSkillIds.join('|')
  === expectedMappedComponents.join('|'),
'Legacy mini skills must map in canonical component order.')

const snapshot = createCaptionLegacySnapshotEnvelope({
  envelopeId: 'caption.legacy.snapshot.cap19.current',
  canonicalScope,
  legacyPlanEnvelopeRef: envelopeRef(plan),
  legacyApprovedSnapshotRef: ref('caption.legacy.approved.snapshot.cap19'),
  currentApprovedSnapshotRef: ref('caption.current.approved.snapshot.cap19'),
  currentConfirmedOutputFrameRef: ref('caption.current.frame.cap19'),
  currentMasterTimingRef: ref('caption.current.master-timing.cap19'),
  exactTenantScopeRereadVerified: true,
  exactCurrentSnapshotRereadVerified: true,
  legacySnapshotImmutable: true,
  currentSnapshotMutationAllowed: false,
  browserLocalAuthorityAccepted: false,
})
const currentCandidate = decodeLegacyCaptionPlan({
  projectionId: 'caption.legacy.projection.cap19.current-candidate',
  planEnvelope: plan,
  snapshotEnvelope: snapshot,
})
check(snapshot.schemaVersion === CAPTION_LEGACY_SNAPSHOT_ENVELOPE_VERSION
  && currentCandidate.disposition
    === 'decoded_current_simple_overlay_candidate',
'Exact canonical reread may create only a current simple-overlay candidate.')
check(!currentCandidate.executionReady
  && !currentCandidate.operationDispatchAuthority
  && !currentCandidate.providerRuntimeAuthority
  && !currentCandidate.assetMutationAuthority
  && !currentCandidate.finalQaApprovalAuthority
  && !currentCandidate.publicDeliveryAuthority
  && !currentCandidate.productionAuthority,
'Even a current candidate must retain every execution and delivery gate.')

const noCaptionsPlan = createCaptionLegacyPlanEnvelope({
  ...commonPlanInput,
  envelopeId: 'caption.legacy.plan.cap19.restraint',
  captionNeeded: false,
  legacySkillIds: ['captions.no_caption_policy'],
  legacyStyleId: null,
  keywordEmphasis: false,
  animationClass: 'none',
})
const restraintProjection = decodeLegacyCaptionPlan({
  projectionId: 'caption.legacy.projection.cap19.restraint',
  planEnvelope: noCaptionsPlan,
})
check(restraintProjection.disposition === 'decoded_no_captions_restraint'
  && restraintProjection.compositeSkillId === null
  && restraintProjection.restraintSkillId === 'no_captions'
  && restraintProjection.mappedComponentSkillIds.join('|')
    === 'caption_restraint'
  && restraintProjection.legacyStyleAdapter === null
  && restraintProjection.stableOverlayRoute === null,
'Legacy no-caption intent must decode only to the exclusive restraint.')

const unknownStylePlan = createCaptionLegacyPlanEnvelope({
  ...commonPlanInput,
  envelopeId: 'caption.legacy.plan.cap19.custom-blocked',
  legacyStyleId: 'brand_style_from_legacy_plan',
})
const blockedStyleProjection = decodeLegacyCaptionPlan({
  projectionId: 'caption.legacy.projection.cap19.custom-blocked',
  planEnvelope: unknownStylePlan,
})
check(blockedStyleProjection.disposition
  === 'blocked_custom_style_requires_approval'
  && blockedStyleProjection.legacyStyleAdapter?.legacyStyleId === 'custom'
  && blockedStyleProjection.stableOverlayRoute === null,
'Unknown legacy style must remain blocked until explicitly approved.')

const approvedCustomPlan = createCaptionLegacyPlanEnvelope({
  ...commonPlanInput,
  envelopeId: 'caption.legacy.plan.cap19.custom-approved',
  legacyStyleId: 'brand_style_from_legacy_plan',
  customStyleApprovalRef: ref(
    'caption.legacy.custom-style-approval.cap19',
    'caption-custom-style-approval-v1'),
})
const approvedCustomProjection = decodeLegacyCaptionPlan({
  projectionId: 'caption.legacy.projection.cap19.custom-approved',
  planEnvelope: approvedCustomPlan,
})
check(approvedCustomProjection.disposition
  === 'decoded_read_only_requires_current_authority'
  && approvedCustomProjection.legacyStyleAdapter?.disposition === 'adapted',
'An approved custom legacy style still requires current canonical authority.')

const release = parseCaptionMigrationRetirementRelease(
  CAPTION_MIGRATION_RETIREMENT_RELEASE)
check(release.legacySkillMappings.length
  === CAPTION_DESIGN_COMPOSITE.legacyMappings.length
  && release.legacySkillMappings.every((mapping, index) =>
    JSON.stringify(mapping)
      === JSON.stringify(CAPTION_DESIGN_COMPOSITE.legacyMappings[index])),
'CAP-19 must preserve every exact CAP-02 legacy skill mapping.')
check(release.legacyStyleIds.join('|') === CAPTION_LEGACY_STYLE_IDS.join('|'),
  'CAP-19 must preserve every exact CAP-10 legacy style ID.')
check(release.retirementRegistry.entries.map((entry) => entry.retiredOwnerId)
  .join('|') === CAPTION_RETIRED_OWNER_IDS.join('|')
  && release.retirementRegistry.entries.every((entry) =>
    entry.historicalReadAllowed && !entry.freshWorkAllowed
      && !entry.rollbackMayReactivateOwner),
'Every retired owner must remain readable but unable to receive fresh work.')
check(release.oldPlanAndSnapshotDecodersPublished
  && release.simpleOverlayCompatibilityPreserved
  && release.branchRetirementDocumented
  && release.noCentralOrchestraImplemented,
'CAP-19 release must cover migration, rollback, retirement, and no Orchestra.')
check(!release.providerOrModelRuntimeAuthority
  && !release.operationDispatchAuthority
  && !release.creditOrBillingAuthority
  && !release.publicDeliveryAuthority
  && !release.productionAuthority,
'CAP-19 release must remain source-only with closed external authorities.')

const historicalQwenVisualRole = getReEditProModelRoleContract(
  'qwen2_5_vl_visual_understanding')
check(historicalQwenVisualRole.executionStatus
  === 'retired_historical_read_only'
  && !historicalQwenVisualRole.userReasoningAllowed
  && !historicalQwenVisualRole.editPlanningAllowed
  && !historicalQwenVisualRole.creativeStrategyAllowed
  && !historicalQwenVisualRole.editQaReasoningAllowed
  && !historicalQwenVisualRole.toolCodeAllowed,
'The historical Qwen model role must remain read-only and non-executable.')
check(CAPTION_ROLLBACK_MANIFEST.rollbackTarget
  === 'legacy_simple_stable_overlay'
  && !CAPTION_ROLLBACK_MANIFEST.automaticRollbackAllowed
  && !CAPTION_ROLLBACK_MANIFEST.directQwenOrSamReactivated
  && !CAPTION_ROLLBACK_MANIFEST.fixedCanvasOrSystemFontReactivated
  && !CAPTION_ROLLBACK_MANIFEST.syntheticFinalTimingReactivated,
'Rollback must be explicit, bounded, and unable to reactivate retired owners.')

const specialistDirectory = join(process.cwd(), 'server', 'captions-specialist')
const specialistSource = readdirSync(specialistDirectory)
  .filter((name) => name.endsWith('.ts'))
  .map((name) => readFileSync(join(specialistDirectory, name), 'utf8'))
  .join('\n')
const retiredImportPatterns = [
  /from\s+['"][^'"]*qwen-visual-understanding-provider['"]/,
  /from\s+['"][^'"]*workers\/captions['"]/,
  /from\s+['"][^'"]*ass-caption-builder['"]/,
  /from\s+['"][^'"]*caption-style-policy['"]/,
  /from\s+['"][^'"]*server\/[^'"]*sam[^'"]*['"]/,
]
check(retiredImportPatterns.every((pattern) => !pattern.test(specialistSource)),
  'The Caption specialist must not import retired Qwen, worker, ASS, font, or direct SAM implementations.')

expectThrow(() => parseCaptionLegacyPlanEnvelope(redigest(changed(plan,
  (record) => { record.legacySkillIds = ['captions.unknown_owner'] }),
'envelopeDigestSha256')))
expectThrow(() => parseCaptionLegacyPlanEnvelope(redigest(changed(plan,
  (record) => {
    record.legacySkillIds = [
      'captions.bold_social_captions', 'captions.no_caption_policy',
    ]
  }), 'envelopeDigestSha256')))
expectThrow(() => parseCaptionLegacyPlanEnvelope(redigest(changed(plan,
  (record) => {
    record.legacySkillIds = [
      'captions.bold_social_captions', 'captions.bold_social_captions',
    ]
  }), 'envelopeDigestSha256')))
expectThrow(() => parseCaptionLegacyPlanEnvelope(redigest(changed(plan,
  (record) => { record.schemaVersion = 'caption-legacy-plan-envelope-v2' }),
'envelopeDigestSha256')))
expectThrow(() => parseCaptionLegacyPlanEnvelope(redigest(changed(plan,
  (record) => { record.envelopeId = 'https://unsafe.example/plan' }),
'envelopeDigestSha256')))
expectThrow(() => parseCaptionLegacyPlanEnvelope(redigest(changed(plan,
  (record) => { record.unknownAuthority = false }),
'envelopeDigestSha256')))
expectThrow(() => parseCaptionLegacyPlanEnvelope({
  ...plan, envelopeDigestSha256: hash('tampered'),
}))

const cyclicPlan = structuredClone(plan) as unknown as Record<string, unknown>
cyclicPlan.cycle = cyclicPlan
expectThrow(() => parseCaptionLegacyPlanEnvelope(cyclicPlan))
const inheritedPlan = Object.create({ inheritedAuthority: true }) as
Record<string, unknown>
Object.assign(inheritedPlan, plan)
expectThrow(() => parseCaptionLegacyPlanEnvelope(inheritedPlan))

expectThrow(() => parseCaptionLegacySnapshotEnvelope(redigest(changed(snapshot,
  (record) => { record.exactCurrentSnapshotRereadVerified = false }),
'envelopeDigestSha256')))
expectThrow(() => decodeLegacyCaptionPlan({
  projectionId: 'caption.legacy.projection.cap19.cross-scope',
  planEnvelope: plan,
  snapshotEnvelope: createCaptionLegacySnapshotEnvelope({
    ...structuredClone(snapshot),
    envelopeId: 'caption.legacy.snapshot.cap19.cross-scope',
    canonicalScope: { ...canonicalScope, projectId: 'project.other' },
    legacyPlanEnvelopeRef: envelopeRef(plan),
  }),
}))
expectThrow(() => decodeLegacyCaptionPlan({
  projectionId: 'caption.legacy.projection.cap19.stale-plan-ref',
  planEnvelope: plan,
  snapshotEnvelope: createCaptionLegacySnapshotEnvelope({
    ...structuredClone(snapshot),
    envelopeId: 'caption.legacy.snapshot.cap19.stale-plan-ref',
    legacyPlanEnvelopeRef: ref(
      plan.envelopeId, CAPTION_LEGACY_PLAN_ENVELOPE_VERSION),
  }),
}))

expectThrow(() => parseCaptionLegacyMigrationProjection(redigest(changed(
  currentCandidate, (record) => { record.executionReady = true }),
'projectionDigestSha256')))
expectThrow(() => parseCaptionLegacyMigrationProjection(redigest(changed(
  currentCandidate, (record) => { record.directCaptionSamAllowed = true }),
'projectionDigestSha256')))
expectThrow(() => parseCaptionLegacyMigrationProjection(redigest(changed(
  currentCandidate, (record) => {
    record.mappedComponentSkillIds = [...currentCandidate.mappedComponentSkillIds]
      .reverse()
  }), 'projectionDigestSha256')))
expectThrow(() => parseCaptionLegacyMigrationProjection(redigest(changed(
  currentCandidate, (record) => {
    record.appliedLegacySkillIds = ['captions.unknown_owner']
    record.mappedComponentSkillIds = []
  }), 'projectionDigestSha256')))
expectThrow(() => parseCaptionLegacyMigrationProjection(redigest(changed(
  currentCandidate, (record) => {
    record.sourceSnapshotEnvelopeRef = null
  }), 'projectionDigestSha256')))

expectThrow(() => parseCaptionRetirementRegistry(redigest(changed(
  CAPTION_RETIREMENT_REGISTRY, (record) => {
    const entries = structuredClone(record.entries) as Array<
      Record<string, unknown>>
    entries[0]!.freshWorkAllowed = true
    record.entries = entries
  }), 'registryDigestSha256')))
expectThrow(() => parseCaptionRetirementRegistry(redigest(changed(
  CAPTION_RETIREMENT_REGISTRY, (record) => {
    const entries = structuredClone(record.entries) as Array<
      Record<string, unknown>>
    entries[1]!.replacementOwnerKey = 'captions'
    record.entries = entries
  }), 'registryDigestSha256')))
expectThrow(() => parseCaptionRetirementRegistry(redigest(changed(
  CAPTION_RETIREMENT_REGISTRY, (record) => {
    const entries = structuredClone(record.entries) as unknown[]
    record.entries = entries.slice(0, -1)
  }), 'registryDigestSha256')))
expectThrow(() => parseCaptionRetirementRegistry(redigest(changed(
  CAPTION_RETIREMENT_REGISTRY, (record) => {
    const entries = structuredClone(record.entries) as unknown[]
    record.entries = [...entries].reverse()
  }), 'registryDigestSha256')))

expectThrow(() => parseCaptionRollbackManifest(redigest(changed(
  CAPTION_ROLLBACK_MANIFEST,
  (record) => { record.automaticRollbackAllowed = true }),
'manifestDigestSha256')))
expectThrow(() => parseCaptionRollbackManifest(redigest(changed(
  CAPTION_ROLLBACK_MANIFEST,
  (record) => { record.fixedCanvasOrSystemFontReactivated = true }),
'manifestDigestSha256')))
expectThrow(() => parseCaptionRollbackManifest(redigest(changed(
  CAPTION_ROLLBACK_MANIFEST,
  (record) => { record.operationDispatchAuthority = true }),
'manifestDigestSha256')))

expectThrow(() => parseCaptionMigrationRetirementRelease(redigest(changed(
  CAPTION_MIGRATION_RETIREMENT_RELEASE, (record) => {
    record.legacyStyleIds = [...CAPTION_LEGACY_STYLE_IDS].reverse()
  }), 'releaseDigestSha256')))
expectThrow(() => parseCaptionMigrationRetirementRelease(redigest(changed(
  CAPTION_MIGRATION_RETIREMENT_RELEASE, (record) => {
    const mappings = structuredClone(record.legacySkillMappings) as Array<
      Record<string, unknown>>
    mappings[0]!.legacySkillId = 'captions.substituted_owner'
    record.legacySkillMappings = mappings
  }), 'releaseDigestSha256')))
expectThrow(() => parseCaptionMigrationRetirementRelease(redigest(changed(
  CAPTION_MIGRATION_RETIREMENT_RELEASE,
  (record) => { record.noCentralOrchestraImplemented = false }),
'releaseDigestSha256')))

console.log(JSON.stringify({
  smoke: 'captions_specialist_cap_19',
  assertions,
  legacySkillMappingCount: release.legacySkillMappings.length,
  legacyStyleCount: release.legacyStyleIds.length,
  retiredOwnerCount: release.retirementRegistry.entries.length,
  stableCompatibilityRoute: release.rollbackManifest.stableOverlayRoute.routeId,
  currentCandidateDisposition: currentCandidate.disposition,
  runtimeUsed: false,
  providerOrModelCallMade: false,
  operationDispatchAuthority: false,
  publicDeliveryAuthority: false,
  productionAuthority: false,
  result: 'passed',
}, null, 2))
