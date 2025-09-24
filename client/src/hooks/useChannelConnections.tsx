import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { youtubeService } from '@/services/youtube';
import type { Database } from '@/integrations/supabase/types';

type ChannelConnection = Database['public']['Tables']['channel_connections']['Row'];

export function useChannelConnections() {
  const [connections, setConnections] = useState<ChannelConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const { user, loading: authLoading } = useAuth();

  const loadConnections = async () => {
    try {
      console.log('🔄 Loading connections...');
      console.log('🔄 Auth state - User:', user?.email, 'Auth loading:', authLoading);
      
      // Don't proceed if auth is still loading or user is not authenticated
      if (authLoading) {
        console.log('⏳ Auth still loading, skipping connection load');
        return;
      }
      
      if (!user) {
        console.log('❌ No authenticated user, clearing connections');
        setConnections([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const userConnections = await youtubeService.getUserConnections();
      console.log('✅ Connections loaded:', userConnections.length);
      setConnections(userConnections);
    } catch (error) {
      console.error('🔥 Error loading connections:', error);
      toast({
        title: "Error",
        description: "Failed to load channel connections.",
        variant: "destructive",
      });
    } finally {
      console.log('🔄 Setting loading to false');
      setLoading(false);
    }
  };

  const connectChannel = async () => {
    try {
      console.log('🔗 Connect channel button clicked');
      setConnecting(true);
      console.log('🔗 Calling youtubeService.connectAccount()');
      await youtubeService.connectAccount();
      console.log('🔗 youtubeService.connectAccount() completed');
    } catch (error) {
      console.error('🔥 YouTube connection error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect YouTube channel. Please try again.",
        variant: "destructive",
      });
    } finally {
      console.log('🔗 Setting connecting to false');
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
    console.log('🔄 useChannelConnections useEffect triggered - User:', user?.email, 'Auth loading:', authLoading);
    loadConnections();
  }, [user, authLoading]); // Depend on user and authLoading state

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
