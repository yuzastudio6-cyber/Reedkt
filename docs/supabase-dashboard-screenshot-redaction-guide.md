# Supabase Dashboard Screenshot Redaction Guide

Prompt 24C does not access the Supabase dashboard. This guide tells a human/operator how to create safe evidence screenshots if screenshots are used.

## Screenshot Safely

- Hide secrets before taking the screenshot.
- Crop to the smallest useful dashboard area.
- Blur or cover project refs, account identifiers, API keys, connection strings, tokens, and private object paths.
- Prefer table/policy/function lists over detail pages that reveal values.
- Record screenshot purpose, environment label, collection date, and redaction status in the matching Markdown evidence file.

## Safe Screenshot Types

- Project overview with project ref redacted.
- Migration list with filenames/status only.
- Table list with no row data.
- Policy list with names and enabled state only.
- Bucket list with public/private state.
- Auth provider list with no keys or secrets.
- Function list with no environment values.
- Activity summary with timestamps/actions only and no payloads.

## Unsafe Screenshot Types

- API settings page with keys visible.
- Connection string page.
- JWT secret page.
- Database password page.
- Secret Manager payload page.
- Logs with request or response payloads.
- Storage object detail pages with signed URLs or private media paths.
- User rows, profile rows, or auth user PII.

## Redaction Checklist

- Project ref redacted if policy requires it.
- Account emails and private principals redacted.
- Keys and tokens absent.
- Connection strings absent.
- Signed URLs absent.
- Real user row data absent.
- Private media paths absent.
- The evidence file says what was intentionally hidden.

Screenshots are evidence only after Prompt 24D or a later review prompt checks them. Prompt 24C templates and guidance are not supplied evidence.
