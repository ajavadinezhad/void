import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmailAccount } from '@/shared/types';
import { 
  Bars3Icon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  UserIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

interface HeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  accounts: EmailAccount[];
  loading: boolean;
  onRefreshEmails?: () => void;
  onSearch?: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarCollapsed, onToggleSidebar, accounts, loading, onRefreshEmails, onSearch }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [refreshStep, setRefreshStep] = useState('');
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

  // Get the current account (first account for now)
  const currentAccount = accounts[0];
  
  // Debug logging
  console.log('Header render - accounts:', accounts.length, 'currentAccount:', currentAccount?.email, 'loading:', loading, 'isRefreshing:', isRefreshing);

  // Force re-render when accounts change
  useEffect(() => {
    console.log('Header: Accounts changed, re-rendering');
    // Force a re-render by updating a state
  }, [accounts, loading]);

  // Listen for refresh progress and completion events
  useEffect(() => {
    const handleRefreshProgress = (event: CustomEvent) => {
      console.log('Header: Refresh progress event received:', event.detail);
      setRefreshProgress(event.detail.progress);
      setRefreshStep(event.detail.step);
    };

    const handleRefreshCompleted = (event: CustomEvent) => {
      console.log('Header: Refresh completed event received:', event.detail);
      if (event.detail.success) {
        setRefreshProgress(100);
        setRefreshStep('Refresh completed successfully!');
      } else {
        setRefreshStep(`Refresh failed: ${event.detail.error}`);
      }
    };

    window.addEventListener('refreshProgress', handleRefreshProgress as EventListener);
    window.addEventListener('refreshCompleted', handleRefreshCompleted as EventListener);
    return () => {
      window.removeEventListener('refreshProgress', handleRefreshProgress as EventListener);
      window.removeEventListener('refreshCompleted', handleRefreshCompleted as EventListener);
    };
  }, []);

  // Listen for auto-update events
  useEffect(() => {
    if (!window.electronAPI.onUpdateEvent) return;
    window.electronAPI.onUpdateEvent((payload: any) => {
      switch (payload?.type) {
        case 'checking':
          setUpdateStatus('Checking for updates…');
          break;
        case 'available':
          setUpdateStatus('Update available');
          break;
        case 'not-available':
          setUpdateStatus('Up to date');
          setTimeout(() => setUpdateStatus(null), 2000);
          break;
        case 'download-progress':
          setUpdateStatus(`Downloading… ${Math.round(payload.data?.percent || 0)}%`);
          break;
        case 'downloaded':
          setUpdateStatus('Update ready to install');
          break;
        case 'error':
          setUpdateStatus('Update check failed');
          setTimeout(() => setUpdateStatus(null), 3000);
          break;
      }
    });
  }, []);

  const handleCheckUpdates = async () => {
    try {
      setUpdateStatus('Checking for updates…');
      const res = await window.electronAPI.checkForUpdates?.();
      if (res && res.supported === false) {
        setUpdateStatus('Updates not configured');
        setTimeout(() => setUpdateStatus(null), 2500);
      }
      // Otherwise, events will update the status
    } catch (e) {
      setUpdateStatus('Update check failed');
      setTimeout(() => setUpdateStatus(null), 2500);
    }
  };

  // Generate initials from email
  const getInitials = (email: string) => {
    const parts = email.split('@')[0]; // Get part before @
    if (parts.length >= 2) {
      return parts.substring(0, 2).toUpperCase();
    }
    return parts.substring(0, 1).toUpperCase();
  };

  // Handle refresh with progress tracking
  const handleRefresh = async () => {
    if (!currentAccount || isRefreshing) return;
    
    setIsRefreshing(true);
    setRefreshProgress(0);
    setRefreshStep('Starting refresh...');
    
    try {
      // Simulate progress updates with more realistic timing
      const progressInterval = setInterval(() => {
        setRefreshProgress(prev => {
          // Simulate progress from 0 to 90% during the refresh
          if (prev >= 90) return prev;
          const increment = Math.max(1, Math.random() * 3);
          return Math.min(90, prev + increment);
        });
      }, 500);
      
      // Call the actual refresh function
      if (onRefreshEmails) {
        await onRefreshEmails();
      }
      
      // Clear the interval and complete
      clearInterval(progressInterval);
      setRefreshProgress(100);
      setRefreshStep('Refresh completed!');
      
      // Reset after a short delay
      setTimeout(() => {
        setIsRefreshing(false);
        setRefreshProgress(0);
        setRefreshStep('');
      }, 1500);
      
    } catch (error) {
      console.error('Refresh failed:', error);
      setRefreshStep('Refresh failed');
      setTimeout(() => {
        setIsRefreshing(false);
        setRefreshProgress(0);
        setRefreshStep('');
      }, 2000);
    }
  };

  return (
    <div>
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 py-2">
      {/* Left side */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleRefresh}
            disabled={!currentAccount || isRefreshing}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
            title="Sync & Refresh Emails"
          >
            <ArrowPathIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          
          <Link
            to="/settings"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Cog6ToothIcon className="h-5 w-5" />
          </Link>
          <button
            onClick={handleCheckUpdates}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ml-1 ${updateStatus ? 'animate-pulse' : ''}`}
            title={updateStatus ? updateStatus : 'Check for updates'}
          >
            <ArrowDownTrayIcon className={`h-5 w-5 ${updateStatus?.startsWith('Update') ? 'text-green-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Center - Search */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search emails..."
            className="input pl-10"
            onChange={(e) => onSearch?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSearch?.(e.currentTarget.value);
              }
            }}
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-2">
        {/* User Profile Indicator */}
        <Link
          to="/settings"
          className="block"
        >
          {currentAccount ? (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium hover:bg-blue-600 transition-colors cursor-pointer">
              <span>{getInitials(currentAccount.email)}</span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-medium hover:bg-gray-500 transition-colors cursor-pointer">
              <UserIcon className="h-4 w-4" />
            </div>
          )}
        </Link>
      </div>
      </header>
      
      {/* Progress Bar */}
      {isRefreshing && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="px-4 py-2">
            <div className="flex items-center justify-between text-sm text-blue-700 dark:text-blue-300 mb-1">
              <span>{refreshStep}</span>
              <span>{Math.round(refreshProgress)}%</span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${refreshProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
