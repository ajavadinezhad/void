import React, { useEffect, useRef, useCallback } from 'react';
import { EmailMessage } from '@/shared/types';
import { 
  StarIcon,
  TrashIcon,
  ArchiveBoxIcon,
  EnvelopeIcon,
  EnvelopeOpenIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface EmailListProps {
  messages: EmailMessage[];
  selectedMessageId?: number;
  onMessageSelect: (message: EmailMessage) => void;
  onMessageAction: (messageId: number, action: string) => void;
  loading: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

const EmailList: React.FC<EmailListProps> = ({
  messages,
  selectedMessageId,
  onMessageSelect,
  onMessageAction,
  loading,
  loadingMore,
  hasMore,
  onLoadMore
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll detection for infinite loading
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || !hasMore || loadingMore || !onLoadMore) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // Load when 100px from bottom

    if (isNearBottom) {
      console.log('EmailList: Near bottom, triggering load more...');
      onLoadMore();
    }
  }, [hasMore, loadingMore, onLoadMore]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const formatDate = (date: Date | string) => {
    // Convert string to Date object if needed
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return dateObj.toLocaleDateString([], { weekday: 'short' });
    } else {
      return dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getSenderName = (sender: string) => {
    // Extract name from email format "Name <email@domain.com>"
    const match = sender.match(/^([^<]+)\s*<(.+)>$/);
    if (match) {
      return match[1].trim();
    }
    // Extract name from email address
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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center animate-in fade-in duration-300 ease-out">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 animate-in fade-in duration-300 ease-out">
        <div className="text-center">
          <EnvelopeIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No emails found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </h2>
          <div className="flex items-center space-x-1">
            <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
              <ArchiveBoxIcon className="h-4 w-4" />
            </button>
            <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Email List */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar">
        {messages.map((message, index) => (
          <div
            key={message.id}
            onClick={() => onMessageSelect(message)}
            className={`email-item ${!message.isRead ? 'unread' : ''} ${
              selectedMessageId === message.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
            } animate-in slide-in-from-top duration-300 ease-out`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* Read/Unread indicator */}
              <div className="flex-shrink-0">
                {message.isRead ? (
                  <EnvelopeOpenIcon className="h-4 w-4 text-gray-400" />
                ) : (
                  <EnvelopeIcon className="h-4 w-4 text-blue-600" />
                )}
              </div>

              {/* Star/Favorite */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMessageAction(message.id, 'flag');
                }}
                className="flex-shrink-0"
              >
                {message.isFlagged ? (
                  <StarIconSolid className="h-4 w-4 text-yellow-500" />
                ) : (
                  <StarIcon className="h-4 w-4 text-gray-400 hover:text-yellow-500" />
                )}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium truncate ${
                    !message.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {getSenderName(message.sender)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                    {formatDate(message.date)}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span className="truncate block">
                    {message.subject || '(No subject)'}
                  </span>
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400 text-ellipsis-2">
                  {message.body || message.htmlBody || 'No preview available'}
                </div>
              </div>
            </div>
          </div>
        ))}
          
          {/* Loading More Indicator */}
          {loadingMore && (
            <div className="flex items-center justify-center py-4 animate-in fade-in duration-300 ease-out">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading more emails...</span>
            </div>
          )}
          
          {/* End of List Indicator */}
          {!hasMore && messages.length > 0 && (
            <div className="flex items-center justify-center py-4 text-sm text-gray-500 dark:text-gray-400">
              <span>No more emails to load</span>
            </div>
          )}
        </div>
      </div>
    );
  };

export default EmailList;
