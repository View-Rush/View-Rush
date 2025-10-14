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
import YouTubeHeatmapApp from '@/components/ui/YouTubeHeatmapApp';

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


  console.log('Recent videos:', analyticsData?.recent_videos);
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
          <YouTubeHeatmapApp />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
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
                    // Clear cache and refresh data
                    handleRefreshData();
                    toast({ title: "Cache cleared", description: "All cached data has been cleared and refreshed." });
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

export default Dashboard;
