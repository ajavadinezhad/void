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

  // Debug logging
  console.log('App render - showAddAccountModal:', showAddAccountModal, 'accounts:', accounts.length);



  // Apply theme to document
  React.useEffect(() => {
    console.log('Applying theme:', theme);
    document.documentElement.classList.remove('light', 'dark');
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      console.log('System theme detected:', systemTheme);
      document.documentElement.classList.add(systemTheme);
    } else {
      console.log('Applying specific theme:', theme);
      document.documentElement.classList.add(theme);
    }
    console.log('Current document classes:', document.documentElement.classList.toString());
  }, [theme]);

  // Show Add Account modal when no accounts are configured
  useEffect(() => {
    console.log('App useEffect - loading:', loading, 'accounts.length:', accounts.length, 'hasShownInitialModal:', hasShownInitialModal);
    if (!loading && accounts.length === 0 && !hasShownInitialModal) {
      console.log('Showing Add Account modal');
      setShowAddAccountModal(true);
      setHasShownInitialModal(true);
    }
    
    // Reset hasShownInitialModal when accounts are added back
    if (accounts.length > 0 && hasShownInitialModal) {
      console.log('Accounts available, resetting hasShownInitialModal');
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
    console.log('Dismissing Add Account modal');
    setShowAddAccountModal(false);
    setHasShownInitialModal(true);
  };

  const handleRefreshEmails = async () => {
    console.log('App: handleRefreshEmails called, accounts:', accounts.length);
    console.log('App: Accounts:', accounts);
    
    if (accounts.length > 0) {
      const currentAccount = accounts[0];
      console.log('App: Using current account:', currentAccount.id, currentAccount.email);
      
      try {
        console.log('App: Starting sync and refresh for account:', currentAccount.id, currentAccount.email);
        console.log('App: Account provider:', currentAccount.provider);
        console.log('App: Has OAuth token:', !!currentAccount.oauthToken);
        
        // Step 1: Refresh folders to get latest Gmail labels
        console.log('App: Step 1 - Calling refreshFolders...');
        window.dispatchEvent(new CustomEvent('refreshProgress', { 
          detail: { progress: 20, step: 'Refreshing folders...' } 
        }));
        await window.electronAPI.refreshFolders(currentAccount.id);
        console.log('App: Folder refresh completed successfully');
        
        // Step 2: Wait a moment for folder data to be processed
        console.log('App: Step 2 - Waiting for folder processing...');
        window.dispatchEvent(new CustomEvent('refreshProgress', { 
          detail: { progress: 40, step: 'Processing folders...' } 
        }));
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Step 3: Refresh sidebar folders to update UI
        console.log('App: Step 3 - Refreshing sidebar folders...');
        window.dispatchEvent(new CustomEvent('refreshProgress', { 
          detail: { progress: 60, step: 'Updating folder list...' } 
        }));
        if ((window as any).refreshSidebarFolders) {
          await (window as any).refreshSidebarFolders();
          console.log('App: Sidebar folders refreshed successfully');
        } else {
          console.log('App: refreshSidebarFolders function not found');
        }
        
        // Step 4: Sync all folders to get latest emails
        console.log('App: Step 4 - Calling syncAllFolders...');
        window.dispatchEvent(new CustomEvent('refreshProgress', { 
          detail: { progress: 80, step: 'Syncing emails...' } 
        }));
        await window.electronAPI.syncAllFolders(currentAccount.id);
        console.log('App: All folders sync completed successfully');
        
        // Step 5: Wait a moment for email data to be processed
        console.log('App: Step 5 - Waiting for email processing...');
        window.dispatchEvent(new CustomEvent('refreshProgress', { 
          detail: { progress: 90, step: 'Processing emails...' } 
        }));
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Step 6: Refresh the email list
        console.log('App: Step 6 - Calling refreshEmails...');
        window.dispatchEvent(new CustomEvent('refreshProgress', { 
          detail: { progress: 95, step: 'Updating email list...' } 
        }));
        await refreshEmails(currentAccount.id);
        console.log('App: Email refresh completed successfully');
        
        console.log('App: All refresh operations completed successfully!');
        
        // Trigger a global refresh event to notify all components
        window.dispatchEvent(new CustomEvent('refreshCompleted', { 
          detail: { success: true, accountId: currentAccount.id } 
        }));
        
      } catch (error) {
        console.error('App: Failed to sync and refresh emails:', error);
        console.error('App: Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        
        // Trigger a global refresh event to notify all components of failure
        window.dispatchEvent(new CustomEvent('refreshCompleted', { 
          detail: { success: false, error: error instanceof Error ? error.message : 'Unknown error' } 
        }));
      }
    } else {
      console.log('App: No accounts available to sync');
    }
  };

  const handleSearch = (query: string) => {
    console.log('App: Search query:', query);
    // Call the search function exposed by EmailView
    if ((window as any).handleEmailSearch) {
      (window as any).handleEmailSearch(query);
    } else {
      console.log('App: EmailView search function not available yet');
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
              onSearch={handleSearch}
              onToggleAI={() => setIsAIOpen(!isAIOpen)}
              isAIOpen={isAIOpen}
            />
          }>
            <Route index element={<EmailView isAIOpen={isAIOpen} onToggleAI={() => setIsAIOpen(!isAIOpen)} />} />
            <Route path="settings" element={<Settings />} />
          </Route>
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
