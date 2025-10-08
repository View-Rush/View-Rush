import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChannelConnections } from '@/hooks/useChannelConnections';
import { youtubeService } from '@/services/youtube';
import { connectionStateManager } from '@/services/connectionStateManager';
import { toast } from '@/hooks/use-toast';

interface AnalyticsData {
  channel_stats: {
    subscriber_count: number;
    total_views: number;
    total_videos: number;
    average_views_per_video: number;
  };
  recent_videos: Array<{
    id: string;
    title: string;
    views: number;
    likes: number;
    comments: number;
    published_at: string;
    privacyStatus?: string;
  }>;
  private_unlisted_videos?: Array<{
    id: string;
    title: string;
    views: number;
    likes: number;
    comments: number;
    published_at: string;
    privacyStatus?: string;
  }>;
  performance_metrics: {
    best_performing_time: string;
    best_performing_day: string;
    average_engagement_rate: number;
  };
}

interface PredictionsData {
  optimal_publish_times: Array<{
    day: string;
    time: string;
    predicted_views: number;
    confidence: number;
  }>;
  content_recommendations: Array<{
    category: string;
    predicted_engagement: number;
    suggested_duration: string;
  }>;
}

interface DashboardContextType {
  analyticsData: AnalyticsData | null;
  predictionsData: PredictionsData | null;
  loading: boolean;
  hasConnections: boolean;
  channelConnections: any[];
  connectionsLoading: boolean;
  connecting: boolean;
  refreshData: () => Promise<void>;
  refreshConnections: () => void;
  connectChannel: () => Promise<void>;
  disconnectChannel: (connectionId: string) => Promise<void>;
  isInitialized: boolean;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

interface DashboardProviderProps {
  children: React.ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const {
    connections: channelConnections,
    loading: connectionsLoading,
    connecting,
    connectChannel,
    disconnectChannel,
    refreshConnection,
    hasConnections,
  } = useChannelConnections();

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [predictionsData] = useState<PredictionsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const loadDashboardData = useCallback(async (forceRefresh = false) => {
    // Skip if no user or no connections
    if (!user || !hasConnections) {
      console.log('No user or connections - skipping analytics load');
      setAnalyticsData(null);
      setIsInitialized(true);
      return;
    }

    // Skip if data already loaded and not forcing refresh
    if (analyticsData && !forceRefresh) {
      console.log('Analytics data already loaded - skipping');
      return;
    }

    // Check if connection process is in progress and block if so
    console.log('Checking connection state before loading dashboard data ', connectionStateManager.getState());
    if (connectionStateManager.isConnecting()) {
      console.log('loadDashboardData() blocked - connection in progress');
      return;
    }

    console.log('Loading analytics data for connected channel');
    setLoading(true);

    try {
      // Create a promise that rejects after 10 seconds
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Data loading timeout after 10 seconds'));
        }, 10000);
      });

      try {
        // Race the API call against the timeout
        const data = await Promise.race([
          youtubeService.getDashboardAnalytics(undefined, channelConnections),
          timeoutPromise
        ]);

        if (data) {
          setAnalyticsData(data as AnalyticsData);
          console.log('Analytics data loaded successfully');
        }
      } catch (timeoutError) {
        if (timeoutError instanceof Error && timeoutError.message.includes('timeout')) {
          console.warn('Dashboard data loading timed out after 10 seconds');
          toast({
            title: "Loading timeout",
            description: "Dashboard data is taking longer than expected. Please try refreshing.",
            variant: "destructive",
          });
        } else {
          throw timeoutError; // Re-throw non-timeout errors
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error loading data",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, [user, hasConnections, channelConnections, analyticsData]);

  // Initialize data only once when conditions are met
  useEffect(() => {
    if (!isInitialized && user && !connectionsLoading) {
      console.log('🚀 Initializing dashboard data...');
      loadDashboardData();
    }
  }, [user, connectionsLoading, loadDashboardData, isInitialized]);

  const refreshData = useCallback(async () => {
    console.log('Refreshing dashboard data...');
    await loadDashboardData(true);
    toast({
      title: "Data refreshed",
      description: "Dashboard data has been updated successfully.",
    });
  }, [loadDashboardData]);

  const refreshConnections = useCallback(() => {
    refreshConnection();
  }, [refreshConnection]);

  const value = {
    analyticsData,
    predictionsData,
    loading,
    hasConnections,
    channelConnections,
    connectionsLoading,
    connecting,
    refreshData,
    refreshConnections,
    connectChannel,
    disconnectChannel,
    isInitialized,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export default DashboardProvider;
