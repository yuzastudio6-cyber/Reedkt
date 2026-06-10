# Supabase Staging Reset Retry Backup/Export

- A private backup/export gate is required before reset retry.
- Backup artifacts stay in redacted temp storage outside the repository.
- Backup payloads are never committed, printed, or summarized beyond safe metadata.
- The reset retry remains blocked if the backup/export command or confirmation is missing.
