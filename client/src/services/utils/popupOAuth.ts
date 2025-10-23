import { logger } from './logger';
import { errorHandler, YouTubeAuthError } from './errorHandler';

export interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  state?: string;
}

export interface OAuthResult {
  code: string;
  state: string;
}

export class PopupOAuthHandler {
  private static instance: PopupOAuthHandler;
  private popup: Window | null = null;
  private messageListener: ((event: MessageEvent) => void) | null = null;

  private constructor() {}

  static getInstance(): PopupOAuthHandler {
    if (!PopupOAuthHandler.instance) {
      PopupOAuthHandler.instance = new PopupOAuthHandler();
    }
    return PopupOAuthHandler.instance;
  }



  async authenticate(config: OAuthConfig): Promise<OAuthResult> {

    return new Promise((resolve, reject) => {
      try {

        const state = config.state || this.generateState();
        

        const authUrl = this.buildAuthUrl(config, state);
        

        const popupFeatures = this.getPopupFeatures();
        

        this.popup = window.open(
          authUrl,
          'oauth_popup',
          popupFeatures
        );

        if (!this.popup) {
          throw errorHandler.createAuthError('Failed to open OAuth popup. Please check popup blocker settings.');
        }


        this.setupMessageListener(state, resolve, reject);


        this.monitorPopup(reject);

      } catch (error) {
        const processedError = errorHandler.handleError(error, 'PopupOAuth', false);
        reject(processedError);
      }
    });
  }

  

  private buildAuthUrl(config: OAuthConfig, state: string): string {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    
    authUrl.searchParams.set('client_id', config.clientId);
    authUrl.searchParams.set('redirect_uri', config.redirectUri);
    authUrl.searchParams.set('scope', config.scopes.join(' '));
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', state);

    return authUrl.toString();
  }



   
  private getPopupFeatures(): string {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    return `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,status=yes,location=yes`;
  }

  

   
  private setupMessageListener(
    expectedState: string,
    resolve: (result: OAuthResult) => void,
    reject: (error: Error) => void
  ): void {
    this.messageListener = (event: MessageEvent) => {

      if (!this.isValidOrigin(event.origin)) {
        return;
      }

      try {
        const data = event.data;
        
        if (data.type === 'OAUTH_SUCCESS') {
          if (data.state !== expectedState) {
            throw new YouTubeAuthError('OAuth state mismatch');
          }

          this.cleanup();
          resolve({
            code: data.code,
            state: data.state
          });
        } else if (data.type === 'OAUTH_ERROR') {
          logger.error('PopupOAuth', 'OAuth error received', { error: data.error });
          this.cleanup();
          reject(errorHandler.createAuthError(`OAuth error: ${data.error || 'Unknown error'}`));
        }
      } catch (error) {
        const processedError = errorHandler.handleError(error, 'PopupOAuth', false);
        this.cleanup();
        reject(processedError);
      }
    };

    window.addEventListener('message', this.messageListener);
  }

  

   
  private monitorPopup(reject: (error: Error) => void): void {
    const checkClosed = setInterval(() => {
      if (this.popup?.closed) {
        clearInterval(checkClosed);
        this.cleanup();
        reject(errorHandler.createAuthError('OAuth popup was closed by user'));
      }
    }, 1000);


    setTimeout(() => {
      clearInterval(checkClosed);
      if (this.popup && !this.popup.closed) {
        this.cleanup();
        reject(errorHandler.createAuthError('OAuth timeout'));
      }
    }, 5 * 60 * 1000);
  }

  


  private isValidOrigin(origin: string): boolean {
    const allowedOrigins = [
      window.location.origin,
      'https://accounts.google.com'
    ];
    
    return allowedOrigins.includes(origin);
  }




  private generateState(): string {
    return crypto.randomUUID();
  }

  

  private cleanup(): void {
    if (this.popup) {
      this.popup.close();
      this.popup = null;
    }

    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = null;
    }
  }




  public forceCleanup(): void {
    this.cleanup();
  }
}

export const popupOAuthHandler = PopupOAuthHandler.getInstance();
