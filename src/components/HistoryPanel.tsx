import { useState } from "react";
import { History, X, ChevronDown, ChevronUp, MapPin, Trash2, ExternalLink } from "lucide-react";
import { HistoryEntry } from "@/hooks/useHistory";

interface HistoryPanelProps {
  history: HistoryEntry[];
  onClear: () => void;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

const careTypeLabel: Record<string, string> = {
  urgent_care: "Urgent Care",
  er: "Emergency Room",
  critical: "Critical / ER",
};

const HistoryPanel = ({ history, onClear }: HistoryPanelProps) => {
  const [open, setOpen] = useState(false);

  if (history.length === 0) return null;

  return (
    <div className="max-w-sm w-full mx-auto mt-6 px-4">
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border shadow-card text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          Visit History
          <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">
            {history.length}
          </span>
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="mt-2 bg-card border border-border rounded-xl shadow-card overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/30">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recent Searches
            </span>
            <button
              onClick={onClear}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-alert-red transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>

          <div className="divide-y divide-border max-h-80 overflow-y-auto">
            {history.map((entry) => (
              <div key={entry.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {careTypeLabel[entry.careType] ?? entry.careType}
                  </span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatDate(entry.date)}
                  </span>
                </div>

                <p className="text-sm text-foreground leading-snug mb-2 line-clamp-2">
                  "{entry.symptoms}"
                </p>

                {entry.navigatedClinic ? (
                  <div className="flex items-center gap-1.5 bg-safe-green/8 border border-safe-green/20 rounded-lg px-2.5 py-1.5">
                    <MapPin className="w-3 h-3 text-safe-green flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {entry.navigatedClinic.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {entry.navigatedClinic.address}
                      </p>
                    </div>
                    <a
                      href={entry.navigatedClinic.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 text-primary hover:opacity-70 transition-opacity"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground italic">No clinic navigated</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;
