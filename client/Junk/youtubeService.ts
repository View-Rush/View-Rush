// // YouTube API integration service with Supabase backend
// import { supabase } from '@/integrations/supabase/client';
// import { toast } from '@/hooks/use-toast';
// import type { Database } from '@/integrations/supabase/types';

// type ChannelConnection = Database['public']['Tables']['channel_connections']['Row'];
// type ChannelConnectionInsert = Database['public']['Tables']['channel_connections']['Insert'];
// type AnalyticsData = Database['public']['Tables']['analytics_data']['Row'];

// export interface YouTubeChannel {
//   id: string;
//   title: string;
//   customUrl?: string;
//   description: string;
//   thumbnails: {
//     default: { url: string };
//     medium: { url: string };
//     high: { url: string };
//   };
//   statistics: {
//     viewCount: string;
//     subscriberCount: string;
//     videoCount: string;
//   };
//   brandingSettings?: {
//     channel: {
//       title: string;
//       description: string;
//       keywords?: string;
//       country?: string;
//     };
//   };
// }

// export interface YouTubeVideo {
//   id: string;
//   title: string;
//   description: string;
//   thumbnails: {
//     default: { url: string };
//     medium: { url: string };
//     high: { url: string };
//   };
//   statistics: {
//     viewCount: string;
//     likeCount: string;
//     commentCount: string;
//   };
//   publishedAt: string;
// }

// export interface YouTubeConnectionStatus {
//   isConnected: boolean;
//   connection?: ChannelConnection;
//   channel?: YouTubeChannel;
// }

// export interface ChannelAnalytics {
//   subscriber_count: number;
//   view_count: number;
//   video_count: number;
//   recent_videos: YouTubeVideo[];
//   performance_metrics: {
//     average_views_per_video: number;
//     engagement_rate: number;
//     upload_frequency: number;
//   };
// }

// class YouTubeService {
//   private readonly CLIENT_ID = import.meta.env.VITE_YOUTUBE_CLIENT_ID;
//   private readonly CLIENT_SECRET = import.meta.env.VITE_YOUTUBE_CLIENT_SECRET;
//   private readonly REDIRECT_URI = import.meta.env.VITE_YOUTUBE_REDIRECT_URI || `${window.location.origin}/auth/youtube/callback`;
//   private readonly SCOPES = [
//     'https://www.googleapis.com/auth/youtube.readonly',
//     'https://www.googleapis.com/auth/youtube.force-ssl'
//   ].join(' ');

//   constructor() {
//     this.validateConfiguration();
//   }

//   private validateConfiguration() {
//     if (!this.CLIENT_ID) {
//       console.error('YouTube Client ID is not configured. Please set VITE_YOUTUBE_CLIENT_ID in your .env file');
//     }
//     if (!this.CLIENT_SECRET) {
//       console.error('YouTube Client Secret is not configured. Please set VITE_YOUTUBE_CLIENT_SECRET in your .env file');
//     }
//     console.log('YouTube Service Configuration:', {
//       clientId: this.CLIENT_ID ? 'Present' : 'Missing',
//       clientSecret: this.CLIENT_SECRET ? 'Present' : 'Missing',
//       redirectUri: this.REDIRECT_URI
//     });
//   }

//   // Check if user has connected YouTube account
//   async getConnectionStatus(): Promise<YouTubeConnectionStatus> {
//     try {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) {
//         return { isConnected: false };
//       }

//       const { data: connections, error } = await supabase
//         .from('channel_connections')
//         .select('*')
//         .eq('user_id', user.id)
//         .eq('platform', 'youtube')
//         .eq('is_active', true)
//         .order('created_at', { ascending: false })
//         .limit(1);

//       if (error) {
//         console.error('Error fetching YouTube connection:', error);
//         return { isConnected: false };
//       }

//       if (!connections || connections.length === 0) {
//         return { isConnected: false };
//       }

//       const connection = connections[0];
      
//       // Check if token has expired
//       if (connection.token_expires_at) {
//         const expiresAt = new Date(connection.token_expires_at);
//         const now = new Date();
        
//         if (now >= expiresAt) {
//           // Try to refresh token
//           const refreshed = await this.refreshToken(connection);
//           if (!refreshed) {
//             await this.disconnectAccount(connection.id);
//             return { isConnected: false };
//           }
//         }
//       }

//       return {
//         isConnected: true,
//         connection
//       };
//     } catch (error) {
//       console.error('Error checking YouTube connection status:', error);
//       return { isConnected: false };
//     }
//   }

//   // Start YouTube OAuth flow
//   async connectAccount(): Promise<void> {
//     try {
//       if (!this.CLIENT_ID) {
//         throw new Error('YouTube Client ID not configured');
//       }

//       // Generate a secure state parameter
//       const state = crypto.randomUUID();
//       sessionStorage.setItem('youtube_oauth_state', state);

//       // Build OAuth URL
//       const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
//       authUrl.searchParams.set('client_id', this.CLIENT_ID);
//       authUrl.searchParams.set('redirect_uri', this.REDIRECT_URI);
//       authUrl.searchParams.set('scope', this.SCOPES);
//       authUrl.searchParams.set('response_type', 'code');
//       authUrl.searchParams.set('access_type', 'offline');
//       authUrl.searchParams.set('prompt', 'consent');
//       authUrl.searchParams.set('state', state);

//       // Redirect to Google OAuth
//       window.location.href = authUrl.toString();
//     } catch (error) {
//       console.error('YouTube connection error:', error);
//       toast({
//         title: "Connection Failed",
//         description: "Failed to initiate YouTube connection. Please try again.",
//         variant: "destructive",
//       });
//     }
//   }

//   // Handle OAuth callback
//   async handleOAuthCallback(code: string, state: string): Promise<boolean> {
//     try {
//       console.log('Starting YouTube OAuth callback handling...');
      
//       // Verify state parameter
//       const storedState = sessionStorage.getItem('youtube_oauth_state');
//       console.log('State verification:', { received: state, stored: storedState });
      
//       if (state !== storedState) {
//         throw new Error('Invalid state parameter - possible CSRF attack');
//       }
//       sessionStorage.removeItem('youtube_oauth_state');

//       // Exchange code for tokens
//       console.log('Exchanging code for tokens...');
//       const tokenResponse = await this.exchangeCodeForTokens(code);
//       if (!tokenResponse) {
//         throw new Error('Failed to exchange code for tokens');
//       }
//       console.log('Token exchange successful, access token received');

//       // Get channel information
//       console.log('Fetching channel information...');
//       const channelInfo = await this.getChannelInfo(tokenResponse.access_token);
//       if (!channelInfo) {
//         throw new Error('Failed to fetch channel information');
//       }
//       console.log('Channel info retrieved:', channelInfo.title);

//       // Save connection to database
//       console.log('Saving connection to database...');
//       await this.saveConnection(tokenResponse, channelInfo);
//       console.log('Connection saved successfully');

//       // Fetch initial analytics
//       console.log('Syncing initial analytics...');
//       try {
//         await this.syncChannelAnalytics();
//         console.log('Initial analytics sync completed');
//       } catch (analyticsError) {
//         console.warn('Initial analytics sync failed (non-fatal):', analyticsError);
//       }

//       toast({
//         title: "YouTube Connected",
//         description: `Successfully connected ${channelInfo.title}!`,
//       });

//       return true;
//     } catch (error) {
//       console.error('OAuth callback error:', error);
      
//       let errorMessage = 'Failed to complete YouTube connection. Please try again.';
//       if (error instanceof Error) {
//         errorMessage = error.message;
//       }
      
//       toast({
//         title: "Connection Failed", 
//         description: errorMessage,
//         variant: "destructive",
//       });
//       return false;
//     }
//   }

//   // Exchange authorization code for tokens
//   private async exchangeCodeForTokens(code: string): Promise<{
//     access_token: string;
//     refresh_token?: string;
//     expires_in: number;
//     scope: string;
//   } | null> {
//     try {
//       console.log('Initiating token exchange with Google OAuth...');
      
//       if (!this.CLIENT_ID || !this.CLIENT_SECRET) {
//         throw new Error('YouTube Client ID or Client Secret not configured');
//       }

//       const tokenBody = new URLSearchParams({
//         client_id: this.CLIENT_ID,
//         client_secret: this.CLIENT_SECRET,
//         code,
//         grant_type: 'authorization_code',
//         redirect_uri: this.REDIRECT_URI,
//       });

//       console.log('Token request params:', {
//         client_id: this.CLIENT_ID,
//         redirect_uri: this.REDIRECT_URI,
//         grant_type: 'authorization_code',
//         code: code.substring(0, 10) + '...'
//       });

//       const response = await fetch('https://oauth2.googleapis.com/token', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded',
//         },
//         body: tokenBody,
//       });

//       console.log('Token exchange response status:', response.status);

//       if (!response.ok) {
//         const errorData = await response.json();
//         console.error('Token exchange error response:', errorData);
//         throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error || response.statusText}`);
//       }

//       const tokenData = await response.json();
//       console.log('Token exchange successful, received scopes:', tokenData.scope);
      
//       return tokenData;
//     } catch (error) {
//       console.error('Token exchange error:', error);
//       return null;
//     }
//   }

//   // Get channel information from YouTube API
//   private async getChannelInfo(accessToken: string): Promise<YouTubeChannel | null> {
//     try {
//       const response = await fetch(
//         'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&mine=true',
//         {
//           headers: {
//             'Authorization': `Bearer ${accessToken}`,
//           },
//         }
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(`API request failed: ${errorData.error?.message || response.statusText}`);
//       }

//       const data = await response.json();
//       if (!data.items || data.items.length === 0) {
//         throw new Error('No channel found');
//       }

//       const item = data.items[0];
//       return {
//         id: item.id,
//         title: item.snippet.title,
//         customUrl: item.snippet.customUrl,
//         description: item.snippet.description,
//         thumbnails: item.snippet.thumbnails,
//         statistics: item.statistics,
//         brandingSettings: item.brandingSettings,
//       };
//     } catch (error) {
//       console.error('Channel info fetch error:', error);
//       return null;
//     }
//   }

//   // Save connection to Supabase
//   private async saveConnection(
//     tokenData: { access_token: string; refresh_token?: string; expires_in: number; scope: string },
//     channelInfo: YouTubeChannel
//   ): Promise<void> {
//     const { data: { user } } = await supabase.auth.getUser();
//     if (!user) {
//       throw new Error('User not authenticated');
//     }

//     // Deactivate existing YouTube connections for this user
//     await supabase
//       .from('channel_connections')
//       .update({ is_active: false })
//       .eq('user_id', user.id)
//       .eq('platform', 'youtube');

//     // Calculate token expiration
//     const expiresAt = new Date();
//     expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

//     // Insert new connection
//     const connectionData: ChannelConnectionInsert = {
//       user_id: user.id,
//       platform: 'youtube',
//       channel_id: channelInfo.id,
//       channel_name: channelInfo.title,
//       channel_handle: channelInfo.customUrl || null,
//       channel_avatar_url: channelInfo.thumbnails.high?.url || channelInfo.thumbnails.medium?.url || null,
//       access_token: tokenData.access_token,
//       refresh_token: tokenData.refresh_token || null,
//       token_expires_at: expiresAt.toISOString(),
//       scope_granted: tokenData.scope.split(' '),
//       metadata: {
//         statistics: channelInfo.statistics,
//         description: channelInfo.description,
//         branding: channelInfo.brandingSettings,
//       },
//       sync_status: 'pending',
//     };

//     const { error } = await supabase
//       .from('channel_connections')
//       .insert(connectionData);

//     if (error) {
//       throw error;
//     }
//   }

//   // Refresh access token
//   private async refreshToken(connection: ChannelConnection): Promise<boolean> {
//     if (!connection.refresh_token) {
//       return false;
//     }

//     try {
//       const response = await fetch('https://oauth2.googleapis.com/token', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded',
//         },
//         body: new URLSearchParams({
//           client_id: this.CLIENT_ID,
//           client_secret: this.CLIENT_SECRET,
//           refresh_token: connection.refresh_token,
//           grant_type: 'refresh_token',
//         }),
//       });

//       if (!response.ok) {
//         return false;
//       }

//       const tokenData = await response.json();
      
//       // Update connection with new token
//       const expiresAt = new Date();
//       expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

//       const { error } = await supabase
//         .from('channel_connections')
//         .update({
//           access_token: tokenData.access_token,
//           token_expires_at: expiresAt.toISOString(),
//         })
//         .eq('id', connection.id);

//       return !error;
//     } catch (error) {
//       console.error('Token refresh error:', error);
//       return false;
//     }
//   }

//   // Disconnect YouTube account
//   async disconnectAccount(connectionId?: string): Promise<void> {
//     try {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) return;

//       let query = supabase
//         .from('channel_connections')
//         .update({ is_active: false })
//         .eq('user_id', user.id)
//         .eq('platform', 'youtube');

//       if (connectionId) {
//         query = query.eq('id', connectionId);
//       }

//       const { error } = await query;

//       if (error) {
//         throw error;
//       }

//       toast({
//         title: "YouTube Disconnected",
//         description: "Your YouTube channel has been disconnected.",
//       });
//     } catch (error) {
//       console.error('Disconnect error:', error);
//       toast({
//         title: "Disconnect Failed",
//         description: "Failed to disconnect YouTube channel.",
//         variant: "destructive",
//       });
//     }
//   }

//   // Sync channel analytics
//   async syncChannelAnalytics(): Promise<void> {
//     try {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) throw new Error('User not authenticated');

//       const { data: connections } = await supabase
//         .from('channel_connections')
//         .select('*')
//         .eq('user_id', user.id)
//         .eq('platform', 'youtube')
//         .eq('is_active', true);

//       if (!connections || connections.length === 0) {
//         return;
//       }

//       for (const connection of connections) {
//         await this.syncSingleChannelAnalytics(connection);
//       }
//     } catch (error) {
//       console.error('Analytics sync error:', error);
//     }
//   }

//   // Sync analytics for a single channel
//   private async syncSingleChannelAnalytics(connection: ChannelConnection): Promise<void> {
//     try {
//       // Update sync status
//       await supabase
//         .from('channel_connections')
//         .update({ sync_status: 'syncing' })
//         .eq('id', connection.id);

//       // Get updated channel info
//       const channelInfo = await this.getChannelInfo(connection.access_token);
//       if (!channelInfo) {
//         throw new Error('Failed to fetch channel info');
//       }

//       // Get recent videos
//       const videos = await this.getChannelVideos(connection.access_token, connection.channel_id);

//       // Calculate analytics
//       const analytics = {
//         subscriber_count: parseInt(channelInfo.statistics.subscriberCount || '0'),
//         view_count: parseInt(channelInfo.statistics.viewCount || '0'),
//         video_count: parseInt(channelInfo.statistics.videoCount || '0'),
//         recent_videos: videos.slice(0, 10), // Store top 10 recent videos
//         performance_metrics: this.calculatePerformanceMetrics(videos),
//         last_updated: new Date().toISOString(),
//       };

//       // Use the database function to update analytics
//       const { error } = await supabase.rpc('update_channel_analytics', {
//         connection_uuid: connection.id,
//         analytics_data: analytics as any,
//       });

//       if (error) {
//         throw error;
//       }

//     } catch (error) {
//       console.error(`Analytics sync failed for connection ${connection.id}:`, error);
      
//       // Update error status
//       await supabase
//         .from('channel_connections')
//         .update({ 
//           sync_status: 'failed',
//           error_message: error instanceof Error ? error.message : 'Unknown error'
//         })
//         .eq('id', connection.id);
//     }
//   }

//   // Get channel videos
//   private async getChannelVideos(accessToken: string, channelId: string): Promise<YouTubeVideo[]> {
//     try {
//       // First, get the uploads playlist ID
//       const channelResponse = await fetch(
//         `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}`,
//         {
//           headers: {
//             'Authorization': `Bearer ${accessToken}`,
//           },
//         }
//       );

//       const channelData = await channelResponse.json();
//       const uploadsPlaylistId = channelData.items[0]?.contentDetails?.relatedPlaylists?.uploads;

//       if (!uploadsPlaylistId) {
//         return [];
//       }

//       // Get recent videos from uploads playlist
//       const videosResponse = await fetch(
//         `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50`,
//         {
//           headers: {
//             'Authorization': `Bearer ${accessToken}`,
//           },
//         }
//       );

//       const videosData = await videosResponse.json();
      
//       if (!videosData.items) {
//         return [];
//       }

//       // Get video IDs for statistics
//       const videoIds = videosData.items.map((item: any) => item.snippet.resourceId.videoId).join(',');
      
//       // Get video statistics
//       const statsResponse = await fetch(
//         `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}`,
//         {
//           headers: {
//             'Authorization': `Bearer ${accessToken}`,
//           },
//         }
//       );

//       const statsData = await statsResponse.json();

//       return statsData.items.map((video: any) => ({
//         id: video.id,
//         title: video.snippet.title,
//         description: video.snippet.description,
//         thumbnails: video.snippet.thumbnails,
//         statistics: video.statistics,
//         publishedAt: video.snippet.publishedAt,
//       }));

//     } catch (error) {
//       console.error('Error fetching channel videos:', error);
//       return [];
//     }
//   }

//   // Calculate performance metrics
//   private calculatePerformanceMetrics(videos: YouTubeVideo[]): any {
//     if (videos.length === 0) {
//       return {
//         average_views_per_video: 0,
//         engagement_rate: 0,
//         upload_frequency: 0,
//       };
//     }

//     const totalViews = videos.reduce((sum, video) => sum + parseInt(video.statistics.viewCount || '0'), 0);
//     const totalLikes = videos.reduce((sum, video) => sum + parseInt(video.statistics.likeCount || '0'), 0);
//     const totalComments = videos.reduce((sum, video) => sum + parseInt(video.statistics.commentCount || '0'), 0);

//     const averageViews = totalViews / videos.length;
//     const engagementRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;

//     // Calculate upload frequency (videos per week)
//     const now = new Date();
//     const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
//     const recentVideos = videos.filter(video => new Date(video.publishedAt) > thirtyDaysAgo);
//     const uploadFrequency = (recentVideos.length / 30) * 7; // Videos per week

//     return {
//       average_views_per_video: Math.round(averageViews),
//       engagement_rate: Math.round(engagementRate * 100) / 100,
//       upload_frequency: Math.round(uploadFrequency * 100) / 100,
//     };
//   }

//   // Get channel analytics for dashboard
//   async getChannelAnalytics(connectionId: string): Promise<ChannelAnalytics | null> {
//     try {
//       const { data: analyticsData } = await supabase
//         .from('analytics_data')
//         .select('*')
//         .eq('connection_id', connectionId)
//         .order('date_collected', { ascending: false })
//         .limit(1)
//         .single();

//       if (!analyticsData) {
//         return null;
//       }

//       const metrics = analyticsData.metrics as any;
      
//       return {
//         subscriber_count: metrics.subscriber_count || 0,
//         view_count: metrics.view_count || 0,
//         video_count: metrics.video_count || 0,
//         recent_videos: metrics.recent_videos || [],
//         performance_metrics: metrics.performance_metrics || {
//           average_views_per_video: 0,
//           engagement_rate: 0,
//           upload_frequency: 0,
//         },
//       };
//     } catch (error) {
//       console.error('Error fetching channel analytics:', error);
//       return null;
//     }
//   }

//   // Get all user's YouTube connections
//   async getUserConnections(): Promise<ChannelConnection[]> {
//     try {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) return [];

//       const { data: connections, error } = await supabase
//         .from('channel_connections')
//         .select('*')
//         .eq('user_id', user.id)
//         .eq('platform', 'youtube')
//         .eq('is_active', true)
//         .order('created_at', { ascending: false });

//       if (error) {
//         throw error;
//       }

//       return connections || [];
//     } catch (error) {
//       console.error('Error fetching user connections:', error);
//       return [];
//     }
//   }

//   // Get channel summary for dashboard
//   async getChannelSummary(): Promise<any> {
//     try {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) return null;

//       const { data, error } = await supabase.rpc('get_channel_summary', {
//         user_uuid: user.id,
//       });

//       if (error) {
//         throw error;
//       }

//       return data?.find(item => item.platform === 'youtube') || {
//         platform: 'youtube',
//         channel_count: 0,
//         total_subscribers: 0,
//         total_views: 0,
//         is_connected: false,
//       };
//     } catch (error) {
//       console.error('Error fetching channel summary:', error);
//       return null;
//     }
//   }

//   async getTrendingVideos(regionCode: string = 'US', categoryId?: string): Promise<any[]> {
//     try {
//       console.log('Fetching trending videos...', { regionCode, categoryId });
      
//       // Check API key
//       const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
//       if (!apiKey) {
//         throw new Error('YouTube API key not configured. Please check your .env file.');
//       }
      
//       const url = new URL('https://www.googleapis.com/youtube/v3/videos');
//       url.searchParams.append('part', 'snippet,statistics,contentDetails');
//       url.searchParams.append('chart', 'mostPopular');
//       url.searchParams.append('regionCode', regionCode);
//       url.searchParams.append('maxResults', '50');
//       url.searchParams.append('key', apiKey);
      
//       if (categoryId) {
//         url.searchParams.append('videoCategoryId', categoryId);
//       }

//       console.log('YouTube API request URL:', url.toString().replace(apiKey, 'API_KEY_HIDDEN'));

//       const response = await fetch(url.toString());
      
//       if (!response.ok) {
//         const errorData = await response.json().catch(() => null);
//         console.error('YouTube API error response:', errorData);
        
//         if (response.status === 403) {
//           throw new Error('YouTube API quota exceeded or invalid API key');
//         } else if (response.status === 400) {
//           throw new Error('Invalid request parameters');
//         } else {
//           throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
//         }
//       }

//       const data = await response.json();
//       console.log('YouTube API response:', { itemCount: data.items?.length, totalResults: data.pageInfo?.totalResults });
      
//       if (!data.items || data.items.length === 0) {
//         console.warn('No trending videos found in API response');
//         return [];
//       }

//       const mappedVideos = data.items.map((item: any) => ({
//         id: item.id,
//         title: item.snippet.title,
//         channelTitle: item.snippet.channelTitle,
//         viewCount: item.statistics.viewCount,
//         likeCount: item.statistics.likeCount || '0',
//         commentCount: item.statistics.commentCount || '0',
//         duration: item.contentDetails.duration,
//         publishedAt: item.snippet.publishedAt,
//         thumbnails: item.snippet.thumbnails,
//         categoryId: item.snippet.categoryId
//       }));
      
//       console.log('Mapped trending videos:', mappedVideos.length);
//       return mappedVideos;
//     } catch (error) {
//       console.error('Error fetching trending videos:', error);
//       throw error;
//     }
//   }
// }

// export const youtubeService = new YouTubeService();
