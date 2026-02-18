import { useRef, useEffect, useState } from "react";
import { MAPBOX_TOKEN, MAPBOX_STYLE, WATER_COLOR } from "../../data/mapConfig";

export default function InitialMap() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current || !MAPBOX_TOKEN) return;

    let cancelled = false;

    const initMap = async () => {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
        await import("mapbox-gl/dist/mapbox-gl.css");

        if (cancelled || mapRef.current) return;

        mapboxgl.accessToken = MAPBOX_TOKEN;

        let map;
        try {
          map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: MAPBOX_STYLE,
            projection: "mercator",
            center: [-71.06, 42.36],
            zoom: 10,
            pitch: 0,
            bearing: 0,
            scrollZoom: false,
            boxZoom: false,
            doubleClickZoom: false,
            keyboard: false,
            touchZoomRotate: false,
            dragPan: false,
            dragRotate: false,
          });
        } catch (err) {
          console.error("Failed to initialize map:", err);
          setLoadError(true);
          return;
        }

        map.on("load", () => {
          map.setPaintProperty("water", "fill-color", WATER_COLOR);
        });

        map.on("error", (e) => {
          console.error("Mapbox runtime error:", e.error);
          setLoadError(true);
        });

        mapRef.current = map;

        // Scroll-driven zoom out
        const section = document.querySelector(".mapSlides");
        if (section) {
          const scrollObserver = new IntersectionObserver(
            ([entry]) => {
              if (entry.isIntersecting && map) {
                map.flyTo({
                  center: [-98, 38.5],
                  zoom: 3.5,
                  duration: 3000,
                  essential: true,
                });
              }
            },
            { threshold: 0.3 }
          );
          scrollObserver.observe(section);

          // Store for cleanup
          map._scrollObserver = scrollObserver;
        }
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
        if (mapRef.current._scrollObserver) mapRef.current._scrollObserver.disconnect();
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <section className="slide mapSlides">
      <div className="initMapText1">
        <div>For many Gen Z, mobility starts with a first departure.</div>
      </div>
      <div className="initMapText2">
        <div>Leaving a hometown for school, work, or an opportunity.</div>
        <div
          style={{
            color: "#9f4f2e",
            fontSize: "15px",
            fontFamily: "'Inter', sans-serif",
            fontStyle: "italic",
            fontWeight: 300,
          }}
        >
          <br />
          "I lived and worked in the US, went to college there,
          <br /> graduated and worked in industry for a bit."
          <br />– Lexi, Gen Z
        </div>
      </div>
      <div className="initMapText3">
        <div>
          From there, "home" starts to stretch, shaped by repeated moves across
          cities, borders, and cultures.
        </div>
      </div>
      <div className="initMapText3Quote">
        <div>
          "Then I moved to Australia for a <br />
          little under a year for work. After <br />
          Australia, I got my Fulbright <br />
          fellowship, made my way over to <br />
          Asia, and have been living here
          <br /> ever since." - Lexi
        </div>
      </div>
      <div className="mapWrap">
        {loadError ? (
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
              Map temporarily unavailable
            </p>
          </div>
        ) : (
          <div ref={mapContainerRef} id="initialMap" role="img" aria-label="Interactive map showing Gen Z migration journey across countries" />
        )}
      </div>
    </section>
  );
}
