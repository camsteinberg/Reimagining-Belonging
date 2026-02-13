import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_TOKEN, MAPBOX_STYLE, WATER_COLOR } from "../../data/mapConfig";

mapboxgl.accessToken = MAPBOX_TOKEN;

export default function InitialMap() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const map = new mapboxgl.Map({
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

    map.on("load", () => {
      map.setPaintProperty("water", "fill-color", WATER_COLOR);
    });

    mapRef.current = map;

    // Scroll-driven zoom out
    const section = document.querySelector(".mapSlides");
    if (section) {
      const observer = new IntersectionObserver(
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
      observer.observe(section);
    }

    return () => {
      if (mapRef.current) {
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
        <div ref={mapContainerRef} id="initialMap" />
      </div>
    </section>
  );
}
