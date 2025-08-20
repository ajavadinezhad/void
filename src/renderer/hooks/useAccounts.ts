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
      console.log('useAccounts: Loading accounts... (instance:', Math.random().toString(36).substr(2, 9) + ')');
      const accountsData = await window.electronAPI.getAccounts();
      console.log('useAccounts: Loaded accounts:', accountsData);
      setAccounts(accountsData);
    } catch (err) {
      console.error('useAccounts: Error loading accounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
    } finally {
      setLoading(false);
      console.log('useAccounts: Loading finished');
    }
  };

  const addAccount = async (account: Omit<EmailAccount, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('useAccounts: Adding account:', account);
      const newAccount = await window.electronAPI.addAccount(account);
      console.log('useAccounts: New account returned:', newAccount);
      setAccounts(prev => {
        const updated = [...prev, newAccount];
        console.log('useAccounts: Updated accounts list:', updated);
        return updated;
      });
      
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
      console.log('useAccounts: Deleting account with ID:', id);
      const success = await window.electronAPI.deleteAccount(id);
      console.log('useAccounts: Delete result:', success);
      if (success) {
        setAccounts(prev => {
          const filtered = prev.filter(acc => acc.id !== id);
          console.log('useAccounts: Updated accounts list:', filtered);
          return filtered;
        });
        
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
