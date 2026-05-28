import type { ParsedStagingDeployLog, StagingDeployStatus, StagingDeployTargetId } from './staging-deploy-types'

const targetPatterns: Array<[StagingDeployTargetId, RegExp]> = [
  ['api', /reeditpro-staging-api|\bapi\b/i],
  ['tool-readiness-job', /tool-readiness/i],
  ['cpu-analysis-job', /cpu-analysis|cpu-worker/i],
  ['qa-job', /reeditpro-staging-qa|qa-worker|\bqa-job\b/i],
  ['render-job', /render-worker|render-job/i],
  ['gpu-ai-job', /gpu/i],
]

export function parseStagingDeployLog(logText: string, sourceName = ''): ParsedStagingDeployLog {
  const targetId = inferTargetId(`${sourceName}\n${logText}`)
  const forbiddenFindings = forbiddenFindingsFor(logText)
  const errors = errorsFor(logText)
  const warnings: string[] = []
  const ready = /Ready|Service URL|Job .* has successfully been deployed|Done\./i.test(logText)
  const parsedStatus = statusFrom(ready, errors, forbiddenFindings)
  const serviceUrl = logText.match(/https:\/\/[^\s]+/)?.[0]
  if (!targetId) warnings.push('Could not infer deploy target from log.')
  return {
    targetId,
    parsedStatus,
    serviceUrl,
    errors,
    warnings,
    forbiddenFindings,
    nextActions: nextActionsFor(parsedStatus),
  }
}

function inferTargetId(text: string): StagingDeployTargetId | undefined {
  return targetPatterns.find(([, pattern]) => pattern.test(text))?.[0]
}

function errorsFor(text: string): string[] {
  const errors: string[] = []
  if (/unsupported.*architecture|manifest.*amd64|linux\/amd64|exec format error/i.test(text)) errors.push('Architecture incompatibility detected.')
  if (/permission denied|denied|403|unauthorized/i.test(text)) errors.push('GCP permission/auth error detected.')
  if (/not found|404|image.*not.*found/i.test(text)) errors.push('Cloud Run resource or image not found.')
  return errors
}

function forbiddenFindingsFor(text: string): string[] {
  const findings: string[] = []
  if (/gpu-ai-job|gpu-worker|--gpu|nvidia/i.test(text)) findings.push('GPU deployment signal detected.')
  if (/--allow-unauthenticated/i.test(text)) findings.push('Public unauthenticated access signal detected.')
  if (/provider\s+call|openai\s+api|stripe\s+charge/i.test(text)) findings.push('Provider call signal detected.')
  if (/huggingface-cli|snapshot_download|from_pretrained|download\s+model/i.test(text)) findings.push('Model download signal detected.')
  if (/\/uploads\/|user[-_\s]?media|\.mp4\b|\.mov\b|\.wav\b/i.test(text)) findings.push('Media processing signal detected.')
  if (/SECRET_VALUE|REAL_SECRET|--set-secrets|versions\s+add/i.test(text)) findings.push('Secret value or mount signal detected.')
  return findings
}

function statusFrom(ready: boolean, errors: string[], forbiddenFindings: string[]): StagingDeployStatus {
  if (forbiddenFindings.length > 0) return 'blocked'
  if (errors.length > 0) return 'failed'
  if (ready) return 'ready'
  return 'not_run'
}

function nextActionsFor(status: StagingDeployStatus): string[] {
  if (status === 'blocked') return ['Stop Phase 24B and remove forbidden deployment behavior.']
  if (status === 'failed') return ['Fix the reported Cloud Run deployment failure before retrying.']
  if (status === 'ready') return ['Record service/job readiness evidence for Phase 25.']
  return ['Provide deployment logs or architecture evidence before marking Phase 25 ready.']
}
