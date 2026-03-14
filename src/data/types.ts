export interface Clinic {
  id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  wait_time_min: number;
  travel_time_min: number;
  rating: number;
  provider: string;
  status: string;
  url: string;
  phone?: string;
  distance_miles?: number;
}

export type CareType = "urgent_care" | "er" | "critical";

export type AppState = "hero" | "recording" | "confirm" | "analyzing" | "insurance_select" | "dashboard" | "er_dashboard" | "critical";

export interface TriageResult {
  care_type: CareType;
  severity: "low" | "moderate" | "high" | "critical";
  recommendation: string;
}
