# Asset Merge/Reconciliation Policy

## Purpose

Asset merge/reconciliation attaches completed assets to the edit.

An asset is not complete just because a provider or future worker returns a file. It must be linked to:
- asset manifest,
- source work item,
- segment,
- visual asset plan item,
- timing cue,
- renderer layer,
- prompt plan,
- QA result,
- fallback/version status.

This policy is mock-only in the frontend. No asset storage, provider call, worker event, render, or media processing happens here.

## Merge steps

When an asset becomes ready:

1. Verify the asset belongs to this approved snapshot/project.
2. Update asset manifest status.
3. Store asset path/version.
4. Link to the visual asset plan item.
5. Link to the timing cue.
6. Link to the renderer layer.
7. Mark dependent work items ready.
8. Run asset QA.
9. If QA passes, mark merged.
10. If QA fails, trigger fallback or user review.

## Reconciliation decisions

- `attach_to_layer`: attach a ready asset to its renderer layer.
- `replace_placeholder`: replace a preview placeholder with the real asset.
- `update_timing`: adjust timing metadata for assets whose duration or cue changed.
- `rerender_required`: mark downstream renderer work as needing a future rerender.
- `request_fallback`: use approved fallback policy.
- `request_user_review`: ask the user before changing meaning, cost, route, or output.
- `archive_previous`: archive a replaced version.
- `no_action`: no merge action is needed yet.

## Asset versioning

Assets can have versions:
- first attempt,
- retry,
- fallback,
- user-approved replacement,
- provider alternate,
- manual replacement later.

Only one active asset should be selected for a required renderer layer. Replaced and fallback assets must keep lineage so future workers can resume safely and QA can explain what changed.

## Placeholder policy

Previews may use placeholders only if:
- the dependency allows `can_use_placeholder`,
- the user-facing preview clearly shows a placeholder state,
- final render does not use placeholders for required assets.

Final render must wait for required assets, QA, timing validation, trim review resolution, and approved snapshot readiness.

## Fallback and replacement

If an asset fails:
- retry the same provider if allowed,
- use fallback provider if allowed,
- downgrade to still/card when approved,
- use placeholder for preview only,
- ask user review,
- mark previous attempts failed/replaced.

Basic and Pro cannot fallback to Veo.

Premium may use Veo only as a final fallback/rescue for approved AI video assets. Veo must never become primary/default.

## Non-goals

No real asset storage, provider calls, provider status checks, webhooks, polling, worker execution, Remotion rendering, backend, Supabase, Google Cloud, billing, or media processing are implemented in this milestone.

## Agent QA + Fallback Integration

`AgentQAFallbackPlan` decides whether a failed or risky asset can be retried, fallbacked, reviewed, canceled, or kept blocked.

Merge can proceed only after QA gates and fallback decisions allow it. Required unresolved failures block final render; optional local failures can be isolated so unrelated work continues.

Basic/Pro cannot fallback to Veo, and Premium Veo remains final fallback only for approved AI video assets.
