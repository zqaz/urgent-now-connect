import { MapPin, Clock, Car, Star, ExternalLink, Trophy, Navigation as NavigationIcon, ShieldCheck, ShieldX, PhoneCall } from "lucide-react";
import { Clinic } from "@/data/types";
import { NetworkStatus } from "@/data/insuranceData";
import { openDirections } from "@/lib/navigation";

interface WinnerCardProps {
  clinic: Clinic;
  networkStatus?: NetworkStatus;
  onNavigate?: (clinic: Clinic) => void;
}

const networkBadge: Record<NetworkStatus, { label: string; icon: React.ReactNode; className: string; clickable?: boolean } | null> = {
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

const WinnerCard = ({ clinic, networkStatus = "none", onNavigate }: WinnerCardProps) => {
  const isOutOfNetwork = networkStatus === "out_of_network";
  const badge = networkBadge[networkStatus];

  return (
    <div className={`relative bg-card rounded-2xl p-5 border-2 overflow-hidden transition-all
      ${isOutOfNetwork
        ? "border-alert-red/20 opacity-60 shadow-card"
        : "border-safe-green/30 shadow-winner"
      }`}
    >
      {/* Out-of-network overlay banner */}
      {isOutOfNetwork && (
        <div className="absolute inset-0 bg-background/20 rounded-2xl pointer-events-none z-10" />
      )}

      {/* Winner / out-of-network top badge */}
      <div className="absolute top-0 right-0">
        {isOutOfNetwork ? (
          <div className="bg-alert-red/10 text-alert-red text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl border-l border-b border-alert-red/20">
            <span className="flex items-center gap-1">
              <ShieldX className="w-3 h-3" /> Out of Network
            </span>
          </div>
        ) : (
          <div className="bg-safe-green text-safe-green-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl">
            <span className="flex items-center gap-1">
              <Trophy className="w-3 h-3" /> Fastest
            </span>
          </div>
        )}
      </div>

      <div className="flex items-start gap-4">
        {/* Wait time badge */}
        <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center
          ${isOutOfNetwork ? "bg-muted" : "bg-safe-green/10"}`}
        >
          <span className={`text-2xl font-bold ${isOutOfNetwork ? "text-muted-foreground" : "text-safe-green"}`}>
            {clinic.wait_time_min}
          </span>
          <span className={`text-[10px] font-medium uppercase ${isOutOfNetwork ? "text-muted-foreground" : "text-safe-green"}`}>
            min
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm leading-tight mb-1 truncate pr-20">
            {clinic.name}
          </h3>
          <p className="text-xs text-muted-foreground mb-2 truncate">{clinic.address}</p>

          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Car className="w-3 h-3" /> {clinic.travel_time_min} min
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
        </div>
      </div>

      {/* Total time + actions */}
      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>
            Total time: <strong className="text-foreground">{clinic.travel_time_min + clinic.wait_time_min} min</strong>
          </span>
        </div>
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
              Details <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default WinnerCard;
