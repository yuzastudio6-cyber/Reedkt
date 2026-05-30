import {
  filmModelDownloadEvidenceToTypeScript,
  runFilmModelDownload,
} from '../activation/film-model-download'

const execute = process.argv.includes('--execute')
const keepTemp = process.argv.includes('--keep-temp')
const writeEvidenceModule = process.argv.includes('--emit-approved-evidence-module')

if (!execute) {
  console.log([
    'Phase 38B FILM model download CLI',
    'No execution performed.',
    'Pass --execute with REEDITPRO_CONFIRM_FILM_MODEL_DOWNLOAD=true to download/upload the approved FILM film_net/Style/saved_model tree.',
  ].join('\n'))
} else {
  const result = await runFilmModelDownload({
    execute: true,
    cleanup: !keepTemp,
  })

  if (writeEvidenceModule) console.log(filmModelDownloadEvidenceToTypeScript(result.evidence))
  else console.log(JSON.stringify(result, null, 2))
}
