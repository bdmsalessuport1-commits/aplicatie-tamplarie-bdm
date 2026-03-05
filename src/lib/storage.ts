import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads";

function ensureUploadDir(subdir?: string) {
  const dir = subdir ? path.join(UPLOAD_DIR, subdir) : UPLOAD_DIR;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export async function saveFile(
  buffer: Buffer,
  originalName: string,
  offerId: string,
  mimeType: string
): Promise<{ filename: string; filePath: string; fileSize: number }> {
  const dir = ensureUploadDir(offerId);
  const ext = path.extname(originalName);
  const filename = `${randomUUID()}${ext}`;
  const filePath = path.join(dir, filename);

  fs.writeFileSync(filePath, buffer);

  return {
    filename,
    filePath: filePath.replace(process.cwd(), "").replace(/\\/g, "/"),
    fileSize: buffer.length,
  };
}

export async function readFile(filePath: string): Promise<Buffer> {
  const absolutePath = filePath.startsWith("/")
    ? path.join(process.cwd(), filePath)
    : path.resolve(filePath);
  return fs.readFileSync(absolutePath);
}

export async function deleteFile(filePath: string): Promise<void> {
  const absolutePath = filePath.startsWith("/")
    ? path.join(process.cwd(), filePath)
    : path.resolve(filePath);
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
}

export function getAbsolutePath(filePath: string): string {
  if (path.isAbsolute(filePath)) return filePath;
  return path.join(process.cwd(), filePath);
}

export const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB ?? "20") || 20) * 1024 * 1024;
export const ALLOWED_MIME_TYPES = ["application/pdf"];
