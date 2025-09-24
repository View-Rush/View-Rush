import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { youtubeService } from '@/services/youtubeService';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle, Info, RefreshCw } from 'lucide-react';

export function YouTubeDebugPanel() {
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runDiagnostics = async () => {
    setIsChecking(true);
    const diagnostics: any = {
      environment: {},
      database: {},
      connections: {},
      timestamp: new Date().toISOString()
    };

    try {
      // Check environment variables
      diagnostics.environment = {
        hasClientId: !!import.meta.env.VITE_YOUTUBE_CLIENT_ID,
        hasClientSecret: !!import.meta.env.VITE_YOUTUBE_CLIENT_SECRET,
        hasApiKey: !!import.meta.env.VITE_YOUTUBE_API_KEY,
        redirectUri: import.meta.env.VITE_YOUTUBE_REDIRECT_URI,
        currentUrl: window.location.origin
      };

      // Check user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      diagnostics.auth = {
        isAuthenticated: !!user,
        userId: user?.id,
        error: authError?.message
      };

      // Check database function
      try {
        await supabase.rpc('update_channel_analytics', {
          connection_uuid: '00000000-0000-0000-0000-000000000000',
          analytics_data: {}
        });
        diagnostics.database.hasAnalyticsFunction = true;
      } catch (error: any) {
        diagnostics.database.hasAnalyticsFunction = false;
        diagnostics.database.functionError = error.message;
      }

      // Check existing connections
      if (user) {
        const { data: connections, error } = await supabase
          .from('channel_connections')
          .select('*')
          .eq('user_id', user.id)
          .eq('platform', 'youtube');
        
        diagnostics.connections = {
          count: connections?.length || 0,
          connections: connections?.map(c => ({
            id: c.id,
            channel_name: c.channel_name,
            sync_status: c.sync_status,
            last_sync_at: c.last_sync_at,
            error_message: c.error_message
          })),
          error: error?.message
        };
      }

      // Check YouTube service status
      try {
        const status = await youtubeService.getConnectionStatus();
        diagnostics.youtubeService = {
          isConnected: status.isConnected,
          hasConnection: !!status.connection
        };
      } catch (error: any) {
        diagnostics.youtubeService = {
          error: error.message
        };
      }

    } catch (error: any) {
      diagnostics.error = error.message;
    }

    setResults(diagnostics);
    setIsChecking(false);
  };

  const getStatusIcon = (status: boolean | undefined) => {
    if (status === true) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === false) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    return <Info className="h-4 w-4 text-gray-500" />;
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          YouTube Connection Diagnostics
          <Button
            onClick={runDiagnostics}
            disabled={isChecking}
            size="sm"
            variant="outline"
          >
            {isChecking ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Run Diagnostics
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!results && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Click "Run Diagnostics" to check your YouTube integration setup.
            </AlertDescription>
          </Alert>
        )}

        {results && (
          <div className="space-y-4">
            {/* Environment Check */}
            <div>
              <h3 className="font-semibold mb-2">Environment Variables</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.environment.hasClientId)}
                  <span>YouTube Client ID</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.environment.hasClientSecret)}
                  <span>YouTube Client Secret</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.environment.hasApiKey)}
                  <span>YouTube API Key</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(!!results.environment.redirectUri)}
                  <span>Redirect URI: {results.environment.redirectUri}</span>
                </div>
              </div>
            </div>

            {/* Database Check */}
            <div>
              <h3 className="font-semibold mb-2">Database Functions</h3>
              <div className="flex items-center gap-2 text-sm">
                {getStatusIcon(results.database.hasAnalyticsFunction)}
                <span>update_channel_analytics function</span>
                {results.database.functionError && (
                  <Badge variant="destructive">
                    {results.database.functionError}
                  </Badge>
                )}
              </div>
            </div>

            {/* Connections Check */}
            <div>
              <h3 className="font-semibold mb-2">Current Connections</h3>
              <div className="text-sm">
                <p>Count: {results.connections.count}</p>
                {results.connections.connections?.map((conn: any) => (
                  <div key={conn.id} className="p-2 border rounded mt-2">
                    <p><strong>{conn.channel_name}</strong></p>
                    <p>Status: <Badge variant={conn.sync_status === 'completed' ? 'default' : 'destructive'}>
                      {conn.sync_status}
                    </Badge></p>
                    {conn.error_message && (
                      <p className="text-red-600 text-xs">Error: {conn.error_message}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Raw Data */}
            <details className="text-xs">
              <summary className="cursor-pointer">View Raw Diagnostics</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-96">
                {JSON.stringify(results, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}