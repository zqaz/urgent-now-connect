import { useState, useEffect } from "react";
import {
  X, User, ShieldCheck,
  Pill, Stethoscope, Phone, FileText, Save, Loader2, LogOut, CheckCircle2,
} from "lucide-react";
import { UserProfile, UserProfileUpdate } from "@/hooks/useProfile";
import { INSURANCE_OPTIONS } from "@/data/insuranceData";

interface ProfileModalProps {
  profile: UserProfile | null;
  userEmail: string | undefined;
  saving: boolean;
  isLocalMode?: boolean;
  onSave: (updates: UserProfileUpdate) => Promise<{ error: Error | null }>;
  onSignOut: () => void;
  onClose: () => void;
}

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const SectionTitle = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex items-center gap-2 mb-3 mt-5 first:mt-0">
    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
      {icon}
    </div>
    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mb-3">
    <label className="block text-xs font-semibold text-foreground mb-1.5">{label}</label>
    {children}
  </div>
);

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none";

const ProfileModal = ({
  profile,
  userEmail,
  saving,
  isLocalMode = false,
  onSave,
  onSignOut,
  onClose,
}: ProfileModalProps) => {
  const [form, setForm] = useState<UserProfileUpdate>({
    name: "",
    date_of_birth: "",
    insurance_id: "",
    blood_type: "",
    allergies: "",
    medications: "",
    conditions: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    notes: "",
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? "",
        date_of_birth: profile.date_of_birth ?? "",
        insurance_id: profile.insurance_id ?? "",
        blood_type: profile.blood_type ?? "",
        allergies: profile.allergies ?? "",
        medications: profile.medications ?? "",
        conditions: profile.conditions ?? "",
        emergency_contact_name: profile.emergency_contact_name ?? "",
        emergency_contact_phone: profile.emergency_contact_phone ?? "",
        notes: profile.notes ?? "",
      });
    }
  }, [profile]);

  const set = (field: keyof UserProfileUpdate, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value || null }));

  const handleSave = async () => {
    setError(null);
    const { error: err } = await onSave(form);
    if (err) {
      setError(err.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const initials = form.name
    ? form.name.trim().split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : userEmail?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-6 px-4">
      <div className="bg-card rounded-2xl w-full max-w-md shadow-xl border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">{initials}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{form.name || "My Profile"}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[180px]">{userEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onSignOut}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-5 space-y-0">
          {/* Personal */}
          <SectionTitle icon={<User className="w-3.5 h-3.5" />} label="Personal" />

          <Field label="Full Name">
            <input
              type="text"
              value={form.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Jane Doe"
              autoComplete="off"
              className={inputClass}
            />
          </Field>

          <Field label="Date of Birth">
            <input
              type="date"
              value={form.date_of_birth ?? ""}
              onChange={(e) => set("date_of_birth", e.target.value)}
              autoComplete="off"
              className={inputClass}
            />
          </Field>

          {/* Insurance */}
          <SectionTitle icon={<ShieldCheck className="w-3.5 h-3.5" />} label="Insurance" />

          <Field label="Insurance Provider">
            <select
              value={form.insurance_id ?? ""}
              onChange={(e) => set("insurance_id", e.target.value)}
              className={inputClass}
            >
              <option value="">— Select insurance —</option>
              {INSURANCE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
          </Field>

          {form.insurance_id && (
            <p className="text-[11px] text-green-600 bg-green-50 rounded-lg px-3 py-1.5 -mt-1 mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" />
              Insurance saved — the picker will be skipped automatically next time.
            </p>
          )}

          {/* Medical Info */}
          <SectionTitle icon={<Stethoscope className="w-3.5 h-3.5" />} label="Medical Info" />

          <Field label="Blood Type">
            <select
              value={form.blood_type ?? ""}
              onChange={(e) => set("blood_type", e.target.value)}
              className={inputClass}
            >
              <option value="">— Unknown —</option>
              {BLOOD_TYPES.map((bt) => (
                <option key={bt} value={bt}>{bt}</option>
              ))}
            </select>
          </Field>

          <Field label="Known Allergies">
            <textarea
              rows={2}
              value={form.allergies ?? ""}
              onChange={(e) => set("allergies", e.target.value)}
              placeholder="e.g. Penicillin, peanuts, latex..."
              autoComplete="off"
              className={inputClass}
            />
          </Field>

          <Field label="Current Medications">
            <textarea
              rows={2}
              value={form.medications ?? ""}
              onChange={(e) => set("medications", e.target.value)}
              placeholder="e.g. Metformin 500mg, Lisinopril 10mg..."
              autoComplete="off"
              className={inputClass}
            />
          </Field>

          <Field label="Existing Medical Conditions">
            <textarea
              rows={2}
              value={form.conditions ?? ""}
              onChange={(e) => set("conditions", e.target.value)}
              placeholder="e.g. Type 2 Diabetes, Asthma, Hypertension..."
              autoComplete="off"
              className={inputClass}
            />
          </Field>

          {/* Emergency Contact */}
          <SectionTitle icon={<Phone className="w-3.5 h-3.5" />} label="Emergency Contact" />

          <Field label="Contact Name">
            <input
              type="text"
              value={form.emergency_contact_name ?? ""}
              onChange={(e) => set("emergency_contact_name", e.target.value)}
              placeholder="John Doe"
              autoComplete="off"
              className={inputClass}
            />
          </Field>

          <Field label="Contact Phone">
            <input
              type="tel"
              value={form.emergency_contact_phone ?? ""}
              onChange={(e) => set("emergency_contact_phone", e.target.value)}
              placeholder="(206) 555-0100"
              autoComplete="off"
              className={inputClass}
            />
          </Field>

          {/* Additional Notes */}
          <SectionTitle icon={<FileText className="w-3.5 h-3.5" />} label="Additional Notes" />

          <Field label="Other health notes">
            <textarea
              rows={3}
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Anything else relevant to your care..."
              autoComplete="off"
              className={inputClass}
            />
          </Field>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-2">{error}</p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3.5 px-4 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50 mt-5"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <><CheckCircle2 className="w-4 h-4" /> Saved!</>
            ) : (
              <><Save className="w-4 h-4" /> Save Profile</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
