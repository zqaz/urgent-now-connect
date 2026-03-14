import { AlertTriangle, Phone, X } from "lucide-react";

interface CriticalAlertProps {
  onDismiss: () => void;
}

const CriticalAlert = ({ onDismiss }: CriticalAlertProps) => {
  return (
    <div className="fixed inset-0 z-[60] bg-alert-red/95 flex flex-col items-center justify-center p-6 animate-critical">
      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 text-destructive-foreground/70 hover:text-destructive-foreground"
      >
        <X className="w-6 h-6" />
      </button>

      <AlertTriangle className="w-16 h-16 text-destructive-foreground mb-6" />

      <h2 className="text-2xl font-bold text-destructive-foreground text-center mb-2">
        Critical Symptoms Detected
      </h2>
      <p className="text-destructive-foreground/80 text-center max-w-sm text-sm mb-8">
        Based on your description, we recommend seeking emergency medical attention immediately.
      </p>

      <a
        href="tel:911"
        className="flex items-center gap-2 bg-destructive-foreground text-alert-red font-bold py-4 px-8 rounded-xl text-lg shadow-xl hover:scale-105 transition-transform"
      >
        <Phone className="w-5 h-5" /> Call 911
      </a>

      <button
        onClick={onDismiss}
        className="mt-6 text-sm text-destructive-foreground/60 hover:text-destructive-foreground underline"
      >
        Continue to Urgent Care Options
      </button>
    </div>
  );
};

export default CriticalAlert;
