export type AiVideoBrollWanFastCacheManifestEntry = {
  relativePath: string
  expectedBytes: number
  role:
    | 'pipeline_index'
    | 'scheduler_config'
    | 'text_encoder_config'
    | 'text_encoder_weight'
    | 'text_encoder_weight_index'
    | 'tokenizer_asset'
    | 'transformer_config'
    | 'transformer_weight'
    | 'transformer_weight_index'
    | 'vae_config'
    | 'vae_weight'
}

export const AI_VIDEO_BROLL_WAN_FAST_CACHE_READINESS_SPEC = {
  decision: 'ai_video_broll_wan_fast_cache_readiness_stat_only_ready_quota_blocked',
  mode: 'stat_only_private_cache_readiness_check',
  toolId: 'ai_video_broll_generation_wan',
  modelRepository: 'Wan-AI/Wan2.1-T2V-1.3B-Diffusers',
  sourceCommit: '0fad780a534b6463e45facd96134c9f345acfa5b',
  privateCachePath:
    '/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B-Diffusers/0fad780a534b6463e45facd96134c9f345acfa5b',
  runtimeEssentialFileCount: 19,
  aggregateBytes: 28928887859,
  expectedModelIndexClassName: 'WanPipeline',
  quotaBlocker: 'gpus_all_regions_quota_zero',
  selectedGpu: 'nvidia_l4',
  statOnly: true,
  hashesComputed: false,
  modelImportRun: false,
  modelInferenceRun: false,
  generatedVideoCreated: false,
  generatedAssetsCreated: false,
  providerCallsMade: false,
  workersDispatched: false,
  computeVmCreated: false,
  dockerRun: false,
  gcpMutatingCommandsExecuted: false,
  supabaseTouched: false,
  sqlExecuted: false,
  creditMutationCreated: false,
  readyForExternalAgentExecutionNow: false,
  readyForBoundedRetryAfterBlockerClears: true,
  nextAction:
    'AI-VIDEO-BROLL-GEN-9J-GPU-GLOBAL-QUOTA-USER: request GPUS_ALL_REGIONS quota increase to 1 in Google Cloud Console, no repo changes',
  manifest: [
    { relativePath: 'model_index.json', expectedBytes: 400, role: 'pipeline_index' },
    { relativePath: 'scheduler/scheduler_config.json', expectedBytes: 751, role: 'scheduler_config' },
    { relativePath: 'text_encoder/config.json', expectedBytes: 854, role: 'text_encoder_config' },
    {
      relativePath: 'text_encoder/model-00001-of-00005.safetensors',
      expectedBytes: 4972389712,
      role: 'text_encoder_weight',
    },
    {
      relativePath: 'text_encoder/model-00002-of-00005.safetensors',
      expectedBytes: 4899225672,
      role: 'text_encoder_weight',
    },
    {
      relativePath: 'text_encoder/model-00003-of-00005.safetensors',
      expectedBytes: 4966309504,
      role: 'text_encoder_weight',
    },
    {
      relativePath: 'text_encoder/model-00004-of-00005.safetensors',
      expectedBytes: 4999880704,
      role: 'text_encoder_weight',
    },
    {
      relativePath: 'text_encoder/model-00005-of-00005.safetensors',
      expectedBytes: 2885866152,
      role: 'text_encoder_weight',
    },
    {
      relativePath: 'text_encoder/model.safetensors.index.json',
      expectedBytes: 22476,
      role: 'text_encoder_weight_index',
    },
    { relativePath: 'tokenizer/special_tokens_map.json', expectedBytes: 7079, role: 'tokenizer_asset' },
    { relativePath: 'tokenizer/spiece.model', expectedBytes: 4548313, role: 'tokenizer_asset' },
    { relativePath: 'tokenizer/tokenizer.json', expectedBytes: 16837459, role: 'tokenizer_asset' },
    { relativePath: 'tokenizer/tokenizer_config.json', expectedBytes: 61758, role: 'tokenizer_asset' },
    { relativePath: 'transformer/config.json', expectedBytes: 465, role: 'transformer_config' },
    {
      relativePath: 'transformer/diffusion_pytorch_model-00001-of-00002.safetensors',
      expectedBytes: 4998781576,
      role: 'transformer_weight',
    },
    {
      relativePath: 'transformer/diffusion_pytorch_model-00002-of-00002.safetensors',
      expectedBytes: 677289072,
      role: 'transformer_weight',
    },
    {
      relativePath: 'transformer/diffusion_pytorch_model.safetensors.index.json',
      expectedBytes: 73296,
      role: 'transformer_weight_index',
    },
    { relativePath: 'vae/config.json', expectedBytes: 724, role: 'vae_config' },
    {
      relativePath: 'vae/diffusion_pytorch_model.safetensors',
      expectedBytes: 507591892,
      role: 'vae_weight',
    },
  ] satisfies AiVideoBrollWanFastCacheManifestEntry[],
} as const

export type AiVideoBrollWanFastCacheReadinessSpec =
  typeof AI_VIDEO_BROLL_WAN_FAST_CACHE_READINESS_SPEC
