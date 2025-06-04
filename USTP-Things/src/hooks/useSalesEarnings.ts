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

      // Only include completed transactions
      const completedTransactions = transactions.filter(tx => tx.status === 'completed');

      completedTransactions.forEach(tx => {
        const createdAt = tx.createdAt.toDate();
        const sales = tx.totalAmount;
        const earnings = tx.platformRevenue; // Platform gets service fee

        totalSales += sales;
        totalEarnings += earnings;

        if (createdAt >= startOfWeek) {
          weeklySales += sales;
          weeklyEarnings += earnings;
        }

        if (createdAt >= startOfMonth) {
          monthlySales += sales;
          monthlyEarnings += earnings;
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
          const transactions: TransactionRecord[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as TransactionRecord));

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

          const txData: TransactionRecord[] = docsToProcess.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as TransactionRecord));

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
