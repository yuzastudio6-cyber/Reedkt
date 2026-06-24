# Rollback And Cleanup Policy

Future rollback paths:

- `/etc/apt/sources.list.d/gpac.sources`
- `/usr/share/keyrings/gpac-archive-keyring.gpg`
- `/etc/apt/preferences.d/gpac.pref`

Future cleanup must remove temporary key downloads and `/var/lib/apt/lists/*`. If source setup fails, the future execution lane must remove the partially written source or preferences file before exiting.

If `gpac` is installed in a future approved execution lane and rollback is explicitly authorized, rollback may purge `gpac` and run autoremove. That purge/rollback behavior is not approved in this metadata phase.

Failure policy: key mismatch blocks before source mutation; missing Release metadata blocks before install; unexpected package candidate blocks without install; install failure records sanitized evidence and requests a follow-up.
