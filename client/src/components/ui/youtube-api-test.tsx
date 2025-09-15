import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { youtubeService } from '@/services/youtubeService';
import { toast } from '@/hooks/use-toast';
import { Youtube, TrendingUp, PlayCircle } from 'lucide-react';

export const YouTubeAPITest = () => {
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState<any[]>([]);
  const [apiKeyTest, setApiKeyTest] = useState<'idle' | 'success' | 'error'>('idle');

  const testTrendingAPI = async () => {
    setLoading(true);
    try {
      console.log('Testing YouTube Data API...');
      const videos = await youtubeService.getTrendingVideos('US');
      console.log('Trending videos received:', videos.length);
      setTrending(videos.slice(0, 3)); // Show first 3
      setApiKeyTest('success');
      toast({
        title: "API Test Successful",
        description: `Loaded ${videos.length} trending videos`,
      });
    } catch (error) {
      console.error('Trending API test failed:', error);
      setApiKeyTest('error');
      toast({
        title: "API Test Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testYouTubeConnection = () => {
    try {
      console.log('Initiating YouTube OAuth...');
      youtubeService.connectAccount();
    } catch (error) {
      console.error('OAuth initiation failed:', error);
      toast({
        title: "OAuth Failed",
        description: error instanceof Error ? error.message : 'Failed to start OAuth',
        variant: "destructive",
      });
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="h-5 w-5 text-red-500" />
          YouTube API Test Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API Key Test */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium">Trending Videos API</span>
            <Badge variant={
              apiKeyTest === 'success' ? 'default' : 
              apiKeyTest === 'error' ? 'destructive' : 'secondary'
            }>
              {apiKeyTest === 'success' ? 'Working' : 
               apiKeyTest === 'error' ? 'Failed' : 'Not Tested'}
            </Badge>
          </div>
          <Button 
            onClick={testTrendingAPI} 
            disabled={loading}
            size="sm"
            variant="outline"
          >
            {loading ? 'Testing...' : 'Test API'}
          </Button>
        </div>

        {/* OAuth Test */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4" />
            <span className="font-medium">YouTube OAuth Connection</span>
          </div>
          <Button 
            onClick={testYouTubeConnection}
            size="sm"
            variant="outline"
          >
            Connect Channel
          </Button>
        </div>

        {/* Sample Trending Videos */}
        {trending.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Sample Trending Videos:</h4>
            {trending.map((video, index) => (
              <div key={video.id} className="p-2 bg-muted rounded text-xs">
                <div className="font-medium truncate">{video.title}</div>
                <div className="text-muted-foreground">
                  {video.channelTitle} • {Number(video.viewCount).toLocaleString()} views
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Environment Check */}
        <div className="pt-3 border-t text-xs text-muted-foreground space-y-1">
          <div>API Key: {import.meta.env.VITE_YOUTUBE_API_KEY ? '✓ Set' : '✗ Missing'}</div>
          <div>Client ID: {import.meta.env.VITE_YOUTUBE_CLIENT_ID ? '✓ Set' : '✗ Missing'}</div>
          <div>Redirect URI: {import.meta.env.VITE_YOUTUBE_REDIRECT_URI}</div>
        </div>
      </CardContent>
    </Card>
  );
};
