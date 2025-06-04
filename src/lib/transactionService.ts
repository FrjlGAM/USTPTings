// Transaction service for creating and managing transaction records
import { db } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, query, where, limit, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';

export interface TransactionRecord {
  id?: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  subtotal: number;
  serviceFeeAmount: number;
  serviceFeeRate: number;
  totalAmount: number;
  platformRevenue: number; // Amount that goes to platform (service fee)
  sellerRevenue: number;   // Amount that goes to seller (subtotal)
  paymentMethod: string;
  paymentId?: string;
  status: 'completed' | 'failed' | 'cancelled' | 'refunded';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Create a transaction record when an order is successfully created
 */
export async function createTransactionRecord(orderData: {
  orderId: string;
  buyerId: string;
  sellerId: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  subtotal: number;
  serviceFeeAmount: number;
  serviceFeeRate: number;
  totalAmount: number;
  paymentMethod: string;
  paymentId?: string;
}): Promise<string> {
  try {
    // Check if transaction already exists for this order
    const existingTransaction = await getTransactionByOrderId(orderData.orderId);
    if (existingTransaction) {
      console.log('Transaction already exists for order:', orderData.orderId);
      return existingTransaction.id!;
    }

    // Also check if transaction exists for this paymentId (additional safety)
    if (orderData.paymentId) {
      const existingByPaymentId = await getTransactionByPaymentId(orderData.paymentId);
      if (existingByPaymentId) {
        console.log('Transaction already exists for paymentId:', orderData.paymentId);
        return existingByPaymentId.id!;
      }
    }

    const transaction: Omit<TransactionRecord, 'id'> = {
      orderId: orderData.orderId,
      buyerId: orderData.buyerId,
      sellerId: orderData.sellerId,
      productId: orderData.productId,
      productName: orderData.productName,
      productImage: orderData.productImage,
      quantity: orderData.quantity,
      subtotal: orderData.subtotal,
      serviceFeeAmount: orderData.serviceFeeAmount,
      serviceFeeRate: orderData.serviceFeeRate,
      totalAmount: orderData.totalAmount,
      platformRevenue: orderData.serviceFeeAmount, // Platform gets the service fee
      sellerRevenue: orderData.subtotal, // Seller gets the subtotal
      paymentMethod: orderData.paymentMethod,
      paymentId: orderData.paymentId,
      status: 'completed',
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    const docRef = await addDoc(collection(db, 'transactions'), transaction);
    console.log('Transaction record created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating transaction record:', error);
    throw error;
  }
}

/**
 * Update transaction status (for refunds, cancellations, etc.)
 */
export async function updateTransactionStatus(
  transactionId: string, 
  status: TransactionRecord['status']
): Promise<void> {
  try {
    const transactionRef = doc(db, 'transactions', transactionId);
    await updateDoc(transactionRef, {
      status,
      updatedAt: serverTimestamp()
    });
    console.log('Transaction status updated:', transactionId, status);
  } catch (error) {
    console.error('Error updating transaction status:', error);
    throw error;
  }
}

/**
 * Get transaction by order ID
 */
export async function getTransactionByOrderId(orderId: string): Promise<TransactionRecord | null> {
  try {
    const transactionQuery = query(
      collection(db, 'transactions'),
      where('orderId', '==', orderId),
      limit(1)
    );
    const snapshot = await getDocs(transactionQuery);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as TransactionRecord;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting transaction by order ID:', error);
    return null;
  }
}

/**
 * Get transaction by payment ID
 */
export async function getTransactionByPaymentId(paymentId: string): Promise<TransactionRecord | null> {
  try {
    const transactionQuery = query(
      collection(db, 'transactions'),
      where('paymentId', '==', paymentId),
      limit(1)
    );
    const snapshot = await getDocs(transactionQuery);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as TransactionRecord;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting transaction by payment ID:', error);
    return null;
  }
}
