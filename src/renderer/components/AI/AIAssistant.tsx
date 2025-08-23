import React, { useState, useEffect, useRef } from 'react';
import { 
  SparklesIcon, 
  PaperAirplaneIcon, 
  StopIcon,
  DocumentTextIcon,
  LightBulbIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  ClockIcon,
  FolderIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { EmailMessage } from '@/shared/types';
import AISettings from './AISettings';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEmail?: EmailMessage;
  emails?: EmailMessage[];
}

interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  error?: boolean;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ 
  isOpen, 
  onClose, 
  selectedEmail, 
  emails = [] 
}) => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'openai' | 'claude' | 'ollama' | 'huggingface' | 'cohere' | 'groq' | 'together'>('openai');
  const [showSettings, setShowSettings] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check AI configuration on mount
  useEffect(() => {
    if (isOpen) {
      checkAIConfig();
    }
  }, [isOpen]);

  const checkAIConfig = async () => {
    try {
      const config = await window.electronAPI.getAIConfig();
      const hasOpenAI = config.openai?.apiKey?.trim();
      const hasClaude = config.claude?.apiKey?.trim();
      const hasOllama = config.ollama?.baseUrl?.trim();
      const hasHuggingFace = config.huggingface?.apiKey?.trim();
      const hasCohere = config.cohere?.apiKey?.trim();
      const hasGroq = config.groq?.apiKey?.trim();
      const hasTogether = config.together?.apiKey?.trim();
      
      const hasAnyProvider = hasOpenAI || hasClaude || hasOllama || hasHuggingFace || hasCohere || hasGroq || hasTogether;
      
      if (!hasAnyProvider) {
        setConfigError('No AI API keys configured. Please set up at least one AI provider in settings.');
        setHasConfig(false);
      } else {
        setConfigError(null);
        setHasConfig(true);
        // Set default model based on available providers (prioritize free ones)
        if (hasOllama) {
          setSelectedModel('ollama');
        } else if (hasGroq) {
          setSelectedModel('groq');
        } else if (hasCohere) {
          setSelectedModel('cohere');
        } else if (hasHuggingFace) {
          setSelectedModel('huggingface');
        } else if (hasTogether) {
          setSelectedModel('together');
        } else if (hasOpenAI) {
          setSelectedModel('openai');
        } else if (hasClaude) {
          setSelectedModel('claude');
        }
      }
    } catch (error) {
      console.error('Failed to check AI config:', error);
      setConfigError('Failed to load AI configuration');
      setHasConfig(false);
    }
  };

  useEffect(() => {
    if (selectedEmail && isOpen) {
      // Auto-generate context when email is selected
      const context = `Email Subject: ${selectedEmail.subject}
From: ${selectedEmail.sender}
Date: ${selectedEmail.date.toLocaleString()}
Content: ${selectedEmail.body?.substring(0, 500) || ''}...`;
      
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `I can see you've selected an email about "${selectedEmail.subject}". How can I help you with this email? I can:\n\n• Summarize the key points\n• Suggest a response\n• Extract action items\n• Analyze the tone and sentiment\n• Help you organize related emails\n\nWhat would you like me to do?`,
        timestamp: new Date()
      }]);
    }
  }, [selectedEmail, isOpen]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !hasConfig) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsStreaming(true);

    try {
      // Prepare context with email data
      const emailContext = selectedEmail ? `
Email Context:
- Subject: ${selectedEmail.subject}
- From: ${selectedEmail.sender}
- Date: ${selectedEmail.date.toLocaleString()}
- Content: ${selectedEmail.body}
` : '';

      console.log('AIAssistant: Sending message with model:', selectedModel);
      console.log('AIAssistant: Current selectedModel state:', selectedModel);

      const response = await window.electronAPI.sendAIMessage({
        message: content,
        context: emailContext,
        model: selectedModel,
        emails: emails.slice(0, 10) // Send recent emails for context
      });

      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI message error:', error);
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your API configuration and try again.`,
        timestamp: new Date(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasConfig) {
      sendMessage(input);
    } else {
      setShowSettings(true);
    }
  };

  const quickActions = [
    {
      icon: ExclamationTriangleIcon,
      label: 'Check for Scam',
      action: () => sendMessage('Analyze this email for potential scam indicators. Look for suspicious elements like urgent requests for money, unusual sender addresses, poor grammar, requests for personal information, or other red flags that might indicate this is a phishing attempt or scam.')
    },
    {
      icon: DocumentTextIcon,
      label: 'Summarize',
      action: () => sendMessage('Please summarize the key points of this email.')
    },
    {
      icon: LightBulbIcon,
      label: 'Action Items',
      action: () => sendMessage('Extract any action items or tasks from this email.')
    },
    {
      icon: ClockIcon,
      label: 'Extract Deadlines',
      action: () => sendMessage('Extract any deadlines, due dates, meeting times, or time-sensitive information from this email. List them clearly with their dates and times.')
    },
    {
      icon: PaperAirplaneIcon,
      label: 'Draft Reply',
      action: () => sendMessage('Help me draft a professional reply to this email.')
    },
    {
      icon: ChatBubbleLeftRightIcon,
      label: 'Analyze Tone',
      action: () => sendMessage('Analyze the tone and sentiment of this email.')
    },
    {
      icon: GlobeAltIcon,
      label: 'Translate',
      action: () => sendMessage('Translate this email to English (if it\'s in another language) or suggest what language it might be in. If it\'s already in English, provide a brief translation summary.')
    },
    {
      icon: FolderIcon,
      label: 'Categorize',
      action: () => sendMessage('Suggest which folder or category this email should be organized into (e.g., Work, Personal, Promotions, Social, Updates, etc.) and explain why.')
    }
  ];

  if (!isOpen) return null;

  return (
    <>
      <AISettings 
        isOpen={showSettings} 
        onClose={() => {
          setShowSettings(false);
          checkAIConfig(); // Re-check config after settings close
        }} 
      />
      <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col z-50">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h2>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            title="AI Settings"
          >
            <Cog6ToothIcon className="h-5 w-5 text-gray-500" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Configuration Error */}
        {configError && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <div className="flex items-start space-x-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-700 dark:text-red-300">{configError}</p>
                <button
                  onClick={() => setShowSettings(true)}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline mt-1"
                >
                  Configure AI Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Model Selector */}
        {hasConfig && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedModel('openai')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  selectedModel === 'openai'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                OpenAI
              </button>
              <button
                onClick={() => setSelectedModel('claude')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  selectedModel === 'claude'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                Claude
              </button>
              <button
                onClick={() => setSelectedModel('ollama')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  selectedModel === 'ollama'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                Ollama
              </button>
              <button
                onClick={() => {
                  console.log('AIAssistant: Groq button clicked');
                  setSelectedModel('groq');
                  console.log('AIAssistant: selectedModel set to groq');
                }}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  selectedModel === 'groq'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                Groq
              </button>
              <button
                onClick={() => setSelectedModel('cohere')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  selectedModel === 'cohere'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                Cohere
              </button>
              <button
                onClick={() => setSelectedModel('huggingface')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  selectedModel === 'huggingface'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                Hugging Face
              </button>
              <button
                onClick={() => setSelectedModel('together')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  selectedModel === 'together'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                Together AI
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {selectedEmail && hasConfig && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 animate-in slide-in-from-top duration-300 ease-out"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <action.icon className="h-4 w-4" />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          {messages.length === 0 && !configError && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <SparklesIcon className="h-12 w-12 text-gray-400" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Welcome to AI Assistant</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Select an email to get started, or ask me anything about your emails.
                </p>
              </div>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-top duration-300 ease-out`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.error
                    ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                <div className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-blue-100' : message.error ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start animate-in fade-in duration-300 ease-out">
              <div className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={hasConfig ? "Ask me anything about your emails..." : "Configure AI settings to get started..."}
              disabled={isLoading || !hasConfig}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim() || !hasConfig}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!hasConfig ? "Configure AI settings first" : "Send message"}
            >
              {isStreaming ? (
                <StopIcon className="h-4 w-4" />
              ) : (
                <PaperAirplaneIcon className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AIAssistant;
