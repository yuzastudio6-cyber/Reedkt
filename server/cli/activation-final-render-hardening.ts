import { buildFinalRenderHardeningCommandPlans, runFinalRenderHardening } from '../activation/final-render-hardening'

const execute = process.argv.includes('--execute')

if (!execute) {
  console.log('Phase 45D FFmpeg/FFprobe final render hardening is static/report-only by default. Pass --execute with REEDITPRO_CONFIRM_FFMPEG_FINAL_RENDER_HARDENING=true to create one bounded private review export.')
  console.log(JSON.stringify(buildFinalRenderHardeningCommandPlans(), null, 2))
} else {
  const result = await runFinalRenderHardening({ execute })
  console.log(JSON.stringify(result, null, 2))
}
