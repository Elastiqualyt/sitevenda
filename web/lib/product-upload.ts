import { supabase } from '@/lib/supabase';
import {
  isMarketplaceUploadDebug,
  uploadDebug,
  uploadDebugError,
  uploadDebugTimeEnd,
  uploadDebugTimeStart,
} from '@/lib/upload-debug';

export function getProductFileExtension(file: File): string {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'jpg';
  if (name.endsWith('.png')) return 'png';
  if (name.endsWith('.webp')) return 'webp';
  return 'bin';
}

async function uploadOneFile(
  userId: string,
  file: File,
  bucket: string,
  suffix: string
): Promise<string> {
  const ext = getProductFileExtension(file);
  const path = `${userId}/${Date.now()}-${suffix}-${Math.random().toString(36).slice(2)}.${ext}`;
  const contentType =
    file.type ||
    (ext === 'jpg' || ext === 'jpeg'
      ? 'image/jpeg'
      : ext === 'png'
        ? 'image/png'
        : ext === 'webp'
          ? 'image/webp'
          : 'application/octet-stream');
  const t0 = uploadDebugTimeStart();
  if (isMarketplaceUploadDebug()) {
    uploadDebug('storage.upload (imagem) início', { bucket, path, size: file.size, contentType });
  }
  const { error: uploadErr } = await supabase.storage.from(bucket).upload(path, file, {
    contentType,
    upsert: true,
  });
  uploadDebugTimeEnd(`storage.upload fim [${bucket}]`, t0);
  if (uploadErr) {
    uploadDebugError(`storage.upload imagem ${bucket}`, uploadErr, { path });
    throw new Error(uploadErr.message);
  }
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return urlData.publicUrl;
}

/** Envia várias imagens para o bucket (em paralelo — mais rápido). */
export async function uploadGalleryImages(
  userId: string,
  files: File[],
  bucket: string
): Promise<string[]> {
  const tasks = files.map((file, i) => uploadOneFile(userId, file, bucket, `img-${i}`));
  return Promise.all(tasks);
}

/** Upload do ficheiro digital (PDF, etc.) para digital-files. */
export async function uploadDigitalProductFile(
  userId: string,
  file: File,
  bucket: string
): Promise<string> {
  const ext = getProductFileExtension(file);
  const path = `${userId}/${Date.now()}-dl-${Math.random().toString(36).slice(2)}.${ext}`;
  const contentType =
    file.type ||
    (ext === 'pdf' ? 'application/pdf' : 'application/octet-stream');
  const t0 = uploadDebugTimeStart();
  if (isMarketplaceUploadDebug()) {
    uploadDebug('storage.upload (ficheiro digital) início', {
      bucket,
      path,
      size: file.size,
      contentType,
    });
  }
  const { error: uploadErr } = await supabase.storage.from(bucket).upload(path, file, {
    contentType,
    upsert: true,
  });
  uploadDebugTimeEnd(`storage.upload fim (digital) [${bucket}]`, t0);
  if (uploadErr) {
    uploadDebugError(`storage.upload digital ${bucket}`, uploadErr, { path });
    throw new Error(uploadErr.message);
  }
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return urlData.publicUrl;
}
