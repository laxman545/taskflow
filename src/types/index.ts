export type ServiceType = 'print' | 'photocopy' | 'photo_print' | 'citizenship';
export type JobStatus =
  | 'unassigned'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'new'
  | 'processing'
  | 'ready'
  | 'printing';

export type PaperSize = 'A4' | 'A3' | 'A5';
export type CitizenshipPaperMode = 'a5' | 'a4_combo' | 'a4_full';
export type PageOrientation = 'portrait' | 'landscape';
export type Language = 'en' | 'ne';
export type StaffRole = 'owner' | 'manager' | 'staff' | 'admin';
export type StaffStatus = 'active' | 'disabled';
export type CalendarMode = 'AD' | 'BS' | 'BOTH';

export interface PrintingService {
  id: string;
  shop_id: string;
  name: string;
  service_type: ServiceType | 'other';
  paper_size?: PaperSize | 'other';
  is_color?: boolean;
  unit_price: number; // in Rs. NPR (Owner configured)
  unit_label: string; // e.g. 'per page', 'per photo', 'per sheet'
  is_active: boolean;
  description?: string;
  created_at: string;
}

export interface StaffPermissions {
  canViewRevenue: boolean;
  canManageStaff: boolean;
  canReassignJobs: boolean;
  canViewAnalytics: boolean;
  canManageSettings: boolean;
  canManagePrices?: boolean;
}

export interface StaffMember {
  id: string;
  shop_id: string;
  name: string;
  email: string;
  username?: string; // Unique staff username e.g. 'abcdigital-s1'
  password?: string; // Staff login password
  role: StaffRole;
  status: StaffStatus;
  active?: number;
  avatar_url?: string;
  permissions: StaffPermissions;
  created_at: string;
  last_active_at?: string;
}

export interface Shop {
  id: string;
  shop_name: string;
  username?: string; // Custom unique shop username (e.g. 'pashupatidigital')
  password?: string; // Owner account login password
  owner_name?: string;
  owner_id?: string;
  owner_google_id?: string;
  email?: string;
  phone: string;
  address: string;
  logo_url?: string;
  qr_slug: string;
  tagline?: string;
  hide_revenue_by_default?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface GoogleAuthUser {
  google_id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

export interface AuthSession {
  user: GoogleAuthUser;
  token?: string;
  login_at: string;
}

export type PrintFileStatus =
  | 'file_received'
  | 'ready_to_print'
  | 'printing'
  | 'printed'
  | 'print_failed';

export interface PrintRecord {
  id: string;
  order_id: string;
  job_number: string;
  file_id: string;
  file_name: string;
  staff_id: string;
  staff_name: string;
  pc?: string;
  printed_at: string;
  service_type: ServiceType;
  paper_size: PaperSize;
  color_mode: 'color' | 'bw';
  copies: number;
  pages: number;
  total_prints: number;
  status: 'printing' | 'printed' | 'print_failed';
  notes?: string;
}

export interface JobFile {
  id: string;
  job_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  preview_url?: string;
  data_url?: string;
  pages?: number;
  created_at: string;
  expires_at: string;
  print_status?: PrintFileStatus;
  last_printed_at?: string;
  last_printed_by?: string;
  is_original_locked?: boolean;
}

export interface JobReferral {
  from_staff_id: string;
  from_staff_name: string;
  to_staff_id: string;
  to_staff_name: string;
  timestamp: string;
  note?: string;
}

export interface Job {
  id: string;
  shop_id: string;
  job_number: string;
  customer_name?: string;
  service_type: ServiceType;
  status: JobStatus;
  copies: number;
  is_color: boolean;
  paper_size: PaperSize;
  is_double_sided: boolean;
  page_count: number; // pages per copy
  total_prints: number; // page_count * copies
  order_amount: number; // NPR (Rs) - configured by Owner, strictly hidden from staff
  instructions?: string;
  files: JobFile[];
  
  // Multi-staff & PC tracking fields
  assigned_to?: string; // staff id
  assigned_to_name?: string;
  assigned_at?: string;
  created_by?: string;
  created_by_name?: string;
  completed_by?: string;
  completed_by_name?: string;
  completed_at?: string;

  // Referral tracking (Requirement 9)
  referral_history?: JobReferral[];

  // Direct Print records (Requirements 28-36)
  print_records?: PrintRecord[];

  created_at: string;
  updated_at: string;
  expires_at: string;

  // Shop details for customer tracking
  shop_name?: string;
  shop_phone?: string;
  shop_address?: string;
  shop_tagline?: string;
}

export interface OutgoingFile {
  id: string;
  transfer_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  preview_url?: string;
  data_url?: string;
  expires_at: string;
}

export interface OutgoingTransfer {
  id: string;
  shop_id: string;
  customer_name: string;
  pin_hash: string;
  raw_pin_for_shop?: string;
  failed_attempts: number;
  locked_until: string | null;
  download_count: number;
  max_downloads: number;
  status: 'waiting' | 'downloaded' | 'expired';
  files: OutgoingFile[];
  created_at: string;
  expires_at: string;

  // Delivery tracking fields (Requirement 11)
  sent_by_staff_id?: string;
  sent_by_staff_name?: string;
  delivered_at?: string;
}

export interface ShopNotification {
  id: string;
  shop_id: string;
  recipient_staff_id: string; // staff id or 'all'
  order_id?: string;
  job_number?: string;
  title: string;
  message: string;
  from_staff_name: string;
  read_status: boolean;
  is_read?: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  shop_id: string;
  staff_id: string;
  staff_name: string;
  action: string;
  description: string;
  order_id?: string;
  job_number?: string;
  created_at: string;
}

export interface PeriodStats {
  ordersCount: number;
  totalPrints: number;
  revenue: number;
  a4Prints: number;
  a3Prints: number;
  a5Prints?: number;
  photoPrints: number;
  citizenshipPrints?: number;
  photocopyPrints?: number;
  bwPrints: number;
  colorPrints: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  avgOrderValue?: number;
}

export interface StaffPerformanceStats {
  staff_id: string;
  staff_name: string;
  role: StaffRole;
  completed_orders: number;
  total_prints: number;
  a4_prints: number;
  a3_prints: number;
  photo_prints: number;
  total_revenue: number;
  last_action?: string;
}

export type AppView = 'home' | 'customer' | 'shop' | 'setup' | 'admin';
export type CustomerViewStep = 'shop_select' | 'landing' | 'send' | 'status' | 'receive';
export type ShopTab =
  | 'overview'
  | 'available_jobs'
  | 'my_jobs'
  | 'live_jobs'
  | 'staff_workload'
  | 'services_prices'
  | 'analytics'
  | 'history'
  | 'staff'
  | 'activity'
  | 'send_file'
  | 'qr_poster'
  | 'profile';
