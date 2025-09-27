import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Youtube } from 'lucide-react';
import { ChannelConnectionCard } from './channel-connection-card';
import { ConnectChannelButton } from './connect-channel-button';
import type { Database } from '@/integrations/supabase/types';

type ChannelConnection = Database['public']['Tables']['channel_connections']['Row'];

interface ChannelConnectionsListProps {
  connections: ChannelConnection[];
  onConnect: () => void;
  onDisconnect?: (connectionId: string) => void;
  onRefresh?: (connectionId: string) => void;
  loading?: boolean;
  title?: string;
  showAddButton?: boolean;
  compact?: boolean;
  variant?: 'card' | 'plain';
}

export function ChannelConnectionsList({
  connections,
  onConnect,
  onDisconnect,
  onRefresh,
  loading = false,
  title = "Saved Channels",
  showAddButton = true,
  compact = false,
  variant = 'card'
}: ChannelConnectionsListProps) {
  const content = (
    <>
      {connections.length > 0 ? (
        <div className="space-y-4">
          {showAddButton && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {connections.length} channel{connections.length > 1 ? 's' : ''} saved
              </p>
              <ConnectChannelButton
                onConnect={onConnect}
                loading={loading}
                size="sm"
                variant="button"
              />
            </div>
          )}
          <div className="grid gap-3">
            {connections.map((connection) => (
              <ChannelConnectionCard
                key={connection.id}
                connection={connection}
                onDisconnect={onDisconnect}
                onRefresh={onRefresh}
                compact={compact}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <Youtube className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No channels connected</h3>
          <p className="text-muted-foreground mb-4">
            Connect your YouTube channel to start tracking analytics and get insights
          </p>
          <ConnectChannelButton
            onConnect={onConnect}
            loading={loading}
            variant="button"
          />
        </div>
      )}
    </>
  );

  if (variant === 'plain') {
    return <div className="space-y-4">{content}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="h-5 w-5 text-red-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && connections.length === 0 ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : (
          content
        )}
      </CardContent>
    </Card>
  );
}
