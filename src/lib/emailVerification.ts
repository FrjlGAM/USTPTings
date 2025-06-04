// Email verification using Abstract API
export async function verifyEmail(email: string): Promise<boolean> {
  const API_KEY = 'be62dbc8ecfe4352a4373457305906b1';
  const url = `https://emailvalidation.abstractapi.com/v1/?api_key=${API_KEY}&email=${encodeURIComponent(email)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    // Check if the email is deliverable and has valid format
    return data.deliverability === "DELIVERABLE" && data.is_valid_format.value;
  } catch (error) {
    console.error('Email verification error:', error);
    return false;
  }
} 