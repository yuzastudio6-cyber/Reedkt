import {
  ocrModelDownloadEvidenceToTypeScript,
  runOcrModelDownload,
} from '../activation/ocr-model-download'

const execute = process.argv.includes('--execute')
const keepTemp = process.argv.includes('--keep-temp')
const writeEvidenceModule = process.argv.includes('--emit-approved-evidence-module')

if (!execute) {
  console.log([
    'Phase 37B PaddleOCR exact asset download CLI',
    'No execution performed.',
    'Pass --execute with REEDITPRO_CONFIRM_OCR_MODEL_DOWNLOAD=true and REEDITPRO_CONFIRM_PRIVATE_GCS_UPLOAD=true to download/upload the approved PP-OCRv5 mobile det/rec/dictionary assets.',
  ].join('\n'))
} else {
  const result = await runOcrModelDownload({
    execute: true,
    cleanup: !keepTemp,
  })

  if (writeEvidenceModule) console.log(ocrModelDownloadEvidenceToTypeScript(result.evidence))
  else console.log(JSON.stringify(result, null, 2))
}
