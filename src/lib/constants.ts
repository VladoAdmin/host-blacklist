export const INCIDENT_TYPES = [
  { value: "damage", label: "Property Damage" },
  { value: "theft", label: "Theft" },
  { value: "noise", label: "Noise Complaint" },
  { value: "fraud", label: "Fraud" },
  { value: "no_show", label: "No Show" },
  { value: "other", label: "Other" },
] as const;

export const PLATFORMS = [
  { value: "Airbnb", label: "Airbnb" },
  { value: "Booking", label: "Booking.com" },
  { value: "Direct", label: "Direct Booking" },
  { value: "Other", label: "Other" },
] as const;

export const SEVERITY_LABELS = [
  { value: 1, label: "Minor" },
  { value: 2, label: "Low" },
  { value: 3, label: "Medium" },
  { value: 4, label: "High" },
  { value: 5, label: "Critical" },
] as const;

export const VALID_INCIDENT_TYPES = INCIDENT_TYPES.map((t) => t.value) as string[];
export const VALID_PLATFORMS = PLATFORMS.map((p) => p.value) as string[];
