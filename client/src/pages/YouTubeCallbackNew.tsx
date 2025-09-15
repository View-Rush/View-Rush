import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { youtubeService } from '@/services/youtubeService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function YouTubeCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const handleCallback = async () => {
      console.log('YouTube callback initiated...');
      
      // Debug: Log all URL parameters
      const allParams = Object.fromEntries(searchParams.entries());
      console.log('All URL parameters:', allParams);
      setDebugInfo(allParams);

      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        console.error('OAuth error:', error, errorDescription);
        setStatus('error');
        setError(`Authorization failed: ${error} - ${errorDescription || 'Unknown error'}`);
        return;
      }

      if (!code) {
        console.error('Missing authorization code');
        setStatus('error');
        setError('Missing authorization code. Please try connecting again.');
        return;
      }

      if (!state) {
        console.error('Missing state parameter');
        setStatus('error');
        setError('Missing state parameter. Please try connecting again.');
        return;
      }

      try {
        console.log('Processing OAuth callback with code:', code.substring(0, 10) + '...');
        const success = await youtubeService.handleOAuthCallback(code, state);
        
        if (success) {
          console.log('YouTube connection successful!');
          setStatus('success');
          toast({
            title: "Success!",
            description: "YouTube account connected successfully.",
          });
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          console.error('OAuth callback returned false');
          setStatus('error');
          setError('Failed to complete authorization. Please check your connection and try again.');
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        
        toast({
          title: "Connection Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  const handleRetry = () => {
    navigate('/dashboard');
  };

  const handleConnect = () => {
    youtubeService.connectAccount();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-6 w-6 text-green-500" />}
            {status === 'error' && <XCircle className="h-6 w-6 text-red-500" />}
            
            {status === 'loading' && 'Connecting YouTube Account...'}
            {status === 'success' && 'YouTube Connected!'}
            {status === 'error' && 'Connection Failed'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="text-center">
              <p className="text-muted-foreground">
                Please wait while we complete your YouTube connection...
              </p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Your YouTube account has been successfully connected! Redirecting to dashboard...
              </p>
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Go to Dashboard
              </Button>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Error Details:</p>
                    <p className="text-sm text-destructive/80">{error}</p>
                  </div>
                </div>
              </div>
              
              {/* Debug information */}
              {Object.keys(debugInfo).length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground">Debug Info</summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </details>
              )}
              
              <div className="flex gap-2">
                <Button onClick={handleConnect} variant="default" className="flex-1">
                  Try Again
                </Button>
                <Button onClick={handleRetry} variant="outline" className="flex-1">
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
