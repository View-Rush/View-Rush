import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Youtube } from 'lucide-react';

interface ConnectChannelButtonProps {
  onConnect: () => void;
  loading?: boolean;
  variant?: 'card' | 'button';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ConnectChannelButton({ 
  onConnect, 
  loading = false, 
  variant = 'button',
  size = 'md',
  className = ''
}: ConnectChannelButtonProps) {
  const buttonSizes = {
    sm: 'sm',
    md: 'default',
    lg: 'lg'
  } as const;

  if (variant === 'card') {
    return (
      <Card className={className}>
        <CardContent className="text-center py-12">
          <Youtube className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Connect Your First Channel</h3>
          <p className="text-muted-foreground mb-6">
            Connect your YouTube channel to start tracking your analytics and get insights
          </p>
          <Button 
            onClick={() => {
              console.log('🔘 Connect button clicked (card variant)');
              onConnect();
            }} 
            size={buttonSizes[size]} 
            disabled={loading}
          >
            <Plus className="h-5 w-5 mr-2" />
            {loading ? 'Connecting...' : 'Connect YouTube Channel'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Button 
      onClick={() => {
        console.log('🔘 Connect button clicked (button variant)');
        onConnect();
      }} 
      size={buttonSizes[size]}
      disabled={loading}
      className={className}
    >
      <Plus className="h-4 w-4 mr-2" />
      {loading ? 'Connecting...' : 'Connect Channel'}
    </Button>
  );
}
