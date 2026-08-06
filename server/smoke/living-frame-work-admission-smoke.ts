import assert from 'node:assert/strict'

import type {
  LivingFrameWorkAdmissionCatalog,
} from '../../src/types/living-frame-work-admission'
import {
  LIVING_FRAME_CAPABILITY_KEYS,
  LIVING_FRAME_MINI_SKILL_KEYS,
} from '../../src/types/living-frame'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  compileLivingFrameWorkAdmissionCatalog,
  verifyLivingFrameWorkAdmissionCatalog,
} from '../living-frame/living-frame-work-admission'
import {
  CANONICAL_EDIT_WORK_ITEM_TYPES,
} from '../validation/edit-planning-authority-schemas'

const catalog = compileLivingFrameWorkAdmissionCatalog()
assert.equal(verifyLivingFrameWorkAdmissionCatalog(catalog), true)
assert.equal(
  catalog.capabilityCoverage.length,
  LIVING_FRAME_CAPABILITY_KEYS.length,
)
assert.equal(
  catalog.miniSkillCoverage.length,
  LIVING_FRAME_MINI_SKILL_KEYS.length,
)
assert.equal(catalog.customWorkItemAllowed, false)
assert.equal(catalog.createsWorkItems, false)
assert.equal(catalog.createsAssetManifestEntries, false)
assert.equal(catalog.subjectSpecificRouting, false)
assert.equal(catalog.productionReady, false)
assert.equal(catalog.authorityBoundary.selectedSceneAuthority, false)
assert.equal(catalog.authorityBoundary.approvalAuthority, false)
assert.equal(catalog.authorityBoundary.snapshotAuthority, false)
assert.equal(catalog.authorityBoundary.workItemCreationAuthority, false)
assert.equal(catalog.authorityBoundary.workGraphMutationAuthority, false)
assert.equal(catalog.authorityBoundary.queueAuthority, false)
assert.equal(catalog.authorityBoundary.assetManifestMutationAuthority, false)
assert.equal(catalog.authorityBoundary.providerAuthority, false)
assert.equal(catalog.authorityBoundary.toolRouteAuthority, false)
assert.equal(catalog.authorityBoundary.qaApprovalAuthority, false)
assert.equal(catalog.authorityBoundary.renderAuthority, false)
assert.equal(catalog.authorityBoundary.productionAuthority, false)

const allCoverage = [
  ...catalog.capabilityCoverage,
  ...catalog.miniSkillCoverage,
]
assert.equal(
  allCoverage.some((entry) =>
    entry.existingNamedWorkItemTypes.includes('custom' as never)),
  false,
)
assert.equal(
  catalog.capabilityCoverage.find((entry) =>
    entry.capabilityKey === 'exact_map_rendering')
    ?.existingNamedWorkItemTypes.includes('render_map_asset'),
  true,
)
assert.equal(
  catalog.capabilityCoverage.find((entry) =>
    entry.capabilityKey === 'exact_data_graphics')
    ?.existingNamedWorkItemTypes.includes('render_chart_asset'),
  true,
)
assert.equal(
  catalog.capabilityCoverage.find((entry) =>
    entry.capabilityKey === 'identity_conditioned_illustration')
    ?.coverageState,
  'safety_blocked',
)
assert.equal(
  catalog.miniSkillCoverage.find((entry) =>
    entry.miniSkillKey === 'component_rigging')
    ?.coverageState,
  'existing_named_work_type_candidate',
)
assert.equal(
  catalog.miniSkillCoverage.find((entry) =>
    entry.miniSkillKey === 'component_rigging')
    ?.existingNamedWorkItemTypes.includes('build_component_rig'),
  true,
)
assert.equal(
  catalog.capabilityCoverage.find((entry) =>
    entry.capabilityKey === 'foreground_component_extraction')
    ?.existingNamedWorkItemTypes.includes(
      'reconstruct_background_plate',
    ),
  true,
)
assert.equal(
  catalog.miniSkillCoverage.find((entry) =>
    entry.miniSkillKey === 'visual_continuity_direction')
    ?.coverageState,
  'planning_only_no_work_item',
)
assert.equal(
  CANONICAL_EDIT_WORK_ITEM_TYPES.includes(
    'reconstruct_background_plate',
  ),
  true,
)
assert.equal(
  CANONICAL_EDIT_WORK_ITEM_TYPES.includes('build_component_rig'),
  true,
)
assert.equal(
  CANONICAL_EDIT_WORK_ITEM_TYPES.includes(
    'living_frame_magic' as never,
  ),
  false,
)

const replay = compileLivingFrameWorkAdmissionCatalog()
assert.equal(replay.catalogDigestSha256, catalog.catalogDigestSha256)

const removedCapability = mutable(catalog)
removedCapability.capabilityCoverage.pop()
assert.equal(
  verifyLivingFrameWorkAdmissionCatalog(sign(removedCapability)),
  false,
)

const duplicateCapability = mutable(catalog)
duplicateCapability.capabilityCoverage[1]!.capabilityKey =
  duplicateCapability.capabilityCoverage[0]!.capabilityKey
assert.equal(
  verifyLivingFrameWorkAdmissionCatalog(sign(duplicateCapability)),
  false,
)

const customBypass = mutable(catalog)
customBypass.miniSkillCoverage[0]!.existingNamedWorkItemTypes.push(
  'custom' as never,
)
assert.equal(
  verifyLivingFrameWorkAdmissionCatalog(sign(customBypass)),
  false,
)

const forgedAuthority = mutable(catalog)
forgedAuthority.authorityBoundary.workItemCreationAuthority = true
forgedAuthority.authorityBoundary.productionAuthority = true
assert.equal(
  verifyLivingFrameWorkAdmissionCatalog(sign(forgedAuthority)),
  false,
)

const forgedRuntime = mutable(catalog)
forgedRuntime.createsWorkItems = true
forgedRuntime.createsAssetManifestEntries = true
forgedRuntime.productionReady = true
assert.equal(
  verifyLivingFrameWorkAdmissionCatalog(sign(forgedRuntime)),
  false,
)

const forgedSubjectRoute = mutable(catalog)
forgedSubjectRoute.subjectSpecificRouting = true
assert.equal(
  verifyLivingFrameWorkAdmissionCatalog(sign(forgedSubjectRoute)),
  false,
)

const identityPromoted = mutable(catalog)
const identity = identityPromoted.capabilityCoverage.find((entry) =>
  entry.capabilityKey === 'identity_conditioned_illustration')!
identity.coverageState = 'existing_named_work_type_candidate'
identity.existingNamedWorkItemTypes = ['generate_image_asset']
identity.missingOperationCodes = []
assert.equal(
  verifyLivingFrameWorkAdmissionCatalog(sign(identityPromoted)),
  false,
)

const rigHiddenUnderExisting = mutable(catalog)
const rig = rigHiddenUnderExisting.miniSkillCoverage.find((entry) =>
  entry.miniSkillKey === 'component_rigging')!
rig.existingNamedWorkItemTypes = ['process_image_asset']
assert.equal(
  verifyLivingFrameWorkAdmissionCatalog(sign(rigHiddenUnderExisting)),
  false,
)

const hiddenPlateRemoved = mutable(catalog)
const decomposition = hiddenPlateRemoved.miniSkillCoverage.find((entry) =>
  entry.miniSkillKey === 'component_decomposition')!
decomposition.existingNamedWorkItemTypes =
  decomposition.existingNamedWorkItemTypes.filter((workItemType) =>
    workItemType !== 'reconstruct_background_plate')
assert.equal(
  verifyLivingFrameWorkAdmissionCatalog(sign(hiddenPlateRemoved)),
  false,
)

const unknownOperation = mutable(catalog)
unknownOperation.capabilityCoverage[0]!.missingOperationCodes = [
  'invented_operation',
] as never
assert.equal(
  verifyLivingFrameWorkAdmissionCatalog(sign(unknownOperation)),
  false,
)

assert.equal(
  verifyLivingFrameWorkAdmissionCatalog({
    ...catalog,
    catalogDigestSha256: sha256AuthorityValue('wrong'),
  }),
  false,
)

console.log(JSON.stringify({
  suite: 'living-frame-work-admission',
  capabilityCoverageCount: catalog.metrics.capabilityCount,
  miniSkillCoverageCount: catalog.metrics.miniSkillCount,
  existingNamedCoverageCount:
    catalog.metrics.existingNamedCoverageCount,
  partialCoverageCount: catalog.metrics.partialCoverageCount,
  explicitSchemaAdmissionCount:
    catalog.metrics.missingSchemaAdmissionCount,
  safetyBlockedCount: catalog.metrics.safetyBlockedCount,
  adversarialAssertions: 11,
  customWorkItemAllowed: catalog.customWorkItemAllowed,
  createsWorkItems: catalog.createsWorkItems,
  subjectSpecificRouting: catalog.subjectSpecificRouting,
  productionAuthorityGranted:
    catalog.authorityBoundary.productionAuthority,
}))

type Mutable<T> =
  T extends boolean
    ? boolean
    : T extends string
      ? string
      : T extends number
        ? number
        : T extends readonly (infer Item)[]
    ? Mutable<Item>[]
    : T extends object
      ? { -readonly [Key in keyof T]: Mutable<T[Key]> }
      : T

function mutable(
  value: LivingFrameWorkAdmissionCatalog,
): Mutable<Omit<LivingFrameWorkAdmissionCatalog, 'catalogDigestSha256'>> {
  const {
    catalogDigestSha256: _ignored,
    ...draft
  } = structuredClone(value)
  void _ignored
  return draft as unknown as Mutable<Omit<
    LivingFrameWorkAdmissionCatalog,
    'catalogDigestSha256'
  >>
}

function sign(
  draft: Mutable<Omit<
    LivingFrameWorkAdmissionCatalog,
    'catalogDigestSha256'
  >>,
): LivingFrameWorkAdmissionCatalog {
  return {
    ...draft,
    catalogDigestSha256: sha256AuthorityValue(draft),
  } as unknown as LivingFrameWorkAdmissionCatalog
}
