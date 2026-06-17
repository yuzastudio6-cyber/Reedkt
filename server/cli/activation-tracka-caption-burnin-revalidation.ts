import { writeTrackaCaptionBurninReport } from '../activation/tracka-caption-burnin-revalidation'

const execute = process.argv.includes('--execute')
const bundle = await writeTrackaCaptionBurninReport({ execute })

console.log(JSON.stringify(bundle.summary, null, 2))

process.exit(0)
