import { PrintingService, ServiceType, PaperSize } from '../types';

const SERVICES_KEY_PREFIX = 'namaste_print_services_v3_';

function getEffectiveShopId(): string {
  try {
    const raw = localStorage.getItem('namaste_shop');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.id) return parsed.id;
    }
  } catch {}
  return 'default_shop_1';
}

export const DEFAULT_SERVICES: PrintingService[] = [
  {
    id: 'srv_a4_bw',
    shop_id: 'default_shop_1',
    name: 'A4 Black & White Print',
    service_type: 'print',
    paper_size: 'A4',
    is_color: false,
    unit_price: 5,
    unit_label: 'per page',
    is_active: true,
    description: 'Standard monochrome document printing on 75/80 GSM paper',
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv_a4_color',
    shop_id: 'default_shop_1',
    name: 'A4 Color Print',
    service_type: 'print',
    paper_size: 'A4',
    is_color: true,
    unit_price: 15,
    unit_label: 'per page',
    is_active: true,
    description: 'High-resolution vibrant color print for assignments and reports',
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv_a3_bw',
    shop_id: 'default_shop_1',
    name: 'A3 Black & White Print',
    service_type: 'print',
    paper_size: 'A3',
    is_color: false,
    unit_price: 15,
    unit_label: 'per page',
    is_active: true,
    description: 'Engineering drawings, blueprints, and large format B&W prints',
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv_a3_color',
    shop_id: 'default_shop_1',
    name: 'A3 Color Print',
    service_type: 'print',
    paper_size: 'A3',
    is_color: true,
    unit_price: 40,
    unit_label: 'per page',
    is_active: true,
    description: 'Large format posters and architectural color presentations',
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv_photo_4x6',
    shop_id: 'default_shop_1',
    name: 'Photo Print 4×6 (Glossy/Matte)',
    service_type: 'photo_print',
    paper_size: 'A4',
    is_color: true,
    unit_price: 25,
    unit_label: 'per photo',
    is_active: true,
    description: 'Lab quality 4R glossy photo paper print',
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv_photo_5x7',
    shop_id: 'default_shop_1',
    name: 'Photo Print 5×7 / Studio Portrait',
    service_type: 'photo_print',
    paper_size: 'A4',
    is_color: true,
    unit_price: 35,
    unit_label: 'per photo',
    is_active: true,
    description: '5R photo print / Passport & auto-sized family photo prints',
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv_copy_bw',
    shop_id: 'default_shop_1',
    name: 'A4 Photocopy / Xerox (B&W)',
    service_type: 'photocopy',
    paper_size: 'A4',
    is_color: false,
    unit_price: 4,
    unit_label: 'per page',
    is_active: true,
    description: 'Fast high-volume laser photocopy Xerox',
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv_copy_color',
    shop_id: 'default_shop_1',
    name: 'A4 Color Photocopy',
    service_type: 'photocopy',
    paper_size: 'A4',
    is_color: true,
    unit_price: 12,
    unit_label: 'per page',
    is_active: true,
    description: 'Exact color reproduction photocopy',
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv_citizenship_a5_bw',
    shop_id: 'default_shop_1',
    name: 'Citizenship Print (A5 Half Sheet B&W)',
    service_type: 'citizenship',
    paper_size: 'A5',
    is_color: false,
    unit_price: 8,
    unit_label: 'per sheet',
    is_active: true,
    description: 'Citizenship front and back merged on A5 half paper (Photocopy)',
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv_citizenship_a5_color',
    shop_id: 'default_shop_1',
    name: 'Citizenship Print (A5 Half Sheet Color)',
    service_type: 'citizenship',
    paper_size: 'A5',
    is_color: true,
    unit_price: 15,
    unit_label: 'per sheet',
    is_active: true,
    description: 'Citizenship front and back merged on A5 half paper (Full Color)',
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv_citizenship_bw',
    shop_id: 'default_shop_1',
    name: 'Citizenship Print (A4 2-in-1 B&W)',
    service_type: 'citizenship',
    paper_size: 'A4',
    is_color: false,
    unit_price: 10,
    unit_label: 'per sheet',
    is_active: true,
    description: 'Citizenship front and back merged on single A4 sheet (Photocopy)',
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv_citizenship_color',
    shop_id: 'default_shop_1',
    name: 'Citizenship Print (A4 2-in-1 Color)',
    service_type: 'citizenship',
    paper_size: 'A4',
    is_color: true,
    unit_price: 25,
    unit_label: 'per sheet',
    is_active: true,
    description: 'Citizenship front and back merged on single A4 sheet (Full Color)',
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv_binding',
    shop_id: 'default_shop_1',
    name: 'Spiral / Comb Document Binding',
    service_type: 'other',
    unit_price: 60,
    unit_label: 'per document',
    is_active: true,
    description: 'Plastic spiral ring binding with clear OHP cover front & back',
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv_lamination',
    shop_id: 'default_shop_1',
    name: 'A4 Document / Certificate Lamination',
    service_type: 'other',
    paper_size: 'A4',
    unit_price: 30,
    unit_label: 'per piece',
    is_active: true,
    description: '125 micron heat pouch lamination for certificates and cards',
    created_at: new Date().toISOString(),
  },
];

export function getShopServices(shopId?: string): PrintingService[] {
  const effectiveShopId = shopId || getEffectiveShopId();
  try {
    const raw = localStorage.getItem(`${SERVICES_KEY_PREFIX}${effectiveShopId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // Check fallback keys in localStorage
    const fallbackRaw =
      localStorage.getItem(`${SERVICES_KEY_PREFIX}default_shop_1`) ||
      localStorage.getItem(`${SERVICES_KEY_PREFIX}shop_pashupati_01`);
    if (fallbackRaw) {
      const parsed = JSON.parse(fallbackRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading shop services:', e);
  }
  return DEFAULT_SERVICES.map((s) => ({ ...s, shop_id: effectiveShopId }));
}

export function saveShopServices(shopId: string, services: PrintingService[]): void {
  const effectiveShopId = shopId || getEffectiveShopId();
  try {
    localStorage.setItem(`${SERVICES_KEY_PREFIX}${effectiveShopId}`, JSON.stringify(services));
    if (effectiveShopId === 'default_shop_1') {
      localStorage.setItem(`${SERVICES_KEY_PREFIX}shop_pashupati_01`, JSON.stringify(services));
    }

    // Trigger broadcast for instant multi-tab sync
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      new BroadcastChannel('namaste_print_state_v3').postMessage({
        action: 'SERVICES_UPDATED',
        timestamp: Date.now(),
      });
    }

    // Asynchronously synchronize with backend SQLite server
    fetch(`http://localhost:5000/api/shops/${effectiveShopId}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ services }),
    }).catch((e) => {
      console.warn('Backend services sync offline, stored locally:', e);
    });
  } catch (e) {
    console.error('Error saving shop services:', e);
  }
}

export async function fetchShopServices(shopId?: string): Promise<PrintingService[]> {
  const effectiveShopId = shopId || getEffectiveShopId();
  try {
    const res = await fetch(`http://localhost:5000/api/shops/${effectiveShopId}/services`);
    const data = await res.json();
    if (data.success && Array.isArray(data.services) && data.services.length > 0) {
      localStorage.setItem(`${SERVICES_KEY_PREFIX}${effectiveShopId}`, JSON.stringify(data.services));
      return data.services;
    }
  } catch {
    // Backend offline, fallback to localStorage
  }
  return getShopServices(effectiveShopId);
}

export function addShopService(
  shopId: string,
  data: Omit<PrintingService, 'id' | 'shop_id' | 'created_at'>
): PrintingService {
  const current = getShopServices(shopId);
  const newService: PrintingService = {
    ...data,
    id: `srv_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    shop_id: shopId,
    created_at: new Date().toISOString(),
  };

  const updated = [...current, newService];
  saveShopServices(shopId, updated);
  return newService;
}

export function updateShopService(
  shopId: string,
  serviceId: string,
  updates: Partial<PrintingService>
): PrintingService | null {
  const current = getShopServices(shopId);
  let updatedService: PrintingService | null = null;

  const nextList = current.map((srv) => {
    if (srv.id === serviceId) {
      updatedService = { ...srv, ...updates };
      return updatedService;
    }
    return srv;
  });

  if (updatedService) {
    saveShopServices(shopId, nextList);
  }
  return updatedService;
}

export function deleteShopService(shopId: string, serviceId: string): void {
  const current = getShopServices(shopId);
  const nextList = current.filter((s) => s.id !== serviceId);
  saveShopServices(shopId, nextList);
}

/**
 * Returns the minimum starting price configured for a service type
 */
export function getStartingServicePrice(
  serviceType: ServiceType,
  shopId?: string
): { minPrice: number; unitLabel: string } {
  const services = getShopServices(shopId).filter(
    (s) => s.is_active && s.service_type === serviceType
  );
  if (services.length > 0) {
    const minPrice = Math.min(...services.map((s) => s.unit_price));
    const matching = services.find((s) => s.unit_price === minPrice);
    return { minPrice, unitLabel: matching?.unit_label || 'per page' };
  }

  switch (serviceType) {
    case 'photocopy':
      return { minPrice: 4, unitLabel: 'per page' };
    case 'citizenship':
      return { minPrice: 8, unitLabel: 'per sheet' };
    case 'photo_print':
      return { minPrice: 25, unitLabel: 'per photo' };
    case 'print':
    default:
      return { minPrice: 5, unitLabel: 'per page' };
  }
}

/**
 * Calculates order price dynamically using the Owner's configured rates
 * Automatically matches paper size, color mode, and service category
 */
export function calculateDynamicOrderPrice(params: {
  serviceType: ServiceType;
  paperSize: PaperSize;
  isColor: boolean;
  copies: number;
  pageCount: number;
  isDoubleSided?: boolean;
  shopId?: string;
}): {
  unitPrice: number;
  totalAmount: number;
  totalPrints: number;
  matchedServiceName: string;
  matchedServiceId?: string;
  unitLabel: string;
} {
  const shopId = params.shopId || getEffectiveShopId();
  const services = getShopServices(shopId).filter((s) => s.is_active);
  const totalPrints = Math.max(1, params.pageCount || 1) * Math.max(1, params.copies || 1);

  // Exact match
  let matched = services.find((s) => {
    if (s.service_type !== params.serviceType) return false;
    if (params.serviceType === 'photo_print') return true;
    const sizeMatch =
      !s.paper_size ||
      s.paper_size.toUpperCase() === (params.paperSize || 'A4').toUpperCase();
    const colorMatch =
      s.is_color === undefined || Boolean(s.is_color) === Boolean(params.isColor);
    return sizeMatch && colorMatch;
  });

  // Secondary match: Match by service_type and color
  if (!matched) {
    matched = services.find((s) => {
      if (s.service_type !== params.serviceType) return false;
      return (
        s.is_color === undefined || Boolean(s.is_color) === Boolean(params.isColor)
      );
    });
  }

  // Tertiary match: Match by service_type alone
  if (!matched) {
    matched = services.find((s) => s.service_type === params.serviceType);
  }

  let unitPrice = 5;
  let matchedServiceName = 'Standard Print';
  let unitLabel = 'per page';

  if (matched) {
    unitPrice = matched.unit_price;
    matchedServiceName = matched.name;
    unitLabel = matched.unit_label || 'per page';
  } else {
    // Standard default fallback
    if (params.serviceType === 'photo_print') {
      unitPrice = 25;
      matchedServiceName = 'Photo Print';
      unitLabel = 'per photo';
    } else if (params.serviceType === 'citizenship') {
      unitLabel = 'per sheet';
      if (params.paperSize === 'A5') {
        unitPrice = params.isColor ? 15 : 8;
        matchedServiceName = `Citizenship A5 ${params.isColor ? 'Color' : 'B/W'} Print`;
      } else {
        unitPrice = params.isColor ? 25 : 10;
        matchedServiceName = `Citizenship A4 ${params.isColor ? 'Color' : 'B/W'} Print`;
      }
    } else if (params.serviceType === 'photocopy') {
      unitPrice = params.isColor ? 12 : 4;
      matchedServiceName = `A4 ${params.isColor ? 'Color' : 'B/W'} Photocopy`;
      unitLabel = 'per page';
    } else if (params.paperSize === 'A3') {
      unitPrice = params.isColor ? 40 : 15;
      matchedServiceName = `A3 ${params.isColor ? 'Color' : 'B/W'} Print`;
      unitLabel = 'per page';
    } else {
      unitPrice = params.isColor ? 15 : 5;
      matchedServiceName = `A4 ${params.isColor ? 'Color' : 'B/W'} Print`;
      unitLabel = 'per page';
    }
  }

  const totalAmount = unitPrice * totalPrints;
  return {
    unitPrice,
    totalAmount,
    totalPrints,
    matchedServiceName,
    matchedServiceId: matched?.id,
    unitLabel,
  };
}
