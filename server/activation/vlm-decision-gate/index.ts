import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'

export const VLM_DECISION_GATE_PHASE = '39C-DECISION'
export const VLM_DECISION_GATE_REPORT_DIR = 'docs/activation-phase-39c-vlm-decision-gate-reports'
export const VLM_DECISION_GATE_RUN_ID = 'phase39c-decision-20260602'
export const VLM_DECISION_GATE_ACCESSED_ON = '2026-06-02'

export type VlmDecisionGateBetaStatus =
  | 'blocked'
  | 'phase-complete but tool-family incomplete'
  | 'internally beta-ready candidate'
  | 'external beta still blocked'

export interface VlmDecisionEvidenceItem {
  phase: string
  pr: number
  url: string
  status: 'open' | 'merged' | 'unknown'
  outcome: string
  worked: string[]
  failed: string[]
  proven: string[]
  notProven: string[]
  safeReportDirs: string[]
  privateArtifactPrefixes: string[]
  validation: string
  packageLock: 'unchanged' | 'unknown'
}

export interface VlmDecisionSource {
  id: string
  title: string
  url: string
  accessedOn: string
  evidence: string
  decisionImpact: string
}

export interface VlmDecisionOption {
  id: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  name: string
  description: string
  pros: string[]
  cons: string[]
  requiredApprovals: string[]
  recommendation: string
  confidence: 'high' | 'medium' | 'low'
}

export interface VlmDecisionPlan {
  phase: typeof VLM_DECISION_GATE_PHASE
  defaultMode: 'report_only_non_mutating'
  branch: string
  baseIfPr115Open: string
  prBaseIfPr115Open: string
  requiredConfirmationsForReportGeneration: string[]
  forbiddenActions: string[]
  sourcePullRequests: number[]
  reportDirectory: string
  reports: string[]
  blockedScopes: string[]
  recommendedNextPhase: string
  vlmToolFamilyBetaStatus: VlmDecisionGateBetaStatus
}

export interface VlmDecisionReports {
  evidenceInventory: {
    phase: typeof VLM_DECISION_GATE_PHASE
    runId: string
    generatedAt: string
    sourcePrs: VlmDecisionEvidenceItem[]
    packageLockSummary: 'unchanged_across_recent_vlm_phases'
    trackAStatus: 'untouched'
    modelMediaPayloadStatus: 'not_committed'
  }
  webResearch: {
    phase: typeof VLM_DECISION_GATE_PHASE
    accessedOn: string
    sources: VlmDecisionSource[]
    conflicts: string[]
    summary: string[]
  }
  rootCause: {
    phase: typeof VLM_DECISION_GATE_PHASE
    platformPiecesProvenWorking: string[]
    vllmBlockers: string[]
    sglangBlockers: string[]
    productImplication: string[]
  }
  recoveryMatrix: {
    phase: typeof VLM_DECISION_GATE_PHASE
    options: VlmDecisionOption[]
  }
  decisionRecord: {
    phase: typeof VLM_DECISION_GATE_PHASE
    decision: string
    primaryRecommendation: string
    fallbackRecommendation: string
    doNotRetryWithoutNewApproval: string[]
    phase39dStatus: 'blocked'
    phase39eStatus: 'blocked'
    vlmToolFamilyBetaStatus: VlmDecisionGateBetaStatus
    blockedScopes: string[]
    nextRecommendedPhase: string
  }
  artifactManifest: {
    phase: typeof VLM_DECISION_GATE_PHASE
    runId: string
    reportDirectory: string
    committedArtifacts: string[]
    privateArtifactsUploaded: false
    forbiddenArtifactClasses: string[]
  }
  summary: {
    phase: typeof VLM_DECISION_GATE_PHASE
    status: 'blocked'
    primaryRecommendation: string
    fallbackRecommendation: string
    vlmToolFamilyBetaStatus: VlmDecisionGateBetaStatus
  }
}

const SOURCE_PRS: VlmDecisionEvidenceItem[] = [
  {
    phase: '39A Qwen3-VL/vLLM approval workflow',
    pr: 62,
    url: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/62',
    status: 'open',
    outcome: 'Qwen3-VL/vLLM planning evidence passed as metadata-only approval planning.',
    worked: ['source/license/runtime planning evidence', 'private storage handoff plan', 'blocked-scope policy'],
    failed: [],
    proven: ['approval workflow can produce safe metadata and Phase 39B handoff'],
    notProven: ['model download', 'runtime inference', 'generated fixture QA', 'real-frame QA'],
    safeReportDirs: ['docs/activation-phase-39a-qwen3-vl-vllm-approval-reports'],
    privateArtifactPrefixes: [],
    validation: 'reported passing in source evidence',
    packageLock: 'unchanged',
  },
  {
    phase: '39B exact Qwen3-VL asset private staging',
    pr: 64,
    url: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/64',
    status: 'open',
    outcome: 'Unquantized Qwen/Qwen3-VL-8B-Instruct assets were pinned, checksummed, uploaded privately, and verified.',
    worked: ['exact revision pin', 'per-file SHA-256', 'aggregate SHA-256', 'private GCS object verification'],
    failed: [],
    proven: ['private model storage/download/checksum chain for original 8B BF16 candidate'],
    notProven: ['runtime support', 'L4 memory fit', 'generated fixture QA'],
    safeReportDirs: ['docs/activation-phase-39b-qwen3-vl-exact-assets-private-staging-reports'],
    privateArtifactPrefixes: ['gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/'],
    validation: 'reported passing in source evidence',
    packageLock: 'unchanged',
  },
  {
    phase: '39C generated VLM runtime verification',
    pr: 66,
    url: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/66',
    status: 'open',
    outcome: 'Original unquantized 8B BF16 candidate failed on Cloud Run L4 with CUDA OOM before generated fixture inference.',
    worked: ['private model copy', 'checksum verification', 'local model path preparation', 'private QA artifact upload'],
    failed: ['vLLM engine initialization on Cloud Run L4 for BF16 8B'],
    proven: ['L4 OOM blocker is real for the original unquantized BF16 8B path'],
    notProven: ['generated image inference', 'schema validation', 'object-region QA', 'safe-zone QA'],
    safeReportDirs: ['docs/activation-phase-39c-generated-vlm-runtime-verification-reports'],
    privateArtifactPrefixes: ['gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase39c/generated-vlm-runtime/'],
    validation: 'reported passing for code/reporting; runtime blocked by OOM',
    packageLock: 'unchanged',
  },
  {
    phase: '39B-Q/39C-Q official L4-compatible Qwen candidate recovery',
    pr: 87,
    url: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/87',
    status: 'open',
    outcome: 'Official Qwen FP8 8B, BF16 4B, and BF16 2B candidates were privately staged and reached output generation, but failed JSON/schema QA.',
    worked: ['official candidate staging', 'private checksums', 'local model path runtime', 'L4 output generation attempts'],
    failed: ['required structured JSON/schema QA'],
    proven: ['smaller/FP8 official candidates improve L4 runtime reachability'],
    notProven: ['valid generated fixture report', 'semantic object/safe-zone QA'],
    safeReportDirs: ['docs/activation-phase-39bq-39cq-vlm-l4-compatible-candidate-reports'],
    privateArtifactPrefixes: ['gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/'],
    validation: 'reported passing for build/smoke/reporting; runtime QA blocked',
    packageLock: 'unchanged',
  },
  {
    phase: '39C-Q-SO structured-output enforcement',
    pr: 90,
    url: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/90',
    status: 'open',
    outcome: 'Structured-output strategies S1-S5 did not pass all generated fixtures.',
    worked: ['compact schema', 'strategy matrix', 'safe trace policy', 'some 2B generated-fixture execution'],
    failed: ['compact schema QA', 'object-region QA', 'safe-zone QA'],
    proven: ['format enforcement alone is insufficient for image QA'],
    notProven: ['full generated runtime verification', 'Phase 39D readiness'],
    safeReportDirs: ['docs/activation-phase-39cq-vlm-structured-output-reports'],
    privateArtifactPrefixes: ['gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase39c/generated-vlm-structured-output/'],
    validation: 'reported passing for code/build/reporting; runtime QA blocked',
    packageLock: 'unchanged',
  },
  {
    phase: '39C-Q-SO3 perception canary/decomposed QA',
    pr: 97,
    url: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/97',
    status: 'open',
    outcome: 'vLLM/Qwen candidates failed simple generated perception canaries; semantic perception/localization is the blocker.',
    worked: ['candidate copy/checksum', 'private artifact upload', 'labels-only and coarse-region canary measurement'],
    failed: ['canary label recall threshold', 'coarse-region accuracy threshold'],
    proven: ['current vLLM/Qwen path does not provide reliable generated-image perception/localization under the required gates'],
    notProven: ['original generated fixtures after canary pass', 'controlled real-frame VLM'],
    safeReportDirs: ['docs/activation-phase-39cq-so3-vlm-perception-canary-reports'],
    privateArtifactPrefixes: ['gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase39c/generated-vlm-perception-canary/'],
    validation: 'reported passing for code/build/reporting; canary QA blocked',
    packageLock: 'unchanged',
  },
  {
    phase: '39C-SG SGLang alternate runtime evaluation',
    pr: 100,
    url: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/100',
    status: 'open',
    outcome: 'SGLang source/license/runtime scaffolding passed, but local Docker buildx hung before image digest or Cloud Run execution.',
    worked: ['SGLang source/license/runtime evidence', 'dedicated worker path', 'QA policy reuse'],
    failed: ['local Docker buildx image build/push'],
    proven: ['SGLang evaluation scaffolding exists'],
    notProven: ['SGLang import', 'SGLang generated inference', 'candidate QA'],
    safeReportDirs: ['docs/activation-phase-39c-sg-sglang-vlm-runtime-reports'],
    privateArtifactPrefixes: [],
    validation: 'reported passing for local code/build/reporting; runtime not reached',
    packageLock: 'unchanged',
  },
  {
    phase: '39C-SG-BUILD Cloud Build runtime rerun',
    pr: 104,
    url: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/104',
    status: 'open',
    outcome: 'Cloud Build/image push and Cloud Run L4 job execution worked, but SGLang failed before inference with unresolved cuGreenCtxDestroy.',
    worked: ['Cloud Build overlay image', 'Artifact Registry image digest', 'Cloud Run L4 job wiring', 'private model copy/checksum', 'private QA upload'],
    failed: ['SGLang engine import due sgl_kernel/common_ops.abi3.so undefined symbol cuGreenCtxDestroy'],
    proven: ['image/build/cloud/job/platform wiring is not the blocker'],
    notProven: ['SGLang inference', 'generated fixture QA'],
    safeReportDirs: ['docs/activation-phase-39c-sg-sglang-vlm-runtime-reports'],
    privateArtifactPrefixes: ['gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase39c/generated-vlm-sglang-runtime/'],
    validation: 'reported passing for code/build/reporting; SGLang import blocked',
    packageLock: 'unchanged',
  },
  {
    phase: '39C-SG-KERNEL compatibility matrix',
    pr: 107,
    url: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/107',
    status: 'open',
    outcome: 'K0-K5 kernel compatibility matrix added; import smoke still failed or was blocked.',
    worked: ['import-smoke gating', 'kernel profile matrix', 'baseline failure preservation'],
    failed: ['tested profiles still hit Cloud Run L4 CUDA/driver symbol blocker or related build/runtime blockers'],
    proven: ['cuGreenCtxDestroy blocker is before model copy/inference'],
    notProven: ['SGLang launch-server import on L4', 'generated fixture runtime'],
    safeReportDirs: ['docs/activation-phase-39c-sg-sglang-vlm-runtime-reports/kernel-profiles'],
    privateArtifactPrefixes: ['gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase39c/generated-vlm-sglang-kernel/'],
    validation: 'reported passing for code/build/reporting; import smoke blocked',
    packageLock: 'unchanged',
  },
  {
    phase: '39C-SG-FIXED fixed SGLang kernel runtime',
    pr: 110,
    url: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/110',
    status: 'open',
    outcome: 'Fixed-kernel evidence and profiles were added, but execution was blocked by noninteractive gcloud reauthentication.',
    worked: ['upstream evidence capture', 'fixed profile matrix', 'Cloud Build config', 'auth blocker evidence'],
    failed: ['noninteractive gcloud token refresh'],
    proven: ['fixed-kernel path requires noninteractive auth before it can be evaluated'],
    notProven: ['Cloud Build execution in that phase', 'import-smoke pass', 'runtime QA'],
    safeReportDirs: ['docs/activation-phase-39c-sg-sglang-vlm-runtime-reports/kernel-profiles'],
    privateArtifactPrefixes: ['gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase39c/generated-vlm-sglang-fixed-kernel/'],
    validation: 'reported passing for code/build/reporting; auth blocked execution',
    packageLock: 'unchanged',
  },
  {
    phase: '39C-SG-AUTH-RERUN noninteractive auth fixed-kernel rerun',
    pr: 115,
    url: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/115',
    status: 'open',
    outcome: 'Noninteractive auth was unblocked and F1/F2/F3 builds/pushes passed, but no fixed-kernel import-smoke profile passed; generated runtime did not run.',
    worked: ['noninteractive auth', 'Cloud Build for F1/F2/F3', 'Artifact Registry push'],
    failed: ['fixed-kernel Cloud Run L4 import smoke'],
    proven: ['auth was not the final blocker; SGLang kernel/runtime compatibility remains before inference'],
    notProven: ['SGLang generated-image inference', 'candidate QA', 'Phase 39D readiness'],
    safeReportDirs: ['docs/activation-phase-39c-sg-sglang-vlm-runtime-reports/kernel-profiles'],
    privateArtifactPrefixes: ['gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase39c/generated-vlm-sglang-auth-rerun/'],
    validation: 'reported passing for code/build/reporting; import smoke blocked runtime',
    packageLock: 'unchanged',
  },
]

const BLOCKED_SCOPES = [
  'Phase 39D controlled real-frame VLM',
  'Phase 39E object-aware/safe-zone planning integration',
  'VLM runtime retries without explicit new approval and new evidence',
  'provider calls',
  'production',
  'internal beta',
  'external beta',
  'paid production',
  'public output',
  'broad user media',
  'arbitrary media',
  'unapproved GPU/runtime classes',
  'non-Qwen candidates unless separately approved',
  'new model downloads',
  'new model staging',
  'service-account keys',
  'Track A runtime/visual/render stack',
]

const FORBIDDEN_ACTIONS = [
  'Docker execution',
  'Cloud Build execution',
  'Cloud Run execution',
  'GPU jobs',
  'IAM mutation',
  'model download',
  'model staging',
  'vLLM runtime',
  'SGLang runtime',
  'generated image fixture reprocessing',
  'real media processing',
  'provider/API calls',
  'beta or production unlock',
]

const REPORT_FILES = [
  'phase_39c_vlm_decision_evidence_inventory.json',
  'phase_39c_vlm_decision_evidence_inventory.md',
  'phase_39c_vlm_decision_web_research.json',
  'phase_39c_vlm_decision_web_research.md',
  'phase_39c_vlm_decision_root_cause_report.json',
  'phase_39c_vlm_decision_root_cause_report.md',
  'phase_39c_vlm_decision_recovery_matrix.json',
  'phase_39c_vlm_decision_recovery_matrix.md',
  'phase_39c_vlm_decision_record.json',
  'phase_39c_vlm_decision_record.md',
  'phase_39c_vlm_decision_artifact_manifest.json',
]

export function getVlmDecisionGatePlan(): VlmDecisionPlan {
  return {
    phase: VLM_DECISION_GATE_PHASE,
    defaultMode: 'report_only_non_mutating',
    branch: 'codex/rp-activation-39c-vlm-decision-gate-recovery-plan',
    baseIfPr115Open: 'codex/rp-activation-39c-sg-auth-rerun-fixed-kernel',
    prBaseIfPr115Open: 'codex/rp-activation-39c-sg-auth-rerun-fixed-kernel',
    requiredConfirmationsForReportGeneration: [
      'REEDITPRO_CONFIRM_VLM_DECISION_GATE',
      'REEDITPRO_CONFIRM_VLM_DECISION_WEB_RESEARCH',
    ],
    forbiddenActions: FORBIDDEN_ACTIONS,
    sourcePullRequests: SOURCE_PRS.map((item) => item.pr),
    reportDirectory: VLM_DECISION_GATE_REPORT_DIR,
    reports: REPORT_FILES,
    blockedScopes: BLOCKED_SCOPES,
    recommendedNextPhase: 'Phase 46A media/data tool readiness audit',
    vlmToolFamilyBetaStatus: 'blocked',
  }
}

export function buildVlmDecisionGateReports(): VlmDecisionReports {
  const webResearch: VlmDecisionReports['webResearch'] = {
    phase: VLM_DECISION_GATE_PHASE,
    accessedOn: VLM_DECISION_GATE_ACCESSED_ON,
    sources: [
      {
        id: 'vllm-supported-qwen3vl',
        title: 'vLLM supported models: Qwen3VLForConditionalGeneration',
        url: 'https://docs.vllm.ai/en/v0.21.0/models/supported_models/',
        accessedOn: VLM_DECISION_GATE_ACCESSED_ON,
        evidence: 'vLLM lists Qwen3VLForConditionalGeneration with text, image, and video support examples including Qwen/Qwen3-VL-4B-Instruct.',
        decisionImpact: 'Supports keeping vLLM as a plausible runtime in principle, but repo evidence shows current Qwen/vLLM/L4 outputs fail semantic QA.',
      },
      {
        id: 'vllm-structured-outputs',
        title: 'vLLM structured outputs',
        url: 'https://docs.vllm.ai/en/latest/features/structured_outputs/',
        accessedOn: VLM_DECISION_GATE_ACCESSED_ON,
        evidence: 'vLLM documents response_format json_schema and structured_outputs grammar usage.',
        decisionImpact: 'Explains why text-only schema conformance can pass while image perception quality still fails separately.',
      },
      {
        id: 'qwen-vllm-enable-thinking',
        title: 'Qwen vLLM deployment guidance',
        url: 'https://github.com/QwenLM/Qwen3/blob/main/docs/source/deployment/vllm.md',
        accessedOn: VLM_DECISION_GATE_ACCESSED_ON,
        evidence: 'Qwen documents passing chat_template_kwargs enable_thinking=false and notes compatibility caveats around thinking/reasoning parser behavior.',
        decisionImpact: 'Supports the no-thinking configuration used in structured-output retries but does not guarantee visual localization quality.',
      },
      {
        id: 'sglang-qwen3vl',
        title: 'SGLang Qwen3-VL usage',
        url: 'https://docs.sglang.io/docs/basic_usage/qwen3_vl',
        accessedOn: VLM_DECISION_GATE_ACCESSED_ON,
        evidence: 'SGLang states it supports the Qwen3-VL family with image and video input support and provides launch/request examples.',
        decisionImpact: 'Supports SGLang as a plausible alternate runtime, but repo import-smoke evidence blocks Cloud Run L4 inference.',
      },
      {
        id: 'sglang-structured-output',
        title: 'SGLang structured outputs',
        url: 'https://docs.sglang.io/docs/advanced_features/structured_outputs',
        accessedOn: VLM_DECISION_GATE_ACCESSED_ON,
        evidence: 'SGLang supports JSON schema, regex, EBNF, and structural tags, with XGrammar as the default backend.',
        decisionImpact: 'Structured outputs remain valuable for formatting once perception/runtime passes, but they are not a substitute for semantic QA.',
      },
      {
        id: 'sglang-cugreenctx-8432',
        title: 'SGLang issue #8432: undefined symbol cuGreenCtxDestroy',
        url: 'https://github.com/sgl-project/sglang/issues/8432',
        accessedOn: VLM_DECISION_GATE_ACCESSED_ON,
        evidence: 'Upstream issue records a cuGreenCtxDestroy unresolved-symbol failure and links to PR #9021.',
        decisionImpact: 'Matches the ReeditPro Cloud Run L4 SGLang import failure class.',
      },
      {
        id: 'sglang-cugreenctx-8566',
        title: 'SGLang issue #8566: sgl_kernel common_ops undefined symbol',
        url: 'https://github.com/sgl-project/sglang/issues/8566',
        accessedOn: VLM_DECISION_GATE_ACCESSED_ON,
        evidence: 'Upstream issue records ImportError for sgl_kernel/common_ops.abi3.so with cuGreenCtxDestroy.',
        decisionImpact: 'Confirms the failure is a known SGLang/kernel/CUDA compatibility class, not a ReeditPro model-staging defect.',
      },
      {
        id: 'sglang-pr-9021',
        title: 'SGLang PR #9021',
        url: 'https://github.com/sgl-project/sglang/pull/9021',
        accessedOn: VLM_DECISION_GATE_ACCESSED_ON,
        evidence: 'Merged PR adds runtime CUDA-driver checks to avoid unresolved green-context symbols.',
        decisionImpact: 'Supports the fixed-kernel investigation but PR #115 shows tested profiles still did not pass ReeditPro Cloud Run L4 import smoke.',
      },
      {
        id: 'sglang-pr-9231',
        title: 'SGLang PR #9231',
        url: 'https://github.com/sgl-project/sglang/pull/9231',
        accessedOn: VLM_DECISION_GATE_ACCESSED_ON,
        evidence: 'Merged upstream work made green-context spatial ops optional/lazy per prior Phase 39C-SG-FIXED evidence.',
        decisionImpact: 'Potentially relevant to future source-build or package refresh paths, but not enough to justify another blind retry.',
      },
      {
        id: 'cloud-run-gpu',
        title: 'Google Cloud Run jobs with GPUs',
        url: 'https://docs.cloud.google.com/run/docs/configuring/jobs/gpu',
        accessedOn: VLM_DECISION_GATE_ACCESSED_ON,
        evidence: 'Cloud Run jobs support L4 GPUs with 535.x.x / CUDA 12.2 driver libraries under /usr/local/nvidia/lib64 and separate RTX PRO 6000 Blackwell GPUs with newer driver requirements.',
        decisionImpact: 'Explains the CUDA-driver ABI constraint and why different GPU/runtime environments require explicit approval.',
      },
      {
        id: 'opencv-shape-analysis',
        title: 'OpenCV structural analysis and shape descriptors',
        url: 'https://docs.opencv.org/4.x/d3/dc0/group__imgproc__shape.html',
        accessedOn: VLM_DECISION_GATE_ACCESSED_ON,
        evidence: 'OpenCV provides connected components, contours, bounding rectangles, and shape-analysis primitives.',
        decisionImpact: 'Supports deterministic geometry and safe-zone extraction for Phase 46A media/data hardening.',
      },
      {
        id: 'pyav-docs',
        title: 'PyAV documentation',
        url: 'https://pyav.org/docs/stable/',
        accessedOn: VLM_DECISION_GATE_ACCESSED_ON,
        evidence: 'PyAV is a Pythonic binding around FFmpeg libraries for media container/frame access.',
        decisionImpact: 'Supports a deterministic frame/metadata extraction route that does not depend on VLM perception.',
      },
      {
        id: 'pyscenedetect-docs',
        title: 'PySceneDetect documentation',
        url: 'https://www.scenedetect.com/',
        accessedOn: VLM_DECISION_GATE_ACCESSED_ON,
        evidence: 'PySceneDetect provides scene detection and video-splitting workflows.',
        decisionImpact: 'Supports Phase 46A segmentation/fixture-handoff planning without VLM runtime retries.',
      },
      {
        id: 'duckdb-polars',
        title: 'DuckDB Python and Polars integration',
        url: 'https://duckdb.org/docs/stable/guides/python/polars',
        accessedOn: VLM_DECISION_GATE_ACCESSED_ON,
        evidence: 'DuckDB and Polars can interoperate for tabular analytics workflows.',
        decisionImpact: 'Supports deterministic QA/report aggregation for media/data readiness.',
      },
      {
        id: 'polars-docs',
        title: 'Polars user guide',
        url: 'https://docs.pola.rs/',
        accessedOn: VLM_DECISION_GATE_ACCESSED_ON,
        evidence: 'Polars provides a DataFrame engine for structured data analysis.',
        decisionImpact: 'Supports fast local metrics/report processing in the Phase 46A handoff.',
      },
    ],
    conflicts: [
      'Official vLLM and SGLang docs indicate Qwen3-VL runtime support, but ReeditPro evidence shows the approved L4 deployments still fail either semantic QA under vLLM or import-smoke under SGLang.',
      'Structured-output docs promise constrained format, but they do not promise correct visual labels, localization, or safe-zone decisions.',
    ],
    summary: [
      'The external evidence supports vLLM/SGLang as plausible runtimes, not as proven beta-ready ReeditPro VLM paths.',
      'Cloud Run L4 driver/CUDA constraints remain relevant to SGLang kernel compatibility.',
      'Deterministic media/data tools provide a lower-risk product-forward path for geometry, regions, OCR handoff, and QA aggregation.',
    ],
  }

  const recoveryMatrix: VlmDecisionReports['recoveryMatrix'] = {
    phase: VLM_DECISION_GATE_PHASE,
    options: [
      {
        id: 'A',
        name: 'Controlled L4 GCE/Vertex runtime for SGLang',
        description: 'Move SGLang import-smoke/generated-runtime to a controlled GCE, Vertex, or custom job environment with a reviewed NVIDIA driver/CUDA stack while keeping the L4 GPU class.',
        pros: ['isolates Cloud Run driver/ABI limitation', 'keeps the L4-only constraint', 'tests SGLang fairly'],
        cons: ['new runtime environment approval required', 'additional cost/security/runbook work', 'not immediate beta readiness'],
        requiredApprovals: ['controlled GCE/Vertex runtime phase', 'IAM/storage/networking review', 'private artifact policy', 'cost cap'],
        recommendation: 'Possible fallback only with explicit human approval.',
        confidence: 'medium',
      },
      {
        id: 'B',
        name: 'Human-approved VLM QA redesign',
        description: 'Keep Qwen/vLLM as advisory label/uncertainty signal only; use OCR, OpenCV, and media-data outputs as authoritative geometry and safe-zone sources.',
        pros: ['fastest product-forward path', 'aligns with completed OCR chain', 'reduces dependence on brittle VLM localization', 'can move beta readiness through deterministic tools'],
        cons: ['lowers VLM role', 'requires QA contract update', 'may not satisfy a requirement that VLM owns localization'],
        requiredApprovals: ['human QA contract approval', 'Phase 46A/46B/46C media-data hardening', 'later Phase 39E integration redesign'],
        recommendation: 'Default product-forward VLM recovery posture unless VLM-owned localization is mandatory.',
        confidence: 'high',
      },
      {
        id: 'C',
        name: 'Non-Qwen VLM candidate approval',
        description: 'Start a new approval chain for a non-Qwen VLM candidate optimized for generated-image grounding and L4/runtime fit.',
        pros: ['may solve semantic perception issue', 'cleaner than forcing current Qwen candidates'],
        cons: ['new license/model/runtime review', 'new download/staging/runtime chain', 'time/cost risk'],
        requiredApprovals: ['new model approval path', 'legal/license review', 'private storage/runtime/generated fixture phases'],
        recommendation: 'Valid only if product explicitly requires VLM-owned perception/localization.',
        confidence: 'medium',
      },
      {
        id: 'D',
        name: 'Different approved GPU/runtime CUDA class',
        description: 'Approve a GPU/runtime environment with newer driver/CUDA support, such as RTX PRO 6000 on Cloud Run if available or another approved GPU platform.',
        pros: ['may unblock SGLang/kernel compatibility', 'may run larger or more capable models'],
        cons: ['violates current L4-only default', 'requires explicit approval', 'higher cost', 'still may not solve semantic QA'],
        requiredApprovals: ['GPU class approval', 'cost review', 'runtime/security review', 'updated rollback/runbook'],
        recommendation: 'Not default; use only if budget/runtime approval exists.',
        confidence: 'low',
      },
      {
        id: 'E',
        name: 'Continue current Cloud Run L4 SGLang kernel work',
        description: 'Keep trying package/source-build combinations on Cloud Run L4.',
        pros: ['stays within current platform'],
        cons: ['repeated failures', 'upstream ABI instability', 'low confidence', 'burns time without product movement'],
        requiredApprovals: ['specific new upstream fix/version evidence', 'bounded source-build approval if applicable'],
        recommendation: 'Stop unless there is a specific new upstream fix/version with strong evidence.',
        confidence: 'low',
      },
      {
        id: 'F',
        name: 'Pause VLM and continue Phase 46A media/data hardening',
        description: 'Keep VLM blocked and continue with deterministic media/data tool audit and fixture suite.',
        pros: ['high value for beta readiness', 'supports OCR/VLM/QA later', 'lower risk', 'no blocked GPU runtime dependence'],
        cons: ['VLM remains blocked'],
        requiredApprovals: ['Phase 46A implementation approval'],
        recommendation: 'Immediate next implementation phase unless a human explicitly approves Option A, C, D, or E.',
        confidence: 'high',
      },
    ],
  }

  const reports: VlmDecisionReports = {
    evidenceInventory: {
      phase: VLM_DECISION_GATE_PHASE,
      runId: VLM_DECISION_GATE_RUN_ID,
      generatedAt: '2026-06-02T00:00:00-04:00',
      sourcePrs: SOURCE_PRS,
      packageLockSummary: 'unchanged_across_recent_vlm_phases',
      trackAStatus: 'untouched',
      modelMediaPayloadStatus: 'not_committed',
    },
    webResearch,
    rootCause: {
      phase: VLM_DECISION_GATE_PHASE,
      platformPiecesProvenWorking: [
        'private GCS model staging',
        'SHA-256 manifests and aggregate hash verification',
        'scoped IAM for approved private artifact prefixes',
        'Cloud Build remote image build',
        'Artifact Registry push and digest recording',
        'Cloud Run Job wiring',
        'noninteractive GCP auth preflight',
        'private artifact reporting',
      ],
      vllmBlockers: [
        'Qwen/Qwen3-VL-8B-Instruct BF16 failed Cloud Run L4 runtime with CUDA OOM before generated fixture inference.',
        'Official smaller/FP8 Qwen candidates under vLLM copied, checksummed, loaded, and generated outputs, but failed JSON/schema and semantic generated-image QA.',
        'Text-only structured output can pass, but structured output guarantees shape rather than visual correctness.',
        'Perception canary/decomposed QA failed object/label recall and coarse localization gates for every approved Qwen candidate.',
      ],
      sglangBlockers: [
        'Local Docker buildx hang was bypassed by Cloud Build.',
        'Cloud Build and Artifact Registry push are proven for the SGLang path.',
        'SGLang failed before inference on Cloud Run L4 because sgl_kernel/common_ops.abi3.so required unresolved CUDA green-context symbols such as cuGreenCtxDestroy.',
        'Fixed-kernel profiles F1/F2/F3 built and pushed after auth was fixed, but import-smoke still did not pass.',
        'SGLang generated runtime never reached generated fixture inference, so there is no SGLang semantic QA conclusion yet.',
      ],
      productImplication: [
        'The current Qwen/vLLM/SGLang/Cloud Run L4 route is not ready for generated VLM runtime verification.',
        'Phase 39D controlled real-frame VLM remains blocked.',
        'Phase 39E planning integration remains blocked.',
        'VLM should not block deterministic media/data hardening work.',
        'The default product-forward next phase is Phase 46A media/data tool readiness audit.',
      ],
    },
    recoveryMatrix,
    decisionRecord: {
      phase: VLM_DECISION_GATE_PHASE,
      decision: 'Keep VLM Phase 39C blocked and stop the current Qwen/vLLM/SGLang/Cloud Run L4 retry loop without explicit new evidence and human approval.',
      primaryRecommendation: 'Move to Phase 46A media/data tool readiness audit.',
      fallbackRecommendation: 'Prepare, but do not execute, a future approved VLM recovery path: controlled L4 GCE/Vertex SGLang runtime, human-approved VLM QA redesign, or non-Qwen VLM candidate approval.',
      doNotRetryWithoutNewApproval: [
        'more Qwen/vLLM structured-output retries',
        'more Cloud Run L4 SGLang kernel package retries',
        'different GPU/runtime class',
        'non-Qwen candidate approval/download/staging',
        'Phase 39D controlled real-frame VLM',
      ],
      phase39dStatus: 'blocked',
      phase39eStatus: 'blocked',
      vlmToolFamilyBetaStatus: 'blocked',
      blockedScopes: BLOCKED_SCOPES,
      nextRecommendedPhase: 'Phase 46A media/data tool readiness audit',
    },
    artifactManifest: {
      phase: VLM_DECISION_GATE_PHASE,
      runId: VLM_DECISION_GATE_RUN_ID,
      reportDirectory: VLM_DECISION_GATE_REPORT_DIR,
      committedArtifacts: REPORT_FILES,
      privateArtifactsUploaded: false,
      forbiddenArtifactClasses: [
        'credentials',
        'tokens',
        'model files',
        'safetensors',
        'tokenizer or processor payloads',
        'generated image payloads',
        'real media',
        'runtime caches',
        'Cloud Build logs',
        'Cloud Run logs',
        'provider logs',
      ],
    },
    summary: {
      phase: VLM_DECISION_GATE_PHASE,
      status: 'blocked',
      primaryRecommendation: 'Phase 46A media/data tool readiness audit',
      fallbackRecommendation: 'Explicitly approved VLM recovery path only',
      vlmToolFamilyBetaStatus: 'blocked',
    },
  }

  return reports
}

export function buildVlmDecisionGateSummary(): VlmDecisionReports['summary'] {
  return buildVlmDecisionGateReports().summary
}

export async function loadOrBuildVlmDecisionGateReport(
  artifactDir = VLM_DECISION_GATE_REPORT_DIR,
): Promise<VlmDecisionReports['decisionRecord']> {
  try {
    return JSON.parse(await readFile(path.join(artifactDir, 'phase_39c_vlm_decision_record.json'), 'utf8'))
  } catch {
    return buildVlmDecisionGateReports().decisionRecord
  }
}

export async function writeVlmDecisionGateArtifacts(artifactDir = VLM_DECISION_GATE_REPORT_DIR): Promise<VlmDecisionReports> {
  const reports = buildVlmDecisionGateReports()
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_vlm_decision_evidence_inventory.json'), reports.evidenceInventory)
  await writeVlmRuntimeTextArtifact(path.join(artifactDir, 'phase_39c_vlm_decision_evidence_inventory.md'), renderEvidenceInventoryMarkdown(reports.evidenceInventory))
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_vlm_decision_web_research.json'), reports.webResearch)
  await writeVlmRuntimeTextArtifact(path.join(artifactDir, 'phase_39c_vlm_decision_web_research.md'), renderWebResearchMarkdown(reports.webResearch))
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_vlm_decision_root_cause_report.json'), reports.rootCause)
  await writeVlmRuntimeTextArtifact(path.join(artifactDir, 'phase_39c_vlm_decision_root_cause_report.md'), renderRootCauseMarkdown(reports.rootCause))
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_vlm_decision_recovery_matrix.json'), reports.recoveryMatrix)
  await writeVlmRuntimeTextArtifact(path.join(artifactDir, 'phase_39c_vlm_decision_recovery_matrix.md'), renderRecoveryMatrixMarkdown(reports.recoveryMatrix))
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_vlm_decision_record.json'), reports.decisionRecord)
  await writeVlmRuntimeTextArtifact(path.join(artifactDir, 'phase_39c_vlm_decision_record.md'), renderDecisionRecordMarkdown(reports.decisionRecord))
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_vlm_decision_artifact_manifest.json'), reports.artifactManifest)
  return reports
}

function renderEvidenceInventoryMarkdown(report: VlmDecisionReports['evidenceInventory']): string {
  const rows = report.sourcePrs.map((item) => [
    item.phase,
    `[#${item.pr}](${item.url})`,
    item.outcome,
    item.failed.length ? item.failed.join('; ') : 'none recorded',
  ])
  return [
    '# Phase 39C VLM Decision Evidence Inventory',
    '',
    `Run id: ${report.runId}`,
    '',
    '| Phase | PR | Outcome | Blocker |',
    '| --- | --- | --- | --- |',
    ...rows.map((row) => `| ${row.join(' | ')} |`),
    '',
    `Package-lock summary: ${report.packageLockSummary}.`,
    `Track A status: ${report.trackAStatus}.`,
    `Model/media payload status: ${report.modelMediaPayloadStatus}.`,
  ].join('\n')
}

function renderWebResearchMarkdown(report: VlmDecisionReports['webResearch']): string {
  return [
    '# Phase 39C VLM Decision Web Research',
    '',
    `Accessed on: ${report.accessedOn}`,
    '',
    ...report.sources.map((source) => [
      `## ${source.title}`,
      '',
      `Source: ${source.url}`,
      '',
      `Evidence: ${source.evidence}`,
      '',
      `Decision impact: ${source.decisionImpact}`,
      '',
    ].join('\n')),
    '## Conflicts',
    '',
    ...report.conflicts.map((item) => `- ${item}`),
  ].join('\n')
}

function renderRootCauseMarkdown(report: VlmDecisionReports['rootCause']): string {
  return [
    '# Phase 39C VLM Root Cause Report',
    '',
    '## Platform Pieces Proven Working',
    '',
    ...report.platformPiecesProvenWorking.map((item) => `- ${item}`),
    '',
    '## vLLM Blockers',
    '',
    ...report.vllmBlockers.map((item) => `- ${item}`),
    '',
    '## SGLang Blockers',
    '',
    ...report.sglangBlockers.map((item) => `- ${item}`),
    '',
    '## Product Implication',
    '',
    ...report.productImplication.map((item) => `- ${item}`),
  ].join('\n')
}

function renderRecoveryMatrixMarkdown(report: VlmDecisionReports['recoveryMatrix']): string {
  return [
    '# Phase 39C VLM Recovery Decision Matrix',
    '',
    ...report.options.map((option) => [
      `## Option ${option.id}: ${option.name}`,
      '',
      option.description,
      '',
      `Pros: ${option.pros.join('; ')}.`,
      '',
      `Cons: ${option.cons.join('; ')}.`,
      '',
      `Required approvals: ${option.requiredApprovals.join('; ')}.`,
      '',
      `Recommendation: ${option.recommendation}`,
      '',
      `Confidence: ${option.confidence}`,
      '',
    ].join('\n')),
  ].join('\n')
}

function renderDecisionRecordMarkdown(report: VlmDecisionReports['decisionRecord']): string {
  return [
    '# Phase 39C VLM Decision Record',
    '',
    `Decision: ${report.decision}`,
    '',
    `Primary recommendation: ${report.primaryRecommendation}`,
    '',
    `Fallback recommendation: ${report.fallbackRecommendation}`,
    '',
    'Do not retry without new approval:',
    '',
    ...report.doNotRetryWithoutNewApproval.map((item) => `- ${item}`),
    '',
    `Phase 39D status: ${report.phase39dStatus}`,
    `Phase 39E status: ${report.phase39eStatus}`,
    `VLM tool-family beta status: ${report.vlmToolFamilyBetaStatus}`,
    '',
    'Blocked scopes:',
    '',
    ...report.blockedScopes.map((item) => `- ${item}`),
    '',
    `Next recommended phase: ${report.nextRecommendedPhase}`,
  ].join('\n')
}
