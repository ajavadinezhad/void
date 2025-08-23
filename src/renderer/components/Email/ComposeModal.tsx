import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  PaperAirplaneIcon, 
  PaperClipIcon,
  SparklesIcon,
  LightBulbIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  replyTo?: {
    subject: string;
    sender: string;
    body: string;
  };
}

const ComposeModal: React.FC<ComposeModalProps> = ({ isOpen, onClose, replyTo }) => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  useEffect(() => {
    if (replyTo) {
      setSubject(`Re: ${replyTo.subject}`);
      setBody(`\n\n--- Original Message ---\nFrom: ${replyTo.sender}\nSubject: ${replyTo.subject}\n\n${replyTo.body}`);
    }
  }, [replyTo]);

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) return;

    setIsSending(true);
    try {
      // TODO: Implement actual email sending
      console.log('Sending email:', { to, subject, body, attachments });
      onClose();
    } catch (error) {
      console.error('Failed to send email:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleAttachFiles = async () => {
    try {
      const filePaths = await window.electronAPI.selectAttachments();
      if (filePaths && filePaths.length > 0) {
        // Convert file paths to File objects (simplified)
        const files = filePaths.map(path => new File([], path.split('/').pop() || ''));
        setAttachments(prev => [...prev, ...files]);
      }
    } catch (error) {
      console.error('Failed to attach files:', error);
    }
  };

  const generateAISuggestions = async () => {
    if (!body.trim()) return;

    setIsGeneratingSuggestions(true);
    try {
      const response = await window.electronAPI.sendAIMessage({
        message: 'Please provide 3 different suggestions to improve this email draft. Make them professional, clear, and actionable.',
        context: `Email Draft:\nSubject: ${subject}\nBody: ${body}`,
        model: 'openai',
        emails: []
      });

      // Parse suggestions from AI response
      const suggestions = response.content
        .split('\n')
        .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('1.') || line.trim().startsWith('2.') || line.trim().startsWith('3.'))
        .map(s => s.replace(/^[•\-123\.]\s*/, '').trim())
        .filter(s => s.length > 0)
        .slice(0, 3);

      setAiSuggestions(suggestions);
      setShowAI(true);
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const applySuggestion = (suggestion: string) => {
    setBody(suggestion);
    setShowAI(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Compose Email</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Compose Area */}
          <div className="flex-1 flex flex-col p-4">
            {/* To Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                To
              </label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Subject Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Message
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={generateAISuggestions}
                    disabled={!body.trim() || isGeneratingSuggestions}
                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-50"
                    title="Get AI writing suggestions"
                  >
                    {isGeneratingSuggestions ? (
                      <ArrowPathIcon className="h-3 w-3 animate-spin" />
                    ) : (
                      <SparklesIcon className="h-3 w-3" />
                    )}
                    <span>AI Help</span>
                  </button>
                </div>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message here..."
                className="flex-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Attachments</h4>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm"
                    >
                      <PaperClipIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700 dark:text-gray-300">{file.name}</span>
                      <button
                        onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Suggestions Panel */}
          {showAI && (
            <div className="w-80 border-l border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                  <LightBulbIcon className="h-4 w-4 text-yellow-500 mr-1" />
                  AI Suggestions
                </h3>
                <button
                  onClick={() => setShowAI(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                {aiSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {suggestion}
                    </p>
                    <button
                      onClick={() => applySuggestion(suggestion)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      Use this suggestion
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleAttachFiles}
              className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <PaperClipIcon className="h-4 w-4" />
              <span>Attach</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={!to.trim() || !subject.trim() || !body.trim() || isSending}
              className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <PaperAirplaneIcon className="h-4 w-4" />
              )}
              <span>{isSending ? 'Sending...' : 'Send'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComposeModal;
