import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FolderContextType {
  selectedFolderId: number;
  setSelectedFolderId: (folderId: number) => void;
}

const FolderContext = createContext<FolderContextType | undefined>(undefined);

export const useFolderContext = () => {
  const context = useContext(FolderContext);
  if (context === undefined) {
    throw new Error('useFolderContext must be used within a FolderProvider');
  }
  return context;
};

interface FolderProviderProps {
  children: ReactNode;
}

export const FolderProvider: React.FC<FolderProviderProps> = ({ children }) => {
  const [selectedFolderId, setSelectedFolderId] = useState<number>(1); // Default to INBOX

  return (
    <FolderContext.Provider value={{ selectedFolderId, setSelectedFolderId }}>
      {children}
    </FolderContext.Provider>
  );
};
