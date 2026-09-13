export type Patient = {
  id?: string;
  privy_user_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  blood_group: string | null;
  allergies: string | null;
  conditions: string | null;
  medications: string | null;
  medical_history: string | null;
};

export type Journey = {
  id: string;
  condition: string | null;
  treatment: string | null;
  destination_country: string | null;
  destination_city: string | null;
  hospital_name: string | null;
  status: string | null;
  escrow_status: string | null;
  total_cost_usd: number | null;
  created_at: string;
  updated_at: string | null;
};

export type Consultation = {
  id: string;
  journey_id: string | null;
  privy_user_id: string;
  doctor_name: string | null;
  reason: string | null;
  scheduled_at: string | null;
  meeting_url: string | null;
  status: string | null; // scheduled | completed | cancelled
  diagnosis: string | null;
  recommendations: string | null;
  prescription: string | null;
  recommended_hospital: string | null;
  estimated_cost_usd: number | null;
  completed_at: string | null;
  created_at: string;
};

export type MedicalReport = {
  id: string;
  privy_user_id: string;
  journey_id: string | null;
  file_url: string | null;   // storage path
  file_name: string | null;
  content_type: string | null;
  title: string | null;
  ai_analysis: string | null;
  created_at: string;
};

export const STATUS_META: Record<string, { label: string; cls: string }> = {
  intake: { label: "In intake", cls: "bg-slate-100 text-slate-600" },
  recommendation: { label: "Choosing hospital", cls: "bg-blue-100 text-blue-700" },
  travel: { label: "Planning travel", cls: "bg-indigo-100 text-indigo-700" },
  payment: { label: "Ready to pay", cls: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Confirmed", cls: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelled", cls: "bg-rose-100 text-rose-700" },
};
