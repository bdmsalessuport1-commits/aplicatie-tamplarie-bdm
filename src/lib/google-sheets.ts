import { google } from "googleapis";
import { extractSpreadsheetId } from "./utils";

// Cache for sheet values (5 min TTL)
const cache = new Map<string, { data: Record<string, number>; expiresAt: number }>();

function getServiceAccountClient() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!keyJson) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not configured");
  }

  const credentials = JSON.parse(keyJson);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  return auth;
}

export interface SheetReadResult {
  success: boolean;
  values: Record<string, number>; // cell notation -> numeric value
  warnings: string[];
  error?: string;
  errorCode?: "SHEET_INACCESSIBLE" | "INVALID_URL" | "SERVICE_NOT_CONFIGURED" | "RATE_LIMIT";
}

export async function readSheetValues(
  sheetUrl: string,
  cellMappings: { extraOptionId: string; name: string; cellNotation: string }[]
): Promise<SheetReadResult> {
  const spreadsheetId = extractSpreadsheetId(sheetUrl);

  if (!spreadsheetId) {
    return {
      success: false,
      values: {},
      warnings: [],
      error: "URL-ul Google Sheet nu este valid.",
      errorCode: "INVALID_URL",
    };
  }

  if (!cellMappings.length) {
    return { success: true, values: {}, warnings: ["Nu există mapări configurate pentru extraopțiuni."] };
  }

  // Check cache
  const cacheKey = `${spreadsheetId}:${cellMappings.map((m) => m.cellNotation).join(",")}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return { success: true, values: cached.data, warnings: [] };
  }

  let auth;
  try {
    auth = getServiceAccountClient();
  } catch {
    return {
      success: false,
      values: {},
      warnings: [],
      error: "Serviciul Google Sheets nu este configurat. Contactați administratorul.",
      errorCode: "SERVICE_NOT_CONFIGURED",
    };
  }

  const sheets = google.sheets({ version: "v4", auth });
  const warnings: string[] = [];
  const values: Record<string, number> = {};

  // Build ranges - use Sheet1 as default tab
  const ranges = cellMappings.map((m) => `Sheet1!${m.cellNotation}`);

  try {
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges,
    });

    const valueRanges = response.data.valueRanges ?? [];

    for (let i = 0; i < cellMappings.length; i++) {
      const mapping = cellMappings[i];
      const valueRange = valueRanges[i];
      const rawValue = valueRange?.values?.[0]?.[0];

      if (rawValue === undefined || rawValue === null || rawValue === "") {
        warnings.push(
          `Celula ${mapping.cellNotation} pentru "${mapping.name}" este goală. Prețul a fost setat la 0.`
        );
        values[mapping.cellNotation] = 0;
      } else {
        const numValue = parseFloat(String(rawValue).replace(",", ".").replace(/[^\d.]/g, ""));
        if (isNaN(numValue)) {
          warnings.push(
            `Celula ${mapping.cellNotation} pentru "${mapping.name}" conține o valoare ne-numerică: "${rawValue}". Prețul a fost setat la 0.`
          );
          values[mapping.cellNotation] = 0;
        } else {
          values[mapping.cellNotation] = numValue;
        }
      }
    }

    // Cache for 5 minutes
    cache.set(cacheKey, { data: values, expiresAt: Date.now() + 5 * 60 * 1000 });

    return { success: true, values, warnings };
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string };
    if (err.code === 403 || err.code === 404) {
      return {
        success: false,
        values: {},
        warnings: [],
        error:
          "Nu se poate accesa sheet-ul. Verificați că sheet-ul este public sau că service account-ul este adăugat ca viewer.",
        errorCode: "SHEET_INACCESSIBLE",
      };
    }
    if (err.code === 429) {
      return {
        success: false,
        values: {},
        warnings: [],
        error: "Rate limit Google Sheets API. Încercați din nou în câteva secunde.",
        errorCode: "RATE_LIMIT",
      };
    }
    return {
      success: false,
      values: {},
      warnings: [],
      error: `Eroare la citirea sheet-ului: ${err.message ?? "eroare necunoscută"}`,
    };
  }
}

export function invalidateSheetCache(spreadsheetId: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(spreadsheetId)) {
      cache.delete(key);
    }
  }
}
