import type { ProductionStorageReference, ToolArtifactType } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import { assertNoPathTraversal, assertNoSignedUrlOrRawUrl, safeJoinStoragePath } from '../media/media-path-safety'
import type { FinalRenderExecutionInput, RenderResolvedAsset } from './render-execution-types'

export function resolveRenderAssets(input: FinalRenderExecutionInput): RenderResolvedAsset[] {
  const assets: RenderResolvedAsset[] = []

  for (const artifactId of input.sourceVideoArtifactIds ?? []) assets.push(buildArtifactAsset(artifactId, 'source_media', true))
  for (const artifactId of input.proxyVideoArtifactIds ?? []) assets.push(buildArtifactAsset(artifactId, 'proxy_video', true))
  for (const artifactId of input.captionArtifactIds ?? []) assets.push(buildArtifactAsset(artifactId, 'caption_segments_json', false))
  for (const artifactId of input.audioArtifactIds ?? []) assets.push(buildArtifactAsset(artifactId, 'cleaned_audio', false))
  for (const artifactId of input.colorArtifactIds ?? []) assets.push(buildArtifactAsset(artifactId, 'color_grade_recipe', false))
  for (const artifactId of input.maskArtifactIds ?? []) assets.push(buildArtifactAsset(artifactId, 'mask_sequence', false))
  for (const artifactId of input.enhancementArtifactIds ?? []) assets.push(buildArtifactAsset(artifactId, 'enhanced_video', false))
  for (const artifactId of input.slowMotionArtifactIds ?? []) assets.push(buildArtifactAsset(artifactId, 'interpolated_video', false))

  for (const storageRef of [...(input.timelineManifest?.sourceReferences ?? []), ...(input.renderManifest?.assets ?? [])]) {
    validateStorageRef(storageRef)
    assets.push({
      assetId: storageRef.storageObjectPath,
      storageRef,
      required: storageRef.sourceOfTruth,
      optional: !storageRef.sourceOfTruth,
      source: 'manifest_ref',
    })
  }

  for (const localPath of input.sourceLocalPaths ?? []) assets.push(buildLocalAsset(localPath, 'source_media', true))
  for (const localPath of input.proxyLocalPaths ?? []) assets.push(buildLocalAsset(localPath, 'proxy_video', true))
  for (const localPath of input.captionLocalPaths ?? []) assets.push(buildLocalAsset(localPath, 'caption_segments_json', false))
  for (const localPath of input.audioLocalPaths ?? []) assets.push(buildLocalAsset(localPath, 'cleaned_audio', false))

  return assets
}

export function assertResolvedAssetsAreSafe(assets: RenderResolvedAsset[]): void {
  for (const asset of assets) {
    if (asset.localPath) {
      assertNoSignedUrlOrRawUrl(asset.localPath, 'renderAssetLocalPath')
      assertNoPathTraversal(asset.localPath, 'renderAssetLocalPath')
    }
    if (asset.storageRef) validateStorageRef(asset.storageRef)
  }
}

function buildArtifactAsset(artifactId: string, artifactType: ToolArtifactType, required: boolean): RenderResolvedAsset {
  assertNoSignedUrlOrRawUrl(artifactId, 'artifactId')
  assertNoPathTraversal(artifactId, 'artifactId')
  return {
    assetId: artifactId,
    artifactType,
    storageRef: {
      storageBucketPurpose: artifactType === 'proxy_video' ? 'proxy_media' : artifactType === 'source_media' ? 'source_media' : 'generated_assets',
      storageObjectPath: safeJoinStoragePath('artifact-refs', artifactId),
      sourceOfTruth: required,
    },
    required,
    optional: !required,
    source: 'artifact_id',
  }
}

function buildLocalAsset(localPath: string, artifactType: ToolArtifactType, required: boolean): RenderResolvedAsset {
  assertNoSignedUrlOrRawUrl(localPath, 'renderLocalPath')
  assertNoPathTraversal(localPath, 'renderLocalPath')
  return {
    assetId: localPath,
    artifactType,
    localPath,
    required,
    optional: !required,
    source: 'local_path',
  }
}

function validateStorageRef(storageRef: ProductionStorageReference): void {
  assertNoSignedUrlOrRawUrl(storageRef.storageObjectPath, 'storageObjectPath')
  assertNoPathTraversal(storageRef.storageObjectPath, 'storageObjectPath')
}
