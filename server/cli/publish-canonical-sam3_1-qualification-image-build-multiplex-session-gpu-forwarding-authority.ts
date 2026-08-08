import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import { z } from 'zod'

import {
  publishCanonicalSam31QualificationImageBuildAuthority,
} from '../services/canonical-sam3_1-qualification-image-authority-runtime'
import {
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'publish-sam31-qualification-image-multiplex-session-gpu-forwarding-authority-v1' as const
const REPRODUCIBILITY_ID =
  'sam31-qualification-capsule-reproducibility-multiplex-session-gpu-forwarding-corrected-v1' as const
const MANIFEST_ID =
  'sam31-qualification-image-capsule-multiplex-session-gpu-forwarding-corrected-v1' as const
const AUTHORITY_ID =
  'sam31-qualification-image-build-multiplex-session-gpu-forwarding-corrected-v1' as const
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)

if (
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_MULTIPLEX_SESSION_GPU_FORWARDING_AUTHORITY_CONFIRMATION
      !== CONFIRMATION
) throw new Error(
  'SAM 3.1 multiplex-session GPU-forwarding authority confirmation is missing.',
)

const reproducibilityHash = rawSha256.parse(
  process.env
    .WEEDITPRO_SAM31_MULTIPLEX_SESSION_GPU_FORWARDING_REPRODUCIBILITY_SHA256,
)
const publication = await publishCanonicalSam31QualificationImageBuildAuthority({
  manifestId: MANIFEST_ID,
  authorityId: AUTHORITY_ID,
  ingestReceiptRef: {
    id: 'sam31-ingest-sam31-weeditpro-official-ingest-20260806-v12',
    version: 1,
    schemaVersion: 'canonical-sam3_1-private-artifact-ingest-receipt-v3',
    contentHash:
      'sha256:321dc704810497b92e63fa29cdbd168b903e9435fa24ba5b23903c3b6c919cf8',
  },
  reproducibilityReceiptRef: {
    id: REPRODUCIBILITY_ID,
    version: 1,
    contentHash: `sha256:${reproducibilityHash}`,
  },
  cloudBuildMachineType: 'E2_STANDARD_2',
})
const runtime = createCanonicalSam31GcpQualificationImageBuildRuntime()
const authority = await runtime.repository.rereadQualificationImageBuildAuthority({
  authorityRef: publication.authorityRef,
})
if (
  !authority
  || authority.buildClosure.dockerfileSha256 !== sourceHash(
    'docker/prod/gpu-worker/sam3_1/Dockerfile.qualification.candidate',
  )
  || authority.buildClosure.entrypointSha256 !== sourceHash(
    'docker/prod/gpu-worker/sam3_1/qualification_entrypoint.sh',
  )
  || authority.buildClosure.runnerSha256 !== sourceHash(
    'docker/prod/gpu-worker/sam3_1/qualification_runner.py',
  )
  || authority.buildClosure.sourceProvenanceLockSha256 !== sourceHash(
    'docker/prod/gpu-worker/sam3_1/source-provenance.lock',
  )
  || authority.buildClosure.multiplexSessionGpuForwardingPatchSha256 !==
    sourceHash(
      'docker/prod/gpu-worker/sam3_1/patches/0003-weeditpro-multiplex-session-gpu-forwarding.patch',
    )
  || authority.cloudBuildPolicy.machineType !== 'E2_STANDARD_2'
) throw new Error('SAM 3.1 multiplex GPU-forwarding image authority changed.')

console.log(JSON.stringify({
  ...publication,
  publicationSchemaVersion:
    'canonical-sam3_1-qualification-image-multiplex-session-gpu-forwarding-authority-publication-v1',
  correction:
    'forward_gpu_session_controls_through_all_pinned_sam31_multiplex_overrides',
  predecessorFailedAttemptId:
    'sam31-a100-multiplex-session-corrected-20260808-v11',
  predecessorTerminalObservationRef: {
    id: 'sam31-vertex-terminal.4dfedd7e47c191aef83eb11a2c52bb40',
    version: 1,
    contentHash:
      'sha256:4dfedd7e47c191aef83eb11a2c52bb406acb66df029e4aa273c22115ae26a9cc',
  },
  multiplexGpuForwardingPatchSha256:
    'fb5c047013629d27d7b8f2aecbf8343a402d2e36de3e24dc1be4347f83d9c86b',
  officialSourceArchiveMutated: false,
  installedSourcePatchRequired: true,
  cpuStateOffloadAllowed: false,
  cpuVideoDecodeFallbackAllowed: false,
  failedAttemptAutomaticallyRetried: false,
  sourceCheckpointQualificationGranted: false,
  gpuQualificationJobDispatched: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))

function sourceHash(path: string) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}
