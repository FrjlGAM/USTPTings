// Hook for calculating real-time sales and earnings data for admin dashboard
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import type { TransactionRecord } from '../lib/transactionService';

export interface SalesEarningsData {
  totalSales: number;
  totalEarnings: number;
  totalRevenue: number;
  weeklySales: number;
  weeklyEarnings: number;
  monthlySales: number;
  monthlyEarnings: number;
  transactionCount: number;
  loading: boolean;
  error: string | null;
}

/**
 * Real-time hook for sales and earnings data
 */
export function useSalesEarnings(): SalesEarningsData {
  const [data, setData] = useState<SalesEarningsData>({
    totalSales: 0,
    totalEarnings: 0,
    totalRevenue: 0,
    weeklySales: 0,
    weeklyEarnings: 0,
    monthlySales: 0,
    monthlyEarnings: 0,
    transactionCount: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const calculateMetrics = (transactions: TransactionRecord[]): Omit<SalesEarningsData, 'loading' | 'error'> => {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      let totalSales = 0;
      let totalEarnings = 0;
      let weeklySales = 0;
      let weeklyEarnings = 0;
      let monthlySales = 0;
      let monthlyEarnings = 0;

      // Only include completed transactions and filter out invalid data
      const completedTransactions = transactions.filter(tx => 
        tx.status === 'completed' && 
        tx.createdAt && 
        typeof tx.createdAt.toDate === 'function'
      );

      completedTransactions.forEach(tx => {
        const createdAt = tx.createdAt.toDate();
        // Ensure values are valid numbers, default to 0 if not
        const sales = Number(tx.totalAmount) || 0;
        const earnings = Number(tx.platformRevenue) || Number(tx.serviceFeeAmount) || 0; // Platform gets service fee

        // Only add valid numbers
        if (!isNaN(sales)) {
          totalSales += sales;
        }
        if (!isNaN(earnings)) {
          totalEarnings += earnings;
        }

        if (createdAt >= startOfWeek) {
          if (!isNaN(sales)) {
            weeklySales += sales;
          }
          if (!isNaN(earnings)) {
            weeklyEarnings += earnings;
          }
        }

        if (createdAt >= startOfMonth) {
          if (!isNaN(sales)) {
            monthlySales += sales;
          }
          if (!isNaN(earnings)) {
            monthlyEarnings += earnings;
          }
        }
      });

      return {
        totalSales,
        totalEarnings,
        totalRevenue: totalSales, // Total revenue includes all sales
        weeklySales,
        weeklyEarnings,
        monthlySales,
        monthlyEarnings,
        transactionCount: completedTransactions.length,
      };
    };

    // Set up real-time listener for transactions
    const transactionsQuery = query(
      collection(db, 'transactions'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      transactionsQuery,
      (snapshot) => {
        try {
          const transactions: TransactionRecord[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              // Ensure numeric fields are properly typed
              totalAmount: Number(data.totalAmount) || 0,
              platformRevenue: Number(data.platformRevenue) || Number(data.serviceFeeAmount) || 0,
              serviceFeeAmount: Number(data.serviceFeeAmount) || 0,
              quantity: Number(data.quantity) || 0,
            } as TransactionRecord;
          }).filter(tx => 
            // Filter out transactions with invalid data
            tx.createdAt && 
            typeof tx.totalAmount === 'number' && 
            !isNaN(tx.totalAmount)
          );

          const metrics = calculateMetrics(transactions);
          
          setData(prev => ({
            ...prev,
            ...metrics,
            loading: false,
            error: null,
          }));
        } catch (error) {
          console.error('Error processing transactions:', error);
          setData(prev => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to calculate metrics',
          }));
        }
      },
      (error) => {
        console.error('Error listening to transactions:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to fetch transactions',
        }));
      }
    );

    return () => unsubscribe();
  }, []);

  return data;
}

/**
 * Hook for getting recent transactions for admin dashboard
 */
export function useRecentTransactions(limitInput?: number) { // Changed signature: limit is now optional (limitInput)
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('status', '==', 'completed'), // Still fetches only 'completed' transactions
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      transactionsQuery,
      (snapshot) => {
        try {
          let docsToProcess = snapshot.docs;
          // If limitInput is provided and is a positive number, slice the results.
          // Otherwise, use all documents (all completed transactions).
          if (typeof limitInput === 'number' && limitInput > 0) {
            docsToProcess = docsToProcess.slice(0, limitInput);
          }

          const txData: TransactionRecord[] = docsToProcess.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              // Ensure numeric fields are properly typed
              totalAmount: Number(data.totalAmount) || 0,
              platformRevenue: Number(data.platformRevenue) || Number(data.serviceFeeAmount) || 0,
              serviceFeeAmount: Number(data.serviceFeeAmount) || 0,
              quantity: Number(data.quantity) || 0,
            } as TransactionRecord;
          }).filter(tx => 
            // Filter out transactions with invalid data
            tx.createdAt && 
            typeof tx.totalAmount === 'number' && 
            !isNaN(tx.totalAmount)
          );

          setTransactions(txData);
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error('Error processing recent transactions:', err);
          setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error listening to recent transactions:', err);
        setError(err.message || 'Failed to fetch transactions');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [limitInput]); // Depend on limitInput

  return { transactions, loading, error };
}
