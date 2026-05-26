import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { ProductionStorageBucketPurpose, ToolArtifactType } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type { ProductionWorkflowArtifactRecord, ProductionWorkflowArtifactSummary, ProductionWorkflowStage } from './production-workflow-types'
import { workflowNow } from './production-workflow-types'

export class ProductionWorkflowArtifactStore {
  private readonly records = new Map<string, ProductionWorkflowArtifactRecord>()
  private signedUrlRejectedCount = 0

  addArtifact(artifact: ToolArtifact, producedByStage: ProductionWorkflowStage, options: {
    sourceImmutable?: boolean
    tempFixtureLocalPath?: string
    cleanupRequired?: boolean
  } = {}): ToolArtifact {
    this.assertPrivateArtifact(artifact)
    this.records.set(artifact.id, {
      artifact,
      producedByStage,
      consumedByStages: [],
      sourceImmutable: options.sourceImmutable ?? true,
      tempFixtureLocalPath: options.tempFixtureLocalPath,
      cleanupRequired: options.cleanupRequired,
    })
    return artifact
  }

  addPlannedArtifact(input: {
    workspaceId: string
    projectId: string
    mediaAssetId: string
    stage: ProductionWorkflowStage
    artifactType: ToolArtifactType
    fileName: string
    storageBucketPurpose?: ProductionStorageBucketPurpose
    contentType?: string
    sourceOfTruth?: boolean
    previewAllowed?: boolean
    metadata?: Record<string, string | number | boolean | null>
  }): ToolArtifact {
    const artifact = buildWorkflowArtifact(input)
    return this.addArtifact(artifact, input.stage, { sourceImmutable: true })
  }

  consumeArtifact(artifactId: string, consumerStage: ProductionWorkflowStage): void {
    const record = this.records.get(artifactId)
    if (!record) return
    if (!record.consumedByStages.includes(consumerStage)) record.consumedByStages.push(consumerStage)
  }

  consumeArtifactsByType(artifactType: ToolArtifactType, consumerStage: ProductionWorkflowStage): ToolArtifact[] {
    const artifacts = this.getArtifactsByType(artifactType)
    for (const artifact of artifacts) this.consumeArtifact(artifact.id, consumerStage)
    return artifacts
  }

  getArtifacts(): ToolArtifact[] {
    return [...this.records.values()].map((record) => record.artifact)
  }

  getArtifactsByType(artifactType: ToolArtifactType): ToolArtifact[] {
    return this.getArtifacts().filter((artifact) => artifact.artifactType === artifactType)
  }

  validateRequiredArtifacts(requiredArtifacts: ToolArtifactType[]): ToolArtifactType[] {
    const existing = new Set(this.getArtifacts().map((artifact) => artifact.artifactType))
    return requiredArtifacts.filter((artifactType) => !existing.has(artifactType))
  }

  rejectSignedUrl(value: string): void {
    if (/^https?:\/\//i.test(value) || value.includes('?X-Goog-Signature=')) {
      this.signedUrlRejectedCount += 1
      throw new Error('Production E2E artifact store rejects signed URLs as source of truth.')
    }
  }

  buildSummary(requiredArtifacts: ToolArtifactType[] = []): ProductionWorkflowArtifactSummary {
    const byType: Partial<Record<ToolArtifactType, number>> = {}
    const records = [...this.records.values()]
    for (const { artifact } of records) {
      byType[artifact.artifactType] = (byType[artifact.artifactType] ?? 0) + 1
    }
    return {
      totalArtifacts: records.length,
      byType,
      privateArtifactCount: records.filter(({ artifact }) => artifact.isPrivate).length,
      signedUrlRejectedCount: this.signedUrlRejectedCount,
      sourceImmutable: records.every((record) => record.sourceImmutable),
      producerConsumerPairs: records.map((record) => ({
        artifactId: record.artifact.id,
        artifactType: record.artifact.artifactType,
        producedByStage: record.producedByStage,
        consumedByStages: record.consumedByStages,
      })),
      missingRequiredArtifactTypes: this.validateRequiredArtifacts(requiredArtifacts),
      tempFixtureCleanupRequired: records
        .filter((record) => record.cleanupRequired && record.tempFixtureLocalPath)
        .map((record) => record.tempFixtureLocalPath as string),
    }
  }

  private assertPrivateArtifact(artifact: ToolArtifact): void {
    this.rejectSignedUrl(artifact.storageObjectPath)
    if (!artifact.isPrivate) throw new Error(`E2E artifact ${artifact.id} must be private.`)
    const metadataText = artifact.metadata ? JSON.stringify(artifact.metadata) : ''
    if (/https?:\/\//i.test(metadataText) || metadataText.includes('X-Goog-Signature=')) {
      this.signedUrlRejectedCount += 1
      throw new Error(`E2E artifact ${artifact.id} contains signed URL metadata.`)
    }
  }
}

export function buildWorkflowArtifact(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  stage: ProductionWorkflowStage
  artifactType: ToolArtifactType
  fileName: string
  storageBucketPurpose?: ProductionStorageBucketPurpose
  contentType?: string
  sourceOfTruth?: boolean
  previewAllowed?: boolean
  metadata?: Record<string, string | number | boolean | null>
}): ToolArtifact {
  const safeFileName = input.fileName.replace(/[^a-z0-9_.-]/gi, '-')
  return {
    id: `${input.stage}-${input.artifactType}-${safeFileName}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    artifactType: input.artifactType,
    storageBucketPurpose: input.storageBucketPurpose ?? defaultBucketPurpose(input.artifactType),
    storageObjectPath: `workspaces/${input.workspaceId}/projects/${input.projectId}/media/${input.mediaAssetId}/e2e/${input.stage}/${safeFileName}`,
    contentType: input.contentType ?? defaultContentType(input.artifactType),
    createdAt: workflowNow(),
    isPrivate: true,
    metadata: {
      milestone: 'production_runtime_m16b',
      producedByStage: input.stage,
      sourceMediaImmutable: true,
      noSignedUrls: true,
      structuredPlanOnly: true,
      noRevideo: true,
      ...(input.metadata ?? {}),
    },
    previewAllowed: input.previewAllowed ?? input.artifactType === 'preview_video',
    sourceOfTruth: input.sourceOfTruth ?? (input.artifactType === 'render_manifest' || input.artifactType === 'final_export'),
  }
}

function defaultBucketPurpose(artifactType: ToolArtifactType): ProductionStorageBucketPurpose {
  if (artifactType === 'source_media') return 'source_media'
  if (artifactType === 'proxy_video') return 'proxy_media'
  if (artifactType === 'transcript_json' || artifactType === 'word_timestamps_json' || artifactType === 'caption_segments_json') return 'transcripts'
  if (artifactType === 'mask_image' || artifactType === 'mask_sequence' || artifactType === 'rgba_cutout') return 'masks'
  if (artifactType === 'preview_video') return 'previews'
  if (artifactType === 'final_export') return 'final_exports'
  if (artifactType === 'qa_report') return 'qa_artifacts'
  return 'generated_assets'
}

function defaultContentType(artifactType: ToolArtifactType): string {
  if (artifactType === 'preview_video' || artifactType === 'final_export' || artifactType === 'enhanced_video' || artifactType === 'interpolated_video' || artifactType === 'proxy_video') return 'video/mp4'
  if (artifactType === 'cleaned_audio' || artifactType === 'separated_audio_stem' || artifactType === 'extracted_audio') return 'audio/wav'
  if (artifactType === 'mask_image' || artifactType === 'rgba_cutout' || artifactType === 'representative_frame') return 'image/png'
  return 'application/json'
}
