// Utility to upload a file to Cloudinary
// Usage: await uploadToCloudinary(file, 'cor_and_studentid');

export async function uploadToCloudinary(file: File, uploadPreset: string) {
  const url = `https://api.cloudinary.com/v1_1/dr7t6evpc/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload image to Cloudinary');
  }

  const data = await response.json();
  return data.secure_url as string;
} 