import { Shield, Mic, MapPin, Brain, AlertTriangle, Check } from "lucide-react";

interface PrivacyNoticeProps {
  onAccept: () => void;
}

const Row = ({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) => (
  <div className="flex gap-3">
    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mt-0.5">
      {icon}
    </div>
    <div>
      <p className="text-xs font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{body}</p>
    </div>
  </div>
);

const PrivacyNotice = ({ onAccept }: PrivacyNoticeProps) => (
  <div className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
    <div className="bg-card rounded-2xl w-full max-w-sm shadow-xl border border-border my-4">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-base font-bold text-foreground text-center">Privacy &amp; Data Notice</h2>
        <p className="text-xs text-muted-foreground text-center mt-1">
          Before you continue, please understand how UrgentNow uses your information.
        </p>
      </div>

      <div className="px-5 py-4 space-y-4">
        <Row
          icon={<Mic className="w-4 h-4" />}
          title="Symptom descriptions are sent to an AI service"
          body="Your spoken or typed symptoms are processed by a third-party AI model (Google Gemini via Lovable) to determine care urgency. Do not include your full name or insurance number in your description."
        />
        <Row
          icon={<MapPin className="w-4 h-4" />}
          title="Your location is used to find nearby clinics"
          body="GPS coordinates or address are used only to locate care facilities and are not stored on our servers. Manual addresses are sent to OpenStreetMap for geocoding."
        />
        <Row
          icon={<Brain className="w-4 h-4" />}
          title="Profile data is stored securely in Supabase"
          body="If you create an account, your health profile (name, DOB, insurance, medications, etc.) is stored in a Supabase database with row-level security — only you can access your own data."
        />
        <Row
          icon={<AlertTriangle className="w-4 h-4 text-amber-warn" />}
          title="This is not a substitute for medical advice"
          body="AI triage results are for informational purposes only. Always consult a licensed healthcare professional for medical decisions. In an emergency, call 911 immediately."
        />

        <div className="bg-muted/50 rounded-xl p-3 text-[10px] text-muted-foreground leading-relaxed">
          Your session history is stored only in your browser for this session and is automatically
          cleared when you close the tab. We do not sell or share your health information with
          advertisers. By continuing, you acknowledge this notice.
        </div>
      </div>

      <div className="px-5 pb-5">
        <button
          onClick={onAccept}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl text-sm hover:opacity-90 transition-opacity shadow-md"
        >
          <Check className="w-4 h-4" />
          I Understand — Continue
        </button>
      </div>
    </div>
  </div>
);

export default PrivacyNotice;
