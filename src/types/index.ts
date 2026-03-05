import { Role, OfferStatus, ProfileType, FileType, Currency, Unit } from "@prisma/client";

export type { Role, OfferStatus, ProfileType, FileType, Currency, Unit };

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface ProductWithPrice {
  id: string;
  name: string;
  brand: string;
  systemName: string;
  profileType: ProfileType;
  descriptionTemplate: string;
  isActive: boolean;
  sortOrder: number;
  currentPrice?: {
    pricePerMpRon: number;
    pricePerMlRon: number;
    montajPriceRon: number;
  };
}

export interface ExtraOptionWithMapping {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: Unit;
  sortOrder: number;
  isActive: boolean;
  mapping?: {
    cellNotation: string;
  } | null;
}

export interface OfferExtraFull {
  id: string;
  offerId: string;
  extraOptionId: string;
  quantity: number;
  unitPriceRon: number;
  totalRon: number;
  notes?: string | null;
  extraOption: ExtraOptionWithMapping;
}

export interface OfferFull {
  id: string;
  offerNumber: string;
  title: string;
  clientName: string;
  clientPhone?: string | null;
  clientEmail?: string | null;
  clientAddress?: string | null;
  agentId: string;
  productId: string;
  status: OfferStatus;
  mp: number;
  ml: number;
  priceSnapshotMaterialsRon?: number | null;
  priceSnapshotMontajRon?: number | null;
  discountPercent: number;
  currency: Currency;
  eurRate?: number | null;
  googleSheetUrl?: string | null;
  spreadsheetId?: string | null;
  sheetSyncedAt?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date | null;
  pdfGeneratedAt?: Date | null;
  agent: {
    id: string;
    name: string;
    email: string;
  };
  product: ProductWithPrice;
  extras: OfferExtraFull[];
  files: {
    id: string;
    fileType: FileType;
    filename: string;
    originalName: string;
    fileSize: number;
    uploadedAt: Date;
  }[];
}

export interface DashboardKPIs {
  totalOffers: number;
  totalValueRon: number;
  acceptedCount: number;
  acceptedRate: number;
  draftCount: number;
  sentCount: number;
}

export interface DashboardByProduct {
  productName: string;
  profileType: string;
  count: number;
  value: number;
}

export interface DashboardByDay {
  date: string;
  count: number;
  value: number;
}

export interface DashboardResponse {
  kpis: DashboardKPIs;
  byProduct: DashboardByProduct[];
  byDay: DashboardByDay[];
  recentOffers: Partial<OfferFull>[];
}

export interface SheetSyncResult {
  synced: boolean;
  prices: {
    extraOptionId: string;
    name: string;
    cell: string;
    priceRon: number;
  }[];
  warnings: string[];
  syncedAt: string;
  error?: string;
}

export interface OfferCalculation {
  materialsRon: number;
  montajRon: number;
  extrasRon: number;
  subtotalRon: number;
  discountRon: number;
  totalRon: number;
  totalEur?: number;
}
