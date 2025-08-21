import React, { useState, useEffect } from 'react';
import { EmailMessage } from '@/shared/types';
import { 
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  TrashIcon,
  ArchiveBoxIcon,
  StarIcon,
  PaperClipIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import ComposeModal from './ComposeModal';

interface EmailThreadProps {
  threadId: string;
  onSendEmail?: (emailData: EmailData) => void;
}

interface EmailData {
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  attachments: File[];
}

const EmailThread: React.FC<EmailThreadProps> = ({ threadId, onSendEmail }) => {
  const [threadMessages, setThreadMessages] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
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

  useEffect(() => {
    const fetchThreadMessages = async () => {
      try {
        setLoading(true);
        const messages = await window.electronAPI.getMessagesByThreadId(threadId);
        setThreadMessages(messages);
        // Expand the first message by default
        if (messages.length > 0) {
          setExpandedMessages(new Set([messages[0].id]));
        }
      } catch (error) {
        console.error('Failed to fetch thread messages:', error);
      } finally {
        setLoading(false);
      }
    };

    if (threadId) {
      fetchThreadMessages();
    }
  }, [threadId]);

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

  const toggleMessageExpansion = (messageId: number) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const handleReply = (message: EmailMessage) => {
    const originalSender = getSenderEmail(message.sender);
    const originalSubject = message.subject || '(No subject)';
    const replySubject = originalSubject.startsWith('Re:') ? originalSubject : `Re: ${originalSubject}`;
    
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

  const handleForward = (message: EmailMessage) => {
    const originalSubject = message.subject || '(No subject)';
    const forwardSubject = originalSubject.startsWith('Fwd:') ? originalSubject : `Fwd: ${originalSubject}`;
    
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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading thread...</p>
        </div>
      </div>
    );
  }

  if (threadMessages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-6xl mb-4">📧</div>
          <p className="text-lg">No messages found in this thread</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-300 ease-out">
      {/* Thread Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 animate-in slide-in-from-right duration-300 ease-out">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {threadMessages[0]?.subject || '(No subject)'}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {threadMessages.length} message{threadMessages.length !== 1 ? 's' : ''} in this conversation
        </p>
      </div>

      {/* Thread Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {threadMessages.map((message, index) => {
          const isExpanded = expandedMessages.has(message.id);
          const hasAttachments = message.attachments && message.attachments.length > 0;
          const isFirstMessage = index === 0;

          return (
            <div key={message.id} className="border-b border-gray-200 dark:border-gray-700">
              {/* Message Header */}
              <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2 flex-1">
                    <button
                      onClick={() => toggleMessageExpansion(message.id)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDownIcon className="h-4 w-4" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4" />
                      )}
                    </button>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
                        {message.isFlagged ? (
                          <StarIconSolid className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <StarIcon className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                      
                      {hasAttachments && (
                        <PaperClipIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-white truncate">
                          {getSenderName(message.sender)}
                        </span>
                        {isFirstMessage && (
                          <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                            Original
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {getSenderEmail(message.sender)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 ml-4">
                    <button
                      onClick={() => handleReply(message)}
                      className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title="Reply"
                    >
                      <ArrowUturnLeftIcon className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleForward(message)}
                      className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title="Forward"
                    >
                      <ArrowUturnRightIcon className="h-4 w-4" />
                    </button>
                    
                    <button className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                      <ArchiveBoxIcon className="h-4 w-4" />
                    </button>
                    
                    <button className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(message.date)}
                </div>
              </div>

              {/* Message Content */}
              {isExpanded && (
                <div className="px-4 pb-4">
                  {/* Recipients */}
                  {message.recipients && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      To: {message.recipients}
                    </div>
                  )}
                  {message.cc && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      CC: {message.cc}
                    </div>
                  )}

                  {/* Attachments */}
                  {hasAttachments && (
                    <div className="mb-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <PaperClipIcon className="h-4 w-4" />
                        <span>Attachments ({message.attachments!.length})</span>
                      </div>
                      <div className="space-y-1">
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

                  {/* Message Body */}
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {message.htmlBody ? (
                      <div dangerouslySetInnerHTML={{ __html: message.htmlBody }} />
                    ) : (
                      <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                        {message.body || 'No content available'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
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

export default EmailThread;
