export type MealType = string;
export type ShiftType = string;
export type AdminRole = 'super_admin' | 'it_admin' | 'hr_admin';
export type LanguageCode = 'en' | 'hi';

export interface ShiftConfig {
  id: string;
  name: string; // e.g. "Morning Shift"
  start_time: string; // e.g. "06:00"
  end_time: string; // e.g. "14:00"
  category: 'Day' | 'Night'; // Day (Lunch) vs Night (Dinner)
  display_label?: string; // e.g. "Morning Shift (06:00 - 14:00)"
}

export interface Plant {
  id: string;
  name: string; // Plant Name
  code: string; // Plant Code
  location: string; // Location
  display_name: string; // Custom Display Name shown everywhere
  is_active: boolean;
  notification_email?: string; // Plant-Specific HR / Contractor Alert Email
  to_emails?: string[]; // Plant-Specific TO Recipients for Daily Digest
  cc_emails?: string[]; // Plant-Specific CC Recipients for Daily Digest
  created_at?: string;
}

export interface PlantDigestRecipients {
  to_emails: string[];
  cc_emails: string[];
}

export interface FeedbackEntry {
  id: string;
  language: LanguageCode;
  plant_id: string;
  plant_name?: string;
  plant_code?: string;
  plant_location?: string;
  plant_display_name?: string;
  meal_type: MealType;
  shift: ShiftType;
  food_taste: number;
  food_quality: number;
  staff_behaviour: number;
  hygiene: number;
  overall_rating: number;
  remark?: string;
  employee_name?: string;
  employee_id?: string;
  email?: string;
  phone?: string;
  device_info?: string;
  browser?: string;
  submitted_from?: string;
  created_at: string;
}

export interface AdminProfile {
  id: string;
  employee_id?: string;
  email: string;
  full_name: string;
  role: AdminRole;
  location?: string;
  plant_id?: string;
  created_at?: string;
}

export interface DailyDigestConfig {
  enabled: boolean;
  to_emails: string[];
  cc_emails: string[];
  scheduled_time: string; // e.g. "20:00" (IST)
  unsatisfied_threshold_alert: number; // e.g. 20 (%)
  plant_recipients?: Record<string, PlantDigestRecipients>;
  last_sent_at?: string;
}

export interface SystemSettings {
  id?: string;
  company_name: string;
  company_logo_url: string;
  enable_english: boolean;
  enable_hindi: boolean;
  meal_types: MealType[];
  shifts: (string | ShiftConfig)[];
  theme_mode: 'light' | 'dark';
  notification_email?: string;
  enable_email_alerts?: boolean;
  daily_digest?: DailyDigestConfig;
}

export interface FeedbackFilterOptions {
  search?: string;
  startDate?: string;
  endDate?: string;
  plantId?: string;
  mealType?: string;
  shift?: string;
  minRating?: number;
  language?: string;
}

export interface DashboardStats {
  todayCount: number;
  weeklyCount: number;
  monthlyCount: number;
  averageRating: number;
  happyPercentage: number;
  poorCount: number;
  totalRemarks: number;
  satisfactionScore: number;
}
