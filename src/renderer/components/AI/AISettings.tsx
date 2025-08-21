import React, { useState, useEffect } from 'react';
import { 
  SparklesIcon, 
  KeyIcon, 
  EyeIcon, 
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface AISettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const AISettings: React.FC<AISettingsProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState({
    openai: { apiKey: '', model: 'gpt-4' },
    claude: { apiKey: '', model: 'claude-3-sonnet-20240229' }
  });
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const currentConfig = await window.electronAPI.getAIConfig();
      setConfig(currentConfig);
    } catch (error) {
      console.error('Failed to load AI config:', error);
      setMessage({ type: 'error', text: 'Failed to load configuration' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await window.electronAPI.updateAIConfig(config);
      setMessage({ type: 'success', text: 'Configuration saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save AI config:', error);
      setMessage({ type: 'error', text: 'Failed to save configuration' });
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async (provider: 'openai' | 'claude') => {
    try {
      setIsLoading(true);
      const testMessage = {
        message: 'Hello, this is a test message.',
        context: 'Test context',
        model: provider,
        emails: []
      };
      
      await window.electronAPI.sendAIMessage(testMessage);
      setMessage({ type: 'success', text: `${provider.toUpperCase()} connection successful!` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error(`${provider} connection test failed:`, error);
      setMessage({ type: 'error', text: `${provider.toUpperCase()} connection failed. Check your API key.` });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-300 ease-out">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in scale-in duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <SparklesIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI Assistant Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Message */}
          {message && (
            <div className={`flex items-center space-x-2 p-3 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
            }`}>
              {message.type === 'success' ? (
                <CheckCircleIcon className="h-5 w-5" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* OpenAI Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">OpenAI Configuration</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showOpenAIKey ? 'text' : 'password'}
                    value={config.openai.apiKey}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      openai: { ...prev.openai, apiKey: e.target.value }
                    }))}
                    placeholder="sk-..."
                    className="input pr-10 w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showOpenAIKey ? (
                      <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Model
                </label>
                <select
                  value={config.openai.model}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    openai: { ...prev.openai, model: e.target.value }
                  }))}
                  className="input w-full"
                >
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>

              <button
                onClick={() => testConnection('openai')}
                disabled={!config.openai.apiKey || isLoading}
                className="btn btn-secondary"
              >
                Test Connection
              </button>
            </div>
          </div>

          {/* Claude Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Claude Configuration</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showClaudeKey ? 'text' : 'password'}
                    value={config.claude.apiKey}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      claude: { ...prev.claude, apiKey: e.target.value }
                    }))}
                    placeholder="sk-ant-..."
                    className="input pr-10 w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setShowClaudeKey(!showClaudeKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showClaudeKey ? (
                      <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Model
                </label>
                <select
                  value={config.claude.model}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    claude: { ...prev.claude, model: e.target.value }
                  }))}
                  className="input w-full"
                >
                  <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                  <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                  <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                </select>
              </div>

              <button
                onClick={() => testConnection('claude')}
                disabled={!config.claude.apiKey || isLoading}
                className="btn btn-secondary"
              >
                Test Connection
              </button>
            </div>
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">How to get API keys:</h4>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <p><strong>OpenAI:</strong> Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com</a> and create an API key</p>
              <p><strong>Claude:</strong> Visit <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="underline">console.anthropic.com</a> and create an API key</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary"
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AISettings;
