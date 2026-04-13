/**
 * Upload a file to Cloudinary.
 *
 * All document, image, video and audio uploads in this project go through
 * Cloudinary — NOT Supabase Storage. Supabase is only used as a relational
 * database to store file metadata (URL, name, module, etc.) after the file
 * has been uploaded here.
 *
 * Required Vercel / .env environment variables:
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME   – your Cloudinary cloud name
 *   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET – unsigned upload preset name
 *
 * Returns the public secure_url on success.
 * Throws a descriptive error on failure (network, env config, or API rejection).
 */
export const uploadToCloudinary = async (file: File): Promise<string> => {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Invalid file: please select a non-empty file before uploading.");
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !preset) {
    throw new Error("Upload configuration missing. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.");
  }

  const fileForUpload = await preprocessUploadFile(file);

  const formData = new FormData();
  formData.append("file", fileForUpload);
  formData.append("upload_preset", preset);

  const res = await uploadWithRetry(cloudName, formData);

  if (!res.ok) {
    let detail = `Upload failed (HTTP ${res.status})`;
    try {
      const errData = await res.json() as { error?: { message?: string } };
      if (errData?.error?.message) detail = errData.error.message;
    } catch {
      // ignore JSON parse error
    }
    throw new Error(detail);
  }

  const data = await res.json() as { secure_url?: string; url?: string };

  // Cloudinary returns `secure_url` (HTTPS). Fall back to `url` for legacy compatibility.
  const fileUrl = data.secure_url ?? data.url;
  if (!fileUrl) {
    throw new Error("Upload succeeded but no URL was returned by Cloudinary.");
  }

  return fileUrl;
};

async function uploadWithRetry(cloudName: string, formData: FormData): Promise<Response> {
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const res = await fetch(url, { method: "POST", body: formData });
      if (res.ok) return res;

      if (attempt < maxAttempts && (res.status >= 500 || res.status === 429)) {
        await sleep(250 * attempt);
        continue;
      }
      return res;
    } catch {
      if (attempt >= maxAttempts) {
        throw new Error("Upload failed: network unavailable. Please retry when your connection is stable.");
      }
      await sleep(250 * attempt);
    }
  }

  throw new Error("Upload failed after multiple attempts. Please retry.");
}

async function preprocessUploadFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  // Keep small images untouched to avoid unnecessary quality loss.
  if (file.size <= 1_500_000) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const maxW = 1920;
    const maxH = 1920;
    const scale = Math.min(1, maxW / bitmap.width, maxH / bitmap.height);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.82);
    });

    if (!blob || blob.size >= file.size) {
      return file;
    }

    const compressedName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], compressedName, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}