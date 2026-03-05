import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractSpreadsheetId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] ?? null;
}

export function formatCurrency(amount: number, currency = "RON"): string {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: currency === "EUR" ? "EUR" : "RON",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function generateOfferNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `BDM-${year}-${random}`;
}

export async function generateUniqueOfferNumber(
  prismaClient: { offer: { findUnique: (args: { where: { offerNumber: string } }) => Promise<unknown> } }
): Promise<string> {
  let offerNumber = generateOfferNumber();
  let attempts = 0;
  while (attempts < 10) {
    const existing = await prismaClient.offer.findUnique({
      where: { offerNumber },
    });
    if (!existing) return offerNumber;
    offerNumber = generateOfferNumber();
    attempts++;
  }
  // Fallback with timestamp
  return `BDM-${Date.now()}`;
}

export function calculateOfferTotals(
  mp: number,
  ml: number,
  pricePerMpRon: number,
  pricePerMlRon: number,
  montajPriceRon: number,
  extrasTotal: number,
  discountPercent: number
) {
  const materialsRon = mp * pricePerMpRon + ml * pricePerMlRon;
  const montajRon = (mp + ml) * montajPriceRon;
  const subtotalRon = materialsRon + montajRon + extrasTotal;
  const discountRon = (subtotalRon * discountPercent) / 100;
  const totalRon = subtotalRon - discountRon;

  return {
    materialsRon: Math.round(materialsRon * 100) / 100,
    montajRon: Math.round(montajRon * 100) / 100,
    extrasRon: Math.round(extrasTotal * 100) / 100,
    subtotalRon: Math.round(subtotalRon * 100) / 100,
    discountRon: Math.round(discountRon * 100) / 100,
    totalRon: Math.round(totalRon * 100) / 100,
  };
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: "Ciornă",
    SENT: "Trimisă",
    ACCEPTED: "Acceptată",
    REJECTED: "Respinsă",
    EXPIRED: "Expirată",
  };
  return labels[status] ?? status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    SENT: "bg-blue-100 text-blue-700",
    ACCEPTED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
    EXPIRED: "bg-orange-100 text-orange-700",
  };
  return colors[status] ?? "bg-gray-100 text-gray-700";
}
