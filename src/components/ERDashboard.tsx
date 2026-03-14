import { Activity, ArrowLeft, Shield, AlertTriangle, Phone, ShieldCheck } from "lucide-react";
import { Clinic } from "@/data/types";
import { getNetworkStatus, INSURANCE_OPTIONS } from "@/data/insuranceData";
import WinnerCard from "./WinnerCard";
import ClinicCard from "./ClinicCard";
import MapView from "./MapView";

interface ERDashboardProps {
  ers: Clinic[];
  severity: "low" | "moderate" | "high" | "critical";
  recommendation: string;
  onBack: () => void;
  isLoading?: boolean;
  userLocation: { lat: number; lng: number };
  onNavigate?: (clinic: Clinic) => void;
  selectedInsurance?: string | null;
  profileButton?: React.ReactNode;
}

const ERDashboard = ({
  ers,
  severity,
  recommendation,
  onBack,
  isLoading,
  userLocation,
  onNavigate,
  selectedInsurance = null,
  profileButton,
}: ERDashboardProps) => {
  const insuranceName = selectedInsurance
    ? INSURANCE_OPTIONS.find((o) => o.id === selectedInsurance)?.shortName
    : null;

  // Sort: in-network first, call_to_verify second, out-of-network last — each group by total time
  const withStatus = ers.map((c) => ({
    clinic: c,
    status: getNetworkStatus(c.provider, selectedInsurance),
    total: c.wait_time_min + c.travel_time_min,
  }));

  const order = { in_network: 0, call_to_verify: 1, out_of_network: 2, none: 0 };
  const sorted = [...withStatus].sort((a, b) => {
    const rankDiff = order[a.status] - order[b.status];
    return rankDiff !== 0 ? rankDiff : a.total - b.total;
  });

  const winner = sorted[0];
  const rest = sorted.slice(1);

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-alert-red/5 backdrop-blur-md border-b border-alert-red/20 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> New Search
          </button>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-alert-red" />
            <span className="text-sm font-semibold tracking-tight text-alert-red">Emergency Room</span>
          </div>
          {profileButton ?? <div className="w-9" />}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-5">
        {/* ER Alert Banner */}
        <div className="bg-alert-red/10 rounded-xl p-4 border border-alert-red/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-alert-red" />
            <span className="text-xs font-semibold uppercase tracking-wider text-alert-red">
              Emergency Care Recommended
            </span>
          </div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-alert-red/10 text-alert-red">
              <span className="w-1.5 h-1.5 rounded-full bg-alert-red" />
              {severity === "critical" ? "Critical" : "High Priority"}
            </span>
            {insuranceName && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="w-3 h-3" />
                {insuranceName}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{recommendation}</p>
        </div>

        {/* 911 Call Card */}
        <div className="bg-alert-red rounded-xl p-5 text-center">
          <AlertTriangle className="w-8 h-8 text-destructive-foreground mx-auto mb-2" />
          <h3 className="text-destructive-foreground font-bold text-base mb-1">
            Life-threatening emergency?
          </h3>
          <p className="text-destructive-foreground/80 text-xs mb-4">
            If you're experiencing a medical emergency, call 911 immediately.
          </p>
          <a
            href="tel:911"
            className="inline-flex items-center gap-2 bg-destructive-foreground text-alert-red font-bold py-3 px-6 rounded-xl text-sm shadow-xl hover:scale-105 transition-transform"
          >
            <Phone className="w-4 h-4" /> Call 911 Now
          </a>
        </div>

        {/* Map */}
        <MapView clinics={ers} winnerId={winner.clinic.id} userLocation={userLocation} />

        {/* Winner Card */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {selectedInsurance && winner.status === "in_network" ? "Best In-Network ER" : "Nearest ER"}
          </h3>
          <WinnerCard
            clinic={winner.clinic}
            networkStatus={winner.status}
            onNavigate={onNavigate}
          />
        </div>

        {/* Other ERs */}
        {rest.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Other Emergency Rooms
            </h3>
            <div className="space-y-3">
              {rest.map(({ clinic, status }, i) => (
                <ClinicCard
                  key={clinic.id}
                  clinic={clinic}
                  rank={i + 2}
                  networkStatus={status}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ERDashboard;
