import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const APIKeyDebugger = () => {
  const [apiTest, setApiTest] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [apiResult, setApiResult] = useState<string>('');

  const testDirectAPI = async () => {
    setApiTest('testing');
    try {
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      console.log('API Key from env:', apiKey ? `${apiKey.slice(0, 10)}...` : 'MISSING');
      
      if (!apiKey) {
        throw new Error('API key not found in environment variables');
      }

      const url = new URL('https://www.googleapis.com/youtube/v3/videos');
      url.searchParams.append('part', 'snippet,statistics');
      url.searchParams.append('chart', 'mostPopular');
      url.searchParams.append('regionCode', 'US');
      url.searchParams.append('maxResults', '3');
      url.searchParams.append('key', apiKey);

      console.log('Making API request...');
      const response = await fetch(url.toString());
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('API Success:', data);
      
      setApiResult(`Success! Found ${data.items?.length} videos. First: "${data.items?.[0]?.snippet?.title}"`);
      setApiTest('success');
    } catch (error) {
      console.error('API Test Error:', error);
      setApiResult(error instanceof Error ? error.message : 'Unknown error');
      setApiTest('error');
    }
  };

  useEffect(() => {
    // Log all environment variables that start with VITE_
    console.log('Environment variables:');
    Object.keys(import.meta.env).forEach(key => {
      if (key.startsWith('VITE_')) {
        const value = import.meta.env[key];
        if (key.includes('KEY') || key.includes('SECRET')) {
          console.log(`${key}: ${value ? `${value.slice(0, 10)}...` : 'NOT SET'}`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }
    });
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-sm text-blue-800">YouTube API Direct Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">API Key Status:</span>
          <Badge variant={import.meta.env.VITE_YOUTUBE_API_KEY ? 'default' : 'destructive'}>
            {import.meta.env.VITE_YOUTUBE_API_KEY ? 'Loaded' : 'Missing'}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm">Direct API Test:</span>
          <Badge variant={
            apiTest === 'success' ? 'default' : 
            apiTest === 'error' ? 'destructive' :
            apiTest === 'testing' ? 'secondary' : 'outline'
          }>
            {apiTest === 'testing' ? 'Testing...' : 
             apiTest === 'success' ? 'Success' :
             apiTest === 'error' ? 'Failed' : 'Not Tested'}
          </Badge>
        </div>

        <Button 
          onClick={testDirectAPI} 
          disabled={apiTest === 'testing'}
          size="sm"
          className="w-full"
        >
          {apiTest === 'testing' ? 'Testing...' : 'Test YouTube API'}
        </Button>

        {apiResult && (
          <div className={`text-xs p-2 rounded ${apiTest === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {apiResult}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
