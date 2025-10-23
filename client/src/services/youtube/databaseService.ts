import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { logger } from '../utils/logger';
import { errorHandler } from '../utils/errorHandler';
import { authHelper } from '@/services/authHelper';
import { DecryptedTokens, SecureTokenService } from '@/services/secureTokenService';
import { YouTubeChannel, TokenResponse } from './apiClient';

type ChannelConnection = Database['public']['Tables']['channel_connections']['Row'];

export interface ConnectionData {
  channel_avatar_url: string | null;
  channel_handle: string | null;
  channel_id: string;
  channel_name: string;
  metadata: {
    statistics: Record<string, any>;
    description: string;
    branding?: {
    channel: {
      title: string;
      description: string;
      keywords?: string;
      country?: string;
    };
  };
  };
  platform: string;
  scope_granted: string[];
  sync_status: string;
  token_expires_at: string;
  tokens_encrypted: boolean;
  user_id: string;
}

export interface YouTubeConnectionStatus {
  isConnected: boolean;
  connection?: ChannelConnection;
}

export class YouTubeDatabaseService {
  private static instance: YouTubeDatabaseService;

  private constructor() {}

  static getInstance(): YouTubeDatabaseService {
    if (!YouTubeDatabaseService.instance) {
      YouTubeDatabaseService.instance = new YouTubeDatabaseService();
    }
    return YouTubeDatabaseService.instance;
  }

  
 // Get current YouTube connection status for the authenticated user
   
  async getConnectionStatus(): Promise<YouTubeConnectionStatus> {

    try {
      const user = await authHelper.getUser();
      if (!user) {
        throw errorHandler.createAuthError('User not authenticated');
      }

      const { data: connections, error } = await supabase
        .from('channel_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'youtube')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

        

      if (error) {
        throw errorHandler.createDatabaseError('Failed to fetch connection status', error);
      }

      if (!connections || connections.length === 0) {
        return { isConnected: false };
      }

      const connection = connections[0];

      // Check if token has expired
      if (connection.token_expires_at && new Date(connection.token_expires_at) <= new Date()) {
        return { isConnected: false };
      }

      return {
        isConnected: true,
        connection
      };
    } catch (error) {
      throw errorHandler.handleError(error, 'YouTubeDB', false);
    }
  }


 // Save a new YouTube connection to the database
  async saveConnection(tokenData: TokenResponse, channelInfo: YouTubeChannel): Promise<ChannelConnection> {

    try {
      const user = await authHelper.getUser();
      if (!user) {
        throw errorHandler.createAuthError('User not authenticated');
      }

      // Deactivate existing connections
      await this.deactivateExistingConnections(user.id);

      // Calculate token expiration
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

      // Prepare connection data
      const connectionData: ConnectionData = {
        user_id: user.id,
        platform: 'youtube',
        channel_id: channelInfo.id,
        channel_name: channelInfo.title,
        channel_handle: channelInfo.customUrl || null,
        channel_avatar_url: channelInfo.thumbnails.high?.url || channelInfo.thumbnails.medium?.url || null,
        token_expires_at: expiresAt.toISOString(),
        scope_granted: tokenData.scope.split(' '),
        metadata: {
          statistics: channelInfo.statistics,
          description: channelInfo.description,
          branding: channelInfo.brandingSettings,
        },
        sync_status: 'pending',
        tokens_encrypted: true,
      };

    //  Insert connection
      const { data: insertedConnection, error: insertError } = await supabase
        .from('channel_connections')
        .insert(connectionData)
        .select('*')
        .single();

      if (insertError) {
        throw errorHandler.createDatabaseError('Failed to insert connection', insertError);
      }

      // Store encrypted tokens
      const tokenResult = await SecureTokenService.storeTokens(insertedConnection.id,
        tokenData
      );

      if (!tokenResult.success) {
        throw errorHandler.createDatabaseError('Failed to store tokens', tokenResult.error);
      }

      return insertedConnection;
    } catch (error) {
      throw errorHandler.handleError(error, 'YouTubeDB', false);
    }
  }

  /**
   * Update connection tokens
   */
  async updateConnectionTokens(
    connectionId: string,
    tokenData: Partial<TokenResponse>
  ): Promise<void> {

    try {
      // Update token expiration if provided
      if (tokenData.expires_in) {
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

        const { error } = await supabase
          .from('channel_connections')
          .update({ token_expires_at: expiresAt.toISOString() })
          .eq('id', connectionId);

        if (error) {
          throw errorHandler.createDatabaseError('Failed to update token expiration', error);
        }
      }

      // Update stored tokens
      const tokens: any = {};
      if (tokenData.access_token) tokens.access_token = tokenData.access_token;
      if (tokenData.refresh_token) tokens.refresh_token = tokenData.refresh_token;

      if (Object.keys(tokens).length > 0) {
        const tokenResult = await SecureTokenService.storeTokens(connectionId, tokens);
        if (!tokenResult.success) {
          throw errorHandler.createDatabaseError('Failed to update stored tokens', tokenResult.error);
        }
      }
    } catch (error) {
      throw errorHandler.handleError(error, 'YouTubeDB', false);
    }
  }

  /**
   * Get user's YouTube connections
   */
  async getUserConnections(): Promise<ChannelConnection[]> {

    try {
      const user = await authHelper.getUser();
      if (!user) {
        throw errorHandler.createAuthError('User not authenticated');
      }

      const { data: connections, error } = await supabase
        .from('channel_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'youtube')
        .order('created_at', { ascending: false });

      if (error) {
        throw errorHandler.createDatabaseError('Failed to fetch connections', error);
      }

      return connections || [];
    } catch (error) {
      throw errorHandler.handleError(error, 'YouTubeDB', false);
    }
  }

  /**
   * Disconnect (deactivate) a YouTube connection
   */
  async disconnectConnection(connectionId: string): Promise<void> {

    try {
      const user = await authHelper.getUser();
      if (!user) {
        throw errorHandler.createAuthError('User not authenticated');
      }

      const { error } = await supabase
        .from('channel_connections')
        .update({ 
          is_active: false,
        })
        .eq('id', connectionId)
        .eq('user_id', user.id);



      if (error) {
        throw errorHandler.createDatabaseError('Failed to disconnect connection', error);
      }

    } catch (error) {
      throw errorHandler.handleError(error, 'YouTubeDB', false);
    }
  }

  /**
   * Store analytics data using the database function
   */
  async storeAnalyticsData(
    connectionId: string,
    analyticsData: {
      subscriber_count: number;
      view_count: number;
      video_count: number;
      performance_metrics: any;
      raw_data?: any;
    }
  ): Promise<void> {

    try {
      const { error } = await (supabase as any).rpc('update_channel_analytics', {
        connection_uuid: connectionId,
        analytics_data: {
          subscriber_count: analyticsData.subscriber_count,
          view_count: analyticsData.view_count,
          video_count: analyticsData.video_count,
          performance_metrics: analyticsData.performance_metrics,
          raw_data: analyticsData.raw_data || {}
        }
      });

      if (error) {
        throw errorHandler.createDatabaseError('Failed to store analytics data', error);
      }

    } catch (error) {
      throw errorHandler.handleError(error, 'YouTubeDB', false);
    }
  }

  /**
   * Get stored tokens for a connection
   */
  async getConnectionTokens(connectionId: string): Promise<DecryptedTokens | null> {
    try {
      const tokens = await SecureTokenService.getTokens(connectionId);
      
      if (!tokens) {
        return null;
      }

      return tokens;
    } catch (error) {
      logger.error('YouTubeDB', 'Error retrieving tokens', { error, connectionId });
      return null;
    }
  }

  async updateConnectionStatus(connectionId: string, isActive: boolean): Promise<void> {

    try {
      const { error } = await supabase
        .from('channel_connections')
        .update({ is_active: isActive })
        .eq('id', connectionId);

      if (error) {
        throw errorHandler.createDatabaseError('Failed to update connection status', error);
      }

    } catch (error) {
      throw errorHandler.handleError(error, 'YouTubeDB', false);
    }
  }

//  Deactivate existing YouTube connections for a user
  private async deactivateExistingConnections(userId: string): Promise<void> {
    const { error } = await supabase
      .from('channel_connections')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('platform', 'youtube');


    if (error) {
      }
  }
}

export const youtubeDatabaseService = YouTubeDatabaseService.getInstance();
