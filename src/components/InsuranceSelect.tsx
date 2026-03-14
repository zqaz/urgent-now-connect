import { useState } from "react";
import { ShieldCheck, ArrowRight, SkipForward, CheckCircle2, Loader2 } from "lucide-react";
import { INSURANCE_OPTIONS, InsuranceOption } from "@/data/insuranceData";

interface InsuranceSelectProps {
  onSelect: (insuranceId: string) => void;
  onSkip: () => void;
  profileButton?: React.ReactNode;
  loading?: boolean;
}

const InsuranceSelect = ({ onSelect, onSkip, profileButton, loading = false }: InsuranceSelectProps) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    if (selected && !loading) onSelect(selected);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="w-9" />
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold tracking-tight">Insurance Selection</span>
          </div>
          {profileButton ?? <div className="w-9" />}
        </div>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 pt-6 pb-32">
        {/* Title */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">Select Your Insurance</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            We'll highlight clinics that accept your plan and flag those that may not be in-network.
          </p>
        </div>

        {/* Insurance grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {INSURANCE_OPTIONS.map((option: InsuranceOption) => {
            const isSelected = selected === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setSelected(option.id)}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-left
                  ${isSelected
                    ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
                    : "border-border bg-card hover:border-primary/40 hover:bg-secondary/30"
                  }`}
              >
                {/* Checkmark when selected */}
                {isSelected && (
                  <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-primary" />
                )}

                {/* Insurance initials badge */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm ${option.color} ${option.textColor}`}>
                  {option.shortName.slice(0, 3).toUpperCase()}
                </div>

                <span className={`text-xs font-semibold text-center leading-tight ${isSelected ? "text-primary" : "text-foreground"}`}>
                  {option.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fixed bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border px-4 py-4 z-40 safe-area-pb">
        <div className="max-w-lg mx-auto flex flex-col gap-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selected || loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3.5 px-4 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shadow-md touch-manipulation"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading…
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                {selected
                  ? `Continue with ${INSURANCE_OPTIONS.find((o) => o.id === selected)?.shortName}`
                  : "Select an insurance to continue"}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onSkip}
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 touch-manipulation disabled:opacity-50"
          >
            <SkipForward className="w-3.5 h-3.5" />
            Skip — show all clinics
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsuranceSelect;
