import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Youtube, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type ChannelConnection = Database['public']['Tables']['channel_connections']['Row'];

interface ChannelConnectionCardProps {
  connection: ChannelConnection;
  onDisconnect?: (connectionId: string) => void;
  onRefresh?: (connectionId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

export function ChannelConnectionCard({ 
  connection, 
  onDisconnect, 
  onRefresh,
  showActions = true,
  compact = false 
}: ChannelConnectionCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getSyncStatusIcon = () => {
    switch (connection.sync_status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'in_progress':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return null;
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 border rounded-lg">
        <Youtube className="h-5 w-5 text-red-500" />
        <div className="flex-1">
          <p className="font-medium text-sm">{connection.channel_name}</p>
          <p className="text-xs text-muted-foreground">
            {connection.is_active ? 'Active' : 'Inactive'}
          </p>
        </div>
        <Badge variant={connection.is_active ? "default" : "secondary"} className="text-xs">
          {connection.platform}
        </Badge>
        {showActions && onDisconnect && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDisconnect(connection.id)}
            className="text-red-600 hover:text-red-700"
          >
            Disconnect
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        <div className="relative">
          {connection.channel_avatar_url ? (
            <img 
              src={connection.channel_avatar_url} 
              alt={connection.channel_name}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <Youtube className="h-5 w-5 text-red-600" />
            </div>
          )}
          {connection.sync_status && (
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full">
              {getSyncStatusIcon()}
            </div>
          )}
        </div>
        <div>
          <p className="font-medium">{connection.channel_name}</p>
          <p className="text-sm text-muted-foreground">
            {connection.platform.charAt(0).toUpperCase() + connection.platform.slice(1)}
            {connection.channel_handle && ` • ${connection.channel_handle}`}
          </p>
          {connection.last_sync_at && (
            <p className="text-xs text-muted-foreground">
              Last synced: {formatDate(connection.last_sync_at)}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={connection.is_active ? "default" : "secondary"}>
          {connection.is_active ? "Connected" : "Disconnected"}
        </Badge>
        {showActions && (
          <div className="flex gap-1">
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRefresh(connection.id)}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            {onDisconnect && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDisconnect(connection.id)}
                className="text-red-600 hover:text-red-700"
              >
                Disconnect
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
