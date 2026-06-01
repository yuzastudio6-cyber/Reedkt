import { buildFullVisualVideoPrivateE2eCommandPlans, runFullVisualVideoPrivateE2e } from '../activation/full-visual-video-private-e2e'

const execute = process.argv.includes('--execute')

if (!execute) {
  console.log('Phase 45E full visual-video private E2E is static/report-only by default. Pass --execute with REEDITPRO_CONFIRM_FULL_VISUAL_VIDEO_PRIVATE_E2E=true to assemble one private E2E evidence package.')
  console.log(JSON.stringify(buildFullVisualVideoPrivateE2eCommandPlans(), null, 2))
} else {
  const result = await runFullVisualVideoPrivateE2e({ execute })
  console.log(JSON.stringify(result, null, 2))
}
