import {
  inspectTrackAllSam31PrivateCanary,
} from '../edit-skills/track-all/private/sam3_1-private-canary'
import {
  createCurrentTrackAllSam31V2RouteGateReport,
} from '../edit-skills/track-all/private/sam3_1-v2-route-qualification-gate'

const execute = process.argv.includes('--execute')
const confirmation = process.argv.includes(
  '--confirm=TRACK_ALL_SAM31_PRIVATE_CANARY',
)
const report = createCurrentTrackAllSam31V2RouteGateReport()
const receipt = inspectTrackAllSam31PrivateCanary({
  routeGateReport: report,
  explicitExecutionAuthorityObserved: execute && confirmation,
})

console.log(JSON.stringify(receipt, null, 2))

if (execute) {
  if (!confirmation) throw new Error(
    'Explicit SAM canary confirmation is missing.',
  )
  if (receipt.status !== 'ready_not_executed') throw new Error(
    `SAM 3.1 private canary is blocked by: ${receipt.missingGateKeys.join(', ')}.`,
  )
  throw new Error(
    'The canonical private V2 canary bootstrap must be injected by the authorized backend owner; this CLI accepts no caller path, URL, model, GPU, command, checkpoint, or credential.',
  )
}

