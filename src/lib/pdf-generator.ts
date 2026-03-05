/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  renderToBuffer,
  Image,
} from "@react-pdf/renderer";
import { createElement } from "react";
import type { OfferFull } from "@/types";
import { formatCurrency, formatDate } from "./utils";

// Register fonts (using built-in Helvetica for reliability in Node)
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
    { src: "Helvetica-Oblique", fontStyle: "italic" },
  ],
});

const BLUE = "#2563eb";
const DARK = "#1a1a2e";
const GRAY = "#6b7280";
const LIGHT_BG = "#f8fafc";
const BORDER = "#e2e8f0";
const GREEN = "#16a34a";
const WHITE = "#ffffff";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: DARK,
    backgroundColor: WHITE,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
  },
  // COVER
  coverPage: {
    fontFamily: "Helvetica",
    justifyContent: "space-between",
    backgroundColor: WHITE,
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
  },
  coverHeader: {
    backgroundColor: DARK,
    paddingVertical: 30,
    paddingHorizontal: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  coverHeaderTitle: {
    color: WHITE,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  coverHeaderSubtitle: {
    color: "#94a3b8",
    fontSize: 9,
    marginTop: 3,
  },
  coverBody: {
    flex: 1,
    padding: 40,
    justifyContent: "center",
  },
  coverTitle: {
    fontSize: 32,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 8,
    letterSpacing: 1,
  },
  coverTitleAccent: {
    color: BLUE,
  },
  coverOfferNumber: {
    fontSize: 14,
    color: BLUE,
    marginBottom: 30,
    fontFamily: "Helvetica-Bold",
  },
  coverDivider: {
    height: 3,
    backgroundColor: BLUE,
    width: 60,
    marginBottom: 30,
  },
  coverInfoGrid: {
    flexDirection: "row",
    gap: 40,
    marginBottom: 30,
  },
  coverInfoBlock: {
    flex: 1,
  },
  coverInfoLabel: {
    fontSize: 7,
    color: GRAY,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  coverInfoValue: {
    fontSize: 11,
    color: DARK,
    fontFamily: "Helvetica-Bold",
  },
  coverInfoValueSub: {
    fontSize: 9,
    color: GRAY,
    marginTop: 2,
  },
  coverFooter: {
    backgroundColor: BLUE,
    paddingVertical: 16,
    paddingHorizontal: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  coverFooterText: {
    color: WHITE,
    fontSize: 9,
  },
  // SECTION HEADER
  sectionHeader: {
    backgroundColor: DARK,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderRadius: 2,
  },
  sectionHeaderText: {
    color: WHITE,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
  sectionHeaderSub: {
    color: "#94a3b8",
    fontSize: 8,
    marginTop: 2,
  },
  // TABLE
  table: {
    marginBottom: 12,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: BLUE,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  tableHeaderCell: {
    color: WHITE,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  tableRowAlt: {
    backgroundColor: LIGHT_BG,
  },
  tableCell: {
    fontSize: 9,
    flex: 1,
    color: DARK,
  },
  tableCellRight: {
    textAlign: "right",
  },
  tableCellBold: {
    fontFamily: "Helvetica-Bold",
  },
  // TOTAL ROW
  totalRow: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 10,
    backgroundColor: DARK,
    marginTop: 2,
  },
  totalLabel: {
    color: WHITE,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    flex: 3,
  },
  totalValue: {
    color: "#60d394",
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    flex: 1,
    textAlign: "right",
  },
  discountRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: "#fef3c7",
    borderBottomWidth: 0.5,
    borderBottomColor: "#fcd34d",
  },
  // PAGE FOOTER
  pageFooter: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pageFooterText: {
    fontSize: 7,
    color: GRAY,
  },
  // PRODUCT DESCRIPTION
  productBox: {
    backgroundColor: LIGHT_BG,
    padding: 16,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: BLUE,
    marginBottom: 12,
  },
  productName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 9,
    color: BLUE,
    marginBottom: 10,
    fontFamily: "Helvetica-Bold",
  },
  productDesc: {
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.6,
  },
  // EXTRA OPTIONS CARDS
  extraCard: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  extraCardLeft: {
    flex: 3,
    paddingRight: 12,
  },
  extraCardRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  extraName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 3,
  },
  extraCategory: {
    fontSize: 7,
    color: BLUE,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
    fontFamily: "Helvetica-Bold",
  },
  extraDesc: {
    fontSize: 8,
    color: GRAY,
    lineHeight: 1.5,
  },
  extraPrice: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: DARK,
  },
  extraQty: {
    fontSize: 8,
    color: GRAY,
    marginTop: 2,
  },
  // BADGES
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "#dbeafe",
  },
  badgeText: {
    fontSize: 8,
    color: BLUE,
    fontFamily: "Helvetica-Bold",
  },
  // KV Row
  kvRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  kvLabel: {
    fontSize: 9,
    color: GRAY,
    flex: 1,
  },
  kvValue: {
    fontSize: 9,
    color: DARK,
    flex: 2,
    fontFamily: "Helvetica-Bold",
  },
  greenHighlight: {
    color: GREEN,
  },
});

function PageFooter({ offerNumber, agentName }: { offerNumber: string; agentName: string }) {
  return createElement(
    View,
    { style: styles.pageFooter, fixed: true },
    createElement(Text, { style: styles.pageFooterText }, `Ofertă nr. ${offerNumber} | ${agentName}`),
    createElement(Text, { style: styles.pageFooterText }, `Generat de BDM Sales Support`),
    createElement(
      Text,
      { style: styles.pageFooterText, render: ({ pageNumber, totalPages }: any) => `Pagina ${pageNumber} din ${totalPages}` } as any
    )
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return createElement(
    View,
    { style: styles.sectionHeader },
    createElement(Text, { style: styles.sectionHeaderText }, title.toUpperCase()),
    subtitle ? createElement(Text, { style: styles.sectionHeaderSub }, subtitle) : null
  );
}

// Clean description text (remove markdown bold **)
function cleanDesc(text: string): string {
  return text.replace(/\*\*/g, "").replace(/\*/g, "");
}

export async function generateOfferPDF(offer: OfferFull): Promise<Buffer> {
  const { agent, product, extras } = offer;

  const mp = Number(offer.mp);
  const ml = Number(offer.ml);

  // Use snapshot prices if sent, otherwise use current product price
  const pricePerMp = offer.priceSnapshotMaterialsRon
    ? Number(offer.priceSnapshotMaterialsRon) / (mp || 1)
    : Number(product.currentPrice?.pricePerMpRon ?? 0);
  const pricePerMl = Number(product.currentPrice?.pricePerMlRon ?? 0);
  const montajPrice = offer.priceSnapshotMontajRon
    ? Number(offer.priceSnapshotMontajRon)
    : Number(product.currentPrice?.montajPriceRon ?? 0) * (mp + ml);

  const materialsRon = offer.priceSnapshotMaterialsRon
    ? Number(offer.priceSnapshotMaterialsRon)
    : mp * pricePerMp + ml * pricePerMl;
  const montajRon = offer.priceSnapshotMontajRon ? Number(offer.priceSnapshotMontajRon) : montajPrice;
  const extrasTotal = extras.reduce((sum, e) => sum + Number(e.totalRon), 0);
  const subtotal = materialsRon + montajRon + extrasTotal;
  const discountPct = Number(offer.discountPercent);
  const discountRon = (subtotal * discountPct) / 100;
  const totalRon = subtotal - discountRon;
  const totalEur = offer.eurRate ? totalRon / Number(offer.eurRate) : null;

  const doc = createElement(
    Document,
    { title: `Ofertă ${offer.offerNumber}`, author: "BDM Sales Support" },
    // PAGE 1: COVER
    createElement(
      Page,
      { size: "A4", style: styles.coverPage },
      // Header bar
      createElement(
        View,
        { style: styles.coverHeader },
        createElement(
          View,
          null,
          createElement(Text, { style: styles.coverHeaderTitle }, process.env.NEXT_PUBLIC_COMPANY_NAME ?? "BDM Sales Support"),
          createElement(Text, { style: styles.coverHeaderSubtitle }, "Sisteme de Tâmplărie PVC & Aluminiu")
        ),
        createElement(
          View,
          { style: { alignItems: "flex-end" } },
          createElement(Text, { style: styles.coverHeaderTitle }, formatDate(offer.createdAt)),
          createElement(Text, { style: styles.coverHeaderSubtitle }, offer.offerNumber)
        )
      ),
      // Body
      createElement(
        View,
        { style: styles.coverBody },
        createElement(Text, { style: styles.coverTitle }, "OFERTĂ"),
        createElement(Text, { style: [styles.coverTitle, styles.coverTitleAccent] as any }, "TÂMPLĂRIE"),
        createElement(View, { style: styles.coverDivider }),
        createElement(Text, { style: styles.coverOfferNumber }, offer.offerNumber),
        createElement(
          View,
          { style: styles.coverInfoGrid },
          // Client
          createElement(
            View,
            { style: styles.coverInfoBlock },
            createElement(Text, { style: styles.coverInfoLabel }, "Client"),
            createElement(Text, { style: styles.coverInfoValue }, offer.clientName),
            offer.clientPhone
              ? createElement(Text, { style: styles.coverInfoValueSub }, offer.clientPhone)
              : null,
            offer.clientEmail
              ? createElement(Text, { style: styles.coverInfoValueSub }, offer.clientEmail)
              : null,
            offer.clientAddress
              ? createElement(Text, { style: styles.coverInfoValueSub }, offer.clientAddress)
              : null
          ),
          // Agent
          createElement(
            View,
            { style: styles.coverInfoBlock },
            createElement(Text, { style: styles.coverInfoLabel }, "Agent Vânzări"),
            createElement(Text, { style: styles.coverInfoValue }, agent.name),
            createElement(Text, { style: styles.coverInfoValueSub }, agent.email)
          ),
          // System
          createElement(
            View,
            { style: styles.coverInfoBlock },
            createElement(Text, { style: styles.coverInfoLabel }, "Sistem ales"),
            createElement(
              Text,
              { style: styles.coverInfoValue },
              `${product.name} – ${product.systemName}`
            ),
            createElement(
              Text,
              { style: styles.coverInfoValueSub },
              `${product.brand} | ${product.profileType}`
            )
          )
        ),
        // Total highlight
        createElement(
          View,
          {
            style: {
              backgroundColor: BLUE,
              paddingVertical: 16,
              paddingHorizontal: 20,
              borderRadius: 4,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            },
          },
          createElement(
            View,
            null,
            createElement(
              Text,
              { style: { color: "#93c5fd", fontSize: 9, textTransform: "uppercase", letterSpacing: 1 } },
              "TOTAL ESTIMAT"
            ),
            createElement(
              Text,
              { style: { color: WHITE, fontSize: 22, fontFamily: "Helvetica-Bold", marginTop: 4 } },
              formatCurrency(totalRon, "RON")
            ),
            totalEur
              ? createElement(
                  Text,
                  { style: { color: "#bfdbfe", fontSize: 10, marginTop: 2 } },
                  `≈ ${formatCurrency(totalEur, "EUR")} (1 EUR = ${offer.eurRate} RON)`
                )
              : null
          ),
          createElement(
            View,
            { style: { alignItems: "flex-end" } },
            createElement(
              Text,
              { style: { color: "#bfdbfe", fontSize: 8 } },
              `${mp} mp + ${ml} ml`
            ),
            discountPct > 0
              ? createElement(
                  Text,
                  { style: { color: "#fde047", fontSize: 9, marginTop: 4, fontFamily: "Helvetica-Bold" } },
                  `Discount ${discountPct}% inclus`
                )
              : null
          )
        )
      ),
      // Footer bar
      createElement(
        View,
        { style: styles.coverFooter },
        createElement(
          Text,
          { style: styles.coverFooterText },
          "Oferta este valabilă 30 de zile de la data emiterii."
        ),
        createElement(
          Text,
          { style: styles.coverFooterText },
          `Prețuri exprimate în RON${totalEur ? " și EUR" : ""}, inclusiv TVA`
        )
      )
    ),

    // PAGE 2: SISTEM ALES
    createElement(
      Page,
      { size: "A4", style: styles.page },
      createElement(SectionHeader as any, { title: "Sistemul de Tâmplărie Ales", subtitle: `${product.brand} – ${product.systemName}` }),
      createElement(
        View,
        { style: styles.productBox },
        createElement(Text, { style: styles.productName }, `${product.name} – ${product.systemName}`),
        createElement(
          Text,
          { style: styles.productBrand },
          `${product.brand} | Profil ${product.profileType}`
        ),
        createElement(Text, { style: styles.productDesc }, cleanDesc(product.descriptionTemplate))
      ),
      // Specs table
      createElement(SectionHeader as any, { title: "Date Proiect" }),
      createElement(
        View,
        { style: styles.table },
        createElement(
          View,
          { style: styles.tableHeaderRow },
          createElement(Text, { style: [styles.tableHeaderCell, { flex: 2 }] as any }, "Parametru"),
          createElement(Text, { style: styles.tableHeaderCell }, "Valoare"),
          createElement(Text, { style: styles.tableHeaderCell }, "Unitate")
        ),
        createElement(
          View,
          { style: styles.tableRow },
          createElement(Text, { style: [styles.tableCell, { flex: 2 }] as any }, "Suprafața totală"),
          createElement(Text, { style: [styles.tableCell, styles.tableCellBold] as any }, String(mp)),
          createElement(Text, { style: styles.tableCell }, "mp")
        ),
        createElement(
          View,
          { style: [styles.tableRow, styles.tableRowAlt] as any },
          createElement(Text, { style: [styles.tableCell, { flex: 2 }] as any }, "Lungimea totală"),
          createElement(Text, { style: [styles.tableCell, styles.tableCellBold] as any }, String(ml)),
          createElement(Text, { style: styles.tableCell }, "ml")
        ),
        createElement(
          View,
          { style: styles.tableRow },
          createElement(Text, { style: [styles.tableCell, { flex: 2 }] as any }, "Valută ofertă"),
          createElement(Text, { style: [styles.tableCell, styles.tableCellBold] as any }, offer.currency),
          createElement(Text, { style: styles.tableCell }, offer.eurRate ? `1 EUR = ${offer.eurRate} RON` : "–")
        )
      ),
      createElement(PageFooter as any, { offerNumber: offer.offerNumber, agentName: agent.name })
    ),

    // PAGE 3: COSTURI
    createElement(
      Page,
      { size: "A4", style: styles.page },
      createElement(SectionHeader as any, { title: "Detaliere Costuri", subtitle: "Toate prețurile includ TVA" }),
      // Costs table
      createElement(
        View,
        { style: styles.table },
        createElement(
          View,
          { style: styles.tableHeaderRow },
          createElement(Text, { style: [styles.tableHeaderCell, { flex: 3 }] as any }, "Categorie"),
          createElement(Text, { style: [styles.tableHeaderCell, styles.tableCellRight] as any }, "Valoare RON")
        ),
        // Materials
        createElement(
          View,
          { style: styles.tableRow },
          createElement(
            Text,
            { style: [styles.tableCell, { flex: 3 }] as any },
            `Sistem tâmplărie – materiale (${mp} mp × ${formatCurrency(pricePerMp)} + ${ml} ml × ${formatCurrency(pricePerMl)})`
          ),
          createElement(
            Text,
            { style: [styles.tableCell, styles.tableCellRight, styles.tableCellBold] as any },
            formatCurrency(materialsRon)
          )
        ),
        // Montaj
        createElement(
          View,
          { style: [styles.tableRow, styles.tableRowAlt] as any },
          createElement(
            Text,
            { style: [styles.tableCell, { flex: 3 }] as any },
            `Montaj standard (${mp + ml} total × ${formatCurrency(Number(product.currentPrice?.montajPriceRon ?? 0))} / u.m.)`
          ),
          createElement(
            Text,
            { style: [styles.tableCell, styles.tableCellRight, styles.tableCellBold] as any },
            formatCurrency(montajRon)
          )
        ),
        // Extras
        ...extras.map((extra, idx) =>
          createElement(
            View,
            { key: extra.id, style: idx % 2 === 0 ? styles.tableRow : ([styles.tableRow, styles.tableRowAlt] as any) },
            createElement(
              Text,
              { style: [styles.tableCell, { flex: 3 }] as any },
              `${extra.extraOption.name} (${extra.quantity} ${extra.extraOption.unit} × ${formatCurrency(Number(extra.unitPriceRon))})`
            ),
            createElement(
              Text,
              { style: [styles.tableCell, styles.tableCellRight, styles.tableCellBold] as any },
              formatCurrency(Number(extra.totalRon))
            )
          )
        ),
        // Subtotal
        createElement(
          View,
          {
            style: {
              flexDirection: "row",
              paddingVertical: 7,
              paddingHorizontal: 10,
              borderBottomWidth: 0.5,
              borderBottomColor: BORDER,
              backgroundColor: "#eff6ff",
            },
          },
          createElement(
            Text,
            { style: [styles.tableCell, { flex: 3, fontFamily: "Helvetica-Bold", color: BLUE }] as any },
            "SUBTOTAL"
          ),
          createElement(
            Text,
            {
              style: [
                styles.tableCell,
                styles.tableCellRight,
                { fontFamily: "Helvetica-Bold", color: BLUE },
              ] as any,
            },
            formatCurrency(subtotal)
          )
        ),
        // Discount
        discountPct > 0
          ? createElement(
              View,
              { style: styles.discountRow },
              createElement(
                Text,
                { style: [styles.tableCell, { flex: 3, color: "#92400e" }] as any },
                `Discount comercial (${discountPct}%)`
              ),
              createElement(
                Text,
                {
                  style: [styles.tableCell, styles.tableCellRight, { fontFamily: "Helvetica-Bold", color: "#92400e" }] as any,
                },
                `- ${formatCurrency(discountRon)}`
              )
            )
          : null,
        // TOTAL
        createElement(
          View,
          { style: styles.totalRow },
          createElement(Text, { style: styles.totalLabel }, "TOTAL GENERAL"),
          createElement(Text, { style: styles.totalValue }, formatCurrency(totalRon))
        ),
        // EUR
        totalEur
          ? createElement(
              View,
              {
                style: {
                  flexDirection: "row",
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  backgroundColor: "#f0fdf4",
                  borderBottomWidth: 0.5,
                  borderBottomColor: "#86efac",
                },
              },
              createElement(
                Text,
                { style: [styles.tableCell, { flex: 3, color: GREEN }] as any },
                `Total EUR (1 EUR = ${offer.eurRate} RON)`
              ),
              createElement(
                Text,
                {
                  style: [styles.tableCell, styles.tableCellRight, { fontFamily: "Helvetica-Bold", color: GREEN }] as any,
                },
                formatCurrency(totalEur, "EUR")
              )
            )
          : null
      ),
      // Notes
      offer.notes
        ? createElement(
            View,
            { style: { marginTop: 12, padding: 12, backgroundColor: LIGHT_BG, borderRadius: 4 } },
            createElement(Text, { style: { fontSize: 8, color: GRAY, marginBottom: 4, fontFamily: "Helvetica-Bold" } }, "OBSERVAȚII:"),
            createElement(Text, { style: { fontSize: 9, color: DARK, lineHeight: 1.6 } }, offer.notes)
          )
        : null,
      createElement(PageFooter as any, { offerNumber: offer.offerNumber, agentName: agent.name })
    ),

    // PAGE 4: EXTRAOPȚIUNI (only if there are extras)
    ...(extras.length > 0
      ? [
          createElement(
            Page,
            { size: "A4", style: styles.page },
            createElement(SectionHeader as any, {
              title: "Extraopțiuni Incluse în Ofertă",
              subtitle: `${extras.length} opțiuni selectate`,
            }),
            ...extras.map((extra) =>
              createElement(
                View,
                { key: extra.id, style: styles.extraCard },
                createElement(
                  View,
                  { style: styles.extraCardLeft },
                  createElement(Text, { style: styles.extraCategory }, extra.extraOption.category),
                  createElement(Text, { style: styles.extraName }, extra.extraOption.name),
                  createElement(Text, { style: styles.extraDesc }, extra.extraOption.description),
                  extra.notes
                    ? createElement(
                        Text,
                        { style: { fontSize: 8, color: GRAY, marginTop: 4, fontStyle: "italic" } },
                        `Observație: ${extra.notes}`
                      )
                    : null
                ),
                createElement(
                  View,
                  { style: styles.extraCardRight },
                  createElement(
                    View,
                    { style: styles.badge },
                    createElement(
                      Text,
                      { style: styles.badgeText },
                      `${extra.quantity} ${extra.extraOption.unit}`
                    )
                  ),
                  createElement(Text, { style: styles.extraPrice }, formatCurrency(Number(extra.totalRon))),
                  createElement(
                    Text,
                    { style: styles.extraQty },
                    `${formatCurrency(Number(extra.unitPriceRon))} / ${extra.extraOption.unit}`
                  )
                )
              )
            ),
            createElement(PageFooter as any, { offerNumber: offer.offerNumber, agentName: agent.name })
          ),
        ]
      : [])
  );

  const buffer = await renderToBuffer(doc);
  return buffer;
}
