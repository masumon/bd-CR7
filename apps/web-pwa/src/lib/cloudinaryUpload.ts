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

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", preset);

  let res: Response;
  try {
    res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      { method: "POST", body: formData }
    );
  } catch (networkError) {
    throw new Error("Upload failed: no internet connection. The file will be uploaded automatically when you are back online.");
  }

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