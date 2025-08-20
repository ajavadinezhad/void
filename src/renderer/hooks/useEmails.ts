import { useState, useEffect } from 'react';
import { EmailMessage } from '@/shared/types';

export function useEmails() {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<number>(1);
  const [currentAccountId, setCurrentAccountId] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(20); // Number of emails to fetch per page

  const fetchEmails = async (accountId: number, folderId: number = 1, reset: boolean = true) => {
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
        setEmails([]);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }
      
      setError(null);
      setCurrentAccountId(accountId);
      setCurrentFolderId(folderId);
      
      console.log('useEmails: Fetching emails for account:', accountId, 'folder:', folderId, 'limit:', limit, 'offset:', reset ? 0 : offset);
      
      // First, let's check if we have folders for this account
      const folders = await window.electronAPI.getFolders(accountId);
      console.log('useEmails: Available folders:', folders);
      
      // Use the provided folderId directly, but validate it exists
      let targetFolderId = folderId;
      if (folders.length === 0) {
        console.log('useEmails: No folders found, using default folder ID');
        targetFolderId = 1; // Use default inbox folder ID
      } else {
        // Check if the requested folderId exists in the folders
        const requestedFolder = folders.find(folder => folder.id === folderId);
        if (requestedFolder) {
          targetFolderId = folderId;
          console.log('useEmails: Using requested folder:', requestedFolder.name, 'ID:', targetFolderId);
        } else {
          // Fallback to inbox folder if requested folder doesn't exist
          const inboxFolder = folders.find(folder => folder.type === 'inbox' || folder.name.toLowerCase().includes('inbox'));
          if (inboxFolder) {
            targetFolderId = inboxFolder.id;
            console.log('useEmails: Requested folder not found, using inbox folder:', inboxFolder.name, 'ID:', targetFolderId);
          } else {
            // Fallback to first folder if no inbox found
            targetFolderId = folders[0].id;
            console.log('useEmails: No inbox folder found, using first folder:', folders[0].name, 'ID:', targetFolderId);
          }
        }
      }
      
      const currentOffset = reset ? 0 : offset;
      const result = await window.electronAPI.getMessages(targetFolderId, limit, currentOffset);
      const emailsData = result.messages;
      const totalEmails = result.total;
      
      console.log('useEmails: Fetched emails:', emailsData.length, 'emails out of', totalEmails, 'total');
      
      if (reset) {
        setEmails(emailsData);
        setOffset(limit);
      } else {
        // Prevent duplicate emails by checking existing IDs
        setEmails(prev => {
          const existingIds = new Set(prev.map(email => email.id));
          const newEmails = emailsData.filter(email => !existingIds.has(email.id));
          return [...prev, ...newEmails];
        });
        setOffset(prev => prev + limit);
      }
      
      // Check if we have more emails to load
      // If we've loaded fewer emails than the total, there are more
      const currentTotal = reset ? emailsData.length : offset + emailsData.length;
      setHasMore(currentTotal < totalEmails);
      
      console.log('useEmails: Loaded', currentTotal, 'out of', totalEmails, 'total emails, hasMore:', currentTotal < totalEmails);
      
      return emailsData;
    } catch (err) {
      console.error('useEmails: Error fetching emails:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch emails');
      throw err;
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreEmails = async () => {
    if (loadingMore || !hasMore || !currentAccountId) return;
    
    console.log('useEmails: Loading more emails...');
    await fetchEmails(currentAccountId, currentFolderId, false);
  };

  const refreshEmails = async (accountId: number) => {
    console.log('useEmails: Refreshing emails for account:', accountId);
    // Clear the current emails and reset state
    setEmails([]);
    setOffset(0);
    setHasMore(true);
    setLoading(true);
    return fetchEmails(accountId, 1, true); // Reset and fetch first page
  };

  const changeFolder = async (accountId: number, folderId: number) => {
    return fetchEmails(accountId, folderId, true); // Reset and fetch first page
  };

  useEffect(() => {
    const unsubscribe = window.electronAPI.onDataEvent(async (payload: any) => {
      try {
        if (payload?.type === 'emails:synced' || payload?.type === 'emails:all-synced') {
          if (currentAccountId) {
            await fetchEmails(currentAccountId, currentFolderId, true);
          }
        } else if (payload?.type === 'folders:refreshed') {
          if (currentAccountId) {
            await fetchEmails(currentAccountId, currentFolderId, true);
          }
        } else if (payload?.type === 'account:deleted') {
          // Clear local state when an account is deleted
          setEmails([]);
          setHasMore(false);
          setOffset(0);
        }
      } catch (e) {
        // ignore
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentAccountId, currentFolderId]);

  return {
    emails,
    loading,
    loadingMore,
    error,
    hasMore,
    fetchEmails,
    loadMoreEmails,
    refreshEmails,
    changeFolder
  };
}
