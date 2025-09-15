import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { youtubeService } from '@/services/youtubeService';
import type { Database } from '@/integrations/supabase/types';

type ChannelConnection = Database['public']['Tables']['channel_connections']['Row'];

export function useChannelConnections() {
  const [connections, setConnections] = useState<ChannelConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const userConnections = await youtubeService.getUserConnections();
      setConnections(userConnections);
    } catch (error) {
      console.error('Error loading connections:', error);
      toast({
        title: "Error",
        description: "Failed to load channel connections.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const connectChannel = async () => {
    try {
      setConnecting(true);
      await youtubeService.connectAccount();
    } catch (error) {
      console.error('YouTube connection error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect YouTube channel. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  const disconnectChannel = async (connectionId: string) => {
    try {
      await youtubeService.disconnectAccount(connectionId);
      await loadConnections();
      toast({
        title: "Channel Disconnected",
        description: "YouTube channel has been disconnected successfully.",
      });
    } catch (error) {
      console.error('Error disconnecting channel:', error);
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect channel. Please try again.",
        variant: "destructive",
      });
    }
  };

  const refreshConnection = async (connectionId: string) => {
    try {
      await youtubeService.syncChannelAnalytics();
      await loadConnections();
      toast({
        title: "Data Refreshed",
        description: "Channel data has been refreshed successfully.",
      });
    } catch (error) {
      console.error('Error refreshing connection:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh channel data.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadConnections();
  }, []);

  return {
    connections,
    loading,
    connecting,
    loadConnections,
    connectChannel,
    disconnectChannel,
    refreshConnection
  };
}
