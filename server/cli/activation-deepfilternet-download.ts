import {
  deepFilterNetDownloadEvidenceToTypeScript,
  runDeepFilterNetDownload,
} from '../activation/audio-ai-download'

const execute = process.argv.includes('--execute')
const keepTemp = process.argv.includes('--keep-temp')
const writeEvidenceModule = process.argv.includes('--emit-approved-evidence-module')

if (!execute) {
  console.log([
    'Phase 36B DeepFilterNet artifact download CLI',
    'No execution performed.',
    'Pass --execute with REEDITPRO_CONFIRM_DEEPFILTERNET_ARTIFACT_DOWNLOAD=true to download/upload the approved DeepFilterNet v0.5.6 artifacts.',
  ].join('\n'))
} else {
  const result = await runDeepFilterNetDownload({
    execute: true,
    cleanup: !keepTemp,
  })

  if (writeEvidenceModule) console.log(deepFilterNetDownloadEvidenceToTypeScript(result.evidence))
  else console.log(JSON.stringify(result, null, 2))
}
