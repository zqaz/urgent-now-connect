import { useState } from "react";
import { MapPin, Navigation, AlertCircle, Search, Loader2 } from "lucide-react";

interface LocationPromptProps {
  onGranted: (coords: { lat: number; lng: number }) => void;
  onSkip: () => void;
  isRequesting: boolean;
  error?: string;
}

const LocationPrompt = ({ onGranted, onSkip, isRequesting, error }: LocationPromptProps) => {
  const [mode, setMode] = useState<"default" | "manual">("default");
  const [address, setAddress] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string>();

  const handleGPS = () => {
    if (!("geolocation" in navigator)) {
      onSkip();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => onGranted({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => onSkip(),
      { timeout: 8000, maximumAge: 300000 }
    );
  };

  const handleAddressSubmit = async () => {
    const trimmed = address.trim();
    if (!trimmed) return;

    setGeocoding(true);
    setGeocodeError(undefined);
    try {
      const encoded = encodeURIComponent(trimmed);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
        {
          headers: {
            "Accept-Language": "en",
            // Required by Nominatim usage policy: https://operations.osmfoundation.org/policies/nominatim/
            "User-Agent": "UrgentNow/1.0 (medical-triage-app)",
          },
        }
      );
      const data = await res.json();
      if (!data || data.length === 0) {
        setGeocodeError("Address not found. Please try a more specific address.");
        return;
      }
      const { lat, lon } = data[0];
      onGranted({ lat: parseFloat(lat), lng: parseFloat(lon) });
    } catch {
      setGeocodeError("Couldn't look up that address. Please check your connection.");
    } finally {
      setGeocoding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-xl border border-border text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Navigation className="w-7 h-7 text-primary" />
        </div>

        <h2 className="text-lg font-bold text-foreground mb-2">Share Your Location</h2>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          We need your location to find the closest clinics and ERs near you with accurate travel times.
        </p>

        {/* Mode toggle */}
        <div className="flex rounded-lg border border-border overflow-hidden mb-5 text-xs font-semibold">
          <button
            onClick={() => setMode("default")}
            className={`flex-1 py-2 transition-colors ${
              mode === "default"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-secondary/50"
            }`}
          >
            Use GPS
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`flex-1 py-2 transition-colors ${
              mode === "manual"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-secondary/50"
            }`}
          >
            Enter Address
          </button>
        </div>

        {(error || geocodeError) && (
          <div className="flex items-center gap-2 text-xs text-alert-red bg-alert-red/10 rounded-lg p-2 mb-4">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {geocodeError ?? error}
          </div>
        )}

        {mode === "default" ? (
          <>
            <button
              onClick={handleGPS}
              disabled={isRequesting}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3 px-4 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50 mb-3"
            >
              <MapPin className="w-4 h-4" />
              {isRequesting ? "Requesting..." : "Allow Location Access"}
            </button>
          </>
        ) : (
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddressSubmit()}
                placeholder="123 Main St, Seattle, WA"
                autoComplete="off"
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 mb-2"
                autoFocus
              />
            </div>
            <button
              onClick={handleAddressSubmit}
              disabled={geocoding || !address.trim()}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3 px-4 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {geocoding ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Looking up address...</>
              ) : (
                <><MapPin className="w-4 h-4" /> Use This Address</>
              )}
            </button>
          </div>
        )}

        <button
          onClick={onSkip}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          Skip — use default location
        </button>
      </div>
    </div>
  );
};

export default LocationPrompt;
