import { loadRuntimeEnv } from '../config/env'
import {
  evaluateRenderInfrastructureCanaryGuard,
  readPreviousSmokeRunIds,
} from '../services/render-infrastructure-canary-guard'

const live = process.argv.includes('--live')
const env = loadRuntimeEnv(process.env)
const previousSmokeRunIds = readPreviousSmokeRunIds(process.env)
const guard = evaluateRenderInfrastructureCanaryGuard({
  env,
  sourceEnv: process.env,
  expectDisabled: !live,
  previousSmokeRunIds,
})

console.log(JSON.stringify({
  ...guard,
  preflightOnly: true,
  livePreflight: live,
  noCloudRunInvocationRan: true,
  noRemotionInvocationRan: true,
  noSmokeRecordsCreated: true,
}, null, 2))

if (!guard.ok || (live && guard.status !== 'ready')) process.exitCode = 1
