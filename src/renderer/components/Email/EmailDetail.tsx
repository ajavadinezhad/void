import React, { useState } from 'react';
import { EmailMessage } from '@/shared/types';
import { 
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  TrashIcon,
  ArchiveBoxIcon,
  StarIcon,
  PaperClipIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import ComposeModal from './ComposeModal';

interface EmailDetailProps {
  message: EmailMessage;
  onSendEmail?: (emailData: EmailData) => void;
  onViewThread?: (threadId: string) => void;
}

interface EmailData {
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  attachments: File[];
}

const EmailDetail: React.FC<EmailDetailProps> = ({ message, onSendEmail, onViewThread }) => {
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeMode, setComposeMode] = useState<'reply' | 'forward' | 'new'>('new');
  const [composeData, setComposeData] = useState<EmailData>({
    to: [''],
    cc: [''],
    bcc: [''],
    subject: '',
    body: '',
    attachments: []
  });
  const formatDate = (date: Date) => {
    return date.toLocaleString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSenderName = (sender: string) => {
    const match = sender.match(/^([^<]+)\s*<(.+)>$/);
    if (match) {
      return match[1].trim();
    }
    const emailMatch = sender.match(/^([^@]+)@/);
    if (emailMatch) {
      return emailMatch[1].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return sender;
  };

  const getSenderEmail = (sender: string) => {
    const match = sender.match(/<(.+)>/);
    if (match) {
      return match[1];
    }
    return sender;
  };

  const hasAttachments = message.attachments && message.attachments.length > 0;

  // Helper functions for reply and forward
  const handleReply = () => {
    const originalSender = getSenderEmail(message.sender);
    const originalSubject = message.subject || '(No subject)';
    const replySubject = originalSubject.startsWith('Re:') ? originalSubject : `Re: ${originalSubject}`;
    
    // Extract original message for reply
    const originalMessage = message.htmlBody || message.body || '';
    const replyBody = `\n\n--- Original Message ---\nFrom: ${message.sender}\nDate: ${formatDate(message.date)}\nSubject: ${originalSubject}\n\n${originalMessage}`;
    
    setComposeData({
      to: [originalSender],
      cc: message.cc ? [message.cc] : [''],
      bcc: [''],
      subject: replySubject,
      body: replyBody,
      attachments: []
    });
    
    setComposeMode('reply');
    setShowComposeModal(true);
  };

  const handleForward = () => {
    const originalSubject = message.subject || '(No subject)';
    const forwardSubject = originalSubject.startsWith('Fwd:') ? originalSubject : `Fwd: ${originalSubject}`;
    
    // Extract original message for forward
    const originalMessage = message.htmlBody || message.body || '';
    const forwardBody = `\n\n--- Forwarded Message ---\nFrom: ${message.sender}\nDate: ${formatDate(message.date)}\nSubject: ${originalSubject}\n\n${originalMessage}`;
    
    setComposeData({
      to: [''],
      cc: [''],
      bcc: [''],
      subject: forwardSubject,
      body: forwardBody,
      attachments: []
    });
    
    setComposeMode('forward');
    setShowComposeModal(true);
  };

  const handleSendEmail = (emailData: EmailData) => {
    if (onSendEmail) {
      onSendEmail(emailData);
    }
    setShowComposeModal(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-3">
            <button className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              {message.isFlagged ? (
                <StarIconSolid className="h-5 w-5 text-yellow-500" />
              ) : (
                <StarIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
            
            <button 
              onClick={handleReply}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Reply"
            >
              <ArrowUturnLeftIcon className="h-5 w-5" />
            </button>
            
            <button 
              onClick={handleForward}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Forward"
            >
              <ArrowUturnRightIcon className="h-5 w-5" />
            </button>
            
            {onViewThread && (
              <button 
                onClick={() => onViewThread(message.threadId)}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="View Thread"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
              </button>
            )}
            
            <button className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <ArchiveBoxIcon className="h-5 w-5" />
            </button>
            
            <button className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
          
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {message.subject || '(No subject)'}
          </h1>
        </div>

        {/* Sender and date */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              From: {getSenderName(message.sender)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {getSenderEmail(message.sender)}
            </div>
            {message.recipients && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                To: {message.recipients}
              </div>
            )}
            {message.cc && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                CC: {message.cc}
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(message.date)}
          </div>
        </div>

        {/* Attachments */}
        {hasAttachments && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <PaperClipIcon className="h-4 w-4" />
              <span>Attachments ({message.attachments!.length})</span>
            </div>
            <div className="mt-2 space-y-1">
              {message.attachments!.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <PaperClipIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{attachment.filename}</span>
                  {attachment.size && (
                    <span className="text-xs text-gray-500">
                      ({(attachment.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {message.htmlBody ? (
          <div 
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: message.htmlBody }}
          />
        ) : (
          <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">
            {message.body || 'No content available'}
          </div>
        )}
      </div>

      {/* Compose Modal */}
      <ComposeModal
        isOpen={showComposeModal}
        onClose={() => setShowComposeModal(false)}
        onSend={handleSendEmail}
        initialData={composeData}
        mode={composeMode}
      />
    </div>
  );
};

export default EmailDetail;
