import { useState, useEffect } from 'react';
import { EmailAccount } from '@/shared/types';

export function useAccounts() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const accountsData = await window.electronAPI.getAccounts();
      setAccounts(accountsData);
    } catch (err) {
      console.error('useAccounts: Error loading accounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const addAccount = async (account: Omit<EmailAccount, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newAccount = await window.electronAPI.addAccount(account);
      setAccounts(prev => [...prev, newAccount]);
      
      // Trigger a global refresh event to notify all components
      window.dispatchEvent(new CustomEvent('accountsChanged', { 
        detail: { action: 'added', account: newAccount } 
      }));
      
      return newAccount;
    } catch (err) {
      console.error('useAccounts: Error adding account:', err);
      setError(err instanceof Error ? err.message : 'Failed to add account');
      throw err;
    }
  };

  const updateAccount = async (account: EmailAccount) => {
    try {
      const updatedAccount = await window.electronAPI.updateAccount(account);
      setAccounts(prev => prev.map(acc => acc.id === account.id ? updatedAccount : acc));
      return updatedAccount;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update account');
      throw err;
    }
  };

  const deleteAccount = async (id: number) => {
    try {
      const success = await window.electronAPI.deleteAccount(id);
      if (success) {
        setAccounts(prev => prev.filter(acc => acc.id !== id));
        
        // Trigger a global refresh event to notify all components
        window.dispatchEvent(new CustomEvent('accountsChanged', { 
          detail: { action: 'deleted', accountId: id } 
        }));
      }
      return success;
    } catch (err) {
      console.error('useAccounts: Error deleting account:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      throw err;
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  return {
    accounts,
    loading,
    error,
    loadAccounts,
    addAccount,
    updateAccount,
    deleteAccount
  };
}
