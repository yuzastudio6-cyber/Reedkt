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
  "updatedAt",
  "url",
];
const closedFields = ["number", "title", "state", "mergedAt", "baseRefName", "headRefName", "url"];

const approvalRequiredFiles = [
  "docs/github-merge-hygiene/draft-pr-drift-review.json",
  "docs/github-merge-hygiene/draft-pr-drift-review.md",
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
];

const writeConfirmed =
  process.env.REEDITPRO_CONFIRM_GITHUB_MERGE_HYGIENE_AUDIT === "true" &&
  process.env.REEDITPRO_CONFIRM_CROSS_CHAT_HANDOFF_UPDATE === "true" &&
  process.env.REEDITPRO_CONFIRM_PR_STACK_ANALYSIS === "true";

const approvalWriteConfirmed =
  process.env.REEDITPRO_CONFIRM_GITHUB_MERGE_ORDER_REVIEW === "true" &&
  process.env.REEDITPRO_CONFIRM_HUMAN_MERGE_ORDER_APPROVAL_PACKET === "true" &&
  process.env.REEDITPRO_CONFIRM_CROSS_CHAT_HANDOFF_UPDATE === "true" &&
  process.env.REEDITPRO_CONFIRM_VALIDATION_EXCEPTION_REVIEW === "true";

const draftPrDriftAcceptanceConfirmed =
  process.env.REEDITPRO_CONFIRM_DRAFT_PR_DRIFT_ACCEPTANCE === "true";

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

const approvedFutureMergePrNumbers = [
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
  347,
];

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

const alreadyMergedEvidencePrNumbers = [341, 342, 346, 351];

const allowedApprovalDecisions = [
  "approved_for_future_parent_chain_merge_execution",
  "blocked_pending_human_merge_order_review",
  "blocked_pending_duplicate_pr_review",
  "blocked_pending_validation_exception_review",
  "blocked_pending_dirty_or_unstable_pr_review",
  "rejected_due_source_of_truth_risk",
];

const approvedFutureMergeStacks = [
  { id: "cross_chat_foundation", prNumbers: [205, 222] },
  { id: "supabase_trackb_clean_staging", prNumbers: [247, 248, 252, 259, 262, 265, 269, 271, 274, 276, 280, 283, 292, 298] },
  { id: "product_internal_testing", prNumbers: [299, 302, 306, 309, 311] },
  { id: "model_orchestration", prNumbers: [314, 318, 320, 322, 327, 337] },
  { id: "tool_route_execution_unlock_audit", prNumbers: [347] },
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
  const expectedDraftPrNumbers =
    draftDriftReview.decision === "accepted_draft_drift_to_352"
      ? driftAcceptedExpectedDraftPrNumbers
      : originalExpectedDraftPrNumbers;
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

  const blockers = [];
  if (metadata.openPrCount !== 347) {
    blockers.push({
      blocker: "open_pr_count_changed_since_approval_plan",
      status: "active",
      expected: 347,
      actual: metadata.openPrCount,
      decision: "blocked_pending_human_merge_order_review",
    });
  }
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
  if (!sameNumberSet(draftPrNumbers, expectedDraftPrNumbers)) {
    blockers.push({
      blocker:
        draftDriftReview.decision === "accepted_draft_drift_to_352"
          ? "draft_pr_set_changed_after_drift_acceptance"
          : "draft_pr_set_changed_since_approval_plan",
      status: "active",
      expected: expectedDraftPrNumbers,
      actual: draftPrNumbers,
      draftDriftDecision: draftDriftReview.decision,
      decision: "blocked_pending_human_merge_order_review",
    });
  }
  const expectedNonClean = Object.fromEntries(Object.entries(expectedNonCleanMergeStates).sort(([a], [b]) => Number(a) - Number(b)));
  if (JSON.stringify(nonCleanMergeStates) !== JSON.stringify(expectedNonClean)) {
    blockers.push({
      blocker: "dirty_or_unstable_pr_set_changed_since_approval_plan",
      status: "active",
      expected: expectedNonClean,
      actual: nonCleanMergeStates,
      decision: "blocked_pending_dirty_or_unstable_pr_review",
    });
  }
  const approvedProblems = approvedFutureMergePrNumbers
    .map((number) => {
      const pr = openByNumber.get(number);
      if (!pr) return { number, issue: "missing_from_open_pr_snapshot" };
      if (pr.isDraft) return { number, issue: "is_draft" };
      if (pr.mergeStateStatus !== "CLEAN") return { number, issue: `merge_state_${pr.mergeStateStatus}` };
      if (pr.classification !== "canonical") return { number, issue: `classification_${pr.classification}` };
      return null;
    })
    .filter(Boolean);
  if (approvedProblems.length > 0) {
    blockers.push({
      blocker: "approved_future_merge_set_not_clean_canonical",
      status: "active",
      problems: approvedProblems,
      decision: "blocked_pending_human_merge_order_review",
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

  let decision = "approved_for_future_parent_chain_merge_execution";
  const firstBlockingDecision = blockers.find((blocker) => blocker.status === "active")?.decision;
  if (firstBlockingDecision) decision = firstBlockingDecision;

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
    packet.decision === "approved_for_future_parent_chain_merge_execution"
      ? "Approved Future Merge PRs"
      : "Candidate Future Merge PRs - Held Until Blocker Resolution";
  return `# Human Merge Order Approval Packet

Decision: \`${packet.decision}\`

This packet approves only a future parent-chain merge execution phase. It does not merge, close, rebase, retarget, or unlock runtime/product scopes.

## Draft Drift Review

- Decision: \`${packet.draftDriftReview.decision}\`
- Expected draft PR: #${packet.draftDriftReview.expectedDraftPrNumber}
- Actual draft PR: #${packet.draftDriftReview.actualDraftPrNumber}
- PR #351 state: \`${packet.draftDriftReview.expectedDraftPr.state || "unavailable"}\`
- PR #352 title: ${packet.draftDriftReview.actualDraftPr.title || "unavailable"}
- PR #352 base/head: \`${packet.draftDriftReview.actualDraftPr.baseRefName || "unavailable"}\` -> \`${packet.draftDriftReview.actualDraftPr.headRefName || "unavailable"}\`
- PR #352 draft/merge state: \`${packet.draftDriftReview.actualDraftPr.isDraft}\` / \`${packet.draftDriftReview.actualDraftPr.mergeStateStatus || "unavailable"}\`
- Draft-set replacement accepted: \`${packet.draftDriftReview.driftInterpretation.draftSetReplacementAccepted}\`

## ${mergeSetHeading}

${markdownTable(packet.approvedFutureMergePrs, [
  { label: "PR", value: (row) => `#${row.number}` },
  { label: "Title", value: (row) => row.title },
  { label: "Base", value: (row) => `\`${row.baseRefName}\`` },
  { label: "Head", value: (row) => `\`${row.headRefName}\`` },
  { label: "Merge state", value: (row) => row.mergeStateStatus },
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
- Merge execution still requires a separate parent-chain execution prompt.
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
5. Check live GitHub merge status before building on a PR.
6. Follow \`docs/github-merge-hygiene/post-major-milestone-merge-rule.md\`.

This packet does not authorize PR merges by itself; it authorizes only a future parent-chain merge execution phase for the exact approved set.
`;
}

function renderApprovalNextUnlockLanes(packet) {
  return `# Next Unlock Lanes

Recommended next phase:

- If \`${packet.decision}\` remains approved, run \`GITHUB_MERGE_HYGIENE - parent-chain merge execution\`.
- Merge parent PRs first and verify merged commits after each merge.
- Do not merge drafts, dirty/unstable PRs, duplicate-risk PRs, or non-canonical PRs.

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
    packet.decision === "approved_for_future_parent_chain_merge_execution"
      ? "This prompt may be used only in a separate execution phase after PR #350 lands."
      : `Do not use this prompt for merge execution yet. Current approval decision is \`${packet.decision}\`; resolve the blocker report first.`;
  return `# GitHub Merge Hygiene Parent-Chain Merge Execution

${executionStatus}

Candidate merge targets are exactly:

${packet.approvedFutureMergePrNumbers.map((number) => `- #${number}`).join("\n")}

Rules:

- Merge parent PRs first.
- Do not merge draft PRs.
- Do not merge dirty or unstable PRs.
- Do not merge duplicate-risk PRs unless they are explicitly marked canonical in the approval packet.
- Verify the target branch contains each merged commit after every merge.
- Stop on any changed merge state, new conflict, missing parent, or unexpected CI/validation category.
- Do not execute runtime paths, mutate Supabase, call providers, run workers/tools/routes, process media, create public artifacts, issue signed URLs, deploy production, unlock external beta, unlock paid production, or execute raw prompts.
`;
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
    mergeExecutionApprovedForFuturePhase: packet.decision === "approved_for_future_parent_chain_merge_execution",
    mergeExecutionStarted: false,
    draftDriftDecision: packet.draftDriftReview.decision,
    approvedFutureMergePrNumbers: packet.approvedFutureMergePrNumbers,
    blockedFromFutureMerge: packet.blockedFromFutureMerge,
    requiredNextAction:
      packet.decision === "approved_for_future_parent_chain_merge_execution"
        ? "run_separate_parent_chain_merge_execution_prompt"
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
    decision: packet.decision === "approved_for_future_parent_chain_merge_execution"
      ? "no_active_approval_blockers"
      : "merge_execution_approval_blocked",
    draftDriftDecision: packet.draftDriftReview.decision,
    activeApprovalBlockers: packet.blockers,
    controlledBlockedMergeSets: packet.blockedFromFutureMerge,
  };

  jsonWrite("docs/github-merge-hygiene/draft-pr-drift-review.json", packet.draftDriftReview);
  textWrite("docs/github-merge-hygiene/draft-pr-drift-review.md", renderDraftDriftReviewMd(packet.draftDriftReview));
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
    approvedFutureMergePrNumbers: packet.approvedFutureMergePrNumbers,
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
  if (mergeExecutionStarted !== false) failures.push("approval report must record no PR merges in this phase");

  if (failures.length > 0) {
    console.error(`[github-merge-hygiene] diagnostics failed: ${failures.join(" | ")}`);
    process.exit(1);
  }
  console.log(
    `[github-merge-hygiene] diagnostics passed: required files present, decision=${decision}, approval=${approvalDecision}, draftDrift=${draftDriftDecision}, pr346State=${pr346State}, openPrListLimitHit=${openPrListLimitHit}`,
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
  validateArtifacts();
}

main();
