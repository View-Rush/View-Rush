import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function YouTubePopupCallback() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const state = searchParams.get('state');

        if (error) {
          // Send error to parent window
          window.opener?.postMessage({
            type: 'OAUTH_ERROR',
            error: error,
            errorDescription: searchParams.get('error_description')
          }, window.location.origin);
          
          window.close();
          return;
        }

        if (!code || !state) {
          // Send error to parent window
          window.opener?.postMessage({
            type: 'OAUTH_ERROR',
            error: 'invalid_response',
            errorDescription: 'Missing authorization code or state parameter'
          }, window.location.origin);
          
          window.close();
          return;
        }

        // Send success to parent window
        window.opener?.postMessage({
          type: 'OAUTH_SUCCESS',
          code: code,
          state: state
        }, window.location.origin);

        window.close();
      } catch (error) {
        console.error('Popup callback error:', error);
        
        // Send error to parent window
        window.opener?.postMessage({
          type: 'OAUTH_ERROR',
          error: 'callback_error',
          errorDescription: error instanceof Error ? error.message : 'Unknown callback error'
        }, window.location.origin);
        
        window.close();
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(handleCallback, 100);
    
    return () => clearTimeout(timer);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">Processing...</h2>
          <p className="text-muted-foreground">
            Completing YouTube connection. This window will close automatically.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}