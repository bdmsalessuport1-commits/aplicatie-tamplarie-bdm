import { PDFDocument } from "pdf-lib";

export async function mergePDFs(mainPdfBytes: Buffer, attachmentBytes: Buffer): Promise<Buffer> {
  const mainDoc = await PDFDocument.load(mainPdfBytes);
  const attachmentDoc = await PDFDocument.load(attachmentBytes);

  const copiedPages = await mainDoc.copyPages(
    attachmentDoc,
    attachmentDoc.getPageIndices()
  );

  copiedPages.forEach((page) => mainDoc.addPage(page));

  const mergedBytes = await mainDoc.save();
  return Buffer.from(mergedBytes);
}

export async function validatePDF(buffer: Buffer): Promise<boolean> {
  try {
    await PDFDocument.load(buffer, { ignoreEncryption: false });
    return true;
  } catch {
    return false;
  }
}
