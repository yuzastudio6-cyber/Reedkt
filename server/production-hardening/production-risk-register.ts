import type { ProductionRiskRegisterItem } from './production-hardening-types'

export const productionRiskRegister: ProductionRiskRegisterItem[] = [
  {
    id: 'readiness-blocked',
    category: 'readiness_validation',
    severity: 'high',
    risk: 'Production-ready execution could be enabled before tool, model, and manual blockers are cleared.',
    mitigation: 'Keep productionReadyAllowed false and require human approval records before launch.',
  },
  {
    id: 'secret-logging',
    category: 'logging_sanitization',
    severity: 'high',
    risk: 'Logs could expose secrets, raw prompts, cookies, auth headers, or signed URLs.',
    mitigation: 'Use sanitized logging helpers and enforce forbidden-field smoke coverage.',
  },
  {
    id: 'gpu-cost-spike',
    category: 'cost_controls',
    severity: 'high',
    risk: 'GPU/render jobs could run away without concurrency, timeout, retry, and kill-switch controls.',
    mitigation: 'Keep GPU/render kill switches on until approved cost budgets and limits are configured.',
  },
  {
    id: 'private-media-leak',
    category: 'privacy_retention',
    severity: 'high',
    risk: 'Source media or final exports could become public before delivery/share policy approval.',
    mitigation: 'Require private storage refs, no persistent signed URLs, and retention/deletion policies.',
  },
  {
    id: 'beta-scope-creep',
    category: 'beta_readiness',
    severity: 'medium',
    risk: 'Internal dry-run readiness may be mistaken for external beta or paid production readiness.',
    mitigation: 'Separate internal dry-run permission from real user media/external beta permissions.',
  },
]
