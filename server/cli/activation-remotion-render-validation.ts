import { runRemotionRenderValidation } from '../activation/remotion-render-validation'

const execute = process.argv.includes('--execute')

if (!execute) {
  console.log('Phase 45B Remotion render validation is static/report-only by default. Pass --execute with REEDITPRO_CONFIRM_REMOTION_RENDER_VALIDATION=true to run the bounded private validation job.')
} else {
  const result = await runRemotionRenderValidation({ execute })
  console.log(JSON.stringify(result, null, 2))
}
