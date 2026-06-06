# Creative Graphics Cross-Chat Handoffs

Status: `blocked at repo_audit stage`

`docs/cross-chat/` exists on this base, but GD-0 keeps the AI Tools handoff summary in this workstream package so future GD prompts can find it directly.

## Handoffs

| Destination owner | Handoff | GD-0 position |
| --- | --- | --- |
| Track A render/export | Final render/export, Remotion production validation, public/private render artifacts | GD supplies graphics contracts only; Track A owns execution |
| Track B media processing | Sharp/libvips, OCR, media analysis, image/video processing | Out of GD scope |
| Maps/geospatial | Map rendering, map capture, map geospatial correctness | Out of GD scope |
| Sound/music/audio | Audio analysis, SFX, music, SoundSync runtime | Out of GD scope |
| Provider gateway/models | Provider calls, model routing, provider secrets | Out of GD scope |
| Worker runtime/jobs | Queue claiming, background workers, service-role execution | Out of GD scope |
| Supabase/storage/database | SQL, RLS, storage, signed URLs, persisted artifacts | Out of GD scope |
| Compliance/security | Privacy, claims safety, artifact publication safety | GD needs future review before runtime |
| Billing/credits | Credit reservation/spend/refund and Stripe | Out of GD scope |

## Guardrail

No handoff in GD-0 grants implementation authority. Every runtime capability remains blocked until its owner prompt, approval gates, and validation are complete.

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
