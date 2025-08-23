import * as fs from 'fs';
import * as path from 'path';
import { AppSettings } from '@/shared/types';

export class SettingsService {
  private settingsPath: string;
  private defaultSettings: AppSettings = {
    theme: 'system',
    autoSync: true,
    syncInterval: 5, // minutes
    notifications: true,
    soundEnabled: true,
    aiFeatures: {
      writingEnabled: false,
      searchEnabled: false,
      summarizationEnabled: false,
      privacyRedactionEnabled: false
    },
    openai: {
      apiKey: '',
      model: 'gpt-5'
    },
    claude: {
      apiKey: '',
      model: 'claude-3-sonnet-20240229'
    },
    // Free AI Providers
    ollama: {
      baseUrl: 'http://localhost:11434',
      model: 'llama3.2'
    },
    huggingface: {
      apiKey: '',
      model: 'microsoft/DialoGPT-medium'
    },
    cohere: {
      apiKey: '',
      model: 'command'
    },
    groq: {
      apiKey: '',
      model: 'llama3-8b-8192'
    },
    together: {
      apiKey: '',
      model: 'togethercomputer/llama-3.1-8b-instruct'
    }
  };

  constructor() {
    const userDataPath = this.getUserDataPath();
    this.settingsPath = path.join(userDataPath, 'settings.json');
  }

  private getUserDataPath(): string {
    const { app } = require('electron');
    return app.getPath('userData');
  }

  async initialize(): Promise<void> {
    // Ensure settings file exists with default values
    if (!fs.existsSync(this.settingsPath)) {
      await this.saveSettings(this.defaultSettings);
    }
  }

  async getSettings(): Promise<AppSettings> {
    try {
      const data = fs.readFileSync(this.settingsPath, 'utf8');
      const settings = JSON.parse(data);
      
      // Merge with default settings to ensure all properties exist
      return { ...this.defaultSettings, ...settings };
    } catch (error) {
      console.error('Error reading settings:', error);
      return this.defaultSettings;
    }
  }

  async updateSettings(newSettings: Partial<AppSettings>): Promise<AppSettings> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...newSettings };
      
      await this.saveSettings(updatedSettings);
      return updatedSettings;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  private async saveSettings(settings: AppSettings): Promise<void> {
    try {
      const settingsDir = path.dirname(this.settingsPath);
      if (!fs.existsSync(settingsDir)) {
        fs.mkdirSync(settingsDir, { recursive: true });
      }
      
      fs.writeFileSync(this.settingsPath, JSON.stringify(settings, null, 2));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  // Convenience methods for specific settings
  async getTheme(): Promise<'light' | 'dark' | 'system'> {
    const settings = await this.getSettings();
    return settings.theme;
  }

  async setTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
    await this.updateSettings({ theme });
  }

  async getAutoSync(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.autoSync;
  }

  async setAutoSync(autoSync: boolean): Promise<void> {
    await this.updateSettings({ autoSync });
  }

  async getSyncInterval(): Promise<number> {
    const settings = await this.getSettings();
    return settings.syncInterval;
  }

  async setSyncInterval(interval: number): Promise<void> {
    await this.updateSettings({ syncInterval: interval });
  }

  async getNotifications(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.notifications;
  }

  async setNotifications(enabled: boolean): Promise<void> {
    await this.updateSettings({ notifications: enabled });
  }

  async getSoundEnabled(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.soundEnabled;
  }

  async setSoundEnabled(enabled: boolean): Promise<void> {
    await this.updateSettings({ soundEnabled: enabled });
  }

  async getAIFeatures(): Promise<AppSettings['aiFeatures']> {
    const settings = await this.getSettings();
    return settings.aiFeatures;
  }

  async setAIFeatures(features: Partial<AppSettings['aiFeatures']>): Promise<void> {
    const currentFeatures = await this.getAIFeatures();
    const updatedFeatures = { ...currentFeatures, ...features };
    await this.updateSettings({ aiFeatures: updatedFeatures });
  }

  async getAIConfig(): Promise<{ 
    openai: { apiKey: string; model: string }; 
    claude: { apiKey: string; model: string };
    ollama: { baseUrl: string; model: string };
    huggingface: { apiKey: string; model: string };
    cohere: { apiKey: string; model: string };
    groq: { apiKey: string; model: string };
    together: { apiKey: string; model: string };
  }> {
    const settings = await this.getSettings();
    console.log('SettingsService: Getting AI config from settings:', { 
      openai: settings.openai, 
      claude: settings.claude,
      ollama: settings.ollama,
      huggingface: settings.huggingface,
      cohere: settings.cohere,
      groq: settings.groq,
      together: settings.together
    });
    const config = {
      openai: {
        apiKey: settings.openai?.apiKey || '',
        model: settings.openai?.model || 'gpt-5'
      },
      claude: {
        apiKey: settings.claude?.apiKey || '',
        model: settings.claude?.model || 'claude-3-sonnet-20240229'
      },
      ollama: {
        baseUrl: settings.ollama?.baseUrl || 'http://localhost:11434',
        model: settings.ollama?.model || 'llama3.2'
      },
      huggingface: {
        apiKey: settings.huggingface?.apiKey || '',
        model: settings.huggingface?.model || 'microsoft/DialoGPT-medium'
      },
      cohere: {
        apiKey: settings.cohere?.apiKey || '',
        model: settings.cohere?.model || 'command'
      },
      groq: {
        apiKey: settings.groq?.apiKey || '',
        model: settings.groq?.model || 'llama3-8b-8192'
      },
      together: {
        apiKey: settings.together?.apiKey || '',
        model: settings.together?.model || 'togethercomputer/llama-3.1-8b-instruct'
      }
    };
    console.log('SettingsService: Returning AI config:', config);
    return config;
  }

  async saveAIConfig(config: { 
    openai: { apiKey: string; model: string }; 
    claude: { apiKey: string; model: string };
    ollama: { baseUrl: string; model: string };
    huggingface: { apiKey: string; model: string };
    cohere: { apiKey: string; model: string };
    groq: { apiKey: string; model: string };
    together: { apiKey: string; model: string };
  }): Promise<void> {
    console.log('SettingsService: Saving AI config:', config);
    await this.updateSettings({
      openai: config.openai,
      claude: config.claude,
      ollama: config.ollama,
      huggingface: config.huggingface,
      cohere: config.cohere,
      groq: config.groq,
      together: config.together
    });
    console.log('SettingsService: AI config saved successfully');
  }

  // Reset to default settings
  async resetToDefaults(): Promise<AppSettings> {
    await this.saveSettings(this.defaultSettings);
    return this.defaultSettings;
  }
}
