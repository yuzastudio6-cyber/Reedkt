#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DECISION = "qwen2_5_vl_7b_l4_capacity_assurance_plan_ready_for_reservation_approval_no_vm_no_inference";
const NEXT_PROMPT =
  "QWEN2_5_VL_STACK_TOOL_9-RESERVATION-APPROVAL: approve bounded L4 capacity reservation plan for Qwen proof, no VM/no inference";

const REQUIRED_FILES = [
  "docs/qwen2-5-vl-7b-l4-capacity-assurance-plan-result.md",
  "docs/qwen2-5-vl-7b-l4-capacity-assurance-plan-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-reservation-approval.md",
  "docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-east1-b-result.md",
  "docs/qwen2-5-vl-7b-l4-capacity-followup-result.md",
  "docs/ai-video-broll-generation-gcp-proof-identity-setup-result.md",
  "docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md",
  "scripts/validation/qwen2-5-vl-7b-l4-capacity-assurance-plan-diagnostics.mjs",
  "package.json"
];

const REQUIRED_RESULT_PHRASES = [
  DECISION,
  "five approved Qwen2.5-VL L4 proof attempts stocked out",
  "| 5 | `us-east1` | `us-east1-b` | `g2-standard-8` + one `nvidia-l4` | stockout |",
  "| Immediate sixth zonal retry | rejected |",
  "| Reservation or capacity assurance | recommended next approval path |",
  "| Smaller dependency-only smoke | not runtime proof |",
  "| Change selected GPU away from L4 | rejected for now |",
  "reservation/capacity-assurance approval packet",
  "Qwen2.5-VL remains a visual understanding, planning, and QA stack tool",
  NEXT_PROMPT
];

const TRUE_FLAGS = [
  "gcpReadOnlyCommandsExecuted",
  "reservationApprovalRecommended"
];

const FALSE_FLAGS = [
  "gcpMutatingCommandsExecuted",
  "reservationCreated",
  "scheduledRetryOnly",
  "smallerImportSmokeRecommended",
  "gpuSelectionChanged",
  "vmCreated",
  "diskCreated",
  "externalIpCreated",
  "networkChanged",
  "serviceAccountCreated",
  "serviceAccountKeyCreated",
  "firewallRuleCreated",
  "bucketCreated",
  "artifactRegistryImageCreated",
  "cloudRunJobCreated",
  "iapTransferExecuted",
  "sshSessionOpened",
  "dependencyInstalledOnVm",
  "runtimeImportRunOnL4",
  "cudaVisibilityCheckedOnL4",
  "vllmImportedOnL4",
  "sglangImportedOnL4",
  "apiServerStarted",
  "modelImportRun",
  "modelInferenceRun",
  "generatedVideoCreated",
  "generatedAssetsCreated",
  "providerCallsMade",
  "workersDispatched",
  "supabaseTouched",
  "sqlExecuted",
  "publicArtifactsCreated",
  "signedUrlsCreated",
  "creditMutationCreated",
  "betaUnlocked",
  "productionUnlocked",
  "dryRunPassedClaimed",
  "generatedLocalFixturePassedClaimed"
];

const FORBIDDEN_PATTERNS = [
  ["signed URL token", /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ["credential assignment", /\b(api[_-]?key|service[_-]?role|secret|password|hf[_-]?token|access[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ["database URL", /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ["remote storage URI", /\b(gs:\/\/|s3:\/\/|storage\.googleapis\.com\/)/i],
  ["raw worker prompt field", /\b(raw_worker_prompt|rawPromptPayload|raw_prompt)\b/i],
  ["runtime-ready true claim", /\b(productionReady|betaReady|runtimeReadinessClaimed)\b\s*[:=]\s*(true|"true")/i],
  ["unsafe pass claim", /\b(dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i]
];

function check(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function parseBlock(relativePath, label) {
  const text = read(relativePath);
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp("```json\\s+" + escaped + "\\n([\\s\\S]*?)\\n```"));
  check(match, `Missing JSON block ${label} in ${relativePath}`);
  return JSON.parse(match[1]);
}

function includesAll(text, values, label) {
  for (const value of values) {
    check(text.includes(value), `${label} missing ${value}`);
  }
}

function assertNoForbiddenText(relativePath) {
  const text = read(relativePath);
  const findings = [];
  for (const [name, pattern] of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) {
      findings.push(name);
    }
  }
  check(findings.length === 0, `Forbidden value in ${relativePath}: ${findings.join("; ")}`);
}

for (const file of REQUIRED_FILES) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
check(
  packageJson.scripts?.["qwen2-5-vl-7b-l4-capacity-assurance-plan:diagnostics"] ===
    "node scripts/validation/qwen2-5-vl-7b-l4-capacity-assurance-plan-diagnostics.mjs",
  "package.json must expose qwen2-5-vl-7b-l4-capacity-assurance-plan:diagnostics"
);

const result = read("docs/qwen2-5-vl-7b-l4-capacity-assurance-plan-result.md");
const prompt = read("docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-reservation-approval.md");
const changeLog = parseBlock(
  "docs/qwen2-5-vl-7b-l4-capacity-assurance-plan-change-log.md",
  "qwen2-5-vl-7b-l4-capacity-assurance-plan-change-log"
);

includesAll(result, REQUIRED_RESULT_PHRASES, "capacity assurance result");
includesAll(prompt, [
  NEXT_PROMPT,
  "Do not create or delete a reservation.",
  "Do not create or delete a VM.",
  "Do not run inference.",
  "Do not claim `generated_local_fixture_passed`."
], "reservation approval prompt");

for (const flag of TRUE_FLAGS) {
  includesAll(result, [`${flag}=true`], `true runtime flag ${flag}`);
}
for (const flag of FALSE_FLAGS) {
  includesAll(result, [`${flag}=false`], `false runtime flag ${flag}`);
}

check(changeLog.decision === DECISION, "Change log decision mismatch");
check(changeLog.stockoutEvidence?.attemptCount === 5, "Stockout attempt count mismatch");
check(changeLog.stockoutEvidence?.allAttemptsStockedOut === true, "All attempts must be stocked out");
check(changeLog.stockoutEvidence?.resourcesLeftBehind === false, "No resources may be left behind");
check(changeLog.repoEvidenceReview?.proofServiceAccountPresent === true, "Proof service account evidence missing");
check(changeLog.repoEvidenceReview?.iapFirewallPresent === true, "IAP firewall evidence missing");
check(changeLog.repoEvidenceReview?.globalGpuQuotaLimit === 1, "Global GPU quota evidence mismatch");
check(changeLog.optionDecision?.reservationOrCapacityAssurance === "recommended_next_approval_path", "Reservation decision mismatch");
check(changeLog.optionDecision?.smallerDependencyOnlySmoke === "not_runtime_proof", "Smaller smoke decision mismatch");
check(changeLog.optionDecision?.changeSelectedGpuAwayFromL4 === "rejected_for_now", "GPU selection decision mismatch");
check(changeLog.nextPrompt === NEXT_PROMPT, "Next prompt mismatch");

for (const flag of TRUE_FLAGS) {
  check(changeLog.runtimeFlags?.[flag] === true, `Change log runtime flag ${flag} must be true`);
}
for (const flag of FALSE_FLAGS) {
  check(changeLog.runtimeFlags?.[flag] === false, `Change log runtime flag ${flag} must be false`);
}

for (const file of [
  "docs/qwen2-5-vl-7b-l4-capacity-assurance-plan-result.md",
  "docs/qwen2-5-vl-7b-l4-capacity-assurance-plan-change-log.md",
  "docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-reservation-approval.md"
]) {
  assertNoForbiddenText(file);
}

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  stockoutAttemptCount: 5,
  reservationApprovalRecommended: true,
  reservationCreated: false,
  selectedGpu: "nvidia_l4_google_cloud_g2_first",
  gpuSelectionChanged: false,
  gcpMutatingCommandsExecuted: false,
  vmCreated: false,
  cudaVisibilityCheckedOnL4: false,
  vllmImportedOnL4: false,
  modelInferenceRun: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
