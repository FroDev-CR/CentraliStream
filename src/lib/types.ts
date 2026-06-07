// Tipos del dominio — espejo del esquema en supabase/migrations.

export type UserRole = "admin" | "customer";
export type BillingModel = "profile" | "full_account" | "both";
export type AccountStatus =
  | "active"
  | "expiring"
  | "expired"
  | "problem"
  | "disabled";
export type ProfileStatus = "available" | "reserved" | "sold" | "disabled";
export type ProductType = "profile" | "full_account";
export type OrderKind = "purchase" | "credit_topup";
export type OrderStatus =
  | "pending"
  | "paid"
  | "fulfilled"
  | "rejected"
  | "cancelled"
  | "expired";
export type PaymentMethod = "sinpe" | "credits";
export type SinpeStatus = "unmatched" | "matched" | "ignored";
export type CreditTxnType = "topup" | "purchase" | "refund" | "adjustment";
export type EntitlementStatus = "active" | "expired" | "revoked";
export type RequestType = "pin_change" | "profile_name_change";
export type RequestStatus = "pending" | "in_progress" | "done" | "rejected";
export type TicketStatus = "open" | "pending" | "closed";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  sinpe_name: string | null;
  credit_balance: number;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  color: string | null;
  billing_model: BillingModel;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface StreamingAccount {
  id: string;
  service_id: string;
  email: string;
  password: string;
  label: string | null;
  max_profiles: number;
  cost: number | null;
  purchased_at: string | null;
  paid_through: string | null;
  status: AccountStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccountProfile {
  id: string;
  account_id: string;
  profile_label: string | null;
  profile_name: string | null;
  pin: string | null;
  status: ProfileStatus;
  assigned_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  service_id: string;
  name: string;
  type: ProductType;
  price: number;
  duration_days: number;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface SinpeMessage {
  id: string;
  raw_text: string;
  sender_name: string | null;
  amount: number | null;
  detail: string | null;
  reference: string | null;
  external_id: string | null;
  status: SinpeStatus;
  matched_order_id: string | null;
  received_at: string;
  created_at: string;
}

export interface Order {
  id: string;
  code: string;
  customer_id: string;
  kind: OrderKind;
  product_id: string | null;
  amount: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  sinpe_message_id: string | null;
  expires_at: string | null;
  paid_at: string | null;
  fulfilled_at: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Entitlement {
  id: string;
  customer_id: string;
  order_id: string | null;
  product_id: string | null;
  account_id: string | null;
  account_profile_id: string | null;
  starts_at: string;
  ends_at: string;
  status: EntitlementStatus;
  created_at: string;
}

export interface ServiceRequest {
  id: string;
  customer_id: string;
  entitlement_id: string | null;
  account_profile_id: string | null;
  type: RequestType;
  requested_value: string | null;
  status: RequestStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: string;
  customer_id: string;
  subject: string | null;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
}
