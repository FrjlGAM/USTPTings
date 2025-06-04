// Utility to upload a file to Cloudinary
// Usage: await uploadToCloudinary(file, 'cor_and_studentid');

export async function uploadToCloudinary(file: File, uploadPreset: string) {
  const url = `https://api.cloudinary.com/v1_1/dr7t6evpc/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    console.log('Uploading file to Cloudinary:', file.name, 'with preset:', uploadPreset);
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary upload failed:', response.status, errorText);
      throw new Error(`Failed to upload image to Cloudinary: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Cloudinary upload successful:', data.secure_url);
    return data.secure_url as string;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
} 