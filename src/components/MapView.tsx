import { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Clinic } from "@/data/types";
import { DEFAULT_RADIUS_MILES } from "@/lib/geo";

interface MapViewProps {
  clinics: Clinic[];
  winnerId: string;
  userLocation: { lat: number; lng: number };
  radiusMiles?: number;
}

/** Stable serialisation so we can compare clinic lists cheaply */
function clinicKey(clinics: Clinic[]) {
  return clinics.map((c) => c.id).join(",");
}

const MapView = ({ clinics, winnerId, userLocation, radiusMiles = DEFAULT_RADIUS_MILES }: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const prevKeyRef = useRef("");

  // Stabilise clinic list – only change reference when IDs actually change
  const stableKey = useMemo(() => clinicKey(clinics), [clinics]);

  // 1️⃣ Initialise the map ONCE
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      scrollWheelZoom: true,
      zoomControl: true,
    }).setView([userLocation.lat, userLocation.lng], 13);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current = null;
      circleRef.current = null;
      userMarkerRef.current = null;
    };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2️⃣ Update markers & overlays when data changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markerGroup = markersRef.current;
    if (!map || !markerGroup) return;

    // Skip if nothing actually changed
    const newKey = `${stableKey}|${winnerId}|${userLocation.lat},${userLocation.lng}|${radiusMiles}`;
    if (newKey === prevKeyRef.current) return;
    prevKeyRef.current = newKey;

    // Clear previous markers
    markerGroup.clearLayers();

    // Update radius circle
    if (circleRef.current) {
      map.removeLayer(circleRef.current);
    }
    const radiusMeters = radiusMiles * 1609.34;
    circleRef.current = L.circle([userLocation.lat, userLocation.lng], {
      radius: radiusMeters,
      color: "hsl(217, 91%, 60%)",
      fillColor: "hsl(217, 91%, 60%)",
      fillOpacity: 0.06,
      weight: 1.5,
      dashArray: "6 4",
    }).addTo(map);

    // Update user marker
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
    }
    const userIcon = L.divIcon({
      className: "",
      html: `<div style="position:relative;width:16px;height:16px;">
        <div style="width:16px;height:16px;border-radius:50%;background:#4285F4;border:3px solid white;box-shadow:0 0 6px rgba(66,133,244,0.6);position:relative;z-index:2;"></div>
        <div style="position:absolute;top:-4px;left:-4px;width:24px;height:24px;border-radius:50%;background:rgba(66,133,244,0.25);animation:leaflet-pulse 2s ease-out infinite;"></div>
      </div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(map)
      .bindPopup("Your location");

    // Sort clinics by wait time to identify top 3
    const sortedByWait = [...clinics].sort((a, b) => a.wait_time_min - b.wait_time_min);
    const top3Ids = new Set(sortedByWait.slice(0, 3).map((c) => c.id));

    const points: L.LatLngExpression[] = [[userLocation.lat, userLocation.lng]];

    clinics.forEach((clinic) => {
      const isTop3 = top3Ids.has(clinic.id);
      const isWinner = clinic.id === winnerId;
      const markerColor = isTop3 ? "#34A853" : "#EA4335";
      const shadowColor = isTop3 ? "rgba(52,168,83,0.5)" : "rgba(234,67,53,0.4)";
      const dotColor = isTop3 ? "rgba(52,168,83,0.4)" : "rgba(234,67,53,0.3)";
      const size = isWinner ? 28 : 24;

      const pulseRing = isTop3
        ? `<div style="position:absolute;top:50%;left:50%;width:${size + 16}px;height:${size + 16}px;margin-left:-${(size + 16) / 2}px;margin-top:-${(size + 16) / 2 + 6}px;border-radius:50%;background:rgba(52,168,83,0.25);animation:green-strobe 1.5s ease-in-out infinite;"></div>`
        : "";

      const icon = L.divIcon({
        className: "",
        html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;">
          ${pulseRing}
          <div style="width:${size}px;height:${size}px;background:${markerColor};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 8px ${shadowColor};position:relative;z-index:2;"></div>
          <div style="width:5px;height:5px;border-radius:50%;background:${dotColor};margin-top:2px;position:relative;z-index:2;"></div>
        </div>`,
        iconSize: [isWinner ? 28 : 24, isWinner ? 36 : 32],
        iconAnchor: [isWinner ? 14 : 12, isWinner ? 36 : 32],
        popupAnchor: [0, isWinner ? -36 : -32],
      });

      const distLabel = clinic.distance_miles != null ? ` · ${clinic.distance_miles.toFixed(1)} mi` : "";
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${clinic.coordinates.lat},${clinic.coordinates.lng}&travelmode=driving&query=${encodeURIComponent(clinic.name)}`;

      const marker = L.marker([clinic.coordinates.lat, clinic.coordinates.lng], { icon })
        .bindPopup(
          `<div style="font-size:13px;line-height:1.5;min-width:180px;">
            <strong style="font-size:14px;">${clinic.name.split(" - ")[0]}</strong><br/>
            <span style="color:#555;">${clinic.wait_time_min}min wait · ${clinic.travel_time_min}min drive${distLabel}</span>
            ${isTop3 ? '<br/><span style="color:#34A853;font-weight:600;font-size:11px;">⚡ Top 3 Shortest Wait</span>' : ''}
            <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer"
              style="display:block;margin-top:8px;padding:8px 12px;background:#4285F4;color:#fff;font-weight:700;font-size:12px;text-decoration:none;border-radius:8px;text-align:center;cursor:pointer;letter-spacing:0.02em;"
              onmouseover="this.style.background='#1a73e8'" onmouseout="this.style.background='#4285F4'">
              🗺 Open in Google Maps ↗
            </a>
          </div>`,
          { closeOnClick: false }
        );
      marker.on("mouseover", function () { marker.openPopup(); });

      markerGroup.addLayer(marker);
      points.push([clinic.coordinates.lat, clinic.coordinates.lng]);
    });

    // Fit bounds
    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [30, 30] });
    }
  }, [clinics, stableKey, winnerId, userLocation, radiusMiles]);

  return (
    <>
      <style>{`
        @keyframes leaflet-pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes green-strobe {
          0%, 100% { transform: scale(1); opacity: 0.4; box-shadow: 0 0 0 0 rgba(52,168,83,0.4); }
          50% { transform: scale(1.6); opacity: 0; box-shadow: 0 0 12px 4px rgba(52,168,83,0.3); }
        }
      `}</style>
      <div ref={mapRef} className="w-full h-52 rounded-xl overflow-hidden border border-border" />
    </>
  );
};

export default MapView;
