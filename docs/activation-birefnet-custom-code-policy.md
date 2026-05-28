# Activation BiRefNet Custom Code Policy

The Phase 33B snapshot includes:

- `BiRefNet_config.py`
- `birefnet.py`
- `handler.py`

Phase 33C permits local execution only of `BiRefNet_config.py` and `birefnet.py`
through `AutoModelForImageSegmentation.from_pretrained(local_path,
trust_remote_code=True, local_files_only=True)`.

`handler.py` is scanned and recorded but never imported. Its network-capable
endpoint helper behavior is a warning, not a blocker, because it is outside the
runtime executed allowlist.

Network imports, shell execution, or unsafe writes in executed allowlist files
block runtime execution.
