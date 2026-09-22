import { createClient } from '@supabase/supabase-js';
import { 
  FeedbackEntry, 
  Plant, 
  SystemSettings, 
  FeedbackFilterOptions,
  DashboardStats,
  AdminProfile
} from '../types/database';
import { 
  INITIAL_PLANTS, 
  INITIAL_SETTINGS,
  INITIAL_FEEDBACKS,
  DEMO_ADMINS 
} from './mockData';

const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  envUrl && 
  envAnonKey && 
  envUrl.includes('supabase.co')
);

export const supabase = isSupabaseConfigured
  ? createClient(envUrl, envAnonKey)
  : null;

const STORAGE_KEYS = {
  FEEDBACKS: 'canteen_feedbacks_v8', // Realistic August data with Bhiwadi & Supa
  PLANTS: 'canteen_plants_v4',
  SETTINGS: 'canteen_settings_v2',
  ADMIN_USERS: 'canteen_admin_users_v2',
  CURRENT_ADMIN: 'canteen_admin_session_v2',
};

type FeedbackListener = (feedback: FeedbackEntry) => void;
const feedbackListeners: Set<FeedbackListener> = new Set();

export const subscribeToRealtimeFeedback = (callback: FeedbackListener) => {
  feedbackListeners.add(callback);
  return () => {
    feedbackListeners.delete(callback);
  };
};

const notifyFeedbackSubmitted = (feedback: FeedbackEntry) => {
  feedbackListeners.forEach((listener) => {
    try {
      listener(feedback);
    } catch (e) {
      console.warn('Realtime feedback listener error', e);
    }
  });
};

const getLocalData = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const setLocalData = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage write error', e);
  }
};

// Deduplication Helper for Plants
const deduplicatePlants = (plantList: Plant[]): Plant[] => {
  const seenKeys = new Set<string>();
  const result: Plant[] = [];

  for (const plant of plantList) {
    if (plant.is_active === false) continue;
    const key = (plant.display_name || `${plant.location} ${plant.name} ${plant.code}`)
      .toLowerCase()
      .replace(/[\s\-_()]/g, '');

    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      result.push(plant);
    }
  }

  return result;
};

export const fetchPlants = async (): Promise<Plant[]> => {
  let list: Plant[] = [];

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('plants').select('*').eq('is_active', true);
      if (!error && data && data.length > 0) {
        list = data;
      }
    } catch (e) {
      // fallback
    }
  }

  if (list.length === 0) {
    const rawLocal = localStorage.getItem(STORAGE_KEYS.PLANTS);
    if (rawLocal === null) {
      setLocalData(STORAGE_KEYS.PLANTS, INITIAL_PLANTS);
      list = INITIAL_PLANTS;
    } else {
      try {
        const parsed = JSON.parse(rawLocal);
        list = Array.isArray(parsed) ? parsed : INITIAL_PLANTS;
      } catch (e) {
        list = INITIAL_PLANTS;
      }
    }
  }

  // Merge initial official plants so Bhiwadi and Supa plants are always available
  const mergedMap = new Map<string, Plant>();
  INITIAL_PLANTS.forEach(p => mergedMap.set(p.id, p));
  list.forEach(p => mergedMap.set(p.id, p));
  const cleanList = deduplicatePlants(Array.from(mergedMap.values()));
  setLocalData(STORAGE_KEYS.PLANTS, cleanList);
  return cleanList;
};

export const savePlant = async (plant: Plant): Promise<Plant[]> => {
  const current = await fetchPlants();
  const updated = deduplicatePlants([plant, ...current.filter(p => p.id !== plant.id)]);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('plants').insert([plant]);
    } catch (e) {
      // fallback
    }
  }
  setLocalData(STORAGE_KEYS.PLANTS, updated);
  return updated;
};

export const updatePlant = async (plant: Plant): Promise<Plant[]> => {
  const current = await fetchPlants();
  const updated = deduplicatePlants(current.map(p => p.id === plant.id ? plant : p));

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('plants').upsert([plant]);
    } catch (e) {
      // fallback
    }
  }
  setLocalData(STORAGE_KEYS.PLANTS, updated);
  return updated;
};

export const deletePlant = async (id: string): Promise<Plant[]> => {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('plants').delete().eq('id', id);
    } catch (e) {
      // fallback
    }
  }
  const current = await fetchPlants();
  const updated = deduplicatePlants(current.filter(p => p.id !== id));
  setLocalData(STORAGE_KEYS.PLANTS, updated);
  return updated;
};

// -----------------------------------------------------------------------
// User & Admin Accounts Management Engine (shared Redis allowlist)
// -----------------------------------------------------------------------
const fetchAdminsFromApi = async (): Promise<AdminProfile[] | null> => {
  try {
    const response = await fetch('/api/admins', { cache: 'no-store' });
    if (!response.ok) return null;
    const data = await response.json();
    return Array.isArray(data?.admins) ? (data.admins as AdminProfile[]) : [];
  } catch {
    return null;
  }
};

export const fetchAdmins = async (): Promise<AdminProfile[]> => {
  const apiList = await fetchAdminsFromApi();
  if (apiList && apiList.length > 0) {
    setLocalData(STORAGE_KEYS.ADMIN_USERS, apiList);
    return apiList;
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('admin_users').select('*');
      if (!error && data && data.length > 0) return data;
    } catch (e) {
      // fallback
    }
  }

  const rawLocal = localStorage.getItem(STORAGE_KEYS.ADMIN_USERS);
  if (rawLocal === null) {
    setLocalData(STORAGE_KEYS.ADMIN_USERS, DEMO_ADMINS);
    return DEMO_ADMINS;
  }

  try {
    const parsed = JSON.parse(rawLocal);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEMO_ADMINS;
  } catch (e) {
    return DEMO_ADMINS;
  }
};

export const saveAdminUser = async (user: AdminProfile): Promise<AdminProfile[]> => {
  const normalized: AdminProfile = {
    ...user,
    email: user.email.trim().toLowerCase(),
  };

  try {
    const response = await fetch('/api/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin: normalized }),
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data?.admins)) {
        setLocalData(STORAGE_KEYS.ADMIN_USERS, data.admins);
        return data.admins;
      }
    }
  } catch (e) {
    console.warn('Admin API save failed', e);
  }

  const current = await fetchAdmins();
  const updated = [normalized, ...current.filter((a) => a.id !== normalized.id)];
  setLocalData(STORAGE_KEYS.ADMIN_USERS, updated);
  return updated;
};

export const updateAdminUser = async (user: AdminProfile): Promise<AdminProfile[]> => {
  const normalized: AdminProfile = {
    ...user,
    email: user.email.trim().toLowerCase(),
  };

  try {
    const response = await fetch('/api/admins', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin: normalized }),
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data?.admins)) {
        setLocalData(STORAGE_KEYS.ADMIN_USERS, data.admins);
        return data.admins;
      }
    }
  } catch (e) {
    console.warn('Admin API update failed', e);
  }

  const current = await fetchAdmins();
  const updated = current.map((a) => (a.id === normalized.id ? normalized : a));
  setLocalData(STORAGE_KEYS.ADMIN_USERS, updated);
  return updated;
};

export const deleteAdminUser = async (id: string): Promise<AdminProfile[]> => {
  try {
    const response = await fetch('/api/admins', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error || 'Failed to delete admin');
    }
    if (Array.isArray(data?.admins)) {
      setLocalData(STORAGE_KEYS.ADMIN_USERS, data.admins);
      return data.admins;
    }
  } catch (e) {
    console.warn('Admin API delete failed', e);
    throw e;
  }

  const current = await fetchAdmins();
  const updated = current.filter((a) => a.id !== id);
  setLocalData(STORAGE_KEYS.ADMIN_USERS, updated);
  return updated;
};

export const fetchSettings = async (): Promise<SystemSettings> => {
  // 1. Try shared API endpoint first
  try {
    const response = await fetch('/api/settings', { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      if (data?.settings && typeof data.settings === 'object') {
        const merged = { ...INITIAL_SETTINGS, ...data.settings };
        setLocalData(STORAGE_KEYS.SETTINGS, merged);
        return merged;
      }
    }
  } catch (e) {
    // fallback
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('system_settings').select('*').single();
      if (!error && data) {
        const merged = { ...INITIAL_SETTINGS, ...data };
        setLocalData(STORAGE_KEYS.SETTINGS, merged);
        return merged;
      }
    } catch (e) {
      // fallback
    }
  }

  return getLocalData<SystemSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
};

export const saveSettings = async (settings: SystemSettings): Promise<SystemSettings> => {
  // 1. Persist to shared API endpoint
  try {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    });
  } catch (e) {
    console.warn('API save settings error', e);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('system_settings').upsert([settings]);
    } catch (e) {
      // fallback
    }
  }
  setLocalData(STORAGE_KEYS.SETTINGS, settings);
  return settings;
};

export const triggerDailyDigestEmail = async (options?: {
  is_test?: boolean;
  to_emails?: string[];
  cc_emails?: string[];
}): Promise<{ ok: boolean; message?: string; error?: string }> => {
  try {
    const response = await fetch('/api/daily-digest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        is_test: options?.is_test ?? true,
        to_emails: options?.to_emails,
        cc_emails: options?.cc_emails,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error || data?.details || 'Failed to dispatch daily digest');
    }

    return { ok: true, message: data?.message || 'Daily digest sent successfully' };
  } catch (err: any) {
    console.error('Trigger daily digest failed', err);
    throw err;
  }
};

// -----------------------------------------------------------------------
// Real-Time Event & Cross-Tab Broadcast Channel Engine
// -----------------------------------------------------------------------
const feedbackChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('canteen_feedback_realtime_channel')
  : null;

if (feedbackChannel) {
  feedbackChannel.onmessage = (event) => {
    if (event.data && event.data.type === 'NEW_FEEDBACK' && event.data.feedback) {
      notifyFeedbackSubmitted(event.data.feedback);
    }
  };
}

const applyFeedbackFilters = (
  list: FeedbackEntry[],
  filters?: FeedbackFilterOptions
): FeedbackEntry[] => {
  if (!filters) return list;

  return list.filter((item) => {
    if (filters.plantId && item.plant_id !== filters.plantId) return false;
    if (filters.mealType && item.meal_type !== filters.mealType) return false;
    if (filters.shift && item.shift !== filters.shift) return false;
    if (filters.minRating && item.overall_rating < filters.minRating) return false;
    if (filters.language && item.language !== filters.language) return false;

    // Robust date range check
    if (filters.startDate) {
      const [sy, sm, sd] = filters.startDate.split('-').map(Number);
      if (sy && sm && sd) {
        const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0).getTime();
        if (new Date(item.created_at).getTime() < start) return false;
      }
    }
    if (filters.endDate) {
      const [ey, em, ed] = filters.endDate.split('-').map(Number);
      if (ey && em && ed) {
        const end = new Date(ey, em - 1, ed, 23, 59, 59, 999).getTime();
        if (new Date(item.created_at).getTime() > end) return false;
      }
    }

    if (filters.search) {
      const query = filters.search.toLowerCase().trim();
      const matchName = item.employee_name?.toLowerCase().includes(query);
      const matchEmpId = item.employee_id?.toLowerCase().includes(query);
      const matchEmail = item.email?.toLowerCase().includes(query);
      const matchRemark = item.remark?.toLowerCase().includes(query);
      const matchId = item.id?.toLowerCase().includes(query);
      const matchPlant =
        item.plant_name?.toLowerCase().includes(query) ||
        item.plant_display_name?.toLowerCase().includes(query) ||
        item.plant_location?.toLowerCase().includes(query);

      if (!matchName && !matchEmpId && !matchEmail && !matchRemark && !matchPlant && !matchId) {
        return false;
      }
    }

    return true;
  });
};

const fetchFeedbacksFromApi = async (): Promise<FeedbackEntry[] | null> => {
  try {
    const response = await fetch('/api/feedback', { cache: 'no-store' });
    if (!response.ok) return null;
    const data = await response.json();
    return Array.isArray(data?.feedbacks) ? (data.feedbacks as FeedbackEntry[]) : [];
  } catch {
    return null;
  }
};

const postFeedbackToApi = async (entry: FeedbackEntry): Promise<FeedbackEntry> => {
  const response = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feedback: entry }),
  });

  const raw = await response.text();
  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.details || data?.error || `Feedback API error (${response.status})`);
  }

  return (data?.feedback as FeedbackEntry) || entry;
};

/** Upload any local-only feedbacks (from phone/PC) that are missing on the shared server. */
const migrateLocalFeedbacksToApi = async (
  apiList: FeedbackEntry[],
  localList: FeedbackEntry[]
): Promise<FeedbackEntry[]> => {
  const apiIds = new Set(apiList.map((f) => f.id));
  const orphans = localList.filter((f) => f?.id && !apiIds.has(f.id) && !String(f.id).startsWith('fb-mock-'));

  if (orphans.length === 0) return apiList;

  const uploaded: FeedbackEntry[] = [];
  for (const orphan of orphans) {
    try {
      uploaded.push(await postFeedbackToApi(orphan));
    } catch (e) {
      console.warn('Failed to migrate local feedback', orphan.id, e);
    }
  }

  if (uploaded.length === 0) return apiList;

  const refreshed = await fetchFeedbacksFromApi();
  return refreshed || [...uploaded, ...apiList];
};

export const fetchFeedbacks = async (
  filters?: FeedbackFilterOptions,
  options?: { migrateLocal?: boolean }
): Promise<FeedbackEntry[]> => {
  let localList = getLocalData<FeedbackEntry[]>(STORAGE_KEYS.FEEDBACKS, []);
  if (localList.length === 0) {
    localList = INITIAL_FEEDBACKS;
    setLocalData(STORAGE_KEYS.FEEDBACKS, INITIAL_FEEDBACKS);
  }

  const shouldMigrate = options?.migrateLocal === true;

  // Shared server store first — required so QR (phone) submissions appear on admin dashboard
  const apiList = await fetchFeedbacksFromApi();
  if (apiList && apiList.length > 0) {
    const merged = shouldMigrate
      ? await migrateLocalFeedbacksToApi(apiList, localList)
      : apiList;
    setLocalData(STORAGE_KEYS.FEEDBACKS, merged);
    return applyFeedbackFilters(merged, filters);
  }

  let list: FeedbackEntry[] = [];

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('feedback_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        list = data;
      }
    } catch (e) {
      // fallback
    }
  }

  if (list.length === 0) {
    list = localList;
  }

  return applyFeedbackFilters(list, filters);
};

export const submitFeedback = async (
  entry: Omit<FeedbackEntry, 'id' | 'created_at'>
): Promise<FeedbackEntry> => {
  const newEntry: FeedbackEntry = {
    ...entry,
    id: `fb-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    created_at: new Date().toISOString(),
  };

  // Must persist to shared API so admin dashboard (other devices) can see it
  const savedEntry = await postFeedbackToApi(newEntry);

  const existing = getLocalData<FeedbackEntry[]>(STORAGE_KEYS.FEEDBACKS, []);
  const updated = [savedEntry, ...existing.filter((e) => e.id !== savedEntry.id)];
  setLocalData(STORAGE_KEYS.FEEDBACKS, updated);

  if (feedbackChannel) {
    try {
      feedbackChannel.postMessage({ type: 'NEW_FEEDBACK', feedback: savedEntry });
    } catch (e) {
      // silent catch
    }
  }

  notifyFeedbackSubmitted(savedEntry);
  return savedEntry;
};

export const deleteFeedbackEntry = async (id: string): Promise<void> => {
  try {
    await fetch('/api/feedback', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  } catch (e) {
    console.warn('Shared feedback API delete failed', e);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('feedback_entries').delete().eq('id', id);
    } catch (e) {
      // fallback
    }
  }

  const existing = getLocalData<FeedbackEntry[]>(STORAGE_KEYS.FEEDBACKS, []);
  const updated = existing.filter((e) => e.id !== id);
  setLocalData(STORAGE_KEYS.FEEDBACKS, updated);
};

export const deleteMultipleFeedbackEntries = async (ids: string[]): Promise<void> => {
  try {
    await fetch('/api/feedback', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
  } catch (e) {
    console.warn('Shared feedback API bulk delete failed', e);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('feedback_entries').delete().in('id', ids);
    } catch (e) {
      // fallback
    }
  }

  const existing = getLocalData<FeedbackEntry[]>(STORAGE_KEYS.FEEDBACKS, []);
  const updated = existing.filter((e) => !ids.includes(e.id));
  setLocalData(STORAGE_KEYS.FEEDBACKS, updated);
};

const ADMIN_SESSION_HOURS = 12;

type StoredAdminSession = {
  admin: AdminProfile;
  expiresAt: number;
};

const isAdminProfile = (value: unknown): value is AdminProfile => {
  return Boolean(value && typeof value === 'object' && 'email' in (value as object) && 'id' in (value as object));
};

export const getCurrentAdminSession = (): AdminProfile | null => {
  const raw = getLocalData<StoredAdminSession | AdminProfile | null>(STORAGE_KEYS.CURRENT_ADMIN, null);
  if (!raw) return null;

  // Legacy format: bare AdminProfile
  if (isAdminProfile(raw) && !('expiresAt' in raw)) {
    return raw;
  }

  const session = raw as StoredAdminSession;
  if (!session.admin || !session.expiresAt) return null;

  if (Date.now() > session.expiresAt) {
    setLocalData(STORAGE_KEYS.CURRENT_ADMIN, null);
    return null;
  }

  return session.admin;
};

export const setAdminSession = (admin: AdminProfile | null): void => {
  if (!admin) {
    setLocalData(STORAGE_KEYS.CURRENT_ADMIN, null);
    return;
  }

  const payload: StoredAdminSession = {
    admin,
    expiresAt: Date.now() + ADMIN_SESSION_HOURS * 60 * 60 * 1000,
  };
  setLocalData(STORAGE_KEYS.CURRENT_ADMIN, payload);
};

export const calculateDashboardStats = (feedbacks: FeedbackEntry[]): DashboardStats => {
  if (!feedbacks || feedbacks.length === 0) {
    return {
      todayCount: 0,
      weeklyCount: 0,
      monthlyCount: 0,
      averageRating: 0,
      happyPercentage: 0,
      poorCount: 0,
      totalRemarks: 0,
      satisfactionScore: 0,
    };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayFeedbacks = feedbacks.filter((f) => f.created_at.startsWith(todayStr));

  const totalRatingSum = feedbacks.reduce((acc, curr) => acc + curr.overall_rating, 0);
  const avgRating = Number((totalRatingSum / feedbacks.length).toFixed(1));

  const happyCount = feedbacks.filter((f) => f.overall_rating >= 4).length;
  const happyPct = Math.round((happyCount / feedbacks.length) * 100);

  const poorCount = feedbacks.filter((f) => f.overall_rating <= 2).length;
  const remarksCount = feedbacks.filter((f) => f.remark && f.remark.trim().length > 0).length;

  return {
    todayCount: todayFeedbacks.length,
    weeklyCount: feedbacks.length,
    monthlyCount: feedbacks.length,
    averageRating: avgRating,
    happyPercentage: happyPct,
    poorCount: poorCount,
    totalRemarks: remarksCount,
    satisfactionScore: happyPct,
  };
};

export const purge72HoursFeedbacks = async (hours: number = 72): Promise<number> => {
  try {
    const res = await fetch(`/api/feedback?action=purge_72h&hours=${hours}`, { method: 'DELETE' });
    if (res.ok) {
      const data = await res.json();
      const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
      const existing = getLocalData<FeedbackEntry[]>(STORAGE_KEYS.FEEDBACKS, []);
      const kept = existing.filter(f => new Date(f.created_at).getTime() >= cutoffTime);
      setLocalData(STORAGE_KEYS.FEEDBACKS, kept);
      return typeof data.purged === 'number' ? data.purged : (existing.length - kept.length);
    }
  } catch (e) {
    console.warn('API purge error', e);
  }
  const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
  const existing = getLocalData<FeedbackEntry[]>(STORAGE_KEYS.FEEDBACKS, []);
  const kept = existing.filter(f => new Date(f.created_at).getTime() >= cutoffTime);
  setLocalData(STORAGE_KEYS.FEEDBACKS, kept);
  return existing.length - kept.length;
};

export const resetToAugustMockData = async (): Promise<FeedbackEntry[]> => {
  setLocalData(STORAGE_KEYS.FEEDBACKS, INITIAL_FEEDBACKS);
  try {
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedbacks: INITIAL_FEEDBACKS, overwrite: true }),
    });
  } catch (e) {
    console.warn('Could not sync mock data to API', e);
  }
  return INITIAL_FEEDBACKS;
};
