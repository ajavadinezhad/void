import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmailAccount } from '@/shared/types';
import { useTheme } from '@/renderer/hooks/useTheme';
import { 
  Bars3Icon, 
  Cog6ToothIcon,
  ArrowPathIcon,
  UserIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

// GitHub icon component
const GitHubIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

interface HeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  accounts: EmailAccount[];
  loading: boolean;
  onRefreshEmails?: () => void;
  onToggleAI?: () => void;
  isAIOpen?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  sidebarCollapsed, 
  onToggleSidebar, 
  accounts, 
  loading, 
  onRefreshEmails, 
  onToggleAI, 
  isAIOpen 
}) => {
  const { theme, updateTheme } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [refreshStep, setRefreshStep] = useState('');
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState(false);

  const currentAccount = accounts[0];

  // Listen for refresh progress and completion events
  useEffect(() => {
    const handleRefreshProgress = (event: CustomEvent) => {
      setRefreshProgress(event.detail.progress);
      setRefreshStep(event.detail.step);
    };

    const handleRefreshCompleted = (event: CustomEvent) => {
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
    } catch (e) {
      setUpdateStatus('Update check failed');
      setTimeout(() => setUpdateStatus(null), 2500);
    }
  };

  // Generate initials from email
  const getInitials = (email: string) => {
    const parts = email.split('@')[0];
    if (parts.length >= 2) {
      return parts.substring(0, 2).toUpperCase();
    }
    return parts.substring(0, 1).toUpperCase();
  };

  // Handle refresh with progress tracking
  const handleRefresh = async () => {
    if (!currentAccount || isRefreshing) {
      return;
    }
    
    if (loading) {
      setRefreshStep('Waiting for account data...');
      return;
    }
    
    setIsRefreshing(true);
    setRefreshProgress(0);
    setRefreshStep('Starting refresh...');
    
    try {
      const progressInterval = setInterval(() => {
        setRefreshProgress(prev => {
          if (prev >= 90) return prev;
          const increment = Math.max(1, Math.random() * 3);
          return Math.min(90, prev + increment);
        });
      }, 500);
      
      if (onRefreshEmails) {
        await onRefreshEmails();
      }
      
      clearInterval(progressInterval);
      setRefreshProgress(100);
      setRefreshStep('Refresh completed!');
      
      setTimeout(() => {
        setIsRefreshing(false);
        setRefreshProgress(0);
        setRefreshStep('');
      }, 1500);
      
    } catch (error) {
      setRefreshStep('Refresh failed');
      setTimeout(() => {
        setIsRefreshing(false);
        setRefreshProgress(0);
        setRefreshStep('');
      }, 2000);
    }
  };

  const handleThemeToggle = () => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    updateTheme(nextTheme);
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
            {/* Core Email Actions */}
            <button 
              onClick={handleRefresh}
              disabled={!currentAccount || isRefreshing}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
              title="Sync & Refresh Emails"
            >
              <ArrowPathIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => setAutoSync(!autoSync)}
              className={`p-2 rounded-lg transition-colors ${
                autoSync 
                  ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={`Auto-sync: ${autoSync ? 'ON (5 min)' : 'OFF'}`}
            >
              <ClockIcon className="h-5 w-5" />
            </button>
            
            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
            
            {/* Smart Features */}
            <button
              onClick={onToggleAI}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                isAIOpen ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''
              }`}
              title="AI Assistant"
            >
              <SparklesIcon className="h-5 w-5" />
            </button>
            
            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
            
            {/* System & External */}
            <button
              onClick={handleCheckUpdates}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${updateStatus ? 'animate-pulse' : ''}`}
              title={updateStatus ? updateStatus : 'Check for updates'}
            >
              <ArrowDownTrayIcon className={`h-5 w-5 ${updateStatus?.startsWith('Update') ? 'text-green-500' : ''}`} />
            </button>
            
            <a
              href="https://github.com/your-username/void-email-client"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="View on GitHub"
            >
              <GitHubIcon className="h-6 w-6" />
            </a>
            
            {/* Theme Toggle */}
            <button
              onClick={handleThemeToggle}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={`Theme: ${theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System'}`}
            >
              {theme === 'light' && <SunIcon className="h-5 w-5" />}
              {theme === 'dark' && <MoonIcon className="h-5 w-5" />}
              {theme === 'system' && <ComputerDesktopIcon className="h-5 w-5" />}
            </button>
            
            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
            
            {/* Settings - Last Item */}
            <Link
              to="/settings"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Settings"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Center - Spacer */}
        <div className="flex-1" />

        {/* Right side */}
        <div className="flex items-center space-x-2">
          {/* User Profile Indicator */}
          <Link to="/settings" className="block">
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
