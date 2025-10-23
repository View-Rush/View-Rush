import { errorHandler } from '../utils/errorHandler';

export interface YouTubeChannel {
  id: string;
  title: string;
  customUrl?: string;
  description: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
  statistics: {
    viewCount: string;
    subscriberCount: string;
    videoCount: string;
  };
  brandingSettings?: {
    channel: {
      title: string;
      description: string;
      keywords?: string;
      country?: string;
    };
  };
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
  publishedAt: string;
  privacyStatus?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export class YouTubeApiClient {
  private static instance: YouTubeApiClient;
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';
  private readonly oauthUrl = 'https://oauth2.googleapis.com/token';

  private constructor() {}

  static getInstance(): YouTubeApiClient {
    if (!YouTubeApiClient.instance) {
      YouTubeApiClient.instance = new YouTubeApiClient();
    }
    return YouTubeApiClient.instance;
  }

  

   
  async exchangeCodeForTokens(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<TokenResponse> {

    try {
      const tokenBody = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      });

      const response = await fetch(this.oauthUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenBody,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw errorHandler.createApiError(
          `Token exchange failed: ${responseData.error_description || responseData.error}`,
          response.status,
          responseData
        );
      }

      return responseData as TokenResponse;
    } catch (error) {
      throw errorHandler.handleError(error, 'YouTubeAPI', false);
    }
  }

  

   
  async refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
  ): Promise<Omit<TokenResponse, 'refresh_token'>> {

    try {
      const tokenBody = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });

      const response = await fetch(this.oauthUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenBody,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw errorHandler.createApiError(
          `Token refresh failed: ${responseData.error_description || responseData.error}`,
          response.status,
          responseData
        );
      }

      return responseData;
    } catch (error) {
      throw errorHandler.handleError(error, 'YouTubeAPI', false);
    }
  }

  

  async getChannelInfo(accessToken: string): Promise<YouTubeChannel> {

    try {
      const response = await this.makeAuthenticatedRequest(
        '/channels?part=snippet,statistics,brandingSettings&mine=true',
        accessToken
      );

      if (!response.items || response.items.length === 0) {
        throw errorHandler.createApiError('No channel found for the authenticated user');
      }

      const item = response.items[0];
      const channelInfo: YouTubeChannel = {
        id: item.id,
        title: item.snippet.title,
        customUrl: item.snippet.customUrl,
        description: item.snippet.description,
        thumbnails: item.snippet.thumbnails,
        statistics: item.statistics,
        brandingSettings: item.brandingSettings,
      };

      return channelInfo;
    } catch (error) {
      throw errorHandler.handleError(error, 'YouTubeAPI', false);
    }
  }

  

   
  async getChannelVideos(
    accessToken: string,
    channelId: string,
    maxResults: number = 10
  ): Promise<YouTubeVideo[]> {

    try {

      const searchResponse = await this.makeAuthenticatedRequest(
        `/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=${maxResults}`,
        accessToken
      );

      if (!searchResponse.items || searchResponse.items.length === 0) {
        return [];
      }

      const videoIds = searchResponse.items.map((item: any) => item.id.videoId).join(',');


      const videosResponse = await this.makeAuthenticatedRequest(
        `/videos?part=snippet,statistics,status&id=${videoIds}`,
        accessToken
      );

      const videos: YouTubeVideo[] = (videosResponse.items || []).map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnails: item.snippet.thumbnails,
        statistics: {
          viewCount: item.statistics.viewCount || '0',
          likeCount: item.statistics.likeCount || '0',
          commentCount: item.statistics.commentCount || '0',
        },
        publishedAt: item.snippet.publishedAt,
        privacyStatus: item.status?.privacyStatus,
      }));

      return videos;
    } catch (error) {
      throw errorHandler.handleError(error, 'YouTubeAPI', false);
    }
  }

  

   
  async getTrendingVideos(
    accessToken: string,
    regionCode: string = 'US',
    categoryId?: string,
    maxResults: number = 25
  ): Promise<any[]> {

    try {
      let endpoint = `/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=${regionCode}&maxResults=${maxResults}`;
      
      if (categoryId) {
        endpoint += `&videoCategoryId=${categoryId}`;
      }

      const response = await this.makeAuthenticatedRequest(endpoint, accessToken);

      const videos = (response.items || []).map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnails: item.snippet.thumbnails,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        categoryId: item.snippet.categoryId,

        viewCount: item.statistics?.viewCount || '0',
        likeCount: item.statistics?.likeCount || '0',
        commentCount: item.statistics?.commentCount || '0',
        duration: item.contentDetails?.duration,
      }));

      return videos;
    } catch (error) {
      throw errorHandler.handleError(error, 'YouTubeAPI', false);
    }
  }



   
  private async makeAuthenticatedRequest(endpoint: string, accessToken: string): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorMessage = responseData.error?.message || 'YouTube API request failed';
      throw errorHandler.createApiError(errorMessage, response.status, responseData);
    }

    return responseData;
  }
}

export const youtubeApiClient = YouTubeApiClient.getInstance();
