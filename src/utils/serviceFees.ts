import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface ServiceFeeCalculation {
  subtotal: number;
  serviceFeeRate: number;
  serviceFeeAmount: number;
  totalAmount: number;
  userType: 'student' | 'company' | 'unverified';
}

// Service fee rates
export const SERVICE_FEE_RATES = {
  student: 0.03, // 3%
  company: 0.05, // 5%
  unverified: 0.00 // 0% for unverified users
} as const;

/**
 * Get user type from verified accounts collection
 */
export async function getUserType(userId: string): Promise<'student' | 'company' | 'unverified'> {
  try {
    // Check if user is in verifiedAccounts collection
    const verifiedAccountDoc = await getDoc(doc(db, 'verifiedAccounts', userId));
    
    if (verifiedAccountDoc.exists()) {
      const data = verifiedAccountDoc.data();
      const userType = data.type;
      
      // Validate that the type is either 'student' or 'company'
      if (userType === 'student' || userType === 'company') {
        return userType;
      }
    }
    
    return 'unverified';
  } catch (error) {
    console.error('Error fetching user type:', error);
    return 'unverified';
  }
}

/**
 * Calculate service fee and total amount based on user type
 */
export async function calculateServiceFee(
  subtotal: number, 
  userId: string
): Promise<ServiceFeeCalculation> {
  const userType = await getUserType(userId);
  const serviceFeeRate = SERVICE_FEE_RATES[userType];
  const serviceFeeAmount = subtotal * serviceFeeRate;
  const totalAmount = subtotal + serviceFeeAmount;

  return {
    subtotal,
    serviceFeeRate,
    serviceFeeAmount,
    totalAmount,
    userType
  };
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format percentage
 */
export function formatPercentage(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`;
}
