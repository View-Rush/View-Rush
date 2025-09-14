import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Users, 
  PlayCircle, 
  Eye, 
  ThumbsUp, 
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Clock,
  Star
} from "lucide-react";

const Dashboard = () => {
  // Mock data for demonstration
  const stats = [
    {
      title: "Total Views",
      value: "2.4M",
      change: "+12.5%",
      trend: "up",
      icon: Eye,
      color: "text-primary"
    },
    {
      title: "Subscribers",
      value: "45.2K",
      change: "+8.2%",
      trend: "up",
      icon: Users,
      color: "text-success"
    },
    {
      title: "Watch Time",
      value: "156K hrs",
      change: "+15.3%",
      trend: "up",
      icon: Clock,
      color: "text-info"
    },
    {
      title: "Engagement",
      value: "94.7%",
      change: "-2.1%",
      trend: "down",
      icon: ThumbsUp,
      color: "text-warning"
    }
  ];

  const topVideos = [
    {
      title: "YouTube Growth Secrets That Actually Work in 2024",
      views: "458K",
      likes: "12.3K",
      comments: "842",
      publishedAt: "2 days ago",
      thumbnail: "https://via.placeholder.com/120x68/ff0000/ffffff?text=Video+1"
    },
    {
      title: "The Ultimate Guide to YouTube Analytics",
      views: "324K",
      likes: "8.9K",
      comments: "567",
      publishedAt: "5 days ago",
      thumbnail: "https://via.placeholder.com/120x68/ff0000/ffffff?text=Video+2"
    },
    {
      title: "How I Gained 100K Subscribers in 30 Days",
      views: "712K",
      likes: "19.2K",
      comments: "1.2K",
      publishedAt: "1 week ago",
      thumbnail: "https://via.placeholder.com/120x68/ff0000/ffffff?text=Video+3"
    }
  ];

  const trendingCountries = [
    { country: "United States", flag: "🇺🇸", growth: "+23%", rank: 1 },
    { country: "United Kingdom", flag: "🇬🇧", growth: "+18%", rank: 2 },
    { country: "Canada", flag: "🇨🇦", growth: "+15%", rank: 3 },
    { country: "Australia", flag: "🇦🇺", growth: "+12%", rank: 4 },
    { country: "Germany", flag: "🇩🇪", growth: "+9%", rank: 5 }
  ];

  return (
    <div className="min-h-screen bg-gradient-card">
      {/* Header */}
      <div className="bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Welcome back! Here's what's happening with your channel.
              </p>
            </div>
            <Button variant="hero">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Full Analytics
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6 bg-background/60 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="h-4 w-4 text-success mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-destructive mr-1" />
                    )}
                    <span className={`text-sm font-medium ${
                      stat.trend === "up" ? "text-success" : "text-destructive"
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-gradient-primary/10">
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Performing Videos */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-background/60 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Top Performing Videos</h2>
                <Badge variant="secondary">
                  <PlayCircle className="h-3 w-3 mr-1" />
                  Last 30 days
                </Badge>
              </div>
              <div className="space-y-4">
                {topVideos.map((video, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                    <img 
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-20 h-11 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{video.title}</h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {video.views}
                        </span>
                        <span className="flex items-center">
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          {video.likes}
                        </span>
                        <span className="flex items-center">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {video.comments}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{video.publishedAt}</div>
                      <Badge variant="outline" className="mt-1">
                        <Star className="h-3 w-3 mr-1" />
                        Trending
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Trending Countries */}
          <div>
            <Card className="p-6 bg-background/60 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Trending Countries</h2>
                <Globe className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-4">
                {trendingCountries.map((country, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{country.flag}</span>
                      <div>
                        <div className="font-medium">{country.country}</div>
                        <div className="text-sm text-muted-foreground">Rank #{country.rank}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-success">{country.growth}</div>
                      <div className="text-xs text-muted-foreground">growth</div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Countries
              </Button>
            </Card>
          </div>
        </div>

        {/* AI Recommendations */}
        <Card className="mt-8 p-6 bg-gradient-primary/5 border-primary/20 backdrop-blur-sm">
          <div className="flex items-start space-x-4">
            <div className="p-3 rounded-lg bg-gradient-primary">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">AI Optimization Recommendations</h3>
              <p className="text-muted-foreground mb-4">
                Based on your channel's performance and current trends, here are our top recommendations:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-background/60 rounded-lg">
                  <h4 className="font-medium mb-1">Optimal Upload Time</h4>
                  <p className="text-sm text-muted-foreground">Tuesday at 2:00 PM EST for maximum engagement</p>
                </div>
                <div className="p-4 bg-background/60 rounded-lg">
                  <h4 className="font-medium mb-1">Trending Topic</h4>
                  <p className="text-sm text-muted-foreground">"AI productivity tools" is trending in your niche</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;