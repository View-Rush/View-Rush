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


//    Opens a popup window for OAuth authentication
  async authenticate(config: OAuthConfig): Promise<OAuthResult> {
    logger.info('PopupOAuth', 'Starting popup OAuth authentication');

    return new Promise((resolve, reject) => {
      try {
        // Generate state if not provided
        const state = config.state || this.generateState();
        
        // Build OAuth URL
        const authUrl = this.buildAuthUrl(config, state);
        
        // Calculate popup dimensions
        const popupFeatures = this.getPopupFeatures();
        
        // Open popup
        this.popup = window.open(
          authUrl,
          'oauth_popup',
          popupFeatures
        );

        if (!this.popup) {
          throw errorHandler.createAuthError('Failed to open OAuth popup. Please check popup blocker settings.');
        }

        logger.debug('PopupOAuth', 'Popup window opened', { url: authUrl });

        // Set up message listener for popup communication
        this.setupMessageListener(state, resolve, reject);

        // Set up popup monitoring
        this.monitorPopup(reject);

      } catch (error) {
        const processedError = errorHandler.handleError(error, 'PopupOAuth', false);
        reject(processedError);
      }
    });
  }

  
// Builds the OAuth authorization URL
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


//  Generates popup window features string
   
  private getPopupFeatures(): string {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    return `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,status=yes,location=yes`;
  }

  
// Sets up message listener for receiving OAuth response
   
  private setupMessageListener(
    expectedState: string,
    resolve: (result: OAuthResult) => void,
    reject: (error: Error) => void
  ): void {
    this.messageListener = (event: MessageEvent) => {
      logger.debug('PopupOAuth', 'Received message from popup', { origin: event.origin });

      // Verify origin
      if (!this.isValidOrigin(event.origin)) {
        logger.warn('PopupOAuth', 'Invalid origin received', { origin: event.origin });
        return;
      }

      try {
        const data = event.data;
        
        if (data.type === 'OAUTH_SUCCESS') {
          if (data.state !== expectedState) {
            throw new YouTubeAuthError('OAuth state mismatch');
          }

          logger.info('PopupOAuth', 'OAuth success received');
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

  
//    Monitors popup window and handles closure
   
  private monitorPopup(reject: (error: Error) => void): void {
    const checkClosed = setInterval(() => {
      if (this.popup?.closed) {
        clearInterval(checkClosed);
        logger.info('PopupOAuth', 'Popup window was closed');
        this.cleanup();
        reject(errorHandler.createAuthError('OAuth popup was closed by user'));
      }
    }, 1000);

    // Cleanup interval after 5 minutes
    setTimeout(() => {
      clearInterval(checkClosed);
      if (this.popup && !this.popup.closed) {
        logger.warn('PopupOAuth', 'OAuth timeout reached');
        this.cleanup();
        reject(errorHandler.createAuthError('OAuth timeout'));
      }
    }, 5 * 60 * 1000);
  }

  
//    Validates the origin of received messages

  private isValidOrigin(origin: string): boolean {
    const allowedOrigins = [
      window.location.origin,
      'https://accounts.google.com'
    ];
    
    return allowedOrigins.includes(origin);
  }


// Generates a secure state parameter

  private generateState(): string {
    return crypto.randomUUID();
  }

  
//  Cleans up popup and event listeners
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


    // Forces cleanup (useful for component unmounting)

  public forceCleanup(): void {
    this.cleanup();
  }
}

export const popupOAuthHandler = PopupOAuthHandler.getInstance();