import React, { useState, useEffect } from 'react';
import { EmailMessage } from '@/shared/types';
import { useEmails } from '@/renderer/hooks/useEmails';
import { useAccounts } from '@/renderer/hooks/useAccounts';
import { useFolderContext } from '@/renderer/stores/FolderContext';
import EmailList from '@/renderer/components/Email/EmailList';
import EmailDetail from '@/renderer/components/Email/EmailDetail';
import EmailThread from '@/renderer/components/Email/EmailThread';

const EmailView: React.FC = () => {
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
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<EmailMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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
    setSelectedMessage(null); // Clear single message view when viewing thread
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
        setSelectedMessage(null);
        console.log('EmailView: Account deleted, cleared search and selection state');
      }
    };

    window.addEventListener('accountsChanged', handleAccountsChanged as EventListener);
    return () => {
      window.removeEventListener('accountsChanged', handleAccountsChanged as EventListener);
    };
  }, []);

  // Use search results if available, otherwise use regular emails
  const displayEmails = searchQuery.trim() ? searchResults : emails;
  const displayLoading = searchQuery.trim() ? isSearching : loading;

  return (
    <div className="h-full flex">
      {/* Email List Pane */}
      <div className="w-1/2 border-r border-gray-200 dark:border-gray-700">
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
