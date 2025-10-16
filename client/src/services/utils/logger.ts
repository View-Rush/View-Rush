// Logger utility for consistent logging throughout the application
// In production, only errors are logged to console
// Consider integrating with a logging service for production monitoring

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

class Logger {
  private static instance: Logger;
  private isDevelopment = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(level: LogLevel, component: string, message: string, data?: any): void {
    // In production, only log errors to console
    // Other logs should be sent to a logging service
    if (this.isProduction && level !== LogLevel.ERROR) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${component}]`;
    
    const logMethod = console[level as keyof Pick<Console, 'debug' | 'info' | 'warn' | 'error'>] || console.log;
    
    if (data) {
      // Sanitize data to avoid logging sensitive information
      const sanitizedData = this.sanitizeData(data);
      logMethod(`${prefix} ${message}`, sanitizedData);
    } else {
      logMethod(`${prefix} ${message}`);
    }
  }

  private sanitizeData(data: any): any {
    // Remove sensitive fields from logging
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      const sensitiveFields = ['password', 'token', 'access_token', 'refresh_token', 'apiKey', 'secret'];
      
      for (const field of sensitiveFields) {
        if (field in sanitized) {
          sanitized[field] = '[REDACTED]';
        }
      }
      return sanitized;
    }
    return data;
  }

  debug(component: string, message: string, data?: any): void {
    if (this.isDevelopment) {
      this.formatMessage(LogLevel.DEBUG, component, message, data);
    }
  }

  info(component: string, message: string, data?: any): void {
    if (this.isDevelopment) {
      this.formatMessage(LogLevel.INFO, component, message, data);
    }
  }

  warn(component: string, message: string, data?: any): void {
    this.formatMessage(LogLevel.WARN, component, message, data);
  }

  error(component: string, message: string, data?: any): void {
    this.formatMessage(LogLevel.ERROR, component, message, data);
  }
}

export const logger = Logger.getInstance();