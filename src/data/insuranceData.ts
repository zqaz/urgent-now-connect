export interface InsuranceOption {
  id: string;
  name: string;
  shortName: string;
  color: string; // Tailwind bg color class
  textColor: string; // Tailwind text color class
}

export const INSURANCE_OPTIONS: InsuranceOption[] = [
  {
    id: "premera",
    name: "Premera Blue Cross",
    shortName: "Premera",
    color: "bg-blue-100",
    textColor: "text-blue-700",
  },
  {
    id: "regence",
    name: "Regence BlueShield",
    shortName: "Regence",
    color: "bg-sky-100",
    textColor: "text-sky-700",
  },
  {
    id: "kaiser",
    name: "Kaiser Permanente",
    shortName: "Kaiser",
    color: "bg-purple-100",
    textColor: "text-purple-700",
  },
  {
    id: "aetna",
    name: "Aetna",
    shortName: "Aetna",
    color: "bg-red-100",
    textColor: "text-red-700",
  },
  {
    id: "cigna",
    name: "Cigna",
    shortName: "Cigna",
    color: "bg-orange-100",
    textColor: "text-orange-700",
  },
  {
    id: "united",
    name: "UnitedHealthcare",
    shortName: "UHC",
    color: "bg-yellow-100",
    textColor: "text-yellow-700",
  },
  {
    id: "molina",
    name: "Molina Healthcare",
    shortName: "Molina",
    color: "bg-teal-100",
    textColor: "text-teal-700",
  },
  {
    id: "medicare",
    name: "Medicare",
    shortName: "Medicare",
    color: "bg-indigo-100",
    textColor: "text-indigo-700",
  },
  {
    id: "medicaid",
    name: "Medicaid (Apple Health)",
    shortName: "Medicaid",
    color: "bg-green-100",
    textColor: "text-green-700",
  },
  {
    id: "self_pay",
    name: "No Insurance / Self-Pay",
    shortName: "Self-Pay",
    color: "bg-gray-100",
    textColor: "text-gray-700",
  },
];

/**
 * Maps a clinic's `provider` field to the list of insurance IDs it accepts.
 * Keys are matched case-insensitively as substrings of clinic.provider.
 * Clinics whose provider doesn't match any key show a "Call to Verify" badge.
 */
export const PROVIDER_INSURANCE_MAP: Record<string, string[]> = {
  // UW Medicine — Harborview, UW Medical Center, UW Urgent Care locations
  "UW Medicine": [
    "premera", "regence", "aetna", "cigna", "united",
    "molina", "medicare", "medicaid", "self_pay",
  ],

  // Swedish Medical Center (Providence)
  "Swedish": [
    "premera", "regence", "aetna", "cigna", "united",
    "molina", "medicare", "medicaid", "self_pay",
  ],

  // Virginia Mason Franciscan Health
  "Virginia Mason": [
    "premera", "regence", "aetna", "cigna", "united",
    "medicare", "self_pay",
  ],

  // ZoomCare — does not accept Medicare/Medicaid or Kaiser
  "ZoomCare": [
    "premera", "regence", "aetna", "cigna", "united", "self_pay",
  ],

  // MultiCare Indigo Urgent Care
  "MultiCare": [
    "premera", "regence", "aetna", "cigna", "united",
    "molina", "medicare", "medicaid", "self_pay",
  ],
  "MultiCare Indigo": [
    "premera", "regence", "aetna", "cigna", "united",
    "molina", "medicare", "medicaid", "self_pay",
  ],

  // Kaiser Permanente facilities — in-network ONLY for Kaiser members
  "Kaiser": ["kaiser", "self_pay"],
  "Kaiser Permanente": ["kaiser", "self_pay"],

  // Providence Regional
  "Providence": [
    "premera", "regence", "aetna", "cigna", "united",
    "molina", "medicare", "medicaid", "self_pay",
  ],

  // Overlake Medical Center
  "Overlake": [
    "premera", "regence", "aetna", "cigna", "united",
    "medicare", "medicaid", "self_pay",
  ],
};

export type NetworkStatus = "in_network" | "out_of_network" | "call_to_verify" | "none";

/**
 * Returns the network status of a clinic for a given selected insurance.
 * Returns "none" when no insurance has been selected (skip/null).
 */
export function getNetworkStatus(
  clinicProvider: string,
  selectedInsuranceId: string | null
): NetworkStatus {
  if (!selectedInsuranceId) return "none";

  // Self-pay is always accepted everywhere
  if (selectedInsuranceId === "self_pay") return "in_network";

  // Try to find a matching provider key (case-insensitive substring match)
  const matchedKey = Object.keys(PROVIDER_INSURANCE_MAP).find((key) =>
    clinicProvider.toLowerCase().includes(key.toLowerCase()) ||
    key.toLowerCase().includes(clinicProvider.toLowerCase())
  );

  if (!matchedKey) return "call_to_verify";

  const accepted = PROVIDER_INSURANCE_MAP[matchedKey];
  return accepted.includes(selectedInsuranceId) ? "in_network" : "out_of_network";
}
