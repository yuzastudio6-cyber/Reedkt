import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  brollMasterTimingPlanSchema,
  brollSourceInventorySchema,
  brollVisualOwnershipManifestSchema,
  brollVisualOwnershipWindowSchema,
  createBrollMasterTimingPlan,
  createBrollSourceInventory,
  createBrollVisualOwnershipManifest,
} from '../edit-skills/b-roll/b-roll-input-authorities'
import { brollSourceCandidateSchema } from '../edit-skills/b-roll/b-roll-schemas'
import { listBrollQualificationRelevantFiles } from '../edit-skills/b-roll/b-roll-qualification-source-hash'
import { hashSkillValue, skillManifestReference } from '../edit-skills/core/skill-capability-manifest-hash'
import {
  createMasterTimingPlan,
  createSourceInventory,
  createVisualOwnershipManifest,
  masterTimingPlanSchema,
  sourceInventoryCandidateSchema,
  sourceInventorySchema,
  visualOwnershipManifestSchema,
  visualOwnershipWindowSchema,
} from '../edit-skills/shared/assignment-authorities'
import { TRACK_ALL_CAPABILITY_MANIFEST } from '../edit-skills/track-all/track-all-capability-manifest'
import { listTrackAllQualificationRelevantFiles } from '../edit-skills/track-all/track-all-qualification-source-hash'

const scope = {
  ownerUserId: 'shared-authority-user',
  workspaceId: 'shared-authority-workspace',
  projectId: 'shared-authority-project',
}
const editSessionId = 'shared-authority-session'
const assignmentId = 'shared-authority-assignment'
const manifestRef = skillManifestReference(TRACK_ALL_CAPABILITY_MANIFEST)
const range = { startFrameInclusive: 24, endFrameExclusive: 144, fps: 24 }
const timelineRange = { startFrameInclusive: 0, endFrameExclusive: 240, fps: 24 }
const sourceRef = {
  artifactType: 'source_media_artifact_v1',
  sha256: hashSkillValue({ source: 'shared-authority-source' }),
  byteLength: 128,
  ...scope,
}

assert.equal(brollSourceCandidateSchema, sourceInventoryCandidateSchema)
assert.equal(brollSourceInventorySchema, sourceInventorySchema)
assert.equal(brollMasterTimingPlanSchema, masterTimingPlanSchema)
assert.equal(brollVisualOwnershipWindowSchema, visualOwnershipWindowSchema)
assert.equal(brollVisualOwnershipManifestSchema, visualOwnershipManifestSchema)
assert.equal(createBrollSourceInventory, createSourceInventory)
assert.equal(createBrollMasterTimingPlan, createMasterTimingPlan)
assert.equal(createBrollVisualOwnershipManifest, createVisualOwnershipManifest)

const inventory = createSourceInventory({
  schemaVersion: 'source_inventory_v1',
  ...scope,
  editSessionId,
  assignmentId,
  editPlanVersion: 1,
  manifestRef,
  candidates: [{
    sourceId: 'shared-source',
    sourceType: 'existing_project_clip',
    artifactRef: sourceRef,
    sourceRange: timelineRange,
    semanticRelevance: 0.9,
    visualQuality: 0.9,
    temporalFit: 0.9,
    storyContinuity: 0.9,
    provenanceVerified: true,
    rightsApproved: true,
    privacyApproved: true,
    proofSafe: true,
    repetitionRisk: 0.1,
    cropFeasibility: 0.9,
    speakerActionProtection: 0.9,
    audioUsefulness: 0.5,
    costCredits: 0,
    approvedByUser: true,
  }],
})
const timing = createMasterTimingPlan({
  schemaVersion: 'master_timing_plan_v1',
  ...scope,
  editSessionId,
  assignmentId,
  editPlanVersion: 1,
  manifestRef,
  fps: 24,
  timelineRange,
  assignmentRange: range,
})
const ownership = createVisualOwnershipManifest({
  schemaVersion: 'visual_ownership_manifest_v1',
  ...scope,
  editSessionId,
  assignmentId,
  editPlanVersion: 1,
  manifestRef,
  assignmentRange: range,
  requestedOwnership: 'support',
  ownershipWindows: [{
    ownerSkillKey: 'track_all',
    ownership: 'support',
    exclusive: false,
    frameRange: range,
    lockedEvidenceFootage: false,
    deliberateHeroVisual: false,
    captionSafeAreaReserved: false,
    transitionBoundaryOwned: false,
  }],
})

assert.deepEqual(createBrollSourceInventory({
  schemaVersion: 'source_inventory_v1',
  ...scope,
  editSessionId,
  assignmentId,
  editPlanVersion: 1,
  manifestRef,
  candidates: inventory.candidates,
}), inventory)
assert.deepEqual(createBrollMasterTimingPlan({
  schemaVersion: 'master_timing_plan_v1',
  ...scope,
  editSessionId,
  assignmentId,
  editPlanVersion: 1,
  manifestRef,
  fps: 24,
  timelineRange,
  assignmentRange: range,
}), timing)
assert.deepEqual(createBrollVisualOwnershipManifest({
  schemaVersion: 'visual_ownership_manifest_v1',
  ...scope,
  editSessionId,
  assignmentId,
  editPlanVersion: 1,
  manifestRef,
  assignmentRange: range,
  requestedOwnership: 'support',
  ownershipWindows: ownership.ownershipWindows,
}), ownership)

assert.throws(() => sourceInventorySchema.parse({
  ...inventory,
  inventoryHash: hashSkillValue({ forged: true }),
}), /stale or forged/iu)
assert.throws(() => masterTimingPlanSchema.parse({
  ...timing,
  timingHash: hashSkillValue({ forged: true }),
}), /stale or forged/iu)
assert.throws(() => visualOwnershipManifestSchema.parse({
  ...ownership,
  ownershipHash: hashSkillValue({ forged: true }),
}), /stale or forged/iu)

function typescriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name)
    return entry.isDirectory()
      ? typescriptFiles(path)
      : entry.isFile() && entry.name.endsWith('.ts')
        ? [path]
        : []
  })
}

const trackAllRoot = resolve('server/edit-skills/track-all')
const forbiddenTrackImports = typescriptFiles(trackAllRoot).filter((path) => {
  const source = readFileSync(path, 'utf8')
  return /from\s+['"][^'"]*\/b-roll(?:\/[^'"]*)?['"]/u.test(source)
})
assert.deepEqual(forbiddenTrackImports, [], 'Track All runtime must not import B-Roll implementation modules.')

const sharedAuthorityFiles = [
  'server/edit-skills/shared/assignment-authorities/assignment-authority-schemas.ts',
  'server/edit-skills/shared/assignment-authorities/index.ts',
] as const
for (const path of sharedAuthorityFiles) {
  assert.equal(readFileSync(path, 'utf8').includes('/b-roll'), false)
  assert.equal(listBrollQualificationRelevantFiles().includes(path), true)
  assert.equal(listTrackAllQualificationRelevantFiles().includes(path), true)
}
assert.match(
  readFileSync('server/edit-skills/b-roll/b-roll-input-authorities.ts', 'utf8'),
  /@deprecated Import/u,
)

console.log(JSON.stringify({
  status: 'ok',
  canonicalOwner: 'server/edit-skills/shared/assignment-authorities',
  canonicalSchemaCount: 4,
  brollCompatibilityExports: 12,
  trackAllPrivateBrollImports: forbiddenTrackImports.length,
  sourceInventoryHash: inventory.inventoryHash,
  masterTimingHash: timing.timingHash,
  visualOwnershipHash: ownership.ownershipHash,
  brollQualificationInvalidationBound: true,
  trackAllQualificationInvalidationBound: true,
}))
