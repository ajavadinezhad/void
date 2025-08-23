"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class SettingsService {
    constructor() {
        this.defaultSettings = {
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
        const userDataPath = this.getUserDataPath();
        this.settingsPath = path.join(userDataPath, 'settings.json');
    }
    getUserDataPath() {
        const { app } = require('electron');
        return app.getPath('userData');
    }
    async initialize() {
        // Ensure settings file exists with default values
        if (!fs.existsSync(this.settingsPath)) {
            await this.saveSettings(this.defaultSettings);
        }
    }
    async getSettings() {
        try {
            const data = fs.readFileSync(this.settingsPath, 'utf8');
            const settings = JSON.parse(data);
            // Merge with default settings to ensure all properties exist
            return { ...this.defaultSettings, ...settings };
        }
        catch (error) {
            console.error('Error reading settings:', error);
            return this.defaultSettings;
        }
    }
    async updateSettings(newSettings) {
        try {
            const currentSettings = await this.getSettings();
            const updatedSettings = { ...currentSettings, ...newSettings };
            await this.saveSettings(updatedSettings);
            return updatedSettings;
        }
        catch (error) {
            console.error('Error updating settings:', error);
            throw error;
        }
    }
    async saveSettings(settings) {
        try {
            const settingsDir = path.dirname(this.settingsPath);
            if (!fs.existsSync(settingsDir)) {
                fs.mkdirSync(settingsDir, { recursive: true });
            }
            fs.writeFileSync(this.settingsPath, JSON.stringify(settings, null, 2));
        }
        catch (error) {
            console.error('Error saving settings:', error);
            throw error;
        }
    }
    // Convenience methods for specific settings
    async getTheme() {
        const settings = await this.getSettings();
        return settings.theme;
    }
    async setTheme(theme) {
        await this.updateSettings({ theme });
    }
    async getAutoSync() {
        const settings = await this.getSettings();
        return settings.autoSync;
    }
    async setAutoSync(autoSync) {
        await this.updateSettings({ autoSync });
    }
    async getSyncInterval() {
        const settings = await this.getSettings();
        return settings.syncInterval;
    }
    async setSyncInterval(interval) {
        await this.updateSettings({ syncInterval: interval });
    }
    async getNotifications() {
        const settings = await this.getSettings();
        return settings.notifications;
    }
    async setNotifications(enabled) {
        await this.updateSettings({ notifications: enabled });
    }
    async getSoundEnabled() {
        const settings = await this.getSettings();
        return settings.soundEnabled;
    }
    async setSoundEnabled(enabled) {
        await this.updateSettings({ soundEnabled: enabled });
    }
    async getAIFeatures() {
        const settings = await this.getSettings();
        return settings.aiFeatures;
    }
    async setAIFeatures(features) {
        const currentFeatures = await this.getAIFeatures();
        const updatedFeatures = { ...currentFeatures, ...features };
        await this.updateSettings({ aiFeatures: updatedFeatures });
    }
    async getAIConfig() {
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
    async saveAIConfig(config) {
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
    async resetToDefaults() {
        await this.saveSettings(this.defaultSettings);
        return this.defaultSettings;
    }
}
exports.SettingsService = SettingsService;
