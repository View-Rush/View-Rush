import { useState, useEffect } from "react";
import { Card, CardContent} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  Search, 
  Eye, 
  ThumbsUp, 
  MessageSquare,
  Clock,
  ExternalLink,
  RefreshCw,
  PlayCircle,
  Youtube
} from "lucide-react";
import { toast } from '@/hooks/use-toast';
import { youtubeService } from '@/services/youtube';
import Header from "@/components/layout/Header";

interface TrendingVideo {
  id: string;
  title: string;
  channelTitle: string;
  viewCount?: string; 
  likeCount?: string; 
  commentCount?: string;
  duration?: string; 
  publishedAt: string;
  thumbnails: {
    high: {
      url: string;
    };
  };
  categoryId?: string; 
}

const Trending = () => {
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [selectedCategory, setSelectedCategory] = useState("0");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trendingVideos, setTrendingVideos] = useState<TrendingVideo[]>([]);

  const countries = [
    { name: "United States", flag: "🇺🇸", code: "US" },
    { name: "United Kingdom", flag: "🇬🇧", code: "GB" },
    { name: "Canada", flag: "🇨🇦", code: "CA" },
    { name: "Australia", flag: "🇦🇺", code: "AU" },
    { name: "Germany", flag: "🇩🇪", code: "DE" },
    { name: "France", flag: "🇫🇷", code: "FR" },
    { name: "Japan", flag: "🇯🇵", code: "JP" },
    { name: "Brazil", flag: "🇧🇷", code: "BR" },
    { name: "India", flag: "🇮🇳", code: "IN" },
    { name: "South Korea", flag: "🇰🇷", code: "KR" },
    { name: "Sri Lanka", flag: "🇱🇰", code: "LK" }
  ];

  const categories = [
    { id: "0", name: "All" },
    { id: "1", name: "Film & Animation" },
    { id: "2", name: "Autos & Vehicles" },
    { id: "10", name: "Music" },
    { id: "15", name: "Pets & Animals" },
    { id: "17", name: "Sports" },
    { id: "19", name: "Travel & Events" },
    { id: "20", name: "Gaming" },
    { id: "22", name: "People & Blogs" },
    { id: "23", name: "Comedy" },
    { id: "24", name: "Entertainment" },
    { id: "25", name: "News & Politics" },
    { id: "26", name: "Howto & Style" },
    { id: "27", name: "Education" },
    { id: "28", name: "Science & Technology" }
  ];

  useEffect(() => {
    loadTrendingVideos();
  }, [selectedCountry, selectedCategory]);

  const loadTrendingVideos = async () => {
    try {
      setLoading(true);
      console.log('Loading trending videos...', { country: selectedCountry, category: selectedCategory });
      
      // Check if API key is configured
      if (!import.meta.env.VITE_YOUTUBE_API_KEY) {
        throw new Error('YouTube API key not configured');
      }
      
      const videos = await youtubeService.getTrendingVideos(
        selectedCountry,
        selectedCategory === "0" ? undefined : selectedCategory
      );
      
      console.log('Trending videos loaded:', videos.length);
      setTrendingVideos(videos);
      
      if (videos.length === 0) {
        toast({
          title: "No Videos Found",
          description: "No trending videos found for the selected filters.",
        });
      }
    } catch (error) {
      console.error('Error loading trending videos:', error);
      
      let errorMessage = "Failed to load trending videos. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadTrendingVideos();
      toast({
        title: "Success",
        description: "Trending videos refreshed successfully.",
      });
    } catch (error) {
      console.error('Error refreshing videos:', error);
      toast({
        title: "Error",
        description: "Failed to refresh trending videos.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const formatNumber = (num: string | undefined) => {
    if (!num) return '0';
    const number = parseInt(num);
    if (isNaN(number)) return '0';
    if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + 'M';
    } else if (number >= 1000) {
      return (number / 1000).toFixed(1) + 'K';
    }
    return number.toString();
  };

  const formatDuration = (duration?: string) => {
    // Handle undefined or null duration
    if (!duration) return '0:00';
    
    // Convert ISO 8601 duration to readable format
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (publishedAt: string) => {
    const now = new Date();
    const published = new Date(publishedAt);
    const diffInHours = Math.floor((now.getTime() - published.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} months ago`;
  };

  const filteredVideos = trendingVideos.filter(video =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.channelTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'General';
    return categories.find(cat => cat.id === categoryId)?.name || 'Unknown';
  };

  if (loading && trendingVideos.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="h-8 w-8" />
              Trending Videos
            </h1>
            <p className="text-muted-foreground">
              Discover what's trending on YouTube right now
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Country Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Country</label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        <span className="flex items-center gap-2">
                          {country.flag} {country.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <div className="space-y-2 flex-1">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search trending videos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Video List */}
        {filteredVideos.length === 0 && !loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <Youtube className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Videos Found</h3>
              <p className="text-muted-foreground">
                No trending videos match your current filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredVideos.map((video, index) => (
              <Card key={video.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Rank */}
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-muted-foreground w-8">
                        #{index + 1}
                      </span>
                    </div>

                    {/* Thumbnail */}
                    <div className="relative">
                      <img
                        src={video.thumbnails.high.url}
                        alt={video.title}
                        className="w-48 h-28 object-cover rounded-lg"
                      />
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        {formatDuration(video.duration)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-lg line-clamp-2 pr-4">
                          {video.title}
                        </h3>
                        <Badge variant="secondary">
                          {getCategoryName(video.categoryId)}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground font-medium">
                        {video.channelTitle}
                      </p>

                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {formatNumber(video.viewCount)} views
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          {formatNumber(video.likeCount)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {formatNumber(video.commentCount)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatTimeAgo(video.publishedAt)}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://youtube.com/watch?v=${video.id}`, '_blank')}
                        >
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Watch
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://youtube.com/watch?v=${video.id}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open in YouTube
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Trending;
