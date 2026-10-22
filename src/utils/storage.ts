import { v4 as uuidv4 } from 'uuid';
import {
  Job,
  Shop,
  StaffMember,
  JobStatus,
  JobFile,
  CalendarMode,
  ShopNotification,
  ServiceType,
  PaperSize,
  PrintRecord,
  StaffPerformanceStats,
  ActivityLog
} from '../types';

export const getPublicShops = async (): Promise<Shop[]> => {
  try {
    const res = await fetch('http://localhost:5000/api/shops/public');
    const data = await res.json();
    if (data.success && data.shops) {
      localStorage.setItem('public_shops', JSON.stringify(data.shops));
      return data.shops;
    }
  } catch (err) {
    console.warn('Could not fetch public shops from server, falling back to cache');
  }
  try {
    const cached = localStorage.getItem('public_shops');
    if (cached) return JSON.parse(cached);
  } catch {}
  return [getShop()];
};

export const getShop = (): Shop => {
  const shopJson = localStorage.getItem('namaste_shop');
  return shopJson
    ? JSON.parse(shopJson)
    : {
        id: 'default_shop_1',
        shop_name: 'Namaste Print',
        tagline: "Nepal's Smart QR Print & File Service",
        logo_url: '',
        phone: '9841234567',
        address: 'New Road, Kathmandu',
        qr_slug: 'namaste-print',
        username: 'namaste-print',
        created_at: new Date().toISOString()
      };
};

export const updateShop = (shop: Shop): Shop => {
  localStorage.setItem('namaste_shop', JSON.stringify(shop));
  broadcastStateChange('SHOP_UPDATED', shop);
  return shop;
};

export const getJobs = (): Job[] => {
  const jobsJson = localStorage.getItem('namaste_jobs');
  return jobsJson ? JSON.parse(jobsJson) : [];
};

export const setJobs = (jobs: Job[]) => {
  localStorage.setItem('namaste_jobs', JSON.stringify(jobs));
  broadcastStateChange('JOBS_UPDATED', jobs);
};

export const getJobsForUser = (userId?: string, status?: JobStatus): Job[] => {
  let jobs = getJobs();
  if (status) {
    jobs = jobs.filter(j => j.status === status);
  }
  if (userId) {
    jobs = jobs.filter(j => !j.assigned_to || j.assigned_to === userId);
  }
  return jobs;
};

export const addJob = async (
  job: Omit<
    Job,
    'id' | 'job_number' | 'created_at' | 'updated_at' | 'status' | 'page_count' | 'total_prints' | 'order_amount' | 'expires_at'
  > & {
    page_count?: number;
    total_prints?: number;
    order_amount?: number;
  }
): Promise<Job> => {
  try {
    const res = await fetch('http://localhost:5000/api/jobs/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job)
    });
    const data = await res.json();
    if (data.success && data.job) {
      const jobs = getJobs();
      jobs.unshift(data.job);
      setJobs(jobs);
      return data.job;
    }
  } catch (err) {
    console.warn('Network error adding job to server, using local fallback:', err);
  }

  const jobs = getJobs();
  const newJob: Job = {
    ...job,
    id: uuidv4(),
    job_number: 'JOB-' + Math.floor(1000 + Math.random() * 9000),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'new',
    page_count: typeof job.page_count === 'number' ? job.page_count : (job.files?.length || 1),
    total_prints: typeof job.total_prints === 'number' ? job.total_prints : ((job.page_count || job.files?.length || 1) * (job.copies || 1)),
    order_amount: typeof job.order_amount === 'number' ? job.order_amount : 0,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
  jobs.unshift(newJob);
  setJobs(jobs);
  return newJob;
};

export const updateJobStatus = async (jobId: string, status: JobStatus): Promise<boolean> => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    try {
      await fetch(`http://localhost:5000/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
    } catch (e) {
      console.warn('Failed to update status on server:', e);
    }
  }

  const jobs = getJobs();
  const index = jobs.findIndex(j => j.id === jobId);
  if (index !== -1) {
    jobs[index].status = status;
    jobs[index].updated_at = new Date().toISOString();
    setJobs(jobs);
  }
  return true;
};

export const normalizeJobNumber = (jobNumber: string): string => {
  if (!jobNumber) return '';
  const raw = jobNumber.trim();
  const stripped = raw.replace(/^[#\s]+/, '').trim();
  const matchJob = stripped.match(/^JOB[\s\-_]*(\d+)$/i);
  if (matchJob) {
    return `JOB-${matchJob[1]}`;
  }
  if (/^\d+$/.test(stripped)) {
    return `JOB-${stripped}`;
  }
  return stripped.toUpperCase();
};

export const getJobByNumber = async (jobNumber: string): Promise<Job | null> => {
  if (!jobNumber || !jobNumber.trim()) return null;
  const raw = jobNumber.trim();
  const normalized = normalizeJobNumber(raw);
  const clean = raw.replace(/^[#\s]+/, '').toUpperCase();

  try {
    const res = await fetch(`http://localhost:5000/api/jobs/public/${encodeURIComponent(normalized || clean)}`);
    const data = await res.json();
    if (data.success && data.job) {
      const jobs = getJobs();
      const existingIdx = jobs.findIndex(j => j.id === data.job.id);
      if (existingIdx !== -1) {
        jobs[existingIdx] = data.job;
      } else {
        jobs.unshift(data.job);
      }
      setJobs(jobs);
      return data.job;
    }
  } catch (err) {}

  const jobs = getJobs();
  return (
    jobs.find(
      (j) =>
        j.job_number.toUpperCase() === normalized ||
        j.job_number.toUpperCase() === clean ||
        j.id === raw ||
        j.id.toUpperCase() === clean
    ) || null
  );
};

export const cancelJob = async (id: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await fetch(`http://localhost:5000/api/jobs/public/${id}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      const jobs = getJobs();
      const target = jobs.find(j => j.id === id);
      if (target) {
        target.status = 'cancelled';
        setJobs(jobs);
      }
      return { success: true };
    }
  } catch (err) {}

  const jobs = getJobs();
  const target = jobs.find(j => j.id === id);
  if (target) {
    target.status = 'cancelled';
    setJobs(jobs);
    return { success: true };
  }
  return { success: false, message: 'Job not found' };
};

export const replaceJobFiles = async (
  id: string,
  files: JobFile[]
): Promise<{ success: boolean; job?: Job; message?: string }> => {
  try {
    const res = await fetch(`http://localhost:5000/api/jobs/public/${id}/files`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files })
    });
    const data = await res.json();
    if (data.success && data.job) {
      const jobs = getJobs();
      const idx = jobs.findIndex(j => j.id === id);
      if (idx !== -1) {
        jobs[idx] = data.job;
        setJobs(jobs);
      }
      return { success: true, job: data.job };
    }
  } catch (err) {}

  const jobs = getJobs();
  const idx = jobs.findIndex(j => j.id === id);
  if (idx !== -1) {
    jobs[idx].files = files;
    jobs[idx].updated_at = new Date().toISOString();
    setJobs(jobs);
    return { success: true, job: jobs[idx] };
  }
  return { success: false, message: 'Job not found' };
};

export const claimJob = async (
  jobId: string,
  staffName?: string
): Promise<{ success: boolean; job?: Job }> => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    try {
      const res = await fetch(`http://localhost:5000/api/jobs/${jobId}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success && data.job) {
        const jobs = getJobs();
        const idx = jobs.findIndex(j => j.id === jobId);
        if (idx !== -1) jobs[idx] = data.job;
        setJobs(jobs);
        return { success: true, job: data.job };
      }
    } catch (e) {}
  }

  const jobs = getJobs();
  const idx = jobs.findIndex(j => j.id === jobId);
  if (idx !== -1) {
    jobs[idx].status = 'in_progress';
    const currentUser = getCurrentUser();
    jobs[idx].assigned_to = currentUser?.id || 'staff_1';
    jobs[idx].assigned_to_name = currentUser?.name || staffName || 'Staff Member';
    setJobs(jobs);
    return { success: true, job: jobs[idx] };
  }
  return { success: false };
};

export const referJob = (
  jobId: string,
  toStaffId: string,
  note?: string
): { success: boolean; job?: Job } => {
  const jobs = getJobs();
  const idx = jobs.findIndex(j => j.id === jobId);
  if (idx !== -1) {
    const staffList = getStaffMembers();
    const toStaff = staffList.find(s => s.id === toStaffId);
    jobs[idx].assigned_to = toStaffId;
    jobs[idx].assigned_to_name = toStaff?.name || 'Staff Member';
    jobs[idx].status = 'assigned';
    setJobs(jobs);
    return { success: true, job: jobs[idx] };
  }
  return { success: false };
};

export const reassignJob = referJob;

export const recordPrintAction = (rec: {
  orderId: string;
  fileId: string;
  fileName: string;
  staffId: string;
  staffName: string;
  currentPc?: string;
  serviceType: ServiceType;
  paperSize: PaperSize;
  colorMode: 'color' | 'bw';
  copies: number;
  pages: number;
  status: 'printing' | 'printed' | 'print_failed';
}): { job: Job | null } => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    fetch(`http://localhost:5000/api/jobs/${rec.orderId}/files/${rec.fileId}/print`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ staffName: rec.staffName })
    }).catch(console.error);
  }

  const jobs = getJobs();
  const jobIndex = jobs.findIndex(j => j.id === rec.orderId);
  if (jobIndex === -1) return { job: null };

  const targetJob = jobs[jobIndex];
  const fileIndex = targetJob.files.findIndex(f => f.id === rec.fileId);
  if (fileIndex !== -1) {
    targetJob.files[fileIndex].print_status = rec.status === 'printed' ? 'printed' : 'printing';
    targetJob.files[fileIndex].last_printed_at = new Date().toISOString();
    targetJob.files[fileIndex].last_printed_by = rec.staffName;
  }

  if (rec.status === 'printed' && (targetJob.status === 'new' || targetJob.status === 'unassigned')) {
    targetJob.status = 'printing';
  }

  if (!targetJob.print_records) targetJob.print_records = [];
  targetJob.print_records.push({
    id: `pr_${Date.now()}`,
    order_id: rec.orderId,
    job_number: targetJob.job_number,
    file_id: rec.fileId,
    file_name: rec.fileName,
    staff_id: rec.staffId,
    staff_name: rec.staffName,
    pc: rec.currentPc,
    printed_at: new Date().toISOString(),
    service_type: rec.serviceType,
    paper_size: rec.paperSize,
    color_mode: rec.colorMode,
    copies: rec.copies,
    pages: rec.pages,
    total_prints: rec.pages * rec.copies,
    status: rec.status
  });

  targetJob.updated_at = new Date().toISOString();
  setJobs(jobs);
  return { job: targetJob };
};

export const updateFilePrintStatus = (jobId: string, fileId: string, status: any): Job | null => {
  const jobs = getJobs();
  const j = jobs.find(job => job.id === jobId);
  if (j) {
    const f = j.files.find(file => file.id === fileId);
    if (f) {
      f.print_status = status;
      setJobs(jobs);
      return j;
    }
  }
  return null;
};

export const getStaffMembers = (shopId?: string): StaffMember[] => {
  try {
    const raw = localStorage.getItem('namaste_staff');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [
    {
      id: 'staff_1',
      shop_id: shopId || 'default_shop_1',
      name: 'Counter Staff',
      email: 'staff@namasteprint.com',
      username: 'staff1',
      role: 'staff',
      status: 'active',
      permissions: {
        canViewRevenue: false,
        canManageStaff: false,
        canReassignJobs: true,
        canViewAnalytics: false,
        canManageSettings: false
      },
      created_at: new Date().toISOString()
    }
  ];
};

export const getAllStaffMembers = (): StaffMember[] => getStaffMembers();

export const saveStaffMembers = (members: StaffMember[]) => {
  localStorage.setItem('namaste_staff', JSON.stringify(members));
  broadcastStateChange('STAFF_UPDATED');
};

export const getNotifications = (shopId?: string, userId?: string): ShopNotification[] => {
  try {
    const n = localStorage.getItem('namaste_notifications');
    return n ? JSON.parse(n) : [];
  } catch {
    return [];
  }
};

export const setNotifications = (n: ShopNotification[]) => {
  localStorage.setItem('namaste_notifications', JSON.stringify(n));
};

export const markNotificationAsRead = (id: string) => {
  const n = getNotifications();
  const item = n.find(x => x.id === id);
  if (item) {
    item.is_read = true;
    (item as any).read_status = true;
    setNotifications(n);
  }
};

export const markAllNotificationsAsRead = (shopId?: string, userId?: string) => {
  const n = getNotifications();
  n.forEach(x => {
    x.is_read = true;
    (x as any).read_status = true;
  });
  setNotifications(n);
};

export const isRevenueVisible = (): boolean => localStorage.getItem('revenue_visible') === 'true';
export const setRevenueVisibility = (v: boolean) =>
  localStorage.setItem('revenue_visible', v.toString());
export const getRevenueVisibility = isRevenueVisible;

export const getCalendarMode = (): CalendarMode => {
  const m = localStorage.getItem('calendar_mode');
  if (m === 'BS' || m === 'AD' || m === 'BOTH') return m;
  return 'AD';
};
export const calendarMode = getCalendarMode;
export const setCalendarMode = (v: CalendarMode | boolean) => {
  const val = typeof v === 'boolean' ? (v ? 'BS' : 'AD') : v;
  localStorage.setItem('calendar_mode', val);
};

export const getCurrentUser = (): StaffMember | null => {
  const u = localStorage.getItem('current_user');
  return u ? JSON.parse(u) : null;
};
export const setCurrentUser = (user: StaffMember | null) => {
  if (user) {
    localStorage.setItem('current_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('current_user');
  }
  broadcastStateChange('USER_CHANGED', user);
};

export const getAuthSession = () => {
  const u = localStorage.getItem('current_user');
  if (!u) return null;
  return { user: JSON.parse(u), login_at: new Date().toISOString() };
};

export const setAuthSession = (session: any) => {
  if (session?.user) {
    localStorage.setItem('current_user', JSON.stringify(session.user));
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('current_user');
  localStorage.removeItem('namaste_shop');
  broadcastStateChange('USER_LOGGED_OUT');
};

export const getCurrentPc = (): string => {
  return localStorage.getItem('current_pc') || 'Counter-PC1';
};
export const setCurrentPc = (pc: string) => {
  localStorage.setItem('current_pc', pc);
};

export const getShopByUsername = (slug: string): Shop | null => {
  const current = getShop();
  if (current.qr_slug === slug || current.username === slug || current.id === slug) {
    return current;
  }
  try {
    const cached = localStorage.getItem('public_shops');
    if (cached) {
      const list: Shop[] = JSON.parse(cached);
      const found = list.find(s => s.qr_slug === slug || s.username === slug || s.id === slug);
      if (found) return found;
    }
  } catch {}
  return current;
};

export const setActiveShopId = (id: string) => {
  localStorage.setItem('active_shop_id', id);
};

export const getShopByOwnerEmail = () => null;
export const getShopByOwnerGoogleId = () => null;
export const authenticateWithCredentials = () => null;
export const isUsernameAvailable = (u?: string, shopId?: string): boolean => true;
export const isStaffUsernameAvailable = (u?: string) => true;
export const normalizeUsername = (u: string) => (u ? u.toLowerCase().replace(/[^a-z0-9_-]/g, '') : '');
export const generateNextStaffUsername = () => ({ primary: 'staff2', alternatives: ['staff2', 'staff3'] });
export const addStaffMember = (member: any) => [];
export const toggleStaffStatus = (id: string) => [];
export const changeStaffRole = (id: string, role: any) => [];
export const deleteStaffMember = (id: string) => [];
export const getStaffPerformanceStats = (shopId?: string): StaffPerformanceStats[] => {
  const staffMembers = getStaffMembers(shopId);
  const jobs = getJobs();

  return staffMembers.map((staff) => {
    const staffJobs = jobs.filter(
      (j) =>
        j.assigned_to === staff.id ||
        (j as any).staff_id === staff.id ||
        j.completed_by === staff.id ||
        (j.assigned_to_name && j.assigned_to_name.toLowerCase() === staff.name.toLowerCase())
    );

    let completedOrders = 0;
    let totalPrints = 0;
    let a4Prints = 0;
    let a3Prints = 0;
    let photoPrints = 0;
    let totalRevenue = 0;
    let lastAction = staff.last_active_at || staff.created_at;

    for (const j of staffJobs) {
      const p = j.total_prints || (j.copies * (j.page_count || 1));
      if (j.status === 'completed') {
        completedOrders++;
      }
      if (j.status !== 'cancelled') {
        totalPrints += p;
        totalRevenue += j.order_amount || 0;
        if (j.service_type === 'photo_print') photoPrints += p;
        else if (j.paper_size === 'A3') a3Prints += p;
        else a4Prints += p;
      }
      if (!lastAction || new Date(j.updated_at || j.created_at) > new Date(lastAction)) {
        lastAction = j.updated_at || j.created_at;
      }
    }

    return {
      staff_id: staff.id,
      staff_name: staff.name,
      role: staff.role,
      completed_orders: completedOrders,
      total_prints: totalPrints,
      a4_prints: a4Prints,
      a3_prints: a3Prints,
      photo_prints: photoPrints,
      total_revenue: totalRevenue,
      last_action: lastAction,
    };
  });
};
export const resetSampleData = () => {};
export const generateUsernameSuggestions = (name?: string): string[] => [
  `${name || 'shop'}print`,
  `${name || 'shop'}nepal`,
  `${name || 'shop'}hub`
];
export const createShop = (shopData: any): Shop => {
  const newShop: Shop = {
    id: `shop_${Date.now()}`,
    shop_name: shopData.shop_name,
    username: shopData.username,
    owner_name: shopData.owner_name,
    owner_google_id: shopData.owner_google_id,
    email: shopData.email,
    phone: shopData.phone,
    address: shopData.address,
    tagline: shopData.tagline || '',
    logo_url: shopData.logo_url || '',
    qr_slug: shopData.username || `shop-${Math.floor(1000 + Math.random() * 9000)}`,
    created_at: new Date().toISOString()
  };
  updateShop(newShop);
  return newShop;
};
export const getActivityLogs = (shopId?: string): ActivityLog[] => [];

// Transfers API
export const createTransfer = async (transferData: any) => {
  const token = localStorage.getItem('auth_token');
  const res = await fetch('http://localhost:5000/api/transfers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(transferData)
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.transfer;
};

export const getTransfers = async () => {
  const token = localStorage.getItem('auth_token');
  if (!token) return [];
  try {
    const res = await fetch('http://localhost:5000/api/transfers', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    return data.success ? data.transfers : [];
  } catch {
    return [];
  }
};

export const deleteTransfer = async (id: string) => {
  const token = localStorage.getItem('auth_token');
  await fetch(`http://localhost:5000/api/transfers/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
};

export const updateTransferPin = async (id: string, pin: string) => {
  const token = localStorage.getItem('auth_token');
  await fetch(`http://localhost:5000/api/transfers/${id}/pin`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ pin })
  });
};

export const verifyTransfer = async (customerName: string, pin: string) => {
  const res = await fetch('http://localhost:5000/api/transfers/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_name: customerName, pin })
  });
  return res.json();
};

// Event listeners for state changes across components
const listeners: ((msg: any) => void)[] = [];
export const subscribeToStateChanges = (callback: (msg: any) => void) => {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
  };
};

export const broadcastStateChange = (action: string, payload?: any) => {
  listeners.forEach(cb => {
    try {
      cb({ action, payload });
    } catch (e) {
      console.error(e);
    }
  });
};