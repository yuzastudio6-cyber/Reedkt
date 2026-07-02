import { z } from 'zod'
import { idSchema } from './common-schemas'

export const claimWorkerJobSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema.optional(),
  workerType: z.string().min(1),
  workerInstanceId: z.string().min(1),
  leaseExpiresAt: z.string().min(1),
})

export const releaseWorkerJobSchema = z.object({
  workspaceId: idSchema.optional(),
  claimStatus: z.enum(['released', 'completed', 'failed', 'expired', 'cancelled']).default('released'),
})

export const recordToolRuntimeCheckSchema = z.object({
  workspaceId: idSchema,
  workerType: z.string().min(1),
  runtimeRegion: z.enum(['us-east1', 'europe-west1']).optional(),
  toolName: z.enum(['ffmpeg', 'ffprobe', 'remotion', 'sharp_libvips', 'audioflux', 'signalsmith_stretch', 'opencv', 'vapoursynth', 'playwright']),
  toolVersion: z.string().optional(),
  checkStatus: z.enum(['passed', 'warning', 'failed', 'missing', 'blocked']),
  checkSummary: z.string().min(1),
  binaryPath: z.string().optional(),
  capabilitiesJson: z.record(z.string(), z.unknown()).optional(),
})

export const toolReadinessCheckSchema = z.object({
  workspaceId: idSchema.optional(),
  workerType: z.string().min(1).optional(),
  toolName: z.enum(['ffmpeg', 'ffprobe', 'remotion', 'sharp_libvips', 'audioflux', 'signalsmith_stretch', 'opencv', 'vapoursynth', 'playwright']).optional(),
  recordResults: z.boolean().optional(),
}).strict()

export const runWorkerJobSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema.optional(),
  workerType: z.string().min(1),
  workerInstanceId: z.string().min(1).optional(),
  idempotencyKey: z.string().min(1),
  dryRun: z.boolean().optional(),
  jobType: z.string().min(1).optional(),
  approvedPlanSnapshotId: idSchema.optional(),
  creditReservationId: idSchema.optional(),
  mediaAssetId: idSchema.optional(),
  storageObjectRecordId: idSchema.optional(),
  payloadJson: z.record(z.string(), z.unknown()).optional(),
}).strict()

export const probeMediaJobSchema = runWorkerJobSchema.extend({
  workerType: z.string().min(1).default('media_probe_worker'),
  jobType: z.string().min(1).default('media_analysis'),
}).strict()

const gstreamerMkvtoolnixNarrowExecutionReadyCommandTemplates = [
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
] as const

export const gstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  approvedSnapshotId: idSchema,
  approvalRecordId: idSchema,
  creditOrNoSpendPolicyId: idSchema,
  jobId: idSchema,
  workerLeaseId: idSchema,
  workerEnvelopeId: idSchema,
  runtimePacketId: idSchema,
  runtimeExecutionId: idSchema,
  runtimeExecutionMode: z.literal('controlled_generated_fixture_runtime_execution'),
  fixtureScope: z.literal('generated_srt_and_generated_subtitle_only_mkv_fixture'),
  routeOwner: z.literal('backend_service_role_only'),
  routeBridgeMode: z.literal('delegates_existing_guarded_runtime_packet'),
  commandTemplates: z.tuple([
    z.literal(gstreamerMkvtoolnixNarrowExecutionReadyCommandTemplates[0]),
    z.literal(gstreamerMkvtoolnixNarrowExecutionReadyCommandTemplates[1]),
    z.literal(gstreamerMkvtoolnixNarrowExecutionReadyCommandTemplates[2]),
    z.literal(gstreamerMkvtoolnixNarrowExecutionReadyCommandTemplates[3]),
  ]),
  privateInputManifestId: idSchema,
  outputManifestSchemaId: idSchema,
  qaReportSchemaId: idSchema,
  cleanupPolicyId: idSchema,
  retentionPolicyId: idSchema,
  failurePolicyId: idSchema,
  nonPublicArtifactPolicyId: idSchema,
  confirmation: z.boolean(),
  rawCommand: z.string().optional().nullable(),
  rawChat: z.string().optional().nullable(),
  arbitraryFilePath: z.string().optional().nullable(),
  privateMediaPath: z.string().optional().nullable(),
  userMediaPath: z.string().optional().nullable(),
  publicUrl: z.string().optional().nullable(),
  signedUrl: z.string().optional().nullable(),
  routeExecutionRequestedNow: z.boolean().optional(),
  workerDispatchRequestedNow: z.boolean().optional(),
  workerExecutionRequestedNow: z.boolean().optional(),
  workerProcessStartRequestedNow: z.boolean().optional(),
  workerLeaseClaimRequestedNow: z.boolean().optional(),
  persistentJobQueueWriteRequestedNow: z.boolean().optional(),
  privateMediaProcessingRequestedNow: z.boolean().optional(),
  userMediaProcessingRequestedNow: z.boolean().optional(),
  supabaseMutationRequestedNow: z.boolean().optional(),
  sqlExecutionRequestedNow: z.boolean().optional(),
  signedUrlCreationRequestedNow: z.boolean().optional(),
  publicArtifactRequestedNow: z.boolean().optional(),
  finalRenderExportRequestedNow: z.boolean().optional(),
  externalBetaUnlockRequestedNow: z.boolean().optional(),
  paidProductionUnlockRequestedNow: z.boolean().optional(),
  productionUnlockRequestedNow: z.boolean().optional(),
}).strict()
