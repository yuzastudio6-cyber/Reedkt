# Upstream Source Review

Text-only source inspection found PaddleX source metadata for `PingFang-SC-Regular.ttf` in `paddlex/utils/fonts.py`, including the runtime URL pattern under `paddle-model-ecology.bj.bcebos.com`. PaddleX issue metadata also confirms offline users encounter this font fetch and that `PADDLE_PDX_LOCAL_FONT_FILE_PATH` / `PADDLE_PDX_CACHE_HOME` are relevant controls.

This proves a requesting component and URL pattern. It does not prove the exact font asset license, redistribution rights, checksum, or stable version identity. The TTF was not fetched.

Conclusion: source identity is partially observed, but not sufficient for private staging approval.
