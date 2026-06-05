import { buildSystemReadinessIamPlan } from '../activation/system-readiness-reconciliation'

console.log(JSON.stringify(buildSystemReadinessIamPlan(), null, 2))
