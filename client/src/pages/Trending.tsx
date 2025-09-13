import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  TrendingUp, 
  Globe, 
  Search, 
  Filter, 
  Eye, 
  ThumbsUp, 
  MessageSquare,
  Clock,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import Header from "@/components/layout/Header";

const Trending = () => {
  const [selectedCountry, setSelectedCountry] = useState("United States");
  const [searchQuery, setSearchQuery] = useState("");

  const countries = [
    { name: "United States", flag: "🇺🇸", code: "US" },
    { name: "United Kingdom", flag: "🇬🇧", code: "GB" },
    { name: "Canada", flag: "🇨🇦", code: "CA" },
    { name: "Australia", flag: "🇦🇺", code: "AU" },
    { name: "Germany", flag: "🇩🇪", code: "DE" },
    { name: "France", flag: "🇫🇷", code: "FR" },
    { name: "Japan", flag: "🇯🇵", code: "JP" },
    { name: "Brazil", flag: "🇧🇷", code: "BR" }
  ];

  const categories = [
    "All", "Music", "Gaming", "Entertainment", "News & Politics", 
    "Howto & Style", "Education", "Science & Technology", "Sports"
  ];

  const trendingVideos = [
    {
      rank: 1,
      title: "Breaking: Major Tech Announcement Changes Everything",
      channel: "TechNews Today",
      views: "2.1M",
      likes: "156K",
      comments: "12.3K",
      duration: "12:45",
      publishedAt: "3 hours ago",
      category: "Science & Technology",
      thumbnail: "https://via.placeholder.com/300x168/ff0000/ffffff?text=Tech+News",
      growth: "+45%"
    },
    {
      rank: 2,
      title: "Epic Gaming Moments That Broke the Internet",
      channel: "GameHighlights",
      views: "1.8M",
      likes: "98K",
      comments: "8.7K",
      duration: "15:23",
      publishedAt: "6 hours ago",
      category: "Gaming",
      thumbnail: "https://via.placeholder.com/300x168/ff0000/ffffff?text=Gaming",
      growth: "+38%"
    },
    {
      rank: 3,
      title: "Celebrity Interview Reveals Shocking Truth",
      channel: "Entertainment Weekly",
      views: "1.5M",
      likes: "87K",
      comments: "15.2K",
      duration: "22:10",
      publishedAt: "8 hours ago",
      category: "Entertainment",
      thumbnail: "https://via.placeholder.com/300x168/ff0000/ffffff?text=Celebrity",
      growth: "+42%"
    },
    {
      rank: 4,
      title: "Life-Changing Productivity Hacks Everyone Should Know",
      channel: "ProductivityGuru",
      views: "1.2M",
      likes: "73K",
      comments: "4.5K",
      duration: "18:30",
      publishedAt: "12 hours ago",
      category: "Education",
      thumbnail: "https://via.placeholder.com/300x168/ff0000/ffffff?text=Productivity",
      growth: "+28%"
    },
    {
      rank: 5,
      title: "Incredible Science Discovery You Won't Believe",
      channel: "ScienceFacts",
      views: "980K",
      likes: "62K",
      comments: "3.8K",
      duration: "14:55",
      publishedAt: "1 day ago",
      category: "Science & Technology",
      thumbnail: "https://via.placeholder.com/300x168/ff0000/ffffff?text=Science",
      growth: "+31%"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Content Header */}
      <div className="bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <TrendingUp className="h-8 w-8 mr-3 text-primary" />
                Trending Analysis
              </h1>
              <p className="text-muted-foreground mt-1">
                Real-time trending videos across 113 countries
              </p>
            </div>
            <Button variant="hero">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8">
          <Card className="p-6 bg-background/60 backdrop-blur-sm">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Country Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Country</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <select 
                    className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                  >
                    {countries.map((country) => (
                      <option key={country.code} value={country.name}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search */}
              <div>
                <label className="text-sm font-medium mb-2 block">Search Videos</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search trending videos..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <div className="relative">
                  <Filter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <select className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent">
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Country Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-background/60 backdrop-blur-sm text-center">
            <div className="text-2xl font-bold text-primary">🇺🇸</div>
            <div className="text-2xl font-bold mt-2">2.1M</div>
            <div className="text-sm text-muted-foreground">Total Views</div>
          </Card>
          <Card className="p-6 bg-background/60 backdrop-blur-sm text-center">
            <div className="text-2xl font-bold text-success">↗️</div>
            <div className="text-2xl font-bold mt-2 text-success">+34%</div>
            <div className="text-sm text-muted-foreground">Growth Rate</div>
          </Card>
          <Card className="p-6 bg-background/60 backdrop-blur-sm text-center">
            <div className="text-2xl font-bold text-info">🎥</div>
            <div className="text-2xl font-bold mt-2">47</div>
            <div className="text-sm text-muted-foreground">Trending Videos</div>
          </Card>
          <Card className="p-6 bg-background/60 backdrop-blur-sm text-center">
            <div className="text-2xl font-bold text-warning">⏱️</div>
            <div className="text-2xl font-bold mt-2">14:32</div>
            <div className="text-sm text-muted-foreground">Avg Duration</div>
          </Card>
        </div>

        {/* Trending Videos List */}
        <Card className="p-6 bg-background/60 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Trending Videos in {selectedCountry}</h2>
            <Badge variant="secondary" className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Updated 5 min ago
            </Badge>
          </div>
          
          <div className="space-y-6">
            {trendingVideos.map((video) => (
              <div key={video.rank} className="flex items-start space-x-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                {/* Rank */}
                <div className="flex-shrink-0 w-8 text-center">
                  <div className="text-lg font-bold text-primary">#{video.rank}</div>
                </div>

                {/* Thumbnail */}
                <div className="flex-shrink-0">
                  <img 
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-40 h-24 rounded object-cover"
                  />
                  <div className="text-xs text-center mt-1 text-muted-foreground">
                    {video.duration}
                  </div>
                </div>

                {/* Video Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1 line-clamp-2">{video.title}</h3>
                  <p className="text-muted-foreground mb-2">{video.channel}</p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
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
                    <span>{video.publishedAt}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{video.category}</Badge>
                    <Badge variant="secondary" className="text-success">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {video.growth}
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-8">
            <Button variant="outline">
              Load More Videos
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Trending;