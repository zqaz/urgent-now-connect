import { Activity, ArrowLeft, Shield, ShieldCheck } from "lucide-react";
import { Clinic } from "@/data/types";
import { getNetworkStatus, INSURANCE_OPTIONS } from "@/data/insuranceData";
import WinnerCard from "./WinnerCard";
import ClinicCard from "./ClinicCard";
import MapView from "./MapView";

interface DashboardProps {
  clinics: Clinic[];
  severity: "low" | "moderate" | "high" | "critical";
  recommendation: string;
  onBack: () => void;
  isLoading?: boolean;
  userLocation: { lat: number; lng: number };
  onNavigate?: (clinic: Clinic) => void;
  selectedInsurance?: string | null;
  profileButton?: React.ReactNode;
}

const severityConfig = {
  low: { label: "Low Severity", color: "bg-safe-green/10 text-safe-green", dot: "bg-safe-green" },
  moderate: { label: "Moderate", color: "bg-amber-warn/10 text-amber-warn", dot: "bg-amber-warn" },
  high: { label: "High Priority", color: "bg-alert-red/10 text-alert-red", dot: "bg-alert-red" },
  critical: { label: "Critical", color: "bg-alert-red text-destructive-foreground", dot: "bg-destructive-foreground" },
};

const Dashboard = ({
  clinics,
  severity,
  recommendation,
  onBack,
  isLoading,
  userLocation,
  onNavigate,
  selectedInsurance = null,
  profileButton,
}: DashboardProps) => {
  const config = severityConfig[severity];
  const insuranceName = selectedInsurance
    ? INSURANCE_OPTIONS.find((o) => o.id === selectedInsurance)?.shortName
    : null;

  // Sort: in-network first, call_to_verify second, out-of-network last — each group by total time
  const withStatus = clinics.map((c) => ({
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
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> New Search
          </button>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-alert-red" />
            <span className="text-sm font-semibold tracking-tight">UrgentNow</span>
          </div>
          {profileButton ?? <div className="w-9" />}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-5">
        {/* Triage result */}
        <div className="bg-card rounded-xl p-4 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Triage Assessment
            </span>
          </div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${config.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
              {config.label}
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

        {/* Map */}
        <MapView clinics={clinics} winnerId={winner.clinic.id} userLocation={userLocation} />

        {/* Winner Card */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {selectedInsurance && winner.status === "in_network" ? "Best In-Network Option" : "Recommended"}
          </h3>
          <WinnerCard
            clinic={winner.clinic}
            networkStatus={winner.status}
            onNavigate={onNavigate}
          />
        </div>

        {/* Other clinics */}
        {rest.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Other Options
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

export default Dashboard;
