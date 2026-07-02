import type { ID, ISODateString, JSONObject } from '../../types/shared'
import type { ProductionStorageBucketPurpose, ToolArtifactType } from './production-tool-runtime-contracts'

export interface ToolArtifact {
  id: ID
  workspaceId: ID
  projectId: ID
  mediaAssetId: ID
  toolRunId?: ID
  artifactType: ToolArtifactType
  storageBucketPurpose: ProductionStorageBucketPurpose
  storageObjectPath: string
  contentType: string
  sizeBytes?: number
  checksum?: string
  createdAt: ISODateString
  expiresAt?: ISODateString
  isPrivate: boolean
  metadata: JSONObject
  previewAllowed: boolean
  sourceOfTruth: boolean
}
