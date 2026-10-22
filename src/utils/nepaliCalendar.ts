/**
 * Bikram Sambat (B.S) Nepali Calendar Utility
 * Provides seamless bidirectional conversion and formatting between Gregorian (A.D) and Bikram Sambat (B.S)
 * Covers years 2020 - 2035 AD (2076 - 2092 BS)
 */

import { Language } from '../types';

export type CalendarMode = 'AD' | 'BS' | 'BOTH';

export interface BSDate {
  year: number;
  month: number; // 1-12 (1 = Baisakh, 12 = Chaitra)
  day: number;
  monthNameEn: string;
  monthNameNe: string;
  dayOfWeek: number; // 0-6
}

export const BS_MONTH_NAMES_EN = [
  'Baisakh',
  'Jestha',
  'Ashadh',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
];

export const BS_MONTH_NAMES_NE = [
  'बैशाख',
  'जेठ',
  'असार',
  'श्रावण',
  'भाद्र',
  'आश्विन',
  'कार्तिक',
  'मंसिर',
  'पौष',
  'माघ',
  'फागुन',
  'चैत',
];

// Days in each month for Nepali calendar years 2076 to 2090 BS
// Format: [year, [m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12]]
const BS_CALENDAR_DATA: Record<number, number[]> = {
  2076: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2077: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2078: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2079: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2081: [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2082: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2083: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30], // Current year ~ 2026 AD
  2084: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  2085: [31, 32, 31, 32, 30, 31, 30, 30, 29, 30, 30, 30],
  2086: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2087: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2088: [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2089: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2090: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
};

// Reference point: 2076-01-01 BS = 2019-04-14 AD
const REF_BS_YEAR = 2076;
const REF_BS_MONTH = 1;
const REF_BS_DAY = 1;
const REF_AD_DATE = new Date(Date.UTC(2019, 3, 14)); // April 14, 2019 UTC

/**
 * Converts a Gregorian (A.D) date to Bikram Sambat (B.S)
 */
export function adToBs(dateInput: Date | string | number): BSDate {
  const adDate = new Date(dateInput);
  
  // Difference in UTC days from reference
  const utc1 = Date.UTC(adDate.getFullYear(), adDate.getMonth(), adDate.getDate());
  const utc2 = REF_AD_DATE.getTime();
  const diffDays = Math.floor((utc1 - utc2) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    // Fallback for dates before reference: default to approximate
    return {
      year: adDate.getFullYear() + 57,
      month: 1,
      day: 1,
      monthNameEn: BS_MONTH_NAMES_EN[0],
      monthNameNe: BS_MONTH_NAMES_NE[0],
      dayOfWeek: adDate.getDay(),
    };
  }

  let remainingDays = diffDays;
  let bsYear = REF_BS_YEAR;
  let bsMonth = REF_BS_MONTH;
  let bsDay = REF_BS_DAY;

  while (remainingDays > 0) {
    const monthDays = BS_CALENDAR_DATA[bsYear]?.[bsMonth - 1] || 30;
    const daysLeftInMonth = monthDays - bsDay + 1;

    if (remainingDays >= daysLeftInMonth) {
      remainingDays -= daysLeftInMonth;
      bsDay = 1;
      bsMonth++;
      if (bsMonth > 12) {
        bsMonth = 1;
        bsYear++;
      }
    } else {
      bsDay += remainingDays;
      remainingDays = 0;
    }
  }

  const monthIdx = Math.max(0, Math.min(11, bsMonth - 1));

  return {
    year: bsYear,
    month: bsMonth,
    day: bsDay,
    monthNameEn: BS_MONTH_NAMES_EN[monthIdx] || 'Baisakh',
    monthNameNe: BS_MONTH_NAMES_NE[monthIdx] || 'बैशाख',
    dayOfWeek: adDate.getDay(),
  };
}

/**
 * Converts Western digits (0-9) to Nepali Devanagari numerals (०-९)
 */
export function toNepaliNumerals(num: number | string): string {
  const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return num
    .toString()
    .split('')
    .map((ch) => {
      const parsed = parseInt(ch, 10);
      return isNaN(parsed) ? ch : nepaliDigits[parsed];
    })
    .join('');
}

/**
 * Universal Date Formatter supporting A.D, B.S, and Combined display
 * e.g. "October 2, 2026 / 2083 Ashwin 16"
 */
export function formatDateWithCalendar(
  dateInput: Date | string | number,
  mode: CalendarMode = 'BOTH',
  lang: Language = 'en'
): string {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const bs = adToBs(date);

  const adMonth = date.toLocaleDateString('en-US', { month: 'short' });
  const adDay = date.getDate();
  const adYear = date.getFullYear();
  const adFormatted = `${adMonth} ${adDay}, ${adYear}`;

  const bsFormattedEn = `${bs.monthNameEn} ${bs.day}, ${bs.year}`;
  const bsFormattedNe = `${toNepaliNumerals(bs.day)} ${bs.monthNameNe} ${toNepaliNumerals(bs.year)}`;
  const bsDisplay = lang === 'ne' ? bsFormattedNe : bsFormattedEn;

  switch (mode) {
    case 'AD':
      return adFormatted;
    case 'BS':
      return bsDisplay;
    case 'BOTH':
    default:
      return `${adFormatted} · ${bsDisplay}`;
  }
}

/**
 * Formats date and time with calendar mode
 */
export function formatDateTimeWithCalendar(
  dateInput: Date | string | number,
  mode: CalendarMode = 'BOTH',
  lang: Language = 'en'
): string {
  const dateStr = formatDateWithCalendar(dateInput, mode, lang);
  const time = new Date(dateInput).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} (${time})`;
}

/**
 * Quick date presets helper for Analytics and History filters
 */
export function getDateRangeFromPreset(preset: string): {
  start: Date;
  end: Date;
  label: string;
  bsLabel: string;
} {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  let label = 'Today';

  switch (preset) {
    case 'today':
      label = 'Today';
      break;
    case 'yesterday': {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      const yEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      label = 'Yesterday';
      return {
        start,
        end: yEnd,
        label,
        bsLabel: formatDateWithCalendar(start, 'BS'),
      };
    }
    case 'last_7_days':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      label = 'Last 7 Days';
      break;
    case 'last_30_days':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      label = 'Last 30 Days';
      break;
    case 'this_week': {
      const day = now.getDay();
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day, 0, 0, 0, 0);
      label = 'This Week';
      break;
    }
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      label = 'This Month';
      break;
    case 'last_month': {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      label = 'Last Month';
      return {
        start,
        end: lastMonthEnd,
        label,
        bsLabel: `${formatDateWithCalendar(start, 'BS')} - ${formatDateWithCalendar(lastMonthEnd, 'BS')}`,
      };
    }
    case 'this_year':
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      label = 'This Year';
      break;
    case 'last_year': {
      start = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      label = 'Last Year';
      return {
        start,
        end: lastYearEnd,
        label,
        bsLabel: `${adToBs(start).year} BS`,
      };
    }
    default:
      break;
  }

  const bsLabel = `${formatDateWithCalendar(start, 'BS')} - ${formatDateWithCalendar(end, 'BS')}`;
  return { start, end, label, bsLabel };
}
