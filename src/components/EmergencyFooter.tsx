import { Phone, AlertTriangle } from "lucide-react";

interface EmergencyFooterProps {
  isCritical?: boolean;
}

const EmergencyFooter = ({ isCritical }: EmergencyFooterProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-card/80 backdrop-blur-md border-t border-border">
      <a
        href="tel:911"
        className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-200 ${
          isCritical
            ? "bg-alert-red text-destructive-foreground shadow-[0_0_30px_hsl(var(--alert-red)/0.5)] animate-critical"
            : "bg-alert-red/10 text-alert-red hover:bg-alert-red hover:text-destructive-foreground"
        }`}
      >
        {isCritical && <AlertTriangle className="w-4 h-4" />}
        <Phone className="w-4 h-4" />
        Dial 911 Now
      </a>
    </div>
  );
};

export default EmergencyFooter;
