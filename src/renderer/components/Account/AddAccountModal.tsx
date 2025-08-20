import React, { useState } from 'react';
import { 
  XMarkIcon, 
  EnvelopeIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountAdded: (account: any) => void;
  onDismiss?: () => void;
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose, onAccountAdded, onDismiss }) => {
  const [step, setStep] = useState<'provider' | 'oauth' | 'auth-code' | 'success'>('provider');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const providers = [
    {
      id: 'gmail',
      name: 'Gmail',
      icon: '📧',
      description: 'Connect your Gmail account'
    },
    {
      id: 'outlook',
      name: 'Outlook',
      icon: '📬',
      description: 'Connect your Outlook account'
    },
    {
      id: 'yahoo',
      name: 'Yahoo Mail',
      icon: '📭',
      description: 'Connect your Yahoo Mail account'
    }
  ];

  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId);
    setStep('oauth');
  };

  const handleOAuthLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      console.log('Starting OAuth process for provider:', selectedProvider);
      // Get OAuth URL from main process
      const authUrl = await window.electronAPI.getAuthUrl(selectedProvider);
      console.log('OAuth URL generated:', authUrl);
      
      // Open OAuth URL in default browser using Electron's shell
      await window.electronAPI.openExternal(authUrl);
      
      // Show instructions to the user
      setError('');
      setIsLoading(false);
      
      // Show authorization code input step
      setStep('auth-code');
      
    } catch (error) {
      console.error('OAuth error:', error);
      setError('Failed to start OAuth process. Please try again.');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (step === 'success') {
      onClose();
    } else if (step === 'provider') {
      // If we're on the initial provider selection step, close the modal completely
      onClose();
    } else {
      // If we're on oauth step, go back to provider selection
      setStep('provider');
      setSelectedProvider('');
      setError('');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">
            {step === 'provider' && 'Add Email Account'}
            {step === 'oauth' && `Connect ${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)}`}
            {step === 'auth-code' && 'Enter Authorization Code'}
            {step === 'success' && 'Account Added!'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'provider' && (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Choose your email provider to get started
              </p>
              
              <div className="space-y-3">
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => handleProviderSelect(provider.id)}
                    className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{provider.icon}</span>
                      <div>
                        <h3 className="font-medium">{provider.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{provider.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {onDismiss && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={onDismiss}
                    className="w-full btn btn-secondary"
                  >
                    Skip for now
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                    You can add an account later from the settings
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 'oauth' && (
            <div className="space-y-4">
              <div className="text-center">
                <EnvelopeIcon className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Connect your {selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} account
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  You'll be redirected to {selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} to authorize access to your email.
                </p>
              </div>

              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                  <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('provider')}
                  className="flex-1 btn btn-secondary"
                  disabled={isLoading}
                >
                  Back
                </button>
                <button
                  onClick={handleOAuthLogin}
                  disabled={isLoading}
                  className="flex-1 btn btn-primary flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <span>Continue</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'auth-code' && (
            <div className="space-y-4">
              <div className="text-center">
                <EnvelopeIcon className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Enter Authorization Code
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Copy the authorization code from the Google page and paste it below.
                </p>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="4/1AVMBsJivskZDP6iuplD02jyfJa0pR_9W4Wi4UDYkTn2sKb8aqNCTwgDYMP4"
                  className="w-full input"
                  id="auth-code-input"
                  autoFocus
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('oauth')}
                  className="flex-1 btn btn-secondary"
                >
                  Back
                </button>
                <button
                  onClick={async () => {
                    const authCodeInput = document.getElementById('auth-code-input') as HTMLInputElement;
                    const authCode = authCodeInput.value.trim();
                    if (authCode) {
                      setIsLoading(true);
                      try {
                        // Handle the OAuth callback with the authorization code
                        const result = await window.electronAPI.handleCallback(authCode, selectedProvider);
                        console.log('OAuth callback result:', result);
                        
                        // Create account data with the user's information from OAuth
                        const accountData = {
                          name: result.user.name || `${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} Account`,
                          email: result.user.email,
                          provider: selectedProvider,
                          oauthToken: result.accessToken,
                          oauthRefreshToken: result.refreshToken,
                          oauthExpiresIn: result.expiresIn,
                          // Add required fields for database
                          imapHost: '',
                          imapPort: 993,
                          smtpHost: '',
                          smtpPort: 587
                        };
                        
                        // Call the onAccountAdded callback with the account data
                        onAccountAdded(accountData);
                        
                        // Show success step
                        setStep('success');
                      } catch (error) {
                        console.error('OAuth callback error:', error);
                        setError('Failed to process authorization code. Please try again.');
                      } finally {
                        setIsLoading(false);
                      }
                    }
                  }}
                  disabled={isLoading}
                  className="flex-1 btn btn-primary flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Continue</span>
                  )}
                </button>
              </div>
            </div>
          )}



          {step === 'success' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckIcon className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium mb-2">Account Added Successfully!</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your {selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} account has been added to Void.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Note: This is a demo account. For full email functionality, complete the OAuth flow.
                </p>
              </div>

              <button
                onClick={handleClose}
                className="w-full btn btn-primary"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddAccountModal;
