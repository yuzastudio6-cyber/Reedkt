import {
  MEDIA_DATA_READINESS_REPORT_DIR,
  buildMediaDataReadinessSummary,
  writeMediaDataReadinessArtifacts,
} from '../activation/media-data-readiness'

const writeArtifacts = process.argv.includes('--write-artifacts') || process.argv.includes('--execute') || process.env.REEDITPRO_CONFIRM_MEDIA_DATA_READINESS_AUDIT === 'true'
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const artifactDir = artifactDirArg?.split('=')[1] ?? MEDIA_DATA_READINESS_REPORT_DIR

if (writeArtifacts) {
  if (process.env.REEDITPRO_CONFIRM_MEDIA_DATA_READINESS_AUDIT !== 'true') {
    throw new Error('REEDITPRO_CONFIRM_MEDIA_DATA_READINESS_AUDIT=true is required to write Phase 46A reports.')
  }
  if (process.env.REEDITPRO_CONFIRM_MEDIA_DATA_WEB_RESEARCH !== 'true') {
    throw new Error('REEDITPRO_CONFIRM_MEDIA_DATA_WEB_RESEARCH=true is required to write Phase 46A source/license evidence.')
  }
  const reports = await writeMediaDataReadinessArtifacts(artifactDir)
  console.log(JSON.stringify(reports.readinessReport, null, 2))
} else {
  console.log(JSON.stringify(buildMediaDataReadinessSummary(), null, 2))
}
