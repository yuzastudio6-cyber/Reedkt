export type Qwen25VlControlledPrivateDownloadDecision =
  'qwen2_5_vl_7b_controlled_private_download_verified_no_inference'

export type Qwen25VlControlledPrivateFileRole =
  | 'git_lfs_metadata'
  | 'model_card_provenance'
  | 'chat_template'
  | 'model_config'
  | 'generation_config'
  | 'tokenizer_merges'
  | 'model_weight_shard'
  | 'model_weight_index'
  | 'vision_preprocessor_config'
  | 'tokenizer'
  | 'tokenizer_config'
  | 'tokenizer_vocab'

export interface Qwen25VlControlledPrivateFileManifestEntry {
  relativePath: string
  role: Qwen25VlControlledPrivateFileRole
  sizeBytes: number
  localSha256: string
  remoteLfsSha256?: string
  remoteLfsSha256Matched?: boolean
}

export interface Qwen25VlControlledPrivateDownloadManifest {
  decision: Qwen25VlControlledPrivateDownloadDecision
  workstream: 'AI_VIDEO_BROLL_GENERATION'
  toolId: 'qwen_vl'
  modelWeightTemplateId: 'qwen2_5_vl_7b_model'
  modelId: 'Qwen/Qwen2.5-VL-7B-Instruct'
  sourceRevision: string
  licenseTag: 'license:apache-2.0'
  pipelineTag: 'image-text-to-text'
  privateCachePath: string
  runtimeMountTarget: string
  cacheInsideRepo: false
  fileCount: number
  weightShardCount: number
  totalSizeBytes: number
  checksumAlgorithm: 'sha256'
  checksumManifestSha256: string
  privateCacheVerified: true
  localChecksumVerified: true
  localChecksumCoverageClaimedForPrivateCacheOnly: true
  templateChecksumFieldAllowed: false
  modelWeightsDownloaded: true
  modelImportsRun: false
  modelInferenceRun: false
  generatedVideoCreated: false
  generatedAssetsCreated: false
  providerCallsMade: false
  workersDispatched: false
  supabaseTouched: false
  sqlExecuted: false
  gcpMutationCreated: false
  dockerRun: false
  publicArtifactsCreated: false
  signedUrlsCreated: false
  creditMutationCreated: false
  betaUnlocked: false
  productionUnlocked: false
  dryRunPassedClaimed: false
  generatedLocalFixturePassedClaimed: false
  firstCostFriendlyGpuTarget: 'nvidia_l4_google_cloud_g2_first'
  recommendedInitialVmShape: 'g2-standard-8'
  minimumImportSmokeVmShape: 'g2-standard-4'
  maxModelLen: 2048
  maxNumSeqs: 1
  imageInputCapPx: 384
  files: Qwen25VlControlledPrivateFileManifestEntry[]
  nextPrompt: 'QWEN2_5_VL_STACK_TOOL_3: private Qwen2.5-VL model loader import gate, no inference'
}

export const QWEN2_5_VL_7B_CONTROLLED_PRIVATE_DOWNLOAD_MANIFEST: Qwen25VlControlledPrivateDownloadManifest = {
  decision: 'qwen2_5_vl_7b_controlled_private_download_verified_no_inference',
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen_vl',
  modelWeightTemplateId: 'qwen2_5_vl_7b_model',
  modelId: 'Qwen/Qwen2.5-VL-7B-Instruct',
  sourceRevision: 'cc594898137f460bfe9f0759e9844b3ce807cfb5',
  licenseTag: 'license:apache-2.0',
  pipelineTag: 'image-text-to-text',
  privateCachePath: '/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5',
  runtimeMountTarget: '/opt/reeditpro/model-weights/vlm/qwen2.5-vl-7b-instruct/',
  cacheInsideRepo: false,
  fileCount: 16,
  weightShardCount: 5,
  totalSizeBytes: 16595981281,
  checksumAlgorithm: 'sha256',
  checksumManifestSha256: '46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b',
  privateCacheVerified: true,
  localChecksumVerified: true,
  localChecksumCoverageClaimedForPrivateCacheOnly: true,
  templateChecksumFieldAllowed: false,
  modelWeightsDownloaded: true,
  modelImportsRun: false,
  modelInferenceRun: false,
  generatedVideoCreated: false,
  generatedAssetsCreated: false,
  providerCallsMade: false,
  workersDispatched: false,
  supabaseTouched: false,
  sqlExecuted: false,
  gcpMutationCreated: false,
  dockerRun: false,
  publicArtifactsCreated: false,
  signedUrlsCreated: false,
  creditMutationCreated: false,
  betaUnlocked: false,
  productionUnlocked: false,
  dryRunPassedClaimed: false,
  generatedLocalFixturePassedClaimed: false,
  firstCostFriendlyGpuTarget: 'nvidia_l4_google_cloud_g2_first',
  recommendedInitialVmShape: 'g2-standard-8',
  minimumImportSmokeVmShape: 'g2-standard-4',
  maxModelLen: 2048,
  maxNumSeqs: 1,
  imageInputCapPx: 384,
  files: [
    {
      relativePath: '.gitattributes',
      role: 'git_lfs_metadata',
      sizeBytes: 1519,
      localSha256: '11ad7efa24975ee4b0c3c3a38ed18737f0658a5f75a0a96787b576a78a023361',
    },
    {
      relativePath: 'README.md',
      role: 'model_card_provenance',
      sizeBytes: 18574,
      localSha256: '1fa65dbb08bc9ffe0b020409c8686f08b23008c5a68554353305fd2de6f2b81e',
    },
    {
      relativePath: 'chat_template.json',
      role: 'chat_template',
      sizeBytes: 1050,
      localSha256: 'ad60d90252ed0b0705ba14e2d0ad0fec0beac1ea955642b54059b36052d8bc96',
    },
    {
      relativePath: 'config.json',
      role: 'model_config',
      sizeBytes: 1374,
      localSha256: '77d9ec7321cc572e3579e2c84799c9cadaded63c49ce93b101733349fc330c43',
    },
    {
      relativePath: 'generation_config.json',
      role: 'generation_config',
      sizeBytes: 216,
      localSha256: '0a3aea82869fe29f20dc95ccf3e2bcff380eca1f5ad6447a4a4b37110b08e43e',
    },
    {
      relativePath: 'merges.txt',
      role: 'tokenizer_merges',
      sizeBytes: 1671839,
      localSha256: '599bab54075088774b1733fde865d5bd747cbcc7a547c5bc12610e874e26f5e3',
    },
    {
      relativePath: 'model-00001-of-00005.safetensors',
      role: 'model_weight_shard',
      sizeBytes: 3900233256,
      localSha256: 'e97b877e47fde53a6c6e77aafb36e58e91ee9d95c4a3eeac6f1b5c0e6a1c986e',
      remoteLfsSha256: 'e97b877e47fde53a6c6e77aafb36e58e91ee9d95c4a3eeac6f1b5c0e6a1c986e',
      remoteLfsSha256Matched: true,
    },
    {
      relativePath: 'model-00002-of-00005.safetensors',
      role: 'model_weight_shard',
      sizeBytes: 3864726320,
      localSha256: 'a9a300a43b4724eee2abe7c18ceb26768d0ab011eb0cad19d9bfd2476a24d024',
      remoteLfsSha256: 'a9a300a43b4724eee2abe7c18ceb26768d0ab011eb0cad19d9bfd2476a24d024',
      remoteLfsSha256Matched: true,
    },
    {
      relativePath: 'model-00003-of-00005.safetensors',
      role: 'model_weight_shard',
      sizeBytes: 3864726424,
      localSha256: '111223d173e00bbee81cba1216fad28668df3476706b7fd26f4d5b50f8b3a507',
      remoteLfsSha256: '111223d173e00bbee81cba1216fad28668df3476706b7fd26f4d5b50f8b3a507',
      remoteLfsSha256Matched: true,
    },
    {
      relativePath: 'model-00004-of-00005.safetensors',
      role: 'model_weight_shard',
      sizeBytes: 3864733680,
      localSha256: 'ef47f634fa57d46ee134edcc09f34085a47da1e16c12a2abe0d67118be6d72ed',
      remoteLfsSha256: 'ef47f634fa57d46ee134edcc09f34085a47da1e16c12a2abe0d67118be6d72ed',
      remoteLfsSha256Matched: true,
    },
    {
      relativePath: 'model-00005-of-00005.safetensors',
      role: 'model_weight_shard',
      sizeBytes: 1089994880,
      localSha256: '0c859795ad3a627a9b95bcb762e059d5b768a4a36fdd4affeff269d93fdecc67',
      remoteLfsSha256: '0c859795ad3a627a9b95bcb762e059d5b768a4a36fdd4affeff269d93fdecc67',
      remoteLfsSha256Matched: true,
    },
    {
      relativePath: 'model.safetensors.index.json',
      role: 'model_weight_index',
      sizeBytes: 57619,
      localSha256: '73b333b0b16e5286ddba615d2caebcd495cf7e616f52eb217a81781393d79de9',
    },
    {
      relativePath: 'preprocessor_config.json',
      role: 'vision_preprocessor_config',
      sizeBytes: 350,
      localSha256: 'f2058c716eef96ccaed1cc1e2d0c08306b62586d535b28d9d08e691b2fab7ca0',
    },
    {
      relativePath: 'tokenizer.json',
      role: 'tokenizer',
      sizeBytes: 7031645,
      localSha256: 'c0382117ea329cdf097041132f6d735924b697924d6f6fc3945713e96ce87539',
    },
    {
      relativePath: 'tokenizer_config.json',
      role: 'tokenizer_config',
      sizeBytes: 5702,
      localSha256: '4abd3520120e266da84c0864fee064d1fb10806f02225911a47253dd38dc5f56',
    },
    {
      relativePath: 'vocab.json',
      role: 'tokenizer_vocab',
      sizeBytes: 2776833,
      localSha256: 'ca10d7e9fb3ed18575dd1e277a2579c16d108e32f27439684afa0e10b1440910',
    },
  ],
  nextPrompt: 'QWEN2_5_VL_STACK_TOOL_3: private Qwen2.5-VL model loader import gate, no inference',
}
