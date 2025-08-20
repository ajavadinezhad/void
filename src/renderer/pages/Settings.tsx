import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/renderer/hooks/useTheme';
import { useAccounts } from '@/renderer/hooks/useAccounts';
import { EmailAccount } from '@/shared/types';
import { 
  Cog6ToothIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  BellIcon,
  SpeakerWaveIcon,
  SparklesIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import AddAccountModal from '@/renderer/components/Account/AddAccountModal';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { theme, updateTheme } = useTheme();
  const { accounts, addAccount, deleteAccount, loadAccounts } = useAccounts();
  console.log('Settings page - current theme:', theme);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<EmailAccount | null>(null);
  const [highlightAccounts, setHighlightAccounts] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const appSettings = await window.electronAPI.getSettings();
        setSettings(appSettings);
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Remove highlight after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setHighlightAccounts(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleSettingChange = async (key: string, value: any) => {
    try {
      const updatedSettings = await window.electronAPI.updateSettings({ [key]: value });
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  };

  const handleAIFeatureChange = async (feature: string, enabled: boolean) => {
    try {
      const currentFeatures = settings?.aiFeatures || {};
      const updatedFeatures = { ...currentFeatures, [feature]: enabled };
      const updatedSettings = await window.electronAPI.updateSettings({ 
        aiFeatures: updatedFeatures 
      });
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update AI feature:', error);
    }
  };

  const handleAccountAdded = async (accountData: any) => {
    try {
      console.log('Settings: handleAccountAdded called with:', accountData);
      const newAccount = await addAccount(accountData);
      console.log('Settings: Account added successfully:', newAccount);
      setShowAddAccountModal(false);
      
      // Force reload accounts to ensure all components get updated
      await loadAccounts();
    } catch (error) {
      console.error('Settings: Failed to add account:', error);
    }
  };

  const handleDeleteAccount = async (accountId: number) => {
    try {
      console.log('Deleting account with ID:', accountId);
      await deleteAccount(accountId);
      console.log('Account deleted successfully');
      setShowDeleteConfirm(false);
      setAccountToDelete(null);
      
      // Force reload accounts to ensure all components get updated
      await loadAccounts();
      
      // If this was the last account, redirect to welcome page
      if (accounts.length <= 1) {
        console.log('Last account deleted, redirecting to welcome page');
        navigate('/');
        // Force a page reload to reset all components
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  const confirmDeleteAccount = (account: EmailAccount) => {
    setAccountToDelete(account);
    setShowDeleteConfirm(true);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Back to Inbox</span>
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Customize your Voida experience
        </p>
      </div>

      <div className="space-y-8">
        {/* Accounts */}
        <div className={`card p-6 ${
          highlightAccounts 
            ? 'border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 animate-pulse' 
            : ''
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <EnvelopeIcon className="h-6 w-6 text-blue-500 mr-3" />
              <h2 className="text-lg font-semibold">Email Accounts</h2>
            </div>
            <button
              onClick={() => setShowAddAccountModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add Account</span>
            </button>
          </div>
          
          <div className="space-y-3">
            {accounts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <EnvelopeIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No email accounts configured</p>
                <p className="text-sm">Add your first account to get started</p>
              </div>
            ) : (
              accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <EnvelopeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium">{account.email}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{account.provider}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => confirmDeleteAccount(account)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete account"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Appearance */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <SunIcon className="h-6 w-6 text-yellow-500 mr-3" />
            <h2 className="text-lg font-semibold">Appearance</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Theme</label>
              <div className="flex space-x-2">
                {[
                  { value: 'light', icon: SunIcon, label: 'Light' },
                  { value: 'dark', icon: MoonIcon, label: 'Dark' },
                  { value: 'system', icon: ComputerDesktopIcon, label: 'System' }
                ].map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => updateTheme(value as any)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                      theme === value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <BellIcon className="h-6 w-6 text-blue-500 mr-3" />
            <h2 className="text-lg font-semibold">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Email notifications</label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Show notifications for new emails
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings?.notifications || false}
                  onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Sound notifications</label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Play sound for new emails
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings?.soundEnabled || false}
                  onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* AI Features */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <SparklesIcon className="h-6 w-6 text-purple-500 mr-3" />
            <h2 className="text-lg font-semibold">AI Features</h2>
          </div>
          
          <div className="space-y-4">
            {[
              { key: 'writingEnabled', label: 'Writing assistance', description: 'AI-powered email composition help' },
              { key: 'searchEnabled', label: 'AI search', description: 'Intelligent email search and Q&A' },
              { key: 'summarizationEnabled', label: 'Email summarization', description: 'Auto-summarize long email threads' },
              { key: 'privacyRedactionEnabled', label: 'Privacy redaction', description: 'Automatically redact sensitive information' }
            ].map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">{label}</label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {description}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings?.aiFeatures?.[key] || false}
                    onChange={(e) => handleAIFeatureChange(key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Sync Settings */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <Cog6ToothIcon className="h-6 w-6 text-green-500 mr-3" />
            <h2 className="text-lg font-semibold">Sync Settings</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Auto-sync</label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Automatically sync emails in the background
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings?.autoSync || false}
                  onChange={(e) => handleSettingChange('autoSync', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Sync interval (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={settings?.syncInterval || 5}
                onChange={(e) => handleSettingChange('syncInterval', parseInt(e.target.value))}
                className="input w-32"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={showAddAccountModal}
        onClose={() => setShowAddAccountModal(false)}
        onAccountAdded={handleAccountAdded}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && accountToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3" />
                <h3 className="text-lg font-semibold">Delete Account</h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete the account <strong>{accountToDelete.email}</strong>? 
                This will permanently remove:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 mb-6 space-y-1">
                <li>• All email messages and folders</li>
                <li>• All attachments and cached data</li>
                <li>• Account settings and OAuth tokens</li>
                <li>• All search history and preferences</li>
              </ul>
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                This action cannot be undone.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setAccountToDelete(null);
                  }}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteAccount(accountToDelete.id)}
                  className="flex-1 btn bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
