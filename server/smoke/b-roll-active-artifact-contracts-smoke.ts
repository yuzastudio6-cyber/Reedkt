import assert from 'node:assert/strict'
import { z } from 'zod'

import {
  BROLL_ACCEPTED_ARTIFACT_TYPES,
  BROLL_CAPABILITY_MANIFEST,
  BROLL_PRODUCED_ARTIFACT_TYPES,
  brollCandidateMediaManifestSchema,
  brollPrivatePreviewMediaManifestSchema,
  createBrollCandidateMediaManifest,
  createBrollPrivatePreviewMediaManifest,
  createSourceMediaArtifactV1,
  registerBrollArtifactSchemas,
} from '../edit-skills/b-roll'
import {
  EditSkillArtifactSchemaRegistry,
  InMemoryCreateOnlyEditSkillArtifactStore,
} from '../edit-skills/core/edit-skill-artifact-store'
import { hashSkillValue, skillManifestReference } from '../edit-skills/core/skill-capability-manifest-hash'

const scope = {
  ownerUserId: 'artifact-contract-user',
  workspaceId: 'artifact-contract-workspace',
  projectId: 'artifact-contract-project',
}
const lineage = {
  ...scope,
  editSessionId: 'artifact-contract-edit-session',
  assignmentId: 'artifact-contract-assignment',
  assignmentHash: hashSkillValue({ assignment: 'artifact-contract' }),
  manifestRef: skillManifestReference(BROLL_CAPABILITY_MANIFEST),
}
const planHash = hashSkillValue({ plan: 'artifact-contract' })
const graphHash = hashSkillValue({ graph: 'artifact-contract' })
const workItemHash = hashSkillValue({ workItem: 'artifact-contract' })
const evidenceRef = {
  sha256: hashSkillValue({ evidence: 'artifact-contract' }),
  byteLength: 128,
}

const schemas = new EditSkillArtifactSchemaRegistry()
registerBrollArtifactSchemas(schemas)
const store = new InMemoryCreateOnlyEditSkillArtifactStore(schemas)
const activeTypes = [...BROLL_ACCEPTED_ARTIFACT_TYPES, ...BROLL_PRODUCED_ARTIFACT_TYPES]

assert.equal(new Set(activeTypes).size, activeTypes.length)
for (const artifactType of activeTypes) {
  assert.equal(schemas.has(artifactType), true, `missing ${artifactType}`)
  assert.doesNotThrow(() => schemas.assertStrictActive(artifactType))
  assert.throws(
    () => schemas.parse(artifactType, {
      schemaVersion: artifactType,
      ...scope,
      payload: { unrestricted: true },
    }),
    /invalid input|expected|required|unrecognized|schemaVersion/iu,
  )
}

assert.equal(schemas.has('provider_b_roll_candidate_video_mp4'), false)
assert.equal(schemas.has('skill_qualification_receipt_v1'), false)
assert.equal(BROLL_PRODUCED_ARTIFACT_TYPES.includes('skill_qualification_receipt_v2'), true)

const legacyRegistry = new EditSkillArtifactSchemaRegistry()
legacyRegistry.register(
  'legacy_generic_envelope_v1',
  z.object({ payload: z.record(z.string(), z.unknown()) }).passthrough(),
  { contractClass: 'legacy_read_only_generic' },
)
assert.throws(
  () => legacyRegistry.assertStrictActive('legacy_generic_envelope_v1'),
  /legacy generic schema/iu,
)

const source = createSourceMediaArtifactV1({
  schemaVersion: 'source_media_artifact_v1',
  ...scope,
  sourceId: 'source-private-1',
  privateObjectIdentityHash: hashSkillValue({ privateObject: 'source-private-1' }),
  objectSha256: hashSkillValue({ bytes: 'source-private-1' }),
  byteLength: 8_192,
  mimeType: 'video/mp4',
  container: 'mp4',
  durationFrames: 72,
  fps: 24,
  width: 1_280,
  height: 720,
  provenanceVerified: true,
  rightsApproved: true,
  privacyApproved: true,
  proofClassification: 'source_verified',
  checksumReadbackVerified: true,
  privateOnly: true,
  publicDeliveryAllowed: false,
  immutable: true,
})
const sourceRef = await store.putJson({
  artifactType: 'source_media_artifact_v1',
  ...scope,
  value: source,
})
assert.equal(sourceRef.sha256, hashSkillValue(source))

function candidate(sourceClass: 'gemini_omni_generated' | 'existing_project_source') {
  const provider = sourceClass === 'gemini_omni_generated'
  return createBrollCandidateMediaManifest({
    schemaVersion: 'b_roll_candidate_media_manifest_v1',
    ...lineage,
    planId: 'artifact-contract-plan',
    planHash,
    approvedWorkGraphHash: graphHash,
    workItemKey: provider ? 'generate-candidate' : 'prepare-source',
    workItemHash,
    sourceClass,
    providerOperationId: provider ? 'provider.google.generate_b_roll_candidate.v1' : null,
    providerAttemptId: provider ? hashSkillValue({ attempt: 1 }) : null,
    providerRoute: provider ? 'gemini_omni_flash' : null,
    configuredModelAlias: provider ? 'gemini-omni-flash-preview' : null,
    acceptedRuntimeModel: provider ? 'injected-gemini-omni-v5-fixture' : null,
    candidateVersion: 1,
    privateObjectIdentityHash: hashSkillValue({ privateObject: sourceClass }),
    objectSha256: hashSkillValue({ bytes: sourceClass }),
    byteLength: 16_384,
    mimeType: 'video/mp4',
    container: 'mp4',
    durationSeconds: 3,
    frameCount: 72,
    fps: 24,
    width: 1_280,
    height: 720,
    audioStreamPresent: false,
    sourceArtifactHashes: provider ? [] : [sourceRef.sha256],
    referenceArtifactHashes: [],
    generationClassification: provider ? 'illustrative_generated' : 'source_verified',
    proofSafetyClassification: provider
      ? 'illustrative_not_verified_proof'
      : 'source_verified_not_generated_proof',
    costEvidenceRef: evidenceRef,
    usageEvidenceRef: evidenceRef,
    checksumReadbackVerified: true,
    privateOnly: true,
    publicDeliveryAllowed: false,
    automaticSelectionAllowed: false,
    timelineMutationAllowed: false,
  })
}

const providerMedia = candidate('gemini_omni_generated')
const existingMedia = candidate('existing_project_source')
assert.doesNotThrow(() => brollCandidateMediaManifestSchema.parse(providerMedia))
assert.doesNotThrow(() => brollCandidateMediaManifestSchema.parse(existingMedia))
await store.putJson({ artifactType: 'b_roll_candidate_media_manifest_v1', ...scope, value: providerMedia })
await store.putJson({ artifactType: 'b_roll_candidate_media_manifest_v1', ...scope, value: existingMedia })

for (const invalid of [
  { ...providerMedia, mediaManifestHash: '0'.repeat(64) },
  { ...providerMedia, rawBytesBase64: 'AAAA' },
  { ...providerMedia, providerOutputUrl: 'https://provider.invalid/candidate.mp4' },
  { ...providerMedia, publicDeliveryAllowed: true },
  { ...providerMedia, automaticSelectionAllowed: true },
  { ...providerMedia, timelineMutationAllowed: true },
]) assert.throws(() => brollCandidateMediaManifestSchema.parse(invalid))

const { mediaManifestHash: _providerMediaManifestHash, ...providerMediaCore } = providerMedia
void _providerMediaManifestHash
const crossScopeMedia = createBrollCandidateMediaManifest({
  ...providerMediaCore,
  workspaceId: 'foreign-workspace',
})
await assert.rejects(
  () => store.putJson({
    artifactType: 'b_roll_candidate_media_manifest_v1',
    ...scope,
    value: crossScopeMedia,
  }),
  /cross-tenant/iu,
)

const preview = createBrollPrivatePreviewMediaManifest({
  schemaVersion: 'b_roll_private_preview_media_manifest_v1',
  ...lineage,
  planId: 'artifact-contract-plan',
  planHash,
  approvedWorkGraphHash: graphHash,
  workItemKey: 'render-preview',
  workItemHash,
  layerManifestHash: hashSkillValue({ layer: 'artifact-contract' }),
  privateObjectIdentityHash: hashSkillValue({ privateObject: 'preview' }),
  objectSha256: hashSkillValue({ bytes: 'preview' }),
  byteLength: 32_768,
  mimeType: 'video/mp4',
  container: 'mp4',
  durationSeconds: 3,
  frameCount: 72,
  fps: 24,
  width: 1_280,
  height: 720,
  remotionRequestHash: hashSkillValue({ request: 'remotion' }),
  remotionAttestationHash: hashSkillValue({ attestation: 'remotion' }),
  checksumReadbackVerified: true,
  privateOnly: true,
  publicDeliveryAllowed: false,
  finalCustomerExport: false,
  outsideAuthorizedRangeModified: false,
})
assert.doesNotThrow(() => brollPrivatePreviewMediaManifestSchema.parse(preview))
await store.putJson({
  artifactType: 'b_roll_private_preview_media_manifest_v1',
  ...scope,
  value: preview,
})
assert.throws(() => brollPrivatePreviewMediaManifestSchema.parse({
  ...preview,
  publicDeliveryAllowed: true,
}))

console.log(JSON.stringify({
  status: 'ok',
  activeStrictArtifactCount: activeTypes.length,
  sourceArtifactHash: source.artifactHash,
  providerMediaManifestHash: providerMedia.mediaManifestHash,
  existingMediaManifestHash: existingMedia.mediaManifestHash,
  privatePreviewManifestHash: preview.previewManifestHash,
  rawBytesInJson: false,
  providerUrlsInPublicBoundary: false,
  legacyActiveArtifactTypes: 0,
}, null, 2))
