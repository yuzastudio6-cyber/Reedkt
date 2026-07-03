# Command Source Inventory

| Kind | Command | Exact enough | Build required | Run required | Local host | Media referenced |
| --- | --- | --- | --- | --- | --- | --- |
| inner_command | `ffmpeg -version` | false | false | false | false | false |
| inner_command | `ffprobe -version` | false | false | false | false | false |
| build_wrapper_pattern | `docker build -f docker/prod/render-worker/Dockerfile -t "$(image_name reeditpro-render-worker)" .` | false | true | false | false | false |
| docker_run_wrapper_pattern | `docker run --rm --env REEDITPRO_READINESS_MODE=container_runtime --env REEDITPRO_CONTAINER_IMAGE_ROLE=render_worker "${REEDITPRO_RENDER_WORKER_IMAGE}" npm run prod:readiness:summary -- --mode=static_only` | false | false | true | false | false |
| future_exact_build_command | `docker build -f docker/prod/render-worker/Dockerfile -t reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-<source-sha> .` | true | true | false | false | false |
| future_exact_container_probe_command | `docker run --rm --network none --entrypoint ffmpeg reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-<source-sha> -version` | true | false | true | false | false |
| future_exact_container_probe_command | `docker run --rm --network none --entrypoint ffprobe reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-<source-sha> -version` | true | false | true | false | false |

Current phase commands run: `false`.
