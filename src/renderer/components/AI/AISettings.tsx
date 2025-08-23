import React, { useState, useEffect } from 'react';
import { 
  SparklesIcon, 
  KeyIcon, 
  EyeIcon, 
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface AISettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const AISettings: React.FC<AISettingsProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState({
    openai: {
      apiKey: '',
      model: 'gpt-5'
    },
    claude: {
      apiKey: '',
      model: 'claude-3-sonnet-20240229'
    },
    ollama: {
      baseUrl: 'http://localhost:11434',
      model: 'llama3.2'
    },
    huggingface: {
      apiKey: '',
      model: 'microsoft/DialoGPT-medium'
    },
    cohere: {
      apiKey: '',
      model: 'command'
    },
    groq: {
      apiKey: '',
      model: 'llama3-8b-8192'
    },
    together: {
      apiKey: '',
      model: 'togethercomputer/llama-3.1-8b-instruct'
    }
  });
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [showHuggingFaceKey, setShowHuggingFaceKey] = useState(false);
  const [showCohereKey, setShowCohereKey] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [showTogetherKey, setShowTogetherKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      setMessage(null);
      const currentConfig = await window.electronAPI.getAIConfig();
      
      // Ensure all properties are present with defaults
      setConfig({
        openai: {
          apiKey: currentConfig.openai?.apiKey || '',
          model: currentConfig.openai?.model || 'gpt-5'
        },
        claude: {
          apiKey: currentConfig.claude?.apiKey || '',
          model: currentConfig.claude?.model || 'claude-3-sonnet-20240229'
        },
        ollama: {
          baseUrl: currentConfig.ollama?.baseUrl || 'http://localhost:11434',
          model: currentConfig.ollama?.model || 'llama3.2'
        },
        huggingface: {
          apiKey: currentConfig.huggingface?.apiKey || '',
          model: currentConfig.huggingface?.model || 'microsoft/DialoGPT-medium'
        },
        cohere: {
          apiKey: currentConfig.cohere?.apiKey || '',
          model: currentConfig.cohere?.model || 'command'
        },
        groq: {
          apiKey: currentConfig.groq?.apiKey || '',
          model: currentConfig.groq?.model || 'llama3-8b-8192'
        },
        together: {
          apiKey: currentConfig.together?.apiKey || '',
          model: currentConfig.together?.model || 'togethercomputer/llama-3.1-8b-instruct'
        }
      });
    } catch (error) {
      console.error('Failed to load AI config:', error);
      setMessage({ type: 'error', text: 'Failed to load configuration' });
    } finally {
      setIsLoading(false);
    }
  };

  const validateConfig = () => {
    const errors: { [key: string]: string } = {};
    
    console.log('AISettings: Validating config:', {
      openaiKey: config.openai.apiKey,
      openaiKeyStartsWith: config.openai.apiKey.startsWith('sk-'),
      claudeKey: config.claude.apiKey,
      claudeKeyStartsWith: config.claude.apiKey.startsWith('sk-ant-'),
      huggingfaceKey: config.huggingface.apiKey,
      cohereKey: config.cohere.apiKey,
      groqKey: config.groq.apiKey,
      togetherKey: config.together.apiKey
    });
    
    // Validate OpenAI config
    if (config.openai.apiKey.trim()) {
      if (!config.openai.apiKey.startsWith('sk-')) {
        errors.openaiKey = 'OpenAI API key should start with "sk-"';
      }
    }
    
    // Validate Claude config
    if (config.claude.apiKey.trim()) {
      if (!config.claude.apiKey.startsWith('sk-ant-')) {
        errors.claudeKey = 'Claude API key should start with "sk-ant-"';
      }
    }
    
    // Validate Hugging Face config (optional - can be empty)
    if (config.huggingface.apiKey.trim()) {
      if (config.huggingface.apiKey.length < 10) {
        errors.huggingfaceKey = 'Hugging Face API key seems too short';
      }
    }
    
    // Validate Cohere config (optional - can be empty)
    if (config.cohere.apiKey.trim()) {
      if (config.cohere.apiKey.length < 10) {
        errors.cohereKey = 'Cohere API key seems too short';
      }
    }
    
    // Validate Groq config (optional - can be empty)
    if (config.groq.apiKey.trim()) {
      if (config.groq.apiKey.length < 10) {
        errors.groqKey = 'Groq API key seems too short';
      }
    }
    
    // Validate Together AI config (optional - can be empty)
    if (config.together.apiKey.trim()) {
      if (config.together.apiKey.length < 10) {
        errors.togetherKey = 'Together AI API key seems too short';
      }
    }
    
    console.log('AISettings: Validation errors:', errors);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    console.log('AISettings: Attempting to save config:', config);
    
    if (!validateConfig()) {
      console.log('AISettings: Validation failed');
      setMessage({ type: 'error', text: 'Please fix validation errors before saving' });
      return;
    }

    try {
      setIsSaving(true);
      setMessage(null);
      console.log('AISettings: Calling updateAIConfig with:', config);
      await window.electronAPI.updateAIConfig(config);
      console.log('AISettings: Config saved successfully');
      setMessage({ type: 'success', text: 'Configuration saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('AISettings: Failed to save AI config:', error);
      setMessage({ type: 'error', text: 'Failed to save configuration' });
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async (provider: 'openai' | 'claude' | 'ollama' | 'huggingface' | 'cohere' | 'groq' | 'together') => {
    if (!validateConfig()) {
      setMessage({ type: 'error', text: 'Please fix validation errors before testing' });
      return;
    }

    // Check if provider has required configuration
    let hasConfig = false;
    switch (provider) {
      case 'openai':
        hasConfig = !!config.openai.apiKey.trim();
        break;
      case 'claude':
        hasConfig = !!config.claude.apiKey.trim();
        break;
      case 'ollama':
        hasConfig = !!config.ollama.baseUrl.trim();
        break;
      case 'huggingface':
        hasConfig = !!config.huggingface.apiKey.trim();
        break;
      case 'cohere':
        hasConfig = !!config.cohere.apiKey.trim();
        break;
      case 'groq':
        hasConfig = !!config.groq.apiKey.trim();
        break;
      case 'together':
        hasConfig = !!config.together.apiKey.trim();
        break;
    }

    if (!hasConfig) {
      setMessage({ type: 'error', text: `Please configure ${provider.toUpperCase()} settings first` });
      return;
    }

    try {
      setIsTesting(provider);
      setMessage(null);
      
      // Save config first
      console.log('AISettings: Calling updateAIConfig with:', config);
      await window.electronAPI.updateAIConfig(config);
      console.log('AISettings: Config saved successfully');
      
      const testMessage = {
        message: 'Hello, this is a test message to verify the connection.',
        context: 'Test context for connection verification',
        model: provider,
        emails: []
      };
      
      await window.electronAPI.sendAIMessage(testMessage);
      setMessage({ type: 'success', text: `${provider.toUpperCase()} connection successful!` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error(`${provider} connection test failed:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage({ type: 'error', text: `${provider.toUpperCase()} connection failed: ${errorMessage}` });
    } finally {
      setIsTesting(null);
    }
  };

  const clearConfig = (provider: 'openai' | 'claude') => {
    setConfig(prev => ({
      ...prev,
      [provider]: { ...prev[provider], apiKey: '' }
    }));
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${provider}Key`];
      return newErrors;
    });
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
                : message.type === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
            }`}>
              {message.type === 'success' ? (
                <CheckCircleIcon className="h-5 w-5" />
              ) : message.type === 'error' ? (
                <ExclamationTriangleIcon className="h-5 w-5" />
              ) : (
                <InformationCircleIcon className="h-5 w-5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* OpenAI Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">OpenAI Configuration</h3>
              <button
                onClick={() => clearConfig('openai')}
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Clear
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showOpenAIKey ? 'text' : 'password'}
                    value={config.openai.apiKey}
                    onChange={(e) => {
                      setConfig(prev => ({
                      ...prev,
                      openai: { ...prev.openai, apiKey: e.target.value }
                      }));
                      // Clear validation error when user types
                      if (validationErrors.openaiKey) {
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.openaiKey;
                          return newErrors;
                        });
                      }
                    }}
                    placeholder="sk-..."
                    className={`input pr-20 w-full ${
                      validationErrors.openaiKey ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
                  <button
                    type="button"
                    onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    {showOpenAIKey ? (
                      <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                </div>
                {validationErrors.openaiKey && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{validationErrors.openaiKey}</p>
                )}
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
                  <option value="gpt-5">GPT-5</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>

              <button
                onClick={() => testConnection('openai')}
                disabled={!config.openai.apiKey.trim() || isLoading || isTesting === 'openai'}
                className="btn btn-secondary flex items-center space-x-2"
              >
                {isTesting === 'openai' ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>Test Connection</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Claude Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Claude Configuration</h3>
              <button
                onClick={() => clearConfig('claude')}
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Clear
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showClaudeKey ? 'text' : 'password'}
                    value={config.claude.apiKey}
                    onChange={(e) => {
                      setConfig(prev => ({
                      ...prev,
                      claude: { ...prev.claude, apiKey: e.target.value }
                      }));
                      // Clear validation error when user types
                      if (validationErrors.claudeKey) {
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.claudeKey;
                          return newErrors;
                        });
                      }
                    }}
                    placeholder="sk-ant-..."
                    className={`input pr-20 w-full ${
                      validationErrors.claudeKey ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
                  <button
                    type="button"
                    onClick={() => setShowClaudeKey(!showClaudeKey)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    {showClaudeKey ? (
                      <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                </div>
                {validationErrors.claudeKey && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{validationErrors.claudeKey}</p>
                )}
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
                disabled={!config.claude.apiKey.trim() || isLoading || isTesting === 'claude'}
                className="btn btn-secondary flex items-center space-x-2"
              >
                {isTesting === 'claude' ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>Test Connection</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Ollama Configuration (Local) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Ollama (Local)</h3>
              <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">FREE</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Base URL
                </label>
                <input
                  type="text"
                  value={config.ollama.baseUrl}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    ollama: { ...prev.ollama, baseUrl: e.target.value }
                  }))}
                  placeholder="http://localhost:11434"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Model
                </label>
                <select
                  value={config.ollama.model}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    ollama: { ...prev.ollama, model: e.target.value }
                  }))}
                  className="input w-full"
                >
                  <option value="llama3.2">Llama 3.2</option>
                  <option value="llama3.1">Llama 3.1</option>
                  <option value="mistral">Mistral</option>
                  <option value="codellama">Code Llama</option>
                </select>
              </div>

              <button
                onClick={() => testConnection('ollama')}
                disabled={!config.ollama.baseUrl.trim() || isLoading || isTesting === 'ollama'}
                className="btn btn-secondary flex items-center space-x-2"
              >
                {isTesting === 'ollama' ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>Test Connection</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Hugging Face Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Hugging Face</h3>
              <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">FREE</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showHuggingFaceKey ? 'text' : 'password'}
                    value={config.huggingface.apiKey}
                    onChange={(e) => {
                      setConfig(prev => ({
                        ...prev,
                        huggingface: { ...prev.huggingface, apiKey: e.target.value }
                      }));
                      if (validationErrors.huggingfaceKey) {
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.huggingfaceKey;
                          return newErrors;
                        });
                      }
                    }}
                    placeholder="hf_..."
                    className={`input pr-20 w-full ${
                      validationErrors.huggingfaceKey ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
                    <button
                      type="button"
                      onClick={() => setShowHuggingFaceKey(!showHuggingFaceKey)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      {showHuggingFaceKey ? (
                        <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                {validationErrors.huggingfaceKey && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{validationErrors.huggingfaceKey}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Model
                </label>
                <select
                  value={config.huggingface.model}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    huggingface: { ...prev.huggingface, model: e.target.value }
                  }))}
                  className="input w-full"
                >
                  <option value="microsoft/DialoGPT-medium">DialoGPT Medium</option>
                  <option value="gpt2">GPT-2</option>
                  <option value="distilgpt2">DistilGPT-2</option>
                </select>
              </div>

              <button
                onClick={() => testConnection('huggingface')}
                disabled={!config.huggingface.apiKey.trim() || isLoading || isTesting === 'huggingface'}
                className="btn btn-secondary flex items-center space-x-2"
              >
                {isTesting === 'huggingface' ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>Test Connection</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Cohere Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Cohere</h3>
              <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">FREE</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showCohereKey ? 'text' : 'password'}
                    value={config.cohere.apiKey}
                    onChange={(e) => {
                      setConfig(prev => ({
                        ...prev,
                        cohere: { ...prev.cohere, apiKey: e.target.value }
                      }));
                      if (validationErrors.cohereKey) {
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.cohereKey;
                          return newErrors;
                        });
                      }
                    }}
                    placeholder="..."
                    className={`input pr-20 w-full ${
                      validationErrors.cohereKey ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
                    <button
                      type="button"
                      onClick={() => setShowCohereKey(!showCohereKey)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      {showCohereKey ? (
                        <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                {validationErrors.cohereKey && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{validationErrors.cohereKey}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Model
                </label>
                <select
                  value={config.cohere.model}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    cohere: { ...prev.cohere, model: e.target.value }
                  }))}
                  className="input w-full"
                >
                  <option value="command">Command</option>
                  <option value="command-light">Command Light</option>
                </select>
              </div>

              <button
                onClick={() => testConnection('cohere')}
                disabled={!config.cohere.apiKey.trim() || isLoading || isTesting === 'cohere'}
                className="btn btn-secondary flex items-center space-x-2"
              >
                {isTesting === 'cohere' ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>Test Connection</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Groq Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Groq</h3>
              <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">FREE</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showGroqKey ? 'text' : 'password'}
                    value={config.groq.apiKey}
                    onChange={(e) => {
                      setConfig(prev => ({
                        ...prev,
                        groq: { ...prev.groq, apiKey: e.target.value }
                      }));
                      if (validationErrors.groqKey) {
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.groqKey;
                          return newErrors;
                        });
                      }
                    }}
                    placeholder="gsk_..."
                    className={`input pr-20 w-full ${
                      validationErrors.groqKey ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
                    <button
                      type="button"
                      onClick={() => setShowGroqKey(!showGroqKey)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      {showGroqKey ? (
                        <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                {validationErrors.groqKey && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{validationErrors.groqKey}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Model
                </label>
                <select
                  value={config.groq.model}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    groq: { ...prev.groq, model: e.target.value }
                  }))}
                  className="input w-full"
                >
                  <option value="llama3-8b-8192">Llama 3 8B</option>
                  <option value="llama3-70b-8192">Llama 3 70B</option>
                  <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                </select>
              </div>

              <button
                onClick={() => testConnection('groq')}
                disabled={!config.groq.apiKey.trim() || isLoading || isTesting === 'groq'}
                className="btn btn-secondary flex items-center space-x-2"
              >
                {isTesting === 'groq' ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>Test Connection</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Together AI Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Together AI</h3>
              <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded">FREE</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showTogetherKey ? 'text' : 'password'}
                    value={config.together.apiKey}
                    onChange={(e) => {
                      setConfig(prev => ({
                        ...prev,
                        together: { ...prev.together, apiKey: e.target.value }
                      }));
                      if (validationErrors.togetherKey) {
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.togetherKey;
                          return newErrors;
                        });
                      }
                    }}
                    placeholder="..."
                    className={`input pr-20 w-full ${
                      validationErrors.togetherKey ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
                    <button
                      type="button"
                      onClick={() => setShowTogetherKey(!showTogetherKey)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      {showTogetherKey ? (
                        <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                {validationErrors.togetherKey && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{validationErrors.togetherKey}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Model
                </label>
                <select
                  value={config.together.model}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    together: { ...prev.together, model: e.target.value }
                  }))}
                  className="input w-full"
                >
                  <option value="togethercomputer/llama-3.1-8b-instruct">Llama 3.1 8B Instruct</option>
                  <option value="togethercomputer/llama-3.1-70b-instruct">Llama 3.1 70B Instruct</option>
                  <option value="microsoft/DialoGPT-medium">DialoGPT Medium</option>
                </select>
              </div>

              <button
                onClick={() => testConnection('together')}
                disabled={!config.together.apiKey.trim() || isLoading || isTesting === 'together'}
                className="btn btn-secondary flex items-center space-x-2"
              >
                {isTesting === 'together' ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>Test Connection</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">How to get API keys:</h4>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <p><strong>OpenAI:</strong> Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com</a> and create an API key</p>
              <p><strong>Claude:</strong> Visit <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="underline">console.anthropic.com</a> and create an API key</p>
              <p><strong>Ollama (Local):</strong> Install <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="underline">Ollama</a> and run models locally - no API key needed!</p>
              <p><strong>Hugging Face:</strong> Visit <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="underline">huggingface.co</a> and create a free API token</p>
              <p><strong>Cohere:</strong> Visit <a href="https://dashboard.cohere.ai/api-keys" target="_blank" rel="noopener noreferrer" className="underline">dashboard.cohere.ai</a> and get a free API key</p>
              <p><strong>Groq:</strong> Visit <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="underline">console.groq.com</a> and get a free API key</p>
              <p><strong>Together AI:</strong> Visit <a href="https://together.ai/settings/api-keys" target="_blank" rel="noopener noreferrer" className="underline">together.ai</a> and get a free API key</p>
              <p className="mt-2 text-xs">You only need to configure one provider to use the AI Assistant. Free providers are marked with a green badge.</p>
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
            disabled={isSaving || isLoading}
            className="btn btn-primary flex items-center space-x-2"
          >
            {isSaving ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4" />
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AISettings;
