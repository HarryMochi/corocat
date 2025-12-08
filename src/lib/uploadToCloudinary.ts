export async function uploadToCloudinary(base64: string) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: JSON.stringify({
        file: base64,
        upload_preset: preset,
        folder: "pfps"
      }),
      headers: { "Content-Type": "application/json" }
    }
  );

  const data = await res.json();
  if (!data.secure_url) throw new Error("Cloudinary upload failed");

  return data.secure_url;
}
