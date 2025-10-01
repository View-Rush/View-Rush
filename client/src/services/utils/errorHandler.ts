import { toast } from '@/hooks/use-toast';
import { logger } from './logger';

export class YouTubeServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'YouTubeServiceError';
  }
}

export class YouTubeAuthError extends YouTubeServiceError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'AUTH_ERROR', context);
    this.name = 'YouTubeAuthError';
  }
}

export class YouTubeApiError extends YouTubeServiceError {
  constructor(
    message: string,
    public statusCode?: number,
    public apiResponse?: any,
    context?: Record<string, any>
  ) {
    super(message, 'API_ERROR', { ...context, statusCode, apiResponse });
    this.name = 'YouTubeApiError';
  }
}

export class YouTubeDatabaseError extends YouTubeServiceError {
  constructor(message: string, public originalError?: any, context?: Record<string, any>) {
    super(message, 'DATABASE_ERROR', { ...context, originalError });
    this.name = 'YouTubeDatabaseError';
  }
}

export class YouTubeConfigError extends YouTubeServiceError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'CONFIG_ERROR', context);
    this.name = 'YouTubeConfigError';
  }
}

export class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  handleError(error: unknown, component: string, showToast = true): YouTubeServiceError {
    let processedError: YouTubeServiceError;

    if (error instanceof YouTubeServiceError) {
      processedError = error;
    } else if (error instanceof Error) {
      processedError = new YouTubeServiceError(
        error.message,
        'GENERIC_ERROR',
        { originalError: error }
      );
    } else {
      processedError = new YouTubeServiceError(
        'An unknown error occurred',
        'UNKNOWN_ERROR',
        { originalError: error }
      );
    }

    logger.error(component, processedError.message, {
      code: processedError.code,
      context: processedError.context
    });

    if (showToast) {
      this.showErrorToast(processedError);
    }

    return processedError;
  }

  private showErrorToast(error: YouTubeServiceError): void {
    const friendlyMessages: Record<string, string> = {
      AUTH_ERROR: 'Authentication failed. Please try connecting again.',
      API_ERROR: 'YouTube API error. Please try again later.',
      DATABASE_ERROR: 'Database error. Please contact support if this continues.',
      CONFIG_ERROR: 'Configuration error. Please check your settings.',
      GENERIC_ERROR: 'An error occurred. Please try again.',
      UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
    };

    const description = friendlyMessages[error.code] || error.message;

    toast({
      title: "YouTube Service Error",
      description,
      variant: "destructive",
    });
  }

  createAuthError(message: string, context?: Record<string, any>): YouTubeAuthError {
    return new YouTubeAuthError(message, context);
  }

  createApiError(
    message: string,
    statusCode?: number,
    apiResponse?: any,
    context?: Record<string, any>
  ): YouTubeApiError {
    return new YouTubeApiError(message, statusCode, apiResponse, context);
  }

  createDatabaseError(
    message: string,
    originalError?: any,
    context?: Record<string, any>
  ): YouTubeDatabaseError {
    return new YouTubeDatabaseError(message, originalError, context);
  }

  createConfigError(message: string, context?: Record<string, any>): YouTubeConfigError {
    return new YouTubeConfigError(message, context);
  }
}

export const errorHandler = ErrorHandler.getInstance();