import React, { useState, useEffect } from 'react';
import { 
  InboxIcon, 
  PaperAirplaneIcon, 
  DocumentTextIcon, 
  TrashIcon, 
  ArchiveBoxIcon, 
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { useAccounts } from '@/renderer/hooks/useAccounts';
import { useFolderContext } from '@/renderer/stores/FolderContext';
import { EmailFolder } from '@/shared/types';
import ComposeModal from '@/renderer/components/Email/ComposeModal';

interface SidebarProps {
  collapsed: boolean;
  onFolderSelect?: (folderId: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onFolderSelect }) => {
  const { accounts } = useAccounts();
  const { selectedFolderId } = useFolderContext();
  const [folders, setFolders] = useState<EmailFolder[]>([]);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<number>>(new Set());
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);

  const handleCompose = () => {
    setIsComposeModalOpen(true);
  };

  const handleSendEmail = async (emailData: any) => {
    try {
      // Here you would integrate with your email service
      console.log('Sending email:', emailData);
      
      // For now, just show a success message
      alert('Email sent successfully! (This is a demo - no actual email was sent)');
      
      // TODO: Integrate with EmailService
      // await window.electronAPI.sendMessage(emailData);
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email. Please try again.');
    }
  };

  const loadFolders = async () => {
    console.log('Sidebar: loadFolders called, accounts:', accounts.length);
    const allFolders: EmailFolder[] = [];
    for (const account of accounts) {
      try {
        console.log('Sidebar: Loading folders for account:', account.id, account.email);
        const accountFolders = await window.electronAPI.getFolders(account.id);
        console.log('Sidebar: Got folders for account', account.id, ':', accountFolders);
        allFolders.push(...accountFolders);
      } catch (error) {
        console.error(`Failed to load folders for account ${account.id}:`, error);
      }
    }
    console.log('Sidebar: Setting all folders:', allFolders);
    setFolders(allFolders);
  };

  useEffect(() => {
    if (accounts.length > 0) {
      loadFolders();
    }
  }, [accounts]);

  // Listen for data events to refresh folder counts
  useEffect(() => {
    console.log('Sidebar: Setting up data event listener');
    const unsubscribe = window.electronAPI.onDataEvent(async (payload: any) => {
      console.log('Sidebar: Received data event:', payload);
      if (payload?.type === 'emails:synced' || payload?.type === 'emails:all-synced' || payload?.type === 'folders:refreshed') {
        console.log('Sidebar: Refreshing folders due to data event:', payload.type);
        await loadFolders();
      } else if (payload?.type === 'account:deleted') {
        console.log('Sidebar: Clearing folders due to account deletion');
        setFolders([]);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Expose refresh function globally so it can be called from other components
  useEffect(() => {
    (window as any).refreshSidebarFolders = loadFolders;
    return () => {
      delete (window as any).refreshSidebarFolders;
    };
  }, [accounts]);

  const toggleAccount = (accountId: number) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  const getAccountFolders = (accountId: number) => {
    return folders.filter(folder => folder.accountId === accountId);
  };

  const getFolderIcon = (type: string, sizeClass: string = 'h-4 w-4') => {
    switch (type) {
      case 'inbox':
        return <InboxIcon className={sizeClass} />;
      case 'sent':
        return <PaperAirplaneIcon className={sizeClass} />;
      case 'drafts':
        return <DocumentTextIcon className={sizeClass} />;
      case 'trash':
        return <TrashIcon className={sizeClass} />;
      case 'archive':
        return <ArchiveBoxIcon className={sizeClass} />;
      case 'spam':
        return <ExclamationTriangleIcon className={sizeClass} />;
      default:
        return <DocumentTextIcon className={sizeClass} />;
    }
  };

  if (collapsed) {
    return (
      <>
        <div className="w-16 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Compose */}
          <div className="p-2">
            <button 
              onClick={handleCompose}
              className="w-full h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
              title="Compose"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Folders as icons only (always visible) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar py-2 space-y-1">
            {folders
              .sort((a, b) => {
                if (a.type === 'inbox' && b.type !== 'inbox') return -1;
                if (b.type === 'inbox' && a.type !== 'inbox') return 1;
                return a.id - b.id;
              })
              .map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => onFolderSelect?.(folder.id)}
                  className={`mx-2 h-10 w-10 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                    selectedFolderId === folder.id ? 'bg-blue-100 dark:bg-blue-900/30' : ''
                  }`}
                  title={folder.name}
                >
                  <div className="relative">
                    {getFolderIcon(folder.type, 'h-5 w-5')}
                    {folder.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[11px] leading-none rounded-full px-1.5">
                        {folder.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))}
          </div>
        </div>
        <ComposeModal
          isOpen={isComposeModalOpen}
          onClose={() => setIsComposeModalOpen(false)}
          onSend={handleSendEmail}
        />
      </>
    );
  }

  return (
    <>
      <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Compose button */}
        <div className="p-4">
          <button 
            onClick={handleCompose}
            className="w-full btn btn-primary flex items-center justify-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Compose</span>
          </button>
        </div>

        {/* Folders */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-4 py-2">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Folders ({folders.length})
            </div>
            {folders.length > 0 ? (
              folders
                .sort((a, b) => {
                  if (a.type === 'inbox' && b.type !== 'inbox') return -1;
                  if (b.type === 'inbox' && a.type !== 'inbox') return 1;
                  return a.id - b.id;
                })
                .map((folder) => (
                <button 
                  key={folder.id}
                  className={`w-full sidebar-item flex items-center justify-between ${
                    selectedFolderId === folder.id ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''
                  }`}
                  onClick={() => {
                    console.log('Clicked folder:', folder.name, 'ID:', folder.id);
                    onFolderSelect?.(folder.id);
                  }}
                >
                  <div className="flex items-center">
                    {getFolderIcon(folder.type)}
                    <span className="ml-2">{folder.name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {folder.unreadCount > 0 && (
                      <span className="text-xs bg-blue-600 text-white rounded-full px-2 py-1 min-w-[20px] text-center">
                        {folder.unreadCount}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {folder.totalCount}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 py-2">
                No folders found
              </div>
            )}
          </div>
        </div>
      </div>
      <ComposeModal
        isOpen={isComposeModalOpen}
        onClose={() => setIsComposeModalOpen(false)}
        onSend={handleSendEmail}
      />
    </>
  );
};

export default Sidebar;
