# Creative Skill System Open PR Impact Map

This map records open PR overlap inspected for `RP-SKILLS-00` on June 24, 2026. It is a planning aid, not a merge decision.

## GitHub Access

Repository access was available through GitHub CLI:

- `gh auth status` succeeded for account `yuzastudio6-cyber`.
- `gh repo view yuzastudio6-cyber/Reedkt --json nameWithOwner,url,defaultBranchRef` succeeded.
- Repository: `yuzastudio6-cyber/Reedkt`
- URL: `https://github.com/yuzastudio6-cyber/Reedkt`
- Default branch reported by GitHub: `codex/reeditpro-web-ui-shell`

Local macOS git needed an explicit developer directory workaround:

- Plain git previously hit an Xcode developer path issue.
- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git ...` works in this repo.

## PR Scan Commands

Commands used:

```bash
gh pr list --repo yuzastudio6-cyber/Reedkt --state open --limit 200 --json number --jq 'length'
gh pr list --repo yuzastudio6-cyber/Reedkt --state open --search 'skill OR skills OR creative graphics OR AI graphics OR agent routing OR 3D OR canvas OR SoundSync' --limit 200 --json number --jq 'length'
gh pr list --repo yuzastudio6-cyber/Reedkt --state open --search '"AI graphics" OR "creative graphics" OR SoundSync OR SOUND OR "worker runtime" OR 3D OR canvas OR CesiumJS OR deck.gl' --limit 80 --json number,title,updatedAt,isDraft,headRefName
```

Observed results:

- At least 200 open PRs; the `--limit 200` query hit the limit.
- 147 open PRs matched the broad skill/tool/graphics/SoundSync search.
- The inspected overlap is large enough that future Creative Skill System work should reconcile with PR clusters before creating contracts or runtime.

## Impact Clusters

| Cluster | Representative open PRs | Impact on Creative Skill System |
| --- | --- | --- |
| AI graphics canonical agent routing | #638, #642, #645, #646, #656, #657, #661, #665, #668 | Reconcile before defining skill-owned agent routing, tool-owner selection, graphics planner ownership, or canonical selection policy. |
| AI graphics canonical agent selection | #671, #674, #677, #681, #683, #685, #686, #688, #689 | Do not introduce a separate Creative Skill agent selector. Future skills should consume the eventual canonical agent-selection source truth. |
| AI_TOOLS_CREATIVE_GRAPHICS | #423, #428, #432, #438, #445, #446, #449, #451, #454 | Avoid duplicating package proof, route manifests, fixture gates, local execution packets, or QA review lanes. |
| AI graphics metadata and worker dry-run | #456, #457, #458, #464, #468, #471, #473, #476, #478, #480, #482, #485, #493, #496, #498, #500, #503, #509, #515, #517, #521, #524, #526, #532 | Worker payload shape, metadata handoff, no-op worker gates, and runtime gates already have active review. Skills must not define worker payloads independently. |
| AI graphics package proof and capability studies | #543, #548, #550, #558, #562, #569, #585, #589, #594, #607, #612, #614, #616, #623 | Tool capability, ranking, proof promotion, package boundary, and owner assignment are active. Use existing tool registry and studies as source truth. |
| SoundSync, SOUND CPU, and sound worker runtime | #218, #258, #261, #676, #678, #687 | Reconcile before adding audio skill worker schemas, SoundSync execution contracts, SFX payloads, or CPU/static compatibility assumptions. |
| Supabase sound ownership | #244, #256, #257 | Do not add skill migrations or sound SQL. Supabase ownership and local mutation approvals are separate lanes. |
| 3D, maps, and browser/app visual tools | #157, #160, #163, #165, #169 | Treat CesiumJS, deck.gl, MapLibre, browser capture, and map/geospatial visuals as tool candidates and planning fixtures until runtime owners approve execution. |

## Recommendations

- Treat this audit as a docs-only layer. It should not compete with active PR work.
- Use `docs/tool-calling/*`, `open-source-tool-registry.md`, `src/lib/tool-registry.ts`, and `server/tool-registry/*` as tool candidate and runtime boundary source truths.
- Use `signature-systems.md`, `visual-storytelling-architecture.md`, and `src/types/signature-systems.ts` as signature-routing source truths.
- Use `soundsync-audio-pipeline-planning.md`, `docs/production-soundsync-*`, `src/types/audio-music.ts`, and `src/types/sfx-director.ts` as audio/SoundSync source truths.
- Use `job-orchestration-architecture.md`, `worker-tool-runtime-architecture.md`, `docs/production-worker-*`, and worker/job types as worker boundary source truths.

## Open PR Conclusion

The safest near-term Creative Skill System path is doctrine first, planning contract second, runtime later. Any skill system implementation that touches agent routing, creative graphics tools, SoundSync, worker payloads, provider prompts, or Supabase migrations would collide with active review lanes.
