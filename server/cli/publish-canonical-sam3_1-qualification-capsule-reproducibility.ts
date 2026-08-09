import { z } from 'zod'

import { publishCanonicalSam31QualificationCapsuleReproducibility } from
  '../services/canonical-sam3_1-qualification-capsule-reproducibility-runtime'

const CONFIRMATION =
  'publish-reviewed-sam31-capsule-reproducibility' as const

if (
  process.env.WEEDITPRO_SAM31_CAPSULE_REPRODUCIBILITY_CONFIRMATION !==
    CONFIRMATION
) throw new Error('SAM 3.1 capsule reproducibility confirmation is missing.')

const targets = {
  original: {
    receiptId: 'sam31-qualification-capsule-reproducibility-20260807',
    primaryBuildId: '8f3cf6e1-7d82-4d73-a32c-078ea35a07b7',
    confirmationBuildId: 'd26c339a-67ca-4ac5-a30b-9fbe77b401e3',
  },
  pep668_isolated: {
    receiptId:
      'sam31-qualification-capsule-reproducibility-pep668-isolated-20260807',
    primaryBuildId: 'a216ddf3-76be-4a80-92bd-7d6ef0282bce',
    confirmationBuildId: '8a4d6787-4b05-4bc9-9ac6-efdc91ad7ffd',
  },
  cuda_ffmpeg_isolated: {
    receiptId:
      'sam31-qualification-capsule-reproducibility-cuda-ffmpeg-isolated-20260807',
    primaryBuildId: 'b1dc5ddf-f614-41af-9c94-0ee1c15598f1',
    confirmationBuildId: '40fa1bb2-e516-4c55-b41b-c652cea6f972',
  },
  docker_network_compatible: {
    receiptId:
      'sam31-qualification-capsule-reproducibility-docker-network-compatible-20260807',
    primaryBuildId: 'a0f5ea62-8769-4c35-b2de-f958ff8aa2fb',
    confirmationBuildId: '544d28c7-d87f-4a0e-bdf0-6291a8b1f6e1',
  },
  private_closure_offline: {
    receiptId:
      'sam31-qualification-capsule-reproducibility-private-closure-offline-20260807',
    primaryBuildId: 'e0699b99-31bd-42ed-a342-549f9b989bc1',
    confirmationBuildId: 'a4b00853-6919-430f-ad78-6c64509b42f0',
  },
  npp_offline: {
    receiptId:
      'sam31-qualification-capsule-reproducibility-npp-offline-20260807',
    primaryBuildId: '8ba8ba82-b8d0-43a6-bb08-9fafd517d78d',
    confirmationBuildId: '1653c80d-7066-4314-be62-b0a3c6afd66c',
  },
  einops_offline: {
    receiptId:
      'sam31-qualification-capsule-reproducibility-einops-offline-20260807',
    primaryBuildId: '5339b681-9b0a-4e77-967a-5a8b065e452e',
    confirmationBuildId: 'a402319e-e524-4f91-ad86-d8ca30b40311',
  },
  einops_offline_source_identity_corrected: {
    receiptId:
      'sam31-qualification-capsule-reproducibility-einops-offline-source-identity-corrected-20260807',
    primaryBuildId: 'd56d7f4a-d5d2-41a2-9098-db22a98f61b1',
    confirmationBuildId: '6db247e8-9dda-46c8-9266-51d3de51cf34',
  },
  pycocotools_offline_source_identity_corrected: {
    receiptId:
      'sam31-qualification-capsule-reproducibility-pycocotools-offline-source-identity-corrected-20260807',
    primaryBuildId: '9d115018-1801-451f-b47b-de78d2c644d6',
    confirmationBuildId: 'c5e9dad3-1bff-4ac0-8faf-c8fe8c4e1e6b',
  },
  cuda_torchvision_identity_corrected: {
    receiptId:
      'sam31-qualification-capsule-reproducibility-cuda-torchvision-identity-corrected-20260807',
    primaryBuildId: 'c0be5124-c29d-483b-9d8e-c2f0847f38cc',
    confirmationBuildId: '5ae87019-d6d1-4f26-b9a5-d027374b97cf',
  },
  native_library_closure_corrected: {
    receiptId:
      'sam31-qualification-capsule-reproducibility-native-library-closure-corrected-20260807',
    primaryBuildId: '313c8b75-4aae-4a31-a0ed-df1807013295',
    confirmationBuildId: '18ae1a26-172b-481f-8c73-a15dbb82aab8',
  },
  security_remediation_corrected: {
    receiptId:
      'sam31-qualification-capsule-reproducibility-security-remediation-corrected-20260807',
    primaryBuildId: '3e29aa73-7307-454d-bd38-b911b67aeab1',
    confirmationBuildId: '6c209bca-9563-4a5f-be3e-a6b927ac2d6f',
  },
  security_remediation_pep668_uninstall_corrected: {
    receiptId:
      'sam31-qualification-capsule-reproducibility-security-remediation-pep668-uninstall-corrected-20260807',
    primaryBuildId: '0c93a02b-1952-4520-a1a1-89cf0f181219',
    confirmationBuildId: '1dbde314-c57a-4144-9b12-0981736a92c9',
  },
  vertex_a100_setuptools_vendor_removed: {
    receiptId:
      'sam31-qualification-capsule-reproducibility-vertex-a100-setuptools-vendor-removed-20260807',
    primaryBuildId: 'f9ef526f-d371-4222-8b24-c711e7d8c98a',
    confirmationBuildId: '318d0af1-51dd-4a81-a35b-09d812be40c4',
  },
} as const
const targetName = z.enum([
  'original',
  'pep668_isolated',
  'cuda_ffmpeg_isolated',
  'docker_network_compatible',
  'private_closure_offline',
  'npp_offline',
  'einops_offline',
  'einops_offline_source_identity_corrected',
  'pycocotools_offline_source_identity_corrected',
  'cuda_torchvision_identity_corrected',
  'native_library_closure_corrected',
  'security_remediation_corrected',
  'security_remediation_pep668_uninstall_corrected',
  'vertex_a100_setuptools_vendor_removed',
  'vertex_a100_importlib_resources_setuptools_removed',
  'vertex_a100_importlib_resources_import_order_corrected',
  'vertex_driver_parser_corrected',
  'rope_cache_derivation_corrected',
  'multiplex_session_api_compatibility_corrected',
  'multiplex_session_gpu_forwarding_corrected',
  'gpu_kernel_cache_corrected',
  'forward_propagation_frame_count_corrected',
  'vertex_result_publication_corrected',
]).parse(
  process.env.WEEDITPRO_SAM31_CAPSULE_REPRODUCIBILITY_TARGET,
)
const buildId = z.string().uuid()
const selectedTarget = targetName ===
    'vertex_a100_importlib_resources_setuptools_removed'
  || targetName ===
    'vertex_a100_importlib_resources_import_order_corrected'
  || targetName === 'vertex_driver_parser_corrected'
  || targetName === 'rope_cache_derivation_corrected'
  || targetName === 'multiplex_session_api_compatibility_corrected'
  || targetName === 'multiplex_session_gpu_forwarding_corrected'
  || targetName === 'gpu_kernel_cache_corrected'
  || targetName === 'forward_propagation_frame_count_corrected'
  || targetName === 'vertex_result_publication_corrected'
  ? {
      receiptId:
        targetName === 'vertex_result_publication_corrected'
          ? 'sam31-qualification-capsule-reproducibility-vertex-result-publication-corrected-v1'
          : targetName === 'forward_propagation_frame_count_corrected'
          ? 'sam31-qualification-capsule-reproducibility-forward-propagation-frame-count-corrected-v1'
          : targetName === 'gpu_kernel_cache_corrected'
          ? 'sam31-qualification-capsule-reproducibility-gpu-kernel-cache-corrected-v1'
          : targetName === 'multiplex_session_gpu_forwarding_corrected'
          ? 'sam31-qualification-capsule-reproducibility-multiplex-session-gpu-forwarding-corrected-v1'
          : targetName === 'multiplex_session_api_compatibility_corrected'
          ? 'sam31-qualification-capsule-reproducibility-multiplex-session-api-compatibility-corrected-v1'
          : targetName === 'rope_cache_derivation_corrected'
          ? 'sam31-qualification-capsule-reproducibility-rope-cache-derivation-corrected-v1'
          : targetName === 'vertex_driver_parser_corrected'
          ? 'sam31-qualification-capsule-reproducibility-vertex-driver-parser-corrected-v1'
          : targetName ===
              'vertex_a100_importlib_resources_import_order_corrected'
            ? 'sam31-qualification-capsule-reproducibility-vertex-a100-importlib-resources-import-order-corrected-20260807'
            : 'sam31-qualification-capsule-reproducibility-vertex-a100-importlib-resources-setuptools-removed-20260807',
      primaryBuildId: buildId.parse(
        process.env.WEEDITPRO_SAM31_CAPSULE_PRIMARY_BUILD_ID,
      ),
      confirmationBuildId: buildId.parse(
        process.env.WEEDITPRO_SAM31_CAPSULE_CONFIRMATION_BUILD_ID,
      ),
    }
  : targets[targetName]
const result = await publishCanonicalSam31QualificationCapsuleReproducibility(
  selectedTarget,
)

console.log(JSON.stringify(result, null, 2))
