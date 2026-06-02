import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  MEDIA_DATA_READINESS_REPORT_DIR,
  buildMediaDataReadinessReports,
  writeMediaDataReadinessArtifacts,
} from '../activation/media-data-readiness'

const writeArtifacts = process.argv.includes('--write-artifacts')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const artifactDir = artifactDirArg?.split('=')[1] ?? MEDIA_DATA_READINESS_REPORT_DIR

if (writeArtifacts) {
  if (process.env.REEDITPRO_CONFIRM_MEDIA_DATA_READINESS_AUDIT !== 'true') {
    throw new Error('REEDITPRO_CONFIRM_MEDIA_DATA_READINESS_AUDIT=true is required to write Phase 46A reports.')
  }
  if (process.env.REEDITPRO_CONFIRM_MEDIA_DATA_WEB_RESEARCH !== 'true') {
    throw new Error('REEDITPRO_CONFIRM_MEDIA_DATA_WEB_RESEARCH=true is required to write Phase 46A source/license evidence.')
  }
  console.log(JSON.stringify(await writeMediaDataReadinessArtifacts(artifactDir), null, 2))
} else {
  try {
    console.log(await readFile(path.join(artifactDir, 'phase_46a_media_data_readiness_report.json'), 'utf8'))
  } catch {
    console.log(JSON.stringify(buildMediaDataReadinessReports().readinessReport, null, 2))
  }
}
