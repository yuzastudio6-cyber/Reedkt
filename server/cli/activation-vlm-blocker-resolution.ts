import { buildVlmBlockerResolutionCommandPlans, runVlmBlockerResolution } from '../activation/vlm-blocker-resolution'

const execute = process.argv.includes('--execute')

if (!execute) {
  console.log('Phase 47B VLM blocker resolution is static/report-only by default. Pass --execute with REEDITPRO_CONFIRM_VLM_BLOCKER_RESOLUTION=true to upload one private JSON exclusion package.')
  console.log(JSON.stringify(buildVlmBlockerResolutionCommandPlans(), null, 2))
} else {
  const result = await runVlmBlockerResolution({ execute })
  console.log(JSON.stringify({
    evidence: result.evidence,
    executionReport: result.executionReport,
    localReportPath: result.localReportPath,
    iamChanges: result.iamChanges,
  }, null, 2))
}
