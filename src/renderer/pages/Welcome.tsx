import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccounts } from '@/renderer/hooks/useAccounts';
import { 
  EnvelopeIcon, 
  ShieldCheckIcon, 
  BoltIcon, 
  SparklesIcon 
} from '@heroicons/react/24/outline';

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const { addAccount } = useAccounts();
  const [isAddingAccount, setIsAddingAccount] = useState(false);

  const handleAddAccount = () => {
    // This should trigger the Add Account modal instead
    // The modal will be shown by the App component when no accounts exist
    console.log('Add account clicked - this should be handled by the app-level modal');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 animate-in fade-in duration-500 ease-out">
      <div className="max-w-4xl w-full animate-in slide-in-from-top duration-500 ease-out">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-6">
            <EnvelopeIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Void
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Your modern, secure email client
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="card p-6 animate-in slide-in-from-left duration-500 ease-out" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center mb-4">
              <ShieldCheckIcon className="h-8 w-8 text-green-600 mr-3" />
              <h3 className="text-lg font-semibold">Secure & Private</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Your emails stay on your device. No data mining, no tracking, complete privacy.
            </p>
          </div>

          <div className="card p-6 animate-in slide-in-from-right duration-500 ease-out" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center mb-4">
              <BoltIcon className="h-8 w-8 text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold">Lightning Fast</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Built with modern technologies for instant search and smooth performance.
            </p>
          </div>

          <div className="card p-6 animate-in slide-in-from-left duration-500 ease-out" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center mb-4">
              <SparklesIcon className="h-8 w-8 text-purple-600 mr-3" />
              <h3 className="text-lg font-semibold">AI Powered</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Smart features like writing assistance, summarization, and intelligent search.
            </p>
          </div>

          <div className="card p-6 animate-in slide-in-from-right duration-500 ease-out" style={{ animationDelay: '500ms' }}>
            <div className="flex items-center mb-4">
              <EnvelopeIcon className="h-8 w-8 text-indigo-600 mr-3" />
              <h3 className="text-lg font-semibold">All Your Accounts</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Support for Gmail, Outlook, Yahoo, and any IMAP/SMTP provider.
            </p>
          </div>
        </div>

        <div className="text-center animate-in slide-in-from-top duration-500 ease-out" style={{ animationDelay: '600ms' }}>
          <button
            onClick={handleAddAccount}
            disabled={isAddingAccount}
            className="btn btn-primary text-lg px-8 py-4 disabled:opacity-50"
          >
            {isAddingAccount ? 'Setting up...' : 'Get Started'}
          </button>
          
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Add your first email account to begin
          </p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
