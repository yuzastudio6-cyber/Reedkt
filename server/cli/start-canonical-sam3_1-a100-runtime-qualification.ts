import {
  createCanonicalSam31GcpA100RuntimeQualificationLaunchService,
} from '../services/canonical-sam3_1-a100-runtime-qualification-launch-service'

const REQUEST_ENV =
  'WEEDITPRO_SAM31_A100_RUNTIME_QUALIFICATION_START_REQUEST_JSON'

const raw = process.env[REQUEST_ENV]
if (!raw) {
  throw new Error(
    `${REQUEST_ENV} is required and must contain only canonical evidence refs.`,
  )
}

let request: unknown
try {
  request = JSON.parse(raw)
} catch {
  throw new Error(`${REQUEST_ENV} is not valid JSON.`)
}

const result = await createCanonicalSam31GcpA100RuntimeQualificationLaunchService()
  .start(request)

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
