import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
  AttributionControl,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { type Incident } from "@/types";
import { AlertCircle, ChevronRight, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ICON_URL = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const ICON_SHADOW_URL =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

// Ensure default marker icons load correctly
// @ts-expect-error - Leaflet internal property cleanup
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: ICON_URL,
  iconUrl: ICON_URL,
  shadowUrl: ICON_SHADOW_URL,
});

function SeverityMarker({
  position,
  severity,
  title,
  onClick,
}: {
  position: [number, number];
  severity: Incident["severity"];
  title: string;
  onClick?: () => void;
}) {
  const colorMap: Record<Incident["severity"], string> = {
    low: "#0ea5e9",
    medium: "#ca8a04",
    high: "#ea580c",
    critical: "#dc2626",
  };
  const color = colorMap[severity];
  const isCritical = severity === "critical";
  const icon = L.divIcon({
    className: "custom-div-icon",
    html: `
      <div style="
        position: relative;
        width: ${isCritical ? 40 : 34}px;
        height: ${isCritical ? 40 : 34}px;
        display: flex; align-items: center; justify-content: center;
      ">
        <div style="
          width: ${isCritical ? 28 : 24}px;
          height: ${isCritical ? 28 : 24}px;
          border-radius: 50%;
          background: ${color};
          border: 3px solid #ffffff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
          ${isCritical ? "animation: pulse-critical 2s infinite;" : ""}
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffffff" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="6" fill="none" stroke="#ffffff" stroke-width="2" />
            <path d="M12 8v4M12 16l0 1" stroke="#ffffff" stroke-width="2" />
          </svg>
        </div>
      </div>
    `,
    iconSize: [isCritical ? 40 : 34, isCritical ? 40 : 34],
    iconAnchor: [isCritical ? 20 : 17, isCritical ? 40 : 34],
    popupAnchor: [0, -isCritical ? 38 : 30],
  });
  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={onClick ? { click: onClick } : undefined}
    >
      <Popup>
        <div className="p-3 min-w-[220px]">
          <div className="flex justify-between items-start mb-1.5">
            <h3 className="font-semibold text-slate-900 leading-snug">{title}</h3>
            <span
              className={`text-xs font-bold uppercase tracking-wider border px-1.5 py-0.5 rounded ${
                severity === "critical"
                  ? "border-critical-100 bg-critical-50 text-critical-700"
                  : severity === "high"
                    ? "border-orange-100 bg-orange-50 text-orange-700"
                    : severity === "medium"
                      ? "border-amber-100 bg-amber-50 text-amber-700"
                      : "border-sky-100 bg-sky-50 text-sky-700"
              }`}
            >
              {severity.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
            <AlertCircle className="h-3 w-3" />
            <span>Tap for details</span>
          </div>
          <button
            onClick={onClick}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded border border-slate-200 bg-white text-sm text-slate-700 hover:bg-slate-50 hover:text-critical-600 transition-all focus:outline-none focus:ring-2 focus:ring-critical-200 active:scale-95"
            aria-label={`View details for ${title}`}
          >
            <span>View incident</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </Popup>
    </Marker>
  );
}

interface EmergencyMapProps {
  incidents: Incident[];
  center?: [number, number];
  centerOn?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
}

export function EmergencyMap({
  incidents,
  center = [40.7128, -74.006],
  centerOn,
  zoom = 13,
  height = "500px",
  className,
  isLoading = false,
  error,
}: EmergencyMapProps) {
  const mapRef = useRef<ReturnType<typeof useMap> | null>(null);
  const prevCenterOn = useRef<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const flyTo = useCallback(
    (lat: number, lng: number, zoomLevel: number = 15) => {
      if (mapRef.current) {
        mapRef.current.flyTo([lat, lng], zoomLevel, {
          duration: 1.5,
          easeLinearity: 0.25,
        });
      }
    },
    []
  );

  useEffect(() => {
    if (!centerOn || !mapRef.current) return;
    const key = `${centerOn[0]},${centerOn[1]}`;
    if (prevCenterOn.current === key) return;
    prevCenterOn.current = key;
    flyTo(centerOn[0], centerOn[1], 15);
  }, [centerOn, flyTo]);

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        if (mapRef.current) {
          mapRef.current.flyTo(
            [pos.coords.latitude, pos.coords.longitude],
            15,
            { duration: 1.2 }
          );
        }
      },
      () => {
        setIsLocating(false);
      }
    );
  };

  const style: CSSProperties = { height, width: "100%" };

  if (error) {
    return (
      <div className={cn("rounded-xl border border-destructive-200 bg-destructive-50 p-6", className)}>
        <div className="flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-2" />
          <h3 className="font-semibold text-slate-900">Map unavailable</h3>
          <p className="text-sm text-slate-600 mt-1">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm underline text-critical-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn("rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center h-full", className)}>
        <div className="flex flex-col items-center justify-center gap-3">
          <AlertCircle className="h-6 w-6 text-slate-400 animate-spin" />
          <p className="text-sm text-slate-500">Loading map…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-slate-200 shadow-sm relative overflow-hidden", className)}>
      <div className="absolute top-3 left-3 z-20 flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLocate}
          disabled={isLocating}
          className="h-9 w-9 p-0"
          aria-label="Center on my location"
        >
          {isLocating ? (
            <AlertCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Target className="h-4 w-4" />
          )}
        </Button>
      </div>
      <MapContainer
        center={center}
        zoom={zoom}
        style={style}
        whenReady={((map: ReturnType<typeof useMap>) => {
          mapRef.current = map;
        }) as unknown as () => void}
        zoomControl={false}
        attributionControl={false}
      >
        <ZoomControl position="topright" />
        <AttributionControl
          position="bottomright"
          prefix='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {incidents.map((incident) => (
          <SeverityMarker
            key={incident.id}
            position={[incident.location.lat, incident.location.lng]}
            severity={incident.severity}
            title={incident.title}
          />
        ))}
      </MapContainer>
      <style>{`
        @keyframes pulse-critical {
          0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
          70% { box-shadow: 0 0 0 12px rgba(220, 38, 38, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
      `}</style>
    </div>
  );
}
