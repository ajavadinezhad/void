import { EmailMessage } from '@/shared/types';

interface AIConfig {
  openai: {
    apiKey: string;
    model: string;
  };
  claude: {
    apiKey: string;
    model: string;
  };
}

interface AIMessageRequest {
  message: string;
  context: string;
  model: 'openai' | 'claude';
  emails: EmailMessage[];
}

interface AIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class AIService {
  private config: AIConfig;

  constructor() {
    this.config = {
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: 'gpt-4'
      },
      claude: {
        apiKey: process.env.CLAUDE_API_KEY || '',
        model: 'claude-3-sonnet-20240229'
      }
    };
  }

  async sendMessage(request: AIMessageRequest): Promise<AIResponse> {
    if (request.model === 'openai') {
      return this.sendOpenAIMessage(request);
    } else {
      return this.sendClaudeMessage(request);
    }
  }

  private async sendOpenAIMessage(request: AIMessageRequest): Promise<AIResponse> {
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

  private async sendClaudeMessage(request: AIMessageRequest): Promise<AIResponse> {
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

  private buildSystemPrompt(emails: EmailMessage[]): string {
    const emailContext = emails.length > 0 
      ? `\n\nRecent emails for context:\n${emails.slice(0, 5).map(email => 
          `- ${email.subject} (from ${email.sender})`
        ).join('\n')}`
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

  async updateConfig(newConfig: Partial<AIConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): AIConfig {
    return this.config;
  }

  // Specialized email analysis methods
  async summarizeEmail(email: EmailMessage, model: 'openai' | 'claude' = 'openai'): Promise<string> {
    const request: AIMessageRequest = {
      message: 'Please provide a concise summary of this email, highlighting the key points, main topics, and any important information.',
      context: `Email Subject: ${email.subject}\nFrom: ${email.sender}\nDate: ${email.date.toLocaleString()}\nContent: ${email.body}`,
      model,
      emails: []
    };

    const response = await this.sendMessage(request);
    return response.content;
  }

  async draftReply(email: EmailMessage, model: 'openai' | 'claude' = 'openai'): Promise<string> {
    const request: AIMessageRequest = {
      message: 'Help me draft a professional and appropriate reply to this email. Consider the tone, context, and any questions or requests in the original email.',
      context: `Email Subject: ${email.subject}\nFrom: ${email.sender}\nDate: ${email.date.toLocaleString()}\nContent: ${email.body}`,
      model,
      emails: []
    };

    const response = await this.sendMessage(request);
    return response.content;
  }

  async extractActionItems(email: EmailMessage, model: 'openai' | 'claude' = 'openai'): Promise<string> {
    const request: AIMessageRequest = {
      message: 'Extract any action items, tasks, deadlines, or follow-ups mentioned in this email. List them clearly with any relevant details.',
      context: `Email Subject: ${email.subject}\nFrom: ${email.sender}\nDate: ${email.date.toLocaleString()}\nContent: ${email.body}`,
      model,
      emails: []
    };

    const response = await this.sendMessage(request);
    return response.content;
  }

  async analyzeTone(email: EmailMessage, model: 'openai' | 'claude' = 'openai'): Promise<string> {
    const request: AIMessageRequest = {
      message: 'Analyze the tone and sentiment of this email. Consider factors like formality, urgency, emotion, and overall communication style.',
      context: `Email Subject: ${email.subject}\nFrom: ${email.sender}\nDate: ${email.date.toLocaleString()}\nContent: ${email.body}`,
      model,
      emails: []
    };

    const response = await this.sendMessage(request);
    return response.content;
  }
}
