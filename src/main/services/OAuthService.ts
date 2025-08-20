import { OAuth2Config } from '@/shared/types';
import * as fs from 'fs';
import * as path from 'path';
import { createServer, Server } from 'http';
import { URL } from 'url';

export class OAuthService {
  private oauthConfigs: Record<string, OAuth2Config> = {};

  constructor() {
    console.log('OAuthService constructor called');
    this.loadOAuthConfigs();
    console.log('OAuthService initialization complete');
  }

  private loadOAuthConfigs() {
    try {
      // Load Google OAuth credentials from config file
      const configPath = path.join(__dirname, '../config/oauth.json');
      console.log('Loading OAuth config from:', configPath);
      console.log('__dirname is:', __dirname);
      console.log('File exists:', fs.existsSync(configPath));
      
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      console.log('Loaded OAuth config data:', configData);
      console.log('Client ID from config:', configData.installed.client_id);
      
      this.oauthConfigs = {
        gmail: {
          clientId: configData.installed.client_id,
          clientSecret: configData.installed.client_secret,
          redirectUri: configData.installed.redirect_uris[0],
          scopes: [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
          ]
        },
        outlook: {
          clientId: process.env.OUTLOOK_CLIENT_ID || '',
          clientSecret: process.env.OUTLOOK_CLIENT_SECRET || '',
          redirectUri: 'http://localhost:3000/auth/callback',
          scopes: [
            'https://graph.microsoft.com/Mail.ReadWrite',
            'https://graph.microsoft.com/Mail.Send'
          ]
        }
      };
    } catch (error) {
      console.error('Failed to load OAuth configs:', error);
      // Fallback to environment variables
      this.oauthConfigs = {
        gmail: {
          clientId: process.env.GMAIL_CLIENT_ID || '',
          clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
          redirectUri: 'urn:ietf:wg:oauth:2.0:oob',
          scopes: [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
          ]
        },
        outlook: {
          clientId: process.env.OUTLOOK_CLIENT_ID || '',
          clientSecret: process.env.OUTLOOK_CLIENT_SECRET || '',
          redirectUri: 'http://localhost:3000/auth/callback',
          scopes: [
            'https://graph.microsoft.com/Mail.ReadWrite',
            'https://graph.microsoft.com/Mail.Send'
          ]
        }
      };
    }
  }

  getAuthUrl(provider: string): string {
    console.log('getAuthUrl called for provider:', provider);
    console.log('Available configs:', Object.keys(this.oauthConfigs));
    
    const config = this.oauthConfigs[provider];
    if (!config) {
      console.error('No config found for provider:', provider);
      throw new Error(`Unsupported provider: ${provider}`);
    }

    console.log(`Generating auth URL for ${provider}:`, {
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      scopes: config.scopes
    });

    switch (provider) {
      case 'gmail':
        return this.getGmailAuthUrl(config);
      case 'outlook':
        return this.getOutlookAuthUrl(config);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  async getAuthUrlWithLocalServer(provider: string): Promise<string> {
    console.log('getAuthUrlWithLocalServer called for provider:', provider);
    
    const config = this.oauthConfigs[provider];
    if (!config) {
      console.error('No config found for provider:', provider);
      throw new Error(`Unsupported provider: ${provider}`);
    }

    // Use localhost redirect URI for local server
    const localRedirectUri = 'http://localhost:3001/auth/callback';
    
    console.log(`Generating auth URL for ${provider} with local server:`, {
      clientId: config.clientId,
      redirectUri: localRedirectUri,
      scopes: config.scopes
    });

    switch (provider) {
      case 'gmail':
        return this.getGmailAuthUrl({ ...config, redirectUri: localRedirectUri });
      case 'outlook':
        return this.getOutlookAuthUrl({ ...config, redirectUri: localRedirectUri });
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  async handleCallback(code: string, provider: string): Promise<any> {
    const config = this.oauthConfigs[provider];
    if (!config) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    switch (provider) {
      case 'gmail':
        return this.handleGmailCallback(code, config);
      case 'outlook':
        return this.handleOutlookCallback(code, config);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  async handleOAuthFlow(provider: string): Promise<any> {
    console.log('handleOAuthFlow called for provider:', provider);
    
    return new Promise((resolve, reject) => {
      let server: Server;
      
      const cleanup = () => {
        if (server) {
          server.close();
        }
      };

      // Create local server to handle OAuth callback
      server = createServer((req, res) => {
        const url = new URL(req.url!, `http://${req.headers.host}`);
        
        if (url.pathname === '/auth/callback') {
          const code = url.searchParams.get('code');
          const error = url.searchParams.get('error');
          
          if (error) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body>
                  <h1>Authentication Failed</h1>
                  <p>Error: ${error}</p>
                  <p>You can close this window and try again.</p>
                </body>
              </html>
            `);
            cleanup();
            reject(new Error(`OAuth error: ${error}`));
            return;
          }
          
          if (code) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body>
                  <h1>Authentication Successful!</h1>
                  <p>You can close this window and return to the app.</p>
                </body>
              </html>
            `);
            
            // Handle the callback
            this.handleCallback(code, provider)
              .then(result => {
                cleanup();
                resolve(result);
              })
              .catch(error => {
                cleanup();
                reject(error);
              });
          } else {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body>
                  <h1>Authentication Error</h1>
                  <p>No authorization code received.</p>
                  <p>You can close this window and try again.</p>
                </body>
              </html>
            `);
            cleanup();
            reject(new Error('No authorization code received'));
          }
        } else {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body>
                <h1>Not Found</h1>
                <p>This page is not available.</p>
              </body>
            </html>
          `);
        }
      });

      server.listen(3001, () => {
        console.log('OAuth callback server listening on port 3001');
        
        // Get auth URL and open it in the default browser
        this.getAuthUrlWithLocalServer(provider)
          .then(authUrl => {
            console.log('Opening OAuth URL in browser:', authUrl);
            // We still need to open the browser for OAuth, but it will redirect back to our local server
            const { shell } = require('electron');
            shell.openExternal(authUrl);
          })
          .catch(error => {
            cleanup();
            reject(error);
          });
      });

      server.on('error', (error) => {
        cleanup();
        reject(error);
      });
    });
  }

  private getGmailAuthUrl(config: OAuth2Config): string {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    console.log('Generated Gmail auth URL:', authUrl);
    console.log('URL params:', Object.fromEntries(params));

    return authUrl;
  }

  private getOutlookAuthUrl(config: OAuth2Config): string {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(' '),
      response_type: 'code',
      response_mode: 'query'
    });

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }

  private async handleGmailCallback(code: string, config: OAuth2Config): Promise<any> {
    console.log('Handling Gmail callback with code:', code.substring(0, 10) + '...');
    console.log('Using redirect URI:', config.redirectUri);
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
      }),
    });

    console.log('Token response status:', tokenResponse.status);
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      throw new Error(`Failed to exchange code for token: ${tokenResponse.status} ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful, access token received');
    
    // Fetch user profile information using the access token
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    console.log('Profile response status:', profileResponse.status);
    
    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error('Profile fetch failed:', errorText);
      throw new Error(`Failed to fetch user profile: ${profileResponse.status} ${errorText}`);
    }

    const profileData = await profileResponse.json();
    console.log('Profile fetch successful:', profileData.email);
    
    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
      user: {
        email: profileData.email,
        name: profileData.name,
        picture: profileData.picture
      }
    };
  }

  private async handleOutlookCallback(code: string, config: OAuth2Config): Promise<any> {
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type
    };
  }

  async refreshToken(refreshToken: string, provider: string): Promise<any> {
    const config = this.oauthConfigs[provider];
    if (!config) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    switch (provider) {
      case 'gmail':
        return this.refreshGmailToken(refreshToken, config);
      case 'outlook':
        return this.refreshOutlookToken(refreshToken, config);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private async refreshGmailToken(refreshToken: string, config: OAuth2Config): Promise<any> {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to refresh token');
    }

    const tokenData = await tokenResponse.json();
    return {
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type
    };
  }

  private async refreshOutlookToken(refreshToken: string, config: OAuth2Config): Promise<any> {
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to refresh token');
    }

    const tokenData = await tokenResponse.json();
    return {
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type
    };
  }
}
