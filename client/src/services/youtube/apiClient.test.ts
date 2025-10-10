import { YouTubeApiClient, TokenResponse } from './apiClient';

// Mock dependencies
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../utils/errorHandler', () => ({
  errorHandler: {
    createApiError: vi.fn((message: string, status?: number, data?: any) => {
      const error = new Error(message);
      (error as any).status = status;
      (error as any).data = data;
      return error;
    }),
    handleError: vi.fn((error: unknown) => error),
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('YouTubeApiClient', () => {
  let apiClient: YouTubeApiClient;

  beforeEach(() => {
    // Clear any existing instance
    (YouTubeApiClient as any).instance = undefined;
    
    // Get fresh instance
    apiClient = YouTubeApiClient.getInstance();

    // Clear all mocks
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = YouTubeApiClient.getInstance();
      const instance2 = YouTubeApiClient.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(apiClient);
    });
  });

  describe('exchangeCodeForTokens', () => {
    const mockConfig = {
      code: 'test-auth-code',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'http://localhost:3000/callback',
    };

    const mockTokenResponse: TokenResponse = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600,
      scope: 'https://www.googleapis.com/auth/youtube.readonly',
      token_type: 'Bearer',
    };

    it('should successfully exchange authorization code for tokens', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockTokenResponse),
      });

      const result = await apiClient.exchangeCodeForTokens(
        mockConfig.code,
        mockConfig.clientId,
        mockConfig.clientSecret,
        mockConfig.redirectUri
      );

      expect(result).toEqual(mockTokenResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: expect.any(URLSearchParams),
        }
      );

      // Verify the request body contains correct parameters
      const call = mockFetch.mock.calls[0];
      const body = call[1].body as URLSearchParams;
      expect(body.get('client_id')).toBe(mockConfig.clientId);
      expect(body.get('client_secret')).toBe(mockConfig.clientSecret);
      expect(body.get('code')).toBe(mockConfig.code);
      expect(body.get('grant_type')).toBe('authorization_code');
      expect(body.get('redirect_uri')).toBe(mockConfig.redirectUri);
    });

    it('should handle token exchange errors', async () => {
      const errorResponse = {
        error: 'invalid_grant',
        error_description: 'The authorization code is invalid or expired.',
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue(errorResponse),
      });

      await expect(
        apiClient.exchangeCodeForTokens(
          mockConfig.code,
          mockConfig.clientId,
          mockConfig.clientSecret,
          mockConfig.redirectUri
        )
      ).rejects.toThrow();

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle network errors during token exchange', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        apiClient.exchangeCodeForTokens(
          mockConfig.code,
          mockConfig.clientId,
          mockConfig.clientSecret,
          mockConfig.redirectUri
        )
      ).rejects.toThrow('Network error');
    });
  });

  describe('refreshAccessToken', () => {
    const mockConfig = {
      refreshToken: 'test-refresh-token',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    };

    const mockRefreshResponse = {
      access_token: 'new-access-token',
      expires_in: 3600,
      scope: 'https://www.googleapis.com/auth/youtube.readonly',
      token_type: 'Bearer',
    };

    it('should successfully refresh access token', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockRefreshResponse),
      });

      const result = await apiClient.refreshAccessToken(
        mockConfig.refreshToken,
        mockConfig.clientId,
        mockConfig.clientSecret
      );

      expect(result).toEqual(mockRefreshResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: expect.any(URLSearchParams),
        }
      );

      // Verify the request body
      const call = mockFetch.mock.calls[0];
      const body = call[1].body as URLSearchParams;
      expect(body.get('client_id')).toBe(mockConfig.clientId);
      expect(body.get('client_secret')).toBe(mockConfig.clientSecret);
      expect(body.get('refresh_token')).toBe(mockConfig.refreshToken);
      expect(body.get('grant_type')).toBe('refresh_token');
    });

    it('should handle refresh token errors', async () => {
      const errorResponse = {
        error: 'invalid_grant',
        error_description: 'The refresh token is invalid.',
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue(errorResponse),
      });

      await expect(
        apiClient.refreshAccessToken(
          mockConfig.refreshToken,
          mockConfig.clientId,
          mockConfig.clientSecret
        )
      ).rejects.toThrow();
    });
  });

  describe('getChannelInfo', () => {
    const mockAccessToken = 'test-access-token';
    
    const mockChannelResponse = {
      items: [
        {
          id: 'UC_test_channel_id',
          snippet: {
            title: 'Test Channel',
            customUrl: '@testchannel',
            description: 'This is a test channel',
            thumbnails: {
              default: { url: 'https://example.com/default.jpg' },
              medium: { url: 'https://example.com/medium.jpg' },
              high: { url: 'https://example.com/high.jpg' },
            },
          },
          statistics: {
            viewCount: '1000000',
            subscriberCount: '50000',
            videoCount: '100',
          },
          brandingSettings: {
            channel: {
              title: 'Test Channel',
              description: 'Branding description',
              keywords: 'test,youtube,channel',
              country: 'US',
            },
          },
        },
      ],
    };

    it('should successfully get channel information', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockChannelResponse),
      });

      const result = await apiClient.getChannelInfo(mockAccessToken);

      expect(result).toEqual({
        id: 'UC_test_channel_id',
        title: 'Test Channel',
        customUrl: '@testchannel',
        description: 'This is a test channel',
        thumbnails: {
          default: { url: 'https://example.com/default.jpg' },
          medium: { url: 'https://example.com/medium.jpg' },
          high: { url: 'https://example.com/high.jpg' },
        },
        statistics: {
          viewCount: '1000000',
          subscriberCount: '50000',
          videoCount: '100',
        },
        brandingSettings: {
          channel: {
            title: 'Test Channel',
            description: 'Branding description',
            keywords: 'test,youtube,channel',
            country: 'US',
          },
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&mine=true',
        {
          headers: {
            'Authorization': `Bearer ${mockAccessToken}`,
          },
        }
      );
    });

    it('should handle case when no channel is found', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ items: [] }),
      });

      await expect(
        apiClient.getChannelInfo(mockAccessToken)
      ).rejects.toThrow();
    });

    it('should handle API errors when getting channel info', async () => {
      const errorResponse = {
        error: {
          code: 401,
          message: 'Invalid credentials',
        },
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue(errorResponse),
      });

      await expect(
        apiClient.getChannelInfo(mockAccessToken)
      ).rejects.toThrow();
    });
  });

  describe('getChannelVideos', () => {
    const mockAccessToken = 'test-access-token';
    const mockChannelId = 'UC_test_channel_id';
    const maxResults = 5;

    const mockSearchResponse = {
      items: [
        { id: { videoId: 'video1' } },
        { id: { videoId: 'video2' } },
      ],
    };

    const mockVideosResponse = {
      items: [
        {
          id: 'video1',
          snippet: {
            title: 'Test Video 1',
            description: 'Description for video 1',
            publishedAt: '2023-01-01T12:00:00Z',
            thumbnails: {
              default: { url: 'https://example.com/thumb1_default.jpg' },
              medium: { url: 'https://example.com/thumb1_medium.jpg' },
              high: { url: 'https://example.com/thumb1_high.jpg' },
            },
          },
          statistics: {
            viewCount: '10000',
            likeCount: '500',
            commentCount: '50',
          },
        },
        {
          id: 'video2',
          snippet: {
            title: 'Test Video 2',
            description: 'Description for video 2',
            publishedAt: '2023-01-02T12:00:00Z',
            thumbnails: {
              default: { url: 'https://example.com/thumb2_default.jpg' },
              medium: { url: 'https://example.com/thumb2_medium.jpg' },
              high: { url: 'https://example.com/thumb2_high.jpg' },
            },
          },
          statistics: {
            viewCount: '5000',
            likeCount: '250',
            commentCount: '25',
          },
        },
      ],
    };

    it('should successfully get channel videos', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockSearchResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockVideosResponse),
        });

      const result = await apiClient.getChannelVideos(
        mockAccessToken,
        mockChannelId,
        maxResults
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'video1',
        title: 'Test Video 1',
        description: 'Description for video 1',
        publishedAt: '2023-01-01T12:00:00Z',
        thumbnails: {
          default: { url: 'https://example.com/thumb1_default.jpg' },
          medium: { url: 'https://example.com/thumb1_medium.jpg' },
          high: { url: 'https://example.com/thumb1_high.jpg' },
        },
        statistics: {
          viewCount: '10000',
          likeCount: '500',
          commentCount: '50',
        },
      });

      // Verify both API calls were made
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${mockChannelId}&type=video&order=date&maxResults=${maxResults}`,
        {
          headers: {
            'Authorization': `Bearer ${mockAccessToken}`,
          },
        }
      );
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        'https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=video1,video2',
        {
          headers: {
            'Authorization': `Bearer ${mockAccessToken}`,
          },
        }
      );
    });

    it('should return empty array when no videos found', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ items: [] }),
      });

      const result = await apiClient.getChannelVideos(
        mockAccessToken,
        mockChannelId,
        maxResults
      );

      expect(result).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only search call, no videos call
    });

    it('should handle missing statistics gracefully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockSearchResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({
            items: [
              {
                id: 'video1',
                snippet: {
                  title: 'Test Video 1',
                  description: 'Description for video 1',
                  publishedAt: '2023-01-01T12:00:00Z',
                  thumbnails: {
                    default: { url: 'https://example.com/thumb1_default.jpg' },
                    medium: { url: 'https://example.com/thumb1_medium.jpg' },
                    high: { url: 'https://example.com/thumb1_high.jpg' },
                  },
                },
                statistics: {}, // Empty statistics
              },
            ],
          }),
        });

      const result = await apiClient.getChannelVideos(
        mockAccessToken,
        mockChannelId,
        maxResults
      );

      expect(result[0].statistics).toEqual({
        viewCount: '0',
        likeCount: '0',
        commentCount: '0',
      });
    });
  });

  describe('getTrendingVideos', () => {
    const mockAccessToken = 'test-access-token';
    const regionCode = 'US';
    const categoryId = '10'; // Music category
    const maxResults = 10;

    const mockTrendingResponse = {
      items: [
        {
          id: 'trending_video_1',
          snippet: {
            title: 'Trending Video 1',
            description: 'Description for trending video 1',
            channelTitle: 'Trending Channel 1',
            publishedAt: '2023-01-01T12:00:00Z',
            categoryId: '10',
            thumbnails: {
              default: { url: 'https://example.com/trending1_default.jpg' },
              medium: { url: 'https://example.com/trending1_medium.jpg' },
              high: { url: 'https://example.com/trending1_high.jpg' },
            },
          },
          statistics: {
            viewCount: '1000000',
            likeCount: '50000',
            commentCount: '5000',
          },
          contentDetails: {
            duration: 'PT4M13S',
          },
        },
        {
          id: 'trending_video_2',
          snippet: {
            title: 'Trending Video 2',
            description: 'Description for trending video 2',
            channelTitle: 'Trending Channel 2',
            publishedAt: '2023-01-02T12:00:00Z',
            categoryId: '10',
            thumbnails: {
              default: { url: 'https://example.com/trending2_default.jpg' },
              medium: { url: 'https://example.com/trending2_medium.jpg' },
              high: { url: 'https://example.com/trending2_high.jpg' },
            },
          },
          statistics: {
            viewCount: '500000',
            likeCount: '25000',
            commentCount: '2500',
          },
          contentDetails: {
            duration: 'PT3M45S',
          },
        },
      ],
    };

    it('should successfully get trending videos with all parameters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockTrendingResponse),
      });

      const result = await apiClient.getTrendingVideos(
        mockAccessToken,
        regionCode,
        categoryId,
        maxResults
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'trending_video_1',
        title: 'Trending Video 1',
        description: 'Description for trending video 1',
        channelTitle: 'Trending Channel 1',
        publishedAt: '2023-01-01T12:00:00Z',
        categoryId: '10',
        thumbnails: {
          default: { url: 'https://example.com/trending1_default.jpg' },
          medium: { url: 'https://example.com/trending1_medium.jpg' },
          high: { url: 'https://example.com/trending1_high.jpg' },
        },
        viewCount: '1000000',
        likeCount: '50000',
        commentCount: '5000',
        duration: 'PT4M13S',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=${regionCode}&maxResults=${maxResults}&videoCategoryId=${categoryId}`,
        {
          headers: {
            'Authorization': `Bearer ${mockAccessToken}`,
          },
        }
      );
    });

    it('should successfully get trending videos with default parameters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockTrendingResponse),
      });

      const result = await apiClient.getTrendingVideos(mockAccessToken);

      expect(result).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=US&maxResults=25',
        {
          headers: {
            'Authorization': `Bearer ${mockAccessToken}`,
          },
        }
      );
    });

    it('should handle missing statistics and content details gracefully', async () => {
      const responseWithMissingData = {
        items: [
          {
            id: 'trending_video_1',
            snippet: {
              title: 'Trending Video 1',
              description: 'Description for trending video 1',
              channelTitle: 'Trending Channel 1',
              publishedAt: '2023-01-01T12:00:00Z',
              categoryId: '10',
              thumbnails: {
                default: { url: 'https://example.com/trending1_default.jpg' },
                medium: { url: 'https://example.com/trending1_medium.jpg' },
                high: { url: 'https://example.com/trending1_high.jpg' },
              },
            },
            // Missing statistics and contentDetails
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(responseWithMissingData),
      });

      const result = await apiClient.getTrendingVideos(mockAccessToken);

      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'trending_video_1',
          title: 'Trending Video 1',
          viewCount: '0',
          likeCount: '0',
          commentCount: '0',
          duration: undefined,
        })
      );
    });

    it('should return empty array when no trending videos found', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ items: [] }),
      });

      const result = await apiClient.getTrendingVideos(mockAccessToken);

      expect(result).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    const mockAccessToken = 'test-access-token';

    it('should handle 401 unauthorized errors', async () => {
      const errorResponse = {
        error: {
          code: 401,
          message: 'Invalid credentials',
        },
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue(errorResponse),
      });

      await expect(
        apiClient.getChannelInfo(mockAccessToken)
      ).rejects.toThrow();
    });

    it('should handle 403 forbidden errors', async () => {
      const errorResponse = {
        error: {
          code: 403,
          message: 'The request cannot be completed because you have exceeded your quota.',
        },
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: vi.fn().mockResolvedValue(errorResponse),
      });

      await expect(
        apiClient.getChannelInfo(mockAccessToken)
      ).rejects.toThrow();
    });

    it('should handle 404 not found errors', async () => {
      const errorResponse = {
        error: {
          code: 404,
          message: 'The requested resource was not found.',
        },
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue(errorResponse),
      });

      await expect(
        apiClient.getTrendingVideos(mockAccessToken)
      ).rejects.toThrow();
    });

    it('should handle network timeouts and connection errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network timeout'));

      await expect(
        apiClient.getChannelInfo(mockAccessToken)
      ).rejects.toThrow('Network timeout');
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      });

      await expect(
        apiClient.getChannelInfo(mockAccessToken)
      ).rejects.toThrow('Invalid JSON');
    });
  });

  describe('Request Authentication', () => {
    const mockAccessToken = 'test-access-token';

    it('should include Bearer token in all authenticated requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ items: [] }),
      });

      await apiClient.getChannelInfo(mockAccessToken).catch(() => {
        // Expected to fail due to empty items
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAccessToken}`,
          }),
        })
      );
    });

    it('should make requests to the correct YouTube API base URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ items: [] }),
      });

      await apiClient.getChannelInfo(mockAccessToken).catch(() => {
        // Expected to fail due to empty items
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://www.googleapis.com/youtube/v3'),
        expect.any(Object)
      );
    });
  });
});