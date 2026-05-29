/**
 * Local-disk file storage for Phase 0.
 *
 * Files are written to UPLOAD_DIR/{orgId}/{sessionId}/{fileId}
 * The storageKey stored in the DB is the absolute path on disk.
 *
 * To swap to S3 later: replace these three functions and keep the
 * calling code identical.
 */

import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import path from "path";

function uploadDir(): string {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
}

/**
 * Write a file to disk and return its storage key (absolute path).
 */
export async function writeUploadedFile(
  orgId: string,
  sessionId: string,
  fileId: string,
  data: Buffer
): Promise<string> {
  const dir = path.join(uploadDir(), orgId, sessionId);
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, fileId);
  await writeFile(filePath, data);
  return filePath;
}

/**
 * Read a file from disk by its storage key.
 */
export async function readUploadedFile(storageKey: string): Promise<Buffer> {
  return readFile(storageKey);
}

/**
 * Delete a file from disk by its storage key. Does not throw if missing.
 */
export async function deleteUploadedFile(storageKey: string): Promise<void> {
  await unlink(storageKey).catch(() => undefined);
}
