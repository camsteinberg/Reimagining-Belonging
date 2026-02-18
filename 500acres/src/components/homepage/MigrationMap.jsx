import { useRef, useEffect, useState } from "react";
import {
  MAPBOX_TOKEN,
  MAPBOX_STYLE,
  FLOWS_URL,
  STATES_GEOJSON_URL,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  WATER_COLOR,
} from "../../data/mapConfig";

function esc(str) {
  const el = document.createElement("span");
  el.textContent = str;
  return el.innerHTML;
}

function formatTop(list, dir) {
  if (!list || list.length === 0) return '<div class="muted">No data</div>';
  return list
    .slice(0, 3)
    .map((d) => {
      const other = esc(dir === "out" ? d.to_abbr : d.from_abbr);
      return `${dir === "out" ? "\u2192" : "\u2190"} <strong>${other}</strong> <span class="muted">${Number(d.population).toLocaleString()}</span>`;
    })
    .join("<br/>");
}

function buildFlowIndex(flows) {
  const out = new Map();
  const inn = new Map();
  for (const f of flows) {
    if (!out.has(f.from_abbr)) out.set(f.from_abbr, []);
    if (!inn.has(f.to_abbr)) inn.set(f.to_abbr, []);
    out.get(f.from_abbr).push(f);
    inn.get(f.to_abbr).push(f);
  }
  for (const [, arr] of out) arr.sort((a, b) => b.population - a.population);
  for (const [, arr] of inn) arr.sort((a, b) => b.population - a.population);
  return { out, inn };
}

export default function MigrationMap({ slideNum }) {
  const mapContainerRef = useRef(null);
  const tooltipRef = useRef(null);
  const mapRef = useRef(null);
  const [loadError, setLoadError] = useState(false);

  const slideClass = `slide${slideNum}`;
  const mapId = slideNum === 15 ? "map" : "map2";
  const tooltipId = slideNum === 15 ? "tooltip" : "tooltip2";

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current || !MAPBOX_TOKEN) return;

    let cancelled = false;

    const initMap = async () => {
      try {
        const [
          { default: mapboxgl },
          ,
          { MapboxOverlay },
          { ArcLayer, GeoJsonLayer },
        ] = await Promise.all([
          import("mapbox-gl"),
          import("mapbox-gl/dist/mapbox-gl.css"),
          import("@deck.gl/mapbox"),
          import("@deck.gl/layers"),
        ]);

        if (cancelled || mapRef.current) return;

        mapboxgl.accessToken = MAPBOX_TOKEN;

        const tooltip = tooltipRef.current;

        const showTooltip = (x, y, html) => {
          if (!tooltip) return;
          tooltip.innerHTML = html;
          tooltip.style.display = "block";
          const mapContainer = mapContainerRef.current;
          const mapWidth = mapContainer.offsetWidth;
          const mapHeight = mapContainer.offsetHeight;
          const mapTop = mapContainer.offsetTop;
          const tooltipRect = tooltip.getBoundingClientRect();
          const tooltipWidth = tooltipRect.width || 280;
          const tooltipHeight = tooltipRect.height || 100;
          const padding = 15;
          let posX = x + 50;
          let posY = y + 50;
          if (posX + tooltipWidth + padding > mapWidth) posX = x - tooltipWidth - 30;
          if (posY + tooltipHeight + padding > mapHeight + mapTop) posY = y - tooltipHeight - 30;
          posX = Math.max(padding, posX);
          posY = Math.max(mapTop + padding, posY);
          tooltip.style.left = posX + "px";
          tooltip.style.top = posY + "px";
        };

        const hideTooltip = () => {
          if (tooltip) tooltip.style.display = "none";
        };

        let map;
        try {
          map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: MAPBOX_STYLE,
            projection: "mercator",
            center: DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
            pitch: 0,
            bearing: 0,
            scrollZoom: false,
            boxZoom: false,
            doubleClickZoom: false,
            keyboard: false,
            touchZoomRotate: false,
          });
        } catch (err) {
          console.error("Failed to initialize migration map:", err);
          setLoadError(true);
          return;
        }

        mapRef.current = map;

        map.on("error", (e) => {
          console.error("Mapbox runtime error:", e.error);
          setLoadError(true);
        });

        map.on("load", () => {
          map.setPaintProperty("water", "fill-color", WATER_COLOR);

          Promise.all([
            fetch(FLOWS_URL).then((r) => r.json()),
            fetch(STATES_GEOJSON_URL).then((r) => r.json()),
          ]).then(([flows, statesGeo]) => {
            const maxPopulation = Math.max(...flows.map((f) => f.population));
            const minPopulation = Math.min(...flows.map((f) => f.population));
            const idx = buildFlowIndex(flows);
            let currentHoveredState = null;

            const overlay = new MapboxOverlay({
              interleaved: false,
              layers: [],
            });
            map.addControl(overlay);

            const getAbsoluteRatio = (population) =>
              (population - minPopulation) / (maxPopulation - minPopulation);

            const createColoredLayer = (data, id, isOutbound, isOutboundFlow) =>
              new ArcLayer({
                id,
                data,
                pickable: false,
                getSourcePosition: (d) => [d.from_lon, d.from_lat],
                getTargetPosition: (d) => [d.to_lon, d.to_lat],
                getSourceColor: (d) => {
                  const ratio = getAbsoluteRatio(d.population);
                  const alpha = Math.floor(isOutboundFlow ? 180 + ratio * 75 : 10 + ratio * 80);
                  return isOutbound ? [255, 100, 80, alpha] : [80, 150, 255, alpha];
                },
                getTargetColor: (d) => {
                  const ratio = getAbsoluteRatio(d.population);
                  const alpha = Math.floor(isOutboundFlow ? 10 + ratio * 80 : 180 + ratio * 75);
                  return isOutbound ? [255, 100, 80, alpha] : [80, 150, 255, alpha];
                },
                getWidth: (d) => 0.15 + getAbsoluteRatio(d.population) * 3,
                parameters: { depthTest: false },
              });

            function updateArcs(abbr) {
              const newLayers = [
                new GeoJsonLayer({
                  id: "states-fill",
                  data: statesGeo,
                  pickable: true,
                  stroked: true,
                  filled: true,
                  getFillColor: [0, 0, 0, 0],
                  getLineColor: [120, 120, 120, 60],
                  lineWidthMinPixels: 0.5,
                  onHover: ({ object, x, y }) => {
                    if (!object) {
                      if (currentHoveredState !== null) {
                        currentHoveredState = null;
                        hideTooltip();
                        updateArcs(null);
                      }
                      return;
                    }
                    const stateAbbr = object.properties.STUSPS;
                    const stateName = object.properties.NAME;
                    if (stateAbbr !== currentHoveredState) {
                      currentHoveredState = stateAbbr;
                      updateArcs(stateAbbr);
                      const topOut = idx.out.get(stateAbbr) || [];
                      const topIn = idx.inn.get(stateAbbr) || [];
                      showTooltip(
                        x,
                        y,
                        `<strong>${esc(stateAbbr)} \u2014 ${esc(stateName)}</strong><br/>
                        <div class="muted">Top outbound</div>
                        ${formatTop(topOut, "out")}<br/>
                        <div class="muted" style="margin-top:6px;">Top inbound</div>
                        ${formatTop(topIn, "in")}`
                      );
                    }
                  },
                }),
              ];

              if (abbr) {
                const outboundFlows = flows.filter((d) => d.from_abbr === abbr);
                const inboundFlows = flows.filter((d) => d.to_abbr === abbr);
                if (outboundFlows.length > 0)
                  newLayers.push(createColoredLayer(outboundFlows, "flows-outbound", true, true));
                if (inboundFlows.length > 0)
                  newLayers.push(createColoredLayer(inboundFlows, "flows-inbound", false, false));
              }
              overlay.setProps({ layers: newLayers });
            }

            updateArcs(null);
            map.addControl(new mapboxgl.NavigationControl(), "top-right");
          }).catch((err) => {
            console.error("Failed to load migration data:", err);
            setLoadError(true);
          });
        });
      } catch (err) {
        console.error("Failed to load map:", err);
        if (!cancelled) setLoadError(true);
      }
    };

    // Use IntersectionObserver to trigger loading when near viewport
    const loadObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadObserver.disconnect();
          initMap();
        }
      },
      { rootMargin: "500px" }
    );
    loadObserver.observe(mapContainerRef.current);

    return () => {
      cancelled = true;
      loadObserver.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const textContent =
    slideNum === 15 ? (
      <div className="slide15TextContainer">
        <div style={{ color: "#333333", fontSize: "20px" }}>
          Shaped by education, work, and uneven access to opportunity, leaving
          home is not unusual for many Gen Z.
          <br />
          <em>Hover or tap a state to see Gen Z outbound and inbound migration flows.</em>
        </div>
      </div>
    ) : (
      <div className="slide16TextContainer">
        <div style={{ color: "#333333", fontSize: "20px" }}>
          A few corridors carry a lot of movement.
          <br />
          For many, moving is tied to what becomes available, as much as to
          personal preference.
        </div>
      </div>
    );

  if (loadError) {
    return (
      <section className={`slide ${slideClass}`}>
        {textContent}
        <div className="mapWrap">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              backgroundColor: "#3a3228",
            }}
          >
            <p style={{ color: "#e8e0d0", fontFamily: "var(--font-serif), 'EB Garamond', Georgia, serif", fontSize: "18px" }}>
              Map data temporarily unavailable
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`slide ${slideClass}`}>
      {textContent}
      <div className="mapWrap">
        <div ref={mapContainerRef} id={mapId} role="img" aria-label="Interactive US migration map — hover or tap states to see Gen Z movement flows" />
        <div ref={tooltipRef} id={tooltipId} className="tooltip" role="status" aria-live="polite" aria-atomic="true" />
        <div id={slideNum === 15 ? "legend" : "legend2"} className="legend">
          <div className="legend-title">Gen Z Migration</div>
          <div className="legend-item">
            <div className="legend-line outbound" />
            <span>Outbound</span>
          </div>
          <div className="legend-item">
            <div className="legend-line inbound" />
            <span>Inbound</span>
          </div>
          <div
            style={{
              marginTop: "8px",
              paddingTop: "8px",
              borderTop: "1px solid #eee",
              color: "#999",
              fontSize: "11px",
            }}
          >
            Line width &amp; opacity
            <br />
            scale with volume
          </div>
        </div>
      </div>
    </section>
  );
}
