import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  VLM_DECISION_GATE_REPORT_DIR,
  buildVlmDecisionGateReports,
  writeVlmDecisionGateArtifacts,
} from '../activation/vlm-decision-gate'

const writeArtifacts = process.argv.includes('--write-artifacts')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const artifactDir = artifactDirArg?.split('=')[1] ?? VLM_DECISION_GATE_REPORT_DIR

if (writeArtifacts) {
  if (process.env.REEDITPRO_CONFIRM_VLM_DECISION_GATE !== 'true') {
    throw new Error('REEDITPRO_CONFIRM_VLM_DECISION_GATE=true is required to write Phase 39C decision-gate reports.')
  }
  if (process.env.REEDITPRO_CONFIRM_VLM_DECISION_WEB_RESEARCH !== 'true') {
    throw new Error('REEDITPRO_CONFIRM_VLM_DECISION_WEB_RESEARCH=true is required to write Phase 39C decision-gate web research reports.')
  }
  const reports = await writeVlmDecisionGateArtifacts(artifactDir)
  console.log(JSON.stringify(reports, null, 2))
} else {
  try {
    const report = JSON.parse(await readFile(path.join(artifactDir, 'phase_39c_vlm_decision_record.json'), 'utf8'))
    console.log(JSON.stringify(report, null, 2))
  } catch {
    console.log(JSON.stringify(buildVlmDecisionGateReports().decisionRecord, null, 2))
  }
}
