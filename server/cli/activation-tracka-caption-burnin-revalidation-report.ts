import { writeTrackaCaptionBurninReport } from '../activation/tracka-caption-burnin-revalidation'

const bundle = await writeTrackaCaptionBurninReport()
console.log(JSON.stringify(bundle.report, null, 2))
