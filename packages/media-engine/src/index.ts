export type CloudinaryUploadInput = {
  cloudName: string;
  uploadPreset: string;
  file: File;
};

export async function uploadToCloudinary(input: CloudinaryUploadInput): Promise<string> {
  const formData = new FormData();
  formData.append("file", input.file);
  formData.append("upload_preset", input.uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${input.cloudName}/auto/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Cloudinary upload failed");
  }

  const payload = (await response.json()) as { secure_url?: string };
  if (!payload.secure_url) {
    throw new Error("Cloudinary response missing secure_url");
  }

  return payload.secure_url;
}
