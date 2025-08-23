"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
class AIService {
    constructor(settingsService) {
        this.settingsService = settingsService;
        this.config = {
            openai: {
                apiKey: process.env.OPENAI_API_KEY || '',
                model: 'gpt-5'
            },
            claude: {
                apiKey: process.env.CLAUDE_API_KEY || '',
                model: 'claude-3-sonnet-20240229'
            },
            ollama: {
                baseUrl: 'http://localhost:11434',
                model: 'llama3.2'
            },
            huggingface: {
                apiKey: process.env.HUGGINGFACE_API_KEY || '',
                model: 'microsoft/DialoGPT-medium'
            },
            cohere: {
                apiKey: process.env.COHERE_API_KEY || '',
                model: 'command'
            },
            groq: {
                apiKey: process.env.GROQ_API_KEY || '',
                model: 'llama3-8b-8192'
            },
            together: {
                apiKey: process.env.TOGETHER_API_KEY || '',
                model: 'togethercomputer/llama-3.1-8b-instruct'
            }
        };
    }
    async loadConfig() {
        try {
            const savedConfig = await this.settingsService.getAIConfig();
            console.log('AIService: Loading config:', savedConfig);
            if (savedConfig) {
                this.config = {
                    ...this.config,
                    ...savedConfig
                };
                console.log('AIService: Updated config:', this.config);
            }
        }
        catch (error) {
            console.error('Failed to load AI config:', error);
        }
    }
    async sendMessage(request) {
        // Ensure we have the latest config
        await this.loadConfig();
        console.log('AIService: sendMessage called with model:', request.model);
        console.log('AIService: Current config:', this.config);
        switch (request.model) {
            case 'openai':
                console.log('AIService: Routing to OpenAI');
                return this.sendOpenAIMessage(request);
            case 'claude':
                console.log('AIService: Routing to Claude');
                return this.sendClaudeMessage(request);
            case 'ollama':
                console.log('AIService: Routing to Ollama');
                return this.sendOllamaMessage(request);
            case 'huggingface':
                console.log('AIService: Routing to Hugging Face');
                return this.sendHuggingFaceMessage(request);
            case 'cohere':
                console.log('AIService: Routing to Cohere');
                return this.sendCohereMessage(request);
            case 'groq':
                console.log('AIService: Routing to Groq');
                return this.sendGroqMessage(request);
            case 'together':
                console.log('AIService: Routing to Together AI');
                return this.sendTogetherMessage(request);
            default:
                console.log('AIService: Unsupported model:', request.model);
                throw new Error(`Unsupported AI model: ${request.model}`);
        }
    }
    async sendOpenAIMessage(request) {
        if (!this.config.openai.apiKey) {
            throw new Error('OpenAI API key not configured');
        }
        const systemPrompt = this.buildSystemPrompt(request.emails);
        const userPrompt = `${request.context}\n\nUser Question: ${request.message}`;
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.openai.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.openai.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: 2000,
                temperature: 0.7
            })
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error: ${response.status} - ${error}`);
        }
        const data = await response.json();
        return {
            content: data.choices[0].message.content,
            usage: data.usage
        };
    }
    async sendClaudeMessage(request) {
        if (!this.config.claude.apiKey) {
            throw new Error('Claude API key not configured');
        }
        const systemPrompt = this.buildSystemPrompt(request.emails);
        const userPrompt = `${request.context}\n\nUser Question: ${request.message}`;
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.config.claude.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.config.claude.model,
                max_tokens: 2000,
                messages: [
                    { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
                ]
            })
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Claude API error: ${response.status} - ${error}`);
        }
        const data = await response.json();
        return {
            content: data.content[0].text,
            usage: data.usage
        };
    }
    async sendOllamaMessage(request) {
        const systemPrompt = this.buildSystemPrompt(request.emails);
        const userPrompt = `${request.context}\n\nUser Question: ${request.message}`;
        const response = await fetch(`${this.config.ollama.baseUrl}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.config.ollama.model,
                prompt: `${systemPrompt}\n\n${userPrompt}`,
                stream: false
            })
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Ollama API error: ${response.status} - ${error}`);
        }
        const data = await response.json();
        return {
            content: data.response,
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
        };
    }
    async sendHuggingFaceMessage(request) {
        if (!this.config.huggingface.apiKey) {
            throw new Error('Hugging Face API key not configured');
        }
        const systemPrompt = this.buildSystemPrompt(request.emails);
        const userPrompt = `${request.context}\n\nUser Question: ${request.message}`;
        const response = await fetch(`https://api-inference.huggingface.co/models/${this.config.huggingface.model}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.huggingface.apiKey}`
            },
            body: JSON.stringify({
                inputs: `${systemPrompt}\n\n${userPrompt}`,
                parameters: {
                    max_new_tokens: 2000,
                    temperature: 0.7
                }
            })
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Hugging Face API error: ${response.status} - ${error}`);
        }
        const data = await response.json();
        return {
            content: Array.isArray(data) ? data[0].generated_text : data.generated_text,
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
        };
    }
    async sendCohereMessage(request) {
        if (!this.config.cohere.apiKey) {
            throw new Error('Cohere API key not configured');
        }
        const systemPrompt = this.buildSystemPrompt(request.emails);
        const userPrompt = `${request.context}\n\nUser Question: ${request.message}`;
        const response = await fetch('https://api.cohere.ai/v1/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.cohere.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.cohere.model,
                prompt: `${systemPrompt}\n\n${userPrompt}`,
                max_tokens: 2000,
                temperature: 0.7
            })
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Cohere API error: ${response.status} - ${error}`);
        }
        const data = await response.json();
        return {
            content: data.generations[0].text,
            usage: data.meta
        };
    }
    async sendGroqMessage(request) {
        console.log('AIService: sendGroqMessage called');
        console.log('AIService: Groq config:', this.config.groq);
        if (!this.config.groq.apiKey) {
            console.log('AIService: Groq API key not configured');
            throw new Error('Groq API key not configured');
        }
        console.log('AIService: Groq API key found, making request');
        const systemPrompt = this.buildSystemPrompt(request.emails);
        const userPrompt = `${request.context}\n\nUser Question: ${request.message}`;
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.groq.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.groq.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: 2000,
                temperature: 0.7
            })
        });
        if (!response.ok) {
            const error = await response.text();
            console.log('AIService: Groq API error:', response.status, error);
            throw new Error(`Groq API error: ${response.status} - ${error}`);
        }
        const data = await response.json();
        console.log('AIService: Groq API success');
        return {
            content: data.choices[0].message.content,
            usage: data.usage
        };
    }
    async sendTogetherMessage(request) {
        if (!this.config.together.apiKey) {
            throw new Error('Together AI API key not configured');
        }
        const systemPrompt = this.buildSystemPrompt(request.emails);
        const userPrompt = `${request.context}\n\nUser Question: ${request.message}`;
        const response = await fetch('https://api.together.xyz/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.together.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.together.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: 2000,
                temperature: 0.7
            })
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Together AI API error: ${response.status} - ${error}`);
        }
        const data = await response.json();
        return {
            content: data.choices[0].message.content,
            usage: data.usage
        };
    }
    buildSystemPrompt(emails) {
        const emailContext = emails.length > 0
            ? `\n\nRecent emails for context:\n${emails.slice(0, 5).map(email => `- ${email.subject} (from ${email.sender})`).join('\n')}`
            : '';
        return `You are an intelligent email assistant that helps users manage and analyze their emails. You can:

1. **Summarize emails** - Extract key points, main topics, and important information
2. **Draft responses** - Help compose professional, contextual replies
3. **Extract action items** - Identify tasks, deadlines, and follow-ups
4. **Analyze tone** - Assess the sentiment and tone of emails
5. **Organize information** - Help categorize and prioritize emails
6. **Provide insights** - Offer suggestions for email management and communication

Guidelines:
- Be concise but thorough
- Maintain professional tone
- Provide actionable insights
- Consider email context and relationships
- Suggest improvements when appropriate
- Be helpful and supportive

${emailContext}

Please provide helpful, contextual responses based on the email content and user's request.`;
    }
    async updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        await this.settingsService.saveAIConfig(this.config);
    }
    async getConfig() {
        await this.loadConfig();
        return this.config;
    }
    // Specialized email analysis methods
    async summarizeEmail(email, model = 'openai') {
        const request = {
            message: 'Please provide a concise summary of this email, highlighting the key points, main topics, and any important information.',
            context: `Email Subject: ${email.subject}\nFrom: ${email.sender}\nDate: ${email.date.toLocaleString()}\nContent: ${email.body}`,
            model,
            emails: []
        };
        const response = await this.sendMessage(request);
        return response.content;
    }
    async draftReply(email, model = 'openai') {
        const request = {
            message: 'Help me draft a professional and appropriate reply to this email. Consider the tone, context, and any questions or requests in the original email.',
            context: `Email Subject: ${email.subject}\nFrom: ${email.sender}\nDate: ${email.date.toLocaleString()}\nContent: ${email.body}`,
            model,
            emails: []
        };
        const response = await this.sendMessage(request);
        return response.content;
    }
    async extractActionItems(email, model = 'openai') {
        const request = {
            message: 'Extract any action items, tasks, deadlines, or follow-ups mentioned in this email. List them clearly with any relevant details.',
            context: `Email Subject: ${email.subject}\nFrom: ${email.sender}\nDate: ${email.date.toLocaleString()}\nContent: ${email.body}`,
            model,
            emails: []
        };
        const response = await this.sendMessage(request);
        return response.content;
    }
    async analyzeTone(email, model = 'openai') {
        const request = {
            message: 'Analyze the tone and sentiment of this email. Consider factors like formality, urgency, emotion, and overall communication style.',
            context: `Email Subject: ${email.subject}\nFrom: ${email.sender}\nDate: ${email.date.toLocaleString()}\nContent: ${email.body}`,
            model,
            emails: []
        };
        const response = await this.sendMessage(request);
        return response.content;
    }
}
exports.AIService = AIService;
