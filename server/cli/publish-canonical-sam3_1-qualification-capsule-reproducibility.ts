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
} as const
const targetName = z.enum([
  'original',
  'pep668_isolated',
  'cuda_ffmpeg_isolated',
  'docker_network_compatible',
  'private_closure_offline',
  'npp_offline',
]).parse(
  process.env.WEEDITPRO_SAM31_CAPSULE_REPRODUCIBILITY_TARGET,
)
const result = await publishCanonicalSam31QualificationCapsuleReproducibility(
  targets[targetName],
)

console.log(JSON.stringify(result, null, 2))
