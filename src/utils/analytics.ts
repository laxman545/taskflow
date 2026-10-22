import { Job, PeriodStats, ServiceType, PaperSize } from '../types';

/**
 * Standard Nepal print shop pricing formula (Rs. NPR)
 */
export function calculateOrderPrice(params: {
  serviceType: ServiceType;
  paperSize: PaperSize;
  isColor: boolean;
  copies: number;
  pageCount: number;
}): { unitPrice: number; totalAmount: number; totalPrints: number } {
  const totalPrints = Math.max(1, params.pageCount) * Math.max(1, params.copies);
  let unitPrice = 5; // Default A4 B/W

  if (params.serviceType === 'photo_print') {
    unitPrice = 35; // Photo print
  } else if (params.serviceType === 'citizenship') {
    if (params.paperSize === 'A5') {
      unitPrice = params.isColor ? 15 : 8;
    } else {
      unitPrice = params.isColor ? 25 : 10;
    }
  } else if (params.paperSize === 'A3') {
    unitPrice = params.isColor ? 40 : 15;
  } else {
    // A4
    unitPrice = params.isColor ? 15 : 5;
  }

  const totalAmount = unitPrice * totalPrints;
  return { unitPrice, totalAmount, totalPrints };
}

export function computePeriodStats(filteredJobs: Job[]): PeriodStats {
  let totalPrints = 0;
  let revenue = 0;
  let a4Prints = 0;
  let a3Prints = 0;
  let a5Prints = 0;
  let photoPrints = 0;
  let citizenshipPrints = 0;
  let photocopyPrints = 0;
  let bwPrints = 0;
  let colorPrints = 0;
  let completedOrders = 0;
  let pendingOrders = 0;
  let cancelledOrders = 0;

  for (const job of filteredJobs) {
    const prints = job.total_prints || (job.copies * (job.page_count || 1));
    const amount = job.order_amount || 0;

    // Revenue only accumulates from completed and active/pending orders (not cancelled)
    if (job.status !== 'cancelled') {
      revenue += amount;
      totalPrints += prints;

      if (job.service_type === 'citizenship') {
        citizenshipPrints += prints;
        if (job.paper_size === 'A5') a5Prints += prints;
        else a4Prints += prints;
      } else if (job.service_type === 'photo_print') {
        photoPrints += prints;
      } else if (job.service_type === 'photocopy') {
        photocopyPrints += prints;
        if (job.paper_size === 'A3') a3Prints += prints;
        else if (job.paper_size === 'A5') a5Prints += prints;
        else a4Prints += prints;
      } else {
        if (job.paper_size === 'A3') a3Prints += prints;
        else if (job.paper_size === 'A5') a5Prints += prints;
        else a4Prints += prints;
      }

      if (job.is_color) {
        colorPrints += prints;
      } else {
        bwPrints += prints;
      }
    }

    if (job.status === 'completed') {
      completedOrders++;
    } else if (job.status === 'cancelled') {
      cancelledOrders++;
    } else {
      pendingOrders++;
    }
  }

  const activeOrdersCount = completedOrders + pendingOrders;
  const avgOrderValue = activeOrdersCount > 0 ? Math.round(revenue / activeOrdersCount) : 0;

  return {
    ordersCount: filteredJobs.length,
    totalPrints,
    revenue,
    a4Prints,
    a3Prints,
    a5Prints,
    photoPrints,
    citizenshipPrints,
    photocopyPrints,
    bwPrints,
    colorPrints,
    completedOrders,
    pendingOrders,
    cancelledOrders,
    avgOrderValue,
  };
}

export function getTodayStats(jobs: Job[]): PeriodStats {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const date = today.getDate();

  const todayJobs = jobs.filter((j) => {
    const d = new Date(j.created_at);
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === date;
  });

  return computePeriodStats(todayJobs);
}

export function getMonthStats(jobs: Job[], targetYear: number, targetMonth: number): {
  current: PeriodStats;
  previous: PeriodStats;
  revenueGrowth: number;
  ordersGrowth: number;
} {
  const currentJobs = jobs.filter((j) => {
    const d = new Date(j.created_at);
    return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
  });

  // Previous month calculation
  const prevMonth = targetMonth === 0 ? 11 : targetMonth - 1;
  const prevYear = targetMonth === 0 ? targetYear - 1 : targetYear;
  const prevJobs = jobs.filter((j) => {
    const d = new Date(j.created_at);
    return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
  });

  const current = computePeriodStats(currentJobs);
  const previous = computePeriodStats(prevJobs);

  const revenueGrowth = previous.revenue > 0
    ? ((current.revenue - previous.revenue) / previous.revenue) * 100
    : 0;

  const ordersGrowth = previous.ordersCount > 0
    ? ((current.ordersCount - previous.ordersCount) / previous.ordersCount) * 100
    : 0;

  return { current, previous, revenueGrowth, ordersGrowth };
}

export function getYearStats(jobs: Job[], targetYear: number): {
  current: PeriodStats;
  previous: PeriodStats;
  monthlyBreakdown: { month: number; name: string; orders: number; revenue: number; prints: number }[];
  bestMonth: string;
  growthFromPrevYear: number;
} {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentJobs = jobs.filter((j) => new Date(j.created_at).getFullYear() === targetYear);
  const prevJobs = jobs.filter((j) => new Date(j.created_at).getFullYear() === targetYear - 1);

  const current = computePeriodStats(currentJobs);
  const previous = computePeriodStats(prevJobs);

  const monthlyBreakdown = monthNames.map((name, index) => {
    const mJobs = currentJobs.filter((j) => new Date(j.created_at).getMonth() === index);
    const stats = computePeriodStats(mJobs);
    return {
      month: index,
      name,
      orders: stats.ordersCount,
      revenue: stats.revenue,
      prints: stats.totalPrints,
    };
  });

  let maxRev = -1;
  let bestMonth = 'N/A';
  for (const m of monthlyBreakdown) {
    if (m.revenue > maxRev) {
      maxRev = m.revenue;
      bestMonth = `${m.name} (Rs. ${m.revenue.toLocaleString()})`;
    }
  }

  const growthFromPrevYear = previous.revenue > 0
    ? ((current.revenue - previous.revenue) / previous.revenue) * 100
    : 0;

  return {
    current,
    previous,
    monthlyBreakdown,
    bestMonth,
    growthFromPrevYear,
  };
}

export function getDailySeries(
  jobs: Job[],
  daysCount: number = 7,
  endDate: Date = new Date()
): { dateLabel: string; dateKey: string; orders: number; revenue: number; prints: number }[] {
  const result = [];

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(endDate.getDate() - i);
    const year = d.getFullYear();
    const month = d.getMonth();
    const date = d.getDate();

    const dayJobs = jobs.filter((j) => {
      const jd = new Date(j.created_at);
      return jd.getFullYear() === year && jd.getMonth() === month && jd.getDate() === date;
    });

    const stats = computePeriodStats(dayJobs);
    const dateLabel = d.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' });
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;

    result.push({
      dateLabel,
      dateKey,
      orders: stats.ordersCount,
      revenue: stats.revenue,
      prints: stats.totalPrints,
    });
  }

  return result;
}

/**
 * Hourly distribution for today or a specific day (8:00 AM - 8:00 PM)
 */
export function getHourlySeries(
  jobs: Job[],
  targetDate: Date = new Date()
): { hourLabel: string; hour: number; orders: number; prints: number; revenue: number }[] {
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const date = targetDate.getDate();

  const dayJobs = jobs.filter((j) => {
    const d = new Date(j.created_at);
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === date;
  });

  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

  return hours.map((hour) => {
    const hourJobs = dayJobs.filter((j) => {
      const d = new Date(j.created_at);
      return d.getHours() === hour;
    });

    const stats = computePeriodStats(hourJobs);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const hourLabel = `${displayHour} ${ampm}`;

    return {
      hourLabel,
      hour,
      orders: stats.ordersCount,
      prints: stats.totalPrints,
      revenue: stats.revenue,
    };
  });
}

/**
 * Breakdown of print services
 */
export function getServiceTypeBreakdown(jobs: Job[]): {
  service: ServiceType;
  label: string;
  count: number;
  prints: number;
  revenue: number;
  percentOfPrints: number;
}[] {
  const totalPrints = jobs.reduce((sum, j) => sum + (j.status !== 'cancelled' ? (j.total_prints || (j.copies * (j.page_count || 1))) : 0), 0);

  const services: { service: ServiceType; label: string }[] = [
    { service: 'print', label: 'Document Print' },
    { service: 'photocopy', label: 'Photocopy' },
    { service: 'citizenship', label: 'Citizenship Print' },
    { service: 'photo_print', label: 'Photo Studio' },
  ];

  return services.map(({ service, label }) => {
    const sJobs = jobs.filter((j) => j.service_type === service);
    const stats = computePeriodStats(sJobs);
    const percentOfPrints = totalPrints > 0 ? Math.round((stats.totalPrints / totalPrints) * 100) : 0;

    return {
      service,
      label,
      count: stats.ordersCount,
      prints: stats.totalPrints,
      revenue: stats.revenue,
      percentOfPrints,
    };
  });
}

/**
 * Color vs Black & White Breakdown
 */
export function getColorBreakdown(jobs: Job[]): {
  colorPrints: number;
  colorRevenue: number;
  colorPercent: number;
  bwPrints: number;
  bwRevenue: number;
  bwPercent: number;
} {
  let colorPrints = 0;
  let colorRevenue = 0;
  let bwPrints = 0;
  let bwRevenue = 0;

  for (const j of jobs) {
    if (j.status !== 'cancelled') {
      const p = j.total_prints || (j.copies * (j.page_count || 1));
      const r = j.order_amount || 0;
      if (j.is_color) {
        colorPrints += p;
        colorRevenue += r;
      } else {
        bwPrints += p;
        bwRevenue += r;
      }
    }
  }

  const total = colorPrints + bwPrints;
  const colorPercent = total > 0 ? Math.round((colorPrints / total) * 100) : 0;
  const bwPercent = total > 0 ? 100 - colorPercent : 0;

  return {
    colorPrints,
    colorRevenue,
    colorPercent,
    bwPrints,
    bwRevenue,
    bwPercent,
  };
}

/**
 * Paper size breakdown
 */
export function getPaperSizeBreakdown(jobs: Job[]): {
  size: PaperSize;
  label: string;
  prints: number;
  percent: number;
}[] {
  let a4 = 0;
  let a3 = 0;
  let a5 = 0;

  for (const j of jobs) {
    if (j.status !== 'cancelled') {
      const p = j.total_prints || (j.copies * (j.page_count || 1));
      if (j.paper_size === 'A3') a3 += p;
      else if (j.paper_size === 'A5') a5 += p;
      else a4 += p;
    }
  }

  const total = a4 + a3 + a5;

  return [
    { size: 'A4', label: 'A4 (210×297 mm)', prints: a4, percent: total > 0 ? Math.round((a4 / total) * 100) : 0 },
    { size: 'A3', label: 'A3 (297×420 mm)', prints: a3, percent: total > 0 ? Math.round((a3 / total) * 100) : 0 },
    { size: 'A5', label: 'A5 (148×210 mm)', prints: a5, percent: total > 0 ? Math.round((a5 / total) * 100) : 0 },
  ];
}

/**
 * Arbitrary Range Stats Calculation
 */
export function getRangeStats(
  jobs: Job[],
  startDate: Date,
  endDate: Date
): {
  stats: PeriodStats;
  dailySeries: { dateLabel: string; dateKey: string; orders: number; revenue: number; prints: number }[];
} {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const rangeJobs = jobs.filter((j) => {
    const d = new Date(j.created_at);
    return d >= start && d <= end;
  });

  const stats = computePeriodStats(rangeJobs);

  // Calculate day difference
  const diffDays = Math.max(1, Math.min(60, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))));
  const dailySeries = getDailySeries(jobs, diffDays, end);

  return { stats, dailySeries };
}

/**
 * Export Analytics to CSV File
 */
export function exportAnalyticsToCSV(params: {
  shopName: string;
  periodLabel: string;
  stats: PeriodStats;
  jobs: Job[];
  dailySeries: { dateLabel: string; orders: number; revenue: number; prints: number }[];
}) {
  const { shopName, periodLabel, stats, jobs, dailySeries } = params;

  const lines: string[] = [];
  lines.push(`"TaskFlow Shop Performance Analytics Report"`);
  lines.push(`"Shop Name:","${shopName.replace(/"/g, '""')}"`);
  lines.push(`"Period:","${periodLabel.replace(/"/g, '""')}"`);
  lines.push(`"Generated At:","${new Date().toLocaleString()}"`);
  lines.push('');

  lines.push('"--- SUMMARY METRICS ---"');
  lines.push('"Metric","Value"');
  lines.push(`"Total Revenue (NPR)","Rs. ${stats.revenue.toLocaleString()}"`);
  lines.push(`"Total Orders","${stats.ordersCount}"`);
  lines.push(`"Completed Orders","${stats.completedOrders}"`);
  lines.push(`"Pending / Processing Orders","${stats.pendingOrders}"`);
  lines.push(`"Cancelled Orders","${stats.cancelledOrders}"`);
  lines.push(`"Total Sheets Printed","${stats.totalPrints}"`);
  lines.push(`"Color Prints","${stats.colorPrints}"`);
  lines.push(`"Black & White Prints","${stats.bwPrints}"`);
  lines.push(`"A4 Prints","${stats.a4Prints}"`);
  lines.push(`"A3 Prints","${stats.a3Prints}"`);
  lines.push(`"A5 Prints","${stats.a5Prints || 0}"`);
  lines.push(`"Photo Prints","${stats.photoPrints}"`);
  lines.push(`"Citizenship Prints","${stats.citizenshipPrints || 0}"`);
  lines.push(`"Average Order Value (NPR)","Rs. ${stats.avgOrderValue || 0}"`);
  lines.push('');

  lines.push('"--- DAILY TRENDS ---"');
  lines.push('"Date","Orders","Sheets Printed","Revenue (NPR)"');
  dailySeries.forEach((d) => {
    lines.push(`"${d.dateLabel}",${d.orders},${d.prints},${d.revenue}`);
  });
  lines.push('');

  lines.push('"--- ORDER DETAILS ---"');
  lines.push('"Job Token","Date","Customer","Service","Paper","Color Mode","Copies","Prints","Amount (NPR)","Status"');
  jobs.slice(0, 500).forEach((j) => {
    const dateStr = new Date(j.created_at).toLocaleDateString();
    const cust = (j.customer_name || 'Walk-in').replace(/"/g, '""');
    const serv = j.service_type;
    const paper = j.paper_size;
    const color = j.is_color ? 'Color' : 'B/W';
    const prints = j.total_prints || (j.copies * (j.page_count || 1));
    const amount = j.order_amount || 0;
    const status = j.status;
    lines.push(`"${j.job_number}","${dateStr}","${cust}","${serv}","${paper}","${color}",${j.copies},${prints},${amount},"${status}"`);
  });

  const csvContent = '\uFEFF' + lines.join('\n'); // UTF-8 BOM for Excel
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const filename = `TaskFlow_Analytics_${periodLabel.replace(/\s+/g, '_')}_${Date.now()}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
