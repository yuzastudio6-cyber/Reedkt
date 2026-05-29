import {
  runSam2ModelDownload,
  sam2ModelDownloadEvidenceToTypeScript,
} from '../activation/sam2-model-download'

const execute = process.argv.includes('--execute')
const keepTemp = process.argv.includes('--keep-temp')
const writeEvidenceModule = process.argv.includes('--emit-approved-evidence-module')

if (!execute) {
  console.log([
    'Phase 35B SAM2 model download CLI',
    'No execution performed.',
    'Pass --execute with REEDITPRO_CONFIRM_SAM2_MODEL_DOWNLOAD=true to download/upload the approved SAM2.1 tiny checkpoint/config.',
  ].join('\n'))
} else {
  const result = await runSam2ModelDownload({
    execute: true,
    cleanup: !keepTemp,
  })

  if (writeEvidenceModule) console.log(sam2ModelDownloadEvidenceToTypeScript(result.evidence))
  else console.log(JSON.stringify(result, null, 2))
}
