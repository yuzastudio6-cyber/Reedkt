# Map Animation Settings Catalog

## Purpose

This catalog defines the structured map settings ReeditPro should plan for location, route, neighborhood, documentary, and foreground-aware map visuals. These settings are mock planning fields only. They do not execute MapLibre, Turf, deck.gl, CesiumJS, geocoding, tile fetching, or rendering.

## Map Data Settings

- `mapDataSource`: user-provided location, script location, clip metadata, manual coordinates, approximate region, fictional location, or unknown.
- `locationLabel`: readable label for the map location.
- `locationConfidence`: exact, approximate, unknown, or fictional.
- `coordinates`: longitude/latitude pair when approved and known.
- `approximateRegion`: region label when exact coordinates are unavailable.
- `routeCoordinates`: route points when approved and known.
- `regionGeometry`: planned GeoJSON/geometry placeholder for region highlights.
- `sourceNeeded`: whether a source is needed before treating the location as factual.
- `sourceLabel`: citation/source label if known.
- `safeLocationWording`: phrasing such as “reported location,” “approximate location,” or “location mentioned in the story.”

## Map Style Settings

- `mapStyleFamily`
- `baseMapStyle`
- `labelDensity`
- `colorPalette`
- `roadVisibility`
- `buildingVisibility`
- `terrainVisibility`
- `waterVisibility`
- `borderVisibility`
- `markerColor`
- `routeColor`
- `highlightColor`
- `documentaryNeutrality`
- `brandColorUse`
- `darkMode`

## Camera Settings

- `centerCoordinates`
- `zoom`
- `bearing`
- `pitch`
- `cameraPath`
- `flyDuration`
- `flySpeed`
- `curve`
- `easing`
- `fitBounds`
- `padding`
- `startZoom`
- `endZoom`
- `startBearing`
- `endBearing`
- `startPitch`
- `endPitch`

## Animation Settings

- `animationType`
- `pinDropTiming`
- `routeRevealDuration`
- `routeDrawDirection`
- `regionHighlightTiming`
- `labelRevealTiming`
- `cameraMoveTiming`
- `holdDuration`
- `transitionIn`
- `transitionOut`
- `mapBeatSyncCueId`
- `soundSyncCue`

## Layout Settings

- `layoutMode`
- `frameTemplate`
- `mapZone`
- `speakerZone`
- `captionSafeZone`
- `safeMargins`
- `panelBackgroundColor`
- `foregroundMaskAware`
- `expectedForegroundZone`
- `labelAvoidZones`

## Depth-Aware Settings

- `depthCompositingMode`
- `maskStrategy`
- `foregroundSubjects`
- `contactObjects`
- `contactObjectPreservation`
- `maskRisk`
- `fallbackLayout`
- `captionLayerRule`

## Tier Presets

Basic:

- `simple_location_pin`: one pin, low label density, static hold or pin drop.
- `simple_lower_panel_map`: compact lower panel map with conservative safe zones.
- `static_region_card`: approximate region highlight with safe wording.

Pro:

- `route_reveal_map`: controlled route draw with MapLibre/Turf/Remotion planning.
- `multi_location_sequence`: ordered locations with fit-bounds camera planning.
- `side_by_side_explainer_map`: speaker plus map for explanation.
- `pro_map_behind_subject_safe`: low/medium risk foreground-aware map with fallback.

Premium:

- `documentary_evidence_map_sequence`: source-aware case geography with restrained design.
- `premium_map_behind_subject_and_contact_object`: foreground group plus contact object preservation.
- `advanced_route_story_map`: richer route sequencing and SoundSync cue alignment.
- `future_globe_reveal`: future CesiumJS/deck.gl-style plan only.

## QA Thresholds

- Label readability threshold.
- Route visibility threshold.
- Map must not cover face, product, or captions.
- Pin accuracy confidence and source-needed warnings.
- Caption collision check.
- Foreground mask risk check.
- Map color consistency with color pipeline.
- Panel background consistency.
- Documentary/case-study safe wording check.
