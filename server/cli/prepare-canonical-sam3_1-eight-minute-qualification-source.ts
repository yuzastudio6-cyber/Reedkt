import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalCurrentGoogleCloudGpuRateAuthorityRepository,
} from '../services/canonical-current-google-cloud-gpu-rate-authority-repository'
import {
  createCanonicalSam31EightMinuteQualificationSourceRepository,
} from '../services/canonical-sam3_1-eight-minute-qualification-source-owner'
import {
  createCanonicalSam31EightMinuteSourcePreparationAdmissionOwner,
  createCanonicalSam31EightMinuteSourcePreparationAuthorityRepository,
  createCanonicalSam31EightMinuteSourcePreparationTrigger,
} from '../services/canonical-sam3_1-eight-minute-source-preparation-admission-owner'
import {
  createCanonicalSam31EightMinuteSourcePreparationLaunchOwner,
  createCanonicalSam31EightMinuteSourcePreparationLaunchRepository,
  createGoogleCloudRunSam31EightMinuteSourcePreparationPort,
} from '../services/canonical-sam3_1-eight-minute-source-preparation-launch-owner'
import {
  createCanonicalSam31EightMinuteSourcePreparationTerminalOwner,
  createCanonicalSam31EightMinuteSourcePreparationTerminalRepository,
  createGoogleCloudRunSam31EightMinuteSourcePreparationTerminalPort,
} from '../services/canonical-sam3_1-eight-minute-source-preparation-terminal-owner'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  createWeEditProGcpLocalOperatorAuth,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE,
} from './weeditpro-gcp-local-operator-auth'

const CONFIRMATION =
  'prepare-one-weeditpro-sam31-eight-minute-source-v1' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const SOURCE_ID = 'sam31-eight-minute-qualification-source-v2' as const
const POLL_MILLISECONDS = 10_000
const DEADLINE_MILLISECONDS = 2 * 60 * 60_000

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/+:-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('//'))
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()

const environment = z.object({
  WEEDITPRO_SAM31_SOURCE_PREPARATION_CONFIRMATION: z.literal(CONFIRMATION),
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    z.literal(WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH_MODE),
  WEEDITPRO_SAM31_SOURCE_PREPARATION_INVOCATION_ID: safeId,
  WEEDITPRO_SAM31_SOURCE_PREPARATION_RELEASE_REF_JSON:
    z.string().min(2).max(2_048),
  WEEDITPRO_SAM31_SOURCE_PREPARATION_L4_RATE_REF_JSON:
    z.string().min(2).max(2_048),
}).strict().parse({
  WEEDITPRO_SAM31_SOURCE_PREPARATION_CONFIRMATION:
    process.env.WEEDITPRO_SAM31_SOURCE_PREPARATION_CONFIRMATION,
  WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH:
    process.env.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
  WEEDITPRO_SAM31_SOURCE_PREPARATION_INVOCATION_ID:
    process.env.WEEDITPRO_SAM31_SOURCE_PREPARATION_INVOCATION_ID,
  WEEDITPRO_SAM31_SOURCE_PREPARATION_RELEASE_REF_JSON:
    process.env.WEEDITPRO_SAM31_SOURCE_PREPARATION_RELEASE_REF_JSON,
  WEEDITPRO_SAM31_SOURCE_PREPARATION_L4_RATE_REF_JSON:
    process.env.WEEDITPRO_SAM31_SOURCE_PREPARATION_L4_RATE_REF_JSON,
})

const releaseRef = parseRef(
  environment.WEEDITPRO_SAM31_SOURCE_PREPARATION_RELEASE_REF_JSON,
)
const currentRateAuthorityRef = parseRef(
  environment.WEEDITPRO_SAM31_SOURCE_PREPARATION_L4_RATE_REF_JSON,
)
const { authClient, storage } = createWeEditProGcpLocalOperatorAuth({
  confirmation: environment.WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH,
})
const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
  storage,
  bucketName: CONTROL_PLANE_BUCKET,
})
const sourceRepository =
  createCanonicalSam31EightMinuteQualificationSourceRepository({ objectPort })
const authorityRepository =
  createCanonicalSam31EightMinuteSourcePreparationAuthorityRepository({
    objectPort,
  })
const rateRepository =
  createCanonicalCurrentGoogleCloudGpuRateAuthorityRepository({ objectPort })
const launchRepository =
  createCanonicalSam31EightMinuteSourcePreparationLaunchRepository({
    objectPort,
  })
const terminalRepository =
  createCanonicalSam31EightMinuteSourcePreparationTerminalRepository({
    objectPort,
  })
const invocationId =
  environment.WEEDITPRO_SAM31_SOURCE_PREPARATION_INVOCATION_ID
const triggeredAt = new Date().toISOString()
const triggerBasis = {
  invocationId,
  qualificationSourceId: SOURCE_ID,
  purpose: 'private_complete_source_gpu_qualification',
  triggeredAt,
}
const trigger = createCanonicalSam31EightMinuteSourcePreparationTrigger({
  invocationId,
  qualificationSourceId: SOURCE_ID,
  userTriggerRecordRef: {
    id: `${invocationId}:operator-trigger`,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue(triggerBasis)}`,
  },
  idempotencyKey: `sam31-source-preparation:${sha256AuthorityValue(
    triggerBasis,
  )}`,
  triggeredAt,
})
const admitted =
  await createCanonicalSam31EightMinuteSourcePreparationAdmissionOwner({
    sourceRepository,
    authorityRepository,
    rateRepository,
    releaseRef,
    currentRateAuthorityRef,
  }).admitOneShot(trigger)
if (admitted.status !== 'ready') {
  throw new Error('SAM 3.1 source preparation is not admitted.')
}
const launch = await createCanonicalSam31EightMinuteSourcePreparationLaunchOwner({
  authorityRepository,
  launchRepository,
  cloudRunPort: createGoogleCloudRunSam31EightMinuteSourcePreparationPort({
    auth: authClient,
  }),
}).startOneShot({ invocationId })
if (launch.status !== 'accepted') {
  throw new Error(`SAM 3.1 source preparation launch is not accepted: ${
    launch.blockerCode}`)
}
const exactLaunch = await launchRepository.reread({ invocationId })
if (!exactLaunch) {
  throw new Error('SAM 3.1 source preparation launch reread is absent.')
}

const terminalOwner = createCanonicalSam31EightMinuteSourcePreparationTerminalOwner({
  authorityRepository,
  launchRepository,
  sourceRepository,
  rateRepository,
  terminalPort: createGoogleCloudRunSam31EightMinuteSourcePreparationTerminalPort({
    auth: authClient,
  }),
  terminalRepository,
})
const deadlineAt = Date.now() + DEADLINE_MILLISECONDS
let terminal = await terminalOwner.reconcile({ invocationId })
while (terminal.status === 'pending' && Date.now() < deadlineAt) {
  await wait(POLL_MILLISECONDS)
  terminal = await terminalOwner.reconcile({ invocationId })
}
if (terminal.status !== 'ready') {
  throw new Error(`SAM 3.1 source preparation terminal is not ready: ${
    terminal.blockerCode}`)
}

process.stdout.write(`${JSON.stringify({
  schemaVersion:
    'weeditpro-sam3_1-eight-minute-source-preparation-receipt-v1',
  invocationId,
  sourceId: SOURCE_ID,
  triggerRef: {
    id: trigger.invocationId,
    version: 1,
    contentHash: `sha256:${trigger.triggerHash}`,
  },
  admissionRef: {
    id: admitted.admission.invocationId,
    version: 1,
    contentHash: `sha256:${admitted.admission.admissionHash}`,
  },
  launchRef: {
    id: exactLaunch.invocationId,
    version: 1,
    contentHash: `sha256:${exactLaunch.launchHash}`,
  },
  terminalRef: terminal.terminalRef,
  preparationRef: terminal.preparationRef,
  exactChunkCount: 49,
  l4NvdecNvencRequired: true,
  substantiveCpuMediaProcessingAllowed: false,
  automaticRetryAllowed: false,
  customerCreditsMutated: false,
  qaApprovalGranted: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
})}\n`)

function parseRef(serialized: string) {
  let decoded: unknown
  try {
    decoded = JSON.parse(serialized) as unknown
  } catch {
    throw new Error('SAM 3.1 source-preparation reference JSON is invalid.')
  }
  return refSchema.parse(decoded)
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
