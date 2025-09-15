import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Youtube, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { youtubeService, YouTubeConnectionStatus } from '@/services/youtubeService';
import { toast } from '@/hooks/use-toast';

interface YouTubeConnectStepProps {
  onComplete: (connected: boolean) => void;
  onSkip: () => void;
  onBack?: () => void;
  isVisible: boolean;
}

export function YouTubeConnectStep({ onComplete, onSkip, onBack, isVisible }: YouTubeConnectStepProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<YouTubeConnectionStatus | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  if (!isVisible) return null;

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      await youtubeService.connectAccount();
      // The page will redirect to YouTube OAuth, so we don't need to handle the response here
    } catch (error) {
      console.error('Failed to start YouTube connection:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to start YouTube connection. Please try again.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const checkStatus = async () => {
    try {
      setIsCheckingStatus(true);
      const status = await youtubeService.getConnectionStatus();
      setConnectionStatus(status);
      
      if (status.isConnected) {
        toast({
          title: "YouTube Connected!",
          description: `Successfully connected to ${status.connection?.channel_name}`,
          variant: "default",
        });
        onComplete(true);
      } else {
        toast({
          title: "Not Connected",
          description: "No YouTube channel is currently connected.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Failed to check YouTube connection status:', error);
      toast({
        title: "Check Failed",
        description: "Failed to check connection status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleSkip = () => {
    onComplete(false);
    onSkip();
  };

  return (
    <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-6">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Youtube className="h-8 w-8 text-red-600" />
          <CardTitle className="text-2xl text-center bg-gradient-primary bg-clip-text text-transparent">
            Connect YouTube
          </CardTitle>
        </div>
        <CardDescription className="text-center text-muted-foreground">
          Connect your YouTube channel to unlock powerful analytics and insights
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            This step is optional. You can skip for now and connect your YouTube channel later from your dashboard.
          </AlertDescription>
        </Alert>

        {connectionStatus && (
          <Alert className={connectionStatus.isConnected ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
            {connectionStatus.isConnected ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            )}
            <AlertDescription className={connectionStatus.isConnected ? "text-green-800" : "text-yellow-800"}>
              {connectionStatus.isConnected 
                ? `Connected to ${connectionStatus.connection?.channel_name}`
                : "No YouTube channel connected"
              }
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <h4 className="font-medium mb-2">What you'll get:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Real-time analytics for your YouTube channel</li>
              <li>Subscriber growth tracking</li>
              <li>Video performance insights</li>
              <li>Revenue and engagement metrics</li>
            </ul>
          </div>

          <div className="flex flex-col space-y-3">
            <Button 
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {isConnecting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Connecting...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Youtube className="h-4 w-4" />
                  <span>Connect YouTube Channel</span>
                </div>
              )}
            </Button>

            <Button 
              onClick={checkStatus}
              disabled={isCheckingStatus}
              variant="outline"
              className="w-full"
            >
              {isCheckingStatus ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  <span>Checking...</span>
                </div>
              ) : (
                "Check Connection Status"
              )}
            </Button>

            <Button 
              onClick={handleSkip}
              variant="ghost"
              className="w-full"
            >
              Skip for now
            </Button>

            {onBack && (
              <Button 
                onClick={onBack}
                variant="outline"
                className="w-full"
              >
                Back to Account Details
              </Button>
            )}
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          <p>
            By connecting your YouTube channel, you agree to YouTube's Terms of Service 
            and grant View Rush access to your channel analytics data.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
