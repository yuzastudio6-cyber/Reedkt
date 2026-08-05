import {
  inspectTrackAllSam31PrivateCanary,
} from '../edit-skills/track-all/private/sam3_1-private-canary'
import {
  createCurrentTrackAllSam31V2RouteGateReport,
} from '../edit-skills/track-all/private/sam3_1-v2-route-qualification-gate'

const execute = process.argv.includes('--execute')
const confirmation = process.argv.includes(
  '--confirm=TRACK_ALL_SAM31_CANONICAL_PRIVATE_E2E',
)
const report = createCurrentTrackAllSam31V2RouteGateReport()
const preflight = inspectTrackAllSam31PrivateCanary({
  routeGateReport: report,
  explicitExecutionAuthorityObserved: execute && confirmation,
})

console.log(JSON.stringify({
  schemaVersion: 'track_all_sam3_1_canonical_private_e2e_preflight_v1',
  status: preflight.status === 'ready_not_executed'
    ? 'ready_requires_backend_owner_injection'
    : 'blocked_external_prerequisites',
  operationId: 'tool.sam3_1.track_masklets.v2',
  routeGateReportHash: report.reportHash,
  missingGateKeys: preflight.missingGateKeys,
  explicitHumanExecutionConfirmationObserved: execute && confirmation,
  publicPluginAndCanonicalCoordinatorEntryPoint:
    'executeTrackAllSam31CanonicalPrivatePublicE2E',
  acceptsCallerSelectedModelCheckpointGpuCommandPathUrlRetryFallbackOrPrice:
    false,
  actualSamRequestCount: 0,
  actualGpuExecutionCount: 0,
  paidActionOccurred: false,
  publicArtifactCount: 0,
  productionMutationCount: 0,
}, null, 2))

if (execute) {
  if (!confirmation) throw new Error(
    'Explicit canonical-private SAM E2E confirmation is missing.',
  )
  if (preflight.status !== 'ready_not_executed') throw new Error(
    `Canonical-private SAM E2E is blocked by: ${preflight.missingGateKeys.join(', ')}.`,
  )
  throw new Error(
    'The fixed backend owner must inject the already-constructed real session owner, durable private store, canonical runtime, execution package, and private geometry port into executeTrackAllSam31CanonicalPrivatePublicE2E. This command accepts no caller module, path, URL, model, checkpoint, GPU, command, retry, fallback, or price.',
  )
}
