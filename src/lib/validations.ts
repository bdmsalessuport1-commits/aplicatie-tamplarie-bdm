import { z } from "zod";

export const createOfferSchema = z.object({
  title: z.string().min(3, "Titlul trebuie să aibă minim 3 caractere").max(200),
  clientName: z.string().min(2, "Numele clientului este obligatoriu").max(200),
  clientPhone: z.string().optional().nullable(),
  clientEmail: z.string().email("Email invalid").optional().nullable().or(z.literal("")),
  clientAddress: z.string().optional().nullable(),
  productId: z.string().uuid("Selectați un produs valid"),
  mp: z.number().positive("Suprafața (mp) trebuie să fie pozitivă").max(10000),
  ml: z.number().positive("Lungimea (ml) trebuie să fie pozitivă").max(10000),
  googleSheetUrl: z
    .string()
    .optional()
    .nullable()
    .refine(
      (url) => !url || url.includes("docs.google.com/spreadsheets"),
      "URL-ul trebuie să fie un Google Sheets valid"
    ),
  currency: z.enum(["RON", "EUR"]).default("RON"),
  eurRate: z.number().positive().optional().nullable(),
  discountPercent: z.number().min(0).max(100).default(0),
  notes: z.string().optional().nullable(),
});

export const updateOfferSchema = createOfferSchema.partial();

export const updateOfferExtrasSchema = z.object({
  extras: z.array(
    z.object({
      extraOptionId: z.string().uuid(),
      quantity: z.number().positive("Cantitatea trebuie să fie pozitivă"),
      unitPriceRon: z.number().min(0),
      notes: z.string().optional().nullable(),
    })
  ),
});

export const createUserSchema = z.object({
  name: z.string().min(2, "Numele trebuie să aibă minim 2 caractere").max(200),
  email: z.string().email("Email invalid"),
  password: z
    .string()
    .min(8, "Parola trebuie să aibă minim 8 caractere")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Parola trebuie să conțină litere mari, mici și cifre"
    ),
  role: z.enum(["ADMIN", "AGENT"]).default("AGENT"),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  email: z.string().email().optional(),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .optional()
    .nullable(),
  role: z.enum(["ADMIN", "AGENT"]).optional(),
  isActive: z.boolean().optional(),
});

export const updateMappingsSchema = z.object({
  mappings: z.array(
    z.object({
      extraOptionId: z.string().uuid(),
      cellNotation: z
        .string()
        .regex(/^[A-Z]{1,3}[0-9]{1,7}$/, "Formatul celulei trebuie să fie ex: G9, AB15")
        .toUpperCase(),
      description: z.string().optional().nullable(),
    })
  ),
});

export const updateProductPriceSchema = z.object({
  pricePerMpRon: z.number().positive("Prețul/mp trebuie să fie pozitiv"),
  pricePerMlRon: z.number().positive("Prețul/ml trebuie să fie pozitiv"),
  montajPriceRon: z.number().positive("Prețul montaj trebuie să fie pozitiv"),
});
