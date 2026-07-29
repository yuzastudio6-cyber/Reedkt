import type {
  LivingFrameComfyUiDependencyLockEvidenceDraft,
  LivingFrameComfyUiDeterministicPromptProbe,
  LivingFrameComfyUiLockedSourceArchive,
  LivingFrameComfyUiLockedWheelArtifact,
} from '../../src/types/living-frame-comfyui-dependency-lock-evidence'

export const
LIVING_FRAME_COMFYUI_LOCKED_BASE_IMAGE_DIGEST_SHA256 =
  '8f83b1b549daac2800c8d86ef785be669340e8b504f948804209c7800fc76df4' as const

export const
LIVING_FRAME_COMFYUI_LOCKED_WHEEL_MANIFEST_DIGEST_SHA256 =
  'cc63d5e32c32497953482f864c5cd47bf9ef48ee59dca9ab484211af665c37e9' as const

export const
LIVING_FRAME_COMFYUI_LOCKED_CANDIDATE_IMAGE_DIGEST_SHA256 =
  '1de2c0415c477537dc4035a0550cec1859b8e5c5719647a64c0172962a770a64' as const

export const LIVING_FRAME_COMFYUI_LOCKED_WHEEL_ARTIFACTS =
  Object.freeze([
    wheel(
      0,
      'aiohappyeyeballs',
      '2.7.1',
      'aiohappyeyeballs-2.7.1-py3-none-any.whl',
      15_038,
      '9243213661e29250eb41368e5daa826fc017156c3b8a11440826b2e3ed376472',
    ),
    wheel(
      1,
      'aiohttp',
      '3.14.3',
      'aiohttp-3.14.3-cp310-cp310-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl',
      1_714_075,
      '48d67b87db6279c044760787eb01f6413032c2e6f3ba1cafaa492b1c8e578479',
    ),
    wheel(
      2,
      'aiosignal',
      '1.4.0',
      'aiosignal-1.4.0-py3-none-any.whl',
      7_490,
      '053243f8b92b990551949e63930a839ff0cf0b0ebbe0597b0f3fb19e1a0fe82e',
    ),
    wheel(
      3,
      'alembic',
      '1.18.5',
      'alembic-1.18.5-py3-none-any.whl',
      264_664,
      '06d8ba9d04558022f5395e9317de03d270f3dced49cee01f89fe7a13c26f14bc',
    ),
    wheel(
      4,
      'async-timeout',
      '5.0.1',
      'async_timeout-5.0.1-py3-none-any.whl',
      6_233,
      '39e3809566ff85354557ec2398b55e096c8364bacac9405a7a1fa429e77fe76c',
    ),
    wheel(
      5,
      'blake3',
      '1.0.9',
      'blake3-1.0.9-cp310-cp310-manylinux_2_17_x86_64.manylinux2014_x86_64.whl',
      387_632,
      'aa6e5c7533c915a24d840ae4be787e9a6059be7e77944b005b3d967a0257a17d',
    ),
    wheel(
      6,
      'comfy-aimdo',
      '0.4.10',
      'comfy_aimdo-0.4.10-cp39-abi3-manylinux2010_x86_64.manylinux2014_x86_64.manylinux_2_12_x86_64.manylinux_2_17_x86_64.whl',
      346_776,
      'ffae0519a8c37751e1097e8275a3450a5b8bee9aeb179b5da0c00fcb57a2cc5f',
    ),
    wheel(
      7,
      'comfy-angle',
      '0.1.0',
      'comfy_angle-0.1.0-py3-none-manylinux_2_28_x86_64.whl',
      4_619_358,
      '2f4d17e984353d37d247faf473afbabdb9863fc3af3e0206fbb7d82bdc23ac67',
    ),
    wheel(
      8,
      'comfy-kitchen',
      '0.2.22',
      'comfy_kitchen-0.2.22-cp310-cp310-manylinux_2_24_x86_64.manylinux_2_28_x86_64.whl',
      29_420_412,
      '579b192458c599f68846d330769adf507481079275437aa53ef6675e879b962b',
    ),
    wheel(
      9,
      'comfyui-embedded-docs',
      '0.5.9',
      'comfyui_embedded_docs-0.5.9-py3-none-any.whl',
      15_809_768,
      '30afae432a71c96aa59421d0f37388c66ff6572b8cbeee8ff045e4d5f84f896c',
    ),
    wheel(
      10,
      'comfyui_frontend_package',
      '1.47.10',
      'comfyui_frontend_package-1.47.10-py3-none-any.whl',
      20_678_703,
      '9a579e1cd40406a364f2207c8b480a4a9ab5b76e7478e16e927acb9a15d8d1bf',
    ),
    wheel(
      11,
      'comfyui_workflow_templates',
      '0.11.17',
      'comfyui_workflow_templates-0.11.17-py3-none-any.whl',
      10_683,
      'c8d92d6b9c7de9b15f13ae91c489a9446ca36da5f02489d6178fc0c6b9a55c59',
    ),
    wheel(
      12,
      'comfyui-workflow-templates-core',
      '0.3.280',
      'comfyui_workflow_templates_core-0.3.280-py3-none-any.whl',
      67_418,
      '202614b6ba18128f1e5b76fc1b79fda4346618e81f04f209467f834345f1b01e',
    ),
    wheel(
      13,
      'comfyui-workflow-templates-json',
      '0.1.14',
      'comfyui_workflow_templates_json-0.1.14-py3-none-any.whl',
      2_938_121,
      'b99051a6ce0c9eeda780a76c9dc830d7c90ca006cc06982d3e45d1762737e415',
    ),
    wheel(
      14,
      'comfyui-workflow-templates-media-api',
      '0.3.84',
      'comfyui_workflow_templates_media_api-0.3.84-py3-none-any.whl',
      100_148_800,
      'c2d6a5999ac39e4f37f47ae231c92557defe5addb2cc6ab5c11410b4d5a2910a',
    ),
    wheel(
      15,
      'comfyui-workflow-templates-media-assets-01',
      '0.1.10',
      'comfyui_workflow_templates_media_assets_01-0.1.10-py3-none-any.whl',
      17_369_912,
      'c6c6cbbb3360a66f3edb6ab11e1e1baa1afcad11e46bc5cf7ac485536eab6d91',
    ),
    wheel(
      16,
      'comfyui-workflow-templates-media-image',
      '0.3.160',
      'comfyui_workflow_templates_media_image-0.3.160-py3-none-any.whl',
      89_401_690,
      'd4a5c5541c7088f6adb1c7da41f5d7c1c14a037eda6a61cd8b4b76c251faaa93',
    ),
    wheel(
      17,
      'comfyui-workflow-templates-media-other',
      '0.3.229',
      'comfyui_workflow_templates_media_other-0.3.229-py3-none-any.whl',
      89_097_925,
      'ce3d98fa9d84b914c335fe5c9bc903cfefbe1932b1bc3cb6baef7f371b4bd435',
    ),
    wheel(
      18,
      'comfyui-workflow-templates-media-video',
      '0.3.101',
      'comfyui_workflow_templates_media_video-0.3.101-py3-none-any.whl',
      104_342_671,
      '6270fd61c8c3931b6f0031abac7d4c90ced624de6c7918bff85b89e6c3d7493c',
    ),
    wheel(
      19,
      'frozenlist',
      '1.8.0',
      'frozenlist-1.8.0-cp310-cp310-manylinux1_x86_64.manylinux_2_28_x86_64.manylinux_2_5_x86_64.whl',
      219_464,
      'f57fb59d9f385710aa7060e89410aeb5058b99e62f4d16b08b91986b9a2140c2',
    ),
    wheel(
      20,
      'greenlet',
      '3.5.4',
      'greenlet-3.5.4-cp310-cp310-manylinux_2_24_x86_64.manylinux_2_28_x86_64.whl',
      622_920,
      '4ab9f0704bccf6d3b38e0d2130b7b33271cff11453690da074fa280c3aa8e8e7',
    ),
    wheel(
      21,
      'Mako',
      '1.3.12',
      'mako-1.3.12-py3-none-any.whl',
      78_521,
      '8f61569480282dbf557145ce441e4ba888be453c30989f879f0d652e39f53ea9',
    ),
    wheel(
      22,
      'multidict',
      '6.7.1',
      'multidict-6.7.1-cp310-cp310-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl',
      243_273,
      '9b0d9b91d1aa44db9c1f1ecd0d9d2ae610b2f4f856448664e01a3b35899f3f92',
    ),
    wheel(
      23,
      'propcache',
      '0.5.2',
      'propcache-0.5.2-cp310-cp310-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl',
      60_140,
      'b96db7141a592cbc968daf1feea83a118e6ab378af4abbc72b248c895414c22d',
    ),
    wheel(
      24,
      'psutil',
      '7.2.2',
      'psutil-7.2.2-cp36-abi3-manylinux2010_x86_64.manylinux_2_12_x86_64.manylinux_2_28_x86_64.whl',
      155_560,
      '076a2d2f923fd4821644f5ba89f059523da90dc9014e85f8e45a5774ca5bc6f9',
    ),
    wheel(
      25,
      'pydantic-settings',
      '2.14.2',
      'pydantic_settings-2.14.2-py3-none-any.whl',
      61_715,
      'a20c97b37910b6550d5ea50fbcc2d4187defe58cd57070b73863d069419c9440',
    ),
    wheel(
      26,
      'PyOpenGL',
      '3.1.10',
      'pyopengl-3.1.10-py3-none-any.whl',
      3_194_996,
      '794a943daced39300879e4e47bd94525280685f42dbb5a998d336cfff151d74f',
    ),
    wheel(
      27,
      'python-dotenv',
      '1.2.2',
      'python_dotenv-1.2.2-py3-none-any.whl',
      22_101,
      '1d8214789a24de455a8b8bd8ae6fe3c6b69a5e3d64aa8a8e5d68e694bbcb285a',
    ),
    wheel(
      28,
      'sentencepiece',
      '0.2.2',
      'sentencepiece-0.2.2-cp310-cp310-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl',
      1_392_757,
      '44284adc6fbe9d5bdd480541431a3d93f674fa44736714d3ad4bcee8283ace7d',
    ),
    wheel(
      29,
      'simpleeval',
      '1.0.7',
      'simpleeval-1.0.7-py3-none-any.whl',
      18_792,
      '97ac271bfd8f2af9e7b9a36ceea67617f26fa873f9d5ae1922f64d4c1442534b',
    ),
    wheel(
      30,
      'spandrel',
      '0.4.2',
      'spandrel-0.4.2-py3-none-any.whl',
      320_811,
      '6c93e3ecbeb0e548fd2df45a605472b34c1614287c56b51bb33cdef7ae5235b5',
    ),
    wheel(
      31,
      'SQLAlchemy',
      '2.0.51',
      'sqlalchemy-2.0.51-cp310-cp310-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl',
      3_243_515,
      '2e54ff2dd657f2e3e0fbf2b097db1182f7bfea263eca4353f00065bae2a67c3d',
    ),
    wheel(
      32,
      'torchsde',
      '0.2.6',
      'torchsde-0.2.6-py3-none-any.whl',
      61_232,
      '19bf7ff02eec7e8e46ba1cdb4aa0f9db1c51d492524a16975234b467f7fc463b',
    ),
    wheel(
      33,
      'trampoline',
      '0.1.2',
      'trampoline-0.1.2-py3-none-any.whl',
      5_173,
      '36cc9a4ff9811843d177fc0e0740efbd7da39eadfe6e50c9e2937cbc06d899d9',
    ),
    wheel(
      34,
      'yarl',
      '1.24.5',
      'yarl-1.24.5-cp310-cp310-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl',
      110_758,
      '7fa5e51397466ea7e98de493fa2ff1b8193cfef8a7b0f9b4842f92d342df0dba',
    ),
  ] satisfies readonly LivingFrameComfyUiLockedWheelArtifact[])

export const LIVING_FRAME_COMFYUI_LOCKED_SOURCE_ARCHIVES =
  Object.freeze([
    source(
      0,
      'comfyui_host',
      '093d571b83e7a79833200e199b46b9f5a62217f9',
      '15652258f4c49f079158fd492479d379aedbc240',
      991,
      44_175_360,
      'dfc771e822aeef3956a3295834a211b36a72e8dce1a7f2bf6b8327a311af9948',
    ),
    source(
      1,
      'generic_ipadapter_extension',
      'b188a6cb39b512a9c6da7235b880af42c78ccd0d',
      '8e16f8055ae089c28a68c2d9711c1d5d93bb52b8',
      35,
      778_240,
      '8565104c6a20e2e092bc895a72b8dcf588c0165f0de0f4f01dc0f735d2af50ec',
    ),
    source(
      2,
      'controlnet_aux_extension',
      'e8b689a513c3e6b63edc44066560ca5919c0576e',
      'd2ca43d24a80346e9604df26fb1f2d2db58bd07b',
      746,
      49_551_360,
      '6ab94365c94e7c4a02be19d1ad5921c5ac490c0539bd1b38fc0d1516225d9b4e',
    ),
  ] satisfies readonly LivingFrameComfyUiLockedSourceArchive[])

export const
LIVING_FRAME_COMFYUI_LOCKED_SELECTED_NODE_CLASSES =
  Object.freeze([
    'EmptyImage',
    'SaveImage',
    'LoadImage',
    'BinaryPreprocessor',
    'CannyEdgePreprocessor',
    'ColorPreprocessor',
    'LineartStandardPreprocessor',
    'IPAdapterModelLoader',
    'IPAdapterAdvanced',
    'ControlNetLoader',
    'ControlNetApplyAdvanced',
    'LoraLoader',
  ])

export const LIVING_FRAME_COMFYUI_LOCKED_PROMPT_PROBES =
  Object.freeze([
    probe(
      0,
      'stock_empty_image',
      390,
      'ec15c9fa32513d982029a8c661deb6317998b1fac1442c19f17983d9c3d022fb',
      '723f9d9221380fadb5265868cc50aff79ce6bedb7fc597aee99c3e5a1b7624d9',
    ),
    probe(
      1,
      'binary_preprocessor',
      1_050,
      '2c1958477a6912519336db96d5b12f47f5371422b5ed0fe2357fad989849b326',
      'b138b2711074fd813701a19f4a971002ff91174d90ab916a4f11eaf367ae6034',
    ),
    probe(
      2,
      'canny_preprocessor',
      1_299,
      '693f16dffb0027511a3857484ea814efd45e8e09db89ab9b8c22401a2d752b4b',
      '43154ce7d8ac7329e7cd80742c9bc9a09550f32e90bd007ec4a410c7b97f6cd3',
    ),
    probe(
      3,
      'color_preprocessor',
      543,
      '665b68e425b5efae6a8a9987825404635f1391c7de59c7dd47738d789891118c',
      '238f78120812cc57a49fe5abe162147f190297863886f8bc13ced27a8cce5102',
    ),
    probe(
      4,
      'lineart_preprocessor',
      2_008,
      'a52f4d26ab1896d80d7bbb971ded96dd32abc58931a12538de967af2a9c7c3ed',
      '40204ef1d43aa182df37913a00cc032f3f9ad588fdb549c04fc3153fdb56ca9b',
    ),
  ] satisfies readonly LivingFrameComfyUiDeterministicPromptProbe[])

export type LivingFrameComfyUiDependencyLockObservation =
  Pick<
    LivingFrameComfyUiDependencyLockEvidenceDraft,
    | 'targetPlatform'
    | 'baseImage'
    | 'wheelLock'
    | 'sourceLock'
    | 'controlledOfflineBuild'
    | 'controlledRuntimeProbe'
  >

export const
LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_OBSERVATION:
  LivingFrameComfyUiDependencyLockObservation =
  Object.freeze({
    targetPlatform: {
      operatingSystem: 'linux',
      architecture: 'amd64',
      distribution: 'ubuntu_22_04',
      pythonVersion: '3.10.12',
      cudaRuntimeFamily: '12.4',
    },
    baseImage: {
      controlledBaseImageDigestSha256:
        LIVING_FRAME_COMFYUI_LOCKED_BASE_IMAGE_DIGEST_SHA256,
      baseImageCanonicalOrSigned: false,
    },
    wheelLock: {
      wheelArtifactCount: 35,
      wheelArtifactTotalByteLength: 486_459_097,
      wheelManifestDigestSha256:
        LIVING_FRAME_COMFYUI_LOCKED_WHEEL_MANIFEST_DIGEST_SHA256,
      artifacts:
        LIVING_FRAME_COMFYUI_LOCKED_WHEEL_ARTIFACTS,
      installNetworkMode: 'none',
      installIndexMode: 'no_index',
      dependencyResolutionMode: 'no_deps',
    },
    sourceLock: {
      sourceArchiveCount: 3,
      archives:
        LIVING_FRAME_COMFYUI_LOCKED_SOURCE_ARCHIVES,
    },
    controlledOfflineBuild: {
      candidateImageDigestSha256:
        LIVING_FRAME_COMFYUI_LOCKED_CANDIDATE_IMAGE_DIGEST_SHA256,
      candidateImageByteLength: 11_871_727_486,
      rootFilesystemLayerCount: 28,
      buildNetworkMode: 'none',
      sourceArchivesCopiedWithoutRepositoryMetadata: true,
      wheelArtifactsInstalledWithoutIndexOrDependencyResolution:
        true,
      imageBuiltScannedOrSigned: false,
    },
    controlledRuntimeProbe: {
      runtimeClass:
        'temporary_controlled_cpu_emulation_without_model_generation',
      pythonFreezeLineCount: 168,
      pythonFreezeByteLength: 9_199,
      pythonFreezeDigestSha256:
        'ae56ebd7ca96226994383da7a09c5a3b25b8d1424e863ee2ef9ef90f020fa738',
      objectInfoNodeClassCount: 920,
      objectInfoNodeClassSetDigestSha256:
        '1b0a6e1fb0e6e2d779705d6f005bdf0138fb62350a20a38f0ad5c5988e1f1454',
      selectedNodeSchemaCount: 12,
      selectedNodeSchemaDigestSha256:
        '070e5fa7190218fe6fae2067915b6e5e751817308878e8d6de583b5b1df24dd0',
      selectedNodeClasses:
        LIVING_FRAME_COMFYUI_LOCKED_SELECTED_NODE_CLASSES,
      deterministicInputPngDigestSha256:
        '42fa8554e283c97a43f03167636fad02739b6409817a539a0ce4cf62b0559186',
      deterministicPromptProbeCount: 5,
      deterministicPromptProbes:
        LIVING_FRAME_COMFYUI_LOCKED_PROMPT_PROBES,
      allSelectedNodeSchemasPresent: true,
      fullExtensionNodeSurfaceProductionQualified: false,
      genericFaceIdentityNodesAdmitted: false,
      modelGenerationExecuted: false,
      gpuExecutionObserved: false,
    },
  })

function wheel(
  order: number,
  distributionName: string,
  version: string,
  artifactFileName: string,
  byteLength: number,
  sha256: string,
): LivingFrameComfyUiLockedWheelArtifact {
  return Object.freeze({
    order,
    distributionName,
    version,
    artifactFileName,
    byteLength,
    sha256,
  })
}

function source(
  order: number,
  sourceCode:
    LivingFrameComfyUiLockedSourceArchive['sourceCode'],
  repositoryRevision: string,
  repositoryTree: string,
  archiveFileCount: number,
  archiveByteLength: number,
  archiveSha256: string,
): LivingFrameComfyUiLockedSourceArchive {
  return Object.freeze({
    order,
    sourceCode,
    repositoryRevision,
    repositoryTree,
    archiveFileCount,
    archiveByteLength,
    archiveSha256,
  })
}

function probe(
  order: number,
  probeCode:
    LivingFrameComfyUiDeterministicPromptProbe['probeCode'],
  outputPngByteLength: number,
  outputPngSha256: string,
  outputRgbaPixelSha256: string,
): LivingFrameComfyUiDeterministicPromptProbe {
  return Object.freeze({
    order,
    probeCode,
    outputWidthPixels: 64,
    outputHeightPixels: 64,
    outputPngByteLength,
    outputPngSha256,
    outputRgbaPixelSha256,
    repeatedPngDigestMatched: true,
    repeatedPixelDigestMatched: true,
  })
}
