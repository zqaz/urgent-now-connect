import { Clock, Car, Star, ExternalLink, MapPin, Navigation as NavigationIcon, ShieldCheck, ShieldX, PhoneCall } from "lucide-react";
import { Clinic } from "@/data/types";
import { NetworkStatus } from "@/data/insuranceData";
import { openDirections } from "@/lib/navigation";

interface ClinicCardProps {
  clinic: Clinic;
  rank: number;
  networkStatus?: NetworkStatus;
  onNavigate?: (clinic: Clinic) => void;
}

const statusColor = (status: string) => {
  switch (status) {
    case "Fast Service": return "bg-safe-green/10 text-safe-green";
    case "High Capacity": return "bg-amber-warn/10 text-amber-warn";
    case "Busy": return "bg-alert-red/10 text-alert-red";
    default: return "bg-secondary text-secondary-foreground";
  }
};

const networkBadgeConfig: Record<NetworkStatus, { label: string; icon: React.ReactNode; className: string; clickable?: boolean } | null> = {
  in_network: {
    label: "In-Network",
    icon: <ShieldCheck className="w-3 h-3" />,
    className: "bg-safe-green/10 text-safe-green border border-safe-green/30",
  },
  out_of_network: {
    label: "Out of Network",
    icon: <ShieldX className="w-3 h-3" />,
    className: "bg-alert-red/10 text-alert-red border border-alert-red/30",
  },
  call_to_verify: {
    label: "Tap to Call & Verify",
    icon: <PhoneCall className="w-3 h-3" />,
    className: "bg-amber-warn/10 text-amber-warn border border-amber-warn/30 cursor-pointer hover:bg-amber-warn/20 active:scale-95 transition-all",
    clickable: true,
  },
  none: null,
};

const ClinicCard = ({ clinic, rank, networkStatus = "none", onNavigate }: ClinicCardProps) => {
  const totalTime = clinic.wait_time_min + clinic.travel_time_min;
  const isOutOfNetwork = networkStatus === "out_of_network";
  const badge = networkBadgeConfig[networkStatus];

  return (
    <div className={`bg-card rounded-xl p-4 border transition-all duration-300
      ${isOutOfNetwork
        ? "border-alert-red/15 opacity-55 shadow-card"
        : "border-border shadow-card hover:shadow-card-hover"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Rank */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
          ${isOutOfNetwork ? "bg-muted" : "bg-secondary"}`}
        >
          <span className={`text-sm font-bold ${isOutOfNetwork ? "text-muted-foreground" : "text-secondary-foreground"}`}>
            #{rank}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-foreground text-sm leading-tight truncate">
              {clinic.name}
            </h4>
            <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor(clinic.status)}`}>
              {clinic.status}
            </span>
          </div>

          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {clinic.address}
          </p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> Wait: {clinic.wait_time_min}m
            </span>
            <span className="flex items-center gap-1">
              <Car className="w-3 h-3" /> Drive: {clinic.travel_time_min}m
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-warn" /> {clinic.rating}
            </span>
            {clinic.distance_miles != null && (
              <span className="flex items-center gap-1">
                <NavigationIcon className="w-3 h-3" /> {clinic.distance_miles.toFixed(1)} mi
              </span>
            )}
          </div>

          {/* Insurance network badge — tap to call when we have a number */}
          {badge && (
            badge.clickable && clinic.phone ? (
              <a
                href={`tel:${clinic.phone}`}
                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-2 min-h-[28px] items-center ${badge.className}`}
                onClick={(e) => e.stopPropagation()}
              >
                {badge.icon}
                {badge.label}
              </a>
            ) : (
              <div className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-2 ${badge.className}`}>
                {badge.icon}
                {badge.label}
              </div>
            )
          )}

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
            <span className="text-xs font-medium text-foreground">
              Total: {totalTime} min
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  openDirections(clinic.coordinates.lat, clinic.coordinates.lng, clinic.name, clinic.address);
                  onNavigate?.(clinic);
                }}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full hover:opacity-90 active:scale-95 transition-all shadow-sm
                  ${isOutOfNetwork
                    ? "bg-muted text-muted-foreground"
                    : "bg-safe-green text-safe-green-foreground"
                  }`}
              >
                <MapPin className="w-3.5 h-3.5" /> Navigate
              </button>
              {clinic.url && (
                <a
                  href={clinic.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  View <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicCard;
