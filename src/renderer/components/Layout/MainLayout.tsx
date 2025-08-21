import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { EmailAccount } from '@/shared/types';
import Sidebar from './Sidebar';
import Header from './Header';
import { useFolderContext } from '@/renderer/stores/FolderContext';

interface MainLayoutProps {
  accounts: EmailAccount[];
  loading: boolean;
  onRefreshEmails?: () => void;
  onToggleAI?: () => void;
  isAIOpen?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ accounts, loading, onRefreshEmails, onToggleAI, isAIOpen }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { setSelectedFolderId } = useFolderContext();

  const handleFolderSelect = (folderId: number) => {
    console.log('MainLayout: Folder selected:', folderId);
    setSelectedFolderId(folderId);
  };

  // Listen for account changes and reset folder selection if needed
  useEffect(() => {
    const handleAccountsChanged = (event: CustomEvent) => {
      console.log('MainLayout: Accounts changed event received:', event.detail);
      if (event.detail.action === 'deleted') {
        // Reset to default folder when account is deleted
        setSelectedFolderId(1); // Default to INBOX
        console.log('MainLayout: Account deleted, reset folder selection to INBOX');
      }
    };

    window.addEventListener('accountsChanged', handleAccountsChanged as EventListener);
    return () => {
      window.removeEventListener('accountsChanged', handleAccountsChanged as EventListener);
    };
  }, [setSelectedFolderId]);

  return (
    <div className="h-screen flex flex-col">
      <Header 
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        accounts={accounts}
        loading={loading}
        onRefreshEmails={onRefreshEmails}
        onToggleAI={onToggleAI}
        isAIOpen={isAIOpen}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onFolderSelect={handleFolderSelect}
        />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="animate-in fade-in duration-300 ease-out">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
