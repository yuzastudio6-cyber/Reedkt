# Data Privacy And Retention Plan

## Sensitive Data Categories

ReeditPro planning and future execution may involve:

- source video/audio
- transcripts
- browser captures
- generated assets
- provider prompts
- QA artifacts
- face, object, mask, safe-zone, and layout analysis
- documentary claim notes
- credit and billing records
- audit logs
- export files

## Privacy Defaults

- Source media is private.
- Generated assets are private.
- Processed media is private.
- QA artifacts are private.
- Browser captures are private.
- Previews and exports should use signed URLs later.
- Worker-temp files should have short retention.
- Audit events should be append-only.

## Browser Capture Privacy

Browser captures require user authorization and source awareness. Private dashboards, logged-in pages, and business systems need redaction planning before production capture.

ReeditPro must not capture sensitive information without approval and must not bypass auth, paywalls, CAPTCHAs, robots, rate limits, site restrictions, or privacy rules. Browser capture artifacts are private by default.

## Retention Planning

Suggested future retention:

- worker-temp: short retention, deleted aggressively after job completion
- failed generation temp assets: cleaned up after review window
- source media: retained while project exists unless user deletion/privacy policy requires removal
- generated assets: retained with project and asset history
- exports: retained based on plan and user settings
- QA artifacts: private, optionally shorter retention than source media
- audit logs: retained for compliance and operational traceability

## Non-Goals

No real retention policy is enforced in this task. No storage operations, deletion jobs, RLS execution, database connection, or backend privacy workflow is implemented.

