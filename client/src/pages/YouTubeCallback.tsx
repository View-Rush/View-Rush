import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { youtubeService } from '@/services/youtubeService';
import { toast } from '@/hooks/use-toast';

export default function YouTubeCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing YouTube connection...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const state = searchParams.get('state');

        console.log('YouTube callback started:', { code: !!code, error, state });

        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        console.log('Processing YouTube OAuth callback with code:', code.substring(0, 10) + '...');
        setMessage('Connecting to YouTube...');

        const success = await youtubeService.handleOAuthCallback(code, state || '');
        console.log('OAuth callback result:', success);

        if (success) {
          setStatus('success');
          setMessage('Successfully connected to YouTube!');
          
          toast({
            title: "YouTube Connected",
            description: "Your YouTube channel has been successfully connected.",
          });

          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          throw new Error('Failed to complete YouTube connection');
        }
      } catch (error) {
        console.error('YouTube callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Failed to connect YouTube account');
        
        toast({
          title: "Connection Failed",
          description: "Failed to connect your YouTube account. Please try again.",
          variant: "destructive",
        });

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-semibold mb-2">Connecting YouTube</h2>
              <p className="text-muted-foreground">{message}</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h2 className="text-xl font-semibold mb-2 text-green-700">Success!</h2>
              <p className="text-muted-foreground">{message}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Redirecting to dashboard...
              </p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-semibold mb-2 text-red-700">Connection Failed</h2>
              <p className="text-muted-foreground">{message}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Redirecting to dashboard...
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
