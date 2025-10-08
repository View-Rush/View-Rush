import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Users, 
  PlayCircle, 
  Clock, 
  Calendar,
  Settings,
  RefreshCw,
  BarChart3,
  Target,
  Lightbulb,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ChannelConnectionsList } from '@/components/ui/channel-connections-list';
import Header from '@/components/layout/Header';
import { useDashboard } from '@/contexts/DashboardContext';
import { YouTubeHeatmap } from '@/components/ui/YouTubeHeatmap';

const Dashboard = () => {

  const { user, loading: authLoading, signOut } = useAuth();
  const [selectedTab, setSelectedTab] = useState('overview');

  // Use dashboard context for all data management
  const {
    analyticsData,
    loading,
    hasConnections,
    channelConnections,
    connectionsLoading,
    connecting,
    refreshData,
    connectChannel,
    disconnectChannel: handleDisconnectChannel,
    refreshConnections,
  } = useDashboard();

  // Dummy predictionsData for development
  const predictionsData = {
    optimal_publish_times: [
      { day: 'Monday', time: '18:00', confidence: 0.92, predicted_views: 12000 },
      { day: 'Wednesday', time: '20:00', confidence: 0.88, predicted_views: 9500 },
      { day: 'Friday', time: '19:00', confidence: 0.85, predicted_views: 11000 },
    ],
    content_recommendations: [
      { category: 'Tech Reviews', suggested_duration: '8-12 min', predicted_engagement: 0.76 },
      { category: 'Tutorials', suggested_duration: '10-15 min', predicted_engagement: 0.82 },
      { category: 'Vlogs', suggested_duration: '6-10 min', predicted_engagement: 0.68 },
    ],
    heatmap: Array.from({ length: 7 }, (_, d) =>
      Array.from({ length: 24 }, (_, h) => {
        // Simulate higher scores in evenings
        const peak = Math.exp(-Math.pow((h-20)/4,2));
        const base = 0.05 + 0.4*Math.random();
        return Math.min(1, Math.max(0, base + peak* (0.4 + 0.3*Math.random())));
      })
    ),
  };

  const handleRefreshData = async () => {
    if (!hasConnections) {
      toast({
        title: "No connections",
        description: "Connect a YouTube channel first to refresh data.",
        variant: "destructive",
      });
      return;
    }
    
    await refreshData();
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
        onRefresh={refreshConnections}
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
              {/* Optimal Publishing Times Card */}
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

              {/* Content Recommendations Card */}
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

              {/* Heatmap Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Publish-Time Heatmap
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Visualize optimal times to publish for maximum engagement.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="py-2">
                    {predictionsData.heatmap ? (
                      <YouTubeHeatmap heatmapData={predictionsData.heatmap} />
                    ) : (
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                        No heatmap data available.
                      </div>
                    )}
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
      </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
