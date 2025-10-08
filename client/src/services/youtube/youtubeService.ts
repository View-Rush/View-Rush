import { toast } from '@/hooks/use-toast';
import { logger } from '../utils/logger';
import { errorHandler } from '../utils/errorHandler';
import { popupOAuthHandler, OAuthResult } from '../utils/popupOAuth';
import { youtubeApiClient, YouTubeVideo } from './apiClient';
import { youtubeDatabaseService, YouTubeConnectionStatus } from './databaseService';

export interface ChannelAnalytics {
  subscriber_count: number;
  view_count: number;
  video_count: number;
  recent_videos: YouTubeVideo[];
  performance_metrics: {
    average_views_per_video: number;
    engagement_rate: number;
    upload_frequency: number;
    best_performing_time?: string;
    best_performing_day?: string;
    average_engagement_rate?: number;
  };
}

export class YouTubeService {
  private static instance: YouTubeService;
  
  private readonly CLIENT_ID = import.meta.env.VITE_YOUTUBE_CLIENT_ID;
  private readonly CLIENT_SECRET = import.meta.env.VITE_YOUTUBE_CLIENT_SECRET;
  private readonly REDIRECT_URI = import.meta.env.VITE_YOUTUBE_REDIRECT_URI || 
    `${window.location.origin}/auth/youtube/popup-callback`;
  private readonly SCOPES = [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube.force-ssl'
  ];

  private constructor() {
    this.validateConfiguration();
  }

  static getInstance(): YouTubeService {
    if (!YouTubeService.instance) {
      YouTubeService.instance = new YouTubeService();
    }
    return YouTubeService.instance;
  }

  private validateConfiguration(): void {
    const missingConfig: string[] = [];
    
    if (!this.CLIENT_ID) {
      missingConfig.push('VITE_YOUTUBE_CLIENT_ID');
    }
    if (!this.CLIENT_SECRET) {
      missingConfig.push('VITE_YOUTUBE_CLIENT_SECRET');
    }

    if (missingConfig.length > 0) {
      const error = errorHandler.createConfigError(
        `Missing YouTube configuration: ${missingConfig.join(', ')}`,
        { missingConfig }
      );
      logger.error('YouTubeService', error.message, { missingConfig });
      throw error;
    }

    logger.info('YouTubeService', 'Configuration validated successfully');
  }


//    Check if user has connected YouTube account
  async getConnectionStatus(): Promise<YouTubeConnectionStatus> {
    logger.info('YouTubeService', 'Checking connection status');
    
    try {
      const status = await youtubeDatabaseService.getConnectionStatus();
      console.log('Connection status:', status);
      return status;

    } catch (error) {
      throw errorHandler.handleError(error, 'YouTubeService');
    }
  }

  
// Connect YouTube account using popup OAuth flow   
  async connectAccount(): Promise<boolean> {
    logger.info('YouTubeService', 'Starting YouTube account connection');

    try {
      if (!this.CLIENT_ID || !this.CLIENT_SECRET) {
        throw errorHandler.createConfigError('YouTube configuration is incomplete');
      }

      // Open popup and get authorization code
      logger.debug('YouTubeService', 'Opening OAuth popup');
      const oauthResult: OAuthResult = await popupOAuthHandler.authenticate({
        clientId: this.CLIENT_ID,
        redirectUri: this.REDIRECT_URI,
        scopes: this.SCOPES
      });

      logger.debug('YouTubeService', 'OAuth popup completed successfully');

      // Exchange code for tokens
      logger.debug('YouTubeService', 'Exchanging authorization code for tokens');
      const tokenResponse = await youtubeApiClient.exchangeCodeForTokens(
        oauthResult.code,
        this.CLIENT_ID,
        this.CLIENT_SECRET,
        this.REDIRECT_URI
      );

      // Get channel information
      logger.debug('YouTubeService', 'Fetching channel information');
      const channelInfo = await youtubeApiClient.getChannelInfo(tokenResponse.access_token);

      // Check if the channel is already connected
      logger.debug('YouTubeService', 'Checking if channel is already connected');
      const existingConnections = await youtubeDatabaseService.getUserConnections();
      const existingConnection = existingConnections.find(
        connection => connection.channel_id === channelInfo.id
      );

      if (existingConnection) {
        logger.debug('YouTubeService', 'Channel already connected, activating it');
        await youtubeDatabaseService.updateConnectionStatus(existingConnection.id, true);

        // Deactivate other connections
        for (const connection of existingConnections) {
          if (connection.id !== existingConnection.id) {
        await youtubeDatabaseService.updateConnectionStatus(connection.id, false);
          }
        }
      } else {
        // Save new connection to database
        logger.debug('YouTubeService', 'Saving new connection to database');
        await youtubeDatabaseService.saveConnection(tokenResponse, channelInfo);

        // Deactivate other connections
        for (const connection of existingConnections) {
          await youtubeDatabaseService.updateConnectionStatus(connection.id, false);
        }
      }

      // Sync initial analytics (non-blocking)
      this.syncChannelAnalytics().catch(error => {
        logger.warn('YouTubeService', 'Initial analytics sync failed', { error });
      });

      toast({
        title: "YouTube Connected",
        description: `Successfully connected ${channelInfo.title}!`,
      });

      logger.info('YouTubeService', 'YouTube connection completed successfully', {
        channelId: channelInfo.id,
        channelTitle: channelInfo.title
      });
      return true;
    } catch (error) {
      logger.error('YouTubeService', 'YouTube connection failed', { error });
      throw errorHandler.handleError(error, 'YouTubeService');
    }
  }

   // Disconnect YouTube account
  async disconnectAccount(connectionId?: string): Promise<void> {
    logger.info('YouTubeService', 'Disconnecting YouTube account');

    try {
      const connections = await youtubeDatabaseService.getUserConnections();
      
      if (connections.length === 0) {
        throw errorHandler.createAuthError('No YouTube connections found');
      }

      // Use provided connectionId or default to the first active connection
      const targetConnectionId = connectionId || connections.find(c => c.is_active)?.id;
      
      if (!targetConnectionId) {
        throw errorHandler.createAuthError('No active connection to disconnect');
      }

      await youtubeDatabaseService.disconnectConnection(targetConnectionId);

      toast({
        title: "YouTube Disconnected",
        description: "Your YouTube account has been disconnected successfully.",
      });

      logger.info('YouTubeService', 'YouTube disconnection completed successfully');
    } catch (error) {
      throw errorHandler.handleError(error, 'YouTubeService');
    }
  }

  /**
   * Sync channel analytics
   */
  async syncChannelAnalytics(): Promise<void> {
    logger.info('YouTubeService', 'Starting analytics sync');

    try {
      const connectionStatus = await this.getConnectionStatus();
      
      if (!connectionStatus.isConnected || !connectionStatus.connection) {
        throw errorHandler.createAuthError('No active YouTube connection');
      }

      await this.syncSingleChannelAnalytics(connectionStatus.connection);
      
      logger.info('YouTubeService', 'Analytics sync completed successfully');
    } catch (error) {
      throw errorHandler.handleError(error, 'YouTubeService');
    }
  }

  /**
   * Get channel analytics for dashboard
   */
  async getChannelAnalytics(connectionId?: string, connections?: any[]): Promise<ChannelAnalytics | null> {
    logger.info('YouTubeService', 'Fetching channel analytics');

    try {
      // Use provided connections or fetch from database
      const userConnections = connections || await youtubeDatabaseService.getUserConnections();
      
      if (userConnections.length === 0) {
        return null;
      }

      const connection = connectionId 
        ? userConnections.find(c => c.id === connectionId)
        : userConnections.find(c => c.is_active) || userConnections[0];

      if (!connection) {
        return null;
      }

      // Get fresh data if connection is active
      if (connection.is_active) {
        await this.syncSingleChannelAnalytics(connection);
      }

      // Build analytics from stored metadata and fresh data
      const metadata = connection.metadata as any;
      const statistics = metadata?.statistics || {};

      const analytics: ChannelAnalytics = {
        subscriber_count: parseInt(statistics.subscriberCount || '0'),
        view_count: parseInt(statistics.viewCount || '0'),
        video_count: parseInt(statistics.videoCount || '0'),
        recent_videos: [], // Will be populated if we have an active connection
        performance_metrics: {
          average_views_per_video: 0,
          engagement_rate: 0,
          upload_frequency: 0,
        }
      };

      // Fetch recent videos if connection is active
      if (connection.is_active) {
        try {
          let tokens = await youtubeDatabaseService.getConnectionTokens(connection.id);
          // Check if token is expired and refresh if needed
          if (connection.token_expires_at && new Date(connection.token_expires_at) <= new Date()) {
            logger.warn('YouTubeService', 'Access token expired, attempting refresh', { connectionId: connection.id });
            if (tokens?.refresh_token) {
              const refreshed = await youtubeApiClient.refreshAccessToken(
                tokens.refresh_token,
                import.meta.env.VITE_YOUTUBE_CLIENT_ID,
                import.meta.env.VITE_YOUTUBE_CLIENT_SECRET
              );
              tokens.access_token = refreshed.access_token;
              // Update token_expires_at in DB (optional, for accuracy)
              // You may want to call a DB update here
            } else {
              throw new Error('No refresh token available for expired access token');
            }
          }
          if (tokens?.access_token) {
            const allVideos = await youtubeApiClient.getChannelVideos(
              tokens.access_token,
              connection.channel_id,
              20 // fetch more for better filtering
            );
            // Separate public and private/unlisted videos
            analytics.recent_videos = allVideos.filter(v => v.privacyStatus === 'public');
            analytics.private_unlisted_videos = allVideos.filter(v => v.privacyStatus === 'private' || v.privacyStatus === 'unlisted');
            analytics.performance_metrics = this.calculatePerformanceMetrics(analytics.recent_videos);
          }
        } catch (error) {
          logger.warn('YouTubeService', 'Failed to fetch recent videos', { error });
        }
      }

      return analytics;
    } catch (error) {
      throw errorHandler.handleError(error, 'YouTubeService', false);
    }
  }

  /**
   * Get trending videos
   */
  async getTrendingVideos(regionCode: string = 'US', categoryId?: string): Promise<any[]> {
    logger.info('YouTubeService', 'Fetching trending videos', { regionCode, categoryId });

    try {
      const connectionStatus = await this.getConnectionStatus();
      
      if (!connectionStatus.isConnected || !connectionStatus.connection) {
        throw errorHandler.createAuthError('YouTube connection required to fetch trending videos');
      }

      const tokens = await youtubeDatabaseService.getConnectionTokens(connectionStatus.connection.id);
      
      if (!tokens?.access_token) {
        throw errorHandler.createAuthError('No valid access token found');
      }

      return await youtubeApiClient.getTrendingVideos(
        tokens.access_token,
        regionCode,
        categoryId
      );
    } catch (error) {
      throw errorHandler.handleError(error, 'YouTubeService', false);
    }
  }

  /**
   * Get user's YouTube connections
   */
  async getUserConnections() {
    logger.info('YouTubeService', 'Fetching user connections');
    
    try {
      return await youtubeDatabaseService.getUserConnections();
    } catch (error) {
      throw errorHandler.handleError(error, 'YouTubeService', false);
    }
  }

  /**
   * Transform analytics data for Dashboard components
   */
  transformAnalyticsForDashboard(analytics: ChannelAnalytics | null) {
    if (!analytics) {
      return null;
    }

    const transformedVideos = analytics.recent_videos.map(video => ({
      id: video.id,
      title: video.title,
      views: parseInt(video.statistics?.viewCount || '0'),
      likes: parseInt(video.statistics?.likeCount || '0'),
      comments: parseInt(video.statistics?.commentCount || '0'),
      published_at: video.publishedAt,
    }));

    return {
      channel_stats: {
        subscriber_count: analytics.subscriber_count,
        total_views: analytics.view_count,
        total_videos: analytics.video_count,
        average_views_per_video: analytics.performance_metrics?.average_views_per_video || 0,
      },
      recent_videos: transformedVideos,
      performance_metrics: {
        ...analytics.performance_metrics,
        best_performing_time: analytics.performance_metrics?.best_performing_time || 'N/A',
        best_performing_day: analytics.performance_metrics?.best_performing_day || 'N/A',
        average_engagement_rate: analytics.performance_metrics?.engagement_rate || 0,
      },
    };
  }

  /**
   * Get analytics data formatted for Dashboard components
   */
  async getDashboardAnalytics(connectionId?: string, connections?: any[]) {
    logger.info('YouTubeService', 'Getting dashboard analytics');
    
    const rawAnalytics = await this.getChannelAnalytics(connectionId, connections);
    return this.transformAnalyticsForDashboard(rawAnalytics);
  }

  /**
   * Sync analytics for a single channel
   */
  private async syncSingleChannelAnalytics(connection: any): Promise<void> {
    logger.debug('YouTubeService', 'Syncing analytics for single connection', { connectionId: connection.id });

    try {
      const tokens = await youtubeDatabaseService.getConnectionTokens(connection.id);
      
      if (!tokens?.access_token) {
        logger.warn('YouTubeService', 'No access token available for sync', { connectionId: connection.id });
        return;
      }

      // Get fresh channel info
      const channelInfo = await youtubeApiClient.getChannelInfo(tokens.access_token);
      
      // Get recent videos for performance metrics
      const videos = await youtubeApiClient.getChannelVideos(
        tokens.access_token,
        connection.channel_id,
        50 // Get more videos for better metrics
      );

      const performanceMetrics = this.calculatePerformanceMetrics(videos);

      // Store analytics data
      await youtubeDatabaseService.storeAnalyticsData(connection.id, {
        subscriber_count: parseInt(channelInfo.statistics.subscriberCount || '0'),
        view_count: parseInt(channelInfo.statistics.viewCount || '0'),
        video_count: parseInt(channelInfo.statistics.videoCount || '0'),
        performance_metrics: performanceMetrics,
        raw_data: {
          channel_info: channelInfo,
          recent_videos: videos,
          sync_timestamp: new Date().toISOString()
        }
      });

      logger.debug('YouTubeService', 'Analytics sync completed for connection', { connectionId: connection.id });
    } catch (error) {
      logger.error('YouTubeService', 'Analytics sync failed for connection', {
        connectionId: connection.id,
        error
      });
      
      // Don't throw here to prevent one failed sync from stopping others
    }
  }

  /**
   * Calculate performance metrics from videos
   */
  private calculatePerformanceMetrics(videos: YouTubeVideo[]): any {
    logger.debug('YouTubeService', 'Calculating performance metrics', { videoCount: videos.length });

    if (videos.length === 0) {
      return {
        average_views_per_video: 0,
        engagement_rate: 0,
        upload_frequency: 0,
      };
    }

    const totalViews = videos.reduce((sum, video) => 
      sum + parseInt(video.statistics?.viewCount || '0'), 0);
    
    const totalLikes = videos.reduce((sum, video) => 
      sum + parseInt(video.statistics?.likeCount || '0'), 0);
    
    const totalComments = videos.reduce((sum, video) => 
      sum + parseInt(video.statistics?.commentCount || '0'), 0);

    const averageViews = totalViews / videos.length;
    const engagementRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;

    // Calculate upload frequency (videos per week over last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentVideos = videos.filter(video => 
      new Date(video.publishedAt) >= thirtyDaysAgo);
    
    const uploadFrequency = (recentVideos.length / 30) * 7; // Videos per week

    return {
      average_views_per_video: Math.round(averageViews),
      engagement_rate: Math.round(engagementRate * 100) / 100,
      upload_frequency: Math.round(uploadFrequency * 100) / 100,
    };
  }

  /**
   * Get channel summary for dashboard
   */
  async getChannelSummary(): Promise<any> {
    try {
      const connections = await this.getUserConnections();
      
      if (connections.length === 0) {
        return null;
      }

      const activeConnection = connections.find(c => c.is_active) || connections[0];
      
      return {
        id: activeConnection.channel_id,
        name: activeConnection.channel_name,
        handle: activeConnection.channel_handle,
        avatar_url: activeConnection.channel_avatar_url,
        is_connected: activeConnection.is_active,
        last_sync: activeConnection.last_sync_at,
        metadata: activeConnection.metadata
      };
    } catch (error) {
      throw errorHandler.handleError(error, 'YouTubeService', false);
    }
  }

  /**
   * Force cleanup of any popup windows (useful for component unmounting)
   */
  cleanup(): void {
    popupOAuthHandler.forceCleanup();
  }
}

export const youtubeService = YouTubeService.getInstance();