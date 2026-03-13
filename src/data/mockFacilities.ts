export type FacilityType = "urgent-care" | "emergency-room" | "pharmacy";

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  address: string;
  phone: string;
  distance: number; // miles
  driveTime: number; // minutes
  waitTime?: number; // minutes, undefined = unknown
  lat: number;
  lng: number;
  open24h: boolean;
}

export const mockFacilities: Facility[] = [
  {
    id: "1",
    name: "CityMed Urgent Care",
    type: "urgent-care",
    address: "1234 Main St, Suite 100",
    phone: "+18005551234",
    distance: 0.8,
    driveTime: 3,
    waitTime: 15,
    lat: 40.7128,
    lng: -74.006,
    open24h: false,
  },
  {
    id: "2",
    name: "St. Mary's Emergency Room",
    type: "emergency-room",
    address: "500 Hospital Blvd",
    phone: "+18005555678",
    distance: 1.2,
    driveTime: 5,
    waitTime: 45,
    lat: 40.715,
    lng: -74.009,
    open24h: true,
  },
  {
    id: "3",
    name: "QuickCare Walk-In Clinic",
    type: "urgent-care",
    address: "789 Oak Avenue",
    phone: "+18005559012",
    distance: 1.5,
    driveTime: 6,
    waitTime: 25,
    lat: 40.718,
    lng: -74.002,
    open24h: false,
  },
  {
    id: "4",
    name: "CVS Pharmacy",
    type: "pharmacy",
    address: "321 Elm Street",
    phone: "+18005553456",
    distance: 0.4,
    driveTime: 2,
    lat: 40.711,
    lng: -74.004,
    open24h: true,
  },
  {
    id: "5",
    name: "General Hospital ER",
    type: "emergency-room",
    address: "1000 Medical Center Dr",
    phone: "+18005557890",
    distance: 2.3,
    driveTime: 9,
    waitTime: 30,
    lat: 40.722,
    lng: -74.012,
    open24h: true,
  },
  {
    id: "6",
    name: "Walgreens Pharmacy",
    type: "pharmacy",
    address: "456 Broadway",
    phone: "+18005552345",
    distance: 0.6,
    driveTime: 3,
    lat: 40.714,
    lng: -74.007,
    open24h: false,
  },
  {
    id: "7",
    name: "MedExpress Urgent Care",
    type: "urgent-care",
    address: "890 Pine Road",
    phone: "+18005556789",
    distance: 1.9,
    driveTime: 7,
    waitTime: 10,
    lat: 40.72,
    lng: -74.001,
    open24h: false,
  },
  {
    id: "8",
    name: "Rite Aid Pharmacy",
    type: "pharmacy",
    address: "222 Cedar Lane",
    phone: "+18005550123",
    distance: 1.1,
    driveTime: 4,
    lat: 40.716,
    lng: -74.01,
    open24h: false,
  },
];

export const facilityTypeLabels: Record<FacilityType, string> = {
  "urgent-care": "Urgent Care",
  "emergency-room": "Emergency Room",
  "pharmacy": "Pharmacy",
};

export const facilityTypeColors: Record<FacilityType, string> = {
  "urgent-care": "bg-primary text-primary-foreground",
  "emergency-room": "bg-emergency text-emergency-foreground",
  "pharmacy": "bg-success text-success-foreground",
};
