import { buildOpenTimelineIoCommandPlans, runOpenTimelineIoValidation } from '../activation/opentimelineio-validation'

const execute = process.argv.includes('--execute')

if (!execute) {
  console.log('Phase 45C OpenTimelineIO validation is static/report-only by default. Pass --execute with REEDITPRO_CONFIRM_OTIO_TIMELINE_VALIDATION=true to create the bounded private timeline validation artifacts.')
  console.log(JSON.stringify(buildOpenTimelineIoCommandPlans(), null, 2))
} else {
  const result = await runOpenTimelineIoValidation({ execute })
  console.log(JSON.stringify(result, null, 2))
}
