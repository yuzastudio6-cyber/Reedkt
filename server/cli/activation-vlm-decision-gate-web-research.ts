import {
  VLM_DECISION_GATE_REPORT_DIR,
  buildVlmDecisionGateReports,
  writeVlmDecisionGateArtifacts,
} from '../activation/vlm-decision-gate'

const writeArtifacts = process.argv.includes('--write-artifacts')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const artifactDir = artifactDirArg?.split('=')[1] ?? VLM_DECISION_GATE_REPORT_DIR

if (writeArtifacts) {
  if (process.env.REEDITPRO_CONFIRM_VLM_DECISION_WEB_RESEARCH !== 'true') {
    throw new Error('REEDITPRO_CONFIRM_VLM_DECISION_WEB_RESEARCH=true is required to write Phase 39C decision-gate web research reports.')
  }
  const reports = await writeVlmDecisionGateArtifacts(artifactDir)
  console.log(JSON.stringify(reports.webResearch, null, 2))
} else {
  console.log(JSON.stringify(buildVlmDecisionGateReports().webResearch, null, 2))
}
