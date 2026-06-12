# Worker Runtime Execution Blocker Policy

Blocked in this phase: raw prompt execution, unapproved snapshot execution, provider-response direct execution, tool-route direct execution, broad media processing, public output, production writes, frontend secret access, arbitrary subprocess/path execution, Docker, Cloud Run, and Cloud Build.

The next phase may design a synthetic worker dry-run approval packet only; it still cannot execute real tools or process media unless separately approved.
