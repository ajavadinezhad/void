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
      console.log('EmailView: Fetching emails for account:', accounts[0].id, 'folder:', selectedFolderId);
      fetchEmails(accounts[0].id, selectedFolderId, true).catch(console.error);
    }
  }, [accounts, selectedFolderId]); // Add selectedFolderId to dependencies

  const handleMessageSelect = (message: EmailMessage) => {
    // Keep selected message for list highlight, but default to thread view
    setSelectedMessage(message);
    setSelectedThreadId(message.threadId);
    // TODO: Mark as read in database
    console.log('EmailView: Selected message, opening thread:', message.subject, message.threadId);
  };

  const handleViewThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    setSelectedMessage(undefined); // Clear single message view when viewing thread
    console.log('EmailView: Viewing thread:', threadId);
  };

  const handleMessageAction = (messageId: number, action: string) => {
    console.log('EmailView: Message action:', action, 'for message:', messageId);
    // TODO: Implement message actions (flag, delete, etc.)
  };

  const handleSendEmail = async (emailData: any) => {
    console.log('EmailView: Sending email:', emailData);
    try {
      // TODO: Implement actual email sending logic
      // This would typically call an IPC method to send the email
      // await window.electronAPI.sendEmail(emailData);
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };

  const handleSearch = async (query: string) => {
    console.log('EmailView: Search query:', query);
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    if (accounts.length === 0) return;
    
    setIsSearching(true);
    try {
      console.log('EmailView: Searching for:', query, 'in folder:', selectedFolderId);
      const results = await window.electronAPI.searchMessages(query, selectedFolderId, 50);
      console.log('EmailView: Search results:', results.length, 'emails found');
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
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showAdvancedFilters, showSortDropdown, sortOrder]);

  // Expose search function globally so parent components can access it
  useEffect(() => {
    (window as any).handleEmailSearch = handleSearch;
    return () => {
      delete (window as any).handleEmailSearch;
    };
  }, [selectedFolderId, accounts]);

  // Listen for account changes and refresh accordingly
  useEffect(() => {
    const handleAccountsChanged = (event: CustomEvent) => {
      console.log('EmailView: Accounts changed event received:', event.detail);
      if (event.detail.action === 'deleted') {
        // Clear search results and reset state when account is deleted
        setSearchQuery('');
        setSearchResults([]);
        setSelectedMessage(undefined);
        console.log('EmailView: Account deleted, cleared search and selection state');
      }
    };

    window.addEventListener('accountsChanged', handleAccountsChanged as EventListener);
    return () => {
      window.removeEventListener('accountsChanged', handleAccountsChanged as EventListener);
    };
  }, []);

  // Sort function
  const sortEmails = (emailsToSort: EmailMessage[]) => {
    return [...emailsToSort].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'subject':
          aValue = (a.subject || '').toLowerCase();
          bValue = (b.subject || '').toLowerCase();
          break;
        case 'sender':
          aValue = (a.sender || '').toLowerCase();
          bValue = (b.sender || '').toLowerCase();
          break;
        case 'size':
          aValue = a.size || 0;
          bValue = b.size || 0;
          break;
        default:
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  // Use search results if available, otherwise use regular emails, then sort them
  const displayEmails = sortEmails(searchQuery.trim() ? searchResults : emails);
  const displayLoading = searchQuery.trim() ? isSearching : loading;

  return (
    <div className="h-full flex">
      {/* AI Assistant */}
      <AIAssistant
        isOpen={isAIOpen}
        onClose={onToggleAI || (() => {})}
        selectedEmail={selectedMessage}
        emails={emails}
      />
      {/* Email List Pane */}
      <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Search Box */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 relative">
          <div className="flex gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="input pl-10 pr-20 w-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(e.currentTarget.value);
                  }
                }}
              />
              
              {/* Advanced Filters Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAdvancedFilters(!showAdvancedFilters);
                }}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded ${
                  showAdvancedFilters 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
                title="Advanced filters"
              >
                <FunnelIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title="Sort emails (Ctrl+1: Date, Ctrl+2: Subject, Ctrl+3: Sender, Ctrl+4: Size, Ctrl+R: Toggle order)"
              >
                <span className="text-sm">
                  {sortBy === 'date' && 'Date'}
                  {sortBy === 'subject' && 'Subject'}
                  {sortBy === 'sender' && 'Sender'}
                  {sortBy === 'size' && 'Size'}
                </span>
                <div className="flex flex-col">
                  <ChevronDownIcon className={`h-3 w-3 ${sortOrder === 'desc' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                  <ChevronDownIcon className={`h-3 w-3 rotate-180 ${sortOrder === 'asc' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                </div>
              </button>

              {/* Sort Dropdown Menu */}
              {showSortDropdown && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 bg-black bg-opacity-25 z-40" onClick={() => setShowSortDropdown(false)} />
                  
                  {/* Dropdown */}
                  <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-48">
                    <div className="py-1">
                      {/* Sort By Options */}
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Sort by
                      </div>
                      
                      <button
                        onClick={() => {
                          setSortBy('date');
                          setShowSortDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          sortBy === 'date' ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''
                        }`}
                      >
                        Date
                      </button>
                      
                      <button
                        onClick={() => {
                          setSortBy('subject');
                          setShowSortDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          sortBy === 'subject' ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''
                        }`}
                      >
                        Subject
                      </button>
                      
                      <button
                        onClick={() => {
                          setSortBy('sender');
                          setShowSortDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          sortBy === 'sender' ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''
                        }`}
                      >
                        Sender
                      </button>
                      
                      <button
                        onClick={() => {
                          setSortBy('size');
                          setShowSortDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          sortBy === 'size' ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''
                        }`}
                      >
                        Size
                      </button>

                      {/* Divider */}
                      <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                      {/* Sort Order Options */}
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Order
                      </div>
                      
                      <button
                        onClick={() => {
                          setSortOrder('desc');
                          setShowSortDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          sortOrder === 'desc' ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''
                        }`}
                      >
                        Descending
                      </button>
                      
                      <button
                        onClick={() => {
                          setSortOrder('asc');
                          setShowSortDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          sortOrder === 'asc' ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''
                        }`}
                      >
                        Ascending
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Advanced Filters Dropdown */}
          {showAdvancedFilters && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 bg-black bg-opacity-25 z-40" onClick={() => setShowAdvancedFilters(false)} />
              
              {/* Modal */}
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={searchFilters.subject}
                      onChange={(e) => handleFilterChange('subject', e.target.value)}
                      className="input text-sm"
                      placeholder="Contains..."
                    />
                  </div>

                  {/* Sender */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      From
                    </label>
                    <input
                      type="text"
                      value={searchFilters.sender}
                      onChange={(e) => handleFilterChange('sender', e.target.value)}
                      className="input text-sm"
                      placeholder="Email address..."
                    />
                  </div>

                  {/* Read Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Read Status
                    </label>
                    <select
                      value={searchFilters.isRead === undefined ? '' : searchFilters.isRead.toString()}
                      onChange={(e) => handleFilterChange('isRead', e.target.value === '' ? undefined : e.target.value === 'true')}
                      className="input text-sm"
                    >
                      <option value="">Any</option>
                      <option value="true">Read</option>
                      <option value="false">Unread</option>
                    </select>
                  </div>

                  {/* Date Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date From
                    </label>
                    <input
                      type="date"
                      value={searchFilters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      className="input text-sm"
                    />
                  </div>

                  {/* Date To */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date To
                    </label>
                    <input
                      type="date"
                      value={searchFilters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                      className="input text-sm"
                    />
                  </div>

                  {/* Flags & Attachments */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={searchFilters.isFlagged}
                        onChange={(e) => handleFilterChange('isFlagged', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Flagged</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={searchFilters.hasAttachments}
                        onChange={(e) => handleFilterChange('hasAttachments', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Has Attachments</span>
                    </label>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Clear All
                  </button>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowAdvancedFilters(false)}
                      className="btn btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={applyFilters}
                      className="btn btn-primary text-sm"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Search Results Header */}
        {searchQuery.trim() && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700 dark:text-blue-300">
                Search results for "{searchQuery}" ({searchResults.length} emails)
              </span>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
              >
                Clear
              </button>
            </div>
          </div>
        )}

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

      {/* Email Detail Pane */}
      <div className="w-1/2">
        {selectedThreadId ? (
          <EmailThread threadId={selectedThreadId} onSendEmail={handleSendEmail} />
        ) : selectedMessage ? (
          <EmailDetail 
            message={selectedMessage} 
            onSendEmail={handleSendEmail} 
            onViewThread={handleViewThread}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="text-6xl mb-4">📧</div>
              <p className="text-lg">Select an email to read</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailView;
