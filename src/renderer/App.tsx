import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTheme } from '@/renderer/hooks/useTheme';
import { useAccounts } from '@/renderer/hooks/useAccounts';
import { useEmails } from '@/renderer/hooks/useEmails';
import MainLayout from '@/renderer/components/Layout/MainLayout';
import EmailView from '@/renderer/pages/EmailView';
import Settings from '@/renderer/pages/Settings';
import Welcome from '@/renderer/pages/Welcome';
import AddAccountModal from '@/renderer/components/Account/AddAccountModal';
import { FolderProvider } from '@/renderer/stores/FolderContext';

function App() {
  const { theme } = useTheme();
  const { accounts, loading, addAccount } = useAccounts();
  const { refreshEmails } = useEmails();
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [hasShownInitialModal, setHasShownInitialModal] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);

  // Apply theme to document
  React.useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.classList.add(systemTheme);
    } else {
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  // Show Add Account modal when no accounts are configured
  useEffect(() => {
    if (!loading && accounts.length === 0 && !hasShownInitialModal) {
      setShowAddAccountModal(true);
      setHasShownInitialModal(true);
    }
    
    // Reset hasShownInitialModal when accounts are added back
    if (accounts.length > 0 && hasShownInitialModal) {
      setHasShownInitialModal(false);
    }
  }, [loading, accounts.length, hasShownInitialModal]);

  const handleAccountAdded = async (accountData: any) => {
    try {
      await addAccount(accountData);
      setShowAddAccountModal(false);
    } catch (error) {
      console.error('Failed to add account:', error);
    }
  };

  const handleDismissModal = () => {
    setShowAddAccountModal(false);
    setHasShownInitialModal(true);
  };

  const handleRefreshEmails = async () => {
    if (accounts.length === 0) return;
    
    const currentAccount = accounts[0];
    
    try {
      // Step 1: Refresh folders to get latest Gmail labels
      window.dispatchEvent(new CustomEvent('refreshProgress', { 
        detail: { progress: 20, step: 'Refreshing folders...' } 
      }));
      await window.electronAPI.refreshFolders(currentAccount.id);
      
      // Step 2: Wait a moment for folder data to be processed
      window.dispatchEvent(new CustomEvent('refreshProgress', { 
        detail: { progress: 40, step: 'Processing folders...' } 
      }));
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 3: Refresh sidebar folders to update UI
      window.dispatchEvent(new CustomEvent('refreshProgress', { 
        detail: { progress: 60, step: 'Updating folder list...' } 
      }));
      if ((window as any).refreshSidebarFolders) {
        await (window as any).refreshSidebarFolders();
      }
      
      // Step 4: Sync all folders to get latest emails
      window.dispatchEvent(new CustomEvent('refreshProgress', { 
        detail: { progress: 80, step: 'Syncing emails...' } 
      }));
      await window.electronAPI.syncAllFolders(currentAccount.id);
      
      // Step 5: Wait a moment for email data to be processed
      window.dispatchEvent(new CustomEvent('refreshProgress', { 
        detail: { progress: 90, step: 'Processing emails...' } 
      }));
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 6: Refresh the email list
      window.dispatchEvent(new CustomEvent('refreshProgress', { 
        detail: { progress: 95, step: 'Updating email list...' } 
      }));
      await refreshEmails(currentAccount.id);
      
      // Trigger a global refresh event to notify all components
      window.dispatchEvent(new CustomEvent('refreshCompleted', { 
        detail: { success: true, accountId: currentAccount.id } 
      }));
      
    } catch (error) {
      console.error('Failed to sync and refresh emails:', error);
      
      // Trigger a global refresh event to notify all components of failure
      window.dispatchEvent(new CustomEvent('refreshCompleted', { 
        detail: { success: false, error: error instanceof Error ? error.message : 'Unknown error' } 
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <FolderProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Routes>
          <Route path="/" element={
            <MainLayout 
              accounts={accounts} 
              loading={loading} 
              onRefreshEmails={handleRefreshEmails} 
              onToggleAI={() => setIsAIOpen(!isAIOpen)}
              isAIOpen={isAIOpen}
            />
          }>
            <Route index element={
              <div className="animate-in fade-in duration-300 ease-out">
                <EmailView isAIOpen={isAIOpen} onToggleAI={() => setIsAIOpen(!isAIOpen)} />
              </div>
            } />
            <Route path="settings" element={
              <div className="animate-in slide-in-from-right duration-300 ease-out">
                <Settings />
              </div>
            } />
          </Route>
          <Route path="/welcome" element={
            <div className="animate-in fade-in duration-500 ease-out">
              <Welcome />
            </div>
          } />
        </Routes>

        {/* Add Account Modal */}
        <AddAccountModal
          isOpen={showAddAccountModal}
          onClose={() => setShowAddAccountModal(false)}
          onAccountAdded={handleAccountAdded}
          onDismiss={handleDismissModal}
        />
      </div>
    </FolderProvider>
  );
}

export default App;
