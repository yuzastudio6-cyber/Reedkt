import {
  deepFreezeSkillValue,
  hashSkillValue,
} from '../../core/skill-capability-manifest-hash'

export const TRACK_ALL_SAM31_REAL_PRIVATE_WORKER_PROTOCOL_VERSION =
  'track_all_sam3_1_real_private_worker_protocol_v1' as const
export const TRACK_ALL_SAM31_REAL_PRIVATE_SESSION_OWNER_VERSION =
  'track_all_sam3_1_real_private_session_owner_v1' as const
export const TRACK_ALL_SAM31_REAL_PRIVATE_DOCKER_TARGET =
  'track_all_v2_candidate' as const

const descriptor = {
  schemaVersion: 'track_all_sam3_1_real_private_runtime_authority_v1',
  operationId: 'tool.sam3_1.track_masklets.v2',
  sourceRevision: '96914d2425f90a64f45ca977c2b5165418099543',
  checkpointRevision: 'daa63191845a41281374e725f4c9e51c7a824460',
  workerProtocolVersion: TRACK_ALL_SAM31_REAL_PRIVATE_WORKER_PROTOCOL_VERSION,
  sessionOwnerVersion: TRACK_ALL_SAM31_REAL_PRIVATE_SESSION_OWNER_VERSION,
  dockerTarget: TRACK_ALL_SAM31_REAL_PRIVATE_DOCKER_TARGET,
  officialBuilder: 'build_sam3_multiplex_video_predictor',
  officialLifecycle: [
    'start_session',
    'add_prompt',
    'propagate_in_video',
    'remove_object',
    'reset_session',
    'cancel_propagation',
    'close_session',
  ],
  fixedMaximumFrames: 240,
  fixedMaximumObjects: 16,
  automaticRetryCount: 0,
  automaticAlternateModelFallbackCount: 0,
  callerSelectedModelCheckpointGpuCommandPathUrlOrPriceAccepted: false,
  rawUserChatAccepted: false,
  privateCreateOnlyOutputRequired: true,
  runtimeDownloadAllowed: false,
  productionAuthorityGranted: false,
} as const

export const TRACK_ALL_SAM31_REAL_PRIVATE_RUNTIME_AUTHORITY =
  deepFreezeSkillValue({
    ...descriptor,
    authorityHash: hashSkillValue(descriptor),
  })

