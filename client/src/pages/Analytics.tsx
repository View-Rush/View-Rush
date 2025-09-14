import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  PlayCircle, 
  Clock, 
  Calendar,
  RefreshCw,
  Download,
  Eye,
  ThumbsUp,
  MessageSquare,
  Share2,
  Target
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { storageService } from '@/services/storage';
import Header from '@/components/layout/Header';

interface DetailedAnalytics {
  overview: {
    total_views: number;
    total_subscribers: number;
    total_videos: number;
    average_view_duration: string;
    subscriber_growth: number;
    view_growth: number;
  };
  time_series: Array<{
    date: string;
    views: number;
    subscribers: number;
    watch_time: number;
    engagement_rate: number;
  }>;
  top_videos: Array<{
    id: string;
    title: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    ctr: number;
    retention_rate: number;
    published_at: string;
  }>;
  audience_demographics: {
    age_groups: Array<{ range: string; percentage: number }>;
    gender: { male: number; female: number; other: number };
    top_countries: Array<{ country: string; percentage: number }>;
    device_types: Array<{ device: string; percentage: number }>;
  };
  engagement_metrics: {
    average_view_duration: string;
    click_through_rate: number;
    subscriber_conversion_rate: number;
    comment_rate: number;
    like_rate: number;
    share_rate: number;
  };
  revenue_data: {
    total_revenue: number;
    rpm: number;
    cpm: number;
    revenue_by_source: Array<{ source: string; amount: number }>;
  };
}

const Analytics = () => {
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [analytics, setAnalytics] = useState<DetailedAnalytics | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Check cache first
      const cacheKey = `detailed_analytics_${timeRange}`;
      let cached = storageService.getCachedAnalytics(cacheKey);
      
      if (cached) {
        setAnalytics(cached);
      } else {
        // Mock detailed analytics data
        const mockData: DetailedAnalytics = {
          overview: {
            total_views: 2450000,
            total_subscribers: 12500,
            total_videos: 45,
            average_view_duration: "4:32",
            subscriber_growth: 12.5,
            view_growth: 18.7
          },
          time_series: generateTimeSeries(),
          top_videos: [
            {
              id: "1",
              title: "How to Build a React App in 2025",
              views: 125000,
              likes: 3400,
              comments: 245,
              shares: 156,
              ctr: 8.5,
              retention_rate: 67.8,
              published_at: "2025-08-15T10:00:00Z"
            },
            {
              id: "2", 
              title: "JavaScript Tips and Tricks",
              views: 98000,
              likes: 2800,
              comments: 189,
              shares: 123,
              ctr: 7.2,
              retention_rate: 62.4,
              published_at: "2025-08-22T14:30:00Z"
            },
            {
              id: "3",
              title: "CSS Grid vs Flexbox Explained",
              views: 87000,
              likes: 2200,
              comments: 156,
              shares: 89,
              ctr: 6.8,
              retention_rate: 58.9,
              published_at: "2025-09-01T16:15:00Z"
            }
          ],
          audience_demographics: {
            age_groups: [
              { range: "18-24", percentage: 25 },
              { range: "25-34", percentage: 45 },
              { range: "35-44", percentage: 20 },
              { range: "45-54", percentage: 8 },
              { range: "55+", percentage: 2 }
            ],
            gender: { male: 68, female: 30, other: 2 },
            top_countries: [
              { country: "United States", percentage: 35 },
              { country: "United Kingdom", percentage: 18 },
              { country: "Canada", percentage: 12 },
              { country: "Germany", percentage: 10 },
              { country: "Australia", percentage: 8 }
            ],
            device_types: [
              { device: "Mobile", percentage: 65 },
              { device: "Desktop", percentage: 28 },
              { device: "Tablet", percentage: 7 }
            ]
          },
          engagement_metrics: {
            average_view_duration: "4:32",
            click_through_rate: 7.8,
            subscriber_conversion_rate: 2.3,
            comment_rate: 1.2,
            like_rate: 3.8,
            share_rate: 0.6
          },
          revenue_data: {
            total_revenue: 2340,
            rpm: 1.85,
            cpm: 2.45,
            revenue_by_source: [
              { source: "AdSense", amount: 1850 },
              { source: "Sponsorships", amount: 400 },
              { source: "Merchandise", amount: 90 }
            ]
          }
        };
        
        setAnalytics(mockData);
        storageService.setCachedAnalytics(cacheKey, mockData, 30);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error loading analytics",
        description: "Failed to load analytics data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSeries = () => {
    const data = [];
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 10000) + 5000,
        subscribers: Math.floor(Math.random() * 50) + 10,
        watch_time: Math.floor(Math.random() * 500) + 200,
        engagement_rate: Math.random() * 0.1 + 0.03
      });
    }
    
    return data;
  };

  const handleRefresh = async () => {
    storageService.clearCachedAnalytics();
    await loadAnalytics();
    toast({
      title: "Analytics refreshed",
      description: "Latest analytics data has been loaded.",
    });
  };

  const handleExport = () => {
    if (!analytics) return;
    
    const dataStr = JSON.stringify(analytics, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Analytics exported",
      description: "Analytics data has been exported successfully.",
    });
  };

  if (!analytics) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Analytics</h1>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.total_views.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{analytics.overview.view_growth}%
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.total_subscribers.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{analytics.overview.subscriber_growth}%
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.total_videos}</div>
            <p className="text-xs text-muted-foreground">Published content</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.average_view_duration}</div>
            <p className="text-xs text-muted-foreground">View duration</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="videos">Top Videos</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="mx-auto h-12 w-12 mb-4" />
                  <p>Interactive chart would be displayed here</p>
                  <p className="text-sm">Showing {timeRange} data trend</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Engagement Metrics Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{analytics.engagement_metrics.click_through_rate}%</div>
                  <p className="text-sm text-muted-foreground">Click-through Rate</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{analytics.engagement_metrics.like_rate}%</div>
                  <p className="text-sm text-muted-foreground">Like Rate</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{analytics.engagement_metrics.subscriber_conversion_rate}%</div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Videos Tab */}
        <TabsContent value="videos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Videos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.top_videos.map((video, index) => (
                  <div key={video.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <h4 className="font-medium">{video.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Published: {new Date(video.published_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Eye className="h-3 w-3" />
                          {video.views.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">Views</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {video.likes.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">Likes</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {video.comments}
                        </div>
                        <p className="text-xs text-muted-foreground">Comments</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Target className="h-3 w-3" />
                          {video.ctr}%
                        </div>
                        <p className="text-xs text-muted-foreground">CTR</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Age Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.audience_demographics.age_groups.map((group) => (
                    <div key={group.range} className="flex items-center justify-between">
                      <span className="text-sm">{group.range}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${group.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{group.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Countries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.audience_demographics.top_countries.map((country) => (
                    <div key={country.country} className="flex items-center justify-between">
                      <span className="text-sm">{country.country}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${country.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{country.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.audience_demographics.device_types.map((device) => (
                    <div key={device.device} className="flex items-center justify-between">
                      <span className="text-sm">{device.device}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${device.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{device.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gender Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Male</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${analytics.audience_demographics.gender.male}%` }} />
                      </div>
                      <span className="text-sm font-medium">{analytics.audience_demographics.gender.male}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Female</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-pink-500 rounded-full" style={{ width: `${analytics.audience_demographics.gender.female}%` }} />
                      </div>
                      <span className="text-sm font-medium">{analytics.audience_demographics.gender.female}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Other</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${analytics.audience_demographics.gender.other}%` }} />
                      </div>
                      <span className="text-sm font-medium">{analytics.audience_demographics.gender.other}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Click-through Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{analytics.engagement_metrics.click_through_rate}%</div>
                <p className="text-sm text-muted-foreground">Thumbnail effectiveness</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ThumbsUp className="h-5 w-5" />
                  Like Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{analytics.engagement_metrics.like_rate}%</div>
                <p className="text-sm text-muted-foreground">Audience appreciation</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comment Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{analytics.engagement_metrics.comment_rate}%</div>
                <p className="text-sm text-muted-foreground">Community engagement</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Share Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{analytics.engagement_metrics.share_rate}%</div>
                <p className="text-sm text-muted-foreground">Content virality</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Conversion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{analytics.engagement_metrics.subscriber_conversion_rate}%</div>
                <p className="text-sm text-muted-foreground">Views to subscribers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Avg Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{analytics.engagement_metrics.average_view_duration}</div>
                <p className="text-sm text-muted-foreground">Watch time per view</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">${analytics.revenue_data.total_revenue}</div>
                <p className="text-sm text-muted-foreground">This period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>RPM</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">${analytics.revenue_data.rpm}</div>
                <p className="text-sm text-muted-foreground">Revenue per mille</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>CPM</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">${analytics.revenue_data.cpm}</div>
                <p className="text-sm text-muted-foreground">Cost per mille</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue by Source</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.revenue_data.revenue_by_source.map((source) => (
                  <div key={source.source} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{source.source}</span>
                    <div className="text-right">
                      <div className="font-bold text-green-600">${source.amount}</div>
                      <div className="text-xs text-muted-foreground">
                        {((source.amount / analytics.revenue_data.total_revenue) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default Analytics;
