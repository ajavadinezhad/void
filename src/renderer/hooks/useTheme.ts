import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    // Load theme from settings
    const loadTheme = async () => {
      try {
        const settings = await window.electronAPI.getSettings();
        setTheme(settings.theme);
        
        // Apply theme to document
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        
        if (settings.theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          root.classList.add(systemTheme);
        } else {
          root.classList.add(settings.theme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };

    loadTheme();
  }, []);

  const updateTheme = async (newTheme: 'light' | 'dark' | 'system') => {
    try {
      console.log('Updating theme to:', newTheme);
      await window.electronAPI.updateSettings({ theme: newTheme });
      setTheme(newTheme);
      console.log('Theme updated successfully');
      
      // Apply theme immediately to the document
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      
      if (newTheme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(newTheme);
      }
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  };

  return { theme, updateTheme };
}
