#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repo = "yuzastudio6-cyber/Reedkt";
const runId = `github-merge-hygiene-${new Date().toISOString().replace(/[:.]/g, "")}`;
const root = process.cwd();
const hygieneDir = path.join(root, "docs", "github-merge-hygiene");
const reportsDir = path.join(hygieneDir, "reports");
const crossChatDir = path.join(root, "docs", "cross-chat");

const openFields = [
  "number",
  "title",
  "state",
  "isDraft",
  "mergeStateStatus",
  "baseRefName",
  "headRefName",
  "headRefOid",
  "updatedAt",
  "url",
];
const closedFields = ["number", "title", "state", "mergedAt", "baseRefName", "headRefName", "url"];

const approvalRequiredFiles = [
  "docs/github-merge-hygiene/draft-pr-drift-review.json",
  "docs/github-merge-hygiene/draft-pr-drift-review.md",
  "docs/github-merge-hygiene/live-pr-drift-tolerance-policy.json",
  "docs/github-merge-hygiene/live-pr-drift-tolerance-policy.md",
  "docs/github-merge-hygiene/current-live-drift-review.json",
  "docs/github-merge-hygiene/current-live-drift-review.md",
  "docs/github-merge-hygiene/pr-337-head-sha-drift-review.json",
  "docs/github-merge-hygiene/pr-337-head-sha-drift-review.md",
  "docs/github-merge-hygiene/frozen-merge-batch.json",
  "docs/github-merge-hygiene/frozen-merge-batch.md",
  "docs/github-merge-hygiene/frozen-batch-merge-order.json",
  "docs/github-merge-hygiene/frozen-batch-merge-order.md",
  "docs/github-merge-hygiene/human-merge-order-approval-packet.json",
  "docs/github-merge-hygiene/human-merge-order-approval-packet.md",
  "docs/github-merge-hygiene/validation-exception-policy.json",
  "docs/github-merge-hygiene/validation-exception-policy.md",
  "docs/github-merge-hygiene/duplicate-pr-human-review-draft.json",
  "docs/github-merge-hygiene/duplicate-pr-human-review-draft.md",
  "docs/github-merge-hygiene/reports/human_merge_order_approval_report.json",
  "docs/github-merge-hygiene/reports/merge_execution_readiness_report.json",
  "docs/github-merge-hygiene/reports/merge_execution_blocker_report.json",
  "docs/implementation-prompts/prompt-github-merge-execution-parent-chain.md",
];

const postMergeRequiredFiles = [
  "docs/github-merge-hygiene/post-merge-source-of-truth-verification.md",
  "docs/github-merge-hygiene/reports/post_merge_source_of_truth_verification_report.json",
  "docs/github-merge-hygiene/reports/post_merge_blocked_scope_verification_report.json",
];

const requiredFiles = [
  "docs/github-merge-hygiene/open-pr-stack-map.json",
  "docs/github-merge-hygiene/open-pr-stack-map.md",
  "docs/github-merge-hygiene/canonical-merge-order.json",
  "docs/github-merge-hygiene/canonical-merge-order.md",
  "docs/github-merge-hygiene/duplicate-pr-risk-register.json",
  "docs/github-merge-hygiene/duplicate-pr-risk-register.md",
  "docs/github-merge-hygiene/post-major-milestone-merge-rule.md",
  "docs/github-merge-hygiene/reports/open_pr_stack_audit_report.json",
  "docs/github-merge-hygiene/reports/merge_hygiene_readiness_report.json",
  "docs/github-merge-hygiene/reports/merge_hygiene_blocker_report.json",
  "docs/cross-chat/READ_FIRST_FOR_ALL_OWNERS.md",
  "docs/cross-chat/CURRENT_HANDOFF.md",
  "docs/cross-chat/OWNER_MATRIX.md",
  "docs/cross-chat/BLOCKED_SCOPES.md",
  "docs/cross-chat/NEXT_UNLOCK_LANES.md",
  ...approvalRequiredFiles,
  ...postMergeRequiredFiles,
];

const writeConfirmed =
  process.env.REEDITPRO_CONFIRM_GITHUB_MERGE_HYGIENE_AUDIT === "true" &&
  process.env.REEDITPRO_CONFIRM_CROSS_CHAT_HANDOFF_UPDATE === "true" &&
  process.env.REEDITPRO_CONFIRM_PR_STACK_ANALYSIS === "true";

const approvalWriteConfirmed =
  process.env.REEDITPRO_CONFIRM_GITHUB_MERGE_ORDER_REVIEW === "true" &&
  process.env.REEDITPRO_CONFIRM_HUMAN_MERGE_ORDER_APPROVAL_PACKET === "true" &&
  process.env.REEDITPRO_CONFIRM_FROZEN_MERGE_BATCH_POLICY === "true" &&
  process.env.REEDITPRO_CONFIRM_CROSS_CHAT_HANDOFF_UPDATE === "true" &&
  process.env.REEDITPRO_CONFIRM_VALIDATION_EXCEPTION_REVIEW === "true";

const draftPrDriftAcceptanceConfirmed =
  process.env.REEDITPRO_CONFIRM_DRAFT_PR_DRIFT_ACCEPTANCE === "true";

const pr337DriftReviewConfirmed =
  process.env.REEDITPRO_CONFIRM_GITHUB_MERGE_ORDER_REVIEW === "true" &&
  process.env.REEDITPRO_CONFIRM_FROZEN_MERGE_BATCH_POLICY === "true" &&
  process.env.REEDITPRO_CONFIRM_CROSS_CHAT_HANDOFF_UPDATE === "true" &&
  process.env.REEDITPRO_CONFIRM_VALIDATION_EXCEPTION_REVIEW === "true" &&
  process.env.REEDITPRO_CONFIRM_PR_337_SHA_DRIFT_REVIEW === "true";

const pr337NewHeadShaAcceptanceConfirmed =
  process.env.REEDITPRO_CONFIRM_PR_337_NEW_HEAD_SHA_ACCEPTANCE === "true";

const postMergeVerificationConfirmed =
  process.env.REEDITPRO_CONFIRM_GITHUB_POST_MERGE_SOURCE_OF_TRUTH_VERIFICATION === "true" &&
  process.env.REEDITPRO_CONFIRM_FROZEN_MERGE_BATCH_POLICY === "true" &&
  process.env.REEDITPRO_CONFIRM_CROSS_CHAT_HANDOFF_UPDATE === "true" &&
  process.env.REEDITPRO_CONFIRM_VALIDATION_EXCEPTION_REVIEW === "true";

const pr337FrozenHeadSha = "e762d297dc9ea236b8c2c85585ff2fd781ea3e77";
const pr337AcceptedHeadSha = "381afa79e1074f18fd28a2c555c22f4cd595cb38";
const pr337BaseBranch = "codex/rp-model-orchestration-plan-snapshot-contract";
const pr337HeadBranch = "codex/rp-model-orchestration-plan-snapshot-dry-run-validation";
const pr337PassedDecision = "plan_snapshot_dry_run_passed_ready_for_worker_runtime_repo_audit";
const postPr337ShaUpdateDecision = "approved_for_future_frozen_batch_merge_execution_after_pr_337_sha_update";

const forbiddenUnlockPatterns = [
  /production\s+(?:is\s+)?(?:unlocked|enabled|approved|allowed)\s*:?\s*true/i,
  /external beta\s+(?:is\s+)?(?:unlocked|enabled|approved|allowed)\s*:?\s*true/i,
  /paid production\s+(?:is\s+)?(?:unlocked|enabled|approved|allowed)\s*:?\s*true/i,
  /workers?\s+(?:are\s+)?(?:generally\s+)?(?:unlocked|enabled|approved|allowed)\s*:?\s*true/i,
  /tools?\s+(?:are\s+)?(?:generally\s+)?(?:unlocked|enabled|approved|allowed)\s*:?\s*true/i,
  /providers?\s+(?:are\s+)?(?:generally\s+)?(?:unlocked|enabled|approved|allowed)\s*:?\s*true/i,
  /signed URLs?\s+(?:are|become)\s+source(?:s)? of truth/i,
  /raw prompt execution\s+(?:is\s+)?(?:unlocked|enabled|approved|allowed)\s*:?\s*true/i,
];

const canonicalPrimaryNumbers = [
  205,
  222,
  247,
  248,
  252,
  259,
  262,
  265,
  269,
  271,
  274,
  276,
  280,
  283,
  292,
  298,
  299,
  302,
  306,
  309,
  311,
  314,
  318,
  320,
  322,
  327,
  337,
  341,
  342,
  346,
  347,
];

const frozenMergeBatchPrNumbers = [
  205,
  222,
  247,
  248,
  252,
  259,
  262,
  265,
  269,
  271,
  274,
  276,
  280,
  283,
  292,
  298,
  299,
  302,
  306,
  309,
  311,
  314,
  318,
  320,
  322,
  327,
  337,
];

const postMergeMilestoneEvidenceChecks = [
  {
    id: "supabase_trackb_clean_staging_backfill",
    label: "Supabase Track B clean staging backfill",
    prNumber: 298,
    ref: "codex/rp-foundation-supabase-trackb-clean-staging-backfill",
    path: "docs/activation-supabase-trackb-clean-staging-backfill-reports",
    requiredFiles: [
      "trackb_clean_staging_backfill_verification_report.json",
      "trackb_clean_staging_backfill_write_report.json",
      "trackb_clean_staging_backfill_readiness_report.json",
    ],
  },
  {
    id: "product_internal_beta_readiness",
    label: "Product internal beta readiness aggregation",
    prNumber: 299,
    ref: "codex/rp-product-internal-beta-readiness-aggregation",
    path: "docs/activation-product-internal-beta-readiness-reports",
    requiredFiles: ["trackb_clean_staging_sync_verification.json", "internal_beta_go_no_go_decision.json"],
  },
  {
    id: "internal_testing_scope_freeze_signoff",
    label: "Internal testing scope freeze/signoff",
    prNumber: 302,
    ref: "codex/rp-product-internal-testing-scope-freeze-signoff",
    path: "docs/activation-product-internal-testing-scope-freeze-reports",
    requiredFiles: ["internal_testing_scope_freeze_decision.json", "internal_testing_operator_acceptance_artifact.json"],
  },
  {
    id: "restricted_internal_testing_start_gate",
    label: "Restricted internal testing start gate",
    prNumber: 309,
    ref: "codex/rp-product-restricted-internal-testing-start-gate",
    path: "docs/activation-product-internal-testing-start-gate-reports",
    requiredFiles: ["restricted_internal_testing_start_gate_decision.json", "restricted_internal_testing_start_packet.json"],
  },
  {
    id: "restricted_internal_testing_session_0",
    label: "Restricted internal testing session 0",
    prNumber: 311,
    ref: "codex/rp-product-restricted-internal-testing-session-0",
    path: "docs/activation-product-internal-testing-session-0-reports",
    requiredFiles: ["session_0_decision.json", "session_0_trackb_readiness_review.json"],
  },
  {
    id: "model_orchestration_qwen_deepseek_audit",
    label: "Model orchestration Qwen/DeepSeek repo audit",
    prNumber: 314,
    ref: "codex/rp-model-orchestration-qwen-deepseek-repo-audit",
    path: "docs/activation-model-orchestration-qwen-deepseek-audit-reports",
    requiredFiles: ["provider_official_evidence_inventory.json", "raw_prompt_worker_execution_blocker_policy.json"],
  },
  {
    id: "model_orchestration_dry_run_approval",
    label: "Model orchestration dry-run approval",
    prNumber: 318,
    ref: "codex/rp-model-orchestration-qwen-deepseek-dry-run-approval",
    path: "docs/activation-model-orchestration-dry-run-approval-reports",
    requiredFiles: ["dry_run_approval_decision.json", "dry_run_synthetic_cases.json"],
  },
  {
    id: "model_orchestration_provider_dry_run",
    label: "Model orchestration provider dry-run",
    prNumber: 320,
    ref: "codex/rp-model-orchestration-qwen-deepseek-provider-dry-run",
    path: "docs/activation-model-orchestration-provider-dry-run-reports",
    requiredFiles: ["provider_dry_run_decision.json", "deepseek_provider_dry_run_report.json"],
  },
  {
    id: "model_orchestration_qwen_auth_repair",
    label: "Qwen DashScope auth repair",
    prNumber: 322,
    ref: "codex/rp-model-orchestration-qwen-dashscope-auth-repair",
    path: "docs/activation-model-orchestration-qwen-auth-repair-reports",
    requiredFiles: ["qwen_auth_repair_decision.json", "qwen_green_evidence_canonicalization_report.json"],
  },
  {
    id: "model_orchestration_plan_snapshot_contract",
    label: "Plan snapshot contract",
    prNumber: 327,
    ref: "codex/rp-model-orchestration-plan-snapshot-contract",
    path: "docs/activation-model-orchestration-plan-snapshot-contract-reports",
    requiredFiles: ["plan_snapshot_contract_decision.json", "provider_dry_run_evidence_reconciliation.json"],
  },
  {
    id: "model_orchestration_plan_snapshot_dry_run",
    label: "Plan snapshot dry-run validation",
    prNumber: 337,
    ref: "codex/rp-model-orchestration-plan-snapshot-dry-run-validation",
    path: "docs/activation-model-orchestration-plan-snapshot-dry-run-reports",
    requiredFiles: ["plan_snapshot_dry_run_decision.json", "plan_snapshot_dry_run_fail_closed_report.json"],
  },
];

const approvedFutureMergePrNumbers = frozenMergeBatchPrNumbers;

const previousCandidateFutureMergePrNumbers = frozenMergeBatchPrNumbers.concat(347);

const originalExpectedDraftPrNumbers = [
  1,
  308,
  312,
  313,
  316,
  317,
  319,
  321,
  323,
  326,
  329,
  332,
  333,
  335,
  336,
  338,
  339,
  344,
  345,
  348,
  351,
];

const driftAcceptedExpectedDraftPrNumbers = originalExpectedDraftPrNumbers
  .filter((number) => number !== 351)
  .concat(352)
  .sort((a, b) => a - b);

const expectedNonCleanMergeStates = {
  1: "DIRTY",
  94: "UNSTABLE",
};

const alreadyMergedEvidencePrNumbers = [341, 342, 346, 347, 351, 353];

const allowedApprovalDecisions = [
  "approved_for_future_parent_chain_merge_execution",
  "approved_for_future_frozen_batch_merge_execution",
  "approved_for_future_frozen_batch_merge_execution_after_pr_337_sha_update",
  "blocked_pending_human_merge_order_review",
  "blocked_pending_missing_pr_review",
  "blocked_pending_dirty_batch_pr_review",
  "blocked_pending_duplicate_pr_review",
  "blocked_pending_validation_exception_review",
  "blocked_pending_dirty_or_unstable_pr_review",
  "rejected_due_source_of_truth_risk",
];

function isApprovedFrozenBatchDecision(decision) {
  return decision === "approved_for_future_frozen_batch_merge_execution" || decision === postPr337ShaUpdateDecision;
}

const approvedFutureMergeStacks = [
  { id: "cross_chat_foundation", prNumbers: [205, 222] },
  { id: "supabase_trackb_clean_staging", prNumbers: [247, 248, 252, 259, 262, 265, 269, 271, 274, 276, 280, 283, 292, 298] },
  { id: "product_internal_testing", prNumbers: [299, 302, 306, 309, 311] },
  { id: "model_orchestration", prNumbers: [314, 318, 320, 322, 327, 337] },
];

const duplicateRiskGroups = [
  {
    id: "model_provider_dry_runs",
    label: "Model provider dry-runs and Qwen/DeepSeek repairs",
    match: (pr) =>
      /qwen|deepseek|provider dry|dashscope|provider token|model orchestration/i.test(
        `${pr.title} ${pr.headRefName}`,
      ),
    canonicalNumbers: [314, 318, 320, 322],
    reason:
      "Multiple provider dry-run, Qwen repair, and token-fix branches can supersede each other unless PR #314 -> #318 -> #320 -> #322 is reviewed as the canonical lane.",
  },
  {
    id: "plan_snapshot_contracts",
    label: "Plan snapshot contracts and dry-run validation",
    match: (pr) => /plan snapshot|PLAN-SNAPSHOT|snapshot contract/i.test(`${pr.title} ${pr.headRefName}`),
    canonicalNumbers: [327, 337],
    reason:
      "Plan-snapshot contract and validation PRs depend on committed provider evidence; parallel contract-fix PRs should not merge ahead of the canonical evidence chain.",
  },
  {
    id: "worker_runtime_audits_dry_runs",
    label: "Worker runtime audits and no-op dry-runs",
    match: (pr) => /worker|runtime|noop|no-op|WORKER/i.test(`${pr.title} ${pr.headRefName}`),
    canonicalNumbers: [341, 342, 346],
    reason:
      "Worker runtime repo audit, approval, and no-op dry-run form a parent stack; draft worker alternatives need review before any worker lane is merged.",
  },
  {
    id: "track_a_creative_graphics",
    label: "Track A creative graphics and visual runtime unlocks",
    match: (pr) =>
      /track[- ]?a|creative graphics|graphics|visual|vlm|qwen3[- ]?vl|mask|sam2|birefnet|real[- ]?video|render/i.test(
        `${pr.title} ${pr.headRefName}`,
      ),
    canonicalNumbers: [],
    reason:
      "Track A contains many visual/runtime readiness branches. Merge order must preserve milestone ancestry and keep runtime execution separately approved.",
  },
  {
    id: "supabase_sound_harness",
    label: "SUPABASE_SOUND harness and audio/SoundSync lanes",
    match: (pr) => /supabase_sound|sound|audio|sfx|music|soundsync|deepfilternet|lyria/i.test(`${pr.title} ${pr.headRefName}`),
    canonicalNumbers: [],
    reason:
      "Sound, music, and Supabase harness PRs cross database and runtime boundaries. Parallel harness branches need owner review before merge.",
  },
];

function ghJson(args) {
  const output = execFileSync("gh", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      DEVELOPER_DIR: process.env.DEVELOPER_DIR || "/Library/Developer/CommandLineTools",
    },
  });
  return JSON.parse(output);
}

function ghText(args) {
  return execFileSync("gh", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      DEVELOPER_DIR: process.env.DEVELOPER_DIR || "/Library/Developer/CommandLineTools",
    },
  }).trim();
}

function jsonWrite(relativePath, value) {
  const target = path.join(root, relativePath);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

function textWrite(relativePath, value) {
  const target = path.join(root, relativePath);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, `${value.trimEnd()}\n`);
}

function fetchPullRequests(state, limit, fields) {
  return ghJson(["pr", "list", "--repo", repo, "--state", state, "--limit", String(limit), "--json", fields.join(",")]);
}

function fetchPr(number) {
  return ghJson([
    "pr",
    "view",
    String(number),
    "--repo",
    repo,
    "--json",
    "number,title,state,isDraft,mergeStateStatus,baseRefName,headRefName,headRefOid,url,updatedAt",
  ]);
}

function fetchPrDetailed(number) {
  return ghJson([
    "pr",
    "view",
    String(number),
    "--repo",
    repo,
    "--json",
    "number,title,state,isDraft,mergeStateStatus,baseRefName,headRefName,headRefOid,url,updatedAt,commits,files",
  ]);
}

function fetchPrDiffNames(number) {
  return ghText(["pr", "diff", String(number), "--repo", repo, "--name-only"])
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function fetchBranchTextFile(ref, relativePath) {
  const encodedRef = encodeURIComponent(ref);
  const response = ghJson(["api", `repos/${repo}/contents/${relativePath}?ref=${encodedRef}`]);
  if (!response?.content) return null;
  return Buffer.from(response.content.replace(/\s/g, ""), "base64").toString("utf8");
}

function fetchBranchJsonFile(ref, relativePath) {
  const text = fetchBranchTextFile(ref, relativePath);
  return text ? JSON.parse(text) : null;
}

function fetchBranchDirectory(ref, relativePath) {
  const encodedRef = encodeURIComponent(ref);
  const response = ghJson(["api", `repos/${repo}/contents/${relativePath}?ref=${encodedRef}`]);
  if (!Array.isArray(response)) return [];
  return response.map((entry) => ({
    name: entry.name,
    path: entry.path,
    type: entry.type,
    size: entry.size ?? null,
    sha: entry.sha || null,
  }));
}

function branchHeadExists(headRefName) {
  try {
    const output = execFileSync("git", ["ls-remote", `https://github.com/${repo}.git`, `refs/heads/${headRefName}`], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        DEVELOPER_DIR: "/Library/Developer/CommandLineTools",
      },
    });
    return output.trim().length > 0;
  } catch {
    return false;
  }
}

function fetchMergedPr(number) {
  return ghJson([
    "pr",
    "view",
    String(number),
    "--repo",
    repo,
    "--json",
    "number,title,state,mergedAt,baseRefName,headRefName,headRefOid,url",
  ]);
}

function fetchPr350WithComments() {
  return ghJson([
    "pr",
    "view",
    "350",
    "--repo",
    repo,
    "--json",
    "number,title,state,isDraft,baseRefName,headRefName,mergeStateStatus,headRefOid,url,comments",
  ]);
}

function fetchDefaultBranch() {
  try {
    return ghJson(["repo", "view", repo, "--json", "defaultBranchRef"]).defaultBranchRef?.name || "unknown";
  } catch {
    try {
      return ghText(["api", `repos/${repo}`]).default_branch || "unknown";
    } catch {
      return "unknown";
    }
  }
}

function titlePrefix(title) {
  const match = title.match(/^\[([^\]]+)\]/);
  return match ? match[1].toLowerCase() : "";
}

function workstreamFor(pr) {
  const haystack = `${titlePrefix(pr.title)} ${pr.title} ${pr.headRefName}`.toLowerCase();
  if (haystack.includes("supabase_sound") || haystack.includes("soundsync") || haystack.includes("sound") || haystack.includes("audio")) {
    return "SUPABASE_SOUND_AUDIO";
  }
  if (haystack.includes("supabase")) return "SUPABASE_RLS_STORAGE_DATABASE";
  if (haystack.includes("worker")) return "WORKER_RUNTIME_JOBS";
  if (haystack.includes("model") || haystack.includes("qwen") || haystack.includes("deepseek") || haystack.includes("provider")) {
    return "MODEL_ORCHESTRATION_PROVIDER_GATEWAY";
  }
  if (haystack.includes("plan snapshot")) return "MODEL_ORCHESTRATION_PLAN_SNAPSHOT";
  if (haystack.includes("track-a") || haystack.includes("track a") || haystack.includes("visual") || haystack.includes("creative")) {
    return "TRACK_A_CREATIVE_GRAPHICS";
  }
  if (haystack.includes("trackb") || haystack.includes("track b") || haystack.includes("media")) return "TRACK_B_MEDIA_PROCESSING";
  if (haystack.includes("product") || haystack.includes("internal testing") || haystack.includes("beta")) return "PRODUCT_INTERNAL_TESTING";
  if (haystack.includes("foundation")) return "FOUNDATION_COORDINATION";
  if (haystack.includes("activation")) return "ACTIVATION";
  if (haystack.includes("coordination") || haystack.includes("cross-chat") || haystack.includes("handoff")) return "CROSS_CHAT_COORDINATION";
  if (haystack.includes("tool-route") || haystack.includes("tool route")) return "TOOL_ROUTE_DRY_RUN";
  return titlePrefix(pr.title).toUpperCase().replace(/[^A-Z0-9]+/g, "_") || "UNPREFIXED";
}

function riskGroupsFor(pr) {
  return duplicateRiskGroups.filter((group) => group.match(pr)).map((group) => group.id);
}

function classifyPr(pr, parent, riskGroups) {
  if (pr.isDraft) return "draft_hold";
  if (pr.mergeStateStatus && pr.mergeStateStatus !== "CLEAN") return "blocked_hold";
  if (riskGroups.length > 0 && !canonicalPrimaryNumbers.includes(pr.number)) return "duplicate_risk";
  if (canonicalPrimaryNumbers.includes(pr.number)) return "canonical";
  if (parent) return "parallel_candidate";
  return "unknown";
}

function summarizePr(pr, parent, children) {
  const risks = riskGroupsFor(pr);
  return {
    number: pr.number,
    title: pr.title,
    url: pr.url,
    state: pr.state,
    isDraft: pr.isDraft,
    mergeStateStatus: pr.mergeStateStatus,
    baseRefName: pr.baseRefName,
    headRefName: pr.headRefName,
    updatedAt: pr.updatedAt,
    workstream: workstreamFor(pr),
    parentPrNumber: parent?.number || null,
    childPrNumbers: children.map((child) => child.number).sort((a, b) => a - b),
    riskGroups: risks,
    classification: classifyPr(pr, parent, risks),
    mergeNowRecommendation: "do_not_merge_without_parent_chain_review",
  };
}

function countsBy(items, key) {
  return items.reduce((acc, item) => {
    const value = typeof key === "function" ? key(item) : item[key];
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function buildAudit(metadata) {
  const headToPr = new Map(metadata.openPrs.map((pr) => [pr.headRefName, pr]));
  const childrenByNumber = new Map(metadata.openPrs.map((pr) => [pr.number, []]));
  const parentByNumber = new Map();
  for (const pr of metadata.openPrs) {
    const parent = headToPr.get(pr.baseRefName);
    if (parent) {
      parentByNumber.set(pr.number, parent);
      childrenByNumber.get(parent.number)?.push(pr);
    }
  }

  const stackMap = metadata.openPrs
    .map((pr) => summarizePr(pr, parentByNumber.get(pr.number), childrenByNumber.get(pr.number) || []))
    .sort((a, b) => a.number - b.number);

  const duplicateRiskEntries = duplicateRiskGroups.map((group) => {
    const prs = stackMap
      .filter((pr) => pr.riskGroups.includes(group.id))
      .sort((a, b) => a.number - b.number)
      .map((pr) => ({
        number: pr.number,
        title: pr.title,
        url: pr.url,
        isDraft: pr.isDraft,
        mergeStateStatus: pr.mergeStateStatus,
        baseRefName: pr.baseRefName,
        headRefName: pr.headRefName,
        classification: pr.classification,
      }));
    const canonical = prs.filter((pr) => group.canonicalNumbers.includes(pr.number));
    return {
      id: group.id,
      label: group.label,
      reason: group.reason,
      canonicalPrNumbers: group.canonicalNumbers,
      observedPrNumbers: prs.map((pr) => pr.number),
      canonicalObservedPrNumbers: canonical.map((pr) => pr.number),
      riskStatus: prs.length > canonical.length ? "parallel_or_duplicate_review_required" : "no_parallel_observed",
      mergeHygieneAction:
        prs.length > canonical.length
          ? "review canonical lane first; hold duplicate or parallel candidates until owners confirm supersession"
          : "keep canonical parent chain review before merge",
      pullRequests: prs,
    };
  });

  const canonicalOrder = canonicalPrimaryNumbers
    .map((number, index) => {
      const pr = stackMap.find((candidate) => candidate.number === number);
      return {
        order: index + 1,
        number,
        title: pr?.title || "not present in current open set",
        url: pr?.url || null,
        state: pr?.state || "not_open_or_not_in_page",
        isDraft: pr?.isDraft ?? null,
        mergeStateStatus: pr?.mergeStateStatus || null,
        baseRefName: pr?.baseRefName || null,
        headRefName: pr?.headRefName || null,
        classification: pr?.classification || "not_open_or_not_in_page",
        recommendation:
          pr?.isDraft
            ? "draft_hold_do_not_merge"
            : pr
              ? "review_parent_chain_before_merge"
              : "verify_if_already_merged_or_superseded",
      };
    });

  const draftPrs = stackMap.filter((pr) => pr.isDraft);
  const nonCleanPrs = stackMap.filter((pr) => pr.mergeStateStatus && pr.mergeStateStatus !== "CLEAN");
  const pr346 = stackMap.find((pr) => pr.number === 346) || null;

  return {
    stackMap,
    duplicateRiskEntries,
    canonicalOrder,
    draftPrs,
    nonCleanPrs,
    pr346,
    parentChildEdges: stackMap
      .filter((pr) => pr.parentPrNumber)
      .map((pr) => ({
        parentPrNumber: pr.parentPrNumber,
        childPrNumber: pr.number,
        childBaseRefName: pr.baseRefName,
        parentHeadRefName: stackMap.find((candidate) => candidate.number === pr.parentPrNumber)?.headRefName || null,
      })),
  };
}

function buildMetadata() {
  const openLimit200 = fetchPullRequests("open", 200, openFields);
  const openPrListLimitHit = openLimit200.length === 200;
  const openPrs = openPrListLimitHit ? fetchPullRequests("open", 1000, openFields) : openLimit200;
  const openPrListHigherLimitUsed = openPrListLimitHit ? 1000 : 200;
  const closedSample = fetchPullRequests("closed", 100, closedFields);
  const pr205 = fetchPr(205);
  const pr222 = fetchPr(222);
  const pr346 = fetchPr(346);
  const defaultBranch = fetchDefaultBranch();
  return {
    repo,
    runId,
    generatedAt: new Date().toISOString(),
    commands: {
      openLimit200:
        "gh pr list --repo yuzastudio6-cyber/Reedkt --state open --limit 200 --json number,title,state,isDraft,mergeStateStatus,baseRefName,headRefName,updatedAt,url",
      openHigherLimit:
        "gh pr list --repo yuzastudio6-cyber/Reedkt --state open --limit 1000 --json number,title,state,isDraft,mergeStateStatus,baseRefName,headRefName,updatedAt,url",
      closedSample:
        "gh pr list --repo yuzastudio6-cyber/Reedkt --state closed --limit 100 --json number,title,state,mergedAt,baseRefName,headRefName,url",
    },
    defaultBranch,
    baseSelectionEvidence: {
      selectedBaseBranch: "codex/rp-activation-52h-cross-workstream-handoff-tracking",
      selectedBaseReason:
        "An explicit cross-workstream handoff tracking branch exists and contains docs/cross-chat coordination artifacts.",
      defaultBranchObserved: defaultBranch,
      pr205: pr205Summary(pr205),
      pr222: pr205Summary(pr222),
    },
    openLimit200Count: openLimit200.length,
    openPrListLimitHit,
    openPrListHigherLimitUsed,
    openPrCount: openPrs.length,
    openPrs,
    closedSampleCount: closedSample.length,
    closedSampleOnlyPr31: closedSample.length === 1 && closedSample[0]?.number === 31,
    closedSample,
    pr346: pr205Summary(pr346),
  };
}

function pr205Summary(pr) {
  return {
    number: pr.number,
    title: pr.title,
    state: pr.state,
    isDraft: pr.isDraft,
    mergeStateStatus: pr.mergeStateStatus,
    baseRefName: pr.baseRefName,
    headRefName: pr.headRefName,
    headRefOid: pr.headRefOid,
    url: pr.url,
    updatedAt: pr.updatedAt,
  };
}

function safeFetchPr(number) {
  try {
    return { ok: true, pr: fetchPr(number), error: null };
  } catch (error) {
    return {
      ok: false,
      pr: null,
      error: error instanceof Error ? error.message.split("\n")[0] : "unknown_error",
    };
  }
}

function draftDriftPrSummary(result) {
  if (!result.ok || !result.pr) {
    return {
      exists: false,
      error: result.error || "not_found_or_unavailable",
    };
  }
  return {
    exists: true,
    number: result.pr.number,
    title: result.pr.title,
    state: result.pr.state,
    isDraft: result.pr.isDraft,
    mergeStateStatus: result.pr.mergeStateStatus,
    baseRefName: result.pr.baseRefName,
    headRefName: result.pr.headRefName,
    headRefOid: result.pr.headRefOid,
    url: result.pr.url,
    updatedAt: result.pr.updatedAt,
  };
}

function buildDraftPrDriftReview(generatedAt) {
  const expectedResult = safeFetchPr(351);
  const actualResult = safeFetchPr(352);
  const expected = draftDriftPrSummary(expectedResult);
  const actual = draftDriftPrSummary(actualResult);
  const actualText = actual.exists ? `${actual.title} ${actual.headRefName}` : "";
  const actualLooksLikeMergeExecutionPacket =
    /merge[-_ ]?hygiene/i.test(actualText) &&
    /(?:parent[-_ ]?first|merge[-_ ]?execution|execution[-_ ]?packet)/i.test(actualText);
  const acceptanceCriteria = {
    expectedDraft351Exists: expected.exists,
    expectedDraft351Merged: expected.state === "MERGED",
    actualDraft352Exists: actual.exists,
    actualDraft352Open: actual.state === "OPEN",
    actualDraft352IsDraft: actual.isDraft === true,
    actualDraft352Clean: actual.mergeStateStatus === "CLEAN",
    actualDraft352LooksLikeMergeHygieneExecutionPacket: actualLooksLikeMergeExecutionPacket,
    driftAcceptanceConfirmationPresent: draftPrDriftAcceptanceConfirmed,
  };
  const blockers = [];
  if (!draftPrDriftAcceptanceConfirmed) {
    blockers.push("draft_pr_drift_acceptance_confirmation_missing");
  }
  if (!expected.exists) blockers.push("expected_draft_pr_351_unavailable");
  if (expected.exists && expected.state !== "MERGED") blockers.push("expected_draft_pr_351_not_merged");
  if (!actual.exists) blockers.push("actual_draft_pr_352_unavailable");
  if (actual.exists && actual.state !== "OPEN") blockers.push("actual_draft_pr_352_not_open");
  if (actual.exists && actual.isDraft !== true) blockers.push("actual_draft_pr_352_not_draft");
  if (actual.exists && actual.mergeStateStatus !== "CLEAN") blockers.push("actual_draft_pr_352_not_clean");
  if (actual.exists && !actualLooksLikeMergeExecutionPacket) {
    blockers.push("actual_draft_pr_352_not_merge_hygiene_execution_packet");
  }
  const accepted = blockers.length === 0;
  return {
    runId,
    generatedAt,
    decision: accepted ? "accepted_draft_drift_to_352" : "blocked_pending_draft_pr_review",
    expectedDraftPrNumber: 351,
    actualDraftPrNumber: 352,
    expectedDraftPr: expected,
    actualDraftPr: actual,
    acceptanceCriteria,
    blockers,
    driftInterpretation: {
      draftSetReplacementAccepted: accepted,
      supersedesExpectedDraftInApprovalPlan: accepted,
      supersessionType: "draft_set_replacement_not_same_workstream",
      note:
        "PR #351 is treated as merged evidence. PR #352 is treated as the current draft merge-hygiene execution packet replacing #351 in the live draft set only when every acceptance criterion passes.",
    },
    executionStatus: {
      pullRequestsMerged: false,
      pullRequestsClosed: false,
      pullRequestsRebased: false,
      pullRequestsRetargeted: false,
      runtimePathsExecuted: false,
      supabaseMutation: false,
      providerCalls: false,
      publicArtifactsCreated: false,
      signedUrlsIssued: false,
      productionUnlocked: false,
      externalBetaUnlocked: false,
      paidProductionUnlocked: false,
      rawPromptExecution: false,
    },
    supabaseClassification: {
      updateRequired: "no",
      environmentTouched: "none",
      sql: "none",
      migrationDeployed: "no",
    },
  };
}

function categoryForPr337Path(relativePath) {
  if (relativePath === "package-lock.json") return "package_lock";
  if (relativePath === "package.json") return "package_scripts";
  if (relativePath.startsWith("server/activation/")) return "server_activation";
  if (relativePath.startsWith("docs/activation-") && relativePath.endsWith(".json")) return "activation_report_json";
  if (relativePath.startsWith("docs/activation-")) return "activation_report_doc";
  if (relativePath.startsWith("docs/implementation-prompts/")) return "implementation_prompt";
  if (relativePath.startsWith("docs/")) return "docs";
  if (relativePath.startsWith("scripts/")) return "script";
  return "other";
}

const credentialLikePatterns = [
  /postgres(?:ql)?:\/\/[^\s"')]+/i,
  /(?:service[_-]?role|anon)[^\n]{0,40}(?:key|token)[^\n]{0,40}[:=]\s*["'][A-Za-z0-9._-]{20,}/i,
  /(?:api[_-]?key|access[_-]?token|password)[^\n]{0,40}[:=]\s*["'][A-Za-z0-9._-]{20,}/i,
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
  /sk-[A-Za-z0-9]{20,}/,
  /AKIA[0-9A-Z]{16}/,
];

function scanPr337ChangedFiles(ref, fileNames) {
  const contentProblems = [];
  const unavailableFiles = [];
  for (const relativePath of fileNames) {
    let text = "";
    try {
      text = fetchBranchTextFile(ref, relativePath) || "";
    } catch (error) {
      unavailableFiles.push({
        file: relativePath,
        error: error instanceof Error ? error.message.split("\n")[0] : "unknown_error",
      });
      continue;
    }
    for (const pattern of forbiddenUnlockPatterns) {
      if (pattern.test(text)) {
        contentProblems.push({ file: relativePath, problem: "forbidden_unlock_language", pattern: String(pattern) });
      }
    }
    for (const pattern of credentialLikePatterns) {
      if (pattern.test(text)) {
        contentProblems.push({ file: relativePath, problem: "credential_like_value", pattern: String(pattern) });
      }
    }
  }
  return { contentProblems, unavailableFiles };
}

function buildPr337HeadShaDriftReview(generatedAt) {
  const pr = fetchPrDetailed(337);
  const fileNames = (pr.files || []).map((file) => file.path).filter(Boolean);
  const categorySummary = countsBy(fileNames.map((file) => ({ category: categoryForPr337Path(file) })), "category");
  const planSnapshotDecisionPath =
    "docs/activation-model-orchestration-plan-snapshot-dry-run-reports/plan_snapshot_dry_run_decision.json";
  let planSnapshotDecision = null;
  let planSnapshotDecisionError = null;
  try {
    planSnapshotDecision = fetchBranchJsonFile(pr.headRefName, planSnapshotDecisionPath);
  } catch (error) {
    planSnapshotDecisionError = error instanceof Error ? error.message.split("\n")[0] : "unknown_error";
  }
  const scan = scanPr337ChangedFiles(pr.headRefName, fileNames);
  const allFilesMetadataOnly = fileNames.every((file) => {
    const category = categoryForPr337Path(file);
    return category === "activation_report_json" || category === "activation_report_doc" || category === "server_activation";
  });
  const packageLockChanged = fileNames.includes("package-lock.json");
  const blockers = [];
  if (pr.state !== "OPEN") blockers.push(`pr337_state_${pr.state}`);
  if (pr.isDraft !== false) blockers.push("pr337_is_draft");
  if (pr.mergeStateStatus !== "CLEAN") blockers.push(`pr337_merge_state_${pr.mergeStateStatus || "missing"}`);
  if (pr.baseRefName !== pr337BaseBranch) blockers.push(`pr337_base_branch_${pr.baseRefName || "missing"}`);
  if (pr.headRefName !== pr337HeadBranch) blockers.push(`pr337_head_branch_${pr.headRefName || "missing"}`);
  if (pr.headRefOid !== pr337AcceptedHeadSha) blockers.push("pr337_live_head_sha_not_expected_replacement");
  if (!/^\[model\] Plan snapshot dry-run validation$/.test(pr.title)) blockers.push("pr337_title_or_milestone_changed");
  if (planSnapshotDecision?.decision !== pr337PassedDecision) blockers.push("pr337_plan_snapshot_dry_run_decision_not_passed");
  if (planSnapshotDecisionError) blockers.push("pr337_plan_snapshot_dry_run_decision_unavailable");
  if (!allFilesMetadataOnly) blockers.push("pr337_changed_files_not_metadata_only");
  if (packageLockChanged) blockers.push("pr337_package_lock_changed");
  if (scan.unavailableFiles.length > 0) blockers.push("pr337_changed_file_content_unavailable");
  if (scan.contentProblems.length > 0) blockers.push("pr337_changed_file_safety_scan_failed");
  if (!pr337DriftReviewConfirmed) blockers.push("pr337_drift_review_confirmation_missing");
  if (!pr337NewHeadShaAcceptanceConfirmed) blockers.push("pr337_new_head_sha_acceptance_confirmation_missing");
  const accepted = blockers.length === 0;
  return {
    runId,
    generatedAt,
    decision: accepted ? "accepted_pr_337_new_head_sha" : "blocked_pending_pr_337_human_review",
    frozenHeadSha: pr337FrozenHeadSha,
    liveHeadSha: pr.headRefOid,
    acceptedReplacementHeadSha: pr337AcceptedHeadSha,
    sourcePr: {
      number: pr.number,
      title: pr.title,
      url: pr.url,
      state: pr.state,
      isDraft: pr.isDraft,
      mergeStateStatus: pr.mergeStateStatus,
      baseRefName: pr.baseRefName,
      headRefName: pr.headRefName,
      headRefOid: pr.headRefOid,
      commitCount: pr.commits?.length || 0,
      changedFilesCount: fileNames.length,
      updatedAt: pr.updatedAt,
    },
    changedFileCategorySummary: categorySummary,
    packageLockChanged,
    changedFilesMetadataOnly: allFilesMetadataOnly,
    changedFileSafetyScan: {
      scannedFileCount: fileNames.length - scan.unavailableFiles.length,
      unavailableFiles: scan.unavailableFiles,
      contentProblems: scan.contentProblems,
      forbiddenRuntimeOrUnlockLanguageFound: scan.contentProblems.some((problem) => problem.problem === "forbidden_unlock_language"),
      credentialLikeValuesFound: scan.contentProblems.some((problem) => problem.problem === "credential_like_value"),
    },
    planSnapshotDryRunDecision: {
      path: planSnapshotDecisionPath,
      decision: planSnapshotDecision?.decision || null,
      status: planSnapshotDecision?.status || null,
      expectedDecision: pr337PassedDecision,
      error: planSnapshotDecisionError,
    },
    acceptanceCriteria: {
      prOpen: pr.state === "OPEN",
      prNonDraft: pr.isDraft === false,
      prClean: pr.mergeStateStatus === "CLEAN",
      baseBranchMatches: pr.baseRefName === pr337BaseBranch,
      headBranchMatches: pr.headRefName === pr337HeadBranch,
      liveHeadShaMatchesAcceptedReplacement: pr.headRefOid === pr337AcceptedHeadSha,
      titleMatchesMilestone: /^\[model\] Plan snapshot dry-run validation$/.test(pr.title),
      planSnapshotDecisionPassed: planSnapshotDecision?.decision === pr337PassedDecision,
      changedFilesMetadataOnly: allFilesMetadataOnly,
      packageLockUnchanged: !packageLockChanged,
      safetyScanPassed: scan.unavailableFiles.length === 0 && scan.contentProblems.length === 0,
      driftReviewConfirmationPresent: pr337DriftReviewConfirmed,
      newHeadShaAcceptanceConfirmationPresent: pr337NewHeadShaAcceptanceConfirmed,
    },
    blockers,
    frozenBatchUpdate: {
      updateAllowed: accepted,
      updatedHeadSha: accepted ? pr.headRefOid : null,
      resultingDecision: accepted ? postPr337ShaUpdateDecision : "blocked_pending_pr_337_human_review",
    },
    executionStatus: {
      pullRequestsMerged: false,
      pullRequestsClosed: false,
      pullRequestsRebased: false,
      pullRequestsRetargeted: false,
      branchesDeleted: false,
      runtimePathsExecuted: false,
      workerToolRouteExecution: false,
      supabaseMutation: false,
      providerCalls: false,
      publicArtifactsCreated: false,
      signedUrlsIssued: false,
      productionUnlocked: false,
      externalBetaUnlocked: false,
      paidProductionUnlocked: false,
      rawPromptExecution: false,
      secretsPrintedOrCommitted: false,
    },
    supabaseClassification: {
      updateRequired: "no",
      environmentTouched: "none",
      sql: "none",
      migrationDeployed: "no",
    },
  };
}

function renderPr337HeadShaDriftReviewMd(review) {
  return `# PR #337 Head SHA Drift Review

Decision: \`${review.decision}\`

This review updates PR #350 merge-hygiene metadata only. It does not merge, close, rebase, retarget, delete branches, execute runtime paths, mutate Supabase, call providers, create public artifacts, issue signed URLs, unlock production/beta, or execute raw prompts.

## SHA Review

- Frozen SHA: \`${review.frozenHeadSha}\`
- Live SHA: \`${review.liveHeadSha}\`
- Accepted replacement SHA: \`${review.acceptedReplacementHeadSha}\`
- Frozen-batch update allowed: \`${review.frozenBatchUpdate.updateAllowed}\`
- Resulting merge-readiness decision: \`${review.frozenBatchUpdate.resultingDecision}\`

## PR State

- PR: #${review.sourcePr.number} ${review.sourcePr.title}
- State: \`${review.sourcePr.state}\`
- Draft: \`${review.sourcePr.isDraft}\`
- Merge state: \`${review.sourcePr.mergeStateStatus}\`
- Base branch: \`${review.sourcePr.baseRefName}\`
- Head branch: \`${review.sourcePr.headRefName}\`
- Commits: ${review.sourcePr.commitCount}
- Changed files: ${review.sourcePr.changedFilesCount}

## Scope Review

${markdownTable(Object.entries(review.changedFileCategorySummary).map(([category, count]) => ({ category, count })), [
  { label: "Category", value: (row) => `\`${row.category}\`` },
  { label: "Count", value: (row) => row.count },
])}

- Package lock changed: \`${review.packageLockChanged}\`
- Changed files metadata-only: \`${review.changedFilesMetadataOnly}\`
- Plan snapshot dry-run decision: \`${review.planSnapshotDryRunDecision.decision || "missing"}\`
- Safety scan content problems: ${review.changedFileSafetyScan.contentProblems.length}
- Safety scan unavailable files: ${review.changedFileSafetyScan.unavailableFiles.length}

## Blockers

${review.blockers.length ? review.blockers.map((blocker) => `- \`${blocker}\``).join("\n") : "_None._"}

## Safety

- PR merges: \`${review.executionStatus.pullRequestsMerged}\`
- PR closes/rebases/retargets: \`${review.executionStatus.pullRequestsClosed || review.executionStatus.pullRequestsRebased || review.executionStatus.pullRequestsRetargeted}\`
- Branch deletion: \`${review.executionStatus.branchesDeleted}\`
- Runtime/tools/workers/routes: \`${review.executionStatus.workerToolRouteExecution}\`
- Providers: \`${review.executionStatus.providerCalls}\`
- Supabase writes: \`${review.executionStatus.supabaseMutation}\`
- Production/external beta/paid production: \`${review.executionStatus.productionUnlocked || review.executionStatus.externalBetaUnlocked || review.executionStatus.paidProductionUnlocked}\`
- Public artifacts/signed URLs/raw prompts: \`${review.executionStatus.publicArtifactsCreated || review.executionStatus.signedUrlsIssued || review.executionStatus.rawPromptExecution}\`
- Secrets printed/committed: \`${review.executionStatus.secretsPrintedOrCommitted}\`
`;
}

function markdownTable(rows, columns) {
  if (rows.length === 0) return "_None._\n";
  const header = `| ${columns.map((column) => column.label).join(" | ")} |`;
  const divider = `| ${columns.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${columns.map((column) => String(column.value(row)).replace(/\|/g, "\\|")).join(" | ")} |`);
  return `${[header, divider, ...body].join("\n")}\n`;
}

function renderOpenPrMapMd(metadata, audit) {
  const workstreamRows = Object.entries(countsBy(audit.stackMap, "workstream"))
    .sort((a, b) => b[1] - a[1])
    .map(([workstream, count]) => ({ workstream, count }));
  const classificationRows = Object.entries(countsBy(audit.stackMap, "classification"))
    .sort((a, b) => b[1] - a[1])
    .map(([classification, count]) => ({ classification, count }));
  const pr346Observed = audit.pr346 || {
    number: metadata.pr346.number,
    title: metadata.pr346.title,
    url: metadata.pr346.url,
    state: metadata.pr346.state,
    isDraft: metadata.pr346.isDraft,
    mergeStateStatus: metadata.pr346.mergeStateStatus,
    baseRefName: metadata.pr346.baseRefName,
    headRefName: metadata.pr346.headRefName,
  };
  const pr346Narrative =
    metadata.pr346.state === "OPEN"
      ? "PR #346 is recorded from live GitHub metadata as open. It is not merge-ready while draft status or parent-chain review is unresolved."
      : `PR #346 is no longer open in live GitHub metadata. Current state is \`${metadata.pr346.state}\`; this audit records the prompt's open/draft expectation as stale and does not infer any follow-up merge readiness.`;
  return `# Open PR Stack Map

Generated: \`${metadata.generatedAt}\`

Repository: \`${metadata.repo}\`

Selected audit base: \`codex/rp-activation-52h-cross-workstream-handoff-tracking\`

Default branch observed: \`${metadata.defaultBranch}\`

Base-selection evidence:

- PR #205: ${metadata.baseSelectionEvidence.pr205.title}; head \`${metadata.baseSelectionEvidence.pr205.headRefName}\`; base \`${metadata.baseSelectionEvidence.pr205.baseRefName}\`; state \`${metadata.baseSelectionEvidence.pr205.state}\`; merge state \`${metadata.baseSelectionEvidence.pr205.mergeStateStatus}\`.
- PR #222: ${metadata.baseSelectionEvidence.pr222.title}; head \`${metadata.baseSelectionEvidence.pr222.headRefName}\`; base \`${metadata.baseSelectionEvidence.pr222.baseRefName}\`; state \`${metadata.baseSelectionEvidence.pr222.state}\`; merge state \`${metadata.baseSelectionEvidence.pr222.mergeStateStatus}\`.

Open PR metadata:

- Initial open PR command returned ${metadata.openLimit200Count} PRs.
- \`openPrListLimitHit\`: \`${metadata.openPrListLimitHit}\`
- Higher limit used: \`${metadata.openPrListHigherLimitUsed}\`
- Audited open PR count: ${metadata.openPrCount}
- Draft PR count: ${audit.draftPrs.length}
- Non-clean merge-state PR count: ${audit.nonCleanPrs.length}
- Closed sample count: ${metadata.closedSampleCount}
- Closed sample currently only PR #31: \`${metadata.closedSampleOnlyPr31}\`

## Workstreams

${markdownTable(workstreamRows, [
  { label: "Workstream", value: (row) => row.workstream },
  { label: "Open PRs", value: (row) => row.count },
])}

## Classifications

${markdownTable(classificationRows, [
  { label: "Classification", value: (row) => row.classification },
  { label: "Open PRs", value: (row) => row.count },
])}

## Parent/Child Edges

${markdownTable(audit.parentChildEdges.slice(0, 80), [
  { label: "Parent PR", value: (row) => `#${row.parentPrNumber}` },
  { label: "Child PR", value: (row) => `#${row.childPrNumber}` },
  { label: "Child base", value: (row) => `\`${row.childBaseRefName}\`` },
])}

## Draft Holds

${markdownTable(audit.draftPrs, [
  { label: "PR", value: (row) => `#${row.number}` },
  { label: "Title", value: (row) => row.title },
  { label: "Base", value: (row) => `\`${row.baseRefName}\`` },
  { label: "Head", value: (row) => `\`${row.headRefName}\`` },
])}

## PR #346

${pr346Narrative}

${markdownTable([pr346Observed], [
  { label: "PR", value: (row) => `#${row.number}` },
  { label: "State", value: (row) => row.state },
  { label: "Draft", value: (row) => row.isDraft },
  { label: "Merge state", value: (row) => row.mergeStateStatus },
  { label: "Base", value: (row) => `\`${row.baseRefName}\`` },
  { label: "Head", value: (row) => `\`${row.headRefName}\`` },
])}

## Safety Classification

This audit is metadata-only. It did not merge, close, rebase, or retarget any PR. It did not execute runtime paths, mutate Supabase, call providers, create public artifacts, issue signed URLs, or unlock production, external beta, or paid production.
`;
}

function renderCanonicalMd(audit) {
  return `# Canonical Merge Order

This is a recommended human review order, not an automatic merge plan. Parent PRs must be reviewed before children. Draft PRs are never merge-now.

${markdownTable(audit.canonicalOrder, [
  { label: "Order", value: (row) => row.order },
  { label: "PR", value: (row) => `#${row.number}` },
  { label: "Title", value: (row) => row.title },
  { label: "Draft", value: (row) => row.isDraft },
  { label: "Merge state", value: (row) => row.mergeStateStatus || "n/a" },
  { label: "Recommendation", value: (row) => row.recommendation },
])}

## Merge Hygiene Rules

- Merge parent PRs before child PRs.
- Treat clean merge state as necessary metadata, not permission to merge.
- Hold draft PRs until they are ready and parent chain review is complete.
- Resolve duplicate or parallel lanes before merging either lane.
- If PR #346 is already merged, rerun stack review before merging any child or follow-up lane that assumed it was still draft.
- Keep production, external beta, paid production, runtime execution, provider calls, Supabase writes, public artifacts, signed URLs, and raw prompt execution blocked unless a later specific PR authorizes them.
`;
}

function renderDuplicateMd(audit, draftDriftReview = null) {
  const driftSection = draftDriftReview
    ? `## Draft Drift

- Decision: \`${draftDriftReview.decision}\`
- Expected draft: #${draftDriftReview.expectedDraftPrNumber}
- Actual draft: #${draftDriftReview.actualDraftPrNumber}
- Draft-set replacement accepted: \`${draftDriftReview.driftInterpretation.draftSetReplacementAccepted}\`
- PR #351 state: \`${draftDriftReview.expectedDraftPr.state || "unavailable"}\`
- PR #352 state: \`${draftDriftReview.actualDraftPr.state || "unavailable"}\`
- PR #352 draft: \`${draftDriftReview.actualDraftPr.isDraft}\`
- PR #352 merge state: \`${draftDriftReview.actualDraftPr.mergeStateStatus || "unavailable"}\`

`
    : "";
  return `# Duplicate PR Risk Register

This register highlights parallel or duplicate lanes that require owner review before merge. It does not close, merge, rebase, or supersede any PR.

${driftSection}
${audit.duplicateRiskEntries
  .map(
    (entry) => `## ${entry.label}

- Risk status: \`${entry.riskStatus}\`
- Canonical PRs: ${entry.canonicalPrNumbers.length ? entry.canonicalPrNumbers.map((number) => `#${number}`).join(", ") : "owner review required"}
- Observed PRs: ${entry.observedPrNumbers.length ? entry.observedPrNumbers.map((number) => `#${number}`).join(", ") : "none in current open set"}
- Recommended action: ${entry.mergeHygieneAction}
- Reason: ${entry.reason}
`,
  )
  .join("\n")}
`;
}

function renderDraftDriftReviewMd(review) {
  const expected = review.expectedDraftPr;
  const actual = review.actualDraftPr;
  return `# Draft PR Drift Review

Decision: \`${review.decision}\`

This review resolves the merge-order approval packet's expected draft PR drift without merging, closing, rebasing, retargeting, or executing any runtime path.

## Drift

- Expected draft PR: #${review.expectedDraftPrNumber}
- Actual draft PR: #${review.actualDraftPrNumber}
- PR #351 exists: \`${expected.exists}\`
- PR #351 state: \`${expected.state || "unavailable"}\`
- PR #352 exists: \`${actual.exists}\`
- PR #352 title: ${actual.title || "unavailable"}
- PR #352 base: \`${actual.baseRefName || "unavailable"}\`
- PR #352 head: \`${actual.headRefName || "unavailable"}\`
- PR #352 draft: \`${actual.isDraft}\`
- PR #352 merge state: \`${actual.mergeStateStatus || "unavailable"}\`
- Draft-set replacement accepted: \`${review.driftInterpretation.draftSetReplacementAccepted}\`
- Supersession type: \`${review.driftInterpretation.supersessionType}\`

## Acceptance Criteria

${Object.entries(review.acceptanceCriteria)
  .map(([key, value]) => `- ${key}: \`${value}\``)
  .join("\n")}

## Blockers

${review.blockers.length ? review.blockers.map((blocker) => `- \`${blocker}\``).join("\n") : "_None._"}

## Safety

No PR merge, close, rebase, retarget, runtime execution, provider call, Supabase write, public artifact, signed URL delivery, production, external beta, paid production, or raw prompt execution is approved by this review.
`;
}

function renderLiveDriftTolerancePolicyMd(policy) {
  return `# Live PR Drift Tolerance Policy

Decision: \`${policy.decision}\`

Future merge execution must use \`${policy.frozenBatchSourceOfTruth.file}\` as source of truth. Whole-repo PR drift is advisory unless it affects the frozen batch.

| Drift | Classification |
| --- | --- |
| Total open PR count drift | \`${policy.policy.totalOpenPrCountDrift}\` |
| New unrelated draft PR | \`${policy.policy.newUnrelatedDraftPr}\` |
| Unrelated dirty PR | \`${policy.policy.unrelatedDirtyPr}\` |
| Dirty PR inside frozen batch | \`${policy.policy.dirtyPrInsideFrozenBatch}\` |
| Unstable PR inside frozen batch | \`${policy.policy.unstablePrInsideFrozenBatch}\` |
| Missing PR inside frozen batch | \`${policy.policy.missingPrInsideFrozenBatch}\` |
| Draft PR inside frozen batch | \`${policy.policy.draftPrInsideFrozenBatch}\` |
| Head SHA changed inside frozen batch | \`${policy.policy.headShaChangedInsideFrozenBatch}\` |
| Duplicate/parallel PR inside frozen batch | \`${policy.policy.duplicateOrParallelPrInsideFrozenBatch}\` |

This policy does not merge, close, rebase, retarget, or unlock runtime, Supabase, provider, production, public artifact, signed URL, external beta, paid production, or raw prompt execution.
`;
}

function renderCurrentLiveDriftReviewMd(review) {
  return `# Current Live Drift Review

Decision: \`${review.decision}\`

- Expected open PR count: ${review.expectedOpenCount}
- Actual open PR count: ${review.actualOpenCount}
- Open PR count classification: \`${review.openCountDrift.classification}\`
- New drafts: ${review.newDrafts.length ? review.newDrafts.map((number) => `#${number}`).join(", ") : "none"}
- Missing candidate PRs: ${review.missingCandidatePrs.length ? review.missingCandidatePrs.map((number) => `#${number}`).join(", ") : "none"}
- Warnings: ${review.summary.warnings.length ? review.summary.warnings.map((warning) => `\`${warning}\``).join(", ") : "none"}
- Blockers: ${review.summary.blockers.length ? review.summary.blockers.map((blocker) => `\`${blocker}\``).join(", ") : "none"}
- Resolved: ${review.summary.resolved.length ? review.summary.resolved.map((item) => `\`${item}\``).join(", ") : "none"}

## Watched PRs

${markdownTable(review.watchedPrs, [
  { label: "PR", value: (row) => `#${row.number}` },
  { label: "Title", value: (row) => row.title },
  { label: "State", value: (row) => row.state },
  { label: "Draft", value: (row) => row.isDraft },
  { label: "Merge state", value: (row) => row.mergeStateStatus || "n/a" },
  { label: "Frozen batch", value: (row) => row.frozenBatchMember },
  { label: "Classification", value: (row) => row.driftClassification },
])}

## Dirty Or Unstable PRs

${markdownTable(review.dirtyOrUnstablePrs, [
  { label: "PR", value: (row) => `#${row.number}` },
  { label: "Merge state", value: (row) => row.mergeStateStatus },
  { label: "Draft", value: (row) => row.isDraft },
  { label: "Classification", value: (row) => row.driftClassification },
  { label: "Reason", value: (row) => row.reason },
])}
`;
}

function renderFrozenMergeBatchMd(batch) {
  const approved = batch.entries.filter((entry) => entry.approvedForFutureMerge);
  const blocked = batch.entries.filter((entry) => !entry.approvedForFutureMerge);
  return `# Frozen Merge Batch

Decision: \`${batch.decision}\`

- Batch ID: \`${batch.batchId}\`
- Approved for future merge execution: \`${batch.approvedForFutureMergeExecution}\`
- Batch size: ${batch.batchSize}
- Source PR: #${batch.sourcePr}
- Already merged evidence excluded: ${batch.excludedPrs.alreadyMergedEvidencePrNumbers.map((number) => `#${number}`).join(", ")}

## Approved Batch PRs

${markdownTable(approved, [
  { label: "Order", value: (row) => row.order },
  { label: "PR", value: (row) => `#${row.number}` },
  { label: "Title", value: (row) => row.title },
  { label: "Base", value: (row) => `\`${row.baseRefName}\`` },
  { label: "Head", value: (row) => `\`${row.headRefName}\`` },
  { label: "SHA", value: (row) => `\`${row.headRefOid}\`` },
])}

## Blocked Batch PRs

${markdownTable(blocked, [
  { label: "PR", value: (row) => `#${row.number}` },
  { label: "State", value: (row) => row.state },
  { label: "Draft", value: (row) => row.isDraft },
  { label: "Merge state", value: (row) => row.mergeStateStatus || "n/a" },
  { label: "Blocker", value: (row) => row.blocker || "none" },
])}

Only PRs with \`approvedForFutureMerge=true\` in \`frozen-merge-batch.json\` may be considered by a later merge execution phase.
`;
}

function renderFrozenBatchMergeOrderMd(order) {
  return `# Frozen Batch Merge Order

Decision: \`${order.decision}\`

Merge execution is a separate future phase. It may merge only approved PRs listed in \`docs/github-merge-hygiene/frozen-merge-batch.json\`.

${markdownTable(order.sequence, [
  { label: "Order", value: (row) => row.order },
  { label: "PR", value: (row) => `#${row.number}` },
  { label: "Base", value: (row) => `\`${row.baseRefName}\`` },
  { label: "Head", value: (row) => `\`${row.headRefName}\`` },
  { label: "SHA", value: (row) => `\`${row.headRefOid}\`` },
  { label: "Approved", value: (row) => row.approvedForFutureMerge },
])}

Before each merge, run the entry's verification command and stop if the PR state, draft status, merge state, head SHA, or base branch differs from the frozen batch entry.

No runtime execution, Supabase mutation, provider call, public artifact, signed URL delivery, production, external beta, paid production, or raw prompt execution is allowed.
`;
}

function renderPostMajorRule() {
  return `# Post-Major-Milestone Merge Rule

After a major milestone branch or PR is opened, future owners must follow this merge-hygiene rule before continuing work:

1. Inspect the open PR stack and confirm the milestone branch is still the canonical parent.
2. Confirm whether the parent PR is draft or ready.
3. Confirm merge state, but do not treat \`CLEAN\` as enough to merge.
4. Check whether another PR has the same workstream, title pattern, or branch ancestry.
5. Hold duplicate or parallel candidates until the owner records which branch supersedes the others.
6. Merge parent-before-child only after human review.
7. Do not merge draft PRs.
8. Do not unlock production, external beta, paid production, providers, tools, workers, routes, Supabase writes, public artifacts, signed URLs, or raw prompt execution from a merge-hygiene PR.
9. Record PR numbers, bases, heads, and risk decisions in \`docs/github-merge-hygiene/\`.
10. After a parent merge, rerun the stack audit before merging the next child.

This rule is coordination metadata only.
`;
}

function renderReadFirst() {
  return `# Read First For All Owners

This branch adds the GitHub merge-hygiene stack audit for cross-chat coordination.

Required owner actions before continuing a workstream:

1. Read \`docs/github-merge-hygiene/open-pr-stack-map.md\`.
2. Read \`docs/github-merge-hygiene/canonical-merge-order.md\`.
3. Read \`docs/github-merge-hygiene/duplicate-pr-risk-register.md\`.
4. Confirm your PR's base branch is still the canonical parent.
5. Hold draft, duplicate, or parallel PRs until the parent chain is reviewed.

This handoff does not authorize runtime execution, Supabase writes, provider calls, public artifacts, signed URLs, production, external beta, paid production, or raw prompt execution.
`;
}

function renderCurrentHandoff(metadata, audit) {
  const pr346StatusLine =
    metadata.pr346.state === "OPEN"
      ? `PR #346 is open, draft=\`${metadata.pr346.isDraft}\`, merge state \`${metadata.pr346.mergeStateStatus}\`, and not merged.`
      : `PR #346 is no longer open. Live GitHub metadata reports state \`${metadata.pr346.state}\`; the prior open/draft prompt fact is stale.`;
  return `# Current Handoff

Generated: \`${metadata.generatedAt}\`

Current merge-hygiene status:

- Open PRs audited: ${metadata.openPrCount}
- Draft PRs: ${audit.draftPrs.length}
- All observed merge states clean: \`${audit.nonCleanPrs.length === 0}\`
- Open PR list limit hit on first pass: \`${metadata.openPrListLimitHit}\`
- Closed sample currently only PR #31: \`${metadata.closedSampleOnlyPr31}\`
- Selected coordination base: \`codex/rp-activation-52h-cross-workstream-handoff-tracking\`

Current handoff decision:

- \`open_pr_stack_audit_completed_ready_for_human_merge_order_review\`
- Human merge-order review is required before parent PR merges.
- Draft PRs remain held.
- Duplicate or parallel workstream lanes require owner selection before merge.

Specific callout:

- ${pr346StatusLine}
`;
}

function renderOwnerMatrix() {
  return `# Owner Matrix

| Workstream | Current owner action | Merge hygiene note |
| --- | --- | --- |
| Cross-chat coordination | Review canonical merge order and duplicate risk register | This PR owns audit metadata only |
| Foundation/Supabase | Confirm clean-staging and Track B parent chain before merge | No Supabase writes or migrations are authorized here |
| Product internal testing | Merge parent PRs before session and start-gate children | Internal testing remains restricted metadata/readiness scope |
| Model orchestration | Confirm Qwen/DeepSeek evidence chain before plan snapshot children | Provider calls remain outside this audit |
| Worker runtime | Hold draft worker no-op PRs until parent chain and draft status are resolved | No worker, Docker, Cloud Run, tool, or route execution is authorized |
| Track A creative graphics | Review parallel creative graphics lanes before merge | Runtime and media execution remain blocked |
| SUPABASE_SOUND audio harness | Review audio/SoundSync harness ancestry and duplicates | Audio runtime and Supabase mutation remain blocked |
`;
}

function renderBlockedScopes() {
  return `# Blocked Scopes

The merge-hygiene audit keeps these scopes blocked:

- production release
- external beta
- paid production
- general worker execution
- tool execution
- route execution
- provider calls
- media processing
- Docker, Cloud Run, or Cloud Build mutation
- Supabase writes, SQL, migrations, reset, or repair
- public artifacts
- signed URLs as source-of-truth
- raw prompt execution
- broad Track A runtime execution
- beta or production unlocks

Blocked means no owner should treat this audit as an execution approval.
`;
}

function renderNextUnlockLanes() {
  return `# Next Unlock Lanes

Recommended next phase:

1. Human review of \`docs/github-merge-hygiene/canonical-merge-order.md\`.
2. Resolve duplicate or parallel lanes in \`docs/github-merge-hygiene/duplicate-pr-risk-register.md\`.
3. Merge parent PRs before children only after owner confirmation.
4. Rerun \`npm run github:merge-hygiene:diagnostics\` after major parent merges.

Current holds:

- PR #346 status changed after the prompt snapshot; any downstream lane must re-audit parent ancestry before merge.
- Worker runtime no-op dry-run children must wait for the worker approval parent chain.
- Model provider/plan-snapshot children must wait for committed provider evidence parent PRs.
- Track A creative graphics and SUPABASE_SOUND harness lanes need owner review before merge.
`;
}

function sortedNumbers(values) {
  return [...values].map(Number).sort((a, b) => a - b);
}

function sameNumberSet(actual, expected) {
  const sortedActual = sortedNumbers(actual);
  const sortedExpected = sortedNumbers(expected);
  return sortedActual.length === sortedExpected.length && sortedActual.every((value, index) => value === sortedExpected[index]);
}

function buildValidationExceptionPolicy(generatedAt) {
  return {
    generatedAt,
    decision: "validation_exception_accepted_for_future_parent_chain_merge_execution",
    typecheckServerExpectedFailure: true,
    buildServerExpectedFailure: true,
    acceptedForFutureMergeExecution: true,
    preExistingOnPr350Base: true,
    failureCategories: [
      "sharp",
      "jsdom",
      "@mozilla/readability",
      "@turf/turf",
      "DOM unknown typings",
    ],
    failureSignaturePolicy: {
      allowedOnlyWhenMatchingExactCategories: true,
      newFailureCategoryBlocksApproval: true,
      serverBuildFailureMustBeSameAsTypecheckServer: true,
    },
    mergeExecutionImpact: {
      blocksFutureParentChainMergeExecution: false,
      requiresSeparateRepairPr: true,
      repairOwnerWorkstream: "ACTIVATION_RUNTIME_FIXTURE_TOOLCHAIN",
      reevaluateWhen: [
        "before any production, external beta, or paid production unlock",
        "before treating typecheck:server as a required merge gate",
        "after package dependency changes",
        "after server activation runner changes",
      ],
    },
  };
}

function buildLiveDriftTolerancePolicy(generatedAt) {
  return {
    generatedAt,
    decision: "live_drift_tolerance_policy_active_for_frozen_merge_batch",
    policy: {
      totalOpenPrCountDrift: "warning",
      newUnrelatedDraftPr: "warning",
      unrelatedDirtyPr: "warning",
      dirtyPrInsideFrozenBatch: "blocker",
      unstablePrInsideFrozenBatch: "blocker",
      missingPrInsideFrozenBatch: "blocker_unless_intentionally_merged_closed_or_superseded",
      draftPrInsideFrozenBatch: "blocker_unless_explicitly_marked_draft_only_no_merge",
      headShaChangedInsideFrozenBatch: "blocker",
      duplicateOrParallelPrInsideFrozenBatch: "blocker_unless_marked_canonical",
    },
    frozenBatchSourceOfTruth: {
      file: "docs/github-merge-hygiene/frozen-merge-batch.json",
      futureMergeExecutionMayOnlyUseFrozenBatch: true,
      wholeRepoOpenPrSnapshotIsAdvisoryOnly: true,
    },
    executionStatus: {
      pullRequestsMerged: false,
      pullRequestsClosed: false,
      pullRequestsRebased: false,
      pullRequestsRetargeted: false,
      runtimePathsExecuted: false,
      supabaseMutation: false,
      providerCalls: false,
      productionUnlocked: false,
      externalBetaUnlocked: false,
      paidProductionUnlocked: false,
    },
  };
}

function buildCurrentLiveDriftReview(metadata, audit, mergedEvidencePrs) {
  const openByNumber = new Map(audit.stackMap.map((pr) => [pr.number, pr]));
  const currentDraftNumbers = sortedNumbers(audit.draftPrs.map((pr) => pr.number));
  const expectedDraftSet = new Set(driftAcceptedExpectedDraftPrNumbers);
  const newDrafts = currentDraftNumbers.filter((number) => !expectedDraftSet.has(number));
  const nonCleanPrs = audit.nonCleanPrs.map((pr) => ({
    number: pr.number,
    title: pr.title,
    state: pr.state,
    isDraft: pr.isDraft,
    mergeStateStatus: pr.mergeStateStatus,
    baseRefName: pr.baseRefName,
    headRefName: pr.headRefName,
    headRefOid: pr.headRefOid,
    url: pr.url,
    driftClassification: frozenMergeBatchPrNumbers.includes(pr.number) ? "blocker" : "warning",
    reason: frozenMergeBatchPrNumbers.includes(pr.number)
      ? "Non-clean PR is inside the frozen batch."
      : "Non-clean PR is outside the frozen batch.",
  }));
  const missingCandidatePrs = previousCandidateFutureMergePrNumbers.filter((number) => !openByNumber.has(number));
  const missingCandidateReviews = missingCandidatePrs.map((number) => {
    const mergedEvidence = mergedEvidencePrs.find((pr) => pr.number === number);
    const frozenBatchMember = frozenMergeBatchPrNumbers.includes(number);
    return {
      number,
      state: mergedEvidence?.state || "not_found_in_open_snapshot",
      title: mergedEvidence?.title || null,
      headRefName: mergedEvidence?.headRefName || null,
      headRefOid: mergedEvidence?.headRefOid || null,
      frozenBatchMember,
      driftClassification: mergedEvidence?.state === "MERGED" || !frozenBatchMember ? "resolved" : "blocker",
      reason:
        mergedEvidence?.state === "MERGED"
          ? "Candidate PR is already merged and should be recorded as evidence rather than included in the future merge batch."
          : !frozenBatchMember
            ? "Candidate PR is outside the frozen batch and not required for future merge execution."
          : "Candidate PR is missing from the open snapshot and is not proven merged.",
    };
  });
  const specificPrs = [333, 347, 352, 353, 355]
    .map((number) => openByNumber.get(number) || mergedEvidencePrs.find((pr) => pr.number === number) || null)
    .filter(Boolean)
    .map((pr) => ({
      number: pr.number,
      title: pr.title,
      state: pr.state,
      isDraft: pr.isDraft,
      mergeStateStatus: pr.mergeStateStatus,
      baseRefName: pr.baseRefName,
      headRefName: pr.headRefName,
      headRefOid: pr.headRefOid,
      url: pr.url,
      frozenBatchMember: frozenMergeBatchPrNumbers.includes(pr.number),
      driftClassification:
        frozenMergeBatchPrNumbers.includes(pr.number) && pr.state === "OPEN" && (!pr.isDraft && pr.mergeStateStatus === "CLEAN")
          ? "resolved"
          : frozenMergeBatchPrNumbers.includes(pr.number)
            ? "blocker"
            : "warning_or_resolved_outside_batch",
    }));
  return {
    runId,
    generatedAt: metadata.generatedAt,
    decision: "live_drift_review_completed_for_frozen_batch",
    expectedOpenCount: 347,
    actualOpenCount: metadata.openPrCount,
    openCountDrift: {
      expected: 347,
      actual: metadata.openPrCount,
      classification: metadata.openPrCount === 347 ? "resolved" : "warning",
      reason: "Whole-repo open PR count is advisory once the frozen batch model is active.",
    },
    expectedDraftSetAfterDriftAcceptance: driftAcceptedExpectedDraftPrNumbers,
    actualDraftSet: currentDraftNumbers,
    newDrafts,
    newDraftReviews: newDrafts.map((number) => {
      const pr = openByNumber.get(number);
      return {
        number,
        title: pr?.title || null,
        state: pr?.state || null,
        isDraft: pr?.isDraft ?? null,
        mergeStateStatus: pr?.mergeStateStatus || null,
        baseRefName: pr?.baseRefName || null,
        headRefName: pr?.headRefName || null,
        headRefOid: pr?.headRefOid || null,
        url: pr?.url || null,
        driftClassification: frozenMergeBatchPrNumbers.includes(number) ? "blocker" : "warning",
        reason: frozenMergeBatchPrNumbers.includes(number)
          ? "New draft is inside frozen batch."
          : "New draft is outside frozen batch.",
      };
    }),
    dirtyOrUnstablePrs: nonCleanPrs,
    missingCandidatePrs,
    missingCandidateReviews,
    watchedPrs: specificPrs,
    summary: {
      warnings: [
        ...(metadata.openPrCount === 347 ? [] : ["total_open_pr_count_drift"]),
        ...newDrafts.filter((number) => !frozenMergeBatchPrNumbers.includes(number)).map((number) => `new_unrelated_draft_pr_${number}`),
        ...nonCleanPrs.filter((pr) => pr.driftClassification === "warning").map((pr) => `unrelated_nonclean_pr_${pr.number}_${pr.mergeStateStatus}`),
      ],
      blockers: [
        ...newDrafts.filter((number) => frozenMergeBatchPrNumbers.includes(number)).map((number) => `draft_batch_pr_${number}`),
        ...nonCleanPrs.filter((pr) => pr.driftClassification === "blocker").map((pr) => `nonclean_batch_pr_${pr.number}_${pr.mergeStateStatus}`),
        ...missingCandidateReviews.filter((review) => review.driftClassification === "blocker").map((review) => `missing_batch_pr_${review.number}`),
      ],
      resolved: [
        ...missingCandidateReviews.filter((review) => review.driftClassification === "resolved").map((review) => `merged_candidate_pr_${review.number}`),
      ],
    },
  };
}

function previousFrozenBatchHeadShas() {
  const batchPath = path.join(root, "docs/github-merge-hygiene/frozen-merge-batch.json");
  if (!existsSync(batchPath)) return new Map();
  try {
    const batch = JSON.parse(readFileSync(batchPath, "utf8"));
    return new Map(
      (batch.entries || [])
        .filter((entry) => entry?.number && entry?.headRefOid)
        .map((entry) => [entry.number, entry.headRefOid]),
    );
  } catch {
    return new Map();
  }
}

function frozenBatchPrMetadata(number, stackEntry) {
  const result = safeFetchPr(number);
  const viewed = result.ok ? result.pr : null;
  return {
    exists: Boolean(viewed || stackEntry),
    viewFetchOk: result.ok,
    viewFetchError: result.error,
    number,
    title: viewed?.title || stackEntry?.title || "missing from current open snapshot",
    url: viewed?.url || stackEntry?.url || null,
    state: viewed?.state || stackEntry?.state || "missing",
    isDraft: viewed?.isDraft ?? stackEntry?.isDraft ?? null,
    mergeStateStatus: viewed?.mergeStateStatus || stackEntry?.mergeStateStatus || null,
    baseRefName: viewed?.baseRefName || stackEntry?.baseRefName || null,
    headRefName: viewed?.headRefName || stackEntry?.headRefName || null,
    headRefOid: viewed?.headRefOid || stackEntry?.headRefOid || null,
    updatedAt: viewed?.updatedAt || stackEntry?.updatedAt || null,
  };
}

function buildFrozenMergeBatch(metadata, audit) {
  const openByNumber = new Map(audit.stackMap.map((pr) => [pr.number, pr]));
  const priorHeadShas = previousFrozenBatchHeadShas();
  const entries = frozenMergeBatchPrNumbers.map((number, index) => {
    const pr = openByNumber.get(number);
    const current = frozenBatchPrMetadata(number, pr);
    const priorHeadSha = priorHeadShas.get(number) || null;
    const blockers = [];
    if (!pr) blockers.push("missing_from_open_pr_snapshot");
    if (!current.viewFetchOk) blockers.push("github_pr_view_metadata_unavailable");
    if (current.state !== "OPEN") blockers.push(`state_${current.state || "missing"}`);
    if (current.isDraft) blockers.push("is_draft");
    if (current.mergeStateStatus !== "CLEAN") blockers.push(`merge_state_${current.mergeStateStatus || "missing"}`);
    if (pr && pr.classification !== "canonical") blockers.push(`classification_${pr.classification}`);
    if (!current.headRefOid) blockers.push("head_sha_unavailable");
    if (priorHeadSha && current.headRefOid && priorHeadSha !== current.headRefOid) {
      blockers.push("head_sha_changed_since_frozen_batch_capture");
    }
    return {
      order: index + 1,
      number,
      title: current.title,
      url: current.url,
      state: current.state,
      isDraft: current.isDraft,
      mergeStateStatus: current.mergeStateStatus,
      baseRefName: current.baseRefName,
      headRefName: current.headRefName,
      headRefOid: current.headRefOid,
      previousFrozenHeadRefOid: priorHeadSha,
      githubPrViewMetadataAvailable: current.viewFetchOk,
      githubPrViewMetadataError: current.viewFetchError,
      updatedAt: current.updatedAt,
      parentPrNumber: pr?.parentPrNumber || null,
      childPrNumbers: pr?.childPrNumbers || [],
      duplicateRiskGroups: pr?.riskGroups || [],
      duplicate: pr ? pr.classification === "duplicate_risk" : null,
      canonical: pr ? pr.classification === "canonical" : false,
      approvedForFutureMerge: blockers.length === 0,
      blocker: blockers.length ? blockers.join(",") : null,
    };
  });
  const blockers = entries.flatMap((entry) =>
    entry.approvedForFutureMerge
      ? []
      : [{ number: entry.number, blocker: entry.blocker || "unknown_batch_blocker" }],
  );
  let decision = "approved_for_future_frozen_batch_merge_execution";
  if (blockers.some((entry) => /missing/.test(entry.blocker))) decision = "blocked_pending_missing_pr_review";
  else if (blockers.some((entry) => /merge_state_DIRTY/.test(entry.blocker))) decision = "blocked_pending_dirty_batch_pr_review";
  else if (blockers.some((entry) => /head_sha/.test(entry.blocker))) decision = "blocked_pending_human_merge_order_review";
  else if (blockers.some((entry) => /classification_duplicate_risk|duplicate/.test(entry.blocker))) decision = "blocked_pending_duplicate_pr_review";
  else if (blockers.length > 0) decision = "blocked_pending_human_merge_order_review";
  return {
    runId,
    generatedAt: metadata.generatedAt,
    decision,
    batchId: `pr350-frozen-merge-batch-${metadata.generatedAt.replace(/[:.]/g, "")}`,
    sourcePr: 350,
    approvedForFutureMergeExecution: decision === "approved_for_future_frozen_batch_merge_execution",
    batchSize: entries.filter((entry) => entry.approvedForFutureMerge).length,
    expectedPrNumbers: frozenMergeBatchPrNumbers,
    entries,
    blockers,
    excludedPrs: {
      alreadyMergedEvidencePrNumbers,
      draftPrNumbers: sortedNumbers(audit.draftPrs.map((pr) => pr.number)),
      dirtyOrUnstablePrs: Object.fromEntries(
        audit.nonCleanPrs.map((pr) => [String(pr.number), pr.mergeStateStatus]).sort(([a], [b]) => Number(a) - Number(b)),
      ),
      duplicateRiskPrNumbers: sortedNumbers(
        audit.stackMap.filter((pr) => pr.classification === "duplicate_risk").map((pr) => pr.number),
      ),
    },
    safetyStatus: {
      pullRequestsMerged: false,
      pullRequestsClosed: false,
      pullRequestsRebased: false,
      pullRequestsRetargeted: false,
      runtimePathsExecuted: false,
      supabaseMutation: false,
      providerCalls: false,
      productionUnlocked: false,
      externalBetaUnlocked: false,
      paidProductionUnlocked: false,
      publicArtifactsCreated: false,
      signedUrlsIssued: false,
      rawPromptExecution: false,
    },
  };
}

function buildFrozenBatchMergeOrder(batch) {
  return {
    runId,
    generatedAt: batch.generatedAt,
    decision: batch.decision === "approved_for_future_frozen_batch_merge_execution"
      ? "frozen_batch_parent_first_order_ready"
      : "frozen_batch_parent_first_order_blocked",
    sourceBatchId: batch.batchId,
    mergeOnlyApprovedFrozenBatchPrs: true,
    sequence: batch.entries.map((entry) => ({
      order: entry.order,
      number: entry.number,
      title: entry.title,
      baseRefName: entry.baseRefName,
      headRefName: entry.headRefName,
      headRefOid: entry.headRefOid,
      parentPrNumber: entry.parentPrNumber,
      childPrNumbers: entry.childPrNumbers,
      approvedForFutureMerge: entry.approvedForFutureMerge,
      blocker: entry.blocker,
      verificationBeforeMerge: `gh pr view ${entry.number} --repo yuzastudio6-cyber/Reedkt --json state,isDraft,mergeStateStatus,headRefOid,baseRefName,headRefName`,
      requiredBeforeMerge: [
        "state must remain OPEN",
        "isDraft must remain false",
        "mergeStateStatus must remain CLEAN",
        `headRefOid must equal ${entry.headRefOid || "recorded_frozen_sha"}`,
        "baseRefName must match the frozen batch entry unless the prior parent merge intentionally updated it and the batch is regenerated",
      ],
      stopConditions: [
        "PR state changed",
        "PR became draft",
        "PR became dirty or unstable",
        "head SHA changed",
        "base branch changed unexpectedly",
        "parent PR not merged first",
        "new validation category appears",
      ],
    })),
    postMergeVerification: [
      "Verify the target branch contains each merged commit after every merge.",
      "Regenerate the frozen batch after any parent merge changes child bases.",
      "Stop immediately if any PR outside the frozen batch appears in the merge plan.",
    ],
  };
}

function buildDuplicateHumanReviewDraft(audit) {
  const approvedSet = new Set(approvedFutureMergePrNumbers);
  const mergedSet = new Set(alreadyMergedEvidencePrNumbers);
  const entries = audit.duplicateRiskEntries.map((entry) => {
    const observed = sortedNumbers(entry.observedPrNumbers);
    const keep = observed.filter((number) => approvedSet.has(number) || mergedSet.has(number));
    const review = observed.filter((number) => !approvedSet.has(number) && !mergedSet.has(number));
    const likelySuperseded = review.filter((number) => {
      const pr = audit.stackMap.find((candidate) => candidate.number === number);
      return pr?.classification === "duplicate_risk" || pr?.isDraft;
    });
    return {
      id: entry.id,
      label: entry.label,
      riskStatus: entry.riskStatus,
      canonicalRecommendation: entry.canonicalPrNumbers.length
        ? entry.canonicalPrNumbers
        : "owner_review_required",
      prsToKeep: keep,
      prsToReview: review,
      prsLikelySupersededPendingHumanConfirmation: likelySuperseded,
      prsNotApprovedForMergeYet: review,
      recommendedAction:
        review.length > 0
          ? "keep canonical/merged evidence; review or close/rebase parallel PRs only after the canonical parent chain lands"
          : "keep canonical lane",
      reason: entry.reason,
    };
  });
  return {
    generatedAt: new Date().toISOString(),
    decision: "duplicate_parallel_prs_require_human_review_before_any_noncanonical_merge",
    entries,
  };
}

function buildMergeApprovalPacket(metadata, audit) {
  const openByNumber = new Map(audit.stackMap.map((pr) => [pr.number, pr]));
  const approvedPrs = approvedFutureMergePrNumbers.map((number) => openByNumber.get(number)).filter(Boolean);
  const draftPrNumbers = sortedNumbers(audit.draftPrs.map((pr) => pr.number));
  const draftDriftReview = buildDraftPrDriftReview(metadata.generatedAt);
  const nonCleanMergeStates = Object.fromEntries(
    audit.nonCleanPrs.map((pr) => [String(pr.number), pr.mergeStateStatus]).sort(([a], [b]) => Number(a) - Number(b)),
  );
  const duplicateRiskPrNumbers = sortedNumbers(
    audit.stackMap
      .filter((pr) => pr.classification === "duplicate_risk")
      .map((pr) => pr.number),
  );
  const nonCanonicalPrNumbers = sortedNumbers(
    audit.stackMap
      .filter((pr) => !approvedFutureMergePrNumbers.includes(pr.number))
      .map((pr) => pr.number),
  );
  const alreadyMergedPrs = alreadyMergedEvidencePrNumbers.map((number) => pr205Summary(fetchPr(number)));
  const liveDriftTolerancePolicy = buildLiveDriftTolerancePolicy(metadata.generatedAt);
  const currentLiveDriftReview = buildCurrentLiveDriftReview(metadata, audit, alreadyMergedPrs);
  const frozenMergeBatch = buildFrozenMergeBatch(metadata, audit);
  const frozenBatchMergeOrder = buildFrozenBatchMergeOrder(frozenMergeBatch);

  const blockers = [];
  if (draftDriftReview.decision !== "accepted_draft_drift_to_352") {
    blockers.push({
      blocker: "draft_pr_drift_review_not_accepted",
      status: "active",
      expectedDraftPrNumber: 351,
      actualDraftPrNumber: 352,
      draftDriftDecision: draftDriftReview.decision,
      draftDriftBlockers: draftDriftReview.blockers,
      decision: "blocked_pending_human_merge_order_review",
    });
  }
  if (frozenMergeBatch.blockers.length > 0) {
    blockers.push({
      blocker: "frozen_merge_batch_has_blockers",
      status: "active",
      problems: frozenMergeBatch.blockers,
      decision: frozenMergeBatch.decision,
    });
  }
  const mergedProblems = alreadyMergedPrs
    .filter((pr) => pr.state !== "MERGED")
    .map((pr) => ({ number: pr.number, state: pr.state }));
  if (mergedProblems.length > 0) {
    blockers.push({
      blocker: "merged_evidence_pr_state_mismatch",
      status: "active",
      problems: mergedProblems,
      decision: "blocked_pending_human_merge_order_review",
    });
  }

  let decision = frozenMergeBatch.decision;
  const firstBlockingDecision = blockers.find((blocker) => blocker.status === "active")?.decision;
  if (firstBlockingDecision) decision = firstBlockingDecision;
  if (decision === "approved_for_future_frozen_batch_merge_execution" && draftDriftReview.decision !== "accepted_draft_drift_to_352") {
    decision = "blocked_pending_human_merge_order_review";
  }

  const validationExceptionPolicy = buildValidationExceptionPolicy(metadata.generatedAt);
  const duplicateReview = buildDuplicateHumanReviewDraft(audit);

  return {
    runId,
    generatedAt: metadata.generatedAt,
    decision,
    sourceAuditDecision: "open_pr_stack_audit_completed_ready_for_human_merge_order_review",
    sourceOpenPrCount: metadata.openPrCount,
    sourceDraftPrCount: draftPrNumbers.length,
    sourceMergeStateCounts: countsBy(audit.stackMap, "mergeStateStatus"),
    draftDriftReview,
    liveDriftTolerancePolicy,
    currentLiveDriftReview,
    frozenMergeBatch,
    frozenBatchMergeOrder,
    approvedFutureMergePrNumbers,
    approvedFutureMergeStacks,
    approvedFutureMergePrs: approvedPrs.map((pr) => ({
      number: pr.number,
      title: pr.title,
      url: pr.url,
      baseRefName: pr.baseRefName,
      headRefName: pr.headRefName,
      mergeStateStatus: pr.mergeStateStatus,
      classification: pr.classification,
    })),
    blockedFromFutureMerge: {
      draftPrNumbers,
      dirtyOrUnstablePrs: nonCleanMergeStates,
      duplicateRiskPrNumbers,
      nonCanonicalPrNumbers,
      alreadyMergedEvidencePrNumbers,
      approvalCarrierPrNumber: 350,
    },
    alreadyMergedEvidencePrs: alreadyMergedPrs,
    duplicateReview,
    validationExceptionPolicy,
    blockers,
    executionStatus: {
      pullRequestsMerged: false,
      pullRequestsClosed: false,
      pullRequestsRebased: false,
      runtimePathsExecuted: false,
      supabaseMutation: false,
      providerCalls: false,
      publicArtifactsCreated: false,
      signedUrlsIssued: false,
      productionUnlocked: false,
      externalBetaUnlocked: false,
      paidProductionUnlocked: false,
    },
    supabaseClassification: {
      updateRequired: "no",
      environmentTouched: "none",
      sql: "none",
      migrationDeployed: "no",
    },
  };
}

function renderApprovalPacketMd(packet) {
  const mergeSetHeading =
    isApprovedFrozenBatchDecision(packet.decision)
      ? "Approved Frozen Merge Batch"
      : "Frozen Merge Batch - Held Until Blocker Resolution";
  return `# Human Merge Order Approval Packet

Decision: \`${packet.decision}\`

This packet approves only a future frozen-batch parent-chain merge execution phase. It does not merge, close, rebase, retarget, or unlock runtime/product scopes.

## Draft Drift Review

- Decision: \`${packet.draftDriftReview.decision}\`
- Expected draft PR: #${packet.draftDriftReview.expectedDraftPrNumber}
- Actual draft PR: #${packet.draftDriftReview.actualDraftPrNumber}
- PR #351 state: \`${packet.draftDriftReview.expectedDraftPr.state || "unavailable"}\`
- PR #352 title: ${packet.draftDriftReview.actualDraftPr.title || "unavailable"}
- PR #352 base/head: \`${packet.draftDriftReview.actualDraftPr.baseRefName || "unavailable"}\` -> \`${packet.draftDriftReview.actualDraftPr.headRefName || "unavailable"}\`
- PR #352 draft/merge state: \`${packet.draftDriftReview.actualDraftPr.isDraft}\` / \`${packet.draftDriftReview.actualDraftPr.mergeStateStatus || "unavailable"}\`
- Draft-set replacement accepted: \`${packet.draftDriftReview.driftInterpretation.draftSetReplacementAccepted}\`

${packet.pr337HeadShaDriftReview ? `## PR #337 SHA Drift Review

- Decision: \`${packet.pr337HeadShaDriftReview.decision}\`
- Frozen SHA: \`${packet.pr337HeadShaDriftReview.frozenHeadSha}\`
- Live SHA: \`${packet.pr337HeadShaDriftReview.liveHeadSha}\`
- Frozen batch update allowed: \`${packet.pr337HeadShaDriftReview.frozenBatchUpdate.updateAllowed}\`
` : ""}

## Frozen Batch

- Batch ID: \`${packet.frozenMergeBatch.batchId}\`
- Batch decision: \`${packet.frozenMergeBatch.decision}\`
- Approved batch size: ${packet.frozenMergeBatch.batchSize}
- Future execution source of truth: \`docs/github-merge-hygiene/frozen-merge-batch.json\`
- Live drift policy: \`${packet.liveDriftTolerancePolicy.decision}\`
- Whole-repo open PR count drift: \`${packet.currentLiveDriftReview.openCountDrift.classification}\`
- Live drift warnings: ${packet.currentLiveDriftReview.summary.warnings.length ? packet.currentLiveDriftReview.summary.warnings.map((warning) => `\`${warning}\``).join(", ") : "none"}
- Live drift blockers: ${packet.currentLiveDriftReview.summary.blockers.length ? packet.currentLiveDriftReview.summary.blockers.map((blocker) => `\`${blocker}\``).join(", ") : "none"}

## ${mergeSetHeading}

${markdownTable(packet.frozenMergeBatch.entries.filter((entry) => entry.approvedForFutureMerge), [
  { label: "PR", value: (row) => `#${row.number}` },
  { label: "Title", value: (row) => row.title },
  { label: "Base", value: (row) => `\`${row.baseRefName}\`` },
  { label: "Head", value: (row) => `\`${row.headRefName}\`` },
  { label: "Merge state", value: (row) => row.mergeStateStatus },
  { label: "SHA", value: (row) => `\`${row.headRefOid}\`` },
])}

## Approved Stacks

${markdownTable(packet.approvedFutureMergeStacks, [
  { label: "Stack", value: (row) => row.id },
  { label: "PRs", value: (row) => row.prNumbers.map((number) => `#${number}`).join(", ") },
])}

## Blocked From Merge

- Draft PRs: ${packet.blockedFromFutureMerge.draftPrNumbers.map((number) => `#${number}`).join(", ")}
- Dirty or unstable PRs: ${Object.entries(packet.blockedFromFutureMerge.dirtyOrUnstablePrs).map(([number, status]) => `#${number} ${status}`).join(", ")}
- Duplicate-risk PRs: ${packet.blockedFromFutureMerge.duplicateRiskPrNumbers.length}
- Already merged evidence PRs excluded from future merge targets: ${packet.blockedFromFutureMerge.alreadyMergedEvidencePrNumbers.map((number) => `#${number}`).join(", ")}
- PR #350 is the approval packet carrier and is not part of the future merge target set.
- PRs outside \`frozen-merge-batch.json\` are not approved for future merge execution.

## Validation Exception Policy

The known \`typecheck:server\` and \`build:server\` failures are accepted only for this future parent-chain merge approval if they match the existing activation dependency/type categories in \`validation-exception-policy.md\`. Any new category blocks merge execution approval.

## Safety

No PR merge, close, rebase, runtime execution, provider call, Supabase write, public artifact, signed URL delivery, production, external beta, paid production, or raw prompt execution is approved in this packet.
`;
}

function renderValidationExceptionPolicyMd(policy) {
  return `# Validation Exception Policy

Decision: \`${policy.decision}\`

The following validation failures are treated as pre-existing PR #350 base blockers for future parent-chain merge execution only:

- \`typecheck:server\`
- \`build:server\`

Accepted failure categories:

${policy.failureCategories.map((category) => `- \`${category}\``).join("\n")}

Policy:

- New failure categories block merge execution approval.
- \`build:server\` may fail only because it reruns the same \`typecheck:server\` blockers.
- These failures do not authorize runtime execution, Supabase writes, provider calls, production, external beta, or paid production.
- A separate repair PR remains required before this server typecheck can become a hard merge gate.
- Reevaluate after package dependency changes, server activation runner changes, or before any production/runtime unlock.
`;
}

function renderDuplicateReviewMd(duplicateReview) {
  return `# Duplicate PR Human Review Draft

Decision: \`${duplicateReview.decision}\`

No duplicate or parallel PR is closed, rebased, or merged by this packet.

${duplicateReview.entries
  .map(
    (entry) => `## ${entry.label}

- Canonical recommendation: ${Array.isArray(entry.canonicalRecommendation) ? entry.canonicalRecommendation.map((number) => `#${number}`).join(", ") : entry.canonicalRecommendation}
- PRs to keep: ${entry.prsToKeep.length ? entry.prsToKeep.map((number) => `#${number}`).join(", ") : "none"}
- PRs to review: ${entry.prsToReview.length ? entry.prsToReview.map((number) => `#${number}`).join(", ") : "none"}
- Likely superseded pending human confirmation: ${entry.prsLikelySupersededPendingHumanConfirmation.length ? entry.prsLikelySupersededPendingHumanConfirmation.map((number) => `#${number}`).join(", ") : "none"}
- Not approved for merge yet: ${entry.prsNotApprovedForMergeYet.length ? entry.prsNotApprovedForMergeYet.map((number) => `#${number}`).join(", ") : "none"}
- Recommended action: ${entry.recommendedAction}
`,
  )
  .join("\n")}
`;
}

function renderApprovalCurrentHandoff(packet) {
  return `# Current Handoff

Generated: \`${packet.generatedAt}\`

Current merge-hygiene approval status:

- PR #350 merge hygiene audit is complete.
- Approval decision: \`${packet.decision}\`
- Open PRs in source snapshot: ${packet.sourceOpenPrCount}
- Draft PRs in source snapshot: ${packet.sourceDraftPrCount}
- PR #346 is merged and excluded from future merge targets.
- Draft drift review: \`${packet.draftDriftReview.decision}\`
- PR #351 is recorded as \`${packet.draftDriftReview.expectedDraftPr.state || "unavailable"}\`.
- PR #352 is recorded as \`${packet.draftDriftReview.actualDraftPr.state || "unavailable"}\`, draft=\`${packet.draftDriftReview.actualDraftPr.isDraft}\`, merge state \`${packet.draftDriftReview.actualDraftPr.mergeStateStatus || "unavailable"}\`.
- PR #337 SHA drift review: \`${packet.pr337HeadShaDriftReview?.decision || "not_recorded"}\`.
- PR #337 frozen/live SHA: \`${packet.pr337HeadShaDriftReview?.frozenHeadSha || "not_recorded"}\` -> \`${packet.pr337HeadShaDriftReview?.liveHeadSha || "not_recorded"}\`.
- Frozen batch decision: \`${packet.frozenMergeBatch.decision}\`
- Frozen batch size: ${packet.frozenMergeBatch.batchSize}
- Live open PR count drift is a warning unless it affects the frozen batch.
- Merge execution still requires a separate frozen-batch parent-chain execution prompt.
- Future owners must check current merge status before building on any PR.

Current blocked scopes remain unchanged: no runtime execution, providers, tools, workers, routes, Supabase writes, public artifacts, signed URL delivery, production, external beta, paid production, or raw prompt execution.
`;
}

function renderApprovalReadFirst() {
  return `# Read First For All Owners

PR #350 now contains the merge-hygiene audit and human merge-order approval packet.

Before starting or continuing a workstream:

1. Read \`docs/github-merge-hygiene/human-merge-order-approval-packet.md\`.
2. Read \`docs/github-merge-hygiene/validation-exception-policy.md\`.
3. Read \`docs/github-merge-hygiene/duplicate-pr-human-review-draft.md\`.
4. Read \`docs/github-merge-hygiene/draft-pr-drift-review.md\`.
5. Read \`docs/github-merge-hygiene/frozen-merge-batch.md\`.
6. Read \`docs/github-merge-hygiene/live-pr-drift-tolerance-policy.md\`.
7. Check live GitHub merge status before building on a PR.
8. Follow \`docs/github-merge-hygiene/post-major-milestone-merge-rule.md\`.

This packet does not authorize PR merges by itself; it authorizes only a future frozen-batch parent-chain merge execution phase for the exact approved set.
`;
}

function renderApprovalNextUnlockLanes(packet) {
  return `# Next Unlock Lanes

Recommended next phase:

- If \`${packet.decision}\` remains approved, resume \`GITHUB_MERGE_HYGIENE - frozen batch parent-chain merge execution\` from #298.
- Merge only PRs with \`approvedForFutureMerge=true\` in \`docs/github-merge-hygiene/frozen-merge-batch.json\`.
- Merge parent PRs first and verify merged commits after each merge.
- Do not merge drafts, dirty/unstable PRs, duplicate-risk PRs, or non-canonical PRs.
- Treat unrelated open PR count drift as a warning only; stop if any frozen-batch PR changes state, draft flag, merge state, head SHA, or base unexpectedly.

Still blocked:

- runtime execution
- provider calls
- worker/tool/route execution
- Supabase writes
- production, external beta, and paid production
- public artifacts and signed URL delivery
- raw prompt execution
`;
}

function renderMergeExecutionPrompt(packet) {
  const executionStatus =
    isApprovedFrozenBatchDecision(packet.decision)
      ? "This prompt may be used only in a separate execution phase after PR #350 lands."
      : `Do not use this prompt for merge execution yet. Current approval decision is \`${packet.decision}\`; resolve the blocker report first.`;
  return `# GitHub Merge Hygiene Parent-Chain Merge Execution

${executionStatus}

Resume start point: #298.

PR #337 frozen head SHA status:

- Review decision: \`${packet.pr337HeadShaDriftReview?.decision || "not_recorded"}\`
- Expected SHA for PR #337: \`${packet.frozenMergeBatch.entries.find((entry) => entry.number === 337)?.headRefOid || "missing"}\`

Frozen batch merge targets are exactly:

${packet.frozenMergeBatch.entries.filter((entry) => entry.approvedForFutureMerge).map((entry) => `- #${entry.number} \`${entry.headRefOid}\``).join("\n")}

Rules:

- Merge only PRs listed in \`docs/github-merge-hygiene/frozen-merge-batch.json\` with \`approvedForFutureMerge=true\`.
- Verify each PR's head SHA before merge.
- Merge parent PRs first.
- Do not merge draft PRs.
- Do not merge dirty or unstable PRs.
- Do not merge duplicate-risk PRs unless they are explicitly marked canonical in the approval packet.
- Verify the target branch contains each merged commit after every merge.
- Stop on any changed PR state, draft flag, merge state, head SHA, base branch, new conflict, missing parent, or unexpected CI/validation category.
- Do not merge PRs outside the frozen batch.
- Do not execute runtime paths, mutate Supabase, call providers, run workers/tools/routes, process media, create public artifacts, issue signed URLs, deploy production, unlock external beta, unlock paid production, or execute raw prompts.
`;
}

function findFrozenBatchExecutionComment(pr350) {
  const comments = pr350.comments || [];
  return (
    comments.find((comment) => /Frozen batch parent-chain merge execution complete/i.test(comment.body || "")) ||
    comments.find((comment) => /Final frozen batch verification:\s*27\/27 PRs are `?MERGED`?/i.test(comment.body || ""))
  );
}

function buildPostMergeMilestoneEvidence() {
  return postMergeMilestoneEvidenceChecks.map((check) => {
    try {
      const entries = fetchBranchDirectory(check.ref, check.path);
      const names = entries.map((entry) => entry.name).sort();
      const missingRequiredFiles = check.requiredFiles.filter((name) => !names.includes(name));
      return {
        ...check,
        directoryPresent: entries.length > 0,
        fileCount: entries.length,
        requiredFilesPresent: missingRequiredFiles.length === 0,
        missingRequiredFiles,
        observedFiles: names,
        status: entries.length > 0 && missingRequiredFiles.length === 0 ? "passed" : "blocked",
      };
    } catch (error) {
      return {
        ...check,
        directoryPresent: false,
        fileCount: 0,
        requiredFilesPresent: false,
        missingRequiredFiles: check.requiredFiles,
        observedFiles: [],
        status: "blocked",
        error: error instanceof Error ? error.message.split("\n")[0] : "unknown_error",
      };
    }
  });
}

function buildPostMergeBlockedScopeVerification(generatedAt) {
  const scannedFiles = [
    "docs/cross-chat/CURRENT_HANDOFF.md",
    "docs/cross-chat/READ_FIRST_FOR_ALL_OWNERS.md",
    "docs/cross-chat/BLOCKED_SCOPES.md",
    "docs/cross-chat/NEXT_UNLOCK_LANES.md",
    "docs/beta-readiness-scorecard.md",
    "docs/production-beta-blocker-inventory.md",
  ].filter((relativePath) => existsSync(path.join(root, relativePath)));
  const forbiddenMatches = [];
  for (const relativePath of scannedFiles) {
    const text = readFileSync(path.join(root, relativePath), "utf8");
    for (const pattern of forbiddenUnlockPatterns) {
      if (pattern.test(text)) {
        forbiddenMatches.push({ file: relativePath, pattern: String(pattern) });
      }
    }
  }
  return {
    runId,
    generatedAt,
    decision: forbiddenMatches.length === 0 ? "post_merge_blocked_scopes_verified" : "blocked_pending_scope_language_review",
    scannedFiles,
    forbiddenMatches,
    blockedScopesRemainBlocked: forbiddenMatches.length === 0,
    explicitBlockedScopes: [
      "production",
      "external_beta",
      "paid_production",
      "public_artifacts",
      "signed_urls_as_source_of_truth",
      "raw_prompt_execution",
      "real_worker_execution",
      "real_tool_execution",
      "real_route_execution",
      "provider_execution",
      "broad_media",
      "track_a_runtime",
      "supabase_production_writes",
    ],
    executionStatus: {
      pullRequestsMergedInThisPhase: false,
      pullRequestsClosed: false,
      pullRequestsRebased: false,
      pullRequestsRetargeted: false,
      branchesDeleted: false,
      runtimePathsExecuted: false,
      workerToolRouteExecution: false,
      supabaseMutation: false,
      providerCalls: false,
      publicArtifactsCreated: false,
      signedUrlsIssued: false,
      productionUnlocked: false,
      externalBetaUnlocked: false,
      paidProductionUnlocked: false,
      rawPromptExecution: false,
      secretsPrintedOrCommitted: false,
    },
    supabaseClassification: {
      updateRequired: "no",
      environmentTouched: "none",
      sql: "none",
      migrationDeployed: "no",
    },
  };
}

function buildPostMergeSourceOfTruthVerification(generatedAt) {
  const frozenBatch = readJson("docs/github-merge-hygiene/frozen-merge-batch.json");
  const mergeOrder = readJson("docs/github-merge-hygiene/frozen-batch-merge-order.json");
  const readiness = readJson("docs/github-merge-hygiene/reports/merge_execution_readiness_report.json");
  const blockerReport = readJson("docs/github-merge-hygiene/reports/merge_execution_blocker_report.json");
  const pr350 = fetchPr350WithComments();
  const executionComment = findFrozenBatchExecutionComment(pr350);
  const orderedNumbers = (mergeOrder.sequence || []).map((entry) => entry.number);
  const entriesByNumber = new Map((frozenBatch.entries || []).map((entry) => [entry.number, entry]));
  const prRows = orderedNumbers.map((number) => {
    const expected = entriesByNumber.get(number);
    const live = fetchMergedPr(number);
    const sourceBranchExists = branchHeadExists(live.headRefName);
    const blockers = [];
    if (live.state !== "MERGED") blockers.push("pr_not_merged");
    if (!live.mergedAt) blockers.push("mergedAt_missing");
    if (expected && live.headRefOid !== expected.headRefOid) blockers.push("head_sha_changed_from_frozen_batch");
    if (expected && live.baseRefName !== expected.baseRefName) blockers.push("base_branch_changed_from_frozen_batch");
    if (!sourceBranchExists) blockers.push("source_branch_missing");
    return {
      number,
      title: live.title,
      url: live.url,
      state: live.state,
      mergedAt: live.mergedAt,
      baseRefName: live.baseRefName,
      headRefName: live.headRefName,
      headRefOid: live.headRefOid,
      expectedHeadRefOid: expected?.headRefOid || null,
      sourceBranchExists,
      status: blockers.length === 0 ? "passed" : "blocked",
      blockers,
    };
  });
  const milestoneEvidence = buildPostMergeMilestoneEvidence();
  const blockedScopeVerification = buildPostMergeBlockedScopeVerification(generatedAt);
  const executionCommentBody = executionComment?.body || "";
  const executionCommentChecks = {
    present: Boolean(executionComment),
    url: executionComment?.url || null,
    recordsCompletedStatus: /Status:\s*completed/i.test(executionCommentBody),
    recordsFinal27Merged: /27\/27 PRs are `?MERGED`?/i.test(executionCommentBody),
    recordsNonBatchMergeFalse: /Non-batch PRs merged:\s*false/i.test(executionCommentBody),
    recordsBranchDeletionFalse: /Branch deletion requested:\s*false/i.test(executionCommentBody),
    recordsNoRuntimeScopes: /Runtime\/workers\/tools\/routes\/providers executed:\s*false/i.test(executionCommentBody),
  };
  const blockers = [];
  if (frozenBatch.decision !== "approved_for_future_frozen_batch_merge_execution") {
    blockers.push(`frozen_batch_decision_${frozenBatch.decision || "missing"}`);
  }
  if (readiness.decision !== postPr337ShaUpdateDecision && readiness.decision !== "approved_for_future_frozen_batch_merge_execution") {
    blockers.push(`merge_execution_readiness_decision_${readiness.decision || "missing"}`);
  }
  if (blockerReport.decision !== "no_active_approval_blockers") {
    blockers.push(`merge_execution_blocker_decision_${blockerReport.decision || "missing"}`);
  }
  if (orderedNumbers.length !== 27 || !sameNumberSet(orderedNumbers, frozenMergeBatchPrNumbers)) {
    blockers.push("frozen_merge_order_not_27_expected_prs");
  }
  for (const row of prRows) {
    for (const blocker of row.blockers) blockers.push(`pr${row.number}_${blocker}`);
  }
  for (const check of milestoneEvidence) {
    if (check.status !== "passed") blockers.push(`${check.id}_evidence_missing`);
  }
  if (!executionCommentChecks.present) blockers.push("pr350_execution_comment_missing");
  if (!executionCommentChecks.recordsCompletedStatus) blockers.push("pr350_execution_comment_missing_completed_status");
  if (!executionCommentChecks.recordsFinal27Merged) blockers.push("pr350_execution_comment_missing_27_merged_verification");
  if (!executionCommentChecks.recordsNonBatchMergeFalse) blockers.push("pr350_execution_comment_missing_non_batch_false");
  if (!executionCommentChecks.recordsBranchDeletionFalse) blockers.push("pr350_execution_comment_missing_branch_deletion_false");
  if (!executionCommentChecks.recordsNoRuntimeScopes) blockers.push("pr350_execution_comment_missing_runtime_false");
  if (blockedScopeVerification.decision !== "post_merge_blocked_scopes_verified") {
    blockers.push("blocked_scope_verification_failed");
  }
  return {
    runId,
    generatedAt,
    decision:
      blockers.length === 0
        ? "post_merge_source_of_truth_verification_passed"
        : "blocked_pending_post_merge_source_of_truth_review",
    blockers,
    repo,
    controlPr: {
      number: pr350.number,
      title: pr350.title,
      url: pr350.url,
      state: pr350.state,
      isDraft: pr350.isDraft,
      mergeStateStatus: pr350.mergeStateStatus,
      baseRefName: pr350.baseRefName,
      headRefName: pr350.headRefName,
      headRefOid: pr350.headRefOid,
    },
    frozenBatch: {
      decision: frozenBatch.decision,
      batchSize: frozenBatch.batchSize || (frozenBatch.entries || []).length,
      expectedPrNumbers: frozenMergeBatchPrNumbers,
      mergeOrderDecision: mergeOrder.decision,
      readinessDecision: readiness.decision,
      blockerReportDecision: blockerReport.decision,
    },
    frozenPrVerification: {
      total: prRows.length,
      mergedWithMergedAt: prRows.filter((row) => row.state === "MERGED" && row.mergedAt).length,
      sourceBranchesPresent: prRows.filter((row) => row.sourceBranchExists).length,
      rows: prRows,
    },
    executionComment: executionCommentChecks,
    nonBatchMergeVerification: {
      source: "pr350_execution_comment",
      nonBatchPrsMerged: false,
      noNonBatchMergeEvidencePresent: executionCommentChecks.recordsNonBatchMergeFalse,
    },
    milestoneEvidence,
    blockedScopeVerification,
    nextRecommendedPhase: {
      id: "TOOL-STUDY-0",
      owners: ["TRACK_B_MEDIA_PROCESSING", "SOUND_MUSIC_AUDIO", "AI_TOOLS_CREATIVE_GRAPHICS", "TRACK_A_RENDER_EXPORT"],
      note: "Run pending owner studies before any tool-route execution unlock.",
    },
    executionStatus: {
      pullRequestsMergedInThisPhase: false,
      pullRequestsClosed: false,
      pullRequestsRebased: false,
      pullRequestsRetargeted: false,
      branchesDeleted: false,
      runtimePathsExecuted: false,
      workerToolRouteExecution: false,
      supabaseMutation: false,
      providerCalls: false,
      publicArtifactsCreated: false,
      signedUrlsIssued: false,
      productionUnlocked: false,
      externalBetaUnlocked: false,
      paidProductionUnlocked: false,
      rawPromptExecution: false,
      secretsPrintedOrCommitted: false,
    },
    supabaseClassification: {
      updateRequired: "no",
      updateStatus: "not_required",
      environmentTouched: "none",
      sql: "none",
      migrationDeployed: "no",
      nextSupabaseAction: "none",
    },
  };
}

function renderPostMergeSourceOfTruthMd(report) {
  return `# Post-Merge Source-Of-Truth Verification

Generated: \`${report.generatedAt}\`

Decision: \`${report.decision}\`

## Frozen Batch

- Frozen PRs verified: ${report.frozenPrVerification.mergedWithMergedAt}/${report.frozenPrVerification.total}
- Source branches still present: ${report.frozenPrVerification.sourceBranchesPresent}/${report.frozenPrVerification.total}
- PR #350 execution comment: ${report.executionComment.present ? report.executionComment.url : "missing"}
- Non-batch PRs merged by the frozen-batch process: \`${report.nonBatchMergeVerification.nonBatchPrsMerged}\`
- Blockers: ${report.blockers.length ? report.blockers.map((blocker) => `\`${blocker}\``).join(", ") : "none"}

## Milestone Evidence

${report.milestoneEvidence
  .map(
    (entry) =>
      `- ${entry.label}: \`${entry.status}\` (${entry.fileCount} files at \`${entry.path}\` on \`${entry.ref}\`)`,
  )
  .join("\n")}

## Blocked Scopes

Blocked scopes remain blocked: \`${report.blockedScopeVerification.blockedScopesRemainBlocked}\`

The verification did not merge, close, rebase, retarget, delete branches, run runtime paths, mutate Supabase, call providers, create public artifacts, issue signed URLs, unlock production/external beta/paid production, or execute raw prompts.

## Next Phase

Run \`TOOL-STUDY-0\` for pending owners before any tool-route execution unlock: Track B media processing, sound/music/audio, AI tools creative graphics, and Track A render/export.
`;
}

function renderPostMergeReadFirst(report) {
  return `# Read First For All Owners

PR #350 has completed frozen-batch merge execution and post-merge source-of-truth verification.

Current coordination facts:

1. The frozen batch of 27 PRs is merged and verified with \`mergedAt\`.
2. Source branches for all 27 frozen PRs still exist.
3. Key milestone reports are reachable from the merged branch chain.
4. Runtime, worker/tool/route, provider, Supabase write, public artifact, signed URL, raw prompt, production, external beta, and paid production scopes remain blocked.
5. The next recommended phase is \`TOOL-STUDY-0\` for pending owners before any tool-route execution unlock.

Read \`docs/github-merge-hygiene/post-merge-source-of-truth-verification.md\` before building on merged milestone evidence.
`;
}

function renderPostMergeCurrentHandoff(report) {
  return `# Current Handoff

Generated: \`${report.generatedAt}\`

Post-merge source-of-truth status:

- Decision: \`${report.decision}\`
- Frozen batch merged: 27/27
- Source branches still present: ${report.frozenPrVerification.sourceBranchesPresent}/27
- PR #350 execution comment: ${report.executionComment.url || "missing"}
- Track B clean staging sync evidence: \`${report.milestoneEvidence.find((entry) => entry.id === "supabase_trackb_clean_staging_backfill")?.status || "missing"}\`
- Restricted internal testing session 0 evidence: \`${report.milestoneEvidence.find((entry) => entry.id === "restricted_internal_testing_session_0")?.status || "missing"}\`
- Model orchestration evidence through plan snapshot dry-run: \`${report.milestoneEvidence.find((entry) => entry.id === "model_orchestration_plan_snapshot_dry_run")?.status || "missing"}\`

Current blocked scopes remain unchanged: no runtime execution, providers, tools, workers, routes, Supabase writes, public artifacts, signed URL delivery, production, external beta, paid production, broad media, Track A runtime, or raw prompt execution.
`;
}

function renderPostMergeNextUnlockLanes(report) {
  return `# Next Unlock Lanes

Recommended next phase:

- Run \`TOOL-STUDY-0\` for pending owners before any tool-route execution unlock.

Pending owner studies:

1. \`TRACK_B_MEDIA_PROCESSING\`
2. \`SOUND_MUSIC_AUDIO\`
3. \`AI_TOOLS_CREATIVE_GRAPHICS\`
4. \`TRACK_A_RENDER_EXPORT\`

Post-merge source-of-truth verification decision: \`${report.decision}\`

Still blocked:

- runtime execution
- provider calls
- worker/tool/route execution
- Supabase writes
- production, external beta, and paid production
- public artifacts and signed URL delivery
- raw prompt execution
`;
}

function renderPostMergeBlockedScopes() {
  return `# Blocked Scopes

The post-merge source-of-truth verification keeps these scopes blocked:

- production release
- external beta
- paid production
- general worker execution
- tool execution
- route execution
- provider calls
- media processing and broad media runtime
- Track A runtime execution
- Docker, Cloud Run, or Cloud Build mutation
- Supabase writes, SQL, migrations, reset, repair, or production promotion
- public artifacts
- signed URLs as source-of-truth
- raw prompt execution
- beta or production unlocks

Blocked means no owner should treat the frozen-batch merge or this verification as runtime/product execution approval.
`;
}

function generatePostMergeSourceOfTruthArtifacts() {
  mkdirSync(hygieneDir, { recursive: true });
  mkdirSync(reportsDir, { recursive: true });
  mkdirSync(crossChatDir, { recursive: true });

  const generatedAt = new Date().toISOString();
  const report = buildPostMergeSourceOfTruthVerification(generatedAt);
  jsonWrite("docs/github-merge-hygiene/reports/post_merge_source_of_truth_verification_report.json", report);
  jsonWrite(
    "docs/github-merge-hygiene/reports/post_merge_blocked_scope_verification_report.json",
    report.blockedScopeVerification,
  );
  textWrite("docs/github-merge-hygiene/post-merge-source-of-truth-verification.md", renderPostMergeSourceOfTruthMd(report));
  textWrite("docs/cross-chat/READ_FIRST_FOR_ALL_OWNERS.md", renderPostMergeReadFirst(report));
  textWrite("docs/cross-chat/CURRENT_HANDOFF.md", renderPostMergeCurrentHandoff(report));
  textWrite("docs/cross-chat/NEXT_UNLOCK_LANES.md", renderPostMergeNextUnlockLanes(report));
  textWrite("docs/cross-chat/BLOCKED_SCOPES.md", renderPostMergeBlockedScopes());
  return report;
}

function generateApprovalArtifacts(metadata, audit) {
  const packet = buildMergeApprovalPacket(metadata, audit);
  const duplicateRiskRegister = {
    runId,
    generatedAt: packet.generatedAt,
    decision: "duplicate_parallel_lanes_require_owner_review",
    draftDriftReview: packet.draftDriftReview,
    entries: audit.duplicateRiskEntries,
  };
  const readiness = {
    runId,
    generatedAt: packet.generatedAt,
    decision: packet.decision,
    mergeExecutionApprovedForFuturePhase: packet.decision === "approved_for_future_frozen_batch_merge_execution",
    mergeExecutionStarted: false,
    draftDriftDecision: packet.draftDriftReview.decision,
    frozenBatchDecision: packet.frozenMergeBatch.decision,
    frozenBatchSize: packet.frozenMergeBatch.batchSize,
    frozenBatchPrNumbers: packet.frozenMergeBatch.entries
      .filter((entry) => entry.approvedForFutureMerge)
      .map((entry) => entry.number),
    approvedFutureMergePrNumbers: packet.frozenMergeBatch.entries
      .filter((entry) => entry.approvedForFutureMerge)
      .map((entry) => entry.number),
    blockedFromFutureMerge: packet.blockedFromFutureMerge,
    requiredNextAction:
      packet.decision === "approved_for_future_frozen_batch_merge_execution"
        ? "run_separate_frozen_batch_parent_chain_merge_execution_prompt"
        : "resolve_human_merge_order_or_validation_blockers",
    safetyStatus: {
      pullRequestsMerged: false,
      pullRequestsClosed: false,
      pullRequestsRebased: false,
      productionUnlocked: false,
      externalBetaUnlocked: false,
      paidProductionUnlocked: false,
      runtimeExecutionUnlocked: false,
      supabaseWritesUnlocked: false,
    },
  };
  const blockers = {
    runId,
    generatedAt: packet.generatedAt,
    decision: packet.decision === "approved_for_future_frozen_batch_merge_execution"
      ? "no_active_approval_blockers"
      : "merge_execution_approval_blocked",
    draftDriftDecision: packet.draftDriftReview.decision,
    frozenBatchDecision: packet.frozenMergeBatch.decision,
    activeApprovalBlockers: packet.blockers,
    controlledBlockedMergeSets: packet.blockedFromFutureMerge,
  };

  jsonWrite("docs/github-merge-hygiene/draft-pr-drift-review.json", packet.draftDriftReview);
  textWrite("docs/github-merge-hygiene/draft-pr-drift-review.md", renderDraftDriftReviewMd(packet.draftDriftReview));
  jsonWrite("docs/github-merge-hygiene/live-pr-drift-tolerance-policy.json", packet.liveDriftTolerancePolicy);
  textWrite("docs/github-merge-hygiene/live-pr-drift-tolerance-policy.md", renderLiveDriftTolerancePolicyMd(packet.liveDriftTolerancePolicy));
  jsonWrite("docs/github-merge-hygiene/current-live-drift-review.json", packet.currentLiveDriftReview);
  textWrite("docs/github-merge-hygiene/current-live-drift-review.md", renderCurrentLiveDriftReviewMd(packet.currentLiveDriftReview));
  jsonWrite("docs/github-merge-hygiene/frozen-merge-batch.json", packet.frozenMergeBatch);
  textWrite("docs/github-merge-hygiene/frozen-merge-batch.md", renderFrozenMergeBatchMd(packet.frozenMergeBatch));
  jsonWrite("docs/github-merge-hygiene/frozen-batch-merge-order.json", packet.frozenBatchMergeOrder);
  textWrite("docs/github-merge-hygiene/frozen-batch-merge-order.md", renderFrozenBatchMergeOrderMd(packet.frozenBatchMergeOrder));
  jsonWrite("docs/github-merge-hygiene/duplicate-pr-risk-register.json", duplicateRiskRegister);
  textWrite("docs/github-merge-hygiene/duplicate-pr-risk-register.md", renderDuplicateMd(audit, packet.draftDriftReview));
  jsonWrite("docs/github-merge-hygiene/human-merge-order-approval-packet.json", packet);
  textWrite("docs/github-merge-hygiene/human-merge-order-approval-packet.md", renderApprovalPacketMd(packet));
  jsonWrite("docs/github-merge-hygiene/validation-exception-policy.json", packet.validationExceptionPolicy);
  textWrite("docs/github-merge-hygiene/validation-exception-policy.md", renderValidationExceptionPolicyMd(packet.validationExceptionPolicy));
  jsonWrite("docs/github-merge-hygiene/duplicate-pr-human-review-draft.json", packet.duplicateReview);
  textWrite("docs/github-merge-hygiene/duplicate-pr-human-review-draft.md", renderDuplicateReviewMd(packet.duplicateReview));
  jsonWrite("docs/github-merge-hygiene/reports/human_merge_order_approval_report.json", {
    runId,
    generatedAt: packet.generatedAt,
    decision: packet.decision,
    draftDriftDecision: packet.draftDriftReview.decision,
    frozenBatchDecision: packet.frozenMergeBatch.decision,
    frozenBatchSize: packet.frozenMergeBatch.batchSize,
    approvedFutureMergePrNumbers: packet.frozenMergeBatch.entries
      .filter((entry) => entry.approvedForFutureMerge)
      .map((entry) => entry.number),
    blockers: packet.blockers,
    executionStatus: packet.executionStatus,
    supabaseClassification: packet.supabaseClassification,
  });
  jsonWrite("docs/github-merge-hygiene/reports/merge_execution_readiness_report.json", readiness);
  jsonWrite("docs/github-merge-hygiene/reports/merge_execution_blocker_report.json", blockers);
  textWrite("docs/cross-chat/READ_FIRST_FOR_ALL_OWNERS.md", renderApprovalReadFirst(packet));
  textWrite("docs/cross-chat/CURRENT_HANDOFF.md", renderApprovalCurrentHandoff(packet));
  textWrite("docs/cross-chat/NEXT_UNLOCK_LANES.md", renderApprovalNextUnlockLanes(packet));
  textWrite("docs/implementation-prompts/prompt-github-merge-execution-parent-chain.md", renderMergeExecutionPrompt(packet));
  return packet;
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), "utf8"));
}

function updateEntryForPr337(entry, review) {
  if (!entry || entry.number !== 337 || review.decision !== "accepted_pr_337_new_head_sha") return entry;
  return {
    ...entry,
    state: review.sourcePr.state,
    isDraft: review.sourcePr.isDraft,
    mergeStateStatus: review.sourcePr.mergeStateStatus,
    baseRefName: review.sourcePr.baseRefName,
    headRefName: review.sourcePr.headRefName,
    headRefOid: review.liveHeadSha,
    previousFrozenHeadRefOid: review.frozenHeadSha,
    githubPrViewMetadataAvailable: true,
    githubPrViewMetadataError: null,
    updatedAt: review.sourcePr.updatedAt,
    approvedForFutureMerge: true,
    blocker: null,
    pr337HeadShaDriftReviewDecision: review.decision,
  };
}

function addPr337ReviewToCurrentLiveDriftReview(currentLiveDriftReview, review) {
  const summary = currentLiveDriftReview.summary || { warnings: [], blockers: [], resolved: [] };
  return {
    ...currentLiveDriftReview,
    pr337HeadShaDriftReview: {
      decision: review.decision,
      frozenHeadSha: review.frozenHeadSha,
      liveHeadSha: review.liveHeadSha,
      resultingDecision: review.frozenBatchUpdate.resultingDecision,
    },
    summary: {
      ...summary,
      warnings: (summary.warnings || []).filter((warning) => !/pr337|337|head_sha/i.test(warning)),
      blockers: review.decision === "accepted_pr_337_new_head_sha"
        ? (summary.blockers || []).filter((blocker) => !/pr337|337|head_sha/i.test(blocker))
        : [...new Set([...(summary.blockers || []), "pr337_head_sha_drift_pending_review"])],
      resolved: review.decision === "accepted_pr_337_new_head_sha"
        ? [...new Set([...(summary.resolved || []), "pr337_head_sha_drift_accepted"])]
        : summary.resolved || [],
    },
  };
}

function renderCurrentLiveDriftReviewWithPr337Md(review) {
  const base = renderCurrentLiveDriftReviewMd(review);
  if (!review.pr337HeadShaDriftReview) return base;
  return `${base}

## PR #337 Head SHA Drift Review

- Decision: \`${review.pr337HeadShaDriftReview.decision}\`
- Frozen SHA: \`${review.pr337HeadShaDriftReview.frozenHeadSha}\`
- Live SHA: \`${review.pr337HeadShaDriftReview.liveHeadSha}\`
- Resulting decision: \`${review.pr337HeadShaDriftReview.resultingDecision}\`
`;
}

function generatePr337HeadShaDriftArtifacts() {
  mkdirSync(hygieneDir, { recursive: true });
  mkdirSync(reportsDir, { recursive: true });
  mkdirSync(crossChatDir, { recursive: true });

  const generatedAt = new Date().toISOString();
  const review = buildPr337HeadShaDriftReview(generatedAt);
  jsonWrite("docs/github-merge-hygiene/pr-337-head-sha-drift-review.json", review);
  textWrite("docs/github-merge-hygiene/pr-337-head-sha-drift-review.md", renderPr337HeadShaDriftReviewMd(review));

  if (review.decision !== "accepted_pr_337_new_head_sha") {
    const readiness = readJson("docs/github-merge-hygiene/reports/merge_execution_readiness_report.json");
    const blockers = readJson("docs/github-merge-hygiene/reports/merge_execution_blocker_report.json");
    jsonWrite("docs/github-merge-hygiene/reports/merge_execution_readiness_report.json", {
      ...readiness,
      runId,
      generatedAt,
      decision: "blocked_pending_pr_337_human_review",
      mergeExecutionApprovedForFuturePhase: false,
      pr337HeadShaDriftReview: review,
      requiredNextAction: "resolve_pr_337_head_sha_drift_before_resuming_frozen_batch_merge",
    });
    jsonWrite("docs/github-merge-hygiene/reports/merge_execution_blocker_report.json", {
      ...blockers,
      runId,
      generatedAt,
      decision: "merge_execution_approval_blocked",
      pr337HeadShaDriftReview: review,
      activeApprovalBlockers: [
        ...(blockers.activeApprovalBlockers || []),
        {
          blocker: "blocked_pending_pr_337_human_review",
          status: "active",
          problems: review.blockers,
          frozenHeadSha: review.frozenHeadSha,
          liveHeadSha: review.liveHeadSha,
        },
      ],
    });
    return { review, packetDecision: "blocked_pending_pr_337_human_review" };
  }

  const frozenBatch = readJson("docs/github-merge-hygiene/frozen-merge-batch.json");
  const updatedFrozenBatch = {
    ...frozenBatch,
    generatedAt,
    pr337HeadShaDriftReview: {
      decision: review.decision,
      frozenHeadSha: review.frozenHeadSha,
      liveHeadSha: review.liveHeadSha,
    },
    entries: (frozenBatch.entries || []).map((entry) => updateEntryForPr337(entry, review)),
    blockers: (frozenBatch.blockers || []).filter((blocker) => blocker.number !== 337),
    batchSize: 27,
    approvedForFutureMergeExecution: true,
  };
  const updatedOrder = {
    ...readJson("docs/github-merge-hygiene/frozen-batch-merge-order.json"),
    generatedAt,
    decision: "frozen_batch_parent_first_order_ready",
    sequence: (readJson("docs/github-merge-hygiene/frozen-batch-merge-order.json").sequence || []).map((entry) =>
      entry.number === 337
        ? {
            ...entry,
            headRefOid: review.liveHeadSha,
            approvedForFutureMerge: true,
            blocker: null,
            verificationBeforeMerge:
              "gh pr view 337 --repo yuzastudio6-cyber/Reedkt --json state,isDraft,mergeStateStatus,headRefOid,baseRefName,headRefName",
            requiredBeforeMerge: [
              "state must remain OPEN",
              "isDraft must remain false",
              "mergeStateStatus must remain CLEAN",
              `headRefOid must equal ${review.liveHeadSha}`,
              "baseRefName must match the frozen batch entry unless the prior parent merge intentionally updated it and the batch is regenerated",
            ],
            pr337HeadShaDriftReviewDecision: review.decision,
          }
        : entry,
    ),
  };
  const packet = {
    ...readJson("docs/github-merge-hygiene/human-merge-order-approval-packet.json"),
    runId,
    generatedAt,
    decision: postPr337ShaUpdateDecision,
    pr337HeadShaDriftReview: review,
    frozenMergeBatch: updatedFrozenBatch,
    frozenBatchMergeOrder: updatedOrder,
    blockers: [],
    executionStatus: {
      pullRequestsMerged: false,
      pullRequestsClosed: false,
      pullRequestsRebased: false,
      runtimePathsExecuted: false,
      supabaseMutation: false,
      providerCalls: false,
      publicArtifactsCreated: false,
      signedUrlsIssued: false,
      productionUnlocked: false,
      externalBetaUnlocked: false,
      paidProductionUnlocked: false,
    },
  };
  const currentLiveDriftReview = addPr337ReviewToCurrentLiveDriftReview(
    readJson("docs/github-merge-hygiene/current-live-drift-review.json"),
    review,
  );
  const readiness = {
    ...readJson("docs/github-merge-hygiene/reports/merge_execution_readiness_report.json"),
    runId,
    generatedAt,
    decision: postPr337ShaUpdateDecision,
    mergeExecutionApprovedForFuturePhase: true,
    pr337HeadShaDriftReview: {
      decision: review.decision,
      frozenHeadSha: review.frozenHeadSha,
      liveHeadSha: review.liveHeadSha,
    },
    frozenBatchDecision: updatedFrozenBatch.decision,
    frozenBatchSize: updatedFrozenBatch.batchSize,
    frozenBatchPrNumbers: updatedFrozenBatch.entries.filter((entry) => entry.approvedForFutureMerge).map((entry) => entry.number),
    approvedFutureMergePrNumbers: updatedFrozenBatch.entries.filter((entry) => entry.approvedForFutureMerge).map((entry) => entry.number),
    requiredNextAction: "resume_frozen_batch_parent_chain_merge_execution_from_pr_298",
  };
  const blockerReport = {
    ...readJson("docs/github-merge-hygiene/reports/merge_execution_blocker_report.json"),
    runId,
    generatedAt,
    decision: "no_active_approval_blockers",
    pr337HeadShaDriftReview: {
      decision: review.decision,
      frozenHeadSha: review.frozenHeadSha,
      liveHeadSha: review.liveHeadSha,
    },
    activeApprovalBlockers: [],
  };

  jsonWrite("docs/github-merge-hygiene/frozen-merge-batch.json", updatedFrozenBatch);
  textWrite("docs/github-merge-hygiene/frozen-merge-batch.md", renderFrozenMergeBatchMd(updatedFrozenBatch));
  jsonWrite("docs/github-merge-hygiene/frozen-batch-merge-order.json", updatedOrder);
  textWrite("docs/github-merge-hygiene/frozen-batch-merge-order.md", renderFrozenBatchMergeOrderMd(updatedOrder));
  jsonWrite("docs/github-merge-hygiene/human-merge-order-approval-packet.json", packet);
  textWrite("docs/github-merge-hygiene/human-merge-order-approval-packet.md", renderApprovalPacketMd(packet));
  jsonWrite("docs/github-merge-hygiene/current-live-drift-review.json", currentLiveDriftReview);
  textWrite("docs/github-merge-hygiene/current-live-drift-review.md", renderCurrentLiveDriftReviewWithPr337Md(currentLiveDriftReview));
  jsonWrite("docs/github-merge-hygiene/reports/human_merge_order_approval_report.json", {
    ...readJson("docs/github-merge-hygiene/reports/human_merge_order_approval_report.json"),
    runId,
    generatedAt,
    decision: postPr337ShaUpdateDecision,
    pr337HeadShaDriftReview: {
      decision: review.decision,
      frozenHeadSha: review.frozenHeadSha,
      liveHeadSha: review.liveHeadSha,
    },
    frozenBatchDecision: updatedFrozenBatch.decision,
    frozenBatchSize: updatedFrozenBatch.batchSize,
    approvedFutureMergePrNumbers: updatedFrozenBatch.entries.filter((entry) => entry.approvedForFutureMerge).map((entry) => entry.number),
    blockers: [],
  });
  jsonWrite("docs/github-merge-hygiene/reports/merge_execution_readiness_report.json", readiness);
  jsonWrite("docs/github-merge-hygiene/reports/merge_execution_blocker_report.json", blockerReport);
  textWrite("docs/cross-chat/READ_FIRST_FOR_ALL_OWNERS.md", renderApprovalReadFirst(packet));
  textWrite("docs/cross-chat/CURRENT_HANDOFF.md", renderApprovalCurrentHandoff(packet));
  textWrite("docs/cross-chat/NEXT_UNLOCK_LANES.md", renderApprovalNextUnlockLanes(packet));
  textWrite("docs/implementation-prompts/prompt-github-merge-execution-parent-chain.md", renderMergeExecutionPrompt(packet));
  return { review, packetDecision: packet.decision };
}

function generateArtifacts(metadata, audit) {
  mkdirSync(hygieneDir, { recursive: true });
  mkdirSync(reportsDir, { recursive: true });
  mkdirSync(crossChatDir, { recursive: true });

  const openPrStackMap = {
    runId,
    generatedAt: metadata.generatedAt,
    repo: metadata.repo,
    selectedBaseBranch: metadata.baseSelectionEvidence.selectedBaseBranch,
    defaultBranchObserved: metadata.defaultBranch,
    openPrListLimitHit: metadata.openPrListLimitHit,
    openLimit200Count: metadata.openLimit200Count,
    openPrListHigherLimitUsed: metadata.openPrListHigherLimitUsed,
    openPrCount: metadata.openPrCount,
    draftPrCount: audit.draftPrs.length,
    mergeStateCounts: countsBy(audit.stackMap, "mergeStateStatus"),
    workstreamCounts: countsBy(audit.stackMap, "workstream"),
    classificationCounts: countsBy(audit.stackMap, "classification"),
    baseSelectionEvidence: metadata.baseSelectionEvidence,
    parentChildEdges: audit.parentChildEdges,
    pullRequests: audit.stackMap,
    closedSample: {
      count: metadata.closedSampleCount,
      onlyPr31: metadata.closedSampleOnlyPr31,
      pullRequests: metadata.closedSample,
    },
    pr346: audit.pr346 || metadata.pr346,
    pr346PromptExpectation: {
      expectedOpenDraftCleanNotMerged: true,
      currentMetadataMatchesExpectation:
        metadata.pr346.state === "OPEN" && metadata.pr346.isDraft === true && metadata.pr346.mergeStateStatus === "CLEAN",
      note:
        metadata.pr346.state === "OPEN"
          ? "PR #346 is open in current metadata; draft and parent-chain status still require review before merge."
          : "PR #346 is not open in current metadata; the prompt's open/draft/not-merged observation is stale.",
    },
  };

  const canonicalMergeOrder = {
    runId,
    generatedAt: metadata.generatedAt,
    decision: "human_review_required_parent_before_child",
    notes: [
      "This is a recommended review order, not an automatic merge order.",
      "Draft PRs are never merge-now.",
      "Clean merge state still requires parent-chain review.",
    ],
    canonicalOrder: audit.canonicalOrder,
  };

  const duplicateRiskRegister = {
    runId,
    generatedAt: metadata.generatedAt,
    decision: "duplicate_parallel_lanes_require_owner_review",
    entries: audit.duplicateRiskEntries,
  };

  const auditReport = {
    runId,
    generatedAt: metadata.generatedAt,
    auditStatus: "passed",
    decision: "open_pr_stack_audit_completed_ready_for_human_merge_order_review",
    repo: metadata.repo,
    branch: "codex/rp-github-merge-hygiene-open-pr-stack-audit",
    baseBranch: "codex/rp-activation-52h-cross-workstream-handoff-tracking",
    defaultBranchObserved: metadata.defaultBranch,
    baseSelectionEvidence: metadata.baseSelectionEvidence,
    openPrListLimitHit: metadata.openPrListLimitHit,
    openLimit200Count: metadata.openLimit200Count,
    openPrListHigherLimitUsed: metadata.openPrListHigherLimitUsed,
    openPrCount: metadata.openPrCount,
    draftPrCount: audit.draftPrs.length,
    mergeStateCounts: countsBy(audit.stackMap, "mergeStateStatus"),
    classificationCounts: countsBy(audit.stackMap, "classification"),
    closedSample: {
      count: metadata.closedSampleCount,
      onlyPr31: metadata.closedSampleOnlyPr31,
      pullRequests: metadata.closedSample,
    },
    pr346: audit.pr346 || metadata.pr346,
    pr346PromptExpectation: {
      expectedOpenDraftCleanNotMerged: true,
      currentMetadataMatchesExpectation:
        metadata.pr346.state === "OPEN" && metadata.pr346.isDraft === true && metadata.pr346.mergeStateStatus === "CLEAN",
      note:
        metadata.pr346.state === "OPEN"
          ? "PR #346 is open in current metadata; draft and parent-chain status still require review before merge."
          : "PR #346 is not open in current metadata; the prompt's open/draft/not-merged observation is stale.",
    },
    executionStatus: {
      pullRequestsMerged: false,
      pullRequestsClosed: false,
      pullRequestsRebased: false,
      runtimePathsExecuted: false,
      supabaseMutation: false,
      providerCalls: false,
      publicArtifactsCreated: false,
      signedUrlsIssued: false,
      productionUnlocked: false,
      externalBetaUnlocked: false,
      paidProductionUnlocked: false,
    },
    supabaseClassification: {
      updateRequired: "no",
      environmentTouched: "none",
      sql: "none",
      migrationDeployed: "no",
    },
  };

  const blockers = [
    {
      blocker: "human_merge_order_review_required",
      status: "active",
      reason: "The audit recommends parent-before-child order but does not authorize merges.",
    },
    {
      blocker: "draft_prs_present",
      status: audit.draftPrs.length > 0 ? "active" : "not_active",
      count: audit.draftPrs.length,
      reason: "Draft PRs are never merge-now.",
    },
    {
      blocker: "duplicate_parallel_lanes_present",
      status: audit.duplicateRiskEntries.some((entry) => entry.riskStatus === "parallel_or_duplicate_review_required")
        ? "active"
        : "not_active",
      lanes: audit.duplicateRiskEntries
        .filter((entry) => entry.riskStatus === "parallel_or_duplicate_review_required")
        .map((entry) => entry.id),
      reason: "Parallel lanes require owner selection before merge.",
    },
    {
      blocker: "open_pr_list_limit_hit_on_initial_fetch",
      status: metadata.openPrListLimitHit ? "observed_resolved_by_higher_limit_fetch" : "not_active",
      reason: "The first open PR list returned exactly 200 PRs; a higher limit was used for the audit.",
    },
    {
      blocker: "pr346_status_changed_after_prompt_snapshot",
      status:
        metadata.pr346.state === "OPEN" && metadata.pr346.isDraft
          ? "active"
          : metadata.pr346.state === "MERGED"
            ? "observed_resolved_by_merge_requires_stack_reinspection"
            : "not_active",
      reason:
        metadata.pr346.state === "OPEN"
          ? "PR #346 is open/draft and must not be treated as merge-ready until draft status and parent chain are resolved."
          : "PR #346 no longer matches the prompt's open/draft observation; downstream lanes require reinspection before merge.",
    },
  ];

  const readiness = {
    runId,
    generatedAt: metadata.generatedAt,
    auditReadyForHumanReview: true,
    mergeReadyNow: false,
    decision: "open_pr_stack_audit_completed_ready_for_human_merge_order_review",
    blockersActive: blockers.filter((blocker) => blocker.status === "active").map((blocker) => blocker.blocker),
    requiredNextAction: "human_review_canonical_merge_order_then_merge_parent_prs_first",
    safetyStatus: {
      productionUnlocked: false,
      externalBetaUnlocked: false,
      paidProductionUnlocked: false,
      runtimeExecutionUnlocked: false,
      workerToolProviderExecutionUnlocked: false,
      supabaseWritesUnlocked: false,
      publicArtifactsUnlocked: false,
      signedUrlsAsSourceOfTruthUnlocked: false,
      rawPromptExecutionUnlocked: false,
    },
  };

  jsonWrite("docs/github-merge-hygiene/open-pr-stack-map.json", openPrStackMap);
  jsonWrite("docs/github-merge-hygiene/canonical-merge-order.json", canonicalMergeOrder);
  jsonWrite("docs/github-merge-hygiene/duplicate-pr-risk-register.json", duplicateRiskRegister);
  jsonWrite("docs/github-merge-hygiene/reports/open_pr_stack_audit_report.json", auditReport);
  jsonWrite("docs/github-merge-hygiene/reports/merge_hygiene_readiness_report.json", readiness);
  jsonWrite("docs/github-merge-hygiene/reports/merge_hygiene_blocker_report.json", {
    runId,
    generatedAt: metadata.generatedAt,
    decision: "merge_hygiene_blockers_require_human_review",
    blockers,
  });
  textWrite("docs/github-merge-hygiene/open-pr-stack-map.md", renderOpenPrMapMd(metadata, audit));
  textWrite("docs/github-merge-hygiene/canonical-merge-order.md", renderCanonicalMd(audit));
  textWrite("docs/github-merge-hygiene/duplicate-pr-risk-register.md", renderDuplicateMd(audit));
  textWrite("docs/github-merge-hygiene/post-major-milestone-merge-rule.md", renderPostMajorRule());
  textWrite("docs/cross-chat/READ_FIRST_FOR_ALL_OWNERS.md", renderReadFirst());
  textWrite("docs/cross-chat/CURRENT_HANDOFF.md", renderCurrentHandoff(metadata, audit));
  textWrite("docs/cross-chat/OWNER_MATRIX.md", renderOwnerMatrix());
  textWrite("docs/cross-chat/BLOCKED_SCOPES.md", renderBlockedScopes());
  textWrite("docs/cross-chat/NEXT_UNLOCK_LANES.md", renderNextUnlockLanes());
}

function validateArtifacts() {
  const missing = requiredFiles.filter((relativePath) => !existsSync(path.join(root, relativePath)));
  const scannedFiles = requiredFiles.filter((relativePath) => existsSync(path.join(root, relativePath)));
  const forbiddenMatches = [];
  for (const relativePath of scannedFiles) {
    const text = readFileSync(path.join(root, relativePath), "utf8");
    for (const pattern of forbiddenUnlockPatterns) {
      if (pattern.test(text)) {
        forbiddenMatches.push({ file: relativePath, pattern: String(pattern) });
      }
    }
  }

  let reportStatus = "missing";
  let decision = "missing";
  let pr346State = null;
  let pr346ExpectationMatches = null;
  let openPrListLimitHit = null;
  let approvalDecision = "missing";
  let approvalPrSet = [];
  let validationExceptionAccepted = false;
  let mergeExecutionStarted = null;
  let draftDriftDecision = "missing";
  let draftDriftAccepted = false;
  let draftDriftActualPr = null;
  let frozenBatchDecision = "missing";
  let frozenBatchApproved = false;
  let frozenBatchPrSet = [];
  let frozenBatchBlockers = [];
  let frozenBatchApprovedMissingHeadSha = [];
  let frozenBatchPr337HeadSha = null;
  let pr337HeadShaDriftDecision = "missing";
  let pr337HeadShaAccepted = false;
  let pr337HeadShaReviewLiveSha = null;
  let pr337HeadShaReviewBlockers = [];
  let liveDriftPolicyDecision = "missing";
  let currentLiveDriftDecision = "missing";
  let mergePromptMentionsFrozenBatch = false;
  let postMergeDecision = "missing";
  let postMergeFrozenPrTotal = 0;
  let postMergeFrozenPrMergedCount = 0;
  let postMergeSourceBranchCount = 0;
  let postMergeBlockers = [];
  let postMergeMilestoneEvidencePassed = false;
  let postMergeExecutionCommentPresent = false;
  let postMergeBlockedScopeDecision = "missing";
  let postMergeBlockedScopesRemainBlocked = false;
  let crossChatMentionsFrozenBatchLanded = false;
  let crossChatMentionsToolStudyNext = false;
  try {
    const auditReport = JSON.parse(readFileSync(path.join(root, "docs/github-merge-hygiene/reports/open_pr_stack_audit_report.json"), "utf8"));
    reportStatus = auditReport.auditStatus;
    decision = auditReport.decision;
    pr346State = auditReport.pr346?.state ?? null;
    pr346ExpectationMatches = auditReport.pr346PromptExpectation?.currentMetadataMatchesExpectation ?? null;
    openPrListLimitHit = auditReport.openPrListLimitHit;
  } catch {
    // Missing report is handled by the missing file check.
  }
  try {
    const approvalReport = JSON.parse(readFileSync(path.join(root, "docs/github-merge-hygiene/reports/human_merge_order_approval_report.json"), "utf8"));
    approvalDecision = approvalReport.decision;
    approvalPrSet = approvalReport.approvedFutureMergePrNumbers || [];
    mergeExecutionStarted = approvalReport.executionStatus?.pullRequestsMerged ?? null;
  } catch {
    // Missing report is handled by the missing file check.
  }
  try {
    const validationPolicy = JSON.parse(readFileSync(path.join(root, "docs/github-merge-hygiene/validation-exception-policy.json"), "utf8"));
    validationExceptionAccepted = validationPolicy.acceptedForFutureMergeExecution === true;
  } catch {
    // Missing policy is handled by the missing file check.
  }
  try {
    const driftReview = JSON.parse(readFileSync(path.join(root, "docs/github-merge-hygiene/draft-pr-drift-review.json"), "utf8"));
    draftDriftDecision = driftReview.decision;
    draftDriftAccepted = driftReview.driftInterpretation?.draftSetReplacementAccepted === true;
    draftDriftActualPr = driftReview.actualDraftPr || null;
  } catch {
    // Missing review is handled by the missing file check.
  }
  try {
    const policy = JSON.parse(readFileSync(path.join(root, "docs/github-merge-hygiene/live-pr-drift-tolerance-policy.json"), "utf8"));
    liveDriftPolicyDecision = policy.decision;
  } catch {
    // Missing policy is handled by the missing file check.
  }
  try {
    const driftReview = JSON.parse(readFileSync(path.join(root, "docs/github-merge-hygiene/current-live-drift-review.json"), "utf8"));
    currentLiveDriftDecision = driftReview.decision;
  } catch {
    // Missing review is handled by the missing file check.
  }
  try {
    const batch = JSON.parse(readFileSync(path.join(root, "docs/github-merge-hygiene/frozen-merge-batch.json"), "utf8"));
    frozenBatchDecision = batch.decision;
    frozenBatchApproved = batch.approvedForFutureMergeExecution === true;
    frozenBatchPrSet = (batch.entries || [])
      .filter((entry) => entry.approvedForFutureMerge === true)
      .map((entry) => entry.number);
    frozenBatchBlockers = batch.blockers || [];
    frozenBatchPr337HeadSha = (batch.entries || []).find((entry) => entry.number === 337)?.headRefOid || null;
    frozenBatchApprovedMissingHeadSha = (batch.entries || [])
      .filter((entry) => entry.approvedForFutureMerge === true && !entry.headRefOid)
      .map((entry) => entry.number);
  } catch {
    // Missing batch is handled by the missing file check.
  }
  try {
    const review = JSON.parse(readFileSync(path.join(root, "docs/github-merge-hygiene/pr-337-head-sha-drift-review.json"), "utf8"));
    pr337HeadShaDriftDecision = review.decision;
    pr337HeadShaAccepted = review.frozenBatchUpdate?.updateAllowed === true;
    pr337HeadShaReviewLiveSha = review.liveHeadSha || null;
    pr337HeadShaReviewBlockers = review.blockers || [];
  } catch {
    // Missing review is handled by the missing file check.
  }
  try {
    const prompt = readFileSync(path.join(root, "docs/implementation-prompts/prompt-github-merge-execution-parent-chain.md"), "utf8");
    mergePromptMentionsFrozenBatch =
      /frozen-merge-batch\.json/.test(prompt) &&
      /approvedForFutureMerge=true/.test(prompt) &&
      /head SHA/i.test(prompt);
  } catch {
    // Missing prompt is handled by the missing file check.
  }
  try {
    const report = JSON.parse(
      readFileSync(path.join(root, "docs/github-merge-hygiene/reports/post_merge_source_of_truth_verification_report.json"), "utf8"),
    );
    postMergeDecision = report.decision;
    postMergeFrozenPrTotal = report.frozenPrVerification?.total || 0;
    postMergeFrozenPrMergedCount = report.frozenPrVerification?.mergedWithMergedAt || 0;
    postMergeSourceBranchCount = report.frozenPrVerification?.sourceBranchesPresent || 0;
    postMergeBlockers = report.blockers || [];
    postMergeMilestoneEvidencePassed = (report.milestoneEvidence || []).every((entry) => entry.status === "passed");
    postMergeExecutionCommentPresent = report.executionComment?.present === true;
  } catch {
    // Missing report is handled by the missing file check.
  }
  try {
    const report = JSON.parse(
      readFileSync(path.join(root, "docs/github-merge-hygiene/reports/post_merge_blocked_scope_verification_report.json"), "utf8"),
    );
    postMergeBlockedScopeDecision = report.decision;
    postMergeBlockedScopesRemainBlocked = report.blockedScopesRemainBlocked === true;
  } catch {
    // Missing report is handled by the missing file check.
  }
  try {
    const handoffText = [
      "docs/cross-chat/CURRENT_HANDOFF.md",
      "docs/cross-chat/READ_FIRST_FOR_ALL_OWNERS.md",
      "docs/cross-chat/NEXT_UNLOCK_LANES.md",
    ]
      .map((relativePath) => readFileSync(path.join(root, relativePath), "utf8"))
      .join("\n");
    crossChatMentionsFrozenBatchLanded = /frozen batch (?:of )?27 PRs is merged|Frozen batch merged: 27\/27/i.test(handoffText);
    crossChatMentionsToolStudyNext = /TOOL-STUDY-0/i.test(handoffText);
  } catch {
    // Missing docs are handled by the missing file check.
  }

  const failures = [];
  if (missing.length > 0) failures.push(`missing required files: ${missing.join(", ")}`);
  if (forbiddenMatches.length > 0) {
    failures.push(`forbidden unlock language found: ${forbiddenMatches.map((match) => `${match.file} ${match.pattern}`).join("; ")}`);
  }
  if (reportStatus !== "passed") failures.push(`audit report status is ${reportStatus}`);
  if (decision !== "open_pr_stack_audit_completed_ready_for_human_merge_order_review") failures.push(`unexpected decision ${decision}`);
  if (!["OPEN", "MERGED"].includes(pr346State)) failures.push(`PR #346 must be recorded from live metadata; got ${pr346State}`);
  if (pr346State === "OPEN" && pr346ExpectationMatches !== true) {
    failures.push("PR #346 is open but does not match the expected draft/clean hold metadata");
  }
  if (!allowedApprovalDecisions.includes(approvalDecision)) {
    failures.push(`unexpected merge approval decision ${approvalDecision}`);
  }
  if (!sameNumberSet(approvalPrSet, approvedFutureMergePrNumbers)) {
    failures.push(`approval PR set mismatch: ${approvalPrSet.join(",")}`);
  }
  if (!validationExceptionAccepted) failures.push("validation exception policy is not accepted for future merge execution");
  if (draftDriftDecision !== "accepted_draft_drift_to_352" || !draftDriftAccepted) {
    failures.push(`draft PR drift review is not accepted: ${draftDriftDecision}`);
  }
  if (
    draftDriftActualPr?.number !== 352 ||
    draftDriftActualPr?.state !== "OPEN" ||
    draftDriftActualPr?.isDraft !== true ||
    draftDriftActualPr?.mergeStateStatus !== "CLEAN"
  ) {
    failures.push("draft PR drift review must record PR #352 as open/draft/clean");
  }
  if (liveDriftPolicyDecision !== "live_drift_tolerance_policy_active_for_frozen_merge_batch") {
    failures.push(`unexpected live drift policy decision ${liveDriftPolicyDecision}`);
  }
  if (currentLiveDriftDecision !== "live_drift_review_completed_for_frozen_batch") {
    failures.push(`unexpected current live drift review decision ${currentLiveDriftDecision}`);
  }
  if (frozenBatchDecision !== "approved_for_future_frozen_batch_merge_execution") {
    failures.push(`unexpected frozen batch decision ${frozenBatchDecision}`);
  }
  if (!frozenBatchApproved) failures.push("frozen merge batch is not approved for future merge execution");
  if (!sameNumberSet(frozenBatchPrSet, approvedFutureMergePrNumbers)) {
    failures.push(`frozen batch PR set mismatch: ${frozenBatchPrSet.join(",")}`);
  }
  if (frozenBatchBlockers.length > 0) failures.push(`frozen batch blockers present: ${JSON.stringify(frozenBatchBlockers)}`);
  if (frozenBatchApprovedMissingHeadSha.length > 0) {
    failures.push(`frozen batch approved entries missing headRefOid: ${frozenBatchApprovedMissingHeadSha.join(",")}`);
  }
  if (approvalDecision === postPr337ShaUpdateDecision) {
    if (pr337HeadShaDriftDecision !== "accepted_pr_337_new_head_sha" || !pr337HeadShaAccepted) {
      failures.push(`PR #337 SHA drift review not accepted: ${pr337HeadShaDriftDecision}`);
    }
    if (pr337HeadShaReviewLiveSha !== pr337AcceptedHeadSha) {
      failures.push(`PR #337 drift review live SHA mismatch: ${pr337HeadShaReviewLiveSha}`);
    }
    if (frozenBatchPr337HeadSha !== pr337AcceptedHeadSha) {
      failures.push(`frozen batch PR #337 SHA mismatch: ${frozenBatchPr337HeadSha}`);
    }
    if (pr337HeadShaReviewBlockers.length > 0) {
      failures.push(`PR #337 SHA drift review blockers present: ${pr337HeadShaReviewBlockers.join(",")}`);
    }
  }
  if (!mergePromptMentionsFrozenBatch) {
    failures.push("merge execution prompt must require frozen-merge-batch.json, approvedForFutureMerge=true, and head SHA verification");
  }
  if (mergeExecutionStarted !== false) failures.push("approval report must record no PR merges in this phase");
  if (postMergeDecision !== "post_merge_source_of_truth_verification_passed") {
    failures.push(`unexpected post-merge source-of-truth decision ${postMergeDecision}`);
  }
  if (postMergeFrozenPrTotal !== 27 || postMergeFrozenPrMergedCount !== 27) {
    failures.push(`post-merge frozen PR verification mismatch: ${postMergeFrozenPrMergedCount}/${postMergeFrozenPrTotal}`);
  }
  if (postMergeSourceBranchCount !== 27) {
    failures.push(`post-merge source branch verification mismatch: ${postMergeSourceBranchCount}/27`);
  }
  if (postMergeBlockers.length > 0) {
    failures.push(`post-merge source-of-truth blockers present: ${postMergeBlockers.join(",")}`);
  }
  if (!postMergeMilestoneEvidencePassed) failures.push("post-merge milestone evidence did not all pass");
  if (!postMergeExecutionCommentPresent) failures.push("post-merge PR #350 execution comment evidence missing");
  if (postMergeBlockedScopeDecision !== "post_merge_blocked_scopes_verified" || !postMergeBlockedScopesRemainBlocked) {
    failures.push(`unexpected post-merge blocked-scope decision ${postMergeBlockedScopeDecision}`);
  }
  if (!crossChatMentionsFrozenBatchLanded) failures.push("cross-chat docs must mention frozen batch merged");
  if (!crossChatMentionsToolStudyNext) failures.push("cross-chat docs must mention TOOL-STUDY-0 next phase");

  if (failures.length > 0) {
    console.error(`[github-merge-hygiene] diagnostics failed: ${failures.join(" | ")}`);
    process.exit(1);
  }
  console.log(
    `[github-merge-hygiene] diagnostics passed: required files present, decision=${decision}, approval=${approvalDecision}, frozenBatch=${frozenBatchDecision}, draftDrift=${draftDriftDecision}, pr346State=${pr346State}, openPrListLimitHit=${openPrListLimitHit}`,
  );
}

function main() {
  if (writeConfirmed) {
    const metadata = buildMetadata();
    const audit = buildAudit(metadata);
    generateArtifacts(metadata, audit);
    console.log(
      `[github-merge-hygiene] wrote audit artifacts for ${metadata.openPrCount} open PRs; drafts=${audit.draftPrs.length}; openPrListLimitHit=${metadata.openPrListLimitHit}`,
    );
  }
  if (approvalWriteConfirmed) {
    const metadata = buildMetadata();
    const audit = buildAudit(metadata);
    const packet = generateApprovalArtifacts(metadata, audit);
    console.log(
      `[github-merge-hygiene] wrote merge approval artifacts; decision=${packet.decision}; approvedFutureMergePrs=${packet.approvedFutureMergePrNumbers.length}`,
    );
  } else {
    console.log("[github-merge-hygiene] merge approval write confirmations not set");
  }
  if (pr337DriftReviewConfirmed) {
    const result = generatePr337HeadShaDriftArtifacts();
    console.log(
      `[github-merge-hygiene] wrote PR #337 SHA drift review; decision=${result.review.decision}; packetDecision=${result.packetDecision}`,
    );
  } else {
    console.log("[github-merge-hygiene] PR #337 SHA drift review confirmations not set");
  }
  if (postMergeVerificationConfirmed) {
    const report = generatePostMergeSourceOfTruthArtifacts();
    console.log(
      `[github-merge-hygiene] wrote post-merge source-of-truth verification; decision=${report.decision}; frozenPrs=${report.frozenPrVerification.mergedWithMergedAt}/${report.frozenPrVerification.total}`,
    );
  } else {
    console.log("[github-merge-hygiene] post-merge source-of-truth verification confirmations not set");
  }
  validateArtifacts();
}

main();
