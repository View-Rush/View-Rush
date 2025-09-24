import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Users, 
  PlayCircle, 
  Clock, 
  Calendar,
  Settings,
  Plus,
  RefreshCw,
  Youtube,
  BarChart3,
  Target,
  Lightbulb,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { youtubeService } from '@/services/youtube';
import { storageService } from '@/services/storageService';
import { connectionStateManager } from '@/services/connectionStateManager';
import { useChannelConnections } from '@/hooks/useChannelConnections';
import { ChannelConnectionsList } from '@/components/ui/channel-connections-list';
import { ConnectChannelButton } from '@/components/ui/connect-channel-button';
import { YouTubeConnectionTest } from '@/components/ui/youtube-connection-test';
import { AuthDebugTest } from '@/components/ui/auth-debug-test';
import { YouTubeAPITest } from '@/components/ui/youtube-api-test';
import Header from '@/components/layout/Header';
import type { Database } from '@/integrations/supabase/types';

type ChannelConnection = Database['public']['Tables']['channel_connections']['Row'];

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

const DashboardNew = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [predictionsData, setPredictionsData] = useState<PredictionsData | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  
  // Use the new custom hook for channel connections
  const {
    connections: channelConnections,
    loading: connectionsLoading,
    connecting,
    connectChannel,
    disconnectChannel: handleDisconnectChannel,
    refreshConnection
  } = useChannelConnections();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        await loadDashboardData();
      }
    };
    loadData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    
    // Check if connection process is in progress and block if so
    if (connectionStateManager.isConnecting()) {
      console.log('🔒 loadDashboardData() blocked - connection in progress');
      setLoading(false);
      return;
    }
    
    try {
      // Check cache first
      const cacheKey = `analytics_${user?.id}`;
      let cached = storageService.getCachedAnalytics(cacheKey);
      
      if (cached) {
        setAnalyticsData(cached);
      } else {
        // Create a promise that rejects after 2 seconds
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Data loading timeout after 2 seconds'));
          }, 2000);
        });

        try {
          // Race the API call against the timeout
          const data = await Promise.race([
            youtubeService.getDashboardAnalytics(),
            timeoutPromise
          ]);
          
          if (data) {
            setAnalyticsData(data as AnalyticsData);
            storageService.setCachedAnalytics(cacheKey, data); // Cache the data
          }
        } catch (timeoutError) {
          if (timeoutError instanceof Error && timeoutError.message.includes('timeout')) {
            console.warn('Dashboard data loading timed out after 2 seconds');
            toast({
              title: "Loading timeout",
              description: "Dashboard data is taking longer than expected. Please try refreshing.",
              variant: "destructive",
            });
          } else {
            throw timeoutError; // Re-throw non-timeout errors
          }
        }
      }

      // Get predictions - removing for now since apiService doesn't exist
      // const predictions = await apiService.getPredictions({
      //   channel_id: 'default',
      //   subscriber_count: analyticsData?.channel_stats?.subscriber_count || 0,
      // });
      // setPredictionsData(predictions as PredictionsData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error loading data",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    // Clear cache and reload
    storageService.clearCachedAnalytics();
    await loadDashboardData();
    toast({
      title: "Data refreshed",
      description: "Dashboard data has been updated successfully.",
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.user_metadata?.display_name || user?.email}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefreshData} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setSelectedTab('settings')} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={signOut} variant="outline">
            Sign Out
          </Button>
        </div>
      </div>

      {/* Channel Connections Status */}
      <ChannelConnectionsList
        connections={channelConnections}
        onConnect={connectChannel}
        onDisconnect={handleDisconnectChannel}
        onRefresh={refreshConnection}
        loading={connectionsLoading || connecting}
        showAddButton={true}
      />

      {/* Main Dashboard Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {analyticsData ? (
            <>
              {/* Key Metrics */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analyticsData.channel_stats.subscriber_count.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                    <PlayCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analyticsData.channel_stats.total_views.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
                    <PlayCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analyticsData.channel_stats.total_videos}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Views/Video</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analyticsData.channel_stats.average_views_per_video.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Videos */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Videos Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.recent_videos.map((video) => (
                      <div key={video.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{video.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Published: {new Date(video.published_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span>{video.views.toLocaleString()} views</span>
                          <span>{video.likes.toLocaleString()} likes</span>
                          <span>{video.comments} comments</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Connect a channel to see your analytics</p>
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {analyticsData ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 border rounded-lg">
                    <Clock className="mx-auto h-8 w-8 text-primary mb-2" />
                    <h4 className="font-medium">Best Time to Post</h4>
                    <p className="text-2xl font-bold text-primary">
                      {analyticsData.performance_metrics.best_performing_time}
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Calendar className="mx-auto h-8 w-8 text-primary mb-2" />
                    <h4 className="font-medium">Best Day to Post</h4>
                    <p className="text-2xl font-bold text-primary">
                      {analyticsData.performance_metrics.best_performing_day}
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <TrendingUp className="mx-auto h-8 w-8 text-primary mb-2" />
                    <h4 className="font-medium">Engagement Rate</h4>
                    <p className="text-2xl font-bold text-primary">
                      {(analyticsData.performance_metrics.average_engagement_rate * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-center text-muted-foreground">Connect a channel to see detailed analytics</p>
            </div>
          )}
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          {predictionsData ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Optimal Publishing Times
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {predictionsData.optimal_publish_times.map((prediction, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{prediction.day} at {prediction.time}</h4>
                          <p className="text-sm text-muted-foreground">
                            Confidence: {(prediction.confidence * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-primary">
                            {prediction.predicted_views.toLocaleString()} views
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Content Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {predictionsData.content_recommendations.map((rec, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{rec.category}</h4>
                          <p className="text-sm text-muted-foreground">
                            Duration: {rec.suggested_duration}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-primary">
                            {(rec.predicted_engagement * 100).toFixed(1)}% engagement
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-12">
              <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-center text-muted-foreground">Connect a channel to get AI predictions</p>
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {/* Auth Debug Component */}
          <AuthDebugTest />
          
          {/* YouTube API Test Component */}
          <YouTubeAPITest />
          
          {/* YouTube Connection Debug Component */}
          <YouTubeConnectionTest />
          
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Auto-refresh data</h4>
                  <p className="text-sm text-muted-foreground">Automatically refresh dashboard data every 5 minutes</p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Export data</h4>
                  <p className="text-sm text-muted-foreground">Download your analytics data as CSV</p>
                </div>
                <Button variant="outline" size="sm">Export</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Clear cache</h4>
                  <p className="text-sm text-muted-foreground">Clear all cached analytics data</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    storageService.clearCachedAnalytics();
                    toast({ title: "Cache cleared", description: "All cached data has been cleared." });
                  }}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default DashboardNew;
