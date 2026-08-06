import assert from 'node:assert/strict'

import type {
  ApprovedEditExecutionUploadedMediaSourceAssetClientInput,
} from '../../src/lib/approved-edit-execution-package-client'
import type { PlannerInput } from '../../src/types/reeditpro'
import {
  prepareCanonicalProfessionalLongFormPublication,
} from '../services/canonical-professional-long-form-publication-authority'
import {
  compileCanonicalSourceLedPlan,
} from '../services/canonical-source-led-plan-compiler'
import {
  buildCanonicalSourceLedProfessionalLongFormSeedDraft,
} from '../services/canonical-source-led-professional-long-form-publication'
import {
  canonicalPlanComponentsSchema,
  publishCanonicalEditPlanSchema,
} from '../validation/edit-planning-authority-schemas'
import {
  uploadedSourceBindingManifestCandidateSchema,
} from '../validation/source-media-authority-schemas'

const sha = (character: string) => character.repeat(64).slice(0, 64)
const durations = [2, 480, 23.304] as const
const totalFrames = durations.reduce(
  (total, duration) => total + Math.round(duration * 30),
  0,
)
const workspaceId = 'workspace-source-led-long-form'
const projectId = 'project-source-led-long-form'
const editSessionId = 'edit-source-led-long-form'

const clips: PlannerInput['clips'] = durations.map((duration, index) => ({
  id: `tom-media-${index + 1}`,
  uploadedOrder: index + 1,
  fileName: `tom-00${40 + index}.mp4`,
  duration: String(duration),
  detectedType: 'Server-verified finalized uploaded video',
  sourceRole: 'main_story' as const,
  isImportant: true,
  isOptional: false,
}))

const plannerInput: PlannerInput = {
  projectName: 'Tom basketball source footage',
  targetPlatform: 'tiktok_reels_shorts',
  aspectRatio: '9:16',
  aspectRatioConfirmed: true,
  aspectRatioSource: 'user_selected',
  frameTemplateType: 'vertical_story_frame',
  editingCategory: 'social_short_viral_clip',
  workflowType: 'simple_clean_edit',
  editLevel: 'premium',
  structurePreference: 'preserve_source_order',
  moodStyle: 'clean',
  visualPreference: 'no_extra_visuals',
  referenceUrl: '',
  customInstructions:
    'Preserve the three exact sources in order and apply only source-bound professional cleanup.',
  userInstructionHistory: [
    'Preserve the three exact sources in order and apply only source-bound professional cleanup.',
  ],
  creditPreference: 'balanced',
  clips,
  sourceSequenceMode: 'multi_clip_story_order',
  sourceOrderConfirmed: true,
  cleanupPreference: 'balanced_cleanup',
  cleanupPreferenceConfirmed: true,
  preferenceDefaultsApplied: true,
  preferenceSnapshotId: 'source-led-long-form-preference-snapshot',
  preferencePersistenceSource: 'authenticated_private_internal_backend',
  currentEditPreferenceAuthorityValues: {
    editLevel: 'premium',
    workflowType: 'simple_clean_edit',
    cleanupPreference: 'balanced_cleanup',
    visualPreference: 'no_extra_visuals',
    moodStyle: 'clean',
    creditPreference: 'balanced',
    targetPlatform: 'tiktok_reels_shorts',
  },
  currentEditPreferenceRecordRevision: 3,
  currentEditPreferenceRevision: 2,
  currentEditPreferencePlanningInputRevision: 2,
  currentEditPreferenceFingerprintSha256: sha('a'),
}

const sourceMediaAssets:
  ApprovedEditExecutionUploadedMediaSourceAssetClientInput[] =
  durations.map((duration, index) => ({
    mediaAssetId: `tom-media-${index + 1}`,
    storageObjectRecordId: `tom-object-${index + 1}`,
    sourceSequenceItemId: `tom-media-${index + 1}`,
    uploadedClipId: `tom-media-${index + 1}`,
    uploadedOrder: index + 1,
    storageProvider: 'local_private',
    storageBucket: 'private-internal',
    storagePath: `private/tom-00${40 + index}.mp4`,
    fileName: `tom-00${40 + index}.mp4`,
    mimeType: 'video/mp4',
    byteSize: 4_096 + index,
    checksumSha256: sha(String(index + 1)),
    sourceMetadata: {
      probeStatus: 'probed',
      source: 'local_ffprobe',
      durationSeconds: duration,
      width: 1_920,
      height: 1_080,
      videoCodec: 'h264',
      audioCodec: 'aac',
      hasVideo: true,
      hasAudio: true,
    },
    privateArtifact: true,
    publicUrl: null,
    signedUrl: null,
  }))

const compiled = compileCanonicalSourceLedPlan({
  plannerInput,
  sourceMediaAssets,
  confirmedCaptionMarkers: [],
})
assert.equal(compiled.canonicalDraft.publication, undefined)
assert.equal(
  compiled.evidence.publicationProfile,
  'professional_long_form_object_controller',
)
assert.equal(compiled.evidence.totalFrames, totalFrames)
assert.equal(
  compiled.professionalLongFormPublication?.canonicalPlan.workItems.length,
  3,
)
assert.equal(
  compiled.professionalLongFormPublication?.replacedCapacityBlockers.length,
  3,
)

const professionalPublication = compiled.professionalLongFormPublication
assert.ok(professionalPublication)
const canonicalPlan = publishCanonicalEditPlanSchema.shape.canonicalPlan.parse(
  professionalPublication.canonicalPlan,
)
const components = canonicalPlanComponentsSchema.parse(
  canonicalPlan.components,
)
const seedDraft = buildCanonicalSourceLedProfessionalLongFormSeedDraft({
  workspaceId,
  projectId,
  editSessionId,
  planningRequestId: professionalPublication.planningRequestIdSeed,
  components,
  sourceObjects: sourceMediaAssets.map((source) => ({
    sourceSequenceItemId: source.sourceSequenceItemId!,
    mediaAssetId: source.mediaAssetId,
    storageProvider: 'local_private',
    sizeBytes: source.byteSize,
    checksumSha256: source.checksumSha256!,
  })),
})
assert.equal(seedDraft.totalFrames, totalFrames)
assert.equal(seedDraft.confirmedOutputFrame.width, 2_160)
assert.equal(seedDraft.confirmedOutputFrame.height, 3_840)
assert.equal(seedDraft.sourceRanges.length, 3)
assert.equal(seedDraft.sourceRanges[0]?.timelineStartFrame, 0)
assert.equal(
  seedDraft.sourceRanges[2]?.timelineEndFrameExclusive,
  totalFrames,
)

const sourceMediaAuthority =
  uploadedSourceBindingManifestCandidateSchema.parse({
    schemaVersion: 'private-source-binding-manifest-candidate-v1',
    authorityStatus: 'unapproved_manifest_candidate',
    executionAuthorized: false,
    approvedSnapshotMutated: false,
    noRuntimeSideEffects: true,
    workspaceId,
    projectId,
    uploadPurpose: 'source_media',
    authorityRevision: 1,
    authorityChecksumSha256: sha('b'),
    sourceSequenceHash: sha('c'),
    bindings: sourceMediaAssets.map((source, index) => ({
      sourceSequenceItemId: source.sourceSequenceItemId,
      mediaAssetId: source.mediaAssetId,
      uploadedOrder: index + 1,
      required: true,
      uploadIntentId: `tom-upload-${index + 1}`,
      storageObjectRecordId: source.storageObjectRecordId,
      storageProvider: 'local_private',
      mimeType: 'video/mp4',
      sizeBytes: source.byteSize,
      checksumSha256: source.checksumSha256,
      storageIdentityHash: sha('d'),
      bindingHash: sha(String(6 + index)),
    })),
    requiredBindingCount: 3,
    candidateHash: sha('e'),
  })
const prepared = prepareCanonicalProfessionalLongFormPublication({
  seedDraft,
  workspaceId,
  projectId,
  editSessionId,
  planningRequestId: professionalPublication.planningRequestIdSeed,
  components,
  sourceMediaAuthority,
  existingWorkItems: canonicalPlan.workItems,
})
assert.equal(prepared.seed.totalFrames, totalFrames)
assert.equal(
  prepared.controllerWorkItem.workItemKey,
  'professional-long-form-object-controller',
)
assert.equal(prepared.controllerWorkItem.maximumCreditBudget, 0)

const substitutedSources = structuredClone(
  sourceMediaAssets.map((source) => ({
    sourceSequenceItemId: source.sourceSequenceItemId!,
    mediaAssetId: source.mediaAssetId,
    storageProvider: 'local_private' as const,
    sizeBytes: source.byteSize,
    checksumSha256: source.checksumSha256!,
  })),
)
substitutedSources[1]!.checksumSha256 = sha('f')
assert.throws(
  () => buildCanonicalSourceLedProfessionalLongFormSeedDraft({
    workspaceId,
    projectId,
    editSessionId,
    planningRequestId: professionalPublication.planningRequestIdSeed,
    components,
    sourceObjects: substitutedSources,
  }),
  /lost exact source/u,
)

assert.throws(
  () => compileCanonicalSourceLedPlan({
    plannerInput: {
      ...plannerInput,
      visualPreference: 'balanced_visual_mix',
    },
    sourceMediaAssets,
    confirmedCaptionMarkers: [],
  }),
  /later server visual-planning route/u,
)

console.log(JSON.stringify({
  ok: true,
  sourceCount: compiled.evidence.sourceCount,
  totalFrames,
  durationSeconds: totalFrames / 30,
  outputFrame: seedDraft.confirmedOutputFrame,
  sourceRangeCount: seedDraft.sourceRanges.length,
  preflightWorkItemCount: canonicalPlan.workItems.length,
  controllerWorkItemKey: prepared.controllerWorkItem.workItemKey,
  approvalGranted: false,
  creditReserved: false,
  toolExecution: false,
  render: false,
}))
