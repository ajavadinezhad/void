import React, { useState, useEffect } from 'react';
import { EmailMessage } from '@/shared/types';
import { useEmails } from '@/renderer/hooks/useEmails';
import { useAccounts } from '@/renderer/hooks/useAccounts';
import { useFolderContext } from '@/renderer/stores/FolderContext';
import EmailList from '@/renderer/components/Email/EmailList';
import EmailDetail from '@/renderer/components/Email/EmailDetail';
import EmailThread from '@/renderer/components/Email/EmailThread';
import AIAssistant from '@/renderer/components/AI/AIAssistant';
import { MagnifyingGlassIcon, FunnelIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface EmailViewProps {
  isAIOpen?: boolean;
  onToggleAI?: () => void;
}

const EmailView: React.FC<EmailViewProps> = ({ isAIOpen = false, onToggleAI }) => {
  const { accounts } = useAccounts();
  const { selectedFolderId } = useFolderContext();
  const { 
    emails, 
    loading, 
    loadingMore, 
    hasMore, 
    fetchEmails, 
    loadMoreEmails 
  } = useEmails();
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | undefined>(undefined);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<EmailMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    isRead: undefined as boolean | undefined,
    isFlagged: false,
    hasAttachments: false,
    dateFrom: '',
    dateTo: '',
    sender: '',
    subject: ''
  });
  const [sortBy, setSortBy] = useState<'date' | 'subject' | 'sender' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Fetch emails when component mounts, account changes, or folder changes
  useEffect(() => {
    if (accounts.length > 0) {
      fetchEmails(accounts[0].id, selectedFolderId, true).catch(console.error);
    }
  }, [accounts, selectedFolderId]);

  const handleMessageSelect = (message: EmailMessage) => {
    // Keep selected message for list highlight, but default to thread view
    setSelectedMessage(message);
    setSelectedThreadId(message.threadId);
    // TODO: Mark as read in database
  };

  const handleViewThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    setSelectedMessage(undefined); // Clear single message view when viewing thread
  };

  const handleMessageAction = (messageId: number, action: string) => {
    // TODO: Implement message actions (flag, delete, etc.)
  };

  const handleSendEmail = async (emailData: any) => {
    try {
      // TODO: Implement actual email sending logic
      // This would typically call an IPC method to send the email
      // await window.electronAPI.sendEmail(emailData);
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    if (accounts.length === 0) return;
    
    setIsSearching(true);
    try {
      const results = await window.electronAPI.searchMessages(query, selectedFolderId, 50);
      setSearchResults(results);
    } catch (error) {
      console.error('EmailView: Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Filter functions
  const handleFilterChange = (key: string, value: any) => {
    setSearchFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setSearchFilters({
      isRead: undefined,
      isFlagged: false,
      hasAttachments: false,
      dateFrom: '',
      dateTo: '',
      sender: '',
      subject: ''
    });
  };

  const buildFilterQuery = () => {
    const parts: string[] = [];
    
    if (searchFilters.subject) {
      parts.push(`subject:"${searchFilters.subject}"`);
    }
    if (searchFilters.sender) {
      parts.push(`from:"${searchFilters.sender}"`);
    }
    if (searchFilters.isRead !== undefined) {
      parts.push(searchFilters.isRead ? 'is:read' : 'is:unread');
    }
    if (searchFilters.isFlagged) {
      parts.push('is:flagged');
    }
    if (searchFilters.hasAttachments) {
      parts.push('has:attachment');
    }
    if (searchFilters.dateFrom) {
      parts.push(`after:${searchFilters.dateFrom}`);
    }
    if (searchFilters.dateTo) {
      parts.push(`before:${searchFilters.dateTo}`);
    }
    
    return parts.join(' ');
  };

  const applyFilters = () => {
    const filterQuery = buildFilterQuery();
    handleSearch(filterQuery);
    setShowAdvancedFilters(false);
  };

  // Add click outside handler for the filter dropdown
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (event.key === 'Escape') {
        if (showAdvancedFilters) {
          setShowAdvancedFilters(false);
        }
        if (showSortDropdown) {
          setShowSortDropdown(false);
        }
      }

      // Quick sort shortcuts (Ctrl/Cmd + key)
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            setSortBy('date');
            break;
          case '2':
            event.preventDefault();
            setSortBy('subject');
            break;
          case '3':
            event.preventDefault();
            setSortBy('sender');
            break;
          case '4':
            event.preventDefault();
            setSortBy('size');
            break;
          case 'r':
            event.preventDefault();
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showAdvancedFilters, showSortDropdown]);

  // Sort emails based on current sort settings
  const sortedEmails = React.useMemo(() => {
    const emailsToSort = searchQuery ? searchResults : emails;
    
    return [...emailsToSort].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'subject':
          comparison = (a.subject || '').localeCompare(b.subject || '');
          break;
        case 'sender':
          comparison = (a.sender || '').localeCompare(b.sender || '');
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [emails, searchResults, searchQuery, sortBy, sortOrder]);

  // Display emails or search results
  const displayEmails = searchQuery ? searchResults : sortedEmails;
  const displayLoading = searchQuery ? isSearching : loading;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main Email Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Search and Filter Bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Button */}
            <div className="relative">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showAdvancedFilters 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="Advanced Filters"
              >
                <FunnelIcon className="h-5 w-5" />
              </button>

              {/* Advanced Filters Dropdown */}
              {showAdvancedFilters && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-4 animate-in slide-in-from-top-2 duration-300 ease-out">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={searchFilters.subject}
                        onChange={(e) => handleFilterChange('subject', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter subject..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Sender
                      </label>
                      <input
                        type="text"
                        value={searchFilters.sender}
                        onChange={(e) => handleFilterChange('sender', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter sender email..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Date From
                        </label>
                        <input
                          type="date"
                          value={searchFilters.dateFrom}
                          onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Date To
                        </label>
                        <input
                          type="date"
                          value={searchFilters.dateTo}
                          onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={searchFilters.isFlagged}
                          onChange={(e) => handleFilterChange('isFlagged', e.target.checked)}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Flagged</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={searchFilters.hasAttachments}
                          onChange={(e) => handleFilterChange('hasAttachments', e.target.checked)}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Has Attachments</span>
                      </label>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={applyFilters}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                      >
                        Apply Filters
                      </button>
                      <button
                        onClick={clearFilters}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="text-sm">
                  Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)} ({sortOrder.toUpperCase()})
                </span>
                <ChevronDownIcon className="h-4 w-4" />
              </button>

              {showSortDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 animate-in slide-in-from-top-2 duration-300 ease-out">
                  <div className="py-1">
                    {(['date', 'subject', 'sender', 'size'] as const).map((field) => (
                      <button
                        key={field}
                        onClick={() => {
                          setSortBy(field);
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          sortBy === field ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 py-1">
                    <button
                      onClick={() => {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        setShowSortDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      {sortOrder === 'asc' ? 'Descending' : 'Ascending'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-hidden">
          <EmailList
            messages={displayEmails}
            selectedMessageId={selectedMessage?.id}
            onMessageSelect={handleMessageSelect}
            onMessageAction={handleMessageAction}
            loading={displayLoading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onLoadMore={loadMoreEmails}
          />
        </div>
      </div>

      {/* Email Detail/Thread Panel */}
      {(selectedMessage || selectedThreadId) && (
        <div className="flex-1 min-w-0 border-l border-gray-200 dark:border-gray-700 animate-in slide-in-from-right duration-300 ease-out">
          {selectedThreadId ? (
            <EmailThread
              threadId={selectedThreadId}
              onSendEmail={handleSendEmail}
            />
          ) : selectedMessage ? (
            <EmailDetail
              message={selectedMessage}
              onSendEmail={handleSendEmail}
            />
          ) : null}
        </div>
      )}

      {/* AI Assistant Panel */}
      {isAIOpen && (
        <div className="w-80 border-l border-gray-200 dark:border-gray-700 flex-shrink-0 animate-in slide-in-from-right duration-300 ease-out">
          <AIAssistant 
            isOpen={isAIOpen}
            onClose={onToggleAI || (() => {})}
            selectedEmail={selectedMessage}
            emails={emails}
          />
        </div>
      )}
    </div>
  );
};

export default EmailView;
