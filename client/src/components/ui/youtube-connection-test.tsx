import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { youtubeService } from '@/services/youtube';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

export function YouTubeConnectionTest() {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logEntry]);
    console.log(logEntry);
  };

  const testConfiguration = async () => {
    setStatus('testing');
    setLogs([]);
    
    try {
      addLog('Starting YouTube configuration test...');
      
      // Check environment variables
      const clientId = import.meta.env.VITE_YOUTUBE_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_YOUTUBE_CLIENT_SECRET;
      const redirectUri = import.meta.env.VITE_YOUTUBE_REDIRECT_URI;
      
      addLog(`Client ID: ${clientId ? 'Present' : 'Missing'}`);
      addLog(`Client Secret: ${clientSecret ? 'Present' : 'Missing'}`);
      addLog(`Redirect URI: ${redirectUri || 'Using default'}`);
      
      if (!clientId || !clientSecret) {
        throw new Error('Missing YouTube API credentials');
      }
      
      // Check connection status
      addLog('Checking current connection status...');
      const connectionStatus = await youtubeService.getConnectionStatus();
      addLog(`Connection status: ${connectionStatus.isConnected ? 'Connected' : 'Not connected'}`);
      
      if (connectionStatus.connection) {
        addLog(`Connected channel: ${connectionStatus.connection.channel_name}`);
        addLog(`Platform: ${connectionStatus.connection.platform}`);
        addLog(`Active: ${connectionStatus.connection.is_active}`);
      }
      
      // Check localStorage and sessionStorage
      addLog('Checking browser storage...');
      const localStorageKeys = Object.keys(localStorage);
      const sessionStorageKeys = Object.keys(sessionStorage);
      
      addLog(`LocalStorage keys: ${localStorageKeys.length} items`);
      addLog(`SessionStorage keys: ${sessionStorageKeys.length} items`);
      
      // Check for auth-related items
      const authKeys = localStorageKeys.filter(key => 
        key.includes('auth') || key.includes('supabase') || key.startsWith('sb-')
      );
      
      if (authKeys.length > 0) {
        addLog(`Auth-related storage items: ${authKeys.join(', ')}`);
      }
      
      setStatus('success');
      addLog('Configuration test completed successfully');
      
    } catch (error) {
      setStatus('error');
      addLog(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const testOAuthFlow = () => {
    addLog('Initiating OAuth flow...');
    youtubeService.connectAccount();
  };

  const clearStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    addLog('Cleared all browser storage');
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          YouTube Connection Debugging
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testConfiguration} disabled={status === 'testing'}>
            Test Configuration
          </Button>
          <Button onClick={testOAuthFlow} variant="outline">
            Test OAuth Flow
          </Button>
          <Button onClick={clearStorage} variant="destructive">
            Clear Storage
          </Button>
        </div>

        {status !== 'idle' && (
          <Alert>
            {status === 'success' && <CheckCircle className="h-4 w-4" />}
            {status === 'error' && <AlertTriangle className="h-4 w-4" />}
            <AlertDescription>
              Status: <Badge variant={status === 'success' ? 'default' : status === 'error' ? 'destructive' : 'secondary'}>
                {status}
              </Badge>
            </AlertDescription>
          </Alert>
        )}

        {logs.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Debug Logs:</h4>
            <div className="text-sm font-mono space-y-1 max-h-64 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="whitespace-pre-wrap">{log}</div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
