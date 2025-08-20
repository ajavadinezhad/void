import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  PaperAirplaneIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (emailData: EmailData) => void;
  initialData?: EmailData;
  mode?: 'reply' | 'forward' | 'new';
}

interface EmailData {
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  attachments: File[];
}

const ComposeModal: React.FC<ComposeModalProps> = ({ isOpen, onClose, onSend, initialData, mode = 'new' }) => {
  const [emailData, setEmailData] = useState<EmailData>({
    to: [''],
    cc: [''],
    bcc: [''],
    subject: '',
    body: '',
    attachments: []
  });

  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Initialize email data when modal opens with initial data
  useEffect(() => {
    if (isOpen && initialData) {
      setEmailData(initialData);
    } else if (isOpen && !initialData) {
      // Reset to default state when opening for new message
      setEmailData({
        to: [''],
        cc: [''],
        bcc: [''],
        subject: '',
        body: '',
        attachments: []
      });
    }
  }, [isOpen, initialData]);

  const handleInputChange = (field: keyof EmailData, value: any) => {
    setEmailData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayInputChange = (field: 'to' | 'cc' | 'bcc', index: number, value: string) => {
    setEmailData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addEmailField = (field: 'to' | 'cc' | 'bcc') => {
    setEmailData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeEmailField = (field: 'to' | 'cc' | 'bcc', index: number) => {
    if (emailData[field].length > 1) {
      setEmailData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
    }
  };

  const handleSend = () => {
    // Validate required fields
    if (!emailData.to[0] || !emailData.subject) {
      alert('Please fill in the required fields (To and Subject)');
      return;
    }

    // Filter out empty email addresses
    const cleanEmailData = {
      ...emailData,
      to: emailData.to.filter(email => email.trim() !== ''),
      cc: emailData.cc.filter(email => email.trim() !== ''),
      bcc: emailData.bcc.filter(email => email.trim() !== '')
    };

    onSend(cleanEmailData);
    onClose();
  };

  const handleAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setEmailData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeAttachment = (index: number) => {
    setEmailData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    setEmailData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">
            {mode === 'reply' ? 'Reply' : mode === 'forward' ? 'Forward' : 'New Message'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Email Form */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          {/* To Field */}
          <div>
            <label className="block text-sm font-medium mb-2">To *</label>
            {emailData.to.map((email, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleArrayInputChange('to', index, e.target.value)}
                  className="flex-1 input"
                  placeholder="recipient@example.com"
                />
                {emailData.to.length > 1 && (
                  <button
                    onClick={() => removeEmailField('to', index)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => addEmailField('to')}
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add recipient</span>
            </button>
          </div>

          {/* CC Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Cc</label>
              <button
                onClick={() => setShowCc(!showCc)}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                {showCc ? 'Hide' : 'Show'} Cc
              </button>
            </div>
            {showCc && (
              <>
                {emailData.cc.map((email, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => handleArrayInputChange('cc', index, e.target.value)}
                      className="flex-1 input"
                      placeholder="cc@example.com"
                    />
                    {emailData.cc.length > 1 && (
                      <button
                        onClick={() => removeEmailField('cc', index)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addEmailField('cc')}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Add Cc</span>
                </button>
              </>
            )}
          </div>

          {/* BCC Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Bcc</label>
              <button
                onClick={() => setShowBcc(!showBcc)}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                {showBcc ? 'Hide' : 'Show'} Bcc
              </button>
            </div>
            {showBcc && (
              <>
                {emailData.bcc.map((email, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => handleArrayInputChange('bcc', index, e.target.value)}
                      className="flex-1 input"
                      placeholder="bcc@example.com"
                    />
                    {emailData.bcc.length > 1 && (
                      <button
                        onClick={() => removeEmailField('bcc', index)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addEmailField('bcc')}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Add Bcc</span>
                </button>
              </>
            )}
          </div>

          {/* Subject Field */}
          <div>
            <label className="block text-sm font-medium mb-2">Subject *</label>
            <input
              type="text"
              value={emailData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              className="w-full input"
              placeholder="Enter subject..."
            />
          </div>

          {/* Body Field */}
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Message</label>
            <textarea
              value={emailData.body}
              onChange={(e) => handleInputChange('body', e.target.value)}
              className="w-full h-64 input resize-none"
              placeholder="Write your message here..."
            />
          </div>

          {/* Attachments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Attachments</label>
              <button
                onClick={() => setShowAttachments(!showAttachments)}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                {showAttachments ? 'Hide' : 'Show'} Attachments
              </button>
            </div>
            {showAttachments && (
              <div className="space-y-2">
                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragOver
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <PlusIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Drag and drop files here, or
                  </p>
                  <input
                    type="file"
                    multiple
                    onChange={handleAttachment}
                    className="hidden"
                    id="attachment-input"
                  />
                  <label
                    htmlFor="attachment-input"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Browse Files
                  </label>
                </div>
                
                {emailData.attachments.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Attached Files ({emailData.attachments.length})</h4>
                    <div className="space-y-1">
                      {emailData.attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm truncate">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <button
                            onClick={() => removeAttachment(index)}
                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500">
            {emailData.attachments.length > 0 && (
              <span>{emailData.attachments.length} attachment(s)</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              className="btn btn-primary flex items-center space-x-2"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComposeModal;
